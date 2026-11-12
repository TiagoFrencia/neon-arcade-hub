export interface TierConfig {
    tier: number;
    name: string;
    radius: number;
    color: string;
    secondaryColor: string;
    glowColor: string;
    points: number;
    symbol: string;
}
export interface CustomBodyData {
    tier: number;
    isRainbow: boolean;
    isMerged: boolean;
    spawnTime: number;
    settled: boolean;
    rainbowHue?: number;
}
