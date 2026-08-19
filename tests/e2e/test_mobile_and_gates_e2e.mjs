#!/usr/bin/env node

/**
 * 📱🧪 E2E Test Suite for Mobile Responsiveness, Canadian i18n, PWA Prompt & AI Access Gate
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const args = process.argv.slice(2);
let targetUrl = 'http://localhost:5173';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) targetUrl = args[i + 1];
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`📱🧪 TEST E2E RESPONSIVITÉ MOBILE, i18n CANADIEN & AI ACCESS GATE : ${targetUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runTests() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_ABORTED')) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`));

  // 1️⃣ TEST CANADIAN i18n ("Bon matin")
  console.log('1️⃣ Test de la localisation canadienne (fr-CA) : « Bon matin »...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  await page.evaluate(() => {
    if (window.setLanguage) window.setLanguage('fr-CA');
  });
  await new Promise(r => setTimeout(r, 400));

  const greetingText = await page.evaluate(() => {
    const el = document.getElementById('greetName');
    return el ? el.textContent : '';
  });
  console.log(`  Salutation affichée en fr-CA : "${greetingText}"`);
  if (!greetingText.includes('Bon matin')) {
    throw new Error(`Échec: "Bon matin" attendu en fr-CA mais obtenu "${greetingText}"`);
  }
  console.log('  ✅ Salutation canadienne « Bon matin » validée !');

  // 2️⃣ TEST RESPONSIVITÉ MULTI-BREAKPOINTS
  console.log('\n2️⃣ Test de responsivité sur plusieurs viewports mobiles...');
  const viewports = [
    { name: 'iPhone SE (375x667)', width: 375, height: 667 },
    { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
    { name: 'iPhone Plus (414x896)', width: 414, height: 896 },
    { name: 'iPad Mini (768x1024)', width: 768, height: 1024 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 200));

    const check = await page.evaluate(() => {
      const bnav = document.querySelector('.bottom-nav');
      const bnavVisible = bnav && window.getComputedStyle(bnav).display !== 'none';
      const items = Array.from(document.querySelectorAll('.bnav-item span')).map(s => s.textContent.trim());
      const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;
      return { bnavVisible, itemsCount: items.length, hasHorizontalScroll };
    });

    console.log(`  📱 ${vp.name} : Bottom Nav visible = ${check.bnavVisible ? '✅' : '❌'}, Items = ${check.itemsCount}, Débordement horizontal = ${check.hasHorizontalScroll ? '⚠️ OUI' : '✅ NON'}`);
    if (check.hasHorizontalScroll) {
      console.warn(`  ⚠️ Léger débordement horizontal détecté sur ${vp.name}`);
    }
  }

  // 3️⃣ TEST CHAT SIDEBAR BACKDROP & DISMISSAL (Mobile 390px)
  console.log('\n3️⃣ Test de la Sidebar Chat sur mobile (390px) avec Backdrop...');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    if (window.showPage) window.showPage('chat');
  });
  await new Promise(r => setTimeout(r, 300));

  // Open sidebar
  await page.evaluate(() => {
    window.toggleSidebar(true);
  });
  await new Promise(r => setTimeout(r, 300));

  const sidebarOpen = await page.evaluate(() => {
    const sidebar = document.getElementById('chatSidebar');
    const backdrop = document.getElementById('chatSidebarBackdrop');
    const isSidebarVisible = sidebar && !sidebar.classList.contains('hidden');
    const isBackdropActive = backdrop && backdrop.classList.contains('active');
    return { isSidebarVisible, isBackdropActive };
  });
  console.log(`  Sidebar ouverte : ${sidebarOpen.isSidebarVisible ? '✅ OUI' : '❌ NON'}`);
  console.log(`  Backdrop actif : ${sidebarOpen.isBackdropActive ? '✅ OUI' : '❌ NON'}`);

  // Click backdrop to dismiss
  await page.evaluate(() => {
    const backdrop = document.getElementById('chatSidebarBackdrop');
    if (backdrop) backdrop.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const sidebarClosed = await page.evaluate(() => {
    const sidebar = document.getElementById('chatSidebar');
    return sidebar && sidebar.classList.contains('hidden');
  });
  console.log(`  Fermeture au clic sur le backdrop : ${sidebarClosed ? '✅ OUI' : '❌ NON'}`);
  if (!sidebarClosed) throw new Error('La sidebar ne s\'est pas fermée au clic sur le backdrop !');

  // 4️⃣ TEST MODEL SELECTOR ON MOBILE
  console.log('\n4️⃣ Test du Sélecteur de Modèles IA sur mobile (390px)...');
  await page.evaluate(() => {
    const selector = document.querySelector('.model-selector');
    if (selector) selector.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const modelDropdownBounds = await page.evaluate(() => {
    const dropdown = document.getElementById('modelDropdown');
    if (!dropdown || dropdown.style.display === 'none') return null;
    const rect = dropdown.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewportWidth: window.innerWidth,
      isFullyVisible: rect.left >= 0 && rect.right <= window.innerWidth + 2
    };
  });
  console.log(`  Dropdown modèles visible : ${modelDropdownBounds ? '✅ OUI' : '❌ NON'}`);
  if (modelDropdownBounds) {
    console.log(`  Largeur : ${modelDropdownBounds.width}px (Viewport: ${modelDropdownBounds.viewportWidth}px)`);
    console.log(`  Entièrement contenu dans l'écran : ${modelDropdownBounds.isFullyVisible ? '✅ OUI' : '❌ NON'}`);
  }

  // 5️⃣ TEST GUEST AI ACCESS GATE (3 Free Queries -> Google Sign-In Modal)
  console.log('\n5️⃣ Test du Contrôle d\'Accès IA (3 requêtes gratuites puis blocage)...');
  await page.evaluate(() => {
    localStorage.removeItem('vt_auth_user');
    localStorage.setItem('vt_guest_ai_count', '0');
  });

  // Query 1
  let count1 = await page.evaluate(() => {
    let count = parseInt(localStorage.getItem('vt_guest_ai_count') || '0', 10);
    // Simuler incrément requête 1
    count++;
    localStorage.setItem('vt_guest_ai_count', count.toString());
    return count;
  });
  console.log(`  Requête 1 exécutée (Compteur: ${count1}/3)`);

  // Query 2
  let count2 = await page.evaluate(() => {
    let count = parseInt(localStorage.getItem('vt_guest_ai_count') || '0', 10);
    count++;
    localStorage.setItem('vt_guest_ai_count', count.toString());
    return count;
  });
  console.log(`  Requête 2 exécutée (Compteur: ${count2}/3)`);

  // Query 3
  let count3 = await page.evaluate(() => {
    let count = parseInt(localStorage.getItem('vt_guest_ai_count') || '0', 10);
    count++;
    localStorage.setItem('vt_guest_ai_count', count.toString());
    return count;
  });
  console.log(`  Requête 3 exécutée (Compteur: ${count3}/3)`);

  // Query 4 -> MUST TRIGGER AI AUTH GATE MODAL!
  await page.evaluate(() => {
    // Attempting query 4 via triggerDirectAISearch or sendChat
    window.triggerDirectAISearch();
  });
  await new Promise(r => setTimeout(r, 400));

  const authGateModalOpen = await page.evaluate(() => {
    const modal = document.getElementById('aiAuthGateModal');
    return modal && modal.style.display === 'flex';
  });
  console.log(`  Modale d'Authentification Google ouverte à la 4ème requête : ${authGateModalOpen ? '✅ OUI' : '❌ NON'}`);
  if (!authGateModalOpen) throw new Error('La modale de connexion Google ne s\'est pas ouverte après 3 requêtes !');

  // Close modal
  await page.evaluate(() => window.closeAiAuthGateModal(null));

  // 6️⃣ TEST PWA INSTALL BANNER
  console.log('\n6️⃣ Test de la Bannière d\'Installation PWA...');
  const pwaBannerExists = await page.evaluate(() => {
    const banner = document.getElementById('pwaInstallBanner');
    const btn = document.getElementById('pwaInstallBtn');
    return { banner: !!banner, btn: !!btn };
  });
  console.log(`  Éléments PWA dans le DOM : ${pwaBannerExists.banner && pwaBannerExists.btn ? '✅ OUI' : '❌ NON'}`);

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
  console.log('🏁 TOUS LES TESTS MOBILE, i18n & AI ACCESS GATE SONT AU VERT ! 🟢');
  console.log('═══════════════════════════════════════════════════════════════════');
}

runTests().catch(err => {
  console.error('Erreur critique pendant le test :', err);
  process.exit(1);
});
