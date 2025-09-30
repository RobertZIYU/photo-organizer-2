import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { IPC_CHANNELS } from './shared/types';
import { FileSystemService } from './services/fileSystem';
import { AIProcessingService } from './services/aiProcessing';
import { OrganizationEngine } from './services/organizationEngine';

// Declare webpack entry points
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow | null = null;

// Initialize services
const fileSystemService = new FileSystemService();
const aiProcessingService = new AIProcessingService();
const organizationEngine = new OrganizationEngine();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Load the React app
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    setupFileSystemService();
    initializeAI();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set main window reference after window is created
function setupFileSystemService() {
  if (mainWindow) {
    fileSystemService.setMainWindow(mainWindow);
  }
}

// Initialize AI models on startup
async function initializeAI() {
  try {
    console.log('Initializing AI models...');
    await aiProcessingService.initialize();
    console.log('AI models ready');
  } catch (error) {
    console.error('Failed to initialize AI models:', error);
  }
}

// Basic ping/pong test
ipcMain.handle(IPC_CHANNELS.PING, async () => {
  return 'pong';
});

// Send message from main to renderer (for testing)
ipcMain.handle('test-main-to-renderer', async () => {
  if (mainWindow) {
    mainWindow.webContents.send('main-message', 'Hello from main process!');
    return 'Message sent to renderer';
  }
  throw new Error('Main window not available');
});

// Error handling test
ipcMain.handle('test-error', async () => {
  throw new Error('Intentional test error');
});

// Echo test with data
ipcMain.handle('echo', async (event, data: any) => {
  return { echoed: data, timestamp: new Date().toISOString() };
});

// File system operations
ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async () => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Photo Folder'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  } catch (error) {
    throw new Error(`Failed to open folder dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

ipcMain.handle(IPC_CHANNELS.SCAN_PHOTOS, async (event, folderPath: string) => {
  try {
    const result = await fileSystemService.scanPhotos(folderPath);
    return result;
  } catch (error) {
    throw new Error(`Failed to scan photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Additional file system test handlers
ipcMain.handle('test-file-access', async (event, filePath: string) => {
  try {
    const canAccess = await fileSystemService.checkAccess(filePath);
    return { path: filePath, accessible: canAccess };
  } catch (error) {
    throw new Error(`Access test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

ipcMain.handle('get-platform-info', async () => {
  return fileSystemService.getPlatformInfo();
});

ipcMain.handle(IPC_CHANNELS.GENERATE_THUMBNAIL, async (event, filePath: string, width?: number, height?: number) => {
  try {
    return await fileSystemService.generateThumbnail(filePath, width, height);
  } catch (error) {
    throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// AI processing operations
ipcMain.handle(IPC_CHANNELS.ANALYZE_PHOTOS, async (event, photoPaths: string[]) => {
  try {
    if (!aiProcessingService.isReady()) {
      throw new Error('AI models not initialized yet');
    }

    const results = await aiProcessingService.analyzeImages(photoPaths, (current, total) => {
      // Send progress updates
      if (mainWindow) {
        mainWindow.webContents.send(IPC_CHANNELS.AI_PROGRESS, {
          stage: 'analyzing',
          current,
          total,
          percentage: Math.round((current / total) * 100),
        });
      }
    });

    // Convert Map to plain object for IPC
    const resultsObject: { [key: string]: any } = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    return resultsObject;
  } catch (error) {
    throw new Error(`Failed to analyze photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Organization operations
ipcMain.handle(IPC_CHANNELS.ORGANIZE_PHOTOS, async (event, query: string, photos: any[]) => {
  try {
    console.log(`Organizing ${photos.length} photos with query: "${query}"`);

    // Use organization engine to process the query and photos
    const organizationResult = organizationEngine.organizeByQuery(query, photos);

    console.log(`Organization complete: ${Object.keys(organizationResult.folderStructure).length} folders created`);

    return organizationResult;
  } catch (error) {
    console.error('Failed to organize photos:', error);
    throw new Error(`Failed to organize photos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});