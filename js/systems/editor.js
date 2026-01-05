/**
 * Level Editor System
 *
 * Allows players to create custom levels with:
 * - Walls (in 3 lanes)
 * - Enemies (various types)
 * - Rings (positive/negative values)
 * - Multiplier gates (x2, /2)
 *
 * Levels are organized into waves and saved to LocalStorage.
 *
 * @module systems/editor
 */
import { CONFIG } from '../utils/config.js';
import { Wall, WALL_TYPES } from '../entities/wall.js';

export class EditorSystem {
    constructor() {
        this.levelName = 'Untitled';
        this.waves = [this.createEmptyWave()];
        this.currentWaveIndex = 0;
        this.isDirty = false;  // Track unsaved changes

        // Level settings
        this.chaseMode = false;  // Enable Chase mode (red box)
        this.allowVerticalMovement = false;  // Allow player Y dragging

        // Tool selection
        this.selectedTool = 'ring';  // 'ring', 'enemy', 'wall', 'gate_x2', 'gate_div', 'erase'
        this.selectedEnemyType = 'BASIC';
        this.selectedRingValue = 3;
        this.selectedWallType = 'SOLID';

        // Grid settings
        this.gridSize = 40;
        this.laneWidth = CONFIG.GAME_WIDTH / 3;

        // Scroll/pan settings
        this.scrollOffset = 0;  // How far scrolled down (positive = looking further up the wave)
        this.maxWaveHeight = 2000;  // Maximum spawn height per wave

        // Available enemy types for the editor
        this.enemyTypes = ['BASIC', 'FAST', 'TANK', 'SNIPER', 'BOMBER', 'SWARM', 'SHIELD', 'CARGO_SHIP'];

        // Available wall types
        this.wallTypes = Object.keys(WALL_TYPES);
    }

    // Check if there are unsaved changes
    hasUnsavedChanges() {
        return this.isDirty;
    }

    createEmptyWave() {
        return {
            delay: 2000,  // Delay before this wave starts (ms)
            rings: [],    // { x: 0-1 normalized, y: spawn Y, value: number, path: string }
            enemies: [],  // { x: 0-1 normalized, y: spawn Y, type: string }
            walls: [],    // { lane: 0-2, y: spawn Y }
            gates: []     // { x: 0-1 normalized, y: spawn Y, type: 'multiply' | 'divide' }
        };
    }

    getCurrentWave() {
        return this.waves[this.currentWaveIndex];
    }

    addWave() {
        this.waves.push(this.createEmptyWave());
        this.currentWaveIndex = this.waves.length - 1;
        this.isDirty = true;
    }

    removeWave() {
        if (this.waves.length > 1) {
            this.waves.splice(this.currentWaveIndex, 1);
            this.currentWaveIndex = Math.min(this.currentWaveIndex, this.waves.length - 1);
            this.isDirty = true;
        }
    }

    nextWave() {
        if (this.currentWaveIndex < this.waves.length - 1) {
            this.currentWaveIndex++;
            this.scrollOffset = 0;  // Reset scroll on wave change
        }
    }

    prevWave() {
        if (this.currentWaveIndex > 0) {
            this.currentWaveIndex--;
            this.scrollOffset = 0;  // Reset scroll on wave change
        }
    }

    // Scroll the view (positive = scroll down to see higher Y values)
    scroll(delta) {
        this.scrollOffset = Math.max(0, Math.min(
            this.maxWaveHeight - 400,  // Leave some visible area
            this.scrollOffset + delta
        ));
    }

