import { TurretDef, TurretType, Waypoint } from './types';

export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 800;

export const GRID_ROWS = 4;
export const GRID_COLS = 4;
export const TOTAL_SLOTS = 16;
export const SLOT_SIZE = 54;
export const SLOT_GAP = 8;

// Centered grid coordinates
const GRID_TOTAL_W = GRID_COLS * SLOT_SIZE + (GRID_COLS - 1) * SLOT_GAP; // 4 * 54 + 3 * 8 = 240

export const GRID_START_X = Math.round((VIRTUAL_WIDTH - GRID_TOTAL_W) / 2); // 120
export const GRID_START_Y = 260; // 260 to 500

// Rectangular track around the central grid
export const TRACK_LEFT = 45;
export const TRACK_RIGHT = 435;
export const TRACK_TOP = 185;
export const TRACK_BOTTOM = 575;
export const TRACK_WIDTH = 42;

// Path Waypoints (Spawn -> Loop around grid -> Player Base)
export const TRACK_WAYPOINTS: Waypoint[] = [
  { x: TRACK_LEFT, y: 120 },          // 0: Spawn entrance
  { x: TRACK_LEFT, y: TRACK_TOP },    // 1: Top-Left corner
  { x: TRACK_RIGHT, y: TRACK_TOP },   // 2: Top-Right corner
  { x: TRACK_RIGHT, y: TRACK_BOTTOM },// 3: Bottom-Right corner
  { x: TRACK_LEFT, y: TRACK_BOTTOM }, // 4: Bottom-Left corner
  { x: TRACK_LEFT, y: 380 }           // 5: Player Base on Left edge
];

export const BASE_POSITION: Waypoint = { x: TRACK_LEFT, y: 380 };
export const BASE_MAX_HP = 10;

// Archetypes
export const TURRET_DEFINITIONS: Record<TurretType, TurretDef> = {
  BLASTER: {
    type: 'BLASTER',
    name: 'Cyan Blaster',
    color: '#00f0ff',
    accentColor: '#38bdf8',
    glowColor: 'rgba(0, 240, 255, 0.6)',
    baseDamage: 14,
    baseCooldown: 0.28, // Fast ~3.57 shots/s
    range: 165,
    projectileSpeed: 460
  },
  CANNON: {
    type: 'CANNON',
    name: 'Orange Cannon',
    color: '#ff7700',
    accentColor: '#fb923c',
    glowColor: 'rgba(255, 119, 0, 0.6)',
    baseDamage: 42,
    baseCooldown: 0.95, // ~1 shot/s
    range: 155,
    splashRadius: 70,
    projectileSpeed: 290
  },
  FROST: {
    type: 'FROST',
    name: 'Blue Frost',
    color: '#3b82f6',
    accentColor: '#60a5fa',
    glowColor: 'rgba(59, 130, 246, 0.6)',
    baseDamage: 20,
    baseCooldown: 0.5, // 2 shots/s
    range: 160,
    slowPercent: 0.40, // 40% slow
    slowDuration: 2.5,
    projectileSpeed: 380
  },
  SNIPER: {
    type: 'SNIPER',
    name: 'Purple Sniper',
    color: '#a855f7',
    accentColor: '#c084fc',
    glowColor: 'rgba(168, 85, 247, 0.6)',
    baseDamage: 110,
    baseCooldown: 1.6, // ~0.62 shots/s
    range: 240,
    critChance: 0.40,
    critMultiplier: 2.5,
    projectileSpeed: 950
  }
};

export const TURRET_TYPES: TurretType[] = ['BLASTER', 'CANNON', 'FROST', 'SNIPER'];

// Economy
export const INITIAL_GOLD = 80;
export const INITIAL_SPAWN_COST = 20;
export const SPAWN_COST_INCREMENT = 6;

// Function to calculate turret stats for a given level
export function getTurretStats(type: TurretType, level: number) {
  const def = TURRET_DEFINITIONS[type];
  // Level scaling: doubles damage every level, attack speed multiplies by ~1.35x
  const damage = Math.round(def.baseDamage * Math.pow(2, level - 1));
  const cooldown = Math.max(0.08, def.baseCooldown / Math.pow(1.35, level - 1));
  const range = def.range + (level - 1) * 12;
  const splashRadius = def.splashRadius ? def.splashRadius + (level - 1) * 10 : undefined;
  const critChance = def.critChance ? Math.min(0.85, def.critChance + (level - 1) * 0.08) : undefined;

  return {
    damage,
    cooldown,
    range,
    splashRadius,
    critChance
  };
}
