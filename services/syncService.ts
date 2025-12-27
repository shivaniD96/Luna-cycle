
import { UserData } from '../types';

// IMPORTANT: Replace this with your actual Client ID from Google Cloud Console
// Ensure your 'Authorized JavaScript Origins' matches your deployment URL.
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; 
const BACKUP_FILENAME = 'luna_private_vault.json';

/**
 * Luna Automatic Sync Engine
 * Uses Google Drive AppData folder to silently sync data across devices.
 */
export const SyncService = {
  accessToken: null as string | null,
  fileId: null as string | null,

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

  /**
   * Universal trigger for Google Identity Services flow
   */
  async triggerLogin(onSuccess: (token: string) => void, onError?: () => void) {
    try {
      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.appdata email profile',
        callback: (response: any) => {
          if (response.access_token) {
            onSuccess(response.access_token);
          } else if (onError) {
            onError();
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("Auth initialization failed", e);
      if (onError) onError();
    }
  },

  async initSync() {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'`,
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

  async saveToCloud(userData: UserData) {
    if (!this.accessToken) return false;

    try {
      if (!this.fileId) {
        const found = await this.initSync();
        if (!found) {
          const metadata = {
            name: BACKUP_FILENAME,
            parents: ['appDataFolder']
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

      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      return true;
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
