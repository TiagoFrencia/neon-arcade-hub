import {
  adManager,
  ParticleSystem,
  ScreenShake,
  soundEngine,
  StorageManager
} from '@arcade/shared';
import {
  CYBER_COLORS,
  STAT_BOOSTS,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  WEAPON_DEFINITIONS
} from './constants';
import { EnemyPool, GemPool, ProjectilePool } from './pools';
import { CyberRenderer } from './renderer';
import {
  Enemy,
  GameState,
  Player,
  UpgradeOption,
  VirtualJoystick,
  WeaponType
} from './types';
import { WeaponManager } from './weapons';

// DOM Elements
const wrapper = document.getElementById('game-wrapper') as HTMLDivElement;
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', { alpha: false })!;

const xpBarFill = document.getElementById('xp-bar-fill') as HTMLDivElement;
const lvlBadge = document.getElementById('lvl-badge') as HTMLDivElement;
const hpText = document.getElementById('hp-text') as HTMLSpanElement;
const hpBarFill = document.getElementById('hp-bar-fill') as HTMLDivElement;
const hudTimer = document.getElementById('hud-timer') as HTMLSpanElement;
const hudKills = document.getElementById('hud-kills') as HTMLSpanElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;

const bossHud = document.getElementById('boss-hud') as HTMLDivElement;
const bossHpFill = document.getElementById('boss-hp-fill') as HTMLDivElement;

const modalLevelUp = document.getElementById('modal-levelup') as HTMLDivElement;
const upgradeCardsList = document.getElementById('upgrade-cards-list') as HTMLDivElement;
const btnReroll = document.getElementById('btn-reroll') as HTMLButtonElement;
const btnPickAll = document.getElementById('btn-pick-all') as HTMLButtonElement;

const modalGameOver = document.getElementById('modal-gameover') as HTMLDivElement;
const modalTime = document.getElementById('modal-time') as HTMLSpanElement;
const modalKills = document.getElementById('modal-kills') as HTMLSpanElement;
const modalLevel = document.getElementById('modal-level') as HTMLSpanElement;
const modalBest = document.getElementById('modal-best') as HTMLSpanElement;
const btnRevive = document.getElementById('btn-revive') as HTMLButtonElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;

// Canvas setup
canvas.width = VIRTUAL_WIDTH;
canvas.height = VIRTUAL_HEIGHT;

// Core Engine Instances
const storage = StorageManager.forGame('03-cyber-survivor');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
const enemyPool = new EnemyPool(500);
const projectilePool = new ProjectilePool(300);
const gemPool = new GemPool(400);
const weapons = new WeaponManager();
const renderer = new CyberRenderer(ctx);

// Game State Variables
let gameState: GameState = 'playing';
let isPaused = false;
let scale = 1;
let lastTime = performance.now();
let spawnTimer = 0;
let popSoundThrottle = 0;
let currentUpgradeChoices: UpgradeOption[] = [];
let hasRevivedThisRun = false;

// Camera
const camera = { x: 0, y: 0 };

// Virtual Joystick
const joystick: VirtualJoystick = {
  active: false,
  touchId: null,
  baseX: 0,
  baseY: 0,
  currX: 0,
  currY: 0,
  dx: 0,
  dy: 0,
  distance: 0,
  maxRadius: 52
};

// Keyboard State
const keysPressed: Record<string, boolean> = {};

// Player Object
const player: Player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 14,
  angle: -Math.PI / 2,
  hp: 100,
  maxHp: 100,
  speed: 210,
  magnetRadius: 95,
  invulnTimer: 0,
  level: 1,
  xp: 0,
  xpNeeded: 12,
  kills: 0,
  aliveTime: 0,
  weapons: new Map<WeaponType, number>([['plasma_bolt', 1]]),
  hpRegenRate: 0,
  hpRegenTimer: 0
};

// Boss Tracking
let activeBoss: Enemy | null = null;
let lastBossMinuteSpawned = 0;

// Setup AdManager hooks
adManager.setGameHooks(
  () => {
    isPaused = true;
    soundEngine.setMuted(true);
  },
  () => {
    isPaused = false;
    soundEngine.setMuted(storage.getItem<boolean>('is_muted', false));
  }
);

