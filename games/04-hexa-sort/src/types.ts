/**
 * types.ts - Data interfaces for Hexa Sort
 */

export interface HexCoord {
  q: number;
  r: number;
}

export interface HexCell {
  q: number;
  r: number;
  x: number;
  y: number;
  isLocked: boolean;
  stack: number[]; // Array of color IDs from bottom (0) to top (stack.length - 1)
  bounce: number;  // Landing visual bounce factor
}

export interface HandSlot {
  index: number;
  x: number;
  y: number;
  stack: number[] | null;
}

export interface DraggedItem {
  slotIndex: number;
  stack: number[];
  x: number;
  y: number;
  targetCell: HexCell | null;
  isValidTarget: boolean;
}

export interface JumpingTile {
  id: number;
  colorId: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startElevation: number;  // Elevation in px at donor stack
  targetElevation: number; // Elevation in px at recipient stack
  delay: number;           // Delay before jump starts in seconds
  elapsed: number;
  duration: number;
  arcHeight: number;
  comboStep: number;
  recipientCell: HexCell;
  isLastInBatch: boolean;
}

export type GameState =
  | 'PLAYING'
  | 'RESOLVING'
  | 'HAMMER_MODE'
  | 'LEVEL_COMPLETE'
  | 'OUT_OF_SPACE';
