/**
 * Collision Detection System
 *
 * Provides AABB (Axis-Aligned Bounding Box) collision detection.
 * All methods are static for stateless operation.
 *
 * @module systems/collision
 */
export class CollisionSystem {
    // Check if two rectangles overlap (AABB collision)
    static checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // Alias for AABB collision check
    static checkAABB(a, b) {
        return this.checkCollision(a, b);
    }

    // Check bullet vs entity collision
    static checkBulletCollisions(bullets, entities, onHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active) continue;

            const bulletBounds = bullet.getBounds();

            for (let j = entities.length - 1; j >= 0; j--) {
                const entity = entities[j];
                if (!entity.active) continue;

                const entityBounds = entity.getBounds();

                if (this.checkCollision(bulletBounds, entityBounds)) {
                    bullet.active = false;
                    onHit(bullet, entity, j);
                    break;
                }
            }
        }
    }

    // Check player bullet vs ring collision (for increasing ring value)
    // Bullets pass THROUGH rings - they don't get destroyed
    static checkBulletRingCollisions(bullets, rings, onHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active || !bullet.isPlayerBullet) continue;

            // Track which rings this bullet has already hit this frame
            if (!bullet.hitRings) bullet.hitRings = new Set();

            const bulletBounds = bullet.getBounds();

            for (let j = rings.length - 1; j >= 0; j--) {
                const ring = rings[j];
                if (!ring.active) continue;

                // Skip if already hit this ring
                if (bullet.hitRings.has(ring)) continue;

                // Use smaller bounds for bullet-ring collision
                const ringBounds = ring.getBulletBounds();

                if (this.checkCollision(bulletBounds, ringBounds)) {
                    // Mark ring as hit by this bullet (prevent double-counting)
                    bullet.hitRings.add(ring);
                    // Bullet passes through - NOT deactivated
                    onHit(bullet, ring, j);
                }
            }
        }
    }

    // Check player/ally vs ring collision (for collecting)
    static checkEntityRingCollisions(entities, rings, onCollect) {
        for (const entity of entities) {
            if (!entity.active) continue;

            const entityBounds = entity.getBounds();

            for (let j = rings.length - 1; j >= 0; j--) {
                const ring = rings[j];
                if (!ring.active) continue;

                const ringBounds = ring.getBounds();

                if (this.checkCollision(entityBounds, ringBounds)) {
                    onCollect(entity, ring, j);
                }
            }
        }
    }

    // Check enemy bullet vs player/allies
    static checkEnemyBulletCollisions(bullets, player, allies, onPlayerHit, onAllyHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active || bullet.isPlayerBullet) continue;

            const bulletBounds = bullet.getBounds();

            // Check vs player
            if (player.active) {
                const playerBounds = player.getBounds();
                if (this.checkCollision(bulletBounds, playerBounds)) {
                    bullet.active = false;
                    onPlayerHit(bullet);
                    continue;
                }
            }

            // Check vs allies
            for (let j = allies.length - 1; j >= 0; j--) {
                const ally = allies[j];
                if (!ally.active) continue;

                const allyBounds = ally.getBounds();
                if (this.checkCollision(bulletBounds, allyBounds)) {
                    bullet.active = false;
                    onAllyHit(bullet, ally, j);
                    break;
                }
            }
        }
    }

    // Check enemy vs player/allies collision (ramming)
    static checkEnemyEntityCollisions(enemies, player, allies, onPlayerHit, onAllyHit) {
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const enemyBounds = enemy.getBounds();

            // Check vs player
            if (player.active) {
                const playerBounds = player.getBounds();
                if (this.checkCollision(enemyBounds, playerBounds)) {
                    onPlayerHit(enemy);
                }
            }

            // Check vs allies
            for (let j = allies.length - 1; j >= 0; j--) {
                const ally = allies[j];
                if (!ally.active) continue;

                const allyBounds = ally.getBounds();
                if (this.checkCollision(enemyBounds, allyBounds)) {
                    onAllyHit(enemy, ally, j);
                }
            }
        }
    }

    // Check bullets vs walls (bullets get destroyed, walls are indestructible)
    static checkBulletWallCollisions(bullets, walls) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active) continue;

            const bulletBounds = bullet.getBounds();

            for (const wall of walls) {
                if (!wall.active) continue;

                const wallBounds = wall.getBounds();
                if (this.checkCollision(bulletBounds, wallBounds)) {
                    bullet.active = false; // Wall blocks ALL bullets
                    break;
                }
            }
        }
    }

    // Check player collision with walls (instant death)
    static checkPlayerWallCollision(player, walls) {
        if (!player.active) return false;

        const playerBounds = player.getBounds();

        for (const wall of walls) {
            if (!wall.active) continue;

            const wallBounds = wall.getBounds();
            if (this.checkCollision(playerBounds, wallBounds)) {
                return true; // Player hit wall
            }
        }
        return false;
    }

    // Check ally collision with walls (allies destroyed)
    static checkAllyWallCollisions(allies, walls, onHit) {
        for (const ally of allies) {
            if (!ally.active) continue;

            const allyBounds = ally.getBounds();

            for (const wall of walls) {
                if (!wall.active) continue;

                const wallBounds = wall.getBounds();
                if (this.checkCollision(allyBounds, wallBounds)) {
                    onHit(ally);
                    break;
                }
            }
        }
    }
}
