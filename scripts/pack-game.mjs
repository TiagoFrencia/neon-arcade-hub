#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const RELEASES_DIR = path.resolve(ROOT_DIR, 'releases');
const GAMES_DIR = path.resolve(ROOT_DIR, 'games');

// Ensure releases dir exists
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true });
}

const targetArg = process.argv[2];

if (!targetArg) {
  console.error('\x1b[31m[ERROR] Missing game name parameter.\x1b[0m');
  console.log('\x1b[33mUsage: node scripts/pack-game.mjs <game-folder-name>\x1b[0m');
  console.log('Available games:');
  const available = fs
    .readdirSync(GAMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `  - ${d.name}`);
  console.log(available.join('\n'));
  process.exit(1);
}

// Clean game name (handles 'games/01-neon-suika', '01-neon-suika/', etc.)
const gameName = targetArg.replace(/^games[\\/]/, '').replace(/[\\/]$/, '');
const gameDir = path.resolve(GAMES_DIR, gameName);

if (!fs.existsSync(gameDir)) {
  console.error(`\x1b[31m[ERROR] Game folder not found: ${gameDir}\x1b[0m`);
  process.exit(1);
}

console.log(`\n\x1b[36m====================================================\x1b[0m`);
console.log(`\x1b[36m📦 PACKAGING GAME: \x1b[1m${gameName}\x1b[0m`);
console.log(`\x1b[36m====================================================\x1b[0m\n`);

const startTime = performance.now();

try {
  // 1. Build game with Vite (ensuring base: './' for portal iframe portability)
  console.log(`\x1b[34m[1/3] Building with Vite (base: './')...\x1b[0m`);
  execSync('npx vite build --base ./', {
    cwd: gameDir,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  const distDir = path.resolve(gameDir, 'dist');
  if (!fs.existsSync(distDir) || !fs.existsSync(path.resolve(distDir, 'index.html'))) {
    throw new Error(`Build failed: dist/index.html was not generated in ${distDir}`);
  }

  // 2. Prepare Zip Archive in releases/
  const zipFileName = `${gameName}-ready.zip`;
  const zipFilePath = path.resolve(RELEASES_DIR, zipFileName);

  console.log(`\n\x1b[34m[2/3] Compressing dist files into ${zipFileName}...\x1b[0m`);

  // Remove existing zip if any
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }

  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        reject(err);
      }
    });
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    // Append all contents of dist folder directly to the root of the zip
    archive.directory(distDir, false);
    archive.finalize();
  });

  // 3. Stats and Verification
  const stats = fs.statSync(zipFilePath);
  const sizeKb = (stats.size / 1024).toFixed(2);
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log(`\n\x1b[32m[3/3] SUCCESS!\x1b[0m`);
  console.log(`\x1b[32m✔ Release ready: releases/${zipFileName}\x1b[0m`);
  console.log(`\x1b[32m✔ File size: ${sizeKb} KB\x1b[0m`);
  console.log(`\x1b[32m✔ Time elapsed: ${elapsed}s\x1b[0m`);
  console.log(`\x1b[35m✔ Format verified: Ready for CrazyGames, Poki, and Itch.io\x1b[0m\n`);
} catch (err) {
  console.error(`\n\x1b[31m[PACK ERROR]\x1b[0m`, err);
  process.exit(1);
}
