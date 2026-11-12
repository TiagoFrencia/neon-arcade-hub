/**
 * crusher.ts - Physical simulation of dual toothed rollers, voxel objects, and debris funnel
 */
import { FallingObject, CrushedVoxelDebris, RollerConfig, UpgradesState } from './types';
export interface CrushEvent {
    x: number;
    y: number;
    color: string;
    count: number;
}
export interface CashCollectEvent {
    x: number;
    y: number;
    amount: number;
}
export declare class CrusherSimulation {
    readonly width = 480;
    readonly height = 800;
    leftRoller: RollerConfig;
    rightRoller: RollerConfig;
    currentObject: FallingObject | null;
    nextObjectTimer: number;
    debrisList: CrushedVoxelDebris[];
    readonly funnelYStart = 470;
    readonly funnelYEnd = 580;
    readonly funnelLeftX1 = 60;
    readonly funnelLeftX2 = 205;
    readonly funnelRightX1 = 420;
    readonly funnelRightX2 = 275;
    pendingCrushEvents: CrushEvent[];
    pendingCashEvents: CashCollectEvent[];
    hasCrushOccurred: boolean;
    hasSlamOccurred: boolean;
    hasCompletedObject: boolean;
    slamProgress: number;
    slamX: number;
    slamY: number;
    overdriveActive: boolean;
    overdriveRemaining: number;
    constructor();
    /**
     * Spawns a new object based on unlocked tier
     */
    spawnObject(maxUnlockedTier: number): void;
    /**
     * Updates upgrades parameters into simulation mechanics
     */
    applyUpgrades(upgrades: UpgradesState): void;
    /**
     * Main simulation tick
     */
    update(dt: number, upgrades: UpgradesState): void;
    /**
     * Updates physics and crushing on the falling voxel object
     */
    private updateObjectPhysics;
    /**
     * Checks collisions between roller teeth and voxels, tearing them apart
     */
    private processRollerCrushing;
    /**
     * Computes the tip world coordinates and tangential velocities of a roller's teeth
     */
    private getTeethTipPositions;
    /**
     * Hydraulic Tap Slam: Deals immediate burst damage and crunches micro-blocks
     */
    triggerHydraulicSlam(tapX: number, tapY: number, upgrades: UpgradesState): void;
    /**
     * Physics simulation for detached debris sliding down the funnel into collection intake
     */
    private updateDebrisPhysics;
    /**
     * Activates the 2-minute 2x Cash & Overdrive mode
     */
    activateOverdrive(durationSeconds?: number): void;
}
