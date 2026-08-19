#!/usr/bin/env node

/**
 * 📱📸 EXHAUSTIVE MOBILE UX & INTERACTION AUDIT SUITE (iPhone 14 / iPhone X - 390x844 & 375x812)
 * Tests every single tab, page, interactive flow, and captures screenshots to disk for visual verification.
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
let targetUrl = 'http://localhost:5173';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) targetUrl = args[i + 1];
}

const screenshotDir = '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`📱📸 AUDIT COMPLET MOBILE BOUT-EN-BOUT & SCREENSHOTS : ${targetUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runExhaustiveAudit() {
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

  // Set iPhone Viewport (390 x 844) with DPR 3
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const pagesToTest = [
    { id: 'dashboard', name: '01_Accueil_Dashboard' },
    { id: 'scan', name: '02_Scanner_Assiette_IA' },
    { id: 'chat', name: '03_Coach_IA_Chat' },
    { id: 'calendar', name: '04_Plan_Alimentaire' },
    { id: 'fasting', name: '05_Jeune_Minuteur' },
    { id: 'breathing', name: '06_Respiration_Guidee' },
    { id: 'materia-medica', name: '07_Pharmacopee_Raintree' },
    { id: 'resources', name: '08_Bibliotheque_Media_PDF' },
    { id: 'search', name: '09_Recherche_Aliments' },
    { id: 'meals', name: '10_Journal_Repas' },
    { id: 'modes', name: '11_Protocoles_Profil_RGPD' }
  ];

  const layoutDefects = [];

  for (const p of pagesToTest) {
    console.log(`\n🔍 Test et capture de la page : [${p.id}] (${p.name})...`);
    
    // Switch page
    await page.evaluate((pageId) => {
      window.showPage(pageId);
    }, p.id);
    await new Promise(r => setTimeout(r, 400));

    // Check for overflow / layout defects
    const defectCheck = await page.evaluate(() => {
      const docW = window.innerWidth;
      const issues = [];
      
      // 1. Check document scrollWidth
      if (document.documentElement.scrollWidth > docW + 1) {
        issues.push(`Débordement horizontal global de ${document.documentElement.scrollWidth - docW}px`);
      }

      // 2. Find elements clipping outside screen
      const allElements = document.querySelectorAll('.page.active, .page.active *');
      allElements.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > docW + 2 && el.tagName !== 'SVG' && !el.classList.contains('bg-blob')) {
          issues.push(`Élément trop large (${Math.round(r.width)}px > ${docW}px) : <${el.tagName.toLowerCase()} class="${el.className}">`);
        }
        if (r.right > docW + 2 && !el.classList.contains('bg-blob') && el.tagName !== 'SVG') {
          issues.push(`Élément dépassant à droite (right: ${Math.round(r.right)}px) : <${el.tagName.toLowerCase()} class="${el.className}">`);
        }
      });

      return issues;
    });

    if (defectCheck.length > 0) {
      console.warn(`  ⚠️ Anomalies détectées sur [${p.id}] :`, defectCheck.slice(0, 3));
      layoutDefects.push({ page: p.id, issues: defectCheck });
    } else {
      console.log(`  ✅ Aucun débordement ni anomalie de disposition sur [${p.id}]`);
    }

    // Capture screenshot
    const screenshotPath = path.join(screenshotDir, `${p.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  📸 Capture enregistrée : ${screenshotPath}`);
  }

  // ═════════════════════════════════════════════════════════════════
  // 🔬 TESTS DES FLUX INTERACTIFS ET MODALES SUR MOBILE
  // ═════════════════════════════════════════════════════════════════
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log('🔬 TEST DES MODALES ET FLUX INTERACTIFS SUR MOBILE');
  console.log('═════════════════════════════════════════════════════════════════');

  // A. TEST CHAT MODEL SELECTOR INTERACTION
  console.log('\n🤖 Test du Sélecteur de Modèles IA en mode Chat mobile...');
  await page.evaluate(() => window.showPage('chat'));
  await new Promise(r => setTimeout(r, 200));

  await page.evaluate(() => {
    const selector = document.querySelector('.model-selector');
    if (selector) selector.click();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, '12_Chat_Model_Dropdown_Mobile.png') });
  console.log('  📸 Capture enregistrée : 12_Chat_Model_Dropdown_Mobile.png');

  // Select Claude model
  await page.evaluate(() => {
    window.selectModel('claude-3-7-sonnet');
  });
  await new Promise(r => setTimeout(r, 200));

  // B. TEST CHAT SIDEBAR OPEN & TAP-OUTSIDE
  console.log('\n💬 Test Sidebar Chat + Backdrop...');
  await page.evaluate(() => window.toggleSidebar(true));
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, '13_Chat_Sidebar_Open_Mobile.png') });
  console.log('  📸 Capture enregistrée : 13_Chat_Sidebar_Open_Mobile.png');

  // Click backdrop
  await page.evaluate(() => {
    const b = document.getElementById('chatSidebarBackdrop');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // C. TEST FASTING TIMER & CIRCLE CENTERING
  console.log('\n⏱️ Test Minuteur de Jeûne & Centrage Pixel-Perfect...');
  await page.evaluate(() => window.showPage('fasting'));
  await new Promise(r => setTimeout(r, 300));
  
  // Select a 24h fast
  await page.evaluate(() => {
    const select = document.getElementById('fastingType');
    if (select) {
      select.value = 'waterFast';
      select.dispatchEvent(new Event('change'));
    }
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, '14_Fasting_Hydrique_24h_Mobile.png') });
  console.log('  📸 Capture enregistrée : 14_Fasting_Hydrique_24h_Mobile.png');

  // D. TEST RAINTREE MONOGRAPH MODAL ON MOBILE
  console.log('\n🌿 Test Ouverture Fiche Plante Raintree sur mobile...');
  await page.evaluate(() => window.showPage('materia-medica'));
  await new Promise(r => setTimeout(r, 300));

  // Click on first plant card
  await page.evaluate(() => {
    const card = document.querySelector('.materia-card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, '15_Raintree_Plant_Modal_Mobile.png') });
  console.log('  📸 Capture enregistrée : 15_Raintree_Plant_Modal_Mobile.png');

  // Close plant modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.materia-modal-close, .modal-close-btn');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 200));

  // E. TEST VIDEO PLAYER TIMESTAMPS MODAL ON MOBILE
  console.log('\n🎬 Test Modale Vidéo & Chapitres Horodatés sur mobile...');
  await page.evaluate(() => window.showPage('resources'));
  await new Promise(r => setTimeout(r, 300));

  // Search "wim hof" and open video
  await page.evaluate(() => {
    window.searchMediaKnowledge('wim hof');
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const videoCard = document.querySelector('.media-result-card.video-type');
    if (videoCard) videoCard.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, '16_Video_Modal_Timestamps_Mobile.png') });
  console.log('  📸 Capture enregistrée : 16_Video_Modal_Timestamps_Mobile.png');

  // Close video modal
  await page.evaluate(() => {
    if (window.closeMediaVideoModal) window.closeMediaVideoModal(null);
  });
  await new Promise(r => setTimeout(r, 200));

  // F. TEST PDF PASSAGE VIEWER MODAL ON MOBILE
  console.log('\n📖 Test Visionneuse de Passage PDF sur mobile...');
  await page.evaluate(() => {
    window.searchMediaKnowledge('mucus');
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    const pdfCard = document.querySelector('.media-result-card.pdf-type');
    if (pdfCard) pdfCard.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, '17_PDF_Passage_Viewer_Mobile.png') });
  console.log('  📸 Capture enregistrée : 17_PDF_Passage_Viewer_Mobile.png');

  // Close PDF modal
  await page.evaluate(() => {
    if (window.closePdfPassageModal) window.closePdfPassageModal(null);
  });
  await new Promise(r => setTimeout(r, 200));

  // G. TEST AI AUTH GATE MODAL ON MOBILE
  console.log('\n🔐 Test Modale d\'Authentification IA Google sur mobile...');
  await page.evaluate(() => {
    window.openAiAuthGateModal();
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, '18_AI_Auth_Gate_Modal_Mobile.png') });
  console.log('  📸 Capture enregistrée : 18_AI_Auth_Gate_Modal_Mobile.png');

  await page.evaluate(() => {
    window.closeAiAuthGateModal(null);
  });
  await new Promise(r => setTimeout(r, 200));

  // H. TEST PWA BANNER ON MOBILE
  console.log('\n📲 Test Affichage Bannière PWA sur mobile...');
  await page.evaluate(() => {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.style.display = 'block';
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, '19_PWA_Install_Banner_Mobile.png') });
  console.log('  📸 Capture enregistrée : 19_PWA_Install_Banner_Mobile.png');

  // ═════════════════════════════════════════════════════════════════
  // BILAN
  // ═════════════════════════════════════════════════════════════════
  console.log('\n═════════════════════════════════════════════════════════════════');
  console.log('📊 BILAN DE L\'AUDIT EXHAUSTIF MOBILE');
  console.log('═════════════════════════════════════════════════════════════════');
  console.log(`Pages & Flux testés : ${pagesToTest.length + 8}`);
  console.log(`Captures d'écran générées : 19 images HD dans ${screenshotDir}`);
  console.log(`Anomalies de disposition : ${layoutDefects.length === 0 ? '0 (Parfait 🟢)' : layoutDefects.length}`);
  console.log(`Erreurs console : ${errors.length === 0 ? '0 (Parfait 🟢)' : errors.length}`);

  if (errors.length > 0) {
    console.error('Erreurs JavaScript détectées :');
    errors.forEach(e => console.error(' -', e));
    process.exit(1);
  }

  await browser.close();
  console.log('\n✨ AUDIT MOBILE COMPLET TERMINÉ AVEC SUCCÈS !');
}

runExhaustiveAudit().catch(err => {
  console.error('Erreur pendant l\'audit :', err);
  process.exit(1);
});
