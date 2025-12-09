# Electron Build Process Documentation

## Overview

DeckBot uses a complex build pipeline involving frontend compilation, Python bundling, and Electron packaging. Understanding this process is critical to avoid hours-long debugging sessions when updates don't appear in the Electron app.

## Build Pipeline

```
Frontend Source (TypeScript/React)
    ↓ [Vite Build]
src/deckbot/static/dist/ (HTML, JS, CSS, assets)
    ↓ [PyInstaller Bundle]
electron/resources/python/_internal/deckbot/static/dist/
    ↓ [electron-builder]
dist/mac-arm64/DeckBot.app (Final macOS App)
```

## Critical Caching Issues

### Problem 1: Vite Cache
**Location:** `frontend/node_modules/.vite/`

Vite caches compiled modules for faster rebuilds. This cache can become stale and serve old JavaScript even after source changes.

**Solution:** Clear the cache before building:
```bash
rm -rf frontend/node_modules/.vite
```

### Problem 2: Python Bundle Static Files
**Location:** `electron/resources/python/_internal/deckbot/static/dist/`

PyInstaller bundles the Python application including all static files. When you rebuild the frontend, PyInstaller doesn't automatically pick up changes because it uses the cached bundle.

**Solution:** Delete the old static files from the Python bundle:
```bash
rm -rf electron/resources/python/_internal/deckbot/static/dist
```

### Problem 3: Electron App Bundle
**Location:** `dist/mac-arm64/DeckBot.app`

electron-builder packages the final app. It copies files from `electron/resources/`, so if those are stale, the app will be stale.

**Solution:** Always rebuild Python bundle before packaging with electron-builder.

## Complete Rebuild Process

### Quick Rebuild (Frontend Changes Only)

If you've only changed frontend code and want to test in dev mode:

```bash
npm run dev
```

### Full Electron Rebuild (Required for Distribution)

When you need to update the packaged Electron app:

```bash
# Use the automated script
npm run rebuild:electron:mac
```

Or manually:

```bash
# 1. Clear Vite cache
rm -rf frontend/node_modules/.vite

# 2. Rebuild frontend
cd frontend && npm run build && cd ..

# 3. Delete old Python bundle static files
rm -rf electron/resources/python/_internal/deckbot/static/dist

# 4. Rebuild Python bundle (includes static files)
npm run build:python

# 5. Package Electron app
npx electron-builder --mac --arm64
```

**Time estimate:** 3-5 minutes (PyInstaller bundling is slow)

### Linux Rebuild

```bash
npm run rebuild:electron:linux
```

### Windows Rebuild

```bash
npm run rebuild:electron:win
```

## Build Scripts Reference

All scripts are defined in `package.json`:

- `npm run dev` - Start development server (Flask backend + Vite frontend)
- `npm run build` - Build frontend only (output to src/deckbot/static/dist/)
- `npm run build:python` - Bundle Python app with PyInstaller
- `npm run build:electron:mac` - Package macOS Electron app (requires Python bundle)
- `npm run rebuild:electron:mac` - Full rebuild: clear cache + build frontend + rebuild Python + package Electron
- `npm run rebuild:electron:linux` - Full rebuild for Linux
- `npm run rebuild:electron:win` - Full rebuild for Windows
- `npm run clean:cache` - Clear all caches (Vite, Python bundle static files)

## Troubleshooting

### Electron app shows old content

**Symptoms:**
- Old tagline/text appears
- Old JavaScript file names in DevTools (e.g., `index-DeC91nVw.js` instead of `index-C67TdlZc.js`)
- Changes made hours ago don't appear

**Diagnosis:**
```bash
# Check what's actually in the Python bundle
ls -la electron/resources/python/_internal/deckbot/static/dist/assets/

# Check the frontend build output
ls -la src/deckbot/static/dist/assets/
```

Compare the file names. If they differ, the Python bundle has stale files.

**Fix:**
```bash
npm run rebuild:electron:mac
```

### "Module not found" errors in Electron app

**Cause:** PyInstaller didn't include all required Python modules.

**Fix:** Update `build/deckbot.spec` to include missing modules in `hiddenimports`.

### Build fails with "permission denied"

**Cause:** Old app bundle is open or locked.

**Fix:**
```bash
# Force kill the app
pkill -9 DeckBot

# Delete the old bundle
rm -rf dist/mac-arm64/DeckBot.app

# Rebuild
npm run rebuild:electron:mac
```

### Vite build succeeds but Electron still shows errors

**Cause:** Vite cache is serving stale modules.

**Fix:**
```bash
npm run clean:cache
npm run rebuild:electron:mac
```

## File Watching and Hot Reload

### Development Mode
In dev mode (`npm run dev`), changes to frontend files are hot-reloaded automatically. No rebuild needed.

### Electron Development
The Electron app loads `http://localhost:5173` in dev mode, so frontend changes are reflected immediately. Backend changes require restarting the Python process.

### Production Mode
The packaged Electron app has no hot reload. Every change requires a full rebuild using `npm run rebuild:electron:mac`.

## Best Practices

1. **Always use the automated scripts** (`rebuild:electron:mac`, etc.) instead of manual commands
2. **Test in dev mode first** before rebuilding Electron
3. **Check build output** in `src/deckbot/static/dist/` to confirm changes are there
4. **Clear cache when in doubt** using `npm run clean:cache`
5. **Don't assume the build worked** - always verify the app shows new content

## Architecture Notes

### Why PyInstaller?

PyInstaller bundles the entire Python application (Flask backend + dependencies + static files) into a single executable. This allows the Electron app to launch the backend without requiring users to install Python.

The PyInstaller bundle is ~2.1 GB because it includes:
- Python interpreter
- Flask and all dependencies
- Static frontend files (HTML, JS, CSS, images)
- Templates and default presentations

### Why electron-builder?

electron-builder packages the Electron frontend, Node.js runtime, and Python bundle into a distributable `.app` (macOS), `.exe` (Windows), or `.AppImage` (Linux).

### Static File Flow

1. Frontend source: `frontend/src/` (TypeScript, React, CSS)
2. Vite builds to: `src/deckbot/static/dist/` (HTML, JS, CSS, assets)
3. PyInstaller copies to: `electron/resources/python/_internal/deckbot/static/dist/`
4. electron-builder copies to: `DeckBot.app/Contents/Resources/python/_internal/deckbot/static/dist/`

The Flask backend serves files from `static/dist/`, which means the packaged app needs the final Vite output in the Python bundle.

## Time Estimates

- Frontend build: ~5-10 seconds
- PyInstaller bundle: ~2-3 minutes (bundling 2.1 GB)
- electron-builder packaging: ~30-60 seconds
- **Total rebuild time: ~3-5 minutes**

This is much better than the hours wasted debugging cache issues.
