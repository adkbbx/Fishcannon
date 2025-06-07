// 🎨 Renderer Module
// Handles all canvas drawing operations

export class Renderer {
    constructor(canvasManager, imageManager) {
        this.canvasManager = canvasManager;
        this.imageManager = imageManager;
    }

    // Main drawing coordination
    redrawCanvas(canvasId) {
        const ctx = this.canvasManager.getContext(canvasId);
        if (!ctx) return;

        this.canvasManager.clearCanvas(canvasId);

        switch (canvasId) {
            case 'backgroundCanvas':
                this.drawBackground();
                break;
            case 'fishCanvas':
                // Fish drawing is handled separately with position data
                break;
            case 'foregroundCanvas':
                this.drawForeground();
                break;
            case 'animationCanvas':
                // Animation drawing is handled separately with animation data
                break;
            case 'uiCanvas':
                this.drawUI();
                break;
        }
    }

    // Background layer drawing
    drawBackground() {
        const ctx = this.canvasManager.getContext('backgroundCanvas');
        if (!ctx) return;

        const backgroundImage = this.imageManager.getSelectedImage('background');
        if (backgroundImage) {
            const { width, height } = this.canvasManager.getCanvasSize('backgroundCanvas');
            this.canvasManager.drawImageToFit(ctx, backgroundImage, 0, 0, width, height);
        } else {
            // Default gradient background
            this.drawDefaultBackground(ctx);
        }
    }

