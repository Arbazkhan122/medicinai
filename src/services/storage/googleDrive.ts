import { EncryptionService } from '../encryption';

export class GoogleDriveStorage {
  private static readonly FOLDER_NAME = 'PharmaCare_Encrypted_Data';
  private accessToken: string | null = null;

  constructor() {
    this.loadAccessToken();
  }

  private loadAccessToken(): void {
    this.accessToken = localStorage.getItem('google_drive_token');
  }

  /**
   * Authenticate with Google Drive
   */
  async authenticate(): Promise<boolean> {
    try {
      // Initialize Google API
      await this.loadGoogleAPI();
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn({
        scope: 'https://www.googleapis.com/auth/drive.file'
      });
      
      this.accessToken = user.getAuthResponse().access_token;
      localStorage.setItem('google_drive_token', this.accessToken);
      
      return true;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      return false;
    }
  }

  private async loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2:client', () => {
          window.gapi.client.init({
            apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: 'https://www.googleapis.com/auth/drive.file'
          }).then(resolve).catch(reject);
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Create encrypted folder structure
   */
  async createEncryptedFolder(): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const folderMetadata = {
      name: this.FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folderMetadata)
    });

    const folder = await response.json();
    return folder.id;
  }

  /**
   * Store encrypted data in Google Drive
   */
  async storeEncryptedData(
    data: any, 
    dataType: string, 
    encryptionKey: string
  ): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const encryptedData = EncryptionService.encryptData(data, encryptionKey);
    const fileName = `${dataType}_${Date.now()}.encrypted`;

    const metadata = {
      name: fileName,
      parents: [await this.getOrCreateFolder()]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([encryptedData], { type: 'application/octet-stream' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: form
    });

    const file = await response.json();
    return file.id;
  }

  /**
   * Retrieve and decrypt data from Google Drive
   */
  async retrieveEncryptedData<T>(fileId: string, encryptionKey: string): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    const encryptedData = await response.text();
    return EncryptionService.decryptData<T>(encryptedData, encryptionKey);
  }

  private async getOrCreateFolder(): Promise<string> {
    // Check if folder exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder'`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    const searchResult = await searchResponse.json();
    
    if (searchResult.files && searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    return await this.createEncryptedFolder();
  }

  /**
   * List all encrypted files
   */
  async listEncryptedFiles(): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google Drive');
    }

    const folderId = await this.getOrCreateFolder();
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=parents in '${folderId}'`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    const result = await response.json();
    return result.files || [];
  }
}