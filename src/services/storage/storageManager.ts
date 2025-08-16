import { GoogleDriveStorage } from './googleDrive';
import { SupabaseStorage } from './supabaseStorage';
import { LocalStorage } from './localStorage';
import { EncryptionService } from '../encryption';

export type StorageOption = 'google-drive' | 'supabase' | 'local';

export interface StorageConfig {
  userId: string;
  encryptionKey: string;
  enabledStorages: StorageOption[];
}

export class StorageManager {
  private googleDrive: GoogleDriveStorage;
  private supabaseStorage: SupabaseStorage;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    this.googleDrive = new GoogleDriveStorage();
    this.supabaseStorage = new SupabaseStorage();
  }

  /**
   * Store data across all enabled storage options
   */
  async storeData(data: any, dataType: string): Promise<{ [key in StorageOption]?: string }> {
    const results: { [key in StorageOption]?: string } = {};
    const errors: string[] = [];

    // Store in each enabled storage option
    for (const storage of this.config.enabledStorages) {
      try {
        switch (storage) {
          case 'google-drive':
            results['google-drive'] = await this.googleDrive.storeEncryptedData(
              data,
              dataType,
              this.config.encryptionKey
            );
            break;

          case 'supabase':
            results['supabase'] = await this.supabaseStorage.storeEncryptedData(
              this.config.userId,
              data,
              dataType,
              this.config.encryptionKey
            );
            break;

          case 'local':
            results['local'] = LocalStorage.storeEncryptedData(
              this.config.userId,
              data,
              dataType,
              this.config.encryptionKey
            );
            break;
        }
      } catch (error) {
        errors.push(`${storage}: ${error}`);
      }
    }

    if (errors.length === this.config.enabledStorages.length) {
      throw new Error(`All storage options failed: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * Retrieve data from the first available storage option
   */
  async retrieveData<T>(dataType: string): Promise<T[]> {
    const errors: string[] = [];

    // Try each storage option in order of preference
    for (const storage of this.config.enabledStorages) {
      try {
        switch (storage) {
          case 'supabase':
            return await this.supabaseStorage.retrieveEncryptedData<T>(
              this.config.userId,
              dataType,
              this.config.encryptionKey
            );

          case 'google-drive':
            // For Google Drive, we need to list files first and then retrieve
            const files = await this.googleDrive.listEncryptedFiles();
            const dataFiles = files.filter(file => file.name.startsWith(dataType));
            
            if (dataFiles.length === 0) return [];
            
            const retrievedData: T[] = [];
            for (const file of dataFiles) {
              const data = await this.googleDrive.retrieveEncryptedData<T>(
                file.id,
                this.config.encryptionKey
              );
              retrievedData.push(data);
            }
            return retrievedData;

          case 'local':
            return LocalStorage.retrieveEncryptedData<T>(
              this.config.userId,
              dataType,
              this.config.encryptionKey
            );
        }
      } catch (error) {
        errors.push(`${storage}: ${error}`);
        continue;
      }
    }

    throw new Error(`All storage options failed: ${errors.join(', ')}`);
  }

  /**
   * Sync data across all enabled storage options
   */
  async syncData(dataType: string): Promise<void> {
    try {
      // Get data from primary storage (first in list)
      const primaryStorage = this.config.enabledStorages[0];
      let primaryData: any[] = [];

      switch (primaryStorage) {
        case 'supabase':
          primaryData = await this.supabaseStorage.retrieveEncryptedData(
            this.config.userId,
            dataType,
            this.config.encryptionKey
          );
          break;
        case 'local':
          primaryData = LocalStorage.retrieveEncryptedData(
            this.config.userId,
            dataType,
            this.config.encryptionKey
          );
          break;
      }

      // Sync to other storage options
      for (const storage of this.config.enabledStorages.slice(1)) {
        await this.storeDataInSpecificStorage(primaryData, dataType, storage);
      }
    } catch (error) {
      throw new Error(`Sync failed: ${error}`);
    }
  }

  private async storeDataInSpecificStorage(
    data: any[],
    dataType: string,
    storage: StorageOption
  ): Promise<void> {
    for (const item of data) {
      switch (storage) {
        case 'google-drive':
          await this.googleDrive.storeEncryptedData(item, dataType, this.config.encryptionKey);
          break;
        case 'supabase':
          await this.supabaseStorage.storeEncryptedData(
            this.config.userId,
            item,
            dataType,
            this.config.encryptionKey
          );
          break;
        case 'local':
          LocalStorage.storeEncryptedData(
            this.config.userId,
            item,
            dataType,
            this.config.encryptionKey
          );
          break;
      }
    }
  }

  /**
   * Get storage statistics across all options
   */
  async getStorageStats(): Promise<{ [key in StorageOption]?: any }> {
    const stats: { [key in StorageOption]?: any } = {};

    for (const storage of this.config.enabledStorages) {
      try {
        switch (storage) {
          case 'local':
            stats['local'] = LocalStorage.getStorageStats(this.config.userId);
            break;
          case 'supabase':
            const supabaseData = await this.supabaseStorage.listUserData(this.config.userId);
            stats['supabase'] = {
              itemCount: supabaseData.length,
              lastSync: supabaseData[0]?.updated_at || 'Never'
            };
            break;
          case 'google-drive':
            const driveFiles = await this.googleDrive.listEncryptedFiles();
            stats['google-drive'] = {
              itemCount: driveFiles.length,
              lastSync: 'Available'
            };
            break;
        }
      } catch (error) {
        stats[storage] = { error: error.toString() };
      }
    }

    return stats;
  }
}