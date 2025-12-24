// Object Pool System for Performance Optimization
// Reduces garbage collection by reusing objects

export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    acquire(...args) {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.resetFn(obj, ...args);
        obj.active = true;
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        obj.active = false;
        const index = this.active.indexOf(obj);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
        this.pool.push(obj);
    }

    releaseAll() {
        for (const obj of this.active) {
            obj.active = false;
            this.pool.push(obj);
        }
        this.active = [];
    }

    // Clean up inactive objects and return them to pool
    cleanup() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            if (!this.active[i].active) {
                this.pool.push(this.active[i]);
                this.active.splice(i, 1);
            }
        }
    }

    getActive() {
        return this.active;
    }

    getStats() {
        return {
            pooled: this.pool.length,
            active: this.active.length,
            total: this.pool.length + this.active.length
        };
    }
}

// Spatial hash grid for efficient collision detection
export class SpatialHash {
    constructor(cellSize = 50) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    _getKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    _getCells(bounds) {
        const cells = [];
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                cells.push(`${x},${y}`);
            }
        }
        return cells;
    }

    insert(entity, bounds) {
        const cells = this._getCells(bounds);
        for (const cell of cells) {
            if (!this.grid.has(cell)) {
                this.grid.set(cell, []);
            }
            this.grid.get(cell).push(entity);
        }
    }

    query(bounds) {
        const cells = this._getCells(bounds);
        const seen = new Set();
        const results = [];

        for (const cell of cells) {
            const entities = this.grid.get(cell);
            if (entities) {
                for (const entity of entities) {
                    if (!seen.has(entity)) {
                        seen.add(entity);
                        results.push(entity);
                    }
                }
            }
        }
        return results;
    }

    // Build grid from entity array
    build(entities, getBounds) {
        this.clear();
        for (const entity of entities) {
            if (entity.active) {
                this.insert(entity, getBounds(entity));
            }
        }
    }
}

// Frame rate limiter for consistent performance
export class FrameLimiter {
    constructor(targetFPS = 60) {
        this.targetDelta = 1000 / targetFPS;
        this.lastFrame = 0;
        this.accumulator = 0;
    }

    shouldUpdate(currentTime) {
        const delta = currentTime - this.lastFrame;
        this.accumulator += delta;
        this.lastFrame = currentTime;

        if (this.accumulator >= this.targetDelta) {
            this.accumulator -= this.targetDelta;
            return true;
        }
        return false;
    }
}

// Performance monitor for debugging
export class PerformanceMonitor {
    constructor() {
        this.samples = [];
        this.maxSamples = 60;
        this.lastTime = performance.now();
    }

    startFrame() {
        this.frameStart = performance.now();
    }

    endFrame() {
        const frameTime = performance.now() - this.frameStart;
        this.samples.push(frameTime);
        if (this.samples.length > this.maxSamples) {
            this.samples.shift();
        }
    }

    getAverageFrameTime() {
        if (this.samples.length === 0) return 0;
        return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    }

    getFPS() {
        const avgFrame = this.getAverageFrameTime();
        return avgFrame > 0 ? 1000 / avgFrame : 60;
    }

    draw(ctx, x, y) {
        const fps = Math.round(this.getFPS());
        const frameTime = this.getAverageFrameTime().toFixed(1);

        ctx.font = '10px monospace';
        ctx.fillStyle = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${fps} (${frameTime}ms)`, x, y);
    }
}
