import fs from 'fs';
import path from 'path';
import { getDestinationPath } from '../config/storage.js';

// driveId → {id, label, mountpoint, files, fileCount, lastSeen}
const drives = {};

// jobId → {status, total, completed, errors, baseName}
const jobs = {};

const DRIVE_TTL_MS = 90_000; // 3× default poll interval

// ── Scanner reporting ────────────────────────────────────────────────────────

export const reportDrives = (req, res) => {
  const { drives: incoming } = req.body;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ error: 'drives array required' });
  }

  const now = Date.now();
  for (const drive of incoming) {
    drives[drive.id] = { ...drive, lastSeen: now };
  }

  res.json({ ok: true });
};

// ── Frontend queries ─────────────────────────────────────────────────────────

export const getDrives = (req, res) => {
  const now = Date.now();
  const live = Object.values(drives).filter(d => now - d.lastSeen < DRIVE_TTL_MS);
  res.json(live.map(({ id, label, mountpoint, fileCount, files }) => ({
    id, label, mountpoint, fileCount,
    files: files.map(f => ({
      name: path.basename(f),
      path: f,
      size: safeSize(f),
    })),
  })));
};

function safeSize(filePath) {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}

// ── Ingest trigger ───────────────────────────────────────────────────────────

export const startIngest = (req, res) => {
  const { driveId } = req.params;
  const { baseName, startSequence = 1 } = req.body;

  if (!baseName || !baseName.trim()) {
    return res.status(400).json({ error: 'baseName is required' });
  }

  const drive = drives[driveId];
  if (!drive || Date.now() - drive.lastSeen >= DRIVE_TTL_MS) {
    return res.status(404).json({ error: 'Drive not found or no longer connected' });
  }

  const jobId = Date.now().toString();
  const sortedFiles = [...drive.files].sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b))
  );

  jobs[jobId] = {
    status: 'running',
    total: sortedFiles.length,
    completed: 0,
    errors: [],
    baseName: baseName.trim(),
  };

  // Run async — do not await
  runIngest(jobId, sortedFiles, baseName.trim(), Number(startSequence));

  res.json({ jobId });
};

async function runIngest(jobId, files, baseName, startSequence) {
  const dest = getDestinationPath();
  const pad = String(files.length + startSequence - 1).length;

  for (let i = 0; i < files.length; i++) {
    const src = files[i];
    const seq = String(startSequence + i).padStart(Math.max(pad, 3), '0');
    const ext = path.extname(src).toLowerCase();
    const newName = `${baseName}_${seq}${ext}`;
    const destPath = path.join(dest, newName);

    try {
      await fs.promises.copyFile(src, destPath);
      jobs[jobId].completed += 1;
    } catch (err) {
      jobs[jobId].errors.push({ file: path.basename(src), error: err.message });
    }
  }

  jobs[jobId].status = jobs[jobId].errors.length === files.length ? 'error' : 'done';
}

// ── Job progress ─────────────────────────────────────────────────────────────

export const getJob = (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
};
