import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';

async function main() {
  const viteProcess = spawn('npx', ['vite', '--port', '5177'], {
    cwd: '/Users/richard/Developer/vital_track/web-app',
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 2000));

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('http://localhost:5177');

    // 1. Capture Library Card
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') {
        window.switchTab('resources');
      } else if (typeof window.renderResources === 'function') {
        window.renderResources();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    const card = await page.$('.dash-card');
    if (card) {
      await card.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/library_card_attribution_preview.png' });
    }

    // 2. Open Book Reader on section 30 (Glossaire)
    await page.evaluate(() => {
      window.openBookReader('ehret-mucusless-fr', 29); // Section 30
    });
    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/reader_glossary_section_preview.png' });

    console.log('✅ All screenshots saved!');
  } finally {
    await browser.close();
    viteProcess.kill();
  }
}

main().catch(console.error);
