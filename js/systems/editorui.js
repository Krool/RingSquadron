/**
 * Level Editor UI
 *
 * Provides the visual interface for the level editor:
 * - Grid overlay for placement
 * - Tool selection toolbar (bottom)
 * - Wave navigation sidebar (right)
 * - Preview of placed elements
 *
 * @module systems/editorui
 */
import { CONFIG } from '../utils/config.js';

export class EditorUI {
    constructor(editor) {
        this.editor = editor;
        this.visible = false;

        // Layout dimensions
        this.toolbarHeight = 70;
        this.sidebarWidth = 90;

        // Tool definitions
        this.tools = [
            { key: 'ring', icon: 'O', label: 'Ring', color: '#44aaff' },
            { key: 'enemy', icon: 'X', label: 'Enemy', color: '#ff4444' },
            { key: 'wall', icon: '#', label: 'Wall', color: '#888888' },
            { key: 'gate_x2', icon: '*', label: 'x2', color: '#ffdd00' },
            { key: 'gate_div', icon: '/', label: '/2', color: '#aa2222' },
            { key: 'erase', icon: '-', label: 'Erase', color: '#ff6666' }
        ];

        // Animation
        this.animTime = 0;
        this.saveFlash = 0;
    }

    show() {
        this.visible = true;
        this.animTime = 0;
    }

    hide() {
        this.visible = false;
    }

    update(deltaTime) {
        this.animTime += deltaTime / 1000;
        if (this.saveFlash > 0) {
            this.saveFlash -= deltaTime / 1000;
        }
    }

    // Handle tap/click input
    handleTap(x, y) {
        if (!this.visible) return null;

        // Check toolbar (bottom)
        if (y > CONFIG.GAME_HEIGHT - this.toolbarHeight) {
            return this.handleToolbarTap(x, y);
        }

        // Check sidebar (right)
        if (x > CONFIG.GAME_WIDTH - this.sidebarWidth) {
            // Pass relative X within sidebar
            const relativeX = x - (CONFIG.GAME_WIDTH - this.sidebarWidth);
            return this.handleSidebarTap(y, relativeX);
        }

        // Grid area - place element
        this.editor.placeElement(x, y);
        return 'placed';
    }

    handleToolbarTap(x, y) {
        const toolWidth = (CONFIG.GAME_WIDTH - this.sidebarWidth) / this.tools.length;
        const toolIndex = Math.floor(x / toolWidth);

        if (toolIndex >= 0 && toolIndex < this.tools.length) {
            this.editor.selectedTool = this.tools[toolIndex].key;
            return 'tool_selected';
        }
        return null;
    }

    handleSidebarTap(y, relativeX = 45) {
        // Match button positions from drawSidebar()
        // Prev: y=80, Next: y=115, Add: y=155, Del: y=190
        if (y >= 80 && y < 110) {
            this.editor.prevWave();
            return 'prev_wave';
        }
        if (y >= 115 && y < 145) {
            this.editor.nextWave();
            return 'next_wave';
        }
        if (y >= 155 && y < 185) {
            this.editor.addWave();
            return 'add_wave';
        }
        if (y >= 190 && y < 220) {
            this.editor.removeWave();
            return 'remove_wave';
        }

        // Value controls at y=280 (- button at x=5, + button at x=45)
        // Both buttons are 35w x 25h
        if (y >= 280 && y < 305) {
            // Left half = decrement, right half = increment
            const isLeftButton = relativeX < 45;
            if (this.editor.selectedTool === 'ring') {
                if (isLeftButton) {
                    this.editor.decrementRingValue();
                } else {
                    this.editor.incrementRingValue();
                }
            } else if (this.editor.selectedTool === 'enemy') {
                this.editor.cycleEnemyType(isLeftButton ? -1 : 1);
            }
            return isLeftButton ? 'value_down' : 'value_up';
        }

        // Save button at y=350, height=35
        if (y >= 350 && y < 385) {
            this.editor.saveLevel();
            this.saveFlash = 1;
            return 'save';
        }

        // Clear button at y=395, height=30
        if (y >= 395 && y < 425) {
            this.editor.clearCurrentWave();
            return 'clear';
        }

        // Exit button at CONFIG.GAME_HEIGHT - toolbarHeight - 45, height=35
        const exitY = CONFIG.GAME_HEIGHT - this.toolbarHeight - 45;
        if (y >= exitY && y < exitY + 35) {
            return 'exit';
        }

        return null;
    }

