const puppeteer = require('/Users/richard/Developer/vital_track/web-app/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('🚀 Démarrage de la capture finale ultra-soignée...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    defaultViewport: { width: 1440, height: 920, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // ═════════════════════════════════════════════════════════════════════════
  // 1. INJECT REALISTIC VITALIST SAMPLE DATA & STATE
  // ═════════════════════════════════════════════════════════════════════════
  await page.evaluate(() => {
    // Hide PWA banner & toasts permanently
    const pwaBanner = document.getElementById('pwaInstallBanner');
    if (pwaBanner) pwaBanner.style.setProperty('display', 'none', 'important');
    const style = document.createElement('style');
    style.innerHTML = '#pwaInstallBanner, .toast, .vital-toast { display: none !important; opacity: 0 !important; pointer-events: none !important; }';
    document.head.appendChild(style);

    const now = Date.now();
    const fastingStart = now - (14 * 3600 * 1000 + 32 * 60 * 1000); // 14h 32m

    // Fasting State
    window.fastingState = {
      active: true,
      startTime: fastingStart,
      durationMs: 16 * 3600000,
      type: 'intermittent',
      interval: null
    };
    window.store.set('fasting-active', {
      startTime: fastingStart,
      durationMs: 16 * 3600000,
      type: 'intermittent'
    });

    // Today Logged Meals (High vitality, electric, dissolvant, alkaline)
    const sampleMeals = [
      {
        id: 'meal_1',
        name: 'Gaspacho Vivant Pastèque, Menthe & Citron Vert',
        timestamp: now - 4 * 3600 * 1000,
        emoji: '🍉',
        category: 'breakfast',
        freshness: 95,
        pral: -8.4,
        nova: 1,
        electric: true,
        approved: true,
        mucus: 'Dissolvant',
        foods: ['Pastèque à graines', 'Concombre bio', 'Menthe fraîche', 'Citron vert']
      },
      {
        id: 'meal_2',
        name: 'Salade Sauvage Pourpier, Avocat & Algues Dulse',
        timestamp: now - 1 * 3600 * 1000,
        emoji: '🥗',
        category: 'lunch',
        freshness: 95,
        pral: -9.2,
        nova: 1,
        electric: true,
        approved: true,
        mucus: 'Dissolvant',
        foods: ['Pourpier sauvage', 'Avocat mûr', 'Algues Dulse de l\'Atlantique', 'Graines de courge']
      }
    ];
    window.store.set('meals', sampleMeals);

    // Fasting History
    window.store.set('fasting-history', [
      { id: 'f1', type: '16:8', duration: 16 * 60, startTime: now - 86400000, elapsed: 16 * 3600000, completed: true },
      { id: 'f2', type: '18:6', duration: 18 * 60, startTime: now - 2 * 86400000, elapsed: 18 * 3600000, completed: true },
      { id: 'f3', type: '20:4', duration: 20 * 60, startTime: now - 3 * 86400000, elapsed: 20 * 3600000, completed: true },
      { id: 'f4', type: '16:8', duration: 16 * 60, startTime: now - 4 * 86400000, elapsed: 16 * 3600000, completed: true },
      { id: 'f5', type: '24h', duration: 24 * 60, startTime: now - 5 * 86400000, elapsed: 24 * 3600000, completed: true }
    ]);

    // Breathing History
    window.store.set('breathing-history', [
      { id: 'b1', type: 'wim-hof', rounds: 3, retentionMax: 145, timestamp: now - 3600000 },
      { id: 'b2', type: 'box', duration: 10, timestamp: now - 7200000 },
      { id: 'b3', type: 'coherence', duration: 15, timestamp: now - 2 * 86400000 },
      { id: 'b4', type: 'wim-hof', rounds: 4, retentionMax: 180, timestamp: now - 3 * 86400000 }
    ]);

    // Favorites
    window.store.set('favorites', [
      'Chanca Piedra', 'Pau d\'Arco', 'Chaga boréal', 'Bleuets sauvages',
      'Pourpier sauvage', 'Sea Moss', 'Espinheira Santa', 'Ortie sauvage'
    ]);

    // 7-Day Diet Plan for Calendar Cockpit
    const planReq = { protocol: 'personalized', numDays: 7, objective: 'Détox Hivernale & Muqueuses' };
    if (window.applyDietPlanRequest) window.applyDietPlanRequest(planReq, 'replace');

    const calMeals = window.store.get('calendar_meals', []);
    if (calMeals.length >= 3) {
      calMeals[0].done = true;
      calMeals[1].done = true;
      calMeals[2].done = true;
      window.store.set('calendar_meals', calMeals);
    }
  });

  // Helper for taking screenshot
  async function take(name, width, height, isMobile = false) {
    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile, hasTouch: isMobile });
    await page.evaluate(() => {
      document.querySelectorAll('.toast, .vital-toast, #pwaInstallBanner').forEach(el => el.remove());
    });
    await new Promise(r => setTimeout(r, 600));
    const dest = path.join(OUTPUT_DIR, name);
    await page.screenshot({ path: dest });
    console.log(`📸 Capturé: ${name}`);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // DESKTOP CAPTURES (1440x920)
  // ═════════════════════════════════════════════════════════════════════════

  // 1. Desktop Dashboard - Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    if (window.showPage) window.showPage('dashboard');
    if (window.renderDashboard) window.renderDashboard();
  });
  await take('desktop_dashboard_dark.png', 1440, 920);

  // 2. Desktop Dashboard - Light Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    if (window.showPage) window.showPage('dashboard');
    if (window.renderDashboard) window.renderDashboard();
  });
  await take('desktop_dashboard_light.png', 1440, 920);

  // Switch back to Dark for the rest
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  });

  // 3. Desktop Calendar Cockpit
  await page.evaluate(() => {
    if (window.showPage) window.showPage('calendar');
    if (window.renderDay) window.renderDay();
    if (window.renderStrip) window.renderStrip();
  });
  await take('desktop_calendar_cockpit.png', 1440, 920);

  // 4. Desktop AI Chat with Rich Vitalist Protocol & Action Plan Card
  await page.evaluate(() => {
    if (window.showPage) window.showPage('chat');
    const container = document.getElementById('chatMessages');
    if (container) {
      container.innerHTML = '';
      const sampleQuestion = "Quel protocole alimentaire recommandes-tu pour apaiser une crise inflammatoire intestinale au Québec ?";
      const sampleAnswer = `### 🔬 Compréhension & Priorités Physiologiques\nFace à une inflammation de la muqueuse intestinale (Crohn, colite ou porosité), la priorité absolue est d'**éteindre le feu digestif**, de désengorger la lymphe interstitielle et de stopper toute agression mécanique par des fibres dures ou insolubles.\n\n### 📋 Protocole Alimentaire de Transition (Canada 🍁)\n- **🌅 Matin (07h30) :** Eau tiède pure citronnée avec 1 c.à.c de sève d'érable brute, suivie d'un jus pressé filtré (carottes boréales, céleri branche, concombre sans peau, curcuma doux).\n- **🥗 Midi (12h30) :** Velouté onctueux de courge musquée ou patates douces cuites à la vapeur douce (<95°C), purée d'avocat mûr avec sel gris non raffiné.\n- **🍵 Collation (16h30) :** Décoction apaisante d'Espinheira Santa et racine de guimauve avec gingembre frais râpé.\n- **🌙 Dîner (19h30) :** Soupe réconfortante de courgettes et carottes fondantes, compote tiède de pommes douces sans sucre ajouté.\n\n### 🌿 Plantes de Soutien Digestif & Muqueuses\n• **Espinheira Santa (Maytenus ilicifolia)** : Puissant protecteur et cicatrisant de la muqueuse gastro-intestinale.\n• **Griffe de Chat (Uncaria tomentosa)** : Action anti-inflammatoire cellulaire et immunomodulatrice.\n• **Chaga boréal du Québec** : Antioxydant majeur et soutien de la flore vivante.\n\n\`\`\`json\n{\n  \"dietPlanRequest\": {\n    \"numDays\": 7,\n    \"protocol\": \"personalized\",\n    \"objective\": \"Apaisement Muqueuses & Détox Intestinale\",\n    \"restrictions\": \"sans fibres dures\"\n  }\n}\n\`\`\``;

      window.addMessage(sampleQuestion, true, null, null, 0);
      window.addMessage(sampleAnswer, false, 'gemini-3.7-flash', null, 1);
    }
  });
  await take('desktop_ai_chat_actions.png', 1440, 920);

  // 5. Desktop Food Scanner Diagnostic
  await page.evaluate(() => {
    if (window.showPage) window.showPage('scan');
    const scanResultText = `**Assiette Vivante : Avocat Mûr, Pourpier Sauvage & Bleuets Boréaux**
Cet assortiment cru et vivant présente une densité photonique et enzymatique exceptionnelle, idéale pour la régénération cellulaire et l'apaisement digestif.

### Statut Vitaliste & Bio-Minéral
- **Classification :** ⚡ 100% Électrique & Alcalinisant
- **Indice PRAL Rénal :** -9.2 mEq/100g (Hautement Alcalinisant)
- **Classification NOVA :** NOVA 1 (Aliments bruts non transformés)
- **Impact Mucus :** Dissolvant de mucus ancien et acidités
- **Tropisme Principal :** Lymphe, Reins et Muqueuse Intestinale

### 🌿 Ingrédients Identifiés :
1. **Avocat Hass Mûr** : Acides gras protecteurs des membranes cellulaires et glutathion.
2. **Pourpier Sauvage** : Exceptionnelle richesse en oméga-3 ALA végétaux et minéraux vivants.
3. **Bleuets Sauvages du Québec** : Anthocyanes antioxydantes majeures.

\`\`\`json
{
  \"actionMeal\": {
    \"name\": \"Assiette Vivante Avocat, Pourpier & Bleuets\",
    \"category\": \"lunch\",
    \"emoji\": \"🥑\",
    \"items\": [\"Avocat mûr\", \"Pourpier sauvage\", \"Bleuets sauvages\", \"Graines de chanvre\"],
    \"note\": \"Repas 100% électrique, alcalinisant et hautement régénérant.\"
  },
  \"suggestFoods\": [\"Pourpier sauvage\", \"Bleuets sauvages\", \"Graines de chanvre\", \"Algues Dulse\"]
}
\`\`\``;

    if (window.renderScanResult) {
      window.renderScanResult(scanResultText);
      const resBox = document.getElementById('scanResult');
      if (resBox) resBox.style.display = 'block';
    }
  });
  await take('desktop_scanner_analysis.png', 1440, 920);

  // 6. Desktop Breathing Studio (Wim Hof / Box Breathing)
  await page.evaluate(() => {
    if (window.showPage) window.showPage('breathing');
    if (window.renderBreathingHistory) window.renderBreathingHistory();
  });
  await take('desktop_breathing_studio.png', 1440, 920);

  // 7. Desktop Media Library (Masterclasses Vidéos & Doublage Français)
  await page.evaluate(() => {
    if (window.showPage) window.showPage('resources');
    const filterBtns = document.querySelectorAll('.res-filter-btn');
    filterBtns.forEach(b => {
      if (b.getAttribute('data-cat') === 'video' || b.textContent.includes('Vidéos')) {
        b.click();
      }
    });
  });
  await take('desktop_media_player.png', 1440, 920);

  // 8. Desktop Privacy & RGPD Center (Zero-Knowledge, Portabilité, Droit à l'oubli)
  await page.evaluate(() => {
    if (window.showPage) window.showPage('modes');
    const secTab = document.querySelector('.settings-tab-btn[onclick*="security"]');
    if (secTab) secTab.click();
    else if (window.switchSettingsTab) window.switchSettingsTab('security');
  });
  await take('desktop_privacy_gdpr.png', 1440, 920);

  // ═════════════════════════════════════════════════════════════════════════
  // MOBILE CAPTURES (390x844 - iPhone / Android Viewport)
  // ═════════════════════════════════════════════════════════════════════════

  // 9. Mobile Dashboard - Dark Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    if (window.showPage) window.showPage('dashboard');
    if (window.renderDashboard) window.renderDashboard();
  });
  await take('mobile_dashboard_dark.png', 390, 844, true);

  // 10. Mobile Dashboard - Light Theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    if (window.showPage) window.showPage('dashboard');
    if (window.renderDashboard) window.renderDashboard();
  });
  await take('mobile_dashboard_light.png', 390, 844, true);

  // Back to dark
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  });

  // 11. Mobile AI Chat with Live Voice Streaming HUD & Contextual Plan
  await page.evaluate(() => {
    if (window.showPage) window.showPage('chat');
    window.toggleVoiceInput(true);
    const input = document.getElementById('chatInput');
    if (input) input.value = "Comment adapter ce protocole si je dois voyager ?";
  });
  await take('mobile_chat_voice_live.png', 390, 844, true);

  // Stop voice
  await page.evaluate(() => {
    window.toggleVoiceInput(false);
  });

  // 12. Mobile Food Scanner Diagnostic & PRAL Analysis
  await page.evaluate(() => {
    if (window.showPage) window.showPage('scan');
    const scanResultText = `**Assiette Vivante : Avocat, Pourpier Sauvage & Bleuets**
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
  });
  await take('mobile_scanner_analysis.png', 390, 844, true);

  // 13. Mobile Calendar Cockpit with Progress Badges & Tactile Validation
  await page.evaluate(() => {
    if (window.showPage) window.showPage('calendar');
    if (window.renderDay) window.renderDay();
    if (window.renderStrip) window.renderStrip();
  });
  await take('mobile_calendar_cockpit.png', 390, 844, true);

  // 14. Mobile Fasting Tracker (Autophagy Stage & Ring)
  await page.evaluate(() => {
    if (window.showPage) window.showPage('fasting');
    if (window.updateFastingUI) window.updateFastingUI();
    const btn = document.getElementById('fastStartBtn');
    const icon = document.getElementById('fastBtnIcon');
    const label = document.getElementById('fastBtnLabel');
    if (btn) btn.className = 'jn-btn-start running stop';
    if (icon) icon.className = 'ri-stop-circle-fill';
    if (label) label.textContent = 'Arrêter le jeûne';
    const statusEl = document.getElementById('timerLabel');
    if (statusEl) {
      statusEl.textContent = '🔥 EN COURS';
      statusEl.classList.add('active');
    }
  });
  await take('mobile_fasting_timer.png', 390, 844, true);

  // 15. Mobile Breathing Studio
  await page.evaluate(() => {
    if (window.showPage) window.showPage('breathing');
  });
  await take('mobile_breathing_wimhof.png', 390, 844, true);

  // 16. Mobile Pharmacopoeia / Plants Search
  await page.evaluate(() => {
    if (window.showPage) window.showPage('materia-medica');
    else if (window.showPage) window.showPage('search');
  });
  await take('mobile_pharmacopeia_plants.png', 390, 844, true);

  // 17. Mobile Privacy Vault
  await page.evaluate(() => {
    if (window.showPage) window.showPage('modes');
    const secTab = document.querySelector('.settings-tab-btn[onclick*="security"]');
    if (secTab) secTab.click();
    else if (window.switchSettingsTab) window.switchSettingsTab('security');
  });
  await take('mobile_privacy_vault.png', 390, 844, true);

  await browser.close();
  console.log('🎉 Toutes les captures d\'écran vitrines ont été générées avec succès !');
})();
