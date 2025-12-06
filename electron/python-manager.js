const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PythonManager {
  constructor({ port, isDev }) {
    this.port = port;
    this.isDev = isDev;
    this.process = null;
  }

  /**
   * Start the Python Flask backend
   */
  async start() {
    const pythonPath = this.getPythonPath();
    const args = this.getArgs();

    const presentationRoot = require('path').join(require('os').homedir(), '.deckbot');

    console.log('[PythonManager] Starting Python backend');
    console.log('[PythonManager] Python path:', pythonPath);
    console.log('[PythonManager] Args:', args);
    console.log('[PythonManager] DECKBOT_PRESENTATION_ROOT:', presentationRoot);

    // Spawn Python Flask server
    this.process = spawn(pythonPath, args, {
      env: {
        ...process.env,
        FLASK_ENV: this.isDev ? 'development' : 'production',
        PYTHONUNBUFFERED: '1',
        // Point to user's home .deckbot folder for presentations
        DECKBOT_PRESENTATION_ROOT: require('path').join(require('os').homedir(), '.deckbot'),
      },
    });

    // Log output
    this.process.stdout.on('data', (data) => {
      console.log(`[Python] ${data.toString().trim()}`);
    });

    this.process.stderr.on('data', (data) => {
      console.error(`[Python Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      console.log(`[PythonManager] Python process exited with code ${code}`);
      this.process = null;
    });

    this.process.on('error', (err) => {
      console.error(`[PythonManager] Failed to start Python process:`, err);
    });

    // Wait for Flask to be ready
    await this.waitForReady();
  }

  /**
   * Get the path to the Python executable
   */
  getPythonPath() {
    if (this.isDev) {
      // Development: use system Python
      return process.platform === 'win32' ? 'python' : 'python3';
    } else {
      // Production: use bundled Python from PyInstaller
      const app = require('electron').app;
      const resourcesPath = process.resourcesPath;

      if (process.platform === 'win32') {
        return path.join(resourcesPath, 'python', 'deckbot.exe');
      } else if (process.platform === 'darwin') {
        return path.join(resourcesPath, 'python', 'deckbot');
      } else {
        throw new Error(`Unsupported platform: ${process.platform}`);
      }
    }
  }

  /**
   * Get command-line arguments for the Python process
   */
  getArgs() {
    if (this.isDev) {
      // Development: run via -m deckbot.cli
      return ['-m', 'deckbot.cli', '--web', '--port', this.port.toString()];
    } else {
      // Production: bundled executable handles entry point
      return ['--web', '--port', this.port.toString()];
    }
  }

  /**
   * Wait for Flask backend to be ready
   */
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    const axios = require('axios');

    console.log(`[PythonManager] Waiting for Flask to be ready on port ${this.port}...`);

    let lastError = null;
    let attemptCount = 0;

    while (Date.now() - startTime < timeout) {
      try {
        attemptCount++;
        // Use 127.0.0.1 instead of localhost to match Flask's binding
        const response = await axios.get(`http://127.0.0.1:${this.port}/api/presentations`, {
          timeout: 1000,
        });
        console.log('[PythonManager] Flask backend is ready');
        console.log('[PythonManager] Response status:', response.status);
        return;
      } catch (err) {
        lastError = err;
        // Flask not ready yet, wait and retry
        if (attemptCount % 10 === 0) {
          console.log(`[PythonManager] Still waiting... attempt ${attemptCount}, error: ${err.code || err.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const errorMsg = lastError ? ` Last error: ${lastError.code || lastError.message}` : '';
    throw new Error(`Flask backend failed to start within ${timeout}ms after ${attemptCount} attempts.${errorMsg} Port: ${this.port}`);
  }

  /**
   * Stop the Python process
   */
  async stop() {
    if (this.process) {
      console.log('[PythonManager] Stopping Python process');
      this.process.kill('SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force kill if still running
      if (this.process) {
        this.process.kill('SIGKILL');
      }

      this.process = null;
    }
  }
}

module.exports = PythonManager;