// Responsive scaling
function handleResize(): void {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  scale = Math.min(windowWidth / VIRTUAL_WIDTH, windowHeight / VIRTUAL_HEIGHT);
  wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', handleResize);
handleResize();

// Sound toggle
const initialMuted = storage.getItem<boolean>('is_muted', false);
soundEngine.setMuted(initialMuted);
btnSound.textContent = initialMuted ? '🔇' : '🔊';

btnSound.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  const muted = soundEngine.toggleMute();
  storage.setItem('is_muted', muted);
  btnSound.textContent = muted ? '🔇' : '🔊';
});

// Format MM:SS helper
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Controls: Keyboard
window.addEventListener('keydown', (e) => {
  keysPressed[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keysPressed[e.code] = false;
});

// Controls: Virtual Joystick (Touch & Pointer)
canvas.addEventListener('pointerdown', (e) => {
  if (gameState !== 'playing') return;

  const rect = canvas.getBoundingClientRect();
  const localX = (e.clientX - rect.left) / scale;
  const localY = (e.clientY - rect.top) / scale;

  joystick.active = true;
  joystick.touchId = e.pointerId;
  joystick.baseX = localX;
  joystick.baseY = localY;
  joystick.currX = localX;
  joystick.currY = localY;
  joystick.dx = 0;
  joystick.dy = 0;
  joystick.distance = 0;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!joystick.active || joystick.touchId !== e.pointerId) return;

  const rect = canvas.getBoundingClientRect();
  const localX = (e.clientX - rect.left) / scale;
  const localY = (e.clientY - rect.top) / scale;

  const dx = localX - joystick.baseX;
  const dy = localY - joystick.baseY;
  const dist = Math.hypot(dx, dy);

  if (dist > 0) {
    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, joystick.maxRadius);
    joystick.currX = joystick.baseX + Math.cos(angle) * clampedDist;
    joystick.currY = joystick.baseY + Math.sin(angle) * clampedDist;
    joystick.distance = clampedDist / joystick.maxRadius;
    joystick.dx = Math.cos(angle) * joystick.distance;
    joystick.dy = Math.sin(angle) * joystick.distance;
  }
});

const endPointer = (e: PointerEvent) => {
  if (joystick.touchId === e.pointerId) {
    joystick.active = false;
    joystick.touchId = null;
    joystick.dx = 0;
    joystick.dy = 0;
    joystick.distance = 0;
  }
};

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// Wave & Spawning System
function updateSpawning(dt: number): void {
  spawnTimer += dt;

  // Progressive spawn rate
  const spawnInterval = Math.max(0.18, 1.2 - Math.min(0.9, player.aliveTime * 0.0035));

  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;

    // Determine enemy type based on alive time
    const t = player.aliveTime;
    let type: 'triangle' | 'tank' | 'splitter' = 'triangle';

    const rand = Math.random();
    if (t > 70) {
      if (rand < 0.45) type = 'triangle';
      else if (rand < 0.75) type = 'tank';
      else type = 'splitter';
    } else if (t > 30) {
      if (rand < 0.65) type = 'triangle';
      else type = 'tank';
    }

    // Spawn slightly outside camera viewport
    const angle = Math.random() * Math.PI * 2;
    const distance = 420 + Math.random() * 80;
    const sx = player.x + Math.cos(angle) * distance;
    const sy = player.y + Math.sin(angle) * distance;

    const hpMult = 1 + t * 0.003;
    const spdMult = 1 + Math.min(0.35, t * 0.001);

    enemyPool.spawn(type, sx, sy, { hpMultiplier: hpMult, speedMultiplier: spdMult });
  }

  // Boss Check: Every 2 minutes (120s, 240s, 360s...)
  const currentMinuteBracket = Math.floor(player.aliveTime / 120);
  if (currentMinuteBracket > 0 && currentMinuteBracket > lastBossMinuteSpawned) {
    lastBossMinuteSpawned = currentMinuteBracket;
    spawnBoss(currentMinuteBracket);
  }
}

function spawnBoss(waveIndex: number): void {
  const angle = Math.random() * Math.PI * 2;
  const sx = player.x + Math.cos(angle) * 450;
  const sy = player.y + Math.sin(angle) * 450;

  activeBoss = enemyPool.spawn('boss', sx, sy, {
    hpMultiplier: 1 + (waveIndex - 1) * 0.75
  });

  if (activeBoss) {
    soundEngine.playLevelUp();
    cameraShake.shake(12, 0.45);
    particles.spawnFloatingText(player.x, player.y - 40, '⚠️ BOSS DETECTED!', CYBER_COLORS.magenta, 24, 1.5);
    bossHud.classList.add('visible');
  }
}

