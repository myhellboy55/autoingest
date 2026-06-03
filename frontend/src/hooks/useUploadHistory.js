import { useState, useEffect } from 'react';
import { getUploadHistory, getUploadStats } from '../api/uploadAPI.js';

export const useUploadHistory = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const historyResponse = await getUploadHistory(limit, offset);
      const statsResponse = await getUploadStats();
      
      setFiles(historyResponse.data.files);
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { files, stats, loading, error, refetch: fetchHistory };
};
