// Procedural Background Music Generator
export class MusicSystem {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.playing = false;
        this.muted = false;
        this.volume = 0.12;

        // Musical elements
        this.bpm = 120;
        this.beatInterval = null;
        this.currentBeat = 0;
        this.bars = 0;

        // Oscillators and nodes
        this.bassOsc = null;
        this.bassGain = null;
        this.padOsc1 = null;
        this.padOsc2 = null;
        this.padGain = null;
        this.arpOsc = null;
        this.arpGain = null;
        this.masterGain = null;
        this.compressor = null;

        // Musical scales (notes in Hz)
        this.scales = {
            minor: [65.41, 73.42, 77.78, 87.31, 98.00, 103.83, 116.54], // C minor
            major: [65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47]  // C major
        };
        this.currentScale = 'minor';

        // Chord progressions
        this.progressions = {
            minor: [0, 3, 4, 0, 0, 5, 4, 3], // i - iv - v - i - i - VI - v - iv
            intense: [0, 0, 3, 3, 4, 4, 5, 5]
        };
        this.currentProgression = 'minor';
        this.progressionIndex = 0;

        // Arpeggio patterns
        this.arpPatterns = [
            [0, 2, 4, 2],
            [0, 2, 4, 7],
            [0, 4, 2, 4],
            [0, 2, 0, 4]
        ];
        this.currentArpPattern = 0;
        this.arpIndex = 0;

        // Intensity (0-1) affects music complexity
        this.intensity = 0.5;
    }

    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();

            // Create master chain
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -24;
            this.compressor.knee.value = 30;
            this.compressor.ratio.value = 12;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.25;

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;

            this.masterGain.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);

            this.initialized = true;
        } catch (e) {
            console.warn('Music system not supported:', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : this.volume;
        }
    }

    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    // Set intensity based on gameplay (0-1)
    setIntensity(intensity) {
        this.intensity = Math.max(0, Math.min(1, intensity));
        // Adjust BPM based on intensity
        this.bpm = 100 + Math.floor(intensity * 40);
        // Switch to intense progression when high
        this.currentProgression = intensity > 0.7 ? 'intense' : 'minor';
    }

    start() {
        if (!this.initialized || this.playing) return;

        this.playing = true;
        this.currentBeat = 0;
        this.bars = 0;
        this.progressionIndex = 0;

        // Start the beat loop
        this.scheduleBeat();
    }

    stop() {
        this.playing = false;
        if (this.beatInterval) {
            clearTimeout(this.beatInterval);
            this.beatInterval = null;
        }
        this.stopAllSounds();
    }

    stopAllSounds() {
        try {
            if (this.bassOsc) {
                this.bassOsc.stop();
                this.bassOsc = null;
            }
            if (this.padOsc1) {
                this.padOsc1.stop();
                this.padOsc1 = null;
            }
            if (this.padOsc2) {
                this.padOsc2.stop();
                this.padOsc2 = null;
            }
            if (this.arpOsc) {
                this.arpOsc.stop();
                this.arpOsc = null;
            }
        } catch (e) {
            // Oscillators may already be stopped
        }
    }

    scheduleBeat() {
        if (!this.playing) return;

        const beatDuration = 60000 / this.bpm;
        const now = this.ctx.currentTime;

        // Get current chord from progression
        const progression = this.progressions[this.currentProgression];
        const chordRoot = this.currentBeat % 4 === 0 ?
            progression[this.progressionIndex % progression.length] : null;

        if (chordRoot !== null) {
            // New bar - update chord
            this.playBass(now, chordRoot);
            if (this.intensity > 0.3) {
                this.playPad(now, chordRoot);
            }
            if (this.currentBeat % 16 === 0) {
                this.progressionIndex++;
            }
        }

        // Arpeggio on every beat (or every other beat at low intensity)
        if (this.intensity > 0.2 && (this.intensity > 0.5 || this.currentBeat % 2 === 0)) {
            this.playArp(now);
        }

        // Hi-hat pattern
        if (this.intensity > 0.4) {
            this.playHiHat(now, this.currentBeat % 4 === 0);
        }

        // Kick on beats 1 and 3
        if (this.intensity > 0.5 && (this.currentBeat % 4 === 0 || this.currentBeat % 4 === 2)) {
            this.playKick(now);
        }

        this.currentBeat++;
        if (this.currentBeat % 4 === 0) {
            this.bars++;
        }

        // Schedule next beat
        this.beatInterval = setTimeout(() => this.scheduleBeat(), beatDuration / 4);
    }

    getNote(scaleIndex, octave = 0) {
        const scale = this.scales[this.currentScale];
        const noteIndex = ((scaleIndex % scale.length) + scale.length) % scale.length;
        return scale[noteIndex] * Math.pow(2, octave);
    }

    playBass(time, chordRoot) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 1;

        osc.type = 'sawtooth';
        osc.frequency.value = this.getNote(chordRoot, 0);

        const vol = this.volume * 0.6;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(vol * 0.3, time + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playPad(time, chordRoot) {
        // Play a chord (root, third, fifth)
        const notes = [
            this.getNote(chordRoot, 1),
            this.getNote(chordRoot + 2, 1),
            this.getNote(chordRoot + 4, 1)
        ];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            filter.type = 'lowpass';
            filter.frequency.value = 800;

            osc.type = 'sine';
            osc.frequency.value = freq;

            const vol = this.volume * 0.15;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 1);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 1);
        });
    }

    playArp(time) {
        const pattern = this.arpPatterns[this.currentArpPattern];
        const noteOffset = pattern[this.arpIndex % pattern.length];
        const chordRoot = this.progressions[this.currentProgression][this.progressionIndex % 8];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = 1500 + this.intensity * 1500;
        filter.Q.value = 2;

        osc.type = 'square';
        osc.frequency.value = this.getNote(chordRoot + noteOffset, 2);

        const vol = this.volume * 0.2 * this.intensity;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.1);

        this.arpIndex++;
        // Occasionally change arp pattern
        if (this.arpIndex % 32 === 0) {
            this.currentArpPattern = (this.currentArpPattern + 1) % this.arpPatterns.length;
        }
    }

    playHiHat(time, accent) {
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        filter.type = 'highpass';
        filter.frequency.value = 7000;

        noise.buffer = buffer;

        const vol = this.volume * (accent ? 0.3 : 0.15) * this.intensity;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);

        const vol = this.volume * 0.5 * this.intensity;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    // Boss music - more intense
    startBossMusic() {
        this.currentScale = 'minor';
        this.setIntensity(0.9);
        this.bpm = 140;
        if (!this.playing) {
            this.start();
        }
    }

    // Return to normal
    startNormalMusic() {
        this.currentScale = 'minor';
        this.setIntensity(0.5);
        this.bpm = 120;
        if (!this.playing) {
            this.start();
        }
    }

    // Menu music - calm
    startMenuMusic() {
        this.currentScale = 'major';
        this.setIntensity(0.2);
        this.bpm = 90;
        if (!this.playing) {
            this.start();
        }
    }

    // Update intensity based on wave number and combat situation
    updateGameplayIntensity(wave, enemyCount, bossActive) {
        let intensity = 0.3;

        // Base intensity from wave
        intensity += Math.min(wave / 20, 0.3);

        // Enemy count
        intensity += Math.min(enemyCount / 10, 0.2) * 0.5;

        // Boss fight
        if (bossActive) {
            intensity = 0.9;
        }

        this.setIntensity(intensity);
    }
}
