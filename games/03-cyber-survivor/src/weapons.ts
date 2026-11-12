import { soundEngine } from '@arcade/shared';
import { CYBER_COLORS } from './constants';
import { EnemyPool, ProjectilePool } from './pools';
import {
  Enemy,
  LaserBeam,
  LightningStrike,
  NovaWave,
  Player
} from './types';

export class WeaponManager {
  private plasmaCooldown = 0;
  private chainLightningCooldown = 0;
  private laserCooldown = 0;
  private novaCooldown = 0;

  // Orbital shields state
  private orbitalAngle = 0;

  // Transient effect arrays
  public activeLightnings: LightningStrike[] = [];
  public activeLasers: LaserBeam[] = [];
  public activeNovas: NovaWave[] = [];

  // Global modifiers from stat cards
  public damageMultiplier = 1.0;
  public cooldownMultiplier = 1.0;

  constructor() {}

  public update(
    dt: number,
    player: Player,
    enemyPool: EnemyPool,
    projectilePool: ProjectilePool,
    onEnemyDamaged: (enemy: Enemy, damage: number, isCrit?: boolean) => void
  ): void {
    const enemies = enemyPool.getActives();

    // 1. Plasma Bolt
    const plasmaLvl = player.weapons.get('plasma_bolt') ?? 0;
    if (plasmaLvl > 0) {
      this.plasmaCooldown -= dt;
      const baseCd = plasmaLvl === 1 ? 0.65 : plasmaLvl === 2 ? 0.48 : 0.42;
      const effectiveCd = baseCd * this.cooldownMultiplier;

      if (this.plasmaCooldown <= 0) {
        this.firePlasmaBolt(player, plasmaLvl, enemies, projectilePool);
        this.plasmaCooldown = effectiveCd;
      }
    }

    // 2. Orbital Shields
    const orbitalLvl = player.weapons.get('orbital_shields') ?? 0;
    if (orbitalLvl > 0) {
      this.updateOrbitalShields(dt, player, orbitalLvl, enemies, onEnemyDamaged);
    }

    // 3. Chain Lightning
    const lightningLvl = player.weapons.get('chain_lightning') ?? 0;
    if (lightningLvl > 0) {
      this.chainLightningCooldown -= dt;
      const baseCd = lightningLvl === 1 ? 2.4 : lightningLvl === 2 ? 2.0 : lightningLvl === 3 ? 1.7 : 1.4;
      const effectiveCd = baseCd * this.cooldownMultiplier;

      if (this.chainLightningCooldown <= 0) {
        this.fireChainLightning(player, lightningLvl, enemies, onEnemyDamaged);
        this.chainLightningCooldown = effectiveCd;
      }
    }

    // 4. Laser Beam
    const laserLvl = player.weapons.get('laser_beam') ?? 0;
    if (laserLvl > 0) {
      this.laserCooldown -= dt;
      const baseCd = laserLvl === 1 ? 3.2 : laserLvl === 2 ? 2.8 : laserLvl === 3 ? 2.4 : 2.0;
      const effectiveCd = baseCd * this.cooldownMultiplier;

      if (this.laserCooldown <= 0) {
        this.fireLaserBeam(player, laserLvl, enemies);
        this.laserCooldown = effectiveCd;
      }
    }

    // 5. Nova Pulse
    const novaLvl = player.weapons.get('nova_pulse') ?? 0;
    if (novaLvl > 0) {
      this.novaCooldown -= dt;
      const baseCd = novaLvl === 1 ? 4.2 : novaLvl === 2 ? 3.6 : novaLvl === 3 ? 3.0 : 2.4;
      const effectiveCd = baseCd * this.cooldownMultiplier;

      if (this.novaCooldown <= 0) {
        this.fireNovaPulse(player, novaLvl);
        this.novaCooldown = effectiveCd;
      }
    }

    // Update transient visual effects & apply continuous area damage
    this.updateTransientEffects(dt, enemies, onEnemyDamaged);
  }

