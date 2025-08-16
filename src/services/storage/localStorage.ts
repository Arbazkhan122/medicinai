import { EncryptionService } from '../encryption';

export class LocalStorage {
  private static readonly PREFIX = 'pharmacare_encrypted_';

  /**
   * Store encrypted data in browser localStorage
   */
  static storeEncryptedData(
    userId: string,
    data: any,
    dataType: string,
    encryptionKey: string
  ): string {
    try {
      const encryptedContent = EncryptionService.encryptData(data, encryptionKey);
      const id = crypto.randomUUID();
      const storageKey = `${this.PREFIX}${userId}_${dataType}_${id}`;
      
      const storageItem = {
        id,
        userId,
        dataType,
        encryptedContent,
        storageLocation: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(storageKey, JSON.stringify(storageItem));
      
      // Update index
      this.updateIndex(userId, id, dataType);
      
      return id;
    } catch (error) {
      throw new Error(`Failed to store data locally: ${error}`);
    }
  }

  /**
   * Retrieve and decrypt data from localStorage
   */
  static retrieveEncryptedData<T>(
    userId: string,
    dataType: string,
    encryptionKey: string
  ): T[] {
    try {
      const index = this.getIndex(userId);
      const items = index
        .filter(item => item.dataType === dataType)
        .map(item => {
          const storageKey = `${this.PREFIX}${userId}_${dataType}_${item.id}`;
          const stored = localStorage.getItem(storageKey);
          
          if (!stored) return null;
          
          const parsedItem = JSON.parse(stored);
          return EncryptionService.decryptData<T>(parsedItem.encryptedContent, encryptionKey);
        })
        .filter(item => item !== null);

      return items;
    } catch (error) {
      throw new Error(`Failed to retrieve data from localStorage: ${error}`);
    }
  }

  /**
   * Update encrypted data in localStorage
   */
  static updateEncryptedData(
    userId: string,
    id: string,
    dataType: string,
    data: any,
    encryptionKey: string
  ): void {
    try {
      const encryptedContent = EncryptionService.encryptData(data, encryptionKey);
      const storageKey = `${this.PREFIX}${userId}_${dataType}_${id}`;
      
      const existingItem = localStorage.getItem(storageKey);
      if (!existingItem) {
        throw new Error('Item not found');
      }

      const parsedItem = JSON.parse(existingItem);
      parsedItem.encryptedContent = encryptedContent;
      parsedItem.updatedAt = new Date().toISOString();

      localStorage.setItem(storageKey, JSON.stringify(parsedItem));
    } catch (error) {
      throw new Error(`Failed to update data in localStorage: ${error}`);
    }
  }

  /**
   * Delete encrypted data from localStorage
   */
  static deleteEncryptedData(userId: string, id: string, dataType: string): void {
    try {
      const storageKey = `${this.PREFIX}${userId}_${dataType}_${id}`;
      localStorage.removeItem(storageKey);
      
      // Update index
      this.removeFromIndex(userId, id);
    } catch (error) {
      throw new Error(`Failed to delete data from localStorage: ${error}`);
    }
  }

  /**
   * List all encrypted data for a user
   */
  static listUserData(userId: string): any[] {
    try {
      return this.getIndex(userId);
    } catch (error) {
      throw new Error(`Failed to list user data: ${error}`);
    }
  }

  /**
   * Clear all data for a user
   */
  static clearUserData(userId: string): void {
    try {
      const index = this.getIndex(userId);
      
      index.forEach(item => {
        const storageKey = `${this.PREFIX}${userId}_${item.dataType}_${item.id}`;
        localStorage.removeItem(storageKey);
      });
      
      localStorage.removeItem(`${this.PREFIX}index_${userId}`);
    } catch (error) {
      throw new Error(`Failed to clear user data: ${error}`);
    }
  }

  private static updateIndex(userId: string, id: string, dataType: string): void {
    const index = this.getIndex(userId);
    index.push({
      id,
      dataType,
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(`${this.PREFIX}index_${userId}`, JSON.stringify(index));
  }

  private static removeFromIndex(userId: string, id: string): void {
    const index = this.getIndex(userId);
    const updatedIndex = index.filter(item => item.id !== id);
    localStorage.setItem(`${this.PREFIX}index_${userId}`, JSON.stringify(updatedIndex));
  }

  private static getIndex(userId: string): any[] {
    const indexKey = `${this.PREFIX}index_${userId}`;
    const stored = localStorage.getItem(indexKey);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(userId: string): { itemCount: number; estimatedSize: string } {
    const index = this.getIndex(userId);
    let totalSize = 0;

    index.forEach(item => {
      const storageKey = `${this.PREFIX}${userId}_${item.dataType}_${item.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        totalSize += new Blob([stored]).size;
      }
    });

    return {
      itemCount: index.length,
      estimatedSize: this.formatBytes(totalSize)
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}