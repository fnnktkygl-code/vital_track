/**
 * test_book_reader_ui.mjs
 * 
 * Test E2E Puppeteer pour valider le BookReader (Liseuse e-Book) dans VitalTrack.
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';
import assert from 'node:assert/strict';

console.log('🚀 Lancement du test UI BookReader avec Puppeteer...');

const viteProcess = spawn('npx', ['vite', '--port', '5199'], {
  cwd: '/Users/richard/Developer/vital_track/web-app',
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Accès à la page Ressources / Bibliothèque
  await page.goto('http://localhost:5199', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.showPage('resources');
  });

  await new Promise(resolve => setTimeout(resolve, 600));

  // 2. Vérification de la présence du bouton "Lire l'Ouvrage"
  const readBtn = await page.waitForSelector('button[onclick*="openBookReader"]', { timeout: 4000 });
  assert.ok(readBtn, 'Le bouton "Lire l\'Ouvrage" doit être visible');
  console.log('  ✅ Bouton "Lire l\'Ouvrage" détecté sur la carte d\'Arnold Ehret');

  // 3. Clic sur le bouton pour ouvrir le BookReader
  await page.evaluate(() => {
    window.openBookReader('ehret-mucusless-fr', 0);
  });
  await new Promise(resolve => setTimeout(resolve, 500));

  // 4. Vérification de la modal BookReader
  const modalOpen = await page.evaluate(() => {
    const modal = document.getElementById('bookReaderModalOverlay');
    return modal && modal.classList.contains('open');
  });
  assert.ok(modalOpen, 'La modale BookReader doit être ouverte');
  console.log('  ✅ Modale BookReader ouverte avec succès');

  // 5. Changement de thème vers Sépia
  await page.evaluate(() => {
    window.setReaderTheme('sepia');
  });
  const currentTheme = await page.evaluate(() => {
    return document.querySelector('.br-root')?.getAttribute('data-theme');
  });
  assert.equal(currentTheme, 'sepia');
  console.log('  ✅ Thème Sépia appliqué');

  // 6. Navigation vers la Leçon III (Pourquoi le Diagnostic Médical Traditionnel Échoue)
  await page.evaluate(() => {
    // Préface=0, Intro=1, Bio=2, Leçon I=3, Leçon II=4, Leçon III=5
    window.setReaderChapter(5);
  });
  const chapterTitle = await page.evaluate(() => {
    return document.querySelector('.br-article-title')?.textContent;
  });
  assert.ok(chapterTitle?.toLowerCase().includes('diagnostic'), `Le titre doit contenir 'diagnostic' (reçu: ${chapterTitle})`);
  console.log(`  ✅ Chapitre actif : ${chapterTitle}`);

  // 7. Clic sur un terme du glossaire (ex: mucus)
  await page.evaluate(() => {
    window.showGlossaryTerm('mucus');
  });
  const glossaryTitle = await page.evaluate(() => {
    return document.querySelector('.br-glossary-title')?.textContent;
  });
  assert.ok(glossaryTitle?.includes('mucus'), 'La carte de glossaire doit afficher la définition du mucus');
  console.log('  ✅ Carte de glossaire interactive ouverte');

  // 8. Capture d'écran
  const screenshotPath = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/.tempmediaStorage/book_reader_preview.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`  📸 Capture d'écran enregistrée : ${screenshotPath}`);

  console.log('\n🎉 TOUS LES TESTS UI BOOKREADER ONT RÉUSSI AVEC SUCCÈS !\n');
} finally {
  await browser.close();
  viteProcess.kill();
}
