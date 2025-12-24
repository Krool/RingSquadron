// Boss Entity - Appears every 5 waves
import { CONFIG } from '../utils/config.js';

export const BOSS_TYPES = {
    DESTROYER: {
        name: 'Destroyer',
        health: 500,
        sprite: [
            '     _____     ',
            '   /=======\\   ',
            '  |=========|  ',
            ' /|  [===]  |\\ ',
            '|=|=========|=|',
            '| |  /===\\  | |',
            '|=|==|===|==|=|',
            ' \\|  \\===/  |/ ',
            '  |=========|  ',
            '   \\=======/   ',
            '    \\_____/    '
        ],
        color: '#ff4444',
        attacks: ['spread', 'beam', 'missiles'],
        speed: 0.5,
        goldReward: 500
    },
    MOTHERSHIP: {
        name: 'Mothership',
        health: 800,
        sprite: [
            '       ___       ',
            '    /=======\\    ',
            '   /=========\\   ',
            '  |===========|  ',
            ' /|   [===]   |\\ ',
            '|=|===========|=|',
            '|=| /=======\\ |=|',
            '|=||=========||=|',
            '|=| \\=======/ |=|',
            ' \\|===========|/ ',
            '  |===========|  ',
            '   \\=========/   ',
            '    \\_______/    '
        ],
        color: '#aa44ff',
        attacks: ['spawn', 'laser', 'bombs'],
        speed: 0.3,
        goldReward: 1000
    },
    DREADNOUGHT: {
        name: 'Dreadnought',
        health: 1200,
        sprite: [
            '         _         ',
            '       /===\\       ',
            '      |=====|      ',
            '    _/|=====|\\_    ',
            '   /==|=====|==\\   ',
            '  |===|=====|===|  ',
            ' /|===| === |===|\\ ',
            '|=|===|=====|===|=|',
            '|=|===|=====|===|=|',
            '|=|===|=====|===|=|',
            ' \\|===|=====|===|/ ',
            '  |===|=====|===|  ',
            '   \\==|=====|==/   ',
            '    \\_|=====|_/    ',
            '      |=====|      ',
            '       \\===/       '
        ],
        color: '#ff8800',
        attacks: ['spread', 'beam', 'missiles', 'spawn'],
        speed: 0.2,
        goldReward: 2000
    }
};

export class Boss {
    constructor(type, wave) {
        this.typeKey = type;
        this.typeData = BOSS_TYPES[type];
        this.wave = wave;

        // Position at top center
        this.x = CONFIG.GAME_WIDTH / 2;
        this.y = -100;
        this.targetY = 80;

        // Scale health with wave number
        const healthMultiplier = 1 + (Math.floor(wave / 5) - 1) * 0.5;
        this.maxHealth = Math.floor(this.typeData.health * healthMultiplier);
        this.health = this.maxHealth;

        // Dimensions
        this.width = this.typeData.sprite[0].length * 6;
        this.height = this.typeData.sprite.length * 8;

        // Movement
        this.speed = this.typeData.speed;
        this.movePattern = 'enter';
        this.moveTimer = 0;
        this.moveDirection = 1;

        // Combat
        this.attackTimer = 0;
        this.attackCooldown = 2000;
        this.currentAttack = 0;
        this.attackPhase = 0;

        // State
        this.active = true;
        this.entering = true;
        this.dying = false;
        this.deathTimer = 0;
        this.flashTimer = 0;
        this.invulnerable = true;

        // Spawned enemies (for Mothership)
        this.spawnedEnemies = [];
    }

    update(deltaTime) {
        if (!this.active) return;

        const dt = deltaTime / 16;

        // Flash effect when damaged
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        // Death sequence
        if (this.dying) {
            this.deathTimer += dt;
            if (this.deathTimer > 60) {
                this.active = false;
            }
            return;
        }

        // Enter sequence
        if (this.entering) {
            this.y += 1 * dt;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
                this.invulnerable = false;
            }
            return;
        }

        // Movement patterns
        this.moveTimer += dt;
        this.updateMovement(dt);

