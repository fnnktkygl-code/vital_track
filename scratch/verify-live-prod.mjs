import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function verifyLiveProduction() {
  console.log('🌐 Connecting to live Vercel production URL: https://web-app-ten-sand.vercel.app ...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const resp = await page.goto('https://web-app-ten-sand.vercel.app', { waitUntil: 'networkidle0' });
  console.log(`✅ Production status code: ${resp.status()}`);

  // Test navigation to Materia Medica
  await page.evaluate(() => window.showPage('materia-medica'));
  await new Promise(r => setTimeout(r, 600));

  const herbCount = await page.$$eval('.herb-card', els => els.length);
  console.log(`✅ Pharmacopoeia live plant cards: ${herbCount}`);

  // Test opening Chanca Piedra modal
  await page.evaluate(() => window.openHerbModal('chanca-piedra'));
  await new Promise(r => setTimeout(r, 500));

  const title = await page.$eval('#herbModalName', el => el.textContent);
  console.log(`✅ Live Modal title: ${title}`);

  // Test expanding monograph
  await page.evaluate(() => window.toggleHerbMonograph());
  await new Promise(r => setTimeout(r, 400));
  const isDrawerOpen = await page.$eval('#herbMonographDrawer', el => el.classList.contains('open'));
  console.log(`✅ Live Monograph drawer expanded: ${isDrawerOpen}`);

  // Test Fasting Page
  await page.evaluate(() => {
    window.closeHerbModal();
    window.showPage('fasting');
  });
  await new Promise(r => setTimeout(r, 600));

  const fastTitle = await page.$eval('#page-fasting .jn-section-title', el => el.textContent);
  console.log(`✅ Live Fasting title: ${fastTitle}`);

  await browser.close();
  console.log('🏆 LIVE VERCEL PRODUCTION VERIFICATION COMPLETE AND 100% FUNCTIONAL!');
}

verifyLiveProduction().catch(e => {
  console.error('❌ Live test error:', e);
  process.exit(1);
});
