import { PhotoMetadata, AIAnalysisData } from '../shared/types';

export interface OrganizationStrategy {
  type: 'date' | 'location' | 'scene' | 'camera' | 'people' | 'custom';
  folderStructure: { [folderName: string]: PhotoMetadata[] };
}

export class OrganizationEngine {
  /**
   * Organize photos based on natural language query
   */
  organizeByQuery(query: string, photos: PhotoMetadata[]): OrganizationStrategy {
    const lowerQuery = query.toLowerCase();

    // Detect organization intent from query
    if (this.isDateQuery(lowerQuery)) {
      return this.organizeByDate(photos, lowerQuery);
    } else if (this.isLocationQuery(lowerQuery)) {
      return this.organizeByLocation(photos);
    } else if (this.isSceneQuery(lowerQuery)) {
      return this.organizeByScene(photos);
    } else if (this.isCameraQuery(lowerQuery)) {
      return this.organizeByCamera(photos);
    } else if (this.isPeopleQuery(lowerQuery)) {
      return this.organizeByPeople(photos);
    } else {
      // Default: intelligent grouping based on AI analysis
      return this.organizeIntelligently(photos);
    }
  }

  /**
   * Detect if query is about date/time organization
   */
  private isDateQuery(query: string): boolean {
    const dateKeywords = [
      'date', 'time', 'year', 'month', 'day', 'when', 'chronological',
      'timeline', 'calendar', 'period', 'taken'
    ];
    return dateKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detect if query is about location
   */
  private isLocationQuery(query: string): boolean {
    const locationKeywords = [
      'location', 'place', 'where', 'gps', 'coordinates', 'geographic',
      'region', 'area', 'spot'
    ];
    return locationKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detect if query is about scene/content
   */
  private isSceneQuery(query: string): boolean {
    const sceneKeywords = [
      'scene', 'indoor', 'outdoor', 'beach', 'restaurant', 'park', 'home',
      'nature', 'city', 'event', 'what', 'content', 'type'
    ];
    return sceneKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detect if query is about camera/device
   */
  private isCameraQuery(query: string): boolean {
    const cameraKeywords = ['camera', 'device', 'phone', 'model', 'equipment'];
    return cameraKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Detect if query is about people
   */
  private isPeopleQuery(query: string): boolean {
    const peopleKeywords = ['people', 'person', 'face', 'who', 'portrait', 'selfie'];
    return peopleKeywords.some(keyword => query.includes(keyword));
  }

  /**
   * Organize photos by date
   */
  private organizeByDate(photos: PhotoMetadata[], query: string): OrganizationStrategy {
    const folders: { [key: string]: PhotoMetadata[] } = {};

    // Determine granularity (year, month, or day)
    const byYear = query.includes('year');
    const byMonth = query.includes('month') || !byYear;
    const byDay = query.includes('day') || query.includes('date');

    photos.forEach(photo => {
      const date = photo.exifData?.dateTaken
        ? new Date(photo.exifData.dateTaken)
        : new Date(photo.modifiedDate);

      let folderName: string;

      if (byDay) {
        folderName = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (byMonth) {
        folderName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        folderName = date.getFullYear().toString();
      }

      if (!folders[folderName]) {
        folders[folderName] = [];
      }
      folders[folderName].push(photo);
    });

    return {
      type: 'date',
      folderStructure: folders,
    };
  }

  /**
   * Organize photos by GPS location
   */
  private organizeByLocation(photos: PhotoMetadata[]): OrganizationStrategy {
    const folders: { [key: string]: PhotoMetadata[] } = {};

    photos.forEach(photo => {
      if (photo.exifData?.gpsLocation) {
        const { latitude, longitude } = photo.exifData.gpsLocation;
        // Round to 2 decimal places for grouping (~1km precision)
        const lat = latitude.toFixed(2);
        const lon = longitude.toFixed(2);
        const folderName = `Location_${lat}_${lon}`;

        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        folders[folderName].push(photo);
      } else {
        // Photos without GPS
        if (!folders['Unknown_Location']) {
          folders['Unknown_Location'] = [];
        }
        folders['Unknown_Location'].push(photo);
      }
    });

    return {
      type: 'location',
      folderStructure: folders,
    };
  }

  /**
   * Organize photos by scene type (using AI analysis)
   */
  private organizeByScene(photos: PhotoMetadata[]): OrganizationStrategy {
    const folders: { [key: string]: PhotoMetadata[] } = {};

    photos.forEach(photo => {
      const scene = photo.aiData?.scene || 'Unknown';

      if (!folders[scene]) {
        folders[scene] = [];
      }
      folders[scene].push(photo);
    });

    return {
      type: 'scene',
      folderStructure: folders,
    };
  }

  /**
   * Organize photos by camera model
   */
  private organizeByCamera(photos: PhotoMetadata[]): OrganizationStrategy {
    const folders: { [key: string]: PhotoMetadata[] } = {};

    photos.forEach(photo => {
      const camera = photo.exifData?.camera || 'Unknown_Camera';

      if (!folders[camera]) {
        folders[camera] = [];
      }
      folders[camera].push(photo);
    });

    return {
      type: 'camera',
      folderStructure: folders,
    };
  }

  /**
   * Organize photos by people (placeholder for face recognition)
   */
  private organizeByPeople(photos: PhotoMetadata[]): OrganizationStrategy {
    // For now, group by photos that likely contain people vs. don't
    const folders: { [key: string]: PhotoMetadata[] } = {
      'With_People': [],
      'Without_People': [],
    };

    photos.forEach(photo => {
      if (photo.aiData?.objects) {
        const hasPerson = photo.aiData.objects.some(obj => obj.class === 'person');
        if (hasPerson) {
          folders['With_People'].push(photo);
        } else {
          folders['Without_People'].push(photo);
        }
      } else {
        folders['Without_People'].push(photo);
      }
    });

    // Remove empty folders
    if (folders['With_People'].length === 0) delete folders['With_People'];
    if (folders['Without_People'].length === 0) delete folders['Without_People'];

    return {
      type: 'people',
      folderStructure: folders,
    };
  }

  /**
   * Intelligent organization based on AI analysis and metadata
   */
  private organizeIntelligently(photos: PhotoMetadata[]): OrganizationStrategy {
    // Use a combination of scene, date, and content analysis
    const folders: { [key: string]: PhotoMetadata[] } = {};

    // Group by scene primarily
    const sceneGroups = new Map<string, PhotoMetadata[]>();

    photos.forEach(photo => {
      const scene = photo.aiData?.scene || 'Miscellaneous';

      if (!sceneGroups.has(scene)) {
        sceneGroups.set(scene, []);
      }
      sceneGroups.get(scene)!.push(photo);
    });

    // For each scene, sub-group by month if there are many photos
    sceneGroups.forEach((scenePhotos, sceneName) => {
      if (scenePhotos.length > 10) {
        // Sub-group by month
        const monthGroups = new Map<string, PhotoMetadata[]>();

        scenePhotos.forEach(photo => {
          const date = photo.exifData?.dateTaken
            ? new Date(photo.exifData.dateTaken)
            : new Date(photo.modifiedDate);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (!monthGroups.has(monthKey)) {
            monthGroups.set(monthKey, []);
          }
          monthGroups.get(monthKey)!.push(photo);
        });

        // Create folders for each month
        monthGroups.forEach((monthPhotos, monthKey) => {
          const folderName = `${sceneName}_${monthKey}`;
          folders[folderName] = monthPhotos;
        });
      } else {
        // Just use scene name
        folders[sceneName] = scenePhotos;
      }
    });

    return {
      type: 'custom',
      folderStructure: folders,
    };
  }

  /**
   * Suggest organization strategies based on photo collection
   */
  suggestStrategies(photos: PhotoMetadata[]): string[] {
    const suggestions: string[] = [];

    // Check if photos have date info
    const hasDateInfo = photos.some(p => p.exifData?.dateTaken);
    if (hasDateInfo) {
      suggestions.push('Organize photos by date taken (year/month/day folder structure)');
    }

    // Check if photos have GPS
    const hasGPS = photos.some(p => p.exifData?.gpsLocation);
    if (hasGPS) {
      suggestions.push('Group photos by location based on GPS data');
    }

    // Check if photos have varied cameras
    const cameras = new Set(photos.map(p => p.exifData?.camera).filter(Boolean));
    if (cameras.size > 1) {
      suggestions.push('Separate photos by camera model');
    }

    // Check if AI analysis is available
    const hasAI = photos.some(p => p.aiData);
    if (hasAI) {
      suggestions.push('Group photos by scene type (indoor/outdoor, beach, park, etc.)');
      const hasPeople = photos.some(p =>
        p.aiData?.objects?.some(obj => obj.class === 'person')
      );
      if (hasPeople) {
        suggestions.push('Separate photos with people from scenery photos');
      }
    }

    // Always suggest intelligent grouping
    suggestions.push('Let AI intelligently group photos based on content and date');

    return suggestions;
  }
}
