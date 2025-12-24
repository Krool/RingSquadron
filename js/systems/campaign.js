// Campaign Mode - Puzzle-like micro-levels with specific challenges
// Each level is 1-3 minutes with designed ring/enemy patterns
import { CONFIG } from '../utils/config.js';
import { Ring } from '../entities/ring.js';
import { Enemy } from '../entities/enemy.js';

// Campaign levels - each is a short puzzle-like challenge
export const CAMPAIGN_LEVELS = [
    // === CHAPTER 1: Ring Mastery ===
    {
        id: 1,
        name: "First Contact",
        chapter: 1,
        description: "Shoot the rings to increase their value before collecting!",
        waves: [
            {
                // Wave 1: Learn the mechanic - 3 rings, hit the positive one
                delay: 1000,
                rings: [
                    { x: 0.3, y: -30, value: -5, path: 'straight' },
                    { x: 0.5, y: -60, value: 1, path: 'straight' }, // Target this one
                    { x: 0.7, y: -30, value: -5, path: 'straight' }
                ],
                enemies: [],
                message: "Shoot the middle ring!"
            },
            {
                // Wave 2: Slightly harder - need more hits
                delay: 4000,
                rings: [
                    { x: 0.25, y: -30, value: -8, path: 'straight' },
                    { x: 0.5, y: -80, value: 1, path: 'straight' },
                    { x: 0.75, y: -30, value: -8, path: 'straight' }
                ],
                enemies: [],
                message: "Keep shooting!"
            },
            {
                // Wave 3: Final challenge - big negatives
                delay: 4000,
                rings: [
                    { x: 0.2, y: -20, value: -12, path: 'sine', params: { amplitude: 30, frequency: 0.01 } },
                    { x: 0.5, y: -100, value: 2, path: 'straight' },
                    { x: 0.8, y: -20, value: -12, path: 'sine', params: { amplitude: 30, frequency: 0.01 } }
                ],
                enemies: [],
                message: "Last wave!"
            }
        ],
        victoryCondition: { type: 'survive', allies: 5 }, // Must have 5+ allies at end
        timeLimit: 60000 // 1 minute
    },
    {
        id: 2,
        name: "Evasive Targets",
        chapter: 1,
        description: "Rings move in patterns - track and shoot!",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: 3, path: 'sine', params: { amplitude: 100, frequency: 0.015 } }
                ],
                enemies: [],
                message: "Track the moving ring!"
            },
            {
                delay: 5000,
                rings: [
                    { x: 0.3, y: -30, value: -4, path: 'zigzag', params: { width: 80, segments: 3 } },
                    { x: 0.7, y: -60, value: 2, path: 'sine', params: { amplitude: 80, frequency: 0.02 } }
                ],
                enemies: []
            },
            {
                delay: 5000,
                rings: [
                    { x: 0.5, y: -50, value: 5, path: 'spiral', params: { radius: 60, tightness: 0.03 } },
                    { x: 0.2, y: -30, value: -6, path: 'straight' },
                    { x: 0.8, y: -30, value: -6, path: 'straight' }
                ],
                enemies: [],
                message: "Spiral inbound!"
            }
        ],
        victoryCondition: { type: 'survive', allies: 8 },
        timeLimit: 90000
    },
    {
        id: 3,
        name: "First Blood",
        chapter: 1,
        description: "Enemies appear! Protect your fleet.",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: 3, path: 'straight' }
                ],
                enemies: [
                    { x: 0.3, type: 'BASIC', delay: 2000 },
                    { x: 0.7, type: 'BASIC', delay: 2500 }
                ],
                message: "Enemies incoming!"
            },
            {
                delay: 6000,
                rings: [
                    { x: 0.3, y: -40, value: 2, path: 'sine', params: { amplitude: 50, frequency: 0.02 } },
                    { x: 0.7, y: -60, value: 2, path: 'sine', params: { amplitude: 50, frequency: 0.02 } }
                ],
                enemies: [
                    { x: 0.2, type: 'BASIC', delay: 0 },
                    { x: 0.5, type: 'BASIC', delay: 1000 },
                    { x: 0.8, type: 'BASIC', delay: 2000 }
                ]
            },
            {
                delay: 8000,
                rings: [
                    { x: 0.5, y: -80, value: 5, path: 'straight' }
                ],
                enemies: [
                    { x: 0.3, type: 'BASIC', delay: 0 },
                    { x: 0.5, type: 'FAST', delay: 1000 },
                    { x: 0.7, type: 'BASIC', delay: 2000 }
                ],
                message: "Fast enemy spotted!"
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 120000
    },

    // === CHAPTER 2: Risk vs Reward ===
    {
        id: 4,
        name: "Calculated Risks",
        chapter: 2,
        description: "Negative rings give you gold! But cost allies...",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: -3, path: 'straight', goldBonus: 50 }
                ],
                enemies: [],
                message: "Negative rings drop gold!"
            },
            {
                delay: 4000,
                rings: [
                    { x: 0.3, y: -30, value: 5, path: 'straight' },
                    { x: 0.5, y: -60, value: -8, path: 'straight', goldBonus: 100 },
                    { x: 0.7, y: -30, value: 5, path: 'straight' }
                ],
                enemies: [],
                message: "Choose wisely!"
            },
            {
                delay: 5000,
                rings: [
                    { x: 0.2, y: -20, value: -10, path: 'sine', params: { amplitude: 40, frequency: 0.02 }, goldBonus: 150 },
                    { x: 0.5, y: -80, value: 8, path: 'straight' },
                    { x: 0.8, y: -20, value: -10, path: 'sine', params: { amplitude: 40, frequency: 0.02 }, goldBonus: 150 }
                ],
                enemies: [
                    { x: 0.5, type: 'BASIC', delay: 3000 }
                ]
            }
        ],
        victoryCondition: { type: 'gold', amount: 200 },
        timeLimit: 90000
    },
    {
        id: 5,
        name: "The Gauntlet",
        chapter: 2,
        description: "Navigate through a field of danger.",
        waves: [
            {
                delay: 500,
                rings: [
                    { x: 0.2, y: -20, value: -3, path: 'straight' },
                    { x: 0.4, y: -40, value: -3, path: 'straight' },
                    { x: 0.6, y: -60, value: 4, path: 'straight' },
                    { x: 0.8, y: -40, value: -3, path: 'straight' }
                ],
                enemies: [],
                message: "Find the safe path!"
            },
            {
                delay: 4000,
                rings: [
                    { x: 0.15, y: -20, value: -4, path: 'sine', params: { amplitude: 20, frequency: 0.015 } },
                    { x: 0.35, y: -40, value: -4, path: 'straight' },
                    { x: 0.5, y: -70, value: 6, path: 'sine', params: { amplitude: 60, frequency: 0.01 } },
                    { x: 0.65, y: -40, value: -4, path: 'straight' },
                    { x: 0.85, y: -20, value: -4, path: 'sine', params: { amplitude: 20, frequency: 0.015 } }
                ],
                enemies: []
            },
            {
                delay: 5000,
                rings: [
                    { x: 0.1, y: -10, value: -5, path: 'straight' },
                    { x: 0.3, y: -30, value: -5, path: 'straight' },
                    { x: 0.5, y: -90, value: 10, path: 'spiral', params: { radius: 40, tightness: 0.02 } },
                    { x: 0.7, y: -30, value: -5, path: 'straight' },
                    { x: 0.9, y: -10, value: -5, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'FAST', delay: 2000 }
                ],
                message: "Shoot the spiral!"
            }
        ],
        victoryCondition: { type: 'survive', allies: 10 },
        timeLimit: 90000
    },
    {
        id: 6,
        name: "Tank Trouble",
        chapter: 2,
        description: "Heavy enemies require focus fire.",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: 4, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'TANK', delay: 1000 }
                ],
                message: "Tank incoming - focus fire!"
            },
            {
                delay: 8000,
                rings: [
                    { x: 0.3, y: -40, value: 3, path: 'sine', params: { amplitude: 40, frequency: 0.02 } },
                    { x: 0.7, y: -60, value: 3, path: 'sine', params: { amplitude: 40, frequency: 0.02 } }
                ],
                enemies: [
                    { x: 0.3, type: 'TANK', delay: 0 },
                    { x: 0.7, type: 'BASIC', delay: 2000 },
                    { x: 0.5, type: 'BASIC', delay: 3000 }
                ]
            },
            {
                delay: 10000,
                rings: [
                    { x: 0.5, y: -80, value: 8, path: 'straight' }
                ],
                enemies: [
                    { x: 0.3, type: 'TANK', delay: 0 },
                    { x: 0.7, type: 'TANK', delay: 2000 }
                ],
                message: "Double tanks!"
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 120000
    },

    // === CHAPTER 3: Precision ===
    {
        id: 7,
        name: "Sniper Alley",
        chapter: 3,
        description: "Long-range threats require quick reflexes.",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: 3, path: 'weave', params: { width: 150, speed: 2 } }
                ],
                enemies: [
                    { x: 0.5, type: 'SNIPER', delay: 2000 }
                ],
                message: "Sniper! Watch for aimed shots!"
            },
            {
                delay: 7000,
                rings: [
                    { x: 0.3, y: -30, value: 2, path: 'straight' },
                    { x: 0.7, y: -50, value: 2, path: 'straight' }
                ],
                enemies: [
                    { x: 0.2, type: 'SNIPER', delay: 0 },
                    { x: 0.8, type: 'SNIPER', delay: 1500 }
                ]
            },
            {
                delay: 8000,
                rings: [
                    { x: 0.5, y: -70, value: 6, path: 'figure8', params: { width: 60, height: 30, speed: 1.5 } }
                ],
                enemies: [
                    { x: 0.2, type: 'SNIPER', delay: 0 },
                    { x: 0.5, type: 'FAST', delay: 1000 },
                    { x: 0.8, type: 'SNIPER', delay: 2000 }
                ],
                message: "Crossfire!"
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 120000
    },
    {
        id: 8,
        name: "Bomber Run",
        chapter: 3,
        description: "Explosive enemies - keep your distance!",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.3, y: -40, value: 2, path: 'straight' },
                    { x: 0.7, y: -40, value: 2, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'BOMBER', delay: 1500 }
                ],
                message: "Bomber! Avoid the explosions!"
            },
            {
                delay: 8000,
                rings: [
                    { x: 0.5, y: -60, value: 4, path: 'sine', params: { amplitude: 80, frequency: 0.015 } }
                ],
                enemies: [
                    { x: 0.3, type: 'BOMBER', delay: 0 },
                    { x: 0.7, type: 'BOMBER', delay: 2000 }
                ]
            },
            {
                delay: 10000,
                rings: [
                    { x: 0.5, y: -90, value: 8, path: 'straight' }
                ],
                enemies: [
                    { x: 0.25, type: 'BOMBER', delay: 0 },
                    { x: 0.5, type: 'BASIC', delay: 1000 },
                    { x: 0.75, type: 'BOMBER', delay: 2000 }
                ],
                message: "Bomber formation!"
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 120000
    },
    {
        id: 9,
        name: "Shield Wall",
        chapter: 3,
        description: "Shielded enemies need sustained fire.",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -50, value: 5, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'SHIELD', delay: 1000 }
                ],
                message: "Break the shield first!"
            },
            {
                delay: 8000,
                rings: [
                    { x: 0.3, y: -40, value: 3, path: 'bounce', params: { speed: 1.5, direction: 1 } },
                    { x: 0.7, y: -60, value: 3, path: 'bounce', params: { speed: 1.5, direction: -1 } }
                ],
                enemies: [
                    { x: 0.3, type: 'SHIELD', delay: 0 },
                    { x: 0.7, type: 'BASIC', delay: 2000 },
                    { x: 0.5, type: 'SHIELD', delay: 4000 }
                ]
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 120000
    },

    // === CHAPTER 4: Chaos ===
    {
        id: 10,
        name: "Swarm",
        chapter: 4,
        description: "Overwhelming numbers - stay mobile!",
        waves: [
            {
                delay: 500,
                rings: [
                    { x: 0.5, y: -50, value: 5, path: 'straight' }
                ],
                enemies: [
                    { x: 0.2, type: 'SWARM', delay: 500 },
                    { x: 0.4, type: 'SWARM', delay: 700 },
                    { x: 0.6, type: 'SWARM', delay: 900 },
                    { x: 0.8, type: 'SWARM', delay: 1100 }
                ],
                message: "Swarm! Keep moving!"
            },
            {
                delay: 5000,
                rings: [
                    { x: 0.3, y: -30, value: 3, path: 'sine', params: { amplitude: 40, frequency: 0.02 } },
                    { x: 0.7, y: -50, value: 3, path: 'sine', params: { amplitude: 40, frequency: 0.02 } }
                ],
                enemies: [
                    { x: 0.1, type: 'SWARM', delay: 0 },
                    { x: 0.3, type: 'SWARM', delay: 300 },
                    { x: 0.5, type: 'SWARM', delay: 600 },
                    { x: 0.7, type: 'SWARM', delay: 900 },
                    { x: 0.9, type: 'SWARM', delay: 1200 }
                ]
            },
            {
                delay: 6000,
                rings: [
                    { x: 0.5, y: -80, value: 8, path: 'spiral', params: { radius: 50, tightness: 0.025 } }
                ],
                enemies: [
                    { x: 0.15, type: 'SWARM', delay: 0 },
                    { x: 0.35, type: 'SWARM', delay: 200 },
                    { x: 0.55, type: 'SWARM', delay: 400 },
                    { x: 0.75, type: 'SWARM', delay: 600 },
                    { x: 0.85, type: 'SWARM', delay: 800 },
                    { x: 0.5, type: 'BASIC', delay: 2000 }
                ],
                message: "Hold the line!"
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 90000
    },
    {
        id: 11,
        name: "Carrier Strike",
        chapter: 4,
        description: "Carriers spawn drones - destroy them fast!",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.5, y: -60, value: 6, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'CARRIER', delay: 1500 }
                ],
                message: "Carrier! Kill it before drones spawn!"
            },
            {
                delay: 12000,
                rings: [
                    { x: 0.3, y: -40, value: 4, path: 'weave', params: { width: 100, speed: 2 } },
                    { x: 0.7, y: -70, value: 4, path: 'weave', params: { width: 100, speed: 2 } }
                ],
                enemies: [
                    { x: 0.3, type: 'CARRIER', delay: 0 },
                    { x: 0.7, type: 'CARRIER', delay: 3000 }
                ]
            }
        ],
        victoryCondition: { type: 'killAll' },
        timeLimit: 150000
    },
    {
        id: 12,
        name: "Final Exam",
        chapter: 4,
        description: "Everything you've learned - combined!",
        waves: [
            {
                delay: 1000,
                rings: [
                    { x: 0.3, y: -30, value: -5, path: 'straight' },
                    { x: 0.5, y: -60, value: 3, path: 'sine', params: { amplitude: 60, frequency: 0.015 } },
                    { x: 0.7, y: -30, value: -5, path: 'straight' }
                ],
                enemies: [
                    { x: 0.5, type: 'BASIC', delay: 2000 }
                ],
                message: "Final test begins!"
            },
            {
                delay: 6000,
                rings: [
                    { x: 0.5, y: -70, value: 5, path: 'figure8', params: { width: 80, height: 40, speed: 1 } }
                ],
                enemies: [
                    { x: 0.3, type: 'TANK', delay: 0 },
                    { x: 0.7, type: 'SNIPER', delay: 2000 }
                ]
            },
            {
                delay: 10000,
                rings: [
                    { x: 0.2, y: -20, value: -8, path: 'straight' },
                    { x: 0.5, y: -100, value: 10, path: 'spiral', params: { radius: 50, tightness: 0.02 } },
                    { x: 0.8, y: -20, value: -8, path: 'straight' }
                ],
                enemies: [
                    { x: 0.3, type: 'SHIELD', delay: 0 },
                    { x: 0.5, type: 'BOMBER', delay: 2000 },
                    { x: 0.7, type: 'SHIELD', delay: 4000 }
                ],
                message: "Give it everything!"
            },
            {
                delay: 12000,
                rings: [
                    { x: 0.5, y: -80, value: 15, path: 'straight' }
                ],
                enemies: [
                    { x: 0.2, type: 'SWARM', delay: 0 },
                    { x: 0.4, type: 'SWARM', delay: 200 },
                    { x: 0.6, type: 'SWARM', delay: 400 },
                    { x: 0.8, type: 'SWARM', delay: 600 },
                    { x: 0.5, type: 'CARRIER', delay: 2000 }
                ],
                message: "Final wave!"
            }
        ],
        victoryCondition: { type: 'survive', allies: 15 },
        timeLimit: 180000
    }
];

