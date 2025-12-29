// Player Entity
import { CONFIG } from '../utils/config.js';
import { SPRITES, getSpriteSize } from '../utils/sprites.js';
import { Bullet } from './bullet.js';

export class Player {
    constructor(gameWidth, gameHeight) {
        this.x = gameWidth / 2;
        this.y = gameHeight - 60; // Fixed Y position at bottom
        this.fixedY = gameHeight - 60; // Store fixed Y position
        this.health = CONFIG.PLAYER_HEALTH;
        this.maxHealth = CONFIG.PLAYER_HEALTH;
        this.speed = CONFIG.PLAYER_SPEED;
        this.sprite = SPRITES.PLAYER;
        this.lastFireTime = 0;
        this.fireRate = CONFIG.PLAYER_FIRE_RATE;
        this.bulletDamage = CONFIG.PLAYER_BULLET_DAMAGE;
        this.active = true;
        this.invincibleTimer = 0; // Invincibility after respawn
        this.boostTimer = 0; // Boost effect timer
        this.boostMultiplier = 1; // Current boost multiplier

        const size = getSpriteSize(this.sprite);
        // Adjusted for smaller font (8px)
        this.width = size.width * 5;
        this.height = size.height * 8;

        // Bounds for movement - only horizontal now
        this.minX = this.width / 2 + 10;
        this.maxX = gameWidth - this.width / 2 - 10;
    }

    update(deltaTime, targetPos, currentTime) {
        if (!this.active) return [];

        const bullets = [];
        const dt = deltaTime / 16;

        // Update invincibility timer
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
        }

        // Update boost timer
        if (this.boostTimer > 0) {
            this.boostTimer -= deltaTime;
            if (this.boostTimer <= 0) {
                this.boostMultiplier = 1;
            }
        }

        // Only move horizontally - Y is locked at bottom
        // Ship follows drag position exactly
        if (targetPos) {
            this.x = targetPos.x;
        }

        // Clamp X position to bounds, Y stays fixed
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
        this.y = this.fixedY;

        // Auto-fire
        if (currentTime - this.lastFireTime >= this.fireRate) {
            bullets.push(this.fire());
            this.lastFireTime = currentTime;
        }

        return bullets;
    }

    isInvincible() {
        return this.invincibleTimer > 0;
    }

    fire() {
        return new Bullet(this.x, this.y - this.height / 2, true, this.bulletDamage);
    }

    takeDamage(amount) {
        // Can't take damage while invincible
        if (this.invincibleTimer > 0) {
            return false;
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
        }
        return this.health <= 0;
    }

    // Apply a speed boost (from boost walls)
    applyBoost(multiplier = 2, duration = 500) {
        this.boostTimer = duration;
        this.boostMultiplier = multiplier;
    }

    // Get current fire rate (affected by boost)
    getEffectiveFireRate() {
        return this.fireRate / this.boostMultiplier;
    }

    // Check if currently boosted
    isBoosted() {
        return this.boostTimer > 0;
    }

    draw(renderer) {
        if (!this.active) return;

        // Flash when invincible
        if (this.invincibleTimer > 0) {
            // Blink effect - skip drawing every other frame
            if (Math.floor(this.invincibleTimer / 100) % 2 === 0) {
                return;
            }
        }

        const ctx = renderer.ctx;
        const shipWidth = 28;
        const shipHeight = 36;

        // Determine color
        let color = CONFIG.COLORS.PLAYER;
        let glowColor = null;

        if (this.boostTimer > 0) {
            color = '#88ff88';
            glowColor = '#44ff44';
        }

        ctx.save();

        // Boost glow effect
        if (glowColor) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15 + Math.sin(Date.now() / 50) * 5;
        }

        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Draw player ship using canvas primitives
        // Nose (triangle at top)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - shipHeight / 2);
        ctx.lineTo(this.x - 6, this.y - shipHeight / 2 + 12);
        ctx.lineTo(this.x + 6, this.y - shipHeight / 2 + 12);
        ctx.closePath();
        ctx.fill();

        // Main body (rectangle)
        ctx.fillRect(this.x - 10, this.y - shipHeight / 2 + 12, 20, 16);

        // Wings (triangles on sides)
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - shipHeight / 2 + 14);
        ctx.lineTo(this.x - 14, this.y + 4);
        ctx.lineTo(this.x - 10, this.y + 4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - shipHeight / 2 + 14);
        ctx.lineTo(this.x + 14, this.y + 4);
        ctx.lineTo(this.x + 10, this.y + 4);
        ctx.closePath();
        ctx.fill();

        // Engine exhaust (lines at bottom)
        ctx.strokeStyle = this.boostTimer > 0 ? '#44ff44' : '#ffaa00';
        ctx.lineWidth = 2;
        const exhaustFlicker = Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y + 6);
        ctx.lineTo(this.x - 4, this.y + 12 + exhaustFlicker);
        ctx.moveTo(this.x + 4, this.y + 6);
        ctx.lineTo(this.x + 4, this.y + 12 + exhaustFlicker);
        ctx.stroke();

        // Cockpit detail (small rectangle)
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(this.x - 4, this.y - 8, 8, 6);

        ctx.restore();
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    reset(gameWidth, gameHeight) {
        this.x = gameWidth / 2;
        this.y = gameHeight - 60;
        this.fixedY = gameHeight - 60;
        this.health = CONFIG.PLAYER_HEALTH;
        this.active = true;
        this.lastFireTime = 0;
        this.invincibleTimer = 0;
        this.boostTimer = 0;
        this.boostMultiplier = 1;
    }
}
