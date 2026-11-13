import { BASE_MAX_HP, BASE_POSITION, GRID_COLS, GRID_ROWS, GRID_START_X, GRID_START_Y, SLOT_GAP, SLOT_SIZE, TRACK_BOTTOM, TRACK_LEFT, TRACK_RIGHT, TRACK_TOP, TRACK_WAYPOINTS, TRACK_WIDTH, TURRET_DEFINITIONS, VIRTUAL_HEIGHT, VIRTUAL_WIDTH, getTurretStats } from './constants';
export class PolyRenderer {
    ctx;
    pathOffset = 0;
    constructor(ctx) {
        this.ctx = ctx;
    }
    render(dt, slots, enemies, projectiles, baseHp, draggedSlotIndex, dragPointerPos, hoverSlotIndex, selectedSlotIndex, isFreezeActive) {
        const ctx = this.ctx;
        this.pathOffset = (this.pathOffset + dt * 40) % 24;
        // 1. Draw High-Tech Grid Backdrop
        this.drawBackground(ctx);
        // 2. Draw Rectangular Circuit Track
        this.drawTrack(ctx);
        // 3. Draw Player Base
        this.drawBase(ctx, baseHp);
        // 4. Draw Turret Range Indicator (if turret selected or being dragged)
        const activeSlotIndex = draggedSlotIndex ?? selectedSlotIndex;
        if (activeSlotIndex !== null && slots[activeSlotIndex]?.turret) {
            const turret = slots[activeSlotIndex].turret;
            const pos = draggedSlotIndex !== null && dragPointerPos ? dragPointerPos : slots[activeSlotIndex];
            this.drawTurretRange(ctx, turret, pos.x, pos.y);
        }
        // 5. Draw Central 4x4 Grid Sockets
        this.drawGridSlots(ctx, slots, draggedSlotIndex, hoverSlotIndex);
        // 6. Draw Turrets on Grid (except currently dragged one)
        for (const slot of slots) {
            if (slot.turret && slot.index !== draggedSlotIndex) {
                this.drawTurret(ctx, slot.turret, slot.x, slot.y, 1.0);
            }
        }
        // 7. Draw Projectiles
        this.drawProjectiles(ctx, projectiles);
        // 8. Draw Enemies & Health Bars
        this.drawEnemies(ctx, enemies, isFreezeActive);
        // 9. Draw Dragged Turret (following pointer)
        if (draggedSlotIndex !== null && dragPointerPos && slots[draggedSlotIndex]?.turret) {
            const turret = slots[draggedSlotIndex].turret;
            this.drawTurret(ctx, turret, dragPointerPos.x, dragPointerPos.y, 1.2, true);
        }
    }
    drawBackground(ctx) {
        // Deep dark space-slate background
        ctx.fillStyle = '#080b12';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
        // Subtle ambient grid pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
        ctx.lineWidth = 1;
        const step = 32;
        for (let x = 0; x <= VIRTUAL_WIDTH; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, VIRTUAL_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= VIRTUAL_HEIGHT; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(VIRTUAL_WIDTH, y);
            ctx.stroke();
        }
        ctx.restore();
    }
    drawTrack(ctx) {
        ctx.save();
        // Outer track bed
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Path road base
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = TRACK_WIDTH;
        ctx.beginPath();
        ctx.moveTo(TRACK_WAYPOINTS[0].x, TRACK_WAYPOINTS[0].y);
        for (let i = 1; i < TRACK_WAYPOINTS.length; i++) {
            ctx.lineTo(TRACK_WAYPOINTS[i].x, TRACK_WAYPOINTS[i].y);
        }
        ctx.stroke();
        // Path cyber border lines
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.5;
        const halfW = TRACK_WIDTH / 2;
        // Draw outer boundary
        ctx.strokeRect(TRACK_LEFT - halfW, TRACK_TOP - halfW, (TRACK_RIGHT - TRACK_LEFT) + TRACK_WIDTH, (TRACK_BOTTOM - TRACK_TOP) + TRACK_WIDTH);
        // Draw inner boundary
        ctx.strokeRect(TRACK_LEFT + halfW, TRACK_TOP + halfW, (TRACK_RIGHT - TRACK_LEFT) - TRACK_WIDTH, (TRACK_BOTTOM - TRACK_TOP) - TRACK_WIDTH);
        // Animated dashed center track line indicating enemy parade direction
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 16]);
        ctx.lineDashOffset = -this.pathOffset;
        ctx.beginPath();
        ctx.moveTo(TRACK_WAYPOINTS[0].x, TRACK_WAYPOINTS[0].y);
        for (let i = 1; i < TRACK_WAYPOINTS.length; i++) {
            ctx.lineTo(TRACK_WAYPOINTS[i].x, TRACK_WAYPOINTS[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Spawn Portal Marker at Top-Left entrance
        const spawnP = TRACK_WAYPOINTS[0];
        const grad = ctx.createRadialGradient(spawnP.x, spawnP.y, 2, spawnP.x, spawnP.y, 24);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(spawnP.x, spawnP.y, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SPAWN', spawnP.x, spawnP.y - 14);
        ctx.restore();
    }
    drawBase(ctx, baseHp) {
        const p = BASE_POSITION;
        ctx.save();
        ctx.translate(p.x, p.y);
        // Glowing shield ring
        const shieldPercent = Math.max(0, baseHp / BASE_MAX_HP);
        const shieldColor = shieldPercent > 0.5 ? '#10b981' : shieldPercent > 0.25 ? '#f59e0b' : '#ef4444';
        ctx.shadowColor = shieldColor;
        ctx.shadowBlur = 14;
        // Base Bunker Hexagon
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = shieldColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const hx = Math.cos(angle) * 24;
            const hy = Math.sin(angle) * 24;
            if (i === 0)
                ctx.moveTo(hx, hy);
            else
                ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner pulsing core
        ctx.fillStyle = shieldColor;
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Base label & HP
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('BASE', 0, 3);
        // Mini HP bar under base
        const barW = 34;
        const barH = 5;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-barW / 2, 28, barW, barH);
        ctx.fillStyle = shieldColor;
        ctx.fillRect(-barW / 2, 28, barW * shieldPercent, barH);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW / 2, 28, barW, barH);
        ctx.restore();
    }
    drawGridSlots(ctx, slots, draggedIndex, hoverIndex) {
        ctx.save();
        // Central platform border
        const pad = 10;
        const totalW = GRID_COLS * SLOT_SIZE + (GRID_COLS - 1) * SLOT_GAP;
        const totalH = GRID_ROWS * SLOT_SIZE + (GRID_ROWS - 1) * SLOT_GAP;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(GRID_START_X - pad, GRID_START_Y - pad, totalW + pad * 2, totalH + pad * 2, 12);
        ctx.fill();
        ctx.stroke();
        const draggedTurret = draggedIndex !== null ? slots[draggedIndex]?.turret : null;
        for (const slot of slots) {
            const isHovered = slot.index === hoverIndex;
            const isDraggedFrom = slot.index === draggedIndex;
            const left = slot.x - SLOT_SIZE / 2;
            const top = slot.y - SLOT_SIZE / 2;
            ctx.save();
            // Slot background
            ctx.fillStyle = isDraggedFrom ? 'rgba(30, 41, 59, 0.3)' : 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            if (isHovered && draggedTurret) {
                if (!slot.turret) {
                    // Valid move to empty slot
                    ctx.strokeStyle = '#22c55e';
                    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
                    ctx.lineWidth = 2.5;
                }
                else if (slot.turret.type === draggedTurret.type &&
                    slot.turret.level === draggedTurret.level) {
                    // Valid MERGE! Golden rainbow pulse
                    ctx.strokeStyle = '#fbbf24';
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = 12;
                }
                else {
                    // Invalid merge
                    ctx.strokeStyle = '#ef4444';
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
                    ctx.lineWidth = 2;
                }
            }
            ctx.beginPath();
            ctx.roundRect(left, top, SLOT_SIZE, SLOT_SIZE, 8);
            ctx.fill();
            ctx.stroke();
            // High-tech corner bracket accents
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
            ctx.lineWidth = 1;
            const cornerLen = 6;
            // Top-Left
            ctx.beginPath();
            ctx.moveTo(left, top + cornerLen);
            ctx.lineTo(left, top);
            ctx.lineTo(left + cornerLen, top);
            ctx.stroke();
            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(left + SLOT_SIZE, top + SLOT_SIZE - cornerLen);
            ctx.lineTo(left + SLOT_SIZE, top + SLOT_SIZE);
            ctx.lineTo(left + SLOT_SIZE - cornerLen, top + SLOT_SIZE);
            ctx.stroke();
            // If slot is empty, draw subtle plus / socket crosshair
            if (!slot.turret) {
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
                ctx.beginPath();
                ctx.moveTo(slot.x - 5, slot.y);
                ctx.lineTo(slot.x + 5, slot.y);
                ctx.moveTo(slot.x, slot.y - 5);
                ctx.lineTo(slot.x, slot.y + 5);
                ctx.stroke();
            }
            // If hovered for merge, render "MERGE" text prompt
            if (isHovered &&
                draggedTurret &&
                slot.turret &&
                slot.turret.type === draggedTurret.type &&
                slot.turret.level === draggedTurret.level) {
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#fbbf24';
                ctx.font = '900 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MERGE!', slot.x, slot.y + SLOT_SIZE / 2 + 12);
            }
            ctx.restore();
        }
        ctx.restore();
    }
    drawTurret(ctx, turret, x, y, scale = 1.0, isDragging = false) {
        const def = TURRET_DEFINITIONS[turret.type];
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        if (isDragging) {
            ctx.shadowColor = def.glowColor;
            ctx.shadowBlur = 18;
        }
        // 1. Turret Base Socket
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // 2. Turret Rotating Body (Rotates towards target with recoil)
        ctx.save();
        ctx.rotate(turret.rotation);
        // Apply recoil translation along opposite of firing direction
        const recoilOffset = -turret.recoil * 5;
        ctx.translate(recoilOffset, 0);
        // Draw Archetype and Level-specific procedural geometry
        this.drawProceduralTurretGeometry(ctx, turret.type, turret.level, def.color, def.accentColor);
        ctx.restore();
        // 3. Central Glowing Energy Core
        ctx.fillStyle = def.color;
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // 4. Level Badge (Pill in bottom-right corner of turret socket)
        const badgeX = 12;
        const badgeY = 12;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX - 11, badgeY - 7, 22, 14, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`L${turret.level}`, badgeX, badgeY + 1);
        ctx.restore();
    }
    drawProceduralTurretGeometry(ctx, type, level, color, accent) {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        switch (type) {
            case 'BLASTER': {
                // High cadence dual/quad cannons
                if (level === 1) {
                    // Single blaster
                    ctx.fillRect(4, -3, 14, 6);
                    ctx.strokeRect(4, -3, 14, 6);
                }
                else if (level === 2) {
                    // Twin parallel blasters
                    ctx.fillRect(4, -6, 15, 4);
                    ctx.strokeRect(4, -6, 15, 4);
                    ctx.fillRect(4, 2, 15, 4);
                    ctx.strokeRect(4, 2, 15, 4);
                }
                else if (level === 3) {
                    // Triple blasters + side wings
                    ctx.fillRect(4, -7, 16, 3.5);
                    ctx.strokeRect(4, -7, 16, 3.5);
                    ctx.fillRect(5, -1.75, 18, 3.5);
                    ctx.strokeRect(5, -1.75, 18, 3.5);
                    ctx.fillRect(4, 3.5, 16, 3.5);
                    ctx.strokeRect(4, 3.5, 16, 3.5);
                }
                else {
                    // Quad gatling array + energy fins
                    ctx.fillRect(4, -8, 17, 3);
                    ctx.strokeRect(4, -8, 17, 3);
                    ctx.fillRect(6, -4, 19, 3);
                    ctx.strokeRect(6, -4, 19, 3);
                    ctx.fillRect(6, 1, 19, 3);
                    ctx.strokeRect(6, 1, 19, 3);
                    ctx.fillRect(4, 5, 17, 3);
                    ctx.strokeRect(4, 5, 17, 3);
                }
                // Blaster muzzle caps
                ctx.fillStyle = color;
                ctx.fillRect(17, -2, 3, 4);
                break;
            }
            case 'CANNON': {
                // Heavy explosive artillery
                const barrelLen = 14 + Math.min(8, level * 2);
                const barrelH = 9 + Math.min(6, level * 1.5);
                ctx.fillRect(2, -barrelH / 2, barrelLen, barrelH);
                ctx.strokeRect(2, -barrelH / 2, barrelLen, barrelH);
                // Heavy muzzle ring
                ctx.fillStyle = accent;
                ctx.fillRect(barrelLen - 2, -(barrelH + 2) / 2, 5, barrelH + 2);
                // Outer reinforce rings based on level
                for (let ring = 1; ring < level; ring++) {
                    ctx.strokeStyle = color;
                    ctx.beginPath();
                    ctx.arc(-2, 0, 10 + ring * 3, -Math.PI / 2, Math.PI / 2);
                    ctx.stroke();
                }
                break;
            }
            case 'FROST': {
                // Triangular cryo crystals
                const tipX = 16 + Math.min(6, level * 2);
                ctx.beginPath();
                ctx.moveTo(tipX, 0);
                ctx.lineTo(-6, -10);
                ctx.lineTo(-2, 0);
                ctx.lineTo(-6, 10);
                ctx.closePath();
                ctx.fillStyle = '#0e2439';
                ctx.fill();
                ctx.stroke();
                // Orbiting frost crystal shards
                const shardCount = Math.min(6, 2 + level);
                ctx.fillStyle = accent;
                for (let i = 0; i < shardCount; i++) {
                    const ang = (i * Math.PI * 2) / shardCount;
                    const dist = 14 + (level > 2 ? 4 : 0);
                    const sx = Math.cos(ang) * dist;
                    const sy = Math.sin(ang) * dist;
                    ctx.fillRect(sx - 2, sy - 2, 4, 4);
                }
                break;
            }
            case 'SNIPER': {
                // Long needle railgun barrel with magnetic coils
                const railLen = 22 + Math.min(10, level * 2);
                ctx.fillStyle = '#1e1035';
                ctx.fillRect(2, -2.5, railLen, 5);
                ctx.strokeRect(2, -2.5, railLen, 5);
                // Magnetic accelerator coils
                const coilCount = 2 + Math.min(4, level);
                ctx.fillStyle = color;
                for (let i = 0; i < coilCount; i++) {
                    const cx = 6 + i * 4.5;
                    ctx.fillRect(cx, -4.5, 2.5, 9);
                }
                // Long laser sight line indicator
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(railLen + 3, 0);
                ctx.lineTo(railLen + 40, 0);
                ctx.stroke();
                ctx.setLineDash([]);
                break;
            }
        }
    }
    drawTurretRange(ctx, turret, x, y) {
        const stats = getTurretStats(turret.type, turret.level);
        const def = TURRET_DEFINITIONS[turret.type];
        ctx.save();
        ctx.strokeStyle = def.color;
        ctx.fillStyle = def.glowColor.replace('0.6', '0.08');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(x, y, stats.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
    drawEnemies(ctx, enemies, isFreezeActive) {
        for (const e of enemies) {
            ctx.save();
            ctx.translate(e.x, e.y);
            // Hit flash or normal color
            const isHit = e.hitFlashTimer > 0;
            const isSlowed = e.slowTimer > 0 || isFreezeActive;
            ctx.save();
            ctx.rotate(e.rotation);
            // Boss aura
            if (e.isBoss) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, e.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
            }
            // Frost aura when slowed / frozen
            if (isSlowed) {
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(0, 0, e.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            // Draw Polygon shape
            ctx.fillStyle = isHit ? '#ffffff' : isSlowed ? '#1e3a8a' : '#0f172a';
            ctx.strokeStyle = isHit ? '#ffffff' : isSlowed ? '#38bdf8' : e.color;
            ctx.lineWidth = e.isBoss ? 3 : 2;
            this.drawPolygonShape(ctx, e.shape, e.radius);
            ctx.restore();
            // Enemy Health Bar (Visible Health Bars requirement!)
            this.drawEnemyHealthBar(ctx, e);
            ctx.restore();
        }
    }
    drawPolygonShape(ctx, shape, radius) {
        let sides = 3;
        if (shape === 'triangle')
            sides = 3;
        else if (shape === 'square')
            sides = 4;
        else if (shape === 'pentagon')
            sides = 5;
        else if (shape === 'hexagon')
            sides = 6;
        else if (shape === 'octagon')
            sides = 8;
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0)
                ctx.moveTo(px, py);
            else
                ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner glowing core
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(2, radius * 0.25), 0, Math.PI * 2);
        ctx.fill();
    }
    drawEnemyHealthBar(ctx, e) {
        const barW = Math.max(28, e.radius * 2 + 6);
        const barH = e.isBoss ? 6 : 4;
        const barY = -e.radius - 10;
        const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
        // Bar background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-barW / 2, barY, barW, barH);
        // HP Fill color (Green -> Yellow -> Red)
        let fillColor = '#22c55e';
        if (hpRatio < 0.3)
            fillColor = '#ef4444';
        else if (hpRatio < 0.6)
            fillColor = '#f59e0b';
        ctx.fillStyle = fillColor;
        ctx.fillRect(-barW / 2, barY, barW * hpRatio, barH);
        // Bar border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barW / 2, barY, barW, barH);
        // If Boss, display HP numbers
        if (e.isBoss) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.ceil(e.hp)} / ${e.maxHp}`, 0, barY - 3);
        }
    }
    drawProjectiles(ctx, projectiles) {
        for (const p of projectiles) {
            ctx.save();
            if (p.turretType === 'SNIPER') {
                // High-velocity purple railgun laser beam trail
                const alpha = Math.max(0, p.life / p.maxLife);
                ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                ctx.lineWidth = p.isCrit ? 4 : 2.5;
                ctx.shadowColor = '#c084fc';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(p.startX, p.startY);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                // Projectile tip
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (p.turretType === 'CANNON') {
                // Fiery explosive cannon shell
                ctx.fillStyle = '#ff7700';
                ctx.shadowColor = '#fb923c';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                // Inner hot core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            else if (p.turretType === 'FROST') {
                // Spiky blue frost crystal
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 8;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.life * 10);
                ctx.fillRect(-3, -3, 6, 6);
                ctx.restore();
            }
            else {
                // Cyan Blaster energy bolt with directional tail
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 8;
                const dirX = p.vx / 460;
                const dirY = p.vy / 460;
                ctx.beginPath();
                ctx.moveTo(p.x - dirX * 10, p.y - dirY * 10);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }
}
