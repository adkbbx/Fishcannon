// 🎮 UI Controller Module
// Handles UI interactions, event listeners, and position indicators

export class UIController {
    constructor() {
        this.elements = {};
        this.positions = {
            fish: { x: 0.50, y: 0.50 },    // 50%, 50%
            target: { x: 0.50, y: 0.90 }   // 50%, 90%
        };
        // Enhanced multiple positions for multi-target mode
        this.multiPositions = {
            fish: [
                { x: 0.50, y: 0.50, id: 1 }    // Default fish at 50%, 50%
            ],
            target: [
                { x: 0.10, y: 0.90, id: 1 },   // 10%, 90%
                { x: 0.30, y: 0.90, id: 2 },   // 30%, 90%
                { x: 0.50, y: 0.90, id: 3 },   // 50%, 90%
                { x: 0.70, y: 0.90, id: 4 },   // 70%, 90%
                { x: 0.90, y: 0.90, id: 5 }    // 90%, 90%
            ]
        };
        this.multiMode = false;
        this.maxPositions = 8; // Increased limit
        this.nextFishId = 2;
        this.nextTargetId = 6;
        this.physics = {
            bubbleSize: 40,
            characterSize: 50,
            spriteSize: 100
        };
        this.indicatorsVisible = true;
        this.maxIndicators = 5; // Maximum number of indicators
        this.draggedIndicator = null; // Track which indicator is being dragged
        this.multiModeIndicators = []; // Store DOM elements for multimode indicators
        
        // Callbacks
        this.onPositionUpdate = null;
        this.onPhysicsUpdate = null;
        this.onTestFire = null;
        this.onResetPositions = null;
        this.onToggleIndicators = null;
        this.onCanvasClick = null;
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupPositionIndicators();
        this.updateUI();
        this.updateIndicatorVisibility();
        this.updateMultiModeIndicators(); // Initialize multimode indicators
        
        // Don't force reset - preserve user-set positions across page refreshes
        // Positions will only reset when user explicitly clicks "Reset Positions" button
    }

