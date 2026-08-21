import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import path from 'path';

const ARTIFACTS_DIR = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85';

async function run() {
  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5248 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5248';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    window.showPage('resources');
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    window.scrollBy(0, 450);
  });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'resources_catalog_cards_zoomed.png'),
    fullPage: false
  });
  console.log('  📸 Capture terminée : resources_catalog_cards_zoomed.png !');

  await browser.close();
  await server.close();
}

run().catch(console.error);
