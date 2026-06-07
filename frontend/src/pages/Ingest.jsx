import React, { useState, useEffect, useRef } from 'react';
import { getDrives, startIngest, getJobProgress, ejectDrive } from '../api/ingestAPI.js';
import './Ingest.css';

const DRIVE_POLL_MS = 5000;
const JOB_POLL_MS = 1000;

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function DriveCard({ drive, onEjected }) {
  const [baseName, setBaseName] = useState('');
  const [startSeq, setStartSeq] = useState(1);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [ejecting, setEjecting] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getJobProgress(jobId);
        setJob(data);
        if (data.status !== 'running') clearInterval(pollRef.current);
      } catch {
        clearInterval(pollRef.current);
      }
    }, JOB_POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [jobId]);

  const handleIngest = async () => {
    setError('');
    if (!baseName.trim()) { setError('Enter a base name first'); return; }
    try {
      const { data } = await startIngest(drive.id, baseName.trim(), startSeq);
      setJobId(data.jobId);
      setJob({ status: 'running', total: drive.fileCount, completed: 0, errors: [] });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start ingest');
    }
  };

  const handleEject = async () => {
    setEjecting(true);
    try {
      await ejectDrive(drive.id);
      onEjected(drive.id);
    } catch {
      setEjecting(false);
    }
  };

  const progress = job ? Math.round((job.completed / job.total) * 100) : 0;
  const isDone = job?.status === 'done';
  const isRunning = job?.status === 'running';

  return (
    <div className={`drive-card ${isDone ? 'drive-card--done' : ''}`}>
      <div className="drive-card__header">
        <span className="drive-card__icon">💾</span>
        <div>
          <h2 className="drive-card__label">{drive.label}</h2>
          <p className="drive-card__meta">{drive.fileCount} file{drive.fileCount !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn-eject"
          onClick={handleEject}
          disabled={isRunning || ejecting}
          title="Eject drive"
        >
          {ejecting ? 'Ejecting…' : '⏏ Eject'}
        </button>
      </div>

      {!jobId && (
        <div className="drive-card__form">
          <label className="form-label">Base name</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Iceland_2026"
            value={baseName}
            onChange={e => setBaseName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleIngest()}
          />
          <label className="form-label">Start sequence</label>
          <input
            className="form-input form-input--narrow"
            type="number"
            min={1}
            value={startSeq}
            onChange={e => setStartSeq(Math.max(1, parseInt(e.target.value) || 1))}
          />
          {error && <p className="form-error">{error}</p>}
          <p className="drive-card__preview">
            {baseName.trim()
              ? `Will create: ${baseName.trim()}_${String(startSeq).padStart(3, '0')}.jpg … ${baseName.trim()}_${String(startSeq + drive.fileCount - 1).padStart(3, '0')}.ext`
              : 'Files will be renamed: BaseName_001.jpg, BaseName_002.jpg …'}
          </p>
          <button className="btn-ingest" onClick={handleIngest}>
            Start Ingest
          </button>
        </div>
      )}

      {jobId && (
        <div className="drive-card__progress">
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="progress-label">
            {isRunning
              ? `Copying… ${job.completed} / ${job.total}`
              : isDone
                ? `Done — ${job.completed} file${job.completed !== 1 ? 's' : ''} copied as ${baseName.trim()}_001…`
                : `Error — ${job.completed} / ${job.total} copied`}
          </p>
          {job?.errors?.length > 0 && (
            <ul className="error-list">
              {job.errors.map((e, i) => (
                <li key={i}>{e.file}: {e.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <details className="drive-card__files">
        <summary>{drive.fileCount} file{drive.fileCount !== 1 ? 's' : ''} on drive</summary>
        <ul className="file-list">
          {drive.files.map(f => (
            <li key={f.path}>
              <span className="file-name">{f.name}</span>
              <span className="file-size">{formatBytes(f.size)}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function Ingest() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getDrives();
        setDrives(data);
      } catch {
        // backend may not be reachable yet — silent retry
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const id = setInterval(fetch, DRIVE_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const handleEjected = (driveId) => {
    setDrives(prev => prev.filter(d => d.id !== driveId));
  };

  if (loading) return <p className="ingest-status">Looking for drives…</p>;

  if (drives.length === 0) {
    return (
      <div className="ingest-empty">
        <p className="ingest-empty__icon">📷</p>
        <p className="ingest-empty__text">Plug an SD card or USB drive into the Pi</p>
        <p className="ingest-empty__sub">This page refreshes automatically every 5 seconds</p>
      </div>
    );
  }

  return (
    <div className="ingest-page">
      <h1 className="ingest-title">Ingest</h1>
      <div className="drives-list">
        {drives.map(drive => <DriveCard key={drive.id} drive={drive} onEjected={handleEjected} />)}
      </div>
    </div>
  );
}