    setupElements() {
        console.log('🎮 Setting up UI elements...');
        
        const elementIds = [
            'fishIndicator', 'targetIndicator',
            'testFireButton', 'resetPositionsButton', 'toggleIndicatorsButton',
            'toggleMultiModeButton', 'multiModeButtonText', 'multiModeControls', 'multiModeHelp',
            'fishCount', 'targetCount', 'positionCounts',
            'bubbleSizeSlider', 'characterSizeSlider', 'spriteSizeSlider',
            'bubbleSizeValue', 'characterSizeValue', 'spriteSizeValue',
            'indicatorsButtonText'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                console.warn(`Element not found: ${id}`);
            }
        });
    }

    setupEventListeners() {
        console.log('🎮 Setting up event listeners...');

        // Control buttons
        if (this.elements.testFireButton) {
            this.elements.testFireButton.addEventListener('click', () => {
                if (this.onTestFire) this.onTestFire();
            });
        }

        if (this.elements.resetPositionsButton) {
            this.elements.resetPositionsButton.addEventListener('click', () => {
                this.resetPositions();
                if (this.onResetPositions) this.onResetPositions();
            });
        }

        if (this.elements.toggleIndicatorsButton) {
            this.elements.toggleIndicatorsButton.addEventListener('click', () => {
                this.toggleIndicators();
                if (this.onToggleIndicators) this.onToggleIndicators();
            });
        }

        if (this.elements.toggleMultiModeButton) {
            this.elements.toggleMultiModeButton.addEventListener('click', () => {
                const multiMode = this.toggleMultiMode();
                if (this.elements.multiModeButtonText) {
                    this.elements.multiModeButtonText.textContent = multiMode ? 'Disable Multi-Mode' : 'Enable Multi-Mode';
                }
                if (this.elements.multiModeControls) {
                    this.elements.multiModeControls.style.display = multiMode ? 'block' : 'none';
                }
                this.updatePositionCounts();
                this.updateMultiModeIndicators();
            });
        }



        // Bubble, character, and sprite sliders
        this.setupSlider('bubbleSizeSlider', 'bubbleSizeValue', (value) => {
            this.physics.bubbleSize = parseFloat(value);
            if (this.onPhysicsUpdate) this.onPhysicsUpdate(this.physics);
        });

        this.setupSlider('characterSizeSlider', 'characterSizeValue', (value) => {
            this.physics.characterSize = parseFloat(value);
            if (this.onPhysicsUpdate) this.onPhysicsUpdate(this.physics);
        });

        this.setupSlider('spriteSizeSlider', 'spriteSizeValue', (value) => {
            this.physics.spriteSize = parseFloat(value);
            if (this.onPhysicsUpdate) this.onPhysicsUpdate(this.physics);
        });

        // Canvas click handling
        const canvasContainer = document.getElementById('canvasContainer');
        if (canvasContainer) {
            canvasContainer.addEventListener('click', (e) => {
                if (this.onCanvasClick) this.onCanvasClick(e);
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'i') {
                this.toggleIndicators();
                if (this.onToggleIndicators) this.onToggleIndicators();
            } else if (e.key.toLowerCase() === 'h') {
                this.togglePanels();
            }
        });
    }

    setupSlider(sliderId, valueId, callback) {
        const slider = this.elements[sliderId];
        const valueDisplay = this.elements[valueId];
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                valueDisplay.textContent = value;
                callback(value);
            });
        }
    }

    setupPositionIndicators() {
        console.log('🎮 Setting up position indicators...');
        
        if (this.elements.fishIndicator) {
            this.makeDraggable(this.elements.fishIndicator, (x, y) => {
                this.updateFishPosition(x, y);
            });
        }

        if (this.elements.targetIndicator) {
            this.makeDraggable(this.elements.targetIndicator, (x, y) => {
                this.updateTargetPosition(x, y);
            });
        }

        // Initial positioning
        this.updateIndicatorPositions();
    }

    makeDraggable(element, callback) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const getRelativePosition = (clientX, clientY) => {
            const container = document.getElementById('canvasContainer');
            const rect = container.getBoundingClientRect();
            return {
                x: (clientX - rect.left) / rect.width,
                y: (clientY - rect.top) / rect.height
            };
        };

        const onMouseDown = (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;
            
            element.style.cursor = 'grabbing';
            element.style.zIndex = '1000';
            
            e.preventDefault();
        };

        const onMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            const container = document.getElementById('canvasContainer');
            const containerRect = container.getBoundingClientRect();
            
            // Keep within bounds
            const maxLeft = containerRect.width - element.offsetWidth;
            const maxTop = containerRect.height - element.offsetHeight;
            
            const clampedLeft = Math.max(0, Math.min(maxLeft, newLeft));
            const clampedTop = Math.max(0, Math.min(maxTop, newTop));
            
            element.style.left = clampedLeft + 'px';
            element.style.top = clampedTop + 'px';
            
            // Calculate relative position based on element center
            const centerX = clampedLeft + element.offsetWidth / 2;
            const centerY = clampedTop + element.offsetHeight / 2;
            const relativeX = centerX / containerRect.width;
            const relativeY = centerY / containerRect.height;
            
            callback(relativeX, relativeY);
        };

        const onMouseUp = () => {
            isDragging = false;
            element.style.cursor = 'grab';
            element.style.zIndex = '';
        };

        element.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        // Touch events for mobile
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => e.preventDefault()
            });
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                onMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        });

        document.addEventListener('touchend', onMouseUp);
    }

    updateFishPosition(x, y) {
        this.positions.fish = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
        console.log(`🐟 Fish position updated: (${(this.positions.fish.x * 100).toFixed(1)}%, ${(this.positions.fish.y * 100).toFixed(1)}%)`);
        this.updatePositionDisplay();
        if (this.onPositionUpdate) {
            this.onPositionUpdate('fish', this.positions.fish);
        }
    }

    updateTargetPosition(x, y) {
        this.positions.target = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
        console.log(`🎯 Target position updated: (${(this.positions.target.x * 100).toFixed(1)}%, ${(this.positions.target.y * 100).toFixed(1)}%)`);
        console.log(`🎯 DEBUG - Full target object:`, this.positions.target);
        this.updatePositionDisplay();
        if (this.onPositionUpdate) {
            this.onPositionUpdate('target', this.positions.target);
        }
    }

    updateIndicatorPositions() {
        const container = document.getElementById('canvasContainer');
        if (!container) return;

        const rect = container.getBoundingClientRect();
        
        // Update fish indicator
        if (this.elements.fishIndicator) {
            const fishX = this.positions.fish.x * rect.width;
            const fishY = this.positions.fish.y * rect.height;
            this.elements.fishIndicator.style.left = (fishX - this.elements.fishIndicator.offsetWidth / 2) + 'px';
            this.elements.fishIndicator.style.top = (fishY - this.elements.fishIndicator.offsetHeight / 2) + 'px';
        }

        // Update target indicator
        if (this.elements.targetIndicator) {
            const targetX = this.positions.target.x * rect.width;
            const targetY = this.positions.target.y * rect.height;
            this.elements.targetIndicator.style.left = (targetX - this.elements.targetIndicator.offsetWidth / 2) + 'px';
            this.elements.targetIndicator.style.top = (targetY - this.elements.targetIndicator.offsetHeight / 2) + 'px';
        }
    }

    resetPositions() {
        this.positions.fish = { x: 0.50, y: 0.50 };
        this.positions.target = { x: 0.50, y: 0.90 };
        this.updateIndicatorPositions();
        this.updatePositionDisplay();
    }

    toggleIndicators() {
        this.indicatorsVisible = !this.indicatorsVisible;
        this.updateIndicatorVisibility();
        this.updateMultiModeIndicators(); // Update multimode indicators when toggling
        
        if (this.elements.indicatorsButtonText) {
            this.elements.indicatorsButtonText.textContent = this.indicatorsVisible ? 'Hide Indicators' : 'Show Indicators';
        }
        
        console.log(`👁️ Indicators ${this.indicatorsVisible ? 'shown' : 'hidden'}`);
    }

    updateIndicatorVisibility() {
        // Hide/show draggable position indicators
        const indicators = document.querySelector('.position-indicators');
        if (indicators) {
            indicators.style.display = this.indicatorsVisible ? 'block' : 'none';
        }
        
        // Also trigger canvas redraw to hide/show visual indicators on canvas
        if (window.fishcannonApp && window.fishcannonApp.renderer) {
            window.fishcannonApp.redrawStaticCanvases();
        }
        
        console.log(`👁️ Position indicators ${this.indicatorsVisible ? 'shown' : 'hidden'}`);
    }

    updatePositionDisplay() {
        // Position display removed from UI
        console.log(`🐟 Fish: (${Math.round(this.positions.fish.x * 100)}%, ${Math.round(this.positions.fish.y * 100)}%)`);
        console.log(`🎯 Target: (${Math.round(this.positions.target.x * 100)}%, ${Math.round(this.positions.target.y * 100)}%)`);
    }

    updateUI() {
        this.updatePositionDisplay();
        this.updateIndicatorPositions();
        
        // Set initial slider values
        if (this.elements.bubbleSizeSlider) this.elements.bubbleSizeSlider.value = this.physics.bubbleSize;
        if (this.elements.characterSizeSlider) this.elements.characterSizeSlider.value = this.physics.characterSize;
        if (this.elements.spriteSizeSlider) this.elements.spriteSizeSlider.value = this.physics.spriteSize;
        
        if (this.elements.bubbleSizeValue) this.elements.bubbleSizeValue.textContent = this.physics.bubbleSize;
        if (this.elements.characterSizeValue) this.elements.characterSizeValue.textContent = this.physics.characterSize;
        if (this.elements.spriteSizeValue) this.elements.spriteSizeValue.textContent = this.physics.spriteSize;
    }

    // Setters for callbacks
    setPositionUpdateCallback(callback) {
        this.onPositionUpdate = callback;
    }

    setPhysicsUpdateCallback(callback) {
        this.onPhysicsUpdate = callback;
    }

    setTestFireCallback(callback) {
        this.onTestFire = callback;
    }

    setResetPositionsCallback(callback) {
        this.onResetPositions = callback;
    }

    setToggleIndicatorsCallback(callback) {
        this.onToggleIndicators = callback;
    }

    setCanvasClickCallback(callback) {
        this.onCanvasClick = callback;
    }

    // Getters
    getPositions() {
        return this.positions;
    }

    getPhysics() {
        return this.physics;
    }

    areIndicatorsVisible() {
        return this.indicatorsVisible;
    }

    togglePanels() {
        const panels = document.querySelector('.control-panels');
        const shortcuts = document.querySelector('.keyboard-shortcuts');
        
        if (panels) {
            panels.classList.toggle('hidden');
            console.log(`🎛️ Control panels ${panels.classList.contains('hidden') ? 'hidden' : 'shown'}`);
        }
        
        if (shortcuts) {
            shortcuts.classList.toggle('hidden');
            console.log(`⌨️ Keyboard shortcuts ${shortcuts.classList.contains('hidden') ? 'hidden' : 'shown'}`);
        }
    }

    // Window resize handler
    handleResize() {
        // Delay to ensure DOM is updated
        setTimeout(() => {
            this.updateIndicatorPositions();
            this.updateMultiModeIndicatorPositions();
        }, 50);
    }

    // Toggle between single and multi mode
    toggleMultiMode() {
        this.multiMode = !this.multiMode;
        console.log(`🎯 Multi-mode ${this.multiMode ? 'enabled' : 'disabled'}`);
        return this.multiMode;
    }



    // Get positions for firing with smart pairing
    getFiringPositions() {
        if (this.multiMode) {
            return {
                fish: this.multiPositions.fish,
                target: this.multiPositions.target,
                pairings: this.generateSmartPairings()
            };
        } else {
            const result = {
                fish: [this.positions.fish],
                target: [this.positions.target],
                pairings: [{ fishIndex: 0, targetIndex: 0 }]
            };
            console.log(`🎯 DEBUG - getFiringPositions (single mode):`, result);
            return result;
        }
    }

    // Generate smart pairings for fish-target combinations
    generateSmartPairings() {
        const pairings = [];
        const fishCount = this.multiPositions.fish.length;
        const targetCount = this.multiPositions.target.length;

        if (fishCount === 0 || targetCount === 0) return pairings;

        // Strategy 1: If equal numbers, pair 1:1
        if (fishCount === targetCount) {
            for (let i = 0; i < fishCount; i++) {
                pairings.push({ fishIndex: i, targetIndex: i });
            }
        }
        // Strategy 2: More targets than fish - each fish gets multiple targets
        else if (targetCount > fishCount) {
            const targetsPerFish = Math.floor(targetCount / fishCount);
            let targetIndex = 0;
            
            for (let fishIndex = 0; fishIndex < fishCount; fishIndex++) {
                for (let t = 0; t < targetsPerFish; t++) {
                    if (targetIndex < targetCount) {
                        pairings.push({ fishIndex, targetIndex: targetIndex++ });
                    }
                }
            }
            
            // Assign remaining targets to random fish
            while (targetIndex < targetCount) {
                const randomFishIndex = Math.floor(Math.random() * fishCount);
                pairings.push({ fishIndex: randomFishIndex, targetIndex: targetIndex++ });
            }
        }
        // Strategy 3: More fish than targets - distribute fish across targets
        else {
            for (let fishIndex = 0; fishIndex < fishCount; fishIndex++) {
                const targetIndex = fishIndex % targetCount;
                pairings.push({ fishIndex, targetIndex });
            }
        }

        return pairings;
    }

    // Add a new target position
    addTargetPosition(x, y) {
        if (this.multiPositions.target.length < this.maxPositions) {
            const newPosition = {
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y)),
                id: this.nextTargetId++
            };
            this.multiPositions.target.push(newPosition);
            console.log(`🎯 Added target ${newPosition.id} at (${(newPosition.x * 100).toFixed(1)}%, ${(newPosition.y * 100).toFixed(1)}%)`);
            return true;
        }
        return false;
    }

    // Add a new fish position
    addFishPosition(x, y) {
        if (this.multiPositions.fish.length < this.maxPositions) {
            const newPosition = {
                x: Math.max(0, Math.min(1, x)),
                y: Math.max(0, Math.min(1, y)),
                id: this.nextFishId++
            };
            this.multiPositions.fish.push(newPosition);
            console.log(`🐟 Added fish ${newPosition.id} at (${(newPosition.x * 100).toFixed(1)}%, ${(newPosition.y * 100).toFixed(1)}%)`);
            return true;
        }
        return false;
    }

    // Remove the last added position of specified type
    removeLastPosition(type) {
        if (this.multiPositions[type].length > 1) {
            const removed = this.multiPositions[type].pop();
            console.log(`🗑️ Removed ${type} ${removed.id}`);
            return true;
        }
        return false;
    }

    // Clear all multi positions
    clearMultiPositions() {
        this.multiPositions.fish = [{ x: 0.442, y: 0.501, id: 1 }];
        this.multiPositions.target = [{ x: 0.632, y: 0.890, id: 1 }];
        this.nextFishId = 2;
        this.nextTargetId = 2;
        console.log('🧹 Cleared all multi positions');
    }

    updatePositionCounts() {
        if (this.elements.fishCount) {
            this.elements.fishCount.textContent = this.multiPositions.fish.length;
        }
        if (this.elements.targetCount) {
            this.elements.targetCount.textContent = this.multiPositions.target.length;
        }
        if (this.elements.positionCounts) {
            this.elements.positionCounts.textContent = `Fish: ${this.multiPositions.fish.length}, Targets: ${this.multiPositions.target.length}`;
        }
    }

    // Update multimode indicators
    updateMultiModeIndicators() {
        console.log(`Updating multimode indicators - multiMode: ${this.multiMode}, indicatorsVisible: ${this.indicatorsVisible}`);
        
        this.clearMultiModeIndicators();
        
        if (this.multiMode && this.indicatorsVisible) {
            this.createMultiModeIndicators();
        }
        
        // Hide single mode indicators when in multimode
        if (this.elements.fishIndicator) {
            this.elements.fishIndicator.style.display = this.multiMode ? 'none' : 'flex';
            console.log(`Fish indicator display: ${this.elements.fishIndicator.style.display}`);
        }
        if (this.elements.targetIndicator) {
            this.elements.targetIndicator.style.display = this.multiMode ? 'none' : 'flex';
            console.log(`Target indicator display: ${this.elements.targetIndicator.style.display}`);
        }
    }

    // Clear all multimode indicator DOM elements
    clearMultiModeIndicators() {
        this.multiModeIndicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
        this.multiModeIndicators = [];
    }

    // Create multimode indicators for all positions
    createMultiModeIndicators() {
        const container = document.querySelector('.position-indicators');
        if (!container) {
            console.warn('Position indicators container not found');
            return;
        }

        console.log(`Creating multimode indicators: ${this.multiPositions.fish.length} fish, ${this.multiPositions.target.length} targets`);

        // Create fish indicators
        this.multiPositions.fish.forEach((pos, index) => {
            const indicator = this.createMultiModeIndicator('fish', pos, index);
            container.appendChild(indicator);
            this.multiModeIndicators.push(indicator);
        });

        // Create target indicators
        this.multiPositions.target.forEach((pos, index) => {
            const indicator = this.createMultiModeIndicator('target', pos, index);
            container.appendChild(indicator);
            this.multiModeIndicators.push(indicator);
        });

        console.log(`Total multimode indicators created: ${this.multiModeIndicators.length}`);
        this.updateMultiModeIndicatorPositions();
    }

    // Create a single multimode indicator element
    createMultiModeIndicator(type, position, index) {
        const indicator = document.createElement('div');
        indicator.className = `multimode-indicator ${type}-multimode-indicator`;
        indicator.dataset.type = type;
        indicator.dataset.index = index;
        indicator.dataset.id = position.id;
        
        // Main content container
        const content = document.createElement('div');
        content.className = 'indicator-content';
        
        // Emoji
        const emoji = document.createElement('span');
        emoji.className = 'indicator-emoji';
        emoji.textContent = type === 'fish' ? '🐟' : '🎯';
        content.appendChild(emoji);
        
        // ID label
        const label = document.createElement('span');
        label.className = 'indicator-label';
        label.textContent = `${type === 'fish' ? 'F' : 'T'}${position.id}`;
        content.appendChild(label);
        
        indicator.appendChild(content);
        
        // Controls container
        const controls = document.createElement('div');
        controls.className = 'indicator-controls';
        
        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'indicator-control-btn add-btn';
        addBtn.innerHTML = '+';
        addBtn.title = `Add new ${type}`;
        addBtn.addEventListener('click', (e) => {
            console.log(`Add button clicked for ${type} ${position.id}`);
            e.stopPropagation();
            e.preventDefault();
            this.addNewPosition(type, position.x, position.y);
        });
        controls.appendChild(addBtn);
        
        // Remove button (only show if more than 1 of this type)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'indicator-control-btn remove-btn';
        removeBtn.innerHTML = '−';
        removeBtn.title = `Remove this ${type}`;
        removeBtn.addEventListener('click', (e) => {
            console.log(`Remove button clicked for ${type} ${position.id}`);
            e.stopPropagation();
            e.preventDefault();
            this.removePosition(type, position.id);
        });
        controls.appendChild(removeBtn);
        
        indicator.appendChild(controls);
        
        // Make draggable
        this.makeMultiModeIndicatorDraggable(indicator, type, position.id);
        
        return indicator;
    }

    // Make multimode indicator draggable
    makeMultiModeIndicatorDraggable(element, type, id) {
        let isDragging = false;
        let startX, startY;

        const onMouseDown = (e) => {
            // Don't drag if clicking on control buttons
            if (e.target.classList.contains('indicator-control-btn')) {
                console.log('Clicked on control button, not dragging');
                return;
            }
            
            console.log(`Starting drag for ${type} ${id}`);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            element.classList.add('dragging');
            this.draggedIndicator = { element, type, id };
            
            e.preventDefault();
            e.stopPropagation();
        };

        const onMouseMove = (e) => {
            if (!isDragging || !this.draggedIndicator) return;
            
            const container = document.getElementById('canvasContainer');
            const rect = container.getBoundingClientRect();
            
            const relativeX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const relativeY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            
            // Update position in data
            this.updateMultiPosition(type, id, relativeX, relativeY);
            
            // Update visual position
            this.updateMultiModeIndicatorPosition(element, relativeX, relativeY);
        };

        const onMouseUp = () => {
            if (isDragging) {
                console.log(`Ending drag for ${type} ${id}`);
                isDragging = false;
                element.classList.remove('dragging');
                this.draggedIndicator = null;
            }
        };

        // Add event listeners with proper options
        element.addEventListener('mousedown', onMouseDown, { passive: false });
        document.addEventListener('mousemove', onMouseMove, { passive: false });
        document.addEventListener('mouseup', onMouseUp, { passive: false });
        
        // Touch support for mobile
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            onMouseDown({
                target: e.target,
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => e.preventDefault(),
                stopPropagation: () => e.stopPropagation()
            });
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                onMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: false });
        
        document.addEventListener('touchend', onMouseUp, { passive: false });
        
        console.log(`Made ${type} ${id} draggable`);
    }

    // Update position in multiPositions array
    updateMultiPosition(type, id, x, y) {
        const positions = this.multiPositions[type];
        const index = positions.findIndex(pos => pos.id === id);
        if (index !== -1) {
            positions[index].x = x;
            positions[index].y = y;
            
            if (this.onPositionUpdate) {
                this.onPositionUpdate(this.multiPositions);
            }
        }
    }

    // Update visual position of multimode indicator
    updateMultiModeIndicatorPosition(element, x, y) {
        const container = document.getElementById('canvasContainer');
        if (!container || !element) {
            console.warn('Container or element missing for position update');
            return;
        }
        
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Container has zero dimensions');
            return;
        }
        
        const pixelX = x * rect.width - element.offsetWidth / 2;
        const pixelY = y * rect.height - element.offsetHeight / 2;
        
        element.style.left = `${pixelX}px`;
        element.style.top = `${pixelY}px`;
        
        // Debug positioning occasionally
        if (Math.random() < 0.1) {
            console.log(`Updated indicator position: (${x.toFixed(3)}, ${y.toFixed(3)}) -> (${pixelX.toFixed(1)}, ${pixelY.toFixed(1)})`);
        }
    }

    // Update positions of all multimode indicators
    updateMultiModeIndicatorPositions() {
        if (!this.multiModeIndicators || this.multiModeIndicators.length === 0) {
            return;
        }
        
        this.multiModeIndicators.forEach(indicator => {
            const type = indicator.dataset.type;
            const id = parseInt(indicator.dataset.id);
            const position = this.multiPositions[type]?.find(pos => pos.id === id);
            
            if (position) {
                this.updateMultiModeIndicatorPosition(indicator, position.x, position.y);
            }
        });
    }

    // Add new position near existing one
    addNewPosition(type, x, y) {
        // Offset new position slightly
        const newX = Math.max(0, Math.min(1, x + (Math.random() - 0.5) * 0.1));
        const newY = Math.max(0, Math.min(1, y + (Math.random() - 0.5) * 0.1));
        
        if (type === 'fish') {
            this.addFishPosition(newX, newY);
        } else {
            this.addTargetPosition(newX, newY);
        }
        
        this.updatePositionCounts();
        this.updateMultiModeIndicators();
    }

    // Remove position by type and id
    removePosition(type, id) {
        const positions = this.multiPositions[type];
        if (positions.length <= 1) return; // Keep at least one
        
        const index = positions.findIndex(pos => pos.id === id);
        if (index !== -1) {
            positions.splice(index, 1);
            console.log(`🗑️ Removed ${type} ${id}`);
            
            this.updatePositionCounts();
            this.updateMultiModeIndicators();
        }
    }
} 