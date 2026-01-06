/**
 * Swarm Enemy Entity - Swarm Mode
 *
 * Small 3px dot enemies that spawn continuously across the top.
 * Dies in 1 hit, homes toward player when 30% down screen.
 *
 * @module entities/swarmenemy
 */
import { CONFIG } from '../utils/config.js';

export class SwarmEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 4;  // 4px dot (30% larger for easier hitting)
        this.health = 1;
        this.speed = 0.27;  // Additional 10% slower for better gameplay
        this.active = true;
        this.homingActive = false;  // Activates at 30% height
        this.homingThreshold = CONFIG.GAME_HEIGHT * 0.3;
    }

    update(deltaTime, playerX, playerY) {
        const dt = deltaTime / 16;

        // Always move down
        this.y += this.speed * dt;

        // Activate homing when 30% down screen
        if (this.y >= this.homingThreshold) {
            this.homingActive = true;
        }

        // Home toward player
        if (this.homingActive) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * dt;
                this.y += (dy / dist) * this.speed * dt;
            }
        }

        // Deactivate off-screen
        if (this.y > CONFIG.GAME_HEIGHT + 10) {
            this.active = false;
        }
    }

    takeDamage() {
        this.active = false;
        return true;  // Always dies in 1 hit
    }

    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );
    }
}
