/**
 * types.ts - Core types and interfaces for 02-Hydraulic-Crusher
 */
export interface VoxelBlueprint {
    id: string;
    name: string;
    icon: string;
    tier: number;
    width: number;
    height: number;
    voxelSize: number;
    baseHp: number;
    baseValue: number;
    palette: string[];
    edgePalette?: string[];
    grid: number[][];
}
export interface Voxel {
    gx: number;
    gy: number;
    color: string;
    edgeColor: string;
    hp: number;
    maxHp: number;
    value: number;
}
export interface FallingObject {
    blueprint: VoxelBlueprint;
    x: number;
    y: number;
    vx: number;
    vy: number;
    voxels: Voxel[];
    totalVoxels: number;
    destroyedVoxels: number;
    isComplete: boolean;
    spawnTime: number;
}
export interface CrushedVoxelDebris {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    value: number;
    rot: number;
    vRot: number;
    alpha: number;
}
export interface RollerConfig {
    x: number;
    y: number;
    radius: number;
    angle: number;
    teethCount: number;
    toothLength: number;
    toothWidth: number;
    rotationSpeed: number;
    direction: number;
}
export interface UpgradesState {
    power: number;
    speed: number;
    teeth: number;
    objectTier: number;
}
export interface GameSaveData {
    coins: number;
    upgrades: UpgradesState;
    lastActiveTimestamp: number;
    isMuted: boolean;
    totalCrushedObjects: number;
    totalEarnedCoins: number;
}
