// Enemy Entity
import { CONFIG } from '../utils/config.js';
import { SPRITES, getSpriteSize } from '../utils/sprites.js';
import { Bullet } from './bullet.js';

export class Enemy {
    constructor(x, y, type = 'BASIC') {
        this.x = x;
        this.y = y;
        this.type = type;

        const typeConfig = CONFIG.ENEMY_TYPES[type] || CONFIG.ENEMY_TYPES.BASIC;
        this.health = typeConfig.health;
        this.maxHealth = typeConfig.health;
        this.speed = typeConfig.speed;
        this.fireRate = typeConfig.fireRate;
        this.bulletDamage = typeConfig.bulletDamage;
        this.gold = typeConfig.gold;
        this.score = typeConfig.score;
        this.special = typeConfig.special || null;

        this.sprite = this.getSpriteForType(type);
        this.lastFireTime = 0;
        this.active = true;

        const size = getSpriteSize(this.sprite);
        this.width = size.width * 5;
        this.height = size.height * 8;

        // Movement pattern
        this.baseX = x;
        this.moveTimer = Math.random() * Math.PI * 2;
        this.moveAmplitude = 50 + Math.random() * 30;

        // Track if fully on screen (for damage)
        this.onScreen = false;

        // Special behaviors
        this.shieldActive = type === 'SHIELD';
        this.shieldHealth = type === 'SHIELD' ? 30 : 0;
        this.spawnTimer = 0;
        this.spawnCooldown = 5000;

        // Target tracking for aimed shots
        this.targetX = 0;
        this.targetY = 0;

        // Flash timer for damage feedback
        this.flashTimer = 0;

        // Entry animation state (for wave spawning)
        this.entering = true;
        this.entryTimer = 0;
        this.entryDuration = 60; // frames
        this.entryStartY = -50;
        this.entryTargetY = 50 + Math.random() * 100;
        this.entryPath = 'straight'; // 'straight', 'swoop', 'spiral'

        // BUS charge state
        if (type === 'BUS') {
            this.chargeState = 'approach'; // 'approach', 'telegraph', 'charging'
            this.chargeSpeed = typeConfig.chargeSpeed || 10;
            this.ramDamage = typeConfig.ramDamage || 40;
            this.telegraphTimer = 0;
            this.telegraphDuration = 90; // 1.5 seconds at 60fps
            this.lane = this.calculateLane(x);
            this.x = this.getLaneX(this.lane);
            this.baseX = this.x;
            this.moveAmplitude = 0; // No side-to-side movement
        }
    }

    // Calculate which lane (0=left, 1=center, 2=right) based on spawn X
    calculateLane(x) {
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        if (x < laneWidth) return 0;
        if (x < laneWidth * 2) return 1;
        return 2;
    }

    // Get the center X position for a lane
    getLaneX(lane) {
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        return laneWidth * lane + laneWidth / 2;
    }

    // Set entry animation type
    setEntryPath(path, targetY = null) {
        this.entryPath = path;
        if (targetY !== null) {
            this.entryTargetY = targetY;
        }
        this.entering = true;
        this.entryTimer = 0;
    }

    getSpriteForType(type) {
        switch (type) {
            case 'FAST':
                return SPRITES.ENEMY_FAST;
            case 'TANK':
                return SPRITES.ENEMY_TANK;
            case 'BOMBER':
                return SPRITES.ENEMY_BOMBER;
            case 'SNIPER':
                return SPRITES.ENEMY_SNIPER;
            case 'SWARM':
                return SPRITES.ENEMY_SWARM;
            case 'SHIELD':
                return SPRITES.ENEMY_SHIELD;
            case 'CARRIER':
                return SPRITES.ENEMY_CARRIER;
            case 'DRONE':
                return SPRITES.ENEMY_DRONE;
            case 'BUS':
                return SPRITES.ENEMY_BUS;
            default:
                return SPRITES.ENEMY_BASIC;
        }
    }

    update(deltaTime, currentTime, playerX, playerY, spawnCallback) {
        if (!this.active) return [];

        const bullets = [];
        const dt = deltaTime / 16;

        // Store target position for aimed shots
        this.targetX = playerX;
        this.targetY = playerY;

        // Flash timer decay
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        // Handle entry animation
        if (this.entering) {
            this.updateEntry(dt);
            return bullets; // Don't attack or move normally during entry
        }

        // Handle BUS charge behavior
        if (this.type === 'BUS') {
            this.updateBusCharge(dt);
        } else {
            // Move down
            this.y += this.speed * dt;

            // Type-specific movement
            this.updateMovement(dt);
        }

        // Update on-screen status (fully visible)
        this.onScreen = this.y > this.height / 2;

        // Type-specific attacks
        if (this.onScreen && this.y < playerY) {
            const result = this.updateAttack(deltaTime, currentTime, playerX, playerY, spawnCallback);
            if (result) bullets.push(...result);
        }

        // Deactivate if off screen bottom
        if (this.y > CONFIG.GAME_HEIGHT + 50) {
            this.active = false;
        }

        return bullets;
    }

