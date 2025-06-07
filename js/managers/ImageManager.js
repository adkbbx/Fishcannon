// 📷 Image Management Module
// Handles image upload, storage, and display

export class ImageManager {
    constructor() {
        this.images = {
            background: [],
            foreground: [],
            people: []
        };
        
        this.selectedImages = {
            background: 0,
            foreground: 0,
            people: 0
        };
        
        this.fishSprites = {
            closedMouth: null,
            openMouth: null,
            loaded: false
        };
        
        this.onImageUpdateCallback = null;
        
        // Setup event delegation for delete buttons
        this.setupDeleteButtonHandling();
    }

    async init() {
        await this.loadFishSprites();
        await this.loadPresetImages();
        this.setupImageUploaders();
        
        // Try to enable video autoplay as soon as possible
        this.setupVideoAutoplay();
    }

    setupDeleteButtonHandling() {
        // Use event delegation on document to handle delete button clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn-corner')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const type = e.target.dataset.type;
                const index = parseInt(e.target.dataset.index);
                
                console.log(`🗑️ Delete button clicked for ${type} image ${index}`);
                this.deleteImage(type, index);
                
                return false;
            }
        });
    }

    async loadFishSprites() {
        console.log('🐟 Loading fish sprites...');
        
        try {
            // Load closed mouth sprite
            this.fishSprites.closedMouth = new Image();
            this.fishSprites.closedMouth.src = 'assets/Fish_Close_Mouth.png';
            
            // Load open mouth sprite
            this.fishSprites.openMouth = new Image();
            this.fishSprites.openMouth.src = 'assets/Fish_Open_Mouth.png';
            
            // Wait for both images to load
            await Promise.all([
                new Promise((resolve, reject) => {
                    this.fishSprites.closedMouth.onload = resolve;
                    this.fishSprites.closedMouth.onerror = reject;
                }),
                new Promise((resolve, reject) => {
                    this.fishSprites.openMouth.onload = resolve;
                    this.fishSprites.openMouth.onerror = reject;
                })
            ]);
            
            this.fishSprites.loaded = true;
            console.log('✅ Fish sprites loaded successfully!');
            
            // Trigger redraw if callback is set
            if (this.onImageUpdateCallback) {
                this.onImageUpdateCallback();
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load fish sprites, using fallback emoji:', error);
            this.fishSprites.loaded = false;
        }
    }

    async loadPresetImages() {
        console.log('🎨 Loading preset images...');
        
        try {
            // Load background preset
            await this.loadPresetImage('background', 'assets/Background.png', 'Background Preset');
            
            // Load foreground preset
            await this.loadPresetImage('foreground', 'assets/foreground.png', 'Foreground Preset');
            
            console.log('✅ Preset images loaded successfully!');
            
            // Update displays
            this.updateImageDisplay('background');
            this.updateImageDisplay('foreground');
            
        } catch (error) {
            console.warn('⚠️ Some preset images could not be loaded:', error);
        }
    }

    async loadPresetImage(type, url, name) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // Create canvas to get data URL
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = {
                    name: name,
                    type: 'image',
                    mediaType: 'image',
                    element: img,
                    image: img, // Keep for backward compatibility
                    dataUrl: canvas.toDataURL('image/png'),
                    size: 0, // We don't have file size for presets
                    dimensions: {
                        width: img.width,
                        height: img.height
                    }
                };
                
                this.images[type].push(imageData);
                console.log(`✅ Loaded preset: ${name}`);
                resolve(imageData);
            };
            
            img.onerror = () => {
                console.warn(`⚠️ Could not load preset image: ${url}`);
                reject(new Error(`Failed to load ${name}`));
            };
            
            // Add timestamp to avoid caching issues
            img.src = `${url}?t=${Date.now()}`;
        });
    }

    setupImageUploaders() {
        console.log('📷 Setting up image uploaders...');
        
        // Setup all image uploaders
        this.setupUploader('people', '#peopleInput', '#peopleUpload', '#peopleImages');
        this.setupUploader('background', '#backgroundInput', '#backgroundUpload', '#backgroundImages');
        this.setupUploader('foreground', '#foregroundInput', '#foregroundUpload', '#foregroundImages');
        
        // Setup tab functionality
        this.setupUploadTabs();
    }

    setupUploader(type, inputSelector, zoneSelector, displaySelector) {
        const input = document.querySelector(inputSelector);
        const zone = document.querySelector(zoneSelector);
        const display = document.querySelector(displaySelector);
        
        if (!input || !zone || !display) {
            console.warn(`Missing elements for ${type} uploader`);
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

        zone.addEventListener('click', (e) => {
            // Don't trigger file input if clicking on uploaded images area or delete buttons
            if (e.target.closest('.uploaded-images') || e.target.classList.contains('delete-btn-corner')) {
                return;
            }
            input.click();
        });

        // Add specific click handler for upload content when images are present
        const uploadContent = zone.querySelector('.upload-content');
        if (uploadContent) {
            uploadContent.addEventListener('click', (e) => {
                e.stopPropagation();
                input.click();
            });
        }
    }

    async handleFileUpload(type, files) {
        console.log(`📷 Processing ${files.length} ${type} file(s)...`);
        
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') || file.type.startsWith('video/')
        );

        if (validFiles.length === 0) {
            console.warn('No valid media files found');
            return;
        }

        // Clear preset images when user uploads their first image for background/foreground
        if ((type === 'background' || type === 'foreground') && this.hasPresetImages(type)) {
            console.log(`🗑️ Clearing preset ${type} images to use user uploads`);
            this.clearPresetImages(type);
        }

        for (const file of validFiles) {
            try {
                const mediaData = await this.processMediaFile(file);
                this.images[type].push(mediaData);
                console.log(`✅ Added ${type} file: ${file.name}`);
            } catch (error) {
                console.error(`❌ Failed to process ${file.name}:`, error);
            }
        }

        this.updateImageDisplay(type);
        
        // Enable video playback after upload
        setTimeout(() => this.enableVideoPlayback(), 200);
    }

    async processMediaFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                if (file.type.startsWith('image/')) {
                    // Special handling for GIFs to preserve animation
                    if (file.type.includes('gif')) {
                        const img = new Image();
                        
                        img.onload = () => {
                            console.log(`🎭 Successfully loaded animated GIF: ${file.name} (${img.width}x${img.height})`);
                            
                            // CRITICAL: For animated GIFs to work in canvas, the img element must be 
                            // continuously in the DOM and visible (even if off-screen) to maintain animation
                            img.style.position = 'absolute';
                            img.style.left = '-9999px'; // Hide off-screen but keep in DOM
                            img.style.top = '-9999px';
                            img.style.pointerEvents = 'none';
                            img.style.zIndex = '-1';
                            document.body.appendChild(img); // Add to DOM to keep animation alive
                            
                            console.log(`🎭 GIF element added to DOM for animation preservation`);
                            
                            resolve({
                                name: file.name,
                                type: 'gif',
                                mediaType: this.getMediaType(file),
                                element: img,
                                image: img, // Keep for backward compatibility
                                dataUrl: e.target.result,
                                size: file.size,
                                isAnimated: true, // Flag to indicate this is an animated GIF
                                dimensions: {
                                    width: img.width,
                                    height: img.height
                                }
                            });
                        };
                        
                        img.onerror = () => {
                            reject(new Error('Failed to load GIF'));
                        };
                        
                        img.src = e.target.result;
                    } else {
                        // Regular image handling
                        const img = new Image();
                        
                        img.onload = () => {
                            resolve({
                                name: file.name,
                                type: 'image',
                                mediaType: this.getMediaType(file),
                                element: img,
                                image: img, // Keep for backward compatibility
                                dataUrl: e.target.result,
                                size: file.size,
                                dimensions: {
                                    width: img.width,
                                    height: img.height
                                }
                            });
                        };
                        
                        img.onerror = () => {
                            reject(new Error('Failed to load image'));
                        };
                        
                        img.src = e.target.result;
                    }
                } else if (file.type.startsWith('video/')) {
                    const video = document.createElement('video');
                    
                    // Essential attributes for autoplay (based on 2024 browser policies)
                    video.muted = true;
                    video.autoplay = true;
                    video.loop = true;
                    video.playsInline = true;
                    video.crossOrigin = 'anonymous';
                    video.preload = 'metadata';
                    video.disablePictureInPicture = true;
                    
                    // Set attributes directly for maximum browser compatibility
                    video.setAttribute('muted', '');
                    video.setAttribute('autoplay', '');
                    video.setAttribute('loop', '');
                    video.setAttribute('playsinline', ''); // Critical for iOS autoplay
                    video.setAttribute('webkit-playsinline', ''); // Legacy iOS support
                    video.setAttribute('disablepictureinpicture', '');
                    video.setAttribute('x5-playsinline', ''); // WeChat browser support
                    video.setAttribute('x5-video-player-type', 'h5'); // WeChat browser support
                    
                    // Additional iOS autoplay requirements
                    video.defaultMuted = true;
                    video.volume = 0;
                    
                    // Modern autoplay policy detection
                    if (navigator.getAutoplayPolicy && navigator.getAutoplayPolicy('mediaelement') === 'allowed-muted') {
                        video.muted = true;
                    }
                    
                    const handleVideoReady = () => {
                        // Ensure video is actually ready for drawing (readyState 2 = HAVE_CURRENT_DATA)
                        if (video.readyState >= 2 && video.videoWidth > 0) {
                            // Multiple autoplay attempts with different methods
                            const attemptAutoplay = async () => {
                                try {
                                    await video.play();
                                    console.log('✅ Video autoplay successful:', file.name);
                                } catch (error) {
                                    console.warn('⚠️ Initial autoplay prevented, will start on user interaction:', error.name);
                                    
                                    // Set up user interaction triggers for autoplay
                                    const enableAutoplay = () => {
                                        video.play().catch(e => console.warn('Video play failed:', e));
                                    };
                                    
                                    // Multiple user interaction event types
                                    const interactionEvents = ['click', 'touchstart', 'touchend', 'keydown', 'scroll', 'mousedown'];
                                    
                                    const enableOnce = () => {
                                        enableAutoplay();
                                        // Remove all listeners after first interaction
                                        interactionEvents.forEach(event => {
                                            document.removeEventListener(event, enableOnce);
                                        });
                                    };
                                    
                                    // Add interaction listeners
                                    interactionEvents.forEach(event => {
                                        document.addEventListener(event, enableOnce, { once: true, passive: true });
                                    });
                                    
                                    // Also try periodically in case user has already interacted
                                    const retryInterval = setInterval(() => {
                                        if (!video.paused) {
                                            clearInterval(retryInterval);
                                            return;
                                        }
                                        
                                        video.play().then(() => {
                                            clearInterval(retryInterval);
                                        }).catch(() => {
                                            // Still blocked, keep trying
                                        });
                                    }, 1000);
                                    
                                    // Stop retrying after 30 seconds
                                    setTimeout(() => clearInterval(retryInterval), 30000);
                                }
                            };
                            
                            // Attempt autoplay immediately
                            attemptAutoplay();
                            
                            resolve({
                                name: file.name,
                                type: 'video',
                                mediaType: this.getMediaType(file),
                                element: video,
                                image: video, // Keep for backward compatibility
                                dataUrl: e.target.result,
                                size: file.size,
                                dimensions: {
                                    width: video.videoWidth || video.width,
                                    height: video.videoHeight || video.height
                                }
                            });
                        }
                    };
                    
                    // Multiple event handlers for different browsers
                    video.addEventListener('loadeddata', handleVideoReady);
                    video.addEventListener('canplay', handleVideoReady);
                    video.addEventListener('canplaythrough', handleVideoReady);
                    
                    video.onerror = () => {
                        reject(new Error('Failed to load video'));
                    };
                    
                    // Additional event handlers for better autoplay success
                    video.addEventListener('loadstart', () => {
                        // Try to start playback as soon as loading begins
                        setTimeout(() => {
                            video.play().catch(e => {
                                console.warn('Early autoplay attempt failed:', e.name);
                            });
                        }, 100);
                    });
                    
                    // Handle play/pause events
                    video.addEventListener('play', () => {
                        console.log('🎬 Video started playing:', file.name);
                    });
                    
                    video.addEventListener('pause', () => {
                        // Try to restart paused videos (unless user explicitly paused)
                        if (video.readyState >= 2) {
                            setTimeout(() => {
                                if (video.paused) {
                                    video.play().catch(() => {});
                                }
                            }, 500);
                        }
                    });
                    
                    video.src = e.target.result;
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    getMediaType(file) {
        if (file.type.includes('gif')) return 'gif';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('image/')) return 'image';
        return 'unknown';
    }

    updateImageDisplay(type) {
        const display = document.querySelector(`#${type}Images`);
        const zone = document.querySelector(`#${type}Upload`);
        if (!display) return;

        // Show/hide the display based on whether there are images
        if (this.images[type].length > 0) {
            display.classList.add('has-images');
            if (zone) zone.classList.add('has-images');
        } else {
            display.classList.remove('has-images');
            if (zone) zone.classList.remove('has-images');
        }

        // Count only user-uploaded images (not presets)
        const userImages = this.images[type].filter(img => 
            !img.name || !(
                img.name.includes('Preset') || 
                img.name.includes('Background.png') || 
                img.name.includes('foreground.png')
            )
        );
        
        // Create header if it doesn't exist
        let header = display.querySelector('h4');
        if (!header && this.images[type].length > 0) {
            header = document.createElement('h4');
            header.textContent = `Uploaded Images (${userImages.length})`;
            display.appendChild(header);
        } else if (header) {
            header.textContent = `Uploaded Images (${userImages.length})`;
        }

        // Create or get the image grid
        let grid = display.querySelector('.image-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'image-grid';
            display.appendChild(grid);
        }

        grid.innerHTML = '';
        
        // Only show user-uploaded images in the thumbnail grid, not presets
        const displayImages = this.images[type].filter(img => 
            !img.name || !(
                img.name.includes('Preset') || 
                img.name.includes('Background.png') || 
                img.name.includes('foreground.png')
            )
        );
        
        displayImages.forEach((imageData, displayIndex) => {
            // Find the actual index in the full images array
            const actualIndex = this.images[type].indexOf(imageData);
            
            const thumbnail = document.createElement('div');
            thumbnail.className = 'image-thumbnail';
            if (actualIndex === this.selectedImages[type]) {
                thumbnail.classList.add('selected');
            }

            let mediaElement;
            if (imageData.type === 'video') {
                mediaElement = `<video src="${imageData.dataUrl}" muted autoplay loop playsinline webkit-playsinline disablepictureinpicture preload="metadata" crossorigin="anonymous" x5-playsinline x5-video-player-type="h5"></video>`;
            } else if (imageData.type === 'gif') {
                // For GIFs, use img tag which preserves animation
                mediaElement = `<img src="${imageData.dataUrl}" alt="${imageData.name}" class="animated-gif">`;
            } else {
                mediaElement = `<img src="${imageData.dataUrl}" alt="${imageData.name}">`;
            }
            
            thumbnail.innerHTML = `
                ${mediaElement}
                <div class="media-type-indicator ${imageData.mediaType}">${imageData.mediaType.toUpperCase()}</div>
                <button class="delete-btn-corner" data-type="${type}" data-index="${actualIndex}" title="Delete Media">❌</button>
            `;

            // Click thumbnail to select (but not on the delete button)
            thumbnail.addEventListener('click', (e) => {
                // Don't select if clicking the delete button
                if (e.target.classList.contains('delete-btn-corner')) {
                    return;
                }
                this.selectImage(type, actualIndex);
            });

            grid.appendChild(thumbnail);
            
            // For video thumbnails, ensure they start playing
            if (imageData.type === 'video') {
                const videoElement = thumbnail.querySelector('video');
                if (videoElement) {
                    // Try to play after a short delay to ensure the element is in the DOM
                    setTimeout(() => {
                        videoElement.play().catch(e => {
                            console.warn('Could not play thumbnail video:', e);
                        });
                    }, 100);
                }
            }
        });

        // Update counts
        this.updateImageCounts();
        
        // Auto-start cycling if multiple images and it's background/foreground
        if ((type === 'background' || type === 'foreground') && 
            this.images[type].length > 1 && 
            window.fishcannonApp && 
            window.fishcannonApp.imageCycler) {
            
            const cycler = window.fishcannonApp.imageCycler;
            if (!cycler.isCyclingEnabled(type)) {
                cycler.startCycling(type);
                console.log(`🔄 Auto-started cycling for ${type} (${this.images[type].length} images)`);
                
                // Update the toggle button state
                const toggleButton = document.getElementById(`${type}CycleToggle`);
                if (toggleButton) {
                    const buttonIcon = toggleButton.querySelector('.button-icon');
                    const buttonText = toggleButton.childNodes[toggleButton.childNodes.length - 1];
                    buttonIcon.textContent = '⏸️';
                    buttonText.textContent = 'Pause Cycling';
                    toggleButton.classList.add('active');
                }
            }
        }
        
        // Trigger update callback
        if (this.onImageUpdateCallback) {
            this.onImageUpdateCallback();
        }
        
        // Ensure videos are playing after display update
        setTimeout(() => this.ensureVideosPlaying(), 100);
    }

    selectImage(type, index) {
        if (index >= 0 && index < this.images[type].length) {
            this.selectedImages[type] = index;
            this.updateImageDisplay(type);
            console.log(`🎯 Selected ${type} image ${index}: ${this.images[type][index].name}`);
            
            // If it's a video, ensure it starts playing
            const selectedMedia = this.images[type][index];
            if (selectedMedia.type === 'video' && selectedMedia.element) {
                setTimeout(() => {
                    selectedMedia.element.play().catch(e => {
                        console.warn('Could not play selected video:', e);
                    });
                }, 100);
            } else if (selectedMedia.type === 'gif') {
                console.log(`🎭 Selected animated GIF: ${selectedMedia.name}`);
            }
        }
    }

    deleteImage(type, index) {
        if (index >= 0 && index < this.images[type].length) {
            const deleted = this.images[type].splice(index, 1)[0];
            console.log(`🗑️ Deleted ${type} media: ${deleted.name}`);
            
            // Clean up video element if it's a video
            if (deleted.type === 'video' && deleted.element) {
                deleted.element.pause();
                deleted.element.src = '';
                deleted.element.load();
            }
            
            // Adjust selected index if necessary
            if (this.selectedImages[type] >= this.images[type].length) {
                this.selectedImages[type] = Math.max(0, this.images[type].length - 1);
            }
            
            // Stop cycling if less than 2 images remain
            if (this.images[type].length < 2 && 
                window.fishcannonApp && 
                window.fishcannonApp.imageCycler) {
                
                const cycler = window.fishcannonApp.imageCycler;
                if (cycler.isCyclingEnabled(type)) {
                    cycler.stopCycling(type);
                    
                    // Update the toggle button state
                    const toggleButton = document.getElementById(`${type}CycleToggle`);
                    if (toggleButton) {
                        const buttonIcon = toggleButton.querySelector('.button-icon');
                        const buttonText = toggleButton.childNodes[toggleButton.childNodes.length - 1];
                        buttonIcon.textContent = '▶️';
                        buttonText.textContent = 'Start Cycling';
                        toggleButton.classList.remove('active');
                    }
                }
            }
            
            this.updateImageDisplay(type);
        }
    }

    updateImageCounts() {
        // Only update people count since other counters are removed
        const peopleCount = this.images.people.length;
        console.log(`📊 Character images: ${peopleCount}`);
    }

    // Getters
    getSelectedImage(type) {
        const images = this.images[type];
        const selectedIndex = this.selectedImages[type];
        if (images && images[selectedIndex]) {
            const mediaData = images[selectedIndex];
            // For videos, ensure they're playing and ready
            if (mediaData.type === 'video' && mediaData.element) {
                const video = mediaData.element;
                // Always try to play if paused, regardless of ready state
                if (video.paused) {
                    video.play().catch(e => {
                        console.warn('Could not play video:', e);
                        // Try again after a short delay
                        setTimeout(() => {
                            if (video.paused && video.readyState >= 2) {
                                video.play().catch(() => {});
                            }
                        }, 500);
                    });
                }
            }
            return mediaData.image || mediaData.element;
        }
        return null;
    }

    getRandomImage(type) {
        const images = this.images[type];
        if (images.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * images.length);
        const mediaData = images[randomIndex];
        
        // For videos, ensure they're playing and ready
        if (mediaData.type === 'video' && mediaData.element) {
            const video = mediaData.element;
            // Always try to play if paused, regardless of ready state
            if (video.paused) {
                video.play().catch(e => {
                    console.warn('Could not play video:', e);
                    // Try again after a short delay
                    setTimeout(() => {
                        if (video.paused && video.readyState >= 2) {
                            video.play().catch(() => {});
                        }
                    }, 500);
                });
            }
        }
        
        return mediaData.image || mediaData.element;
    }

    getFishSprite(isOpen) {
        if (!this.fishSprites.loaded) return null;
        return isOpen ? this.fishSprites.openMouth : this.fishSprites.closedMouth;
    }

    hasImages(type) {
        return this.images[type].length > 0;
    }

    getImageCount(type) {
        return this.images[type].length;
    }

    setupUploadTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(`${targetTab}TabContent`).classList.add('active');
                
                // Enable videos after user interaction
                this.enableVideoPlayback();
                
                console.log(`📋 Switched to ${targetTab} tab`);
            });
        });
        
        // Setup cycle interval controls
        this.setupCycleControls('background');
        this.setupCycleControls('foreground');
    }

    setupVideoAutoplay() {
        console.log('🎬 Setting up comprehensive video autoplay system...');
        
        // Check autoplay policy if available (modern browsers)
        if (navigator.getAutoplayPolicy) {
            const policy = navigator.getAutoplayPolicy('mediaelement');
            console.log('🔍 Browser autoplay policy:', policy);
            
            if (policy === 'disallowed') {
                console.warn('⚠️ Autoplay completely blocked by browser policy');
            } else if (policy === 'allowed-muted') {
                console.log('✅ Muted autoplay allowed');
            } else if (policy === 'allowed') {
                console.log('✅ Full autoplay allowed');
            }
        }
        
        // Comprehensive list of user interaction events
        const interactionEvents = [
            'click', 'touchstart', 'touchend', 'touchmove', 
            'keydown', 'keypress', 'scroll', 'mousedown', 
            'mousemove', 'wheel', 'pointerdown', 'pointerup'
        ];
        
        const enableVideoPlayback = () => {
            this.enableVideoPlayback();
            console.log('🎬 Video playback enabled via user interaction');
        };
        
        const enableOnce = () => {
            enableVideoPlayback();
            // Remove all listeners after first interaction
            interactionEvents.forEach(event => {
                document.removeEventListener(event, enableOnce);
            });
        };
        
        // Add interaction listeners with passive option for better performance
        interactionEvents.forEach(event => {
            document.addEventListener(event, enableOnce, { 
                once: true, 
                passive: true,
                capture: true 
            });
        });
        
        // Try autoplay immediately (might work if user has previously interacted with site)
        setTimeout(() => {
            this.enableVideoPlayback();
            console.log('🎬 Attempting immediate video autoplay...');
        }, 100);
        
        // Aggressive retry strategy for newly uploaded videos
        const retryInterval = setInterval(() => {
            this.ensureVideosPlaying();
        }, 1500);
        
        // Stop aggressive retries after 60 seconds
        setTimeout(() => {
            clearInterval(retryInterval);
            console.log('🎬 Stopping aggressive video retry attempts');
        }, 60000);
        
        // Handle page visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('🎬 Page became visible, restarting videos...');
                setTimeout(() => this.enableVideoPlayback(), 200);
                
                // Extra attempt after a longer delay
                setTimeout(() => this.ensureVideosPlaying(), 1000);
            }
        });
        
        // Handle page focus/blur events
        window.addEventListener('focus', () => {
            setTimeout(() => this.enableVideoPlayback(), 100);
        });
        
        // Handle media session events (if supported)
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => {
                this.enableVideoPlayback();
            });
        }
    }

    ensureVideosPlaying() {
        // Continuously ensure videos are playing if they should be
        ['background', 'foreground'].forEach(type => {
            const selectedMedia = this.getSelectedMediaData(type);
            if (selectedMedia && selectedMedia.type === 'video' && selectedMedia.element) {
                if (selectedMedia.element.paused && selectedMedia.element.readyState >= 2) {
                    selectedMedia.element.play().catch(() => {
                        // Silently fail - video might not be ready or autoplay blocked
                    });
                }
            }
        });
    }

    getSelectedMediaData(type) {
        const images = this.images[type];
        const selectedIndex = this.selectedImages[type];
        return images && images[selectedIndex] ? images[selectedIndex] : null;
    }

    enableVideoPlayback() {
        console.log('🎬 Enabling video playback across all video elements...');
        
        // This method is called after user interaction to enable video playback
        // Try to play all video elements that might be paused
        const allVideos = document.querySelectorAll('video');
        console.log(`🎬 Found ${allVideos.length} video elements to enable`);
        
        allVideos.forEach((video, index) => {
            if (video.paused && video.readyState >= 2) {
                // Ensure video has proper autoplay attributes
                video.muted = true;
                video.defaultMuted = true;
                video.volume = 0;
                
                video.play().then(() => {
                    console.log(`✅ Video ${index + 1} started playing successfully`);
                }).catch(e => {
                    console.warn(`⚠️ Video ${index + 1} play failed:`, e.name);
                    
                    // Try again with additional delay
                    setTimeout(() => {
                        if (video.paused && video.readyState >= 2) {
                            video.play().catch(() => {
                                console.warn(`⚠️ Video ${index + 1} second attempt failed`);
                            });
                        }
                    }, 500);
                });
            } else if (video.readyState < 2) {
                console.log(`⏳ Video ${index + 1} not ready yet (readyState: ${video.readyState})`);
                
                // Set up to try again when video is ready
                const tryWhenReady = () => {
                    if (video.readyState >= 2) {
                        video.play().catch(e => {
                            console.warn(`⚠️ Video ${index + 1} delayed play failed:`, e.name);
                        });
                    }
                };
                
                video.addEventListener('canplay', tryWhenReady, { once: true });
                video.addEventListener('loadeddata', tryWhenReady, { once: true });
            }
        });
        
        // Also ensure currently selected background/foreground videos are playing
        this.ensureVideosPlaying();
    }

    setupCycleControls(type) {
        const intervalSlider = document.getElementById(`${type}CycleInterval`);
        const intervalValue = document.getElementById(`${type}CycleValue`);
        const toggleButton = document.getElementById(`${type}CycleToggle`);
        
        if (intervalSlider && intervalValue) {
            intervalSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                intervalValue.textContent = value.toFixed(1);
                
                // Update cycle interval in ImageCycler if it exists
                if (window.fishcannonApp && window.fishcannonApp.imageCycler) {
                    window.fishcannonApp.imageCycler.setCycleInterval(type, value * 1000);
                }
            });
        }
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                if (window.fishcannonApp && window.fishcannonApp.imageCycler) {
                    const isEnabled = window.fishcannonApp.imageCycler.toggleCycling(type);
                    const buttonIcon = toggleButton.querySelector('.button-icon');
                    const buttonText = toggleButton.childNodes[toggleButton.childNodes.length - 1];
                    
                    if (isEnabled) {
                        buttonIcon.textContent = '⏸️';
                        buttonText.textContent = 'Pause Cycling';
                        toggleButton.classList.add('active');
                    } else {
                        buttonIcon.textContent = '▶️';
                        buttonText.textContent = 'Start Cycling';
                        toggleButton.classList.remove('active');
                    }
                }
            });
        }
    }

    // Utility methods
    setUpdateCallback(callback) {
        this.onImageUpdateCallback = callback;
    }

    getAllImages(type) {
        return this.images[type];
    }

    clearImages(type) {
        this.images[type] = [];
        this.selectedImages[type] = 0;
        this.updateImageDisplay(type);
    }

    hasPresetImages(type) {
        return this.images[type].some(img => img.name && (
            img.name.includes('Preset') || 
            img.name.includes('Background.png') || 
            img.name.includes('foreground.png')
        ));
    }

    clearPresetImages(type) {
        // Remove preset images (identified by name containing 'Preset' or asset file names)
        this.images[type] = this.images[type].filter(img => 
            !img.name || !(
                img.name.includes('Preset') || 
                img.name.includes('Background.png') || 
                img.name.includes('foreground.png')
            )
        );
        
        // Reset selected index
        this.selectedImages[type] = 0;
        
        console.log(`🗑️ Cleared preset images for ${type}. Remaining: ${this.images[type].length}`);
    }
} 