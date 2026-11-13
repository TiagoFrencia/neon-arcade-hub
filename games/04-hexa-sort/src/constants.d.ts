/**
 * constants.ts - Core game configuration, hex geometry, colors and level curves for Hexa Sort
 */
export declare const VIRTUAL_WIDTH = 480;
export declare const VIRTUAL_HEIGHT = 800;
export declare const HEX_SIZE = 34;
export declare const HEX_ISO_TILT = 0.82;
export declare const HEX_TILE_HEIGHT = 5.5;
export declare const BOARD_CENTER_X = 240;
export declare const BOARD_CENTER_Y = 345;
export declare const HEX_GRID_RADIUS = 2;
export declare const STACK_CLEAR_THRESHOLD = 10;
export declare const MAX_DISPLAY_STACK_HEIGHT = 16;
export declare const HAND_Y = 635;
export declare const HAND_SLOTS_X: number[];
export declare const HAND_HEX_SIZE = 32;
export declare const MERGE_PITCH_SCALE: number[];
export interface ColorDef {
    id: number;
    name: string;
    main: string;
    mainLight: string;
    side: string;
    sideDark: string;
    glow: string;
    accent: string;
}
export declare const COLOR_PALETTE: ColorDef[];
export interface LevelConfig {
    targetTiles: number;
    colorCount: number;
    minStackSize: number;
    maxStackSize: number;
    maxColorLayers: number;
}
export declare function getLevelConfig(level: number): LevelConfig;
