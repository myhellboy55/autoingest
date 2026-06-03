import React from 'react';
import FileList from '../components/FileList.jsx';
import { useUploadHistory } from '../hooks/useUploadHistory.js';
import './Dashboard.css';

const Dashboard = () => {
  const { files, stats, loading, error } = useUploadHistory();

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="dashboard-page">
      <h2>Dashboard</h2>

      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Uploads</h3>
            <p className="stat-value">{stats.totalFiles}</p>
          </div>
          <div className="stat-card">
            <h3>Total Size</h3>
            <p className="stat-value">{formatFileSize(stats.totalSize)}</p>
          </div>
          <div className="stat-card">
            <h3>Destination</h3>
            <p className="stat-value-small">{stats.destination}</p>
          </div>
          {stats.lastUpload && (
            <div className="stat-card">
              <h3>Last Upload</h3>
              <p className="stat-value-small">{new Date(stats.lastUpload).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <FileList files={files} title="Upload History" />
      )}
    </div>
  );
};

export default Dashboard;
