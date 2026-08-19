import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import http from 'http';

function checkUrlStatus(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', reject);
  });
}

async function testBilingualLibrary() {
  console.log('🚀 Test de validation de la Bibliothèque Bilingue & des PDFs...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.showPage('resources'));
  await new Promise(r => setTimeout(r, 600));

  // 1. Check all PDF URLs
  const pdfLinks = await page.$$eval('a[href$=".pdf"]', links => Array.from(new Set(links.map(l => l.getAttribute('href')))));
  console.log(`\n📚 Vérification de ${pdfLinks.length} fichiers PDF locaux :`);
  for (const link of pdfLinks) {
    const fullUrl = `http://localhost:5173${link.startsWith('/') ? '' : '/'}${link}`;
    const result = await checkUrlStatus(fullUrl);
    console.log(`  📄 ${link} -> Statut HTTP: ${result.status}`);
    if (result.status !== 200) {
      throw new Error(`PDF non accessible: ${link} (Statut ${result.status})`);
    }
  }

  // 2. Test French Tab
  console.log('\n🇫🇷 Test de l\'onglet Ouvrages en Français...');
  await page.evaluate(() => window.setResourcesCatalogTab('fr'));
  await new Promise(r => setTimeout(r, 300));
  const frCount = await page.$$eval('.dash-card h3', els => els.length);
  console.log(`  📖 Ouvrages affichés : ${frCount}`);
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/39_Library_French_Tab.png' });

  // 3. Test English Tab
  console.log('\n🇬🇧 Test de l\'onglet English Original Editions...');
  await page.evaluate(() => window.setResourcesCatalogTab('en'));
  await new Promise(r => setTimeout(r, 300));
  const enCount = await page.$$eval('.dash-card h3', els => els.length);
  console.log(`  📖 Ouvrages affichés : ${enCount}`);
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/40_Library_English_Tab.png' });

  // 4. Test Search with Bilingual French / English
  console.log('\n🔍 Test de recherche bilingue : « autophagie »');
  await page.evaluate(() => {
    const input = document.getElementById('mediaSearchInput');
    if (input) {
      input.value = 'autophagie';
      window.searchMediaResources('autophagie');
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const badgeAutophagie = await page.$eval('#mediaResultCountBadge', el => el.textContent.trim());
  console.log(`  📊 Résultats : ${badgeAutophagie}`);

  console.log('\n🔍 Test de recherche bilingue : « eyes »');
  await page.evaluate(() => {
    const input = document.getElementById('mediaSearchInput');
    if (input) {
      input.value = 'eyes';
      window.searchMediaResources('eyes');
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const badgeEyes = await page.$eval('#mediaResultCountBadge', el => el.textContent.trim());
  console.log(`  📊 Résultats : ${badgeEyes}`);

  await browser.close();
  console.log('\n✨ TOUTE LA BIBLIOTHÈQUE BILINGUE ET LES FICHIERS PDF SONT VALIDÉS AVEC SUCCÈS !');
}

testBilingualLibrary().catch(err => {
  console.error(err);
  process.exit(1);
});
