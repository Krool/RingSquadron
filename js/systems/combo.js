// Combo System - Score multiplier based on kill streaks
import { CONFIG } from '../utils/config.js';

export class ComboSystem {
    constructor() {
        this.combo = 0;
        this.maxCombo = 0;
        this.multiplier = 1;
        this.comboTimer = 0;
        this.comboDuration = 2000; // ms before combo resets
        this.lastKillTime = 0;

        // Visual feedback
        this.displayCombo = 0;
        this.comboScale = 1;
        this.comboFlash = 0;

        // Thresholds for multiplier increases
        this.thresholds = [
            { combo: 5, multiplier: 1.5, name: 'NICE!' },
            { combo: 10, multiplier: 2, name: 'GREAT!' },
            { combo: 20, multiplier: 3, name: 'AWESOME!' },
            { combo: 35, multiplier: 4, name: 'INCREDIBLE!' },
            { combo: 50, multiplier: 5, name: 'UNSTOPPABLE!' },
            { combo: 75, multiplier: 7, name: 'GODLIKE!' },
            { combo: 100, multiplier: 10, name: 'LEGENDARY!' }
        ];

        this.currentThresholdName = null;
        this.thresholdDisplayTimer = 0;
    }

    addKill() {
        this.combo++;
        this.lastKillTime = Date.now();
        this.comboTimer = this.comboDuration;

        // Update max combo
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        // Check for threshold milestones
        const previousMultiplier = this.multiplier;
        this.updateMultiplier();

        // Visual feedback
        this.comboScale = 1.3;
        this.comboFlash = 1;

        // Show threshold name if we crossed one
        if (this.multiplier > previousMultiplier) {
            const threshold = this.thresholds.find(t => t.multiplier === this.multiplier);
            if (threshold) {
                this.currentThresholdName = threshold.name;
                this.thresholdDisplayTimer = 90; // frames
            }
        }

        return this.multiplier;
    }

    updateMultiplier() {
        this.multiplier = 1;
        for (const threshold of this.thresholds) {
            if (this.combo >= threshold.combo) {
                this.multiplier = threshold.multiplier;
            }
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 16;

        // Decay combo timer
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.reset();
            }
        }

        // Animate display values
        this.displayCombo += (this.combo - this.displayCombo) * 0.2 * dt;
        this.comboScale += (1 - this.comboScale) * 0.15 * dt;
        this.comboFlash *= 0.9;

        // Threshold display timer
        if (this.thresholdDisplayTimer > 0) {
            this.thresholdDisplayTimer -= dt;
        }
    }

    reset() {
        this.combo = 0;
        this.multiplier = 1;
        this.comboTimer = 0;
        this.currentThresholdName = null;
    }

    getScoreMultiplier() {
        return this.multiplier;
    }

    getGoldMultiplier() {
        // Smaller gold multiplier
        return 1 + (this.multiplier - 1) * 0.5;
    }

    getTimerPercent() {
        return Math.max(0, this.comboTimer / this.comboDuration);
    }

    draw(ctx, x, y) {
        if (this.combo === 0 && this.displayCombo < 0.5) return;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(this.comboScale, this.comboScale);

        // Combo count
        const displayNum = Math.round(this.displayCombo);
        if (displayNum > 0) {
            ctx.fillStyle = this.getComboColor();
            ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';

            // Flash effect
            if (this.comboFlash > 0.1) {
                ctx.globalAlpha = this.comboFlash * 0.5;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`${displayNum}x COMBO`, 0, 0);
                ctx.globalAlpha = 1;
            }

            ctx.fillStyle = this.getComboColor();
            ctx.fillText(`${displayNum}x COMBO`, 0, 0);

            // Multiplier
            if (this.multiplier > 1) {
                ctx.font = `bold 12px ${CONFIG.FONT_FAMILY}`;
                ctx.fillStyle = '#ffff00';
                ctx.fillText(`x${this.multiplier} SCORE`, 0, 20);
            }

            // Timer bar
            const timerPercent = this.getTimerPercent();
            const barWidth = 80;
            const barHeight = 3;
            const barX = -barWidth;
            const barY = this.multiplier > 1 ? 36 : 22;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = timerPercent > 0.3 ? '#00ff00' : '#ff4400';
            ctx.fillRect(barX, barY, barWidth * timerPercent, barHeight);
        }

        ctx.restore();

        // Draw threshold announcement
        if (this.thresholdDisplayTimer > 0 && this.currentThresholdName) {
            this.drawThresholdAnnouncement(ctx);
        }
    }

    drawThresholdAnnouncement(ctx) {
        const alpha = Math.min(1, this.thresholdDisplayTimer / 30);
        const scale = 1 + (1 - alpha) * 0.5;
        const y = CONFIG.GAME_HEIGHT / 3;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(CONFIG.GAME_WIDTH / 2, y);
        ctx.scale(scale, scale);

        // Glow
        ctx.fillStyle = '#ffff00';
        ctx.font = `bold 24px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow/glow effect
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 20;
        ctx.fillText(this.currentThresholdName, 0, 0);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    getComboColor() {
        if (this.multiplier >= 10) return '#ff00ff';
        if (this.multiplier >= 7) return '#ff4400';
        if (this.multiplier >= 5) return '#ff8800';
        if (this.multiplier >= 4) return '#ffcc00';
        if (this.multiplier >= 3) return '#ffff00';
        if (this.multiplier >= 2) return '#88ff00';
        if (this.multiplier >= 1.5) return '#00ff88';
        return '#ffffff';
    }

    serialize() {
        return {
            maxCombo: this.maxCombo
        };
    }

    deserialize(data) {
        if (data) {
            this.maxCombo = data.maxCombo || 0;
        }
    }
}
