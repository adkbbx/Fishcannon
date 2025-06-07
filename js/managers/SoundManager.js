// 🔊 Sound Manager Module
// Handles audio effects for the Fishcannon game

export class SoundManager {
    constructor() {
        this.sounds = {};
        this.isEnabled = true;
        this.volume = 0.5;
        
        // Pre-load sound effects
        this.loadSounds();
    }

    async loadSounds() {
        console.log('🔊 Loading sound effects...');
        
        try {
            // Load bubble launch sound
            this.sounds.bubbleLaunch = new Audio('sounds/bubble_launch.mp3');
            this.sounds.bubbleLaunch.volume = this.volume;
            this.sounds.bubbleLaunch.preload = 'auto';

            // Load bubble pop sound
            this.sounds.bubblePop = new Audio('sounds/bubble_pop.mp3');
            this.sounds.bubblePop.volume = this.volume;
            this.sounds.bubblePop.preload = 'auto';

            console.log('✅ Sound effects loaded successfully!');
        } catch (error) {
            console.warn('⚠️ Could not load sound effects:', error);
        }
    }

    // Play bubble launch sound
    playBubbleLaunch() {
        if (!this.isEnabled || !this.sounds.bubbleLaunch) return;
        
        try {
            // Reset playback position to allow overlapping sounds
            this.sounds.bubbleLaunch.currentTime = 0;
            this.sounds.bubbleLaunch.play().catch(e => {
                console.warn('Could not play bubble launch sound:', e);
            });
            console.log('🔊 Playing bubble launch sound');
        } catch (error) {
            console.warn('Error playing bubble launch sound:', error);
        }
    }

    // Play bubble pop sound
    playBubblePop() {
        if (!this.isEnabled || !this.sounds.bubblePop) return;
        
        try {
            // Reset playback position to allow overlapping sounds
            this.sounds.bubblePop.currentTime = 0;
            this.sounds.bubblePop.play().catch(e => {
                console.warn('Could not play bubble pop sound:', e);
            });
            console.log('🔊 Playing bubble pop sound');
        } catch (error) {
            console.warn('Error playing bubble pop sound:', error);
        }
    }

    // Enable/disable sound
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update volume for all loaded sounds
        if (this.sounds.bubbleLaunch) {
            this.sounds.bubbleLaunch.volume = this.volume;
        }
        if (this.sounds.bubblePop) {
            this.sounds.bubblePop.volume = this.volume;
        }
        
        console.log(`🔊 Volume set to ${Math.round(this.volume * 100)}%`);
    }

    // Check if sounds are loaded
    isLoaded() {
        return this.sounds.bubbleLaunch && this.sounds.bubblePop;
    }
} 