    updateEntry(dt) {
        this.entryTimer += dt;
        const progress = Math.min(this.entryTimer / this.entryDuration, 1);

        // Easing function for smooth entry
        const easeOut = 1 - Math.pow(1 - progress, 3);

        switch (this.entryPath) {
            case 'swoop':
                // Swoop in from side with curve
                const swoopOffset = Math.sin(progress * Math.PI) * 100;
                this.y = this.entryStartY + (this.entryTargetY - this.entryStartY) * easeOut;
                this.x = this.baseX + swoopOffset * (this.baseX < CONFIG.GAME_WIDTH / 2 ? 1 : -1);
                break;

            case 'spiral':
                // Spiral inward
                const spiralRadius = (1 - progress) * 80;
                const spiralAngle = progress * Math.PI * 4;
                this.y = this.entryStartY + (this.entryTargetY - this.entryStartY) * easeOut;
                this.x = this.baseX + Math.cos(spiralAngle) * spiralRadius;
                break;

            case 'zigzag':
                // Quick zigzag entry
                const zigzag = Math.sin(progress * Math.PI * 6) * 40 * (1 - progress);
                this.y = this.entryStartY + (this.entryTargetY - this.entryStartY) * easeOut;
                this.x = this.baseX + zigzag;
                break;

            default: // 'straight'
                this.y = this.entryStartY + (this.entryTargetY - this.entryStartY) * easeOut;
        }

        // Entry complete
        if (progress >= 1) {
            this.entering = false;
            this.y = this.entryTargetY;
            this.x = this.baseX;
        }
    }

    updateBusCharge(dt) {
        // Stay locked to lane
        this.x = this.getLaneX(this.lane);

        switch (this.chargeState) {
            case 'approach':
                // Slow approach until reaching telegraph position
                this.y += this.speed * dt;
                if (this.y >= 150) {
                    this.chargeState = 'telegraph';
                    this.telegraphTimer = 0;
                }
                break;

            case 'telegraph':
                // Flash warning, stay in place
                this.telegraphTimer += dt;
                if (this.telegraphTimer >= this.telegraphDuration) {
                    this.chargeState = 'charging';
                }
                break;

            case 'charging':
                // Charge down fast!
                this.y += this.chargeSpeed * dt;
                break;
        }
    }

    updateMovement(dt) {
        switch (this.type) {
            case 'SWARM':
                // Direct movement toward player
                const dx = this.targetX - this.x;
                this.x += Math.sign(dx) * 2 * dt;
                break;

            case 'SNIPER':
                // Minimal movement - stays in place mostly
                this.moveTimer += 0.005 * dt;
                this.x = this.baseX + Math.sin(this.moveTimer) * 20;
                break;

            case 'CARRIER':
                // Slow, wide sweeping
                this.moveTimer += 0.01 * dt;
                this.x = CONFIG.GAME_WIDTH / 2 + Math.sin(this.moveTimer) * 100;
                break;

            default:
                // Standard wave movement
                this.moveTimer += 0.02 * dt;
                this.x = this.baseX + Math.sin(this.moveTimer) * this.moveAmplitude;
        }

        // Keep in bounds
        this.x = Math.max(this.width / 2, Math.min(CONFIG.GAME_WIDTH - this.width / 2, this.x));
    }

    updateAttack(deltaTime, currentTime, playerX, playerY, spawnCallback) {
        const bullets = [];

        switch (this.special) {
            case 'bomb':
                // Drop bombs
                if (currentTime - this.lastFireTime >= this.fireRate) {
                    const bomb = this.createBomb();
                    bullets.push(bomb);
                    this.lastFireTime = currentTime;
                }
                break;

            case 'aimed':
                // Fire aimed shots at player
                if (currentTime - this.lastFireTime >= this.fireRate) {
                    bullets.push(this.fireAimed(playerX, playerY));
                    this.lastFireTime = currentTime;
                }
                break;

            case 'kamikaze':
            case 'ram':
            case 'charge':
                // No firing, just ram/charge
                break;

            case 'spawn':
                // Spawn drones
                this.spawnTimer += deltaTime;
                if (this.spawnTimer >= this.spawnCooldown && spawnCallback) {
                    // Spawn 2 drones on either side
                    spawnCallback(this.x - 30, this.y + this.height / 2, 'DRONE');
                    spawnCallback(this.x + 30, this.y + this.height / 2, 'DRONE');
                    this.spawnTimer = 0;
                }
                break;

            case 'shield':
                // Normal firing with shield protection
                if (currentTime - this.lastFireTime >= this.fireRate) {
                    bullets.push(this.fire());
                    this.lastFireTime = currentTime;
                }
                break;

            default:
                // Standard firing
                if (this.fireRate > 0 && currentTime - this.lastFireTime >= this.fireRate) {
                    bullets.push(this.fire());
                    this.lastFireTime = currentTime;
                }
        }

        return bullets;
    }

