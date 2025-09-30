import * as fs from 'fs/promises';
import * as path from 'path';
import ExifReader from 'exifreader';
import sharp from 'sharp';
import { PhotoMetadata, FolderScanResult, ScanProgress } from '../shared/types';

// Supported image file extensions
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif',
  '.webp', '.heic', '.heif', '.raw', '.cr2', '.nef', '.arw', '.dng'
];

// Type for BrowserWindow to avoid circular dependency with electron
interface MainWindow {
  webContents: {
    send(channel: string, ...args: any[]): void;
  };
}

export class FileSystemService {
  private thumbnailCache: Map<string, string> = new Map();
  private mainWindow: MainWindow | null = null;

  setMainWindow(window: MainWindow) {
    this.mainWindow = window;
  }

  /**
   * Send progress updates to renderer
   */
  private sendProgress(progress: ScanProgress) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('scan-progress', progress);
    }
  }

  /**
   * Check if a file is an image based on its extension
   */
  private isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  }

  /**
   * Extract EXIF data from an image file
   */
  private async extractExifData(filePath: string): Promise<PhotoMetadata['exifData']> {
    try {
      const buffer = await fs.readFile(filePath);
      const tags = ExifReader.load(buffer);

      // Extract date taken
      let dateTaken: Date | undefined;
      if (tags.DateTimeOriginal?.description) {
        dateTaken = new Date(tags.DateTimeOriginal.description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
      } else if (tags.DateTime?.description) {
        dateTaken = new Date(tags.DateTime.description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
      }

      // Extract GPS location
      let gpsLocation: { latitude: number; longitude: number } | undefined;
      if (tags.GPSLatitude && tags.GPSLongitude) {
        const lat = tags.GPSLatitude.description;
        const lon = tags.GPSLongitude.description;
        if (typeof lat === 'number' && typeof lon === 'number') {
          gpsLocation = { latitude: lat, longitude: lon };
        }
      }

      // Extract camera info
      let camera: string | undefined;
      if (tags.Make?.description && tags.Model?.description) {
        camera = `${tags.Make.description} ${tags.Model.description}`;
      }

      return {
        dateTaken,
        gpsLocation,
        camera,
      };
    } catch (error) {
      // EXIF extraction failed, return empty metadata
      console.warn(`Failed to extract EXIF from ${filePath}:`, error);
      return {};
    }
  }

  /**
   * Generate thumbnail for an image
   */
  async generateThumbnail(filePath: string, width: number = 200, height: number = 150): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `${filePath}-${width}x${height}`;
      if (this.thumbnailCache.has(cacheKey)) {
        return this.thumbnailCache.get(cacheKey)!;
      }

      // Generate thumbnail using sharp
      const thumbnail = await sharp(filePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Convert to base64 data URL
      const base64 = thumbnail.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Cache the thumbnail
      this.thumbnailCache.set(cacheKey, dataUrl);

      return dataUrl;
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get metadata for a single file
   */
  private async getFileMetadata(filePath: string): Promise<PhotoMetadata | null> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      if (!stats.isFile() || !this.isImageFile(filePath)) {
        return null;
      }

      // Extract EXIF data
      const exifData = await this.extractExifData(filePath);

      return {
        name: fileName,
        path: filePath,
        size: stats.size,
        modifiedDate: stats.mtime,
        exifData: {
          dateTaken: exifData?.dateTaken || stats.mtime, // Fallback to modified date
          gpsLocation: exifData?.gpsLocation,
          camera: exifData?.camera,
        }
      };
    } catch (error) {
      // Handle permission errors and other file access issues
      console.warn(`Cannot read file metadata: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Read directory contents and detect image files
   */
  async readDirectory(dirPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile() && this.isImageFile(fullPath)) {
          files.push(fullPath);
        } else if (entry.isDirectory()) {
          // Recursively scan subdirectories
          try {
            const subFiles = await this.readDirectory(fullPath);
            files.push(...subFiles);
          } catch (error) {
            // Skip directories with permission issues
            console.warn(`Cannot read subdirectory: ${fullPath}`, error);
          }
        }
      }

      return files;
    } catch (error) {
      throw new Error(`Cannot read directory ${dirPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Scan a folder for photos and return metadata with progress tracking
   */
  async scanPhotos(folderPath: string): Promise<FolderScanResult> {
    const result: FolderScanResult = {
      folderPath,
      photoCount: 0,
      photos: [],
      errors: []
    };

    try {
      // Verify folder exists and is accessible
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      // Send initial progress
      this.sendProgress({
        stage: 'scanning',
        current: 0,
        total: 0,
        currentFile: '',
        percentage: 0
      });

      // Get all image files in the directory tree
      const imagePaths = await this.readDirectory(folderPath);
      const totalFiles = imagePaths.length;

      // Send progress after scanning
      this.sendProgress({
        stage: 'scanning',
        current: 0,
        total: totalFiles,
        currentFile: '',
        percentage: 0
      });

      // Get metadata for each image file with progress updates
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];

        try {
          // Send progress update every 10 files or at least every 100ms
          if (i % 10 === 0 || i === imagePaths.length - 1) {
            this.sendProgress({
              stage: 'processing',
              current: i + 1,
              total: totalFiles,
              currentFile: path.basename(imagePath),
              percentage: Math.round(((i + 1) / totalFiles) * 100)
            });
          }

          // Validate file before processing
          const validation = await this.validateImageFile(imagePath);
          if (!validation.valid) {
            result.errors.push(`Skipping ${path.basename(imagePath)}: ${validation.error}`);
            continue;
          }

          const metadata = await this.getFileMetadata(imagePath);
          if (metadata) {
            result.photos.push(metadata);
            result.photoCount++;
          }
        } catch (error) {
          result.errors.push(`Error processing ${imagePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Send completion
      this.sendProgress({
        stage: 'complete',
        current: totalFiles,
        total: totalFiles,
        currentFile: '',
        percentage: 100
      });

      return result;
    } catch (error) {
      result.errors.push(`Error scanning folder: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Send error state
      this.sendProgress({
        stage: 'error',
        current: 0,
        total: 0,
        currentFile: '',
        percentage: 0
      });

      return result;
    }
  }

  /**
   * Validate file type and format
   */
  async validateImageFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      const exists = await this.checkAccess(filePath);
      if (!exists) {
        return { valid: false, error: 'File does not exist' };
      }

      // Check if it's a file (not directory)
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return { valid: false, error: 'Path is not a file' };
      }

      // Check file extension
      if (!this.isImageFile(filePath)) {
        return { valid: false, error: 'Not a supported image format' };
      }

      // Check file size (max 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (stats.size > maxSize) {
        return { valid: false, error: 'File size exceeds 100MB limit' };
      }

      // Try to read the file to verify it's accessible
      try {
        await fs.access(filePath, fs.constants.R_OK);
      } catch {
        return { valid: false, error: 'File is not readable (permission denied)' };
      }

      // Try to validate it's actually an image using sharp
      try {
        const metadata = await sharp(filePath).metadata();
        if (!metadata.width || !metadata.height) {
          return { valid: false, error: 'Invalid image file (corrupted or unsupported format)' };
        }
      } catch (error) {
        return { valid: false, error: 'Failed to read image data (corrupted file)' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if a path exists and is accessible
   */
  async checkAccess(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get platform-specific information
   */
  getPlatformInfo() {
    return {
      platform: process.platform,
      separator: path.sep,
      delimiter: path.delimiter,
    };
  }
}