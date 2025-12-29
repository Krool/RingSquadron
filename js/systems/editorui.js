/**
 * Level Editor UI
 *
 * Provides the visual interface for the level editor:
 * - Grid overlay for placement
 * - Tool selection toolbar (bottom)
 * - Wave navigation sidebar (right)
 * - Preview of placed elements
 * - Scroll/pan to navigate wave height
 *
 * @module systems/editorui
 */
import { CONFIG } from '../utils/config.js';

export class EditorUI {
    constructor(editor) {
        this.editor = editor;
        this.visible = false;

        // Layout dimensions - narrower sidebar to not overlap lanes
        this.toolbarHeight = 70;
        this.sidebarWidth = 75;

        // Calculate edit area (excludes sidebar)
        this.editAreaWidth = CONFIG.GAME_WIDTH - this.sidebarWidth;

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

        // Drag state for panning
        this.isDragging = false;
        this.lastDragY = 0;
        this.dragStartY = 0;
        this.wasDragged = false;  // True if significant drag occurred
    }

    show() {
        this.visible = true;
        this.animTime = 0;
        this.editor.scrollOffset = 0;
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

    // Handle mouse wheel for scrolling
    handleWheel(deltaY) {
        if (!this.visible) return;
        this.editor.scroll(deltaY * 0.5);
    }

    // Handle drag start
    handleDragStart(x, y) {
        if (!this.visible) return;
        // Only start drag in edit area
        if (x < this.editAreaWidth && y < CONFIG.GAME_HEIGHT - this.toolbarHeight) {
            this.isDragging = true;
            this.lastDragY = y;
            this.dragStartY = y;
            this.wasDragged = false;
        }
    }

    // Handle drag move
    handleDragMove(x, y) {
        if (!this.visible || !this.isDragging) return;

        const deltaY = this.lastDragY - y;
        this.lastDragY = y;

        // Check if this is a significant drag
        if (Math.abs(y - this.dragStartY) > 10) {
            this.wasDragged = true;
        }

        this.editor.scroll(deltaY);
    }

    // Handle drag end
    handleDragEnd() {
        this.isDragging = false;
    }

    // Handle tap/click input
    handleTap(x, y) {
        if (!this.visible) return null;

        // If we were dragging significantly, don't place element
        if (this.wasDragged) {
            this.wasDragged = false;
            return null;
        }

        // Check toolbar (bottom)
        if (y > CONFIG.GAME_HEIGHT - this.toolbarHeight) {
            return this.handleToolbarTap(x, y);
        }

        // Check sidebar (right)
        if (x > this.editAreaWidth) {
            const relativeX = x - this.editAreaWidth;
            return this.handleSidebarTap(y, relativeX);
        }

        // Grid area - place element
        this.editor.placeElement(x, y, this.editAreaWidth);
        return 'placed';
    }

    handleToolbarTap(x, y) {
        const toolWidth = this.editAreaWidth / this.tools.length;
        const toolIndex = Math.floor(x / toolWidth);

        if (toolIndex >= 0 && toolIndex < this.tools.length) {
            this.editor.selectedTool = this.tools[toolIndex].key;
            return 'tool_selected';
        }
        return null;
    }

    handleSidebarTap(y, relativeX = 37) {
        const sw = this.sidebarWidth;

        // Wave navigation buttons
        if (y >= 65 && y < 90) {
            this.editor.prevWave();
            return 'prev_wave';
        }
        if (y >= 95 && y < 120) {
            this.editor.nextWave();
            return 'next_wave';
        }
        if (y >= 130 && y < 155) {
            this.editor.addWave();
            return 'add_wave';
        }
        if (y >= 160 && y < 185) {
            this.editor.removeWave();
            return 'remove_wave';
        }

        // Value controls at y=230
        if (y >= 230 && y < 255) {
            const isLeftButton = relativeX < sw / 2;
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

        // Level name (tap to edit) at y=290
        if (y >= 280 && y < 310) {
            const newName = prompt('Enter level name:', this.editor.levelName);
            if (newName !== null && newName.trim()) {
                this.editor.setLevelName(newName.trim());
            }
            return 'edit_name';
        }

        // Save button at y=330
        if (y >= 330 && y < 360) {
            this.editor.saveLevel();
            this.saveFlash = 1;
            return 'save';
        }

        // Clear button at y=370
        if (y >= 370 && y < 395) {
            this.editor.clearCurrentWave();
            return 'clear';
        }

        // Exit button at bottom
        const exitY = CONFIG.GAME_HEIGHT - this.toolbarHeight - 40;
        if (y >= exitY && y < exitY + 30) {
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

        // Draw scroll indicator
        this.drawScrollIndicator(ctx);

        // Save flash effect
        if (this.saveFlash > 0) {
            ctx.fillStyle = `rgba(0, 255, 100, ${this.saveFlash * 0.3})`;
            ctx.fillRect(0, 0, CONFIG.GAME_WIDTH, CONFIG.GAME_HEIGHT);
        }
    }

    drawGrid(ctx) {
        const gridSize = this.editor.gridSize;
        const editHeight = CONFIG.GAME_HEIGHT - this.toolbarHeight;

        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.editAreaWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, editHeight);
            ctx.stroke();
        }

        // Horizontal lines (offset by scroll)
        const scrollOffset = this.editor.scrollOffset % gridSize;
        for (let y = -scrollOffset; y <= editHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.editAreaWidth, y);
            ctx.stroke();
        }
    }

