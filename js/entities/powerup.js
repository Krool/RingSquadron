// Power-up Entity
import { CONFIG } from '../utils/config.js';

export const POWERUP_TYPES = {
    SHIELD: {
        name: 'Shield',
        char: 'S',
        color: '#00ffff',
        duration: 8000,
        description: 'Absorb 3 hits'
    },
    RAPID_FIRE: {
        name: 'Rapid Fire',
        char: 'R',
        color: '#ff8800',
        duration: 6000,
        description: '2x fire rate'
    },
    SPREAD_SHOT: {
        name: 'Spread Shot',
        char: 'W',
        color: '#ff00ff',
        duration: 8000,
        description: '3-way bullets'
    },
    MAGNET: {
        name: 'Magnet',
        char: 'M',
        color: '#ffff00',
        duration: 10000,
        description: 'Attract rings'
    },
    ALLY_SHIELD: {
        name: 'Ally Shield',
        char: 'A',
        color: '#00ff88',
        duration: 5000,
        description: 'Allies invincible'
    },
    NUKE: {
        name: 'Nuke',
        char: 'N',
        color: '#ff0000',
        duration: 0, // Instant
        description: 'Destroy all enemies'
    },
    HEAL: {
        name: 'Heal',
        char: '+',
        color: '#00ff00',
        duration: 0, // Instant
        description: 'Restore 30 HP'
    },
    DOUBLE_GOLD: {
        name: 'Double Gold',
        char: '$',
        color: '#ffd700',
        duration: 15000,
        description: '2x gold drops'
    }
};

export class PowerUp {
    constructor(x, y, type = null) {
        this.x = x;
        this.y = y;

        // Random type if not specified
        if (!type) {
            const types = Object.keys(POWERUP_TYPES);
            type = types[Math.floor(Math.random() * types.length)];
        }

        this.type = type;
        this.typeData = POWERUP_TYPES[type];
        this.speed = 1;
        this.active = true;
        this.width = 20;
        this.height = 20;

        // Animation
        this.pulseTimer = Math.random() * Math.PI * 2;
        this.floatOffset = 0;
    }

    update(deltaTime) {
        if (!this.active) return;

        const dt = deltaTime / 16;

        // Float down slowly
        this.y += this.speed * dt;

        // Pulse animation
        this.pulseTimer += 0.1 * dt;
        this.floatOffset = Math.sin(this.pulseTimer) * 3;

        // Deactivate if off screen
        if (this.y > CONFIG.GAME_HEIGHT + 30) {
            this.active = false;
        }
    }

    collect() {
        this.active = false;
        return {
            type: this.type,
            duration: this.typeData.duration
        };
    }

    draw(renderer) {
        if (!this.active) return;

        const displayY = this.y + this.floatOffset;
        const pulse = Math.sin(this.pulseTimer * 2) * 0.3 + 0.7;

        // Draw outer glow
        const ctx = renderer.ctx;
        ctx.globalAlpha = pulse * 0.3;
        ctx.fillStyle = this.typeData.color;
        ctx.beginPath();
        ctx.arc(this.x, displayY, 12, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner circle
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, displayY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw character
        ctx.fillStyle = this.typeData.color;
        ctx.font = `bold 12px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.typeData.char, this.x, displayY);

        ctx.globalAlpha = 1;
        ctx.textBaseline = 'top';
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}

// Active power-up effect manager
export class PowerUpManager {
    constructor() {
        this.activeEffects = {};
        this.shieldHits = 0;
    }

    activate(type, duration) {
        if (duration > 0) {
            this.activeEffects[type] = Date.now() + duration;
        }

        // Special handling for instant effects
        if (type === 'SHIELD') {
            this.shieldHits = 3;
        }
    }

    isActive(type) {
        if (!this.activeEffects[type]) return false;
        return Date.now() < this.activeEffects[type];
    }

    update() {
        // Clean up expired effects
        const now = Date.now();
        for (const [type, expiry] of Object.entries(this.activeEffects)) {
            if (now >= expiry) {
                delete this.activeEffects[type];
            }
        }
    }

    consumeShieldHit() {
        if (this.shieldHits > 0) {
            this.shieldHits--;
            if (this.shieldHits === 0) {
                delete this.activeEffects.SHIELD;
            }
            return true;
        }
        return false;
    }

    getActiveEffects() {
        const active = [];
        for (const type of Object.keys(this.activeEffects)) {
            if (this.isActive(type)) {
                const remaining = this.activeEffects[type] - Date.now();
                active.push({
                    type,
                    remaining,
                    data: POWERUP_TYPES[type]
                });
            }
        }
        return active;
    }

    clear() {
        this.activeEffects = {};
        this.shieldHits = 0;
    }

    getFireRateMultiplier() {
        return this.isActive('RAPID_FIRE') ? 0.5 : 1;
    }

    getGoldMultiplier() {
        return this.isActive('DOUBLE_GOLD') ? 2 : 1;
    }

    hasSpreadShot() {
        return this.isActive('SPREAD_SHOT');
    }

    hasMagnet() {
        return this.isActive('MAGNET');
    }

    hasAllyShield() {
        return this.isActive('ALLY_SHIELD');
    }

    hasShield() {
        return this.shieldHits > 0;
    }
}
