
class BackgroundCustomHandler {
    constructor(containerSelector = '#backgroundarea') {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.error(`Container ${containerSelector} not found`);
            return;
        }

        this.canvas = null;
        this.ctx = null;
        this.elements = [];
        this.loadedImages = new Map();
        this.isLoading = false;
        this.normalizedWidth = 1000;
        this.normalizedHeight = 1000;
        this.maxZIndex = 15;
        this.enabled = true; // Background system enabled state

        this.init();
        this.setupResizeHandler();
    }

    /**
     * Initialize the canvas
     */
    init() {
        // Check if backgrounds are enabled via cookie
        this.checkEnabled();

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'background-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.pointerEvents = 'none';

        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.resize();
        this.updateVisibility();
    }

    /**
     * Check if custom backgrounds are enabled
     */
    checkEnabled() {
        // Check cookie - default to true if not set
        if (typeof getCookie === 'function') {
            const setting = getCookie('customBackgrounds');
            this.enabled = setting !== 'false';
        } else {
            this.enabled = true;
        }
    }

    /**
     * Enable or disable the background system
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.updateVisibility();

        if (typeof setCookie === 'function') {
            setCookie('customBackgrounds', enabled);
        }
    }

    /**
     * Update canvas visibility based on enabled state
     */
    updateVisibility() {
        if (this.canvas) {
            this.canvas.style.display = this.enabled ? 'block' : 'none';
        }
    }

    /**
     * Handle window resize to maintain aspect ratio
     */
    resize() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set actual canvas size (accounting for DPR for crisp rendering)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Scale context to account for DPR
        this.ctx.scale(dpr, dpr);

        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Store actual rendering dimensions
        this.renderWidth = rect.width;
        this.renderHeight = rect.height;

        // Redraw with new dimensions
        if (this.elements.length > 0) {
            this.render();
        }
    }

    /**
     * Setup resize handler with debouncing
     */
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
            }, 100);
        });
    }

    /**
     * Convert normalized coordinates to actual canvas coordinates
     * Supports both fixed (0-1000) and percentage-based positioning
     */
    normalizeToCanvas(x, y, width, height, element = {}) {
        // Check if using percentage-based positioning (relative to screen)
        const usePercentage = element.positionMode === 'percentage';

        if (usePercentage) {
            // Percentage mode: Values are 0-100, scaled to actual screen size
            // This keeps elements visible on all screen sizes/aspect ratios
            return {
                x: (x / 100) * this.renderWidth,
                y: (y / 100) * this.renderHeight,
                width: (width / 100) * this.renderWidth,
                height: (height / 100) * this.renderHeight
            };
        } else {
            // Normalized mode (default): Values are 0-1000, maintaining aspect ratio
            // This preserves exact layout but may go off-screen on different aspect ratios
            return {
                x: (x / this.normalizedWidth) * this.renderWidth,
                y: (y / this.normalizedHeight) * this.renderHeight,
                width: (width / this.normalizedWidth) * this.renderWidth,
                height: (height / this.normalizedHeight) * this.renderHeight
            };
        }
    }

    /**
     * Load a single image
     */
    async loadImage(src) {
        // Check if already loaded
        if (this.loadedImages.has(src)) {
            return this.loadedImages.get(src);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadedImages.set(src, img);
                resolve(img);
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${src}`);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    }

    /**
     * Load background configuration from JSON
     * Expected format:
     * {
     *   "elements": [
     *     {
     *       "id": "mountain1",
     *       "asset": "./assets/mountain1.png",
     *       "x": 100,
     *       "y": 500,
     *       "z": 3,
     *       "width": 400,
     *       "height": 300,
     *       "opacity": 1.0,
     *       "scaleWithScreen": true
     *     }
     *   ]
     * }
     */
    async loadFromJSON(jsonPath) {
        if (this.isLoading) {
            console.warn('Already loading a configuration');
            return;
        }

        this.isLoading = true;

        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const config = await response.json();
            await this.loadConfiguration(config);
        } catch (error) {
            console.error('Error loading background configuration:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Load background from configuration object
     */
    async loadConfiguration(config) {
        if (!config.elements || !Array.isArray(config.elements)) {
            throw new Error('Invalid configuration: missing elements array');
        }

        // Validate and store elements
        this.elements = config.elements.map(element => {
            return this.validateElement(element);
        });

        // Sort by z-index (lower z = render first = further back)
        this.elements.sort((a, b) => a.z - b.z);

        // Preload all images
        const imagePromises = this.elements.map(element =>
            this.loadImage(element.asset)
        );

        try {
            await Promise.all(imagePromises);
            console.log('All background images loaded successfully');
            this.render();
        } catch (error) {
            console.error('Error loading background images:', error);
            throw error;
        }
    }

    /**
     * Validate and normalize element configuration
     */
    validateElement(element) {
        // Determine positioning mode
        const positionMode = element.positionMode || 'normalized'; // 'normalized' or 'percentage'
        const maxValue = positionMode === 'percentage' ? 100 : this.normalizedWidth;
        const maxHeight = positionMode === 'percentage' ? 100 : this.normalizedHeight;

        const validated = {
            id: element.id || `element_${Date.now()}_${Math.random()}`,
            asset: element.asset,
            x: this.clamp(element.x || 0, 0, maxValue),
            y: this.clamp(element.y || 0, 0, maxHeight),
            z: this.clamp(element.z || 1, 1, this.maxZIndex),
            width: element.width || 100,
            height: element.height || 100,
            opacity: this.clamp(element.opacity !== undefined ? element.opacity : 1.0, 0, 1),
            scaleWithScreen: element.scaleWithScreen !== false, // default true
            rotation: element.rotation || 0, // in degrees
            flipHorizontal: element.flipHorizontal || false,
            flipVertical: element.flipVertical || false,
            blendMode: element.blendMode || 'source-over',
            positionMode: positionMode, // 'normalized' (0-1000) or 'percentage' (0-100)
            anchor: element.anchor || 'top-left' // Anchor point: 'top-left', 'center', 'top-right', etc.
        };

        if (!validated.asset) {
            throw new Error('Element missing required "asset" property');
        }

        return validated;
    }

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Render all elements to canvas
     */
    render() {
        if (!this.ctx || !this.enabled) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.renderWidth, this.renderHeight);

        // Render each element in z-order
        for (const element of this.elements) {
            this.renderElement(element);
        }
    }

    /**
     * Render a single element
     */
    renderElement(element) {
        const img = this.loadedImages.get(element.asset);
        if (!img) {
            console.warn(`Image not loaded for element: ${element.id}`);
            return;
        }

        // Convert normalized coordinates to canvas coordinates, passing element for mode detection
        const coords = this.normalizeToCanvas(
            element.x,
            element.y,
            element.width,
            element.height,
            element
        );

        // Calculate anchor offset based on anchor point
        const anchorOffset = this.getAnchorOffset(element.anchor, coords.width, coords.height);

        // Save context state
        this.ctx.save();

        // Set opacity
        this.ctx.globalAlpha = element.opacity;

        // Set blend mode
        this.ctx.globalCompositeOperation = element.blendMode;

        // Apply transformations with anchor offset
        const centerX = coords.x + anchorOffset.x;
        const centerY = coords.y + anchorOffset.y;
        this.ctx.translate(centerX, centerY);

        if (element.rotation !== 0) {
            this.ctx.rotate((element.rotation * Math.PI) / 180);
        }

        let scaleX = 1;
        let scaleY = 1;

        if (element.flipHorizontal) scaleX = -1;
        if (element.flipVertical) scaleY = -1;

        if (scaleX !== 1 || scaleY !== 1) {
            this.ctx.scale(scaleX, scaleY);
        }

        // Draw image relative to anchor point
        this.ctx.drawImage(
            img,
            -anchorOffset.x,
            -anchorOffset.y,
            coords.width,
            coords.height
        );

        // Restore context state
        this.ctx.restore();
    }

    /**
     * Get anchor offset for positioning
     * Supports: top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
     */
    getAnchorOffset(anchor, width, height) {
        switch (anchor) {
            case 'top-left':
                return { x: 0, y: 0 };
            case 'top-center':
                return { x: width / 2, y: 0 };
            case 'top-right':
                return { x: width, y: 0 };
            case 'center-left':
                return { x: 0, y: height / 2 };
            case 'center':
                return { x: width / 2, y: height / 2 };
            case 'center-right':
                return { x: width, y: height / 2 };
            case 'bottom-left':
                return { x: 0, y: height };
            case 'bottom-center':
                return { x: width / 2, y: height };
            case 'bottom-right':
                return { x: width, y: height };
            default:
                return { x: 0, y: 0 }; // Default to top-left
        }
    }

    /**
     * Add a single element dynamically
     */
    async addElement(element) {
        const validated = this.validateElement(element);

        // Load the image
        await this.loadImage(validated.asset);

        // Add to elements array
        this.elements.push(validated);

        // Re-sort by z-index
        this.elements.sort((a, b) => a.z - b.z);

        // Re-render
        this.render();

        return validated.id;
    }

    /**
     * Remove an element by ID
     */
    removeElement(id) {
        const index = this.elements.findIndex(el => el.id === id);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.render();
            return true;
        }
        return false;
    }

    /**
     * Update an element's properties
     */
    updateElement(id, updates) {
        const element = this.elements.find(el => el.id === id);
        if (!element) {
            console.warn(`Element not found: ${id}`);
            return false;
        }

        // Update properties
        Object.assign(element, updates);

        // Re-validate
        const index = this.elements.findIndex(el => el.id === id);
        this.elements[index] = this.validateElement(element);

        // Re-sort if z changed
        if (updates.z !== undefined) {
            this.elements.sort((a, b) => a.z - b.z);
        }

        // Re-render
        this.render();
        return true;
    }

    /**
     * Clear all elements
     */
    clear() {
        this.elements = [];
        this.loadedImages.clear();
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.renderWidth, this.renderHeight);
        }
    }

    /**
     * Get current configuration as JSON
     */
    exportConfiguration() {
        return {
            elements: this.elements.map(el => ({ ...el }))
        };
    }

    /**
     * Destroy the handler and clean up
     */
    destroy() {
        window.removeEventListener('resize', this.resize);
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.clear();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundCustomHandler;
}

// Global instance
let backgroundHandler = null;

/**
 * Initialize the background handler
 */
function initBackgroundHandler(containerSelector = '#backgroundarea') {
    if (backgroundHandler) {
        console.warn('Background handler already initialized');
        return backgroundHandler;
    }

    backgroundHandler = new BackgroundCustomHandler(containerSelector);
    return backgroundHandler;
}

/**
 * Load background from JSON file
 */
async function loadBackgroundFromJSON(jsonPath) {
    if (!backgroundHandler) {
        console.error('Background handler not initialized. Call initBackgroundHandler() first.');
        return;
    }

    try {
        await backgroundHandler.loadFromJSON(jsonPath);
        console.log('Background loaded successfully');
    } catch (error) {
        console.error('Failed to load background:', error);
    }
}