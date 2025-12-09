const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const PythonManager = require('./python-manager');
const { findAvailablePort, isPortInUse } = require('./port-finder');

let mainWindow = null;
let pythonManager = null;
let backendPort = null;
const windows = new Set(); // Track all open windows

// Setup logging to file
const logFile = '/tmp/deckbot-electron.log';
const logStream = fs.createWriteStream(logFile, { flags: 'w' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  logStream.write(`[LOG] ${new Date().toISOString()} ${msg}\n`);
  originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  logStream.write(`[ERROR] ${new Date().toISOString()} ${msg}\n`);
  originalConsoleError.apply(console, args);
};

/**
 * Get the base URL for the frontend
 */
function getFrontendURL() {
  if (app.isPackaged) {
    return `http://127.0.0.1:${backendPort}`;
  } else {
    // In dev mode, if backendPort is set (either started by us or detected existing),
    // use the Flask backend (which serves the built frontend).
    // Otherwise, use Vite dev server for hot reload development.
    if (backendPort) {
      return `http://127.0.0.1:${backendPort}`;
    } else {
      return 'http://localhost:5173';
    }
  }
}

/**
 * Create a new window (main window or presentation window)
 * @param {string} route - Route to load (e.g., '/' or '/presentation/MyDeck')
 * @param {Object} options - Window options
 */
async function createWindow(route = '/', options = {}) {
  // Start backend if not already started
  if (!pythonManager) {
    // In dev mode, check if backend is already running on port 5555
    if (!app.isPackaged) {
      const portInUse = await isPortInUse(5555);
      if (portInUse) {
        console.log('[Main] Backend already running on port 5555, using existing backend');
        backendPort = 5555;
        // Don't start a new backend, just use the existing one
        pythonManager = { port: backendPort }; // Dummy manager to track port
      } else {
        console.log('[Main] Starting backend...');
        backendPort = await findAvailablePort(5555);
        console.log('[Main] Backend port:', backendPort);

        pythonManager = new PythonManager({
          port: backendPort,
          isDev: true,
        });

        try {
          await pythonManager.start();
        } catch (error) {
          console.error('[Main] Failed to start Python backend:', error);
          dialog.showErrorBox(
            'Failed to Start Backend',
            `Could not start the DeckBot backend server:\n\n${error.message}\n\nPlease check the console for more details.`
          );
          app.quit();
          return null;
        }
      }
    } else {
      // Production mode: always start backend
      console.log('[Main] Starting backend...');
      backendPort = await findAvailablePort(5555);
      console.log('[Main] Backend port:', backendPort);

      pythonManager = new PythonManager({
        port: backendPort,
        isDev: false,
      });

      try {
        await pythonManager.start();
      } catch (error) {
        console.error('[Main] Failed to start Python backend:', error);
        dialog.showErrorBox(
          'Failed to Start Backend',
          `Could not start the DeckBot backend server:\n\n${error.message}\n\nPlease check the console for more details.`
        );
        app.quit();
        return null;
      }
    }
  }

  const frontendURL = getFrontendURL();
  const fullURL = `${frontendURL}${route}`;
  console.log('[Main] Creating window with URL:', fullURL);

  // Create browser window
  // Resolve preload path - works in both dev and production (ASAR)
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'electron', 'preload.js')
    : path.join(__dirname, 'preload.js');
  
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      cache: false, // Disable cache to prevent stale JS
    },
    icon: path.join(__dirname, '../assets/app-icon.png'),
    title: 'DeckBot',
    ...options,
  });

  // Clear cache before loading (force fresh content)
  window.webContents.session.clearCache().then(() => {
    console.log('[Main] Cache cleared');
  });

  // Load frontend
  window.loadURL(fullURL);

  // Open DevTools in development
  if (!app.isPackaged) {
    window.webContents.openDevTools();
  }

  // Track window
  windows.add(window);

  // Handle window close
  window.on('closed', () => {
    console.log('[Main] Window closed');
    windows.delete(window);
    if (window === mainWindow) {
      mainWindow = null;
    }
    // Refresh menu to update window list
    if (mainWindow) {
      createMenu();
    }
  });

  // Listen for title changes to update window list
  window.on('page-title-updated', () => {
    // Refresh menu when window title changes (e.g., when presentation is opened)
    if (mainWindow) {
      createMenu();
    }
  });

  // Refresh menu when window is focused (to update window list)
  window.on('focus', () => {
    if (mainWindow) {
      createMenu();
    }
  });

  // Set as main window if it's the first one
  if (!mainWindow) {
    mainWindow = window;
    createMenu();
  } else {
    // Refresh menu when new window is added
    createMenu();
  }

  return window;
}

