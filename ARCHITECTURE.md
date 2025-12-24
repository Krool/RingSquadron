# Ring Squadron - Architecture Documentation

## Overview

Ring Squadron is a mobile-friendly top-down shooter built with vanilla JavaScript and HTML5 Canvas. The game features ASCII art graphics, procedural audio, and a "Last War" style gate/ring collection mechanic.

## Project Structure

```
RingSquadron/
├── index.html              # Entry point with canvas and UI buttons
├── css/
│   └── style.css          # Mobile-responsive styles
├── js/
│   ├── main.js            # Game orchestrator (state machine, game loop)
│   ├── renderer.js        # Canvas rendering, stars, HUD
│   ├── input.js           # Touch/mouse input handling
│   ├── audio.js           # Web Audio API procedural sounds
│   ├── entities/          # Game objects
│   │   ├── player.js      # Player ship
│   │   ├── ally.js        # Companion ships
│   │   ├── enemy.js       # Enemy types (9 variants)
│   │   ├── boss.js        # Boss enemies (3 types)
│   │   ├── bullet.js      # Projectiles
│   │   ├── ring.js        # Collectible rings
│   │   └── powerup.js     # Power-up items
│   ├── systems/           # Game systems
│   │   ├── collision.js   # AABB collision detection
│   │   ├── spawner.js     # Enemy/ring wave spawning
│   │   ├── weapons.js     # Weapon types (8 variants)
│   │   ├── shop.js        # Upgrade purchasing
│   │   ├── formation.js   # Ally positioning
│   │   ├── particles.js   # Visual effects
│   │   ├── combo.js       # Kill streak system
│   │   ├── save.js        # LocalStorage persistence
│   │   ├── gamemode.js    # Game modes (5 types)
│   │   ├── campaign.js    # Campaign levels
│   │   ├── music.js       # Background music
│   │   ├── haptics.js     # Vibration feedback
│   │   └── floatingtext.js# Damage/gold numbers
│   └── utils/
│       ├── config.js      # Game constants (EDIT THIS FOR BALANCE)
│       └── sprites.js     # ASCII sprite definitions
└── ARCHITECTURE.md        # This file
```

## Core Architecture

### State Machine

The game uses a simple state machine in `main.js`:

```
menu → modeSelect → playing ↔ shop
                      ↓
                   gameover
```

States:
- `menu`: Start screen, tap to continue
- `modeSelect`: Choose game mode
- `playing`: Main gameplay
- `shop`: Upgrade purchasing (between waves)
- `gameover`: Death screen, tap to restart

### Game Loop

```javascript
gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;

    switch (this.state) {
        case 'playing':
            this.update(deltaTime);  // Update all entities
            this.render();           // Draw everything
            break;
        // ... other states
    }

    requestAnimationFrame(this.gameLoop);
}
```

### Entity Management

Entities are stored in arrays and updated each frame:

```javascript
// In Game class
this.player        // Single Player instance
this.allies = []   // Array of Ally instances
this.enemies = []  // Array of Enemy instances
this.playerBullets = []
this.enemyBullets = []
this.rings = []
this.powerUps = []
this.boss          // Single Boss instance (or null)
```

Cleanup happens each frame to remove inactive entities:
```javascript
this.enemies = this.enemies.filter(e => e.active);
```

## Key Systems

### Collision System (`collision.js`)

Static methods for AABB collision detection:

```javascript
// Basic rectangle collision
CollisionSystem.checkAABB(boundsA, boundsB) → boolean

// Bullets hitting enemies (with callbacks)
CollisionSystem.checkBulletEntityCollisions(bullets, entities, onHit)

// Player/allies collecting rings
CollisionSystem.checkEntityRingCollisions(entities, rings, onCollect)
```

All entities must implement `getBounds()`:
```javascript
getBounds() {
    return { x, y, width, height };
}
```

### Spawner System (`spawner.js`)

Manages difficulty scaling and ring patterns:

