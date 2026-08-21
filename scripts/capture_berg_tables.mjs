import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { spawn } from 'child_process';
import { ehretMucuslessFr } from '../web-app/src/data/books/ehretMucuslessFr.js';

async function main() {
  const lesson14Idx = ehretMucuslessFr.chapters.findIndex(c => c.id === 'lesson-14');
  console.log(`Leçon XIV index: ${lesson14Idx}`);

  const viteProcess = spawn('npx', ['vite', '--port', '5179'], {
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
    await page.goto('http://localhost:5179');

    await page.evaluate((idx) => {
      window.openBookReader('ehret-mucusless-fr', idx);
    }, lesson14Idx);

    await new Promise(r => setTimeout(r, 1000));

    // Scroll down to the tables in the reading pane
    await page.evaluate(() => {
      const pane = document.querySelector('.br-reading-pane');
      if (pane) {
        pane.scrollTop = 2200;
      }
    });

    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/reader_lesson_14_berg_tables.png' });

    console.log('✅ Screenshot of Berg Tables in Lesson 14 saved!');
  } finally {
    await browser.close();
    viteProcess.kill();
  }
}

main().catch(console.error);
