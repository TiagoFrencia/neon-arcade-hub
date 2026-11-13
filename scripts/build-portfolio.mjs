import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORTFOLIO_DIR = path.resolve(ROOT_DIR, 'portfolio-dist');
const RELEASES_DIR = path.resolve(ROOT_DIR, 'releases');

const GAMES = [
  {
    id: '01-neon-suika',
    title: 'Neon Suika',
    tagline: 'Cyberpunk Physics Merge Fruit Game',
    desc: 'Drop and merge glowing synthwave orbs into the legendary giant Neon Watermelon with real 2D rigid-body physics.',
    category: 'Physics Merge',
    accentColor: '#00f0ff',
    secondaryColor: '#ff007f',
    icon: '🍉',
    tags: ['Physics', 'Merge', 'Cyberpunk', '2D', 'Casual']
  },
  {
    id: '02-hydraulic-crusher',
    title: 'Hydraulic Crusher',
    tagline: 'Cyber Voxel Destruction & Idle Tycoon',
    desc: 'Heavy industrial hydraulic rollers pulverizing voxels into cash. Upgrade power, RPM speed, and intercept golden drones.',
    category: 'Idle Simulation',
    accentColor: '#ff6600',
    secondaryColor: '#ffea00',
    icon: '⚙️',
    tags: ['Idle', 'ASMR', 'Voxel', 'Simulation', 'Upgrades']
  },
  {
    id: '03-cyber-survivor',
    title: 'Cyber Survivor',
    tagline: 'Action Roguelike Bullet Heaven',
    desc: 'Survive relentless drone swarms in a 360° arena. Synergize plasma bolts, orbital shields, chain lightning, and laser beams.',
    category: 'Action Roguelike',
    accentColor: '#9d4edd',
    secondaryColor: '#00f0ff',
    icon: '⚡',
    tags: ['Roguelike', 'Bullet Hell', 'Survival', 'Arena', 'Fast-Paced']
  },
  {
    id: '04-hexa-sort',
    title: 'Hexa Sort',
    tagline: '3D Isometric Hex Puzzle & Cascade Merge',
    desc: 'Strategic color-sorting logic puzzle with cascading full-stack clearances and emergency hammer demolition boosters.',
    category: 'Isometric Puzzle',
    accentColor: '#a855f7',
    secondaryColor: '#ffea00',
    icon: '⬡',
    tags: ['Puzzle', 'Isometric', 'Sorting', 'Casual', 'Logic']
  },
  {
    id: '05-poly-defense',
    title: 'Poly Defense',
    tagline: 'Geometric Merge & Tower Defense',
    desc: 'Synthesize geometric combat turrets, fend off advancing polygon waves, and defend the quantum Core from boss shapes.',
    category: 'Merge Strategy',
    accentColor: '#39ff14',
    secondaryColor: '#ef4444',
    icon: '🛡️',
    tags: ['Tower Defense', 'Merge', 'Strategy', 'Geometry', 'Waves']
  }
];

