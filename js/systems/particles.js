// Particle System for Visual Effects
import { CONFIG } from '../utils/config.js';

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.decay = options.decay || 0.02;
        this.size = options.size || 2;
        this.color = options.color || '#ffffff';
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.char = options.char || null; // ASCII character to render
        this.shrink = options.shrink !== false; // Shrink over time
        this.fadeOut = options.fadeOut !== false; // Fade over time
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay * dt;

        return this.life > 0;
    }

    draw(ctx) {
        const alpha = this.fadeOut ? this.life / this.maxLife : 1;
        const size = this.shrink ? this.size * (this.life / this.maxLife) : this.size;

        ctx.globalAlpha = alpha;

        if (this.char) {
            // Render as ASCII character
            ctx.fillStyle = this.color;
            ctx.font = `${Math.max(4, size * 4)}px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.char, this.x, this.y);
        } else {
            // Render as circle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, size), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    update(deltaTime) {
        const dt = deltaTime / 16;
        this.particles = this.particles.filter(p => p.update(dt));
    }

    draw(ctx) {
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
    }

    addParticle(x, y, options) {
        if (this.particles.length < this.maxParticles) {
            this.particles.push(new Particle(x, y, options));
        }
    }

    // ==================== Effect Presets ====================

    // Explosion effect - fiery burst
    explosion(x, y, intensity = 1) {
        const count = Math.floor(20 * intensity);
        const colors = ['#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffcc00', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4 * intensity;
            const color = colors[Math.floor(Math.random() * colors.length)];

            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                decay: 0.03,
                size: 1 + Math.random() * 2,
                color: color,
                gravity: 0.05,
                friction: 0.96
            });
        }

        // Add some ASCII debris
        const debris = ['*', '.', '+', 'x', '\''];
        for (let i = 0; i < 5 * intensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8 + Math.random() * 0.4,
                decay: 0.02,
                size: 2,
                color: '#ffaa00',
                char: debris[Math.floor(Math.random() * debris.length)],
                gravity: 0.08,
                friction: 0.95
            });
        }
    }

    // Small hit spark effect
    spark(x, y, color = '#ffff00') {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.2,
                decay: 0.05,
                size: 1 + Math.random(),
                color: color,
                friction: 0.9
            });
        }
    }

    // Engine exhaust trail
    engineTrail(x, y, color = '#00aaff', intensity = 1) {
        const count = Math.floor(2 * intensity);
        for (let i = 0; i < count; i++) {
            this.addParticle(x + (Math.random() - 0.5) * 4, y, {
                vx: (Math.random() - 0.5) * 0.5,
                vy: 1 + Math.random() * 2,
                life: 0.2 + Math.random() * 0.3,
                decay: 0.04,
                size: 1 + Math.random() * 1.5,
                color: color,
                friction: 0.95
            });
        }
    }

    // Ring collection sparkle
    ringCollect(x, y, isPositive = true) {
        const count = 15;
        const baseColor = isPositive ? '#ffdd00' : '#ff4466';
        const colors = isPositive
            ? ['#ffdd00', '#ffee44', '#ffffff', '#88ff88']
            : ['#ff4466', '#ff6688', '#ff8899', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 2;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6 + Math.random() * 0.4,
                decay: 0.025,
                size: 1.5 + Math.random(),
                color: colors[Math.floor(Math.random() * colors.length)],
                friction: 0.94,
                char: isPositive ? '+' : '-'
            });
        }

        // Starburst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 0.3,
                decay: 0.04,
                size: 2,
                color: '#ffffff',
                friction: 0.9
            });
        }
    }

    // Ally join effect - ascending sparkles
    allyJoin(x, y) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            this.addParticle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, {
                vx: (Math.random() - 0.5) * 2,
                vy: -2 - Math.random() * 2,
                life: 0.8 + Math.random() * 0.4,
                decay: 0.02,
                size: 1 + Math.random(),
                color: CONFIG.COLORS.ALLY,
                friction: 0.98,
                gravity: -0.02 // Float upward
            });
        }
    }

    // Ally lost effect - falling particles
    allyLost(x, y) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            this.addParticle(x, y, {
                vx: (Math.random() - 0.5) * 3,
                vy: -1 + Math.random() * 2,
                life: 0.6 + Math.random() * 0.3,
                decay: 0.025,
                size: 1.5,
                color: '#ff6666',
                gravity: 0.1,
                friction: 0.97
            });
        }
    }

    // Damage hit effect
    damageHit(x, y) {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 2;
            this.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3 + Math.random() * 0.2,
                decay: 0.04,
                size: 2,
                color: '#ff0000',
                friction: 0.9
            });
        }
    }

    // Bullet trail (subtle)
    bulletTrail(x, y, isPlayer = true) {
        const color = isPlayer ? '#88ffff' : '#ff6666';
        this.addParticle(x, y, {
            vx: (Math.random() - 0.5) * 0.3,
            vy: isPlayer ? 0.5 : -0.5,
            life: 0.15,
            decay: 0.08,
            size: 1,
            color: color,
            friction: 0.95,
            shrink: true
        });
    }

    // Wave start effect - sweeping line
    waveStart(gameWidth) {
        for (let x = 0; x < gameWidth; x += 10) {
            this.addParticle(x, 50, {
                vx: 0,
                vy: 1,
                life: 0.5,
                decay: 0.03,
                size: 2,
                color: '#ffffff',
                friction: 1
            });
        }
    }

    // Shooting star (background effect)
    shootingStar(gameWidth, gameHeight) {
        const startX = Math.random() * gameWidth;
        const length = 30 + Math.random() * 50;

        for (let i = 0; i < 10; i++) {
            this.addParticle(startX + i * 3, -10 + i * 2, {
                vx: 2 + Math.random(),
                vy: 3 + Math.random(),
                life: 0.3 + (10 - i) * 0.05,
                decay: 0.02,
                size: 2 - i * 0.15,
                color: i < 3 ? '#ffffff' : '#aaaacc',
                friction: 1
            });
        }
    }

    // Clear all particles
    clear() {
        this.particles = [];
    }

    // Get particle count (for debugging)
    get count() {
        return this.particles.length;
    }
}

// Screen effects manager
export class ScreenEffects {
    constructor() {
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        this.flashColor = null;
        this.flashAlpha = 0;
        this.flashDecay = 0.1;

        this.slowMotion = 1;
        this.slowMotionTarget = 1;
    }

    update(deltaTime) {
        const dt = deltaTime / 16;

        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt * 0.05;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
            this.shakeIntensity *= 0.95;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
        }

        // Update flash
        if (this.flashAlpha > 0) {
            this.flashAlpha -= this.flashDecay * dt;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }

        // Update slow motion
        this.slowMotion += (this.slowMotionTarget - this.slowMotion) * 0.1 * dt;
    }

    shake(intensity = 5, duration = 0.3) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    flash(color = '#ffffff', alpha = 0.5, decay = 0.08) {
        this.flashColor = color;
        this.flashAlpha = alpha;
        this.flashDecay = decay;
    }

    hitstop(duration = 0.05) {
        this.slowMotion = 0.1;
        this.slowMotionTarget = 1;
        setTimeout(() => {
            this.slowMotionTarget = 1;
        }, duration * 1000);
    }

    applyShake(ctx) {
        if (this.shakeX !== 0 || this.shakeY !== 0) {
            ctx.translate(this.shakeX, this.shakeY);
        }
    }

    drawFlash(ctx, width, height) {
        if (this.flashAlpha > 0 && this.flashColor) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillRect(-10, -10, width + 20, height + 20);
            ctx.globalAlpha = 1;
        }
    }

    getTimeScale() {
        return this.slowMotion;
    }
}
