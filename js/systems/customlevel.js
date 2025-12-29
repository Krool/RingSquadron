/**
 * Custom Level Manager
 *
 * Loads and plays custom levels created in the Map Editor.
 * Spawns entities based on wave definitions and tracks progress.
 *
 * @module systems/customlevel
 */
import { CONFIG } from '../utils/config.js';
import { Ring } from '../entities/ring.js';
import { Enemy } from '../entities/enemy.js';
import { Wall } from '../entities/wall.js';
import { EditorSystem } from './editor.js';

export class CustomLevelManager {
    constructor() {
        this.currentLevel = null;
        this.currentWaveIndex = 0;
        this.waveStartTime = 0;
        this.waveSpawned = false;

        this.levelComplete = false;
        this.levelFailed = false;

        // Track spawned entities for wave completion check
        this.waveRings = [];
        this.waveEnemies = [];
        this.waveWalls = [];

        // Pending spawns with delays
        this.pendingSpawns = [];
    }

    // Load a level by name from LocalStorage
    loadLevel(name) {
        const levels = EditorSystem.getSavedLevels();
        if (levels[name]) {
            this.currentLevel = levels[name];
            this.currentWaveIndex = 0;
            this.waveStartTime = 0;
            this.waveSpawned = false;
            this.levelComplete = false;
            this.levelFailed = false;
            this.reset();
            return true;
        }
        return false;
    }

    // Reset tracking for new wave
    reset() {
        this.waveRings = [];
        this.waveEnemies = [];
        this.waveWalls = [];
        this.pendingSpawns = [];
    }

    // Get current wave data
    getCurrentWave() {
        if (!this.currentLevel) return null;
        if (this.currentWaveIndex >= this.currentLevel.waves.length) return null;
        return this.currentLevel.waves[this.currentWaveIndex];
    }

    // Main update - call each frame during custom level play
    update(currentTime, rings, enemies, walls, player) {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        const wave = this.getCurrentWave();
        if (!wave) {
            this.levelComplete = true;
            return;
        }

        // Initialize wave start time
        if (this.waveStartTime === 0) {
            this.waveStartTime = currentTime;
        }

        const waveElapsed = currentTime - this.waveStartTime;

        // Spawn wave entities after delay
        if (!this.waveSpawned && waveElapsed >= wave.delay) {
            this.spawnWaveEntities(wave, rings, enemies, walls, currentTime);
            this.waveSpawned = true;
        }

        // Process pending enemy spawns with delays
        this.processPendingSpawns(currentTime, enemies);

        // Check if wave is complete
        if (this.waveSpawned && this.isWaveComplete(enemies)) {
            this.advanceWave(currentTime);
        }

        // Check for player death (level failed)
        if (!player.active) {
            this.levelFailed = true;
        }
    }

    // Spawn all entities for current wave
    // Y positions in editor represent spawn order - higher Y = spawns later (further above screen)
    spawnWaveEntities(wave, rings, enemies, walls, currentTime) {
        // Use edit area width for X normalization (matches editor)
        const editAreaWidth = CONFIG.GAME_WIDTH - 75;  // Match sidebar width from editorui

        // Spawn rings
        if (wave.rings) {
            for (const ringDef of wave.rings) {
                const x = ringDef.x * editAreaWidth;
                const ring = new Ring(x, -ringDef.y, ringDef.value);

                if (ringDef.path && ringDef.path !== 'straight') {
                    ring.setPath(ringDef.path, ringDef.params || {});
                }

                rings.push(ring);
                this.waveRings.push(ring);
            }
        }

        // Spawn gates (as rings with multiplier)
        if (wave.gates) {
            for (const gateDef of wave.gates) {
                const x = gateDef.x * editAreaWidth;
                const ring = new Ring(x, -gateDef.y, 0);
                ring.setMultiplierGate(gateDef.type);
                rings.push(ring);
                this.waveRings.push(ring);
            }
        }

        // Spawn enemies at their Y positions
        if (wave.enemies) {
            for (const enemyDef of wave.enemies) {
                const x = enemyDef.x * editAreaWidth;
                const y = -(enemyDef.y || 50);  // Spawn above screen
                const enemy = new Enemy(x, y, enemyDef.type);
                enemies.push(enemy);
                this.waveEnemies.push(enemy);
            }
        }

        // Spawn walls at their Y positions
        if (wave.walls) {
            for (const wallDef of wave.walls) {
                const laneWidth = editAreaWidth / 3;
                const x = laneWidth * wallDef.lane + laneWidth / 2;
                const y = -(wallDef.y || 40);  // Spawn above screen
                const wall = new Wall(x, y, wallDef.lane, wallDef.type || 'SOLID');
                walls.push(wall);
                this.waveWalls.push(wall);
            }
        }
    }

    // Process delayed enemy spawns (legacy - now enemies spawn immediately at Y position)
    processPendingSpawns(currentTime, enemies) {
        // No longer used - enemies spawn with Y position directly
    }

    // Check if current wave is complete
    isWaveComplete(allEnemies) {

        // All wave enemies must be dead
        const waveEnemiesAlive = this.waveEnemies.filter(e => e.active).length;
        if (waveEnemiesAlive > 0) return false;

        // All wave rings must be collected or off screen
        const waveRingsActive = this.waveRings.filter(r => r.active).length;
        if (waveRingsActive > 0) return false;

        // All wave walls must be off screen
        const waveWallsActive = this.waveWalls.filter(w => w.active).length;
        if (waveWallsActive > 0) return false;

        return true;
    }

    // Move to next wave
    advanceWave(currentTime) {
        this.currentWaveIndex++;
        this.waveStartTime = currentTime;
        this.waveSpawned = false;
        this.reset();

        // Check if level is complete
        if (this.currentWaveIndex >= this.currentLevel.waves.length) {
            this.levelComplete = true;
        }
    }

    // Get current progress info
    getProgress() {
        if (!this.currentLevel) return null;

        return {
            levelName: this.currentLevel.name,
            wave: this.currentWaveIndex + 1,
            totalWaves: this.currentLevel.waves.length,
            complete: this.levelComplete,
            failed: this.levelFailed
        };
    }

    isComplete() {
        return this.levelComplete;
    }

    isFailed() {
        return this.levelFailed;
    }

    isActive() {
        return this.currentLevel !== null && !this.levelComplete && !this.levelFailed;
    }
}