function main() {
  console.log('\n======================================================');
  console.log('🕹️  BUILDING PORTFOLIO MASTER ARCADE (portfolio-dist)');
  console.log('======================================================\n');

  // 1. Prepare directory structure
  if (fs.existsSync(PORTFOLIO_DIR)) {
    fs.rmSync(PORTFOLIO_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PORTFOLIO_DIR, { recursive: true });

  const gamesDestDir = path.resolve(PORTFOLIO_DIR, 'games');
  const coversDestDir = path.resolve(PORTFOLIO_DIR, 'assets', 'covers');
  fs.mkdirSync(gamesDestDir, { recursive: true });
  fs.mkdirSync(coversDestDir, { recursive: true });

  // 2. Unpack each game into portfolio-dist/games/[game-id]/
  for (const game of GAMES) {
    const zipPath = path.resolve(RELEASES_DIR, `${game.id}-ready.zip`);
    const targetDir = path.resolve(gamesDestDir, game.id);
    fs.mkdirSync(targetDir, { recursive: true });
    execSync(`tar -xf "${zipPath}" -C "${targetDir}"`);
    console.log(`  ✔ Unpacked: portfolio-dist/games/${game.id}/`);

    // Copy thumbnail
    const thumbSrc = path.resolve(RELEASES_DIR, `${game.id}-assets`, 'thumbnail-16x9.png');
    if (fs.existsSync(thumbSrc)) {
      fs.copyFileSync(thumbSrc, path.resolve(coversDestDir, `${game.id}.png`));
      console.log(`  ✔ Copied cover: portfolio-dist/assets/covers/${game.id}.png`);
    }
  }

  // 3. Build portfolio-dist/index.html
  const gamesJson = JSON.stringify(GAMES);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CYBER ARCADE // Commercial HTML5 Web Game Suite</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🕹️</text></svg>">
  <style>
    :root {
      --bg-dark: #070913;
      --card-bg: #0f1322;
      --card-border: #1d253b;
      --neon-cyan: #00f0ff;
      --neon-pink: #ff007f;
      --neon-green: #39ff14;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 50% 0%, #171d36 0%, transparent 60%),
        linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
      background-size: 100% 100%, 40px 40px, 40px 40px;
    }
    header {
      padding: 40px 24px 20px;
      text-align: center;
      position: relative;
    }
    .badge-top {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--neon-cyan);
      background: rgba(0, 240, 255, 0.1);
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 6px 16px;
      border-radius: 999px;
      margin-bottom: 14px;
    }
    h1 {
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 0 20px rgba(0, 240, 255, 0.5);
      margin-bottom: 12px;
    }
    h1 span {
      background: linear-gradient(135deg, var(--neon-cyan), var(--neon-pink));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      font-size: clamp(14px, 2vw, 17px);
      color: var(--text-muted);
      max-width: 640px;
      margin: 0 auto 30px;
      line-height: 1.6;
    }
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .stat-pill {
      font-size: 13px;
      font-weight: 700;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      padding: 8px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .stat-pill b {
      color: var(--neon-green);
    }
    main {
      flex: 1;
      max-width: 1300px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 24px 60px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 28px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      position: relative;
    }
    .card:hover {
      transform: translateY(-6px);
      border-color: rgba(0, 240, 255, 0.5);
      box-shadow: 0 12px 30px rgba(0, 240, 255, 0.15);
    }
    .card-thumb-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      overflow: hidden;
    }
    .card-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }
    .card:hover .card-thumb {
      transform: scale(1.05);
    }
    .card-category-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      background: rgba(8, 10, 18, 0.85);
      backdrop-filter: blur(8px);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #fff;
    }
    .card-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .card-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-tagline {
      font-size: 13px;
      color: var(--neon-cyan);
      font-weight: 600;
      margin-bottom: 12px;
    }
    .card-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 18px;
      flex: 1;
    }
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 22px;
    }
    .tag {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
    }
    .card-actions {
      display: flex;
      gap: 10px;
    }
    .btn-play {
      flex: 1;
      background: linear-gradient(135deg, #00f0ff, #0077ff);
      color: #000;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 12px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: filter 0.2s, transform 0.15s;
    }
    .btn-play:hover {
      filter: brightness(1.15);
      transform: scale(1.02);
    }
    .btn-newtab {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      border: 1px solid var(--card-border);
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      text-decoration: none;
    }
    .btn-newtab:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    /* Modal Player Overlay */
    #player-modal {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(3, 4, 8, 0.94);
      backdrop-filter: blur(12px);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    #player-modal.active {
      display: flex;
    }
    .modal-header {
      width: 100%;
      max-width: 960px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .modal-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-modal-action {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-modal-action:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .btn-close {
      background: #ef4444;
      border: none;
    }
    .btn-close:hover {
      background: #dc2626;
    }
    .modal-frame-container {
      position: relative;
      background: #000;
      border: 2px solid #00f0ff;
      box-shadow: 0 0 35px rgba(0, 240, 255, 0.3);
      border-radius: 12px;
      overflow: hidden;
      transition: width 0.3s ease, height 0.3s ease;
    }
    #game-iframe {
      border: none;
      width: 100%;
      height: 100%;
      display: block;
    }
    footer {
      border-top: 1px solid var(--card-border);
      padding: 30px 24px;
      text-align: center;
      font-size: 13px;
      color: var(--text-muted);
    }
    footer a { color: var(--neon-cyan); text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <div class="badge-top">★ 100% Client-Side Web Arcade ★</div>
    <h1>NEON <span>ARCADE</span></h1>
    <p class="subtitle">Commercial HTML5 Games engineered for CrazyGames, Itch.io, and Mobile Portals. Zero heavy frameworks, real-time procedural Web Audio, and silky 60 FPS performance.</p>
    <div class="stats-bar">
      <div class="stat-pill">🕹️ <b>5 Verified Games</b></div>
      <div class="stat-pill">⚡ <b>60 FPS Canvas</b></div>
      <div class="stat-pill">🎵 <b>Procedural Audio</b></div>
      <div class="stat-pill">📱 <b>Desktop & Mobile</b></div>
      <div class="stat-pill">🛡️ <b>CrazyGames SDK v3 Ready</b></div>
    </div>
  </header>

  <main>
    <div class="grid" id="games-grid">
      <!-- Populated via script -->
    </div>
  </main>

  <!-- Interactive Modal Game Player -->
  <div id="player-modal">
    <div class="modal-header">
      <div class="modal-title" id="modal-game-title">Game Title</div>
      <div class="modal-controls">
        <button class="btn-modal-action" id="btn-toggle-view">📱 Switch Viewport</button>
        <button class="btn-modal-action" id="btn-fullscreen">⛶ Fullscreen</button>
        <button class="btn-modal-action btn-close" id="btn-modal-close">✕ Close</button>
      </div>
    </div>
    <div class="modal-frame-container" id="frame-container" style="width: 800px; height: 600px;">
      <iframe id="game-iframe" src="about:blank" allow="autoplay; fullscreen"></iframe>
    </div>
  </div>

  <footer>
    <p>Built with TypeScript, HTML5 Canvas 2D, Web Audio API, and Vite 6. Fully ready for deployment to Cloudflare Pages or GitHub Pages.</p>
  </footer>

  <script>
    const games = ${gamesJson};
    const grid = document.getElementById('games-grid');
    const modal = document.getElementById('player-modal');
    const modalTitle = document.getElementById('modal-game-title');
    const iframe = document.getElementById('game-iframe');
    const frameContainer = document.getElementById('frame-container');
    const btnClose = document.getElementById('btn-modal-close');
    const btnToggleView = document.getElementById('btn-toggle-view');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    let isMobileView = false;
    let currentGame = null;

    // Render cards
    games.forEach((game) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = \`
        <div class="card-thumb-wrap">
          <img class="card-thumb" src="./assets/covers/\${game.id}.png" alt="\${game.title}" loading="lazy" />
          <span class="card-category-badge">\${game.category}</span>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <h2 class="card-title"><span>\${game.icon}</span> \${game.title}</h2>
          </div>
          <div class="card-tagline">\${game.tagline}</div>
          <p class="card-desc">\${game.desc}</p>
          <div class="card-tags">
            \${game.tags.map(t => '<span class="tag">#' + t + '</span>').join('')}
          </div>
          <div class="card-actions">
            <button class="btn-play" onclick="openGame('\${game.id}')">▶ PLAY NOW</button>
            <a class="btn-newtab" href="./games/\${game.id}/index.html" target="_blank" title="Open standalone tab">↗</a>
          </div>
        </div>
      \`;
      grid.appendChild(card);
    });

    window.openGame = function(gameId) {
      currentGame = games.find(g => g.id === gameId);
      if (!currentGame) return;

      modalTitle.innerHTML = \`<span>\${currentGame.icon}</span> \${currentGame.title}\`;
      isMobileView = false;
      updateViewportDimensions();
      iframe.src = \`./games/\${gameId}/index.html\`;
      modal.classList.add('active');
    };

    function updateViewportDimensions() {
      if (isMobileView) {
        frameContainer.style.width = '390px';
        frameContainer.style.height = '800px';
        btnToggleView.textContent = '🖥️ Desktop View (800x600)';
      } else {
        frameContainer.style.width = '800px';
        frameContainer.style.height = '600px';
        btnToggleView.textContent = '📱 Mobile View (390x800)';
      }
    }

    btnToggleView.addEventListener('click', () => {
      isMobileView = !isMobileView;
      updateViewportDimensions();
    });

    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        frameContainer.requestFullscreen().catch(err => console.warn(err));
      } else {
        document.exitFullscreen();
      }
    });

    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
      iframe.src = 'about:blank';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        modal.classList.remove('active');
        iframe.src = 'about:blank';
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.resolve(PORTFOLIO_DIR, 'index.html'), html, 'utf8');
  console.log('  ✔ Created: portfolio-dist/index.html');
  console.log('\n🌟 PORTFOLIO MASTER ARCADE SUCCESSFULLY COMPILED AND PACKAGED!');
}

main();
