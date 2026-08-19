import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testGreetingFix() {
  console.log('🚀 Test de validation de la salutation "Bonjour" par défaut...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 1. Premier chargement à froid (sans cache préalable)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const greeting1 = await page.$eval('#greetName', el => el.textContent.trim());
  const flag1 = await page.$eval('#dashHeaderLangBtn', el => el.textContent.trim());
  console.log('🔍 Salutation au 1er chargement :', greeting1, '| Flag :', flag1);

  if (!greeting1.startsWith('Bonjour')) {
    throw new Error(`Attendu "Bonjour", mais obtenu "${greeting1}"`);
  }

  // 2. Rechargement de la page (F5 / Refresh)
  console.log('🔄 Rechargement de la page...');
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const greeting2 = await page.$eval('#greetName', el => el.textContent.trim());
  console.log('🔍 Salutation après rafraîchissement :', greeting2);

  if (!greeting2.startsWith('Bonjour')) {
    throw new Error(`Attendu "Bonjour" après reload, mais obtenu "${greeting2}"`);
  }

  // Prendre screenshot de l'accueil
  await page.screenshot({ path: '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/32_Greeting_Bonjour_Default.png' });

  await browser.close();
  console.log('✨ TEST VALIDÉ : "Bonjour" est bien la salutation par défaut et constante au rechargement !');
}

testGreetingFix().catch(err => {
  console.error(err);
  process.exit(1);
});
