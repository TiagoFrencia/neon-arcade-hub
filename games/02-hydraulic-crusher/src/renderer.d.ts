/**
 * renderer.ts - 100% Procedural 2D Canvas Neon & Cyber Industrial Graphics
 * Zero external images or textures. All procedural geometry, lighting, and neon shaders.
 */
import { CrusherSimulation } from './crusher';
import { GoldenDroneManager } from './drone';
export declare class CrusherRenderer {
    private ctx;
    private animTime;
    constructor(ctx: CanvasRenderingContext2D);
    render(sim: CrusherSimulation, droneMgr: GoldenDroneManager, dt: number): void;
    /**
     * Renders the industrial background with dark panels, rivets, and hazard accents
     */
    private renderIndustrialChamber;
    /**
     * Renders animated hydraulic pistons mounted to the chamber sidewalls
     */
    private renderSidePiston;
    /**
     * Renders hazard caution warning stripes
     */
    private renderHazardStripes;
    /**
     * Renders vertical neon guide rails for falling objects
     */
    private renderChuteGuides;
    /**
     * Renders the bottom debris collection funnel and illuminated cash intake
     */
    private renderFunnelHopper;
    /**
     * Renders the Overdrive fiery heat distortion and plasma rim
     */
    private renderOverdriveAura;
    /**
     * Renders a single toothed hydraulic roller
     */
    private renderRoller;
    /**
     * Renders the falling voxel object with 2.5D beveling and damage indicators
     */
    private renderVoxelObject;
    /**
     * Renders detached debris tumbling down the funnel
     */
    private renderDebris;
    /**
     * Renders the hydraulic tap slam shockwave effect
     */
    private renderHydraulicSlamEffect;
    /**
     * Renders the Golden Cyber Drone flying across the screen
     */
    private renderGoldenDrone;
}