// Enemy Damage Handling
function handleEnemyDamage(enemy: Enemy, damage: number, isCrit = false): void {
  enemy.hp -= damage;
  enemy.hitFlashTimer = 0.08;

  // Damage feedback text
  particles.spawnFloatingText(
    enemy.x + (Math.random() - 0.5) * 16,
    enemy.y - 12,
    Math.round(damage).toString(),
    isCrit ? CYBER_COLORS.yellow : CYBER_COLORS.white,
    isCrit ? 16 : 12,
    0.5
  );

  if (enemy.hp <= 0) {
    // Enemy Killed
    killEnemy(enemy);
  }
}

function killEnemy(enemy: Enemy): void {
  enemyPool.release(enemy);
  player.kills++;

  // Explosion sparks
  particles.spawnNeonBurst(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 50 : 16, enemy.isBoss ? 350 : 180);

  // Drop XP Gem
  gemPool.spawn(enemy.x, enemy.y, enemy.xpType, enemy.xpValue);

  // Splitter logic
  if (enemy.type === 'splitter') {
    for (let i = 0; i < 2; i++) {
      const splitAngle = Math.random() * Math.PI * 2;
      const mini = enemyPool.spawn('mini_splitter', enemy.x + Math.cos(splitAngle) * 12, enemy.y + Math.sin(splitAngle) * 12);
      if (mini) {
        mini.vx = Math.cos(splitAngle) * 80;
        mini.vy = Math.sin(splitAngle) * 80;
      }
    }
  }

  // Boss defeated logic
  if (enemy.isBoss) {
    activeBoss = null;
    bossHud.classList.remove('visible');
    soundEngine.playExplosion();
    cameraShake.shake(16, 0.6);
    particles.spawnFloatingText(player.x, player.y - 30, '👑 BOSS ELIMINATED!', CYBER_COLORS.yellow, 26, 2.0);

    // Extra gems shower
    for (let i = 0; i < 6; i++) {
      gemPool.spawn(enemy.x, enemy.y, 'blue', 5);
    }
  }
}

// XP & Level Up Logic
function addXP(amount: number): void {
  player.xp += amount;

  if (player.xp >= player.xpNeeded) {
    player.xp -= player.xpNeeded;
    player.level++;
    player.xpNeeded = Math.round(12 * Math.pow(1.3, player.level - 1));

    soundEngine.playLevelUp();
    cameraShake.shake(6, 0.3);
    particles.spawnFloatingText(player.x, player.y - 40, 'LEVEL UP!', CYBER_COLORS.green, 24, 1.2);

    triggerLevelUpModal();
  }
}

// Generate 3 unique upgrade options
function generateUpgradeChoices(): UpgradeOption[] {
  const choices: UpgradeOption[] = [];
  const weaponKeys: WeaponType[] = [
    'plasma_bolt',
    'orbital_shields',
    'chain_lightning',
    'laser_beam',
    'nova_pulse',
    'magnet_speed'
  ];

  // Candidates from weapons not yet at max level
  const availableWeapons: WeaponType[] = weaponKeys.filter((w) => {
    const lvl = player.weapons.get(w) ?? 0;
    return lvl < WEAPON_DEFINITIONS[w].maxLevel;
  });

  // Shuffle weapons
  availableWeapons.sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(3, availableWeapons.length); i++) {
    const wType = availableWeapons[i];
    const def = WEAPON_DEFINITIONS[wType];
    const currentLvl = player.weapons.get(wType) ?? 0;
    const nextLvl = currentLvl + 1;
    const lvlData = def.levels[nextLvl - 1];

    choices.push({
      id: `w_${wType}_${nextLvl}`,
      weaponType: wType,
      name: def.name,
      levelText: currentLvl === 0 ? 'UNLOCK' : `LVL ${currentLvl} ➔ ${nextLvl}`,
      description: lvlData.desc,
      icon: def.icon,
      currentLevel: currentLvl,
      newLevel: nextLvl
    });
  }

  // If fewer than 3 weapon choices remain, pad with stat boosts
  if (choices.length < 3) {
    const shuffledStats = [...STAT_BOOSTS].sort(() => Math.random() - 0.5);
    for (const stat of shuffledStats) {
      if (choices.length >= 3) break;
      if (!choices.some((c) => c.id === stat.id)) {
        choices.push(stat);
      }
    }
  }

  return choices;
}

