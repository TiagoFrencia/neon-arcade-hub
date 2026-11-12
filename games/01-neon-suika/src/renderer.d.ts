import { TierConfig } from './types';
export declare class NeonRenderer {
    private ctx;
    constructor(ctx: CanvasRenderingContext2D);
    renderBackground(time: number): void;
    renderContainer(dangerActive: boolean, dangerProgress: number, time: number): void;
    private renderDangerLine;
    renderGuideLine(dropperX: number, dropperY: number, radius: number, isRainbow: boolean, tierConfig: TierConfig, hitY: number): void;
    renderDropperPiece(x: number, y: number, tier: number, isRainbow: boolean, time: number): void;
    renderNeonOrb(x: number, y: number, radius: number, tier: number, isRainbow: boolean, angle: number, time: number, isDropper?: boolean): void;
    private drawTierOrb;
    private drawRainbowOrb;
    renderNextPreview(previewCanvas: HTMLCanvasElement, nextTier: number): void;
}
