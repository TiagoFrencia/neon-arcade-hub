import { ParticleSystem } from '@arcade/shared';
import { CYBER_COLORS, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './constants';
import {
  Enemy,
  Player,
  Projectile,
  VirtualJoystick,
  XPGem
} from './types';
import { WeaponManager } from './weapons';

export class CyberRenderer {
  private ctx: CanvasRenderingContext2D;
  private cyberDust: { x: number; y: number; size: number; alpha: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;

    // Generate ambient cyber dust particles
    for (let i = 0; i < 60; i++) {
      this.cyberDust.push({
        x: Math.random() * VIRTUAL_WIDTH,
        y: Math.random() * VIRTUAL_HEIGHT,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1
      });
    }
  }

  public render(
    player: Player,
    camera: { x: number; y: number },
    enemies: Enemy[],
    projectiles: Projectile[],
    gems: XPGem[],
    weapons: WeaponManager,
    particles: ParticleSystem,
    joystick: VirtualJoystick,
    timeAlive: number
  ): void {
    const ctx = this.ctx;

    // 1. Draw Infinite Cybernetic Grid Background
    this.drawCyberGrid(camera, timeAlive);

    // Save camera transform for in-world game objects
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // 2. Draw XP Gems
    this.drawGems(gems, timeAlive);

    // 3. Draw Enemies
    this.drawEnemies(enemies, timeAlive);

    // 4. Draw Projectiles
    this.drawProjectiles(projectiles);

    // 5. Draw Weapon Effects (Lasers, Lightning, Novas, Shields)
    this.drawWeaponEffects(weapons, player, timeAlive);

    // 6. Draw Player Core Ship
    this.drawPlayer(player, timeAlive);

    // 7. Draw World Particles & Floating Damage Texts
    particles.render(ctx);

    ctx.restore();

    // 8. Draw Screen-Space HUD & Virtual Joystick
    this.drawVirtualJoystick(joystick);
  }

  /**
   * Infinite Cybernetic Grid with horizon glow and coordinates
   */
  private drawCyberGrid(camera: { x: number; y: number }, time: number): void {
    const ctx = this.ctx;
    const w = VIRTUAL_WIDTH;
    const h = VIRTUAL_HEIGHT;

    // Deep space gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, h * 0.75);
    bgGrad.addColorStop(0, '#0c0e1e');
    bgGrad.addColorStop(1, '#05060b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Ambient floating cyber dust
    ctx.fillStyle = '#00f0ff';
    for (let i = 0; i < this.cyberDust.length; i++) {
      const d = this.cyberDust[i];
      const dx = ((d.x - camera.x * 0.2) % w + w) % w;
      const dy = ((d.y - camera.y * 0.2) % h + h) % h;
      ctx.globalAlpha = d.alpha * (0.7 + 0.3 * Math.sin(time * 2 + i));
      ctx.beginPath();
      ctx.arc(dx, dy, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Grid lines calculation
    const gridSize = 60;
    const startX = -((camera.x % gridSize) + gridSize) % gridSize;
    const startY = -((camera.y % gridSize) + gridSize) % gridSize;

    ctx.save();
    ctx.strokeStyle = CYBER_COLORS.grid;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x < w + gridSize; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY; y < h + gridSize; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Major grid intersections
    const majorGrid = 240;
    const majorStartX = -((camera.x % majorGrid) + majorGrid) % majorGrid;
    const majorStartY = -((camera.y % majorGrid) + majorGrid) % majorGrid;

    ctx.strokeStyle = CYBER_COLORS.gridMajor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = majorStartX; x < w + majorGrid; x += majorGrid) {
      for (let y = majorStartY; y < h + majorGrid; y += majorGrid) {
        // Draw cyber cross at intersection
        const s = 6;
        ctx.moveTo(x - s, y);
        ctx.lineTo(x + s, y);
        ctx.moveTo(x, y - s);
        ctx.lineTo(x, y + s);
      }
    }
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw Player Geometric Ship / Core
   */
  private drawPlayer(player: Player, time: number): void {
    const ctx = this.ctx;

    // Flash if in invulnerability frames
    if (player.invulnTimer > 0 && Math.floor(time * 20) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(player.x, player.y);

    // Subtle Magnet pickup radius aura
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, player.magnetRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Rotate player to facing angle
    ctx.rotate(player.angle);

    // Thruster trail flame when moving
    const isMoving = Math.abs(player.vx) > 5 || Math.abs(player.vy) > 5;
    if (isMoving) {
      const flameLength = 14 + Math.random() * 8;
      ctx.fillStyle = CYBER_COLORS.cyan;
      ctx.shadowColor = CYBER_COLORS.cyan;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(-12 - flameLength, 0);
      ctx.lineTo(-12, 5);
      ctx.closePath();
      ctx.fill();
    }

    // Outer Geometric Cyber Ship (sleek delta polygon)
    ctx.shadowColor = CYBER_COLORS.cyan;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = CYBER_COLORS.cyan;
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#0e1726';

    ctx.beginPath();
    ctx.moveTo(18, 0); // Nose
    ctx.lineTo(-12, -14); // Left wing
    ctx.lineTo(-7, 0); // Rear notch
    ctx.lineTo(-12, 14); // Right wing
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner energy reactor core (spinning diamond)
    ctx.save();
    ctx.rotate(time * 4);
    ctx.fillStyle = CYBER_COLORS.green;
    ctx.shadowColor = CYBER_COLORS.green;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // Floating Player HP Bar above player
    const barW = 36;
    const barH = 4;
    const hpPct = Math.max(0, player.hp / player.maxHp);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 20, 0.7)';
    ctx.fillRect(player.x - barW / 2, player.y - player.radius - 12, barW, barH);

    ctx.fillStyle = hpPct > 0.4 ? CYBER_COLORS.green : CYBER_COLORS.magenta;
    ctx.fillRect(player.x - barW / 2, player.y - player.radius - 12, barW * hpPct, barH);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - barW / 2, player.y - player.radius - 12, barW, barH);
    ctx.restore();
  }

  /**
   * Draw Enemies with geometric forms & hit-flashes
   */
  private drawEnemies(enemies: Enemy[], time: number): void {
    const ctx = this.ctx;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active) continue;

      ctx.save();
      ctx.translate(e.x, e.y);

      const isFlashing = e.hitFlashTimer > 0;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#0c0f1d';
      ctx.strokeStyle = isFlashing ? '#ffffff' : e.color;
      ctx.shadowColor = isFlashing ? '#ffffff' : e.color;
      ctx.shadowBlur = isFlashing ? 16 : 8;
      ctx.lineWidth = 2;

      ctx.rotate(e.angle);

      switch (e.type) {
        case 'triangle': {
          // Sharp Fast Triangle
          ctx.beginPath();
          ctx.moveTo(e.radius * 1.3, 0);
          ctx.lineTo(-e.radius * 0.8, -e.radius);
          ctx.lineTo(-e.radius * 0.4, 0);
          ctx.lineTo(-e.radius * 0.8, e.radius);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'tank': {
          // Heavy Heavy Square with inner rotating core
          const s = e.radius * 0.85;
          ctx.beginPath();
          ctx.rect(-s, -s, s * 2, s * 2);
          ctx.fill();
          ctx.stroke();

          // Inner rotating accent
          ctx.rotate(time * 2);
          ctx.beginPath();
          ctx.rect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
          ctx.stroke();
          break;
        }

        case 'splitter':
        case 'mini_splitter': {
          // Glowing Hexagon
          const sides = 6;
          ctx.beginPath();
          for (let s = 0; s < sides; s++) {
            const a = (s * Math.PI * 2) / sides;
            const px = Math.cos(a) * e.radius;
            const py = Math.sin(a) * e.radius;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Internal split indicator node
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.35, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case 'boss': {
          // Colossal Titan Dreadnought
          const outerR = e.radius;
          ctx.lineWidth = 3.5;

          // Outer spiked cog wheel
          const spikes = 8;
          ctx.beginPath();
          for (let s = 0; s < spikes * 2; s++) {
            const a = (s * Math.PI) / spikes + time;
            const r = s % 2 === 0 ? outerR : outerR * 0.8;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Mid ring
          ctx.strokeStyle = CYBER_COLORS.yellow;
          ctx.beginPath();
          ctx.arc(0, 0, outerR * 0.55, 0, Math.PI * 2);
          ctx.stroke();

          // Pulsing Core
          ctx.fillStyle = '#ff0033';
          ctx.shadowColor = '#ff0033';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, 0, outerR * 0.35 * (0.85 + 0.15 * Math.sin(time * 6)), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();

      // Mini Health bar for wounded non-boss enemies
      if (e.hp < e.maxHp && !e.isBoss) {
        const bw = e.radius * 1.6;
        const bh = 3;
        const pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw, bh);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - bw / 2, e.y - e.radius - 8, bw * pct, bh);
      }
    }
  }

  /**
   * Draw XP Gems with magnetic trails
   */
  private drawGems(gems: XPGem[], time: number): void {
    const ctx = this.ctx;

    for (let i = 0; i < gems.length; i++) {
      const g = gems[i];
      if (!g.active) continue;

      ctx.save();
      ctx.translate(g.x, g.y);

      // Pulse animation
      const scale = 1 + 0.15 * Math.sin(time * 4 + g.pulseTimer);
      ctx.scale(scale, scale);

      ctx.fillStyle = g.color;
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 10;

      // Draw Diamond gem shape
      ctx.beginPath();
      ctx.moveTo(0, -g.radius);
      ctx.lineTo(g.radius * 0.75, 0);
      ctx.lineTo(0, g.radius);
      ctx.lineTo(-g.radius * 0.75, 0);
      ctx.closePath();
      ctx.fill();

      // Inner white sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, g.radius * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Draw Projectiles with motion glows
   */
  private drawProjectiles(projectiles: Projectile[]): void {
    const ctx = this.ctx;

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      const angle = Math.atan2(p.vy, p.vx);
      ctx.rotate(angle);

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;

      // Capsule shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius * 1.8, p.radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // White hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.radius * 0.5, 0, p.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * Draw Weapons Effects (Orbital Shields, Laser Beams, Chain Lightning, Nova Shockwaves)
   */
  private drawWeaponEffects(weapons: WeaponManager, player: Player, time: number): void {
    const ctx = this.ctx;

    // 1. Orbital Shields
    const orbitalLvl = player.weapons.get('orbital_shields') ?? 0;
    if (orbitalLvl > 0) {
      const positions = weapons.getOrbitalShieldPositions(player, orbitalLvl);
      const shieldR = 10 * (0.9 + 0.1 * Math.sin(time * 6));

      // Orbiting ring path
      const distance = orbitalLvl >= 4 ? 76 : 64;
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.x, player.y, distance, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        ctx.fillStyle = CYBER_COLORS.green;
        ctx.shadowColor = CYBER_COLORS.green;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, shieldR, 0, Math.PI * 2);
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, shieldR * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Chain Lightning Polylines
    for (let i = 0; i < weapons.activeLightnings.length; i++) {
      const l = weapons.activeLightnings[i];
      const alpha = Math.max(0, l.life / l.maxLife);

      ctx.save();
      ctx.strokeStyle = l.color;
      ctx.shadowColor = l.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = 3.5;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      for (let p = 0; p < l.points.length; p++) {
        const pt = l.points[p];
        if (p === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          // Add jagged mid-points for realistic electric arc
          const prev = l.points[p - 1];
          const midX = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 18;
          const midY = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 18;
          ctx.lineTo(midX, midY);
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();

      // Inner white bolt core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Laser Beams
    for (let i = 0; i < weapons.activeLasers.length; i++) {
      const b = weapons.activeLasers[i];
      const alpha = Math.max(0, b.life / b.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;

      // Outer laser aura
      ctx.strokeStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 24;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // Inner white beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.width * 0.4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      ctx.restore();
    }

    // 4. Nova Shockwaves
    for (let i = 0; i < weapons.activeNovas.length; i++) {
      const n = weapons.activeNovas[i];
      const alpha = Math.max(0, n.life / n.maxLife);

      ctx.save();
      ctx.strokeStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 20;
      ctx.lineWidth = 5 * alpha;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /**
   * Draw On-Screen Virtual Joystick when touch/mouse drag active
   */
  private drawVirtualJoystick(joystick: VirtualJoystick): void {
    if (!joystick.active) return;

    const ctx = this.ctx;
    ctx.save();

    // Outer Joystick Base
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.fillStyle = 'rgba(10, 20, 35, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = CYBER_COLORS.cyan;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(joystick.baseX, joystick.baseY, joystick.maxRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Direction accent ticks on outer base
    const tickCount = 8;
    for (let i = 0; i < tickCount; i++) {
      const a = (i * Math.PI * 2) / tickCount;
      const r1 = joystick.maxRadius - 6;
      const r2 = joystick.maxRadius;
      ctx.beginPath();
      ctx.moveTo(joystick.baseX + Math.cos(a) * r1, joystick.baseY + Math.sin(a) * r1);
      ctx.lineTo(joystick.baseX + Math.cos(a) * r2, joystick.baseY + Math.sin(a) * r2);
      ctx.stroke();
    }

    // Inner Glowing Knob
    ctx.fillStyle = CYBER_COLORS.cyan;
    ctx.shadowColor = CYBER_COLORS.cyan;
    ctx.shadowBlur = 16;

    ctx.beginPath();
    ctx.arc(joystick.currX, joystick.currY, 20, 0, Math.PI * 2);
    ctx.fill();

    // Knob Center Dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(joystick.currX, joystick.currY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
