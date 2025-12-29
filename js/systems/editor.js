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

export class EditorSystem {
    constructor() {
        this.levelName = 'Untitled';
        this.waves = [this.createEmptyWave()];
        this.currentWaveIndex = 0;

        // Tool selection
        this.selectedTool = 'ring';  // 'ring', 'enemy', 'wall', 'gate_x2', 'gate_div', 'erase'
        this.selectedEnemyType = 'BASIC';
        this.selectedRingValue = 3;

        // Grid settings
        this.gridSize = 40;
        this.laneWidth = CONFIG.GAME_WIDTH / 3;

        // Available enemy types for the editor
        this.enemyTypes = ['BASIC', 'FAST', 'TANK', 'SNIPER', 'BOMBER', 'SWARM', 'SHIELD'];
    }

    createEmptyWave() {
        return {
            delay: 2000,  // Delay before this wave starts (ms)
            rings: [],    // { x: 0-1 normalized, y: spawn Y, value: number, path: string }
            enemies: [],  // { x: 0-1 normalized, type: string, delay: ms }
            walls: [],    // { lane: 0-2 }
            gates: []     // { x: 0-1 normalized, y: spawn Y, type: 'multiply' | 'divide' }
        };
    }

    getCurrentWave() {
        return this.waves[this.currentWaveIndex];
    }

    addWave() {
        this.waves.push(this.createEmptyWave());
        this.currentWaveIndex = this.waves.length - 1;
    }

    removeWave() {
        if (this.waves.length > 1) {
            this.waves.splice(this.currentWaveIndex, 1);
            this.currentWaveIndex = Math.min(this.currentWaveIndex, this.waves.length - 1);
        }
    }

    nextWave() {
        if (this.currentWaveIndex < this.waves.length - 1) {
            this.currentWaveIndex++;
        }
    }

    prevWave() {
        if (this.currentWaveIndex > 0) {
            this.currentWaveIndex--;
        }
    }

    // Place an element at the given screen coordinates
    placeElement(x, y) {
        const wave = this.getCurrentWave();

        // Normalize X to 0-1 range
        const normalizedX = x / CONFIG.GAME_WIDTH;

        // Snap Y to grid
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

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
                wave.enemies.push({
                    x: normalizedX,
                    type: this.selectedEnemyType,
                    delay: 0
                });
                break;

            case 'wall':
                const lane = Math.floor(x / this.laneWidth);
                // Check if wall already exists in this lane
                const existingWall = wave.walls.findIndex(w => w.lane === lane);
                if (existingWall < 0) {
                    wave.walls.push({ lane });
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
                this.eraseAt(x, y);
                break;
        }
    }

    // Erase element at position
    eraseAt(x, y) {
        const wave = this.getCurrentWave();
        const normalizedX = x / CONFIG.GAME_WIDTH;
        const tolerance = 0.15;
        const yTolerance = 40;

        // Erase rings
        wave.rings = wave.rings.filter(r =>
            Math.abs(r.x - normalizedX) > tolerance || Math.abs(r.y - y) > yTolerance
        );

        // Erase gates
        wave.gates = wave.gates.filter(g =>
            Math.abs(g.x - normalizedX) > tolerance || Math.abs(g.y - y) > yTolerance
        );

        // Erase enemies (by X position only since they spawn at top)
        wave.enemies = wave.enemies.filter(e =>
            Math.abs(e.x - normalizedX) > tolerance
        );

        // Erase walls by lane
        const lane = Math.floor(x / this.laneWidth);
        wave.walls = wave.walls.filter(w => w.lane !== lane);
    }

    // Clear current wave
    clearCurrentWave() {
        this.waves[this.currentWaveIndex] = this.createEmptyWave();
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

    // Set level name
    setLevelName(name) {
        this.levelName = name.trim() || 'Untitled';
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
        this.currentWaveIndex = 0;
        return true;
    }

    // Save level to LocalStorage
    saveLevel() {
        const levels = EditorSystem.getSavedLevels();
        levels[this.levelName] = this.serialize();
        localStorage.setItem('ringSquadron_customLevels', JSON.stringify(levels));
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
    }
}
