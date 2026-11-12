import {
  adManager,
  soundEngine,
  StorageManager,
  ParticleSystem,
  ScreenShake
} from '@arcade/shared';

import {
  CONTAINER,
  DANGER_MAX_TIME,
  DROP_COOLDOWN,
  GAME_HEIGHT,
  GAME_WIDTH,
  getRandomSpawnTier,
  TIERS
} from './constants';
import { PhysicsWorld } from './physics';
import { NeonRenderer } from './renderer';
import { CustomBodyData } from './types';

// DOM elements
const wrapper = document.getElementById('game-wrapper') as HTMLDivElement;
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;

const scoreDisplay = document.getElementById('score-display') as HTMLDivElement;
const bestDisplay = document.getElementById('best-display') as HTMLDivElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
const btnBomb = document.getElementById('btn-bomb') as HTMLButtonElement;
const btnRainbow = document.getElementById('btn-rainbow') as HTMLButtonElement;

const modalGameOver = document.getElementById('modal-gameover') as HTMLDivElement;
const modalFinalScore = document.getElementById('modal-final-score') as HTMLSpanElement;
const modalBestScore = document.getElementById('modal-best-score') as HTMLSpanElement;
const btnRevive = document.getElementById('btn-revive') as HTMLButtonElement;
const btnRestart = document.getElementById('btn-restart') as HTMLButtonElement;

// Core game instances
const storage = StorageManager.forGame('01-neon-suika');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
const physics = new PhysicsWorld();
const renderer = new NeonRenderer(ctx);

// State variables
let score = 0;
let bestScore = storage.getHighScore();
let gamesPlayed = storage.getItem<number>('games_played', 0);

let currentTier = getRandomSpawnTier();
let nextTier = getRandomSpawnTier();
let isRainbowActive = false;

let dropperX = (CONTAINER.left + CONTAINER.right) / 2;
let dropCooldown = 0;
let dangerTimer = 0;
let isGameOver = false;
let isPaused = false;
let scale = 1;

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

// Init sound state from storage
const initialMuted = storage.getItem<boolean>('is_muted', false);
soundEngine.setMuted(initialMuted);
btnSound.textContent = initialMuted ? '🔇' : '🔊';

// Resize & responsive scaling
function handleResize(): void {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);
  wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', handleResize);
handleResize();

// Update HUD displays
function updateHUD(): void {
  scoreDisplay.textContent = score.toLocaleString();
  bestDisplay.textContent = bestScore.toLocaleString();
}

updateHUD();

// Sound toggle
btnSound.addEventListener('pointerdown', (e) => e.stopPropagation());
btnSound.addEventListener('click', (e) => {
  e.stopPropagation();
  const muted = soundEngine.toggleMute();
  storage.setItem('is_muted', muted);
  btnSound.textContent = muted ? '🔇' : '🔊';
  if (!muted) soundEngine.playClick();
});

// Collision Merge Handler
physics.setOnMergeCallback((event) => {
  score += event.points;
  if (storage.setHighScore(score)) {
    bestScore = score;
  }
  updateHUD();

  if (event.isSupernova) {
    soundEngine.playExplosion();
    particles.spawnNeonBurst(event.midX, event.midY, '#ffd700', 45, 320, 5.5);
    particles.spawnNeonBurst(event.midX, event.midY, '#ff0055', 35, 260, 4.5);
    particles.spawnFloatingText(event.midX, event.midY, '+2500 SUPERNOVA!', '#ffd700', 26);
    cameraShake.shake(15, 0.55);
  } else {
    // Especificación del juego: disparando SoundEngine.playMerge(nivel * 100), partículas y ScreenShake
    soundEngine.playMerge(event.newTier * 100);

    const config = TIERS[event.newTier - 1];
    particles.spawnNeonBurst(
      event.midX,
      event.midY,
      config.color,
      22 + event.newTier * 2,
      210 + event.newTier * 10,
      3.2 + event.newTier * 0.3
    );

    const label = event.isRainbow ? `+${event.points} RAINBOW!` : `+${event.points}`;
    particles.spawnFloatingText(
      event.midX,
      event.midY,
      label,
      config.color,
      20 + event.newTier
    );

    cameraShake.shake(3 + event.newTier * 0.8, 0.2 + event.newTier * 0.02);
  }
});

// Calculate guide line impact point directly below dropper
function calculateHitY(): number {
  const currentRadius = TIERS[currentTier - 1].radius;
  let lowestY = CONTAINER.bottom;

  const pieces = physics.getAllPieces();
  for (const piece of pieces) {
    const pData = (piece as unknown as { customData?: CustomBodyData }).customData;
    if (!pData || pData.isMerged) continue;

    const pieceRadius = TIERS[pData.tier - 1].radius;
    const dx = Math.abs(piece.position.x - dropperX);
    const combinedRadius = currentRadius + pieceRadius;

    if (dx < combinedRadius && piece.position.y > CONTAINER.dropperY) {
      // Circle intersection estimate
      const dy = Math.sqrt(Math.max(0, combinedRadius * combinedRadius - dx * dx));
      const contactY = piece.position.y - dy;
      if (contactY < lowestY) {
        lowestY = contactY;
      }
    }
  }

  return lowestY;
}

