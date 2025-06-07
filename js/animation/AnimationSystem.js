// 🐠 Animation System Module
// Handles fish animation state machine, bubbles, particles, and timing

export class AnimationSystem {
    constructor() {
        this.animations = {
            bubbles: [],
            particles: []
        };

        // Enhanced fish animation system - support multiple independent fish
        this.fishStates = new Map(); // fishIndex -> fishState
        this.activeFish = new Set(); // Track which fish are currently animating

        // Default fish animation configuration
        this.fishConfig = {
            baseOffset: 0.15,     // Fish hidden below the indicator (positive = lower on screen)
            emergenceOffset: 0,   // Fish emerges to indicator position (no offset)
            duration: {
                RISING: 600,      // Reduced for smoother feel
                OPENING: 200,     // Faster opening
                FIRING: 80,       // Quick firing
                WAITING: 0,       // Variable wait time
                CLOSING: 200,     // Faster closing
                SINKING: 500      // Faster sinking
            }
        };

        this.animationFrame = null;
        this.isRunning = false;
        
        // Callbacks
        this.onStateChange = null;
        this.onFiringState = null;
        this.onBubbleComplete = null;
        this.onFishAnimationComplete = null;
        
        // Sound system reference
        this.soundManager = null;
    }

    // Create or get fish state for a specific fish index
    getFishState(fishIndex = 0) {
        if (!this.fishStates.has(fishIndex)) {
            console.log(`🐟 Creating new fish state for fish ${fishIndex} - starting hidden at Y offset: ${this.fishConfig.baseOffset}`);
            this.fishStates.set(fishIndex, {
                currentState: 'HIDDEN',
                animationStartTime: 0,
                stateStartTime: 0,
                currentY: this.fishConfig.baseOffset, // Start hidden below indicator (+0.15)
                fishIndex: fishIndex,
                isActive: false
            });
        }
        
        const fishState = this.fishStates.get(fishIndex);
        
        // For backwards compatibility, add currentFishIndex if fishIndex is 0
        if (fishIndex === 0) {
            fishState.currentFishIndex = 0;
        }
        
        return fishState;
    }

    startFishAnimationAtPosition(fishIndex) {
        const fishState = this.getFishState(fishIndex);
        
        // Allow re-emergence if fish is hidden or sinking
        if (fishState.currentState !== 'HIDDEN' && fishState.currentState !== 'SINKING') {
            console.log(`🐟 Fish ${fishIndex} already animating (${fishState.currentState})`);
            return;
        }

        console.log(`🐟 Starting animation for fish ${fishIndex}`);
        console.log(`🐟 Fish ${fishIndex} initial setup:`, {
            baseOffset: this.fishConfig.baseOffset,
            emergenceOffset: this.fishConfig.emergenceOffset,
            startingY: this.fishConfig.baseOffset
        });
        
        fishState.animationStartTime = performance.now();
        fishState.isActive = true;
        fishState.currentY = this.fishConfig.baseOffset; // Start hidden below indicator (+0.15)
        this.activeFish.add(fishIndex);
        this.transitionFishToState(fishIndex, 'RISING');
    }

    transitionFishToState(fishIndex, newState) {
        const fishState = this.getFishState(fishIndex);
        const oldState = fishState.currentState;
        
        console.log(`🐟 Fish ${fishIndex}: ${oldState} → ${newState}`);
        
        fishState.currentState = newState;
        fishState.stateStartTime = performance.now();
        
        // Trigger callbacks for any fish (not just fish 0)
        if (this.onStateChange) {
            this.onStateChange(newState);
        }
        
        if (newState === 'FIRING' && this.onFiringState) {
            console.log(`🔥 Fish ${fishIndex} firing - triggering callback`);
            this.onFiringState();
        }
    }

