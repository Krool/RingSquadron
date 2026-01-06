/**
 * Bullet Entity
 * Player bullets are small and fast, enemy bullets are larger for visibility
 * @module entities/bullet
 */
import { CONFIG } from '../utils/config.js';
import { SPRITES } from '../utils/sprites.js';

export class Bullet {
    constructor(x, y, isPlayerBullet = true, damage = CONFIG.PLAYER_BULLET_DAMAGE, vx = 0, vy = null) {
        this.x = x;
        this.y = y;
        this.isPlayerBullet = isPlayerBullet;
        this.damage = damage;
        this.speed = isPlayerBullet ? CONFIG.PLAYER_BULLET_SPEED : 4; // Slower enemy bullets
        this.active = true;
        this.sprite = isPlayerBullet ? SPRITES.BULLET_UP : SPRITES.BULLET_DOWN;

        // Velocity components (for angled shots and bouncing)
        this.vx = vx;
        this.vy = vy !== null ? vy : (isPlayerBullet ? -this.speed : this.speed);

        // Bouncing (Swarm mode only)
        this.bounceCount = 0;
        this.canBounce = false;  // Enabled in Swarm mode
        this.duplicated = false;  // Track if passed through multiplier gate

        // Enemy bullets are larger for visibility
        if (isPlayerBullet) {
            this.width = 4;
            this.height = 8;
            this.displaySize = 8;
        } else {
            this.width = 8;
            this.height = 12;
            this.displaySize = 14;
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 16;

        // Move using velocity components
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wall bouncing (if enabled in Swarm mode)
        if (this.canBounce && this.isPlayerBullet) {
            const halfWidth = this.width / 2;

            // Bounce off left/right walls
            if (this.x - halfWidth <= 0) {
                this.x = halfWidth;
                this.vx = Math.abs(this.vx);  // Reverse to right
                this.bounceCount++;
            } else if (this.x + halfWidth >= CONFIG.GAME_WIDTH) {
                this.x = CONFIG.GAME_WIDTH - halfWidth;
                this.vx = -Math.abs(this.vx);  // Reverse to left
                this.bounceCount++;
            }
        }

        // Deactivate off-screen
        if (this.canBounce) {
            // For bouncing mode: only despawn off top/bottom
            if (this.y < -20 || this.y > CONFIG.GAME_HEIGHT + 20) {
                this.active = false;
            }
        } else {
            // Normal bounds check: despawn off any edge
            if (this.y < -20 || this.y > CONFIG.GAME_HEIGHT + 20 ||
                this.x < -20 || this.x > CONFIG.GAME_WIDTH + 20) {
                this.active = false;
            }
        }
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        const color = this.isPlayerBullet
            ? CONFIG.COLORS.PLAYER_BULLET
            : CONFIG.COLORS.ENEMY_BULLET;

        ctx.fillStyle = color;

        if (this.isPlayerBullet) {
            // Player bullets: small rectangle
            ctx.fillRect(this.x - 1, this.y - 4, 2, 8);
        } else {
            // Enemy bullets: larger filled circle for visibility
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
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
}
