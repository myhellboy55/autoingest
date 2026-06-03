import os
import re
import logging


class Scanner:
    MEDIA_EXTENSIONS = (
        # photos
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.raw', '.cr2', '.cr3', '.nef', '.arw', '.dng',
        '.orf', '.rw2', '.pef', '.srw', '.raf',
        # videos
        '.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv', '.m2ts', '.vob',
    )

    def __init__(self, search_path='/'):
        self.search_path = search_path
        self._excluded_mounts = self._compute_excluded_mounts()
        self._last_mounted = []
        self._auto_mount_root = '/mnt/auto_media'

    def _read_mounts(self):
        mounts = []
        with open('/proc/mounts', 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.split()
                if len(parts) >= 2:
                    mounts.append((parts[0], parts[1]))
        return mounts

    def _device_basename(self, devnode):
        if not devnode or not devnode.startswith('/dev/'):
            return None
        name = devnode.rsplit('/', 1)[-1]
        sys_path = f'/sys/class/block/{name}'
        try:
            if os.path.exists(sys_path):
                real = os.path.realpath(sys_path)
                parent = os.path.basename(os.path.dirname(real))
                if parent and parent != name:
                    return parent
        except Exception:
            pass
        m = re.match(r'^(?P<base>.*?)(p?\d+)?$', name)
        return m.group('base') if m else name

    def _parse_mdstat_members(self):
        members = set()
        try:
            with open('/proc/mdstat', 'r', encoding='utf-8') as f:
                for line in f:
                    for t in line.strip().split():
                        m = re.match(r'^([a-zA-Z0-9_-]+?\d+)', t)
                        if m:
                            members.add('/dev/' + m.group(1))
        except FileNotFoundError:
            pass
        return members

    def _compute_excluded_mounts(self):
        logger = logging.getLogger(__name__)
        mounts = self._read_mounts()
        important_devs = {dev for dev, mnt in mounts if mnt in {'/', '/boot'} and dev.startswith('/dev/')}
        md_members = self._parse_mdstat_members()
        excluded_devnames = set()
        for d in list(important_devs) + list(md_members):
            bn = self._device_basename(d)
            if bn:
                excluded_devnames.add(bn)
            if d.startswith('/dev/'):
                excluded_devnames.add(d.rsplit('/', 1)[-1])
        excluded_mounts = set()
        for dev, mnt in mounts:
            if dev.startswith('/dev/'):
                devname = dev.rsplit('/', 1)[-1]
                if devname in excluded_devnames:
                    excluded_mounts.add(mnt)
        try:
            for dev, mnt in mounts:
                if self.search_path == mnt or self.search_path.startswith(mnt.rstrip('/') + '/'):
                    devname = dev.rsplit('/', 1)[-1]
                    if devname in excluded_devnames:
                        excluded_mounts.add(mnt)
        except Exception:
            pass
        result = sorted(excluded_mounts, key=len, reverse=True)
        logger.info("Excluded device basenames: %s", sorted(excluded_devnames))
        logger.info("Excluded mountpoints: %s", result if result else "<none>")
        return result

    def _is_excluded_path(self, path):
        for ex in self._excluded_mounts:
            if path == ex:
                return True
            trimmed = ex.rstrip('/')
            if trimmed and path.startswith(trimmed + '/'):
                return True
        return False

    def _is_removable_device(self, devnode):
        base = self._device_basename(devnode)
        if not base:
            return False
        path = f'/sys/class/block/{base}/removable'
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read().strip() == '1'
        except Exception:
            return False

    def _candidate_mounts(self):
        logger = logging.getLogger(__name__)
        mounts = self._read_mounts()
        candidates = []
        for dev, mnt in mounts:
            if not dev.startswith('/dev/'):
                continue
            if self._is_excluded_path(mnt):
                continue
            devname = dev.rsplit('/', 1)[-1]
            if devname.startswith('loop') or devname.startswith('ram') or mnt.startswith('/boot'):
                continue
            if (self._is_removable_device(dev)
                    or mnt.startswith('/media') or mnt.startswith('/run/media') or mnt.startswith('/mnt')
                    or (dev.startswith('/dev/') and not devname.startswith(('loop', 'ram', 'sr')))):
                candidates.append(mnt)
        result = sorted(set(candidates), key=len, reverse=True)
        logger.info("Candidate mountpoints: %s", result if result else "<none>")
        return result

    def _mount_device(self, devnode):
        import subprocess
        import shlex
        logger = logging.getLogger(__name__)
        devpath = devnode if devnode.startswith('/dev/') else f'/dev/{devnode}'

        def probe_fstype(dev):
            for cmd in [['blkid', '-o', 'value', '-s', 'TYPE', dev], ['lsblk', '-no', 'FSTYPE', dev]]:
                try:
                    r = subprocess.run(cmd, capture_output=True, text=True, check=False)
                    f = r.stdout.strip()
                    if f:
                        return f
                except Exception:
                    pass
            return ''

        fstype = probe_fstype(devpath)
        logger.debug("Probed fstype for %s -> %s", devpath, fstype or "<unknown>")

        try:
            res = subprocess.run(['udisksctl', 'mount', '-b', devpath],
                                 capture_output=True, text=True, check=False)
            logger.debug("udisksctl rc=%s stdout=%s stderr=%s", res.returncode, res.stdout.strip(), res.stderr.strip())
            if res.returncode == 0:
                out = res.stdout + res.stderr
                for part in out.splitlines():
                    if ' at ' in part:
                        tgt = part.split(' at ', 1)[1].rstrip('.').strip()
                        if os.path.ismount(tgt):
                            return tgt
                try:
                    fm = subprocess.run(['findmnt', '-n', '-o', 'TARGET', devpath],
                                        capture_output=True, text=True, check=False)
                    tgt = fm.stdout.strip()
                    if tgt:
                        return tgt
                except Exception:
                    pass
        except FileNotFoundError:
            logger.debug("udisksctl not found")
        except Exception as e:
            logger.debug("udisksctl mount raised: %s", e)

        mroot = self._auto_mount_root
        try:
            os.makedirs(mroot, exist_ok=True)
            target = os.path.join(mroot, os.path.basename(devpath))
            os.makedirs(target, exist_ok=True)
            mount_cmds = []
            if fstype:
                mount_cmds.append(['mount', '-t', fstype, devpath, target])
            mount_cmds += [
                ['mount', '-t', 'exfat', devpath, target],
                ['mount.exfat', devpath, target],
                ['mount.exfat-fuse', devpath, target],
                ['mount', devpath, target],
            ]
            last_err = None
            for cmd in mount_cmds:
                try:
                    logger.debug("Attempting mount: %s", shlex.join(cmd))
                    res = subprocess.run(cmd, capture_output=True, text=True, check=False)
                    if res.returncode == 0 and os.path.ismount(target):
                        return target
                    last_err = (cmd, res.returncode, res.stdout.strip(), res.stderr.strip())
                except FileNotFoundError as e:
                    last_err = (cmd, 'missing', '', str(e))
                except Exception as e:
                    last_err = (cmd, 'exception', '', str(e))
            try:
                os.rmdir(target)
            except Exception:
                pass
            if last_err:
                cmd, rc, out, err = last_err
                logger.debug("All mount attempts failed for %s. last=%s rc=%s out=%s err=%s",
                             devpath, shlex.join(cmd), rc, out, err)
            return None
        except Exception as e:
            logger.debug("Failed to prepare mountpoint for %s: %s", devpath, e)
            return None

    def ensure_mounted_candidates(self):
        import subprocess
        logger = logging.getLogger(__name__)
        mounts = self._read_mounts()
        mounted_points = {mnt for dev, mnt in mounts if dev.startswith('/dev/')}
        self._last_mounted = []
        scan_roots = list(self._candidate_mounts())
        try:
            ls = subprocess.run(['lsblk', '-nr', '-o', 'NAME,TYPE,MOUNTPOINT'],
                                capture_output=True, text=True, check=True)
            for line in ls.stdout.splitlines():
                parts = line.split(None, 3)
                if len(parts) < 2:
                    continue
                name, typ = parts[0], parts[1]
                mp = parts[2].strip() if len(parts) >= 3 else ''
                if typ != 'part' or mp:
                    continue
                if any(name == os.path.basename(ex) or f'/dev/{name}' == ex for ex in self._excluded_mounts):
                    continue
                if name.startswith(('loop', 'ram', 'sr')):
                    continue
                tgt = self._mount_device(f'/dev/{name}')
                if tgt:
                    logger.info("Mounted /dev/%s -> %s", name, tgt)
                    if tgt not in mounted_points:
                        self._last_mounted.append(tgt)
                    scan_roots.append(tgt)
        except Exception:
            pass
        return scan_roots

    def find_media_files(self, scan_roots=None):
        logger = logging.getLogger(__name__)
        extensions = tuple(e.lower() for e in self.MEDIA_EXTENSIONS)
        media_files = []

        if scan_roots is not None:
            search_paths = list(scan_roots)
        elif self.search_path and self.search_path != '/':
            search_paths = [self.search_path]
        else:
            try:
                search_paths = self.ensure_mounted_candidates()
            except Exception:
                search_paths = self._candidate_mounts()

        logger.info("Scanner will walk: %s", ', '.join(search_paths) if search_paths else '<none>')

        for search_root in search_paths:
            try:
                dvd_files = self._scan_dvd_mount(search_root)
                if dvd_files:
                    media_files.extend(dvd_files)
                    logger.info("Collected %d DVD files from %s", len(dvd_files), search_root)
                    continue
                bluray_files = self._scan_bluray_mount(search_root)
                if bluray_files:
                    media_files.extend(bluray_files)
                    logger.info("Collected %d Blu-ray files from %s", len(bluray_files), search_root)
                    continue
            except Exception:
                logger.debug("Optical scan check failed for %s", search_root)

            if not os.path.exists(search_root):
                logger.debug("Search root does not exist: %s", search_root)
                continue

            found_in_root = 0
            for root, dirs, files in os.walk(search_root, topdown=True):
                if self._is_excluded_path(root):
                    continue
                dirs[:] = [d for d in dirs if not self._is_excluded_path(os.path.join(root, d))]
                for file in files:
                    try:
                        if file.lower().endswith(extensions):
                            full = os.path.join(root, file)
                            media_files.append(full)
                            found_in_root += 1
                            logger.debug("Matched: %s", full)
                    except Exception as e:
                        logger.debug("Error checking %s/%s: %s", root, file, e)
            logger.info("Found %d file(s) under %s", found_in_root, search_root)

        logger.info("Total media files found: %d", len(media_files))
        return media_files

    def unmount_mountpoints(self, mountpoints=None):
        import subprocess
        logger = logging.getLogger(__name__)
        to_unmount = list(mountpoints) if mountpoints else list(self._last_mounted)
        succeeded = []
        for mp in to_unmount:
            try:
                src = None
                try:
                    fm = subprocess.run(['findmnt', '-n', '-o', 'SOURCE', '--target', mp],
                                        capture_output=True, text=True, check=False)
                    src = fm.stdout.strip() if fm.returncode == 0 else None
                except Exception:
                    pass
                unmounted = False
                if src and src.startswith('/dev/'):
                    try:
                        r = subprocess.run(['udisksctl', 'unmount', '-b', src],
                                           capture_output=True, text=True, check=False)
                        if r.returncode == 0:
                            unmounted = True
                    except Exception:
                        pass
                if not unmounted:
                    try:
                        r = subprocess.run(['umount', mp], capture_output=True, text=True, check=False)
                        if r.returncode == 0:
                            unmounted = True
                    except Exception:
                        pass
                if unmounted:
                    logger.info("Unmounted %s", mp)
                    succeeded.append(mp)
                    try:
                        if mp.startswith(self._auto_mount_root) and os.path.isdir(mp) and not os.listdir(mp):
                            os.rmdir(mp)
                    except Exception:
                        pass
            except Exception as e:
                logger.debug("Error unmounting %s: %s", mp, e)
        self._last_mounted = [m for m in self._last_mounted if m not in succeeded]
        return succeeded

    def _scan_dvd_mount(self, mount):
        logger = logging.getLogger(__name__)
        try:
            video_ts = os.path.join(mount, "VIDEO_TS")
            if not os.path.isdir(video_ts):
                return []
            entries = []
            for name in os.listdir(video_ts):
                up = name.upper()
                if up.endswith(".VOB") or up.endswith(".IFO") or up.endswith(".BUP"):
                    path = os.path.join(video_ts, name)
                    try:
                        size = os.path.getsize(path)
                    except Exception:
                        size = 0
                    entries.append((size, path))
            if not entries:
                return []
            entries.sort(reverse=True)
            files = [p for _, p in entries]
            logger.info("Detected DVD at %s, %d files", mount, len(files))
            return files
        except Exception as e:
            logger.debug("DVD scan failed for %s: %s", mount, e)
            return []

    def _scan_bluray_mount(self, mount):
        logger = logging.getLogger(__name__)
        try:
            stream_dir = os.path.join(mount, "BDMV", "STREAM")
            if not os.path.isdir(stream_dir):
                return []
            entries = []
            for name in os.listdir(stream_dir):
                if name.lower().endswith(".m2ts"):
                    path = os.path.join(stream_dir, name)
                    try:
                        size = os.path.getsize(path)
                    except Exception:
                        size = 0
                    entries.append((size, path))
            if not entries:
                return []
            entries.sort(reverse=True)
            files = [p for _, p in entries]
            logger.info("Detected Blu-ray at %s, %d files", mount, len(files))
            return files
        except Exception as e:
            logger.debug("Blu-ray scan failed for %s: %s", mount, e)
            return []
