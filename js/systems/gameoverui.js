/**
 * Game Over / Victory UI
 *
 * Displays end-of-game screen with stats and options.
 * Styled consistently with the main menu.
 *
 * @module systems/gameoverui
 */
import { CONFIG } from '../utils/config.js';

export class GameOverUI {
    constructor() {
        this.visible = false;
        this.isVictory = false;
        this.stats = {};
        this.animTime = 0;

        // Button states
        this.hoveredButton = -1;
        this.pressedButton = -1;
        this.buttonScales = [1, 1];
        this.buttonGlows = [0, 0];

        // Button definitions
        this.buttons = [
            { id: 'restart', label: 'PLAY AGAIN', icon: '>', color: '#00ff88' },
            { id: 'menu', label: 'MAIN MENU', icon: '<', color: '#ffdd00' }
        ];

        // Layout
        this.buttonWidth = 280;
        this.buttonHeight = 50;
        this.buttonSpacing = 12;
        this.buttonsStartY = 420;
    }

    show(isVictory, stats) {
        this.visible = true;
        this.isVictory = isVictory;
        this.stats = stats || {};
        this.animTime = 0;
        this.hoveredButton = -1;
        this.pressedButton = -1;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime) {
        if (!this.visible) return;

        this.animTime += deltaTime / 1000;

        // Animate button scales and glows
        this.buttons.forEach((_, index) => {
            const isHovered = index === this.hoveredButton;
            const isPressed = index === this.pressedButton;

            const targetScale = isPressed ? 0.95 : (isHovered ? 1.03 : 1);
            this.buttonScales[index] += (targetScale - this.buttonScales[index]) * 0.25;

            const targetGlow = isHovered ? 1 : 0;
            this.buttonGlows[index] += (targetGlow - this.buttonGlows[index]) * 0.2;
        });
    }

    updateHover(x, y) {
        if (!this.visible) return;

        const centerX = CONFIG.GAME_WIDTH / 2;

        this.hoveredButton = -1;

        this.buttons.forEach((btn, index) => {
            const btnX = centerX - this.buttonWidth / 2;
            const btnY = this.buttonsStartY + index * (this.buttonHeight + this.buttonSpacing);

            if (x >= btnX && x <= btnX + this.buttonWidth &&
                y >= btnY && y <= btnY + this.buttonHeight) {
                this.hoveredButton = index;
            }
        });
    }

    onPressStart(x, y) {
        this.updateHover(x, y);
        this.pressedButton = this.hoveredButton;
    }

    onPressEnd() {
        this.pressedButton = -1;
    }

    // Returns 'restart', 'menu', or null
    handleTap(x, y) {
        if (!this.visible) return null;

        this.updateHover(x, y);

        if (this.hoveredButton >= 0 && this.hoveredButton < this.buttons.length) {
            return this.buttons[this.hoveredButton].id;
        }

        return null;
    }

    draw(ctx) {
        if (!this.visible) return;

        const centerX = CONFIG.GAME_WIDTH / 2;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        // Title
        this.drawTitle(ctx, centerX);

        // Stats panel
        this.drawStats(ctx, centerX);

        // Buttons
        this.drawButtons(ctx, centerX);
    }

