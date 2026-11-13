/**
 * board.ts - Hexagonal grid management, axial mathematics and cell state
 */
import { BOARD_CENTER_X, BOARD_CENTER_Y, HEX_GRID_RADIUS, HEX_ISO_TILT, HEX_SIZE } from './constants';
// The 6 axial directions for pointy-topped hexagons
export const AXIAL_DIRECTIONS = [
    { q: 1, r: 0 },
    { q: -1, r: 0 },
    { q: 0, r: 1 },
    { q: 0, r: -1 },
    { q: -1, r: 1 },
    { q: 1, r: -1 }
];
export class HexBoard {
    cells = [];
    cellMap = new Map();
    constructor() {
        this.initBoard();
    }
    initBoard() {
        this.cells = [];
        this.cellMap.clear();
        // 4 VIP locked cells placed at the outer extremities of the radius 2 grid
        const lockedCoords = new Set([
            '0,-2',
            '0,2',
            '-2,0',
            '2,0'
        ]);
        for (let q = -HEX_GRID_RADIUS; q <= HEX_GRID_RADIUS; q++) {
            const r1 = Math.max(-HEX_GRID_RADIUS, -q - HEX_GRID_RADIUS);
            const r2 = Math.min(HEX_GRID_RADIUS, -q + HEX_GRID_RADIUS);
            for (let r = r1; r <= r2; r++) {
                // Pointy-topped isometric projection
                const x = BOARD_CENTER_X + HEX_SIZE * Math.sqrt(3) * (q + r / 2);
                const y = BOARD_CENTER_Y + HEX_SIZE * 1.5 * r * HEX_ISO_TILT;
                const key = `${q},${r}`;
                const isLocked = lockedCoords.has(key);
                const cell = {
                    q,
                    r,
                    x,
                    y,
                    isLocked,
                    stack: [],
                    bounce: 0
                };
                this.cells.push(cell);
                this.cellMap.set(key, cell);
            }
        }
        // Sort cells by ascending Y for correct 2.5D isometric depth sorting
        this.cells.sort((a, b) => a.y - b.y || a.x - b.x);
    }
    getCell(q, r) {
        return this.cellMap.get(`${q},${r}`);
    }
    getNeighbors(cell) {
        const neighbors = [];
        for (const dir of AXIAL_DIRECTIONS) {
            const n = this.getCell(cell.q + dir.q, cell.r + dir.r);
            if (n) {
                neighbors.push(n);
            }
        }
        return neighbors;
    }
    getTopColor(cell) {
        if (cell.stack.length === 0)
            return null;
        return cell.stack[cell.stack.length - 1];
    }
    /**
     * Count contiguous tiles of the top color from the top of the stack downwards
     */
    getTopColorRun(cell) {
        if (cell.stack.length === 0)
            return 0;
        const topColor = cell.stack[cell.stack.length - 1];
        let count = 0;
        for (let i = cell.stack.length - 1; i >= 0; i--) {
            if (cell.stack[i] === topColor) {
                count++;
            }
            else {
                break;
            }
        }
        return count;
    }
    /**
     * Finds the closest cell to pointer coordinates within maxDistance
     */
    getClosestCell(x, y, maxDistance = 46) {
        let closest = null;
        let minDist = maxDistance;
        for (const cell of this.cells) {
            const dx = cell.x - x;
            const dy = cell.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closest = cell;
            }
        }
        return closest;
    }
    getEmptyUnlockedCount() {
        return this.cells.filter((c) => !c.isLocked && c.stack.length === 0).length;
    }
    getLockedCount() {
        return this.cells.filter((c) => c.isLocked).length;
    }
    getLockedCells() {
        return this.cells.filter((c) => c.isLocked);
    }
    /**
     * Unlocks up to `count` locked cells
     */
    unlockVIPCells(count = 2) {
        const locked = this.getLockedCells();
        const unlocked = [];
        for (let i = 0; i < Math.min(count, locked.length); i++) {
            locked[i].isLocked = false;
            unlocked.push(locked[i]);
        }
        return unlocked;
    }
    /**
     * Clears all tiles in a cell (used by Hammer or Revive)
     */
    clearCell(cell) {
        const removed = [...cell.stack];
        cell.stack = [];
        cell.bounce = 0;
        return removed;
    }
    /**
     * Clears all stacks on the board (new level)
     */
    clearAllStacks() {
        for (const cell of this.cells) {
            cell.stack = [];
            cell.bounce = 0;
        }
    }
    update(dt) {
        for (const cell of this.cells) {
            if (cell.bounce > 0) {
                cell.bounce = Math.max(0, cell.bounce - dt * 8);
            }
        }
    }
}
