// Ally Cloud Formation System
import { CONFIG } from '../utils/config.js';

export class FormationSystem {
    constructor() {
        this.spacing = CONFIG.ALLY_FORMATION_SPACING;
        // Max width is 20% of screen width (reduced for tighter formation)
        this.maxWidth = CONFIG.GAME_WIDTH * 0.20;
        // Pre-generate cloud positions with some randomness
        this.cloudOffsets = [];
        this.generateCloudOffsets(250); // Support up to 250 allies
    }

    generateCloudOffsets(count) {
        this.cloudOffsets = [];
        const halfWidth = this.maxWidth / 2;

        for (let i = 0; i < count; i++) {
            // Create compact cloud shape behind player
            // Stack allies in rows within the 33% width constraint
            const row = Math.floor(i / 12); // 12 allies per row
            const col = i % 12;

            // Distribute across the width
            const xSpread = (col - 5.5) * (this.maxWidth / 12);

            // Add some randomness for organic feel
            const jitterX = (Math.random() - 0.5) * 4;
            const jitterY = (Math.random() - 0.5) * 3;

            // Clamp X to stay within bounds
            const x = Math.max(-halfWidth, Math.min(halfWidth, xSpread + jitterX));

            this.cloudOffsets.push({
                x: x,
                y: row * 8 + jitterY + 15 // Stack rows behind player
            });
        }
    }

    // Calculate formation positions relative to player
    // Uses cloud formation behind the player
    getFormationPosition(playerX, playerY, formationIndex) {
        if (formationIndex >= this.cloudOffsets.length) {
            this.generateCloudOffsets(formationIndex + 10);
        }

        const offset = this.cloudOffsets[formationIndex];
        return {
            x: playerX + offset.x,
            y: playerY + offset.y + 20 // Offset behind player
        };
    }

    // Get all formation positions for a given number of allies
    getAllPositions(playerX, playerY, allyCount) {
        const positions = [];
        for (let i = 0; i < allyCount; i++) {
            positions.push(this.getFormationPosition(playerX, playerY, i));
        }
        return positions;
    }

    // Reassign formation indices when an ally is destroyed
    reassignFormations(allies) {
        let index = 0;
        for (const ally of allies) {
            if (ally.active) {
                ally.formationIndex = index;
                index++;
            }
        }
    }
}