function triggerLevelUpModal(): void {
  gameState = 'level_up';
  currentUpgradeChoices = generateUpgradeChoices();
  renderUpgradeCards(currentUpgradeChoices);
  modalLevelUp.classList.add('visible');
}

function renderUpgradeCards(choices: UpgradeOption[]): void {
  upgradeCardsList.innerHTML = '';

  choices.forEach((choice) => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `
      <div class="card-icon">${choice.icon}</div>
      <div class="card-info">
        <div class="card-header-line">
          <span class="card-name">${choice.name}</span>
          <span class="card-badge">${choice.levelText}</span>
        </div>
        <p class="card-desc">${choice.description}</p>
      </div>
    `;

    card.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      applyUpgrade(choice);
      closeLevelUpModal();
    });

    upgradeCardsList.appendChild(card);
  });
}

function applyUpgrade(choice: UpgradeOption): void {
  if (choice.weaponType === 'stat_boost') {
    switch (choice.statType) {
      case 'max_hp':
        player.maxHp = Math.round(player.maxHp * 1.3);
        player.hp = Math.min(player.maxHp, player.hp + 35);
        break;
      case 'damage_boost':
        weapons.damageMultiplier += 0.25;
        break;
      case 'attack_speed':
        weapons.cooldownMultiplier = Math.max(0.4, weapons.cooldownMultiplier * 0.8);
        break;
      case 'heal_full':
        player.hp = player.maxHp;
        break;
    }
  } else {
    // Weapon upgrade
    const wType = choice.weaponType;
    player.weapons.set(wType, choice.newLevel);

    // If passive Magnet & Speed
    if (wType === 'magnet_speed') {
      const lvl = choice.newLevel;
      player.speed = 210 * (1 + lvl * 0.16);
      player.magnetRadius = 95 * (1 + lvl * 0.45);
      if (lvl >= 3) {
        player.hpRegenRate = lvl >= 4 ? 2.0 : 1.0; // HP per second
      }
    }
  }
}

function closeLevelUpModal(): void {
  modalLevelUp.classList.remove('visible');
  gameState = 'playing';
}

// Rewarded Ad: Reroll Upgrades
btnReroll.addEventListener('pointerdown', async (e) => {
  e.stopPropagation();
  soundEngine.playClick();

  await adManager.showRewarded(() => {
    currentUpgradeChoices = generateUpgradeChoices();
    renderUpgradeCards(currentUpgradeChoices);
    soundEngine.playMerge(1.2);
  });
});

// Rewarded Ad: Pick ALL 3 Upgrades
btnPickAll.addEventListener('pointerdown', async (e) => {
  e.stopPropagation();
  soundEngine.playClick();

  await adManager.showRewarded(() => {
    currentUpgradeChoices.forEach((choice) => applyUpgrade(choice));
    soundEngine.playLevelUp();
    cameraShake.shake(10, 0.4);
    closeLevelUpModal();
  });
});

// Player Death & Game Over
function handleGameOver(): void {
  gameState = 'game_over';
  soundEngine.playGameOver();
  cameraShake.shake(18, 0.6);
  particles.spawnNeonBurst(player.x, player.y, CYBER_COLORS.magenta, 45, 300);

  // Update high score
  const isNewBest = storage.setHighScore(Math.floor(player.aliveTime));
  const bestTime = storage.getHighScore();

  modalTime.textContent = formatTime(player.aliveTime);
  modalKills.textContent = player.kills.toLocaleString();
  modalLevel.textContent = player.level.toString();
  modalBest.textContent = `${formatTime(bestTime)}${isNewBest ? ' 🌟 NEW' : ''}`;

  btnRevive.style.display = hasRevivedThisRun ? 'none' : 'flex';
  modalGameOver.classList.add('visible');
}

