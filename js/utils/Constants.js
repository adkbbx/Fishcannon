// 🔧 Application Constants
// Centralized configuration and constants

export const CANVAS_LAYERS = {
    BACKGROUND: 'backgroundCanvas',
    FISH: 'fishCanvas', 
    FOREGROUND: 'foregroundCanvas',
    ANIMATION: 'animationCanvas',
    UI: 'uiCanvas'
};

export const FISH_STATES = {
    HIDDEN: 'HIDDEN',
    RISING: 'RISING', 
    OPENING: 'OPENING',
    FIRING: 'FIRING',
    WAITING: 'WAITING',
    CLOSING: 'CLOSING',
    SINKING: 'SINKING'
};

export const ANIMATION_DURATIONS = {
    RISING: 800,   // 800ms to emerge
    OPENING: 300,  // 300ms to open mouth
    FIRING: 100,   // 100ms firing moment
    WAITING: 0,    // Variable - waits for bubble to complete
    CLOSING: 300,  // 300ms to close mouth
    SINKING: 600   // 600ms to sink back down
};

export const PHYSICS_DEFAULTS = {
    BUBBLE_SIZE: 40,
    CHARACTER_SIZE: 50,
    SPRITE_SIZE: 100,
    GRAVITY: 9.81,
    LAUNCH_POWER: 100,
    COOLDOWN_DURATION: 800 // 800ms cooldown between firings per fish
};

export const POSITION_DEFAULTS = {
    FISH: { x: 0.50, y: 0.50 },
    TARGET: { x: 0.50, y: 0.90 },
    FISH_BASE_OFFSET: 0.15,
    FISH_EMERGENCE_OFFSET: 0.0
};

export const LIMITS = {
    MAX_POSITIONS: 8,
    MAX_INDICATORS: 5,
    MIN_POSITIONS: 1
};

export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video', 
    GIF: 'gif'
};

export const SUPPORTED_FORMATS = {
    IMAGES: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
    VIDEOS: ['mp4', 'webm', 'ogg']
};

export const UI_ELEMENTS = {
    FISH_INDICATOR: 'fishIndicator',
    TARGET_INDICATOR: 'targetIndicator',
    TEST_FIRE_BUTTON: 'testFireButton',
    RESET_POSITIONS_BUTTON: 'resetPositionsButton',
    TOGGLE_INDICATORS_BUTTON: 'toggleIndicatorsButton',
    TOGGLE_MULTI_MODE_BUTTON: 'toggleMultiModeButton'
};

export const KEYBOARD_SHORTCUTS = {
    FIRE: 'Space',
    TOGGLE_INDICATORS: 'i',
    TOGGLE_PANELS: 'h'
};

export const ASSET_PATHS = {
    FISH_CLOSED_MOUTH: 'assets/Fish_Close_Mouth.png',
    FISH_OPEN_MOUTH: 'assets/Fish_Open_Mouth.png',
    BACKGROUND_PRESET: 'assets/Background.png',
    FOREGROUND_PRESET: 'assets/foreground.png'
}; 