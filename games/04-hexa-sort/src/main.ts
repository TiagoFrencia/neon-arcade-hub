/**
 * main.ts - Core game loop, merge sequence engine, monetization and interaction
 */

import {
  adManager,
  ParticleSystem,
  ScreenShake,
  soundEngine,
  StorageManager
} from '@arcade/shared';

import { HexBoard } from './board';
import {
  COLOR_PALETTE,
  ColorDef,
  HAND_HEX_SIZE,
  HAND_SLOTS_X,
  HAND_Y,
  HEX_SIZE,
  HEX_TILE_HEIGHT,
  MERGE_PITCH_SCALE,
  STACK_CLEAR_THRESHOLD,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
  getLevelConfig
} from './constants';
import { HexRenderer } from './renderer';
import { DraggedItem, GameState, HandSlot, HexCell, JumpingTile } from './types';

// DOM Elements
const wrapper = document.getElementById('game-wrapper') as HTMLDivElement;
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const scoreDisplay = document.getElementById('score-display') as HTMLDivElement;
const bestDisplay = document.getElementById('best-display') as HTMLDivElement;
const levelDisplay = document.getElementById('level-display') as HTMLDivElement;
const goalBarFill = document.getElementById('goal-bar-fill') as HTMLDivElement;
const goalText = document.getElementById('goal-text') as HTMLDivElement;
const btnSound = document.getElementById('btn-sound') as HTMLButtonElement;

const bannerHammer = document.getElementById('banner-hammer') as HTMLDivElement;
const btnCancelHammer = document.getElementById('btn-cancel-hammer') as HTMLButtonElement;

const btnHammer = document.getElementById('btn-hammer') as HTMLButtonElement;
const btnSwap = document.getElementById('btn-swap') as HTMLButtonElement;
const btnUnlock = document.getElementById('btn-unlock') as HTMLButtonElement;

const modalOutOfSpace = document.getElementById('modal-outofspace') as HTMLDivElement;
const oosScore = document.getElementById('oos-score') as HTMLSpanElement;
const oosLevel = document.getElementById('oos-level') as HTMLSpanElement;
const btnReviveClear = document.getElementById('btn-revive-clear') as HTMLButtonElement;
const btnReviveVip = document.getElementById('btn-revive-vip') as HTMLButtonElement;
const btnRestartGame = document.getElementById('btn-restart-game') as HTMLButtonElement;

const modalLevelComplete = document.getElementById('modal-levelcomplete') as HTMLDivElement;
const lcLevel = document.getElementById('lc-level') as HTMLSpanElement;
const lcScore = document.getElementById('lc-score') as HTMLSpanElement;
const btnNextLevel = document.getElementById('btn-next-level') as HTMLButtonElement;

// Engine Subsystems
const storage = StorageManager.forGame('04-hexa-sort');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
const board = new HexBoard();
const renderer = new HexRenderer(ctx);

// Persistent Game State
let level = storage.getItem<number>('level', 1);
let score = 0;
let bestScore = storage.getHighScore();
let goalProgress = 0;
let levelConfig = getLevelConfig(level);

// Power-up Inventory
let hammerCharges = 1;
let swapCharges = 0;
let unlockCharges = 0;

// Runtime Interaction State
let gameState: GameState = 'PLAYING';
let isPaused = false;
let comboStep = 0;
let wrapperScale = 1;

// Drag and Drop & Slots
let handSlots: HandSlot[] = [
  { index: 0, x: HAND_SLOTS_X[0], y: HAND_Y, stack: null },
  { index: 1, x: HAND_SLOTS_X[1], y: HAND_Y, stack: null },
  { index: 2, x: HAND_SLOTS_X[2], y: HAND_Y, stack: null }
];
let draggedItem: DraggedItem | null = null;
let activeJumps: JumpingTile[] = [];
let nextJumpId = 1;

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

// Setup sound mute from storage
const initialMuted = storage.getItem<boolean>('is_muted', false);
soundEngine.setMuted(initialMuted);
btnSound.textContent = initialMuted ? '🔇' : '🔊';