    updateFishAnimation() {
        this.activeFish.forEach(fishIndex => {
            const fishState = this.getFishState(fishIndex);
            if (fishState.currentState === 'HIDDEN') return;
            
            const now = performance.now();
            const state = fishState;
            const stateElapsed = now - state.stateStartTime;

            switch (state.currentState) {
                case 'RISING':
                    if (stateElapsed >= this.fishConfig.duration.RISING) {
                        console.log(`🐟 Fish ${fishIndex} completed RISING phase`);
                        state.currentY = this.fishConfig.emergenceOffset; // Ensure we end at indicator (0)
                        this.transitionFishToState(fishIndex, 'OPENING');
                    } else {
                        const progress = stateElapsed / this.fishConfig.duration.RISING;
                        const easedProgress = this.easeOutCubic(progress);
                        // Rise from baseOffset (+0.15) to emergenceOffset (0)
                        state.currentY = this.fishConfig.baseOffset + (this.fishConfig.emergenceOffset - this.fishConfig.baseOffset) * easedProgress;
                        
                        // Debug logging for RISING
                        if (Math.random() < 0.02) {
                            console.log(`🐟 Fish ${fishIndex} RISING:`, {
                                progress: (progress * 100).toFixed(1) + '%',
                                currentY: state.currentY.toFixed(3),
                                from: this.fishConfig.baseOffset,
                                to: this.fishConfig.emergenceOffset
                            });
                        }
                    }
                    break;

                case 'OPENING':
                    if (stateElapsed >= this.fishConfig.duration.OPENING) {
                        console.log(`🐟 Fish ${fishIndex} completed OPENING phase`);
                        this.transitionFishToState(fishIndex, 'FIRING');
                    }
                    break;

                case 'FIRING':
                    if (stateElapsed >= this.fishConfig.duration.FIRING) {
                        console.log(`🐟 Fish ${fishIndex} completed FIRING phase`);
                        this.transitionFishToState(fishIndex, 'WAITING');
                    }
                    break;

                case 'WAITING':
                    // Wait for bubble animation to complete
                    break;

                case 'CLOSING':
                    if (stateElapsed >= this.fishConfig.duration.CLOSING) {
                        console.log(`🐟 Fish ${fishIndex} completed CLOSING phase`);
                        this.transitionFishToState(fishIndex, 'SINKING');
                    }
                    break;

                case 'SINKING':
                    if (stateElapsed >= this.fishConfig.duration.SINKING) {
                        console.log(`🐟 Fish ${fishIndex} completed SINKING phase`);
                        state.currentY = this.fishConfig.baseOffset; // End hidden below indicator (+0.15)
                        this.transitionFishToState(fishIndex, 'HIDDEN');
                        this.completeFishAnimation(fishIndex);
                    } else {
                        const progress = stateElapsed / this.fishConfig.duration.SINKING;
                        const easedProgress = this.easeInCubic(progress);
                        // Sink from emergenceOffset (0) to baseOffset (+0.15)
                        state.currentY = this.fishConfig.emergenceOffset + (this.fishConfig.baseOffset - this.fishConfig.emergenceOffset) * easedProgress;
                        
                        // Debug logging for SINKING
                        if (Math.random() < 0.02) {
                            console.log(`🐟 Fish ${fishIndex} SINKING:`, {
                                progress: (progress * 100).toFixed(1) + '%',
                                currentY: state.currentY.toFixed(3),
                                from: this.fishConfig.emergenceOffset,
                                to: this.fishConfig.baseOffset
                            });
                        }
                    }
                    break;
            }
        });
    }

    completeFishAnimation(fishIndex) {
        console.log(`🐟 Fish ${fishIndex} animation sequence completed`);
        
        const fishState = this.getFishState(fishIndex);
        fishState.currentState = 'HIDDEN';
        fishState.currentY = this.fishConfig.baseOffset;
        fishState.isActive = false;
        this.activeFish.delete(fishIndex);
        
        // Notify that fish animation completed (for backwards compatibility)
        if (this.onFishAnimationComplete) {
            this.onFishAnimationComplete(fishIndex);
        }
    }

