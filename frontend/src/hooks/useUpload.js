import { useState, useCallback } from 'react';
import { uploadFiles } from '../api/uploadAPI.js';

export const useUpload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const upload = useCallback(async (files) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await uploadFiles(files);
      setSuccess(response.data);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, loading, error, success };
};
