/**
 * Level Selection UI
 *
 * Displays a list of custom levels saved in LocalStorage.
 * Allows selecting a level to play in Custom mode.
 *
 * @module systems/levelselect
 */
import { CONFIG } from '../utils/config.js';
import { EditorSystem } from './editor.js';

export class LevelSelectUI {
    constructor() {
        this.visible = false;
        this.levels = [];
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        this.maxVisible = 8;
        this.animTime = 0;
    }

    show() {
        this.visible = true;
        this.refresh();
        this.selectedIndex = 0;
        this.scrollOffset = 0;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime) {
        this.animTime += deltaTime / 1000;
    }

    // Refresh the list of saved levels
    refresh() {
        const savedLevels = EditorSystem.getSavedLevels();
        this.levels = Object.entries(savedLevels).map(([name, data]) => ({
            name,
            waves: data.waves ? data.waves.length : 0,
            createdAt: data.createdAt || 0
        }));

        // Sort by creation date (newest first)
        this.levels.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Get currently selected level name
    getSelectedLevel() {
        if (this.levels.length === 0) return null;
        return this.levels[this.selectedIndex]?.name || null;
    }

    // Handle tap at Y position - returns level name if selected
    handleTap(x, y) {
        if (!this.visible) return null;

        const headerHeight = 80;
        const itemHeight = 55;
        const startY = headerHeight;

        // Check if tap is in back button area
        if (y < headerHeight && x < 80) {
            return 'back';
        }

        // Check if tap is in level list
        if (y >= startY) {
            const index = Math.floor((y - startY) / itemHeight) + this.scrollOffset;
            if (index >= 0 && index < this.levels.length) {
                this.selectedIndex = index;
                return this.levels[index].name;
            }
        }

        return null;
    }

    // Scroll the list
    scroll(direction) {
        this.scrollOffset = Math.max(0, Math.min(
            this.levels.length - this.maxVisible,
            this.scrollOffset + direction
        ));
    }

    draw(ctx) {
        if (!this.visible) return;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 24px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('CUSTOM LEVELS', CONFIG.GAME_WIDTH / 2, 40);

        // Back button
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('< BACK', 15, 40);

        // Subtitle
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('Select a level to play', CONFIG.GAME_WIDTH / 2, 60);

        if (this.levels.length === 0) {
            // No levels message
            ctx.fillStyle = '#999999';
            ctx.font = `14px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText('No custom levels yet!', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 - 20);
            ctx.fillText('Create one in the Map Editor', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT / 2 + 10);
        } else {
            // Level list
            const headerHeight = 80;
            const itemHeight = 55;

            const visibleLevels = this.levels.slice(
                this.scrollOffset,
                this.scrollOffset + this.maxVisible
            );

            visibleLevels.forEach((level, i) => {
                const actualIndex = i + this.scrollOffset;
                const y = headerHeight + i * itemHeight;
                const isSelected = actualIndex === this.selectedIndex;

                // Background
                if (isSelected) {
                    ctx.fillStyle = 'rgba(68, 170, 255, 0.2)';
                    ctx.fillRect(10, y, CONFIG.GAME_WIDTH - 20, itemHeight - 5);

                    ctx.strokeStyle = '#44aaff';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(10, y, CONFIG.GAME_WIDTH - 20, itemHeight - 5);
                }

                // Level name
                ctx.fillStyle = isSelected ? '#44aaff' : '#ffffff';
                ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'left';
                ctx.fillText(level.name, 25, y + 22);

                // Wave count
                ctx.fillStyle = '#aaaaaa';
                ctx.font = `11px ${CONFIG.FONT_FAMILY}`;
                ctx.fillText(`${level.waves} wave${level.waves !== 1 ? 's' : ''}`, 25, y + 40);

                // Play indicator
                if (isSelected) {
                    const arrowPulse = Math.sin(this.animTime * 6) * 3;
                    ctx.fillStyle = '#44aaff';
                    ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
                    ctx.textAlign = 'right';
                    ctx.fillText('PLAY >', CONFIG.GAME_WIDTH - 25 + arrowPulse, y + 30);
                }
            });

            // Scroll indicators
            if (this.scrollOffset > 0) {
                ctx.fillStyle = '#aaaaaa';
                ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.fillText('^ More above ^', CONFIG.GAME_WIDTH / 2, headerHeight - 5);
            }

            if (this.scrollOffset + this.maxVisible < this.levels.length) {
                ctx.fillStyle = '#aaaaaa';
                ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                const bottomY = headerHeight + this.maxVisible * itemHeight + 10;
                ctx.fillText('v More below v', CONFIG.GAME_WIDTH / 2, bottomY);
            }
        }

        // Instructions at bottom
        ctx.fillStyle = '#888888';
        ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('Tap a level to play it', CONFIG.GAME_WIDTH / 2, CONFIG.GAME_HEIGHT - 30);

        ctx.textAlign = 'left';
    }
}
