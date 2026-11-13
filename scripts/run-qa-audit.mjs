import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASES_DIR = path.resolve(ROOT_DIR, 'releases');
const TMP_QA_DIR = path.resolve(ROOT_DIR, 'tmp-qa');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8899;

const GAMES = [
  '01-neon-suika',
  '02-hydraulic-crusher',
  '03-cyber-survivor',
  '04-hexa-sort',
  '05-poly-defense'
];

// MIME types dictionary for static server
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function main() {
  console.log('\n======================================================');
  console.log('🔍 AUTOMATED PORTAL IFRAME QA AUDIT SYSTEM');
  console.log('======================================================\n');

  // 1. Prepare tmp-qa directory
  if (fs.existsSync(TMP_QA_DIR)) {
    fs.rmSync(TMP_QA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_QA_DIR, { recursive: true });

  // 2. Unzip all 5 releases into deep subfolders
  console.log('📦 Step 1: Extracting production releases into subfolders...');
  for (const game of GAMES) {
    const zipPath = path.resolve(RELEASES_DIR, `${game}-ready.zip`);
    if (!fs.existsSync(zipPath)) {
      throw new Error(`Missing release zip: ${zipPath}`);
    }
    const targetDir = path.resolve(TMP_QA_DIR, game);
    fs.mkdirSync(targetDir, { recursive: true });
    execSync(`tar -xf "${zipPath}" -C "${targetDir}"`);
    console.log(`  ✔ Extracted: tmp-qa/${game}/ (index.html + assets)`);
  }

  // 3. Create qa-iframe-test.html
  const qaHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portal Iframe QA Verification Suite</title>
  <style>
    body {
      background: #0b0d19;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 24px;
    }
    h1 {
      font-size: 20px;
      color: #00f0ff;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-badge {
      font-size: 11px;
      background: #10b981;
      color: #000;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }
    .viewports {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      margin-top: 20px;
    }
    .viewport-box {
      background: #131728;
      border: 1px solid #1f293d;
      border-radius: 8px;
      padding: 14px;
    }
    .viewport-header {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    iframe {
      border: 2px solid #334155;
      border-radius: 4px;
      background: #000;
      display: block;
    }
  </style>
</head>
<body>
  <h1>Portal Iframe Test Simulation <span class="status-badge">SANDBOX ACTIVE</span></h1>
  <div id="game-title" style="color: #f43f5e; font-weight: 600; margin-bottom: 15px;">Loading...</div>
  <div class="viewports">
    <div class="viewport-box">
      <div class="viewport-header">
        <span>Desktop Viewport (800x600)</span>
        <span>Standard Portal Iframe</span>
      </div>
      <iframe id="frame-desktop" width="800" height="600" src="about:blank"></iframe>
    </div>
    <div class="viewport-box">
      <div class="viewport-header">
        <span>Mobile Viewport (390x844)</span>
        <span>Responsive Ratio</span>
      </div>
      <iframe id="frame-mobile" width="390" height="844" src="about:blank"></iframe>
    </div>
  </div>

  <script>
    // Mock CrazyGames SDK v3 on window for iframe propagation
    window.CrazyGames = {
      SDK: {
        init: async () => true,
        ad: {
          requestAd: async (type, callbacks) => {
            callbacks?.beforeAd?.();
            callbacks?.adStarted?.();
            setTimeout(() => {
              callbacks?.adFinished?.();
              callbacks?.afterAd?.();
            }, 80);
          }
        },
        game: {
          gameplayStart: () => {
            window.__events = window.__events || [];
            window.__events.push('gameplayStart');
          },
          gameplayStop: () => {
            window.__events = window.__events || [];
            window.__events.push('gameplayStop');
          },
          happyTime: () => {
            window.__events = window.__events || [];
            window.__events.push('happyTime');
          }
        }
      }
    };
  </script>
</body>
</html>`;
  fs.writeFileSync(path.resolve(TMP_QA_DIR, 'qa-iframe-test.html'), qaHtmlContent, 'utf8');
  console.log('  ✔ Created: tmp-qa/qa-iframe-test.html');

  // 4. Start Local Static HTTP Server
  console.log(`\n🌐 Step 2: Starting local server on http://localhost:${PORT}...`);
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

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${parsedUrl.pathname}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`  ✔ HTTP server running at http://localhost:${PORT}`);

  // 5. Launch Puppeteer
  console.log(`\n🚀 Step 3: Launching Headless Chrome Browser (${CHROME_PATH})...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const auditResults = [];

  try {
    for (const game of GAMES) {
      console.log(`\n------------------------------------------------------`);
      console.log(`🎮 AUDITING GAME: \x1b[36m${game}\x1b[0m`);
      console.log(`------------------------------------------------------`);

      const errors404 = [];
      const consoleErrors = [];

      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 1000 });

      // Track failed requests (404s, etc.)
      page.on('response', (res) => {
        if (res.status() === 404 && !res.url().includes('favicon.ico')) {
          errors404.push(res.url());
        }
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Inject CrazyGames SDK mock into every new frame
      await page.evaluateOnNewDocument(() => {
        window.CrazyGames = {
          SDK: {
            init: async () => true,
            ad: {
              requestAd: async (type, callbacks) => {
                callbacks?.beforeAd?.();
                callbacks?.adStarted?.();
                setTimeout(() => {
                  callbacks?.adFinished?.();
                  callbacks?.afterAd?.();
                }, 80);
              }
            },
            game: {
              gameplayStart: () => {
                window.__cgEvents = window.__cgEvents || [];
                window.__cgEvents.push('gameplayStart');
              },
              gameplayStop: () => {
                window.__cgEvents = window.__cgEvents || [];
                window.__cgEvents.push('gameplayStop');
              },
              happyTime: () => {
                window.__cgEvents = window.__cgEvents || [];
                window.__cgEvents.push('happyTime');
              }
            }
          }
        };
      });

      // Navigate to QA test harness
      await page.goto(`http://localhost:${PORT}/qa-iframe-test.html`, { waitUntil: 'networkidle0' });

      // Load game into Desktop iframe (800x600)
      console.log('  ▸ Testing Desktop Iframe (800x600)...');
      await page.evaluate((g) => {
        document.getElementById('game-title').innerText = 'Auditing Game: ' + g;
        const frame = document.getElementById('frame-desktop');
        frame.src = `/${g}/index.html`;
      }, game);

      // Wait for iframe to load
      await new Promise((r) => setTimeout(r, 1200));

      const desktopFrameHandle = await page.$('#frame-desktop');
      const desktopFrame = await desktopFrameHandle.contentFrame();

      if (!desktopFrame) {
        throw new Error(`Could not access desktop iframe content for ${game}`);
      }

      // Check A: Paths & Canvas
      const hasCanvas = await desktopFrame.evaluate(() => {
        const c = document.querySelector('canvas');
        return !!c && c.width > 0 && c.height > 0;
      });

      // Inspect HTML file directly to guarantee NO absolute /assets/
      const indexHtmlPath = path.resolve(TMP_QA_DIR, game, 'index.html');
      const indexHtmlRaw = fs.readFileSync(indexHtmlPath, 'utf8');
      const hasBadAbsolutePaths = /(?:src|href)=["']\/(?!data:|http|https|#)[^"']+["']/i.test(indexHtmlRaw);

      // Check B: Overflow Hidden & No Scrollbars in body/html
      const desktopStyles = await desktopFrame.evaluate(() => {
        const bodyStyle = window.getComputedStyle(document.body);
        const htmlStyle = window.getComputedStyle(document.documentElement);
        const hasScrollX = document.documentElement.scrollWidth > window.innerWidth;
        const hasScrollY = document.documentElement.scrollHeight > window.innerHeight;
        return {
          bodyOverflow: bodyStyle.overflow,
          htmlOverflow: htmlStyle.overflow,
          hasScrollbars: hasScrollX || hasScrollY,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          scrollHeight: document.documentElement.scrollHeight,
          innerHeight: window.innerHeight
        };
      });

      // Check C: AdManager events & SoundEngine muting
      const adManagerCheck = await desktopFrame.evaluate(async () => {
        const adMgr = window.adManager;
        const snd = window.soundEngine;
        if (!adMgr) return { ok: false, error: 'window.adManager not found' };

        // Test dispatching gameplayStart and happyTime
        adMgr.gameplayStart();
        adMgr.happyTime();

        const lastEvent = window.__lastAdEvent;

        // Test SoundEngine muting on ad
        const mutedBefore = snd ? snd.isMuted() : false;
        let mutedDuringAd = false;

        const adPromise = adMgr.showInterstitial();
        // Check while ad overlay is active
        if (snd) {
          mutedDuringAd = snd.isMuted();
        }
        await adPromise;

        return {
          ok: true,
          lastEvent,
          soundEnginePresent: !!snd,
          mutedBefore,
          mutedDuringAd,
          mutedAfter: snd ? snd.isMuted() : false
        };
      });

      // Load game into Mobile iframe (390x844)
      console.log('  ▸ Testing Mobile Iframe (390x844)...');
      await page.evaluate((g) => {
        const frame = document.getElementById('frame-mobile');
        frame.src = `/${g}/index.html`;
      }, game);

      await new Promise((r) => setTimeout(r, 1200));

      const mobileFrameHandle = await page.$('#frame-mobile');
      const mobileFrame = await mobileFrameHandle.contentFrame();

      const mobileStyles = await mobileFrame.evaluate(() => {
        const hasScrollX = document.documentElement.scrollWidth > window.innerWidth;
        const hasScrollY = document.documentElement.scrollHeight > window.innerHeight;
        return {
          hasScrollbars: hasScrollX || hasScrollY,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          scrollHeight: document.documentElement.scrollHeight,
          innerHeight: window.innerHeight
        };
      });

      const passA = !hasBadAbsolutePaths && errors404.length === 0 && hasCanvas;
      const passB =
        desktopStyles.bodyOverflow === 'hidden' &&
        desktopStyles.htmlOverflow === 'hidden' &&
        !desktopStyles.hasScrollbars &&
        !mobileStyles.hasScrollbars;
      const passC = adManagerCheck.ok && adManagerCheck.mutedDuringAd;

      console.log(`  ${passA ? '✔' : '✖'} [Check A] Paths & Rendering: 404s=${errors404.length}, No Absolute Paths=${!hasBadAbsolutePaths}, Canvas Active=${hasCanvas}`);
      console.log(`  ${passB ? '✔' : '✖'} [Check B] Responsiveness: Body/HTML overflow=hidden, Scrollbars Desktop=${desktopStyles.hasScrollbars}, Mobile=${mobileStyles.hasScrollbars}`);
      console.log(`  ${passC ? '✔' : '✖'} [Check C] AdManager & Sound: gameplayStart/happyTime=${adManagerCheck.lastEvent}, Sound Silenced During Ad=${adManagerCheck.mutedDuringAd}`);

      auditResults.push({
        game,
        passA,
        passB,
        passC,
        errors404,
        hasCanvas,
        desktopStyles,
        mobileStyles,
        adManagerCheck
      });

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n======================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('======================================================');
  console.table(
    auditResults.map((r) => ({
      Game: r.game,
      'Check A (No 404s/Canvas)': r.passA ? 'PASSED' : 'FAILED',
      'Check B (Overflow/Scale)': r.passB ? 'PASSED' : 'FAILED',
      'Check C (Ad & Sound Mute)': r.passC ? 'PASSED' : 'FAILED',
      'Final Status': r.passA && r.passB && r.passC ? '✅ 100% READY' : '❌ ISSUE FOUND'
    }))
  );

  const allPassed = auditResults.every((r) => r.passA && r.passB && r.passC);
  if (!allPassed) {
    console.error('\n❌ QA AUDIT FAILED ON ONE OR MORE CHECKS');
    process.exit(1);
  } else {
    console.log('\n🌟 ALL 5 GAMES PASSED STRICT PORTAL IFRAME SIMULATION WITH 100% SUCCESS!');
  }
}

main().catch((err) => {
  console.error('\nFatal QA Error:', err);
  process.exit(1);
});
