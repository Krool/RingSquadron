// Haptic Feedback System for Mobile
export class HapticSystem {
    constructor() {
        this.enabled = true;
        this.supported = this.checkSupport();
    }

    checkSupport() {
        return 'vibrate' in navigator;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    vibrate(pattern) {
        if (!this.enabled || !this.supported) return;

        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Silently fail if vibration not available
        }
    }

    // Light tap - for button presses, collecting items
    light() {
        this.vibrate(10);
    }

    // Medium feedback - for shooting, minor events
    medium() {
        this.vibrate(25);
    }

    // Heavy feedback - for explosions, damage taken
    heavy() {
        this.vibrate(50);
    }

    // Double tap - for power-ups, level up
    doubleTap() {
        this.vibrate([20, 50, 20]);
    }

    // Success pattern - for completing wave, getting high score
    success() {
        this.vibrate([30, 50, 30, 50, 60]);
    }

    // Warning pattern - for low health
    warning() {
        this.vibrate([50, 100, 50]);
    }

    // Error/Death pattern - for game over
    error() {
        this.vibrate([100, 50, 100, 50, 200]);
    }

    // Boss encounter
    bossAppear() {
        this.vibrate([30, 30, 30, 30, 30, 30, 100]);
    }

    // Ring collect - quick light tap
    ringCollect() {
        this.vibrate(8);
    }

    // Enemy kill
    enemyKill() {
        this.vibrate(15);
    }

    // Ally join
    allyJoin() {
        this.vibrate([15, 30, 15]);
    }

    // Ally lost
    allyLost() {
        this.vibrate([40, 30, 20]);
    }

    // Player hit
    playerHit() {
        this.vibrate(60);
    }

    // Shop purchase
    purchase() {
        this.vibrate([10, 20, 10]);
    }

    // Wave complete
    waveComplete() {
        this.vibrate([20, 40, 20, 40, 40]);
    }

    // Combo milestone
    comboMilestone() {
        this.vibrate([15, 20, 15, 20, 30]);
    }

    // Nuke power-up
    nuke() {
        this.vibrate([20, 20, 20, 20, 20, 20, 150]);
    }

    // Boss defeated
    bossDefeated() {
        this.vibrate([50, 30, 50, 30, 50, 30, 100, 50, 150]);
    }

    // Cancel any ongoing vibration
    cancel() {
        if (this.supported) {
            try {
                navigator.vibrate(0);
            } catch (e) {
                // Silently fail
            }
        }
    }
}
