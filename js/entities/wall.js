/**
 * Wall Entity
 *
 * Indestructible obstacles that block bullets and kill players on contact.
 * Walls span one of three lanes and move downward.
 *
 * @module entities/wall
 */
import { CONFIG } from '../utils/config.js';

export class Wall {
    constructor(x, y, lane) {
        this.x = x;
        this.y = y;
        this.lane = lane; // 0 = left, 1 = center, 2 = right
        this.active = true;

        // Dimensions - span most of the lane width
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        this.width = laneWidth - 20; // Leave small gaps between lanes
        this.height = 30;

        // Movement - same speed as rings
        this.speed = CONFIG.RING_SPEED * 1.2;

        // Visual effects
        this.pulseTimer = 0;
        this.warningShown = false;
    }

    update(deltaTime) {
        if (!this.active) return;

        const dt = deltaTime / 16;

        // Move down
        this.y += this.speed * dt;

        // Pulse animation
        this.pulseTimer += 0.08 * dt;

        // Deactivate when off screen
        if (this.y > CONFIG.GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    draw(renderer) {
        if (!this.active) return;

        // Pulse effect for danger
        const pulse = Math.sin(this.pulseTimer * 4) * 0.15 + 0.85;

        // Wall color - metallic gray with red warning
        const baseColor = '#666677';
        const accentColor = '#ff4444';

        // Draw solid wall using ASCII blocks
        const wallSprite = [
            '|############|',
            '|============|',
            '|############|'
        ];

        renderer.drawSpriteCentered(wallSprite, this.x, this.y, baseColor);

        // Draw warning stripes on edges
        const stripeSprite = ['!', '!', '!'];
        renderer.drawSpriteCentered(stripeSprite, this.x - this.width/2 + 10, this.y, accentColor);
        renderer.drawSpriteCentered(stripeSprite, this.x + this.width/2 - 10, this.y, accentColor);
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get the center X position for a given lane
     * @param {number} lane - Lane index (0, 1, or 2)
     * @returns {number} Center X position
     */
    static getLaneX(lane) {
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        return laneWidth * lane + laneWidth / 2;
    }

    /**
     * Get the lane index for a given X position
     * @param {number} x - X position
     * @returns {number} Lane index (0, 1, or 2)
     */
    static getLaneFromX(x) {
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        return Math.floor(x / laneWidth);
    }
}
