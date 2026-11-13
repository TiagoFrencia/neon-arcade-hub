import { Enemy, GridSlot, Projectile, Turret } from './types';
export declare class PolyRenderer {
    private ctx;
    private pathOffset;
    constructor(ctx: CanvasRenderingContext2D);
    render(dt: number, slots: GridSlot[], enemies: Enemy[], projectiles: Projectile[], baseHp: number, draggedSlotIndex: number | null, dragPointerPos: {
        x: number;
        y: number;
    } | null, hoverSlotIndex: number | null, selectedSlotIndex: number | null, isFreezeActive: boolean): void;
    private drawBackground;
    private drawTrack;
    private drawBase;
    private drawGridSlots;
    drawTurret(ctx: CanvasRenderingContext2D, turret: Turret, x: number, y: number, scale?: number, isDragging?: boolean): void;
    private drawProceduralTurretGeometry;
    private drawTurretRange;
    private drawEnemies;
    private drawPolygonShape;
    private drawEnemyHealthBar;
    private drawProjectiles;
}
