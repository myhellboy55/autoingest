import React from 'react';
import './FileUploadZone.css';

const FileUploadZone = ({ onFilesSelected, loading }) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    onFilesSelected(files);
  };

  return (
    <div
      className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="upload-content">
        <p className="upload-text">Drag and drop files here or click to select</p>
        <input
          type="file"
          multiple
          onChange={handleFileInputChange}
          disabled={loading}
          id="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="upload-button">
          {loading ? 'Uploading...' : 'Select Files'}
        </label>
      </div>
    </div>
  );
};

export default FileUploadZone;
