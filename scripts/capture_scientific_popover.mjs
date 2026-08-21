import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';

async function main() {
  const viteProcess = spawn('npx', ['vite', '--port', '5182'], {
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
    await page.setViewport({ width: 1280, height: 950 });
    await page.goto('http://localhost:5182');

    // 1. Ouvrir le livre sur la leçon V (qui contient "moteur humain à pression d'air")
    await page.evaluate(() => {
      window.openBookReader('ehret-mucusless-fr', 8); // Leçon VI
    });

    await new Promise(r => setTimeout(r, 1000));

    // Cliquer sur le terme annoté "protéines"
    await page.evaluate(() => {
      const termEl = Array.from(document.querySelectorAll('.br-glossary-term'))
        .find(el => el.textContent.toLowerCase().includes('protéine'));
      if (termEl) {
        termEl.click();
      }
    });

    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/popover_warning_screenshot.png' });
    console.log('✅ Screenshot du popover avec mise en garde sauvegardé !');

    // 2. Ouvrir la section 30 (Dictionnaire Vitaliste & Notes Scientifiques)
    await page.evaluate(() => {
      window.openBookReader('ehret-mucusless-fr', 29); // Section 30
    });

    await new Promise(r => setTimeout(r, 800));

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/section_30_scientific_cards_screenshot.png' });
    console.log('✅ Screenshot de la Section 30 avec cartes scientifiques sauvegardé !');

  } finally {
    await browser.close();
    viteProcess.kill();
  }
}

main().catch(console.error);