    drawDefaultBackground(ctx) {
        const { width, height } = this.canvasManager.getCanvasSize('backgroundCanvas');
        
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');    // Sky blue
        gradient.addColorStop(0.7, '#E0F6FF');  // Light blue
        gradient.addColorStop(1, '#87CEEB');    // Sky blue

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    // Foreground layer drawing
    drawForeground() {
        const ctx = this.canvasManager.getContext('foregroundCanvas');
        if (!ctx) return;

        const foregroundImage = this.imageManager.getSelectedImage('foreground');
        if (foregroundImage) {
            const { width, height } = this.canvasManager.getCanvasSize('foregroundCanvas');
            this.canvasManager.drawImageToFit(ctx, foregroundImage, 0, 0, width, height);
        } else {
            // Default water foreground
            this.drawDefaultForeground(ctx);
        }
    }

    drawDefaultForeground(ctx) {
        const { width, height } = this.canvasManager.getCanvasSize('foregroundCanvas');
        
        // Water gradient (semi-transparent)
        const waterGradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
        waterGradient.addColorStop(0, 'rgba(64, 164, 223, 0.1)');
        waterGradient.addColorStop(0.5, 'rgba(32, 137, 203, 0.3)');
        waterGradient.addColorStop(1, 'rgba(25, 118, 210, 0.5)');

        ctx.fillStyle = waterGradient;
        ctx.fillRect(0, height * 0.6, width, height * 0.4);

        // Water surface line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.6);
        ctx.lineTo(width, height * 0.6);
        ctx.stroke();
    }

    // Fish drawing
    drawFish(fishStates, positions) {
        const ctx = this.canvasManager.getContext('fishCanvas');
        if (!ctx) return;

        const { width, height } = this.canvasManager.getCanvasSize('fishCanvas');
        
        // In multi-mode, show all fish positions
        if (window.fishcannonApp?.uiController?.multiMode) {
            const multiPositions = window.fishcannonApp.uiController.multiPositions.fish;
            
            multiPositions.forEach((fishPos, index) => {
                const x = fishPos.x * width;
                let y = fishPos.y * height;
                let isAnimating = false;
                let currentState = 'HIDDEN';
                
                // Get the animation state for this specific fish
                const animationSystem = window.fishcannonApp?.animationSystem;
                if (animationSystem) {
                    const fishState = animationSystem.getFishState(index);
                    if (fishState && fishState.currentState !== 'HIDDEN') {
                        // Apply the Y offset: positive currentY moves fish UP from indicator
                        y = (fishPos.y + fishState.currentY) * height;
                        isAnimating = true;
                        currentState = fishState.currentState;
                        
                        // Debug logging for fish position during animation
                        if (Math.random() < 0.05) { // Log occasionally
                            console.log(`🐟 Fish ${index} rendering:`, {
                                indicatorY: (fishPos.y * 100).toFixed(1) + '%',
                                currentYOffset: fishState.currentY,
                                finalY: ((fishPos.y + fishState.currentY) * 100).toFixed(1) + '%',
                                state: currentState
                            });
                        }
                    }
                }
                
                // Determine fish state for this position
                const isOpen = isAnimating && (currentState === 'OPENING' || 
                                             currentState === 'FIRING' || 
                                             currentState === 'WAITING');
                
                // Draw fish sprite or fallback to emoji
                this.drawFishSprite(ctx, x, y, isOpen, isAnimating, index + 1);
                
                // Add water ripples for animating fish
                if (isAnimating && currentState !== 'HIDDEN') {
                    this.drawWaterRipples(ctx, x, y);
                }
            });
        } else {
            // Single mode - use backward compatibility with fishStates parameter
            const fishState = fishStates || { currentState: 'HIDDEN', currentY: 0, currentFishIndex: 0 };
            
            if (fishState.currentState !== 'HIDDEN') {
                const x = positions.fish.x * width;
                // Apply the Y offset: positive currentY moves fish UP from indicator
                const y = (positions.fish.y + fishState.currentY) * height;
                
                console.log(`🐟 Single fish rendering:`, {
                    indicatorY: (positions.fish.y * 100).toFixed(1) + '%',
                    currentYOffset: fishState.currentY,
                    finalY: ((positions.fish.y + fishState.currentY) * 100).toFixed(1) + '%',
                    state: fishState.currentState
                });
                
                const isOpen = fishState.currentState === 'OPENING' || 
                              fishState.currentState === 'FIRING' || 
                              fishState.currentState === 'WAITING';
                
                this.drawFishSprite(ctx, x, y, isOpen, true, 1);
                
                if (fishState.currentState !== 'HIDDEN') {
                    this.drawWaterRipples(ctx, x, y);
                }
            }
        }
    }

    drawFishSprite(ctx, x, y, isOpen, isAnimating = true, fishNumber = 1) {
        // Don't draw static fish sprites when indicators are hidden (only draw animating fish)
        if (!isAnimating && !window.fishcannonApp?.uiController?.areIndicatorsVisible()) {
            return;
        }
        
        // Try to get fish sprite from ImageManager
        const fishSprite = this.imageManager.getFishSprite(isOpen);
        
        if (fishSprite) {
            // Use actual fish sprite - scale with sprite size setting
            const spriteMultiplier = (window.fishcannonApp?.uiController?.physics?.spriteSize || 100) / 100;
            const baseSize = (isAnimating ? 120 : 80) * spriteMultiplier;
            const fishWidth = baseSize * 1.5;
            const fishHeight = baseSize;
            
            ctx.save();
            
            // Add glow effect for animating fish
            if (isAnimating) {
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 15;
            }
            
            ctx.drawImage(
                fishSprite,
                x - fishWidth / 2,
                y - fishHeight / 2,
                fishWidth,
                fishHeight
            );
            
            ctx.restore();
        } else {
            // Fallback to emoji if no sprite available
            this.drawEmojiFish(ctx, x, y, isOpen, isAnimating, fishNumber);
        }
        
        // Draw fish number for identification (only for static fish AND if indicators are visible)
        if (!isAnimating && window.fishcannonApp?.uiController?.areIndicatorsVisible()) {
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textY = y + (isAnimating ? 35 : 25);
            ctx.strokeText(`F${fishNumber}`, x, textY);
            ctx.fillText(`F${fishNumber}`, x, textY);
            ctx.restore();
        }
    }

    drawEmojiFish(ctx, x, y, isOpen, isAnimating = true, fishNumber = 1) {
        // Don't draw static fish when indicators are hidden (only draw animating fish)
        if (!isAnimating && !window.fishcannonApp?.uiController?.areIndicatorsVisible()) {
            return;
        }
        
        ctx.save();
        
        // Base fish styling - scale with sprite size setting
        const spriteMultiplier = (window.fishcannonApp?.uiController?.physics?.spriteSize || 100) / 100;
        const baseSize = (isAnimating ? 80 : 60) * spriteMultiplier;
        const glowIntensity = isAnimating ? 0.8 : 0.3;
        
        // Glow effect (stronger for animating fish)
        ctx.shadowColor = isAnimating ? '#00ffff' : '#0088cc';
        ctx.shadowBlur = isAnimating ? 15 : 8;
        
        // Draw fish emoji
        ctx.font = `${baseSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isOpen) {
            ctx.fillText('🐟', x, y); // Open mouth fish
        } else {
            ctx.fillText('🐠', x, y); // Closed mouth fish
        }
        
        // Draw fish number for identification
        if (!isAnimating) {
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText(fishNumber.toString(), x, y + baseSize/2 + 15);
            ctx.fillText(fishNumber.toString(), x, y + baseSize/2 + 15);
        }
        
        ctx.restore();
    }

    drawWaterRipples(ctx, centerX, centerY) {
        const time = Date.now() / 1000;
        const rippleCount = 3;
        
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.3)';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < rippleCount; i++) {
            const phase = (time * 2 + i * 0.5) % 2;
            const radius = phase * 30 + 10;
            const opacity = 1 - phase / 2;
            
            ctx.strokeStyle = `rgba(135, 206, 235, ${opacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Animation layer drawing
    drawAnimations(bubbles, particles, showTrajectory, positions, physics) {
        const ctx = this.canvasManager.getContext('animationCanvas');
        if (!ctx) return;

        // Draw trajectory if enabled
        if (showTrajectory) {
            this.drawTrajectory(ctx, positions, physics);
        }

        // Draw multi-mode indicators if enabled
        this.drawMultiModeIndicators(ctx);

        // Draw bubbles
        bubbles.forEach(bubble => {
            this.drawBubble(ctx, bubble);
        });

        // Draw particles
        particles.forEach(particle => {
            this.drawParticle(ctx, particle);
        });
    }

    drawTrajectory(ctx, positions, physics) {
        const { width, height } = this.canvasManager.getCanvasSize('animationCanvas');
        
        const startX = positions.fish.x * width;
        const startY = positions.fish.y * height;
        const targetX = positions.target.x * width;
        const targetY = positions.target.y * height;

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        // Draw parabolic arc
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = startX + (targetX - startX) * t;
            const y = startY + (targetY - startY) * t + physics.gravity * t * t * 20;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawBubble(ctx, bubble) {
        const { width, height } = this.canvasManager.getCanvasSize('animationCanvas');
        
        const x = bubble.currentX * width;
        const y = bubble.currentY * height;
        const size = bubble.size;
        


        // Bubble outline
        ctx.strokeStyle = 'rgba(135, 206, 235, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();

        // Bubble fill with gradient
        const bubbleGradient = ctx.createRadialGradient(x - size/3, y - size/3, 0, x, y, size);
        bubbleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        bubbleGradient.addColorStop(0.7, 'rgba(135, 206, 235, 0.3)');
        bubbleGradient.addColorStop(1, 'rgba(135, 206, 235, 0.1)');
        
        ctx.fillStyle = bubbleGradient;
        ctx.fill();

        // Person image inside bubble (if available) with rotation
        if (bubble.personImage) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
            ctx.clip();
            
            // Apply rotation to the character image
            ctx.translate(x, y);
            if (bubble.characterRotation) {
                ctx.rotate(bubble.characterRotation);
            }
            
            // Calculate proper aspect ratio for the character image inside bubble
            const baseImgSize = size * 1.4;
            const imageAspectRatio = bubble.personImage.width / bubble.personImage.height;
            let imgWidth, imgHeight;
            
            if (imageAspectRatio > 1) {
                // Landscape: width is larger
                imgWidth = baseImgSize;
                imgHeight = baseImgSize / imageAspectRatio;
            } else {
                // Portrait or square: height is larger or equal
                imgHeight = baseImgSize;
                imgWidth = baseImgSize * imageAspectRatio;
            }
            
            // Handle animated GIFs in bubbles
            if (bubble.personImage.src && bubble.personImage.src.includes('image/gif')) {
                // Debug log for GIF detection in bubbles
                if (!bubble.gifDebugLogged) {
                    console.log(`🎭 Animated GIF bubble detected:`, {
                        src: bubble.personImage.src.substring(0, 50) + '...',
                        width: bubble.personImage.width,
                        height: bubble.personImage.height,
                        complete: bubble.personImage.complete
                    });
                    bubble.gifDebugLogged = true;
                }
                
                // Mark as animated GIF for frequent redraws
                if (!bubble.hasAnimatedGif) {
                    bubble.hasAnimatedGif = true;
                    if (window.fishcannonApp && window.fishcannonApp.needsGifRedraw !== true) {
                        window.fishcannonApp.needsGifRedraw = true;
                        console.log('🎭 Enabled frequent redraws for animated GIF in bubbles');
                    }
                }
            }
            
            ctx.drawImage(
                bubble.personImage,
                -imgWidth / 2,
                -imgHeight / 2,
                imgWidth,
                imgHeight
            );
            ctx.restore();
        }

        // Bubble shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(x - size/3, y - size/3, size/4, size/6, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawParticle(ctx, particle) {
        const { width, height } = this.canvasManager.getCanvasSize('animationCanvas');
        
        // Convert relative coordinates to pixel coordinates
        const x = particle.x * width;
        const y = particle.y * height;
        
        // Special handling for animated GIF particles - use DOM positioning instead of canvas
        if ((particle.type === 'enlarging_gif') && particle.image && particle.isAnimatedGif) {
            this.handleAnimatedGifParticle(particle, x, y, width, height);
            return; // Don't draw on canvas, use DOM element instead
        }
        
        ctx.save();
        ctx.globalAlpha = particle.life;

        if ((particle.type === 'image' || particle.type === 'enlarging_image') && particle.image) {
            // Image particle with rotation and character size scaling
            ctx.translate(x, y);
            if (particle.rotation) {
                ctx.rotate(particle.rotation);
            }
            
            // Apply character size scaling
            const characterSizeMultiplier = particle.characterSizeMultiplier || 1;
            const baseSize = particle.size * characterSizeMultiplier;
            
            // Calculate proper aspect ratio for the image
            const imageAspectRatio = particle.image.width / particle.image.height;
            let renderWidth, renderHeight;
            
            if (imageAspectRatio > 1) {
                // Landscape: width is larger
                renderWidth = baseSize;
                renderHeight = baseSize / imageAspectRatio;
            } else {
                // Portrait or square: height is larger or equal
                renderHeight = baseSize;
                renderWidth = baseSize * imageAspectRatio;
            }
            
            // Debug logging for enlarging particles (minimal)
            if ((particle.type === 'enlarging_image' || particle.type === 'enlarging_gif') && particle.debugRenderFrames === undefined) {
                particle.debugRenderFrames = 0;
                console.log(`🎨 Starting to render enlarging particle at (${x.toFixed(1)}, ${y.toFixed(1)})`, {
                    originalSize: `${particle.image.width}x${particle.image.height}`,
                    aspectRatio: imageAspectRatio.toFixed(2),
                    renderSize: `${renderWidth.toFixed(1)}x${renderHeight.toFixed(1)}`
                });
            }
            
            ctx.drawImage(
                particle.image,
                -renderWidth / 2,
                -renderHeight / 2,
                renderWidth,
                renderHeight
            );
        } else if (particle.type === 'splash') {
            // Splash particle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Handle animated GIF particles using positioned DOM elements
    handleAnimatedGifParticle(particle, x, y, canvasWidth, canvasHeight) {
        // Create or update the DOM element for this GIF particle
        if (!particle.domElement) {
            // Create a new DOM element for this animated GIF
            const gifElement = document.createElement('img');
            gifElement.src = particle.image.src;
            gifElement.style.position = 'absolute';
            gifElement.style.pointerEvents = 'none';
            gifElement.style.zIndex = '1000'; // Above canvas
            gifElement.style.transformOrigin = 'center center';
            
            // Get canvas position for proper positioning
            const canvas = this.canvasManager.getCanvas('animationCanvas');
            const canvasRect = canvas.getBoundingClientRect();
            
            document.body.appendChild(gifElement);
            particle.domElement = gifElement;
            
            console.log(`🎭 Created DOM element for animated GIF particle:`, {
                src: particle.image.src.substring(0, 50) + '...',
                canvasRect: { x: canvasRect.left, y: canvasRect.top, w: canvasRect.width, h: canvasRect.height }
            });
        }
        
        // Update the DOM element's position, size, and opacity
        const characterSizeMultiplier = particle.characterSizeMultiplier || 1;
        const baseSize = particle.size * characterSizeMultiplier;
        
        // Calculate proper aspect ratio for the image
        const imageAspectRatio = particle.image.width / particle.image.height;
        let renderWidth, renderHeight;
        
        if (imageAspectRatio > 1) {
            // Landscape: width is larger
            renderWidth = baseSize;
            renderHeight = baseSize / imageAspectRatio;
        } else {
            // Portrait or square: height is larger or equal
            renderHeight = baseSize;
            renderWidth = baseSize * imageAspectRatio;
        }
        
        // Get canvas position for proper positioning
        const canvas = this.canvasManager.getCanvas('animationCanvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        // Position the DOM element relative to the canvas
        const domX = canvasRect.left + x - (renderWidth / 2);
        const domY = canvasRect.top + y - (renderHeight / 2);
        
        particle.domElement.style.left = `${domX}px`;
        particle.domElement.style.top = `${domY}px`;
        particle.domElement.style.width = `${renderWidth}px`;
        particle.domElement.style.height = `${renderHeight}px`;
        particle.domElement.style.opacity = particle.life;
        
        // Store cleanup function on the particle
        if (!particle.cleanup) {
            particle.cleanup = () => {
                if (particle.domElement && particle.domElement.parentNode) {
                    particle.domElement.parentNode.removeChild(particle.domElement);
                    console.log('🎭 Cleaned up animated GIF DOM element');
                }
            };
        }
    }

    // UI layer drawing
    drawUI() {
        const ctx = this.canvasManager.getContext('uiCanvas');
        if (!ctx) return;

        // UI elements like target indicator can be drawn here
        // Most UI is handled by HTML/CSS, but canvas overlays can be added here
    }

    drawTargetIndicator(ctx, positions) {
        const { width, height } = this.canvasManager.getCanvasSize('uiCanvas');
        
        const targetX = positions.target.x * width;
        const targetY = positions.target.y * height;
        
        // Draw target crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        const size = 20;
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(targetX - size, targetY);
        ctx.lineTo(targetX + size, targetY);
        ctx.stroke();
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(targetX, targetY - size);
        ctx.lineTo(targetX, targetY + size);
        ctx.stroke();
        
        // Outer circle
        ctx.beginPath();
        ctx.arc(targetX, targetY, size * 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // GIF Animation Support
    ensureGifAnimationContinues(particle) {
        // Mark this particle as containing an animated GIF
        if (!particle.hasAnimatedGif) {
            particle.hasAnimatedGif = true;
            
            // Trigger more frequent redraws for this particle type
            // The main render loop will handle the actual redrawing
            if (window.fishcannonApp && window.fishcannonApp.needsGifRedraw !== true) {
                window.fishcannonApp.needsGifRedraw = true;
                console.log('🎭 Enabled frequent redraws for animated GIF particles');
            }
        }
    }

    // Utility methods
    drawText(ctx, text, x, y, options = {}) {
        const {
            font = '16px Arial',
            color = '#ffffff',
            align = 'center',
            baseline = 'middle',
            shadow = true
        } = options;

        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;

        if (shadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        ctx.fillText(text, x, y);

        if (shadow) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
    }

    // Redraw all canvases
    redrawAll() {
        this.canvasManager.layers.forEach(layerId => {
            this.redrawCanvas(layerId);
        });
    }

    drawMultiModeIndicators(ctx) {
        // Get the UI controller from the global app instance
        const uiController = window.fishcannonApp?.uiController;
        if (!uiController) return;
        if (!uiController.multiMode) return;
        
        // Always respect indicator visibility setting
        if (!uiController.areIndicatorsVisible()) {
            // console.log('🙈 Multi-mode indicators hidden due to visibility setting');
            return;
        }

        const { width, height } = this.canvasManager.getCanvasSize('animationCanvas');
        
        // Draw fish positions
        uiController.multiPositions.fish.forEach((pos, index) => {
            const x = pos.x * width;
            const y = pos.y * height;
            
            ctx.save();
            ctx.strokeStyle = '#00ff00';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = 3;
            
            // Draw fish indicator circle
            ctx.beginPath();
            ctx.arc(x, y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw fish ID
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`F${pos.id}`, x, y);
            
            ctx.restore();
        });

        // Draw target positions
        uiController.multiPositions.target.forEach((pos, index) => {
            const x = pos.x * width;
            const y = pos.y * height;
            
            ctx.save();
            ctx.strokeStyle = '#ff0000';
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 3;
            
            // Draw target indicator circle
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw target ID
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`T${pos.id}`, x, y);
            
            ctx.restore();
        });

        // Draw pairing lines if there are multiple positions
        if (uiController.multiPositions.fish.length > 1 || uiController.multiPositions.target.length > 1) {
            const pairings = uiController.generateSmartPairings();
            
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            pairings.forEach(pairing => {
                const fishPos = uiController.multiPositions.fish[pairing.fishIndex];
                const targetPos = uiController.multiPositions.target[pairing.targetIndex];
                
                const fishX = fishPos.x * width;
                const fishY = fishPos.y * height;
                const targetX = targetPos.x * width;
                const targetY = targetPos.y * height;
                
                ctx.beginPath();
                ctx.moveTo(fishX, fishY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();
            });
            
            ctx.restore();
        }
    }
} 