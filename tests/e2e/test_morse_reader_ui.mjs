import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import path from 'path';

const ARTIFACTS_DIR = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85';

async function run() {
  console.log('🚀 Démarrage du test E2E UI pour BookReader (Dr. Morse)...');

  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5215 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5215';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Ouvrir le BookReader sur le livre du Dr. Morse
  await page.evaluate(() => {
    window.openBookReader('morse-detox-miracle-fr', 2); // Chapitre 1 : Humain Frugivore
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'morse_reader_anatomy_table.png'),
    fullPage: false
  });
  console.log('  📸 Capture 1 : Table d\'anatomie comparée du Dr. Morse capturée !');

  // 2. Naviguer vers la vue glossaire interactif du Dr. Morse
  await page.evaluate(() => {
    window.openGlossarySection();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'morse_reader_glossary_view.png'),
    fullPage: false
  });
  console.log('  📸 Capture 2 : Vue Glossaire & Sources Primaires du Dr. Morse capturée !');

  await browser.close();
  await server.close();
  console.log('🎉 Test E2E UI Dr. Morse terminé avec succès !');
}

run().catch(console.error);
