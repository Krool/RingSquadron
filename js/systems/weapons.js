/**
 * Weapon System - Multiple Weapon Types
 *
 * Weapons: BASIC, SPREAD3, RAPID, HEAVY, DUAL, LASER, HOMING, BURST
 * Each has unique fireRate, damage, and firing pattern.
 *
 * @module systems/weapons
 */
import { Bullet } from '../entities/bullet.js';

export const WEAPONS = {
    BASIC: {
        name: 'Blaster',
        description: 'Standard weapon',
        fireRate: 150,
        damage: 10,
        unlocked: true,
        cost: 0,
        pattern: 'single'
    },
    DOUBLE: {
        name: 'Twin Blaster',
        description: 'Two parallel shots',
        fireRate: 180,
        damage: 8,
        unlocked: false,
        cost: 200,
        pattern: 'double'
    },
    SPREAD: {
        name: 'Spread Gun',
        description: 'Wide 3-shot spread',
        fireRate: 200,
        damage: 7,
        unlocked: false,
        cost: 350,
        pattern: 'spread3'
    },
    RAPID: {
        name: 'Rapid Fire',
        description: 'Very fast single shots',
        fireRate: 80,
        damage: 6,
        unlocked: false,
        cost: 400,
        pattern: 'single'
    },
    CANNON: {
        name: 'Cannon',
        description: 'Slow but powerful',
        fireRate: 400,
        damage: 30,
        unlocked: false,
        cost: 500,
        pattern: 'cannon'
    },
    LASER: {
        name: 'Laser',
        description: 'Piercing beam',
        fireRate: 250,
        damage: 12,
        unlocked: false,
        cost: 600,
        pattern: 'laser'
    },
    WAVE: {
        name: 'Wave Gun',
        description: 'Wavy projectiles',
        fireRate: 170,
        damage: 9,
        unlocked: false,
        cost: 450,
        pattern: 'wave'
    },
    HOMING: {
        name: 'Seeker',
        description: 'Homing missiles',
        fireRate: 350,
        damage: 15,
        unlocked: false,
        cost: 750,
        pattern: 'homing'
    }
};

export class WeaponSystem {
    constructor() {
        this.currentWeapon = 'BASIC';
        this.unlockedWeapons = ['BASIC'];
        this.lastFireTime = 0;
    }

    getCurrentWeapon() {
        return WEAPONS[this.currentWeapon];
    }

    getFireRate(powerUpMultiplier = 1) {
        return this.getCurrentWeapon().fireRate * powerUpMultiplier;
    }

    getDamage(upgradeBonus = 0) {
        return this.getCurrentWeapon().damage + upgradeBonus;
    }

    canFire(currentTime, powerUpMultiplier = 1) {
        const fireRate = this.getFireRate(powerUpMultiplier);
        return currentTime - this.lastFireTime >= fireRate;
    }

    fire(x, y, currentTime, upgradeBonus = 0, spreadShotActive = false) {
        this.lastFireTime = currentTime;
        const weapon = this.getCurrentWeapon();
        const damage = this.getDamage(upgradeBonus);
        const bullets = [];

        // Check if spread shot power-up modifies the pattern
        let pattern = weapon.pattern;
        if (spreadShotActive && pattern === 'single') {
            pattern = 'spread3';
        }

        switch (pattern) {
            case 'single':
                bullets.push(this.createBullet(x, y, 0, -1, damage));
                break;

            case 'double':
                bullets.push(this.createBullet(x - 8, y, 0, -1, damage));
                bullets.push(this.createBullet(x + 8, y, 0, -1, damage));
                break;

            case 'spread3':
                bullets.push(this.createBullet(x, y, 0, -1, damage));
                bullets.push(this.createBullet(x - 5, y, -0.15, -1, damage * 0.8));
                bullets.push(this.createBullet(x + 5, y, 0.15, -1, damage * 0.8));
                break;

            case 'cannon':
                const cannon = this.createBullet(x, y, 0, -1, damage);
                cannon.size = 8;
                cannon.piercing = false;
                bullets.push(cannon);
                break;

            case 'laser':
                const laser = this.createBullet(x, y, 0, -1, damage);
                laser.piercing = true;
                laser.isLaser = true;
                laser.height = 30;
                bullets.push(laser);
                break;

            case 'wave':
                const wave = this.createBullet(x, y, 0, -1, damage);
                wave.waveMotion = true;
                wave.wavePhase = 0;
                bullets.push(wave);
                break;

            case 'homing':
                const homing = this.createBullet(x, y, 0, -0.5, damage);
                homing.homing = true;
                homing.turnSpeed = 0.08;
                bullets.push(homing);
                break;
        }

        return bullets;
    }

