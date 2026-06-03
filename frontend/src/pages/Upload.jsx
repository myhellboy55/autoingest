import React, { useState } from 'react';
import FileUploadZone from '../components/FileUploadZone.jsx';
import FileList from '../components/FileList.jsx';
import { useUpload } from '../hooks/useUpload.js';
import './Upload.css';

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { upload, loading, error, success } = useUpload();

  const handleFilesSelected = (files) => {
    setSelectedFiles(Array.from(files));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    try {
      const result = await upload(selectedFiles);
      setUploadedFiles([...result.files, ...uploadedFiles]);
      setSelectedFiles([]);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload Files</h2>
      
      <FileUploadZone onFilesSelected={handleFilesSelected} loading={loading} />

      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <h3>Selected Files ({selectedFiles.length})</h3>
          <ul>
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
          <button onClick={handleUpload} disabled={loading} className="upload-submit-btn">
            {loading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success.message}</div>}

      {uploadedFiles.length > 0 && (
        <FileList files={uploadedFiles} title="Recently Uploaded" />
      )}
    </div>
  );
};

export default Upload;
