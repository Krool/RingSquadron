/**
 * Powerup Crate Entity - Swarm Mode
 *
 * Hit-counter crates that unlock permanent run-specific upgrades.
 * Falls at enemy speed, shows hit counter, unlocks on completion.
 *
 * @module entities/powerupcrate
 */
import { CONFIG } from '../utils/config.js';

export class PowerupCrate {
    constructor(x, type, hitsRequired) {
        this.x = x;
        this.y = -50;
        this.type = type;  // 'wingman', 'spreadshot'
        this.hitsRequired = hitsRequired;
        this.hitCount = 0;
        this.size = 30;
        this.speed = 1.2;  // Same as enemies
        this.active = true;
        this.hitFlash = 0;
    }

    update(deltaTime) {
        const dt = deltaTime / 16;

        // Flash effect
        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        // Fall down
        this.y += this.speed * dt;

        if (this.y > CONFIG.GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    takeDamage(amount) {
        this.hitCount++;
        this.hitFlash = 200;

        if (this.hitCount >= this.hitsRequired) {
            this.active = false;
            return true;  // Unlocked
        }
        return false;
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
        const isFlashing = this.hitFlash > 0;

        ctx.save();

        // Draw crate
        ctx.fillStyle = isFlashing ? '#ffffff' : '#996633';
        ctx.fillRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );

        // Draw border
        ctx.strokeStyle = '#ffaa44';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - this.size / 2,
            this.y - this.size / 2,
            this.size,
            this.size
        );

        // Draw hit counter
        const remaining = this.hitsRequired - this.hitCount;
        ctx.fillStyle = '#ffff00';
        ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(remaining, this.x, this.y + 6);

        // Draw type icon
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.fillStyle = '#ffffff';
        const icon = this.type === 'wingman' ? 'W' : 'S';
        ctx.fillText(icon, this.x, this.y - 8);

        ctx.restore();
    }
}
