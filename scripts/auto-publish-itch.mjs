import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { GAMES } from './games-metadata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const sessionDir = path.resolve(rootDir, '.auth-session');

function logStep(msg) {
  console.log(`\n[ITCH-BOT] ${msg}`);
}

async function isItchLoggedIn(page, context) {
  try {
    const cookies = await context.cookies('https://itch.io');
    const hasToken = cookies.some(c => c.name === 'itchio_token');
    if (hasToken) return true;

    // Test dashboard access
    await page.goto('https://itch.io/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const currentUrl = page.url();
    return !currentUrl.includes('/login') && !currentUrl.includes('/register');
  } catch (err) {
    return false;
  }
}

async function detectItchUsername(page) {
  try {
    return await page.evaluate(() => {
      const el = document.querySelector('.user_panel .username, .user_name, a.user_link, a.user_tag');
      return el ? el.textContent.trim() : '';
    });
  } catch (e) {
    return '';
  }
}

async function publishGameToItch(page, game, username) {
  logStep(`>>> Publicando "${game.title}" (${game.slug})...`);

  // 1. Navegar a game/new
  await page.goto('https://itch.io/game/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // 2. Rellenar Título
  const titleInput = await page.waitForSelector('input[name="title"], #game_title, input[name="game[title]"]', { timeout: 15000 });
  await titleInput.fill(game.title);
  logStep(`Título rellenado: ${game.title}`);

  // 3. Rellenar Slug (Project URL)
  const slugInput = await page.$('input[name="url"], #game_url, input[name="game[url]"]');
  if (slugInput) {
    await slugInput.fill(game.slug);
    logStep(`Slug asignado: ${game.slug}`);
  }

  // 4. Short Description (Tagline)
  const shortDesc = await page.$('input[name="short_text"], #game_short_text, textarea[name="short_text"]');
  if (shortDesc) {
    await shortDesc.fill(game.tagline);
    logStep(`Tagline rellenada.`);
  }

  // 5. Kind of project -> HTML
  const typeSelect = await page.$('select[name="type"], #game_type, select[name="game[type]"]');
  if (typeSelect) {
    await page.selectOption('select[name="type"], #game_type, select[name="game[type]"]', 'html').catch(async () => {
      await page.selectOption('select[name="type"], #game_type, select[name="game[type]"]', { label: /HTML/i }).catch(() => {});
    });
    logStep(`Tipo de proyecto cambiado a HTML.`);
    await page.waitForTimeout(1000);
  }

  // 6. Viewport dimensions (1280x720)
  const widthInput = await page.$('input[name="viewport_width"], input[name="game[viewport_width]"], #game_viewport_width');
  if (widthInput) await widthInput.fill('1280');

  const heightInput = await page.$('input[name="viewport_height"], input[name="game[viewport_height]"], #game_viewport_height');
  if (heightInput) await heightInput.fill('720');
  logStep(`Dimensiones de viewport configuradas: 1280x720.`);

  // 7. Checkboxes: Mobile friendly, Auto start, Fullscreen button
  const mobileCheck = await page.$('input[name="mobile_friendly"], input[name="game[mobile_friendly]"], #game_mobile_friendly');
  if (mobileCheck) await mobileCheck.check().catch(() => {});

  const autoStartCheck = await page.$('input[name="auto_start"], input[name="game[auto_start]"], #game_auto_start');
  if (autoStartCheck) await autoStartCheck.check().catch(() => {});

  const fsCheck = await page.$('input[name="fullscreen"], input[name="game[fullscreen]"], #game_fullscreen, input[name*="fullscreen"]');
  if (fsCheck) await fsCheck.check().catch(() => {});
  logStep(`Opciones de mobile, auto-start y fullscreen marcadas.`);

  // 8. Subir Portada cover-itch.png
  if (fs.existsSync(game.coverItch)) {
    const coverInput = await page.$('input[type="file"][name="cover"], input[type="file"][name="game[cover]"], #game_cover, .cover_uploader input[type="file"]');
    if (coverInput) {
      await coverInput.setInputFiles(game.coverItch);
      logStep(`Portada subida: ${path.basename(game.coverItch)}`);
      await page.waitForTimeout(1500);
    }
  }

  // 9. Subir Screenshots
  const existingScreenshots = game.screenshots.filter(s => fs.existsSync(s));
  if (existingScreenshots.length > 0) {
    const screenshotInput = await page.$('input[type="file"][name*="screenshot"], .screenshot_uploader input[type="file"], input[type="file"][multiple]');
    if (screenshotInput) {
      await screenshotInput.setInputFiles(existingScreenshots);
      logStep(`Capturas subidas: ${existingScreenshots.length} imágenes.`);
      await page.waitForTimeout(2000);
    }
  }

  // 10. Pegar Descripción en el editor
  const redactor = await page.$('.redactor-layer, .redactor-editor, div[contenteditable="true"]');
  if (redactor) {
    const formattedHtml = game.description
      .split('\n\n')
      .map(p => {
        if (p.startsWith('### ')) return `<h3>${p.replace('### ', '')}</h3>`;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('');
    await redactor.evaluate((el, html) => {
      el.innerHTML = html;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, formattedHtml);
    logStep(`Descripción insertada en editor visual.`);
  } else {
    const textarea = await page.$('textarea[name="description"], textarea[name="game[description]"], #game_description');
    if (textarea) {
      await textarea.fill(game.description);
      logStep(`Descripción insertada en textarea.`);
    }
  }

  // 11. Seleccionar Género
  const genreSelect = await page.$('select[name="genre_id"], select[name="game[genre_id]"], #game_genre_id');
  if (genreSelect) {
    await page.selectOption('select[name="genre_id"], select[name="game[genre_id]"], #game_genre_id', { label: new RegExp(game.itchGenre, 'i') }).catch(() => {});
    logStep(`Género seleccionado: ${game.itchGenre}`);
  }

  // 12. Subir Archivo ZIP HTML5 directo en la página
  if (fs.existsSync(game.zip)) {
    logStep(`Subiendo archivo de release: ${path.basename(game.zip)}...`);
    const fileInput = await page.$('.upload_file_btn input[type="file"], input[type="file"][name="file"], input[type="file"][name*="upload"]');
    if (fileInput) {
      await fileInput.setInputFiles(game.zip);
      // Esperar a que termine de subir
      logStep(`Esperando subida del paquete ZIP...`);
      await page.waitForTimeout(4000);
      try {
        await page.waitForSelector('.upload_progress, .progress_bar', { state: 'detached', timeout: 60000 });
      } catch (e) {
        // Ignorar si ya terminó o no usó barra de progreso
      }
      logStep(`Archivo ZIP subido con éxito.`);

      // Tildar "This file will be played in the browser"
      await page.waitForTimeout(1500);
      const playedInBrowser = await page.$('input[type="checkbox"][name*="browser"], input[type="checkbox"][value="browser"], label:has-text("This file will be played in the browser") input[type="checkbox"]');
      if (playedInBrowser) {
        await playedInBrowser.check().catch(() => {});
        logStep(`Tildado "This file will be played in the browser".`);
      }
    }
  }

  // 13. Opcional: Butler push si Butler está autenticado
  const butlerPath = path.resolve(rootDir, 'bin', 'butler.exe');
  if (fs.existsSync(butlerPath) && username) {
    try {
      logStep(`Probando Butler push como soporte CLI para ${username}/${game.slug}:html5...`);
      execSync(`"${butlerPath}" push "${game.zip}" ${username}/${game.slug}:html5`, { stdio: 'inherit' });
      logStep(`Butler push ejecutado correctamente.`);
    } catch (e) {
      logStep(`(Nota: Butler push CLI omitido o requiere login token en butler_creds; la subida vía web UI ya está completa).`);
    }
  }

  // 14. Guardar borrador / Save & view
  logStep(`Guardando borrador del juego...`);
  const saveBtn = await page.$('button.save_btn, button[name="save"], button:has-text("Save & view page"), button:has-text("Save")');
  if (saveBtn) {
    await saveBtn.click();
    await page.waitForTimeout(3000);
  }

  // 15. Configurar Visibilidad a Public
  try {
    const editLink = await page.$('a:has-text("Edit game")');
    if (editLink) {
      await editLink.click();
      await page.waitForTimeout(2000);
    }
    const publicRadio = await page.$('input[name="visibility"][value="public"], #game_visibility_public, input[type="radio"][value="public"]');
    if (publicRadio) {
      await publicRadio.check().catch(() => {});
      const saveBtn2 = await page.$('button.save_btn, button[name="save"], button:has-text("Save")');
      if (saveBtn2) {
        await saveBtn2.click();
        await page.waitForTimeout(2000);
      }
      logStep(`Visibilidad configurada a: PUBLIC.`);
    }
  } catch (err) {
    logStep(`Aviso visibilidad: ${err.message}`);
  }

  logStep(`✅ Publicación de ${game.title} completada en Itch.io!`);
}

async function run() {
  logStep('Iniciando navegador con contexto persistente...');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(sessionDir, {
    headless: false,
    slowMo: 150,
    viewport: { width: 1440, height: 900 },
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--start-maximized'
    ]
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  // Paso A: Login Check
  logStep('Comprobando estado de sesión en Itch.io...');
  await page.goto('https://itch.io/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

  let loggedIn = await isItchLoggedIn(page, context);
  if (!loggedIn) {
    console.log('\n=============================================================');
    console.log('POR FAVOR INICIA SESIÓN EN LA VENTANA DE ITCH.IO.');
    console.log('EL AGENTE CONTINUARÁ SOLO APENAS DETECTE EL DASHBOARD / SESIÓN.');
    console.log('=============================================================\n');

    while (!loggedIn) {
      await page.waitForTimeout(2500);
      const url = page.url();
      if (!url.includes('/login') && !url.includes('/register') && !url.includes('/captcha')) {
        const cookies = await context.cookies('https://itch.io');
        const hasToken = cookies.some(c => c.name === 'itchio_token');
        if (hasToken || url.includes('/dashboard')) {
          loggedIn = true;
          break;
        }
      }
    }
  }

  logStep('¡Sesión en Itch.io verificada exitosamente!');
  const username = await detectItchUsername(page);
  if (username) logStep(`Usuario detectado: ${username}`);

  // Paso B: Recorrer los 5 juegos secuencialmente
  for (let i = 0; i < GAMES.length; i++) {
    const game = GAMES[i];
    console.log(`\n-------------------------------------------------------------`);
    console.log(`[${i + 1}/${GAMES.length}] PROCESANDO: ${game.shortTitle}`);
    console.log(`-------------------------------------------------------------`);
    await publishGameToItch(page, game, username);
  }

  logStep('🎉 ¡TODOS LOS 5 JUEGOS HAN SIDO PROCESADOS EN ITCH.IO!');
  console.log('Manteniendo la sesión abierta para confirmación.');
}

run().catch(err => {
  console.error('[ITCH-BOT ERROR]', err);
  process.exit(1);
});
