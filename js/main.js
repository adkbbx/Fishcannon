// 🐟💥 Fishcannon - Modular Main Application
// Enhanced with modular architecture

import { CanvasManager } from './core/CanvasManager.js';
import { AnimationSystem } from './animation/AnimationSystem.js';
import { ImageManager } from './managers/ImageManager.js';
import { ImageCycler } from './managers/ImageCycler.js';
import { SoundManager } from './managers/SoundManager.js';
import { UIController } from './ui/UIController.js';
import { Renderer } from './rendering/Renderer.js';
import { createLogger } from './utils/Logger.js';
import { PHYSICS_DEFAULTS } from './utils/Constants.js';

class FishcannonApp {
    constructor() {
        // Initialize logger
        this.logger = createLogger('FishcannonApp');
        
        // Initialize all modules
        this.canvasManager = new CanvasManager();
        this.animationSystem = new AnimationSystem();
        this.imageManager = new ImageManager();
        this.imageCycler = new ImageCycler(this.imageManager);
        this.soundManager = new SoundManager();
        this.uiController = new UIController();
        this.renderer = new Renderer(this.canvasManager, this.imageManager);

        // App state
        this.state = {
            showTrajectory: false,
            isAnimating: false
        };

        // Enhanced firing system for concurrent operations
        this.activeBubbles = new Map(); // bubbleId -> {fishIndex, targetIndex}
        this.fishCooldowns = new Map(); // fishIndex -> cooldown timestamp
        this.cooldownDuration = PHYSICS_DEFAULTS.COOLDOWN_DURATION;
        this.firingQueue = []; // Queue of firing requests
        this.isProcessingQueue = false;

        // Audio system initialized above
        this.audioSystem = this.soundManager;
        
        // Pending bubble data for firing callback
        this.pendingBubbleData = null;
    }

    async init() {
        this.logger.init('Fishcannon App with modular architecture');
        
        try {
            // Setup canvas system
            this.canvasManager.setupCanvases();
            this.setupCanvasCallbacks();

            // Initialize image management
            await this.imageManager.init();
            this.setupImageCallbacks();

            // Initialize UI system
            this.uiController.init();
            this.setupUICallbacks();

            // Setup animation system
            this.setupAnimationCallbacks();
            
            // Connect sound manager to animation system
            this.animationSystem.setSoundManager(this.soundManager);

            // Start the main animation loop
            this.startMainLoop();

            // Initial drawing
            this.redrawAllCanvases();
            
            this.logger.success('Fishcannon App initialized successfully with modular architecture!');
        } catch (error) {
            this.logger.error('Failed to initialize Fishcannon App:', error);
        }
    }

