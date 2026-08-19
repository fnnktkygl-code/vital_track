import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function runTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.showPage('modes'));
  await new Promise(r => setTimeout(r, 600));

  // Scroll to the screenshot protection card
  await page.evaluate(() => {
    const card = document.getElementById('toggleScreenshotProtection');
    if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/21_Settings_Toggle_View.png' });
  console.log('📸 Capture enregistrée : 21_Settings_Toggle_View.png');

  await browser.close();
}

runTest().catch(console.error);
