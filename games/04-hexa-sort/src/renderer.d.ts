/**
 * renderer.ts - High-performance 2.5D Isometric Hexagonal Canvas Renderer
 * Zero external assets - all procedural canvas geometry, gradients, glows and 3D bevels.
 */
import { ColorDef } from './constants';
import { DraggedItem, HandSlot, HexCell, JumpingTile } from './types';
export declare class HexRenderer {
    private ctx;
    constructor(ctx: CanvasRenderingContext2D);
    /**
     * Pre-generates the 6 pointy-topped hex vertices
     */
    getHexCorners(cx: number, cy: number, size: number, tilt?: number): Array<{
        x: number;
        y: number;
    }>;
    /**
     * Creates a closed hexagonal path on the context
     */
    traceHexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tilt?: number): void;
    /**
     * Renders the deep arcade background with ambient lighting and subtle grid lines
     */
    renderBackground(time: number): void;
    /**
     * Renders a 3D extruded hexagonal chip prism
     */
    renderHexChip(cx: number, cy: number, size: number, thickness: number, colorDef: ColorDef, scaleY?: number, highlight?: boolean): void;
    /**
     * Renders the board cell socket base (empty or locked VIP)
     */
    renderCellBase(cell: HexCell, isHovered: boolean, isValidHover: boolean, time: number): void;
    /**
     * Renders a stack of chips in 2.5D isometric view
     */
    renderStack(cx: number, cy: number, stack: number[], bounce?: number, size?: number): void;
    /**
     * Renders the 3 Hand Tray pedestals
     */
    renderHandTrays(slots: HandSlot[], activeDragSlot: number | null, _time?: number): void;
    /**
     * Renders a flying chip following a parabolic arc
     */
    renderJumpingTile(jump: JumpingTile): void;
    /**
     * Renders the active dragged stack following the pointer
     */
    renderDraggedItem(dragged: DraggedItem, time: number): void;
    /**
     * Renders the destruction reticle for Hammer Mode
     */
    renderHammerReticle(cells: HexCell[], time: number): void;
}
