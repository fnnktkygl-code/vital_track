#!/usr/bin/env node

/**
 * 🔬 Universal E2E Puppeteer System Audit Harness
 * 
 * Usage:
 *   node harnesses/run_e2e_audit.mjs --url http://localhost:5173
 *   node harnesses/run_e2e_audit.mjs --url https://your-production-app.vercel.app
 */

import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

// Parse arguments
const args = process.argv.slice(2);
let targetUrl = 'http://localhost:5173';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
  }
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`🔬 HARNAIS D'AUDIT E2E GÉNÉRIQUE AUTOMATISÉ : ${targetUrl}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

async function runAudit() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('ERR_ABORTED')) {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(`PageError: ${err.message}`);
  });

  console.log('1️⃣ Connexion et chargement initial de la page...');
  const t0 = Date.now();
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  const loadTime = Date.now() - t0;
  console.log(`  ⏱️ Temps de chargement initial : ${loadTime} ms`);

  console.log('\n2️⃣ Détection des vues et conteneurs interactifs...');
  const structure = await page.evaluate(() => {
    const pages = Array.from(document.querySelectorAll('.page, [data-view], section[id]')).map(el => ({
      id: el.id || el.dataset.view,
      tag: el.tagName.toLowerCase(),
      classes: el.className
    }));
    const buttons = document.querySelectorAll('button, .btn, [role="button"]').length;
    const links = document.querySelectorAll('a[href]').length;
    const inputs = document.querySelectorAll('input, select, textarea').length;
    return { pages, buttons, links, inputs };
  });

  console.log(`  📄 Vues / Sections détectées : ${structure.pages.length}`);
  console.log(`  🔘 Boutons interactifs : ${structure.buttons}`);
  console.log(`  🔗 Liens de navigation : ${structure.links}`);
  console.log(`  📝 Champs de saisie : ${structure.inputs}`);

  console.log('\n3️⃣ Test des états des boutons interactifs...');
  const buttonAudit = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    let noAria = 0;
    buttons.forEach(b => {
      if (!b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')) {
        noAria++;
      }
    });
    return { total: buttons.length, missingLabels: noAria };
  });
  console.log(`  Boutons sans label d'accessibilité : ${buttonAudit.missingLabels} / ${buttonAudit.total}`);

  console.log('\n4️⃣ Bilan des Erreurs JavaScript...');
  if (errors.length > 0) {
    console.error(`  ❌ ${errors.length} ERREUR(S) DÉTECTÉE(S) :`);
    errors.forEach(e => console.error(`    - ${e}`));
  } else {
    console.log('  ✨ ZÉRO ERREUR CONSOLE DÉTECTÉE !');
  }

  await browser.close();
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`🏁 AUDIT TERMINÉ — Statut : ${errors.length === 0 ? '🟢 SUCCÈS (0 erreur)' : '🔴 ÉCHEC'}`);
  console.log('═══════════════════════════════════════════════════════════════════');

  if (errors.length > 0) process.exit(1);
}

runAudit().catch(err => {
  console.error('Erreur critique pendant l\'audit :', err);
  process.exit(1);
});