    drawLanes(ctx) {
        const laneWidth = this.editAreaWidth / 3;
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
        const scrollOffset = this.editor.scrollOffset;
        const editHeight = CONFIG.GAME_HEIGHT - this.toolbarHeight;
        const laneWidth = this.editAreaWidth / 3;

        // Clip to edit area
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, this.editAreaWidth, editHeight);
        ctx.clip();

        // Draw walls at their Y positions
        wave.walls.forEach(w => {
            const x = laneWidth * w.lane + laneWidth / 2;
            const screenY = (w.y || 60) - scrollOffset;
            const width = laneWidth - 20;

            // Only draw if visible
            if (screenY > -40 && screenY < editHeight + 40) {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.6)';
                ctx.fillRect(x - width / 2, screenY - 15, width, 30);
                ctx.strokeStyle = '#666677';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - width / 2, screenY - 15, width, 30);

                ctx.fillStyle = '#ff4444';
                ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('WALL', x, screenY);
            }
        });

        // Draw rings at their Y positions
        wave.rings.forEach(r => {
            const x = r.x * this.editAreaWidth;
            const screenY = r.y - scrollOffset;

            if (screenY > -20 && screenY < editHeight + 20) {
                const color = r.value >= 0 ? '#44aaff' : '#ff4466';

                ctx.beginPath();
                ctx.arc(x, screenY, 15, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const text = r.value >= 0 ? `+${r.value}` : `${r.value}`;
                ctx.fillText(text, x, screenY);
            }
        });

        // Draw gates at their Y positions
        wave.gates.forEach(g => {
            const x = g.x * this.editAreaWidth;
            const screenY = g.y - scrollOffset;

            if (screenY > -20 && screenY < editHeight + 20) {
                const color = g.type === 'multiply' ? '#ffdd00' : '#aa2222';
                const text = g.type === 'multiply' ? 'x2' : '/2';

                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 20, screenY - 12, 40, 24);

                ctx.fillStyle = color;
                ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, x, screenY);
            }
        });

        // Draw enemies at their Y positions
        wave.enemies.forEach(e => {
            const x = e.x * this.editAreaWidth;
            const screenY = (e.y || 40) - scrollOffset;

            if (screenY > -20 && screenY < editHeight + 20) {
                // Enemy marker
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(x, screenY - 12);
                ctx.lineTo(x + 10, screenY + 8);
                ctx.lineTo(x - 10, screenY + 8);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = `bold 8px ${CONFIG.FONT_FAMILY}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(e.type.charAt(0), x, screenY);
            }
        });

        ctx.restore();
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
    }

    drawScrollIndicator(ctx) {
        const editHeight = CONFIG.GAME_HEIGHT - this.toolbarHeight;
        const maxScroll = this.editor.maxWaveHeight - 400;
        const scrollPercent = this.editor.scrollOffset / maxScroll;

        // Draw scroll bar on right edge of edit area
        const barX = this.editAreaWidth - 8;
        const barHeight = editHeight - 40;
        const thumbHeight = Math.max(30, barHeight * (editHeight / this.editor.maxWaveHeight));
        const thumbY = 20 + scrollPercent * (barHeight - thumbHeight);

        // Track
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        ctx.fillRect(barX, 20, 6, barHeight);

        // Thumb
        ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
        ctx.fillRect(barX, thumbY, 6, thumbHeight);

        // Height indicator
        ctx.fillStyle = '#888888';
        ctx.font = `9px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText(`Y:${Math.round(this.editor.scrollOffset)}`, barX - 5, 25);
        ctx.textAlign = 'left';
    }

    drawToolbar(ctx) {
        const y = CONFIG.GAME_HEIGHT - this.toolbarHeight;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, y, this.editAreaWidth, this.toolbarHeight);

        // Border
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.editAreaWidth, y);
        ctx.stroke();

        // Tools
        const toolWidth = this.editAreaWidth / this.tools.length;
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
            ctx.font = `bold 20px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.fillText(tool.icon, x + toolWidth / 2, y + 26);

            // Label
            ctx.fillStyle = isSelected ? '#ffffff' : '#888888';
            ctx.font = `9px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText(tool.label, x + toolWidth / 2, y + 48);
        });

        ctx.textAlign = 'left';
    }

    drawSidebar(ctx) {
        const x = this.editAreaWidth;
        const sw = this.sidebarWidth;
        const centerX = x + sw / 2;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(x, 0, sw, CONFIG.GAME_HEIGHT);

        // Border
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CONFIG.GAME_HEIGHT);
        ctx.stroke();

        // Wave info
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('WAVE', centerX, 25);
        ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(`${this.editor.currentWaveIndex + 1}/${this.editor.waves.length}`, centerX, 45);

        // Navigation buttons (compact)
        this.drawButton(ctx, x + 3, 65, sw - 6, 22, '< Prev', '#555555');
        this.drawButton(ctx, x + 3, 95, sw - 6, 22, 'Next >', '#555555');
        this.drawButton(ctx, x + 3, 130, sw - 6, 22, '+ Add', '#336633');
        this.drawButton(ctx, x + 3, 160, sw - 6, 22, '- Del', '#663333');

        // Value controls (for ring/enemy)
        ctx.fillStyle = '#888888';
        ctx.font = `9px ${CONFIG.FONT_FAMILY}`;

        if (this.editor.selectedTool === 'ring') {
            ctx.fillText('Value:', centerX, 200);
            ctx.font = `bold 16px ${CONFIG.FONT_FAMILY}`;
            ctx.fillStyle = this.editor.selectedRingValue >= 0 ? '#44aaff' : '#ff4466';
            const valText = this.editor.selectedRingValue >= 0 ? `+${this.editor.selectedRingValue}` : `${this.editor.selectedRingValue}`;
            ctx.fillText(valText, centerX, 218);
            this.drawButton(ctx, x + 3, 230, sw/2 - 5, 22, '-', '#555555');
            this.drawButton(ctx, x + sw/2 + 2, 230, sw/2 - 5, 22, '+', '#555555');
        } else if (this.editor.selectedTool === 'enemy') {
            ctx.fillText('Type:', centerX, 200);
            ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
            ctx.fillStyle = '#ff4444';
            ctx.fillText(this.editor.selectedEnemyType, centerX, 218);
            this.drawButton(ctx, x + 3, 230, sw/2 - 5, 22, '<', '#555555');
            this.drawButton(ctx, x + sw/2 + 2, 230, sw/2 - 5, 22, '>', '#555555');
        } else {
            ctx.fillStyle = '#555555';
            ctx.fillText('Select', centerX, 200);
            ctx.fillText('Ring/Enemy', centerX, 215);
        }

        // Level name (editable)
        ctx.fillStyle = '#666666';
        ctx.font = `8px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText('NAME:', centerX, 275);

        // Name box (tap to edit)
        ctx.fillStyle = 'rgba(50, 50, 80, 0.5)';
        ctx.fillRect(x + 3, 282, sw - 6, 22);
        ctx.strokeStyle = '#666688';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, 282, sw - 6, 22);

        ctx.fillStyle = '#aaaaff';
        ctx.font = `bold 9px ${CONFIG.FONT_FAMILY}`;
        // Truncate name if too long
        let displayName = this.editor.levelName;
        if (displayName.length > 8) {
            displayName = displayName.substring(0, 7) + '…';
        }
        ctx.fillText(displayName, centerX, 296);

        // Save/Clear buttons
        const saveColor = this.saveFlash > 0 ? '#00ff88' : '#4488ff';
        this.drawButton(ctx, x + 3, 330, sw - 6, 28, 'SAVE', saveColor);
        this.drawButton(ctx, x + 3, 370, sw - 6, 22, 'Clear', '#663333');

        // Stats
        const stats = this.editor.getWaveStats();
        ctx.fillStyle = '#555555';
        ctx.font = `8px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(`R:${stats.rings} E:${stats.enemies}`, centerX, 410);
        ctx.fillText(`W:${stats.walls} G:${stats.gates}`, centerX, 422);

        // Scroll hint
        ctx.fillStyle = '#444444';
        ctx.font = `7px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText('Drag/Scroll', centerX, 445);
        ctx.fillText('to pan', centerX, 455);

        // Exit button
        this.drawButton(ctx, x + 3, CONFIG.GAME_HEIGHT - this.toolbarHeight - 40, sw - 6, 28, 'EXIT', '#aa3333');

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
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
        ctx.textBaseline = 'top';
    }
}