    createBullet(x, y, vx, vy, damage) {
        const bullet = new Bullet(x, y, true, damage);
        if (vx !== 0) {
            bullet.vx = vx * 12;
        }
        return bullet;
    }

    unlockWeapon(weaponKey) {
        if (!this.unlockedWeapons.includes(weaponKey)) {
            this.unlockedWeapons.push(weaponKey);
            return true;
        }
        return false;
    }

    isUnlocked(weaponKey) {
        return this.unlockedWeapons.includes(weaponKey);
    }

    switchWeapon(weaponKey) {
        if (this.isUnlocked(weaponKey)) {
            this.currentWeapon = weaponKey;
            return true;
        }
        return false;
    }

    cycleWeapon(direction = 1) {
        const currentIndex = this.unlockedWeapons.indexOf(this.currentWeapon);
        const newIndex = (currentIndex + direction + this.unlockedWeapons.length) % this.unlockedWeapons.length;
        this.currentWeapon = this.unlockedWeapons[newIndex];
        return this.currentWeapon;
    }

    getUnlockedWeapons() {
        return this.unlockedWeapons.map(key => ({
            key,
            ...WEAPONS[key],
            current: key === this.currentWeapon
        }));
    }

    getLockedWeapons() {
        return Object.entries(WEAPONS)
            .filter(([key]) => !this.unlockedWeapons.includes(key))
            .map(([key, weapon]) => ({
                key,
                ...weapon
            }));
    }

    serialize() {
        return {
            currentWeapon: this.currentWeapon,
            unlockedWeapons: [...this.unlockedWeapons]
        };
    }

    deserialize(data) {
        if (data) {
            this.currentWeapon = data.currentWeapon || 'BASIC';
            this.unlockedWeapons = data.unlockedWeapons || ['BASIC'];
            // Ensure current weapon is unlocked
            if (!this.isUnlocked(this.currentWeapon)) {
                this.currentWeapon = 'BASIC';
            }
        }
    }
}

// Weapon Select UI
export class WeaponSelectUI {
    constructor(weaponSystem) {
        this.weaponSystem = weaponSystem;
        this.visible = false;
        this.selectedIndex = 0;
    }

    show() {
        this.visible = true;
        const weapons = this.weaponSystem.getUnlockedWeapons();
        this.selectedIndex = weapons.findIndex(w => w.current);
        if (this.selectedIndex < 0) this.selectedIndex = 0;
    }

    hide() {
        this.visible = false;
    }

    moveSelection(direction) {
        const weapons = this.weaponSystem.getUnlockedWeapons();
        this.selectedIndex = (this.selectedIndex + direction + weapons.length) % weapons.length;
    }

    selectCurrent() {
        const weapons = this.weaponSystem.getUnlockedWeapons();
        if (weapons[this.selectedIndex]) {
            this.weaponSystem.switchWeapon(weapons[this.selectedIndex].key);
        }
    }

    draw(ctx, canvasWidth, canvasHeight, fontFamily) {
        if (!this.visible) return;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;
        let y = 80;

        // Title
        ctx.fillStyle = '#00ffff';
        ctx.font = `bold 18px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('SELECT WEAPON', centerX, y);

        y += 40;

        // Weapons list
        const weapons = this.weaponSystem.getUnlockedWeapons();
        weapons.forEach((weapon, index) => {
            const isSelected = index === this.selectedIndex;

            // Highlight
            if (isSelected) {
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.fillRect(30, y - 12, canvasWidth - 60, 40);
            }

            // Weapon name
            ctx.fillStyle = isSelected ? '#00ffff' : (weapon.current ? '#88ff88' : '#ffffff');
            ctx.font = `bold 14px ${fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText(weapon.name, 50, y);

            // Current indicator
            if (weapon.current) {
                ctx.fillStyle = '#88ff88';
                ctx.font = `10px ${fontFamily}`;
                ctx.textAlign = 'right';
                ctx.fillText('[EQUIPPED]', canvasWidth - 50, y);
            }

            // Description
            ctx.fillStyle = '#aaaaaa';
            ctx.font = `10px ${fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText(weapon.description, 50, y + 15);

            // Stats
            ctx.fillStyle = '#999999';
            ctx.fillText(`DMG: ${weapon.damage}  RATE: ${Math.round(1000 / weapon.fireRate)}/s`, 50, y + 28);

            y += 50;
        });

        // Instructions
        ctx.fillStyle = '#888888';
        ctx.font = `10px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('TAP to equip | SWIPE to navigate', centerX, canvasHeight - 30);
    }
}
