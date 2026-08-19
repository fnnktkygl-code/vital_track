import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('/Users/richard/Developer/vital_track/web-app/dist');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(distDir, reqPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
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

server.listen(4185, async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  await page.goto('http://localhost:4185', { waitUntil: 'networkidle0' });

  // Add dummy weight history
  await page.evaluate(() => {
    const history = [
      { id: 'w1', date: '2026-08-01', weight: 75.5, note: 'Départ' },
      { id: 'w2', date: '2026-08-05', weight: 74.8, note: '' },
      { id: 'w3', date: '2026-08-10', weight: 74.1, note: '' },
      { id: 'w4', date: '2026-08-15', weight: 73.6, note: '' },
      { id: 'w5', date: '2026-08-19', weight: 73.0, note: 'Pesée du jour' }
    ];
    window.store.set('weight_history', history);
    if (window.renderWeightChart) window.renderWeightChart();
  });

  await new Promise(r => setTimeout(r, 400));

  // Show dashboard, close modal and scroll to weight section
  await page.evaluate(() => {
    if (window.closeWeightModal) window.closeWeightModal();
    if (window.showPage) window.showPage('dashboard');
    if (window.renderWeightChart) window.renderWeightChart();
    const sec = document.getElementById('dashWeightSection') || document.querySelector('.weight-tracker-card') || document.getElementById('weightChartContainer');
    if (sec) sec.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-weight-chart-polished.png' });
  console.log('📸 Saved screenshot of polished Weight Chart on dashboard');

  await browser.close();
  server.close();
  process.exit(0);
});
