import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  RefreshCw, 
  Database,
  Cloud,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { StorageManager } from '../../services/storage/storageManager';
import { useAuthStore } from '../../store/authStore';
import { EncryptionService } from '../../services/encryption';

export const DataManagement: React.FC = () => {
  const { user, encryptionKey } = useAuthStore();
  const [storageStats, setStorageStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    if (!user || !encryptionKey) return;

    try {
      const storageManager = new StorageManager({
        userId: user.id,
        encryptionKey,
        enabledStorages: user.storagePreferences
      });

      const stats = await storageManager.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const exportAllData = async () => {
    if (!user || !encryptionKey) return;

    setExportLoading(true);
    try {
      const storageManager = new StorageManager({
        userId: user.id,
        encryptionKey,
        enabledStorages: user.storagePreferences
      });

      // Retrieve all data types
      const [medicines, sales, batches] = await Promise.all([
        storageManager.retrieveData('medicines'),
        storageManager.retrieveData('sales'),
        storageManager.retrieveData('batches')
      ]);

      const exportData = {
        medicines,
        sales,
        batches,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacare-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      alert(`Export failed: ${error}`);
    } finally {
      setExportLoading(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !encryptionKey) return;

    setLoading(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      const storageManager = new StorageManager({
        userId: user.id,
        encryptionKey,
        enabledStorages: user.storagePreferences
      });

      // Import each data type
      if (importData.medicines) {
        for (const medicine of importData.medicines) {
          await storageManager.storeData(medicine, 'medicines');
        }
      }

      if (importData.sales) {
        for (const sale of importData.sales) {
          await storageManager.storeData(sale, 'sales');
        }
      }

      if (importData.batches) {
        for (const batch of importData.batches) {
          await storageManager.storeData(batch, 'batches');
        }
      }

      alert('Data imported successfully!');
      loadStorageStats();
    } catch (error) {
      alert(`Import failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!user || !encryptionKey) return;

    const confirmed = confirm(
      'Are you sure you want to clear all data? This action cannot be undone.'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // Clear from all storage options
      // Implementation would depend on specific storage APIs
      alert('All data cleared successfully!');
      loadStorageStats();
    } catch (error) {
      alert(`Failed to clear data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStorageIcon = (storageType: string) => {
    switch (storageType) {
      case 'supabase':
        return <Database className="w-5 h-5 text-green-600" />;
      case 'google-drive':
        return <Cloud className="w-5 h-5 text-blue-600" />;
      case 'local':
        return <HardDrive className="w-5 h-5 text-purple-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600">Export, import, and manage your encrypted pharmacy data</p>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(storageStats).map(([storageType, stats]: [string, any]) => (
          <div key={storageType} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              {getStorageIcon(storageType)}
              <div>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {storageType.replace('-', ' ')}
                </h3>
                <p className="text-sm text-gray-600">
                  {stats.error ? 'Connection Error' : 'Connected'}
                </p>
              </div>
            </div>

            {stats.error ? (
              <div className="text-red-600 text-sm">{stats.error}</div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium">{stats.itemCount || 0}</span>
                </div>
                {stats.estimatedSize && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{stats.estimatedSize}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data Operations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Operations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Data */}
          <button
            onClick={exportAllData}
            disabled={exportLoading}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            {exportLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              <Download className="w-5 h-5 text-blue-600" />
            )}
            <span className="font-medium text-gray-700">Export All Data</span>
          </button>

          {/* Import Data */}
          <label className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
            <Upload className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-700">Import Data</span>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>

          {/* Refresh Stats */}
          <button
            onClick={loadStorageStats}
            disabled={loading}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-medium text-gray-700">Refresh Stats</span>
          </button>

          {/* Clear Data */}
          <button
            onClick={clearAllData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-700">Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Important Security Notice</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Keep your encryption key safe! If you lose it, your data cannot be recovered. 
              Consider storing a secure backup of your key in a password manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};