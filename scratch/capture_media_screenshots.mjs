#!/usr/bin/env node

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function captureMediaSearch() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle2' });

  // 1. Switch to resources and search "mucus"
  await page.evaluate(() => {
    window.showPage('resources');
    window.searchMediaResources('mucus');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-media-search-results.png' });
  console.log('✅ Screenshot 1 saved: search results for mucus');

  // 2. Open video player modal with timestamp
  await page.evaluate(() => {
    window.playVideoAtTimestamp('/videos/dr-sebi-documentary.mp4', 675, 'Documentaire Dr. Sebi', 'local', '', 'Le Mucus Cause Unique', 'WHUT TV');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-video-timestamp-player.png' });
  console.log('✅ Screenshot 2 saved: video timestamp player modal');

  // 3. Close video and open PDF passage modal
  await page.evaluate(() => {
    window.closeMediaVideoModal();
    window.openPdfPassageModal('pdf-ehret-fr-ch04');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: '/Users/richard/Developer/vital_track/scratch/screenshot-pdf-passage-viewer.png' });
  console.log('✅ Screenshot 3 saved: PDF passage viewer modal');

  await browser.close();
}

captureMediaSearch().catch(err => {
  console.error(err);
  process.exit(1);
});
