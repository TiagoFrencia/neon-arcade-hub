/**
 * blueprints.ts - Procedural and matrix-based 2D Voxel blueprints for crushable objects
 * Each blueprint contains 50 to 200 micro-blocks (2D voxels).
 */

import { VoxelBlueprint } from './types';

// Helper to count non-zero cells in a grid
function countVoxels(grid: number[][]): number {
  let count = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] > 0) count++;
    }
  }
  return count;
}

// -------------------------------------------------------------
// 1. Retro CRT TV (Tier 1) ~84 voxels
// -------------------------------------------------------------
const TV_GRID: number[][] = [
  // Antennas
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  // Top chassis
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  // Screen & Knob panel
  [2, 3, 3, 3, 3, 3, 3, 3, 2, 4, 4, 2],
  [2, 3, 5, 3, 3, 3, 5, 3, 2, 4, 4, 2],
  [2, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2],
  [2, 3, 5, 5, 5, 5, 5, 3, 2, 4, 4, 2],
  [2, 3, 3, 3, 3, 3, 3, 3, 2, 4, 4, 2],
  // Bottom chassis & Feet
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 0]
];

export const RETRO_TV_BLUEPRINT: VoxelBlueprint = {
  id: 'retro_tv',
  name: 'Retro CRT TV',
  icon: '📺',
  tier: 1,
  width: 12,
  height: 11,
  voxelSize: 9.5,
  baseHp: 15,
  baseValue: 1,
  palette: [
    '',
    '#94a3b8', // 1: Metallic antenna
    '#334155', // 2: Dark slate chassis
    '#052e16', // 3: CRT dark phosphor screen
    '#f97316', // 4: Orange control knobs
    '#22c55e'  // 5: Retro green glowing smile/pixels
  ],
  grid: TV_GRID
};

// -------------------------------------------------------------
// 2. Neon Gem / Diamond (Tier 2) ~98 voxels
// -------------------------------------------------------------
const GEM_GRID: number[][] = [
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 2, 2, 4, 4, 2, 2, 1, 1, 0, 0],
  [0, 1, 2, 2, 3, 3, 4, 4, 3, 3, 2, 2, 1, 0],
  [1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [0, 1, 3, 3, 3, 4, 4, 4, 4, 3, 3, 3, 1, 0],
  [0, 1, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 1, 0],
  [0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 2, 1, 0, 0],
  [0, 0, 0, 1, 2, 3, 3, 3, 3, 2, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 2, 3, 3, 2, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0]
];

export const NEON_GEM_BLUEPRINT: VoxelBlueprint = {
  id: 'neon_gem',
  name: 'Neon Diamond',
  icon: '💎',
  tier: 2,
  width: 14,
  height: 12,
  voxelSize: 8.5,
  baseHp: 32,
  baseValue: 3,
  palette: [
    '',
    '#00f0ff', // 1: Outer glowing cyan facet
    '#0284c7', // 2: Deep blue reflection
    '#38bdf8', // 3: Radiant diamond core
    '#ffffff'  // 4: Specular brilliance highlight
  ],
  grid: GEM_GRID
};

