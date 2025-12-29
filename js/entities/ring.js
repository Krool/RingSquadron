/**
 * Ring Entity with Path Movement
 *
 * Rings are collectible items that spawn with various movement patterns.
 * - Positive values add allies when collected
 * - Negative values remove allies when collected
 * - Shooting rings increases their value by 1
 *
 * @module entities/ring
 */
import { CONFIG } from '../utils/config.js';
import { getRingSprite, getSpriteSize } from '../utils/sprites.js';

export class Ring {
    constructor(x, y, value = CONFIG.RING_BASE_VALUE) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.value = value;
        this.speed = CONFIG.RING_SPEED;
        this.active = true;
        this.collected = false;

        // Gate type: 'normal', 'multiply', 'divide'
        this.gateType = 'normal';
        this.multiplier = 1; // 2 for x2, 0.5 for /2

        // Path movement
        this.pathType = 'straight';
        this.pathParams = {};
        this.pathTime = 0;

        // Calculate size based on sprite
        const sprite = getRingSprite(this.value);
        const size = getSpriteSize(sprite);
        this.width = size.width * 5;
        this.height = size.height * 8;

        // Pulse animation
        this.pulseTimer = 0;
    }

    /**
     * Create a multiplier gate (x2 or /2)
     * @param {string} type - 'multiply' or 'divide'
     */
    setMultiplierGate(type) {
        this.gateType = type;
        this.multiplier = type === 'multiply' ? 2 : 0.5;
        this.value = 0; // Multiplier gates don't have a value
    }

    /**
     * Check if this is a multiplier gate
     */
    isMultiplierGate() {
        return this.gateType !== 'normal';
    }

    setPath(type, params = {}) {
        this.pathType = type;
        this.pathParams = params;
        this.pathTime = params.phase || 0;
    }

    update(deltaTime) {
        if (!this.active) return;

        const dt = deltaTime / 16;
        this.pathTime += dt;

        // Move down
        this.y += this.speed * dt;

        // Apply path movement
        switch (this.pathType) {
            case 'sine':
                this.x = this.startX + Math.sin(this.y * this.pathParams.frequency + (this.pathParams.phase || 0)) * this.pathParams.amplitude;
                break;

            case 'zigzag':
                const segment = Math.floor(this.y / (CONFIG.GAME_HEIGHT / this.pathParams.segments));
                const progress = (this.y % (CONFIG.GAME_HEIGHT / this.pathParams.segments)) / (CONFIG.GAME_HEIGHT / this.pathParams.segments);
                const direction = segment % 2 === 0 ? 1 : -1;
                const baseX = this.startX < CONFIG.GAME_WIDTH / 2 ? 80 : CONFIG.GAME_WIDTH - 80;
                this.x = baseX + direction * progress * this.pathParams.width;
                break;

            case 'spiral':
                const spiralAngle = this.pathTime * this.pathParams.tightness * 10;
                const spiralRadius = Math.max(0, this.pathParams.radius - this.pathTime * 0.5);
                this.x = this.startX + Math.cos(spiralAngle) * spiralRadius;
                break;

            case 'curve':
                this.x = this.startX + this.pathParams.direction * this.pathTime * this.pathTime * this.pathParams.curve * 100;
                break;

            case 'weave':
                this.x = 80 + (Math.sin(this.pathTime * 0.1) * 0.5 + 0.5) * this.pathParams.width;
                break;

            case 'diamond':
                const diamondPhase = (this.pathTime * 0.05) % 4;
                const diamondSize = this.pathParams.size;
                if (diamondPhase < 1) {
                    this.x = this.startX + diamondPhase * diamondSize;
                } else if (diamondPhase < 2) {
                    this.x = this.startX + diamondSize - (diamondPhase - 1) * diamondSize;
                } else if (diamondPhase < 3) {
                    this.x = this.startX - (diamondPhase - 2) * diamondSize;
                } else {
                    this.x = this.startX - diamondSize + (diamondPhase - 3) * diamondSize;
                }
                break;

            case 'figure8':
                // Figure-8 pattern
                const f8t = this.pathTime * 0.03 * (this.pathParams.speed || 1);
                this.x = this.startX + Math.sin(f8t) * this.pathParams.width;
                this.y = this.startY + this.pathTime * this.speed + Math.sin(f8t * 2) * this.pathParams.height;
                break;

            case 'bounce':
                // Bounces off walls
                const bounceSpeed = this.pathParams.speed || 2;
                const bounceX = this.startX + this.pathTime * bounceSpeed * this.pathParams.direction;
                const cycles = Math.floor(bounceX / (CONFIG.GAME_WIDTH - 60));
                if (cycles % 2 === 0) {
                    this.x = 30 + (bounceX % (CONFIG.GAME_WIDTH - 60));
                } else {
                    this.x = CONFIG.GAME_WIDTH - 30 - (bounceX % (CONFIG.GAME_WIDTH - 60));
                }
                break;

            case 'orbit':
                // Orbits around center point
                const orbitAngle = this.pathTime * 0.05 * (this.pathParams.speed || 1);
                const orbitRadius = this.pathParams.radius || 80;
                const centerX = this.pathParams.centerX || CONFIG.GAME_WIDTH / 2;
                this.x = centerX + Math.cos(orbitAngle) * orbitRadius;
                break;

            case 'pendulum':
                // Pendulum swing
                const swing = Math.sin(this.pathTime * 0.04) * this.pathParams.amplitude;
                this.x = CONFIG.GAME_WIDTH / 2 + swing;
                break;

            case 'heart':
                // Heart shape path
                const ht = this.pathTime * 0.02;
                const heartScale = this.pathParams.scale || 30;
                this.x = this.startX + 16 * Math.pow(Math.sin(ht), 3) * heartScale / 16;
                // Adjust vertical to create heart curve
                break;

            case 'snake':
                // Snake-like slithering
                const snakeFreq = this.pathParams.frequency || 0.02;
                const snakeAmp = this.pathParams.amplitude || 60;
                this.x = this.startX + Math.sin(this.y * snakeFreq + this.pathParams.phase) * snakeAmp;
                this.x += Math.sin(this.y * snakeFreq * 3) * (snakeAmp / 4);
                break;

            case 'chase':
                // Follows/chases a target x position
                const targetX = this.pathParams.targetX || CONFIG.GAME_WIDTH / 2;
                const chaseSpeed = this.pathParams.speed || 0.05;
                this.x += (targetX - this.x) * chaseSpeed * dt;
                break;

            case 'random':
                // Random walk
                if (Math.random() < 0.05) {
                    this.pathParams.direction = (Math.random() - 0.5) * 4;
                }
                this.x += (this.pathParams.direction || 0) * dt;
                break;

            case 'formation':
                // Stays in formation with offset
                this.x = this.pathParams.baseX + this.pathParams.offsetX;
                this.y = this.startY + this.pathTime * this.speed;
                break;
        }

        // Clamp x to screen bounds
        this.x = Math.max(30, Math.min(CONFIG.GAME_WIDTH - 30, this.x));

        // Pulse animation
        this.pulseTimer += 0.05 * dt;

        // Deactivate if off screen
        if (this.y > CONFIG.GAME_HEIGHT + 50) {
            this.active = false;
        }
    }

    /**
     * Called when bullet hits the ring - increases value by 1
     * Capped at CONFIG.RING_MAX_VALUE to prevent overflow
     * Multiplier gates cannot be shot (return false)
     * @returns {boolean} true if value was increased
     */
    increaseValue() {
        // Multiplier gates don't respond to bullets
        if (this.isMultiplierGate()) {
            return false;
        }
        if (this.value < CONFIG.RING_MAX_VALUE) {
            this.value++;
            return true;
        }
        return false;
    }

    // Called when player collides with ring
    collect() {
        this.collected = true;
        this.active = false;
        return this.value;
    }

    draw(renderer) {
        if (!this.active) return;

        const ctx = renderer.ctx;

        // Pulse effect
        const pulse = Math.sin(this.pulseTimer * 3) * 0.2 + 0.8;

        // Handle multiplier gates differently
        if (this.isMultiplierGate()) {
            // Multiplier gate colors: gold for x2, dark red for /2
            const isMultiply = this.gateType === 'multiply';
            const frameColor = isMultiply ? '#ffdd00' : '#aa2222';
            const textColor = isMultiply ? '#ffff88' : '#ff6666';
            const text = isMultiply ? 'x2' : '/2';

            // Draw gate frame using canvas primitives
            const gateWidth = 40;
            const gateHeight = 24;
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - gateWidth / 2, this.y - gateHeight / 2, gateWidth, gateHeight);

            // Inner rectangle
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - gateWidth / 2 + 4, this.y - gateHeight / 2 + 4, gateWidth - 8, gateHeight - 8);

            // Draw the multiplier text
            ctx.fillStyle = textColor;
            ctx.font = `bold 14px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, this.x, this.y);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            return;
        }

        // Normal ring: Color based on value (negative = red, positive = blue)
        const isNegative = this.value < 0;
        const ringColor = isNegative ? '#ff4466' : '#44aaff';
        const textColor = isNegative ? '#ff6666' : '#66bbff';

        // Draw ring as circle using canvas primitives
        const radius = 15 * pulse;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw inner highlight
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius - 4, 0, Math.PI * 2);
        ctx.strokeStyle = isNegative ? 'rgba(255, 100, 100, 0.3)' : 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw the number prominently in the center
        let numStr;
        if (this.value >= 0) {
            numStr = '+' + this.value;
        } else {
            numStr = this.value.toString();
        }
        ctx.fillStyle = textColor;
        ctx.font = `bold 10px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numStr, this.x, this.y);
        ctx.textAlign = 'left';
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

    getBulletBounds() {
        const padding = 5;
        return {
            x: this.x - this.width / 2 + padding,
            y: this.y - this.height / 2 + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}
