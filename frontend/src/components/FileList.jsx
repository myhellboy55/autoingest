import React from 'react';
import './FileList.css';

const FileList = ({ files, title = 'Files' }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="file-list-container">
      <h3>{title}</h3>
      {files.length === 0 ? (
        <p className="no-files">No files</p>
      ) : (
        <table className="file-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Size</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <tr key={file.id}>
                <td>{file.originalName}</td>
                <td>{formatFileSize(file.size)}</td>
                <td>{file.mimeType}</td>
                <td>{formatDate(file.uploadedAt)}</td>
                <td>
                  <span className={`status ${file.status}`}>
                    {file.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FileList;
