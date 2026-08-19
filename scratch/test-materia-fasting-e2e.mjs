import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import path from 'path';
import fs from 'fs';

const screenshotDir = path.resolve('/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8');

async function run() {
  console.log('🚀 Launching Puppeteer-core with local Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Navigate to preview server on 4173
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  console.log('✅ Page loaded successfully');

  // 1. Test Pharmacopée Page & Real Images
  console.log('🌿 Navigating to Pharmacopée (materia-medica)...');
  await page.evaluate(() => {
    window.showPage('materia-medica');
  });
  await new Promise(r => setTimeout(r, 600));

  const herbCardsCount = await page.$$eval('.herb-card', els => els.length);
  console.log(`✅ Found ${herbCardsCount} plant cards in Materia Medica.`);

  // Check image src of first 5 cards
  const firstImages = await page.$$eval('.herb-card-img', imgs => imgs.slice(0, 5).map(img => ({
    src: img.src,
    complete: img.complete,
    naturalWidth: img.naturalWidth
  })));
  console.log('🖼️ Sample plant images status:', firstImages);

  await page.screenshot({ path: path.join(screenshotDir, 'materia_medica_real_images.png'), fullPage: false });

  // 2. Test Opening Plant Modal (e.g. Chanca Piedra)
  console.log('🔍 Clicking on Chanca Piedra card...');
  await page.evaluate(() => {
    window.openHerbModal('chanca-piedra');
  });
  await new Promise(r => setTimeout(r, 500));

  const modalVisible = await page.$eval('#herbModal', el => el.style.display !== 'none');
  const modalTitle = await page.$eval('#herbModalName', el => el.textContent);
  console.log(`✅ Herb Modal visible: ${modalVisible}, Title: ${modalTitle}`);

  // Screenshot Zone 1 (Aperçu immédiat)
  await page.screenshot({ path: path.join(screenshotDir, 'herb_modal_preview_immediate.png') });

  // 3. Test Monograph Accordion Expansion
  console.log('📜 Toggling Monograph Drawer...');
  await page.evaluate(() => {
    window.toggleHerbMonograph();
  });
  await new Promise(r => setTimeout(r, 400));

  const drawerOpen = await page.$eval('#herbMonographDrawer', el => el.classList.contains('open'));
  console.log(`✅ Monograph drawer open: ${drawerOpen}`);

  // Scroll down a bit to see monograph details
  await page.evaluate(() => {
    const scrollEl = document.getElementById('herbModalBody');
    if (scrollEl) scrollEl.scrollTop = 350;
  });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(screenshotDir, 'herb_modal_monograph_drawer.png') });

  // Close modal
  await page.evaluate(() => {
    window.closeHerbModal();
  });
  await new Promise(r => setTimeout(r, 300));

  // 4. Test Fasting Page Harmonization
  console.log('⏰ Navigating to Fasting Page...');
  await page.evaluate(() => {
    window.showPage('fasting');
  });
  await new Promise(r => setTimeout(r, 600));

  // Select a program
  await page.evaluate(() => {
    window.selectProgram('warrior');
  });
  await new Promise(r => setTimeout(r, 300));

  const durationVal = await page.$eval('#fastingDuration', el => el.value);
  console.log(`✅ Fasting Warrior duration: ${durationVal}h`);

  await page.screenshot({ path: path.join(screenshotDir, 'fasting_page_harmonized.png') });

  // 5. Test Expert Accordion in Fasting
  console.log('📖 Testing Fasting Expert Accordion...');
  const accordionRows = await page.$$eval('.jn-expert-row', els => els.length);
  console.log(`✅ Found ${accordionRows} expert advice cards.`);

  await page.evaluate(() => {
    const secondExpertHead = document.querySelectorAll('.jn-expert-head')[1];
    if (secondExpertHead) secondExpertHead.click();
  });
  await new Promise(r => setTimeout(r, 400));

  await page.screenshot({ path: path.join(screenshotDir, 'fasting_expert_accordion.png') });

  // 6. Test Language Toggle Button
  console.log('🌐 Testing Language Switcher (FR -> EN -> FR)...');
  const initialLangText = await page.$eval('#globalLangToggleBtn', el => el.textContent);
  console.log(`Initial button label: ${initialLangText}`);

  await page.evaluate(() => {
    window.vitalTrackI18n?.toggleLanguage();
  });
  await new Promise(r => setTimeout(r, 400));

  const enLangText = await page.$eval('#globalLangToggleBtn', el => el.textContent);
  console.log(`Switched to EN button label: ${enLangText}`);

  // Switch back to FR
  await page.evaluate(() => {
    window.vitalTrackI18n?.toggleLanguage();
  });
  await new Promise(r => setTimeout(r, 300));
  const finalLangText = await page.$eval('#globalLangToggleBtn', el => el.textContent);
  console.log(`Switched back to FR button label: ${finalLangText}`);

  console.log('🎉 All E2E tests completed successfully!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