btnSound.addEventListener('click', (e) => {
  e.stopPropagation();
  const muted = soundEngine.toggleMute();
  storage.setItem<boolean>('is_muted', muted);
  btnSound.textContent = muted ? '🔇' : '🔊';
});

// Responsive Scale Handling
function handleResize(): void {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  wrapperScale = Math.min(windowWidth / VIRTUAL_WIDTH, windowHeight / VIRTUAL_HEIGHT);
  wrapper.style.transform = `scale(${wrapperScale})`;
}

window.addEventListener('resize', handleResize);
handleResize();

// HUD UI Updates
function updateHUD(): void {
  scoreDisplay.textContent = score.toLocaleString();
  bestDisplay.textContent = bestScore.toLocaleString();
  levelDisplay.textContent = `LEVEL ${level}`;

  const pct = Math.min(100, Math.floor((goalProgress / levelConfig.targetTiles) * 100));
  goalBarFill.style.width = `${pct}%`;
  goalText.textContent = `GOAL: ${goalProgress} / ${levelConfig.targetTiles}`;

  // Update powerup buttons labels
  const hammerTag = btnHammer.querySelector('.ad-tag') as HTMLElement;
  if (hammerTag) {
    hammerTag.textContent = hammerCharges > 0 ? `READY (${hammerCharges})` : 'WATCH AD';
  }

  const swapTag = btnSwap.querySelector('.ad-tag') as HTMLElement;
  if (swapTag) {
    swapTag.textContent = swapCharges > 0 ? `READY (${swapCharges})` : 'WATCH AD';
  }

  const unlockTag = btnUnlock.querySelector('.ad-tag') as HTMLElement;
  const lockedCount = board.getLockedCount();
  if (unlockTag) {
    if (lockedCount === 0) {
      btnUnlock.disabled = true;
      unlockTag.textContent = 'MAX';
    } else {
      btnUnlock.disabled = false;
      unlockTag.textContent = unlockCharges > 0 ? `READY (${unlockCharges})` : 'WATCH AD';
    }
  }
}

// Hand Tray Generation
function generateHand(forcePure = false): void {
  const availableColors = levelConfig.colorCount;

  for (const slot of handSlots) {
    if (forcePure) {
      // Pure color stack: 4 to 5 chips of a single pure color
      const colorId = Math.floor(Math.random() * availableColors);
      const count = 4 + Math.floor(Math.random() * 2);
      slot.stack = Array(count).fill(colorId);
    } else {
      // Mixed color stack: 2 to 6 chips with 1-3 layers
      const totalChips =
        levelConfig.minStackSize +
        Math.floor(Math.random() * (levelConfig.maxStackSize - levelConfig.minStackSize + 1));
      const layers = Math.min(levelConfig.maxColorLayers, Math.max(1, Math.floor(totalChips / 2)));

      const stack: number[] = [];
      let remaining = totalChips;

      for (let l = 0; l < layers; l++) {
        const colorId = Math.floor(Math.random() * availableColors);
        const count = l === layers - 1 ? remaining : Math.max(1, Math.floor(remaining / (layers - l)));
        for (let c = 0; c < count; c++) {
          stack.push(colorId);
        }
        remaining -= count;
        if (remaining <= 0) break;
      }

      slot.stack = stack;
    }
  }

  soundEngine.playPop();
  particles.spawnNeonBurst(VIRTUAL_WIDTH / 2, HAND_Y, '#00f0ff', 16, 140);
}

function checkAndRefillHand(): void {
  const allEmpty = handSlots.every((s) => s.stack === null);
  if (allEmpty) {
    generateHand(false);
  }
}

// Merge & Chain Reaction Machine
function startMergeSequence(placedCell?: HexCell): void {
  stepMergeSequence(placedCell);
}

