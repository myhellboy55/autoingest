import fs from 'fs';
import path from 'path';
import { getDestinationPath } from '../config/storage.js';

// In-memory upload history (replace with database later)
let uploadHistory = [];

export const handleUpload = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const uploadedFiles = req.files.map(file => ({
    id: Date.now() + Math.random(),
    originalName: file.originalname,
    filename: file.filename,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    status: 'completed',
    destination: file.destination
  }));

  // Add to history
  uploadHistory = [...uploadedFiles, ...uploadHistory];

  res.json({
    success: true,
    message: `${uploadedFiles.length} file(s) uploaded successfully`,
    files: uploadedFiles
  });
};

export const getUploadHistory = (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  const paginatedHistory = uploadHistory.slice(offset, offset + limit);

  res.json({
    total: uploadHistory.length,
    limit,
    offset,
    files: paginatedHistory
  });
};

export const getUploadStats = (req, res) => {
  const totalFiles = uploadHistory.length;
  const totalSize = uploadHistory.reduce((sum, file) => sum + file.size, 0);
  const lastUpload = uploadHistory.length > 0 ? uploadHistory[0].uploadedAt : null;

  res.json({
    totalFiles,
    totalSize,
    lastUpload,
    destination: getDestinationPath()
  });
};

export const clearHistory = (req, res) => {
  uploadHistory = [];
  res.json({
    success: true,
    message: 'Upload history cleared'
  });
};

export default { handleUpload, getUploadHistory, getUploadStats, clearHistory };
