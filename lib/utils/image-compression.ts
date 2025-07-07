// lib/utils/image-compression.ts

export interface ImageCompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    quality?: number;
    initialQuality?: number;
    alwaysKeepResolution?: boolean;
  }
  
  export interface ImageDimensions {
    width: number;
    height: number;
  }
  
  const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
    maxSizeMB: 0.8, // 800KB max
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: false, // Keep false for simplicity
    quality: 0.8,
    initialQuality: 0.9,
    alwaysKeepResolution: false,
  };
  
  /**
   * Get image dimensions from a file
   */
  export const getImageDimensions = (file: File): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  };
  
  /**
   * Create a thumbnail version of an image
   */
  export const createThumbnail = (
    file: File, 
    maxWidth: number = 300, 
    maxHeight: number = 300,
    quality: number = 0.7
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const { width: originalWidth, height: originalHeight } = img;
        const aspectRatio = originalWidth / originalHeight;
        
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (originalWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = newWidth / aspectRatio;
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          
          // Create new file with thumbnail suffix
          const originalName = file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
          const ext = originalName.substring(originalName.lastIndexOf('.'));
          const thumbnailName = `${nameWithoutExt}_thumb${ext}`;
          
          const thumbnailFile = new File([blob], thumbnailName, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          resolve(thumbnailFile);
        }, file.type, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
      img.src = URL.createObjectURL(file);
    });
  };
  
  /**
   * Compress an image file
   */
  export const compressImage = (
    file: File, 
    options: ImageCompressionOptions = {}
  ): Promise<File> => {
    const config = { ...DEFAULT_OPTIONS, ...options };
    
    return new Promise((resolve, reject) => {
      // If file is already small enough, return as-is
      if (file.size <= config.maxSizeMB * 1024 * 1024) {
        resolve(file);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      img.onload = () => {
        const { width: originalWidth, height: originalHeight } = img;
        
        // Calculate new dimensions
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (!config.alwaysKeepResolution) {
          const maxDimension = config.maxWidthOrHeight;
          
          if (originalWidth > maxDimension || originalHeight > maxDimension) {
            if (originalWidth > originalHeight) {
              newWidth = maxDimension;
              newHeight = (originalHeight * maxDimension) / originalWidth;
            } else {
              newHeight = maxDimension;
              newWidth = (originalWidth * maxDimension) / originalHeight;
            }
          }
        }
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Function to try compression with different quality levels
        const tryCompress = (quality: number): void => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            // If size is acceptable or quality is already very low, resolve
            if (blob.size <= config.maxSizeMB * 1024 * 1024 || quality <= 0.1) {
              resolve(compressedFile);
            } else {
              // Try with lower quality
              tryCompress(quality - 0.1);
            }
          }, file.type, quality);
        };
        
        // Start compression
        tryCompress(config.quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  };
  
  /**
   * Compress multiple images
   */
  export const compressImages = async (
    files: File[],
    options: ImageCompressionOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<File[]> => {
    const compressedFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const compressedFile = await compressImage(file, options);
        compressedFiles.push(compressedFile);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // Fallback to original file
        compressedFiles.push(file);
      }
      
      // Report progress
      if (onProgress) {
        const progress = ((i + 1) / files.length) * 100;
        onProgress(progress);
      }
    }
    
    return compressedFiles;
  };
  
  /**
   * Check if file type supports compression
   */
  export const supportsCompression = (file: File): boolean => {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    return supportedTypes.includes(file.type.toLowerCase());
  };
  
  /**
   * Get compression ratio as a percentage
   */
  export const getCompressionRatio = (originalSize: number, compressedSize: number): number => {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };
  
  /**
   * Format file size for display
   */
  export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };