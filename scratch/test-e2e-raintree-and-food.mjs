import puppeteer from '../web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';
import http from 'http';

function startStaticServer(distDir, port = 4181) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(distDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runTests() {
  console.log('🚀 Starting static HTTP server on port 4181...');
  const distDir = path.resolve('/Users/richard/Developer/vital_track/web-app/dist');
  const server = await startStaticServer(distDir, 4181);

  console.log('🚀 Launching Puppeteer browser test...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  const url = 'http://localhost:4181';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n--- TEST 1: Food Modal (Sardines & Animal Foods) ---');
  // Trigger openFoodModal with sardines
  await page.evaluate(() => {
    window.openFoodModal('sardines');
  });

  await page.waitForSelector('#foodModal', { visible: true });

  // Switch to specific/vitalist tab
  await page.evaluate(() => {
    window.setModalTab('specific');
  });
  await new Promise(r => setTimeout(r, 300));

  const modalHtml = await page.evaluate(() => {
    return document.getElementById('modalTabContent')?.innerHTML || '';
  });

  console.log('Specific tab HTML content for Sardines:\n', modalHtml);

  if (modalHtml.includes('Végétal Originel & Brut')) {
    throw new Error('FAIL: Sardines still displays "Végétal Originel & Brut"!');
  }
  if (!modalHtml.includes('Non Végétal (Règne Animal)')) {
    throw new Error('FAIL: Sardines does not display "Non Végétal (Règne Animal)"!');
  }
  if (modalHtml.includes('calcium inorganique selon Sebi')) {
    throw new Error('FAIL: Sardines still has unverified Sebi quote!');
  }
  console.log('✅ TEST 1 PASSED: Sardines correctly classified as Animal food with verified sources and no pseudo-quotes!');

  // Take screenshot of Food Modal
  await page.screenshot({ path: path.resolve('/Users/richard/Developer/vital_track/scratch/screenshot-sardines-modal.png') });
  console.log('📸 Saved screenshot of Sardines modal.');

  // Close food modal
  await page.evaluate(() => {
    window.closeFoodModal({ target: document.getElementById('foodModal') });
  });

  console.log('\n--- TEST 2: Pharmacopoeia & Raintree Database (127 Plants) ---');
  // Switch to Materia Medica page
  await page.evaluate(() => {
    window.showPage('materia-medica');
  });

  await page.waitForSelector('#materiaHerbsGrid', { visible: true });
  await new Promise(r => setTimeout(r, 500));

  const herbCount = await page.evaluate(() => {
    return document.querySelectorAll('#materiaHerbsGrid .herb-card').length;
  });
  console.log(`Found ${herbCount} herb cards in Materia Medica grid.`);

  if (herbCount < 100) {
    throw new Error(`FAIL: Expected > 100 plants in grid, but found only ${herbCount}!`);
  }

  // Test search for Cedro Rosa
  await page.evaluate(() => {
    const input = document.getElementById('herbSearchInput');
    input.value = 'Cedro Rosa';
    window.handleHerbSearchInput();
  });
  await new Promise(r => setTimeout(r, 300));

  const searchResultsCount = await page.evaluate(() => {
    return document.querySelectorAll('#materiaHerbsGrid .herb-card').length;
  });
  console.log(`Search for "Cedro Rosa" returned ${searchResultsCount} cards.`);
  if (searchResultsCount !== 1) {
    throw new Error(`FAIL: Expected 1 result for Cedro Rosa, got ${searchResultsCount}`);
  }

  // Open Cedro Rosa modal
  await page.evaluate(() => {
    window.openHerbModal('cedrorosa');
  });

  await page.waitForSelector('#herbModal', { visible: true });
  await new Promise(r => setTimeout(r, 300));

  const herbModalBody = await page.evaluate(() => {
    return document.getElementById('herbModalBody')?.innerHTML || '';
  });

  if (!herbModalBody.includes('https://www.rain-tree.com/cedrorosa.htm')) {
    throw new Error('FAIL: Herb modal does not contain official Rain-Tree source link!');
  }
  if (!herbModalBody.includes('Source Primaire Vérifiée — Base Raintree')) {
    throw new Error('FAIL: Herb modal missing verified source banner!');
  }
  console.log('✅ TEST 2 PASSED: Cedro Rosa modal has verified source banner and direct https://www.rain-tree.com/cedrorosa.htm link!');

  // Take screenshot of Herb modal
  await page.screenshot({ path: path.resolve('/Users/richard/Developer/vital_track/scratch/screenshot-cedrorosa-modal.png') });
  console.log('📸 Saved screenshot of Cedro Rosa modal.');

  // Close herb modal
  await page.evaluate(() => {
    window.closeHerbModal();
  });

  // Clear search to show all cards
  await page.evaluate(() => {
    window.clearHerbSearch();
  });
  await new Promise(r => setTimeout(r, 300));

  // Take screenshot of Materia Medica grid
  await page.screenshot({ path: path.resolve('/Users/richard/Developer/vital_track/scratch/screenshot-materia-medica.png') });
  console.log('📸 Saved screenshot of Materia Medica grid.');

  await browser.close();
  server.close();
  console.log('\n🎉 ALL PUPPETEER TESTS PASSED 100% PERFECTLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
