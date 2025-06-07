// 🔄 Image Cycling Module
// Handles automatic cycling through uploaded images

export class ImageCycler {
    constructor(imageManager) {
        this.imageManager = imageManager;
        this.cycleIntervals = {
            background: 2000,  // 2 seconds default
            foreground: 2000,  // 2 seconds default
            people: 2000       // 2 seconds default
        };
        
        this.timers = {
            background: null,
            foreground: null,
            people: null
        };
        
        this.isEnabled = {
            background: false,
            foreground: false,
            people: false
        };
        
        this.currentIndices = {
            background: 0,
            foreground: 0,
            people: 0
        };
    }

    // Start cycling for a specific image type
    startCycling(type) {
        if (!['background', 'foreground', 'people'].includes(type)) {
            console.warn(`Invalid image type for cycling: ${type}`);
            return;
        }

        const imageCount = this.imageManager.getImageCount(type);
        if (imageCount < 2) {
            console.log(`Not enough ${type} images to cycle (need at least 2)`);
            return;
        }

        console.log(`🔄 Starting ${type} image cycling every ${this.cycleIntervals[type]}ms`);
        this.isEnabled[type] = true;
        this.currentIndices[type] = this.imageManager.selectedImages[type];

        // Clear existing timer
        this.stopCycling(type);

        // Start new timer
        this.timers[type] = setInterval(() => {
            this.cycleToNextImage(type);
        }, this.cycleIntervals[type]);
    }

    // Stop cycling for a specific image type
    stopCycling(type) {
        if (this.timers[type]) {
            clearInterval(this.timers[type]);
            this.timers[type] = null;
        }
        this.isEnabled[type] = false;
        console.log(`⏹️ Stopped ${type} image cycling`);
    }

    // Cycle to the next image
    cycleToNextImage(type) {
        const imageCount = this.imageManager.getImageCount(type);
        if (imageCount < 2) {
            this.stopCycling(type);
            return;
        }

        // Move to next image
        this.currentIndices[type] = (this.currentIndices[type] + 1) % imageCount;
        
        // Update the image manager selection
        this.imageManager.selectImage(type, this.currentIndices[type]);
        
        console.log(`🔄 Cycled ${type} to image ${this.currentIndices[type] + 1}/${imageCount}`);
        
        // Trigger callback if set (for redrawing when videos are cycled)
        if (this.onCycleCallback) {
            this.onCycleCallback(type);
        }
    }

    // Set callback for when images are cycled
    setCycleCallback(callback) {
        this.onCycleCallback = callback;
    }

    // Set cycling interval for a specific type
    setCycleInterval(type, milliseconds) {
        if (!['background', 'foreground', 'people'].includes(type)) {
            console.warn(`Invalid image type: ${type}`);
            return;
        }

        this.cycleIntervals[type] = Math.max(500, milliseconds); // Minimum 500ms
        console.log(`⏰ Set ${type} cycling interval to ${this.cycleIntervals[type]}ms`);

        // Restart cycling with new interval if currently active
        if (this.isEnabled[type]) {
            this.startCycling(type);
        }
    }

    // Toggle cycling for a specific type
    toggleCycling(type) {
        if (this.isEnabled[type]) {
            this.stopCycling(type);
        } else {
            this.startCycling(type);
        }
        return this.isEnabled[type];
    }

    // Stop all cycling
    stopAllCycling() {
        ['background', 'foreground', 'people'].forEach(type => {
            this.stopCycling(type);
        });
    }

    // Start cycling for all types that have enough images
    startAllCycling() {
        ['background', 'foreground', 'people'].forEach(type => {
            if (this.imageManager.getImageCount(type) >= 2) {
                this.startCycling(type);
            }
        });
    }

    // Get current cycling status
    getStatus() {
        return {
            enabled: { ...this.isEnabled },
            intervals: { ...this.cycleIntervals },
            indices: { ...this.currentIndices },
            imageCounts: {
                background: this.imageManager.getImageCount('background'),
                foreground: this.imageManager.getImageCount('foreground'),
                people: this.imageManager.getImageCount('people')
            }
        };
    }

    // Update cycling when images are added/removed
    onImagesChanged(type) {
        const imageCount = this.imageManager.getImageCount(type);
        
        if (imageCount < 2 && this.isEnabled[type]) {
            // Stop cycling if not enough images
            this.stopCycling(type);
        } else if (imageCount >= 2 && !this.isEnabled[type]) {
            // Could auto-start cycling here if desired
            console.log(`📸 ${type} now has ${imageCount} images - cycling can be enabled`);
        }
        
        // Reset index if it's out of bounds
        if (this.currentIndices[type] >= imageCount) {
            this.currentIndices[type] = 0;
        }
    }

    // Get cycling interval for a type
    getCycleInterval(type) {
        return this.cycleIntervals[type];
    }

    // Check if cycling is enabled for a type
    isCyclingEnabled(type) {
        return this.isEnabled[type];
    }
} 