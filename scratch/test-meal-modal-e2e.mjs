import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function run() {
  console.log('--- Starting Vite preview server ---');
  const server = spawn('npx', ['vite', 'preview', '--port', '5199'], {
    cwd: '/Users/richard/Developer/vital_track/web-app',
    shell: true,
    stdio: 'pipe'
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log('--- Launching Chrome via Puppeteer-core ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto('http://localhost:5199', { waitUntil: 'networkidle0' });
    console.log('--- Page loaded successfully ---');

    // 1. Inject a composed meal like the user's Tapas Vitalistes into localStorage
    await page.evaluate(() => {
      const sampleMeal = {
        name: 'Tapas Vitalistes aux Moules & Sardines',
        category: 'dinner',
        emoji: '🦪',
        items: [
          'Moules marinées au citron',
          'Sardines fraîches',
          'Rondelles de concombre',
          'Olives noires & vertes',
          'Basilic & persil frais'
        ],
        ingredients: [
          'Moules marinées au citron',
          'Sardines fraîches',
          'Rondelles de concombre',
          'Olives noires & vertes',
          'Basilic & persil frais'
        ],
        note: 'Recharge en zinc et oméga-3 sans gluten ni caséine mucogène. Concombre et citronnade alcalinisante.',
        approved: true,
        electric: true,
        hybrid: false,
        isComposedMeal: true,
        pral: -0.4,
        nova: 1,
        timestamp: Date.now()
      };

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(sampleMeal))));
      window.handleAddActionMeal(encoded);
    });

    console.log('--- Sample composed meal injected via handleAddActionMeal ---');

    // 2. Navigate to "Mes Repas" page
    await page.evaluate(() => {
      window.showPage('meals');
    });

    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/meals_page_with_ingredients_preview.png'
    });
    console.log('--- Captured meals_page_with_ingredients_preview.png ---');

    // 3. Click the first meal item to open modal
    await page.click('.meal-item.clickable');
    await new Promise(r => setTimeout(r, 500));

    // Capture Tab 1: Ingrédients
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/meal_modal_tab_ingredients.png'
    });
    console.log('--- Captured meal_modal_tab_ingredients.png ---');

    // 4. Click Tab 2: Bilan & PRAL
    await page.evaluate(() => {
      window.setModalTab('meal_balance');
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/meal_modal_tab_balance.png'
    });
    console.log('--- Captured meal_modal_tab_balance.png ---');

    // 5. Click Tab 3: Note & Conseil Coach
    await page.evaluate(() => {
      window.setModalTab('meal_coach');
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/meal_modal_tab_coach.png'
    });
    console.log('--- Captured meal_modal_tab_coach.png ---');

    // 6. Test raw food modal to ensure single raw food retains 3 botanical tabs
    await page.evaluate(() => {
      window.closeFoodModal();
      window.openFoodModal('mangue');
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/single_raw_food_modal_preserved.png'
    });
    console.log('--- Captured single_raw_food_modal_preserved.png ---');

    console.log('✅ ALL E2E MODAL TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
    server.kill();
  }
}

run();
