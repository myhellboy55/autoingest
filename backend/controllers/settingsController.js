import fs from 'fs';
import path from 'path';
import { getDestinationPath } from '../config/storage.js';

const SETTINGS_FILE = process.env.SETTINGS_FILE || './config/settings.json';

// Default settings
const defaultSettings = {
  uploadDestination: process.env.UPLOAD_DESTINATION_PATH || '/uploads/photos',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.raw'],
  autoUploadEnabled: false,
  lastModified: new Date().toISOString()
};

// Load settings from file or return defaults
const loadSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return defaultSettings;
};

// Save settings to file
const saveSettings = (settings) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
};

export const getSettings = (req, res) => {
  const settings = loadSettings();
  res.json(settings);
};

export const updateSettings = (req, res) => {
  const { uploadDestination, maxFileSize, allowedExtensions, autoUploadEnabled } = req.body;

  const currentSettings = loadSettings();
  
  // Validate and update only provided fields
  if (uploadDestination !== undefined) {
    // Create directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadDestination)) {
        fs.mkdirSync(uploadDestination, { recursive: true });
      }
      currentSettings.uploadDestination = uploadDestination;
      process.env.UPLOAD_DESTINATION_PATH = uploadDestination;
    } catch (err) {
      return res.status(400).json({ error: 'Invalid upload destination path' });
    }
  }

  if (maxFileSize !== undefined && maxFileSize > 0) {
    currentSettings.maxFileSize = maxFileSize;
    process.env.MAX_FILE_SIZE = maxFileSize;
  }

  if (allowedExtensions !== undefined && Array.isArray(allowedExtensions)) {
    currentSettings.allowedExtensions = allowedExtensions;
  }

  if (autoUploadEnabled !== undefined) {
    currentSettings.autoUploadEnabled = autoUploadEnabled;
  }

  currentSettings.lastModified = new Date().toISOString();

  if (saveSettings(currentSettings)) {
    res.json({
      success: true,
      message: 'Settings updated',
      settings: currentSettings
    });
  } else {
    res.status(500).json({ error: 'Failed to save settings' });
  }
};

export default { getSettings, updateSettings };
