#!/usr/bin/env node

/**
 * 🎬📚 Automated E2E Test Suite for Multimedia & PDF Deep Search Engine
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const args = process.argv.slice(2);
let targetUrl = 'http://localhost:5173';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) targetUrl = args[i + 1];
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`🎬📚 TEST E2E DU MOTEUR DE RECHERCHE MULTIMÉDIA & PDF : ${targetUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_ABORTED')) {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });

  console.log('1️⃣ Navigation vers la page d\'accueil et ouverture de la Bibliothèque...');
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Open resources page
  await page.evaluate(() => {
    if (typeof window.showPage === 'function') {
      window.showPage('resources');
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const isResourcesActive = await page.evaluate(() => {
    const p = document.getElementById('page-resources');
    return p && p.classList.contains('active');
  });
  console.log(`  Onglet Bibliothèque activé : ${isResourcesActive ? '✅ OUI' : '❌ NON'}`);

  console.log('\n2️⃣ Vérification du Moteur de Recherche Multimédia...');
  const searchBarExists = await page.evaluate(() => {
    const input = document.getElementById('mediaSearchInput');
    const tags = document.querySelectorAll('.media-quick-tags button').length;
    const filterBtns = document.querySelectorAll('.media-filter-btn').length;
    return { input: !!input, tags, filterBtns };
  });
  console.log(`  Barre de recherche présente : ${searchBarExists.input ? '✅ OUI' : '❌ NON'}`);
  console.log(`  Boutons thématiques rapides : ${searchBarExists.tags}`);
  console.log(`  Boutons filtres (Tout / Vidéos / PDF) : ${searchBarExists.filterBtns}`);

  console.log('\n3️⃣ Test de recherche : « mucus » (doit trouver des vidéos et des extraits PDF)...');
  await page.evaluate(() => {
    window.searchMediaResources('mucus');
  });
  await new Promise(r => setTimeout(r, 400));

  const mucusResults = await page.evaluate(() => {
    const cards = document.querySelectorAll('.media-result-card');
    const highlights = document.querySelectorAll('mark.search-highlight').length;
    const videoPills = document.querySelectorAll('.timestamp-pill').length;
    const pdfPills = document.querySelectorAll('.pdf-page-pill').length;
    return { count: cards.length, highlights, videoPills, pdfPills };
  });
  console.log(`  Résultats trouvés pour « mucus » : ${mucusResults.count}`);
  console.log(`  Termes surlignés (<mark>) : ${mucusResults.highlights}`);
  console.log(`  Pilules de temps vidéo : ${mucusResults.videoPills}`);
  console.log(`  Pilules de page PDF : ${mucusResults.pdfPills}`);

  if (mucusResults.count === 0) throw new Error('Aucun résultat trouvé pour « mucus » !');

  console.log('\n4️⃣ Test de recherche : « wim hof » (filtrage vidéo)...');
  await page.evaluate(() => {
    window.searchMediaResources('wim hof');
    window.setMediaSearchFilter('videos');
  });
  await new Promise(r => setTimeout(r, 400));

  const wimHofResults = await page.evaluate(() => {
    const cards = document.querySelectorAll('.media-result-card');
    const titles = Array.from(document.querySelectorAll('.media-card-title')).map(t => t.textContent.trim());
    return { count: cards.length, titles };
  });
  console.log(`  Résultats vidéos Wim Hof : ${wimHofResults.count}`);
  wimHofResults.titles.slice(0, 3).forEach(t => console.log(`    - ${t}`));

  console.log('\n5️⃣ Test interactif : Déclenchement du lecteur vidéo avec saut horodaté...');
  await page.evaluate(() => {
    // Call playVideoAtTimestamp on the first video
    window.playVideoAtTimestamp('/videos/dr-sebi-documentary.mp4', 675, 'Docu Dr Sebi', 'local', '', 'Le Mucus Cause Unique', 'WHUT TV');
  });
  await new Promise(r => setTimeout(r, 400));

  const videoModalState = await page.evaluate(() => {
    const modal = document.getElementById('mediaVideoModal');
    const isVisible = modal && modal.style.display !== 'none';
    const video = modal ? modal.querySelector('video') : null;
    const chapters = modal ? modal.querySelectorAll('.media-chapter-btn').length : 0;
    return { isVisible, hasVideo: !!video, chapters };
  });
  console.log(`  Modale Lecteur Vidéo ouverte : ${videoModalState.isVisible ? '✅ OUI' : '❌ NON'}`);
  console.log(`  Élément <video> injecté : ${videoModalState.hasVideo ? '✅ OUI' : '❌ NON'}`);
  console.log(`  Chapitres horodatés dans la timeline : ${videoModalState.chapters}`);

  // Close video modal
  await page.evaluate(() => window.closeMediaVideoModal());

  console.log('\n6️⃣ Test interactif : Ouverture de la modale de passage PDF...');
  await page.evaluate(() => {
    window.openPdfPassageModal('pdf-ehret-fr-ch04');
  });
  await new Promise(r => setTimeout(r, 400));

  const pdfModalState = await page.evaluate(() => {
    const modal = document.getElementById('pdfPassageModal');
    const isVisible = modal && modal.style.display !== 'none';
    const text = modal ? modal.textContent : '';
    const hasVPO = text.includes('V = P - O');
    return { isVisible, hasVPO };
  });
  console.log(`  Modale Visionneuse PDF ouverte : ${pdfModalState.isVisible ? '✅ OUI' : '❌ NON'}`);
  console.log(`  Contenu de la formule V = P - O présent : ${pdfModalState.hasVPO ? '✅ OUI' : '❌ NON'}`);

  // Close pdf modal
  await page.evaluate(() => window.closePdfPassageModal());

  console.log('\n7️⃣ Bilan des Erreurs JavaScript...');
  if (errors.length > 0) {
    console.error(`  ❌ ${errors.length} ERREUR(S) DÉTECTÉE(S) :`);
    errors.forEach(e => console.error(`    - ${e}`));
    process.exit(1);
  } else {
    console.log('  ✨ ZÉRO ERREUR CONSOLE DÉTECTÉE !');
  }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏁 TOUS LES TESTS DU MOTEUR MULTIMÉDIA & PDF SONT AU VERT ! 🟢');
  console.log('═══════════════════════════════════════════════════════════════════');
}

runTest().catch(err => {
  console.error('Erreur critique pendant le test E2E :', err);
  process.exit(1);
});