export const CAMPAIGN_CHAPTERS = [
    { id: 1, name: "Ring Mastery", levels: [1, 2, 3], description: "Learn to control the rings" },
    { id: 2, name: "Risk vs Reward", levels: [4, 5, 6], description: "Strategic decisions matter" },
    { id: 3, name: "Precision", levels: [7, 8, 9], description: "Face dangerous enemies" },
    { id: 4, name: "Chaos", levels: [10, 11, 12], description: "Survive the onslaught" }
];

export class CampaignManager {
    constructor() {
        this.currentLevel = null;
        this.currentWaveIndex = 0;
        this.levelStartTime = 0;
        this.waveStartTime = 0;
        this.levelComplete = false;
        this.levelFailed = false;
        this.goldEarned = 0;

        // Track spawned entities per wave
        this.spawnedRings = [];
        this.spawnedEnemies = [];
        this.pendingSpawns = [];
    }

    startLevel(levelId) {
        const level = CAMPAIGN_LEVELS.find(l => l.id === levelId);
        if (!level) return null;

        this.currentLevel = level;
        this.currentWaveIndex = 0;
        this.levelStartTime = Date.now();
        this.waveStartTime = Date.now();
        this.levelComplete = false;
        this.levelFailed = false;
        this.goldEarned = 0;
        this.spawnedRings = [];
        this.spawnedEnemies = [];
        this.pendingSpawns = [];

        return level;
    }