/**
 * Open a presentation in a new window
 * @param {string} presentationName - Name of the presentation to open
 */
async function openPresentationWindow(presentationName) {
  const route = `/presentation/${encodeURIComponent(presentationName)}`;
  return createWindow(route);
}

/**
 * Build window list for Window menu
 */
function buildWindowList() {
  const windowItems = [];
  
  if (windows.size > 0) {
    let index = 1;
    windows.forEach((window) => {
      const title = window.getTitle() || `Window ${index}`;
      windowItems.push({
        label: title,
        click: () => {
          if (window.isMinimized()) window.restore();
          window.focus();
        },
      });
      index++;
    });
  }
  
  return windowItems;
}

/**
 * Create the application menu
 */
function createMenu() {
  const template = [
    {
      label: 'DeckBot',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', 'preferences');
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Presentation...',
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            // Open new window for creating presentation
            const newWindow = await createWindow('/');
            // Once window loads, trigger the create modal
            if (newWindow) {
              newWindow.webContents.once('did-finish-load', () => {
                newWindow.webContents.send('menu-action', 'new-presentation');
              });
            }
          },
        },
        {
          label: 'Open Presentation...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            // Always open a new window for opening presentation
            const newWindow = await createWindow('/');
            if (newWindow) {
              newWindow.webContents.once('did-finish-load', () => {
                newWindow.webContents.send('menu-action', 'open-presentation');
              });
            }
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Preview',
          accelerator: 'CmdOrCtrl+1',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', 'view-preview');
            }
          },
        },
        {
          label: 'Code',
          accelerator: 'CmdOrCtrl+2',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', 'view-code');
            }
          },
        },
        {
          label: 'Layouts',
          accelerator: 'CmdOrCtrl+3',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', 'view-layouts');
            }
          },
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+4',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', 'view-settings');
            }
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        ...buildWindowList(),
        ...(buildWindowList().length > 0 ? [{ type: 'separator' }] : []),
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { type: 'separator' },
          { role: 'close' },
        ]),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle events

app.whenReady().then(() => {
  console.log('[Main] App is ready');
  createWindow();
});

// Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  console.log('[Main] All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate window when dock icon clicked (macOS)
app.on('activate', () => {
  console.log('[Main] App activated');
  if (windows.size === 0) {
    createWindow('/');
  }
});

// Cleanup on quit
app.on('before-quit', async () => {
  console.log('[Main] App quitting, cleaning up...');
  if (pythonManager && pythonManager.stop) {
    await pythonManager.stop();
  }
});

// IPC handlers

ipcMain.handle('get-backend-url', () => {
  return `http://localhost:${backendPort}`;
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return dialog.showSaveDialog(window || mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  return dialog.showOpenDialog(window || mainWindow, options);
});

ipcMain.handle('open-presentation-window', async (event, presentationName) => {
  console.log('[Main] Opening presentation window:', presentationName);
  const window = await openPresentationWindow(presentationName);
  return window ? { success: true } : { success: false };
});

ipcMain.handle('open-new-window', async (event, route = '/') => {
  console.log('[Main] Opening new window with route:', route);
  const window = await createWindow(route);
  return window ? { success: true } : { success: false };
});
