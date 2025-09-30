import { contextBridge, ipcRenderer } from 'electron';

// Inline IPC channel constants to avoid module import issues in preload
const IPC_CHANNELS = {
  PING: 'ping',
  SELECT_FOLDER: 'select-folder',
  SCAN_PHOTOS: 'scan-photos',
  GENERATE_THUMBNAIL: 'generate-thumbnail',
  SCAN_PROGRESS: 'scan-progress',
  ANALYZE_PHOTOS: 'analyze-photos',
  AI_PROGRESS: 'ai-progress',
  ORGANIZE_PHOTOS: 'organize-photos',
} as const;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic IPC test functions
  ping: () => ipcRenderer.invoke(IPC_CHANNELS.PING),
  echo: (data: any) => ipcRenderer.invoke('echo', data),
  testError: () => ipcRenderer.invoke('test-error'),
  testMainToRenderer: () => ipcRenderer.invoke('test-main-to-renderer'),

  // Renderer listeners for main process messages
  onMainMessage: (callback: (message: string) => void) => {
    ipcRenderer.on('main-message', (event, message) => callback(message));
  },

  // Progress listeners
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, (event, progress) => callback(progress));
  },
  onAIProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on(IPC_CHANNELS.AI_PROGRESS, (event, progress) => callback(progress));
  },

  // File system operations
  selectFolder: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER),
  scanPhotos: (folderPath: string) => ipcRenderer.invoke(IPC_CHANNELS.SCAN_PHOTOS, folderPath),
  generateThumbnail: (filePath: string, width?: number, height?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.GENERATE_THUMBNAIL, filePath, width, height),
  testFileAccess: (filePath: string) => ipcRenderer.invoke('test-file-access', filePath),
  getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),

  // AI operations
  analyzePhotos: (photoPaths: string[]) => ipcRenderer.invoke(IPC_CHANNELS.ANALYZE_PHOTOS, photoPaths),
  organizePhotos: (query: string, photos: any[]) => ipcRenderer.invoke(IPC_CHANNELS.ORGANIZE_PHOTOS, query, photos),

  // Platform info
  platform: process.platform,
});