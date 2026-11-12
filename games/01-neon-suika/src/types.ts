export interface TierConfig {
  tier: number; // 1 to 10
  name: string;
  radius: number;
  color: string;
  secondaryColor: string;
  glowColor: string;
  points: number;
  symbol: string;
}

export interface CustomBodyData {
  tier: number; // 1 to 10
  isRainbow: boolean;
  isMerged: boolean;
  spawnTime: number;
  settled: boolean;
  rainbowHue?: number;
}
