import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200 });

  // We can load the HTML generated and take screenshots of the key pages
  // Let's create a visual multi-page showcase
  const previewScript = fs.readFileSync('/Users/richard/Developer/vital_track/scripts/generate_luxury_ehret_pdf.mjs', 'utf8');
  const match = previewScript.match(/const htmlContent = `([\s\S]+?)`;\s+const browser/);
  
  if (match) {
    await page.setContent(match[1], { waitUntil: 'networkidle0' });
    
    // Screenshot cover
    const coverEl = await page.$('.pdf-cover-page');
    if (coverEl) {
      await coverEl.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_cover_preview.png' });
    }

    // Screenshot Leçon V ($V = P - O$)
    const lessonV = await page.evaluate(() => {
      const chapters = Array.from(document.querySelectorAll('.pdf-chapter'));
      const v = chapters.find(c => c.querySelector('.chapter-tag')?.textContent.includes('Leçon V'));
      return v ? v.getBoundingClientRect().top + window.scrollY : null;
    });

    if (lessonV) {
      await page.evaluate((top) => window.scrollTo(0, top), lessonV);
      await new Promise(r => setTimeout(r, 200));
      await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_lesson_preview.png', clip: { x: 0, y: 0, width: 900, height: 1100 } });
    }

    console.log('✅ Screenshots saved!');
  }

  await browser.close();
}

capture().catch(console.error);
