import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 850, height: 1100 });

  const previewScript = fs.readFileSync('/Users/richard/Developer/vital_track/scripts/generate_luxury_ehret_pdf.mjs', 'utf8');
  const match = previewScript.match(/const htmlContent = `([\s\S]+?)`;\s+const browser/);
  
  if (match) {
    await page.setContent(match[1], { waitUntil: 'networkidle0' });

    // Scroll to Leçon I
    const lessonI = await page.$('.pdf-chapter');
    if (lessonI) {
      await lessonI.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_interior_preview.png' });
      console.log('✅ Interior preview saved to pdf_interior_preview.png');
    }
  }

  await browser.close();
}

capture().catch(console.error);
