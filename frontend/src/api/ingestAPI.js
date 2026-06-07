import apiClient from './client.js';

export const getDrives = () =>
  apiClient.get('/drives');

export const startIngest = (driveId, baseName, startSequence = 1) =>
  apiClient.post(`/drives/${encodeURIComponent(driveId)}/ingest`, { baseName, startSequence });

export const getJobProgress = (jobId) =>
  apiClient.get(`/ingest/${jobId}`);

export const ejectDrive = (driveId) =>
  apiClient.post(`/drives/${encodeURIComponent(driveId)}/eject`);
