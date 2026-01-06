/**
 * Red Box Entity - Chase Mode
 *
 * The rising death zone that chases the player from below.
 * Cannot be destroyed, grows over time, slows when hit by cargo ships.
 *
 * @module entities/redbox
 */
import { CONFIG } from '../utils/config.js';

export class RedBox {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        const cfg = CONFIG.CHASE_MODE;

        // Position and size
        this.x = gameWidth / 2;
        this.y = cfg.redBoxStartY;
        this.width = gameWidth;
        this.height = 50;  // Starting height
        this.initialY = cfg.redBoxStartY;

        // Growth mechanics
        this.safetyTimer = cfg.redBoxSafetyTime;
        this.baseGrowthRate = cfg.redBoxBaseGrowthRate;
        this.maxHeight = cfg.redBoxMaxHeight;
        this.minY = cfg.redBoxMinY;

        // Damage system
        this.damageCount = 0;
        this.slowdownMultiplier = 1.0;
        this.slowdownTimer = 0;
        this.flashTimer = 0;

        // State
        this.active = true;
        this.playTime = 0;
    }

    update(deltaTime, waveNumber, isSlowedDown, playerBoostLevel, enemySpeedBoost = 1.0) {
        const cfg = CONFIG.CHASE_MODE;
        const dt = deltaTime / 16; // Normalize to ~60fps

        this.playTime += deltaTime;

        // Update slowdown effect
        if (isSlowedDown) {
            this.slowdownMultiplier = cfg.redBoxDamageSlowdown;
        } else {
            this.slowdownMultiplier = 1.0;
        }

        // Update flash effect
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }

        // Safety period - don't move
        if (this.safetyTimer > 0) {
            this.safetyTimer -= deltaTime;
            return;
        }

        // Calculate growth rate with wave scaling and enemy speed boost
        const waveMultiplier = 1 + (waveNumber * cfg.redBoxWaveScaling);
        const effectiveGrowthRate = this.baseGrowthRate * waveMultiplier * this.slowdownMultiplier * enemySpeedBoost;

        // Calculate shrink rate from player boost (negative growth = shrinking)
        // Each boost level adds 0.15 pixels/frame of shrinkage
        const boostShrinkRate = playerBoostLevel * 0.15;

        // Net movement: growth - shrink
        const netRate = effectiveGrowthRate - boostShrinkRate;

        // Move upward (decrease Y) or downward (increase Y) based on net rate
        this.y -= netRate * dt;

        // Apply limits
        // Min Y is when red box reaches max height (40% of screen from bottom)
        const maxHeightY = this.gameHeight - this.maxHeight;
        if (this.y < maxHeightY) {
            this.y = maxHeightY;
        }

        // Max Y is the bottom of screen (can be pushed all the way down)
        if (this.y > this.gameHeight) {
            this.y = this.gameHeight;
        }
    }

    takeDamage(amount) {
        const cfg = CONFIG.CHASE_MODE;
        this.damageCount += amount;
        this.flashTimer = cfg.redBoxFlashDuration;

        // Audio and visual feedback handled by caller
        return false; // Never dies
    }

    reset() {
        // Reset to starting position (golden boost effect)
        const cfg = CONFIG.CHASE_MODE;
        this.y = cfg.redBoxStartY;
    }

    getBounds() {
        // Red box fills from bottom of screen upward
        // Y represents the TOP edge of the red box
        return {
            x: 0,
            y: this.y,
            width: this.width,
            height: this.gameHeight - this.y
        };
    }

    checkPlayerCollision(player) {
        if (!player.active) return false;

        const playerBounds = player.getBounds();
        const boxBounds = this.getBounds();

        // Check if player touches red box
        return (
            playerBounds.x < boxBounds.x + boxBounds.width &&
            playerBounds.x + playerBounds.width > boxBounds.x &&
            playerBounds.y + playerBounds.height > boxBounds.y &&
            playerBounds.y < boxBounds.y + boxBounds.height
        );
    }

    draw(renderer) {
        const ctx = renderer.ctx;

        // Red box fills from bottom of screen upward
        // this.y is the TOP edge, it fills down to gameHeight
        const topY = this.y;
        const bottomY = this.gameHeight;
        const height = bottomY - topY;

        // Flash white when hit
        const isFlashing = this.flashTimer > 0;
        const baseColor = isFlashing ? '#ffffff' : '#cc0000';

        // Draw main red box (from top edge down to bottom of screen)
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, topY, this.gameWidth, height);

        // Gradient top edge (danger zone)
        if (!isFlashing && height > 0) {
            const gradientHeight = Math.min(30, height);
            const gradient = ctx.createLinearGradient(0, topY, 0, topY + gradientHeight);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(204, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, topY, this.gameWidth, gradientHeight);
        }

        // Danger stripes on top edge
        if (!isFlashing && height > 0) {
            ctx.fillStyle = '#ffff00';
            const stripeWidth = 20;
            const stripeHeight = 4;
            const stripeY = topY + 2;

            for (let x = 0; x < this.gameWidth; x += stripeWidth * 2) {
                ctx.fillRect(x, stripeY, stripeWidth, stripeHeight);
            }
        }

        // Pulsing effect on top edge
        if (this.safetyTimer <= 0 && height > 0) {
            const pulse = Math.sin(this.playTime / 200) * 0.2 + 0.8;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, topY, this.gameWidth, 2);
            ctx.globalAlpha = 1;
        }

        // Safety period indicator
        if (this.safetyTimer > 0) {
            const secondsLeft = Math.ceil(this.safetyTimer / 1000);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${CONFIG.FONT_SIZE_HUD}px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText(`SAFE: ${secondsLeft}s`, this.gameWidth / 2, topY - 20);
        }
    }
}