    // Enhanced bubble completion handling
    bubbleCompleted(bubbleId) {
        console.log(`💥 Bubble ${bubbleId} completed`);
        
        // Find any fish in WAITING state and transition them to closing
        let foundWaitingFish = false;
        this.activeFish.forEach(fishIndex => {
            const fishState = this.getFishState(fishIndex);
            if (fishState.currentState === 'WAITING') {
                console.log(`🐟 Fish ${fishIndex} transitioning from WAITING to CLOSING`);
                this.transitionFishToState(fishIndex, 'CLOSING');
                foundWaitingFish = true;
            }
        });
        
        if (!foundWaitingFish) {
            console.log('⚠️ No waiting fish found for bubble completion');
        }
        
        // Trigger the callback for external systems
        if (this.onBubbleComplete) {
            this.onBubbleComplete(bubbleId);
        }
    }

    // Bubble Management
    createBubble(startPos, targetPos, physics, personImage) {
        console.log(`🫧 Creating bubble from fish to target:`, {
            start: { x: (startPos.x * 100).toFixed(1) + '%', y: (startPos.y * 100).toFixed(1) + '%' },
            target: { x: (targetPos.x * 100).toFixed(1) + '%', y: (targetPos.y * 100).toFixed(1) + '%' },
            physics: physics
        });

        // Play bubble launch sound
        if (this.soundManager) {
            this.soundManager.playBubbleLaunch();
        }

        const bubble = {
            id: Date.now() + Math.random(),
            startX: startPos.x,
            startY: startPos.y,
            targetX: targetPos.x,
            targetY: targetPos.y,
            currentX: startPos.x,
            currentY: startPos.y,
            
            // Physics
            velocityX: 0,
            velocityY: 0,
            gravity: physics.gravity,
            launchPower: physics.launchPower,
            size: physics.bubbleSize,
            characterSizeMultiplier: (physics.characterSize || 50) / 50,
            
            // Animation state
            progress: 0,
            duration: 0,
            startTime: performance.now(),
            isComplete: false,
            
            // Visual
            personImage: personImage,
            opacity: 1,
            
            // Character rotation inside bubble
            characterRotation: Math.random() * Math.PI * 2, // Start at random angle
            characterRotationSpeed: (Math.random() - 0.5) * 8, // Random spin speed (-4 to +4 rad/s)
            
            // Effects
            ripples: [],
            hasExploded: false
        };

        // Calculate trajectory
        this.calculateTrajectory(bubble);
        this.animations.bubbles.push(bubble);
        
        return bubble;
    }

    calculateTrajectory(bubble) {
        const dx = bubble.targetX - bubble.startX;
        const dy = bubble.targetY - bubble.startY;
        
        console.log(`🫧 Calculating trajectory for bubble ${bubble.id}:`, {
            start: { x: bubble.startX, y: bubble.startY },
            target: { x: bubble.targetX, y: bubble.targetY },
            delta: { dx, dy }
        });
        
        // Calculate flight time based on distance (1-3 seconds)
        const distance = Math.sqrt(dx * dx + dy * dy);
        const flightTime = Math.max(1.5, Math.min(3.0, distance * 3));
        
        // Calculate horizontal velocity
        bubble.velocityX = dx / flightTime;
        
        // Calculate vertical velocity for parabolic arc
        // Scale gravity for relative coordinate system (0-1 represents full screen)
        // Use a much smaller gravity value that works with relative coordinates
        const gravity = 0.3; // Appropriate for relative coordinate system
        bubble.velocityY = (dy / flightTime) - (0.5 * gravity * flightTime);
        
        console.log(`🫧 Trajectory calculated:`, {
            distance,
            flightTime,
            velocityX: bubble.velocityX,
            velocityY: bubble.velocityY,
            gravity
        });
        
        // Store gravity
        bubble.gravity = gravity;
        bubble.flightTime = flightTime;
    }

