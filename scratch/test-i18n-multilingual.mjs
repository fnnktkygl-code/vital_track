import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('/Users/richard/Developer/vital_track/web-app/dist');

// Static HTTP server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA Fallback
      fs.readFile(path.join(distDir, 'index.html'), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(indexData);
        }
      });
      return;
    }
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(4182, async () => {
  console.log('🚀 Testing i18n on port 4182...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('Browser error:', msg.text());
  });

  await page.goto('http://localhost:4182', { waitUntil: 'networkidle0' });

  // Test 1: Check default language (French)
  const initialLang = await page.evaluate(() => window.vitalTrackI18n.getLanguage());
  console.log(`Default language: ${initialLang}`);

  // Test 2: Switch to English
  await page.evaluate(() => window.vitalTrackI18n.setLanguage('en'));
  const enNav = await page.evaluate(() => document.querySelector('.nav-link[data-page="dashboard"]')?.textContent);
  console.log(`English Dashboard Nav: ${enNav?.trim()}`);
  if (!enNav?.includes('Dashboard')) throw new Error('English translation failed');

  // Test 3: Switch to Spanish
  await page.evaluate(() => window.vitalTrackI18n.setLanguage('es'));
  const esNav = await page.evaluate(() => document.querySelector('.nav-link[data-page="dashboard"]')?.textContent);
  console.log(`Spanish Dashboard Nav: ${esNav?.trim()}`);
  if (!esNav?.includes('Panel Principal')) throw new Error('Spanish translation failed');

  // Test 4: Switch to Canadian French
  await page.evaluate(() => window.vitalTrackI18n.setLanguage('fr-CA'));
  const caNav = await page.evaluate(() => document.querySelector('.nav-link[data-page="dashboard"]')?.textContent);
  console.log(`Canadian French Nav: ${caNav?.trim()}`);
  if (!caNav?.includes('Tableau')) throw new Error('Canadian French translation failed');

  console.log('🎉 ALL 4-LANGUAGE I18N TESTS PASSED 100% PERFECTLY!');

  await browser.close();
  server.close();
  process.exit(0);
});
