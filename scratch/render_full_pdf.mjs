
import fs from 'fs';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function run() {
  console.log('📄 Rendering Complete 100+ Page Vector PDF via Headless Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const html = fs.readFileSync('/Users/richard/Developer/vital_track/scratch/full_unabridged_ehret.html', 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    displayHeaderFooter: false
  });

  fs.writeFileSync('/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf', pdfBuffer);
  fs.writeFileSync('/Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf', pdfBuffer);

  const stats = fs.statSync('/Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');
  console.log('✅ Unabridged PDF generated successfully! Size: ' + (stats.size / 1024).toFixed(1) + ' KB');
  console.log('Saved to: /Users/richard/Developer/vital_track/web-app/public/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');
  console.log('Saved to: /Users/richard/Developer/vital_track/web-app/dist/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
