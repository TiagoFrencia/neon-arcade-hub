import { adManager, soundEngine, StorageManager, ParticleSystem, ScreenShake } from '@arcade/shared';
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const storage = StorageManager.forGame('01-neon-suika');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
// Setup dimensions
const VIRTUAL_WIDTH = 480;
const VIRTUAL_HEIGHT = 800;
function resize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scale = Math.min(windowWidth / VIRTUAL_WIDTH, windowHeight / VIRTUAL_HEIGHT);
    canvas.width = Math.floor(VIRTUAL_WIDTH * scale);
    canvas.height = Math.floor(VIRTUAL_HEIGHT * scale);
}
window.addEventListener('resize', resize);
resize();
// Example interaction to test modules
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / VIRTUAL_WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    soundEngine.playMerge(1.2);
    particles.spawnNeonBurst(x, y, '#00f0ff', 20);
    particles.spawnFloatingText(x, y, '+100', '#00f0ff', 24);
    cameraShake.shake(4, 0.2);
    storage.addCoins(10);
});
let lastTime = performance.now();
function gameLoop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    particles.update(dt);
    cameraShake.update(dt);
    const scale = canvas.width / VIRTUAL_WIDTH;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    cameraShake.apply(ctx);
    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < VIRTUAL_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, VIRTUAL_HEIGHT);
        ctx.stroke();
    }
    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEON SUIKA', VIRTUAL_WIDTH / 2, 80);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#888';
    ctx.font = '14px sans-serif';
    ctx.fillText('Tap to trigger merge sound & particles', VIRTUAL_WIDTH / 2, 120);
    // Render particles
    particles.render(ctx);
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
// Setup AdManager hooks
adManager.setGameHooks(() => soundEngine.setMuted(true), () => soundEngine.setMuted(false));
