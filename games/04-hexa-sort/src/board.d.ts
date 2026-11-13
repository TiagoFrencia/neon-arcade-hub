/**
 * board.ts - Hexagonal grid management, axial mathematics and cell state
 */
import { HexCell, HexCoord } from './types';
export declare const AXIAL_DIRECTIONS: HexCoord[];
export declare class HexBoard {
    cells: HexCell[];
    private cellMap;
    constructor();
    initBoard(): void;
    getCell(q: number, r: number): HexCell | undefined;
    getNeighbors(cell: HexCell): HexCell[];
    getTopColor(cell: HexCell): number | null;
    /**
     * Count contiguous tiles of the top color from the top of the stack downwards
     */
    getTopColorRun(cell: HexCell): number;
    /**
     * Finds the closest cell to pointer coordinates within maxDistance
     */
    getClosestCell(x: number, y: number, maxDistance?: number): HexCell | null;
    getEmptyUnlockedCount(): number;
    getLockedCount(): number;
    getLockedCells(): HexCell[];
    /**
     * Unlocks up to `count` locked cells
     */
    unlockVIPCells(count?: number): HexCell[];
    /**
     * Clears all tiles in a cell (used by Hammer or Revive)
     */
    clearCell(cell: HexCell): number[];
    /**
     * Clears all stacks on the board (new level)
     */
    clearAllStacks(): void;
    update(dt: number): void;
}
