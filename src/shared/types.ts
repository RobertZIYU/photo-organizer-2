// Shared types between main and renderer processes

export interface AIAnalysisData {
  classifications: Array<{ className: string; probability: number }>;
  objects: Array<{ class: string; score: number; bbox: number[] }>;
  isIndoor: boolean;
  isOutdoor: boolean;
  scene: string;
  tags: string[];
}

export interface PhotoMetadata {
  name: string;
  path: string;
  size: number;
  modifiedDate: Date;
  thumbnail?: string; // Base64 data URL
  exifData?: {
    dateTaken?: Date;
    gpsLocation?: {
      latitude: number;
      longitude: number;
    };
    camera?: string;
  };
  aiData?: AIAnalysisData;
}

export interface FolderScanResult {
  folderPath: string;
  photoCount: number;
  photos: PhotoMetadata[];
  errors: string[];
}

export interface ScanProgress {
  stage: 'scanning' | 'processing' | 'complete' | 'error';
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

export interface OrganizationResult {
  type: 'date' | 'location' | 'scene' | 'camera' | 'people' | 'custom';
  folderStructure: { [folderName: string]: PhotoMetadata[] };
}

export interface FileOperationOptions {
  createBackup?: boolean;
  copyInsteadOfMove?: boolean;
}

export interface FileOperationResult {
  success: boolean;
  totalFiles: number;
  movedFiles: number;
  errors: string[];
  backupPath?: string;
}

export interface IPCChannels {
  PING: 'ping';
  SELECT_FOLDER: 'select-folder';
  SCAN_PHOTOS: 'scan-photos';
  GENERATE_THUMBNAIL: 'generate-thumbnail';
  SCAN_PROGRESS: 'scan-progress';
  ANALYZE_PHOTOS: 'analyze-photos';
  AI_PROGRESS: 'ai-progress';
  ORGANIZE_PHOTOS: 'organize-photos';
  APPLY_ORGANIZATION: 'apply-organization';
  FILE_OP_PROGRESS: 'file-op-progress';
}

export const IPC_CHANNELS: IPCChannels = {
  PING: 'ping',
  SELECT_FOLDER: 'select-folder',
  SCAN_PHOTOS: 'scan-photos',
  GENERATE_THUMBNAIL: 'generate-thumbnail',
  SCAN_PROGRESS: 'scan-progress',
  ANALYZE_PHOTOS: 'analyze-photos',
  AI_PROGRESS: 'ai-progress',
  ORGANIZE_PHOTOS: 'organize-photos',
  APPLY_ORGANIZATION: 'apply-organization',
  FILE_OP_PROGRESS: 'file-op-progress',
};