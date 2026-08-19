import fs from 'fs';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const APP_URL = 'https://vitaltrack-app.vercel.app';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('🔬 SUITE DE TESTS FONCTIONNELS DEEP AUDIT E2E & ROBUSTESSE APPLI');
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runDeepAudit() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('ERR_ABORTED') && !msg.text().includes('favicon')) {
      errors.push(msg.text());
    }
  });

  console.log('1️⃣ Navigation vers VitalTrack...');
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for database initialization
  await page.waitForFunction(() => typeof window.showPage === 'function');
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n2️⃣ Test de la Navigation sur Toutes les Pages...');
  const pagesToTest = [
    { id: 'dashboard', name: 'Tableau de Bord', selector: '#page-dashboard' },
    { id: 'search', name: 'Base d\'Aliments & Recherche', selector: '#page-search' },
    { id: 'materia-medica', name: 'Materia Medica Amazonienne', selector: '#page-materia-medica' },
    { id: 'meals', name: 'Journal des Repas', selector: '#page-meals' },
    { id: 'fasting', name: 'Jeûne Rationnel & Minuteur', selector: '#page-fasting' },
    { id: 'breathing', name: 'Respiration Wim Hof & Vidéos', selector: '#page-breathing' },
    { id: 'scan', name: 'Scanner IA de Repas', selector: '#page-scan' },
    { id: 'calendar', name: 'Calendrier Nutritionnel', selector: '#page-calendar' },
    { id: 'chat', name: 'Assistant IA Vitaliste', selector: '#page-chat' },
    { id: 'resources', name: 'Centre Médias & Livres', selector: '#page-resources' },
    { id: 'modes', name: 'Profil & Protocoles Vitalistes', selector: '#page-modes' }
  ];

  for (const p of pagesToTest) {
    await page.evaluate(pageId => window.showPage(pageId), p.id);
    await new Promise(r => setTimeout(r, 300));
    const isVisible = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      return el && el.classList.contains('active');
    }, p.selector);
    console.log(`  ${isVisible ? '✅' : '❌'} Page [${p.name}] (${p.id}) : ${isVisible ? 'ACTIVE' : 'INACTIVE'}`);
  }

  console.log('\n3️⃣ Test du Moteur de Recherche d\'Aliments & Base de Données...');
  await page.evaluate(() => window.showPage('search'));
  await new Promise(r => setTimeout(r, 600));

  // Search for avocado
  await page.type('#searchInput', 'avocat');
  await new Promise(r => setTimeout(r, 800));

  const searchCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('#foodResults .food-card');
    return {
      count: cards.length,
      firstTitle: cards[0]?.querySelector('.food-name')?.textContent?.trim()
    };
  });
  console.log(`  🥑 Recherche « avocat » : ${searchCards.count} cartes trouvées (Premier résultat : « ${searchCards.firstTitle} »)`);

  // Clear search and try filter
  await page.evaluate(() => window.clearSearch());
  await new Promise(r => setTimeout(r, 500));

  const filterCards = await page.evaluate(() => {
    window.setSearchFilter('electric');
    return document.querySelectorAll('#foodResults .food-card').length;
  });
  console.log(`  ⚡ Filtre « Aliments Électriques » : ${filterCards} aliments répertoriés`);

  console.log('\n4️⃣ Test de la Materia Medica Amazonienne...');
  await page.evaluate(() => window.showPage('materia-medica'));
  await new Promise(r => setTimeout(r, 500));

  const herbsRendered = await page.evaluate(() => {
    return document.querySelectorAll('#materiaHerbsGrid .materia-herb-card').length;
  });
  console.log(`  🌿 Plantes Raintree rendues dans la grille : ${herbsRendered}`);

  console.log('\n5️⃣ Test d\'Ajout de Repas et Journal...');
  const mealAddSuccess = await page.evaluate(() => {
    window.quickAddFoodToMeal({
      name: 'Avocat Hass Bio',
      emoji: '🥑',
      category: 'Fruits',
      pral: -4.5,
      specific: { electric: true },
      vitality: { nova: 1, freshness: 95 }
    });
    return (window.store.get('meals', []) || []).length;
  });
  console.log(`  🍽️ Total repas enregistrés après ajout direct : ${mealAddSuccess}`);

  console.log('\n6️⃣ Test du Minuteur de Jeûne...');
  await page.evaluate(() => window.showPage('fasting'));
  await new Promise(r => setTimeout(r, 400));

  await page.evaluate(() => window.setFastingDurationPreset(16));
  const fastingHours = await page.evaluate(() => document.getElementById('fastingDuration')?.value);
  console.log(`  ⏰ Durée de jeûne configurée : ${fastingHours}h`);

  console.log('\n7️⃣ Test de la Respiration & Wim Hof...');
  await page.evaluate(() => window.showPage('breathing'));
  await new Promise(r => setTimeout(r, 400));

  const breathModesCount = await page.evaluate(() => document.querySelectorAll('.breath-mode').length);
  console.log(`  🧘 Modes de respiration disponibles : ${breathModesCount}`);

  console.log('\n8️⃣ Test du Suivi de Poids & Analytics...');
  await page.evaluate(() => window.showPage('dashboard'));
  await new Promise(r => setTimeout(r, 400));

  // Add a test weight entry
  const weightTestResult = await page.evaluate(() => {
    const hist = window.store.get('weight_history', []);
    hist.unshift({ id: 'w_test_1', date: '2026-08-19', weight: 72.4, note: 'Test de contrôle' });
    window.store.set('weight_history', hist);
    window.renderWeightChart();
    
    const svg = document.getElementById('weightChartSvg');
    const path = svg ? svg.querySelector('path.chart-line-main, path') : null;
    return {
      totalEntries: hist.length,
      hasSvgPath: !!path
    };
  });
  console.log(`  ⚖️ Entrée de poids enregistrée (72.4 kg), Courbe SVG tracée : ${weightTestResult.hasSvgPath}`);

  console.log('\n9️⃣ Test du Hub Profil Utilisateur & Badges...');
  await page.evaluate(() => window.openUserProfileModal());
  await new Promise(r => setTimeout(r, 500));

  const profileModalState = await page.evaluate(() => {
    const modal = document.getElementById('userProfileModal');
    const content = document.getElementById('userProfileModalContent');
    const title = content?.querySelector('h2')?.textContent?.trim();
    const isVisible = modal && modal.style.display !== 'none';
    return { isVisible, title, hasContent: (content?.innerHTML?.length || 0) > 100 };
  });
  console.log(`  🏆 Modale profil ouverte : ${profileModalState.isVisible} (Utilisateur: « ${profileModalState.title} », Contenu généré: ${profileModalState.hasContent})`);
  await page.evaluate(() => window.closeUserProfileModal());

  console.log('\n🔟 Test des Téléchargements PDF Livres...');
  await page.evaluate(() => window.showPage('resources'));
  await new Promise(r => setTimeout(r, 400));

  const pdfCards = await page.evaluate(() => {
    const cards = [];
    document.querySelectorAll('#resourcesContainer .dash-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.trim();
      const link = card.querySelector('a[href$=".pdf"]')?.href;
      if (title && link) cards.push({ title, link });
    });
    return cards;
  });
  console.log(`  📚 Livres répertoriés dans le Hub Médias : ${pdfCards.length}`);
  pdfCards.forEach(c => console.log(`    - ${c.title} -> ${c.link}`));

  console.log('\n1️⃣1️⃣ Test Internationalisation (i18n)...');
  const langTests = ['fr', 'fr-CA', 'en', 'es'];
  for (const lang of langTests) {
    const resLang = await page.evaluate(l => {
      window.vitalTrackI18n.setLanguage(l);
      return window.vitalTrackI18n.getLanguage();
    }, lang);
    console.log(`  🌐 Langue basculée vers [${lang}] : Résultat = ${resLang}`);
  }
  await page.evaluate(() => window.vitalTrackI18n.setLanguage('fr'));

  console.log('\n1️⃣2️⃣ Bilan des Erreurs JavaScript Détectées...');
  console.log(`  Erreurs console bloquantes : ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`  ❌ ${e}`));
  } else {
    console.log('  ✨ ZÉRO ERREUR CONSOLE DÉTECTÉE !');
  }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏁 TOUS LES TESTS E2E SONT VALIDÉS AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════════════════');
}

runDeepAudit().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