function stepMergeSequence(priorityCell?: HexCell): void {
  // 1. Search for any adjacent cell pair sharing the same top color
  let candidateDonor: HexCell | null = null;
  let candidateRecipient: HexCell | null = null;
  let matchColor: number | null = null;

  // First check priorityCell (the newly modified or dropped cell)
  if (priorityCell && priorityCell.stack.length > 0) {
    const topColor = board.getTopColor(priorityCell)!;
    const neighbors = board.getNeighbors(priorityCell).filter(
      (n) => !n.isLocked && n.stack.length > 0 && board.getTopColor(n) === topColor
    );

    if (neighbors.length > 0) {
      // Pick neighbor with the largest stack of that top color
      neighbors.sort((a, b) => board.getTopColorRun(b) - board.getTopColorRun(a));
      const bestNeighbor = neighbors[0];

      // Donor is the one with fewer top tiles, or priorityCell if equal
      const runPriority = board.getTopColorRun(priorityCell);
      const runNeighbor = board.getTopColorRun(bestNeighbor);

      if (runPriority <= runNeighbor) {
        candidateDonor = priorityCell;
        candidateRecipient = bestNeighbor;
      } else {
        candidateDonor = bestNeighbor;
        candidateRecipient = priorityCell;
      }
      matchColor = topColor;
    }
  }

  // If no match found for priorityCell, scan all board pairs
  if (!candidateDonor || !candidateRecipient || matchColor === null) {
    for (const cell of board.cells) {
      if (cell.isLocked || cell.stack.length === 0) continue;
      const topColor = board.getTopColor(cell)!;
      const neighbors = board.getNeighbors(cell).filter(
        (n) => !n.isLocked && n.stack.length > 0 && board.getTopColor(n) === topColor
      );

      if (neighbors.length > 0) {
        neighbors.sort((a, b) => board.getTopColorRun(b) - board.getTopColorRun(a));
        const bestNeighbor = neighbors[0];
        const runA = board.getTopColorRun(cell);
        const runB = board.getTopColorRun(bestNeighbor);

        if (runA <= runB) {
          candidateDonor = cell;
          candidateRecipient = bestNeighbor;
        } else {
          candidateDonor = bestNeighbor;
          candidateRecipient = cell;
        }
        matchColor = topColor;
        break;
      }
    }
  }

  // If no adjacent matching pairs exist, merge cascade is finished!
  if (!candidateDonor || !candidateRecipient || matchColor === null) {
    finishMergeSequence();
    return;
  }

  // 2. Prepare transfer of top matching tiles from donor to recipient
  const transferCount = board.getTopColorRun(candidateDonor);
  const transferredChips: number[] = [];

  for (let i = 0; i < transferCount; i++) {
    transferredChips.push(candidateDonor.stack.pop()!);
  }

  // Create parabolic jumping tile animations
  const donor = candidateDonor;
  const recipient = candidateRecipient;
  const baseRecipientHeight = recipient.stack.length * HEX_TILE_HEIGHT;

  comboStep++;
  const pitchIdx = (comboStep - 1) % MERGE_PITCH_SCALE.length;
  const soundPitch = MERGE_PITCH_SCALE[pitchIdx];

  for (let i = 0; i < transferCount; i++) {
    const isLast = i === transferCount - 1;
    const chipColor = transferredChips[i];
    const delay = i * 0.08;

    activeJumps.push({
      id: nextJumpId++,
      colorId: chipColor,
      startX: donor.x,
      startY: donor.y,
      targetX: recipient.x,
      targetY: recipient.y,
      startElevation: (donor.stack.length + transferCount - 1 - i) * HEX_TILE_HEIGHT,
      targetElevation: baseRecipientHeight + i * HEX_TILE_HEIGHT,
      delay,
      elapsed: -delay,
      duration: 0.26,
      arcHeight: 55 + Math.min(30, comboStep * 3),
      comboStep,
      recipientCell: recipient,
      isLastInBatch: isLast
    });
  }
}

