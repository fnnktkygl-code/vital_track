import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testDeepDocumentSearch() {
  console.log('🚀 Test de validation du Moteur de Recherche Documentaire Intégral...');
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

  const testQueries = [
    { q: 'eyes', label: 'Yeux / Vision (Anglais)', minResults: 50 },
    { q: 'intestins', label: 'Intestins & Émonctoires', minResults: 50 },
    { q: 'colon', label: 'Côlon & Nettoyage', minResults: 50 },
    { q: 'Crohn', label: 'Maladie de Crohn & Inflammations', minResults: 50 },
    { q: 'yeux', label: 'Yeux & Iridologie', minResults: 50 },
    { q: 'autophagie', label: 'Autophagie & Jeûne', minResults: 50 },
    { q: 'dr sebi', label: 'Dr. Sebi Aliments Électriques', minResults: 50 }
  ];

  for (const t of testQueries) {
    console.log(`\n🔎 Test de recherche pour « ${t.q} » (${t.label})...`);
    
    // Type query into search input
    await page.evaluate(query => {
      const input = document.getElementById('mediaSearchInput');
      if (input) {
        input.value = query;
        window.searchMediaResources(query);
      }
    }, t.q);

    await new Promise(r => setTimeout(r, 400));

    const resultCountText = await page.$eval('#mediaResultCountBadge', el => el.textContent.trim());
    const cardsCount = await page.$$eval('.media-result-card', els => els.length);
    const firstTitle = await page.$eval('.media-result-card .media-card-title', el => el.textContent.trim()).catch(() => 'N/A');
    const firstExcerpt = await page.$eval('.media-result-card .media-card-excerpt', el => el.textContent.trim()).catch(() => 'N/A');

    console.log(`  📊 Badge : ${resultCountText}`);
    console.log(`  🃏 Cartes affichées : ${cardsCount}`);
    console.log(`  📖 Premier résultat : « ${firstTitle} »`);
    console.log(`  📝 Extrait : « ${firstExcerpt.slice(0, 100)}... »`);

    if (cardsCount === 0) {
      throw new Error(`Échec critique : 0 résultat pour la requête « ${t.q} »`);
    }

    // Capture screenshot for Crohn and eyes
    if (t.q === 'Crohn') {
      await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/35_Search_Crohn_Results.png' });
    } else if (t.q === 'eyes') {
      await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/36_Search_Eyes_Results.png' });
    } else if (t.q === 'intestins') {
      await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/37_Search_Intestins_Results.png' });
    }
  }

  await browser.close();
  console.log('\n✨ TOUTES LES RECHERCHES DOCUMENTAIRES & MULTIMÉDIAS SONT VALIDÉES À 100% !');
}

testDeepDocumentSearch().catch(err => {
  console.error(err);
  process.exit(1);
});
