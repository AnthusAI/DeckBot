const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const PythonManager = require('./python-manager');
const { findAvailablePort } = require('./port-finder');

let mainWindow = null;
let pythonManager = null;
let backendPort = null;

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
 * Create the main application window
 */
async function createWindow() {
  console.log('[Main] Creating window...');
  console.log('[Main] Is packaged:', app.isPackaged);

  // Find available port for Flask
  backendPort = await findAvailablePort(5555);
  console.log('[Main] Backend port:', backendPort);

  // Start Python Flask backend
  pythonManager = new PythonManager({
    port: backendPort,
    isDev: !app.isPackaged,
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
    return;
  }

  // Create browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/deckbot-logo.png'),
    title: 'DeckBot',
  });

  // Load frontend
  if (app.isPackaged) {
    // Production: load from Flask backend (which serves the static files correctly)
    const frontendURL = `http://127.0.0.1:${backendPort}`;
    console.log('[Main] Loading frontend from Flask backend:', frontendURL);
    mainWindow.loadURL(frontendURL);
  } else {
    // Development: load from Vite dev server
    console.log('[Main] Loading from Vite dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
  }

  // Open DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window close
  mainWindow.on('closed', () => {
    console.log('[Main] Window closed');
    mainWindow = null;
  });

  // Create application menu
  createMenu();
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
        { role: 'quit' },
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
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
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
  if (mainWindow === null) {
    createWindow();
  }
});

// Cleanup on quit
app.on('before-quit', async () => {
  console.log('[Main] App quitting, cleaning up...');
  if (pythonManager) {
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
  return dialog.showSaveDialog(mainWindow, options);
});