function handleJumpArrival(jump: JumpingTile): void {
  const recipient = jump.recipientCell;
  recipient.stack.push(jump.colorId);
  recipient.bounce = 1.0;

  // Sound in ascending musical scale
  const pitchIdx = (jump.comboStep - 1) % MERGE_PITCH_SCALE.length;
  soundEngine.playMerge(MERGE_PITCH_SCALE[pitchIdx]);

  // Small landing puff particles
  const colorDef = COLOR_PALETTE[jump.colorId] ?? COLOR_PALETTE[0];
  particles.spawnNeonBurst(recipient.x, recipient.y - recipient.stack.length * HEX_TILE_HEIGHT, colorDef.glow, 6, 80, 2);

  if (jump.isLastInBatch) {
    // Check if recipient completed a 10-tile matching set
    const topRun = board.getTopColorRun(recipient);
    if (topRun >= STACK_CLEAR_THRESHOLD) {
      // Clear 10 matching tiles!
      const clearedColor = board.getTopColor(recipient)!;
      for (let k = 0; k < STACK_CLEAR_THRESHOLD; k++) {
        recipient.stack.pop();
      }

      // Explosion effects
      soundEngine.playExplosion();
      cameraShake.shake(6, 0.25);
      const clearColorDef = COLOR_PALETTE[clearedColor] ?? COLOR_PALETTE[0];
      particles.spawnNeonBurst(recipient.x, recipient.y - 30, clearColorDef.glow, 36, 260, 4);

      const comboBonus = Math.max(1, jump.comboStep);
      const earnedScore = 100 * comboBonus;
      score += earnedScore;
      if (score > bestScore) {
        bestScore = score;
        storage.setHighScore(bestScore);
      }
      storage.addCoins(10);

      particles.spawnFloatingText(
        recipient.x,
        recipient.y - 50,
        `+${earnedScore} CLEARED!`,
        '#ffd000',
        22
      );

      // Level goal progress
      goalProgress += STACK_CLEAR_THRESHOLD;
      updateHUD();
    }

    // Continue chain reaction cascade!
    stepMergeSequence(recipient);
  }
}

function finishMergeSequence(): void {
  comboStep = 0;

  // 1. Check if level target reached
  if (goalProgress >= levelConfig.targetTiles) {
    triggerLevelComplete();
    return;
  }

  // 2. Refill hand if empty
  checkAndRefillHand();

  // 3. Check out of space condition
  checkOutOfSpace();

  gameState = 'PLAYING';
}

function checkOutOfSpace(): void {
  const emptyCount = board.getEmptyUnlockedCount();
  const remainingHandStacks = handSlots.filter((s) => s.stack !== null).length;

  if (emptyCount === 0 && remainingHandStacks > 0) {
    gameState = 'OUT_OF_SPACE';
    oosScore.textContent = score.toLocaleString();
    oosLevel.textContent = `${level}`;
    modalOutOfSpace.style.display = 'flex';
  }
}

// Progression & Level Complete
function triggerLevelComplete(): void {
  gameState = 'LEVEL_COMPLETE';
  soundEngine.playLaser();
  particles.spawnNeonBurst(VIRTUAL_WIDTH / 2, 350, '#ffd000', 50, 300, 5);

  lcLevel.textContent = `${level}`;
  lcScore.textContent = score.toLocaleString();
  modalLevelComplete.style.display = 'flex';
}

function proceedToNextLevel(): void {
  modalLevelComplete.style.display = 'none';

  // Show interstitial ad between levels
  adManager.showInterstitial().finally(() => {
    level++;
    storage.setItem<number>('level', level);
    levelConfig = getLevelConfig(level);
    goalProgress = 0;

    // Reset board with fresh grid (preserving VIP locks)
    board.initBoard();
    generateHand(false);
    updateHUD();
    gameState = 'PLAYING';
  });
}

// Power-ups Execution
function enterHammerMode(): void {
  gameState = 'HAMMER_MODE';
  bannerHammer.style.display = 'flex';
}

function exitHammerMode(): void {
  bannerHammer.style.display = 'none';
  gameState = 'PLAYING';
}

function useHammerOnCell(cell: HexCell): void {
  if (cell.stack.length === 0 || cell.isLocked) return;

  const cleared = board.clearCell(cell);
  hammerCharges = Math.max(0, hammerCharges - 1);

  soundEngine.playExplosion();
  cameraShake.shake(8, 0.35);

  const topColor = cleared[cleared.length - 1] ?? 0;
  const colorDef = COLOR_PALETTE[topColor] ?? COLOR_PALETTE[0];
  particles.spawnNeonBurst(cell.x, cell.y - 20, colorDef.glow, 40, 280, 4);
  particles.spawnFloatingText(cell.x, cell.y - 40, '💥 SMASHED!', '#ff3366', 22);

  exitHammerMode();
  updateHUD();

  // If Out of Space modal was open, close it
  modalOutOfSpace.style.display = 'none';
  gameState = 'PLAYING';
}