// -------------------------------------------------------------
// 3. Gold Ingot Stack (Tier 3) ~116 voxels
// -------------------------------------------------------------
const GOLD_GRID: number[][] = [
  // Top single bar
  [0, 0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  // Middle two bars
  [0, 0, 1, 3, 3, 3, 1, 0, 0, 1, 3, 3, 3, 1, 0, 0],
  [0, 1, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  // Bottom three bars
  [1, 3, 3, 1, 0, 1, 3, 3, 3, 1, 0, 1, 3, 3, 1, 0],
  [1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

export const GOLD_INGOT_BLUEPRINT: VoxelBlueprint = {
  id: 'gold_ingot',
  name: 'Gold Ingot Stack',
  icon: '🪙',
  tier: 3,
  width: 16,
  height: 9,
  voxelSize: 8,
  baseHp: 65,
  baseValue: 7,
  palette: [
    '',
    '#b45309', // 1: Bronze bullion edge
    '#f59e0b', // 2: Pure gold body
    '#fef08a'  // 3: Glistening golden reflection
  ],
  grid: GOLD_GRID
};

// -------------------------------------------------------------
// 4. Alien Bio-Crystal (Tier 4) ~136 voxels
// -------------------------------------------------------------
const ALIEN_GRID: number[][] = [
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 2, 2, 1, 0, 1, 0, 0, 0],
  [0, 0, 1, 2, 1, 1, 3, 3, 1, 1, 2, 1, 0, 0],
  [0, 0, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 0, 0],
  [0, 1, 2, 4, 2, 2, 3, 3, 2, 2, 4, 2, 1, 0],
  [1, 2, 2, 4, 4, 3, 5, 5, 3, 4, 4, 2, 2, 1],
  [1, 2, 3, 3, 4, 5, 5, 5, 5, 4, 3, 3, 2, 1],
  [1, 2, 3, 3, 4, 5, 5, 5, 5, 4, 3, 3, 2, 1],
  [0, 1, 2, 2, 4, 4, 5, 5, 4, 4, 2, 2, 1, 0],
  [0, 1, 2, 2, 2, 3, 4, 4, 3, 2, 2, 2, 1, 0],
  [0, 0, 1, 2, 2, 2, 3, 3, 2, 2, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0]
];

export const ALIEN_CRYSTAL_BLUEPRINT: VoxelBlueprint = {
  id: 'alien_crystal',
  name: 'Alien Bio-Crystal',
  icon: '🔮',
  tier: 4,
  width: 14,
  height: 13,
  voxelSize: 7.8,
  baseHp: 130,
  baseValue: 15,
  palette: [
    '',
    '#4c1d95', // 1: Void obsidian frame
    '#9333ea', // 2: Deep violet matrix
    '#c026d3', // 3: Pulsing magenta crystal
    '#10b981', // 4: Acid emerald bio-veins
    '#f43f5e'  // 5: Hyper-charged plasma core
  ],
  grid: ALIEN_GRID
};

// -------------------------------------------------------------
// 5. Cyber Skull (Tier 5) ~152 voxels
// -------------------------------------------------------------
const SKULL_GRID: number[][] = [
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
  [0, 1, 2, 2, 4, 4, 2, 2, 4, 4, 2, 2, 1, 0],
  [1, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 2, 1],
  [1, 2, 3, 5, 3, 2, 2, 2, 2, 3, 5, 3, 2, 1],
  [1, 2, 3, 3, 3, 2, 2, 2, 2, 3, 3, 3, 2, 1],
  [0, 1, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 1, 0],
  [0, 0, 1, 2, 2, 1, 3, 3, 1, 2, 2, 1, 0, 0],
  [0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0],
  [0, 0, 1, 3, 1, 3, 1, 1, 3, 1, 3, 1, 0, 0],
  [0, 0, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]
];

export const CYBER_SKULL_BLUEPRINT: VoxelBlueprint = {
  id: 'cyber_skull',
  name: 'Cyber Skull',
  icon: '💀',
  tier: 5,
  width: 14,
  height: 14,
  voxelSize: 7.5,
  baseHp: 260,
  baseValue: 35,
  palette: [
    '',
    '#1e293b', // 1: Dark titanium border
    '#cbd5e1', // 2: Ceramic bone armor
    '#0284c7', // 3: Cyber circuitry
    '#06b6d4', // 4: Glowing cranial data bus
    '#ff0055'  // 5: Crimson laser optics
  ],
  grid: SKULL_GRID
};

// -------------------------------------------------------------
// 6. Quantum Core (Tier 6) ~184 voxels
// -------------------------------------------------------------
const QUANTUM_GRID: number[][] = [
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0],
  [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0],
  [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0],
  [1, 2, 3, 4, 4, 5, 5, 5, 5, 5, 5, 4, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 5, 6, 6, 6, 6, 5, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 6, 6, 6, 6, 6, 6, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 5, 5, 6, 6, 6, 6, 5, 5, 4, 3, 2, 1],
  [1, 2, 3, 4, 4, 5, 5, 5, 5, 5, 5, 4, 4, 3, 2, 1],
  [0, 1, 2, 3, 4, 4, 4, 4, 4, 4, 4, 4, 3, 2, 1, 0],
  [0, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0],
  [0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0]
];

export const QUANTUM_CORE_BLUEPRINT: VoxelBlueprint = {
  id: 'quantum_core',
  name: 'Quantum Reactor Core',
  icon: '⚛️',
  tier: 6,
  width: 16,
  height: 14,
  voxelSize: 7.2,
  baseHp: 550,
  baseValue: 80,
  palette: [
    '',
    '#18181b', // 1: Outer magnetic damper
    '#3b82f6', // 2: Tokamak magnetic containment field
    '#8b5cf6', // 3: Subatomic ion vortex
    '#ec4899', // 4: Fusion reaction boundary
    '#f59e0b', // 5: Stellar flare layer
    '#ffffff'  // 6: Zero-point singularity
  ],
  grid: QUANTUM_GRID
};

export const ALL_BLUEPRINTS: VoxelBlueprint[] = [
  RETRO_TV_BLUEPRINT,
  NEON_GEM_BLUEPRINT,
  GOLD_INGOT_BLUEPRINT,
  ALIEN_CRYSTAL_BLUEPRINT,
  CYBER_SKULL_BLUEPRINT,
  QUANTUM_CORE_BLUEPRINT
];

// Verify all blueprints satisfy the 50-200 micro-block requirement
ALL_BLUEPRINTS.forEach((bp) => {
  const count = countVoxels(bp.grid);
  if (count < 50 || count > 200) {
    console.warn(`[Blueprints] Blueprint ${bp.name} has ${count} voxels (must be 50-200)`);
  }
});
