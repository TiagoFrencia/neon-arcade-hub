import {
  BASE_MAX_HP,
  BASE_POSITION,
  GRID_COLS,
  GRID_ROWS,
  GRID_START_X,
  GRID_START_Y,
  INITIAL_GOLD,
  INITIAL_SPAWN_COST,
  SLOT_GAP,
  SLOT_SIZE,
  SPAWN_COST_INCREMENT,
  TRACK_WAYPOINTS,
  TURRET_DEFINITIONS,
  TURRET_TYPES,
  getTurretStats
} from './constants';
import {
  Enemy,
  EnemyShape,
  GridSlot,
  Projectile,
  Turret,
  TurretType,
  WaveConfig
} from './types';

export interface GameEventCallbacks {
  onSoundLaser: () => void;
  onSoundExplosion: () => void;
  onSoundPop: () => void;
  onSoundCrunch: () => void;
  onSoundMerge: (pitch: number) => void;
  onSoundLevelUp: () => void;
  onSoundGameOver: () => void;
  onSoundClick: () => void;
  onSpawnParticles: (x: number, y: number, color: string, count?: number, speed?: number) => void;
  onFloatingText: (x: number, y: number, text: string, color?: string, size?: number) => void;
  onCameraShake: (intensity: number, duration?: number) => void;
}

export class PolyDefenseGame {
  public slots: GridSlot[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];

  public gold = INITIAL_GOLD;
  public spawnCost = INITIAL_SPAWN_COST;
  public spawnCount = 0;
  public baseHp = BASE_MAX_HP;
  public currentWave = 1;
  public score = 0;
  public totalKills = 0;

  // Boosts & Monetization state
  public doubleBoostWavesLeft = 0;
  public isFreezeActive = false;
  public freezeTimer = 0;

  // Wave management
  public waveEnemiesRemainingToSpawn = 0;
  public spawnTimer = 0;
  public currentWaveConfig: WaveConfig | null = null;
  public isWaveInProgress = false;
  public waveBreakTimer = 2.5;

  // Callbacks
  private callbacks: GameEventCallbacks;

  constructor(callbacks: GameEventCallbacks) {
    this.callbacks = callbacks;
    this.initGrid();
    this.startWave(1);
  }

