/**
 * Ring Squadron - Game Configuration
 *
 * Central configuration file for all game constants.
 * Modify values here to tune game balance without changing code.
 *
 * @module config
 */

export const CONFIG = {
    // ========================================
    // CANVAS & DISPLAY
    // ========================================
    GAME_WIDTH: 400,
    GAME_HEIGHT: 700,

    // Player settings
    PLAYER_HEALTH: 100,
    PLAYER_SPEED: 8,
    PLAYER_FIRE_RATE: 150, // ms between shots
    PLAYER_BULLET_DAMAGE: 10,
    PLAYER_BULLET_SPEED: 12,

    // Ally settings
    ALLY_HEALTH: 30,
    ALLY_FIRE_RATE: 250,
    ALLY_BULLET_DAMAGE: 5,
    ALLY_FORMATION_SPACING: 15, // Tighter for cloud formation
    ALLY_SCALE: 0.125, // 1/8th size
    ALLY_DISPLAY_CAP: 200, // Max allies to render
    ALLY_DAMAGE_SCALE_START: 200, // Start scaling damage after this many
    ALLY_DAMAGE_SCALE_FACTOR: 0.005, // Damage multiplier per ally over cap

    // Enemy settings - Reduced attack speed (higher = slower)
    ENEMY_TYPES: {
        BASIC: {
            health: 20,
            speed: 2.5,      // Slightly faster since no firing
            fireRate: 0,     // No firing - collision threat only
            bulletDamage: 0,
            gold: 10,
            score: 100,
            special: 'ram'   // Just rams player
        },
        BUS: {
            health: 100,
            speed: 0.4,      // Slow approach
            chargeSpeed: 10, // Fast charge
            fireRate: 0,     // No shooting
            bulletDamage: 0,
            gold: 75,
            score: 500,
            special: 'charge',
            ramDamage: 40    // Heavy collision damage
        },
        FAST: {
            health: 15,
            speed: 4,
            fireRate: 2800, // Slower
            bulletDamage: 8,
            gold: 15,
            score: 150
        },
        TANK: {
            health: 50,
            speed: 1,
            fireRate: 1800, // Slower
            bulletDamage: 18,
            gold: 30,
            score: 300
        },
        BOMBER: {
            health: 25,
            speed: 1.5,
            fireRate: 4000, // Slower
            bulletDamage: 25,
            gold: 25,
            score: 200,
            special: 'bomb'
        },
        SNIPER: {
            health: 12,
            speed: 0.5,
            fireRate: 3500, // Slower
            bulletDamage: 30,
            gold: 20,
            score: 250,
            special: 'aimed'
        },
        SWARM: {
            health: 8,
            speed: 3,
            fireRate: 0,
            bulletDamage: 10,
            gold: 5,
            score: 50,
            special: 'kamikaze'
        },
        SHIELD: {
            health: 40,
            speed: 1.5,
            fireRate: 2800, // Slower
            bulletDamage: 12,
            gold: 35,
            score: 350,
            special: 'shield'
        },
        CARRIER: {
            health: 60,
            speed: 0.8,
            fireRate: 0,
            bulletDamage: 0,
            gold: 50,
            score: 400,
            special: 'spawn'
        },
        DRONE: {
            health: 10,
            speed: 2.5,
            fireRate: 2500, // Slower
            bulletDamage: 6,
            gold: 5,
            score: 75
        }
    },

    // Endless mode scaling
    ENDLESS_SCALING: {
        healthPerWave: 0.15,      // +15% enemy health per wave
        speedPerWave: 0.03,       // +3% enemy speed per wave
        damagePerWave: 0.08,      // +8% enemy damage per wave
        spawnRatePerWave: 0.05,   // +5% spawn rate per wave
        maxSpeedMultiplier: 3,    // Cap speed at 3x
        maxHealthMultiplier: 20,  // Cap health at 20x
        eliteChancePerWave: 0.02, // +2% elite spawn chance per wave
        eliteHealthBonus: 2,      // Elites have 2x health
        eliteDamageBonus: 1.5     // Elites deal 1.5x damage
    },

    // Ring settings
    RING_BASE_VALUE: 1,
    RING_SPEED: 1.5,

    // Spawning
    ENEMY_SPAWN_INTERVAL: 2000,
    RING_SPAWN_INTERVAL: 3000,

    // Colors
    COLORS: {
        BACKGROUND: '#0a0a12',
        PLAYER: '#00ff88',
        ALLY: '#00cc66',
        ENEMY: '#ff4444',
        ENEMY_BULLET: '#ff6666',
        PLAYER_BULLET: '#88ffff',
        RING: '#44aaff',           // Positive rings are blue
        RING_NEGATIVE: '#ff4466',  // Negative rings are red
        RING_TEXT: '#ffffff',
        HUD: '#ffffff',
        GOLD: '#ffd700',
        HEALTH_BAR: '#00ff00',
        HEALTH_BAR_BG: '#333333',
        STAR_NEAR: '#ffffff',
        STAR_MID: '#888899',
        STAR_FAR: '#444455'
    },

    // Font - smaller for zoom out effect
    FONT_SIZE: 8,
    FONT_SIZE_HUD: 14,
    FONT_FAMILY: 'Courier New, monospace',

    // ========================================
    // PARALLAX STARS
    // ========================================
    STAR_LAYERS: [
        { count: 30, speed: 0.08, size: 1, color: 'FAR' },
        { count: 20, speed: 0.15, size: 1.5, color: 'MID' },
        { count: 10, speed: 0.3, size: 2, color: 'NEAR' }
    ],

    // ========================================
    // TIMING & INTERVALS
    // ========================================
    SHOOTING_STAR_INTERVAL: 3000,    // ms between shooting stars on menu
    GAME_OVER_DELAY: 1500,           // ms before allowing restart
    BOSS_MISSILE_DELAY: 200,         // ms between boss missile spawns

    // ========================================
    // EFFECTS & RANGES
    // ========================================
    MAGNET_RANGE: 150,               // Power-up magnet attraction range
    POWERUP_DROP_CHANCE: 0.08,       // 8% chance to drop power-up

    // ========================================
    // RING SETTINGS
    // ========================================
    RING_MAX_VALUE: 99,              // Maximum ring value cap
    RING_MIN_VALUE: -99,             // Minimum ring value cap
    RING_BULLET_PADDING: 5,          // Collision padding for bullets

    // ========================================
    // BOSS SETTINGS
    // ========================================
    BOSS_BULLET_DAMAGE: 15,          // Default boss bullet damage
    BOSS_BULLET_SPEED: 4,            // Default boss bullet speed

    // ========================================
    // CARRIER ENEMY
    // ========================================
    CARRIER_SPAWN_COOLDOWN: 5000     // ms between carrier drone spawns
};
