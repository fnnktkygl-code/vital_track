const puppeteer = require('/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.resolve(__dirname, '../scratch/yt_frames');
const AUDIO_DIR = path.resolve(__dirname, '../scratch/yt_audio');
const OUTPUT_VIDEO = path.resolve(__dirname, '../vitaltrack_youtube_presentation.mp4');
const ARTIFACT_VIDEO = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/vitaltrack_youtube_presentation.mp4';

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Clear scratch frames directory
const oldFiles = fs.readdirSync(FRAMES_DIR);
for (const f of oldFiles) fs.unlinkSync(path.join(FRAMES_DIR, f));

const FPS = 30; // 30 fps for buttery smooth YouTube quality

const SCENES = [
  { id: 'seg1_intro', dur: 7.91, title: 'LE COCKPIT DE SANTÉ CELLULAIRE' },
  { id: 'seg2_voice_ai', dur: 9.23, title: 'COACH VOCAL IA EN TEMPS RÉEL' },
  { id: 'seg3_meal_card', dur: 7.91, title: 'PROTOCOLES IA & CARTES D\'ACTION 1-CLIC' },
  { id: 'seg4_calendar', dur: 10.00, title: 'CALENDRIER COCKPIT 14 JOURS' },
  { id: 'seg5_scanner', dur: 7.81, title: 'SCANNER PRAL & PHARMACOPÉE VITALISTE' },
  { id: 'seg6_outro', dur: 7.86, title: 'VITALTRACK — DISPONIBLE DÈS MAINTENANT' }
];

async function setupOverlays(page) {
  await page.evaluate(() => {
    // Inject Custom YouTuber Camera & Cursor Controller
    const style = document.createElement('style');
    style.id = 'yt-studio-styles';
    style.innerHTML = `
      /* Disable scrollbars & toasts */
      ::-webkit-scrollbar { display: none !important; }
      #pwaInstallBanner, .toast, .vital-toast { display: none !important; opacity: 0 !important; }

      /* Virtual Camera Container */
      .app-container, .main-content, .page {
        transform-origin: 50% 45%;
        transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        will-change: transform;
      }

      /* YouTuber Style Floating Cursor */
      #yt-virtual-cursor {
        position: fixed;
        width: 36px;
        height: 36px;
        z-index: 999999;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: left 0.12s ease-out, top 0.12s ease-out, transform 0.1s ease;
      }
      #yt-virtual-cursor::before {
        content: '';
        position: absolute;
        width: 26px;
        height: 26px;
        background: rgba(16, 185, 129, 0.35);
        border: 2.5px solid #34d399;
        border-radius: 50%;
        box-shadow: 0 0 20px rgba(52, 211, 153, 0.9);
        animation: cursorPulse 1s infinite alternate;
      }
      #yt-virtual-cursor.clicking::before {
        transform: scale(0.6);
        background: rgba(52, 211, 153, 1);
        box-shadow: 0 0 35px #10b981;
      }
      @keyframes cursorPulse {
        from { transform: scale(0.85); opacity: 0.8; }
        to { transform: scale(1.3); opacity: 1; }
      }

      /* YouTuber Lower Third Badge */
      #yt-lower-third {
        position: fixed;
        bottom: 35px;
        left: 45px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(11, 19, 38, 0.92);
        backdrop-filter: blur(20px);
        border: 1.5px solid rgba(16, 185, 129, 0.5);
        padding: 14px 28px;
        border-radius: 40px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(16, 185, 129, 0.3);
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      }
      #yt-lower-third .logo-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.2);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(16, 185, 129, 0.4);
        font-weight: 800;
        font-size: 0.95rem;
        color: #34d399;
        letter-spacing: 0.5px;
      }
      #yt-lower-third .topic-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      #yt-live-rec {
        position: fixed;
        top: 28px;
        right: 36px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(11, 19, 38, 0.9);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 10px 20px;
        border-radius: 24px;
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 800;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      }
      #yt-live-rec .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 14px #ef4444;
        animation: blink 0.9s infinite alternate;
      }
      @keyframes blink {
        from { opacity: 0.2; transform: scale(0.85); }
        to { opacity: 1; transform: scale(1.15); }
      }
    `;
    document.head.appendChild(style);

    // Add Cursor Element
    const cursor = document.createElement('div');
    cursor.id = 'yt-virtual-cursor';
    cursor.style.left = '960px';
    cursor.style.top = '540px';
    document.body.appendChild(cursor);

    // Add Lower Third
    const lt = document.createElement('div');
    lt.id = 'yt-lower-third';
    lt.innerHTML = `
      <div class="logo-pill">
        <span>🐦</span>
        <span>VITALTRACK</span>
      </div>
      <div class="topic-title" id="ytTopicTitle">LE COCKPIT DE SANTÉ CELLULAIRE</div>
    `;
    document.body.appendChild(lt);

    // Add Live Rec Indicator
    const rec = document.createElement('div');
    rec.id = 'yt-live-rec';
    rec.innerHTML = `<span class="dot"></span> <span>PRÉSENTATION OFFICIELLE 4K</span>`;
    document.body.appendChild(rec);

    // Global Camera Controller
    window.setCamera = (scale = 1, x = 0, y = 0) => {
      const el = document.querySelector('.main-content') || document.querySelector('.app-container');
      if (el) {
        el.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
      }
    };

    window.moveCursor = (x, y, clicking = false) => {
      const cur = document.getElementById('yt-virtual-cursor');
      if (cur) {
        cur.style.left = `${x}px`;
        cur.style.top = `${y}px`;
        if (clicking) cur.classList.add('clicking');
        else cur.classList.remove('clicking');
      }
    };

    window.setTopic = (title) => {
      const el = document.getElementById('ytTopicTitle');
      if (el) el.textContent = title;
    };
  });
}

(async () => {
  console.log('🚀 Lancement du moteur de rendu vidéo YouTube (1080p @ 30 FPS)...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await setupOverlays(page);

  let frameCounter = 0;

  async function snapFrame() {
    const framePath = path.join(FRAMES_DIR, `frame_${String(frameCounter).padStart(6, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    frameCounter++;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 1 : INTRO & DASHBOARD (7.91s = ~237 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [1/6] Rendu Scène 1 : Intro & Dashboard...');
  await page.evaluate(() => {
    window.showPage('dashboard');
    window.setTopic('VITALTRACK — LE COCKPIT DE SANTÉ CELLULAIRE');
  });

  const scene1Frames = Math.floor(SCENES[0].dur * FPS);
  for (let i = 0; i < scene1Frames; i++) {
    const p = i / scene1Frames;
    await page.evaluate((progress) => {
      // Dynamic camera zoom towards the center bio-vitality card
      const zoom = 1 + Math.sin(progress * Math.PI) * 0.18;
      const x = -progress * 60;
      const y = -progress * 40;
      window.setCamera(zoom, x, y);

      // Smooth cursor movement across dashboard
      const curX = 960 + Math.sin(progress * 4) * 200;
      const curY = 400 + Math.cos(progress * 3) * 120;
      window.moveCursor(curX, curY);
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 2 : COACH VOCAL IA & DICTÉE STREAMING (9.23s = ~277 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [2/6] Rendu Scène 2 : Coach Vocal IA...');
  await page.evaluate(() => {
    window.showPage('chat');
    window.setTopic('COACH VOCAL IA EN TEMPS RÉEL (ZERO QUOTA)');
    const container = document.getElementById('chatMessages');
    if (container) container.innerHTML = '';
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
  });

  const fullPrompt = "Comment régénérer ma flore intestinale avec les plantes du Québec ?";
  const scene2Frames = Math.floor(SCENES[1].dur * FPS);

  for (let i = 0; i < scene2Frames; i++) {
    const p = i / scene2Frames;
    await page.evaluate(({ progress, promptText }) => {
      // Camera zooms heavily into the chat voice bar
      if (progress < 0.4) {
        window.setCamera(1.25, 0, -80);
        window.moveCursor(1240, 920, progress > 0.15 && progress < 0.35); // Move over mic button
        const voiceHUD = document.getElementById('voiceStreamingHUD');
        if (voiceHUD && progress > 0.2) voiceHUD.classList.add('active');

        const input = document.getElementById('chatInput');
        const charCount = Math.floor(Math.min(1, (progress - 0.2) / 0.5) * promptText.length);
        if (input && progress > 0.2) input.value = promptText.substring(0, Math.max(0, charCount));
      } else {
        // Send message
        window.setCamera(1.15, 0, -40);
        window.moveCursor(1320, 920, progress < 0.5);
        const voiceHUD = document.getElementById('voiceStreamingHUD');
        if (voiceHUD) voiceHUD.classList.remove('active');

        const container = document.getElementById('chatMessages');
        if (container && !document.getElementById('user-msg-yt')) {
          const uMsg = document.createElement('div');
          uMsg.id = 'user-msg-yt';
          uMsg.className = 'chat-message user';
          uMsg.innerHTML = `<div class="chat-bubble user-bubble">${promptText}</div>`;
          container.appendChild(uMsg);
          const input = document.getElementById('chatInput');
          if (input) input.value = '';
        }
      }
    }, { progress: p, promptText: fullPrompt });
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 3 : PROTOCOLES IA & CARTE D'ACTION 1-CLIC (7.91s = ~237 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [3/6] Rendu Scène 3 : Protocole IA & Carte d\'Action...');
  await page.evaluate(() => {
    window.setTopic('PROTOCOLES IA & CARTES D\'ACTION 1-CLIC');
    const container = document.getElementById('chatMessages');
    if (container && !document.getElementById('ai-msg-yt')) {
      const aiMsg = document.createElement('div');
      aiMsg.id = 'ai-msg-yt';
      aiMsg.className = 'chat-message ai';
      aiMsg.innerHTML = `
        <div class="chat-bubble ai-bubble" style="max-width:88%; font-size:1.05rem;">
          <div style="font-weight:800; color:#34d399; margin-bottom:8px; font-size:1.2rem;">🌿 Protocole Régénération Boréale & Muqueuses</div>
          <p style="margin-bottom:10px; line-height:1.6;">Pour réparer la barrière intestinale et drainer les acides lymphatiques, voici le programme sans mucus adapté au climat boréal :</p>
          <div id="yt-plan-card" style="margin-top:14px; padding:18px; border-radius:14px; background:rgba(16,185,129,0.1); border:1.5px solid rgba(16,185,129,0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-weight:800; color:#fff; font-size:1.15rem;">📅 Programme Détox 7 Jours (Québec)</div>
              <span style="background:#10b981; color:#fff; padding:4px 12px; border-radius:10px; font-weight:700; font-size:0.85rem;">100% Personnalisé</span>
            </div>
            <p style="font-size:0.95rem; color:#94a3b8; margin:8px 0 14px;">Chaga Boréal • Bleuets Sauvages • Eau d'Érable • Zéro Mucus</p>
            <button id="yt-apply-btn" style="padding:10px 22px; border-radius:10px; background:#10b981; color:#fff; border:none; font-weight:800; font-size:1rem; cursor:pointer; box-shadow:0 0 20px rgba(16,185,129,0.5);">
              📅 Appliquer au calendrier
            </button>
          </div>
        </div>
      `;
      container.appendChild(aiMsg);
    }
  });

  const scene3Frames = Math.floor(SCENES[2].dur * FPS);
  for (let i = 0; i < scene3Frames; i++) {
    const p = i / scene3Frames;
    await page.evaluate((progress) => {
      // Zoom right into the Diet Plan Card
      window.setCamera(1.35, -20, 20);
      const isClick = progress >= 0.6 && progress <= 0.8;
      window.moveCursor(1020, 680, isClick);

      const btn = document.getElementById('yt-apply-btn');
      if (btn && progress >= 0.7) {
        btn.innerHTML = '✅ Protocole Planifié avec Succès !';
        btn.style.background = '#059669';
      }
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 4 : CALENDRIER COCKPIT & VALIDATION DES REPAS (10.00s = ~300 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [4/6] Rendu Scène 4 : Calendrier Cockpit 14 Jours...');
  await page.evaluate(() => {
    window.showPage('calendar');
    window.setTopic('CALENDRIER COCKPIT 14 JOURS & VALIDATION');
    const planReq = { protocol: 'personalized', numDays: 7, objective: 'Détox Hivernale Boréale' };
    if (window.applyDietPlanRequest) window.applyDietPlanRequest(planReq, 'replace');

    const calMeals = window.store.get('calendar_meals', []);
    if (calMeals.length >= 3) {
      calMeals[0].done = false;
      calMeals[1].done = false;
      calMeals[2].done = false;
      window.store.set('calendar_meals', calMeals);
    }
    if (window.renderDay) window.renderDay();
    if (window.renderStrip) window.renderStrip();
  });

  const scene4Frames = Math.floor(SCENES[3].dur * FPS);
  for (let i = 0; i < scene4Frames; i++) {
    const p = i / scene4Frames;
    await page.evaluate((progress) => {
      // Dynamic camera panning across strip then to meal cards
      if (progress < 0.4) {
        window.setCamera(1.25, 0, 100);
        window.moveCursor(960 + Math.sin(progress * 5) * 150, 320);
      } else {
        window.setCamera(1.2, 0, -20);
        const calMeals = window.store.get('calendar_meals', []);
        if (calMeals.length >= 3) {
          if (progress >= 0.45) {
            calMeals[0].done = true;
            window.moveCursor(1200, 480, progress < 0.55);
          }
          if (progress >= 0.7) {
            calMeals[1].done = true;
            window.moveCursor(1200, 620, progress < 0.8);
          }
          if (progress >= 0.88) {
            calMeals[2].done = true;
            window.moveCursor(1200, 760, true);
          }
          window.store.set('calendar_meals', calMeals);
          if (window.renderDay) window.renderDay();
          if (window.renderStrip) window.renderStrip();
        }
      }
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 5 : SCANNER PRAL & PHARMACOPÉE VITALISTE (7.81s = ~234 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [5/6] Rendu Scène 5 : Scanner Visuel & Indice PRAL...');
  await page.evaluate(() => {
    window.showPage('scan');
    window.setTopic('SCANNER VISUEL & BIO-CHIMIE PRAL RÉNAL');
    const scanResultText = `**Assiette Vivante : Avocat Mûr, Pourpier Sauvage & Bleuets**
Densité enzymatique et photonique maximale.

### Statut Vitaliste & Bio-Minéral
- **Classification :** ⚡ 100% Électrique & Alcalinisant
- **Indice PRAL Rénal :** -9.2 mEq/100g (Alcalinisant)
- **Classification NOVA :** NOVA 1 (Brut & Vivant)
- **Impact Mucus :** Dissolvant`;

    if (window.renderScanResult) {
      window.renderScanResult(scanResultText);
      const resBox = document.getElementById('scanResult');
      if (resBox) resBox.style.display = 'block';
    }
  });

  const scene5Frames = Math.floor(SCENES[4].dur * FPS);
  for (let i = 0; i < scene5Frames; i++) {
    const p = i / scene5Frames;
    await page.evaluate((progress) => {
      window.setCamera(1.22, 0, -40);
      window.moveCursor(960 + Math.cos(progress * 4) * 140, 520 + Math.sin(progress * 3) * 80);
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 6 : OUTRO & CALL TO ACTION (7.86s = ~236 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [6/6] Rendu Scène 6 : Outro & Call to Action...');
  await page.evaluate(() => {
    window.showPage('dashboard');
    window.setTopic('VITALTRACK — DISPONIBLE SUR VITALTRACKAPP.VERCEL.APP');
  });

  const scene6Frames = Math.floor(SCENES[5].dur * FPS);
  for (let i = 0; i < scene6Frames; i++) {
    const p = i / scene6Frames;
    await page.evaluate((progress) => {
      // Zoom out smoothly to full view
      const zoom = 1.15 - (progress * 0.15);
      window.setCamera(zoom, 0, 0);
      window.moveCursor(960, 540);
    }, p);
    await snapFrame();
  }

  await browser.close();
  console.log(`✅ ${frameCounter} frames capturées en Full HD !`);

  // ═════════════════════════════════════════════════════════════════════════
  // ENCODAGE FINAL AVEC VOIX OFF ET AMBIANCE MUSICALE
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎧 Mixage audio et encodage vidéo MP4 H.264...');
  const voiceoverPath = path.join(AUDIO_DIR, 'master_voiceover.mp3');
  const inputPattern = path.join(FRAMES_DIR, 'frame_%06d.png');

  // Generate subtle chill ambient music background with ffmpeg lavfi synthesizer
  const bgMusicPath = path.join(AUDIO_DIR, 'ambient_bg.mp3');
  try {
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=174:duration=55" -filter_complex "[0:a]volume=0.035,lowpass=f=400,afade=t=in:ss=0:d=2,afade=t=out:st=49:d=2[a]" -map "[a]" "${bgMusicPath}"`,
      { stdio: 'pipe' }
    );
  } catch (e) {}

  // Final Merge: Video (H.264 60fps/30fps 1080p) + Voiceover + Background Ambient
  try {
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -i "${voiceoverPath}" -i "${bgMusicPath}" -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.05[m];[v][m]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -crf 18 -preset fast -c:a aac -b:a 256k -shortest "${OUTPUT_VIDEO}"`,
      { stdio: 'inherit' }
    );
    fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
    console.log(`\n🎉 VIDÉO YOUTUBE PRO GÉNÉRÉE AVEC SUCCÈS !\n📁 Fichier: ${OUTPUT_VIDEO}`);
  } catch (err) {
    console.error('❌ Erreur lors de l\'encodage vidéo final:', err);
  }
})();
