/**
 * types.ts - Core types and interfaces for 02-Hydraulic-Crusher
 */

export interface VoxelBlueprint {
  id: string;
  name: string;
  icon: string;
  tier: number;
  width: number; // grid columns
  height: number; // grid rows
  voxelSize: number; // pixels per voxel
  baseHp: number; // HP per voxel
  baseValue: number; // $ earned per voxel
  palette: string[]; // color palette indexed in grid
  edgePalette?: string[];
  grid: number[][]; // 2D array: 0 = empty, 1..N = palette index
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
  x: number; // center x in world
  y: number; // center y in world
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
  rotationSpeed: number; // radians per second
  direction: number; // 1 for clockwise, -1 for counter-clockwise
}

export interface UpgradesState {
  power: number; // Crusher damage per tooth hit & tap
  speed: number; // Roller rotation speed
  teeth: number; // Teeth density and size
  objectTier: number; // Unlocked object tiers
}

export interface GameSaveData {
  coins: number;
  upgrades: UpgradesState;
  lastActiveTimestamp: number;
  isMuted: boolean;
  totalCrushedObjects: number;
  totalEarnedCoins: number;
}