        // Attack logic
        this.attackTimer += deltaTime;
    }

    updateMovement(dt) {
        // Slow side-to-side movement
        const amplitude = 100;
        const period = 300;
        this.x = CONFIG.GAME_WIDTH / 2 + Math.sin(this.moveTimer / period) * amplitude;

        // Keep in bounds
        const halfWidth = this.width / 2;
        this.x = Math.max(halfWidth + 20, Math.min(CONFIG.GAME_WIDTH - halfWidth - 20, this.x));
    }

    shouldAttack() {
        if (this.attackTimer >= this.attackCooldown && !this.entering && !this.dying) {
            this.attackTimer = 0;
            return true;
        }
        return false;
    }

    getAttack() {
        const attacks = this.typeData.attacks;
        const attack = attacks[this.currentAttack % attacks.length];
        this.currentAttack++;
        return attack;
    }

    takeDamage(amount) {
        if (this.invulnerable || this.dying) return false;

        this.health -= amount;
        this.flashTimer = 3;

        if (this.health <= 0) {
            this.health = 0;
            this.dying = true;
            return true; // Boss defeated
        }
        return false;
    }

    getHealthPercent() {
        return this.health / this.maxHealth;
    }

    draw(renderer) {
        if (!this.active) return;

        const ctx = renderer.ctx;

        // Death explosion effect
        if (this.dying) {
            const progress = this.deathTimer / 60;
            ctx.globalAlpha = 1 - progress;
        }

        // Flash white when damaged
        const color = this.flashTimer > 0 ? '#ffffff' : this.typeData.color;

        // Draw sprite
        ctx.fillStyle = color;
        ctx.font = `${CONFIG.FONT_SIZE}px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const startY = this.y - this.height / 2;
        this.typeData.sprite.forEach((line, i) => {
            ctx.fillText(line, this.x, startY + i * 8);
        });

        ctx.globalAlpha = 1;

        // Draw health bar
        if (!this.entering) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = 200;
        const barHeight = 8;
        const x = CONFIG.GAME_WIDTH / 2 - barWidth / 2;
        const y = 20;

        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const healthPercent = this.getHealthPercent();
        const healthColor = healthPercent > 0.5 ? '#00ff00' :
                           healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Boss name
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.typeData.name, CONFIG.GAME_WIDTH / 2, y + barHeight + 4);
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    // Get firing positions for attacks
    getGunPositions() {
        return [
            { x: this.x - this.width / 3, y: this.y + this.height / 2 },
            { x: this.x, y: this.y + this.height / 2 },
            { x: this.x + this.width / 3, y: this.y + this.height / 2 }
        ];
    }
}

/**
 * Boss attack patterns (legacy - most attacks now handled inline in main.js)
 * NOTE: missiles and bombs methods here use setTimeout but are not called.
 * The actual attack logic in main.js uses game-time scheduling instead.
 */
export class BossAttacks {
    static spread(boss, bullets, Bullet) {
        // Fire spread of bullets
        const positions = boss.getGunPositions();
        const angles = [-0.4, -0.2, 0, 0.2, 0.4];

        positions.forEach(pos => {
            angles.forEach(angle => {
                const bullet = new Bullet(pos.x, pos.y, false);
                bullet.vx = Math.sin(angle) * 3;
                bullet.vy = 4;
                bullet.damage = 15;
                bullets.push(bullet);
            });
        });
    }

    static beam(boss, createBeam) {
        // Create a warning line, then fire a beam
        createBeam(boss.x, boss.y + boss.height / 2);
    }

    static missiles(boss, bullets, Bullet, playerX, playerY) {
        // Fire homing missiles
        const positions = boss.getGunPositions();
        positions.forEach((pos, i) => {
            setTimeout(() => {
                const bullet = new Bullet(pos.x, pos.y, false);
                bullet.homing = true;
                bullet.targetX = playerX;
                bullet.targetY = playerY;
                bullet.speed = 2;
                bullet.damage = 20;
                bullets.push(bullet);
            }, i * 200);
        });
    }

    static spawn(boss, spawnEnemy) {
        // Spawn smaller enemies
        const count = 3;
        for (let i = 0; i < count; i++) {
            const x = boss.x - 50 + i * 50;
            const y = boss.y + boss.height / 2 + 20;
            spawnEnemy(x, y, 'DRONE');
        }
    }

    static laser(boss, createLaser) {
        // Sweeping laser attack
        createLaser(boss.x, boss.y + boss.height / 2);
    }

    static bombs(boss, bullets, Bullet) {
        // Drop bombs that explode
        const count = 5;
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const x = boss.x - 80 + i * 40;
                const bullet = new Bullet(x, boss.y + boss.height / 2, false);
                bullet.bomb = true;
                bullet.vy = 2;
                bullet.vx = 0;
                bullet.damage = 25;
                bullet.explosionRadius = 50;
                bullets.push(bullet);
            }, i * 150);
        }
    }
}

// Select boss type based on wave
export function getBossForWave(wave) {
    const bossIndex = Math.floor(wave / 5) - 1;
    const types = Object.keys(BOSS_TYPES);
    const typeIndex = bossIndex % types.length;
    return types[typeIndex];
}
