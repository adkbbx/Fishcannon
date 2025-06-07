// 📝 Centralized Logging Utility
// Provides consistent logging with levels and optional debug mode

export class Logger {
    constructor(module = 'App', debugMode = false) {
        this.module = module;
        this.debugMode = debugMode;
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = debugMode ? this.logLevels.DEBUG : this.logLevels.INFO;
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.currentLevel = enabled ? this.logLevels.DEBUG : this.logLevels.INFO;
    }

    setLogLevel(level) {
        if (typeof level === 'string') {
            this.currentLevel = this.logLevels[level.toUpperCase()] ?? this.logLevels.INFO;
        } else {
            this.currentLevel = level;
        }
    }

    _log(level, emoji, message, ...args) {
        if (level <= this.currentLevel) {
            const timestamp = new Date().toLocaleTimeString();
            const prefix = `${emoji} [${timestamp}] ${this.module}:`;
            console.log(prefix, message, ...args);
        }
    }

    error(message, ...args) {
        this._log(this.logLevels.ERROR, '❌', message, ...args);
    }

    warn(message, ...args) {
        this._log(this.logLevels.WARN, '⚠️', message, ...args);
    }

    info(message, ...args) {
        this._log(this.logLevels.INFO, '✅', message, ...args);
    }

    debug(message, ...args) {
        this._log(this.logLevels.DEBUG, '🔍', message, ...args);
    }

    // Specialized logging methods for common use cases
    init(message, ...args) {
        this._log(this.logLevels.INFO, '🚀', `Initializing ${message}`, ...args);
    }

    success(message, ...args) {
        this._log(this.logLevels.INFO, '✅', message, ...args);
    }

    animation(message, ...args) {
        this._log(this.logLevels.DEBUG, '🎬', message, ...args);
    }

    ui(message, ...args) {
        this._log(this.logLevels.DEBUG, '🎮', message, ...args);
    }

    canvas(message, ...args) {
        this._log(this.logLevels.DEBUG, '🎨', message, ...args);
    }

    physics(message, ...args) {
        this._log(this.logLevels.DEBUG, '⚡', message, ...args);
    }

    image(message, ...args) {
        this._log(this.logLevels.DEBUG, '📷', message, ...args);
    }
}

// Global logger instance
export const logger = new Logger('Fishcannon');

// Module-specific logger factory
export function createLogger(moduleName, debugMode = false) {
    return new Logger(moduleName, debugMode);
} 