// Dropper movement clamping
function setDropperXFromClient(clientX: number): void {
  const rect = wrapper.getBoundingClientRect();
  const rawX = (clientX - rect.left) / scale;
  const currentRadius = TIERS[currentTier - 1].radius;

  dropperX = Math.max(
    CONTAINER.left + currentRadius + 6,
    Math.min(CONTAINER.right - currentRadius - 6, rawX)
  );
}

// Pointer event listeners on wrapper
let isPointerActive = false;

wrapper.addEventListener('pointerdown', (e) => {
  if (isGameOver || isPaused) return;
  // If target is a button or modal, ignore
  if ((e.target as HTMLElement).closest('button, #modal-gameover')) return;

  isPointerActive = true;
  setDropperXFromClient(e.clientX);
});

wrapper.addEventListener('pointermove', (e) => {
  if (isGameOver || isPaused) return;
  if (isPointerActive || e.pointerType === 'mouse') {
    setDropperXFromClient(e.clientX);
  }
});

wrapper.addEventListener('pointerup', (e) => {
  if (isGameOver || isPaused) return;
  if ((e.target as HTMLElement).closest('button, #modal-gameover')) return;

  if (dropCooldown <= 0) {
    dropCurrentPiece();
  }
  isPointerActive = false;
});

function dropCurrentPiece(): void {
  const body = physics.createPieceBody(
    dropperX,
    CONTAINER.dropperY,
    currentTier,
    isRainbowActive
  );

  physics.addPiece(body);
  soundEngine.playPop();

  const config = TIERS[currentTier - 1];
  particles.spawnNeonBurst(
    dropperX,
    CONTAINER.dropperY,
    isRainbowActive ? '#ffffff' : config.color,
    14,
    120,
    2.5
  );

  // Transition to next piece
  currentTier = nextTier;
  nextTier = getRandomSpawnTier();
  isRainbowActive = false;
  btnRainbow.classList.remove('active');
  dropCooldown = DROP_COOLDOWN;

  // Clamp dropper X for newly equipped piece
  const newRadius = TIERS[currentTier - 1].radius;
  dropperX = Math.max(
    CONTAINER.left + newRadius + 6,
    Math.min(CONTAINER.right - newRadius - 6, dropperX)
  );
}

// --- Monetization: Rewarded Ad 1 - Bomb Smallest ---
btnBomb.addEventListener('pointerdown', (e) => e.stopPropagation());
btnBomb.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (isGameOver || isPaused) return;

  soundEngine.playClick();
  await adManager.showRewarded(() => {
    const pieces = physics.getAllPieces();
    if (pieces.length === 0) return;

    // Sort by tier ascending (lowest tier first)
    pieces.sort((a, b) => {
      const dataA = (a as unknown as { customData: CustomBodyData }).customData;
      const dataB = (b as unknown as { customData: CustomBodyData }).customData;
      return dataA.tier - dataB.tier;
    });

    const toExplode = pieces.slice(0, 4);
    for (const piece of toExplode) {
      const data = (piece as unknown as { customData: CustomBodyData }).customData;
      const cfg = TIERS[data.tier - 1];
      particles.spawnNeonBurst(piece.position.x, piece.position.y, cfg.color, 30, 260, 4.5);
      particles.spawnFloatingText(piece.position.x, piece.position.y, 'BOMB!', '#ff0055', 22);
      physics.removePiece(piece);
    }

    soundEngine.playExplosion();
    cameraShake.shake(12, 0.45);
    dangerTimer = 0;
  });
});

// --- Monetization: Rewarded Ad 2 - Rainbow Orb ---
btnRainbow.addEventListener('pointerdown', (e) => e.stopPropagation());
btnRainbow.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (isGameOver || isPaused) return;

  soundEngine.playClick();
  await adManager.showRewarded(() => {
    isRainbowActive = true;
    btnRainbow.classList.add('active');
    soundEngine.playLevelUp();
    particles.spawnNeonBurst(dropperX, CONTAINER.dropperY, '#00f0ff', 25, 220, 4);
    particles.spawnFloatingText(
      dropperX,
      CONTAINER.dropperY,
      'RAINBOW ORB READY!',
      '#ff00ff',
      20
    );
  });
});

// --- Game Over Trigger ---
function triggerGameOver(): void {
  if (isGameOver) return;
  isGameOver = true;

  soundEngine.playGameOver();
  modalFinalScore.textContent = score.toLocaleString();
  modalBestScore.textContent = bestScore.toLocaleString();
  modalGameOver.classList.add('visible');
}

