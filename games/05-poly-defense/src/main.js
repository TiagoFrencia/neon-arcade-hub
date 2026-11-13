import { adManager, ParticleSystem, ScreenShake, soundEngine, StorageManager } from '@arcade/shared';
import { BASE_MAX_HP, SLOT_SIZE, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './constants';
import { PolyDefenseGame } from './game';
import { PolyRenderer } from './renderer';
// DOM Elements
const wrapper = document.getElementById('game-wrapper');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hudWave = document.getElementById('hud-wave');
const hudBaseHp = document.getElementById('hud-base-hp');
const hudGold = document.getElementById('hud-gold');
const hudScore = document.getElementById('hud-score');
const btnSound = document.getElementById('btn-sound');
const boostBanner = document.getElementById('boost-banner');
const boostWavesCount = document.getElementById('boost-waves-count');
const btnAdAirdrop = document.getElementById('btn-ad-airdrop');
const btnAdBoost = document.getElementById('btn-ad-boost');
const btnSpawnTurret = document.getElementById('btn-spawn-turret');
const spawnCostText = document.getElementById('spawn-cost-text');
const modalDefeat = document.getElementById('modal-defeat');
const defeatWave = document.getElementById('defeat-wave');
const defeatKills = document.getElementById('defeat-kills');
const defeatScore = document.getElementById('defeat-score');
const btnReviveRepair = document.getElementById('btn-revive-repair');
const btnDefeatRestart = document.getElementById('btn-defeat-restart');
// Initialize Canvas Buffer Resolution
canvas.width = VIRTUAL_WIDTH;
canvas.height = VIRTUAL_HEIGHT;
// Storage & Audio
const storage = StorageManager.forGame('05-poly-defense');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
const renderer = new PolyRenderer(ctx);
let isPaused = false;
let draggedSlotIndex = null;
let dragPointerPos = null;
let hoverSlotIndex = null;
let selectedSlotIndex = null;
// Initialize Sound Mute State
const initialMuted = storage.getItem('is_muted', false);
soundEngine.setMuted(initialMuted);
btnSound.textContent = initialMuted ? '🔇' : '🔊';
btnSound.addEventListener('click', (e) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    storage.setItem('is_muted', muted);
    btnSound.textContent = muted ? '🔇' : '🔊';
});
// Setup AdManager hooks
adManager.setGameHooks(() => {
    isPaused = true;
    soundEngine.setMuted(true);
}, () => {
    isPaused = false;
    soundEngine.setMuted(storage.getItem('is_muted', false));
});
// Instantiate Game Engine
const game = new PolyDefenseGame({
    onSoundLaser: () => soundEngine.playLaser(),
    onSoundExplosion: () => soundEngine.playExplosion(),
    onSoundPop: () => soundEngine.playPop(),
    onSoundCrunch: () => soundEngine.playCrunch(),
    onSoundMerge: (pitch) => soundEngine.playMerge(pitch),
    onSoundLevelUp: () => soundEngine.playLevelUp(),
    onSoundGameOver: () => soundEngine.playGameOver(),
    onSoundClick: () => soundEngine.playClick(),
    onSpawnParticles: (x, y, color, count, speed) => {
        particles.spawnNeonBurst(x, y, color, count ?? 24, speed ?? 220);
    },
    onFloatingText: (x, y, text, color, size) => {
        particles.spawnFloatingText(x, y, text, color ?? '#00f0ff', size ?? 16);
    },
    onCameraShake: (intensity, duration) => {
        cameraShake.shake(intensity, duration ?? 0.25);
    }
});
// Resize handler for responsive aspect ratio
function handleResize() {
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    const scale = Math.min(windowW / VIRTUAL_WIDTH, windowH / VIRTUAL_HEIGHT);
    wrapper.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', handleResize);
handleResize();
// Convert pointer event coordinates to virtual 480x800 coordinate space
function getVirtualCoords(e) {
    const rect = wrapper.getBoundingClientRect();
    const scale = rect.width / VIRTUAL_WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    return { x, y };
}
// Find grid slot at coordinates
function getSlotAt(x, y) {
    for (const slot of game.slots) {
        const half = SLOT_SIZE / 2;
        if (x >= slot.x - half &&
            x <= slot.x + half &&
            y >= slot.y - half &&
            y <= slot.y + half) {
            return slot.index;
        }
    }
    return null;
}
// Drag & Drop Pointer Events
canvas.addEventListener('pointerdown', (e) => {
    if (isPaused || game.baseHp <= 0)
        return;
    const { x, y } = getVirtualCoords(e);
    const slotIdx = getSlotAt(x, y);
    if (slotIdx !== null && game.slots[slotIdx].turret) {
        draggedSlotIndex = slotIdx;
        selectedSlotIndex = slotIdx;
        dragPointerPos = { x, y };
        soundEngine.playClick();
        canvas.setPointerCapture(e.pointerId);
    }
    else {
        selectedSlotIndex = slotIdx;
    }
});
canvas.addEventListener('pointermove', (e) => {
    if (draggedSlotIndex === null)
        return;
    const { x, y } = getVirtualCoords(e);
    dragPointerPos = { x, y };
    hoverSlotIndex = getSlotAt(x, y);
});
canvas.addEventListener('pointerup', (e) => {
    if (draggedSlotIndex === null)
        return;
    const { x, y } = getVirtualCoords(e);
    const targetSlotIdx = getSlotAt(x, y);
    if (targetSlotIdx !== null && targetSlotIdx !== draggedSlotIndex) {
        game.handleTurretDrop(draggedSlotIndex, targetSlotIdx);
    }
    draggedSlotIndex = null;
    dragPointerPos = null;
    hoverSlotIndex = null;
    try {
        canvas.releasePointerCapture(e.pointerId);
    }
    catch {
        // Ignore if not captured
    }
    updateHUD();
});
canvas.addEventListener('pointercancel', () => {
    draggedSlotIndex = null;
    dragPointerPos = null;
    hoverSlotIndex = null;
});
// Spawn Turret Action
btnSpawnTurret.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPaused || game.baseHp <= 0)
        return;
    game.spawnTurretWithGold();
    updateHUD();
});
// Rewarded Ad 1: AirDrop Crate
btnAdAirdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPaused)
        return;
    adManager.showRewarded(() => {
        game.triggerAirDropReward();
        updateHUD();
    });
});
// Rewarded Ad 2: 2X Speed & Double Gold
btnAdBoost.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPaused)
        return;
    adManager.showRewarded(() => {
        game.triggerDoubleBoostReward();
        updateHUD();
    });
});
// Rewarded Ad 3: Repair Base + Freeze Enemies (Revive Modal)
btnReviveRepair.addEventListener('click', (e) => {
    e.stopPropagation();
    adManager.showRewarded(() => {
        game.triggerRepairAndFreezeReward();
        modalDefeat.style.display = 'none';
        isPaused = false;
        updateHUD();
    });
});
// Restart Run Button
btnDefeatRestart.addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.reload();
});
// Update DOM HUD Displays
function updateHUD() {
    hudWave.textContent = `${game.currentWave}`;
    hudBaseHp.textContent = `${Math.max(0, game.baseHp)}/${BASE_MAX_HP}`;
    hudGold.textContent = `${game.gold}`;
    hudScore.textContent = `${game.score}`;
    // Spawn button cost and affordability styling
    spawnCostText.textContent = `(Cost: ${game.spawnCost} Gold)`;
    if (game.gold < game.spawnCost || game.getEmptySlots().length === 0) {
        btnSpawnTurret.classList.add('cant-afford');
    }
    else {
        btnSpawnTurret.classList.remove('cant-afford');
    }
    // Boost Banner state
    if (game.doubleBoostWavesLeft > 0) {
        boostBanner.style.display = 'flex';
        boostWavesCount.textContent = `${game.doubleBoostWavesLeft} ${game.doubleBoostWavesLeft === 1 ? 'WAVE' : 'WAVES'} LEFT`;
    }
    else {
        boostBanner.style.display = 'none';
    }
}
// Game Over Handler
function handleGameOver() {
    isPaused = true;
    modalDefeat.style.display = 'flex';
    defeatWave.textContent = `${game.currentWave}`;
    defeatKills.textContent = `${game.totalKills}`;
    defeatScore.textContent = `${game.score}`;
    storage.setHighScore(game.score, 'score');
    storage.setHighScore(game.currentWave, 'max_wave');
}
// Animation & Render Loop
let lastTime = performance.now();
function gameLoop(time) {
    const dt = Math.min(0.08, (time - lastTime) / 1000);
    lastTime = time;
    particles.update(dt);
    cameraShake.update(dt);
    // Update Game Logic if active
    if (!isPaused && game.baseHp > 0) {
        game.update(dt);
        updateHUD();
        if (game.baseHp <= 0) {
            handleGameOver();
        }
    }
    // Render Scene
    ctx.save();
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    cameraShake.apply(ctx);
    renderer.render(dt, game.slots, game.enemies, game.projectiles, game.baseHp, draggedSlotIndex, dragPointerPos, hoverSlotIndex, selectedSlotIndex, game.isFreezeActive);
    particles.render(ctx);
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
updateHUD();
