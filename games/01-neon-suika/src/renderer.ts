import { CONTAINER, GAME_HEIGHT, GAME_WIDTH, TIERS } from './constants';
import { TierConfig } from './types';

export class NeonRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public renderBackground(time: number): void {
    const ctx = this.ctx;

    // Main dark cyberpunk background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle ambient grid
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;

    const gridSize = 32;
    const offset = (time * 0.01) % gridSize;

    for (let x = 0; x <= GAME_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    for (let y = offset; y <= GAME_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Ambient background nebula glow
    const nebulaGrad = ctx.createRadialGradient(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.65,
      50,
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.65,
      350
    );
    nebulaGrad.addColorStop(0, 'rgba(255, 0, 127, 0.06)');
    nebulaGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.04)');
    nebulaGrad.addColorStop(1, 'rgba(10, 10, 18, 0)');
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.restore();
  }

  public renderContainer(dangerActive: boolean, dangerProgress: number, time: number): void {
    const ctx = this.ctx;
    ctx.save();

    const left = CONTAINER.left;
    const right = CONTAINER.right;
    const top = CONTAINER.top;
    const bottom = CONTAINER.bottom;

    // Container inner backplate tint
    ctx.fillStyle = 'rgba(14, 15, 26, 0.75)';
    ctx.fillRect(left, top, right - left, bottom - top);

    // Neon borders (side walls and floor)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;

    ctx.beginPath();
    // Top-left entry notch
    ctx.moveTo(left - 12, top);
    ctx.lineTo(left, top);
    ctx.lineTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, top);
    ctx.lineTo(right + 12, top);
    ctx.stroke();

    // Secondary magenta decorative accent lines on outer rim
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(left - 8, top + 20);
    ctx.lineTo(left - 8, bottom + 8);
    ctx.lineTo(right + 8, bottom + 8);
    ctx.lineTo(right + 8, top + 20);
    ctx.stroke();

    // Cyber side ticks / height markers
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    for (let y = top + 50; y < bottom; y += 40) {
      ctx.fillRect(left - 6, y, 4, 2);
      ctx.fillRect(right + 2, y, 4, 2);
    }

    // Top danger line
    this.renderDangerLine(dangerActive, dangerProgress, time);

