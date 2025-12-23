
import { UserData } from '../types';

/**
 * Service to handle the File System Access API.
 * This allows the app to write directly to a user-selected file.
 */
export const SyncService = {
  // Store the file handle in a local variable for the session
  fileHandle: null as any,

  async requestFileHandle() {
    try {
      // @ts-ignore - showSaveFilePicker is a newer API
      this.fileHandle = await window.showSaveFilePicker({
        suggestedName: 'lunacycle_data.json',
        types: [{
          description: 'LunaCycle Data File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      return true;
    } catch (err) {
      console.error('File picker cancelled or failed', err);
      return false;
    }
  },

  async saveToFile(data: UserData) {
    if (!this.fileHandle) return false;
    
    try {
      const writable = await this.fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) {
      console.error('Failed to save to file', err);
      return false;
    }
  },

  isSupported() {
    return 'showSaveFilePicker' in window;
  }
};
