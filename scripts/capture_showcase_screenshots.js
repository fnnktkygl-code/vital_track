const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIST_DIR = path.resolve(__dirname, '../web-app/dist');
const OUT_DIR = path.resolve(__dirname, '../docs/screenshots');
const PUBLIC_DIR = path.resolve(__dirname, '../web-app/public/screenshots');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

function startLocalServer(port = 8181) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`📡 Serveur local de prévisualisation démarré sur http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function run() {
  const server = await startLocalServer(8181);
  const LOCAL_URL = 'http://localhost:8181';

  console.log('🚀 Lancement de Google Chrome pour capturer les visuels haute résolution...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // ═══════════════════════════════════════════════════════════════
  // 💻 1. VUE DESKTOP (1440 x 900 @ 2x)
  // ═══════════════════════════════════════════════════════════════
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  console.log(`🌐 Chargement de ${LOCAL_URL} ...`);
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' });

  // Initialisation d'une session riche et complète
  await page.evaluate(() => {
    if (window.vitalTrackAuth) {
      window.vitalTrackAuth.signInWithEmail('richard.vitaliste@gmail.com', 'Richard Vitaliste');
    }

    const sampleMeals = [
      {
        id: 'meal_1',
        timestamp: Date.now() - 3600000 * 3,
        name: 'Grand Bol Vivant Électrique & Avocat',
        category: 'repas',
        pral: -16.8,
        nova: 1,
        foods: [
          { name: 'Mâche & Roquette sauvage', isRaw: true, isElectric: true, pral: -5.8 },
          { name: 'Concombre à graines & Avocat Hass', isRaw: true, isElectric: true, pral: -6.4 },
          { name: 'Graines de Chanvre & Huile d\'Olive crue', isRaw: true, pral: -4.6 }
        ],
        advice: 'Alcalinité maximale. Élimination active du mucus et régénération cellulaire.'
      },
      {
        id: 'meal_2',
        timestamp: Date.now() - 3600000 * 22,
        name: 'Mono-Diète de Raisins Noirs Bio',
        category: 'collation',
        pral: -8.5,
        nova: 1,
        foods: [
          { name: 'Raisins Noirs à pépins (Dr. Morse)', isRaw: true, isElectric: true, pral: -8.5 }
        ],
        advice: 'Drainage lymphatique profond et filtration rénale.'
      }
    ];
    localStorage.setItem('vt-u_g_cmljaGFyZC52aXRh-meals', JSON.stringify(sampleMeals));

    const fastingState = {
      isFasting: true,
      startTime: Date.now() - 3600000 * 17.5,
      targetHours: 18,
      protocol: '18:6 (Régénération & Autophagie)',
      fastType: 'water'
    };
    localStorage.setItem('vt-u_g_cmljaGFyZC52aXRh-fasting-state', JSON.stringify(fastingState));

    if (typeof window.showPage === 'function') {
      window.showPage('dashboard');
    }
  });

  await new Promise(r => setTimeout(r, 1200));

  // 1. Desktop Dashboard
  console.log('📸 1. Desktop Dashboard...');
  const deskDashPath = path.join(OUT_DIR, 'desktop_dashboard.png');
  await page.screenshot({ path: deskDashPath });
  fs.copyFileSync(deskDashPath, path.join(PUBLIC_DIR, 'desktop_dashboard.png'));

  // 2. Desktop Media & French Dubbing
  console.log('📸 2. Desktop Médiathèque & Lecteur Vidéo...');
  await page.evaluate(() => {
    window.showPage('resources');
  });
  await new Promise(r => setTimeout(r, 1000));
  const deskMediaPath = path.join(OUT_DIR, 'desktop_media_player.png');
  await page.screenshot({ path: deskMediaPath });
  fs.copyFileSync(deskMediaPath, path.join(PUBLIC_DIR, 'desktop_media_player.png'));

  // 3. Desktop Privacy & RGPD
  console.log('📸 3. Desktop Privacy Policy...');
  await page.goto(`${LOCAL_URL}/privacy.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const deskPrivacyPath = path.join(OUT_DIR, 'desktop_privacy.png');
  await page.screenshot({ path: deskPrivacyPath });
  fs.copyFileSync(deskPrivacyPath, path.join(PUBLIC_DIR, 'desktop_privacy.png'));

  // ═══════════════════════════════════════════════════════════════
  // 📱 2. VUE MOBILE IPHONE 15 PRO (393 x 852 @ 3x)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📱 Passage en résolution Mobile (iPhone 15 Pro)...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    if (window.vitalTrackAuth) {
      window.vitalTrackAuth.signInWithEmail('richard.vitaliste@gmail.com', 'Richard Vitaliste');
    }
    window.showPage('dashboard');
  });
  await new Promise(r => setTimeout(r, 1200));

  // 4. Mobile Dashboard (App Store Showcase 1)
  console.log('📸 4. Mobile Dashboard (Showcase 1)...');
  const mobDashPath = path.join(OUT_DIR, 'mobile_dashboard.png');
  await page.screenshot({ path: mobDashPath });
  fs.copyFileSync(mobDashPath, path.join(PUBLIC_DIR, 'mobile_dashboard.png'));

  // 5. Mobile AI Chat (App Store Showcase 2)
  console.log('📸 5. Mobile AI Chat (Showcase 2)...');
  await page.evaluate(() => {
    window.showPage('chat');
    const input = document.getElementById('chatInput');
    if (input) {
      input.value = "Quels sont les meilleurs aliments pour dissoudre le mucus selon Ehret et Dr. Sebi ?";
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  const mobChatPath = path.join(OUT_DIR, 'mobile_ai_chat.png');
  await page.screenshot({ path: mobChatPath });
  fs.copyFileSync(mobChatPath, path.join(PUBLIC_DIR, 'mobile_ai_chat.png'));

  // 6. Mobile Scanner IA (Showcase 3)
  console.log('📸 6. Mobile Scanner IA (Showcase 3)...');
  await page.evaluate(() => {
    window.showPage('scanner');
  });
  await new Promise(r => setTimeout(r, 1000));
  const mobScanPath = path.join(OUT_DIR, 'mobile_scanner.png');
  await page.screenshot({ path: mobScanPath });
  fs.copyFileSync(mobScanPath, path.join(PUBLIC_DIR, 'mobile_scanner.png'));

  // 7. Mobile Médiathèque Bilingue (Showcase 4)
  console.log('📸 7. Mobile Médiathèque Bilingue (Showcase 4)...');
  await page.evaluate(() => {
    window.showPage('resources');
  });
  await new Promise(r => setTimeout(r, 1000));
  const mobMediaPath = path.join(OUT_DIR, 'mobile_media.png');
  await page.screenshot({ path: mobMediaPath });
  fs.copyFileSync(mobMediaPath, path.join(PUBLIC_DIR, 'mobile_media.png'));

  // 8. Mobile Privacy Policy (Showcase 5)
  console.log('📸 8. Mobile Privacy Policy (Showcase 5)...');
  await page.goto(`${LOCAL_URL}/privacy.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  const mobPrivacyPath = path.join(OUT_DIR, 'mobile_privacy.png');
  await page.screenshot({ path: mobPrivacyPath });
  fs.copyFileSync(mobPrivacyPath, path.join(PUBLIC_DIR, 'mobile_privacy.png'));

  await browser.close();
  server.close();
  console.log('\n🎉 TOUTES LES 8 CAPTURES D\'ÉCRAN HD ONT ÉTÉ GÉNÉRÉES AVEC SUCCÈS !');
}

run().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
