const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script to safely expose IPC methods to the renderer process
 * This maintains security by using contextIsolation and only exposing
 * specific, safe methods to the frontend.
 */

// Set a flag immediately so Electron detection works reliably
contextBridge.exposeInMainWorld('__DECKBOT_ELECTRON__', true);

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

  /**
   * Show an open dialog (for folder/file selection)
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Dialog result
   */
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  /**
   * Open a presentation in a new window
   * @param {string} presentationName - Name of the presentation
   * @returns {Promise<Object>} Result with success flag
   */
  openPresentationWindow: (presentationName) => ipcRenderer.invoke('open-presentation-window', presentationName),

  /**
   * Open a new window with a specific route
   * @param {string} route - Route to load (e.g., '/' or '/presentation/MyDeck')
   * @returns {Promise<Object>} Result with success flag
   */
  openNewWindow: (route) => ipcRenderer.invoke('open-new-window', route),

  /**
   * Listen for menu actions from the native menu
   * @param {Function} callback - Callback function that receives the action name
   */
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },

  /**
   * Remove menu action listener
   */
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
});
