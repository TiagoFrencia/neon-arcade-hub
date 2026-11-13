import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASES_DIR = path.resolve(ROOT_DIR, 'releases');
const TMP_QA_DIR = path.resolve(ROOT_DIR, 'tmp-qa');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8895;

const GAMES_CONFIG = [
  {
    id: '01-neon-suika',
    title: 'NEON SUIKA',
    subtitle: 'CYBERPUNK PHYSICS MERGE',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    accentColor: '#39ff14',
    badge: 'WATERMELON DROP',
    category: 'Physics Puzzle / Merge',
    artSvg: `
      <g filter="url(#glow)">
        <circle cx="960" cy="540" r="180" fill="none" stroke="#39ff14" stroke-width="12" opacity="0.9" />
        <circle cx="960" cy="540" r="160" fill="rgba(57, 255, 20, 0.08)" />
        <circle cx="960" cy="540" r="110" fill="none" stroke="#ff007f" stroke-width="8" stroke-dasharray="14 10" />
        <circle cx="960" cy="540" r="70" fill="rgba(255, 0, 127, 0.25)" stroke="#00f0ff" stroke-width="6" />
        <!-- Floating orbs -->
        <circle cx="720" cy="420" r="65" fill="rgba(0, 240, 255, 0.15)" stroke="#00f0ff" stroke-width="6" />
        <circle cx="1200" cy="440" r="85" fill="rgba(255, 230, 0, 0.15)" stroke="#ffe600" stroke-width="7" />
        <circle cx="830" cy="740" r="50" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="5" />
        <circle cx="1090" cy="720" r="60" fill="rgba(255, 102, 0, 0.2)" stroke="#ff6600" stroke-width="6" />
      </g>
    `,
    playAction: async (page) => {
      // Simulate multiple drops at various X positions to trigger merges
      for (let i = 0; i < 7; i++) {
        const x = 500 + (i % 5) * 60;
        await page.mouse.move(x, 150);
        await page.mouse.down();
        await page.mouse.up();
        await new Promise((r) => setTimeout(r, 450));
      }
    }
  },
  {
    id: '02-hydraulic-crusher',
    title: 'HYDRAULIC CRUSHER',
    subtitle: 'CYBER VOXEL DESTRUCTION',
    primaryColor: '#ff6600',
    secondaryColor: '#ffea00',
    accentColor: '#00f0ff',
    badge: 'VOXEL SHREDDER SIM',
    category: 'Idle / Simulation / ASMR',
    artSvg: `
      <g filter="url(#glow)">
        <!-- Left Crusher Gear -->
        <circle cx="800" cy="540" r="140" fill="none" stroke="#ff6600" stroke-width="14" stroke-dasharray="24 16" />
        <circle cx="800" cy="540" r="70" fill="rgba(255, 102, 0, 0.2)" stroke="#ffea00" stroke-width="8" />
        <!-- Right Crusher Gear -->
        <circle cx="1120" cy="540" r="140" fill="none" stroke="#ff6600" stroke-width="14" stroke-dasharray="24 16" />
        <circle cx="1120" cy="540" r="70" fill="rgba(255, 102, 0, 0.2)" stroke="#ffea00" stroke-width="8" />
        <!-- Hydraulic Piston -->
        <rect x="910" y="220" width="100" height="200" rx="8" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="6" />
        <!-- Molten sparks -->
        <circle cx="960" cy="520" r="15" fill="#ffea00" />
        <circle cx="930" cy="560" r="10" fill="#ff4500" />
        <circle cx="990" cy="550" r="12" fill="#ffe600" />
      </g>
    `,
    playAction: async (page) => {
      // Tap on the crusher teeth to trigger hydraulic slams and crunch sparks
      for (let i = 0; i < 8; i++) {
        await page.mouse.click(640 + (i % 3) * 20, 380 + (i % 2) * 30);
        await new Promise((r) => setTimeout(r, 250));
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  },
  {
    id: '03-cyber-survivor',
    title: 'CYBER SURVIVOR',
    subtitle: 'ACTION ROGUELIKE BULLET-HEAVEN',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    accentColor: '#9d4edd',
    badge: '360° AUTO-SHOOTER',
    category: 'Action / Roguelike / Survival',
    artSvg: `
      <g filter="url(#glow)">
        <!-- Player Shield & Core -->
        <circle cx="960" cy="540" r="90" fill="none" stroke="#00f0ff" stroke-width="8" stroke-dasharray="16 10" />
        <circle cx="960" cy="540" r="40" fill="rgba(0, 240, 255, 0.3)" stroke="#ffffff" stroke-width="6" />
        <!-- Orbiting Shields -->
        <circle cx="850" cy="480" r="18" fill="#00f0ff" />
        <circle cx="1070" cy="600" r="18" fill="#00f0ff" />
        <!-- Nova Beams -->
        <line x1="960" y1="540" x2="680" y2="300" stroke="#ff007f" stroke-width="6" />
        <line x1="960" y1="540" x2="1240" y2="340" stroke="#ff007f" stroke-width="6" />
        <line x1="960" y1="540" x2="1180" y2="760" stroke="#ffea00" stroke-width="5" />
        <line x1="960" y1="540" x2="720" y2="720" stroke="#ff007f" stroke-width="6" />
        <!-- Swarming Enemies -->
        <polygon points="680,300 660,330 700,330" fill="#ef4444" stroke="#ff007f" stroke-width="3" />
        <polygon points="1240,340 1220,370 1260,370" fill="#ef4444" stroke="#ff007f" stroke-width="3" />
      </g>
    `,
    playAction: async (page) => {
      // Simulate survivor movements and let auto-aim weapons fire
      await page.keyboard.down('KeyD');
      await new Promise((r) => setTimeout(r, 600));
      await page.keyboard.up('KeyD');
      await page.keyboard.down('KeyS');
      await new Promise((r) => setTimeout(r, 600));
      await page.keyboard.up('KeyS');
      await page.keyboard.down('KeyA');
      await new Promise((r) => setTimeout(r, 500));
      await page.keyboard.up('KeyA');
      await new Promise((r) => setTimeout(r, 800));
    }
  },
  {
    id: '04-hexa-sort',
    title: 'HEXA SORT',
    subtitle: '3D ISOMETRIC HEX PUZZLE',
    primaryColor: '#a855f7',
    secondaryColor: '#00f0ff',
    accentColor: '#ffea00',
    badge: 'CASCADE COLOR SORT',
    category: 'Puzzle / Logic / Casual',
    artSvg: `
      <g filter="url(#glow)">
        <!-- Central 3D Hexagon Stack -->
        <polygon points="960,400 1080,470 1080,610 960,680 840,610 840,470" fill="rgba(168, 85, 247, 0.25)" stroke="#a855f7" stroke-width="10" />
        <polygon points="960,380 1060,440 1060,560 960,620 860,560 860,440" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" stroke-width="8" />
        <polygon points="960,360 1040,410 1040,510 960,560 880,510 880,410" fill="rgba(255, 234, 0, 0.25)" stroke="#ffea00" stroke-width="6" />
        <!-- Floating adjacent hex tiles -->
        <polygon points="760,320 840,365 840,455 760,500 680,455 680,365" fill="rgba(0, 240, 255, 0.15)" stroke="#00f0ff" stroke-width="6" />
        <polygon points="1160,320 1240,365 1240,455 1160,500 1080,455 1080,365" fill="rgba(255, 0, 127, 0.15)" stroke="#ff007f" stroke-width="6" />
        <!-- Arc Trails -->
        <path d="M 760,360 Q 860,260 960,360" fill="none" stroke="#ffea00" stroke-width="5" stroke-dasharray="10 8" />
      </g>
    `,
    playAction: async (page) => {
      // Pick stack from hand and drop on board cell
      // Hand slots are at bottom
      await page.mouse.move(560, 680);
      await page.mouse.down();
      await page.mouse.move(640, 420, { steps: 5 });
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 600));

      await page.mouse.move(640, 680);
      await page.mouse.down();
      await page.mouse.move(640, 420, { steps: 5 });
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 800));
    }
  },
  {
    id: '05-poly-defense',
    title: 'POLY DEFENSE',
    subtitle: 'MERGE & GEOMETRIC TOWER DEFENSE',
    primaryColor: '#00f0ff',
    secondaryColor: '#ef4444',
    accentColor: '#ffea00',
    badge: 'WAVE TACTICAL MERGE',
    category: 'Strategy / Tower Defense / Merge',
    artSvg: `
      <g filter="url(#glow)">
        <!-- Core Nexus Base -->
        <circle cx="960" cy="540" r="80" fill="rgba(0, 240, 255, 0.25)" stroke="#00f0ff" stroke-width="8" />
        <polygon points="960,490 1000,560 920,560" fill="none" stroke="#ffea00" stroke-width="6" />
        <!-- Turrets with Laser Beams -->
        <rect x="760" y="440" width="60" height="60" rx="10" fill="rgba(57, 255, 20, 0.2)" stroke="#39ff14" stroke-width="6" />
        <line x1="820" y1="470" x2="1160" y2="340" stroke="#39ff14" stroke-width="6" />
        <rect x="1100" y="600" width="60" height="60" rx="10" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" stroke-width="6" />
        <line x1="1100" y1="630" x2="780" y2="680" stroke="#a855f7" stroke-width="5" />
        <!-- Incoming Polygon Enemies -->
        <polygon points="1160,340 1200,340 1220,380 1190,410 1150,400 1140,360" fill="#ef4444" stroke="#ff0055" stroke-width="5" />
        <polygon points="780,680 810,680 820,710 790,730 760,710" fill="#ef4444" stroke="#ff0055" stroke-width="5" />
      </g>
    `,
    playAction: async (page) => {
      // Tap spawn turret button
      for (let i = 0; i < 4; i++) {
        await page.mouse.click(640, 560);
        await new Promise((r) => setTimeout(r, 400));
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
];

function generateBannerHtml(game, width, height, isCoverItch = false) {
  const isSquare = width === height;
  const isItch = isCoverItch || (width === 630 && height === 500);

  const titleSize = isSquare ? '52px' : isItch ? '46px' : '76px';
  const subSize = isSquare ? '18px' : isItch ? '16px' : '24px';
  const badgeSize = isSquare ? '14px' : isItch ? '12px' : '16px';
  const tagSize = isSquare ? '12px' : isItch ? '11px' : '14px';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: #06070e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      user-select: none;
    }
    .wrapper {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 45%, #15192d 0%, #080a14 70%, #030408 100%);
      overflow: hidden;
    }
    /* Perspective Wireframe Grid */
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(0, 240, 255, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 240, 255, 0.07) 1px, transparent 1px);
      background-size: ${isSquare ? '40px 40px' : '60px 60px'};
      background-position: center center;
      transform: perspective(600px) rotateX(25deg) scale(1.4);
      transform-origin: center bottom;
      pointer-events: none;
    }
    /* Central Vignette Glow */
    .vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, transparent 35%, rgba(3, 4, 8, 0.88) 100%);
      pointer-events: none;
    }
    /* Vector Artwork Backdrop */
    .art-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.9;
    }
    /* Content Container */
    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: ${isSquare ? '30px' : isItch ? '20px' : '40px'};
      max-width: 92%;
    }
    .badge-top {
      font-size: ${badgeSize};
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: ${game.accentColor};
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid ${game.accentColor};
      box-shadow: 0 0 16px ${game.accentColor}66;
      padding: 6px 18px;
      border-radius: 999px;
      margin-bottom: ${isSquare ? '16px' : isItch ? '12px' : '22px'};
    }
    .title {
      font-size: ${titleSize};
      font-weight: 900;
      letter-spacing: 5px;
      color: #ffffff;
      text-transform: uppercase;
      line-height: 1.05;
      text-shadow:
        0 0 10px ${game.primaryColor},
        0 0 25px ${game.primaryColor},
        0 0 60px ${game.primaryColor}aa,
        0 4px 15px rgba(0, 0, 0, 0.9);
      margin-bottom: ${isSquare ? '14px' : isItch ? '10px' : '18px'};
    }
    .subtitle {
      font-size: ${subSize};
      font-weight: 700;
      letter-spacing: 4px;
      color: ${game.secondaryColor};
      text-shadow: 0 0 14px ${game.secondaryColor}bb;
      text-transform: uppercase;
      margin-bottom: ${isSquare ? '22px' : isItch ? '16px' : '28px'};
    }
    .tags-container {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .tag {
      font-size: ${tagSize};
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      padding: 5px 14px;
      border-radius: 6px;
    }
    .play-btn {
      margin-top: ${isSquare ? '20px' : isItch ? '16px' : '28px'};
      font-size: ${isSquare ? '15px' : isItch ? '13px' : '18px'};
      font-weight: 900;
      letter-spacing: 2px;
      color: #05060b;
      background: linear-gradient(135deg, ${game.primaryColor}, ${game.secondaryColor});
      padding: ${isSquare ? '10px 28px' : isItch ? '8px 24px' : '14px 42px'};
      border-radius: 999px;
      box-shadow: 0 0 28px ${game.primaryColor}88;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="grid"></div>
    <svg class="art-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      ${game.artSvg}
    </svg>
    <div class="vignette"></div>

    <div class="content">
      <div class="badge-top">★ ${game.badge} ★</div>
      <h1 class="title">${game.title}</h1>
      <div class="subtitle">${game.subtitle}</div>
      <div class="tags-container">
        <span class="tag">HTML5 WEB</span>
        <span class="tag">60 FPS</span>
        <span class="tag">${game.category}</span>
        ${!isItch ? '<span class="tag">COMMERCIAL ARCADE</span>' : ''}
      </div>
      <div class="play-btn">PLAY FREE NOW ▶</div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  console.log('\n======================================================');
  console.log('🎨 OFFICIAL MARKETING ASSET & SCREENSHOT GENERATOR');
  console.log('======================================================\n');

  // Start local server to serve game dists for live gameplay screenshots
  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://localhost:${PORT}`);
    if (parsedUrl.pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }
    let filePath = path.join(TMP_QA_DIR, parsedUrl.pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('404');
    }
  });

  await new Promise((r) => server.listen(PORT, r));

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const game of GAMES_CONFIG) {
      console.log(`\n------------------------------------------------------`);
      console.log(`📦 Generating Official Assets for: \x1b[36m${game.id}\x1b[0m`);
      console.log(`------------------------------------------------------`);

      const assetsDir = path.resolve(RELEASES_DIR, `${game.id}-assets`);
      fs.mkdirSync(assetsDir, { recursive: true });

      // 1. Generate thumbnail-16x9.png (1920x1080)
      console.log('  ▸ Rendering thumbnail-16x9.png (1920x1080)...');
      const page16x9 = await browser.newPage();
      await page16x9.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      const html16x9 = generateBannerHtml(game, 1920, 1080);
      await page16x9.setContent(html16x9, { waitUntil: 'load' });
      const path16x9 = path.resolve(assetsDir, 'thumbnail-16x9.png');
      await page16x9.screenshot({ path: path16x9, type: 'png' });
      await page16x9.close();
      console.log(`    ✔ Saved: releases/${game.id}-assets/thumbnail-16x9.png`);

      // 2. Generate thumbnail-1x1.png (800x800)
      console.log('  ▸ Rendering thumbnail-1x1.png (800x800)...');
      const page1x1 = await browser.newPage();
      await page1x1.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
      const html1x1 = generateBannerHtml(game, 800, 800);
      await page1x1.setContent(html1x1, { waitUntil: 'load' });
      const path1x1 = path.resolve(assetsDir, 'thumbnail-1x1.png');
      await page1x1.screenshot({ path: path1x1, type: 'png' });
      await page1x1.close();
      console.log(`    ✔ Saved: releases/${game.id}-assets/thumbnail-1x1.png`);

      // 3. Generate cover-itch.png (630x500)
      console.log('  ▸ Rendering cover-itch.png (630x500)...');
      const pageItch = await browser.newPage();
      await pageItch.setViewport({ width: 630, height: 500, deviceScaleFactor: 1 });
      const htmlItch = generateBannerHtml(game, 630, 500, true);
      await pageItch.setContent(htmlItch, { waitUntil: 'load' });
      const pathItch = path.resolve(assetsDir, 'cover-itch.png');
      await pageItch.screenshot({ path: pathItch, type: 'png' });
      await pageItch.close();
      console.log(`    ✔ Saved: releases/${game.id}-assets/cover-itch.png`);

      // 4. Capture Live Gameplay Action Screenshots (1280x720)
      console.log('  ▸ Capturing real running gameplay screenshots (1280x720)...');
      const gamePage = await browser.newPage();
      await gamePage.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
      await gamePage.goto(`http://localhost:${PORT}/${game.id}/index.html`, {
        waitUntil: 'networkidle0'
      });

      // Let game boot & trigger early action
      await new Promise((r) => setTimeout(r, 1200));

      // Trigger gameplay actions (drops, taps, inputs)
      if (game.playAction) {
        await game.playAction(gamePage);
      }

      // Screenshot 1: Active Gameplay
      const pathShot1 = path.resolve(assetsDir, 'screenshot-1-gameplay.png');
      await gamePage.screenshot({ path: pathShot1, type: 'png' });
      console.log(`    ✔ Saved: releases/${game.id}-assets/screenshot-1-gameplay.png`);

      // Trigger further high action (more pieces, intense burst)
      if (game.playAction) {
        await game.playAction(gamePage);
      }
      await new Promise((r) => setTimeout(r, 800));

      // Screenshot 2: Full Action Scene
      const pathShot2 = path.resolve(assetsDir, 'screenshot-2-action.png');
      await gamePage.screenshot({ path: pathShot2, type: 'png' });
      console.log(`    ✔ Saved: releases/${game.id}-assets/screenshot-2-action.png`);

      await gamePage.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n======================================================');
  console.log('🌟 ALL 5 MARKETING ASSET PACKS GENERATED SUCCESSFULLY!');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\nFatal Asset Generator Error:', err);
  process.exit(1);
});