    updateBubbles(deltaTime) {
        this.animations.bubbles = this.animations.bubbles.filter(bubble => {
            if (bubble.isComplete) return false;

            const dt = deltaTime / 1000; // Convert to seconds
            
            // Debug logging for the first few frames
            if (bubble.frameCount === undefined) bubble.frameCount = 0;
            bubble.frameCount++;
            
            if (bubble.frameCount === 1) {
                console.log(`🫧 Bubble ${bubble.id}: First frame`, {
                    dt,
                    deltaTime,
                    currentPos: { x: bubble.currentX, y: bubble.currentY },
                    startPos: { x: bubble.startX, y: bubble.startY },
                    targetPos: { x: bubble.targetX, y: bubble.targetY },
                    velocity: { x: bubble.velocityX, y: bubble.velocityY },
                    gravity: bubble.gravity
                });
            }

            // Update physics using relative coordinates
            bubble.currentX += bubble.velocityX * dt;
            bubble.currentY += bubble.velocityY * dt;
            bubble.velocityY += bubble.gravity * dt; // Apply gravity
            
            // Update character rotation inside bubble
            bubble.characterRotation += bubble.characterRotationSpeed * dt;

            // Check if bubble has reached target area (use relative distance)
            const distanceToTarget = Math.sqrt(
                Math.pow(bubble.currentX - bubble.targetX, 2) +
                Math.pow(bubble.currentY - bubble.targetY, 2)
            );

            // Convert bubble size to relative coordinates for collision detection
            const relativeBubbleSize = bubble.size / 1000; // Smaller collision area

            // Only check for target collision after bubble has traveled a bit
            const hasMovedEnough = Math.abs(bubble.currentX - bubble.startX) > 0.05 || 
                                  Math.abs(bubble.currentY - bubble.startY) > 0.05;

            // Check for collision or if bubble went off screen
            if ((distanceToTarget < relativeBubbleSize && hasMovedEnough) || 
                bubble.currentY > 1.1 || // Below screen
                bubble.currentX < -0.1 || bubble.currentX > 1.1) { // Off sides
                this.explodeBubble(bubble);
                return false;
            }

            return true;
        });
    }

    explodeBubble(bubble) {
        bubble.isComplete = true;
        bubble.hasExploded = true;

        console.log(`💥 Exploding bubble ${bubble.id} at position:`, {
            x: bubble.currentX,
            y: bubble.currentY,
            size: bubble.size
        });

        // Play bubble pop sound
        if (this.soundManager) {
            this.soundManager.playBubblePop();
        }

        // Create explosion particles with character size from bubble
        this.createImageExplosion(bubble.currentX, bubble.currentY, bubble.personImage, bubble.size, bubble.characterSizeMultiplier || 1);
        
        // Create splash particles
        this.createSplashParticles(bubble.currentX, bubble.currentY, true);

        console.log(`💥 Created particles:`, {
            totalParticles: this.animations.particles.length,
            particleTypes: this.animations.particles.map(p => p.type)
        });

        // Notify fish animation system with the correct bubble ID
        this.bubbleCompleted(bubble.id);
    }

    // Particle System
    createImageExplosion(x, y, personImage, bubbleSize, characterSizeMultiplier = 1) {
        if (!personImage) {
            console.log('❌ No person image for explosion');
            return;
        }

        console.log(`💥 Creating image explosion at (${(x*100).toFixed(1)}%, ${(y*100).toFixed(1)}%)`);

        // Check if this is an animated GIF
        const isAnimatedGif = personImage.src && personImage.src.includes('image/gif');
        
        if (isAnimatedGif) {
            console.log('🎭 Creating animated GIF explosion particles');
            
            // For animated GIFs, create multiple particles that share the same animated source
            // This ensures the GIF animation continues in the explosion
            this.createAnimatedGifExplosion(x, y, personImage, bubbleSize, characterSizeMultiplier);
        } else {
            // Regular static image explosion
            this.createStaticImageExplosion(x, y, personImage, bubbleSize, characterSizeMultiplier);
        }
    }