    // Place an element at the given screen coordinates
    // editAreaHeight is needed for flipped Y axis calculation
    placeElement(x, y, editAreaWidth, editAreaHeight = 530) {
        const wave = this.getCurrentWave();

        // Normalize X to 0-1 range (relative to edit area, not full width)
        const normalizedX = Math.min(1, Math.max(0, x / editAreaWidth));

        // Convert screen Y to world Y (flipped: higher on screen = higher worldY = spawns later)
        // Formula: worldY = editAreaHeight - screenY + scrollOffset
        const worldY = editAreaHeight - y + this.scrollOffset;

        // Snap Y to grid
        const snappedY = Math.round(worldY / this.gridSize) * this.gridSize;

        // Clamp to valid range
        if (snappedY < 0 || snappedY > this.maxWaveHeight) return;

        switch (this.selectedTool) {
            case 'ring':
                // Check for existing ring at this position
                const existingRing = wave.rings.findIndex(r =>
                    Math.abs(r.x - normalizedX) < 0.1 && Math.abs(r.y - snappedY) < 30
                );
                if (existingRing >= 0) {
                    // Update existing ring value
                    wave.rings[existingRing].value = this.selectedRingValue;
                } else {
                    wave.rings.push({
                        x: normalizedX,
                        y: snappedY,
                        value: this.selectedRingValue,
                        path: 'straight'
                    });
                }
                break;

            case 'enemy':
                // Check for existing enemy at this position
                const existingEnemy = wave.enemies.findIndex(e =>
                    Math.abs(e.x - normalizedX) < 0.1 && Math.abs(e.y - snappedY) < 30
                );
                if (existingEnemy < 0) {
                    wave.enemies.push({
                        x: normalizedX,
                        y: snappedY,
                        type: this.selectedEnemyType
                    });
                }
                break;

            case 'wall':
                const lane = Math.floor(normalizedX * 3);
                // Check if wall already exists at this lane AND Y position
                const existingWall = wave.walls.findIndex(w =>
                    w.lane === lane && Math.abs(w.y - snappedY) < 30
                );
                if (existingWall >= 0) {
                    // Update existing wall type
                    wave.walls[existingWall].type = this.selectedWallType;
                } else {
                    wave.walls.push({ lane, y: snappedY, type: this.selectedWallType });
                }
                break;

            case 'gate_x2':
                wave.gates.push({
                    x: normalizedX,
                    y: snappedY,
                    type: 'multiply'
                });
                break;

            case 'gate_div':
                wave.gates.push({
                    x: normalizedX,
                    y: snappedY,
                    type: 'divide'
                });
                break;

            case 'erase':
                this.eraseAt(x, y, editAreaWidth, editAreaHeight);
                break;
        }
        this.isDirty = true;
    }

    // Erase element at position
    // editAreaHeight is needed for flipped Y axis calculation
    eraseAt(x, y, editAreaWidth, editAreaHeight = 530) {
        const wave = this.getCurrentWave();
        const normalizedX = x / editAreaWidth;
        // Flipped Y: worldY = editAreaHeight - screenY + scrollOffset
        const worldY = editAreaHeight - y + this.scrollOffset;
        const tolerance = 0.15;
        const yTolerance = 40;

        // Erase rings
        wave.rings = wave.rings.filter(r =>
            Math.abs(r.x - normalizedX) > tolerance || Math.abs(r.y - worldY) > yTolerance
        );

        // Erase gates
        wave.gates = wave.gates.filter(g =>
            Math.abs(g.x - normalizedX) > tolerance || Math.abs(g.y - worldY) > yTolerance
        );

        // Erase enemies
        wave.enemies = wave.enemies.filter(e =>
            Math.abs(e.x - normalizedX) > tolerance || Math.abs(e.y - worldY) > yTolerance
        );

        // Erase walls by lane AND Y position
        const lane = Math.floor(normalizedX * 3);
        wave.walls = wave.walls.filter(w =>
            w.lane !== lane || Math.abs(w.y - worldY) > yTolerance
        );
    }

    // Clear current wave
    clearCurrentWave() {
        this.waves[this.currentWaveIndex] = this.createEmptyWave();
        this.isDirty = true;
    }

    // Set ring value for placement
    setRingValue(value) {
        this.selectedRingValue = Math.max(-20, Math.min(20, value));
    }

    incrementRingValue() {
        this.setRingValue(this.selectedRingValue + 1);
    }

    decrementRingValue() {
        this.setRingValue(this.selectedRingValue - 1);
    }

    // Cycle through enemy types
    cycleEnemyType(direction = 1) {
        const currentIndex = this.enemyTypes.indexOf(this.selectedEnemyType);
        const newIndex = (currentIndex + direction + this.enemyTypes.length) % this.enemyTypes.length;
        this.selectedEnemyType = this.enemyTypes[newIndex];
    }

    // Cycle through wall types
    cycleWallType(direction = 1) {
        const currentIndex = this.wallTypes.indexOf(this.selectedWallType);
        const newIndex = (currentIndex + direction + this.wallTypes.length) % this.wallTypes.length;
        this.selectedWallType = this.wallTypes[newIndex];
    }