// Rewarded Ad: Revive + Screen Nuke
btnRevive.addEventListener('pointerdown', async (e) => {
  e.stopPropagation();
  soundEngine.playClick();

  await adManager.showRewarded(() => {
    hasRevivedThisRun = true;
    player.hp = player.maxHp;
    player.invulnTimer = 2.0;

    // SCREEN NUKE: annihilate all non-boss enemies and drop their XP!
    const activeEnemies = [...enemyPool.getActives()];
    for (let i = 0; i < activeEnemies.length; i++) {
      const enemy = activeEnemies[i];
      if (enemy.isBoss) {
        enemy.hp = Math.round(enemy.hp * 0.5);
      } else {
        killEnemy(enemy);
      }
    }

    // Epic nuke FX
    cameraShake.shake(25, 0.8);
    soundEngine.playExplosion();
    particles.spawnNeonBurst(player.x, player.y, CYBER_COLORS.cyan, 80, 450);
    particles.spawnFloatingText(player.x, player.y - 40, '⚡ SCREEN NUKED!', CYBER_COLORS.cyan, 28, 2.0);

    modalGameOver.classList.remove('visible');
    gameState = 'playing';
  });
});

// Restart Run
btnRestart.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  soundEngine.playClick();
  restartGame();
});

function restartGame(): void {
  modalGameOver.classList.remove('visible');
  modalLevelUp.classList.remove('visible');
  bossHud.classList.remove('visible');

  // Reset collections
  enemyPool.clear();
  projectilePool.clear();
  gemPool.clear();
  weapons.reset();
  particles.clear();
  cameraShake.reset();

  // Reset player
  player.x = 0;
  player.y = 0;
  player.vx = 0;
  player.vy = 0;
  player.angle = -Math.PI / 2;
  player.hp = 100;
  player.maxHp = 100;
  player.speed = 210;
  player.magnetRadius = 95;
  player.invulnTimer = 0;
  player.level = 1;
  player.xp = 0;
  player.xpNeeded = 12;
  player.kills = 0;
  player.aliveTime = 0;
  player.weapons.clear();
  player.weapons.set('plasma_bolt', 1);
  player.hpRegenRate = 0;
  player.hpRegenTimer = 0;

  activeBoss = null;
  lastBossMinuteSpawned = 0;
  hasRevivedThisRun = false;
  spawnTimer = 0;

  camera.x = -VIRTUAL_WIDTH / 2;
  camera.y = -VIRTUAL_HEIGHT / 2;

  gameState = 'playing';
}

// Update Top HUD
function updateHUD(): void {
  // XP Bar
  const xpPct = Math.min(100, Math.max(0, (player.xp / player.xpNeeded) * 100));
  xpBarFill.style.width = `${xpPct}%`;
  lvlBadge.textContent = `LVL ${player.level}`;

  // HP Bar
  const hpPct = Math.min(100, Math.max(0, (player.hp / player.maxHp) * 100));
  hpBarFill.style.width = `${hpPct}%`;
  hpText.textContent = `HP: ${Math.round(player.hp)}/${player.maxHp}`;

  // Timer & Kills
  hudTimer.textContent = formatTime(player.aliveTime);
  hudKills.textContent = `💀 ${player.kills}`;

  // Boss HP
  if (activeBoss && activeBoss.active) {
    const bossPct = Math.min(100, Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100));
    bossHpFill.style.width = `${bossPct}%`;
  }
}