// --- Monetization: Revive (Clear Top 30%) ---
btnRevive.addEventListener('pointerdown', (e) => e.stopPropagation());
btnRevive.addEventListener('click', async (e) => {
  e.stopPropagation();
  soundEngine.playClick();

  await adManager.showRewarded(() => {
    const playfieldHeight = CONTAINER.bottom - CONTAINER.dangerLineY;
    const cutoffY = CONTAINER.dangerLineY + playfieldHeight * 0.35;

    const pieces = physics.getAllPieces();
    let clearedCount = 0;

    for (const piece of pieces) {
      if (piece.position.y < cutoffY) {
        clearedCount++;
        const data = (piece as unknown as { customData: CustomBodyData }).customData;
        const cfg = TIERS[data.tier - 1];
        particles.spawnNeonBurst(piece.position.x, piece.position.y, cfg.color, 25, 220, 4);
        physics.removePiece(piece);
      }
    }

    dangerTimer = 0;
    isGameOver = false;
    modalGameOver.classList.remove('visible');

    soundEngine.playLevelUp();
    cameraShake.shake(10, 0.4);

    if (clearedCount > 0) {
      particles.spawnFloatingText(
        (CONTAINER.left + CONTAINER.right) / 2,
        CONTAINER.dangerLineY + 60,
        'SYSTEM RESTORED!',
        '#00ffaa',
        22
      );
    }
  });
});

// --- Play Again (Interstitial every 2 games) ---
btnRestart.addEventListener('pointerdown', (e) => e.stopPropagation());
btnRestart.addEventListener('click', async (e) => {
  e.stopPropagation();
  soundEngine.playClick();

  gamesPlayed++;
  storage.setItem('games_played', gamesPlayed);

  // Requisito: cada 2 partidas dispara showInterstitial()
  if (gamesPlayed % 2 === 0) {
    await adManager.showInterstitial();
  }

  // Reset game state
  physics.clearAllPieces();
  particles.clear();
  cameraShake.reset();

  score = 0;
  dangerTimer = 0;
  isGameOver = false;
  isRainbowActive = false;
  btnRainbow.classList.remove('active');
  modalGameOver.classList.remove('visible');

  currentTier = getRandomSpawnTier();
  nextTier = getRandomSpawnTier();
  updateHUD();
});

// --- Main Game Loop ---
let lastTime = performance.now();

function gameLoop(time: number): void {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;

  if (!isPaused) {
    if (dropCooldown > 0) {
      dropCooldown = Math.max(0, dropCooldown - dt);
    }

    if (!isGameOver) {
      physics.update(dt);

      // Check danger line condition (settled or dropped pieces above danger line)
      const now = performance.now();
      const pieces = physics.getAllPieces();
      let hasOverflow = false;

      for (const piece of pieces) {
        const data = (piece as unknown as { customData?: CustomBodyData }).customData;
        if (!data || data.isMerged) continue;

        // Give newly dropped piece 1.0 second grace period to fall through danger line
        if (now - data.spawnTime < 1000) continue;

        const radius = TIERS[data.tier - 1].radius;
        if (piece.position.y - radius < CONTAINER.dangerLineY) {
          hasOverflow = true;
          break;
        }
      }

      if (hasOverflow) {
        dangerTimer += dt;
        if (dangerTimer >= DANGER_MAX_TIME) {
          triggerGameOver();
        }
      } else {
        dangerTimer = Math.max(0, dangerTimer - dt * 2);
      }
    }

    particles.update(dt);
    cameraShake.update(dt);
  }

  // --- Rendering Pass ---
  ctx.save();
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // 1. Static & ambient background
  renderer.renderBackground(time);

  // 2. Camera shake offset applied to world elements
  ctx.save();
  cameraShake.apply(ctx);

  // 3. Container & Danger line
  const dangerProgress = Math.min(1, dangerTimer / DANGER_MAX_TIME);
  renderer.renderContainer(dangerTimer > 0, dangerProgress, time);

  // 4. Guide line & Dropper piece (when not game over)
  if (!isGameOver) {
    const hitY = calculateHitY();
    const config = TIERS[currentTier - 1];
    renderer.renderGuideLine(
      dropperX,
      CONTAINER.dropperY,
      config.radius,
      isRainbowActive,
      config,
      hitY
    );

    renderer.renderDropperPiece(
      dropperX,
      CONTAINER.dropperY,
      currentTier,
      isRainbowActive,
      time
    );
  }

  // 5. Active physical pieces
  const pieces = physics.getAllPieces();
  for (const piece of pieces) {
    const data = (piece as unknown as { customData: CustomBodyData }).customData;
    const config = TIERS[data.tier - 1];
    renderer.renderNeonOrb(
      piece.position.x,
      piece.position.y,
      config.radius,
      data.tier,
      data.isRainbow,
      piece.angle,
      time
    );
  }

  // 6. Particles & Floating texts
  particles.render(ctx);

  ctx.restore(); // Restore camera shake

  ctx.restore(); // Restore root canvas transform

  // 7. Render Next Piece preview in HUD
  renderer.renderNextPreview(nextCanvas, nextTier);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
