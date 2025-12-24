// Floating Text System - Visual feedback for pickups, damage, etc.
import { CONFIG } from '../utils/config.js';

class FloatingText {
    constructor(x, y, text, options = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = options.color || '#ffffff';
        this.size = options.size || 12;
        this.duration = options.duration || 1000;
        this.velocity = options.velocity || { x: 0, y: -1.5 };
        this.gravity = options.gravity || 0;
        this.fadeStart = options.fadeStart || 0.5; // Start fading at 50% duration
        this.scale = options.scale || 1;
        this.scaleDecay = options.scaleDecay || 0;
        this.outline = options.outline || false;
        this.outlineColor = options.outlineColor || '#000000';
        this.wobble = options.wobble || false;
        this.wobbleSpeed = options.wobbleSpeed || 10;

        this.elapsed = 0;
        this.active = true;
        this.startScale = this.scale;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.elapsed += deltaTime;

        // Update position
        this.x += this.velocity.x * (deltaTime / 16);
        this.y += this.velocity.y * (deltaTime / 16);
        this.velocity.y += this.gravity * (deltaTime / 16);

        // Update scale
        if (this.scaleDecay > 0) {
            this.scale = Math.max(0.1, this.scale - this.scaleDecay * (deltaTime / 16));
        }

        // Check if done
        if (this.elapsed >= this.duration) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const progress = this.elapsed / this.duration;
        let alpha = 1;

        // Fade out
        if (progress > this.fadeStart) {
            alpha = 1 - (progress - this.fadeStart) / (1 - this.fadeStart);
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Wobble effect
        let offsetX = 0;
        if (this.wobble) {
            offsetX = Math.sin(this.elapsed / this.wobbleSpeed) * 3;
        }

        ctx.font = `bold ${Math.round(this.size * this.scale)}px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw outline
        if (this.outline) {
            ctx.strokeStyle = this.outlineColor;
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, this.x + offsetX, this.y);
        }

        // Draw text
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x + offsetX, this.y);

        ctx.restore();
    }
}

export class FloatingTextSystem {
    constructor() {
        this.texts = [];
        this.maxTexts = 50; // Performance limit
    }

    update(deltaTime) {
        for (const text of this.texts) {
            text.update(deltaTime);
        }
        this.texts = this.texts.filter(t => t.active);
    }

    draw(ctx) {
        for (const text of this.texts) {
            text.draw(ctx);
        }
    }

    add(x, y, text, options = {}) {
        if (this.texts.length >= this.maxTexts) {
            // Remove oldest
            this.texts.shift();
        }
        this.texts.push(new FloatingText(x, y, text, options));
    }

    clear() {
        this.texts = [];
    }

    // === Preset Effects ===

    // Gold pickup
    gold(x, y, amount) {
        this.add(x, y, `+${amount}`, {
            color: '#ffd700',
            size: 14,
            duration: 1200,
            velocity: { x: (Math.random() - 0.5) * 2, y: -2 },
            outline: true,
            outlineColor: '#886600'
        });
    }

    // Score popup
    score(x, y, amount) {
        this.add(x, y, `+${amount}`, {
            color: '#ffffff',
            size: 10,
            duration: 800,
            velocity: { x: 0, y: -1.5 },
            fadeStart: 0.3
        });
    }

    // Damage dealt
    damage(x, y, amount) {
        this.add(x, y, `-${amount}`, {
            color: '#ff4444',
            size: 12,
            duration: 600,
            velocity: { x: (Math.random() - 0.5) * 3, y: -2 },
            gravity: 0.1,
            fadeStart: 0.4
        });
    }

    // Critical hit
    critical(x, y, amount) {
        this.add(x, y, `CRIT! -${amount}`, {
            color: '#ff8800',
            size: 16,
            duration: 1000,
            velocity: { x: 0, y: -2.5 },
            scale: 1.3,
            scaleDecay: 0.01,
            outline: true
        });
    }

    // Heal
    heal(x, y, amount) {
        this.add(x, y, `+${amount} HP`, {
            color: '#00ff00',
            size: 14,
            duration: 1000,
            velocity: { x: 0, y: -1.5 },
            outline: true,
            outlineColor: '#006600'
        });
    }

    // Combo milestone
    combo(x, y, multiplier, name) {
        this.add(x, y, name, {
            color: '#ffff00',
            size: 20,
            duration: 1500,
            velocity: { x: 0, y: -1 },
            scale: 1.5,
            scaleDecay: 0.015,
            outline: true,
            wobble: true
        });
    }

    // Power-up collected
    powerUp(x, y, name) {
        this.add(x, y, name.toUpperCase(), {
            color: '#00ffff',
            size: 16,
            duration: 1500,
            velocity: { x: 0, y: -2 },
            scale: 1.2,
            scaleDecay: 0.008,
            outline: true
        });
    }

    // Ally gained
    allyGained(x, y, count) {
        this.add(x, y, `+${count} ALLY`, {
            color: '#00ff88',
            size: 14,
            duration: 1200,
            velocity: { x: 0, y: -2 },
            outline: true
        });
    }

    // Ally lost
    allyLost(x, y, count) {
        this.add(x, y, `-${count} ALLY`, {
            color: '#ff4466',
            size: 14,
            duration: 1200,
            velocity: { x: 0, y: -1.5 },
            wobble: true
        });
    }

    // Wave announcement
    wave(y, waveNum) {
        this.add(CONFIG.GAME_WIDTH / 2, y, `WAVE ${waveNum}`, {
            color: '#ffffff',
            size: 28,
            duration: 2000,
            velocity: { x: 0, y: 0 },
            scale: 1.5,
            scaleDecay: 0.005,
            outline: true,
            outlineColor: '#4488ff'
        });
    }

    // Boss warning
    bossWarning(y, name) {
        this.add(CONFIG.GAME_WIDTH / 2, y, `BOSS: ${name}`, {
            color: '#ff0000',
            size: 24,
            duration: 3000,
            velocity: { x: 0, y: 0 },
            wobble: true,
            wobbleSpeed: 5,
            outline: true
        });
    }

    // Ring value increase
    ringIncrease(x, y) {
        this.add(x, y - 15, '+1', {
            color: '#ffdd00',
            size: 10,
            duration: 500,
            velocity: { x: 0, y: -2 },
            fadeStart: 0.2
        });
    }

    // Perfect (for bonus events)
    perfect(x, y) {
        this.add(x, y, 'PERFECT!', {
            color: '#ff00ff',
            size: 18,
            duration: 1200,
            velocity: { x: 0, y: -1.5 },
            scale: 1.4,
            scaleDecay: 0.01,
            outline: true,
            wobble: true
        });
    }
}
