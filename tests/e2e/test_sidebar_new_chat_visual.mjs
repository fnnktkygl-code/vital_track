import assert from 'node:assert/strict';
import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import { createServer } from '/Users/richard/Developer/vital_track/web-app/node_modules/vite/dist/node/index.js';
import fs from 'fs';
import path from 'path';

console.log('═══════════════════════════════════════════════════════════');
console.log('📱 TEST VISUEL & GÉOMÉTRIE : BOUTON NOUVEAU CHAT DANS LA BARRE LATÉRALE');
console.log('═══════════════════════════════════════════════════════════\n');

const port = 5490 + Math.floor(Math.random() * 100);
const server = await createServer({
  root: '/Users/richard/Developer/vital_track/web-app',
  server: { port }
});
await server.listen();
const baseUrl = server.resolvedUrls.local[0] || `http://localhost:${port}`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Test on Mobile Viewport (iPhone 14 / 390x844)
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  // Navigate to Chat page
  await page.evaluate(() => {
    window.showPage('chat');
  });
  await new Promise(r => setTimeout(r, 500));

  // Open Chat Sidebar Drawer
  await page.evaluate(() => {
    window.toggleSidebar(true);
  });
  await new Promise(r => setTimeout(r, 500));

  // Check geometry of #sidebarNewChatBtn and .navbar
  const geometry = await page.evaluate(() => {
    const navbar = document.querySelector('.navbar');
    const navRect = navbar ? navbar.getBoundingClientRect() : null;

    const btn = document.getElementById('sidebarNewChatBtn');
    const btnRect = btn ? btn.getBoundingClientRect() : null;

    const sidebar = document.getElementById('chatSidebar');
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;

    return {
      navBottom: navRect ? navRect.bottom : 0,
      navHeight: navRect ? navRect.height : 0,
      btnTop: btnRect ? btnRect.top : 0,
      btnBottom: btnRect ? btnRect.bottom : 0,
      btnHeight: btnRect ? btnRect.height : 0,
      btnVisible: btnRect ? (btnRect.width > 0 && btnRect.height > 0) : false,
      btnText: btn ? btn.textContent.trim() : '',
      sidebarTop: sidebarRect ? sidebarRect.top : 0
    };
  });

  console.log('📊 Géométrie Mobile (390px):');
  console.log(`  • Navbar Bottom : ${geometry.navBottom}px (Height: ${geometry.navHeight}px)`);
  console.log(`  • Sidebar Top   : ${geometry.sidebarTop}px`);
  console.log(`  • Bouton Top    : ${geometry.btnTop}px (Height: ${geometry.btnHeight}px)`);
  console.log(`  • Texte Bouton  : "${geometry.btnText}"`);

  // Assertions
  assert.ok(geometry.btnVisible, 'Le bouton Nouveau Chat doit être visible dans le DOM');
  assert.ok(geometry.btnTop >= geometry.navBottom, `Le bouton (top: ${geometry.btnTop}px) ne doit PAS être recouvert par la navbar (bottom: ${geometry.navBottom}px)`);
  assert.ok(geometry.btnHeight >= 38, 'Le bouton doit avoir une hauteur tactile confortable (>= 38px)');
  assert.ok(geometry.btnText.includes('Nouveau chat') || geometry.btnText.includes('New Chat'), 'Le texte du bouton doit être présent');

  // Take screenshot of the mobile layout
  const screenshotPath = '/Users/richard/.gemini/antigravity/brain/af93d17e-7b44-45c9-bde6-a2c24b0cbde4/sidebar_new_chat_mobile.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`  📸 Capture d'écran mobile enregistrée : ${screenshotPath}`);

  console.log('\n✨ TEST VISUEL MOBILE 100% SUCCÈS : Le bouton Nouveau Chat est parfaitement dégagé et visible !');
} finally {
  if (browser) await browser.close();
  await server.close();
}