    // Get wall type display info
    getWallTypeInfo() {
        return WALL_TYPES[this.selectedWallType] || WALL_TYPES.SOLID;
    }

    // Set level name
    setLevelName(name) {
        this.levelName = name.trim() || 'Untitled';
        this.isDirty = true;
    }

    // Toggle Chase mode
    toggleChaseMode() {
        this.chaseMode = !this.chaseMode;
        this.isDirty = true;
        return this.chaseMode;
    }

    // Toggle vertical movement
    toggleVerticalMovement() {
        this.allowVerticalMovement = !this.allowVerticalMovement;
        this.isDirty = true;
        return this.allowVerticalMovement;
    }

    // Serialize level for storage
    serialize() {
        return {
            name: this.levelName,
            waves: this.waves.map(wave => ({
                delay: wave.delay,
                rings: [...wave.rings],
                enemies: [...wave.enemies],
                walls: [...wave.walls],
                gates: [...wave.gates]
            })),
            settings: {
                chaseMode: this.chaseMode,
                allowVerticalMovement: this.allowVerticalMovement
            },
            createdAt: Date.now()
        };
    }

    // Load from serialized data
    deserialize(data) {
        if (!data) return false;

        this.levelName = data.name || 'Untitled';
        this.waves = data.waves.map(wave => ({
            delay: wave.delay || 2000,
            rings: wave.rings || [],
            enemies: wave.enemies || [],
            walls: wave.walls || [],
            gates: wave.gates || []
        }));

        // Load level settings (with defaults for backward compatibility)
        this.chaseMode = data.settings?.chaseMode || false;
        this.allowVerticalMovement = data.settings?.allowVerticalMovement || false;

        this.currentWaveIndex = 0;
        this.isDirty = false;
        return true;
    }

    // Save level to LocalStorage
    // If name contains "(G)", also show JSON for adding to global-levels.json
    saveLevel() {
        const levels = EditorSystem.getSavedLevels();
        const levelData = this.serialize();
        levels[this.levelName] = levelData;
        localStorage.setItem('ringSquadron_customLevels', JSON.stringify(levels));
        this.isDirty = false;

        // If name contains "(G)", show JSON for global sharing
        if (this.levelName.includes('(G)')) {
            const jsonStr = JSON.stringify(levelData, null, 2);
            // Copy to clipboard if available
            if (navigator.clipboard) {
                navigator.clipboard.writeText(`"${this.levelName}": ${jsonStr}`).then(() => {
                    alert(`Global level saved!\n\nJSON copied to clipboard.\nAdd it to global-levels.json in the repo.`);
                }).catch(() => {
                    prompt('Copy this JSON to add to global-levels.json:', `"${this.levelName}": ${jsonStr}`);
                });
            } else {
                prompt('Copy this JSON to add to global-levels.json:', `"${this.levelName}": ${jsonStr}`);
            }
        }

        return true;
    }

    // Load level from LocalStorage
    loadLevel(name) {
        const levels = EditorSystem.getSavedLevels();
        if (levels[name]) {
            return this.deserialize(levels[name]);
        }
        return false;
    }

    // Get list of saved levels
    static getSavedLevels() {
        try {
            return JSON.parse(localStorage.getItem('ringSquadron_customLevels') || '{}');
        } catch (e) {
            return {};
        }
    }

    // Delete a saved level
    static deleteLevel(name) {
        const levels = EditorSystem.getSavedLevels();
        delete levels[name];
        localStorage.setItem('ringSquadron_customLevels', JSON.stringify(levels));
    }

    // Get count of elements in current wave
    getWaveStats() {
        const wave = this.getCurrentWave();
        return {
            rings: wave.rings.length,
            enemies: wave.enemies.length,
            walls: wave.walls.length,
            gates: wave.gates.length
        };
    }

    // Reset editor to blank state
    reset() {
        this.levelName = 'Untitled';
        this.waves = [this.createEmptyWave()];
        this.currentWaveIndex = 0;
        this.selectedTool = 'ring';
        this.selectedEnemyType = 'BASIC';
        this.selectedRingValue = 3;
        this.selectedWallType = 'SOLID';
        this.scrollOffset = 0;
        this.isDirty = false;
    }
}
