export type TurretType = 'BLASTER' | 'CANNON' | 'FROST' | 'SNIPER';

export interface TurretDef {
  type: TurretType;
  name: string;
  color: string;
  accentColor: string;
  glowColor: string;
  baseDamage: number;
  baseCooldown: number; // in seconds
  range: number;
  projectileSpeed: number;
  splashRadius?: number;
  slowPercent?: number;
  slowDuration?: number;
  critChance?: number;
  critMultiplier?: number;
}

export interface Turret {
  id: string;
  type: TurretType;
  level: number;
  cooldownTimer: number;
  rotation: number;
  targetId: string | null;
  recoil: number;
  glowPulse: number;
}

export interface GridSlot {
  index: number;
  row: number;
  col: number;
  x: number;
  y: number;
  turret: Turret | null;
}

export type EnemyShape = 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'octagon';

export interface Enemy {
  id: string;
  shape: EnemyShape;
  color: string;
  accentColor: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  baseSpeed: number;
  hp: number;
  maxHp: number;
  goldValue: number;
  rotation: number;
  spinSpeed: number;
  currentWaypointIndex: number;
  distanceTraveled: number;
  slowTimer: number;
  slowFactor: number;
  freezeTimer: number;
  isBoss: boolean;
  hitFlashTimer: number;
}

export interface Projectile {
  id: string;
  turretType: TurretType;
  level: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetEnemyId: string;
  targetLastX: number;
  targetLastY: number;
  damage: number;
  isCrit: boolean;
  color: string;
  splashRadius?: number;
  slowPercent?: number;
  slowDuration?: number;
  life: number;
  maxLife: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface WaveConfig {
  waveNumber: number;
  totalEnemies: number;
  spawnInterval: number; // seconds between spawns
  enemyPool: {
    shape: EnemyShape;
    weight: number;
  }[];
  isBossWave: boolean;
}

export type GameState = 'PLAYING' | 'WAVE_CLEAR' | 'GAME_OVER' | 'VICTORY';
