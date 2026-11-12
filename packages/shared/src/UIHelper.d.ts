/**
 * UIHelper.ts - 2D Neon Particle System, Floating Text, and ScreenShake for HTML5 Canvas
 * High performance, zero allocations in steady state where possible, designed for 60fps arcade gameplay.
 */
export interface NeonParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    glow: number;
    drag: number;
    gravity: number;
}
export interface FloatingText {
    x: number;
    y: number;
    vy: number;
    text: string;
    color: string;
    strokeColor: string;
    fontSize: number;
    life: number;
    maxLife: number;
    scale: number;
}
export declare class ParticleSystem {
    private particles;
    private texts;
    /**
     * Spawns an explosion burst of neon sparks
     */
    spawnNeonBurst(x: number, y: number, color: string, count?: number, speed?: number, size?: number): void;
    /**
     * Spawns a floating arcade score text e.g. "+10", "COMBO x2"
     */
    spawnFloatingText(x: number, y: number, text: string, color?: string, fontSize?: number, duration?: number, strokeColor?: string): void;
    /**
     * Update all particles and texts by delta time in seconds
     */
    update(dt: number): void;
    /**
     * Renders all active particles and texts onto the 2D canvas
     */
    render(ctx: CanvasRenderingContext2D): void;
    clear(): void;
}
/**
 * ScreenShake - Smooth 2D Camera shake with quadratic decay
 */
export declare class ScreenShake {
    private intensity;
    private duration;
    private elapsed;
    private offsetX;
    private offsetY;
    /**
     * Trigger a screen shake with intensity in pixels and duration in seconds
     */
    shake(intensity: number, duration?: number): void;
    /**
     * Update shake offsets
     */
    update(dt: number): void;
    /**
     * Applies the shake translation to the canvas rendering context
     */
    apply(ctx: CanvasRenderingContext2D): void;
    /**
     * Returns current offset vector
     */
    getOffset(): {
        x: number;
        y: number;
    };
    reset(): void;
}
