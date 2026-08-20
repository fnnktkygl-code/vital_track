const puppeteer = require('/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRAMES_DIR = path.resolve(__dirname, '../scratch/yt_frames');
const AUDIO_DIR = path.resolve(__dirname, '../scratch/yt_audio_ariane');
const OUTPUT_VIDEO = path.resolve(__dirname, '../vitaltrack_youtube_presentation.mp4');
const ARTIFACT_VIDEO = '/Users/richard/.gemini/antigravity-ide/brain/1f0edc3f-a36f-4d31-bcf9-3c69abedfe85/vitaltrack_youtube_presentation.mp4';

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Clear scratch frames directory
const oldFiles = fs.readdirSync(FRAMES_DIR);
for (const f of oldFiles) fs.unlinkSync(path.join(FRAMES_DIR, f));

const FPS = 30; // 30 fps for smooth video playback

// Scene durations matching Ariane Swiss voiceover (total ~75.8s)
const SCENES = [
  { id: 'seg1_intro', dur: 11.73, title: 'LE COCKPIT DE SANTÉ CELLULAIRE' },
  { id: 'seg2_voice_ai', dur: 15.21, title: 'COACH VOCAL IA & DICTÉE EN STREAMING' },
  { id: 'seg3_meal_card', dur: 14.78, title: 'PROTOCOLES IA & CARTES D\'ACTION 1-CLIC' },
  { id: 'seg4_calendar', dur: 13.91, title: 'CALENDRIER COCKPIT 14 JOURS' },
  { id: 'seg5_scanner', dur: 8.54, title: 'SCANNER PRAL & ALIMENTATION VIVANTE' },
  { id: 'seg6_outro', dur: 11.70, title: 'VITALTRACK — DISPONIBLE SUR VITALTRACKAPP.VERCEL.APP' }
];

async function setupOverlays(page) {
  await page.evaluate(() => {
    // Inject Custom Smooth Cursor & Lower Third Badge (NO artificial zoom)
    const style = document.createElement('style');
    style.id = 'yt-studio-styles';
    style.innerHTML = `
      /* Disable scrollbars & toasts */
      ::-webkit-scrollbar { display: none !important; }
      #pwaInstallBanner, .toast, .vital-toast { display: none !important; opacity: 0 !important; }

      /* Authentic YouTuber Floating Cursor */
      #yt-virtual-cursor {
        position: fixed;
        width: 32px;
        height: 32px;
        z-index: 999999;
        pointer-events: none;
        transform: translate(-50%, -50%);
        transition: left 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.1s ease;
      }
      #yt-virtual-cursor::before {
        content: '';
        position: absolute;
        width: 22px;
        height: 22px;
        background: rgba(16, 185, 129, 0.3);
        border: 2px solid #34d399;
        border-radius: 50%;
        box-shadow: 0 0 16px rgba(52, 211, 153, 0.8);
        animation: cursorPulse 1.2s infinite alternate;
      }
      #yt-virtual-cursor.clicking::before {
        transform: scale(0.65);
        background: rgba(52, 211, 153, 1);
        box-shadow: 0 0 30px #10b981;
      }
      @keyframes cursorPulse {
        from { transform: scale(0.9); opacity: 0.8; }
        to { transform: scale(1.25); opacity: 1; }
      }

      /* YouTuber Lower Third Badge */
      #yt-lower-third {
        position: fixed;
        bottom: 30px;
        left: 40px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 16px;
        background: rgba(11, 19, 38, 0.92);
        backdrop-filter: blur(16px);
        border: 1.5px solid rgba(16, 185, 129, 0.4);
        padding: 12px 24px;
        border-radius: 40px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(16, 185, 129, 0.25);
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      }
      #yt-lower-third .logo-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(16, 185, 129, 0.15);
        padding: 6px 14px;
        border-radius: 20px;
        border: 1px solid rgba(16, 185, 129, 0.3);
        font-weight: 800;
        font-size: 0.9rem;
        color: #34d399;
        letter-spacing: 0.5px;
      }
      #yt-lower-third .topic-title {
        color: #ffffff;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: 0.5px;
      }
      #yt-live-rec {
        position: fixed;
        top: 24px;
        right: 32px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(11, 19, 38, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 18px;
        border-radius: 20px;
        color: #ffffff;
        font-size: 0.85rem;
        font-weight: 800;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      #yt-live-rec .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 12px #ef4444;
        animation: blink 0.9s infinite alternate;
      }
      @keyframes blink {
        from { opacity: 0.3; }
        to { opacity: 1; }
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
  console.log('🚀 Lancement du rendu vidéo YouTube Authentique (Voix Ariane Suisse, ZÉRO rognage, 1080p @ 30 FPS)...');
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
  // SCÈNE 1 : INTRO & DASHBOARD (11.73s = ~352 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [1/6] Rendu Scène 1 : Intro & Dashboard (Voix Ariane)...');
  await page.evaluate(() => {
    window.showPage('dashboard');
    window.setTopic('VITALTRACK — LE COCKPIT DE SANTÉ CELLULAIRE');
  });

  const scene1Frames = Math.floor(SCENES[0].dur * FPS);
  for (let i = 0; i < scene1Frames; i++) {
    const p = i / scene1Frames;
    await page.evaluate((progress) => {
      // Smooth cursor navigation across dashboard cards
      let curX = 960, curY = 540;
      if (progress < 0.4) {
        curX = 720 + Math.sin(progress * 4) * 80;
        curY = 380 + Math.cos(progress * 3) * 60;
      } else if (progress < 0.75) {
        curX = 1200 + Math.sin(progress * 4) * 70;
        curY = 400 + Math.cos(progress * 3) * 50;
      } else {
        curX = 960;
        curY = 620;
      }
      window.moveCursor(curX, curY);
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 2 : COACH VOCAL IA & DICTÉE EN TEMPS RÉEL (15.21s = ~456 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [2/6] Rendu Scène 2 : Coach Vocal IA & Voix Ariane Suisse...');
  await page.evaluate(() => {
    window.showPage('chat');
    window.setTopic('COACH VOCAL IA & DICTÉE EN STREAMING');
    
    // Set Swiss Coach Ariane Voice in UI
    const voiceIcon = document.getElementById('chatVoiceGenderIcon');
    if (voiceIcon) voiceIcon.textContent = '🇨🇭';
    const voiceLabel = document.getElementById('chatActiveVoiceLabel');
    if (voiceLabel) voiceLabel.innerHTML = '<span class="voice-name-full">Ariane (Suisse)</span><span class="voice-name-short">Ariane</span>';

    const container = document.getElementById('chatMessages');
    if (container) container.innerHTML = '';
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
    const welcome = document.getElementById('chatWelcome');
    if (welcome) welcome.style.display = 'none';
  });

  const fullPrompt = "Comment régénérer ma flore intestinale avec les plantes du Québec ?";
  const scene2Frames = Math.floor(SCENES[1].dur * FPS);

  for (let i = 0; i < scene2Frames; i++) {
    const p = i / scene2Frames;
    await page.evaluate(({ progress, promptText }) => {
      if (progress < 0.55) {
        // Move cursor to mic button and activate streaming indicator
        window.moveCursor(1020, 1020, progress > 0.15 && progress < 0.25);
        const voiceHUD = document.getElementById('chatVoiceIndicator');
        if (voiceHUD && progress > 0.15) voiceHUD.style.display = 'flex';

        const input = document.getElementById('chatInput');
        const charCount = Math.floor(Math.min(1, (progress - 0.15) / 0.35) * promptText.length);
        if (input && progress > 0.15) input.value = promptText.substring(0, Math.max(0, charCount));
      } else {
        // Send message with real app functions
        window.moveCursor(1440, 1020, progress < 0.65);
        const voiceHUD = document.getElementById('chatVoiceIndicator');
        if (voiceHUD) voiceHUD.style.display = 'none';

        if (!document.getElementById('real-user-msg')) {
          const input = document.getElementById('chatInput');
          if (input) input.value = '';
          if (window.addMessage) {
            window.addMessage(promptText, true);
            const container = document.getElementById('chatMessages');
            const lastMsg = container?.lastElementChild;
            if (lastMsg) lastMsg.id = 'real-user-msg';
          }
          if (window.addTypingIndicator) {
            window.addTypingIndicator();
          }
        }
      }
    }, { progress: p, promptText: fullPrompt });
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 3 : PROTOCOLES IA & CARTE D'ACTION 1-CLIC (14.78s = ~443 frames)
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎬 [3/6] Rendu Scène 3 : Protocole IA & Carte d\'Action...');
  await page.evaluate(() => {
    window.setTopic('PROTOCOLES IA & CARTES D\'ACTION 1-CLIC');
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();

    const realAiText = `### 🔬 Compréhension & Priorités Physiologiques
Pour réparer la barrière intestinale et drainer les acides lymphatiques sans irriter les muqueuses, nous combinons les plantes astringentes et mucilagineuses boréales avec un repos digestif ciblé.

### 📋 Protocole Alimentaire de Transition
• **🌅 Matin :** Eau tiède à la sève d'érable pure et décoction de Chaga boréal.
• **🥗 Déjeuner :** Assiette vivante de verdurettes fraîches, graines de chanvre et avocat mûr.
• **🍵 Collation :** Tisane de feuilles de framboisier et bleuets sauvages.
• **🌙 Dîner :** Velouté tiède de courge musquée cuite à la vapeur douce (< 95°C).

\`\`\`json
{
  \"dietPlanRequest\": {
    \"numDays\": 7,
    \"protocol\": \"personalized\",
    \"objective\": \"apaisement muqueuses & détox boréale\",
    \"restrictions\": \"sans gluten, sans laitage, zéro mucus\"
  }
}
\`\`\``;

    if (window.addMessage && !document.getElementById('real-ai-msg')) {
      window.addMessage(realAiText, false, 'gemini-3.7-flash');
      const container = document.getElementById('chatMessages');
      const lastMsg = container?.lastElementChild;
      if (lastMsg) lastMsg.id = 'real-ai-msg';
    }
  });

  const scene3Frames = Math.floor(SCENES[2].dur * FPS);
  for (let i = 0; i < scene3Frames; i++) {
    const p = i / scene3Frames;
    await page.evaluate((progress) => {
      const isClick = progress >= 0.55 && progress <= 0.75;
      const applyBtn = document.querySelector('#real-ai-msg .diet-plan-card button') || document.querySelector('.diet-plan-card button');
      if (applyBtn) {
        const rect = applyBtn.getBoundingClientRect();
        window.moveCursor(rect.left + rect.width / 2, rect.top + rect.height / 2, isClick);
        if (progress >= 0.65) {
          applyBtn.innerHTML = '✅ Protocole Planifié avec Succès !';
          applyBtn.style.background = '#059669';
        }
      } else {
        window.moveCursor(960, 640, isClick);
      }
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 4 : CALENDRIER COCKPIT 14 JOURS & VALIDATION (13.91s = ~417 frames)
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
      const calMeals = window.store.get('calendar_meals', []);
      if (calMeals.length >= 3) {
        if (progress >= 0.35) {
          calMeals[0].done = true;
          window.moveCursor(1260, 520, progress < 0.45);
        }
        if (progress >= 0.65) {
          calMeals[1].done = true;
          window.moveCursor(1260, 680, progress < 0.75);
        }
        if (progress >= 0.85) {
          calMeals[2].done = true;
          window.moveCursor(1260, 840, true);
        }
        window.store.set('calendar_meals', calMeals);
        if (window.renderDay) window.renderDay();
        if (window.renderStrip) window.renderStrip();
      }
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 5 : SCANNER VISUEL D'ASSIETTE & PRAL (8.54s = ~256 frames)
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
      window.moveCursor(960 + Math.cos(progress * 4) * 160, 560 + Math.sin(progress * 3) * 90);
    }, p);
    await snapFrame();
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SCÈNE 6 : OUTRO & CONFIDENTIALITÉ (11.70s = ~351 frames)
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
      window.moveCursor(960 + Math.sin(progress * 3) * 100, 540 + Math.cos(progress * 2) * 80);
    }, p);
    await snapFrame();
  }

  await browser.close();
  console.log(`✅ ${frameCounter} frames capturées en Full HD native sans aucun zoom !`);

  // ═════════════════════════════════════════════════════════════════════════
  // ENCODAGE FINAL AVEC VOIX ARIANE ET AMBIANCE MUSICALE
  // ═════════════════════════════════════════════════════════════════════════
  console.log('🎧 Mixage audio et encodage vidéo MP4 H.264...');
  const voiceoverPath = path.join(AUDIO_DIR, 'master_voiceover.mp3');
  const inputPattern = path.join(FRAMES_DIR, 'frame_%06d.png');

  // Generate subtle chill ambient background music track
  const bgMusicPath = path.join(AUDIO_DIR, 'ambient_bg.mp3');
  try {
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=174:duration=80" -filter_complex "[0:a]volume=0.035,lowpass=f=400,afade=t=in:ss=0:d=2,afade=t=out:st=73:d=2[a]" -map "[a]" "${bgMusicPath}"`,
      { stdio: 'pipe' }
    );
  } catch (e) {}

  // Final Merge: Video (1080p 30fps) + Ariane Voiceover + Background Music
  try {
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${inputPattern}" -i "${voiceoverPath}" -i "${bgMusicPath}" -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.05[m];[v][m]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.2 -crf 18 -preset fast -c:a aac -b:a 256k -shortest "${OUTPUT_VIDEO}"`,
      { stdio: 'inherit' }
    );
    fs.copyFileSync(OUTPUT_VIDEO, ARTIFACT_VIDEO);
    console.log(`\n🎉 VIDÉO OFFICIELLE ARIANE GÉNÉRÉE AVEC SUCCÈS !\n📁 Fichier: ${OUTPUT_VIDEO}`);
  } catch (err) {
    console.error('❌ Erreur lors de l\'encodage vidéo final:', err);
  }
})();
