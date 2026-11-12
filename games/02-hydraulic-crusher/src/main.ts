/**
 * main.ts - Game entry point and orchestrator for 02-Hydraulic-Crusher
 * Built with @arcade/shared modules (StorageManager, SoundEngine, AdManager, UIHelper).
 */

import {
  adManager,
  soundEngine,
  StorageManager,
  ParticleSystem,
  ScreenShake
} from '@arcade/shared';
import { CrusherSimulation } from './crusher';
import { CrusherRenderer } from './renderer';
import { GoldenDroneManager } from './drone';
import { UpgradesState } from './types';
import { ALL_BLUEPRINTS } from './blueprints';

// Virtual resolution
const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;

// DOM Elements
const wrapper = document.getElementById('game-wrapper') as HTMLDivElement;
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const cashDisplay = document.getElementById('cash-display') as HTMLElement;
const rateDisplay = document.getElementById('rate-display') as HTMLElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;
const btnOverdrive = document.getElementById('btn-overdrive') as HTMLButtonElement;
const odStatus = document.getElementById('od-status') as HTMLElement;

// Upgrade DOM Elements
const cardPower = document.getElementById('card-power') as HTMLElement;
const lvlPower = document.getElementById('lvl-power') as HTMLElement;
const statPower = document.getElementById('stat-power') as HTMLElement;
const btnPower = document.getElementById('btn-power') as HTMLElement;

const cardSpeed = document.getElementById('card-speed') as HTMLElement;
const lvlSpeed = document.getElementById('lvl-speed') as HTMLElement;
const statSpeed = document.getElementById('stat-speed') as HTMLElement;
const btnSpeed = document.getElementById('btn-speed') as HTMLElement;

const cardTeeth = document.getElementById('card-teeth') as HTMLElement;
const lvlTeeth = document.getElementById('lvl-teeth') as HTMLElement;
const statTeeth = document.getElementById('stat-teeth') as HTMLElement;
const btnTeeth = document.getElementById('btn-teeth') as HTMLElement;

const cardTier = document.getElementById('card-tier') as HTMLElement;
const lvlTier = document.getElementById('lvl-tier') as HTMLElement;
const statTier = document.getElementById('stat-tier') as HTMLElement;
const btnTier = document.getElementById('btn-tier') as HTMLElement;

// Modals
const modalOffline = document.getElementById('modal-offline') as HTMLElement;
const modalOfflineTime = document.getElementById('modal-offline-time') as HTMLElement;
const modalOfflineAmount = document.getElementById('modal-offline-amount') as HTMLElement;
const btnOfflineDouble = document.getElementById('btn-offline-double') as HTMLButtonElement;
const btnOfflineClaim = document.getElementById('btn-offline-claim') as HTMLButtonElement;

const modalDrone = document.getElementById('modal-drone') as HTMLElement;
const modalDroneBounty = document.getElementById('modal-drone-bounty') as HTMLElement;
const btnDroneClaim = document.getElementById('btn-drone-claim') as HTMLButtonElement;
const btnDroneDismiss = document.getElementById('btn-drone-dismiss') as HTMLButtonElement;

// Storage & Shared Systems
const storage = StorageManager.forGame('02-hydraulic-crusher');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
const sim = new CrusherSimulation();
const renderer = new CrusherRenderer(ctx);
const droneMgr = new GoldenDroneManager();

// Game State
let coins = storage.getItem<number>('coins', 50); // initial 50 coins to start
let upgrades: UpgradesState = storage.getItem<UpgradesState>('upgrades', {
  power: 1,
  speed: 1,
  teeth: 1,
  objectTier: 1
});

let isMuted = storage.getItem<boolean>('is_muted', false);
let scale = 1;
let isPaused = false;
let lastCrunchSoundTime = 0;
let lastSaveTime = performance.now();

// Rolling EPS (earnings per second) calculation
let earningsWindow: { time: number; amount: number }[] = [];
let displayedCoins = coins;

// Setup Sound & Ad Hooks
soundEngine.setMuted(isMuted);
btnSound.textContent = isMuted ? '🔇' : '🔊';

adManager.setGameHooks(
  () => {
    isPaused = true;
    soundEngine.setMuted(true);
  },
  () => {
    isPaused = false;
    soundEngine.setMuted(isMuted);
  }
);