    ctx.restore();
  }

  private renderDangerLine(active: boolean, progress: number, time: number): void {
    const ctx = this.ctx;
    ctx.save();

    const y = CONTAINER.dangerLineY;
    const left = CONTAINER.left + 2;
    const right = CONTAINER.right - 2;

    if (active) {
      // Flashing bright neon red/pink danger line
      const pulse = 0.5 + Math.sin(time * 0.015) * 0.5;
      const alpha = 0.6 + pulse * 0.4;

      ctx.strokeStyle = `rgba(255, 0, 60, ${alpha})`;
      ctx.shadowColor = '#ff003c';
      ctx.shadowBlur = 18 + pulse * 10;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);

      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();

      // Warning text & progress countdown
      ctx.setLineDash([]);
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff003c';
      ctx.font = '900 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const remaining = Math.max(0, 2.5 * (1 - progress)).toFixed(1);
      ctx.fillText(`⚠️ OVERFLOW DANGER: ${remaining}s`, (left + right) / 2, y - 6);

      // Warning progress indicator bar
      const barWidth = 140;
      const barHeight = 4;
      const barX = (left + right - barWidth) / 2;
      const barY = y - 4;

      ctx.fillStyle = 'rgba(255, 0, 60, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      ctx.fillStyle = '#ff003c';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    } else {
      // Idle dashed warning threshold
      ctx.strokeStyle = 'rgba(255, 0, 100, 0.3)';
      ctx.shadowColor = '#ff0066';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);

      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  public renderGuideLine(
    dropperX: number,
    dropperY: number,
    radius: number,
    isRainbow: boolean,
    tierConfig: TierConfig,
    hitY: number
  ): void {
    const ctx = this.ctx;
    ctx.save();

    const startY = dropperY + radius;
    const endY = Math.min(CONTAINER.bottom, hitY);

    if (startY < endY) {
      ctx.setLineDash([5, 7]);
      ctx.lineWidth = 2;

      if (isRainbow) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = tierConfig.glowColor;
        ctx.shadowColor = tierConfig.color;
        ctx.shadowBlur = 8;
      }

      ctx.beginPath();
      ctx.moveTo(dropperX, startY);
      ctx.lineTo(dropperX, endY);
      ctx.stroke();

      // Guide impact point indicator
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(dropperX, endY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isRainbow ? '#ffffff' : tierConfig.color;
      ctx.fill();
    }

    ctx.restore();
  }

  public renderDropperPiece(
    x: number,
    y: number,
    tier: number,
    isRainbow: boolean,
    time: number
  ): void {
    const config = TIERS[tier - 1];
    this.renderNeonOrb(x, y, config.radius, tier, isRainbow, 0, time, true);
  }

  public renderNeonOrb(
    x: number,
    y: number,
    radius: number,
    tier: number,
    isRainbow: boolean,
    angle: number,
    time: number,
    isDropper = false
  ): void {
    const ctx = this.ctx;
    const config = TIERS[tier - 1];

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    if (isRainbow) {
      this.drawRainbowOrb(ctx, radius, time, isDropper);
    } else {
      this.drawTierOrb(ctx, radius, config, time);
    }

    ctx.restore();
  }

  private drawTierOrb(
    ctx: CanvasRenderingContext2D,
    radius: number,
    config: TierConfig,
    time: number
  ): void {
    // 1. Outer Neon Glow
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = Math.min(24, radius * 0.45);

    // 2. High-Tech Glass / Plasma Radial Gradient
    const highlightX = -radius * 0.3;
    const highlightY = -radius * 0.3;
    const grad = ctx.createRadialGradient(
      highlightX,
      highlightY,
      radius * 0.08,
      0,
      0,
      radius
    );

    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.28, config.color);
    grad.addColorStop(0.75, config.secondaryColor);
    grad.addColorStop(1, '#070712');

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. Crisp outer neon perimeter ring
    ctx.shadowBlur = Math.min(18, radius * 0.35);
    ctx.strokeStyle = config.color;
    ctx.lineWidth = Math.max(1.5, radius * 0.06);
    ctx.stroke();

    // 4. Inner concentric tech ring
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // If Tier 10 (Giant Magenta Sun), render sun flare corona rays!
    if (config.tier === 10) {
      ctx.save();
      const rays = 12;
      const rayLen = radius * 1.25;
      const rot = time * 0.001;

      ctx.strokeStyle = 'rgba(255, 234, 0, 0.45)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 12;

      for (let i = 0; i < rays; i++) {
        const a = rot + (i * Math.PI * 2) / rays;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (radius * 0.9), Math.sin(a) * (radius * 0.9));
        ctx.lineTo(Math.cos(a) * rayLen, Math.sin(a) * rayLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Tier numeral badge
    const fontSize = Math.max(10, Math.floor(radius * 0.62));
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Dark text outline for maximum readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#05050e';
    ctx.strokeText(config.symbol, 0, 1);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(config.symbol, 0, 1);
  }

  private drawRainbowOrb(
    ctx: CanvasRenderingContext2D,
    radius: number,
    time: number,
    isDropper: boolean
  ): void {
    const cycle = (time * 0.12) % 360;

    // Glowing multi-color shadow
    ctx.shadowColor = `hsl(${cycle}, 100%, 65%)`;
    ctx.shadowBlur = 28;

    const grad = ctx.createRadialGradient(
      -radius * 0.25,
      -radius * 0.25,
      radius * 0.1,
      0,
      0,
      radius
    );

    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, `hsl(${cycle}, 100%, 70%)`);
    grad.addColorStop(0.65, `hsl(${(cycle + 120) % 360}, 100%, 60%)`);
    grad.addColorStop(1, `hsl(${(cycle + 240) % 360}, 100%, 45%)`);

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Vibrant rotating rainbow edge ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner sparkling star
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(12, Math.floor(radius * 0.7))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈', 0, 0);

    if (isDropper) {
      // Rainbow aura pulse
      ctx.strokeStyle = `hsla(${(cycle + 60) % 360}, 100%, 70%, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  public renderNextPreview(
    previewCanvas: HTMLCanvasElement,
    nextTier: number
  ): void {
    const pCtx = previewCanvas.getContext('2d');
    if (!pCtx) return;

    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    const centerX = previewCanvas.width / 2;
    const centerY = previewCanvas.height / 2;

    const config = TIERS[nextTier - 1];
    // Scale down larger preview orbs so they fit neatly inside preview box
    const maxRadius = Math.min(centerX - 4, centerY - 4);
    const displayRadius = Math.min(config.radius, maxRadius);

    pCtx.save();
    pCtx.translate(centerX, centerY);

    pCtx.shadowColor = config.glowColor;
    pCtx.shadowBlur = 12;

    const grad = pCtx.createRadialGradient(
      -displayRadius * 0.3,
      -displayRadius * 0.3,
      displayRadius * 0.1,
      0,
      0,
      displayRadius
    );
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, config.color);
    grad.addColorStop(0.75, config.secondaryColor);
    grad.addColorStop(1, '#070712');

    pCtx.beginPath();
    pCtx.arc(0, 0, displayRadius, 0, Math.PI * 2);
    pCtx.fillStyle = grad;
    pCtx.fill();

    pCtx.strokeStyle = config.color;
    pCtx.lineWidth = 1.8;
    pCtx.stroke();

    pCtx.shadowBlur = 0;
    pCtx.font = `900 ${Math.max(10, Math.floor(displayRadius * 0.65))}px system-ui, sans-serif`;
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';
    pCtx.strokeStyle = '#05050e';
    pCtx.lineWidth = 3;
    pCtx.strokeText(config.symbol, 0, 1);
    pCtx.fillStyle = '#ffffff';
    pCtx.fillText(config.symbol, 0, 1);

    pCtx.restore();
  }
}
