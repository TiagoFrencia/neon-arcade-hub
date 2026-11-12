import { UpgradeOption, WeaponType } from './types';
export declare const VIRTUAL_WIDTH = 480;
export declare const VIRTUAL_HEIGHT = 800;
export declare const CYBER_COLORS: {
    bg: string;
    grid: string;
    gridMajor: string;
    cyan: string;
    magenta: string;
    purple: string;
    yellow: string;
    green: string;
    white: string;
    darkOverlay: string;
};
export declare const WEAPON_DEFINITIONS: Record<WeaponType, {
    name: string;
    icon: string;
    maxLevel: number;
    levels: {
        levelText: string;
        desc: string;
    }[];
}>;
export declare const STAT_BOOSTS: UpgradeOption[];
