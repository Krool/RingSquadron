/**
 * Swarm Boss Entity - Swarm Mode
 *
 * Large hexagonal boss with visible hit counter.
 * Spawn with scalable health (100, 500, 1000+), instant-kills player on collision.
 *
 * @module entities/swarmboss
 */
import { CONFIG } from '../utils/config.js';

export class SwarmBoss {
    constructor(x, y, health, disableHoming = false) {
        this.x = x;
        this.y = y;
        this.health = health;
        this.maxHealth = health;
        this.size = 40;  // Large hexagon
        this.speed = 0.27;  // Match swarm enemy speed
        this.active = true;
        this.homingActive = false;
        this.homingThreshold = CONFIG.GAME_HEIGHT * 0.3;
        this.flashTimer = 0;
        this.disableHoming = disableHoming;  // Option to disable homing
    }

    update(deltaTime, playerX, playerY) {
        const dt = deltaTime / 16;

        // Flash effect
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }

        // Always move down
        this.y += this.speed * dt;

        // Activate homing (unless disabled)
        if (!this.disableHoming && this.y >= this.homingThreshold) {
            this.homingActive = true;
        }

        // Home toward player (slightly slower than regular homing, only if enabled)
        if (!this.disableHoming && this.homingActive) {
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * 0.8 * dt;
                this.y += (dy / dist) * this.speed * 0.8 * dt;
            }
        }

        if (this.y > CONFIG.GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 100;

        if (this.health <= 0) {
            this.active = false;
            return true;
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
        const isFlashing = this.flashTimer > 0;

        ctx.save();

        // Draw hexagon
        ctx.fillStyle = isFlashing ? '#ffffff' : '#cc3333';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60) * Math.PI / 180;
            const px = this.x + Math.cos(angle) * (this.size / 2);
            const py = this.y + Math.sin(angle) * (this.size / 2);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Draw outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw hit counter
        ctx.fillStyle = '#ffff00';
        ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.health, this.x, this.y);

        ctx.restore();
    }
}
