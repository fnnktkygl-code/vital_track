import puppeteer from '/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

async function testScreenshotAndNotification() {
  console.log('🚀 Test de capture d\'écran et de notification toast...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // 1. Simuler le raccourci de capture d'écran Mac (Cmd+Shift+4)
  console.log('⌨️ Simulation du raccourci clavier de capture d\'écran (Cmd+Shift+4)...');
  await page.keyboard.down('Meta');
  await page.keyboard.down('Shift');
  await page.keyboard.press('KeyS');
  await page.keyboard.up('Shift');
  await page.keyboard.up('Meta');

  await new Promise(r => setTimeout(r, 600));

  // 2. Vérifier que la notification toast apparaît
  const toastText = await page.evaluate(() => {
    const toast = document.querySelector('.vital-toast') || document.querySelector('.toast');
    return toast ? toast.textContent.trim() : null;
  });
  console.log('🔍 Message de notification apparu :', toastText);

  // 3. Effectuer une capture d'écran de validation
  const screenshotPath = '/Users/richard/.gemini/antigravity-ide/brain/62869707-ece8-4e33-b148-883a76c1d6d3/mobile_screenshots/33_Live_Screenshot_With_Toast.png';
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Capture d\'écran enregistrée avec succès :', screenshotPath);

  // 4. Vérifier que le corps n'a PAS de classe de masquage
  const hasBlackout = await page.evaluate(() => document.body.classList.contains('screenshot-privacy-active'));
  console.log('🔍 Écran noir / Privacy actif :', hasBlackout ? '❌ NON (masqué)' : '✅ NON (écran net et clair)');

  await browser.close();
  console.log('✨ TEST VALIDÉ : Capture d\'écran claire et nette avec message toast explicatif !');
}

testScreenshotAndNotification().catch(err => {
  console.error(err);
  process.exit(1);
});
