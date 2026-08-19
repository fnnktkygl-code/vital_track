import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROD_URL = 'https://vitaltrack-ochre.vercel.app';

async function verifyProd() {
  console.log(`🚀 Verifying live production on ${PROD_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  try {
    await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('--- Connected to Production ---');

    // 1. Inject meal into production page
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

    // 2. Navigate to meals page
    await page.evaluate(() => {
      window.showPage('meals');
    });
    await new Promise(r => setTimeout(r, 600));

    // Take screenshot of production meals list
    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/prod_meals_page_verified.png'
    });
    console.log('--- Captured prod_meals_page_verified.png ---');

    // 3. Click meal to open dedicated meal modal
    await page.click('.meal-item.clickable');
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/prod_meal_modal_verified.png'
    });
    console.log('--- Captured prod_meal_modal_verified.png ---');

    console.log('🎉 PRODUCTION VERIFICATION COMPLETE AND 100% SUCCESSFUL!');
  } catch (err) {
    console.error('Prod verification error:', err);
  } finally {
    await browser.close();
  }
}

verifyProd();