    drawTitle(ctx, centerX) {
        const title = this.isVictory ? 'VICTORY' : 'DEFEATED';
        const titleColor = this.isVictory ? '#00ff88' : '#ff4444';
        const subtitle = this.isVictory ? 'Mission Complete!' : 'Game Over';

        // Glow effect
        ctx.save();
        ctx.shadowColor = titleColor;
        ctx.shadowBlur = 20 + Math.sin(this.animTime * 3) * 10;

        // Main title with wave animation
        ctx.font = `bold 36px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw each character with slight wave
        const chars = title.split('');
        let totalWidth = ctx.measureText(title).width;
        let startX = centerX - totalWidth / 2;

        chars.forEach((char, i) => {
            const charWidth = ctx.measureText(char).width;
            const wave = Math.sin(this.animTime * 4 + i * 0.5) * 3;
            ctx.fillStyle = titleColor;
            ctx.fillText(char, startX + charWidth / 2, 60 + wave);
            startX += charWidth;
        });

        ctx.restore();

        // Subtitle
        ctx.fillStyle = '#888888';
        ctx.font = `14px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(subtitle, centerX, 95);

        // New high score banner
        if (this.stats.isNewHighScore) {
            const pulse = Math.sin(this.animTime * 6) * 0.2 + 0.8;
            ctx.save();
            ctx.shadowColor = '#ffdd00';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffdd00';
            ctx.font = `bold ${Math.floor(16 * pulse)}px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText('★ NEW HIGH SCORE ★', centerX, 120);
            ctx.restore();
        }
    }

    drawStats(ctx, centerX) {
        const stats = this.stats;
        const panelTop = 145;
        const panelWidth = 320;
        const panelLeft = centerX - panelWidth / 2;

        // Stats panel background
        ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
        ctx.fillRect(panelLeft, panelTop, panelWidth, 250);
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 2;
        ctx.strokeRect(panelLeft, panelTop, panelWidth, 250);

        // Inner border
        ctx.strokeStyle = 'rgba(100, 100, 150, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelLeft + 4, panelTop + 4, panelWidth - 8, 242);

        // Stats rows
        const statRows = [
            { label: 'SCORE', value: (stats.score || 0).toLocaleString(), color: '#ffffff', size: 22 },
            { label: 'WAVE', value: stats.wave || 1, color: '#88aaff', size: 18 },
            { label: 'ENEMIES DEFEATED', value: stats.kills || 0, color: '#ff8866', size: 16 },
            { label: 'ALLIES RECRUITED', value: stats.alliesRecruited || 0, color: '#66ff88', size: 16 },
            { label: 'MAX COMBO', value: `${stats.maxCombo || 0}x`, color: '#ffaa00', size: 16 },
            { label: 'TIME', value: this.formatTime(stats.playTime || 0), color: '#aaaaaa', size: 16 },
            { label: 'GOLD EARNED', value: `+${stats.goldEarned || 0}`, color: '#ffdd00', size: 18 }
        ];

        let y = panelTop + 25;
        const rowHeight = 32;

        statRows.forEach((row, index) => {
            // Stagger animation
            const delay = index * 0.1;
            const alpha = Math.min(1, Math.max(0, (this.animTime - delay) * 3));

            if (alpha > 0) {
                ctx.globalAlpha = alpha;

                // Label
                ctx.fillStyle = '#666688';
                ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'left';
                ctx.fillText(row.label, panelLeft + 20, y);

                // Value
                ctx.fillStyle = row.color;
                ctx.font = `bold ${row.size}px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'right';
                ctx.fillText(row.value.toString(), panelLeft + panelWidth - 20, y + 2);

                // Separator line
                if (index < statRows.length - 1) {
                    ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(panelLeft + 15, y + 12);
                    ctx.lineTo(panelLeft + panelWidth - 15, y + 12);
                    ctx.stroke();
                }

                ctx.globalAlpha = 1;
            }

            y += rowHeight;
        });

        ctx.textAlign = 'left';
    }

    drawButtons(ctx, centerX) {
        this.buttons.forEach((btn, index) => {
            const btnX = centerX - this.buttonWidth / 2;
            const btnY = this.buttonsStartY + index * (this.buttonHeight + this.buttonSpacing);

            const isHovered = index === this.hoveredButton;
            const isPressed = index === this.pressedButton;
            const scale = this.buttonScales[index];
            const glow = this.buttonGlows[index];

            ctx.save();

            // Apply scale transform
            const btnCenterX = btnX + this.buttonWidth / 2;
            const btnCenterY = btnY + this.buttonHeight / 2;
            ctx.translate(btnCenterX, btnCenterY);
            ctx.scale(scale, scale);
            ctx.translate(-btnCenterX, -btnCenterY);

            // Glow effect
            if (glow > 0.01) {
                ctx.shadowColor = btn.color;
                ctx.shadowBlur = 15 * glow;
            }

            // Button background gradient
            const bgAlpha = isPressed ? 0.5 : (isHovered ? 0.35 : 0.2);
            const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + this.buttonHeight);
            gradient.addColorStop(0, this.hexToRgba(btn.color, bgAlpha * 1.5));
            gradient.addColorStop(0.5, this.hexToRgba(btn.color, bgAlpha));
            gradient.addColorStop(1, this.hexToRgba(btn.color, bgAlpha * 0.5));
            ctx.fillStyle = gradient;
            ctx.fillRect(btnX, btnY, this.buttonWidth, this.buttonHeight);

            // Border
            ctx.strokeStyle = isHovered ? btn.color : '#555555';
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(btnX, btnY, this.buttonWidth, this.buttonHeight);

            // Inner border on hover
            if (isHovered) {
                ctx.strokeStyle = this.hexToRgba(btn.color, 0.3);
                ctx.lineWidth = 1;
                ctx.strokeRect(btnX + 3, btnY + 3, this.buttonWidth - 6, this.buttonHeight - 6);
            }

            // Scanlines on hover
            if (isHovered) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                for (let scanY = btnY; scanY < btnY + this.buttonHeight; scanY += 4) {
                    if ((scanY + Math.floor(this.animTime * 30)) % 8 < 4) {
                        ctx.fillRect(btnX, scanY, this.buttonWidth, 2);
                    }
                }
            }

            ctx.shadowBlur = 0;

            // Icon
            ctx.fillStyle = isHovered ? btn.color : '#666666';
            ctx.font = `bold 20px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`[${btn.icon}]`, btnX + 30, btnY + this.buttonHeight / 2);

            // Label
            ctx.fillStyle = isHovered ? '#ffffff' : '#bbbbbb';
            ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText(btn.label, centerX + 10, btnY + this.buttonHeight / 2);

            // Arrow on hover
            if (isHovered) {
                const arrowPulse = Math.sin(this.animTime * 8) * 4;
                ctx.fillStyle = btn.color;
                ctx.font = `bold 18px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'right';
                ctx.fillText('>', btnX + this.buttonWidth - 15 + arrowPulse, btnY + this.buttonHeight / 2);
            }

            ctx.restore();
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