// Main Game Loop
function gameLoop(time: number): void {
  const dt = Math.min(0.1, (time - lastTime) / 1000);
  lastTime = time;

  if (gameState === 'playing' && !isPaused) {
    player.aliveTime += dt;
    popSoundThrottle -= dt;

    // 1. Movement Input Computation
    let moveX = 0;
    let moveY = 0;

    // Keyboard (WASD / Arrows)
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveY -= 1;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveY += 1;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveX -= 1;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveX += 1;

    // Virtual Joystick takes precedence if actively dragged
    if (joystick.active && joystick.distance > 0.05) {
      moveX = joystick.dx;
      moveY = joystick.dy;
    } else {
      const len = Math.hypot(moveX, moveY);
      if (len > 0) {
        moveX /= len;
        moveY /= len;
      }
    }

    // Apply Player Velocity
    player.vx = moveX * player.speed;
    player.vy = moveY * player.speed;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Rotate player ship
    if (Math.hypot(player.vx, player.vy) > 10) {
      player.angle = Math.atan2(player.vy, player.vx);
    }

    // Invulnerability decay
    if (player.invulnTimer > 0) {
      player.invulnTimer -= dt;
    }

    // Passive HP Regen
    if (player.hpRegenRate > 0 && player.hp < player.maxHp) {
      player.hpRegenTimer += dt;
      if (player.hpRegenTimer >= 1.0) {
        player.hpRegenTimer = 0;
        player.hp = Math.min(player.maxHp, player.hp + player.hpRegenRate);
      }
    }

    // 2. Camera smooth tracking
    const targetCamX = player.x - VIRTUAL_WIDTH / 2;
    const targetCamY = player.y - VIRTUAL_HEIGHT / 2;
    camera.x += (targetCamX - camera.x) * Math.min(1, 12 * dt);
    camera.y += (targetCamY - camera.y) * Math.min(1, 12 * dt);

    // 3. Spawning
    updateSpawning(dt);

    // 4. Weapons Update
    weapons.update(dt, player, enemyPool, projectilePool, (enemy, dmg, isCrit) => {
      handleEnemyDamage(enemy, dmg, isCrit);
    });

    // 5. Projectiles Update
    const projectiles = projectilePool.getActives();
    const activeEnemies = enemyPool.getActives();

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.life -= dt;
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (proj.life <= 0) {
        projectilePool.release(proj);
        continue;
      }

      // Check hit with enemies
      for (let j = 0; j < activeEnemies.length; j++) {
        const enemy = activeEnemies[j];
        if (proj.hitEnemies.has(enemy.id)) continue;

        const dx = enemy.x - proj.x;
        const dy = enemy.y - proj.y;
        const hitDist = enemy.radius + proj.radius;

        if (dx * dx + dy * dy <= hitDist * hitDist) {
          proj.hitEnemies.add(enemy.id);
          handleEnemyDamage(enemy, proj.damage);

          if (proj.pierce > 0) {
            proj.pierce--;
          } else {
            projectilePool.release(proj);
            break;
          }
        }
      }
    }

    // 6. Enemies Update & Player Collision
    for (let i = 0; i < activeEnemies.length; i++) {
      const enemy = activeEnemies[i];
      if (enemy.hitFlashTimer > 0) enemy.hitFlashTimer -= dt;
      if (enemy.shieldContactCooldown > 0) enemy.shieldContactCooldown -= dt;

      // Enemy moves toward player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0) {
        enemy.angle = Math.atan2(dy, dx);
        enemy.vx = (dx / dist) * enemy.speed;
        enemy.vy = (dy / dist) * enemy.speed;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      }

      // Contact with player
      if (dist < player.radius + enemy.radius) {
        if (player.invulnTimer <= 0) {
          player.hp -= enemy.damage;
          player.invulnTimer = 0.45;
          cameraShake.shake(9, 0.25);
          soundEngine.playCrunch();
          particles.spawnFloatingText(player.x, player.y - 20, `-${enemy.damage}`, CYBER_COLORS.magenta, 18, 0.6);

          if (player.hp <= 0) {
            player.hp = 0;
            handleGameOver();
            break;
          }
        }
      }
    }

    // 7. XP Gems Update & Attraction
    const gems = gemPool.getActives();
    for (let i = gems.length - 1; i >= 0; i--) {
      const gem = gems[i];
      const dx = player.x - gem.x;
      const dy = player.y - gem.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= player.magnetRadius) {
        gem.isMagnetized = true;
      }

      if (gem.isMagnetized) {
        const pullSpeed = Math.min(650, 200 + (1 - dist / player.magnetRadius) * 450);
        gem.vx = (dx / dist) * pullSpeed;
        gem.vy = (dy / dist) * pullSpeed;
        gem.x += gem.vx * dt;
        gem.y += gem.vy * dt;

        // Pickup collision
        if (dist <= player.radius + gem.radius + 6) {
          gemPool.release(gem);
          addXP(gem.value);

          if (popSoundThrottle <= 0) {
            soundEngine.playPop();
            popSoundThrottle = 0.08;
          }
        }
      }
    }

    // 8. Particles & Screen Shake
    particles.update(dt);
    cameraShake.update(dt);

    // 9. Update UI HUD
    updateHUD();
  }

  // Render Scene
  ctx.save();
  ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  cameraShake.apply(ctx);

  renderer.render(
    player,
    camera,
    enemyPool.getActives(),
    projectilePool.getActives(),
    gemPool.getActives(),
    weapons,
    particles,
    joystick,
    player.aliveTime
  );

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// Start Game Loop
requestAnimationFrame(gameLoop);
