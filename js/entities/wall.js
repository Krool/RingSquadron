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

        const ctx = renderer.ctx;
        const left = this.x - this.width / 2;
        const top = this.y - this.height / 2;

        // Pulse effect for danger
        const pulse = Math.sin(this.pulseTimer * 4) * 0.15 + 0.85;

        // Main wall body - dark metallic
        ctx.fillStyle = `rgba(80, 80, 100, ${pulse})`;
        ctx.fillRect(left, top, this.width, this.height);

        // Border
        ctx.strokeStyle = '#888899';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, this.width, this.height);

        // Hazard stripes on edges
        const stripeWidth = 8;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(left, top, stripeWidth, this.height);
        ctx.fillRect(left + this.width - stripeWidth, top, stripeWidth, this.height);

        // Center line pattern
        ctx.strokeStyle = '#555566';
        ctx.lineWidth = 1;
        const centerY = this.y;
        ctx.beginPath();
        ctx.moveTo(left + stripeWidth + 5, centerY);
        ctx.lineTo(left + this.width - stripeWidth - 5, centerY);
        ctx.stroke();

        // Hazard text
        ctx.fillStyle = '#ffaaaa';
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DANGER', this.x, this.y);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
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
