import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as fs from 'fs/promises';
import sharp from 'sharp';

export interface ImageAnalysisResult {
  classifications: Array<{ className: string; probability: number }>;
  objects: Array<{ class: string; score: number; bbox: number[] }>;
  isIndoor: boolean;
  isOutdoor: boolean;
  scene: string;
  tags: string[];
}

export class AIProcessingService {
  private mobileNetModel: mobilenet.MobileNet | null = null;
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  /**
   * Initialize AI models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing AI models...');

      // Load MobileNet for image classification
      this.mobileNetModel = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      });
      console.log('MobileNet model loaded');

      // Load COCO-SSD for object detection
      this.cocoSsdModel = await cocoSsd.load();
      console.log('COCO-SSD model loaded');

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI models:', error);
      throw error;
    }
  }

  /**
   * Check if models are initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.mobileNetModel !== null && this.cocoSsdModel !== null;
  }

  /**
   * Analyze a single image
   */
  async analyzeImage(imagePath: string): Promise<ImageAnalysisResult> {
    if (!this.isReady()) {
      await this.initialize();
    }

    try {
      // Load and preprocess image
      const imageBuffer = await fs.readFile(imagePath);
      const processedImage = await sharp(imageBuffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer();

      // Convert to tensor
      const imageTensor = tf.tensor3d(
        new Uint8Array(processedImage),
        [224, 224, 3]
      ).expandDims(0);

      // Run MobileNet classification
      const classifications = await this.mobileNetModel!.classify(imageTensor as any);

      // Convert to RGB for COCO-SSD
      const rgbImage = await sharp(imageBuffer)
        .resize(640, 480)
        .removeAlpha()
        .toBuffer();

      const cocoTensor = tf.node.decodeImage(rgbImage, 3);

      // Run COCO-SSD object detection
      const objects = await this.cocoSsdModel!.detect(cocoTensor as any);

      // Clean up tensors
      imageTensor.dispose();
      cocoTensor.dispose();

      // Analyze results to determine scene type
      const { isIndoor, isOutdoor, scene, tags } = this.analyzeClassifications(
        classifications,
        objects
      );

      return {
        classifications,
        objects,
        isIndoor,
        isOutdoor,
        scene,
        tags,
      };
    } catch (error) {
      console.error(`Failed to analyze image ${imagePath}:`, error);
      throw error;
    }
  }

  /**
   * Analyze classifications and objects to determine scene type
   */
  private analyzeClassifications(
    classifications: Array<{ className: string; probability: number }>,
    objects: Array<{ class: string; score: number; bbox: number[] }>
  ): { isIndoor: boolean; isOutdoor: boolean; scene: string; tags: string[] } {
    const tags: string[] = [];
    let isIndoor = false;
    let isOutdoor = false;
    let scene = 'Unknown';

    // Indoor indicators
    const indoorKeywords = [
      'indoor', 'room', 'furniture', 'table', 'chair', 'couch', 'bed',
      'kitchen', 'bathroom', 'living', 'office', 'restaurant', 'store',
      'building', 'ceiling', 'wall', 'floor', 'lamp', 'tv', 'computer'
    ];

    // Outdoor indicators
    const outdoorKeywords = [
      'outdoor', 'landscape', 'mountain', 'beach', 'ocean', 'sea', 'sky',
      'tree', 'grass', 'park', 'garden', 'street', 'road', 'car', 'bicycle',
      'building', 'nature', 'forest', 'field', 'sunset', 'sunrise'
    ];

    // Scene categories
    const sceneCategories: { [key: string]: string[] } = {
      'Beach': ['beach', 'ocean', 'sea', 'sand', 'water', 'wave', 'surfboard'],
      'Restaurant': ['restaurant', 'dining', 'food', 'table', 'chair', 'plate', 'wine'],
      'Home': ['living room', 'bedroom', 'kitchen', 'house', 'couch', 'bed', 'home'],
      'Park': ['park', 'grass', 'tree', 'bench', 'playground', 'garden'],
      'City': ['street', 'building', 'car', 'traffic', 'urban', 'city'],
      'Nature': ['mountain', 'forest', 'lake', 'river', 'tree', 'landscape', 'nature'],
      'Event': ['party', 'celebration', 'crowd', 'stage', 'concert'],
    };

    // Combine classifications and object detections
    const allLabels = [
      ...classifications.map(c => c.className.toLowerCase()),
      ...objects.map(o => o.class.toLowerCase()),
    ];

    // Determine indoor/outdoor
    allLabels.forEach(label => {
      if (indoorKeywords.some(keyword => label.includes(keyword))) {
        isIndoor = true;
      }
      if (outdoorKeywords.some(keyword => label.includes(keyword))) {
        isOutdoor = true;
      }
    });

    // Determine scene category
    let maxScore = 0;
    Object.entries(sceneCategories).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (allLabels.some(label => label.includes(keyword))) {
          score++;
        }
      });
      if (score > maxScore) {
        maxScore = score;
        scene = category;
      }
    });

    // Extract relevant tags (top classifications and detected objects)
    tags.push(
      ...classifications.slice(0, 3).map(c => c.className),
      ...objects.slice(0, 5).map(o => o.class)
    );

    return {
      isIndoor,
      isOutdoor,
      scene: maxScore > 0 ? scene : 'Unknown',
      tags: [...new Set(tags)], // Remove duplicates
    };
  }

  /**
   * Batch analyze multiple images
   */
  async analyzeImages(
    imagePaths: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, ImageAnalysisResult>> {
    const results = new Map<string, ImageAnalysisResult>();

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      try {
        const result = await this.analyzeImage(imagePath);
        results.set(imagePath, result);

        if (onProgress) {
          onProgress(i + 1, imagePaths.length);
        }
      } catch (error) {
        console.error(`Failed to analyze ${imagePath}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.mobileNetModel) {
      this.mobileNetModel = null;
    }
    if (this.cocoSsdModel) {
      this.cocoSsdModel = null;
    }
    this.isInitialized = false;
  }
}