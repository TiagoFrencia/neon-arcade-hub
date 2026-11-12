import { TierConfig } from './types';
export declare const GAME_WIDTH = 480;
export declare const GAME_HEIGHT = 800;
export declare const CONTAINER: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    wallThickness: number;
    floorThickness: number;
    dangerLineY: number;
    dropperY: number;
};
export declare const DANGER_MAX_TIME = 2.5;
export declare const DROP_COOLDOWN = 0.45;
export declare const TIERS: TierConfig[];
export declare const SPAWN_WEIGHTS: {
    tier: number;
    weight: number;
}[];
export declare function getRandomSpawnTier(): number;
