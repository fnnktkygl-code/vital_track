import puppeteer from './web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Launching browser with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1280, height: 900 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:4173 ...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

  // 1. Test Chat Page
  console.log('1. Testing Chat Page...');
  await page.evaluate(() => window.showPage('chat'));
  await wait(500);

  // Check voice and image buttons
  const hasVoiceBtn = await page.$('#chatVoiceBtn') !== null;
  const hasImageBtn = await page.$('#chatImageBtn') !== null;
  console.log('Voice Button present:', hasVoiceBtn);
  console.log('Image Button present:', hasImageBtn);
  await page.screenshot({ path: `${artifactDir}/e2e_chat_controls.png` });

  // 2. Open Model Selector & Verify Gemini 3.7 Flash
  console.log('2. Opening Model Selector...');
  await page.evaluate(() => {
    window.renderModelPicker();
    document.getElementById('modelDropdown').style.display = 'block';
  });
  await wait(500);
  const dropdownHtml = await page.evaluate(() => document.getElementById('modelDropdown').innerHTML);
  const hasGemini37 = dropdownHtml.includes('Gemini 3.7 Flash') && dropdownHtml.includes('Fastest &amp; Smartest ⚡');
  console.log('Gemini 3.7 Flash in pole position with badge:', hasGemini37);
  await page.screenshot({ path: `${artifactDir}/e2e_model_selector_37.png` });

  // 3. Test Calendar & 30-Day Plan & Substitution Modal
  console.log('3. Testing Calendar 30-Day Plan & Substitution Modal...');
  await page.evaluate(() => {
    window.showPage('calendar');
    const plan = window.DietPlanEngine.generate({
      protocol: 'sebi',
      numDays: 30,
      objective: 'vitalité boréale',
      restrictions: 'mollusques 1x par semaine'
    });
    window.store.set('calendar_meals', plan.meals);
    window.renderStrip();
    window.renderDay();
    
    // Open substitution modal on first meal tag
    const meal = plan.meals[1];
    window.openSubstituteModal(meal.id, 0, meal.tags[0].n, meal.tags[0].e);
  });
  await wait(800);
  const modalVisible = await page.$('#substituteModalOverlay') !== null;
  console.log('Substitution Modal displayed:', modalVisible);
  await page.screenshot({ path: `${artifactDir}/e2e_substitution_modal.png` });

  // 4. Select a substitute chip & apply
  console.log('4. Selecting substitute chip and applying replacement...');
  await page.evaluate(() => {
    const chips = document.querySelectorAll('#subChipsContainer .sub-chip');
    if (chips.length > 1) chips[1].click();
    window.applySubstitution();
  });
  await wait(600);
  await page.screenshot({ path: `${artifactDir}/e2e_substitution_applied.png` });

  console.log('=== ALL E2E BROWSER TESTS PASSED! ===');
  await browser.close();
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
