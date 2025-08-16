import { useState, useEffect } from 'react';
import { StorageManager, type StorageOption } from '../services/storage/storageManager';
import { useAuthStore } from '../store/authStore';

export function useEncryptedStorage<T>(dataType: string) {
  const { user, encryptionKey } = useAuthStore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageManager = user && encryptionKey ? new StorageManager({
    userId: user.id,
    encryptionKey,
    enabledStorages: user.storagePreferences
  }) : null;

  const loadData = async () => {
    if (!storageManager) return;

    setLoading(true);
    setError(null);

    try {
      const retrievedData = await storageManager.retrieveData<T>(dataType);
      setData(retrievedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newData: T): Promise<void> => {
    if (!storageManager) throw new Error('Storage not initialized');

    try {
      await storageManager.storeData(newData, dataType);
      setData(prev => [...prev, newData]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save data');
    }
  };

  const syncData = async (): Promise<void> => {
    if (!storageManager) throw new Error('Storage not initialized');

    try {
      await storageManager.syncData(dataType);
      await loadData(); // Reload after sync
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to sync data');
    }
  };

  useEffect(() => {
    if (storageManager) {
      loadData();
    }
  }, [user, encryptionKey, dataType]);

  return {
    data,
    loading,
    error,
    saveData,
    syncData,
    refetch: loadData
  };
}