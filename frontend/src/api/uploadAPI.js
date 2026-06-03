import apiClient from './client.js';

export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  return apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getUploadHistory = async (limit = 50, offset = 0) => {
  return apiClient.get('/upload/history', {
    params: { limit, offset }
  });
};

export const getUploadStats = async () => {
  return apiClient.get('/upload/stats');
};

export const clearUploadHistory = async () => {
  return apiClient.delete('/upload/history');
};

export const getSettings = async () => {
  return apiClient.get('/settings');
};

export const updateSettings = async (settings) => {
  return apiClient.put('/settings', settings);
};

export const getStatus = async () => {
  return apiClient.get('/status');
};
