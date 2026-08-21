import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { generateLuxuryHtml } from './generate_luxury_ehret_pdf.mjs';

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200 });

  const html = generateLuxuryHtml();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // 1. Cover
  const cover = await page.$('.pdf-cover-page');
  if (cover) {
    await cover.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_cover_preview.png' });
  }

  // 2. TOC
  const toc = await page.$('.pdf-toc-page');
  if (toc) {
    await toc.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_toc_preview.png' });
  }

  // 3. Leçon I with Dropcap
  const chapters = await page.$$('.pdf-chapter');
  if (chapters.length > 3) {
    await chapters[3].screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_lesson_preview.png' });
  }

  // 4. Leçon V with Formula
  if (chapters.length > 7) {
    await chapters[7].screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/pdf_formula_preview.png' });
  }

  console.log('✅ Showcase screenshots saved successfully!');
  await browser.close();
}

capture().catch(console.error);
