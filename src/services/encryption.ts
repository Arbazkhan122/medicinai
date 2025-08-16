import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16;

  /**
   * Generate a unique encryption key for a user
   */
  static generateEncryptionKey(): string {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }

  /**
   * Generate a hash of the encryption key for storage
   */
  static hashEncryptionKey(key: string): string {
    return CryptoJS.SHA256(key).toString();
  }

  /**
   * Encrypt data using AES encryption
   */
  static encryptData(data: any, encryptionKey: string): string {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionKey).toString();
      return encrypted;
    } catch (error) {
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES decryption
   */
  static decryptData<T>(encryptedData: string, encryptionKey: string): T {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!jsonString) {
        throw new Error('Invalid encryption key or corrupted data');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt file for storage
   */
  static encryptFile(file: File, encryptionKey: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey).toString();
          const blob = new Blob([encrypted], { type: 'application/octet-stream' });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Decrypt file from storage
   */
  static decryptFile(encryptedBlob: Blob, encryptionKey: string, originalType: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const encryptedString = reader.result as string;
          const decrypted = CryptoJS.AES.decrypt(encryptedString, encryptionKey);
          const arrayBuffer = this.wordArrayToArrayBuffer(decrypted);
          const blob = new Blob([arrayBuffer], { type: originalType });
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(encryptedBlob);
    });
  }

  private static wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(wordArray.sigBytes);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < wordArray.sigBytes; i++) {
      uint8Array[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    
    return arrayBuffer;
  }
}