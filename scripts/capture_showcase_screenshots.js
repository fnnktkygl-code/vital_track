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

function startLocalServer(port = 8282) {
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
      console.log(`📡 Serveur local pour captures démarré sur http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function cleanToastsAndNoise(page) {
  await page.evaluate(() => {
    // Supprimer tous les toasts et empêcher leur affichage
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
      toastContainer.innerHTML = '';
      toastContainer.style.display = 'none';
    }
    window.showToast = () => {};
    document.querySelectorAll('.toast, .toast-notification').forEach(el => el.remove());
  });
}

async function run() {
  const server = await startLocalServer(8282);
  const LOCAL_URL = 'http://localhost:8282';

  console.log('🚀 Lancement de Google Chrome pour générer les visuels ultra-propres et immersifs...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  // ═══════════════════════════════════════════════════════════════
  // 💻 1. DESKTOP VIEWPORT (1440 x 900 @ 2x)
  // ═══════════════════════════════════════════════════════════════
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  console.log(`🌐 Chargement Desktop...`);
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' });

  // Initialisation d'un profil propre et de données authentiques
  await page.evaluate(() => {
    if (window.vitalTrackAuth) {
      window.vitalTrackAuth.signInWithEmail('vitaliste@vitaltrack.io', 'Alexandre');
    }

    // Repas complets
    const sampleMeals = [
      {
        id: 'meal_1',
        timestamp: Date.now() - 3600000 * 2,
        name: 'Grand Bol Vivant Électrique (Dr. Sebi)',
        category: 'repas',
        pral: -16.4,
        nova: 1,
        foods: [
          { name: 'Mâche & Roquette sauvage', isRaw: true, isElectric: true, pral: -5.8 },
          { name: 'Concombre à graines & Avocat Hass', isRaw: true, isElectric: true, pral: -6.4 },
          { name: 'Graines de Chanvre & Huile d\'Olive crue', isRaw: true, pral: -4.2 }
        ],
        advice: 'Alcalinité maximale. Élimination active du mucus et régénération cellulaire.'
      },
      {
        id: 'meal_2',
        timestamp: Date.now() - 3600000 * 20,
        name: 'Mono-Diète de Raisins Noirs Astringents (Dr. Morse)',
        category: 'collation',
        pral: -9.5,
        nova: 1,
        foods: [
          { name: 'Raisins Noirs à pépins bio', isRaw: true, isElectric: true, pral: -9.5 }
        ],
        advice: 'Drainage lymphatique profond et filtration rénale optimale.'
      }
    ];
    localStorage.setItem('vt-u_g_dml0YWxpc3RlQHZp-meals', JSON.stringify(sampleMeals));

    // Jeûne en autophagie active (16h30 / 18h)
    const fastingState = {
      isFasting: true,
      startTime: Date.now() - 3600000 * 16.5,
      targetHours: 18,
      protocol: '18:6 (Régénération & Autophagie)',
      fastType: 'water'
    };
    localStorage.setItem('vt-u_g_dml0YWxpc3RlQHZp-fasting-state', JSON.stringify(fastingState));

    if (typeof window.showPage === 'function') {
      window.showPage('dashboard');
    }
  });

  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 1000));

  // 1. Desktop Dashboard
  console.log('📸 1. Desktop Dashboard (Propre, sans bruit)...');
  await cleanToastsAndNoise(page);
  const deskDashPath = path.join(OUT_DIR, 'desktop_dashboard.png');
  await page.screenshot({ path: deskDashPath });
  fs.copyFileSync(deskDashPath, path.join(PUBLIC_DIR, 'desktop_dashboard.png'));

  // 2. Desktop Privacy & RGPD
  console.log('📸 2. Desktop Privacy Policy...');
  await page.goto(`${LOCAL_URL}/privacy.html`, { waitUntil: 'networkidle0' });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 800));
  const deskPrivacyPath = path.join(OUT_DIR, 'desktop_privacy.png');
  await page.screenshot({ path: deskPrivacyPath });
  fs.copyFileSync(deskPrivacyPath, path.join(PUBLIC_DIR, 'desktop_privacy.png'));

  // ═══════════════════════════════════════════════════════════════
  // 📱 2. MOBILE IPHONE 15 PRO (393 x 852 @ 3x)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📱 Passage en résolution Mobile (iPhone 15 Pro)...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(LOCAL_URL, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    if (window.vitalTrackAuth) {
      window.vitalTrackAuth.signInWithEmail('vitaliste@vitaltrack.io', 'Alexandre');
    }
    window.showPage('dashboard');
  });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 1000));

  // 3. Mobile Dashboard
  console.log('📸 3. Mobile Dashboard (App Store Showcase 1)...');
  await cleanToastsAndNoise(page);
  const mobDashPath = path.join(OUT_DIR, 'mobile_dashboard.png');
  await page.screenshot({ path: mobDashPath });
  fs.copyFileSync(mobDashPath, path.join(PUBLIC_DIR, 'mobile_dashboard.png'));

  // 4. Mobile AI Chat - Simulation d'une vraie consultation riche
  console.log('📸 4. Mobile AI Chat avec réponse complète (App Store Showcase 2)...');
  await page.evaluate(() => {
    window.showPage('chat');
    const welcome = document.getElementById('chatWelcome');
    if (welcome) welcome.style.display = 'none';

    const container = document.getElementById('chatMessages');
    if (container) {
      container.innerHTML = `
        <div class="chat-msg chat-user" style="display:flex; justify-content:flex-end; margin-bottom:14px;">
          <div style="background:var(--accent); color:#090d16; padding:12px 16px; border-radius:18px 18px 4px 18px; font-weight:600; max-width:85%; font-size:0.92rem;">
            Peux-tu me composer une journée type 100% vivante sans mucus selon Ehret et Dr. Sebi pour dissoudre mes toxines ?
          </div>
        </div>
        <div class="chat-msg chat-bot" style="display:flex; gap:10px; margin-bottom:16px;">
          <div style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); padding:16px; border-radius:18px 18px 18px 4px; color:#f8fafc; font-size:0.9rem; line-height:1.6; max-width:92%;">
            <div style="font-weight:700; color:var(--accent); margin-bottom:8px; display:flex; align-items:center; gap:6px;">
              <span>🌿 Protocole de Régénération Sans Mucus</span>
            </div>
            <p style="margin-bottom:8px;">Voici votre protocole d'électrisation cellulaire basé sur les enseignements d'<strong>Arnold Ehret</strong> et du <strong>Dr. Sebi</strong> :</p>
            <div style="background:rgba(52,211,153,0.08); border-left:3px solid var(--accent); padding:8px 12px; border-radius:4px 8px 8px 4px; margin-bottom:10px;">
              <strong>☀️ Matin (08h - 11h) :</strong> Jeûne intermittent hydrique + 500ml d'eau de source tiède citronnée ou infusion de racine de Bardane (Burdock).
            </div>
            <div style="background:rgba(52,211,153,0.08); border-left:3px solid var(--accent); padding:8px 12px; border-radius:4px 8px 8px 4px; margin-bottom:10px;">
              <strong>🍇 Midi (12h30) :</strong> Grand bol de fruits astringents (raisins noirs à pépins ou papaye sauvage) — <em>Indice PRAL : -14.5 mEq</em>.
            </div>
            <div style="background:rgba(52,211,153,0.08); border-left:3px solid var(--accent); padding:8px 12px; border-radius:4px 8px 8px 4px;">
              <strong>🥗 Soir (19h00) :</strong> Salade vivante de mâche, concombre sauvage, avocat mûr et graines de chanvre crue.
            </div>
          </div>
        </div>
      `;
    }
  });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 600));
  const mobChatPath = path.join(OUT_DIR, 'mobile_ai_chat.png');
  await page.screenshot({ path: mobChatPath });
  fs.copyFileSync(mobChatPath, path.join(PUBLIC_DIR, 'mobile_ai_chat.png'));

  // 5. Mobile Scanner IA - Simulation d'une assiette analysée
  console.log('📸 5. Mobile Scanner IA avec résultat (App Store Showcase 3)...');
  await page.evaluate(() => {
    window.showPage('scanner');
    const promptZone = document.getElementById('scanPromptZone');
    const resultZone = document.getElementById('scanResult');
    const loadingZone = document.getElementById('scanLoading');
    if (promptZone) promptZone.style.display = 'none';
    if (loadingZone) loadingZone.style.display = 'none';
    if (resultZone) {
      resultZone.style.display = 'block';
      resultZone.innerHTML = `
        <div style="background:rgba(17,24,39,0.85); border:1px solid rgba(52,211,153,0.3); border-radius:20px; padding:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:rgba(52,211,153,0.15); color:var(--accent); padding:4px 10px; border-radius:20px; font-weight:700; font-size:0.8rem;">
              ⚡ Dr. Sebi Électrique Certifié
            </span>
            <span style="background:rgba(59,130,246,0.15); color:#60a5fa; padding:4px 10px; border-radius:20px; font-weight:700; font-size:0.8rem;">
              NOVA 1 (Brut 100%)
            </span>
          </div>
          <h3 style="font-size:1.25rem; font-weight:800; color:#fff; margin-bottom:8px;">Assiette Vivante &amp; Avocat Sauvage</h3>
          <p style="font-size:0.86rem; color:#94a3b8; line-height:1.5; margin-bottom:16px;">
            Ingrédients identifiés : Mâche sauvage, Concombre à graines, Avocat Hass, Graines de Chanvre, Huile d'olive vierge extra.
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
            <div style="background:rgba(255,255,255,0.04); padding:12px; border-radius:12px; text-align:center;">
              <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Indice PRAL Rénal</div>
              <div style="font-size:1.3rem; font-weight:800; color:var(--accent);">-16.4 mEq</div>
              <div style="font-size:0.72rem; color:#34d399;">Fortement Alcalinisant</div>
            </div>
            <div style="background:rgba(255,255,255,0.04); padding:12px; border-radius:12px; text-align:center;">
              <div style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Impact Mucogène</div>
              <div style="font-size:1.3rem; font-weight:800; color:#38bdf8;">0% Mucus</div>
              <div style="font-size:0.72rem; color:#38bdf8;">Dissolvant Actif</div>
            </div>
          </div>
          <div style="background:rgba(52,211,153,0.08); border-left:3px solid var(--accent); padding:10px 14px; border-radius:0 10px 10px 0; font-size:0.84rem; color:#cbd5e1;">
            💡 <strong>Conseil Vitaliste :</strong> Ajoutez une pincée d'algues Fucus ou Sea Moss pour maximiser les 92 minéraux ioniques essentiels.
          </div>
        </div>
      `;
    }
  });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 600));
  const mobScanPath = path.join(OUT_DIR, 'mobile_scanner.png');
  await page.screenshot({ path: mobScanPath });
  fs.copyFileSync(mobScanPath, path.join(PUBLIC_DIR, 'mobile_scanner.png'));

  // 6. Mobile Médiathèque Bilingue (Showcase 4)
  console.log('📸 6. Mobile Médiathèque Bilingue...');
  await page.evaluate(() => {
    window.showPage('resources');
  });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 800));
  const mobMediaPath = path.join(OUT_DIR, 'mobile_media.png');
  await page.screenshot({ path: mobMediaPath });
  fs.copyFileSync(mobMediaPath, path.join(PUBLIC_DIR, 'mobile_media.png'));

  // 7. Mobile Privacy Policy (Showcase 5)
  console.log('📸 7. Mobile Privacy Policy...');
  await page.goto(`${LOCAL_URL}/privacy.html`, { waitUntil: 'networkidle0' });
  await cleanToastsAndNoise(page);
  await new Promise(r => setTimeout(r, 800));
  const mobPrivacyPath = path.join(OUT_DIR, 'mobile_privacy.png');
  await page.screenshot({ path: mobPrivacyPath });
  fs.copyFileSync(mobPrivacyPath, path.join(PUBLIC_DIR, 'mobile_privacy.png'));

  await browser.close();
  server.close();
  console.log('\n🎉 TOUTES LES NOUVELLES CAPTURES IMMERSIVES ONT ÉTÉ GÉNÉRÉES SANS AUCUN BRUIT !');
}

run().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
