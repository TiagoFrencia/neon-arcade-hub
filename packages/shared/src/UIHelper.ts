/**
 * UIHelper.ts - 2D Neon Particle System, Floating Text, and ScreenShake for HTML5 Canvas
 * High performance, zero allocations in steady state where possible, designed for 60fps arcade gameplay.
 */

export interface NeonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  glow: number;
  drag: number;
  gravity: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  strokeColor: string;
  fontSize: number;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  private particles: NeonParticle[] = [];
  private texts: FloatingText[] = [];

  /**
   * Spawns an explosion burst of neon sparks
   */
  public spawnNeonBurst(
    x: number,
    y: number,
    color: string,
    count = 24,
    speed = 220,
    size = 3.5
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (0.3 + Math.random() * 0.7) * speed;
      const life = 0.35 + Math.random() * 0.45;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size: (0.6 + Math.random() * 0.8) * size,
        color,
        glow: 8,
        drag: 0.95,
        gravity: 120
      });
    }
  }

  /**
   * Spawns a floating arcade score text e.g. "+10", "COMBO x2"
   */
  public spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color = '#00f0ff',
    fontSize = 18,
    duration = 0.75,
    strokeColor = '#000000'
  ): void {
    this.texts.push({
      x,
      y,
      vy: -60,
      text,
      color,
      strokeColor,
      fontSize,
      life: duration,
      maxLife: duration,
      scale: 1.3
    });
  }

  /**
   * Update all particles and texts by delta time in seconds
   */
  public update(dt: number): void {
    const clampedDt = Math.min(dt, 0.1);

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= clampedDt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vx *= Math.pow(p.drag, clampedDt * 60);
      p.vy *= Math.pow(p.drag, clampedDt * 60);
      p.vy += p.gravity * clampedDt;

      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
    }

    // Update floating texts
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= clampedDt;

      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }

      t.y += t.vy * clampedDt;
      if (t.scale > 1.0) {
        t.scale = Math.max(1.0, t.scale - clampedDt * 2);
      }
    }
  }

  /**
   * Renders all active particles and texts onto the 2D canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.particles.length === 0 && this.texts.length === 0) return;

    ctx.save();

    // Render neon particles with additive glow
    if (this.particles.length > 0) {
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const progress = p.life / p.maxLife;
        const currentSize = p.size * progress;

        ctx.globalAlpha = Math.max(0, Math.min(1, progress));
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset glow before text rendering
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Render floating texts
    if (this.texts.length > 0) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < this.texts.length; i++) {
        const t = this.texts[i];
        const progress = t.life / t.maxLife;
        const alpha = Math.max(0, Math.min(1, progress * 1.2));

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);

        ctx.globalAlpha = alpha;
        ctx.font = `900 ${t.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        if (t.strokeColor) {
          ctx.strokeStyle = t.strokeColor;
          ctx.lineWidth = 3;
          ctx.strokeText(t.text, 0, 0);
        }

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);

        ctx.restore();
      }
    }

    ctx.restore();
  }

  public clear(): void {
    this.particles.length = 0;
    this.texts.length = 0;
  }
}

/**
 * ScreenShake - Smooth 2D Camera shake with quadratic decay
 */
export class ScreenShake {
  private intensity = 0;
  private duration = 0;
  private elapsed = 0;
  private offsetX = 0;
  private offsetY = 0;

  /**
   * Trigger a screen shake with intensity in pixels and duration in seconds
   */
  public shake(intensity: number, duration = 0.25): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.elapsed = 0;
  }

  /**
   * Update shake offsets
   */
  public update(dt: number): void {
    if (this.elapsed >= this.duration || this.intensity <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
      return;
    }

    this.elapsed += dt;
    const progress = Math.min(1, this.elapsed / this.duration);
    const decay = (1 - progress) * (1 - progress); // Quadratic decay
    const currentMagnitude = this.intensity * decay;

    const angle = Math.random() * Math.PI * 2;
    this.offsetX = Math.cos(angle) * currentMagnitude;
    this.offsetY = Math.sin(angle) * currentMagnitude;
  }

  /**
   * Applies the shake translation to the canvas rendering context
   */
  public apply(ctx: CanvasRenderingContext2D): void {
    if (this.offsetX !== 0 || this.offsetY !== 0) {
      ctx.translate(this.offsetX, this.offsetY);
    }
  }

  /**
   * Returns current offset vector
   */
  public getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  public reset(): void {
    this.intensity = 0;
    this.duration = 0;
    this.elapsed = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }
}