    getCurrentWave() {
        if (!this.currentLevel) return null;
        return this.currentLevel.waves[this.currentWaveIndex];
    }

    getMessage() {
        const wave = this.getCurrentWave();
        return wave?.message || null;
    }

    update(currentTime, rings, enemies, player, gold) {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        const wave = this.getCurrentWave();
        if (!wave) {
            this.checkVictory(player, gold, enemies);
            return;
        }

        const waveElapsed = currentTime - this.waveStartTime;
        const levelElapsed = currentTime - this.levelStartTime;

        // Check time limit
        if (levelElapsed >= this.currentLevel.timeLimit) {
            this.levelFailed = true;
            return;
        }

        // Spawn rings for this wave (once)
        if (waveElapsed >= wave.delay && this.spawnedRings.length === 0 && wave.rings) {
            for (const ringDef of wave.rings) {
                const x = ringDef.x * CONFIG.GAME_WIDTH;
                const ring = new Ring(x, ringDef.y, ringDef.value);

                if (ringDef.path && ringDef.path !== 'straight') {
                    ring.setPath(ringDef.path, ringDef.params || {});
                }

                if (ringDef.goldBonus) {
                    ring.goldBonus = ringDef.goldBonus;
                }

                rings.push(ring);
                this.spawnedRings.push(ring);
            }
        }

        // Queue enemy spawns
        if (waveElapsed >= wave.delay && this.spawnedEnemies.length === 0 && wave.enemies) {
            for (const enemyDef of wave.enemies) {
                this.pendingSpawns.push({
                    x: enemyDef.x * CONFIG.GAME_WIDTH,
                    type: enemyDef.type,
                    spawnAt: currentTime + (enemyDef.delay || 0)
                });
            }
            // Mark as queued
            this.spawnedEnemies = wave.enemies.map(() => null);
        }

        // Process pending enemy spawns
        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const spawn = this.pendingSpawns[i];
            if (currentTime >= spawn.spawnAt) {
                const enemy = new Enemy(spawn.x, -40, spawn.type);
                enemies.push(enemy);
                this.pendingSpawns.splice(i, 1);
            }
        }

