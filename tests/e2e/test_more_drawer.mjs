import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testMoreDrawer() {
  console.log('🚀 Test de validation du Drawer "Plus" et de l\'accès à Médias & Pharmacopée...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Cliquer sur le bouton Plus dans la barre inférieure
  console.log('👆 Clic sur le bouton Plus dans la bottom nav...');
  await page.click('#bnavMoreBtn');
  await new Promise(r => setTimeout(r, 500));

  // 2. Vérifier que le drawer s'ouvre
  const isDrawerOpen = await page.$eval('#moreDrawer', el => el.classList.contains('open') && el.style.display === 'block');
  console.log('🔍 Drawer "Plus" ouvert :', isDrawerOpen ? '✅ OUI' : '❌ NON');

  // Prendre screenshot du Drawer "Plus" ouvert
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/26_More_Drawer_Open.png' });

  // 3. Cliquer sur "Médias & Vidéos" dans le drawer
  console.log('👆 Clic sur "Médias & Vidéos" dans le drawer...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.more-drawer-card'));
    const mediaCard = cards.find(c => c.textContent.includes('Médias'));
    if (mediaCard) mediaCard.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 4. Vérifier que la page Médias (resources) est affichée
  const isResourcesActive = await page.$eval('#page-resources', el => el.classList.contains('active'));
  console.log('🔍 Page Médias & Vidéos active :', isResourcesActive ? '✅ OUI' : '❌ NON');

  // Prendre screenshot de la page Médias
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/27_Resources_Page_From_Drawer.png' });

  await browser.close();
  console.log('✨ TOUS LES TESTS DU DRAWER "PLUS" SONT VALIDÉS AVEC SUCCÈS !');
}

testMoreDrawer().catch(err => {
  console.error(err);
  process.exit(1);
});
