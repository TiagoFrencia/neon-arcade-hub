import {
  adManager,
  soundEngine,
  StorageManager,
  ParticleSystem,
  ScreenShake
} from '@arcade/shared';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const storage = StorageManager.forGame('02-hydraulic-crusher');
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

  soundEngine.playCrunch();
  particles.spawnNeonBurst(x, y, '#ff5500', 30, 260);
  particles.spawnFloatingText(x, y, 'CRUSHED!', '#ffaa00', 22);
  cameraShake.shake(8, 0.3);
  storage.addCoins(25);
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

  ctx.fillStyle = '#ff5500';
  ctx.shadowColor = '#ff5500';
  ctx.shadowBlur = 10;
  ctx.font = '900 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HYDRAULIC CRUSHER', VIRTUAL_WIDTH / 2, 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#888';
  ctx.font = '14px sans-serif';
  ctx.fillText('Tap to trigger crush sound & particle burst', VIRTUAL_WIDTH / 2, 120);

  particles.render(ctx);

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

adManager.setGameHooks(
  () => soundEngine.setMuted(true),
  () => soundEngine.setMuted(false)
);
