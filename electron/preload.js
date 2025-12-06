const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script to safely expose IPC methods to the renderer process
 * This maintains security by using contextIsolation and only exposing
 * specific, safe methods to the frontend.
 */

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Get the backend API URL
   * @returns {Promise<string>} Backend URL (e.g., "http://localhost:5555")
   */
  getBackendURL: () => ipcRenderer.invoke('get-backend-url'),

  /**
   * Open a URL in the system's default browser
   * @param {string} url - URL to open
   */
  openExternal: (url) => ipcRenderer.send('open-external', url),

  /**
   * Show a save dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Dialog result
   */
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
});