  /**
   * Weapon 1: Plasma Bolt (Direct homing / targeted projectile)
   */
  private firePlasmaBolt(
    player: Player,
    level: number,
    enemies: Enemy[],
    projectilePool: ProjectilePool
  ): void {
    if (enemies.length === 0) return;

    // Find closest enemies within 550px
    const inRange = enemies
      .map((e) => {
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        return { enemy: e, distSq: dx * dx + dy * dy };
      })
      .filter((item) => item.distSq <= 550 * 550)
      .sort((a, b) => a.distSq - b.distSq);

    if (inRange.length === 0) return;

    const baseDmg = (level === 1 ? 22 : level === 2 ? 28 : level === 3 ? 34 : 48) * this.damageMultiplier;
    const pierce = level >= 4 ? 2 : 0;
    const boltSpeed = level >= 2 ? 580 : 480;

    // Determine shot count based on level
    const shotCount = level >= 4 ? 3 : level >= 3 ? 2 : 1;

    for (let i = 0; i < shotCount; i++) {
      const target = inRange[Math.min(i, inRange.length - 1)].enemy;
      const angle = Math.atan2(target.y - player.y, target.x - player.x);
      const spread = (i - (shotCount - 1) / 2) * 0.16;
      const finalAngle = angle + spread;

      const vx = Math.cos(finalAngle) * boltSpeed;
      const vy = Math.sin(finalAngle) * boltSpeed;

      projectilePool.spawn(
        player.x + Math.cos(finalAngle) * 16,
        player.y + Math.sin(finalAngle) * 16,
        vx,
        vy,
        Math.round(baseDmg),
        6.5,
        CYBER_COLORS.cyan,
        2.0,
        pierce
      );
    }

    soundEngine.playLaser();
  }

