/**
 * SoundEngine.ts - 100% Procedural Web Audio API Sound Synthesizer
 * Zero external audio files (.mp3/.wav). Fully standalone, performant, and arcade-tuned.
 */
export class SoundEngine {
    static instance = null;
    ctx = null;
    masterGain = null;
    muted = false;
    volume = 0.5;
    unlocked = false;
    constructor() {
        this.initAudioContext();
        this.setupUnlockListeners();
    }
    static getInstance() {
        if (!SoundEngine.instance) {
            SoundEngine.instance = new SoundEngine();
        }
        return SoundEngine.instance;
    }
    initAudioContext() {
        if (typeof window === 'undefined')
            return;
        try {
            const AudioCtx = window.AudioContext ||
                window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        catch {
            // AudioContext not available or blocked
        }
    }
    setupUnlockListeners() {
        if (typeof window === 'undefined')
            return;
        const unlock = () => {
            if (!this.ctx) {
                this.initAudioContext();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    this.unlocked = true;
                }).catch(() => { });
            }
            else {
                this.unlocked = true;
            }
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('pointerdown', unlock, { once: false, passive: true });
        window.addEventListener('keydown', unlock, { once: false, passive: true });
        window.addEventListener('touchstart', unlock, { once: false, passive: true });
    }
    ensureContext() {
        if (!this.ctx) {
            this.initAudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => { });
        }
        return this.ctx;
    }
    isMuted() {
        return this.muted;
    }
    setMuted(muted) {
        this.muted = muted;
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : this.volume, now + 0.05);
        }
    }
    toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }
    setMasterVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (!this.muted && this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.05);
        }
    }
    getMasterVolume() {
        return this.volume;
    }
    /**
     * Short bubble / ball pop sound
     */
    playPop() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }
    /**
     * Harmonious chime for merging objects (configurable pitch multiplier)
     */
    playMerge(pitch = 1.0) {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const baseFreq = Math.max(80, Math.min(2400, 320 * pitch));
        const now = ctx.currentTime;
        const duration = 0.22;
        // Harmonic layer 1: Fundamental sine
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + duration);
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);
        // Harmonic layer 2: Sparkle triangle (octave above)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + duration);
        gain2.gain.setValueAtTime(0.2, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now + 0.04);
        osc2.stop(now + duration);
    }
    /**
     * Deep arcade explosion with noise and sub-bass thud
     */
    playExplosion() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const now = ctx.currentTime;
        const duration = 0.55;
        // 1. Noise generation
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + duration);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        // 2. Sub-bass boom
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(110, now);
        subOsc.frequency.exponentialRampToValueAtTime(25, now + duration);
        subGain.gain.setValueAtTime(0.6, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        whiteNoise.start(now);
        subOsc.start(now);
        whiteNoise.stop(now + duration);
        subOsc.stop(now + duration);
    }
    /**
     * Sci-fi resonant laser blast
     */
    playLaser() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const now = ctx.currentTime;
        const duration = 0.15;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + duration);
        filter.type = 'lowpass';
        filter.Q.setValueAtTime(6, now);
        filter.frequency.setValueAtTime(3000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + duration);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }
    /**
     * Crisp UI button click
     */
    playClick() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const now = ctx.currentTime;
        const duration = 0.035;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + duration);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }
    /**
     * Heavy crunch / crusher impact sound
     */
    playCrunch() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const now = ctx.currentTime;
        const duration = 0.28;
        // Filtered noise with resonance
        const bufferSize = Math.floor(ctx.sampleRate * duration);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(260, now + duration);
        filter.Q.setValueAtTime(4, now);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        // Distorted punch oscillator
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + duration);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        noise.start(now);
        osc.start(now);
        noise.stop(now + duration);
        osc.stop(now + duration);
    }
    /**
     * Joyful ascending level up fanfare
     */
    playLevelUp() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const noteDuration = 0.09;
        const now = ctx.currentTime;
        notes.forEach((freq, idx) => {
            if (!ctx || !this.masterGain)
                return;
            const startTime = now + idx * noteDuration;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.35, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.5);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + noteDuration * 1.5);
        });
    }
    /**
     * Melancholic descending game over jingle
     */
    playGameOver() {
        if (this.muted)
            return;
        const ctx = this.ensureContext();
        if (!ctx || !this.masterGain)
            return;
        const notes = [440, 392, 349.23, 261.63]; // A4, G4, F4, C4
        const noteDuration = 0.18;
        const now = ctx.currentTime;
        notes.forEach((freq, idx) => {
            if (!ctx || !this.masterGain)
                return;
            const startTime = now + idx * noteDuration;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + noteDuration);
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 1.2);
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, startTime);
            filter.frequency.linearRampToValueAtTime(400, startTime + noteDuration);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + noteDuration * 1.2);
        });
    }
}
// Export singleton helper
export const soundEngine = SoundEngine.getInstance();
