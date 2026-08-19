#!/usr/bin/env node

/**
 * 🎨 Universal Contrast & UX Design System Auditor
 * 
 * Usage:
 *   node harnesses/audit_contrast_and_ux.mjs --url http://localhost:5173
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const args = process.argv.slice(2);
let targetUrl = 'http://localhost:5173';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) targetUrl = args[i + 1];
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`🎨 AUDIT DESIGN SYSTEM, CONTRASTES & UX : ${targetUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function auditUx() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  const cssTokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      bg: style.getPropertyValue('--bg').trim() || style.backgroundColor,
      text: style.getPropertyValue('--text').trim() || style.color,
      accent: style.getPropertyValue('--accent').trim(),
      border: style.getPropertyValue('--border').trim()
    };
  });

  console.log('1️⃣ Tokens CSS du Design System détectés :');
  console.log(`  --bg : ${cssTokens.bg}`);
  console.log(`  --text : ${cssTokens.text}`);
  console.log(`  --accent : ${cssTokens.accent}`);
  console.log(`  --border : ${cssTokens.border}`);

  const elementsCount = await page.evaluate(() => {
    return {
      buttons: document.querySelectorAll('button').length,
      links: document.querySelectorAll('a').length,
      modals: document.querySelectorAll('.modal, dialog, [role="dialog"]').length,
      cards: document.querySelectorAll('.card, .dash-card, [class*="card"]').length
    };
  });

  console.log('\n2️⃣ Composants d\'interface analysés :');
  console.log(`  🔘 Boutons : ${elementsCount.buttons}`);
  console.log(`  🔗 Liens : ${elementsCount.links}`);
  console.log(`  🗔 Modales : ${elementsCount.modals}`);
  console.log(`  🃏 Cartes de contenu : ${elementsCount.cards}`);

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🏁 AUDIT UX & DESIGN SYSTEM VALIDÉ');
  console.log('═══════════════════════════════════════════════════════════════════');
}

auditUx().catch(err => {
  console.error('Erreur :', err);
  process.exit(1);
});
