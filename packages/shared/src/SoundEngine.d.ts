/**
 * SoundEngine.ts - 100% Procedural Web Audio API Sound Synthesizer
 * Zero external audio files (.mp3/.wav). Fully standalone, performant, and arcade-tuned.
 */
export declare class SoundEngine {
    private static instance;
    private ctx;
    private masterGain;
    private muted;
    private volume;
    private unlocked;
    constructor();
    static getInstance(): SoundEngine;
    private initAudioContext;
    private setupUnlockListeners;
    private ensureContext;
    isMuted(): boolean;
    setMuted(muted: boolean): void;
    toggleMute(): boolean;
    setMasterVolume(vol: number): void;
    getMasterVolume(): number;
    /**
     * Short bubble / ball pop sound
     */
    playPop(): void;
    /**
     * Harmonious chime for merging objects (configurable pitch multiplier)
     */
    playMerge(pitch?: number): void;
    /**
     * Deep arcade explosion with noise and sub-bass thud
     */
    playExplosion(): void;
    /**
     * Sci-fi resonant laser blast
     */
    playLaser(): void;
    /**
     * Crisp UI button click
     */
    playClick(): void;
    /**
     * Heavy crunch / crusher impact sound
     */
    playCrunch(): void;
    /**
     * Joyful ascending level up fanfare
     */
    playLevelUp(): void;
    /**
     * Melancholic descending game over jingle
     */
    playGameOver(): void;
}
export declare const soundEngine: SoundEngine;