    draw(ctx) {
        if (!this.visible) return;

        // Draw grid
        this.drawGrid(ctx);

        // Draw lane dividers
        this.drawLanes(ctx);

        // Draw placed elements preview
        this.drawPreview(ctx);

        // Draw toolbar
        this.drawToolbar(ctx);

        // Draw sidebar
        this.drawSidebar(ctx);

        // Save flash effect
        if (this.saveFlash > 0) {
            ctx.fillStyle = `rgba(0, 255, 100, ${this.saveFlash * 0.3})`;
            ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
        }
    }

    drawGrid(ctx) {
        const gridSize = this.editor.gridSize;
        const editWidth = CONFIG.GAME_WIDTH - this.sidebarWidth;
        const editHeight = CONFIG.GAME_HEIGHT - this.toolbarHeight;

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= editWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, editHeight);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= editHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(editWidth, y);
            ctx.stroke();
        }
    }

    drawLanes(ctx) {
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        const editHeight = CONFIG.GAME_HEIGHT - this.toolbarHeight;

        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);

        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(laneWidth * i, 0);
            ctx.lineTo(laneWidth * i, editHeight);
            ctx.stroke();
        }

        ctx.setLineDash([]);

        // Lane labels
        ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('LEFT', laneWidth * 0.5, 15);
        ctx.fillText('CENTER', laneWidth * 1.5, 15);
        ctx.fillText('RIGHT', laneWidth * 2.5, 15);
        ctx.textAlign = 'left';
    }

    drawPreview(ctx) {
        const wave = this.editor.getCurrentWave();

        // Draw walls
        wave.walls.forEach(w => {
            const laneWidth = CONFIG.GAME_WIDTH / 3;
            const x = laneWidth * w.lane + laneWidth / 2;
            const width = laneWidth - 20;

            ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
            ctx.fillRect(x - width / 2, 60, width, 30);
            ctx.strokeStyle = '#666677';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - width / 2, 60, width, 30);

            // Wall pattern
            ctx.fillStyle = '#ff4444';
            ctx.font = `bold 12px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText('WALL', x, 80);
        });

        // Draw rings
        wave.rings.forEach(r => {
            const x = r.x * CONFIG.GAME_WIDTH;
            const color = r.value >= 0 ? '#44aaff' : '#ff4466';

            ctx.beginPath();
            ctx.arc(x, r.y, 15, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = color;
            ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = r.value >= 0 ? `+${r.value}` : `${r.value}`;
            ctx.fillText(text, x, r.y);
        });

        // Draw gates
        wave.gates.forEach(g => {
            const x = g.x * CONFIG.GAME_WIDTH;
            const color = g.type === 'multiply' ? '#ffdd00' : '#aa2222';
            const text = g.type === 'multiply' ? 'x2' : '/2';

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 20, g.y - 12, 40, 24);

            ctx.fillStyle = color;
            ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, g.y);
        });

        // Draw enemies
        wave.enemies.forEach(e => {
            const x = e.x * CONFIG.GAME_WIDTH;

            ctx.fillStyle = '#ff4444';
            ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('X', x, 40);
            ctx.font = `8px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText(e.type, x, 52);
        });

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    drawToolbar(ctx) {
        const y = CONFIG.GAME_HEIGHT - this.toolbarHeight;
        const editWidth = CONFIG.GAME_WIDTH - this.sidebarWidth;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, y, editWidth, this.toolbarHeight);

        // Border
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(editWidth, y);
        ctx.stroke();

        // Tools
        const toolWidth = editWidth / this.tools.length;
        this.tools.forEach((tool, i) => {
            const x = i * toolWidth;
            const isSelected = this.editor.selectedTool === tool.key;

            // Highlight selected
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.fillRect(x, y, toolWidth, this.toolbarHeight);

                ctx.strokeStyle = tool.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, toolWidth - 4, this.toolbarHeight - 4);
            }

            // Icon
            ctx.fillStyle = isSelected ? tool.color : '#666666';
            ctx.font = `bold 24px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText(tool.icon, x + toolWidth / 2, y + 28);

            // Label
            ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
            ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText(tool.label, x + toolWidth / 2, y + 50);
        });

        ctx.textAlign = 'left';
    }

    drawSidebar(ctx) {
        const x = CONFIG.GAME_WIDTH - this.sidebarWidth;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x, 0, this.sidebarWidth, CONFIG.GAME_HEIGHT);

        // Border
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CONFIG.GAME_HEIGHT);
        ctx.stroke();

        // Wave info
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 12px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        const centerX = x + this.sidebarWidth / 2;
        ctx.fillText(`Wave`, centerX, 40);
        ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(`${this.editor.currentWaveIndex + 1}/${this.editor.waves.length}`, centerX, 58);

        // Navigation buttons
        this.drawButton(ctx, x + 5, 80, this.sidebarWidth - 10, 30, '< Prev', '#666666');
        this.drawButton(ctx, x + 5, 115, this.sidebarWidth - 10, 30, 'Next >', '#666666');
        this.drawButton(ctx, x + 5, 155, this.sidebarWidth - 10, 30, '+ Add', '#448844');
        this.drawButton(ctx, x + 5, 190, this.sidebarWidth - 10, 30, '- Del', '#884444');

        // Value controls (for ring/enemy)
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
        if (this.editor.selectedTool === 'ring') {
            ctx.fillText('Ring Value:', centerX, 245);
            ctx.font = `bold 18px ${CONFIG.FONT_FAMILY}`;
            ctx.fillStyle = this.editor.selectedRingValue >= 0 ? '#44aaff' : '#ff4466';
            const valText = this.editor.selectedRingValue >= 0 ? `+${this.editor.selectedRingValue}` : `${this.editor.selectedRingValue}`;
            ctx.fillText(valText, centerX, 268);
            this.drawButton(ctx, x + 5, 280, 35, 25, '-', '#666666');
            this.drawButton(ctx, x + 45, 280, 35, 25, '+', '#666666');
        } else if (this.editor.selectedTool === 'enemy') {
            ctx.fillText('Enemy:', centerX, 245);
            ctx.font = `bold 11px ${CONFIG.FONT_FAMILY}`;
            ctx.fillStyle = '#ff4444';
            ctx.fillText(this.editor.selectedEnemyType, centerX, 268);
            this.drawButton(ctx, x + 5, 280, 35, 25, '<', '#666666');
            this.drawButton(ctx, x + 45, 280, 35, 25, '>', '#666666');
        }

        // Level name
        ctx.fillStyle = '#888888';
        ctx.font = `9px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(this.editor.levelName, centerX, 335);

        // Save/Clear buttons
        const saveColor = this.saveFlash > 0 ? '#00ff88' : '#4488ff';
        this.drawButton(ctx, x + 5, 350, this.sidebarWidth - 10, 35, 'SAVE', saveColor);
        this.drawButton(ctx, x + 5, 395, this.sidebarWidth - 10, 30, 'Clear', '#884444');

        // Stats
        const stats = this.editor.getWaveStats();
        ctx.fillStyle = '#666666';
        ctx.font = `8px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(`R:${stats.rings} E:${stats.enemies}`, centerX, 450);
        ctx.fillText(`W:${stats.walls} G:${stats.gates}`, centerX, 462);

        // Exit button
        this.drawButton(ctx, x + 5, CONFIG.GAME_HEIGHT - this.toolbarHeight - 45, this.sidebarWidth - 10, 35, 'EXIT', '#ff4444');

        ctx.textAlign = 'left';
    }

    drawButton(ctx, x, y, width, height, text, color) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, width, height);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 11px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
        ctx.textBaseline = 'top';
    }
}
