export type EnemyType = 'triangle' | 'tank' | 'splitter' | 'mini_splitter' | 'boss';

export type WeaponType =
  | 'plasma_bolt'
  | 'orbital_shields'
  | 'chain_lightning'
  | 'laser_beam'
  | 'nova_pulse'
  | 'magnet_speed';

export type GemType = 'green' | 'blue' | 'boss';

export type GameState = 'playing' | 'level_up' | 'game_over' | 'paused';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  magnetRadius: number;
  invulnTimer: number;
  level: number;
  xp: number;
  xpNeeded: number;
  kills: number;
  aliveTime: number;
  weapons: Map<WeaponType, number>;
  hpRegenRate: number;
  hpRegenTimer: number;
}

export interface Enemy {
  active: boolean;
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpType: GemType;
  xpValue: number;
  color: string;
  angle: number;
  splitCount: number;
  isBoss: boolean;
  hitFlashTimer: number;
  shieldContactCooldown: number;
}

export interface Projectile {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  pierce: number;
  hitEnemies: Set<number>;
}

export interface XPGem {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  type: GemType;
  radius: number;
  color: string;
  isMagnetized: boolean;
  pulseTimer: number;
}

export interface LightningStrike {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: string;
}

export interface LaserBeam {
  active: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  width: number;
  life: number;
  maxLife: number;
  damage: number;
  color: string;
  hitTimer: number;
}

export interface NovaWave {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  damage: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface UpgradeOption {
  id: string;
  weaponType: WeaponType | 'stat_boost';
  statType?: 'max_hp' | 'damage_boost' | 'attack_speed' | 'heal_full';
  name: string;
  levelText: string;
  description: string;
  icon: string;
  currentLevel: number;
  newLevel: number;
  isMax?: boolean;
}

export interface VirtualJoystick {
  active: boolean;
  touchId: number | null;
  baseX: number;
  baseY: number;
  currX: number;
  currY: number;
  dx: number;
  dy: number;
  distance: number;
  maxRadius: number;
}
