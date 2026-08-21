import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import assert from 'assert';

console.log('═══════════════════════════════════════════════════════════');
console.log('🚀 TEST E2E NAVIGATION MULTILINGUE & STABILITÉ DU ROUTEUR');
console.log('═══════════════════════════════════════════════════════════\n');

async function run() {
  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5240 }
  });
  await server.listen();
  const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5240';

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  let passed = 0;
  function check(desc, cond) {
    if (cond) {
      console.log(`  ✅ ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ ÉCHEC : ${desc}`);
      process.exit(1);
    }
  }

  // 1. Initial State
  const initialPage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('La page initiale est bien "page-dashboard"', initialPage === 'page-dashboard');

  // 2. Bascule en anglais via le bouton du header
  console.log('\n🌐 [TEST 1] Bascule de langue vers l\'Anglais (EN)...');
  await page.evaluate(() => {
    window.vitalTrackI18n.setLanguage('en');
  });
  await new Promise(r => setTimeout(r, 400));

  const currentLang = await page.evaluate(() => window.vitalTrackI18n.getLanguage());
  check('La langue active est bien "en"', currentLang === 'en');

  // 3. Clic sur Desktop Sidebar : Recipes (Recettes)
  console.log('\n🖥️ [TEST 2] Navigation Desktop en mode Anglais...');
  await page.evaluate(() => {
    const link = document.querySelector('.sidebar-link[data-page="recipes"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  let activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Après clic sur Recipes, la page active reste "page-recipes" (pas de rebond dashboard)', activePage === 'page-recipes');

  // 4. Clic sur Desktop Sidebar : Deep Search
  await page.evaluate(() => {
    const link = document.querySelector('.sidebar-link[data-page="deep-search"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Après clic sur Deep Search, la page active reste "page-deep-search"', activePage === 'page-deep-search');

  // 5. Clic sur Desktop Sidebar : Chat
  await page.evaluate(() => {
    const link = document.querySelector('.sidebar-link[data-page="chat"]');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Après clic sur Chat, la page active reste "page-chat"', activePage === 'page-chat');

  // 6. Test Mobile View & Bottom Navigation
  console.log('\n📱 [TEST 3] Navigation Mobile & Bottom Bar en mode Anglais...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 400));

  // Clic sur Scan dans le bottom nav
  await page.evaluate(() => {
    const scanBtn = document.querySelector('.bnav-item[data-page="scan"]');
    if (scanBtn) scanBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Sur Mobile EN, clic sur Scan -> reste sur "page-scan"', activePage === 'page-scan');

  // Clic sur Plan (calendar) dans le bottom nav
  await page.evaluate(() => {
    const calBtn = document.querySelector('.bnav-item[data-page="calendar"]');
    if (calBtn) calBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Sur Mobile EN, clic sur Plan -> reste sur "page-calendar"', activePage === 'page-calendar');

  // Clic sur Jeûne (fasting) dans le bottom nav
  await page.evaluate(() => {
    const fastBtn = document.querySelector('.bnav-item[data-page="fasting"]');
    if (fastBtn) fastBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  
  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Sur Mobile EN, clic sur Fasting -> reste sur "page-fasting"', activePage === 'page-fasting');

  // 7. Test de More Drawer
  console.log('\n✨ [TEST 4] Test du Drawer "Plus" en mode Anglais...');
  await page.evaluate(() => {
    window.toggleMoreDrawer(true);
  });
  await new Promise(r => setTimeout(r, 400));

  const drawerOpen = await page.evaluate(() => document.getElementById('moreDrawer')?.classList.contains('open'));
  check('Le Drawer "Plus" s\'ouvre correctement', drawerOpen === true);

  // Clic sur Médias & Bibliothèque depuis le Drawer
  await page.evaluate(() => {
    const card = document.querySelector('.more-drawer-card[onclick*="resources"]');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 400));

  activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
  check('Depuis le Drawer, clic sur Resources -> reste sur "page-resources"', activePage === 'page-resources');

  // 8. Test de bascule de langue répétée (FR -> EN -> ES -> fr-CA -> FR)
  console.log('\n🔄 [TEST 5] Changements de langue successifs en conservant la page active...');
  for (const lang of ['es', 'fr-CA', 'fr', 'en']) {
    await page.evaluate((l) => {
      window.vitalTrackI18n.setLanguage(l);
    }, lang);
    await new Promise(r => setTimeout(r, 300));
    
    activePage = await page.evaluate(() => document.querySelector('.page.active')?.id);
    check(`Changement de langue vers "${lang}" conserve la page active "${activePage}"`, activePage === 'page-resources');
  }

  await browser.close();
  await server.close();

  console.log(`\n🎉 TOUS LES TESTS DE NAVIGATION (${passed}/12) SONT 100% VALIDÉS SANS REDIRECTION INTEMPESTIVE !\n`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
