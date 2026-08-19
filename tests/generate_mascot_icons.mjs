import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const svgPath = path.resolve('/Users/richard/Developer/vital_track/web-app/public/favicon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body, html { margin: 0; padding: 0; background: transparent; overflow: hidden; }
          svg { width: 100%; height: 100%; display: block; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);

  // 192x192
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.screenshot({ path: '/Users/richard/Developer/vital_track/web-app/public/icon-192.png', omitBackground: true });
  console.log('✅ icon-192.png generated');

  // 512x512
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.screenshot({ path: '/Users/richard/Developer/vital_track/web-app/public/icon-512.png', omitBackground: true });
  console.log('✅ icon-512.png generated');

  await browser.close();
}

generateIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