// --- Responsive Window Resizing ---
function handleResize(): void {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  scale = Math.min(windowWidth / GAME_WIDTH, windowHeight / GAME_HEIGHT);
  wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', handleResize);
handleResize();

// --- Upgrade Cost & Stat Math ---
function getUpgradeCost(type: keyof UpgradesState, level: number): number {
  switch (type) {
    case 'power':
      return Math.floor(25 * Math.pow(1.5, level - 1));
    case 'speed':
      return Math.floor(35 * Math.pow(1.55, level - 1));
    case 'teeth':
      return Math.floor(50 * Math.pow(1.65, level - 1));
    case 'objectTier': {
      const costs = [100, 350, 1200, 4500, 18000, 999999];
      return costs[Math.min(level - 1, costs.length - 1)];
    }
  }
}

function updateUI(): void {
  // Cash balance formatting
  const formattedCoins = Math.floor(displayedCoins).toLocaleString();
  cashDisplay.textContent = `$${formattedCoins}`;

  // Rate per second
  const now = performance.now();
  earningsWindow = earningsWindow.filter((e) => now - e.time < 5000);
  const totalEarnedInWindow = earningsWindow.reduce((acc, curr) => acc + curr.amount, 0);
  const eps = earningsWindow.length > 0 ? (totalEarnedInWindow / 5).toFixed(1) : '0';
  rateDisplay.textContent = `+$${eps}/s`;

  // 1. Power
  const costPower = getUpgradeCost('power', upgrades.power);
  lvlPower.textContent = `LV ${upgrades.power}`;
  statPower.textContent = `Dmg: ${10 + (upgrades.power - 1) * 8}`;
  btnPower.textContent = `$${costPower.toLocaleString()}`;
  cardPower.classList.toggle('disabled', coins < costPower);

  // 2. Speed
  const costSpeed = getUpgradeCost('speed', upgrades.speed);
  lvlSpeed.textContent = `LV ${upgrades.speed}`;
  statSpeed.textContent = `RPM: ${(2.4 + (upgrades.speed - 1) * 0.55).toFixed(1)}`;
  btnSpeed.textContent = `$${costSpeed.toLocaleString()}`;
  cardSpeed.classList.toggle('disabled', coins < costSpeed);

  // 3. Teeth
  const costTeeth = getUpgradeCost('teeth', upgrades.teeth);
  lvlTeeth.textContent = `LV ${upgrades.teeth}`;
  const teethCount = Math.min(20, 6 + (upgrades.teeth - 1) * 2);
  statTeeth.textContent = `Teeth: ${teethCount}`;
  btnTeeth.textContent = `$${costTeeth.toLocaleString()}`;
  cardTeeth.classList.toggle('disabled', coins < costTeeth);

  // 4. Object Tier
  const isMaxTier = upgrades.objectTier >= ALL_BLUEPRINTS.length;
  const costTier = getUpgradeCost('objectTier', upgrades.objectTier);
  const currentBlueprint = ALL_BLUEPRINTS[Math.min(upgrades.objectTier - 1, ALL_BLUEPRINTS.length - 1)];
  lvlTier.textContent = `LV ${upgrades.objectTier}`;
  statTier.textContent = `${currentBlueprint.icon} ${currentBlueprint.name}`;
  btnTier.textContent = isMaxTier ? 'MAX' : `$${costTier.toLocaleString()}`;
  cardTier.classList.toggle('disabled', isMaxTier || coins < costTier);

  // Overdrive Button state
  if (sim.overdriveActive) {
    btnOverdrive.classList.add('active');
    odStatus.textContent = `${Math.ceil(sim.overdriveRemaining)}s REMAINING`;
  } else {
    btnOverdrive.classList.remove('active');
    odStatus.textContent = 'WATCH AD (2 MIN)';
  }
}

function buyUpgrade(type: keyof UpgradesState): void {
  const level = upgrades[type];
  if (type === 'objectTier' && level >= ALL_BLUEPRINTS.length) return;

  const cost = getUpgradeCost(type, level);
  if (coins >= cost) {
    coins -= cost;
    upgrades[type]++;
    soundEngine.playLevelUp();
    saveGame();
    updateUI();

    // Spawn floating text on card
    particles.spawnFloatingText(240, 680, `UPGRADED!`, '#22c55e', 20);
  } else {
    soundEngine.playClick();
  }
}

// Attach upgrade card listeners
cardPower.addEventListener('pointerdown', () => buyUpgrade('power'));
cardSpeed.addEventListener('pointerdown', () => buyUpgrade('speed'));
cardTeeth.addEventListener('pointerdown', () => buyUpgrade('teeth'));
cardTier.addEventListener('pointerdown', () => buyUpgrade('objectTier'));

// Mute toggle
btnSound.addEventListener('pointerdown', () => {
  isMuted = !isMuted;
  soundEngine.setMuted(isMuted);
  storage.setItem('is_muted', isMuted);
  btnSound.textContent = isMuted ? '🔇' : '🔊';
  soundEngine.playClick();
});

// Overdrive Rewarded Ad
btnOverdrive.addEventListener('pointerdown', () => {
  if (sim.overdriveActive) return;
  soundEngine.playClick();

  adManager.showRewarded(() => {
    sim.activateOverdrive(120);
    soundEngine.playLevelUp();
    cameraShake.shake(12, 0.4);
    particles.spawnNeonBurst(240, 375, '#ff4500', 45, 300);
    particles.spawnFloatingText(240, 320, '⚡ OVERDRIVE ACTIVATED!', '#ffea00', 26);
    updateUI();
  });
});

// --- Canvas Pointer / Tap Interaction ---
canvas.addEventListener('pointerdown', (e) => {
  const rect = wrapper.getBoundingClientRect();
  const tapX = (e.clientX - rect.left) / scale;
  const tapY = (e.clientY - rect.top) / scale;

  // 1. Check if Golden Drone was tapped
  if (droneMgr.checkHit(tapX, tapY)) {
    soundEngine.playPop();
    showDroneModal(droneMgr.drone!.bounty);
    return;
  }

  // 2. Otherwise trigger Hydraulic Slam Tap
  sim.triggerHydraulicSlam(tapX, tapY, upgrades);
  soundEngine.playCrunch();
  cameraShake.shake(8, 0.25);
  particles.spawnNeonBurst(tapX, tapY, '#ff7700', 24, 220);
  particles.spawnFloatingText(tapX, tapY - 20, 'SLAM!', '#ffea00', 20);
});

// --- Golden Drone Modal Logic ---
let pendingDroneBounty = 0;
function showDroneModal(bounty: number): void {
  pendingDroneBounty = bounty;
  modalDroneBounty.textContent = `+$${bounty.toLocaleString()}`;
  modalDrone.classList.add('show');
}

btnDroneClaim.addEventListener('pointerdown', () => {
  soundEngine.playClick();
  adManager.showRewarded(() => {
    coins += pendingDroneBounty;
    displayedCoins = coins;
    earningsWindow.push({ time: performance.now(), amount: pendingDroneBounty });
    droneMgr.despawnDrone();
    modalDrone.classList.remove('show');

    soundEngine.playLevelUp();
    cameraShake.shake(14, 0.45);
    particles.spawnNeonBurst(240, 375, '#ffd700', 50, 320);
    particles.spawnFloatingText(240, 300, `BOUNTY +$${pendingDroneBounty.toLocaleString()}!`, '#ffd700', 28);
    saveGame();
    updateUI();
  });
});

btnDroneDismiss.addEventListener('pointerdown', () => {
  soundEngine.playClick();
  modalDrone.classList.remove('show');
  droneMgr.dismissDrone();
});

// --- Offline Earnings Calculation ---
function checkOfflineEarnings(): void {
  const lastActive = storage.getItem<number>('last_active_timestamp', Date.now());
  const now = Date.now();
  const elapsedSeconds = Math.max(0, (now - lastActive) / 1000);

  if (elapsedSeconds >= 12) {
    // Cap at 8 hours (28,800 seconds)
    const cappedSeconds = Math.min(28800, elapsedSeconds);
    const estEps =
      ((10 + (upgrades.power - 1) * 8) * 0.4 + (2.4 + (upgrades.speed - 1) * 0.55) * 4) *
      (upgrades.objectTier * 0.8);
    const offlineAmount = Math.max(15, Math.floor(cappedSeconds * (estEps / 12)));

    const minutes = Math.floor(cappedSeconds / 60);
    const hours = (cappedSeconds / 3600).toFixed(1);
    modalOfflineTime.textContent =
      cappedSeconds > 3600
        ? `The crusher worked for ${hours} hours while you were away.`
        : `The crusher worked for ${minutes} minutes while you were away.`;
    modalOfflineAmount.textContent = `+$${offlineAmount.toLocaleString()}`;

    modalOffline.classList.add('show');

    btnOfflineClaim.onclick = () => {
      soundEngine.playClick();
      coins += offlineAmount;
      displayedCoins = coins;
      modalOffline.classList.remove('show');
      saveGame();
      updateUI();
    };

    btnOfflineDouble.onclick = () => {
      soundEngine.playClick();
      adManager.showRewarded(() => {
        const doubleAmount = offlineAmount * 2;
        coins += doubleAmount;
        displayedCoins = coins;
        modalOffline.classList.remove('show');
        soundEngine.playLevelUp();
        cameraShake.shake(10, 0.35);
        particles.spawnNeonBurst(240, 375, '#ffd700', 40, 260);
        particles.spawnFloatingText(240, 320, `+$${doubleAmount.toLocaleString()}!`, '#ffd700', 26);
        saveGame();
        updateUI();
      });
    };
  }
}

// --- Persistence ---
function saveGame(): void {
  storage.setItem('coins', coins);
  storage.setItem('upgrades', upgrades);
  storage.setItem('last_active_timestamp', Date.now());
}

window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveGame();
  }
});