function triggerSwapHand(): void {
  if (swapCharges > 0) {
    swapCharges--;
    generateHand(true);
    updateHUD();
  } else {
    adManager.showRewarded(() => {
      generateHand(true);
      updateHUD();
    });
  }
}

function triggerUnlockVIP(): void {
  if (board.getLockedCount() === 0) return;

  const performUnlock = () => {
    const unlocked = board.unlockVIPCells(2);
    soundEngine.playLaser();
    cameraShake.shake(4, 0.2);

    for (const cell of unlocked) {
      particles.spawnNeonBurst(cell.x, cell.y, '#ffd000', 24, 200, 3.5);
      particles.spawnFloatingText(cell.x, cell.y - 20, '🔓 UNLOCKED!', '#ffd000', 16);
    }

    updateHUD();
    modalOutOfSpace.style.display = 'none';
    if (gameState === 'OUT_OF_SPACE') {
      gameState = 'PLAYING';
    }
  };

  if (unlockCharges > 0) {
    unlockCharges--;
    performUnlock();
  } else {
    adManager.showRewarded(() => {
      performUnlock();
    });
  }
}

function triggerReviveVaporize(): void {
  adManager.showRewarded(() => {
    // Vaporize the 2 largest stacks on the board
    const occupied = board.cells.filter((c) => !c.isLocked && c.stack.length > 0);
    occupied.sort((a, b) => b.stack.length - a.stack.length);

    const toClear = occupied.slice(0, 2);
    soundEngine.playExplosion();
    cameraShake.shake(8, 0.3);

    for (const cell of toClear) {
      board.clearCell(cell);
      particles.spawnNeonBurst(cell.x, cell.y - 20, '#ff007f', 32, 240, 4);
      particles.spawnFloatingText(cell.x, cell.y - 40, 'VAPORIZED!', '#ff007f', 18);
    }

    modalOutOfSpace.style.display = 'none';
    gameState = 'PLAYING';
    updateHUD();
  });
}

function restartLevel(): void {
  modalOutOfSpace.style.display = 'none';
  board.clearAllStacks();
  generateHand(false);
  goalProgress = 0;
  updateHUD();
  gameState = 'PLAYING';
}

// Event Listeners for UI Buttons
btnHammer.addEventListener('click', (e) => {
  e.stopPropagation();
  if (gameState === 'HAMMER_MODE') {
    exitHammerMode();
    return;
  }
  if (hammerCharges > 0) {
    enterHammerMode();
  } else {
    adManager.showRewarded(() => {
      hammerCharges++;
      updateHUD();
      enterHammerMode();
    });
  }
});

btnCancelHammer.addEventListener('click', (e) => {
  e.stopPropagation();
  exitHammerMode();
});

btnSwap.addEventListener('click', (e) => {
  e.stopPropagation();
  triggerSwapHand();
});

btnUnlock.addEventListener('click', (e) => {
  e.stopPropagation();
  triggerUnlockVIP();
});

btnReviveClear.addEventListener('click', () => triggerReviveVaporize());
btnReviveVip.addEventListener('click', () => triggerUnlockVIP());
btnRestartGame.addEventListener('click', () => restartLevel());
btnNextLevel.addEventListener('click', () => proceedToNextLevel());

// Pointer Event Handling (Virtual 480x800 Coordinates)
function getPointerPos(e: PointerEvent): { x: number; y: number } {
  const rect = wrapper.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / wrapperScale,
    y: (e.clientY - rect.top) / wrapperScale
  };
}

