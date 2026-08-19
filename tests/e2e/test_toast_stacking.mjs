import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testToastStacking() {
  console.log('🚀 Test de validation de l\'empilement des notifications (Anti-Overlap Toast Stack)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Trigger both a Pigeon nudge and two toasts simultaneously
  await page.evaluate(() => {
    if (window.pigeonNudges) {
      window.pigeonNudges.triggerNudge({
        mood: 'sleepy',
        badge: '🌙 Cycle d\'Assimilation',
        title: 'Régénération Cellulaire',
        message: 'Repos physiologique profond. C\'est l\'heure de l\'autolyse nocturne des toxines.',
        force: true
      });
    }
    if (window.showToast) {
      window.showToast('✅ « Banane Cavendish » enregistrée dans le journal du jour !', 'success', 8000);
      setTimeout(() => {
        window.showToast('💾 Synchronisation locale instantanée effectuée.', 'info', 8000);
      }, 100);
    }
  });

  await new Promise(r => setTimeout(r, 600));

  // Verify bounding boxes
  const positions = await page.evaluate(() => {
    const container = document.getElementById('appToastContainer');
    if (!container) return [];
    const children = Array.from(container.children);
    return children.map((el, i) => {
      const rect = el.getBoundingClientRect();
      return { index: i, top: rect.top, bottom: rect.bottom, height: rect.height, text: el.textContent.trim().substring(0, 40) };
    });
  });

  console.log('📊 Positions des notifications empilées :');
  console.table(positions);

  let hasOverlap = false;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      if (a.top < b.bottom && a.bottom > b.top) {
        console.error(`❌ Chevauchement détecté entre [${i}] et [${j}] !`);
        hasOverlap = true;
      }
    }
  }

  if (hasOverlap) {
    throw new Error('Les notifications se chevauchent encore !');
  } else {
    console.log('✅ Aucun chevauchement : toutes les notifications sont proprement empilées verticalement les unes au-dessus des autres !');
  }

  // Capture screenshot
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/47_Toast_Stack_Clean_Non_Overlapping.png' });

  await browser.close();
}

testToastStacking().catch(err => {
  console.error(err);
  process.exit(1);
});
