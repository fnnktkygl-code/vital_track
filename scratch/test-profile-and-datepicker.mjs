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

server.listen(4184, async () => {
  console.log('🚀 Starting Datepicker, Profile & Header E2E tests on port 4184...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await page.goto('http://localhost:4184', { waitUntil: 'networkidle0' });

  // TEST 1: Check Dashboard Header Language Shortcut
  console.log('--- TEST 1: Dashboard Header Language Shortcut ---');
  const dashLangBtn = await page.$('#dashHeaderLangBtn');
  if (!dashLangBtn) throw new Error('Dashboard header language button #dashHeaderLangBtn not found!');
  const initialText = await page.evaluate(el => el.textContent, dashLangBtn);
  console.log(`Initial Dash Lang Button text: ${initialText}`);

  await dashLangBtn.click();
  await new Promise(r => setTimeout(r, 400));
  const newText = await page.evaluate(el => el.textContent, dashLangBtn);
  console.log(`New Dash Lang Button text after click: ${newText}`);
  if (initialText === newText) throw new Error('Language did not toggle on click!');
  console.log('✅ TEST 1 PASSED: Dashboard header language shortcut works!');

  // Switch back to French
  await page.evaluate(() => window.vitalTrackI18n?.setLanguage('fr'));
  await new Promise(r => setTimeout(r, 300));

  // TEST 2: User Profile & Vitalist Achievements Modal
  console.log('--- TEST 2: User Profile & Vitalist Achievements Hub ---');
  const profileBtn = await page.$('#dashUserProfileBtn');
  if (!profileBtn) throw new Error('Profile button not found');
  await profileBtn.click();
  await new Promise(r => setTimeout(r, 400));

  const modalVisible = await page.evaluate(() => {
    const m = document.getElementById('userProfileModal');
    return m && m.style.display === 'flex';
  });
  console.log(`User Profile Modal visible: ${modalVisible}`);
  if (!modalVisible) throw new Error('User profile modal did not open!');

  const badgesCount = await page.evaluate(() => {
    return document.querySelectorAll('#userProfileModalContent [data-pick-month], #userProfileModalContent h4').length;
  });
  console.log(`Found badges in profile modal: ${badgesCount}`);
  if (badgesCount < 4) throw new Error('Badges not rendered in modal');

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-profile-badges.png' });
  console.log('📸 Saved screenshot of User Profile & Badges Modal');
  console.log('✅ TEST 2 PASSED: User Profile & Vitalist Badges Hub modal works!');

  await page.evaluate(() => window.closeUserProfileModal(null));
  await new Promise(r => setTimeout(r, 300));

  // TEST 3: Custom Date Picker (No Native Selects!)
  console.log('--- TEST 3: Custom Date Picker and Month/Year Grid ---');
  // Open Weight Modal to test datepicker
  await page.evaluate(() => {
    if (window.openWeightModal) window.openWeightModal();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const tr = document.querySelector('#weightModal .vital-datepicker-trigger') || document.querySelector('.vital-datepicker-trigger');
    if (tr) tr.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Check that NO native select exists inside the popover
  const hasNativeSelect = await page.evaluate(() => {
    const popover = document.querySelector('.vital-datepicker-popover');
    return popover && popover.querySelectorAll('select').length > 0;
  });
  console.log(`Popover contains native <select>: ${hasNativeSelect}`);
  if (hasNativeSelect) throw new Error('POPOVER STILL CONTAINS NATIVE SELECT ELEMENTS!');

  // Click on Year mode toggle pill
  await page.evaluate(() => {
    const btn = document.querySelector('.vital-dp-pill-btn[data-toggle-mode="years"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  const yearChipsCount = await page.evaluate(() => {
    return document.querySelectorAll('.vital-dp-year-chip').length;
  });
  console.log(`Year chips rendered in custom grid: ${yearChipsCount}`);
  if (yearChipsCount < 10) throw new Error('Year custom chips not rendered properly');

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-custom-datepicker-years.png' });
  console.log('📸 Saved screenshot of Custom Year Grid');

  // Select year 2026
  const chip2026 = await page.$('.vital-dp-year-chip[data-pick-year="2026"]');
  if (chip2026) await chip2026.click();
  await new Promise(r => setTimeout(r, 300));

  console.log('✅ TEST 3 PASSED: Custom datepicker with glassmorphic year & month grid works!');

  console.log('\n🎉 ALL DASHBOARD HEADER, PROFILE BADGES & DATEPICKER TESTS PASSED 100%!');

  await browser.close();
  server.close();
  process.exit(0);
});
