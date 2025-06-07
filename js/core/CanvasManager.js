// 🎨 Canvas Management Module
// Handles canvas setup, resizing, and drawing coordination

import { CANVAS_LAYERS } from '../utils/Constants.js';
import { createLogger } from '../utils/Logger.js';

export class CanvasManager {
    constructor() {
        this.logger = createLogger('CanvasManager');
        this.canvases = {};
        this.contexts = {};
        this.layers = Object.values(CANVAS_LAYERS);
    }

    setupCanvases() {
        this.logger.canvas('Setting up canvas layers...');
        
        this.layers.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                this.canvases[id] = canvas;
                this.contexts[id] = canvas.getContext('2d');
                this.resizeCanvas(canvas);
            } else {
                this.logger.error('Canvas ' + id + ' not found');
            }
        });

        window.addEventListener('resize', () => this.resizeAllCanvases());
    }

    resizeCanvas(canvas) {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Trigger redraw after resize
        this.requestRedraw(canvas.id);
    }

    resizeAllCanvases() {
        Object.values(this.canvases).forEach(canvas => {
            this.resizeCanvas(canvas);
        });
    }

    clearCanvas(canvasId) {
        const ctx = this.contexts[canvasId];
        if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    getCanvas(canvasId) {
        return this.canvases[canvasId];
    }

    getContext(canvasId) {
        return this.contexts[canvasId];
    }

    getCanvasSize(canvasId) {
        const canvas = this.canvases[canvasId];
        return canvas ? { width: canvas.width, height: canvas.height } : null;
    }

    // Method to be overridden by main app for redraw coordination
    requestRedraw(canvasId) {
        // This will be set by the main app
        if (this.onRedrawRequested) {
            this.onRedrawRequested(canvasId);
        }
    }

    // Utility method for drawing images/videos to fit within bounds
    drawImageToFit(ctx, element, x, y, width, height) {
        if (!element) return;
        
        // Check if element is ready for drawing
        const isImage = element instanceof HTMLImageElement;
        const isVideo = element instanceof HTMLVideoElement;
        
        if (isImage && !element.complete) return;
        if (isVideo && (element.readyState < 2 || element.videoWidth === 0)) return; // HAVE_CURRENT_DATA or higher and valid dimensions
        
        // Get element dimensions
        let elementWidth, elementHeight;
        if (isVideo) {
            elementWidth = element.videoWidth || element.width;
            elementHeight = element.videoHeight || element.height;
        } else {
            elementWidth = element.width;
            elementHeight = element.height;
        }
        
        if (elementWidth === 0 || elementHeight === 0) return;

        const elementAspect = elementWidth / elementHeight;
        const targetAspect = width / height;

        let drawWidth, drawHeight, drawX, drawY;

        if (elementAspect > targetAspect) {
            // Element is wider than target
            drawHeight = height;
            drawWidth = height * elementAspect;
            drawX = x - ((drawWidth - width) / 2);
            drawY = y;
        } else {
            // Element is taller than target
            drawWidth = width;
            drawHeight = width / elementAspect;
            drawX = x;
            drawY = y - ((drawHeight - height) / 2);
        }

        ctx.drawImage(element, drawX, drawY, drawWidth, drawHeight);
    }
} 