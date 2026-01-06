/**
 * Multiplier Gate Entity - Swarm Mode
 *
 * Bouncing horizontal gate that duplicates player projectiles.
 * 20% screen width, bounces side-to-side, doesn't block bullets.
 *
 * @module entities/multipliergate
 */
import { CONFIG } from '../utils/config.js';

export class MultiplierGate {
    constructor(gameWidth, gameHeight, multiplier = 2) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.multiplier = multiplier;

        // Position
        this.width = gameWidth * 0.2;  // 20% of screen
        this.height = 40;
        this.x = gameWidth / 2;
        this.y = gameHeight / 2;  // Middle of screen

        // Bouncing
        this.velocity = 2;  // Horizontal speed
        this.direction = 1;  // 1 = right, -1 = left

        this.active = true;
    }

    update(deltaTime) {
        const dt = deltaTime / 16;

        // Move horizontally
        this.x += this.velocity * this.direction * dt;

        // Bounce off walls
        const halfWidth = this.width / 2;
        if (this.x + halfWidth >= this.gameWidth) {
            this.x = this.gameWidth - halfWidth;
            this.direction = -1;
        } else if (this.x - halfWidth <= 0) {
            this.x = halfWidth;
            this.direction = 1;
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

    // Check if bullet passes through gate
    checkBulletPassThrough(bullet) {
        const bulletBounds = bullet.getBounds();
        const gateBounds = this.getBounds();

        // Check if bullet Y intersects with gate
        const bulletBottom = bulletBounds.y + bulletBounds.height;
        const bulletTop = bulletBounds.y;
        const gateBottom = gateBounds.y + gateBounds.height;
        const gateTop = gateBounds.y;

        // Check if bullet X is within gate bounds
        const bulletX = bulletBounds.x + bulletBounds.width / 2;
        const gateLeft = gateBounds.x;
        const gateRight = gateBounds.x + gateBounds.width;

        return (bulletBottom >= gateTop && bulletTop <= gateBottom &&
                bulletX >= gateLeft && bulletX <= gateRight);
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        const bounds = this.getBounds();

        ctx.save();

        // Draw gate body
        ctx.fillStyle = 'rgba(153, 51, 255, 0.3)';
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Draw border
        ctx.strokeStyle = '#dd88ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Draw multiplier text
        ctx.fillStyle = '#ffbbff';
        ctx.font = `bold 24px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${this.multiplier}x`, this.x, this.y);

        ctx.restore();
    }
}
