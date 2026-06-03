import os
import time
import logging
import requests
from scanner import Scanner

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
)
logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://backend:5000')
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '30'))


def wait_for_backend(url: str, retries: int = 10, delay: int = 5) -> None:
    for attempt in range(1, retries + 1):
        try:
            r = requests.get(f'{url}/api/status', timeout=5)
            if r.ok:
                logger.info("Backend is ready")
                return
        except Exception:
            pass
        logger.info("Waiting for backend (%d/%d)...", attempt, retries)
        time.sleep(delay)
    raise RuntimeError(f"Backend at {url} did not become ready after {retries} attempts")


def report_drives(mountpoints: list[str], scanner: Scanner) -> None:
    """Scan each mountpoint and POST a drive report to the backend."""
    drives = []
    for mp in mountpoints:
        files = scanner.find_media_files(scan_roots=[mp])
        if not files:
            continue
        label = os.path.basename(mp.rstrip('/')) or mp
        drives.append({
            'id': label,
            'label': label,
            'mountpoint': mp,
            'files': files,
            'fileCount': len(files),
        })

    if not drives:
        logger.info("No media found on any mounted drive")
        return

    try:
        resp = requests.post(
            f'{BACKEND_URL}/api/drives/report',
            json={'drives': drives},
            timeout=10,
        )
        if resp.ok:
            logger.info("Reported %d drive(s) to backend", len(drives))
        else:
            logger.warning("Drive report failed (HTTP %s): %s", resp.status_code, resp.text[:200])
    except Exception as e:
        logger.error("Drive report error: %s", e)


def main() -> None:
    logger.info("Watcher starting. Backend: %s  Poll interval: %ds", BACKEND_URL, POLL_INTERVAL)
    wait_for_backend(BACKEND_URL)
    scanner = Scanner()

    while True:
        try:
            roots = scanner.ensure_mounted_candidates()
            report_drives(roots, scanner)
        except Exception as e:
            logger.error("Scan cycle error: %s", e)
        finally:
            try:
                scanner.unmount_mountpoints()
            except Exception:
                pass

        time.sleep(POLL_INTERVAL)


if __name__ == '__main__':
    main()
