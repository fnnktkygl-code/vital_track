import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import path from 'path';

const ARTIFACTS_DIR = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85';

async function run() {
  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5228 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5228';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    window.showPage('deep-search');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'deep_search_step1_mobile_light.png'),
    fullPage: false
  });
  console.log('  📸 Capture Mobile Light Deep Search OK !');

  await browser.close();
  await server.close();
}

run().catch(console.error);
