import { UserData } from '../types';

const BACKUP_FILENAME = 'LunaCycle_Vault.json';

export const SyncService = {
  accessToken: null as string | null,
  fileId: null as string | null,

  getClientId() {
    return (process.env as any).GOOGLE_CLIENT_ID || '';
  },

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('luna_google_token', token);
  },

  logout() {
    this.accessToken = null;
    this.fileId = null;
    localStorage.removeItem('luna_google_token');
    localStorage.removeItem('luna_cloud_enabled');
  },

  async triggerLogin(onSuccess: (token: string) => void, onError: (err?: any) => void) {
    const clientId = this.getClientId();
    
    if (!clientId) {
      console.error("CRITICAL: GOOGLE_CLIENT_ID is not set.");
      onError('MISSING_CLIENT_ID');
      return;
    }

    try {
      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file email profile',
        callback: (response: any) => {
          if (response.access_token) {
            onSuccess(response.access_token);
          } else {
            onError(response);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("Google Auth initialization failed", e);
      onError(e);
    }
  },

  /**
   * Searches for the existing vault file across the visible Drive space.
   */
  async findVaultFile() {
    if (!this.accessToken) return null;

    try {
      // spaces=drive ensures we check the visible user storage, not hidden folders
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&spaces=drive&fields=files(id, name)`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
        console.log("Vault found:", this.fileId);
        return this.fileId;
      }
      return null;
    } catch (err) {
      console.error('Search for vault failed', err);
      return null;
    }
  },

  /**
   * Saves data to Google Drive using correctly formatted multipart/related request.
   */
  async saveToCloud(userData: UserData) {
    if (!this.accessToken) return false;

    // Verify fileId exists or try to find it
    if (!this.fileId) {
      const found = await this.findVaultFile();
      if (!found) {
        // Create new file
        return this.createVaultFile(userData);
      }
    }

    // Update existing file
    try {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      return res.ok;
    } catch (err) {
      console.error('Sync update failed', err);
      return false;
    }
  },

  /**
   * Creates a new vault file in Drive with proper metadata and visible placement.
   */
  async createVaultFile(userData: UserData) {
    if (!this.accessToken) return false;

    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      description: 'LunaCycle Private Cycle Vault',
      parents: ['root'] // Force visibility in the root folder
    };

    const boundary = '-------LunaVaultBoundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body = 
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(userData) +
      closeDelimiter;

    try {
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });
      const data = await response.json();
      if (data.id) {
        this.fileId = data.id;
        console.log("Vault created successfully:", data.id);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Sync creation failed', err);
      return false;
    }
  },

  async downloadFromCloud(): Promise<UserData | null> {
    if (!this.accessToken) return null;
    
    // Always search if we don't have an ID yet
    if (!this.fileId) {
      await this.findVaultFile();
    }
    
    if (!this.fileId) return null;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) {
        console.error("Vault download response error:", res.status);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('Vault download failed', err);
      return null;
    }
  }
};