import puppeteer from 'puppeteer-core';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  console.log('🚀 Testing Masterclass Modal Rendering & Formula Layouts...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Page loaded');

    // 1. Navigate to Jeûne page where Masterclass lives
    await page.evaluate(() => window.showPage('fasting'));
    await new Promise(r => setTimeout(r, 400));

    // 2. Open Lesson 0: "La Théorie du Mucus"
    await page.evaluate(() => window.openMasterclass(0));
    await new Promise(r => setTimeout(r, 400));

    const formulaTag = await page.$eval('.mc-formula-tag', el => el.innerText);
    console.log('Lesson 0 Formula Tag:', formulaTag);
    if (!formulaTag.includes('V = P - O')) {
      throw new Error('Formula tag V = P - O missing');
    }

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/masterclass_mucus_theory_fixed.png' });
    console.log('📸 Screenshot saved: masterclass_mucus_theory_fixed.png');

    // 3. Open Lesson 4: "Rompre le Jeûne"
    await page.evaluate(() => window.openMasterclass(4));
    await new Promise(r => setTimeout(r, 400));

    const dangerTitle = await page.$eval('.mc-callout-title', el => el.innerText);
    console.log('Lesson 4 Callout Title:', dangerTitle);
    if (!dangerTitle.includes('Règle Absolue')) {
      throw new Error('Callout title La Règle Absolue missing');
    }

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/e5d0ea18-d331-46c0-9562-9eebb3699cf8/masterclass_break_fast_fixed.png' });
    console.log('📸 Screenshot saved: masterclass_break_fast_fixed.png');

    console.log('🎉 ALL MASTERCLASS MODAL TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
