import { TierConfig } from './types';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

// Container playfield boundaries
export const CONTAINER = {
  left: 45,
  right: 435,
  top: 130,
  bottom: 720,
  wallThickness: 24,
  floorThickness: 30,
  dangerLineY: 175,
  dropperY: 105
};

export const DANGER_MAX_TIME = 2.5; // 2.5 seconds before game over
export const DROP_COOLDOWN = 0.45; // 450ms debounce between drops

export const TIERS: TierConfig[] = [
  {
    tier: 1,
    name: 'Nano Cyan',
    radius: 16,
    color: '#00f0ff',
    secondaryColor: '#007799',
    glowColor: 'rgba(0, 240, 255, 0.85)',
    points: 2,
    symbol: '1'
  },
  {
    tier: 2,
    name: 'Flux Turquoise',
    radius: 22,
    color: '#00ffaa',
    secondaryColor: '#008855',
    glowColor: 'rgba(0, 255, 170, 0.85)',
    points: 4,
    symbol: '2'
  },
  {
    tier: 3,
    name: 'Volt Green',
    radius: 29,
    color: '#76ff03',
    secondaryColor: '#338800',
    glowColor: 'rgba(118, 255, 3, 0.85)',
    points: 8,
    symbol: '3'
  },
  {
    tier: 4,
    name: 'Plasma Yellow',
    radius: 37,
    color: '#ffee00',
    secondaryColor: '#997700',
    glowColor: 'rgba(255, 238, 0, 0.85)',
    points: 16,
    symbol: '4'
  },
  {
    tier: 5,
    name: 'Amber Blaze',
    radius: 46,
    color: '#ff9100',
    secondaryColor: '#994400',
    glowColor: 'rgba(255, 145, 0, 0.85)',
    points: 32,
    symbol: '5'
  },
  {
    tier: 6,
    name: 'Crimson Spark',
    radius: 56,
    color: '#ff2a55',
    secondaryColor: '#991133',
    glowColor: 'rgba(255, 42, 85, 0.85)',
    points: 64,
    symbol: '6'
  },
  {
    tier: 7,
    name: 'Neon Fuchsia',
    radius: 67,
    color: '#ff007f',
    secondaryColor: '#880044',
    glowColor: 'rgba(255, 0, 127, 0.85)',
    points: 128,
    symbol: '7'
  },
  {
    tier: 8,
    name: 'Hyper Violet',
    radius: 79,
    color: '#b000ff',
    secondaryColor: '#550088',
    glowColor: 'rgba(176, 0, 255, 0.85)',
    points: 256,
    symbol: '8'
  },
  {
    tier: 9,
    name: 'Quantum Blue',
    radius: 92,
    color: '#3d5afe',
    secondaryColor: '#1a237e',
    glowColor: 'rgba(61, 90, 254, 0.85)',
    points: 512,
    symbol: '9'
  },
  {
    tier: 10,
    name: 'Magenta Sun',
    radius: 108,
    color: '#ff0055',
    secondaryColor: '#ffea00',
    glowColor: 'rgba(255, 0, 85, 0.95)',
    points: 1000,
    symbol: 'MAX'
  }
];

// Spawning tier distribution (levels 1-4)
export const SPAWN_WEIGHTS = [
  { tier: 1, weight: 45 },
  { tier: 2, weight: 30 },
  { tier: 3, weight: 18 },
  { tier: 4, weight: 7 }
];

export function getRandomSpawnTier(): number {
  const total = SPAWN_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of SPAWN_WEIGHTS) {
    if (rand < item.weight) return item.tier;
    rand -= item.weight;
  }
  return 1;
}
