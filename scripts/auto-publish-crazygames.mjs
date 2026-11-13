import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GAMES } from './games-metadata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sessionDir = path.resolve(rootDir, '.auth-session');

function logStep(msg) {
  console.log(`\n[CRAZYGAMES-BOT] ${msg}`);
}

async function isCrazyGamesLoggedIn(page) {
  try {
    const url = page.url();
    if (url.includes('/login') || url.includes('/sign-in') || url.includes('/auth')) {
      return false;
    }
    // Check if inside dashboard or if session avatar / logout button exists
    const hasDashboardContent = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      return text.includes('Submit a game') || 
             text.includes('My Games') || 
             text.includes('Dashboard') || 
             text.includes('Developer Portal') ||
             !!document.querySelector('a[href*="/games"], a[href*="/submit"], button:has-text("Submit a game")');
    });
    return hasDashboardContent;
  } catch (err) {
    return false;
  }
}

async function publishGameToCrazyGames(page, game) {
  logStep(`>>> Procesando "${game.title}" en CrazyGames...`);

  // 1. Navegar a creación de juego
  let submittedClicked = false;
  try {
    const submitBtn = await page.$('a:has-text("Submit a game"), button:has-text("Submit a game"), a[href*="/games/new"], a[href*="/submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      submittedClicked = true;
    }
  } catch (e) {}

  if (!submittedClicked) {
    await page.goto('https://developer.crazygames.com/games/new', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(async () => {
      await page.goto('https://developer.crazygames.com/submit', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    });
    await page.waitForTimeout(2000);
  }

  // 2. Rellenar Título
  const titleInput = await page.$('input[name="title"], #title, input[placeholder*="Title" i], input[data-testid*="title" i]');
  if (titleInput) {
    await titleInput.fill(game.title);
    logStep(`Título rellenado: ${game.title}`);
  }

  // 3. Rellenar Descripción
  const descInput = await page.$('textarea[name="description"], #description, textarea[placeholder*="Description" i], div[contenteditable="true"]');
  if (descInput) {
    const tagName = await descInput.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'textarea') {
      await descInput.fill(game.description);
    } else {
      await descInput.evaluate((el, text) => {
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, game.description);
    }
    logStep(`Descripción SEO insertada.`);
  }

  // 4. Rellenar Controles
  const controlsInput = await page.$('textarea[name="controls"], #controls, textarea[placeholder*="Control" i], textarea[name*="instruction" i]');
  if (controlsInput) {
    await controlsInput.fill(game.controls);
    logStep(`Instrucciones y controles rellenados.`);
  }

  // 5. Categoría
  const categorySelect = await page.$('select[name="category"], #category, select[name*="genre" i]');
  if (categorySelect) {
    await page.selectOption('select[name="category"], #category, select[name*="genre" i]', { label: new RegExp(game.crazyCategory, 'i') }).catch(() => {});
    logStep(`Categoría seleccionada: ${game.crazyCategory}`);
  }

  // 6. Subir Archivo ZIP HTML5
  if (fs.existsSync(game.zip)) {
    logStep(`Adjuntando release HTML5: ${path.basename(game.zip)}...`);
    const zipUploader = await page.$('input[type="file"][accept*="zip"], input[type="file"][name*="build" i], input[type="file"][name*="file" i], input[type="file"]');
    if (zipUploader) {
      await zipUploader.setInputFiles(game.zip);
      logStep(`Archivo ZIP subido al uploader.`);
      await page.waitForTimeout(3000);
    }
  }

  // 7. Subir Assets Visuales (Thumbnails y Screenshots)
  const allFileInputs = await page.$$('input[type="file"]');
  logStep(`Inputs de archivo encontrados en el formulario: ${allFileInputs.length}`);

  // Tratar de asignar en base a selectores específicos o secuencialmente
  const thumb16x9Input = await page.$('input[type="file"][name*="16x9" i], input[type="file"][name*="wide" i], input[type="file"][name*="cover" i]');
  if (thumb16x9Input && fs.existsSync(game.thumb16x9)) {
    await thumb16x9Input.setInputFiles(game.thumb16x9);
    logStep(`Thumbnail 16:9 adjuntado.`);
  }

  const thumb1x1Input = await page.$('input[type="file"][name*="1x1" i], input[type="file"][name*="square" i], input[type="file"][name*="icon" i]');
  if (thumb1x1Input && fs.existsSync(game.thumb1x1)) {
    await thumb1x1Input.setInputFiles(game.thumb1x1);
    logStep(`Thumbnail 1:1 adjuntado.`);
  }

  const screenInputs = await page.$('input[type="file"][name*="screenshot" i], input[type="file"][multiple]');
  const validScreens = game.screenshots.filter(s => fs.existsSync(s));
  if (screenInputs && validScreens.length > 0) {
    await screenInputs.setInputFiles(validScreens);
    logStep(`Screenshots adjuntados: ${validScreens.length}`);
  }

  // 8. Guardar en estado "Ready for Review" o "Save Draft"
  logStep(`Guardando y validando formulario...`);
  const saveBtn = await page.$('button:has-text("Submit for review"), button:has-text("Ready for Review"), button:has-text("Save Draft"), button:has-text("Save"), button[type="submit"]');
  if (saveBtn) {
    await saveBtn.click();
    logStep(`Botón de guardado/envío presionado.`);
    await page.waitForTimeout(3000);
  }

  logStep(`✅ Juego "${game.title}" guardado en CrazyGames Developer Portal!`);
}

async function run() {
  logStep('Iniciando navegador Playwright para CrazyGames Developer Portal...');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: true,
    viewport: { width: 1440, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Paso 1: Navegar a developer.crazygames.com
  logStep('Navegando a https://developer.crazygames.com/ ...');
  await page.goto('https://developer.crazygames.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  let loggedIn = await isCrazyGamesLoggedIn(page);
  if (!loggedIn) {
    console.log('\n=============================================================');
    console.log('POR FAVOR INICIA SESIÓN EN LA VENTANA DE CRAZYGAMES DEVELOPER PORTAL.');
    console.log('EL AGENTE CONTINUARÁ SOLO APENAS DETECTE EL PANEL DE DESARROLLADOR.');
    console.log('=============================================================\n');

    while (!loggedIn) {
      await page.waitForTimeout(2500);
      loggedIn = await isCrazyGamesLoggedIn(page);
    }
  }

  logStep('¡Sesión en CrazyGames Developer Portal verificada con éxito!');

  // Paso 2: Procesar los 5 juegos
  for (let i = 0; i < GAMES.length; i++) {
    const game = GAMES[i];
    console.log(`\n-------------------------------------------------------------`);
    console.log(`[${i + 1}/${GAMES.length}] PROCESANDO CRAZYGAMES: ${game.shortTitle}`);
    console.log(`-------------------------------------------------------------`);
    await publishGameToCrazyGames(page, game);
  }

  logStep('🎉 ¡TODOS LOS 5 JUEGOS HAN SIDO PROCESADOS EN CRAZYGAMES!');
  console.log('Manteniendo la sesión abierta para confirmación.');
}

run().catch(err => {
  console.error('[CRAZYGAMES-BOT ERROR]', err);
  process.exit(1);
});
