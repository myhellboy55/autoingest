import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api/uploadAPI.js';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSettings();
      setSettings(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppSettings = async (newSettings) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateSettings(newSettings);
      setSettings(response.data.settings);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateAppSettings, refetch: fetchSettings };
};
