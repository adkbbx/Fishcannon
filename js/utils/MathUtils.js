// 🧮 Mathematical Utilities
// Common math functions used throughout the application

export class MathUtils {
    // Easing functions for smooth animations
    static easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    static easeInCubic(t) {
        return t * t * t;
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    static easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    static easeInQuad(t) {
        return t * t;
    }

    // Linear interpolation
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Map value from one range to another
    static map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }

    // Distance between two points
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Angle between two points (in radians)
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // Convert degrees to radians
    static degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

    // Convert radians to degrees
    static radToDeg(radians) {
        return radians * 180 / Math.PI;
    }

    // Random number between min and max
    static random(min = 0, max = 1) {
        return Math.random() * (max - min) + min;
    }

    // Random integer between min and max (inclusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Random element from array
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Check if point is inside rectangle
    static pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    // Check if point is inside circle
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    }

    // Normalize value to 0-1 range
    static normalize(value, min, max) {
        return (value - min) / (max - min);
    }

    // Calculate trajectory for projectile motion
    static calculateTrajectory(startX, startY, endX, endY, gravity = 9.81, power = 100) {
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate launch angle and velocity
        const angle = Math.atan2(-dy, dx);
        const velocity = power * (distance / 500); // Scale velocity based on distance
        
        return {
            angle,
            velocity,
            vx: velocity * Math.cos(angle),
            vy: velocity * Math.sin(angle)
        };
    }

    // Calculate position along trajectory at time t
    static getTrajectoryPosition(startX, startY, vx, vy, gravity, time) {
        return {
            x: startX + vx * time,
            y: startY + vy * time + 0.5 * gravity * time * time
        };
    }
} 