// 📤 Media Upload Handler
// Handles file upload, drag-and-drop, and media processing

import { createLogger } from '../utils/Logger.js';
import { SUPPORTED_FORMATS, MEDIA_TYPES } from '../utils/Constants.js';

export class MediaUploader {
    constructor() {
        this.logger = createLogger('MediaUploader');
        this.onUploadCallback = null;
    }

    setUploadCallback(callback) {
        this.onUploadCallback = callback;
    }

    setupUploader(type, inputSelector, zoneSelector) {
        const input = document.querySelector(inputSelector);
        const zone = document.querySelector(zoneSelector);
        
        if (!input || !zone) {
            this.logger.warn(`Missing elements for ${type} uploader`);
            return;
        }

        // File input change
        input.addEventListener('change', (e) => {
            this.handleFileUpload(type, e.target.files);
        });

        // Drag and drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            this.handleFileUpload(type, e.dataTransfer.files);
        });

        this.logger.debug(`Setup uploader for ${type}`);
    }

    async handleFileUpload(type, files) {
        if (!files || files.length === 0) return;

        this.logger.info(`Processing ${files.length} files for ${type}`);
        
        const processedFiles = [];
        
        for (const file of files) {
            try {
                const mediaData = await this.processMediaFile(file);
                if (mediaData) {
                    processedFiles.push(mediaData);
                }
            } catch (error) {
                this.logger.error(`Failed to process file ${file.name}:`, error);
            }
        }

        if (processedFiles.length > 0 && this.onUploadCallback) {
            this.onUploadCallback(type, processedFiles);
        }
    }

    async processMediaFile(file) {
        return new Promise((resolve, reject) => {
            const mediaType = this.getMediaType(file);
            
            if (mediaType === MEDIA_TYPES.IMAGE) {
                this.processImageFile(file, resolve, reject);
            } else if (mediaType === MEDIA_TYPES.VIDEO) {
                this.processVideoFile(file, resolve, reject);
            } else {
                reject(new Error(`Unsupported file type: ${file.type}`));
            }
        });
    }

    processImageFile(file, resolve, reject) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const mediaData = {
                    name: file.name,
                    type: 'image',
                    mediaType: MEDIA_TYPES.IMAGE,
                    element: img,
                    image: img, // Keep for backward compatibility
                    dataUrl: e.target.result,
                    size: file.size,
                    dimensions: {
                        width: img.width,
                        height: img.height
                    }
                };
                
                this.logger.debug(`Processed image: ${file.name} (${img.width}x${img.height})`);
                resolve(mediaData);
            };
            
            img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
            img.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    }

    processVideoFile(file, resolve, reject) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const video = document.createElement('video');
            
            const handleVideoReady = () => {
                video.removeEventListener('loadedmetadata', handleVideoReady);
                
                const mediaData = {
                    name: file.name,
                    type: 'video',
                    mediaType: MEDIA_TYPES.VIDEO,
                    element: video,
                    video: video, // Keep for backward compatibility
                    dataUrl: e.target.result,
                    size: file.size,
                    dimensions: {
                        width: video.videoWidth || video.width,
                        height: video.videoHeight || video.height
                    }
                };
                
                // Setup video properties
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'metadata';
                
                this.logger.debug(`Processed video: ${file.name} (${mediaData.dimensions.width}x${mediaData.dimensions.height})`);
                resolve(mediaData);
            };
            
            video.addEventListener('loadedmetadata', handleVideoReady);
            video.onerror = () => reject(new Error(`Failed to load video: ${file.name}`));
            video.src = e.target.result;
        };
        
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    }

    getMediaType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (SUPPORTED_FORMATS.IMAGES.includes(extension)) {
            return extension === 'gif' ? MEDIA_TYPES.GIF : MEDIA_TYPES.IMAGE;
        } else if (SUPPORTED_FORMATS.VIDEOS.includes(extension)) {
            return MEDIA_TYPES.VIDEO;
        }
        
        // Fallback to MIME type check
        if (file.type.startsWith('image/')) {
            return file.type === 'image/gif' ? MEDIA_TYPES.GIF : MEDIA_TYPES.IMAGE;
        } else if (file.type.startsWith('video/')) {
            return MEDIA_TYPES.VIDEO;
        }
        
        return null;
    }

    isValidMediaFile(file) {
        return this.getMediaType(file) !== null;
    }
} 