const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Window controls
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),

  // Listen for app info updates
  onAppInfo: (callback) => ipcRenderer.on('app-info', callback),

  // Remove all listeners when component unmounts
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// Also expose some Node.js APIs that are safe to use
contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
});