// Game Mode System
import { CONFIG } from '../utils/config.js';

export const GAME_MODES = {
    ENDLESS: {
        name: 'Endless',
        description: 'Survive as long as possible',
        icon: '~',
        rules: {
            waves: Infinity,
            lives: 1,
            goldMultiplier: 1,
            difficultyRamp: 'standard',
            bossEvery: 5
        }
    },
    CAMPAIGN: {
        name: 'Campaign',
        description: '12 puzzle levels, master the rings',
        icon: '!',
        rules: {
            waves: 12,
            lives: 3,
            goldMultiplier: 1.5,
            difficultyRamp: 'fixed',
            bossEvery: 0,
            finalBoss: false,
            isCampaign: true
        }
    },
    RUSH: {
        name: 'Rush Mode',
        description: 'Fast enemies, fast gold',
        icon: '>',
        rules: {
            waves: Infinity,
            lives: 1,
            goldMultiplier: 2,
            difficultyRamp: 'fast',
            bossEvery: 3,
            speedMultiplier: 1.5
        }
    },
    SURVIVAL: {
        name: 'Survival',
        description: 'No gold, no upgrades, pure skill',
        icon: '#',
        rules: {
            waves: Infinity,
            lives: 1,
            goldMultiplier: 0,
            difficultyRamp: 'aggressive',
            bossEvery: 5,
            noShop: true,
            noPowerups: false
        }
    },
    PRACTICE: {
        name: 'Practice',
        description: 'Infinite health, learn the game',
        icon: '?',
        rules: {
            waves: Infinity,
            lives: Infinity,
            goldMultiplier: 0.5,
            difficultyRamp: 'slow',
            bossEvery: 10,
            invincible: true,
            noHighScore: true
        }
    }
};

export class GameModeManager {
    constructor() {
        this.currentMode = 'ENDLESS';
        this.modeData = null;
        this.waveNumber = 1;
        this.livesRemaining = 1;
        this.campaignProgress = 0;
    }

    setMode(modeKey) {
        if (GAME_MODES[modeKey]) {
            this.currentMode = modeKey;
            this.modeData = GAME_MODES[modeKey];
            this.livesRemaining = this.modeData.rules.lives;
            this.waveNumber = 1;
            return true;
        }
        return false;
    }

    getMode() {
        return this.modeData || GAME_MODES[this.currentMode];
    }

    getRules() {
        return this.getMode().rules;
    }

    // Check if game should continue after death
    loseLife() {
        if (this.livesRemaining === Infinity) return true;

        this.livesRemaining--;
        return this.livesRemaining > 0;
    }

    getLives() {
        return this.livesRemaining;
    }

    // Get difficulty multiplier based on wave and mode
    getDifficultyMultiplier(wave) {
        const ramp = this.getRules().difficultyRamp;

        switch (ramp) {
            case 'slow':
                return 1 + (wave - 1) * 0.05;
            case 'standard':
                return 1 + (wave - 1) * 0.1;
            case 'fast':
                return 1 + (wave - 1) * 0.15;
            case 'aggressive':
                return 1 + (wave - 1) * 0.2;
            case 'fixed':
                // Campaign has fixed difficulty curve
                return 1 + Math.min(wave / 20, 1) * 1.5;
            default:
                return 1 + (wave - 1) * 0.1;
        }
    }

    // Get enemy spawn rate modifier
    getSpawnRateMultiplier() {
        const rules = this.getRules();
        return rules.speedMultiplier || 1;
    }

    // Check if boss should appear
    shouldSpawnBoss(wave) {
        const rules = this.getRules();
        if (wave % rules.bossEvery === 0) {
            return true;
        }
        // Final boss at last wave in campaign
        if (rules.finalBoss && wave === rules.waves) {
            return true;
        }
        return false;
    }

    // Check if wave is final
    isFinalWave(wave) {
        const rules = this.getRules();
        return rules.waves !== Infinity && wave >= rules.waves;
    }

    // Check if shop is available
    canUseShop() {
        return !this.getRules().noShop;
    }

    // Check if high score should be saved
    canSaveHighScore() {
        return !this.getRules().noHighScore;
    }

