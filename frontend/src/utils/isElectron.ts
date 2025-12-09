/**
 * Detect if the app is running in Electron
 * Checks multiple indicators to be more reliable
 */
export function isElectron(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const win = window as any

  // Check for DeckBot Electron flag (set immediately by preload script)
  if (win.__DECKBOT_ELECTRON__ === true) {
    return true
  }

  // Check for electronAPI (exposed by preload script)
  if (typeof win.electronAPI !== 'undefined') {
    return true
  }

  // Check for Electron-specific user agent (most reliable fallback)
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) {
    return true
  }

  // Check for Electron in process (if available in renderer)
  if (typeof win.process !== 'undefined' && 
      win.process.versions && 
      win.process.versions.electron) {
    return true
  }

  return false
}

