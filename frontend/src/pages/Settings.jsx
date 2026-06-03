import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings.js';
import './Settings.css';

const Settings = () => {
  const { settings, loading, error, updateAppSettings } = useSettings();
  const [formData, setFormData] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (settings) {
      setFormData({
        uploadDestination: settings.uploadDestination || '',
        maxFileSize: settings.maxFileSize || 5242880,
        autoUploadEnabled: settings.autoUploadEnabled || false
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await updateAppSettings({
        uploadDestination: formData.uploadDestination,
        maxFileSize: parseInt(formData.maxFileSize),
        autoUploadEnabled: formData.autoUploadEnabled
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save settings');
    }
  };

  if (loading && !settings) {
    return <div className="settings-page"><p>Loading settings...</p></div>;
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      {error && <div className="error-message">{error}</div>}
      {saveError && <div className="error-message">{saveError}</div>}
      {saveSuccess && <div className="success-message">Settings saved successfully!</div>}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="uploadDestination">Upload Destination Path</label>
          <input
            type="text"
            id="uploadDestination"
            name="uploadDestination"
            value={formData.uploadDestination || ''}
            onChange={handleChange}
            placeholder="e.g., C:\uploads\photos"
            className="form-input"
          />
          <small>The directory where uploaded files will be stored</small>
        </div>

        <div className="form-group">
          <label htmlFor="maxFileSize">Max File Size (bytes)</label>
          <input
            type="number"
            id="maxFileSize"
            name="maxFileSize"
            value={formData.maxFileSize || 0}
            onChange={handleChange}
            min="1000000"
            className="form-input"
          />
          <small>Maximum size for individual file uploads (default: 5MB)</small>
        </div>

        <div className="form-group checkbox">
          <label htmlFor="autoUploadEnabled">
            <input
              type="checkbox"
              id="autoUploadEnabled"
              name="autoUploadEnabled"
              checked={formData.autoUploadEnabled || false}
              onChange={handleChange}
            />
            Enable Auto-Upload
          </label>
          <small>Automatically upload files when detected (v1: disabled)</small>
        </div>

        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="info-box">
        <h3>Information</h3>
        <p><strong>Current Destination:</strong> {settings?.uploadDestination || 'Not set'}</p>
        <p><strong>Max File Size:</strong> {settings?.maxFileSize ? (settings.maxFileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Not set'}</p>
        <p><strong>Last Modified:</strong> {settings?.lastModified ? new Date(settings.lastModified).toLocaleString() : 'Never'}</p>
      </div>
    </div>
  );
};

export default Settings;