    // Check if player is invincible
    isInvincible() {
        return this.getRules().invincible;
    }

    // Get gold multiplier
    getGoldMultiplier() {
        return this.getRules().goldMultiplier;
    }

    // Advance wave
    nextWave() {
        this.waveNumber++;
        return this.waveNumber;
    }

    // Reset for new game
    reset() {
        this.waveNumber = 1;
        this.livesRemaining = this.getRules().lives;
    }

    // Serialize
    serialize() {
        return {
            mode: this.currentMode,
            wave: this.waveNumber,
            lives: this.livesRemaining
        };
    }

    // Deserialize
    deserialize(data) {
        if (data) {
            this.setMode(data.mode || 'ENDLESS');
            this.waveNumber = data.wave || 1;
            this.livesRemaining = data.lives || this.getRules().lives;
        }
    }
}

// Retro Mode Selection UI - Integrated into main menu
export class ModeSelectUI {
    constructor() {
        this.visible = true; // Always visible on menu
        this.selectedIndex = 0;
        this.hoveredIndex = -1;
        this.pressedIndex = -1;
        this.modes = Object.entries(GAME_MODES);
        this.modeStartY = 180; // Below the title
        this.modeHeight = 52;
        this.animTime = 0;

        // Button animation states
        this.buttonScales = this.modes.map(() => 1);
        this.buttonGlows = this.modes.map(() => 0);
        this.lastHoveredIndex = -1;
    }

    show() {
        this.visible = true;
        this.selectedIndex = 0;
        this.hoveredIndex = -1;
        this.pressedIndex = -1;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime) {
        this.animTime += deltaTime / 1000;

        // Animate button scales and glows
        this.modes.forEach((_, index) => {
            const isHovered = index === this.hoveredIndex;
            const isPressed = index === this.pressedIndex;

            // Target scale: pressed = 0.95, hovered = 1.02, normal = 1
            const targetScale = isPressed ? 0.95 : (isHovered ? 1.02 : 1);
            this.buttonScales[index] += (targetScale - this.buttonScales[index]) * 0.3;

            // Target glow: hovered = 1, normal = 0
            const targetGlow = isHovered ? 1 : 0;
            this.buttonGlows[index] += (targetGlow - this.buttonGlows[index]) * 0.2;
        });
    }

    // Called when touch/mouse starts
    onPressStart(y) {
        const index = this.getIndexAtY(y);
        if (index >= 0 && index < this.modes.length) {
            this.pressedIndex = index;
        }
    }

    // Called when touch/mouse ends
    onPressEnd() {
        this.pressedIndex = -1;
    }

    // Update hovered mode based on touch position
    updateHover(y) {
        if (y === null) {
            this.hoveredIndex = -1;
            return;
        }
        this.hoveredIndex = this.getIndexAtY(y);
    }

    getIndexAtY(y) {
        const adjustedY = y - this.modeStartY;
        if (adjustedY < 0) return -1;
        const index = Math.floor(adjustedY / this.modeHeight);
        if (index >= 0 && index < this.modes.length) {
            return index;
        }
        return -1;
    }

    moveSelection(direction) {
        this.selectedIndex = (this.selectedIndex + direction + this.modes.length) % this.modes.length;
    }

    getSelectedMode() {
        return this.modes[this.selectedIndex][0];
    }

    getModeAtY(y) {
        const index = this.getIndexAtY(y);
        if (index >= 0 && index < this.modes.length) {
            return this.modes[index][0];
        }
        return null;
    }

