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
      onError(e);
    }
  },

  /**
   * Searches for the existing vault file across the visible Drive space.
   */
  async findVaultFile() {
    if (!this.accessToken) return null;
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&spaces=drive&fields=files(id, name)`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
        return this.fileId;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Saves data to Google Drive with guaranteed visibility.
   */
  async saveToCloud(userData: UserData) {
    if (!this.accessToken) return false;

    if (!this.fileId) {
      const found = await this.findVaultFile();
      if (!found) {
        return this.createAndUpload(userData);
      }
    }

    return this.uploadDataOnly(userData);
  },

  async createAndUpload(userData: UserData) {
    if (!this.accessToken) return false;

    const metadata = {
      name: BACKUP_FILENAME,
      mimeType: 'application/json',
      parents: ['root']
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
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  async uploadDataOnly(userData: UserData) {
    if (!this.accessToken || !this.fileId) return false;
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
      return false;
    }
  },

  async downloadFromCloud(): Promise<UserData | null> {
    if (!this.accessToken) return null;
    if (!this.fileId) await this.findVaultFile();
    if (!this.fileId) return null;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }
};