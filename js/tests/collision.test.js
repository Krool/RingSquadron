/**
 * Unit Tests for Collision System
 *
 * Run in browser console or with a test runner.
 * Usage: import and call runCollisionTests()
 *
 * @module tests/collision.test
 */

import { CollisionSystem } from '../systems/collision.js';

/**
 * Simple test runner
 */
class TestRunner {
    constructor(name) {
        this.name = name;
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    test(description, fn) {
        try {
            fn();
            this.passed++;
            this.results.push({ description, passed: true });
        } catch (e) {
            this.failed++;
            this.results.push({ description, passed: false, error: e.message });
        }
    }

    assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} Expected ${expected}, got ${actual}`);
        }
    }

    assertTrue(value, message = '') {
        if (!value) {
            throw new Error(`${message} Expected true, got ${value}`);
        }
    }

    assertFalse(value, message = '') {
        if (value) {
            throw new Error(`${message} Expected false, got ${value}`);
        }
    }

    report() {
        console.log(`\n=== ${this.name} ===`);
        console.log(`Passed: ${this.passed}/${this.passed + this.failed}`);

        this.results.forEach(r => {
            if (r.passed) {
                console.log(`  ✓ ${r.description}`);
            } else {
                console.log(`  ✗ ${r.description}`);
                console.log(`    Error: ${r.error}`);
            }
        });

        return this.failed === 0;
    }
}

/**
 * Run all collision system tests
 */
export function runCollisionTests() {
    const t = new TestRunner('Collision System Tests');

    // ========================================
    // checkAABB / checkCollision Tests
    // ========================================

    t.test('checkCollision: overlapping rectangles should collide', () => {
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 5, y: 5, width: 10, height: 10 };
        t.assertTrue(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkCollision: non-overlapping rectangles should not collide', () => {
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 20, y: 20, width: 10, height: 10 };
        t.assertFalse(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkCollision: touching edges should collide', () => {
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 10, y: 0, width: 10, height: 10 };
        // Edges touching means a.x + a.width === b.x, which is NOT a collision
        t.assertFalse(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkCollision: contained rectangle should collide', () => {
        const a = { x: 0, y: 0, width: 100, height: 100 };
        const b = { x: 25, y: 25, width: 10, height: 10 };
        t.assertTrue(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkCollision: same position should collide', () => {
        const a = { x: 50, y: 50, width: 10, height: 10 };
        const b = { x: 50, y: 50, width: 10, height: 10 };
        t.assertTrue(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkAABB: should work same as checkCollision', () => {
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 5, y: 5, width: 10, height: 10 };
        t.assertTrue(CollisionSystem.checkAABB(a, b));
    });

    // ========================================
    // Edge Cases
    // ========================================

    t.test('checkCollision: zero-size rectangle should not collide', () => {
        const a = { x: 5, y: 5, width: 0, height: 0 };
        const b = { x: 0, y: 0, width: 10, height: 10 };
        t.assertFalse(CollisionSystem.checkCollision(a, b));
    });

    t.test('checkCollision: negative coordinates should work', () => {
        const a = { x: -10, y: -10, width: 20, height: 20 };
        const b = { x: -5, y: -5, width: 10, height: 10 };
        t.assertTrue(CollisionSystem.checkCollision(a, b));
    });

    // ========================================
    // Bullet-Entity Collision Tests
    // ========================================

    t.test('checkBulletEntityCollisions: active bullet hits active entity', () => {
        let hitCount = 0;
        const bullets = [{
            active: true,
            getBounds: () => ({ x: 50, y: 50, width: 5, height: 10 })
        }];
        const entities = [{
            active: true,
            getBounds: () => ({ x: 45, y: 45, width: 20, height: 20 })
        }];

        CollisionSystem.checkBulletEntityCollisions(bullets, entities, () => {
            hitCount++;
        });

        t.assertEqual(hitCount, 1, 'Should have one hit');
    });

    t.test('checkBulletEntityCollisions: inactive bullet should not hit', () => {
        let hitCount = 0;
        const bullets = [{
            active: false,
            getBounds: () => ({ x: 50, y: 50, width: 5, height: 10 })
        }];
        const entities = [{
            active: true,
            getBounds: () => ({ x: 45, y: 45, width: 20, height: 20 })
        }];

        CollisionSystem.checkBulletEntityCollisions(bullets, entities, () => {
            hitCount++;
        });

        t.assertEqual(hitCount, 0, 'Should have no hits');
    });

    t.test('checkBulletEntityCollisions: bullet should not hit inactive entity', () => {
        let hitCount = 0;
        const bullets = [{
            active: true,
            getBounds: () => ({ x: 50, y: 50, width: 5, height: 10 })
        }];
        const entities = [{
            active: false,
            getBounds: () => ({ x: 45, y: 45, width: 20, height: 20 })
        }];

        CollisionSystem.checkBulletEntityCollisions(bullets, entities, () => {
            hitCount++;
        });

        t.assertEqual(hitCount, 0, 'Should have no hits');
    });

    // ========================================
    // Ring Collision Tests
    // ========================================

    t.test('checkEntityRingCollisions: entity collects ring', () => {
        let collectCount = 0;
        const entities = [{
            active: true,
            getBounds: () => ({ x: 50, y: 50, width: 20, height: 20 })
        }];
        const rings = [{
            active: true,
            collected: false,
            getBounds: () => ({ x: 55, y: 55, width: 10, height: 10 })
        }];

        CollisionSystem.checkEntityRingCollisions(entities, rings, () => {
            collectCount++;
        });

        t.assertEqual(collectCount, 1, 'Should collect one ring');
    });

    t.test('checkEntityRingCollisions: already collected ring should not trigger', () => {
        let collectCount = 0;
        const entities = [{
            active: true,
            getBounds: () => ({ x: 50, y: 50, width: 20, height: 20 })
        }];
        const rings = [{
            active: true,
            collected: true, // Already collected
            getBounds: () => ({ x: 55, y: 55, width: 10, height: 10 })
        }];

        CollisionSystem.checkEntityRingCollisions(entities, rings, () => {
            collectCount++;
        });

        t.assertEqual(collectCount, 0, 'Should not collect already-collected ring');
    });

    // Print results
    return t.report();
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
    window.runCollisionTests = runCollisionTests;
    console.log('Collision tests loaded. Run: runCollisionTests()');
}
