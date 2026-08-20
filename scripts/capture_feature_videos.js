const puppeteer = require('/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_VIDEOS_DIR = path.resolve(__dirname, '../web-app/public/videos/features');
const DOCS_VIDEOS_DIR = path.resolve(__dirname, '../docs/videos');
const SCRATCH_FRAMES_DIR = path.resolve(__dirname, '../scratch/frames');

[PUBLIC_VIDEOS_DIR, DOCS_VIDEOS_DIR, SCRATCH_FRAMES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function captureFrames(page, durationMs, fps, onTick) {
  // Clear scratch frames directory
  const files = fs.readdirSync(SCRATCH_FRAMES_DIR);
  for (const f of files) fs.unlinkSync(path.join(SCRATCH_FRAMES_DIR, f));

  const totalFrames = Math.floor((durationMs / 1000) * fps);

  for (let i = 0; i < totalFrames; i++) {
    const timeProgress = i / totalFrames;
    if (onTick) {
      await page.evaluate(onTick, { frameIndex: i, totalFrames, timeProgress });
    }
    // Suppress toasts and unwanted banners
    await page.evaluate(() => {
      document.querySelectorAll('.toast, .vital-toast, #pwaInstallBanner').forEach(el => el.remove());
    });
    const framePath = path.join(SCRATCH_FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`);
    await page.screenshot({ path: framePath, type: 'png' });
    await new Promise(r => setTimeout(r, 10));
  }
}

function compileVideo(outputBaseName, fps = 24) {
  const mp4Public = path.join(PUBLIC_VIDEOS_DIR, `${outputBaseName}.mp4`);
  const webmPublic = path.join(PUBLIC_VIDEOS_DIR, `${outputBaseName}.webm`);
  const mp4Docs = path.join(DOCS_VIDEOS_DIR, `${outputBaseName}.mp4`);
  const inputPattern = path.join(SCRATCH_FRAMES_DIR, 'frame_%05d.png');

  console.log(`🎬 Encodage vidéo HD pour ${outputBaseName}...`);

  // Encode MP4 (H.264, web-friendly, faststart)
  try {
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart -crf 20 -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${mp4Public}"`,
      { stdio: 'pipe' }
    );
    fs.copyFileSync(mp4Public, mp4Docs);
    console.log(`✅ MP4 généré : ${mp4Public}`);
  } catch (err) {
    console.error(`❌ Erreur encodage MP4 ${outputBaseName}:`, err.message);
  }

  // Encode WebM (VP9)
  try {
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -c:v libvpx-vp9 -b:v 1.8M -crf 24 -pix_fmt yuv420p "${webmPublic}"`,
      { stdio: 'pipe' }
    );
    console.log(`✅ WebM généré : ${webmPublic}`);
  } catch (err) {
    console.error(`❌ Erreur encodage WebM ${outputBaseName}:`, err.message);
  }
}

(async () => {
  console.log('🚀 Démarrage de la capture vidéo ultra-propre des fonctionnalités...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    defaultViewport: { width: 1080, height: 720, deviceScaleFactor: 1 }
  });

  const context = browser.defaultBrowserContext();
  try {
    await context.overridePermissions('http://localhost:5173', ['microphone']);
  } catch (e) {}

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Suppress toasts, errors, sidebars and center page contents for pristine video captures
  await page.evaluate(() => {
    window.showToast = () => {};
    const style = document.createElement('style');
    style.innerHTML = `
      #pwaInstallBanner, .toast, .vital-toast { display: none !important; opacity: 0 !important; }
      .sidebar-desktop { display: none !important; }
      .app-layout { grid-template-columns: 1fr !important; padding: 0 !important; }
      .main-content { margin-left: 0 !important; width: 100% !important; max-width: 100% !important; padding: 20px !important; }
      .page { max-width: 900px !important; margin: 0 auto !important; width: 100% !important; }
      #page-breathing { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; min-height: 640px !important; }
      .breathing-container { width: 100% !important; max-width: 600px !important; margin: 0 auto !important; display: flex !important; flex-direction: column !important; align-items: center !important; }
      .breathing-circle-wrap { margin: 20px auto !important; display: flex !important; justify-content: center !important; }
    `;
    document.head.appendChild(style);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // 1. VIDEO FEATURE: VOICE AI CHAT & MEAL PLAN ACTIONS
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n🎙️ [1/5] Capture Feature : Coach Vocal en Direct & Plans d\'Action...');
  await page.evaluate(() => {
    if (window.showPage) window.showPage('chat');
    const container = document.getElementById('chatMessages');
    if (container) container.innerHTML = '';
    const input = document.getElementById('chatInput');
    if (input) input.value = '';
  });

  await captureFrames(page, 4500, 24, ({ timeProgress }) => {
    const input = document.getElementById('chatInput');
    const fullPrompt = "Comment régénérer ma flore intestinale avec les plantes du Québec ?";

    if (timeProgress < 0.3) {
      // Activer l'écoute vocale
      const voiceHUD = document.getElementById('voiceStreamingHUD');
      if (voiceHUD) voiceHUD.classList.add('active');
      const chars = Math.floor((timeProgress / 0.3) * fullPrompt.length);
      if (input) input.value = fullPrompt.substring(0, chars);
    } else if (timeProgress >= 0.3 && timeProgress < 0.45) {
      const voiceHUD = document.getElementById('voiceStreamingHUD');
      if (voiceHUD) voiceHUD.classList.remove('active');
      const container = document.getElementById('chatMessages');
      if (container && !document.getElementById('user-msg-temp')) {
        const uMsg = document.createElement('div');
        uMsg.id = 'user-msg-temp';
        uMsg.className = 'chat-message user';
        uMsg.innerHTML = `<div class="chat-bubble user-bubble">${fullPrompt}</div>`;
        container.appendChild(uMsg);
        if (input) input.value = '';
      }
    } else if (timeProgress >= 0.45) {
      const container = document.getElementById('chatMessages');
      if (container && !document.getElementById('ai-msg-temp')) {
        const aiMsg = document.createElement('div');
        aiMsg.id = 'ai-msg-temp';
        aiMsg.className = 'chat-message ai';
        aiMsg.innerHTML = `
          <div class="chat-bubble ai-bubble" style="max-width:92%;">
            <div style="font-weight:700; color:#34d399; margin-bottom:8px; font-size:1.05rem;">🌿 Protocole Régénération & Muqueuses (Québec)</div>
            <p style="margin-bottom:8px; line-height:1.5;">Pour apaiser et restaurer la paroi intestinale, nous combinons les plantes astringentes et mucilagineuses boréales avec un repos digestif ciblé.</p>
            <div class="diet-plan-card" style="margin-top:12px; padding:14px; border-radius:12px; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.3);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight:700; color:#fff;">📅 Programme Personnalisé 7 Jours</div>
                <span class="badge" style="background:#10b981; color:#fff; padding:3px 8px; border-radius:8px; font-size:0.75rem;">Recommandé</span>
              </div>
              <p style="font-size:0.85rem; color:#94a3b8; margin:6px 0 10px;">Apaisement Muqueuses & Détox Intestinale (Sans fibres dures)</p>
              <button class="btn-primary" style="padding:8px 16px; border-radius:8px; background:#10b981; color:#fff; border:none; font-weight:700; cursor:pointer;">
                📅 Appliquer au calendrier
              </button>
            </div>
          </div>
        `;
        container.appendChild(aiMsg);
      }
    }
  });
  compileVideo('feature_voice_ai_chat', 24);

  // ═════════════════════════════════════════════════════════════════════════
  // 2. VIDEO FEATURE: FOOD SCANNER & PRAL DIAGNOSTIC
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n📸 [2/5] Capture Feature : Scanner Visuel & Indice PRAL...');
  await page.evaluate(() => {
    if (window.showPage) window.showPage('scan');
  });

  await captureFrames(page, 4000, 24, ({ timeProgress }) => {
    if (timeProgress >= 0.2) {
      const scanResultText = `**Assiette Vivante : Avocat Mûr, Pourpier Sauvage & Bleuets**
Densité enzymatique et photonique maximale.

### Statut Vitaliste & Bio-Minéral
- **Classification :** ⚡ 100% Électrique & Alcalinisant
- **Indice PRAL Rénal :** -9.2 mEq/100g (Alcalinisant)
- **Classification NOVA :** NOVA 1 (Brut & Vivant)
- **Impact Mucus :** Dissolvant

\`\`\`json
{
  \"actionMeal\": {
    \"name\": \"Assiette Vivante Avocat, Pourpier & Bleuets\",
    \"category\": \"lunch\",
    \"emoji\": \"🥑\",
    \"items\": [\"Avocat mûr\", \"Pourpier sauvage\", \"Bleuets sauvages\", \"Graines de chanvre\"],
    \"note\": \"Repas 100% électrique, alcalinisant et hautement régénérant.\"
  },
  \"suggestFoods\": [\"Pourpier sauvage\", \"Bleuets sauvages\", \"Graines de chanvre\"]
}
\`\`\``;
      if (window.renderScanResult) {
        window.renderScanResult(scanResultText);
        const resBox = document.getElementById('scanResult');
        if (resBox) resBox.style.display = 'block';
      }
    }
  });
  compileVideo('feature_scanner_diagnostic', 24);

  // ═════════════════════════════════════════════════════════════════════════
  // 3. VIDEO FEATURE: CALENDAR COCKPIT & MEAL PROGRESS
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n📅 [3/5] Capture Feature : Calendrier Cockpit & Validation des Repas...');
  await page.evaluate(() => {
    if (window.showPage) window.showPage('calendar');
    const planReq = { protocol: 'personalized', numDays: 7, objective: 'Détox Hivernale & Muqueuses' };
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

  await captureFrames(page, 4000, 24, ({ timeProgress }) => {
    const calMeals = window.store.get('calendar_meals', []);
    if (calMeals.length >= 3) {
      if (timeProgress >= 0.25) calMeals[0].done = true;
      if (timeProgress >= 0.55) calMeals[1].done = true;
      if (timeProgress >= 0.8) calMeals[2].done = true;
      window.store.set('calendar_meals', calMeals);
      if (window.renderDay) window.renderDay();
      if (window.renderStrip) window.renderStrip();
    }
  });
  compileVideo('feature_calendar_cockpit', 24);

  // ═════════════════════════════════════════════════════════════════════════
  // 4. VIDEO FEATURE: FASTING TIMER & AUTOPHAGY STAGES
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n⏳ [4/5] Capture Feature : Jeûne & Paliers d\'Autophagie...');
  await page.evaluate(() => {
    if (window.showPage) window.showPage('fasting');
  });

  await captureFrames(page, 4000, 24, ({ timeProgress }) => {
    const now = Date.now();
    const simulatedHours = 12 + timeProgress * 6; // Simulate from 12h to 18h (Autophagy entry)
    const fastingStart = now - (simulatedHours * 3600 * 1000);

    window.fastingState = {
      active: true,
      startTime: fastingStart,
      durationMs: 16 * 3600000,
      type: 'intermittent',
      interval: null
    };

    if (window.updateFastingUI) window.updateFastingUI();

    const timerVal = document.getElementById('timerValue');
    if (timerVal) {
      const h = Math.floor(simulatedHours);
      const m = Math.floor((simulatedHours % 1) * 60);
      const s = Math.floor((((simulatedHours % 1) * 60) % 1) * 60);
      timerVal.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const stageEl = document.getElementById('fastingStageInfo') || document.querySelector('.stage-badge');
    if (stageEl && simulatedHours >= 16) {
      stageEl.textContent = '🧬 Autophagie Cellulaire Active';
    }
  });
  compileVideo('feature_fasting_autophagy', 24);

  // ═════════════════════════════════════════════════════════════════════════
  // 5. VIDEO FEATURE: BREATHING STUDIO WIM HOF
  // ═════════════════════════════════════════════════════════════════════════
  console.log('\n🫁 [5/5] Capture Feature : Studio de Respiration Wim Hof...');
  await page.evaluate(() => {
    if (window.showPage) window.showPage('breathing');
    const startBtn = document.querySelector('.br-start-btn') || document.getElementById('startBreathingBtn') || document.querySelector('button[onclick*="start"]');
    if (startBtn) startBtn.click();
  });

  await captureFrames(page, 4000, 24, ({ timeProgress }) => {
    const circle = document.querySelector('.breathing-circle') || document.getElementById('breathingVisual');
    const text = document.getElementById('breathingInstruction') || document.getElementById('breathText');
    if (circle) {
      const scale = 1 + Math.sin(timeProgress * Math.PI * 4) * 0.35;
      circle.style.transform = `scale(${scale})`;
    }
    if (text) {
      const phase = Math.sin(timeProgress * Math.PI * 4);
      text.textContent = phase > 0 ? "Inspirez profondément..." : "Expirez relâché...";
    }
  });
  compileVideo('feature_breathing_studio', 24);

  await browser.close();
  console.log('\n🎉 Tous les extraits vidéo ont été regénérés proprement avec succès !');
})();
