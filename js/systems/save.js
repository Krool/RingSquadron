// Save System - LocalStorage persistence
export class SaveSystem {
    constructor() {
        this.storageKey = 'ringSquadron_save';
        this.highScoreKey = 'ringSquadron_highscores';
        this.levelScoreKey = 'ringSquadron_levelscores';
        this.settingsKey = 'ringSquadron_settings';
    }

    // === Game Progress Save ===
    saveProgress(data) {
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                gold: data.gold || 0,
                totalGold: data.totalGold || 0,
                highestWave: data.highestWave || 1,
                totalKills: data.totalKills || 0,
                totalRingsCollected: data.totalRingsCollected || 0,
                upgrades: data.upgrades || {},
                unlockedWeapons: data.unlockedWeapons || ['BASIC'],
                achievements: data.achievements || [],
                maxCombo: data.maxCombo || 0,
                settings: data.settings || {}
            };
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            return true;
        } catch (e) {
            console.warn('Failed to save progress:', e);
            return false;
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                return data;
            }
        } catch (e) {
            console.warn('Failed to load progress:', e);
        }
        return null;
    }

    hasProgress() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    clearProgress() {
        localStorage.removeItem(this.storageKey);
    }

    // === High Scores ===
    saveHighScore(entry) {
        try {
            const scores = this.getHighScores();
            scores.push({
                score: entry.score,
                wave: entry.wave,
                kills: entry.kills,
                date: Date.now(),
                gameMode: entry.gameMode || 'endless'
            });

            // Sort by score descending, keep top 10
            scores.sort((a, b) => b.score - a.score);
            const topScores = scores.slice(0, 10);

            localStorage.setItem(this.highScoreKey, JSON.stringify(topScores));
            return topScores.findIndex(s => s.date === entry.date) + 1; // Return rank
        } catch (e) {
            console.warn('Failed to save high score:', e);
            return -1;
        }
    }

    getHighScores() {
        try {
            const saved = localStorage.getItem(this.highScoreKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load high scores:', e);
        }
        return [];
    }

    isHighScore(score) {
        const scores = this.getHighScores();
        if (scores.length < 10) return true;
        return score > scores[scores.length - 1].score;
    }

    // === Level-Specific High Scores ===
    saveLevelScore(mode, levelId, scoreData) {
        try {
            const levelScores = this.getLevelScores();
            const key = `${mode}_${levelId}`;

            const newEntry = {
                score: scoreData.score || 0,
                wave: scoreData.wave || 0,
                time: scoreData.time || 0,
                stars: this.calculateStars(mode, scoreData),
                date: Date.now()
            };

            // Only save if better than existing
            const existing = levelScores[key];
            if (!existing || newEntry.score > existing.score) {
                levelScores[key] = newEntry;
                localStorage.setItem(this.levelScoreKey, JSON.stringify(levelScores));
                return true; // New high score!
            }

            return false;
        } catch (e) {
            console.warn('Failed to save level score:', e);
            return false;
        }
    }

    getLevelScores() {
        try {
            const saved = localStorage.getItem(this.levelScoreKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load level scores:', e);
        }
        return {};
    }

    getLevelScore(mode, levelId) {
        const levelScores = this.getLevelScores();
        return levelScores[`${mode}_${levelId}`] || null;
    }

    getLevelStars(mode, levelId) {
        const score = this.getLevelScore(mode, levelId);
        return score ? score.stars : 0;
    }

    calculateStars(mode, scoreData) {
        // Different star thresholds per mode
        switch (mode) {
            case 'endless':
                // Stars based on wave reached
                if (scoreData.wave >= 20) return 3;
                if (scoreData.wave >= 10) return 2;
                if (scoreData.wave >= 5) return 1;
                return 0;

            case 'campaign':
                // Stars based on score threshold
                if (scoreData.score >= 10000) return 3;
                if (scoreData.score >= 5000) return 2;
                if (scoreData.score >= 1000) return 1;
                return 0;

            case 'rush':
                // Stars based on kills in time limit
                if (scoreData.kills >= 100) return 3;
                if (scoreData.kills >= 50) return 2;
                if (scoreData.kills >= 25) return 1;
                return 0;

            case 'survival':
                // Stars based on time survived
                if (scoreData.time >= 180) return 3; // 3 minutes
                if (scoreData.time >= 90) return 2;  // 1.5 minutes
                if (scoreData.time >= 45) return 1;  // 45 seconds
                return 0;

            case 'boss':
                // Stars based on completion and damage taken
                if (scoreData.bossDefeated && scoreData.healthRemaining >= 75) return 3;
                if (scoreData.bossDefeated && scoreData.healthRemaining >= 50) return 2;
                if (scoreData.bossDefeated) return 1;
                return 0;

            default:
                return scoreData.score >= 1000 ? 1 : 0;
        }
    }

    isLevelHighScore(mode, levelId, score) {
        const existing = this.getLevelScore(mode, levelId);
        return !existing || score > existing.score;
    }

    // Get best scores for display on mode select
    getModeHighScores() {
        const levelScores = this.getLevelScores();
        const modeBests = {};

        for (const [key, data] of Object.entries(levelScores)) {
            const [mode, levelId] = key.split('_');
            if (!modeBests[mode] || data.score > modeBests[mode].score) {
                modeBests[mode] = data;
            }
        }

        return modeBests;
    }

    // === Settings ===
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.warn('Failed to save settings:', e);
            return false;
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem(this.settingsKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return {
            musicEnabled: true,
            sfxEnabled: true,
            hapticEnabled: true,
            showFPS: false
        };
    }

    // === Statistics ===
    updateStatistics(stats) {
        const progress = this.loadProgress() || {};
        progress.totalGold = (progress.totalGold || 0) + (stats.goldEarned || 0);
        progress.totalKills = (progress.totalKills || 0) + (stats.kills || 0);
        progress.totalRingsCollected = (progress.totalRingsCollected || 0) + (stats.ringsCollected || 0);

        if (stats.wave > (progress.highestWave || 0)) {
            progress.highestWave = stats.wave;
        }
        if (stats.maxCombo > (progress.maxCombo || 0)) {
            progress.maxCombo = stats.maxCombo;
        }

        this.saveProgress(progress);
    }

    getStatistics() {
        const progress = this.loadProgress() || {};
        return {
            totalGold: progress.totalGold || 0,
            totalKills: progress.totalKills || 0,
            totalRingsCollected: progress.totalRingsCollected || 0,
            highestWave: progress.highestWave || 1,
            maxCombo: progress.maxCombo || 0,
            gamesPlayed: this.getHighScores().length
        };
    }
}

// High Score Display UI
export class HighScoreUI {
    constructor(saveSystem) {
        this.saveSystem = saveSystem;
        this.visible = false;
        this.selectedIndex = 0;
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    draw(ctx, canvasWidth, canvasHeight, fontFamily) {
        if (!this.visible) return;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;
        let y = 50;

        // Title
        ctx.fillStyle = '#ffdd00';
        ctx.font = `bold 20px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', centerX, y);

        // Scores list
        const scores = this.saveSystem.getHighScores();
        y += 40;

        if (scores.length === 0) {
            ctx.fillStyle = '#888888';
            ctx.font = `14px ${fontFamily}`;
            ctx.fillText('No scores yet!', centerX, y);
            ctx.fillText('Play a game to set a record.', centerX, y + 25);
        } else {
            // Header
            ctx.fillStyle = '#888888';
            ctx.font = `10px ${fontFamily}`;
            ctx.textAlign = 'left';
            ctx.fillText('RANK', 30, y);
            ctx.fillText('SCORE', 80, y);
            ctx.fillText('WAVE', 160, y);
            ctx.fillText('KILLS', 210, y);

            y += 20;

            scores.forEach((score, index) => {
                const isRecent = Date.now() - score.date < 60000; // Within last minute
                ctx.fillStyle = isRecent ? '#ffff00' : '#ffffff';
                ctx.font = `12px ${fontFamily}`;
                ctx.textAlign = 'left';

                // Rank
                const rankSymbols = ['[1]', '[2]', '[3]'];
                const rankText = index < 3 ? rankSymbols[index] : `${index + 1}.`;
                ctx.fillText(rankText, 30, y);

                // Score
                ctx.fillText(score.score.toLocaleString(), 80, y);

                // Wave
                ctx.fillText(`W${score.wave}`, 160, y);

                // Kills
                ctx.fillText(score.kills, 210, y);

                y += 22;
            });
        }

        // Statistics section
        y = canvasHeight - 140;
        ctx.fillStyle = '#00aaff';
        ctx.font = `bold 14px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText('STATISTICS', centerX, y);

        const stats = this.saveSystem.getStatistics();
        y += 25;
        ctx.fillStyle = '#aaaaaa';
        ctx.font = `11px ${fontFamily}`;

        const statLines = [
            `Highest Wave: ${stats.highestWave}`,
            `Total Kills: ${stats.totalKills.toLocaleString()}`,
            `Total Gold: ${stats.totalGold.toLocaleString()}`,
            `Best Combo: ${stats.maxCombo}x`,
            `Games Played: ${stats.gamesPlayed}`
        ];

        statLines.forEach((line, i) => {
            ctx.fillText(line, centerX, y + i * 18);
        });

        // Close instruction
        ctx.fillStyle = '#666666';
        ctx.font = `10px ${fontFamily}`;
        ctx.fillText('TAP to close', centerX, canvasHeight - 20);
    }
}