```javascript
// Difficulty scales with wave AND player power
const difficulty = this.spawner.getDifficulty() * gameModeMultiplier;
const allyCount = this.allies.filter(a => a.active).length;

this.spawner.update(time, enemies, rings, difficulty, allyCount);
```

Ring patterns are "Last War" style gate choices:
- Two/Three choice patterns
- Shoot-to-win (negative → positive)
- Risk/reward decisions

### Weapon System (`weapons.js`)

8 weapon types with different firing patterns:

```javascript
const WEAPONS = {
    BASIC:  { fireRate: 150, damage: 10, pattern: 'single' },
    SPREAD3: { fireRate: 200, damage: 8, pattern: 'spread' },
    LASER:  { fireRate: 50, damage: 3, pattern: 'beam', piercing: true },
    // ...
};
```

### Save System (`save.js`)

LocalStorage-based persistence:

```javascript
// Saved data
- Gold (currency)
- Upgrades (shop purchases)
- High scores (top 10)
- Statistics (kills, waves, etc.)
- Unlocked weapons
```

## Configuration

All game balance values are in `js/utils/config.js`:

```javascript
export const CONFIG = {
    // Player
    PLAYER_HEALTH: 100,
    PLAYER_SPEED: 8,

    // Enemies
    ENEMY_TYPES: { ... },
    ENDLESS_SCALING: { ... },

    // Spawning
    ENEMY_SPAWN_INTERVAL: 2000,
    RING_SPAWN_INTERVAL: 3000,

    // And more...
};
```

**To adjust difficulty**: Edit `ENDLESS_SCALING` values.
**To add enemy types**: Add to `ENEMY_TYPES` object.
**To change colors**: Modify `COLORS` object.

## Adding New Features

### New Enemy Type

1. Add sprite to `sprites.js`:
```javascript
ENEMY_NEWTYPE: [
    ' \\/ ',
    '[==]',
    ' /\\ '
],
```

2. Add config to `config.js`:
```javascript
NEWTYPE: {
    health: 30,
    speed: 2,
    fireRate: 1500,
    bulletDamage: 15,
    gold: 25,
    score: 200,
    special: 'mySpecial' // optional
}
```

3. Add behavior in `enemy.js` if needed:
```javascript
if (this.special === 'mySpecial') {
    // Custom behavior
}
```

4. Add to spawner unlock logic in `spawner.js`:
```javascript
if (effectiveWave >= 5 && roll < 0.15) return 'NEWTYPE';
```

### New Ring Pattern

Add method to `spawner.js`:

```javascript
patternMyPattern(rings, difficulty, allyCount = 0) {
    const value = this.getStartingValue(difficulty, allyCount);
    const ring = new Ring(this.gameWidth / 2, -30, value);
    ring.setPath('straight');
    rings.push(ring);
}
```

Add to patterns array:
```javascript
const patterns = [
    // ... existing patterns
    this.patternMyPattern.bind(this),
];
```

### New Power-Up

1. Add to `POWERUP_TYPES` in `powerup.js`
2. Handle in `applyPowerUp()` in `main.js`
3. Add visual/audio feedback

## Common Tasks

### Debugging

Open browser console (F12) and access:
```javascript
window.game              // Game instance
window.game.player       // Player state
window.game.allies       // All allies
window.game.state        // Current state
```

### Testing Modes

Use Practice mode for infinite health testing.

### Performance

- Ally display cap: 200 (excess contribute to damage multiplier)
- Particle cap: 500
- Use `cleanup()` to remove inactive entities

## Code Conventions

- ES6 modules with explicit imports
- Classes for entities and systems
- Static methods for stateless utilities
- camelCase for variables/methods
- UPPER_CASE for constants
- JSDoc comments for public APIs

## Known Limitations

1. No spatial partitioning - O(n*m) collision detection
2. Limited error handling in some modules

## Contributing

1. Keep changes modular
2. Add to CONFIG for new balance values
3. Document public methods with JSDoc
4. Test on mobile (touch controls)
