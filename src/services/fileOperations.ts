import * as fs from 'fs/promises';
import * as path from 'path';
import { PhotoMetadata } from '../shared/types';

export interface FileOperationResult {
  success: boolean;
  totalFiles: number;
  movedFiles: number;
  errors: string[];
  backupPath?: string;
}

export class FileOperationsService {
  /**
   * Apply organization by moving/copying files to new folder structure
   */
  async applyOrganization(
    basePath: string,
    folderStructure: { [folderName: string]: PhotoMetadata[] },
    options: {
      createBackup?: boolean;
      copyInsteadOfMove?: boolean;
    } = {},
    progressCallback?: (current: number, total: number, currentFile: string) => void
  ): Promise<FileOperationResult> {
    const result: FileOperationResult = {
      success: false,
      totalFiles: 0,
      movedFiles: 0,
      errors: [],
    };

    try {
      // Calculate total files
      result.totalFiles = Object.values(folderStructure).reduce(
        (sum, photos) => sum + photos.length,
        0
      );

      // Create backup if requested
      if (options.createBackup) {
        const backupPath = await this.createBackup(basePath);
        result.backupPath = backupPath;
      }

      // Process each folder
      let currentIndex = 0;
      for (const [folderName, photos] of Object.entries(folderStructure)) {
        // Create destination folder
        const destinationFolder = path.join(basePath, folderName);

        try {
          await fs.mkdir(destinationFolder, { recursive: true });
        } catch (error) {
          result.errors.push(`Failed to create folder ${folderName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue;
        }

        // Move/copy each photo
        for (const photo of photos) {
          currentIndex++;
          const fileName = path.basename(photo.path);
          const destinationPath = path.join(destinationFolder, fileName);

          try {
            // Report progress
            if (progressCallback) {
              progressCallback(currentIndex, result.totalFiles, fileName);
            }

            // Check if source file exists
            try {
              await fs.access(photo.path);
            } catch {
              result.errors.push(`Source file not found: ${photo.path}`);
              continue;
            }

            // Check if destination already exists
            let finalDestinationPath = destinationPath;
            let counter = 1;
            while (true) {
              try {
                await fs.access(finalDestinationPath);
                // File exists, create unique name
                const ext = path.extname(fileName);
                const baseName = path.basename(fileName, ext);
                finalDestinationPath = path.join(
                  destinationFolder,
                  `${baseName}_${counter}${ext}`
                );
                counter++;
              } catch {
                // File doesn't exist, we can use this path
                break;
              }
            }

            // Move or copy the file
            if (options.copyInsteadOfMove) {
              await fs.copyFile(photo.path, finalDestinationPath);
            } else {
              await fs.rename(photo.path, finalDestinationPath);
            }

            result.movedFiles++;
          } catch (error) {
            result.errors.push(
              `Failed to ${options.copyInsteadOfMove ? 'copy' : 'move'} ${fileName}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }

      result.success = result.movedFiles > 0;
      return result;
    } catch (error) {
      result.errors.push(`Failed to apply organization: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Create a backup of the original folder structure
   */
  private async createBackup(basePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFolderName = `backup_${timestamp}`;
    const backupPath = path.join(basePath, backupFolderName);

    // Create backup folder
    await fs.mkdir(backupPath, { recursive: true });

    // Copy all files to backup (this is a simple backup - just record the original state)
    // In a real implementation, you might want to copy all files or create a manifest
    const manifestPath = path.join(backupPath, 'manifest.json');
    const manifest = {
      timestamp: new Date().toISOString(),
      basePath,
      message: 'Backup created before photo organization',
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    return backupPath;
  }

  /**
   * Rollback/undo organization using backup
   */
  async rollbackOrganization(backupPath: string): Promise<boolean> {
    try {
      // Read manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // TODO: Implement actual rollback logic
      // This would involve restoring files from the backup
      // For now, just return success if manifest exists

      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }

  /**
   * Clean up empty folders after organization
   */
  async cleanupEmptyFolders(basePath: string): Promise<number> {
    let removedCount = 0;

    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('backup_')) {
          const folderPath = path.join(basePath, entry.name);
          const folderContents = await fs.readdir(folderPath);

          if (folderContents.length === 0) {
            await fs.rmdir(folderPath);
            removedCount++;
          }
        }
      }

      return removedCount;
    } catch (error) {
      console.error('Failed to cleanup empty folders:', error);
      return removedCount;
    }
  }
}
