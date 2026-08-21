import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85';

async function run() {
  console.log('🧪 Lancement du test visuel des inputs et des boutons fermer...');
  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5195 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5195';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // 1. Vue Mobile (375 x 812 - iPhone)
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    window.showPage('deep-search');
  });
  await new Promise(r => setTimeout(r, 600));

  // Scroll down slightly to see form inputs
  await page.evaluate(() => {
    const el = document.getElementById('deepSearchIntakeForm');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));

  // Screenshot Mobile Deep Search Step 1 Form Inputs
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'deep_search_mobile_inputs_step1.png'),
    fullPage: false
  });
  console.log('✅ Screenshot Mobile Deep Search Inputs Étape 1 capturé !');

  // 2. Vue Desktop (1200 x 850)
  await page.setViewport({ width: 1200, height: 850 });
  await page.evaluate(() => {
    window.showPage('deep-search');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'deep_search_desktop_inputs_step1.png'),
    fullPage: false
  });
  console.log('✅ Screenshot Desktop Deep Search Étape 1 capturé !');

  // 3. Test de la modale de Recette
  await page.evaluate(() => {
    window.showPage('recipes');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    window.openRecipeModal('salade-balai-ehret-originale');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'recipe_modal_unified_close.png'),
    fullPage: false
  });
  console.log('✅ Screenshot Modale Recette capturé !');

  await browser.close();
  await server.close();
  console.log('🎉 Tous les screenshots de validation sont prêts.');
}

run().catch(err => {
  console.error('Erreur test visuel:', err);
  process.exit(1);
});
