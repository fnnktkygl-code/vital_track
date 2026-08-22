/**
 * test_book_reader_mobile_layout.mjs
 * 
 * Verifies that on mobile (390px / iPhone viewport), the Book Reader topbar
 * buttons, selectors, theme pills, font stepper, and close button fit with 0 overflow.
 */

import assert from 'node:assert/strict';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════');
console.log('📱 TEST MOBILE BOOK READER TOPBAR BUTTONS & OVERFLOW (390x844)');
console.log('═══════════════════════════════════════════════════════════\n');

const port = 5580 + Math.floor(Math.random() * 100);
const server = await createServer({
  root: '/Users/richard/Developer/vital_track/web-app',
  server: { port }
});
await server.listen();
const baseUrl = server.resolvedUrls.local[0] || `http://localhost:${port}`;

const tempProfileDir = path.join(process.cwd(), '.tmp_chrome_profile_' + Date.now());
fs.mkdirSync(tempProfileDir, { recursive: true });

let browser;
try {
  browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${tempProfileDir}`
    ]
  });

  const page = await browser.newPage();
  
  // Set iPhone 14 Mobile Viewport
  const viewportWidth = 390;
  const viewportHeight = 844;
  await page.setViewport({ width: viewportWidth, height: viewportHeight, isMobile: true, hasTouch: true });

  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Open Book Reader directly
  await page.evaluate(() => {
    window.openBookReader('ehret-mucusless-es', 2);
  });
  await new Promise(r => setTimeout(r, 800));

  // Verify Book Reader is open
  const isOpen = await page.evaluate(() => {
    const modal = document.getElementById('bookReaderModalOverlay');
    return modal && modal.classList.contains('open');
  });
  assert.ok(isOpen, 'Book Reader modal should be open');
  console.log('  ✅ Book Reader ouvert en Espagnol (Ehret ES)');

  // Verify geometry and bounding boxes of all topbar elements
  const metrics = await page.evaluate((vpWidth) => {
    const topbar = document.querySelector('.br-topbar');
    const closeBtn = document.querySelector('.br-topbar-close-btn');
    const bookSelect = document.querySelector('.br-book-select');
    const themeGroup = document.querySelector('.br-theme-group');
    const fontStepper = document.querySelector('.br-font-stepper');
    const actionBtns = Array.from(document.querySelectorAll('.br-action-btn'));

    const topbarRect = topbar.getBoundingClientRect();
    const closeRect = closeBtn.getBoundingClientRect();
    const selectRect = bookSelect.getBoundingClientRect();
    const themeRect = themeGroup.getBoundingClientRect();
    const fontRect = fontStepper.getBoundingClientRect();

    return {
      topbar: { left: topbarRect.left, right: topbarRect.right, width: topbarRect.width, overflowX: topbarRect.right > vpWidth },
      closeBtn: { left: closeRect.left, right: closeRect.right, width: closeRect.width, isVisible: closeRect.right <= vpWidth && closeRect.left >= 0 },
      bookSelect: { left: selectRect.left, right: selectRect.right, width: selectRect.width, isVisible: selectRect.right <= vpWidth },
      themeGroup: { left: themeRect.left, right: themeRect.right, width: themeRect.width, isVisible: themeRect.right <= vpWidth },
      fontStepper: { left: fontRect.left, right: fontRect.right, width: fontRect.width, isVisible: fontRect.right <= vpWidth },
      actionBtns: actionBtns.map(btn => {
        const r = btn.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width, isVisible: r.right <= vpWidth && r.left >= 0 };
      })
    };
  }, viewportWidth);

  console.log('\n📊 Métriques Géométriques sur Mobile (390px) :');
  console.log(`  • Topbar width: ${metrics.topbar.width}px (Overflow: ${metrics.topbar.overflowX ? 'OUI ❌' : 'NON ✅'})`);
  console.log(`  • Close Button right edge: ${metrics.closeBtn.right}px / ${viewportWidth}px (Visible: ${metrics.closeBtn.isVisible ? '✅' : '❌'})`);
  console.log(`  • Book Select width: ${metrics.bookSelect.width}px, right edge: ${metrics.bookSelect.right}px (Visible: ${metrics.bookSelect.isVisible ? '✅' : '❌'})`);
  console.log(`  • Theme Group width: ${metrics.themeGroup.width}px, right edge: ${metrics.themeGroup.right}px (Visible: ${metrics.themeGroup.isVisible ? '✅' : '❌'})`);
  console.log(`  • Font Stepper width: ${metrics.fontStepper.width}px, right edge: ${metrics.fontStepper.right}px (Visible: ${metrics.fontStepper.isVisible ? '✅' : '❌'})`);

  assert.equal(metrics.topbar.overflowX, false, 'Topbar must not overflow horizontally on 390px viewport');
  assert.equal(metrics.closeBtn.isVisible, true, 'Close button must be completely visible within viewport');
  assert.equal(metrics.themeGroup.isVisible, true, 'Theme group must be completely visible within viewport');
  assert.equal(metrics.fontStepper.isVisible, true, 'Font stepper must be completely visible within viewport');

  metrics.actionBtns.forEach((btn, idx) => {
    assert.equal(btn.isVisible, true, `Action button #${idx} must be visible within viewport`);
  });

  const screenshotPath = '/Users/richard/.gemini/antigravity/brain/af93d17e-7b44-45c9-bde6-a2c24b0cbde4/reader_mobile_fixed.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Capture d'écran enregistrée : ${screenshotPath}`);

  console.log('\n🎉 TOUTES LES ASSERTIONS GÉOMÉTRIQUES SONT VALIDÉES À 100% (Zéro coupure) !');

} finally {
  if (browser) await browser.close();
  await server.close();
  try {
    fs.rmSync(tempProfileDir, { recursive: true, force: true });
  } catch (e) {}
}