  private initGrid(): void {
    this.slots = [];
    let idx = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_START_X + c * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
        const y = GRID_START_Y + r * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
        this.slots.push({
          index: idx++,
          row: r,
          col: c,
          x,
          y,
          turret: null
        });
      }
    }
  }

  public getEmptySlots(): GridSlot[] {
    return this.slots.filter((s) => s.turret === null);
  }

  public getOccupiedSlots(): GridSlot[] {
    return this.slots.filter((s) => s.turret !== null);
  }

  public getAverageTurretLevel(): number {
    const occupied = this.getOccupiedSlots();
    if (occupied.length === 0) return 1;
    const totalLevel = occupied.reduce((sum, s) => sum + s.turret!.level, 0);
    return Math.max(1, Math.round(totalLevel / occupied.length));
  }

  /**
   * Spawns a Level 1 turret in a random empty slot with gold deduction
   */
  public spawnTurretWithGold(): boolean {
    if (this.gold < this.spawnCost) {
      this.callbacks.onFloatingText(GRID_START_X + 120, GRID_START_Y + 120, 'NEED MORE GOLD!', '#ef4444', 18);
      return false;
    }

    const emptySlots = this.getEmptySlots();
    if (emptySlots.length === 0) {
      this.callbacks.onFloatingText(GRID_START_X + 120, GRID_START_Y + 120, 'GRID FULL! MERGE FIRST', '#ef4444', 18);
      return false;
    }

    this.gold -= this.spawnCost;
    this.spawnCount++;
    this.spawnCost += SPAWN_COST_INCREMENT;

    const targetSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    const randomType = TURRET_TYPES[Math.floor(Math.random() * TURRET_TYPES.length)];

    this.placeTurret(targetSlot.index, randomType, 1);
    this.callbacks.onSoundPop();
    const def = TURRET_DEFINITIONS[randomType];
    this.callbacks.onSpawnParticles(targetSlot.x, targetSlot.y, def.color, 24, 200);
    this.callbacks.onFloatingText(targetSlot.x, targetSlot.y - 15, `+${def.name}`, def.color, 16);

    return true;
  }

  /**
   * Places a turret in a given slot
   */
  public placeTurret(slotIndex: number, type: TurretType, level: number): void {
    const slot = this.slots[slotIndex];
    if (!slot) return;

    slot.turret = {
      id: `turret_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      level,
      cooldownTimer: Math.random() * 0.3, // stagger initial shots
      rotation: 0,
      targetId: null,
      recoil: 0,
      glowPulse: 0
    };
  }

  /**
   * Executes Merge or Move between two slots
   */
  public handleTurretDrop(sourceIndex: number, targetIndex: number): boolean {
    const sourceSlot = this.slots[sourceIndex];
    const targetSlot = this.slots[targetIndex];

    if (!sourceSlot || !targetSlot || !sourceSlot.turret) return false;
    if (sourceIndex === targetIndex) return false;

    const sourceTurret = sourceSlot.turret;
    const targetTurret = targetSlot.turret;

    // 1. Target is empty -> Move
    if (!targetTurret) {
      targetSlot.turret = sourceTurret;
      sourceSlot.turret = null;
      this.callbacks.onSoundClick();
      return true;
    }

    // 2. Target has matching Turret -> MERGE FUSION!
    if (sourceTurret.type === targetTurret.type && sourceTurret.level === targetTurret.level) {
      const newLevel = targetTurret.level + 1;
      targetTurret.level = newLevel;
      targetTurret.recoil = 1.0;
      sourceSlot.turret = null;

      const def = TURRET_DEFINITIONS[targetTurret.type];
      const pitch = 1.0 + (newLevel - 1) * 0.25;

      this.callbacks.onSoundMerge(pitch);
      this.callbacks.onSpawnParticles(targetSlot.x, targetSlot.y, def.color, 36, 280);
      this.callbacks.onFloatingText(
        targetSlot.x,
        targetSlot.y - 20,
        `FUSION! LV ${newLevel} ${def.name}`,
        def.color,
        20
      );
      this.callbacks.onCameraShake(4, 0.25);
      this.score += newLevel * 50;

      return true;
    }

    // Invalid merge
    return false;
  }

  /**
   * Rewarded Ad 1: AirDrop Crate
   * Fills up to 3 empty slots with free turrets of current average level
   */
  public triggerAirDropReward(): number {
    const emptySlots = this.getEmptySlots();
    if (emptySlots.length === 0) {
      this.callbacks.onFloatingText(GRID_START_X + 120, GRID_START_Y + 120, 'NO EMPTY SLOTS!', '#ef4444', 18);
      return 0;
    }

    const avgLevel = this.getAverageTurretLevel();
    const countToSpawn = Math.min(3, emptySlots.length);

    // Shuffle empty slots
    const shuffled = [...emptySlots].sort(() => Math.random() - 0.5);

    for (let i = 0; i < countToSpawn; i++) {
      const slot = shuffled[i];
      const randomType = TURRET_TYPES[Math.floor(Math.random() * TURRET_TYPES.length)];
      this.placeTurret(slot.index, randomType, avgLevel);

      const def = TURRET_DEFINITIONS[randomType];
      this.callbacks.onSpawnParticles(slot.x, slot.y, def.color, 28, 240);
      this.callbacks.onFloatingText(slot.x, slot.y - 18, `AIRDROP! LV ${avgLevel}`, '#fbbf24', 18);
    }

    this.callbacks.onSoundLevelUp();
    this.callbacks.onCameraShake(5, 0.3);
    return countToSpawn;
  }

  /**
   * Rewarded Ad 2: 2X Speed & Double Gold for 3 full waves
   */
  public triggerDoubleBoostReward(): void {
    this.doubleBoostWavesLeft += 3;
    this.callbacks.onSoundLevelUp();
    this.callbacks.onCameraShake(5, 0.3);
    this.callbacks.onFloatingText(
      GRID_START_X + 120,
      GRID_START_Y + 120,
      '⚡ 2X SPEED & DOUBLE GOLD ACTIVATED!',
      '#eab308',
      20
    );
  }

  /**
   * Rewarded Ad 3: Repair Base + Freeze Enemies
   */
  public triggerRepairAndFreezeReward(): void {
    this.baseHp = BASE_MAX_HP;
    this.isFreezeActive = true;
    this.freezeTimer = 6.0;

    for (const enemy of this.enemies) {
      enemy.freezeTimer = 6.0;
    }

    this.callbacks.onSoundLevelUp();
    this.callbacks.onCameraShake(6, 0.35);
    this.callbacks.onSpawnParticles(BASE_POSITION.x, BASE_POSITION.y, '#10b981', 40, 260);
    this.callbacks.onFloatingText(
      BASE_POSITION.x + 40,
      BASE_POSITION.y,
      '🛡️ BASE REPAIRED & ENEMIES FROZEN!',
      '#38bdf8',
      19
    );
  }

  /**
   * Wave management
   */
  public startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    const isBossWave = waveNumber % 5 === 0;
    const totalEnemies = isBossWave ? 12 : 8 + waveNumber * 2;
    const spawnInterval = Math.max(0.65, 1.3 - waveNumber * 0.04);

    // Build enemy pool weights based on wave progression
    const pool: { shape: EnemyShape; weight: number }[] = [
      { shape: 'triangle', weight: 40 }
    ];

    if (waveNumber >= 2) pool.push({ shape: 'square', weight: 35 });
    if (waveNumber >= 3) pool.push({ shape: 'pentagon', weight: 25 });
    if (waveNumber >= 4) pool.push({ shape: 'hexagon', weight: 20 });

    this.currentWaveConfig = {
      waveNumber,
      totalEnemies,
      spawnInterval,
      enemyPool: pool,
      isBossWave
    };

    this.waveEnemiesRemainingToSpawn = totalEnemies;
    this.spawnTimer = 0.5;
    this.isWaveInProgress = true;
    this.waveBreakTimer = 0;

    this.callbacks.onFloatingText(
      GRID_START_X + 120,
      GRID_START_Y - 40,
      isBossWave ? `⚠️ BOSS WAVE ${waveNumber}!` : `WAVE ${waveNumber}`,
      isBossWave ? '#ef4444' : '#00f0ff',
      24
    );
  }

  private spawnWaveEnemy(): void {
    if (!this.currentWaveConfig) return;

    const wave = this.currentWave;
    const isBossWave = this.currentWaveConfig.isBossWave;
    const isLastEnemyInBossWave = isBossWave && this.waveEnemiesRemainingToSpawn === 1;

    let shape: EnemyShape = 'triangle';
    let isBoss = false;
    let radius = 12;
    let baseSpeed = 85;
    let hp = 40 + wave * 18;
    let color = '#22c55e';
    let accentColor = '#86efac';
    let goldValue = 10;

    if (isLastEnemyInBossWave) {
      // Octagon Boss!
      shape = 'octagon';
      isBoss = true;
      radius = 24;
      baseSpeed = 38;
      hp = 450 + wave * 220;
      color = '#ef4444';
      accentColor = '#fca5a5';
      goldValue = 120;
    } else {
      // Pick random shape from pool
      const pool = this.currentWaveConfig.enemyPool;
      const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
      let rand = Math.random() * totalWeight;
      for (const item of pool) {
        if (rand < item.weight) {
          shape = item.shape;
          break;
        }
        rand -= item.weight;
      }

      switch (shape) {
        case 'triangle':
          radius = 11;
          baseSpeed = 95;
          hp = Math.round((35 + wave * 14) * 0.85);
          color = '#22c55e';
          accentColor = '#86efac';
          goldValue = 10;
          break;
        case 'square':
          radius = 13;
          baseSpeed = 75;
          hp = Math.round((45 + wave * 20));
          color = '#eab308';
          accentColor = '#fde047';
          goldValue = 15;
          break;
        case 'pentagon':
          radius = 15;
          baseSpeed = 58;
          hp = Math.round((70 + wave * 32));
          color = '#ec4899';
          accentColor = '#f472b6';
          goldValue = 22;
          break;
        case 'hexagon':
          radius = 17;
          baseSpeed = 46;
          hp = Math.round((110 + wave * 45));
          color = '#8b5cf6';
          accentColor = '#c4b5fd';
          goldValue = 35;
          break;
      }
    }

    const spawnPoint = TRACK_WAYPOINTS[0];
    const enemy: Enemy = {
      id: `enemy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      shape,
      color,
      accentColor,
      x: spawnPoint.x,
      y: spawnPoint.y,
      radius,
      speed: baseSpeed,
      baseSpeed,
      hp,
      maxHp: hp,
      goldValue,
      rotation: 0,
      spinSpeed: (Math.random() - 0.5) * 3,
      currentWaypointIndex: 1,
      distanceTraveled: 0,
      slowTimer: 0,
      slowFactor: 1.0,
      freezeTimer: this.isFreezeActive ? this.freezeTimer : 0,
      isBoss,
      hitFlashTimer: 0
    };

    this.enemies.push(enemy);
    this.waveEnemiesRemainingToSpawn--;
  }

  /**
   * Main game physics, targeting, and combat update
   */
  public update(dt: number): void {
    // Apply 2X Speed boost if active
    const simDt = this.doubleBoostWavesLeft > 0 ? dt * 2 : dt;

    // 1. Update Freeze timer
    if (this.isFreezeActive) {
      this.freezeTimer -= simDt;
      if (this.freezeTimer <= 0) {
        this.isFreezeActive = false;
      }
    }

    // 2. Wave Spawner update
    this.updateWaveSpawner(simDt);

    // 3. Enemy Path Movement
    this.updateEnemies(simDt);

    // 4. Turrets Targeting & Attack Loop
    this.updateTurrets(simDt);

    // 5. Projectiles Simulation
    this.updateProjectiles(simDt);
  }

  private updateWaveSpawner(dt: number): void {
    if (this.isWaveInProgress) {
      if (this.waveEnemiesRemainingToSpawn > 0) {
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
          this.spawnWaveEnemy();
          this.spawnTimer = this.currentWaveConfig ? this.currentWaveConfig.spawnInterval : 1.0;
        }
      } else if (this.enemies.length === 0) {
        // Wave fully cleared!
        this.isWaveInProgress = false;
        this.waveBreakTimer = 3.0; // 3 seconds grace between waves
        this.callbacks.onSoundLevelUp();

        // Bonus gold on wave complete
        const waveBonus = 20 + this.currentWave * 5;
        const actualBonus = this.doubleBoostWavesLeft > 0 ? waveBonus * 2 : waveBonus;
        this.gold += actualBonus;
        this.score += 200 * this.currentWave;

        if (this.doubleBoostWavesLeft > 0) {
          this.doubleBoostWavesLeft--;
        }

        this.callbacks.onFloatingText(
          GRID_START_X + 120,
          GRID_START_Y + 120,
          `WAVE ${this.currentWave} CLEARED! +${actualBonus}G`,
          '#22c55e',
          22
        );
      }
    } else {
      // Wave break countdown
      this.waveBreakTimer -= dt;
      if (this.waveBreakTimer <= 0 && this.baseHp > 0) {
        this.startWave(this.currentWave + 1);
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // Update hit flash
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer -= dt;
      }

      // Update freeze & slow timers
      if (e.freezeTimer > 0) {
        e.freezeTimer -= dt;
        continue; // Frozen in place!
      }

      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        e.speed = e.baseSpeed * (1.0 - e.slowFactor);
      } else {
        e.speed = e.baseSpeed;
      }

      // Spin rotation
      e.rotation += e.spinSpeed * dt;

      // Move along track waypoints
      const targetWp = TRACK_WAYPOINTS[e.currentWaypointIndex];
      if (!targetWp) continue;

      const dx = targetWp.x - e.x;
      const dy = targetWp.y - e.y;
      const dist = Math.hypot(dx, dy);
      const step = e.speed * dt;

      if (dist <= step) {
        // Arrived at waypoint
        e.x = targetWp.x;
        e.y = targetWp.y;
        e.distanceTraveled += dist;
        e.currentWaypointIndex++;

        // Reached end of path (Player Base!)
        if (e.currentWaypointIndex >= TRACK_WAYPOINTS.length) {
          const dmgToBase = e.isBoss ? 3 : 1;
          this.baseHp = Math.max(0, this.baseHp - dmgToBase);
          this.callbacks.onSoundExplosion();
          this.callbacks.onCameraShake(e.isBoss ? 10 : 5, 0.3);
          this.callbacks.onSpawnParticles(BASE_POSITION.x, BASE_POSITION.y, '#ef4444', 30, 240);
          this.callbacks.onFloatingText(
            BASE_POSITION.x + 35,
            BASE_POSITION.y,
            `-${dmgToBase} BASE HP!`,
            '#ef4444',
            22
          );

          this.enemies.splice(i, 1);

          if (this.baseHp <= 0) {
            this.callbacks.onSoundGameOver();
          }
          continue;
        }
      } else {
        e.x += (dx / dist) * step;
        e.y += (dy / dist) * step;
        e.distanceTraveled += step;
      }
    }
  }

  private updateTurrets(dt: number): void {
    for (const slot of this.slots) {
      const turret = slot.turret;
      if (!turret) continue;

      const stats = getTurretStats(turret.type, turret.level);

      // Decay recoil
      if (turret.recoil > 0) {
        turret.recoil = Math.max(0, turret.recoil - dt * 5);
      }

      // Turret targeting logic based on Archetype specifications
      const targetEnemy = this.acquireTargetForTurret(slot.x, slot.y, turret.type, stats.range);

      if (targetEnemy) {
        turret.targetId = targetEnemy.id;
        // Rotate smoothly towards target
        const targetAngle = Math.atan2(targetEnemy.y - slot.y, targetEnemy.x - slot.x);
        turret.rotation = targetAngle;

        // Attack cooldown update
        turret.cooldownTimer -= dt;
        if (turret.cooldownTimer <= 0) {
          this.fireTurret(slot.x, slot.y, turret, stats, targetEnemy);
          turret.cooldownTimer = stats.cooldown;
          turret.recoil = 1.0;
        }
      } else {
        turret.targetId = null;
        turret.cooldownTimer = Math.max(0, turret.cooldownTimer - dt);
      }
    }
  }

  private acquireTargetForTurret(
    turretX: number,
    turretY: number,
    type: TurretType,
    range: number
  ): Enemy | null {
    // Filter enemies within range
    const inRangeEnemies = this.enemies.filter((e) => {
      const dist = Math.hypot(e.x - turretX, e.y - turretY);
      return dist <= range;
    });

    if (inRangeEnemies.length === 0) return null;

    switch (type) {
      case 'SNIPER':
        // Specification: "daño crítico altísimo al enemigo con más vida"
        // Target enemy with HIGHEST current HP within range
        return inRangeEnemies.reduce((highest, e) => (e.hp > highest.hp ? e : highest), inRangeEnemies[0]);

      case 'CANNON':
        // Splash damage: Target enemy with greatest cluster density or closest to base
        return inRangeEnemies.reduce((best, e) => (e.distanceTraveled > best.distanceTraveled ? e : best), inRangeEnemies[0]);

      case 'FROST':
        // Blue Frost: Prioritize unfrozen enemies, or closest to base
        const unfrozen = inRangeEnemies.filter((e) => e.slowTimer <= 0 && e.freezeTimer <= 0);
        if (unfrozen.length > 0) {
          return unfrozen.reduce((lead, e) => (e.distanceTraveled > lead.distanceTraveled ? e : lead), unfrozen[0]);
        }
        return inRangeEnemies.reduce((lead, e) => (e.distanceTraveled > lead.distanceTraveled ? e : lead), inRangeEnemies[0]);

      case 'BLASTER':
      default:
        // Cyan Blaster: High cadence individual target - target leading enemy on track
        return inRangeEnemies.reduce((lead, e) => (e.distanceTraveled > lead.distanceTraveled ? e : lead), inRangeEnemies[0]);
    }
  }

  private fireTurret(
    turretX: number,
    turretY: number,
    turret: Turret,
    stats: ReturnType<typeof getTurretStats>,
    target: Enemy
  ): void {
    const def = TURRET_DEFINITIONS[turret.type];

    // Check critical strike for Sniper
    let isCrit = false;
    let damage = stats.damage;
    if (turret.type === 'SNIPER' && stats.critChance && Math.random() < stats.critChance) {
      isCrit = true;
      damage = Math.round(damage * (def.critMultiplier || 2.5));
    }

    // Direction vector towards target
    const dx = target.x - turretX;
    const dy = target.y - turretY;
    const dist = Math.hypot(dx, dy) || 1;
    const vx = (dx / dist) * def.projectileSpeed;
    const vy = (dy / dist) * def.projectileSpeed;

    const projectile: Projectile = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      turretType: turret.type,
      level: turret.level,
      startX: turretX,
      startY: turretY,
      x: turretX,
      y: turretY,
      vx,
      vy,
      targetEnemyId: target.id,
      targetLastX: target.x,
      targetLastY: target.y,
      damage,
      isCrit,
      color: def.color,
      splashRadius: stats.splashRadius,
      slowPercent: def.slowPercent,
      slowDuration: def.slowDuration,
      life: 0.8,
      maxLife: 0.8
    };

    this.projectiles.push(projectile);

    // Play Archetype Sound
    switch (turret.type) {
      case 'BLASTER':
        this.callbacks.onSoundLaser();
        break;
      case 'CANNON':
        this.callbacks.onSoundExplosion();
        break;
      case 'FROST':
        this.callbacks.onSoundPop();
        break;
      case 'SNIPER':
        this.callbacks.onSoundCrunch();
        if (isCrit) {
          this.callbacks.onCameraShake(3, 0.15);
        }
        break;
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Railgun Sniper is instant / hyper fast beam hit
      if (p.turretType === 'SNIPER') {
        const target = this.enemies.find((e) => e.id === p.targetEnemyId);
        if (target) {
          p.x = target.x;
          p.y = target.y;
          this.applyProjectileHit(p, target);
        } else {
          p.x = p.targetLastX;
          p.y = p.targetLastY;
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Move standard projectile
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Check collision with enemies
      let hitEnemy: Enemy | null = null;
      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist <= e.radius + 6) {
          hitEnemy = e;
          break;
        }
      }

      if (hitEnemy) {
        this.applyProjectileHit(p, hitEnemy);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private applyProjectileHit(p: Projectile, hitEnemy: Enemy): void {
    // 1. Splash damage for Orange Cannon
    if (p.turretType === 'CANNON' && p.splashRadius) {
      const radius = p.splashRadius;
      this.callbacks.onSpawnParticles(p.x, p.y, '#ff7700', 32, 220);
      this.callbacks.onCameraShake(3, 0.2);

      for (const e of this.enemies) {
        const dist = Math.hypot(e.x - p.x, e.y - p.y);
        if (dist <= radius) {
          const falloff = 1 - dist / radius;
          const splashDmg = Math.round(p.damage * (0.5 + falloff * 0.5));
          this.damageEnemy(e, splashDmg, false);
        }
      }
      return;
    }

    // 2. Slow effect for Blue Frost (40% slow)
    if (p.turretType === 'FROST' && p.slowPercent && p.slowDuration) {
      hitEnemy.slowFactor = p.slowPercent;
      hitEnemy.slowTimer = p.slowDuration;
      this.callbacks.onSpawnParticles(hitEnemy.x, hitEnemy.y, '#38bdf8', 16, 150);
    }

    // 3. Normal / Sniper direct damage
    this.damageEnemy(hitEnemy, p.damage, p.isCrit);
  }

  private damageEnemy(e: Enemy, damage: number, isCrit: boolean): void {
    e.hp -= damage;
    e.hitFlashTimer = 0.08;

    const textColor = isCrit ? '#c084fc' : e.hp <= 0 ? '#fbbf24' : '#ffffff';
    const textLabel = isCrit ? `CRIT! -${damage}` : `-${damage}`;
    this.callbacks.onFloatingText(e.x, e.y - 12, textLabel, textColor, isCrit ? 18 : 13);

    if (e.hp <= 0) {
      this.killEnemy(e);
    }
  }

  private killEnemy(e: Enemy): void {
    const idx = this.enemies.indexOf(e);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }

    // Award Gold (doubled if 2X Gold active!)
    const goldEarned = this.doubleBoostWavesLeft > 0 ? e.goldValue * 2 : e.goldValue;
    this.gold += goldEarned;
    this.totalKills++;
    this.score += e.goldValue * 10;

    // Visuals & Audio
    this.callbacks.onSoundExplosion();
    this.callbacks.onSpawnParticles(e.x, e.y, e.color, e.isBoss ? 50 : 25, e.isBoss ? 320 : 220);
    this.callbacks.onFloatingText(e.x, e.y - 18, `+${goldEarned}G`, '#fbbf24', 16);

    if (e.isBoss) {
      this.callbacks.onCameraShake(8, 0.4);
      this.callbacks.onSoundLevelUp();
      this.callbacks.onFloatingText(e.x, e.y - 36, 'BOSS DESTROYED!', '#ef4444', 24);
    }
  }
}