        // Check if wave is complete
        const ringsCleared = this.spawnedRings.every(r => !r.active);
        const enemiesCleared = enemies.filter(e => e.active).length === 0;
        const spawnsComplete = this.pendingSpawns.length === 0;
        const waveReady = waveElapsed >= wave.delay;

        if (waveReady && ringsCleared && enemiesCleared && spawnsComplete && this.spawnedRings.length > 0) {
            this.advanceWave(currentTime);
        }
    }

    advanceWave(currentTime) {
        this.currentWaveIndex++;
        this.waveStartTime = currentTime;
        this.spawnedRings = [];
        this.spawnedEnemies = [];
        this.pendingSpawns = [];

        // If no more waves, check victory
        if (this.currentWaveIndex >= this.currentLevel.waves.length) {
            // Let victory be checked on next update
        }
    }

    checkVictory(player, gold, enemies) {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        const condition = this.currentLevel.victoryCondition;
        const activeAllies = player.active ? 1 : 0; // Simplified - we need ally count passed in

        switch (condition.type) {
            case 'survive':
                // Need to check ally count - this will be passed from main
                this.levelComplete = true;
                break;
            case 'killAll':
                if (enemies.filter(e => e.active).length === 0 && this.pendingSpawns.length === 0) {
                    this.levelComplete = true;
                }
                break;
            case 'gold':
                if (gold >= condition.amount) {
                    this.levelComplete = true;
                }
                break;
            default:
                this.levelComplete = true;
        }
    }

    checkVictoryWithAllies(allyCount, gold, enemies) {
        if (!this.currentLevel || this.levelComplete || this.levelFailed) return;

        // Not all waves complete yet
        if (this.currentWaveIndex < this.currentLevel.waves.length) return;

        const condition = this.currentLevel.victoryCondition;

        switch (condition.type) {
            case 'survive':
                if (allyCount >= condition.allies) {
                    this.levelComplete = true;
                } else if (enemies.filter(e => e.active).length === 0 && this.pendingSpawns.length === 0) {
                    // All waves done but not enough allies
                    this.levelFailed = true;
                }
                break;
            case 'killAll':
                if (enemies.filter(e => e.active).length === 0 && this.pendingSpawns.length === 0) {
                    this.levelComplete = true;
                }
                break;
            case 'gold':
                if (gold >= condition.amount) {
                    this.levelComplete = true;
                }
                break;
        }
    }

    getProgress() {
        if (!this.currentLevel) return null;

        const elapsed = Date.now() - this.levelStartTime;
        const remaining = Math.max(0, this.currentLevel.timeLimit - elapsed);

        return {
            levelId: this.currentLevel.id,
            levelName: this.currentLevel.name,
            wave: this.currentWaveIndex + 1,
            totalWaves: this.currentLevel.waves.length,
            timeRemaining: Math.ceil(remaining / 1000),
            victoryCondition: this.currentLevel.victoryCondition
        };
    }

    isComplete() {
        return this.levelComplete;
    }

    isFailed() {
        return this.levelFailed;
    }

    getNextLevelId() {
        if (!this.currentLevel) return 1;
        const nextId = this.currentLevel.id + 1;
        return CAMPAIGN_LEVELS.find(l => l.id === nextId) ? nextId : null;
    }

    reset() {
        this.currentLevel = null;
        this.currentWaveIndex = 0;
        this.levelComplete = false;
        this.levelFailed = false;
        this.goldEarned = 0;
        this.spawnedRings = [];
        this.spawnedEnemies = [];
        this.pendingSpawns = [];
    }

    // For saving progress
    serialize() {
        return {
            completedLevels: [] // Would track which levels completed
        };
    }

    deserialize(data) {
        // Restore progress
    }
}