canvas.addEventListener('pointerdown', (e) => {
  if (isPaused) return;
  const { x, y } = getPointerPos(e);

  // 1. Hammer Mode interaction
  if (gameState === 'HAMMER_MODE') {
    const clickedCell = board.getClosestCell(x, y, 46);
    if (clickedCell && !clickedCell.isLocked && clickedCell.stack.length > 0) {
      useHammerOnCell(clickedCell);
    }
    return;
  }

  // 2. Drag & Drop stack from hand slots
  if (gameState !== 'PLAYING') return;

  for (const slot of handSlots) {
    if (!slot.stack || slot.stack.length === 0) continue;

    const dx = slot.x - x;
    const dy = slot.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 46) {
      draggedItem = {
        slotIndex: slot.index,
        stack: slot.stack,
        x,
        y: y - 25,
        targetCell: null,
        isValidTarget: false
      };
      soundEngine.playPop();
      break;
    }
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (!draggedItem) return;
  const { x, y } = getPointerPos(e);

  draggedItem.x = x;
  draggedItem.y = y - 30; // Slight finger offset

  // Check hover over board cells
  const closestCell = board.getClosestCell(draggedItem.x, draggedItem.y, 46);

  if (closestCell) {
    draggedItem.targetCell = closestCell;
    draggedItem.isValidTarget = !closestCell.isLocked && closestCell.stack.length === 0;
  } else {
    draggedItem.targetCell = null;
    draggedItem.isValidTarget = false;
  }
});

window.addEventListener('pointerup', () => {
  if (!draggedItem) return;

  const { slotIndex, stack, targetCell, isValidTarget } = draggedItem;

  if (targetCell && isValidTarget) {
    // Successfully placed on empty board cell!
    targetCell.stack = [...stack];
    targetCell.bounce = 1.0;
    handSlots[slotIndex].stack = null;

    soundEngine.playPop();
    particles.spawnNeonBurst(targetCell.x, targetCell.y, '#00f0ff', 14, 140);

    draggedItem = null;
    gameState = 'RESOLVING';
    startMergeSequence(targetCell);
  } else {
    // Snap back to hand
    draggedItem = null;
    soundEngine.playPop();
  }
});

// Main 60 FPS Game Loop
let lastTime = performance.now();

function gameLoop(currentTime: number): void {
  const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  if (!isPaused) {
    // 1. Update Subsystems
    particles.update(dt);
    cameraShake.update(dt);
    board.update(dt);

    // 2. Update Active Jumping Tile Animations
    for (let i = activeJumps.length - 1; i >= 0; i--) {
      const jump = activeJumps[i];
      jump.elapsed += dt;

      if (jump.elapsed >= jump.duration) {
        activeJumps.splice(i, 1);
        handleJumpArrival(jump);
      }
    }
  }

  // 3. Render Canvas
  ctx.save();
  ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Apply Camera Shake
  cameraShake.apply(ctx);

  // Background
  renderer.renderBackground(currentTime / 1000);

  // Board Sockets
  const hoveredCell = draggedItem ? draggedItem.targetCell : null;
  const isTargetValid = draggedItem ? draggedItem.isValidTarget : false;

  for (const cell of board.cells) {
    const isHovered = hoveredCell === cell;
    renderer.renderCellBase(cell, isHovered, isTargetValid, currentTime / 1000);
  }

  // Board Stacks (in Y-sorted order)
  for (const cell of board.cells) {
    if (cell.stack.length > 0) {
      renderer.renderStack(cell.x, cell.y, cell.stack, cell.bounce, HEX_SIZE);
    }
  }

  // Hand Tray & Pedestals
  const activeDragSlot = draggedItem ? draggedItem.slotIndex : null;
  renderer.renderHandTrays(handSlots, activeDragSlot, currentTime / 1000);

  // Jumping Tiles (flying above stacks)
  for (const jump of activeJumps) {
    renderer.renderJumpingTile(jump);
  }

  // Dragged Stack (follows pointer above everything)
  if (draggedItem) {
    renderer.renderDraggedItem(draggedItem, currentTime / 1000);
  }

  // Hammer Mode Visual Reticles
  if (gameState === 'HAMMER_MODE') {
    renderer.renderHammerReticle(board.cells, currentTime / 1000);
  }

  // Particles & Floating Text Overlays
  particles.render(ctx);

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

// Initial Game Boot
generateHand(false);
updateHUD();
requestAnimationFrame(gameLoop);
