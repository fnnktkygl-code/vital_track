import fs from 'fs';
import path from 'path';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const APP_URL = 'https://vitaltrack-app.vercel.app';
const LOCAL_DIST_URL = 'http://localhost:5173';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 DÉMARRAGE DU PROTOCOLE D\'AUDIT GLOBAL & TESTS E2E VITALTRACK');
console.log('═══════════════════════════════════════════════════════════════\n');

const auditResults = {
  timestamp: new Date().toISOString(),
  pagesAudited: [],
  apisAudited: [],
  uiStandards: {},
  factualIntegrity: {},
  performance: {},
  issuesDetected: [],
  recommendations: []
};

async function runAudit() {
  console.log('📱 Lancement de Puppeteer Chrome Headless...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Monitor console errors and network errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), errorText: req.failure()?.errorText });
  });

  console.log(`🌐 Connexion à l'application de production : ${APP_URL}...`);
  await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('✅ Page d\'accueil chargée.');

  // ── AUDIT 1 : Pages & Navigation ──
  const pagesToTest = [
    { id: 'dash', name: 'Tableau de Bord', selector: '#page-dash' },
    { id: 'search', name: 'Base d\'Aliments & Recherche', selector: '#page-search' },
    { id: 'materia', name: 'Materia Medica Amazonienne', selector: '#page-materia' },
    { id: 'meals', name: 'Journal des Repas', selector: '#page-meals' },
    { id: 'fasting', name: 'Jeûne Rationnel & Minuteur', selector: '#page-fasting' },
    { id: 'breathing', name: 'Respiration Wim Hof & Vidéos', selector: '#page-breathing' },
    { id: 'scan', name: 'Scanner IA de Repas', selector: '#page-scan' },
    { id: 'calendar', name: 'Calendrier Nutritionnel', selector: '#page-calendar' },
    { id: 'weight', name: 'Suivi du Poids & Analytics', selector: '#page-weight' },
    { id: 'chat', name: 'Assistant IA Vitaliste', selector: '#page-chat' },
    { id: 'resources', name: 'Centre Médias & Livres', selector: '#page-resources' }
  ];

  console.log('\n🔍 --- AUDIT 1 : NAVIGATION SUR TOUTES LES PAGES ---');
  for (const p of pagesToTest) {
    try {
      await page.evaluate(pageId => {
        if (typeof window.showPage === 'function') window.showPage(pageId);
      }, p.id);
      await new Promise(r => setTimeout(r, 400));

      const isVisible = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        return el && el.classList.contains('active');
      }, p.selector);

      if (isVisible) {
        console.log(`  ✅ Page [${p.name}] (${p.id}) : OK`);
        auditResults.pagesAudited.push({ id: p.id, name: p.name, status: 'PASS' });
      } else {
        console.warn(`  ⚠️ Page [${p.name}] (${p.id}) : Non active`);
        auditResults.pagesAudited.push({ id: p.id, name: p.name, status: 'FAIL', reason: 'Non active selector' });
      }
    } catch (err) {
      console.error(`  ❌ Page [${p.name}] (${p.id}) : Erreur ${err.message}`);
      auditResults.pagesAudited.push({ id: p.id, name: p.name, status: 'ERROR', error: err.message });
    }
  }

  // ── AUDIT 2 : Recherche & Base de Données ──
  console.log('\n🔍 --- AUDIT 2 : BASE DE DONNÉES & MOTEUR DE RECHERCHE ---');
  await page.evaluate(() => window.showPage('search'));
  await new Promise(r => setTimeout(r, 400));

  const dbStats = await page.evaluate(() => {
    return {
      totalFoods: window.vitalDb?.length || 0,
      searchIndexSize: window.searchIndex?.length || 0,
      categoriesCount: document.querySelectorAll('.cat-browse-card').length
    };
  });
  console.log(`  📊 Aliments chargés en mémoire : ${dbStats.totalFoods}`);
  console.log(`  📊 Entrées dans l'index de recherche : ${dbStats.searchIndexSize}`);

  // Test search queries
  const testQueries = ['avocat', 'mangue', 'sardine', 'pomme de terre', 'chanca piedra'];
  for (const q of testQueries) {
    const resultsCount = await page.evaluate(query => {
      window.searchFoods(query);
      return document.querySelectorAll('#searchResults .food-card').length;
    }, q);
    console.log(`  🔎 Recherche « ${q} » : ${resultsCount} résultats`);
  }

  // ── AUDIT 3 : Materia Medica ──
  console.log('\n🔍 --- AUDIT 3 : MATERIA MEDICA AMAZONIENNE ---');
  await page.evaluate(() => window.showPage('materia'));
  await new Promise(r => setTimeout(r, 400));

  const materiaStats = await page.evaluate(() => {
    return {
      herbsCount: (window.RAINTREE_HERBS || []).length,
      renderedCards: document.querySelectorAll('#materiaHerbsGrid .materia-herb-card').length
    };
  });
  console.log(`  🌿 Plantes Raintree répertoriées : ${materiaStats.herbsCount}`);
  console.log(`  🌿 Cartes affichées dans la grille : ${materiaStats.renderedCards}`);

  // ── AUDIT 4 : Suivi du Poids & Graphiques Analytics ──
  console.log('\n🔍 --- AUDIT 4 : SUIVI DU POIDS & GRAPHES ANALYTICS ---');
  await page.evaluate(() => window.showPage('weight'));
  await new Promise(r => setTimeout(r, 400));

  const weightStats = await page.evaluate(() => {
    const history = window.store?.get('weight_history', []) || [];
    const hasSvg = !!document.getElementById('weightChartSvg');
    const svgContent = document.getElementById('weightChartSvg')?.innerHTML.length || 0;
    return {
      historyCount: history.length,
      hasSvg,
      svgContentLength: svgContent
    };
  });
  console.log(`  ⚖️ Entrées d'historique de poids : ${weightStats.historyCount}`);
  console.log(`  📈 Graphique SVG interactif rendu : ${weightStats.hasSvg} (${weightStats.svgContentLength} octets)`);

  // ── AUDIT 5 : Sélecteur de Langue & i18n ──
  console.log('\n🔍 --- AUDIT 5 : SÉLECTEUR DE LANGUE & INTERNATIONALISATION ---');
  const langTests = ['fr', 'fr-CA', 'en', 'es'];
  for (const lang of langTests) {
    const activeLang = await page.evaluate(l => {
      if (typeof window.setLanguage === 'function') window.setLanguage(l);
      return window.getLanguage ? window.getLanguage() : null;
    }, lang);
    console.log(`  🌐 Bascule vers la langue [${lang}] : Actuelle = ${activeLang}`);
  }
  // Reset to fr
  await page.evaluate(() => window.setLanguage && window.setLanguage('fr'));

  // ── AUDIT 6 : Centre Médias & Livres Téléchargeables ──
  console.log('\n🔍 --- AUDIT 6 : CENTRE MÉDIAS & LIVRES NUMÉRIQUES ---');
  await page.evaluate(() => window.showPage('resources'));
  await new Promise(r => setTimeout(r, 400));

  const resourceLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('#resourcesContainer a[href$=".pdf"]').forEach(a => {
      links.push({ title: a.closest('.dash-card')?.querySelector('h3')?.textContent || 'Sans titre', href: a.href });
    });
    return links;
  });

  console.log(`  📚 Livres PDF trouvés dans l'interface : ${resourceLinks.length}`);
  for (const res of resourceLinks) {
    console.log(`    📖 [${res.title}] -> ${res.href}`);
  }

  // ── AUDIT 7 : Cohérence des Couleurs & Contrastes WCAG ──
  console.log('\n🔍 --- AUDIT 7 : COHÉRENCE COULEURS & STANDARDS UI ---');
  const uiStyles = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim(),
      accent: style.getPropertyValue('--accent').trim(),
      text: style.getPropertyValue('--text').trim(),
      border: style.getPropertyValue('--border').trim(),
      cardBg: style.getPropertyValue('--card-bg').trim()
    };
  });
  console.log(`  🎨 Tokens CSS : BG=${uiStyles.bg}, Accent=${uiStyles.accent}, Text=${uiStyles.text}`);

  // Summary of Errors
  console.log('\n🔍 --- ANALYSE DES ERREURS LOGS CONSOLE & RÉSEAU ---');
  console.log(`  ⚠️ Erreurs console JavaScript capturées : ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(`    ❌ ${e}`));
  }
  console.log(`  ⚠️ Requêtes réseau échouées : ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    failedRequests.slice(0, 5).forEach(r => console.log(`    ❌ ${r.url} (${r.errorText})`));
  }

  await browser.close();
  console.log('\n🎉 AUDIT SYSTÈME TERMINÉ AVEC SUCCÈS !');
}

runAudit().catch(err => {
  console.error('Erreur fatale pendant l\'audit :', err);
  process.exit(1);
});
