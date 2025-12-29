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

    // Check player bullets vs walls
    // Returns array of {bullet, wall} pairs that hit (for effects)
    static checkPlayerBulletWallCollisions(bullets, walls, onHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active || !bullet.isPlayerBullet) continue;

            const bulletBounds = bullet.getBounds();

            for (const wall of walls) {
                if (!wall.active) continue;

                // Check if this wall type blocks player bullets
                if (!wall.blocksPlayerBullets()) continue;

                const wallBounds = wall.getBounds();
                if (this.checkCollision(bulletBounds, wallBounds)) {
                    bullet.active = false;

                    // Handle destructible walls
                    if (wall.typeData.destructible) {
                        const destroyed = wall.takeDamage(bullet.damage || 1);
                        if (onHit) onHit(bullet, wall, destroyed);
                    }
                    // Handle pushable walls
                    else if (wall.typeData.pushable) {
                        wall.push(2);
                        if (onHit) onHit(bullet, wall, false);
                    }
                    // Normal wall hit
                    else if (onHit) {
                        onHit(bullet, wall, false);
                    }
                    break;
                }
            }
        }
    }

    // Check enemy bullets vs walls
    static checkEnemyBulletWallCollisions(bullets, walls, onHit) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet.active || bullet.isPlayerBullet) continue;

            const bulletBounds = bullet.getBounds();

            for (const wall of walls) {
                if (!wall.active) continue;

                // Check if this wall type blocks enemy bullets
                if (!wall.blocksEnemyBullets()) continue;

                const wallBounds = wall.getBounds();
                if (this.checkCollision(bulletBounds, wallBounds)) {
                    bullet.active = false;
                    if (onHit) onHit(bullet, wall);
                    break;
                }
            }
        }
    }

    // Legacy method for backwards compatibility
    static checkBulletWallCollisions(bullets, walls) {
        // Split into player and enemy bullets
        const playerBullets = bullets.filter(b => b.isPlayerBullet);
        const enemyBullets = bullets.filter(b => !b.isPlayerBullet);

        this.checkPlayerBulletWallCollisions(playerBullets, walls);
        this.checkEnemyBulletWallCollisions(enemyBullets, walls);
    }

    // Check player collision with walls
    // Returns { hit: boolean, wall: Wall|null, boost: boolean }
    static checkPlayerWallCollision(player, walls) {
        if (!player.active) return { hit: false, wall: null, boost: false };

        const playerBounds = player.getBounds();

        for (const wall of walls) {
            if (!wall.active) continue;

            const wallBounds = wall.getBounds();
            if (this.checkCollision(playerBounds, wallBounds)) {
                // Check if it's a boost wall
                if (wall.isBoost()) {
                    return { hit: false, wall: wall, boost: true };
                }
                // Check if this wall blocks player
                if (wall.blocksPlayer()) {
                    return { hit: true, wall: wall, boost: false };
                }
            }
        }
        return { hit: false, wall: null, boost: false };
    }

    // Check ally collision with walls (allies destroyed by blocking walls)
    static checkAllyWallCollisions(allies, walls, onHit) {
        for (const ally of allies) {
            if (!ally.active) continue;

            const allyBounds = ally.getBounds();

            for (const wall of walls) {
                if (!wall.active) continue;

                // Only solid-type walls destroy allies
                if (!wall.blocksPlayer()) continue;

                const wallBounds = wall.getBounds();
                if (this.checkCollision(allyBounds, wallBounds)) {
                    onHit(ally, wall);
                    break;
                }
            }
        }
    }

    // Check pushable walls colliding with other walls
    static checkWallWallCollisions(walls) {
        for (const wall of walls) {
            if (!wall.active || !wall.typeData.pushable) continue;

            for (const otherWall of walls) {
                if (wall.checkWallCollision(otherWall)) {
                    // Collision handled inside checkWallCollision
                }
            }
        }
    }
}
