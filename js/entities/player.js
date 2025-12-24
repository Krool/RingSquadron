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

        // Only move horizontally - Y is locked at bottom
        if (targetPos) {
            const dx = targetPos.x - this.x;
            const distance = Math.abs(dx);

            if (distance > 5) {
                // Move toward target X position
                const moveX = Math.sign(dx) * Math.min(this.speed * dt, distance);
                this.x += moveX;
            }
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

    draw(renderer) {
        if (!this.active) return;

        // Flash when invincible
        if (this.invincibleTimer > 0) {
            // Blink effect - skip drawing every other frame
            if (Math.floor(this.invincibleTimer / 100) % 2 === 0) {
                return;
            }
        }

        renderer.drawSpriteCentered(this.sprite, this.x, this.y, CONFIG.COLORS.PLAYER);
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
    }
}