// --- Main Game Loop ---
let lastTime = performance.now();

function gameLoop(time: number): void {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  if (!isPaused) {
    // 1. Update simulation
    sim.update(dt, upgrades);

    // 2. Golden Drone update
    const estEps = (10 + (upgrades.power - 1) * 8) * (upgrades.speed * 0.8) * upgrades.objectTier;
    droneMgr.update(dt, estEps, coins);

    // 3. Process crush sound & particles
    if (sim.hasCrushOccurred && time - lastCrunchSoundTime > (sim.overdriveActive ? 50 : 70)) {
      soundEngine.playCrunch();
      lastCrunchSoundTime = time;
      cameraShake.shake(sim.overdriveActive ? 4 : 2, 0.1);
    }

    // Process pending crush particles
    for (let i = 0; i < sim.pendingCrushEvents.length; i++) {
      const evt = sim.pendingCrushEvents[i];
      particles.spawnNeonBurst(evt.x, evt.y, evt.color, 4, 180, 2.2);
    }

    // Process pending cash rewards from funnel drain
    for (let i = 0; i < sim.pendingCashEvents.length; i++) {
      const cashEvt = sim.pendingCashEvents[i];
      coins += cashEvt.amount;
      earningsWindow.push({ time, amount: cashEvt.amount });

      // Floating cash text
      particles.spawnFloatingText(
        cashEvt.x + (Math.random() - 0.5) * 20,
        cashEvt.y - 10,
        `+$${cashEvt.amount}`,
        '#4ade80',
        14,
        0.65
      );
    }

    // Object fully crushed fanfare
    if (sim.hasCompletedObject) {
      soundEngine.playLevelUp();
      cameraShake.shake(8, 0.3);
      particles.spawnNeonBurst(240, 375, '#22c55e', 35, 280);
      particles.spawnFloatingText(240, 350, 'DESTROYED!', '#4ade80', 24);
    }

    // 4. Update particles and screen shake
    particles.update(dt);
    cameraShake.update(dt);

    // Smooth count-up on cash display
    if (displayedCoins < coins) {
      displayedCoins = Math.min(coins, displayedCoins + Math.max(1, (coins - displayedCoins) * dt * 8));
    } else {
      displayedCoins = coins;
    }

    // Periodic autosave every 3 seconds
    if (time - lastSaveTime > 3000) {
      saveGame();
      lastSaveTime = time;
    }

    // 5. Render Scene
    ctx.save();
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    cameraShake.apply(ctx);

    renderer.render(sim, droneMgr, dt);
    particles.render(ctx);

    ctx.restore();

    // 6. Refresh UI
    updateUI();
  }

  requestAnimationFrame(gameLoop);
}

// Initial Boot
checkOfflineEarnings();
updateUI();
requestAnimationFrame(gameLoop);
