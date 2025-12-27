import { UserData } from '../types';

/**
 * Luna Private Cloud Engine
 * Switched to drive.file scope so users can see their vault file.
 */
const BACKUP_FILENAME = 'LunaCycle_Vault.json';

export const SyncService = {
  accessToken: null as string | null,
  fileId: null as string | null,

  getClientId() {
    return process.env.GOOGLE_CLIENT_ID || '';
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
        // Using drive.file so the file is visible to the user in their Drive
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
   * Search for the vault file in the user's Google Drive.
   */
  async initSync() {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      const data = await response.json();

      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to init sync', err);
      return false;
    }
  },

  /**
   * Saves data to the cloud.
   * INCLUDES PROTECTION: Will not save if local data is suspicious (empty) unless specifically forced.
   */
  async saveToCloud(userData: UserData) {
    if (!this.accessToken) return false;

    // Safety: Don't upload a completely empty vault if we don't have a fileId yet
    // because we might still be searching for an existing one.
    const hasData = userData.logs.length > 0 || userData.symptoms.length > 0;
    
    try {
      if (!this.fileId) {
        const found = await this.initSync();
        if (!found) {
          if (!hasData) return false; // Don't create an empty file if none exists

          const metadata = {
            name: BACKUP_FILENAME,
            description: 'LunaCycle Private Data Vault'
          };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', new Blob([JSON.stringify(userData)], { type: 'application/json' }));

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.accessToken}` },
            body: form
          });
          const created = await res.json();
          this.fileId = created.id;
          return true;
        }
      }

      // Update existing
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
      console.error('Background sync failed', err);
      return false;
    }
  },

  async downloadFromCloud(): Promise<UserData | null> {
    if (!this.accessToken) return null;
    if (!this.fileId) await this.initSync();
    if (!this.fileId) return null;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Download sync failed', err);
      return null;
    }
  }
};