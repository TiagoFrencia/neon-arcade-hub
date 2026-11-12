import { adManager, soundEngine, StorageManager, ParticleSystem, ScreenShake } from '@arcade/shared';
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const storage = StorageManager.forGame('04-hexa-sort');
const particles = new ParticleSystem();
const cameraShake = new ScreenShake();
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
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / VIRTUAL_WIDTH;
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    soundEngine.playPop();
    particles.spawnNeonBurst(x, y, '#d400ff', 24, 240);
    particles.spawnFloatingText(x, y, 'SORTED!', '#ff80ff', 22);
    cameraShake.shake(3, 0.15);
    storage.addCoins(15);
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
    ctx.fillStyle = '#d400ff';
    ctx.shadowColor = '#d400ff';
    ctx.shadowBlur = 10;
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEXA SORT', VIRTUAL_WIDTH / 2, 80);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#888';
    ctx.font = '14px sans-serif';
    ctx.fillText('Tap to trigger hex sort sound & fx', VIRTUAL_WIDTH / 2, 120);
    particles.render(ctx);
    ctx.restore();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
adManager.setGameHooks(() => soundEngine.setMuted(true), () => soundEngine.setMuted(false));
