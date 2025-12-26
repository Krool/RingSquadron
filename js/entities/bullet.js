/**
 * Bullet Entity
 * Player bullets are small and fast, enemy bullets are larger for visibility
 * @module entities/bullet
 */
import { CONFIG } from '../utils/config.js';
import { SPRITES } from '../utils/sprites.js';

export class Bullet {
    constructor(x, y, isPlayerBullet = true, damage = CONFIG.PLAYER_BULLET_DAMAGE) {
        this.x = x;
        this.y = y;
        this.isPlayerBullet = isPlayerBullet;
        this.damage = damage;
        this.speed = isPlayerBullet ? CONFIG.PLAYER_BULLET_SPEED : 4; // Slower enemy bullets
        this.active = true;
        this.sprite = isPlayerBullet ? SPRITES.BULLET_UP : SPRITES.BULLET_DOWN;

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
        const direction = this.isPlayerBullet ? -1 : 1;
        this.y += this.speed * direction * (deltaTime / 16);

        if (this.y < -20 || this.y > CONFIG.GAME_HEIGHT + 20) {
            this.active = false;
        }
    }

    draw(renderer) {
        const color = this.isPlayerBullet
            ? CONFIG.COLORS.PLAYER_BULLET
            : CONFIG.COLORS.ENEMY_BULLET;

        if (this.isPlayerBullet) {
            // Player bullets: small line
            renderer.drawTextFullyCentered('|', this.x, this.y, color, this.displaySize);
        } else {
            // Enemy bullets: larger filled circle for visibility
            renderer.drawTextFullyCentered('●', this.x, this.y, color, this.displaySize);
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
