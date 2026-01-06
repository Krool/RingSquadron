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

        // Boost system - affects game scroll speed
        this.boostLevel = 0; // Current boost level (stacks)
        this.maxBoostLevel = 5; // Maximum stacking
        this.boostDecayRate = 1.2; // How fast boost decays per second (4x faster = 75% shorter duration)

        const size = getSpriteSize(this.sprite);
        // Adjusted for smaller font (8px)
        this.width = size.width * 5;
        this.height = size.height * 8;

        // Bounds for movement - only horizontal now
        this.minX = this.width / 2 + 10;
        this.maxX = gameWidth - this.width / 2 - 10;
        this.minY = 0;  // Allow player to go to top edge
        this.maxY = gameHeight - this.height / 2 - 10;

        // Store game dimensions
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        // Facing direction (for Chase Swarm mode)
        this.facingUp = true;  // true = firing up, false = firing down
        this.downwardFireTimer = 0;
        this.downwardFireRate = 150;  // Fire downward every 150ms when not touching
        this.hasEverTouched = false;  // Track if player has touched screen at least once

        // Flag for vertical movement (Chase mode)
        this.allowVerticalMovement = false;
    }

    update(deltaTime, targetPos, currentTime) {
        if (!this.active) return [];

        const bullets = [];
        const dt = deltaTime / 16;

        // Update invincibility timer
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= deltaTime;
        }

        // Gradually decay boost level
        if (this.boostLevel > 0) {
            this.boostLevel -= this.boostDecayRate * (deltaTime / 1000);
            if (this.boostLevel < 0) {
                this.boostLevel = 0;
            }
        }

        // Update facing direction based on touch state
        if (targetPos) {
            this.hasEverTouched = true;
            this.facingUp = true;
            this.x = targetPos.x;

            // Allow vertical movement in Chase mode
            if (this.allowVerticalMovement) {
                this.y = targetPos.y;
            }
        } else {
            // Only face down if player has touched at least once
            if (this.hasEverTouched) {
                this.facingUp = false;
            }
        }

        // Clamp position to bounds
        this.x = Math.max(this.minX, Math.min(this.maxX, this.x));

        if (this.allowVerticalMovement) {
            this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
        } else {
            this.y = this.fixedY;
        }

        // Auto-fire upward (normal mode)
        if (this.facingUp && currentTime - this.lastFireTime >= this.fireRate) {
            bullets.push(this.fire(true));  // true = fire upward
            this.lastFireTime = currentTime;
        }

        // Auto-fire downward when not touching
        if (!this.facingUp) {
            this.downwardFireTimer += deltaTime;
            if (this.downwardFireTimer >= this.downwardFireRate) {
                bullets.push(this.fire(false));  // false = fire downward
                this.downwardFireTimer = 0;
            }
        } else {
            this.downwardFireTimer = 0;
        }

        return bullets;
    }

    isInvincible() {
        return this.invincibleTimer > 0;
    }

    fire(upward = true) {
        if (upward) {
            // Fire upward from top of ship
            const bullet = new Bullet(this.x, this.y - this.height / 2, true, this.bulletDamage);
            bullet.firingDown = false;
            return bullet;
        } else {
            // Fire downward from bottom of ship
            const bullet = new Bullet(this.x, this.y + this.height / 2, true, this.bulletDamage, 0, 8);
            bullet.firingDown = true;
            return bullet;
        }
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

    // Apply a speed boost (from boost walls) - stacks!
    applyBoost(amount = 1) {
        this.boostLevel = Math.min(this.boostLevel + amount, this.maxBoostLevel);
    }

    // Get current speed multiplier (1.0 = normal, 2.0 = double speed)
    getSpeedMultiplier() {
        // Each boost level adds 0.5x to speed, so:
        // 0 = 1.0x, 1 = 1.5x, 2 = 2.0x, 3 = 2.5x, 4 = 3.0x, 5 = 3.5x
        return 1 + (this.boostLevel * 0.5);
    }

    // Check if currently boosted
    isBoosted() {
        return this.boostLevel > 0.1; // Small threshold for visual effects
    }

    // Get boost level for visual effects (0-1 normalized)
    getBoostIntensity() {
        return Math.min(this.boostLevel / this.maxBoostLevel, 1);
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

        // Determine color based on boost level
        let color = CONFIG.COLORS.PLAYER;
        let glowColor = null;
        const boosted = this.isBoosted();

        if (boosted) {
            // Interpolate color based on boost intensity
            const intensity = this.getBoostIntensity();
            const r = Math.floor(68 + (136 - 68) * intensity);
            const g = Math.floor(170 + (255 - 170) * intensity);
            const b = Math.floor(255 + (136 - 255) * intensity);
            color = `rgb(${r}, ${g}, ${b})`;
            glowColor = '#44ff44';
        }

        ctx.save();

        // Apply rotation based on facing direction
        ctx.translate(this.x, this.y);
        if (!this.facingUp) {
            ctx.rotate(Math.PI);  // Rotate 180 degrees when facing down
        }
        ctx.translate(-this.x, -this.y);

        // Boost glow effect - intensity scales with boost level
        if (glowColor) {
            const intensity = this.getBoostIntensity();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = (10 + intensity * 20) + Math.sin(Date.now() / 50) * 5;
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

        // Engine exhaust (lines at bottom) - longer when boosted
        ctx.strokeStyle = boosted ? '#44ff44' : '#ffaa00';
        ctx.lineWidth = boosted ? 3 : 2;
        const exhaustFlicker = Math.random() * 4 + (boosted ? this.getBoostIntensity() * 8 : 0);
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
        // Smaller collision box to match ship body (excludes wingmen)
        // 60% width, 80% height to better match the actual ship shape
        const collisionWidth = this.width * 0.6;
        const collisionHeight = this.height * 0.8;
        return {
            x: this.x - collisionWidth / 2,
            y: this.y - collisionHeight / 2,
            width: collisionWidth,
            height: collisionHeight
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
        this.boostLevel = 0;
        this.facingUp = true;
        this.hasEverTouched = false;
        this.downwardFireTimer = 0;
    }
}