    createAnimatedGifExplosion(x, y, personImage, bubbleSize, characterSizeMultiplier = 1) {
        // Create just the main enlarged animated GIF particle (no fragments)
        const mainParticle = {
            type: 'enlarging_gif',
            x: x,
            y: y,
            vx: 0, // No horizontal movement
            vy: -0.015, // Slower upward drift
            size: bubbleSize * 1.2, // Start bigger than bubble size
            maxSize: bubbleSize * 4.0, // Much bigger max size
            life: 1,
            decay: 0.006, // Even slower fade for GIFs to show animation longer
            image: personImage,
            rotation: 0, // No rotation during pop - stays upright
            rotationSpeed: 0,
            scale: 1, // For enlarging effect
            enlargeSpeed: 1.5, // Slightly slower enlargement for longer visibility
            characterSizeMultiplier: characterSizeMultiplier * 2.5, // Bigger for GIFs
            isAnimatedGif: true,
            // Reference to the original GIF element to maintain animation
            gifElement: personImage
        };
        
        this.animations.particles.push(mainParticle);

        console.log(`✅ Created 1 animated GIF particle, total particles: ${this.animations.particles.length}`);
    }

    createStaticImageExplosion(x, y, personImage, bubbleSize, characterSizeMultiplier = 1) {
        // Create a single enlarged, fading image particle (no rotation during pop)
        this.animations.particles.push({
            type: 'enlarging_image',
            x: x,
            y: y,
            vx: 0, // No horizontal movement
            vy: -0.015, // Slower upward drift
            size: bubbleSize * 1.2, // Start bigger than bubble size
            maxSize: bubbleSize * 4.0, // Much bigger max size
            life: 1,
            decay: 0.008, // Slower fade to last longer
            image: personImage,
            rotation: 0, // No rotation during pop - stays upright
            rotationSpeed: 0,
            scale: 1, // For enlarging effect
            enlargeSpeed: 1.8, // Slightly slower enlargement for longer visibility
            characterSizeMultiplier: characterSizeMultiplier * 2 // Double the character size scaling
        });

        console.log(`✅ Created static image explosion particle, total particles: ${this.animations.particles.length}`);
    }