  /**
   * Weapon 2: Orbital Shields (Energy orbs rotating around player)
   */
  private updateOrbitalShields(
    dt: number,
    player: Player,
    level: number,
    enemies: Enemy[],
    onEnemyDamaged: (enemy: Enemy, damage: number) => void
  ): void {
    const shieldCount = Math.min(4, level);
    const rotationSpeed = level >= 2 ? 4.2 : 3.2;
    const distance = level >= 4 ? 76 : 64;
    const damage = Math.round((24 + level * 8) * this.damageMultiplier);

    this.orbitalAngle += rotationSpeed * dt;

    for (let i = 0; i < shieldCount; i++) {
      const angle = this.orbitalAngle + (i * Math.PI * 2) / shieldCount;
      const sx = player.x + Math.cos(angle) * distance;
      const sy = player.y + Math.sin(angle) * distance;
      const sRadius = 11;

      // Check collision with enemies
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (enemy.shieldContactCooldown > 0) continue;

        const dx = enemy.x - sx;
        const dy = enemy.y - sy;
        const distSq = dx * dx + dy * dy;
        const hitDist = sRadius + enemy.radius;

        if (distSq <= hitDist * hitDist) {
          enemy.shieldContactCooldown = 0.28; // Cooldown per enemy
          onEnemyDamaged(enemy, damage);
          soundEngine.playPop();

          // Push enemy back slightly
          const pushAngle = Math.atan2(dy, dx);
          enemy.x += Math.cos(pushAngle) * 12;
          enemy.y += Math.sin(pushAngle) * 12;
        }
      }
    }
  }

  /**
   * Weapon 3: Chain Lightning (Electric arc jumping across 2-5 enemies)
   */
  private fireChainLightning(
    player: Player,
    level: number,
    enemies: Enemy[],
    onEnemyDamaged: (enemy: Enemy, damage: number, isCrit?: boolean) => void
  ): void {
    if (enemies.length === 0) return;

    // Find primary target within 420px
    let closestEnemy: Enemy | null = null;
    let closestDistSq = 420 * 420;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        closestEnemy = e;
      }
    }

    if (!closestEnemy) return;

    const maxTargets = level === 1 ? 2 : level === 2 ? 3 : level === 3 ? 4 : 5;
    const damage = Math.round((36 + level * 10) * this.damageMultiplier);

    const hitChain: Enemy[] = [closestEnemy];
    const lightningPoints: { x: number; y: number }[] = [
      { x: player.x, y: player.y },
      { x: closestEnemy.x, y: closestEnemy.y }
    ];

    onEnemyDamaged(closestEnemy, damage, true);

    // Chain to nearby enemies
    let currentTarget = closestEnemy;
    for (let step = 1; step < maxTargets; step++) {
      let nextTarget: Enemy | null = null;
      let nextDistSq = 200 * 200;

      for (let i = 0; i < enemies.length; i++) {
        const candidate = enemies[i];
        if (hitChain.includes(candidate)) continue;

        const dx = candidate.x - currentTarget.x;
        const dy = candidate.y - currentTarget.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < nextDistSq) {
          nextDistSq = distSq;
          nextTarget = candidate;
        }
      }

      if (nextTarget) {
        hitChain.push(nextTarget);
        lightningPoints.push({ x: nextTarget.x, y: nextTarget.y });
        onEnemyDamaged(nextTarget, Math.round(damage * 0.9));
        currentTarget = nextTarget;
      } else {
        break;
      }
    }

    // Spawn visual lightning polyline
    this.activeLightnings.push({
      points: lightningPoints,
      life: 0.18,
      maxLife: 0.18,
      color: CYBER_COLORS.yellow
    });

    soundEngine.playCrunch();
  }

  /**
   * Weapon 4: Laser Beam (Continuous piercing beam across screen)
   */
  private fireLaserBeam(player: Player, level: number, enemies: Enemy[]): void {
    // Determine beam angle: target highest enemy cluster or closest enemy
    let targetAngle = player.angle;
    if (enemies.length > 0) {
      let closest: Enemy | null = null;
      let closestDistSq = 600 * 600;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closest = e;
        }
      }
      if (closest) {
        targetAngle = Math.atan2(closest.y - player.y, closest.x - player.x);
      }
    }

    const beamLength = 950;
    const beamWidth = level === 1 ? 16 : level === 2 ? 22 : 28;
    const damage = Math.round((55 + level * 18) * this.damageMultiplier);

    // Shot directions based on level
    const beamAngles: number[] = [targetAngle];
    if (level === 3) {
      beamAngles.push(targetAngle + Math.PI); // Front and back
    } else if (level >= 4) {
      beamAngles.push(targetAngle + Math.PI / 2);
      beamAngles.push(targetAngle + Math.PI);
      beamAngles.push(targetAngle - Math.PI / 2); // 4-way cross laser!
    }

    for (let i = 0; i < beamAngles.length; i++) {
      const angle = beamAngles[i];
      const x2 = player.x + Math.cos(angle) * beamLength;
      const y2 = player.y + Math.sin(angle) * beamLength;

      this.activeLasers.push({
        active: true,
        x1: player.x,
        y1: player.y,
        x2,
        y2,
        angle,
        width: beamWidth,
        life: 0.32,
        maxLife: 0.32,
        damage,
        color: '#ff0055',
        hitTimer: 0
      });
    }

    soundEngine.playLaser();
  }

  /**
   * Weapon 5: Nova Pulse (Expanding circular shockwave)
   */
  private fireNovaPulse(player: Player, level: number): void {
    const maxRadius = level === 1 ? 170 : level === 2 ? 210 : level === 3 ? 250 : 300;
    const damage = Math.round((45 + level * 14) * this.damageMultiplier);

    this.activeNovas.push({
      active: true,
      x: player.x,
      y: player.y,
      radius: 10,
      maxRadius,
      damage,
      life: 0.45,
      maxLife: 0.45,
      color: CYBER_COLORS.cyan
    });

    // At level 4: double consecutive pulse
    if (level >= 4) {
      setTimeout(() => {
        this.activeNovas.push({
          active: true,
          x: player.x,
          y: player.y,
          radius: 10,
          maxRadius: maxRadius * 1.15,
          damage: Math.round(damage * 1.2),
          life: 0.45,
          maxLife: 0.45,
          color: CYBER_COLORS.yellow
        });
        soundEngine.playExplosion();
      }, 200);
    }

    soundEngine.playExplosion();
  }

  /**
   * Update transient visual effects, test continuous collision, decay timers
   */
  private updateTransientEffects(
    dt: number,
    enemies: Enemy[],
    onEnemyDamaged: (enemy: Enemy, damage: number, isCrit?: boolean) => void
  ): void {
    // 1. Lightning decay
    for (let i = this.activeLightnings.length - 1; i >= 0; i--) {
      const l = this.activeLightnings[i];
      l.life -= dt;
      if (l.life <= 0) {
        this.activeLightnings.splice(i, 1);
      }
    }

    // 2. Laser beams collision and decay
    for (let i = this.activeLasers.length - 1; i >= 0; i--) {
      const beam = this.activeLasers[i];
      beam.life -= dt;
      beam.hitTimer += dt;

      if (beam.life <= 0) {
        this.activeLasers.splice(i, 1);
        continue;
      }

      // Check collision with line segment
      if (beam.hitTimer >= 0.08) {
        beam.hitTimer = 0;
        const lineLen = Math.hypot(beam.x2 - beam.x1, beam.y2 - beam.y1);
        const dirX = (beam.x2 - beam.x1) / lineLen;
        const dirY = (beam.y2 - beam.y1) / lineLen;

        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          const px = enemy.x - beam.x1;
          const py = enemy.y - beam.y1;
          const proj = px * dirX + py * dirY;

          if (proj >= 0 && proj <= lineLen) {
            const perpX = px - proj * dirX;
            const perpY = py - proj * dirY;
            const perpDistSq = perpX * perpX + perpY * perpY;
            const hitThreshold = beam.width / 2 + enemy.radius;

            if (perpDistSq <= hitThreshold * hitThreshold) {
              onEnemyDamaged(enemy, Math.round(beam.damage * 0.45), false);
              // Slight push perpendicular to beam
              enemy.x += dirX * 8;
              enemy.y += dirY * 8;
            }
          }
        }
      }
    }

    // 3. Nova waves expansion and collision
    for (let i = this.activeNovas.length - 1; i >= 0; i--) {
      const nova = this.activeNovas[i];
      nova.life -= dt;

      if (nova.life <= 0) {
        this.activeNovas.splice(i, 1);
        continue;
      }

      const progress = 1 - nova.life / nova.maxLife;
      nova.radius = nova.maxRadius * progress;

      // Hit enemies within current wave perimeter ring
      const ringThickness = 35;
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        const dx = enemy.x - nova.x;
        const dy = enemy.y - nova.y;
        const dist = Math.hypot(dx, dy);

        if (Math.abs(dist - nova.radius) <= ringThickness + enemy.radius) {
          if (enemy.shieldContactCooldown <= 0) {
            enemy.shieldContactCooldown = 0.3;
            onEnemyDamaged(enemy, nova.damage, true);

            // Strong radial knockback
            const pushAngle = Math.atan2(dy, dx);
            enemy.x += Math.cos(pushAngle) * 35;
            enemy.y += Math.sin(pushAngle) * 35;
          }
        }
      }
    }
  }

  public getOrbitalShieldPositions(player: Player, level: number): { x: number; y: number }[] {
    const shieldCount = Math.min(4, level);
    const distance = level >= 4 ? 76 : 64;
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < shieldCount; i++) {
      const angle = this.orbitalAngle + (i * Math.PI * 2) / shieldCount;
      positions.push({
        x: player.x + Math.cos(angle) * distance,
        y: player.y + Math.sin(angle) * distance
      });
    }

    return positions;
  }

  public reset(): void {
    this.plasmaCooldown = 0;
    this.chainLightningCooldown = 0;
    this.laserCooldown = 0;
    this.novaCooldown = 0;
    this.orbitalAngle = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.activeLightnings.length = 0;
    this.activeLasers.length = 0;
    this.activeNovas.length = 0;
  }
}
