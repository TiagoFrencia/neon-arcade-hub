/**
 * constants.ts - Core game configuration, hex geometry, colors and level curves for Hexa Sort
 */

export const VIRTUAL_WIDTH = 480;
export const VIRTUAL_HEIGHT = 800;

// Hexagonal 2.5D Isometric Geometry
export const HEX_SIZE = 34; // Outer radius of hexagon in pixels
export const HEX_ISO_TILT = 0.82; // Vertical compression factor for 2.5D perspective
export const HEX_TILE_HEIGHT = 5.5; // Extruded vertical thickness per chip (px)
export const BOARD_CENTER_X = 240;
export const BOARD_CENTER_Y = 345;
export const HEX_GRID_RADIUS = 2; // Axial radius 2 => 19 cells total

// Stack rules
export const STACK_CLEAR_THRESHOLD = 10; // 10 matching tiles => clear & score
export const MAX_DISPLAY_STACK_HEIGHT = 16;

// Bottom Hand Tray
export const HAND_Y = 635;
export const HAND_SLOTS_X = [95, 240, 385];
export const HAND_HEX_SIZE = 32;

// Musical scale pitches for ascending merge chimes (pentatonic / major scale)
export const MERGE_PITCH_SCALE = [
  1.0,    // Do
  1.125,  // Re
  1.25,   // Mi
  1.334,  // Fa
  1.5,    // Sol
  1.667,  // La
  1.875,  // Si
  2.0,    // High Do
  2.25,   // High Re
  2.5,    // High Mi
  2.667,  // High Fa
  3.0     // High Sol
];

// Color definitions for chips
export interface ColorDef {
  id: number;
  name: string;
  main: string;       // Primary face color
  mainLight: string;  // Glossy highlight
  side: string;       // 3D side edge
  sideDark: string;   // 3D dark shadow edge
  glow: string;       // Additive neon glow
  accent: string;     // Inner geometric motif
}

export const COLOR_PALETTE: ColorDef[] = [
  {
    id: 0,
    name: 'Cyan',
    main: '#00f0ff',
    mainLight: '#7cf6ff',
    side: '#0099aa',
    sideDark: '#005f6b',
    glow: '#00f0ff',
    accent: '#d6fbff'
  },
  {
    id: 1,
    name: 'Magenta',
    main: '#ff007f',
    mainLight: '#ff66b2',
    side: '#a80054',
    sideDark: '#6b0036',
    glow: '#ff007f',
    accent: '#ffe0f0'
  },
  {
    id: 2,
    name: 'Gold',
    main: '#ffd000',
    mainLight: '#ffe875',
    side: '#ad8d00',
    sideDark: '#705c00',
    glow: '#ffd000',
    accent: '#fff9db'
  },
  {
    id: 3,
    name: 'Lime',
    main: '#00ff66',
    mainLight: '#80ffb3',
    side: '#00a341',
    sideDark: '#006629',
    glow: '#00ff66',
    accent: '#d9ffe8'
  },
  {
    id: 4,
    name: 'Orange',
    main: '#ff6600',
    mainLight: '#ffa866',
    side: '#a84300',
    sideDark: '#662900',
    glow: '#ff6600',
    accent: '#ffe6d6'
  },
  {
    id: 5,
    name: 'Purple',
    main: '#9d00ff',
    mainLight: '#cf80ff',
    side: '#6600a8',
    sideDark: '#42006b',
    glow: '#9d00ff',
    accent: '#f3e0ff'
  },
  {
    id: 6,
    name: 'Royal',
    main: '#0066ff',
    mainLight: '#70adff',
    side: '#0042a8',
    sideDark: '#002a6b',
    glow: '#0066ff',
    accent: '#dbebff'
  }
];

// Level Goals Configuration
export interface LevelConfig {
  targetTiles: number;
  colorCount: number;
  minStackSize: number;
  maxStackSize: number;
  maxColorLayers: number;
}

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(1, Math.floor(level));
  const colorCount = Math.min(COLOR_PALETTE.length, 3 + Math.floor((safeLevel - 1) / 2));
  
  // Exponential / linear blend for smooth progression
  let targetTiles = 40;
  if (safeLevel === 2) targetTiles = 80;
  else if (safeLevel === 3) targetTiles = 130;
  else if (safeLevel === 4) targetTiles = 190;
  else if (safeLevel > 4) {
    targetTiles = 190 + (safeLevel - 4) * 65;
  }

  const minStackSize = safeLevel === 1 ? 2 : safeLevel === 2 ? 3 : 4;
  const maxStackSize = safeLevel === 1 ? 4 : safeLevel === 2 ? 6 : Math.min(8, 5 + Math.floor(safeLevel / 2));
  const maxColorLayers = safeLevel === 1 ? 2 : safeLevel < 4 ? 2 : 3;

  return {
    targetTiles,
    colorCount,
    minStackSize,
    maxStackSize,
    maxColorLayers
  };
}