    createSplashParticles(x, y, isTargetHit) {
        const particleCount = isTargetHit ? 20 : 15;
        const colors = isTargetHit ? 
            ['#87CEEB', '#4682B4', '#1E90FF', '#00BFFF'] : 
            ['#87CEEB', '#B0E0E6', '#AFEEEE'];

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1; // Relative speed
            const size = 3 + Math.random() * 8;

            this.animations.particles.push({
                type: 'splash',
                x: x, // Already in relative coordinates
                y: y, // Already in relative coordinates
                vx: Math.cos(angle) * speed, // Relative velocity
                vy: Math.sin(angle) * speed - 0.03, // Relative velocity with upward bias
                size: size,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
                decay: 0.015,
                gravity: 0.2 // Relative gravity
            });
        }
    }

    updateParticles(deltaTime) {
        const dt = deltaTime / 1000;

        this.animations.particles = this.animations.particles.filter(particle => {
            // Update position
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;

            // Apply gravity for splash particles
            if (particle.type === 'splash' && particle.gravity) {
                particle.vy += particle.gravity * dt;
            }

            // Handle enlarging image particles (both static and animated GIFs)
            if (particle.type === 'enlarging_image' || particle.type === 'enlarging_gif') {
                // Initialize elapsed time tracking
                if (particle.elapsedTime === undefined) particle.elapsedTime = 0;
                particle.elapsedTime += dt;
                
                // Enlarge the particle over time - faster scaling
                particle.scale += particle.enlargeSpeed * dt;
                particle.size = Math.min(particle.size + (particle.enlargeSpeed * dt * 40), particle.maxSize);
                
                // Debug logging for first few frames (reduced logging)
                if (particle.debugFrames === undefined) particle.debugFrames = 0;
                particle.debugFrames++;
                if (particle.debugFrames <= 3) {
                    console.log(`🔍 Enlarging particle frame ${particle.debugFrames}:`, {
                        scale: particle.scale,
                        size: particle.size,
                        maxSize: particle.maxSize,
                        life: particle.life
                    });
                }
            }

            // Update life with delayed fade for enlarging images and GIFs
            if (particle.type === 'enlarging_image' || particle.type === 'enlarging_gif') {
                // Stay at full opacity for 1.5 seconds, then fade
                if (particle.elapsedTime > 1.5) {
                    particle.life -= particle.decay;
                }
                // Otherwise stay at full opacity (life = 1)
            } else {
                // Normal decay for other particles
                particle.life -= particle.decay;
            }

            // Update rotation for particles (except main enlarging particles which stay upright)
            if (particle.rotationSpeed && particle.type !== 'enlarging_image' && particle.type !== 'enlarging_gif') {
                particle.rotation += particle.rotationSpeed * dt;
            }

            // Check if particle should be removed
            const shouldKeep = particle.life > 0;
            
            // Clean up DOM elements for particles that are being removed
            if (!shouldKeep && particle.cleanup) {
                particle.cleanup();
            }

            return shouldKeep;
        });
    }

    // Animation Loop Management
    startAnimationLoop() {
        if (this.isRunning) return;
        
        console.log('🔄 Starting animation loop...');
        this.isRunning = true;
        let lastTime = performance.now();
        let frameCount = 0;
        
        const animate = (currentTime) => {
            if (!this.isRunning) return;
            
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            frameCount++;

            // Log occasionally to confirm loop is running
            if (frameCount % 300 === 0) { // Every 5 seconds at 60fps
                console.log(`🔄 Animation loop running (frame ${frameCount}), active fish: ${this.activeFish.size}`);
            }

            // Update all animations
            this.updateFishAnimation();
            this.updateBubbles(deltaTime);
            this.updateParticles(deltaTime);

            // Continue loop
            this.animationFrame = requestAnimationFrame(animate);
        };

        this.animationFrame = requestAnimationFrame(animate);
        console.log('✅ Animation loop started');
    }

    stopAnimationLoop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    resetAllAnimations() {
        console.log('🔄 Resetting all animations');
        
        // Clean up any DOM elements from animated GIF particles
        this.animations.particles.forEach(particle => {
            if (particle.cleanup) {
                particle.cleanup();
            }
        });
        
        // Clear all animations
        this.animations.bubbles = [];
        this.animations.particles = [];
        
        // Reset fish states to hidden below indicator
        this.fishStates.forEach((fishState, fishIndex) => {
            console.log(`🐟 Resetting fish ${fishIndex} to hidden state`);
            fishState.currentState = 'HIDDEN';
            fishState.currentY = this.fishConfig.baseOffset; // Hidden below indicator (+0.15)
            fishState.isActive = false;
        });
        
        // Clear active fish set
        this.activeFish.clear();
    }

    // Utility functions
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInCubic(t) {
        return t * t * t;
    }

    // Set sound manager reference
    setSoundManager(soundManager) {
        this.soundManager = soundManager;
        console.log('🔊 Sound manager connected to animation system');
    }

    // Getters
    getBubbles() {
        return this.animations.bubbles;
    }

    getParticles() {
        return this.animations.particles;
    }

    // Transition to next firing without going through full animation cycle
    transitionToNextFiring(fishIndex) {
        console.log(`🔄 Transitioning to next firing for fish ${fishIndex}`);
        const fishState = this.getFishState(fishIndex);
        
        // If fish is in any active state, quickly transition to opening
        if (fishState.currentState !== 'HIDDEN') {
            fishState.currentY = this.fishConfig.emergenceOffset; // Skip rising animation
            this.transitionFishToState(fishIndex, 'OPENING');
        } else {
            // Start fresh animation
            this.startFishAnimationAtPosition(fishIndex);
        }
    }
} 