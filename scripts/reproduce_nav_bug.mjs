import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';

async function run() {
  console.log('🔍 Démarrage du test de reproduction du bug de navigation en anglais...');

  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5230 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5230';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('  [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('  [PAGE ERROR]', err));

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  console.log('1. Bascule en langue anglaise (EN)...');
  await page.evaluate(() => {
    window.vitalTrackI18n.setLanguage('en');
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('2. Tentative de navigation vers "recipes"...');
  await page.evaluate(() => {
    window.showPage('recipes');
  });
  await new Promise(r => setTimeout(r, 500));

  const activePage1 = await page.evaluate(() => {
    const active = document.querySelector('.page.active');
    return active ? active.id : null;
  });
  console.log('  -> Page active après showPage("recipes"):', activePage1);

  console.log('3. Clic sur un lien de navigation du bas (bnav-item scan)...');
  await page.evaluate(() => {
    const scanBtn = document.querySelector('.bnav-item[data-page="scan"]');
    if (scanBtn) scanBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const activePage2 = await page.evaluate(() => {
    const active = document.querySelector('.page.active');
    return active ? active.id : null;
  });
  console.log('  -> Page active après clic sur Scan:', activePage2);

  console.log('4. Clic sur le bouton de bascule de langue (toggleLanguage)...');
  await page.evaluate(() => {
    const langBtn = document.getElementById('globalLangToggleBtn') || document.getElementById('desktopLangToggleBtn');
    if (langBtn) langBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const activePage3 = await page.evaluate(() => {
    const active = document.querySelector('.page.active');
    return active ? active.id : null;
  });
  console.log('  -> Page active après toggleLanguage:', activePage3);

  await browser.close();
  await server.close();
}

run().catch(console.error);
