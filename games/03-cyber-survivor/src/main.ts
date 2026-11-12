import {
  adManager,
  soundEngine,
  StorageManager,
  ParticleSystem,
  ScreenShake
} from '@arcade/shared';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const storage = StorageManager.forGame('03-cyber-survivor');
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

  soundEngine.playLaser();
  particles.spawnNeonBurst(x, y, '#00ff88', 25, 300);
  particles.spawnFloatingText(x, y, 'LEVEL UP!', '#00ffaa', 24);
  cameraShake.shake(5, 0.2);
  storage.setHighScore(storage.getHighScore() + 100);
});

let lastTime = performance.now();

function gameLoop(time: number) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  particles.update(dt);
  cameraShake.update(dt);

  const scale = canvas.width / VIRTUAL_WIDTH;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);

  cameraShake.apply(ctx);

  ctx.fillStyle = '#00ff88';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 10;
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CYBER SURVIVOR', VIRTUAL_WIDTH / 2, 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText('Tap to fire laser & trigger level up text', VIRTUAL_WIDTH / 2, 120);

  particles.render(ctx);

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

adManager.setGameHooks(
  () => soundEngine.setMuted(true),
  () => soundEngine.setMuted(false)
);
