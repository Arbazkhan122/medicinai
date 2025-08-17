import React, { useState, useEffect } from 'react';
import { Cloud, Database, HardDrive, Shield, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { GoogleDriveStorage } from '../../services/storage/googleDrive';
import { SupabaseStorage } from '../../services/storage/supabaseStorage';
import { LocalStorage } from '../../services/storage/localStorage';
import { StorageManager, type StorageOption } from '../../services/storage/storageManager';
import { useAuthStore } from '../../store/authStore';

export const StorageSetup: React.FC = () => {
  const { user, encryptionKey, updateStoragePreferences } = useAuthStore();
  const [storageStatus, setStorageStatus] = useState<{
    [key in StorageOption]: 'disconnected' | 'connecting' | 'connected' | 'error'
  }>({
    'google-drive': 'disconnected',
    'supabase': 'connected', // Always connected since we use it for auth
    'local': 'connected' // Always available
  });

  const [storageStats, setStorageStats] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && encryptionKey) {
      loadStorageStats();
    }
  }, [user, encryptionKey]);

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
      // Set default stats if loading fails
      setStorageStats({
        'local': { itemCount: 0, estimatedSize: '0 KB' },
        'supabase': { itemCount: 0, lastSync: 'Never' },
        'google-drive': { itemCount: 0, lastSync: 'Never' }
      });
    }
  };

  const connectGoogleDrive = async () => {
    setStorageStatus(prev => ({ ...prev, 'google-drive': 'connecting' }));
    
    try {
      const googleDrive = new GoogleDriveStorage();
      const success = await googleDrive.authenticate();
      
      if (success) {
        setStorageStatus(prev => ({ ...prev, 'google-drive': 'connected' }));
        
        // Update user preferences
        const newPreferences = [...user!.storagePreferences];
        if (!newPreferences.includes('google-drive')) {
          newPreferences.push('google-drive');
          updateStoragePreferences(newPreferences);
        }
      } else {
        setStorageStatus(prev => ({ ...prev, 'google-drive': 'error' }));
      }
    } catch (error) {
      setStorageStatus(prev => ({ ...prev, 'google-drive': 'error' }));
    }
  };

  const testStorage = async (storageType: StorageOption) => {
    if (!user || !encryptionKey) return;

    setLoading(true);
    try {
      const testData = { test: 'data', timestamp: new Date().toISOString() };
      
      switch (storageType) {
        case 'google-drive':
          try {
            const googleDrive = new GoogleDriveStorage();
            await googleDrive.storeEncryptedData(testData, 'test', encryptionKey);
            alert(`${storageType} storage test successful!`);
          } catch (error) {
            alert(`${storageType} storage test failed: ${error}`);
            return;
          }
          break;
          
        case 'supabase':
          try {
            const supabaseStorage = new SupabaseStorage();
            await supabaseStorage.storeEncryptedData(user.id, testData, 'test', encryptionKey);
            alert(`${storageType} storage test successful!`);
          } catch (error) {
            alert(`${storageType} storage test failed: ${error}`);
            return;
          }
          break;
          
        case 'local':
          try {
            LocalStorage.storeEncryptedData(user.id, testData, 'test', encryptionKey);
            alert(`${storageType} storage test successful!`);
          } catch (error) {
            alert(`${storageType} storage test failed: ${error}`);
            return;
          }
          break;
      }
      
      loadStorageStats();
    } catch (error) {
      console.error('Storage test error:', error);
      alert(`${storageType} storage test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const syncAllData = async () => {
    if (!user || !encryptionKey) return;

    setLoading(true);
    try {
      const storageManager = new StorageManager({
        userId: user.id,
        encryptionKey,
        enabledStorages: user.storagePreferences
      });

      await storageManager.syncData('medicines');
      await storageManager.syncData('sales');
      await storageManager.syncData('batches');
      
      alert('Data synchronized across all storage options!');
      loadStorageStats();
    } catch (error) {
      alert(`Sync failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const storageOptions = [
    {
      id: 'supabase' as StorageOption,
      name: 'Supabase Cloud',
      description: 'Real-time cloud database with automatic backups',
      icon: Database,
      color: 'green',
      alwaysEnabled: true
    },
    {
      id: 'google-drive' as StorageOption,
      name: 'Google Drive',
      description: 'Encrypted files stored in your Google Drive',
      icon: Cloud,
      color: 'blue',
      alwaysEnabled: false
    },
    {
      id: 'local' as StorageOption,
      name: 'Local Browser',
      description: 'Fast local storage in your browser',
      icon: HardDrive,
      color: 'purple',
      alwaysEnabled: true
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'connecting':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Storage Management</h1>
        <p className="text-gray-600">Configure and manage your encrypted data storage options</p>
      </div>

      {/* Storage Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {storageOptions.map((option) => {
          const Icon = option.icon;
          const status = storageStatus[option.id];
          const stats = storageStats[option.id];
          const isEnabled = user?.storagePreferences.includes(option.id);
          
          return (
            <div key={option.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${option.color}-100`}>
                    <Icon className={`w-6 h-6 text-${option.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
                {getStatusIcon(status)}
              </div>

              {/* Storage Stats */}
              {stats && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm space-y-1">
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
                    {stats.lastSync && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="font-medium text-xs">{stats.lastSync}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {option.id === 'google-drive' && status === 'disconnected' && (
                  <button
                    onClick={connectGoogleDrive}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Connect Google Drive
                  </button>
                )}
                
                {status === 'connected' && (
                  <button
                    onClick={() => testStorage(option.id)}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Test Storage
                  </button>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  status === 'connected' ? 'bg-green-100 text-green-800' :
                  status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {status === 'connected' ? 'Connected' :
                   status === 'connecting' ? 'Connecting...' :
                   status === 'error' ? 'Error' :
                   'Disconnected'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Synchronization</h2>
            <p className="text-gray-600">Keep your data in sync across all storage options</p>
          </div>
          <Settings className="w-6 h-6 text-gray-400" />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={syncAllData}
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>Sync All Data</span>
          </button>
          
          <button
            onClick={loadStorageStats}
            disabled={loading}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
          >
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Your Data Security</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• All data is encrypted with AES-256 before storage</li>
              <li>• Your encryption key never leaves your device</li>
              <li>• Each storage option maintains independent encrypted copies</li>
              <li>• Data can only be decrypted with your unique key</li>
              <li>• Zero-knowledge architecture ensures maximum privacy</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};