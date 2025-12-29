// Shop & Upgrade System
import { CONFIG } from '../utils/config.js';

export const UPGRADES = {
    maxHealth: {
        name: 'Max Health',
        description: '+25 HP',
        baseCost: 50,
        costMultiplier: 1.5,
        maxLevel: 10,
        effect: (player, level) => {
            player.maxHealth = CONFIG.PLAYER_HEALTH + (level * 25);
            player.health = Math.min(player.health + 25, player.maxHealth);
        }
    },
    fireRate: {
        name: 'Fire Rate',
        description: '-15ms delay',
        baseCost: 75,
        costMultiplier: 1.6,
        maxLevel: 8,
        effect: (player, level) => {
            player.fireRate = Math.max(50, CONFIG.PLAYER_FIRE_RATE - (level * 15));
        }
    },
    damage: {
        name: 'Damage',
        description: '+3 damage',
        baseCost: 100,
        costMultiplier: 1.7,
        maxLevel: 10,
        effect: (player, level) => {
            player.bulletDamage = CONFIG.PLAYER_BULLET_DAMAGE + (level * 3);
        }
    },
    speed: {
        name: 'Speed',
        description: '+1 speed',
        baseCost: 60,
        costMultiplier: 1.4,
        maxLevel: 5,
        effect: (player, level) => {
            player.speed = CONFIG.PLAYER_SPEED + level;
        }
    },
    allyHealth: {
        name: 'Ally Health',
        description: '+15 ally HP',
        baseCost: 80,
        costMultiplier: 1.5,
        maxLevel: 6,
        apply: (level) => level * 15 // Returns bonus to add
    },
    allyDamage: {
        name: 'Ally Damage',
        description: '+2 ally damage',
        baseCost: 90,
        costMultiplier: 1.6,
        maxLevel: 6,
        apply: (level) => level * 2
    }
};

export class ShopSystem {
    constructor() {
        this.levels = {};
        this.isOpen = false;

        // Initialize all upgrade levels to 0
        for (const key of Object.keys(UPGRADES)) {
            this.levels[key] = 0;
        }
    }

    getUpgradeCost(upgradeKey) {
        const upgrade = UPGRADES[upgradeKey];
        const level = this.levels[upgradeKey];
        if (level >= upgrade.maxLevel) return Infinity;
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
    }

    canAfford(upgradeKey, gold) {
        return gold >= this.getUpgradeCost(upgradeKey);
    }

    canUpgrade(upgradeKey) {
        const upgrade = UPGRADES[upgradeKey];
        return this.levels[upgradeKey] < upgrade.maxLevel;
    }

    purchase(upgradeKey, gold) {
        const cost = this.getUpgradeCost(upgradeKey);
        if (gold >= cost && this.canUpgrade(upgradeKey)) {
            this.levels[upgradeKey]++;
            return cost;
        }
        return 0;
    }

    applyUpgrades(player) {
        for (const [key, upgrade] of Object.entries(UPGRADES)) {
            if (upgrade.effect && this.levels[key] > 0) {
                upgrade.effect(player, this.levels[key]);
            }
        }
    }

    getAllyHealthBonus() {
        return UPGRADES.allyHealth.apply(this.levels.allyHealth);
    }

    getAllyDamageBonus() {
        return UPGRADES.allyDamage.apply(this.levels.allyDamage);
    }

    getUpgradeList() {
        return Object.entries(UPGRADES).map(([key, upgrade]) => ({
            key,
            name: upgrade.name,
            description: upgrade.description,
            level: this.levels[key],
            maxLevel: upgrade.maxLevel,
            cost: this.getUpgradeCost(key),
            canUpgrade: this.canUpgrade(key)
        }));
    }

    // Serialize for saving
    serialize() {
        return { ...this.levels };
    }

    // Deserialize from save
    deserialize(data) {
        if (data) {
            for (const key of Object.keys(UPGRADES)) {
                this.levels[key] = data[key] || 0;
            }
        }
    }

    reset() {
        for (const key of Object.keys(UPGRADES)) {
            this.levels[key] = 0;
        }
    }
}

// Shop UI Renderer
export class ShopUI {
    constructor(shop) {
        this.shop = shop;
        this.selectedIndex = 0;
        this.visible = false;
    }

    show() {
        this.visible = true;
        this.selectedIndex = 0;
    }

    hide() {
        this.visible = false;
    }

    moveSelection(direction) {
        const upgrades = this.shop.getUpgradeList();
        this.selectedIndex = (this.selectedIndex + direction + upgrades.length) % upgrades.length;
    }

    getSelectedUpgrade() {
        const upgrades = this.shop.getUpgradeList();
        return upgrades[this.selectedIndex];
    }

    draw(ctx, gold, canvasWidth, canvasHeight) {
        if (!this.visible) return;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;
        let y = 60;

        // Title
        ctx.fillStyle = '#ffdd00';
        ctx.font = `bold 20px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('UPGRADE SHOP', centerX, y);

        // Gold display
        y += 30;
        ctx.fillStyle = '#ffd700';
        ctx.font = `16px ${CONFIG.FONT_FAMILY}`;
        ctx.fillText(`Gold: ${gold}`, centerX, y);

        // Upgrades list
        const upgrades = this.shop.getUpgradeList();
        y += 40;

        upgrades.forEach((upgrade, index) => {
            const isSelected = index === this.selectedIndex;
            const canAfford = gold >= upgrade.cost && upgrade.canUpgrade;

            // Selection highlight
            if (isSelected) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(20, y - 15, canvasWidth - 40, 50);
            }

            // Upgrade name
            ctx.fillStyle = isSelected ? '#ffffff' : '#aaaaaa';
            ctx.font = `14px ${CONFIG.FONT_FAMILY}`;
            ctx.textAlign = 'left';
            ctx.fillText(upgrade.name, 40, y);

            // Level bar
            const barX = 40;
            const barY = y + 8;
            const barWidth = 100;
            const barHeight = 8;

            ctx.fillStyle = '#333333';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = upgrade.level >= upgrade.maxLevel ? '#00ff00' : '#00aa88';
            ctx.fillRect(barX, barY, (upgrade.level / upgrade.maxLevel) * barWidth, barHeight);

            ctx.strokeStyle = '#888888';
            ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Level text
            ctx.fillStyle = '#aaaaaa';
            ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText(`${upgrade.level}/${upgrade.maxLevel}`, barX + barWidth + 10, barY + 7);

            // Cost / MAX
            ctx.textAlign = 'right';
            if (upgrade.level >= upgrade.maxLevel) {
                ctx.fillStyle = '#00ff00';
                ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
                ctx.fillText('MAX', canvasWidth - 40, y);
            } else {
                ctx.fillStyle = canAfford ? '#ffd700' : '#ff4444';
                ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
                ctx.fillText(`${upgrade.cost}g`, canvasWidth - 40, y);
            }

            // Description
            ctx.textAlign = 'left';
            ctx.fillStyle = '#999999';
            ctx.font = `10px ${CONFIG.FONT_FAMILY}`;
            ctx.fillText(upgrade.description, 40, y + 25);

            y += 55;
        });

        // Instructions
        y = canvasHeight - 60;
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `12px ${CONFIG.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('TAP to purchase | SWIPE to navigate', centerX, y);
        ctx.fillText('TAP outside to close', centerX, y + 20);
    }
}