    setupCanvasCallbacks() {
        // Set up canvas redraw callback
        this.canvasManager.onRedrawRequested = (canvasId) => {
            this.renderer.redrawCanvas(canvasId);
        };

        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvasManager.resizeAllCanvases();
            this.uiController.handleResize();
            // Note: DOM-based GIF particles will be repositioned automatically in the next frame
            // since their positions are recalculated based on canvas bounds each render
        });

        // Add keyboard controls
        document.addEventListener('keydown', (e) => {
            // Space bar triggers launch
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent page scrolling
                this.testFire();
            }
        });
    }

    setupImageCallbacks() {
        // Set up image update callback
        this.imageManager.setUpdateCallback(() => {
            this.redrawStaticCanvases();
        });

        // Set up image cycling callbacks
        const originalUpdateImageDisplay = this.imageManager.updateImageDisplay.bind(this.imageManager);
        this.imageManager.updateImageDisplay = (type) => {
            originalUpdateImageDisplay(type);
            this.imageCycler.onImagesChanged(type);
        };

        // Set up cycling callback to trigger redraws
        this.imageCycler.setCycleCallback((type) => {
            // When cycling occurs, redraw the affected canvas
            if (type === 'background' || type === 'foreground') {
                this.renderer.redrawCanvas(`${type}Canvas`);
                this.logger.debug(`Redrawing ${type} canvas due to cycle`);
            }
        });
    }

    setupUICallbacks() {
        // Position updates
        this.uiController.setPositionUpdateCallback((type, position) => {
            // Update internal state and redraw
            this.redrawStaticCanvases();
        });

        // Physics updates
        this.uiController.setPhysicsUpdateCallback((physics) => {
            // Physics is managed by UIController, no additional action needed
        });

        // Test fire button
        this.uiController.setTestFireCallback(() => {
            this.testFire();
        });

        // Reset positions
        this.uiController.setResetPositionsCallback(() => {
            this.redrawStaticCanvases();
        });

        // Toggle indicators
        this.uiController.setToggleIndicatorsCallback(() => {
            // UI handles this internally
        });

        // Audio functionality removed

        // Canvas click
        this.uiController.setCanvasClickCallback((e) => {
            this.handleCanvasClick(e);
        });

        // Image cycling functionality removed
    }

    setupAnimationCallbacks() {
        // Set up firing state callback
        this.animationSystem.onFiringState = () => {
            if (this.pendingBubbleData && this.pendingBubbleData.length > 0) {
                const bubbleData = this.pendingBubbleData[0];
                this.logger.debug('Firing callback triggered for queued bubble');
                
                const bubble = this.animationSystem.createBubble(
                    bubbleData.positions.fish,
                    bubbleData.positions.target,
                    bubbleData.physics,
                    bubbleData.personImage
                );

                // Track this bubble
                this.activeBubbles.set(bubble.id, {
                    fishIndex: bubbleData.fishIndex,
                    targetIndex: bubbleData.targetIndex,
                    pairKey: bubbleData.pairKey
                });
                
                // Clear pending data
                this.pendingBubbleData = null;
            }
        };

        // Set up bubble completion callback
        this.animationSystem.onBubbleComplete = (bubbleId) => {
            // Clean up completed bubble
            if (this.activeBubbles.has(bubbleId)) {
                const bubbleInfo = this.activeBubbles.get(bubbleId);
                this.activeBubbles.delete(bubbleId);
                this.logger.debug(`Bubble completed: Fish ${bubbleInfo.fishIndex + 1} → Target ${bubbleInfo.targetIndex + 1}`);
                
                // Fish is now free to fire again after cooldown expires
                // No need to process queue - new system allows immediate concurrent firings
            }
        };

        // Set up fish animation completion callback
        this.animationSystem.onFishAnimationComplete = (fishIndex) => {
            this.logger.debug(`Fish ${fishIndex + 1} animation cycle completed`);
            // With concurrent system, each fish manages its own state
            // No need for centralized queue processing
        };
    }

    startMainLoop() {
        // Start the animation system loop
        this.animationSystem.startAnimationLoop();
        
        // Start the main render loop
        let lastTime = performance.now();
        
        const mainLoop = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;

            // Update UI animation state - show status of all active fish
            const activeFishCount = this.animationSystem.activeFish.size;
            let stateMessage = 'Ready';
            
            if (activeFishCount > 0) {
                const states = [];
                this.animationSystem.activeFish.forEach(fishIndex => {
                    const fishState = this.animationSystem.getFishState(fishIndex);
                    states.push(`F${fishIndex + 1}:${fishState.currentState}`);
                });
                stateMessage = states.join(' | ');
            }
            
            if (this.firingQueue.length > 0) {
                stateMessage += ` (Queue: ${this.firingQueue.length})`;
            }
            
            // Animation state display removed from UI

            // Redraw animated canvases
            this.redrawAnimatedCanvases();

            requestAnimationFrame(mainLoop);
        };

        requestAnimationFrame(mainLoop);
    }

    testFire() {
        // Get available fish for concurrent firing
        const availableFish = this.getAvailableFish();
        
        if (availableFish.length === 0) {
            console.log('🚫 No available fish for firing (all on cooldown or busy)');
            return;
        }

        // In multimode, try to fire multiple fish concurrently
        const firingData = this.uiController.getFiringPositions();
        const physics = this.uiController.getPhysics();
        
        this.logger.debug('testFire called, firingData:', firingData);
        
        if (this.uiController.multiMode && availableFish.length > 1 && firingData.target.length > 0) {
            // Fire multiple fish at once with smart targeting
            const maxConcurrentFirings = Math.min(availableFish.length, firingData.target.length, 3);
            const firingsToStart = [];
            
            for (let i = 0; i < maxConcurrentFirings; i++) {
                const fishIndex = availableFish[i];
                const targetIndex = i % firingData.target.length; // Cycle through targets
                
                firingsToStart.push({
                    fishIndex,
                    targetIndex,
                    delay: i * 150 // Stagger the firings slightly
                });
            }
            
            console.log(`🎯 Multi-firing: ${firingsToStart.length} fish launching concurrently`);
            
            firingsToStart.forEach(firing => {
                setTimeout(() => {
                    this.startFishFiring(firing.fishIndex, firing.targetIndex);
                }, firing.delay);
            });
            
        } else {
            // Single firing - pick random available fish and target
            const fishIndex = availableFish[Math.floor(Math.random() * availableFish.length)];
            const targetIndex = Math.floor(Math.random() * firingData.target.length);
            
            this.logger.debug(`Single firing: Fish ${fishIndex + 1} → Target ${targetIndex + 1}`);
            this.startFishFiring(fishIndex, targetIndex);
        }
    }

    // Get fish that are available for firing (not on cooldown and not busy)
    getAvailableFish() {
        const firingData = this.uiController.getFiringPositions();
        const availableFish = [];
        const now = Date.now();
        
        for (let fishIndex = 0; fishIndex < firingData.fish.length; fishIndex++) {
            const cooldownEnd = this.fishCooldowns.get(fishIndex) || 0;
            const fishState = this.animationSystem.getFishState(fishIndex);
            
            // Fish is available if not on cooldown and not actively firing
            if (now >= cooldownEnd && (fishState.currentState === 'HIDDEN' || fishState.currentState === 'WAITING')) {
                availableFish.push(fishIndex);
            }
        }
        
        return availableFish;
    }
    
    // Start firing for a specific fish
    startFishFiring(fishIndex, targetIndex) {
        const firingData = this.uiController.getFiringPositions();
        const physics = this.uiController.getPhysics();
        const personImage = this.imageManager.getRandomImage('people');
        
        // Set cooldown for this fish
        this.fishCooldowns.set(fishIndex, Date.now() + this.cooldownDuration);
        
        // Log the target position being used
        this.logger.debug(`startFishFiring: Fish ${fishIndex} → Target ${targetIndex}`, {
            fishPos: firingData.fish[fishIndex],
            targetPos: firingData.target[targetIndex],
            firingDataComplete: firingData
        });
        
        this.logger.debug(`Creating bubble from fish to target:`, {
            fishX: firingData.fish[fishIndex].x,
            fishY: firingData.fish[fishIndex].y,
            targetX: firingData.target[targetIndex].x,
            targetY: firingData.target[targetIndex].y
        });
        
        // Create bubble data
        const bubbleData = {
            fishIndex,
            targetIndex,
            positions: {
                fish: firingData.fish[fishIndex],
                target: firingData.target[targetIndex]
            },
            physics,
            personImage,
            pairKey: `${fishIndex}-${targetIndex}`
        };
        
        // Set up the firing data for animation system callback
        this.pendingBubbleData = [bubbleData];
        
        // Start fish animation
        const fishState = this.animationSystem.getFishState(fishIndex);
        
        if (fishState.currentState === 'HIDDEN') {
            this.logger.debug(`Fish ${fishIndex + 1} starting fresh animation`);
            this.animationSystem.startFishAnimationAtPosition(fishIndex);
        } else {
            this.logger.debug(`Fish ${fishIndex + 1} transitioning to next firing from ${fishState.currentState}`);
            this.animationSystem.transitionToNextFiring(fishIndex);
        }
    }

    // Legacy method for compatibility - now simplified
    processNextInQueue() {
        // This method is kept for compatibility but the new system handles concurrent firings
        this.logger.debug('Queue processing - new concurrent system active');
        this.isProcessingQueue = false;
    }



    handleCanvasClick(e) {
        // Enable video playback on canvas interaction
        this.imageManager.enableVideoPlayback();
        
        // In multimode, all positioning is handled via draggable indicators with +/- buttons
        if (this.uiController.multiMode) {
            return; // No click-to-place functionality in multimode
        }
        
        // Normal mode: Update target position on click
        const container = document.getElementById('canvasContainer');
        const rect = container.getBoundingClientRect();
        
        const relativeX = (e.clientX - rect.left) / rect.width;
        const relativeY = (e.clientY - rect.top) / rect.height;
        
        this.uiController.updateTargetPosition(relativeX, relativeY);
    }

    // Audio system initialization (now handled in constructor)
    initializeAudioSystem() {
        console.log('🔊 Audio system initialized via SoundManager');
    }

    // Drawing coordination methods
    redrawAllCanvases() {
        this.renderer.redrawAll();
        this.redrawAnimatedCanvases();
    }

    redrawStaticCanvases() {
        // Redraw background and foreground
        this.renderer.redrawCanvas('backgroundCanvas');
        this.renderer.redrawCanvas('foregroundCanvas');
        this.renderer.redrawCanvas('uiCanvas');
        
        // Redraw fish (also considered static when not animating)
        this.redrawFishCanvas();
    }

    redrawAnimatedCanvases() {
        // Check if we have video content that needs continuous updates
        const hasVideoBackground = this.hasVideoContent('background');
        const hasVideoForeground = this.hasVideoContent('foreground');
        
        // Redraw background if it contains video
        if (hasVideoBackground) {
            this.renderer.redrawCanvas('backgroundCanvas');
        }
        
        // Clear and redraw fish
        this.redrawFishCanvas();
        
        // Redraw foreground if it contains video
        if (hasVideoForeground) {
            this.renderer.redrawCanvas('foregroundCanvas');
        }
        
        // Clear and redraw animations
        this.canvasManager.clearCanvas('animationCanvas');
        this.renderer.drawAnimations(
            this.animationSystem.getBubbles(),
            this.animationSystem.getParticles(),
            this.state.showTrajectory,
            this.uiController.getPositions(),
            this.uiController.getPhysics()
        );
    }

    // Helper method to check if a layer has video content
    hasVideoContent(type) {
        const selectedMedia = this.imageManager.getSelectedImage(type);
        return selectedMedia && selectedMedia instanceof HTMLVideoElement;
    }

    redrawFishCanvas() {
        this.canvasManager.clearCanvas('fishCanvas');
        this.renderer.drawFish(
            this.animationSystem.getFishState(),
            this.uiController.getPositions()
        );
    }

    // Utility methods
    resetAllAnimations() {
        this.animationSystem.resetAllAnimations();
        this.state.isAnimating = false;
        this.redrawAnimatedCanvases();
    }

    toggleTrajectory() {
        this.state.showTrajectory = !this.state.showTrajectory;
    }

    // Getters for debugging/external access
    getModules() {
        return {
            canvasManager: this.canvasManager,
            animationSystem: this.animationSystem,
            imageManager: this.imageManager,
            uiController: this.uiController,
            renderer: this.renderer
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fishcannonApp = new FishcannonApp();
    window.fishcannonApp.init();
});

// Export for potential external use
export { FishcannonApp }; 