    // Draw integrated into the menu screen
    draw(ctx, canvasWidth, canvasHeight, fontFamily, touchY = null, animTime = 0) {
        // Update hover state
        this.updateHover(touchY);

        const centerX = canvasWidth / 2;
        let y = this.modeStartY;

        // Mode buttons
        this.modes.forEach(([key, mode], index) => {
            const isHovered = index === this.hoveredIndex;
            const isPressed = index === this.pressedIndex;
            const scale = this.buttonScales[index];
            const glow = this.buttonGlows[index];

            // Button dimensions
            const btnWidth = 340;
            const btnHeight = 46;
            const btnX = centerX - btnWidth / 2;
            const btnY = y;

            ctx.save();

            // Apply scale transform from center of button
            const btnCenterX = btnX + btnWidth / 2;
            const btnCenterY = btnY + btnHeight / 2;
            ctx.translate(btnCenterX, btnCenterY);
            ctx.scale(scale, scale);
            ctx.translate(-btnCenterX, -btnCenterY);

            // Button glow effect
            if (glow > 0.01) {
                ctx.shadowColor = this.getModeColor(key);
                ctx.shadowBlur = 15 * glow;
            }

            // Button background - retro gradient effect
            const bgAlpha = isPressed ? 0.4 : (isHovered ? 0.25 : 0.15);
            const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
            const modeColor = this.getModeColor(key);
            gradient.addColorStop(0, this.hexToRgba(modeColor, bgAlpha * 1.5));
            gradient.addColorStop(0.5, this.hexToRgba(modeColor, bgAlpha));
            gradient.addColorStop(1, this.hexToRgba(modeColor, bgAlpha * 0.5));
            ctx.fillStyle = gradient;
            ctx.fillRect(btnX, btnY, btnWidth, btnHeight);

            // Button border - double line retro style
            ctx.strokeStyle = isHovered ? modeColor : '#444444';
            ctx.lineWidth = isHovered ? 2 : 1;
            ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            // Inner border for depth
            if (isHovered) {
                ctx.strokeStyle = this.hexToRgba(modeColor, 0.3);
                ctx.lineWidth = 1;
                ctx.strokeRect(btnX + 3, btnY + 3, btnWidth - 6, btnHeight - 6);
            }

            // Scanline effect on hover
            if (isHovered) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
                for (let scanY = btnY; scanY < btnY + btnHeight; scanY += 4) {
                    if ((scanY + Math.floor(animTime * 30)) % 8 < 4) {
                        ctx.fillRect(btnX, scanY, btnWidth, 2);
                    }
                }
            }

            ctx.shadowBlur = 0;

            // Mode icon with retro box
            const iconX = btnX + 28;
            const iconY = btnY + btnHeight / 2;
            ctx.fillStyle = isHovered ? modeColor : '#666666';
            ctx.font = `bold 18px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`[${mode.icon}]`, iconX, iconY);

            // Mode name
            ctx.fillStyle = isHovered ? '#ffffff' : '#bbbbbb';
            ctx.font = `bold 14px ${fontFamily}`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(mode.name.toUpperCase(), btnX + 55, btnY + 16);

            // Description
            ctx.fillStyle = isHovered ? '#aaaaaa' : '#666666';
            ctx.font = `10px ${fontFamily}`;
            ctx.fillText(mode.description, btnX + 55, btnY + 32);

            // Arrow indicator on hover
            if (isHovered) {
                const arrowPulse = Math.sin(animTime * 8) * 3;
                ctx.fillStyle = modeColor;
                ctx.font = `bold 16px ${fontFamily}`;
                ctx.textAlign = 'right';
                ctx.fillText('>', btnX + btnWidth - 15 + arrowPulse, btnY + btnHeight / 2);
            }

            ctx.restore();

            y += this.modeHeight;
        });

        // Reset text alignment
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    // Get mode-specific color
    getModeColor(modeKey) {
        const colors = {
            ENDLESS: '#00ff88',
            CAMPAIGN: '#ffdd00',
            RUSH: '#ff4444',
            SURVIVAL: '#ff8800',
            PRACTICE: '#44aaff'
        };
        return colors[modeKey] || '#ffffff';
    }

    // Convert hex to rgba
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getRulesPreview(rules) {
        const parts = [];
        if (rules.lives !== Infinity) {
            parts.push(`${rules.lives} ${rules.lives === 1 ? 'life' : 'lives'}`);
        }
        if (rules.waves !== Infinity) {
            parts.push(`${rules.waves} waves`);
        }
        if (rules.goldMultiplier !== 1) {
            parts.push(`${rules.goldMultiplier}x gold`);
        }
        if (rules.noShop) {
            parts.push('no shop');
        }
        if (rules.invincible) {
            parts.push('invincible');
        }
        return parts.join(' | ') || 'Standard rules';
    }
}
