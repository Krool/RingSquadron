/**
 * Ally Entity - Tiny companion ships
 *
 * Allies are recruited by collecting positive rings.
 * They follow the player in formation and auto-fire.
 * Max displayed: CONFIG.ALLY_DISPLAY_CAP (excess add to damage multiplier)
 *
 * @module entities/ally
 */
import { CONFIG } from '../utils/config.js';
import { SPRITES } from '../utils/sprites.js';
import { Bullet } from './bullet.js';

export class Ally {
    /**
     * Create a new ally
     * @param {number} formationIndex - Position in formation (0 = closest to player)
     */
    constructor(formationIndex) {
        this.x = 0;
        this.y = 0;
        this.formationIndex = formationIndex;
        this.health = CONFIG.ALLY_HEALTH;
        this.maxHealth = CONFIG.ALLY_HEALTH;
        this.sprite = SPRITES.ALLY;
        this.lastFireTime = 0;
        this.fireRate = CONFIG.ALLY_FIRE_RATE;
        this.bulletDamage = CONFIG.ALLY_BULLET_DAMAGE;
        this.active = true;
        this.speed = 12; // Speed to reach formation position

        // Tiny size (1/8th of player)
        this.width = 6;
        this.height = 6;

        // Animation state
        this.joining = true; // True while moving to formation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobTimer = 0;
    }

    update(deltaTime, targetX, targetY, currentTime) {
        if (!this.active) return [];

        const bullets = [];
        const dt = deltaTime / 16;

        // Bobbing animation
        this.bobTimer += dt * 0.1;

        // Move toward formation position with slight bob
        const bobX = Math.sin(this.bobTimer + this.bobOffset) * 2;
        const bobY = Math.cos(this.bobTimer * 1.3 + this.bobOffset) * 1;

        const dx = (targetX + bobX) - this.x;
        const dy = (targetY + bobY) - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 2) {
            const moveX = (dx / distance) * this.speed * dt;
            const moveY = (dy / distance) * this.speed * dt;
            this.x += moveX;
            this.y += moveY;

            if (distance < 10) {
                this.joining = false;
            }
        } else {
            this.x = targetX + bobX;
            this.y = targetY + bobY;
            this.joining = false;
        }

        // Fire when in formation
        if (!this.joining && currentTime - this.lastFireTime >= this.fireRate) {
            bullets.push(this.fire());
            this.lastFireTime = currentTime;
        }

        return bullets;
    }

    fire() {
        return new Bullet(this.x, this.y - 3, true, this.bulletDamage);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
        }
        return this.health <= 0;
    }

    draw(renderer) {
        if (!this.active) return;

        const ctx = renderer.ctx;

        // Draw tiny ally as a small triangle using canvas primitives
        ctx.fillStyle = CONFIG.COLORS.ALLY;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 4);
        ctx.lineTo(this.x - 3, this.y + 2);
        ctx.lineTo(this.x + 3, this.y + 2);
        ctx.closePath();
        ctx.fill();

        // Draw tiny health indicator only if damaged
        if (this.health < this.maxHealth) {
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = healthPercent > 0.5 ? CONFIG.COLORS.HEALTH_BAR : '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 6, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    setSpawnPosition(x, y) {
        this.x = x;
        this.y = y;
        this.joining = true;
    }
}
