/**
 * renderer.ts - High-performance 2.5D Isometric Hexagonal Canvas Renderer
 * Zero external assets - all procedural canvas geometry, gradients, glows and 3D bevels.
 */
import { COLOR_PALETTE, HAND_HEX_SIZE, HAND_Y, HEX_ISO_TILT, HEX_SIZE, HEX_TILE_HEIGHT, MAX_DISPLAY_STACK_HEIGHT, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './constants';
export class HexRenderer {
    ctx;
    constructor(ctx) {
        this.ctx = ctx;
    }
    /**
     * Pre-generates the 6 pointy-topped hex vertices
     */
    getHexCorners(cx, cy, size, tilt = HEX_ISO_TILT) {
        const corners = [];
        for (let k = 0; k < 6; k++) {
            const angle = (Math.PI / 6) + (k * Math.PI) / 3;
            corners.push({
                x: cx + size * Math.cos(angle),
                y: cy + size * Math.sin(angle) * tilt
            });
        }
        return corners;
    }
    /**
     * Creates a closed hexagonal path on the context
     */
    traceHexPath(ctx, cx, cy, size, tilt = HEX_ISO_TILT) {
        const corners = this.getHexCorners(cx, cy, size, tilt);
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) {
            ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();
    }
    /**
     * Renders the deep arcade background with ambient lighting and subtle grid lines
     */
    renderBackground(time) {
        const ctx = this.ctx;
        // Rich radial dark gradient
        const bgGrad = ctx.createRadialGradient(VIRTUAL_WIDTH / 2, 350, 40, VIRTUAL_WIDTH / 2, 400, 480);
        bgGrad.addColorStop(0, '#15162a');
        bgGrad.addColorStop(0.5, '#0c0d18');
        bgGrad.addColorStop(1, '#06060c');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        // Subtle ambient decorative rings around board
        ctx.save();
        ctx.translate(VIRTUAL_WIDTH / 2, 345);
        ctx.scale(1, HEX_ISO_TILT);
        const pulse = 0.5 + 0.5 * Math.sin(time * 1.5);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + 0.02 * pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 160, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(180, 0, 255, ${0.02 + 0.015 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 195, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    /**
     * Renders a 3D extruded hexagonal chip prism
     */
    renderHexChip(cx, cy, size, thickness, colorDef, scaleY = 1.0, highlight = false) {
        const ctx = this.ctx;
        const tilt = HEX_ISO_TILT * scaleY;
        const corners = this.getHexCorners(cx, cy, size, tilt);
        // 1. Draw 3D Extruded Front-Facing Side Walls
        // In pointy-topped isometric projection, visible front walls are edges:
        // 3->2 (left-down), 2->1 (bottom-left), 1->0 (bottom-right), 0->5 (right-down)
        const frontFaces = [
            { from: 3, to: 2, shade: colorDef.sideDark },
            { from: 2, to: 1, shade: colorDef.side },
            { from: 1, to: 0, shade: colorDef.side },
            { from: 0, to: 5, shade: colorDef.sideDark }
        ];
        for (const face of frontFaces) {
            const p1 = corners[face.from];
            const p2 = corners[face.to];
            ctx.fillStyle = face.shade;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p2.x, p2.y + thickness);
            ctx.lineTo(p1.x, p1.y + thickness);
            ctx.closePath();
            ctx.fill();
            // Subtle edge stroke
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        // 2. Draw Top Hexagonal Face
        ctx.save();
        this.traceHexPath(ctx, cx, cy, size, tilt);
        // Face gradient (angled glossy shine)
        const faceGrad = ctx.createLinearGradient(cx - size * 0.7, cy - size * 0.7 * tilt, cx + size * 0.7, cy + size * 0.7 * tilt);
        faceGrad.addColorStop(0, colorDef.mainLight);
        faceGrad.addColorStop(0.5, colorDef.main);
        faceGrad.addColorStop(1, colorDef.side);
        ctx.fillStyle = faceGrad;
        ctx.fill();
        // Top face border bevel
        ctx.strokeStyle = highlight ? '#ffffff' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = highlight ? 1.8 : 1.0;
        ctx.stroke();
        // Inner subtle concentric hex emblem
        const innerSize = size * 0.55;
        this.traceHexPath(ctx, cx, cy, innerSize, tilt);
        ctx.strokeStyle = colorDef.accent;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1;
        ctx.stroke();
        // Glossy light reflection crescent on upper half
        ctx.beginPath();
        ctx.moveTo(corners[3].x, corners[3].y);
        ctx.lineTo(corners[4].x, corners[4].y);
        ctx.lineTo(corners[5].x, corners[5].y);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.restore();
    }
    /**
     * Renders the board cell socket base (empty or locked VIP)
     */
    renderCellBase(cell, isHovered, isValidHover, time) {
        const ctx = this.ctx;
        const { x, y, isLocked } = cell;
        ctx.save();
        if (isLocked) {
            // Locked VIP Cell
            this.traceHexPath(ctx, x, y, HEX_SIZE, HEX_ISO_TILT);
            ctx.fillStyle = '#10111a';
            ctx.fill();
            // Metallic hatched border
            ctx.strokeStyle = 'rgba(255, 208, 0, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Padlock 🔒 / VIP label
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x, y - 2);
            ctx.font = '800 8px -apple-system, sans-serif';
            ctx.fillStyle = '#ffd000';
            ctx.letterSpacing = '1px';
            ctx.fillText('VIP', x, y + 10);
        }
        else {
            // Regular Board Cell Socket
            this.traceHexPath(ctx, x, y, HEX_SIZE, HEX_ISO_TILT);
            // Indented slot gradient
            const socketGrad = ctx.createRadialGradient(x, y, 5, x, y, HEX_SIZE);
            socketGrad.addColorStop(0, '#151724');
            socketGrad.addColorStop(1, '#0e0f18');
            ctx.fillStyle = socketGrad;
            ctx.fill();
            // Cell border
            if (isHovered) {
                if (isValidHover) {
                    // Valid drop target highlight - pulsing neon cyan
                    const pulse = 0.7 + 0.3 * Math.sin(time * 12);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${pulse})`;
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = '#00f0ff';
                    ctx.shadowBlur = 14;
                    ctx.stroke();
                }
                else {
                    // Occupied or locked invalid target - red glow
                    ctx.strokeStyle = 'rgba(255, 40, 80, 0.8)';
                    ctx.lineWidth = 2.0;
                    ctx.shadowColor = '#ff2850';
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                }
            }
            else {
                // Normal empty/occupied socket border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1.0;
                ctx.stroke();
                // Subtle center dot for empty socket
                if (cell.stack.length === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.beginPath();
                    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.restore();
    }
    /**
     * Renders a stack of chips in 2.5D isometric view
     */
    renderStack(cx, cy, stack, bounce = 0, size = HEX_SIZE) {
        if (stack.length === 0)
            return;
        const ctx = this.ctx;
        // Ground contact shadow
        ctx.save();
        this.traceHexPath(ctx, cx, cy + 4, size * 0.95, HEX_ISO_TILT);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.filter = 'blur(4px)';
        ctx.fill();
        ctx.restore();
        // Render chips from bottom (index 0) to top (stack.length - 1)
        const visibleCount = Math.min(stack.length, MAX_DISPLAY_STACK_HEIGHT);
        const topIndex = stack.length - 1;
        for (let i = 0; i < visibleCount; i++) {
            const colorId = stack[i];
            const colorDef = COLOR_PALETTE[colorId] ?? COLOR_PALETTE[0];
            const elevation = i * HEX_TILE_HEIGHT;
            const isTop = i === topIndex;
            // Apply bounce scale to the top chip if active
            const squash = isTop && bounce > 0 ? 1 + bounce * 0.15 : 1.0;
            const chipY = cy - elevation - (isTop ? bounce * 6 : 0);
            this.renderHexChip(cx, chipY, size, HEX_TILE_HEIGHT, colorDef, squash, isTop);
        }
        // Top chip stack counter badge if height >= 2
        if (stack.length >= 2) {
            const topY = cy - (visibleCount - 1) * HEX_TILE_HEIGHT - (bounce > 0 ? bounce * 6 : 0);
            ctx.save();
            ctx.font = '900 11px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(`${stack.length}`, cx, topY - 1);
            ctx.restore();
        }
    }
    /**
     * Renders the 3 Hand Tray pedestals
     */
    renderHandTrays(slots, activeDragSlot, _time) {
        const ctx = this.ctx;
        // Shelf container glass panel
        ctx.save();
        const shelfX = 40;
        const shelfY = HAND_Y - 48;
        const shelfW = VIRTUAL_WIDTH - 80;
        const shelfH = 96;
        // Background panel
        ctx.fillStyle = 'rgba(16, 17, 30, 0.85)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 18);
        ctx.fill();
        ctx.stroke();
        // Shelf header label
        ctx.font = '800 9px -apple-system, sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText('SPAWN TRAY', VIRTUAL_WIDTH / 2, shelfY + 12);
        ctx.restore();
        // Draw individual pedestals and stacks
        for (const slot of slots) {
            const { x, y, stack, index } = slot;
            const isBeingDragged = activeDragSlot === index;
            // Pedestal socket base
            ctx.save();
            this.traceHexPath(ctx, x, y, HAND_HEX_SIZE, HEX_ISO_TILT);
            ctx.fillStyle = '#0f101d';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();
            if (!stack || isBeingDragged) {
                // Empty slot dashed accent
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            // Render stack if present and not currently being dragged
            if (stack && !isBeingDragged) {
                this.renderStack(x, y, stack, 0, HAND_HEX_SIZE);
            }
        }
    }
    /**
     * Renders a flying chip following a parabolic arc
     */
    renderJumpingTile(jump) {
        if (jump.elapsed < 0)
            return; // Waiting for stagger delay
        const ctx = this.ctx;
        const p = Math.min(1, Math.max(0, jump.elapsed / jump.duration));
        // Smooth quadratic parabolic curve
        const arc = 4 * p * (1 - p) * jump.arcHeight;
        const currX = jump.startX + (jump.targetX - jump.startX) * p;
        const baseElev = jump.startElevation + (jump.targetElevation - jump.startElevation) * p;
        const linearY = jump.startY + (jump.targetY - jump.startY) * p - baseElev;
        const currY = linearY - arc;
        // Ground projection shadow
        const groundY = jump.startY + (jump.targetY - jump.startY) * p;
        const shadowScale = Math.max(0.4, 1 - arc / 150);
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.filter = 'blur(4px)';
        this.traceHexPath(ctx, currX, groundY + 4, HEX_SIZE * 0.8 * shadowScale, HEX_ISO_TILT);
        ctx.fill();
        ctx.restore();
        // Render flying chip with slight dynamic tilt
        const colorDef = COLOR_PALETTE[jump.colorId] ?? COLOR_PALETTE[0];
        const dynamicSquash = 1.0 + 0.1 * Math.sin(p * Math.PI);
        this.renderHexChip(currX, currY, HEX_SIZE, HEX_TILE_HEIGHT, colorDef, dynamicSquash, true);
    }
    /**
     * Renders the active dragged stack following the pointer
     */
    renderDraggedItem(dragged, time) {
        const ctx = this.ctx;
        const { x, y, stack, targetCell, isValidTarget } = dragged;
        // If hovering near a valid cell, render ghost snap preview at target cell
        if (targetCell && isValidTarget) {
            ctx.save();
            ctx.globalAlpha = 0.45;
            this.renderStack(targetCell.x, targetCell.y, stack, 0, HEX_SIZE);
            ctx.restore();
        }
        // Shadow under floating dragged stack
        ctx.save();
        this.traceHexPath(ctx, x, y + 24, HEX_SIZE * 1.15, HEX_ISO_TILT);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.filter = 'blur(8px)';
        ctx.fill();
        ctx.restore();
        // Render the elevated dragged stack
        ctx.save();
        const floatBob = Math.sin(time * 8) * 2;
        this.renderStack(x, y - 10 + floatBob, stack, 0, HEX_SIZE * 1.05);
        ctx.restore();
    }
    /**
     * Renders the destruction reticle for Hammer Mode
     */
    renderHammerReticle(cells, time) {
        const ctx = this.ctx;
        for (const cell of cells) {
            if (cell.stack.length === 0 || cell.isLocked)
                continue;
            const { x, y } = cell;
            const pulse = 0.5 + 0.5 * Math.sin(time * 8);
            ctx.save();
            ctx.strokeStyle = `rgba(255, 50, 80, ${0.7 + 0.3 * pulse})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            this.traceHexPath(ctx, x, y, HEX_SIZE + 4, HEX_ISO_TILT);
            ctx.stroke();
            // Mini hammer icon floating above stack
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const topY = y - cell.stack.length * HEX_TILE_HEIGHT - 12;
            ctx.fillText('🔨', x, topY);
            ctx.restore();
        }
    }
}