    fire() {
        return new Bullet(this.x, this.y + this.height / 2, false, this.bulletDamage);
    }

    fireAimed(playerX, playerY) {
        const bullet = new Bullet(this.x, this.y + this.height / 2, false, this.bulletDamage);
        // Calculate angle to player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 5;
        bullet.vx = (dx / dist) * speed;
        bullet.vy = (dy / dist) * speed;
        bullet.aimed = true;
        return bullet;
    }

    createBomb() {
        const bomb = new Bullet(this.x, this.y + this.height / 2, false, this.bulletDamage);
        bomb.isBomb = true;
        bomb.vy = 2;
        bomb.vx = 0;
        bomb.explosionRadius = 60;
        return bomb;
    }

    // Only take damage if on screen
    takeDamage(amount) {
        if (!this.onScreen) {
            return false; // Invulnerable while off screen
        }

        // Shield absorbs damage first
        if (this.shieldActive && this.shieldHealth > 0) {
            this.shieldHealth -= amount;
            if (this.shieldHealth <= 0) {
                this.shieldActive = false;
                // Apply remaining damage to health
                this.health += this.shieldHealth;
            }
            this.flashTimer = 3;
            return false;
        }

        this.health -= amount;
        this.flashTimer = 3;

        if (this.health <= 0) {
            this.health = 0;
            this.active = false;
            return true; // Killed
        }
        return false;
    }

    draw(renderer) {
        if (!this.active) return;

        // Determine color based on state
        let color = CONFIG.COLORS.ENEMY;
        if (this.flashTimer > 0) {
            color = '#ffffff';
        } else if (this.type === 'SWARM') {
            color = '#ff8800';
        } else if (this.type === 'SNIPER') {
            color = '#ff00ff';
        } else if (this.type === 'CARRIER') {
            color = '#8888ff';
        } else if (this.type === 'BUS') {
            // BUS is yellow/orange, flashes red when telegraphing
            if (this.chargeState === 'telegraph') {
                const flash = Math.sin(this.telegraphTimer * 0.3) > 0;
                color = flash ? '#ff0000' : '#ffaa00';
            } else if (this.chargeState === 'charging') {
                color = '#ff4400';
            } else {
                color = '#ffaa00';
            }
        }

        // Draw entry trail if entering
        if (this.entering) {
            const alpha = 0.3;
            renderer.ctx.globalAlpha = alpha;
        }

        renderer.drawSpriteCentered(this.sprite, this.x, this.y, color);

        // Reset alpha
        if (this.entering) {
            renderer.ctx.globalAlpha = 1;
        }

        // Draw BUS lane warning
        if (this.type === 'BUS' && this.chargeState === 'telegraph') {
            this.drawLaneWarning(renderer);
        }

        // Draw shield if active
        if (this.shieldActive) {
            this.drawShield(renderer);
        }

        // Draw health bar if damaged and on screen
        if (this.health < this.maxHealth && this.onScreen) {
            const barWidth = 30;
            const barHeight = 3;
            renderer.drawHealthBar(
                this.x - barWidth / 2,
                this.y - this.height / 2 - 6,
                barWidth,
                barHeight,
                this.health,
                this.maxHealth,
                '#ff6666',
                CONFIG.COLORS.HEALTH_BAR_BG
            );
        }
    }

    drawShield(renderer) {
        const ctx = renderer.ctx;
        const shieldPercent = this.shieldHealth / 30;
        ctx.strokeStyle = `rgba(0, 200, 255, ${0.5 + shieldPercent * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawLaneWarning(renderer) {
        const ctx = renderer.ctx;
        const laneWidth = CONFIG.GAME_WIDTH / 3;
        const laneX = this.lane * laneWidth;

        // Flash the warning lane
        const flash = Math.sin(this.telegraphTimer * 0.3) > 0;
        const alpha = flash ? 0.3 : 0.1;

        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.fillRect(laneX, this.y, laneWidth, CONFIG.GAME_HEIGHT - this.y);

        // Draw warning "!" icon
        if (flash) {
            ctx.font = 'bold 24px Courier New, monospace';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', this.x, this.y - 40);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
        }
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
