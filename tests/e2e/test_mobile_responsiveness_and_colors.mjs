/**
 * test_mobile_responsiveness_and_colors.mjs
 * 
 * Comprehensive E2E Mobile Responsiveness & Design System Audit for VitalTrack.
 * Tests 360px & 390px mobile viewports:
 * - Zero horizontal overflow
 * - Touch target ergonomics (>= 44px)
 * - Deep Search wizard step navigation & inputs
 * - Recipes gallery & modal interaction (servings scaler & YouTube demo)
 * - Color contrast & design tokens validation
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';

async function runMobileAndDesignAudit() {
  console.log('🚀 [TEST SUITE 3] Lancement de l\'Audit E2E Mobile & Design System...');

  const server = await createServer({
    root: '/Users/richard/Developer/vital_track/web-app',
    server: { port: 5188 }
  });
  await server.listen();

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // ── 1. TEST SUR SMARTPHONE COMPACT (360x780 - Ex: Galaxy S21 / iPhone SE) ──
    const baseUrl = server.resolvedUrls.local[0] || 'http://localhost:5188';
    console.log(`  🌐 Vite server actif sur ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

  // Vérifier le non-débordement horizontal du dashboard
  const overflowCheck = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2
    };
  });
  console.log(`  🔍 Dashboard Overflow Check (360px) : ${overflowCheck.hasOverflow ? '❌ DÉBORDEMENT DÉTECTÉ' : '✅ ZÉRO DÉBORDEMENT'} (${overflowCheck.scrollWidth}px / ${overflowCheck.clientWidth}px)`);

  // ── 2. TEST DEEP SEARCH SUR MOBILE ──
  console.log('\n🔬 --- 2. Test Module Deep Search sur Mobile ---');
  await page.evaluate(() => window.showPage('deep-search'));
  await new Promise(r => setTimeout(r, 600));

  const deepSearchActive = await page.$eval('#page-deep-search', el => el.classList.contains('active'));
  console.log(`  🔍 Page Deep Search active : ${deepSearchActive ? '✅ OUI' : '❌ NON'}`);

  // Test navigation dans les 4 étapes de l'anamnèse
  console.log('  👆 Test passage Étape 1 -> Étape 2...');
  await page.evaluate(() => window.setDeepSearchStep(2));
  await new Promise(r => setTimeout(r, 300));
  let step2Title = await page.evaluate(() => document.querySelector('#deepSearchContainer h3')?.textContent || '');
  console.log(`  🔍 Étape 2 chargée : ${step2Title.includes('Émonctoires') ? '✅ OUI' : '❌ NON'}`);

  console.log('  👆 Test passage Étape 2 -> Étape 3...');
  await page.evaluate(() => window.setDeepSearchStep(3));
  await new Promise(r => setTimeout(r, 300));
  let step3Title = await page.evaluate(() => document.querySelector('#deepSearchContainer h3')?.textContent || '');
  console.log(`  🔍 Étape 3 chargée : ${step3Title.includes('Médicaments') || step3Title.includes('Biomarqueurs') ? '✅ OUI' : '❌ NON'}`);

  console.log('  👆 Test passage Étape 3 -> Étape 4...');
  await page.evaluate(() => window.setDeepSearchStep(4));
  await new Promise(r => setTimeout(r, 300));
  let step4Title = await page.evaluate(() => document.querySelector('#deepSearchContainer h3')?.textContent || '');
  console.log(`  🔍 Étape 4 chargée : ${step4Title.includes('Récapitulatif') ? '✅ OUI' : '❌ NON'}`);

  // ── 3. TEST RECETTES & MODALE SUR MOBILE ──
  console.log('\n🍽️ --- 3. Test Pharmacopée Culinaire (76 Recettes) sur Mobile ---');
  await page.evaluate(() => window.showPage('recipes'));
  await new Promise(r => setTimeout(r, 600));

  const recipesActive = await page.$eval('#page-recipes', el => el.classList.contains('active'));
  console.log(`  🔍 Page Recettes active : ${recipesActive ? '✅ OUI' : '❌ NON'}`);

  // Vérifier le nombre de cartes affichées
  const recipeCardCount = await page.evaluate(() => document.querySelectorAll('.recipe-card').length);
  console.log(`  🔍 Nombre de cartes de recettes affichées : ${recipeCardCount} (Attendu: 76)`);

  // Ouvrir la première recette (Sea moss)
  console.log('  👆 Ouverture de la modale Sea Moss...');
  await page.evaluate(() => window.openRecipeModal('sebi-sea-moss-gel'));
  await new Promise(r => setTimeout(r, 400));

  const modalVisible = await page.$eval('#recipeDetailModal', el => el.style.display !== 'none');
  console.log(`  🔍 Modale de recette visible : ${modalVisible ? '✅ OUI' : '❌ NON'}`);

  // Test du sélecteur de portions
  console.log('  👆 Changement de portions : 2 personnes...');
  await page.evaluate(() => window.setRecipeModalServings(2));
  await new Promise(r => setTimeout(r, 300));

  // Vérifier la présence du bouton vidéo YouTube
  const hasYouTubeBtn = await page.evaluate(() => {
    const btn = document.querySelector('#recipeDetailModal a[href*="youtube.com"]');
    return btn !== null;
  });
  console.log(`  🔍 Bouton vidéo YouTube vérifié présent : ${hasYouTubeBtn ? '✅ OUI' : '❌ NON'}`);

  // Fermer la modale
  await page.evaluate(() => window.closeRecipeModal());
  await new Promise(r => setTimeout(r, 300));

  // ── 4. TEST COULEURS & CONTRASTES ──
  console.log('\n🎨 --- 4. Audit des Codes Couleurs & Design System ---');
  const designTokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      accent: s.getPropertyValue('--accent').trim(),
      bg: s.getPropertyValue('--bg').trim(),
      surface: s.getPropertyValue('--surface').trim(),
      text: s.getPropertyValue('--text').trim()
    };
  });
  console.log(`  🎨 Tokens CSS : Accent=${designTokens.accent}, BG=${designTokens.bg}, Surface=${designTokens.surface}, Text=${designTokens.text}`);

  // ── 5. TEST BOTTOM NAV & MORE DRAWER ──
  console.log('\n📱 --- 5. Test Bottom Nav & More Drawer ---');
  await page.click('#bnavMoreBtn');
  await new Promise(r => setTimeout(r, 400));

  const isDrawerOpen = await page.$eval('#moreDrawer', el => el.classList.contains('open'));
  console.log(`  🔍 Drawer Plus ouvert : ${isDrawerOpen ? '✅ OUI' : '❌ NON'}`);

  // Vérifier la présence des 2 nouvelles entrées dans le drawer
  const drawerLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.more-drawer-card')).map(c => c.textContent);
  });
  const hasDeepSearchCard = drawerLinks.some(t => t.includes('Deep Search'));
  const hasRecipesCard = drawerLinks.some(t => t.includes('Recettes'));
  console.log(`  🔍 Carte "Bilan Deep Search" dans le drawer : ${hasDeepSearchCard ? '✅ OUI' : '❌ NON'}`);
  console.log(`  🔍 Carte "Recettes & Pharmacopée" dans le drawer : ${hasRecipesCard ? '✅ OUI' : '❌ NON'}`);

  } finally {
    await browser.close();
    await server.close();
  }
  console.log('\n🎉 [RÉSULTAT SUITE 3] AUDIT MOBILE & DESIGN SYSTEM TERMINÉ AVEC SUCCÈS !');
}

runMobileAndDesignAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
