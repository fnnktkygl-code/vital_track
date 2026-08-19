/**
 * VitalTrack Web App — Complete Feature Set
 * Dashboard, Chat IA, Recherche, Repas, Favoris, Jeûne (programs+analytics+coach),
 * Respiration (history), Modes/Protocoles, Profil, Food Detail Modal (3 tabs)
 */

// ═══════ CONFIG ═══════
const API_BASE = window.location.origin;
const VT_APP_KEY = import.meta.env.VITE_VT_APP_KEY || '';

// ═══════ STATE ═══════
let vitalDb = [];
let currentBreathMode = 'wimhof';
let breathingActive = false;
let breathAbortController = null;
let fastingState = { active: false, startTime: null, durationMs: 0, type: '', interval: null };
let chatHistory = [];
let currentSearchFilter = 'all';
let selectedMealFoods = [];
let currentModalFood = null;
let currentProtocol = 'vitalist';

// ═══════ STORAGE HELPERS ═══════
const store = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(`vt-${k}`)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(`vt-${k}`, JSON.stringify(v)); } catch {} },
  del: (k) => localStorage.removeItem(`vt-${k}`),
};
window.store = store;

// ═══════ TOAST NOTIFICATIONS ═══════
window.showToast = function(msg, type = 'success', duration = 3500) {
  const container = document.getElementById('appToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  const iconClass = type === 'success' ? 'ri-checkbox-circle-fill' : (type === 'error' ? 'ri-error-warning-fill' : 'ri-information-fill');
  toast.innerHTML = `<i class="${iconClass}"></i><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// ═══════ INIT ═══════
document.addEventListener('DOMContentLoaded', async () => {
  loadTheme();
  loadProfile();
  loadProtocol();
  loadFastingState();
  loadChatHistory();
  renderFastingHistory();
  renderFastingAnalytics();
  renderBreathingHistory();
  renderFavorites();
  renderMeals();
  renderDashboard();
  initFastingPrograms();
  initSmartInsight();
  initMasterclass();
  initExpertAccordion();
  
  if (window.VitalMascot) {
    window.appMascot = new window.VitalMascot('mascotCanvas');
  }

  updateProactiveMascot();

  // Render welcome pigeon portrait
  const welcomeEl = document.getElementById('welcomeMascotPortrait');
  if (welcomeEl && window.renderPigeonPortrait) {
    welcomeEl.innerHTML = window.renderPigeonPortrait(64, 'talking');
  }
  renderResources();

  // Show safety warning for >24h fasts
  document.getElementById('fastingDuration').addEventListener('input', (e) => {
    document.getElementById('fastingSafetyWarning').style.display = parseInt(e.target.value) > 24 ? 'flex' : 'none';
  });

  try {
    const resp = await fetch('/vital_ranking.json');
    if (resp.ok) {
      const baseDb = await resp.json();
      const customDb = store.get('customFoods', []);
      vitalDb = [...baseDb, ...customDb];
      populateVitalApprovedFoods();
      buildSearchIndex();
      initSearchPage();
    }
  } catch (e) { console.warn('Could not load food database:', e); }
});

function populateVitalApprovedFoods() {
  if (!Array.isArray(vitalDb) || vitalDb.length === 0) return;
  const approved = {
    fruits: [], veggies: [], grains: [], herbs: [], oils: [], nuts: [], spices: []
  };
  const emojis = {};

  const catMap = {
    'Fruits': 'fruits',
    'Légumes': 'veggies',
    'Céréales': 'grains',
    'Herbes & Thés': 'herbs',
    'Huiles': 'oils',
    'Noix & Graines': 'nuts',
    'Épices & Assaisonnements': 'spices'
  };

  vitalDb.forEach(item => {
    const catKey = catMap[item.category] || 'fruits';
    if (!approved[catKey]) approved[catKey] = [];

    const nameStr = (item.names && (item.names[1] || item.names[0])) || item.id;
    if (nameStr) {
      const displayName = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
      if (approved[catKey].indexOf(displayName) === -1) {
        approved[catKey].push(displayName);
      }
      if (item.emoji) {
        emojis[displayName] = item.emoji;
        if (Array.isArray(item.names)) {
          item.names.forEach(n => {
            if (n) {
              const cap = n.charAt(0).toUpperCase() + n.slice(1);
              emojis[cap] = item.emoji;
            }
          });
        }
      }
    }
  });

  window.VITAL_APPROVED_FOODS = approved;
  window.VITAL_FOOD_EMOJIS = emojis;
}

// ═══════ NAVIGATION ═══════
window.showPage = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link, .bnav-item, .sidebar-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));
  if (page === 'dashboard') renderDashboard();
  if (page === 'calendar') renderCalendar();
};

window.toggleMobileNav = function() { document.getElementById('mobileNav').classList.toggle('open'); };

// ═══════ THEME ═══════
window.toggleTheme = function() {
  const isDark = !document.documentElement.hasAttribute('data-theme');
  if (isDark) { document.documentElement.setAttribute('data-theme', 'light'); store.set('theme', 'light'); document.getElementById('themeIcon').className = 'ri-sun-line'; }
  else { document.documentElement.removeAttribute('data-theme'); store.set('theme', 'dark'); document.getElementById('themeIcon').className = 'ri-moon-line'; }
};
function loadTheme() { if (store.get('theme') === 'light') { document.documentElement.setAttribute('data-theme', 'light'); document.getElementById('themeIcon').className = 'ri-sun-line'; } }

// ═══════ PROFILE & GEO MEMORY ═══════
function getUserProfile() {
  const p = store.get('profile', {});
  const month = new Date().getMonth();
  let defaultSeason = 'Hiver';
  if (month >= 2 && month <= 4) defaultSeason = 'Printemps';
  else if (month >= 5 && month <= 7) defaultSeason = 'Été';
  else if (month >= 8 && month <= 10) defaultSeason = 'Automne';

  let mems = [];
  if (Array.isArray(p.memories)) mems = p.memories;
  else if (typeof p.memories === 'string' && p.memories.trim()) mems = p.memories.split('\n').map(s => s.trim()).filter(Boolean);

  return {
    name: p.name || '',
    goal: p.goal || 'detox',
    protocol: currentProtocol || p.protocol || 'vitalist',
    country: p.country || 'Canada 🍁',
    city: p.city || 'Montréal',
    season: p.season || defaultSeason,
    restrictions: p.restrictions || '',
    memories: mems
  };
}

function loadProfile() {
  const p = getUserProfile();
  if (document.getElementById('profileName')) document.getElementById('profileName').value = p.name || '';
  if (document.getElementById('profileGoal')) document.getElementById('profileGoal').value = p.goal || 'detox';
  if (document.getElementById('profileCountry')) document.getElementById('profileCountry').value = p.country || 'Canada 🍁';
  if (document.getElementById('profileCity')) document.getElementById('profileCity').value = p.city || 'Montréal';
  if (document.getElementById('profileRestrictions')) document.getElementById('profileRestrictions').value = p.restrictions || '';
  if (document.getElementById('profileMemories')) {
    document.getElementById('profileMemories').value = Array.isArray(p.memories) ? p.memories.join('\n') : (p.memories || '');
  }
  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} ! 👋` : 'Salut ! 👋';
}

window.saveProfile = function() {
  const rawMems = document.getElementById('profileMemories') ? document.getElementById('profileMemories').value : '';
  const mems = rawMems.split('\n').map(s => s.trim()).filter(Boolean);

  const p = {
    name: document.getElementById('profileName') ? document.getElementById('profileName').value.trim() : '',
    goal: document.getElementById('profileGoal') ? document.getElementById('profileGoal').value : 'detox',
    country: document.getElementById('profileCountry') ? document.getElementById('profileCountry').value.trim() : 'Canada 🍁',
    city: document.getElementById('profileCity') ? document.getElementById('profileCity').value.trim() : 'Montréal',
    restrictions: document.getElementById('profileRestrictions') ? document.getElementById('profileRestrictions').value.trim() : '',
    memories: mems
  };
  store.set('profile', p);
  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} ! 👋` : 'Salut ! 👋';
  showToast('✅ Profil & préférences sauvegardés !', 'success');
};

// ═══════ PROTOCOL ═══════
function loadProtocol() {
  currentProtocol = store.get('protocol', 'vitalist');
  updateProtocolUI();
}
window.setProtocol = function(mode) {
  currentProtocol = mode;
  store.set('protocol', mode);
  updateProtocolUI();
};
function updateProtocolUI() {
  const labels = { vitalist: 'Mode Vitaliste', sebi: 'Mode Dr. Sebi', ehret: 'Mode Ehret', morse: 'Mode Dr. Morse' };
  if (document.getElementById('greetMode')) document.getElementById('greetMode').textContent = labels[currentProtocol] || 'Mode Vitaliste';
  document.querySelectorAll('.protocol-card').forEach(c => c.classList.toggle('active', c.dataset.mode === currentProtocol));
}

// ═══════ DASHBOARD ═══════
function renderDashboard() {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  const weekMeals = meals.filter(m => (Date.now() - (m.timestamp || 0)) <= 7 * 86400000);
  const fasts = store.get('fasting-history', []);
  const weekFasts = fasts.filter(f => (Date.now() - (f.startTime || f.timestamp || 0)) <= 7 * 86400000);
  const breaths = store.get('breathing-history', []);
  const weekBreaths = breaths.filter(b => (Date.now() - (b.timestamp || 0)) <= 7 * 86400000);
  const favs = store.get('favorites', []);

  document.getElementById('statMeals').textContent = weekMeals.length;
  document.getElementById('statFasts').textContent = weekFasts.length;
  document.getElementById('statBreaths').textContent = weekBreaths.length;
  document.getElementById('statFavs').textContent = favs.length;

  // Date
  const dateEl = document.getElementById('dashboardDate');
  if (dateEl) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  // Vitality score & breakdown calculation
  const breakdown = calculateVitalityBreakdown(todayMeals);
  const score = breakdown.overallScore;

  const arcScoreEl = document.getElementById('arcScore');
  if (arcScoreEl) arcScoreEl.textContent = (todayMeals.length === 0 && !breakdown.hasFasting && !breakdown.hasBreathing) ? '0' : score;
  
  const arcProgress = document.getElementById('arcProgress');
  if (arcProgress) {
    const isZero = todayMeals.length === 0 && !breakdown.hasFasting && !breakdown.hasBreathing;
    const offset = 251 - (251 * (isZero ? 0 : score) / 100);
    arcProgress.style.strokeDashoffset = offset;
    arcProgress.style.stroke = isZero ? 'rgba(255,255,255,0.1)' : (score >= 70 ? 'var(--accent)' : score >= 40 ? 'var(--warn)' : 'var(--danger)');
  }

  const commentEl = document.getElementById('vitalityScoreComment');
  if (commentEl) {
    if (todayMeals.length === 0 && !breakdown.hasFasting && !breakdown.hasBreathing) {
      commentEl.style.color = 'var(--text-dim)';
      commentEl.innerHTML = '<i class="ri-information-line"></i> Aucune donnée enregistrée aujourd\'hui';
    } else if (score >= 70) {
      commentEl.style.color = 'var(--accent)';
      commentEl.innerHTML = `<i class="ri-checkbox-circle-fill"></i> Excellente vitalité cellulaire (${score}/100)`;
    } else if (score >= 40) {
      commentEl.style.color = 'var(--warn)';
      commentEl.innerHTML = `<i class="ri-error-warning-fill"></i> Vitalité moyenne, marge d'optimisation (${score}/100)`;
    } else {
      commentEl.style.color = 'var(--danger)';
      commentEl.innerHTML = `<i class="ri-close-circle-fill"></i> Vitalité faible ou acidose (${score}/100)`;
    }
  }

  // Sub-bars updates (100% factual)
  const vFillN = document.getElementById('vFillNutrition');
  const vPctN = document.getElementById('vPctNutrition');
  if (vFillN && vPctN) {
    if (breakdown.hasMeals) {
      vFillN.style.width = `${breakdown.nutritionScore}%`;
      vFillN.style.background = breakdown.nutritionScore >= 70 ? 'var(--accent)' : breakdown.nutritionScore >= 40 ? 'var(--warn)' : 'var(--danger)';
      vPctN.textContent = `${breakdown.nutritionScore}%`;
    } else {
      vFillN.style.width = '0%';
      vPctN.textContent = '--';
    }
  }

  const vFillF = document.getElementById('vFillFasting');
  const vPctF = document.getElementById('vPctFasting');
  if (vFillF && vPctF) {
    if (breakdown.hasFasting) {
      vFillF.style.width = `${breakdown.fastingScore}%`;
      vPctF.textContent = `${breakdown.fastingScore}%`;
    } else {
      vFillF.style.width = '0%';
      vPctF.textContent = '--';
    }
  }

  const vFillB = document.getElementById('vFillBreathing');
  const vPctB = document.getElementById('vPctBreathing');
  if (vFillB && vPctB) {
    if (breakdown.hasBreathing) {
      vFillB.style.width = `${breakdown.breathingScore}%`;
      vPctB.textContent = `${breakdown.breathingScore}%`;
    } else {
      vFillB.style.width = '0%';
      vPctB.textContent = '--';
    }
  }

  // Active fasting card (if exists)
  const dashFastingCard = document.getElementById('dashFastingCard');
  if (dashFastingCard) {
    dashFastingCard.style.display = fastingState.active ? 'block' : 'none';
  }

  // Today's meals with clickable 3-tab modal trigger
  const dashList = document.getElementById('dashMealList');
  if (dashList) {
    if (todayMeals.length === 0) { 
      dashList.innerHTML = `<div class="empty-state-card">
                              <i class="ri-restaurant-2-line"></i>
                              <p>Aucun repas enregistré aujourd'hui.</p>
                            </div>`; 
    }
    else {
      dashList.innerHTML = todayMeals.slice(0, 5).map((m, idx) => {
        const isElec = m.electric === true || m.approved === true;
        const pral = m.pral ?? (m.scientific?.pral ?? (m.scientific_defaults?.pral ?? 0));
        return `<div class="meal-item clickable" onclick="openFoodModalFromMeal(${idx})" style="cursor:pointer;" title="Cliquer pour ouvrir la carte d'identité 3 onglets">
          <span class="food-emoji">${m.emoji || '🍽️'}</span>
          <div class="meal-item-info">
            <div class="meal-item-name">${esc(m.name)}</div>
            <div class="meal-item-meta">${isElec ? '⚡ Électrique' : (m.hybrid ? '🔀 Hybride' : '⛔ Mucogène')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)} · NOVA ${m.nova ?? 1}</div>
          </div>
          <i class="ri-arrow-right-s-line" style="color:var(--text-dim); margin-left:auto; font-size:1.1rem;"></i>
        </div>`;
      }).join('');
    }
  }

  // Also update widgets
  if(typeof updateCircadianWidget === 'function') updateCircadianWidget();
  if(typeof renderWeightChart === 'function') renderWeightChart();
}

function calculateVitalityBreakdown(meals) {
  // 1. Nutrition Score (0-100)
  let nutritionScore = 0;
  if (meals.length > 0) {
    let totalScore = 0;
    meals.forEach(item => {
      let itemScore = item.freshness ?? (item.vitality?.freshness ?? (item.nova === 1 ? 95 : item.nova === 2 ? 65 : item.nova === 3 ? 40 : 15));
      
      if (item.electric === true || item.approved === true) {
        itemScore += 15;
      } else if (item.hybrid === true) {
        itemScore -= 15;
      }

      const pral = item.pral ?? (item.scientific?.pral ?? (item.scientific_defaults?.pral ?? 0));
      if (pral <= -2.0) itemScore += 10;
      else if (pral < 0) itemScore += 5;
      else if (pral > 2.0) itemScore -= 15;
      else if (pral > 0) itemScore -= 8;

      const mucus = (item.mucus || item.specific?.mucus || '').toLowerCase();
      if (mucus.includes('dissolvant') || mucus.includes('aucun')) {
        itemScore += 10;
      } else if (mucus.includes('mucog') || mucus.includes('mucus') || mucus.includes('élevé')) {
        itemScore -= 15;
      }

      totalScore += Math.max(0, Math.min(100, itemScore));
    });
    nutritionScore = Math.round(totalScore / meals.length);
  }

  // 2. Fasting Score (0-100)
  let fastingScore = 0;
  let fastingActiveOrLogged = false;
  if (fastingState.active && fastingState.startTime) {
    fastingActiveOrLogged = true;
    const elapsedHours = (Date.now() - fastingState.startTime) / 3600000;
    const targetHours = (fastingState.durationMs || 57600000) / 3600000;
    fastingScore = Math.min(100, Math.round((elapsedHours / Math.max(1, targetHours)) * 100));
  } else {
    const fastHistory = store.get('fasting-history', []);
    const todayFasts = fastHistory.filter(f => isToday(f.startTime || f.timestamp));
    if (todayFasts.length > 0) {
      fastingActiveOrLogged = true;
      const totalElapsedHours = todayFasts.reduce((s, f) => s + ((f.elapsed || 0) / 3600000), 0);
      fastingScore = Math.min(100, Math.round((totalElapsedHours / 16) * 100));
    }
  }

  // 3. Breathing Score (0-100)
  let breathingScore = 0;
  let breathingLogged = false;
  const breathHistory = store.get('breathing-history', []);
  const todayBreaths = breathHistory.filter(b => isToday(b.timestamp));
  if (todayBreaths.length > 0) {
    breathingLogged = true;
    breathingScore = todayBreaths.length >= 2 ? 100 : 65;
  }

  // Overall Score calculation
  let overallScore = 0;
  if (meals.length === 0 && !fastingActiveOrLogged && !breathingLogged) {
    overallScore = 0;
  } else if (meals.length > 0 && !fastingActiveOrLogged && !breathingLogged) {
    // If only nutrition is logged, it determines the vital score
    overallScore = nutritionScore;
  } else {
    let totalWeight = 0;
    let weightedSum = 0;

    if (meals.length > 0) {
      weightedSum += nutritionScore * 0.50;
      totalWeight += 0.50;
    }
    if (fastingActiveOrLogged) {
      weightedSum += fastingScore * 0.30;
      totalWeight += 0.30;
    }
    if (breathingLogged) {
      weightedSum += breathingScore * 0.20;
      totalWeight += 0.20;
    }

    overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  return {
    nutritionScore,
    fastingScore,
    breathingScore,
    overallScore,
    hasMeals: meals.length > 0,
    hasFasting: fastingActiveOrLogged,
    hasBreathing: breathingLogged
  };
}

function calculateVitalityScore(meals) {
  const breakdown = calculateVitalityBreakdown(meals);
  return breakdown.overallScore;
}

window.openVitalityInfoModal = function() {
  document.getElementById('vitalityInfoModal')?.classList.add('open');
};

window.closeVitalityInfoModal = function(e) {
  if (!e || e.target === document.getElementById('vitalityInfoModal')) {
    document.getElementById('vitalityInfoModal')?.classList.remove('open');
  }
};

function isToday(ts) { const d = new Date(ts); const t = new Date(); return d.toDateString() === t.toDateString(); }

// ═══════ CHAT (MULTI-CONVERSATION) ═══════
let conversations = [];
let activeConvId = null;

function loadChatHistory() {
  conversations = store.get('conversations', []);
  activeConvId = store.get('activeConvId', null);
  
  if (conversations.length > 0) {
    if (!activeConvId || !conversations.find(c => c.id === activeConvId)) {
      activeConvId = conversations[0].id;
    }
  } else {
    activeConvId = null;
  }
  
  renderSidebar();
  renderActiveConversation();
}

function saveConversations() {
  store.set('conversations', conversations);
  store.set('activeConvId', activeConvId);
  renderSidebar();
}

window.newConversation = function() {
  activeConvId = null;
  saveConversations();
  renderActiveConversation();
  if (window.innerWidth <= 900) toggleSidebar();
};

window.switchConversation = function(id) {
  activeConvId = id;
  saveConversations();
  renderActiveConversation();
  if (window.innerWidth <= 900) toggleSidebar();
};

window.deleteConversation = function(id, e) {
  e.stopPropagation();
  conversations = conversations.filter(c => c.id !== id);
  if (activeConvId === id) {
    activeConvId = conversations.length ? conversations[0].id : null;
  }
  saveConversations();
  renderActiveConversation();
};

window.filterConversations = function(query) {
  renderSidebar(query);
};

window.toggleSidebar = function() {
  const sidebar = document.getElementById('chatSidebar');
  sidebar.classList.toggle('hidden');
};

function renderSidebar(filterQuery = '') {
  const list = document.getElementById('sidebarList');
  if (!list) return;
  
  const q = filterQuery.toLowerCase().trim();
  const filtered = q ? conversations.filter(c => c.title.toLowerCase().includes(q)) : conversations;
  
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state-sm" style="color:var(--text-dim);text-align:center;margin-top:20px">Aucun historique</p>';
    return;
  }
  
  list.innerHTML = filtered.sort((a, b) => b.updated - a.updated).map(c => `
    <div class="conv-item ${c.id === activeConvId ? 'active' : ''}" onclick="switchConversation('${c.id}')">
      <i class="ri-chat-3-line" style="color:var(--text-dim)"></i>
      <div class="conv-item-info">
        <div class="conv-item-title">${esc(c.title)}</div>
        <div class="conv-item-date">${new Date(c.updated).toLocaleDateString('fr-FR', {month:'short', day:'numeric'})}</div>
      </div>
      <button class="conv-item-delete" onclick="deleteConversation('${c.id}', event)" data-tooltip="Supprimer">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `).join('');
}

function renderActiveConversation() {
  const container = document.getElementById('chatMessages');
  const title = document.getElementById('chatTitle');
  const input = document.getElementById('chatInput');
  const welcome = document.getElementById('chatWelcome');
  
  if (!activeConvId) {
    title.textContent = 'Nouveau chat';
    container.innerHTML = '';
    if (welcome) container.appendChild(welcome);
    welcome.style.display = 'flex';
    input.focus();
    return;
  }

  const conv = conversations.find(c => c.id === activeConvId);
  if (!conv) return;

  title.textContent = conv.title;
  container.innerHTML = '';
  
  conv.messages.forEach(m => addMessage(m.text, m.role === 'user', m.model, m.image));
}

// ═══════ VOICE INPUT (SPEECH-TO-TEXT) ═══════
let _speechRecognition = null;
let _isListening = false;

window.toggleVoiceInput = function(forceState) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceBtn = document.getElementById('chatVoiceBtn');
  const indicator = document.getElementById('chatVoiceIndicator');
  const input = document.getElementById('chatInput');

  if (!SpeechRecognition) {
    showToast("⚠️ La reconnaissance vocale n'est pas supportée par ce navigateur.", "info");
    return;
  }

  const shouldStart = forceState !== undefined ? forceState : !_isListening;

  if (!shouldStart) {
    if (_speechRecognition) {
      try { _speechRecognition.stop(); } catch(e) {}
    }
    _isListening = false;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    if (indicator) indicator.style.display = 'none';
    return;
  }

  try {
    if (_speechRecognition) {
      try { _speechRecognition.abort(); } catch(e) {}
    }
    _speechRecognition = new SpeechRecognition();
    _speechRecognition.lang = 'fr-FR';
    _speechRecognition.continuous = true;
    _speechRecognition.interimResults = true;

    let baseText = input.value ? input.value.trim() + ' ' : '';

    _speechRecognition.onstart = () => {
      _isListening = true;
      if (voiceBtn) voiceBtn.classList.add('recording');
      if (indicator) indicator.style.display = 'flex';
      input.focus();
    };

    _speechRecognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          baseText += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      input.value = (baseText + interim).trim();
    };

    _speechRecognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        showToast("⚠️ Accès au micro refusé. Activez le micro dans les paramètres.", "error");
      }
      _isListening = false;
      if (voiceBtn) voiceBtn.classList.remove('recording');
      if (indicator) indicator.style.display = 'none';
    };

    _speechRecognition.onend = () => {
      _isListening = false;
      if (voiceBtn) voiceBtn.classList.remove('recording');
      if (indicator) indicator.style.display = 'none';
    };

    _speechRecognition.start();
  } catch (err) {
    console.error('Error starting speech recognition:', err);
    showToast("Impossible de démarrer le micro.", "error");
    _isListening = false;
    if (voiceBtn) voiceBtn.classList.remove('recording');
    if (indicator) indicator.style.display = 'none';
  }
};

// ═══════ IMAGE UPLOAD & PREVIEW ═══════
let pendingChatImage = null; // { mimeType, data, dataUri }

window.handleChatImageSelected = function(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast("⚠️ Veuillez sélectionner un fichier image valide.", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("⚠️ L'image est trop volumineuse (max 5 Mo).", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUri = evt.target.result;
    const base64Data = dataUri.split(',')[1];
    pendingChatImage = {
      mimeType: file.type,
      data: base64Data,
      dataUri: dataUri
    };

    const preview = document.getElementById('chatAttachmentPreview');
    const img = document.getElementById('chatAttachmentImg');
    if (preview && img) {
      img.src = dataUri;
      preview.style.display = 'flex';
    }
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  };
  reader.readAsDataURL(file);
};

window.removeChatImage = function() {
  pendingChatImage = null;
  const preview = document.getElementById('chatAttachmentPreview');
  const fileInput = document.getElementById('chatImageInput');
  if (preview) preview.style.display = 'none';
  if (fileInput) fileInput.value = '';
};

window.quickChat = function(query) {
  document.getElementById('chatInput').value = query;
  document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};

window.sendChat = async function(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  const attachedImage = pendingChatImage;

  if (!query && !attachedImage) return;

  if (_isListening) {
    window.toggleVoiceInput(false);
  }

  const messageText = query || "Analyse cette photo et donne-moi ton avis vitaliste détaillé.";
  input.value = '';
  window.removeChatImage();
  
  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'none';

  let conv = null;
  if (!activeConvId) {
    // Create new conversation
    conv = {
      id: 'conv_' + Date.now(),
      title: messageText.length > 25 ? messageText.substring(0, 25) + '...' : messageText,
      updated: Date.now(),
      messages: []
    };
    conversations.push(conv);
    activeConvId = conv.id;
  } else {
    conv = conversations.find(c => c.id === activeConvId);
    conv.updated = Date.now();
  }

  conv.messages.push({ role: 'user', text: messageText, image: attachedImage ? attachedImage.dataUri : null });
  saveConversations();
  addMessage(messageText, true, null, attachedImage ? attachedImage.dataUri : null);

  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  const typingEl = addTypingIndicator();

  try {
    const profile = getUserProfile();
    const reqBody = {
      query: messageText,
      profile,
      history: conv.messages.slice(0, -1).map(m => ({ role: m.role, text: m.text })),
      model: store.get('selected_model', 'auto')
    };

    if (attachedImage) {
      reqBody.fileParts = [{
        inlineData: {
          mimeType: attachedImage.mimeType,
          data: attachedImage.data
        }
      }];
    }
    
    // Call the backend with stream=true to bypass the 10s Vercel timeout
    const resp = await fetch(`${API_BASE}/api/chat?stream=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(VT_APP_KEY ? { 'X-VT-API-Key': VT_APP_KEY } : {}) },
      body: JSON.stringify(reqBody),
    });
    
    typingEl.remove();
    if (!resp.ok) { 
      const err = await resp.json().catch(() => ({})); 
      throw new Error(err.error || `HTTP ${resp.status}`); 
    }
    
    let aiText = '';
    let modelUsed = 'Inconnu';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    
    // Create the streaming bubble
    const container = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    msgDiv.id = 'streaming-bubble-container';
    const avatarHtml = window.renderPigeonPortrait ? window.renderPigeonPortrait(24, 'talking') : '🐦';
    msgDiv.innerHTML = `<div class="message-avatar">${avatarHtml}</div><div class="message-bubble" id="streaming-bubble">...</div>`;
    container.appendChild(msgDiv);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        
        if (line.startsWith('data: ')) {
          try {
            const dataObj = JSON.parse(line.substring(6));
            if (dataObj.model) modelUsed = dataObj.model;
            if (dataObj.candidates && dataObj.candidates[0].content) {
              aiText += dataObj.candidates[0].content.parts[0].text;
              const streamingBubble = document.getElementById('streaming-bubble');
              if (streamingBubble) streamingBubble.innerHTML = renderMarkdown(aiText);
              container.scrollTop = container.scrollHeight;
            }
          } catch (e) {}
        }
      }
    }
    
    // Finalize message UI by replacing the streaming bubble with a normal addMessage call
    const streamingContainer = document.getElementById('streaming-bubble-container');
    if (streamingContainer) streamingContainer.remove();
    
    // Update badge UI
    const badge = document.getElementById('currentModelBadge');
    if (badge) {
      if (modelUsed.includes('gemma')) {
        badge.innerHTML = `<i class="ri-cpu-line" style="color:#22d3ee"></i> ${modelUsed}`;
      } else if (modelUsed.includes('flash-exp')) {
        badge.innerHTML = `<i class="ri-bard-fill" style="color:#a78bfa"></i> ${modelUsed}`;
      } else if (modelUsed.includes('pro')) {
        badge.innerHTML = `<i class="ri-server-line" style="color:#fbbf24"></i> ${modelUsed}`;
      } else {
        badge.innerHTML = `<i class="ri-flashlight-fill" style="color:#4ade80"></i> ${modelUsed}`;
      }
    }
    
    conv.messages.push({ role: 'model', text: aiText, model: modelUsed });
    conv.updated = Date.now();
    saveConversations();
    addMessage(aiText, false, modelUsed);
    
  } catch (err) { 
    typingEl.remove(); 
    addMessage(`❌ Erreur : ${err.message}`, false); 
  } finally { 
    sendBtn.disabled = false; 
    input.focus();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SELECTOR & CASCADING FLYOUT SUB-MENU
// ═══════════════════════════════════════════════════════════════════════════
const MODEL_TAXONOMY = [
  {
    id: 'auto',
    name: 'Rotateur Auto',
    icon: 'ri-instance-line',
    iconColor: '#34d399',
    tagline: 'Bascule dynamique anti-surcharge',
    models: [
      { id: 'auto', name: 'Rotateur Automatique', badge: 'Recommandé', tagline: 'Sélectionne le meilleur modèle selon la charge & la complexité' }
    ]
  },
  {
    id: 'flash',
    name: 'Flash (Ultra Rapide)',
    icon: 'ri-flashlight-fill',
    iconColor: '#4ade80',
    tagline: 'Vitesse maximale & réponse immédiate',
    models: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', badge: 'Fastest & Smartest ⚡', tagline: 'Dernière génération hybride, multimodal & réactivité instantanée' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Ultra Rapide', tagline: 'Modèle réactif de haute précision pour le chat instantané' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Équilibré', tagline: 'Vitesse élevée et excellente précision nutritionnelle' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', badge: 'Auto-Update', tagline: 'Pointé sur la version Flash stable la plus récente' }
    ]
  },
  {
    id: 'premium',
    name: 'Premium (Raisonnement)',
    icon: 'ri-brain-line',
    iconColor: '#fbbf24',
    tagline: 'Analyse approfondie & requêtes complexes',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', badge: 'Raisonnement', tagline: 'Réfléchit en profondeur pour les cas médicaux et protocoles' },
      { id: 'gemini-pro-latest', name: 'Gemini Pro Latest', badge: 'Pro Stable', tagline: 'Pro puissant pour la synthèse et les plans avancés' }
    ]
  },
  {
    id: 'lite',
    name: 'Lite (Haute Capacité)',
    icon: 'ri-bolt-line',
    iconColor: '#a78bfa',
    tagline: 'Grande fenêtre de contexte & légèreté',
    models: [
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Grand Contexte', tagline: 'Idéal pour absorber de longs documents ou fichiers PDF' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', badge: 'Économe', tagline: 'Traitement fluide à consommation optimisée' },
      { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite', badge: 'Lite Stable', tagline: 'Modèle léger ultra-rapide' }
    ]
  },
  {
    id: 'gemma',
    name: 'Open Weights (Gemma)',
    icon: 'ri-cpu-line',
    iconColor: '#22d3ee',
    tagline: 'Modèles ouverts Google DeepMind',
    models: [
      { id: 'gemma-4-31b-it', name: 'Gemma 4 31B', badge: '31B Params', tagline: 'Grand modèle open-weights à haute fiabilité' },
      { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B', badge: '26B Params', tagline: 'Modèle ouvert rapide et agile' }
    ]
  }
];

window.renderModelPicker = function() {
  const container = document.getElementById('modelDropdown');
  if (!container) return;

  const currentSelected = store.get('selected_model', 'auto');

  let html = `
    <div class="model-dropdown-header">
      <span>Sélection du Modèle AI</span>
      <span style="font-size:0.6rem;opacity:0.7"><i class="ri-information-line"></i> Survoler pour la cascade</span>
    </div>
  `;

  MODEL_TAXONOMY.forEach(cat => {
    const isCatActive = cat.models.some(m => m.id === currentSelected);

    let subHtml = `<div class="model-sub-dropdown">
      <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--text-dim,#64748b);padding:4px 8px 6px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px">
        ${esc(cat.name)}
      </div>`;

    cat.models.forEach(m => {
      const isSelected = m.id === currentSelected;
      subHtml += `
        <div class="model-option-item ${isSelected ? 'selected' : ''}" onclick="selectModel('${esc(m.id)}', '${esc(m.name)}', '${esc(cat.icon)}', '${esc(cat.iconColor)}')">
          <div class="model-option-row">
            <span class="model-option-name">${esc(m.name)}</span>
            <span class="model-option-badge">${esc(m.badge)}</span>
          </div>
          <div class="model-option-tagline">${esc(m.tagline)}</div>
        </div>
      `;
    });
    subHtml += `</div>`;

    html += `
      <div class="model-cat-item ${isCatActive ? 'active' : ''}">
        <div class="model-cat-left">
          <div class="model-cat-icon" style="color:${cat.iconColor}">
            <i class="${cat.icon}"></i>
          </div>
          <div>
            <div class="model-cat-title">${esc(cat.name)}</div>
            <div class="model-cat-sub">${esc(cat.tagline)}</div>
          </div>
        </div>
        <i class="ri-arrow-right-s-line model-cat-arrow"></i>
        ${subHtml}
      </div>
    `;
  });

  container.innerHTML = html;
  updateModelHeaderBadge();
};

window.selectModel = function(modelId, modelName, iconClass, iconColor) {
  store.set('selected_model', modelId);
  const dropdown = document.getElementById('modelDropdown');
  if (dropdown) dropdown.style.display = 'none';
  updateModelHeaderBadge();
};

function updateModelHeaderBadge() {
  const currentSelected = store.get('selected_model', 'auto');
  const badge = document.getElementById('currentModelBadge');
  if (!badge) return;

  let foundModel = null;
  let foundCat = null;

  for (const cat of MODEL_TAXONOMY) {
    const m = cat.models.find(x => x.id === currentSelected);
    if (m) {
      foundModel = m;
      foundCat = cat;
      break;
    }
  }

  if (foundModel && foundCat) {
    badge.innerHTML = `<i class="${foundCat.icon}" style="color:${foundCat.iconColor}"></i> ${esc(foundModel.name)}`;
  } else {
    badge.innerHTML = `<i class="ri-instance-line" style="color:#34d399"></i> Rotateur Auto`;
  }
}

window.toggleModelList = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('modelDropdown');
  if (!dropdown) return;

  const isVisible = dropdown.style.display === 'block';
  if (!isVisible) {
    window.renderModelPicker();
    dropdown.style.display = 'block';

    const rect = dropdown.getBoundingClientRect();
    if (window.innerWidth - rect.right < 280) {
      dropdown.classList.add('flip-sub');
    } else {
      dropdown.classList.remove('flip-sub');
    }
  } else {
    dropdown.style.display = 'none';
  }
};

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
  const selector = document.querySelector('.model-selector');
  const dropdown = document.getElementById('modelDropdown');
  if (selector && dropdown && !selector.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});


function addMessage(text, isUser, modelUsed = null, imageUri = null) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user' : 'bot'}`;
  
  let badgeHtml = '';
  if (!isUser && modelUsed) {
    badgeHtml = `<div style="margin-top:8px;font-size:0.65rem;color:var(--text-dim);opacity:0.7;display:flex;align-items:center;gap:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:4px"><i class="ri-braces-line"></i> ${esc(modelUsed)}</div>`;
  }
  
  // Generate quick-reply chips for AI messages
  let quickReplies = '';
  if (!isUser) {
    const chips = detectQuickReplies(text);
    if (chips.length) {
      quickReplies = `<div class="quick-replies" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08)">
        ${chips.map(c => `<button class="quick-reply-chip" onclick="sendQuickReply(this, '${esc(c)}')" style="
          padding:6px 14px;border-radius:18px;border:1px solid var(--accent);background:rgba(var(--accent-rgb,74,222,128),0.08);
          color:var(--text);cursor:pointer;font-size:0.82rem;transition:all 0.2s;white-space:nowrap">${esc(c)}</button>`).join('')}
      </div>`;
    }
  }
  
  const avatarHtml = !isUser ? `<div class="message-avatar">${window.renderPigeonPortrait ? window.renderPigeonPortrait(24, 'talking') : '🐦'}</div>` : '';
  const imgHtml = imageUri ? `<img src="${imageUri}" class="message-image" alt="Photo jointe">` : '';
  div.innerHTML = `${avatarHtml}<div class="message-bubble">${imgHtml}${isUser ? esc(text) : renderMarkdown(text)}${quickReplies}${badgeHtml}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div'); div.className = 'message bot'; div.id = 'typing-indicator';
  const typingAvatar = window.renderPigeonPortrait ? window.renderPigeonPortrait(24, 'talking') : '🐦';
  div.innerHTML = `<div class="message-avatar">${typingAvatar}</div><div class="message-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  container.appendChild(div); container.scrollTop = container.scrollHeight; return div;
}

// ═══════ SEARCH ENGINE ═══════
// Inverted index: token → Set of vitalDb indices
let _searchIndex = new Map();
let _lastSearchResults = []; // cache last matches for sort/rerender
let _lastSearchQuery = '';
let _searchDebounceTimer = null;
const _aiSearchCache = new Map(); // query string → food object (in-memory)

// Build an inverted index of 2-char+ prefixes and full tokens from all names
function buildSearchIndex() {
  _searchIndex.clear();
  vitalDb.forEach((item, idx) => {
    const tokens = new Set();
    (item.names || []).forEach(name => {
      const lower = name.toLowerCase();
      tokens.add(lower);
      // Add all substrings of length >= 2 starting at position 0 (prefix index)
      for (let len = 2; len <= lower.length; len++) tokens.add(lower.slice(0, len));
      // Also index by each word's prefix for multi-word names
      lower.split(/\s+/).forEach(word => {
        for (let len = 2; len <= word.length; len++) tokens.add(word.slice(0, len));
      });
    });
    // Add category as a searchable token too
    if (item.category) {
      const cat = item.category.toLowerCase();
      tokens.add(cat);
      for (let len = 2; len <= cat.length; len++) tokens.add(cat.slice(0, len));
    }
    tokens.forEach(token => {
      if (!_searchIndex.has(token)) _searchIndex.set(token, new Set());
      _searchIndex.get(token).add(idx);
    });
  });
}

// Levenshtein distance (simplified, capped at 3 for performance)
function levenshtein(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Fuzzy search: find items where any name is within edit distance ≤ 2
function fuzzySearch(q) {
  const matched = new Set();
  vitalDb.forEach((item, idx) => {
    const names = item.names || [];
    for (const name of names) {
      const lower = name.toLowerCase();
      // Substring match
      if (lower.includes(q)) { matched.add(idx); break; }
      // Per-word fuzzy match (edit distance ≤ 2 for words >= 4 chars)
      const words = lower.split(/\s+/);
      const qWords = q.split(/\s+/);
      for (const qw of qWords) {
        if (qw.length < 3) continue;
        for (const w of words) {
          if (w.length < 3) continue;
          if (levenshtein(qw, w) <= (qw.length <= 4 ? 1 : 2)) {
            matched.add(idx);
            break;
          }
        }
        if (matched.has(idx)) break;
      }
      if (matched.has(idx)) break;
    }
  });
  return [...matched].map(i => vitalDb[i]);
}

// Index lookup (fast exact/prefix match)
function indexSearch(q) {
  const hits = _searchIndex.get(q);
  if (hits && hits.size > 0) return [...hits].map(i => vitalDb[i]);
  return null;
}

// Apply active filter to a list of items
function applyFilter(matches) {
  if (currentSearchFilter === 'all') return matches;
  return matches.filter(item => {
    const sp = item.specific || {};
    if (currentSearchFilter === 'electric') return sp.electric === true;
    if (currentSearchFilter === 'hybrid') return sp.hybrid === true;
    if (currentSearchFilter === 'alkaline') return (item.scientific_defaults?.pral ?? 0) < 0;
    if (currentSearchFilter === 'mucus') return sp.electric !== true && sp.hybrid !== true;
    return true;
  });
}

// Sort a list of items by current sort select value
function applySortItems(items) {
  const sort = document.getElementById('searchSortSelect')?.value || 'relevance';
  const sorted = [...items];
  if (sort === 'pral-asc') sorted.sort((a, b) => (a.scientific_defaults?.pral ?? 0) - (b.scientific_defaults?.pral ?? 0));
  else if (sort === 'pral-desc') sorted.sort((a, b) => (b.scientific_defaults?.pral ?? 0) - (a.scientific_defaults?.pral ?? 0));
  else if (sort === 'nova-asc') sorted.sort((a, b) => (a.vitality?.nova ?? 4) - (b.vitality?.nova ?? 4));
  else if (sort === 'freshness-desc') sorted.sort((a, b) => (b.vitality?.freshness ?? 0) - (a.vitality?.freshness ?? 0));
  else if (sort === 'az') sorted.sort((a, b) => (a.names?.[0] || '').localeCompare(b.names?.[0] || '', 'fr'));
  return sorted;
}

// Re-render with current sort (called by sort select change)
window.applySortAndRender = function() {
  if (_lastSearchResults.length > 0) renderSearchResults(_lastSearchResults, _lastSearchQuery);
};

window.setSearchFilter = function(filter) {
  currentSearchFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  const q = (document.getElementById('searchInput')?.value || '').trim();
  if (q) {
    searchFoods(q);
  } else {
    // Re-render popular/category if no query
    renderPopularFoods();
  }
};

// Debounced search entry point
window.searchFoods = function(query) {
  const q = (query || '').trim();
  // Show/hide clear button
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  clearTimeout(_searchDebounceTimer);
  _searchDebounceTimer = setTimeout(() => _doSearch(q), 200);
};

function _doSearch(q) {
  const resultsEl = document.getElementById('foodResults');
  const emptyState = document.getElementById('searchEmptyState');
  const statsBar = document.getElementById('searchStatsBar');

  if (!q) {
    // No query → show empty state (category browse + popular)
    if (resultsEl) { resultsEl.innerHTML = ''; resultsEl.style.display = 'none'; }
    if (emptyState) emptyState.style.display = '';
    if (statsBar) statsBar.style.display = 'none';
    _lastSearchResults = [];
    _lastSearchQuery = '';
    return;
  }

  const lower = q.toLowerCase();

  // 1. Try fast index lookup
  let matches = indexSearch(lower);

  // 2. If no hit from index, try fuzzy
  if (!matches || matches.length === 0) matches = fuzzySearch(lower);

  // 3. Apply active filter
  matches = applyFilter(matches || []);

  // Store for sort re-renders
  _lastSearchResults = matches;
  _lastSearchQuery = q;

  renderSearchResults(matches, q);
}

function renderSearchResults(matches, q) {
  const resultsEl = document.getElementById('foodResults');
  const emptyState = document.getElementById('searchEmptyState');
  const statsBar = document.getElementById('searchStatsBar');
  const countEl = document.getElementById('searchResultCount');

  // Hide empty state, show results area
  if (emptyState) emptyState.style.display = 'none';
  if (resultsEl) resultsEl.style.display = 'flex';

  // Apply sort
  const sorted = applySortItems(matches).slice(0, 40);

  if (matches.length === 0) {
    if (statsBar) statsBar.style.display = 'none';
    resultsEl.innerHTML = `
      <p class="empty-state">Aucun résultat pour <strong>"${esc(q)}"</strong>.</p>
      <div style="text-align:center; margin-top:8px">
        <button class="btn-primary" style="margin: 0 auto; display: inline-flex; align-items:center; gap:8px;" onclick="askAIToFindFood('${esc(q)}')">
          <i class="ri-sparkling-fill"></i> Analyser "${esc(q)}" avec l'IA
        </button>
      </div>
    `;
    return;
  }

  // Update stats bar
  if (statsBar) statsBar.style.display = 'flex';
  if (countEl) {
    const total = matches.length;
    countEl.textContent = total === 1 ? `1 résultat` : `${total} résultats`;
  }

  // Save to recent searches
  saveRecentSearch(q);

  resultsEl.innerHTML = sorted.map(item => renderFoodCard(item)).join('');
}

function renderFoodCard(item, compact = false) {
  const name = ((item.names?.[0] || 'Inconnu')).replace(/^./, c => c.toUpperCase());
  const sp = item.specific || {};
  const sc = item.scientific_defaults || {};
  const vt = item.vitality || {};
  const isE = sp.electric === true;
  const isH = sp.hybrid === true;
  const pral = sc.pral ?? 0;
  const nova = vt.nova ?? (isE ? 1 : isH ? 2 : 3);
  const freshness = vt.freshness ?? 70;
  const bc = isE ? 'badge-electric' : isH ? 'badge-hybrid' : 'badge-mucus';
  const bt = isE ? 'Électrique' : isH ? 'Hybride' : 'Mucogène';
  const novaCls = `nova-${Math.min(4, Math.max(1, nova))}`;
  const freshnessColor = freshness >= 80 ? '#34d399' : freshness >= 50 ? '#facc15' : '#ef4444';
  const idx = vitalDb.indexOf(item);
  const favs = store.get('favorites', []);
  const isFav = item.id && favs.some(f => f.id === item.id);
  const noteHtml = item.note ? `<div class="food-note" title="${esc(item.note)}">${esc(item.note.slice(0, 70))}${item.note.length > 70 ? '…' : ''}</div>` : '';

  if (compact) {
    return `<div class="food-card-compact" onclick="openFoodModal(${idx})">
      <div class="food-emoji">${item.emoji || '🍽️'}</div>
      <div class="food-name">${esc(name)}</div>
      <span class="food-badge ${bc}">${bt}</span>
    </div>`;
  }

  return `<div class="food-card" onclick="openFoodModal(${idx})">
    ${isFav ? '<span class="food-fav-icon"><i class="ri-heart-fill"></i></span>' : ''}
    <div class="food-emoji">${item.emoji || '🍽️'}</div>
    <div class="food-info">
      <div class="food-name">${esc(name)}</div>
      <div class="food-meta">${esc(item.family || item.category || '')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)}</div>
      ${noteHtml}
      <div class="food-freshness-bar"><div class="food-freshness-fill" style="width:${freshness}%;background:${freshnessColor}"></div></div>
    </div>
    <div class="food-card-right">
      <span class="food-badge ${bc}">${bt}</span>
      <span class="nova-pip ${novaCls}">NOVA ${nova}</span>
    </div>
  </div>`;
}

// ─── Recent searches (localStorage, max 8) ───
function saveRecentSearch(q) {
  if (!q || q.length < 2) return;
  let recents = store.get('search-recents', []);
  recents = recents.filter(r => r.toLowerCase() !== q.toLowerCase());
  recents.unshift(q);
  store.set('search-recents', recents.slice(0, 8));
  renderRecentSearches();
}

function renderRecentSearches() {
  const wrap = document.getElementById('searchRecentWrap');
  const chips = document.getElementById('searchRecentChips');
  if (!wrap || !chips) return;
  const recents = store.get('search-recents', []);
  if (recents.length === 0) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  chips.innerHTML = recents.map(r => `
    <button class="recent-chip" onclick="applyRecentSearch('${esc(r)}')">
      <i class="ri-search-line"></i> ${esc(r)}
    </button>
  `).join('');
}

window.applyRecentSearch = function(q) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = q; input.focus(); }
  searchFoods(q);
};

window.clearRecentSearches = function() {
  store.set('search-recents', []);
  renderRecentSearches();
};

window.clearSearch = function() {
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; input.focus(); }
  searchFoods('');
};

// ─── Category browse ───
const CATEGORY_EMOJIS = {
  'Fruits': '🍎', 'Légumes': '🥬', 'Herbes & Thés': '🌿', 'Épices & Assaisonnements': '🌶️',
  'Céréales': '🌾', 'Légumineuses': '🫘', 'Noix & Graines': '🥜', 'Huiles': '🫒',
  'Boissons': '💧', 'À éviter': '⛔', 'Viandes & Charcuterie': '🥩', 'Poissons & Fruits de mer': '🐟',
  'Produits Laitiers': '🧀', 'Œufs': '🥚', 'Volailles': '🍗', 'Plats Cuisinés & Fast Food': '🍕',
  'Snacks & Ultra-transformés': '🍟', 'Pain & Boulangerie': '🥖', 'Condiments & Sauces': '🧂',
  'Compléments & Suppléments': '💊', 'Sucrants': '🍬', 'Algues & Minéraux': '🌊'
};

function renderCategoryBrowse() {
  const grid = document.getElementById('categoryBrowseGrid');
  if (!grid) return;
  const cats = {};
  vitalDb.forEach(item => { const c = item.category || 'Autre'; cats[c] = (cats[c] || 0) + 1; });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  grid.innerHTML = sorted.map(([cat, count]) => {
    const emoji = CATEGORY_EMOJIS[cat] || '🍽️';
    const shortName = cat.replace(' & ', '/').replace(' et ', '/');
    return `<div class="category-card" onclick="browseFoodsByCategory('${esc(cat)}')">
      <span class="category-card-emoji">${emoji}</span>
      <span class="category-card-name">${esc(shortName)}</span>
      <span class="category-card-count">${count} aliments</span>
    </div>`;
  }).join('');
}

window.browseFoodsByCategory = function(cat) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = cat; }
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.style.display = 'block';

  const matches = applyFilter(vitalDb.filter(item => item.category === cat));
  _lastSearchResults = matches;
  _lastSearchQuery = cat;
  renderSearchResults(matches, cat);
};

// ─── Popular foods (8 random electric/high-freshness items) ───
function renderPopularFoods() {
  const grid = document.getElementById('popularFoodsGrid');
  if (!grid) return;
  let pool = vitalDb.filter(i => i.specific?.electric === true && (i.vitality?.freshness ?? 0) >= 85);
  if (pool.length < 6) pool = vitalDb.filter(i => (i.vitality?.freshness ?? 0) >= 70);
  // Shuffle deterministically based on day
  const seed = Math.floor(Date.now() / 86400000);
  pool = [...pool].sort((a, b) => {
    const ha = (a.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), seed);
    const hb = (b.id || '').split('').reduce((s, c) => s + c.charCodeAt(0), seed);
    return ha - hb;
  }).slice(0, 8);
  grid.innerHTML = pool.map(item => renderFoodCard(item, true)).join('');
}

// ─── AI search cache ───
window.askAIToFindFood = async function(query) {
  const q = (query || '').trim();
  if (!q) return;

  const cacheKey = q.toLowerCase();
  const resultsEl = document.getElementById('foodResults');
  const emptyState = document.getElementById('searchEmptyState');
  const statsBar = document.getElementById('searchStatsBar');

  // Check in-memory cache first
  if (_aiSearchCache.has(cacheKey)) {
    const cached = _aiSearchCache.get(cacheKey);
    if (resultsEl) { resultsEl.style.display = 'flex'; }
    if (emptyState) emptyState.style.display = 'none';
    if (statsBar) statsBar.style.display = 'none';
    resultsEl.innerHTML = renderFoodCard(cached);
    openFoodModal(vitalDb.indexOf(cached) >= 0 ? vitalDb.indexOf(cached) : cached);
    return;
  }

  // Check localStorage cache (TTL 24h)
  const storedCache = store.get('ai-food-cache', {});
  if (storedCache[cacheKey] && (Date.now() - (storedCache[cacheKey]._cachedAt || 0)) < 86400000) {
    const cached = storedCache[cacheKey];
    _aiSearchCache.set(cacheKey, cached);
    vitalDb.push(cached);
    if (resultsEl) { resultsEl.style.display = 'flex'; }
    if (emptyState) emptyState.style.display = 'none';
    if (statsBar) statsBar.style.display = 'none';
    resultsEl.innerHTML = renderFoodCard(cached);
    openFoodModal(vitalDb.length - 1);
    return;
  }

  if (resultsEl) {
    resultsEl.style.display = 'flex';
    resultsEl.innerHTML = `<p class="empty-state" style="padding:16px;text-align:center"><i class="ri-loader-4-line ri-spin" style="font-size:1.4rem;vertical-align:middle;margin-right:8px;color:var(--accent)"></i> Analyse de "${esc(q)}" via l'IA...</p>`;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (statsBar) statsBar.style.display = 'none';

  try {
    let aiFood = null;
    try {
      const res = await fetch('/api/searchFood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) aiFood = await res.json();
    } catch (err) {
      console.warn('[AI Food Search] API fetch failed, using local fallback:', err);
    }

    if (!aiFood) {
      aiFood = classifyFoodLocally(q);
      aiFood.isNewFromAI = true;
    }

    // Cache result
    aiFood._cachedAt = Date.now();
    _aiSearchCache.set(cacheKey, aiFood);
    const storedC = store.get('ai-food-cache', {});
    storedC[cacheKey] = aiFood;
    // Prune to 50 entries
    const keys = Object.keys(storedC);
    if (keys.length > 50) delete storedC[keys[0]];
    store.set('ai-food-cache', storedC);

    vitalDb.push(aiFood);
    // Rebuild index with new item
    buildSearchIndex();
    const newIdx = vitalDb.length - 1;
    if (resultsEl) resultsEl.innerHTML = renderFoodCard(aiFood);
    openFoodModal(newIdx);
    showToast(`✨ "${aiFood.names?.[0] || q}" analysé avec succès !`, 'success');
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = `<p class="empty-state text-danger">${esc(e.message)}</p>`;
    showToast('Recherche IA terminée avec estimation locale.', 'info');
  }
};

// ─── Init search page (called once after DB loads) ───
function initSearchPage() {
  renderRecentSearches();
  renderCategoryBrowse();
  renderPopularFoods();

  // Wire debounced input (HTML now has no oninput attr)
  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('input', e => searchFoods(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') clearSearch();
      if (e.key === 'Enter' && !_lastSearchResults.length && input.value.trim()) {
        askAIToFindFood(input.value.trim());
      }
    });
  }
}

// ═══════ FOOD MODAL ═══════
// ═══════ FOOD MODAL (3 ONGLETS UNIVERSEL) ═══════
window.openFoodModal = function(idxOrFood) {
  let item = null;
  let isMealContext = false;
  let isMealSelection = false;

  if (typeof idxOrFood === 'number' || (!isNaN(Number(idxOrFood)) && typeof idxOrFood !== 'object')) {
    item = vitalDb[Number(idxOrFood)];
  } else if (typeof idxOrFood === 'string') {
    item = vitalDb.find(f => f.id === idxOrFood || (f.names || []).some(n => n.toLowerCase() === idxOrFood.toLowerCase()));
  } else if (typeof idxOrFood === 'object' && idxOrFood !== null) {
    item = idxOrFood;
    isMealContext = idxOrFood.isMealItem === true;
    isMealSelection = idxOrFood.isMealSelection === true;
  }

  if (!item) return;
  currentModalFood = item;

  const isAddingMeal = isMealSelection || (document.getElementById('addMealModal')?.classList.contains('open'));

  const name = (item.names?.[0] || item.name || 'Aliment').replace(/^./, c => c.toUpperCase());
  
  const sc = item.scientific_defaults || item.scientific || {
    pral: item.pral ?? 0,
    density: item.density ?? ((item.pral ?? 0) < 0 ? 80 : 35),
    label: (item.pral ?? 0) < 0 ? 'Alcalinisant' : 'Acidifiant'
  };
  
  const vt = item.vitality || {
    nova: item.nova ?? (item.electric ? 1 : 2),
    freshness: item.freshness ?? ((item.nova === 1 || item.electric) ? 95 : item.nova === 4 ? 15 : 60),
    label: item.vitalityLabel || (item.nova === 1 ? 'Aliment Brut (Non transformé)' : item.nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment transformé')
  };

  const sp = item.specific || {
    electric: item.electric === true || item.approved === true,
    hybrid: item.hybrid === true,
    mucus: item.mucus || (item.electric ? 'Dissolvant' : item.hybrid ? 'Faiblement Mucogène' : 'Mucogène'),
    label: item.electric ? 'Électrique (Dr. Sebi)' : item.hybrid ? 'Hybride' : 'Standard / Mucogène'
  };

  const isE = sp.electric === true;
  const isHyb = sp.hybrid === true;

  let multiNavHtml = '';
  if (item.allAnalyzedItems && item.allAnalyzedItems.length > 1) {
    multiNavHtml = `
      <div class="analyzed-nav" style="margin-top:10px;">
        <span style="font-size:0.75rem; color:var(--text-dim); width:100%; text-align:center; margin-bottom:4px; display:block;">
          <i class="ri-sparkling-fill" style="color:var(--accent)"></i> ${item.allAnalyzedItems.length} aliments analysés dans ce plat :
        </span>
        ${item.allAnalyzedItems.map((it, i) => {
          const itName = (it.name || it.names?.[0] || 'Aliment').replace(/^./, c => c.toUpperCase());
          const isCurrent = itName.toLowerCase() === name.toLowerCase();
          return `<button type="button" class="tab ${isCurrent ? 'active' : ''}" onclick="switchAnalyzedFoodInModal(${i})" style="padding:4px 10px; font-size:0.8rem; border-radius:20px;">
            ${it.emoji || '🍽️'} ${esc(itName)}
          </button>`;
        }).join('')}
      </div>
    `;
  }

  document.getElementById('modalFoodHeader').innerHTML = `
    <div style="font-size:3rem;margin-bottom:8px">${item.emoji || '🍽️'}</div>
    <h2 style="font-family:var(--font);font-weight:700;font-size:1.35rem;">${esc(name)}</h2>
    <p style="color:var(--text-dim);font-size:0.88rem;margin-top:4px;">
      ${esc(item.family || 'Aliment')} · ${isE ? '⚡ Électrique' : isHyb ? '🔀 Hybride' : '⛔ Mucogène'}
    </p>
    ${multiNavHtml}
  `;

  currentModalFood._parsed = { name, sc, vt, sp, item };
  setModalTab('scientific');

  const favs = store.get('favorites', []);
  const isFav = item.id ? favs.some(f => f.id === item.id) : false;

  // Render modal actions based on context
  const actionsContainer = document.getElementById('modalActionsContainer');
  if (actionsContainer) {
    if (item.isNewFromAI) {
      actionsContainer.innerHTML = `
        <button class="btn-primary full-w" onclick="saveAIFoodToDB()"><i class="ri-save-line"></i> Confirmer et Sauvegarder dans ma base</button>
      `;
    } else if (isMealContext) {
      actionsContainer.innerHTML = `
        <button class="btn-outline full-w" onclick="closeFoodModal()"><i class="ri-check-line"></i> Fermer la carte d'identité</button>
      `;
    } else if (isAddingMeal) {
      actionsContainer.innerHTML = `
        <div style="display:flex; gap:8px; width:100%;">
          <button type="button" class="btn-outline" style="flex:1;" onclick="closeFoodModal()"><i class="ri-arrow-left-line"></i> Continuer le repas</button>
          <button type="button" class="btn-primary" style="flex:1;" onclick="confirmAddMealFromModal()"><i class="ri-checkbox-circle-line"></i> Enregistrer le repas</button>
        </div>
      `;
    } else {
      const idx = vitalDb.indexOf(item);
      actionsContainer.innerHTML = `
        <button class="btn-primary" onclick="addFoodToMealFromModal(${idx})"><i class="ri-add-line"></i> Ajouter au repas</button>
        <button class="btn-outline" id="modalFavBtn" onclick="toggleFavorite()"><i class="ri-heart-line"></i> Favori</button>
      `;
      const favBtn = document.getElementById('modalFavBtn');
      if (favBtn) {
        favBtn.innerHTML = isFav ? '<i class="ri-heart-fill"></i> Retirer' : '<i class="ri-heart-line"></i> Favori';
        favBtn.classList.toggle('active-fav', isFav);
      }
    }
  }

  document.getElementById('foodModal').classList.add('open');
};

window.switchAnalyzedFoodInModal = function(idx) {
  if (!currentModalFood || !currentModalFood.allAnalyzedItems || !currentModalFood.allAnalyzedItems[idx]) return;
  const target = currentModalFood.allAnalyzedItems[idx];
  openFoodModal({
    ...target,
    isMealSelection: true,
    allAnalyzedItems: currentModalFood.allAnalyzedItems
  });
};

window.confirmAddMealFromModal = function() {
  closeFoodModal();
  confirmAddMeal();
};

window.openFoodModalFromSelection = function(id) {
  const item = selectedMealFoods.find(f => f.id === id);
  if (!item) return;
  const dbMatch = vitalDb.find(f => f.id === id || (f.names || []).some(n => n.toLowerCase() === (item.name || '').toLowerCase()));
  const fullItem = dbMatch ? { ...dbMatch, ...item } : item;
  openFoodModal({
    ...fullItem,
    isMealSelection: true,
    allAnalyzedItems: selectedMealFoods
  });
};

window.openFoodModalFromMeal = function(idx) {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  if (idx >= 0 && idx < todayMeals.length) {
    const m = todayMeals[idx];
    const match = vitalDb.find(f => f.id === m.id || (f.names || []).some(n => n.toLowerCase() === (m.name || '').toLowerCase()));
    if (match) {
      openFoodModal({ ...match, isMealItem: true });
    } else {
      const isElec = m.electric === true || m.approved === true;
      const isHyb = m.hybrid === true;
      const nova = m.nova ?? (isElec ? 1 : 2);
      const pral = m.pral ?? 0;
      openFoodModal({
        id: m.id,
        name: m.name,
        emoji: m.emoji || '🍽️',
        family: m.family || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
        scientific_defaults: {
          pral,
          density: m.density ?? (pral < 0 ? 85 : 30),
          label: pral < 0 ? 'Alcalinisant' : 'Acidifiant'
        },
        vitality: {
          nova,
          freshness: m.freshness ?? (nova === 1 ? 95 : nova === 4 ? 15 : 60),
          label: nova === 1 ? 'Aliment Brut (Non transformé)' : nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment Transformé'
        },
        specific: {
          electric: isElec,
          hybrid: isHyb,
          mucus: m.mucus || (isElec ? 'Dissolvant' : isHyb ? 'Faiblement Mucogène' : 'Mucogène'),
          label: isElec ? 'Électrique (Dr. Sebi)' : isHyb ? 'Hybride' : 'Standard / Mucogène'
        },
        note: m.note || (isElec ? 'Aliment électrique vitalogène respectant le bio-équilibre minéral.' : nova === 4 ? 'Aliment ultra-transformé fortement acidifiant.' : 'Aliment ordinaire.'),
        isMealItem: true
      });
    }
  }
};

window.saveAIFoodToDB = function(idx) {
  const item = currentModalFood;
  if (!item) return;
  delete item.isNewFromAI;
  
  const customDb = store.get('customFoods', []);
  customDb.push(item);
  store.set('customFoods', customDb);
  
  showToast('✅ Aliment ajouté définitivement à votre base de données !', 'success');
  window.closeFoodModal();
  searchFoods(document.getElementById('searchInput')?.value || '');
};

window.addFoodToMealFromModal = function(idx) {
  if (idx >= 0 && vitalDb[idx]) {
    selectMealFood(idx);
  } else if (currentModalFood) {
    const f = currentModalFood;
    const name = (f.names?.[0] || f.name || '?').replace(/^./, c => c.toUpperCase());
    selectedMealFoods.push({
      id: f.id || 'dish_' + Date.now(),
      name,
      emoji: f.emoji || '🍽️',
      approved: f.specific?.electric === true || f.approved === true,
      electric: f.specific?.electric === true || f.approved === true,
      hybrid: f.specific?.hybrid === true,
      pral: f.scientific_defaults?.pral ?? (f.scientific?.pral ?? 0),
      nova: f.vitality?.nova ?? 1
    });
    renderSelectedMealFoods();
  }
  window.closeFoodModal();
  showPage('meals');
};

window.closeFoodModal = function(e) { 
  if (!e || e.target === document.getElementById('foodModal')) {
    document.getElementById('foodModal').classList.remove('open'); 
  }
};

window.setModalTab = function(tab) {
  document.querySelectorAll('.modal-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const content = document.getElementById('modalTabContent');
  if (!currentModalFood) return;
  const { name, sc, vt, sp, item } = currentModalFood._parsed || {};

  const pral = sc?.pral ?? 0;
  const isAlkaline = pral < 0;
  const nova = vt?.nova ?? 1;
  const isElectric = sp?.electric === true;
  const isHybrid = sp?.hybrid === true;

  if (tab === 'scientific') {
    content.innerHTML = `
      <div class="data-row">
        <span class="data-label">Charge PRAL (Remer & Manz)</span>
        <span class="data-value" style="font-weight:700; color:${isAlkaline ? '#4ade80' : '#facc15'}">
          ${pral > 0 ? '+' : ''}${pral.toFixed(1)} mEq/100g
        </span>
      </div>
      <div class="data-row">
        <span class="data-label">Effet Rénal Acido-Basique</span>
        <span class="data-value" style="font-weight:600;">${isAlkaline ? '🟢 Alcalinisant puissant' : pral <= 4 ? '🟡 Faiblement acidifiant' : '🔴 Fortement acidifiant'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Densité Micronutritionnelle</span>
        <span class="data-value">${sc?.density ?? '?'}/100</span>
      </div>
      <div class="data-bar"><div class="data-bar-fill" style="width:${sc?.density ?? 50}%;background:${isAlkaline ? 'var(--accent)' : 'var(--warn)'}"></div></div>
      <div style="margin-top:14px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
        <strong style="color:var(--text)">Indice PRAL :</strong> Mesure la charge acide nette éliminée par les reins. Les valeurs négatives préservent les réserves minérales corporelles (Potassium, Magnésium, Calcium).
      </div>
    `;
  } else if (tab === 'vitality') {
    const novaColor = nova === 1 ? '#4ade80' : nova === 2 ? '#38bdf8' : nova === 3 ? '#facc15' : '#ef4444';
    const novaDesc = nova === 1 ? 'Groupe 1 · Non transformé ou minimalement transformé' : nova === 2 ? 'Groupe 2 · Ingrédient culinaire' : nova === 3 ? 'Groupe 3 · Aliment transformé' : 'Groupe 4 · Produit ultra-transformé';
    
    content.innerHTML = `
      <div class="data-row">
        <span class="data-label">Degré de transformation NOVA</span>
        <span class="data-value" style="font-weight:700; color:${novaColor}">NOVA ${nova}/4</span>
      </div>
      <div class="data-row">
        <span class="data-label">Classification Carlos Monteiro</span>
        <span class="data-value" style="font-size:0.85rem;">${vt?.label || novaDesc}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Taux de Fraîcheur & Biogénie</span>
        <span class="data-value" style="font-weight:600;">${vt?.freshness ?? 0}%</span>
      </div>
      <div class="data-bar"><div class="data-bar-fill" style="width:${vt?.freshness ?? 0}%;background:${novaColor}"></div></div>
      <div style="margin-top:14px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
        <strong style="color:var(--text)">Échelle NOVA :</strong> Norme mondiale de l'Université de São Paulo évaluant l'impact des procédés industriels, additifs et raffinements sur la santé humaine.
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="data-row">
        <span class="data-label">Polarité Électrique (Dr. Sebi)</span>
        <span class="data-value" style="font-weight:700; color:${isElectric ? '#4ade80' : '#ef4444'}">${isElectric ? '⚡ Oui (Bio-Minéral)' : '❌ Non électrique'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Hybridation Génétique</span>
        <span class="data-value">${isHybrid ? '⚠️ Hybride / Modifié' : '✅ Végétal Originel'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Indice Mucus (Arnold Ehret)</span>
        <span class="data-value" style="font-weight:600; color:${(sp?.mucus||'').toLowerCase().includes('dissolvant') ? '#4ade80' : (sp?.mucus||'').toLowerCase().includes('mucog') ? '#ef4444' : 'var(--text)'}">${sp?.mucus ?? 'Neutre'}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Verdict Vitaliste</span>
        <span class="data-value">${sp?.label ?? 'Standard'}</span>
      </div>
      ${(currentModalFood.note || item?.note) ? `<div style="margin-top:14px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;"><strong style="color:var(--text)">Note Thérapeutique :</strong> ${esc(currentModalFood.note || item?.note)}</div>` : ''}
    `;
  }
};

// ═══════ FAVORITES ═══════
window.toggleFavorite = function() {
  if (!currentModalFood) return;
  let favs = store.get('favorites', []);
  const idx = favs.findIndex(f => f.id === currentModalFood.id);
  if (idx >= 0) { 
    favs.splice(idx, 1); 
  } else {
    const name = (currentModalFood.names?.[0] || currentModalFood.name || 'Inconnu').replace(/^./, c => c.toUpperCase());
    favs.push({ 
      id: currentModalFood.id, 
      name, 
      emoji: currentModalFood.emoji || '🍽️', 
      family: currentModalFood.family || '', 
      electric: currentModalFood.specific?.electric === true || currentModalFood.electric === true, 
      pral: currentModalFood.scientific_defaults?.pral ?? (currentModalFood.scientific?.pral ?? (currentModalFood.pral ?? 0)) 
    });
  }
  store.set('favorites', favs);
  const isFav = favs.some(f => f.id === currentModalFood.id);
  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    favBtn.innerHTML = isFav ? '<i class="ri-heart-fill"></i> Retirer' : '<i class="ri-heart-line"></i> Favori';
    favBtn.classList.toggle('active-fav', isFav);
  }
  renderFavorites();
};

function renderFavorites() {
  const favs = store.get('favorites', []);
  const list = document.getElementById('favsList');
  if (!list) return;
  if (favs.length === 0) { list.innerHTML = '<p class="empty-state">Aucun favori. Ajoutez des aliments depuis la recherche.</p>'; return; }
  list.innerHTML = favs.map(f => `<div class="food-card clickable" onclick="openFoodModal('${f.id}')" style="cursor:pointer;"><div class="food-emoji">${f.emoji}</div><div class="food-info"><div class="food-name">${esc(f.name)}</div><div class="food-meta">${esc(f.family)} · PRAL ${(f.pral??0).toFixed(1)}</div></div><span class="food-badge ${f.electric ? 'badge-electric' : 'badge-mucus'}">${f.electric ? 'Électrique' : 'Mucogène'}</span></div>`).join('');
}

// ═══════ MEALS ═══════
window.showAddMealModal = function() { selectedMealFoods = []; renderSelectedMealFoods(); document.getElementById('mealSearchResults').innerHTML = ''; document.getElementById('mealSearchInput').value = ''; const aiInput = document.getElementById('aiDishInput'); if (aiInput) aiInput.value = ''; document.getElementById('addMealModal').classList.add('open'); };
window.closeAddMealModal = function(e) { if (!e || e.target === document.getElementById('addMealModal')) document.getElementById('addMealModal').classList.remove('open'); };

function classifyFoodLocally(token) {
  const clean = (token || '').trim();
  const lower = clean.toLowerCase();

  // 1. Check in vitalDb first
  const match = vitalDb.find(item => (item.names || []).some(n => n.toLowerCase() === lower || n.toLowerCase().includes(lower)));
  if (match) return match;

  // 2. Junk Food / Ultra-Processed / Fast Food / Poutine / Fried / Dairy Heavy
  const isUltraProcessed = /poutine|burger|hamburger|cheeseburger|pizza|frite|frites|hot-?dog|tacos|kebab|nugget|nuggets|chips|raclette|fondue|bacon|saucisse|soda|coca|donut|croissant|gaufre|biscuit|snack|fast-?food|croque-?monsieur/i.test(lower);
  
  // 3. Electric Foods (Dr. Sebi: bio-mineral, non-hybridized, alkaline)
  const isElectric = !isUltraProcessed && /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|citron vert|lime|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre|aneth|basilic|coriandre|origan|romarin|thym|sauvage|spiruline|clémentine|mandarine|mûre|framboise|myrtille|fraise/i.test(lower);
  
  // 4. Hybridized / Acidifying Starchy Foods
  const isHybrid = !isUltraProcessed && !isElectric && /carotte|mais|maïs|pomme de terre|patate|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|pamplemousse|champignon/i.test(lower);
  
  // 5. Animal Products / Dairy / Standard Mucus-forming
  const isAnimalMucus = !isUltraProcessed && !isElectric && !isHybrid && /viande|poulet|boeuf|bœuf|porc|veau|agneau|canard|dinde|fromage|lait|creme|crème|beurre|oeuf|œuf|poisson|saumon|thon|crevette/i.test(lower);

  let emoji = '🍽️';
  if (/poutine/i.test(lower)) emoji = '🍟';
  else if (/burger/i.test(lower)) emoji = '🍔';
  else if (/pizza/i.test(lower)) emoji = '🍕';
  else if (/frite/i.test(lower)) emoji = '🍟';
  else if (/avocat/i.test(lower)) emoji = '🥑';
  else if (/concombre/i.test(lower)) emoji = '🥒';
  else if (/mangue/i.test(lower)) emoji = '🥭';
  else if (/papaye/i.test(lower)) emoji = '🍈';
  else if (/pomme/i.test(lower)) emoji = '🍎';
  else if (/banane/i.test(lower)) emoji = '🍌';
  else if (/melon|pasteque|pastèque/i.test(lower)) emoji = '🍉';
  else if (/raisin/i.test(lower)) emoji = '🍇';
  else if (/citron/i.test(lower)) emoji = '🍋';
  else if (/salade|laitue|kale|roquette/i.test(lower)) emoji = '🥗';
  else if (/riz|quinoa/i.test(lower)) emoji = '🍚';

  let pral, density, nova, freshness, mucus, label, family, note;

  if (isUltraProcessed) {
    pral = 14.8;
    density = 15;
    nova = 4;
    freshness = 10;
    mucus = 'Fortement Mucogène';
    label = 'Ultra-transformé / Acidifiant';
    family = 'Plat Industriel';
    note = 'Produit ultra-transformé générant une forte acidose rénale (PRAL +14.8) et une congestion mucogène.';
  } else if (isElectric) {
    pral = -4.5;
    density = 88;
    nova = 1;
    freshness = 95;
    mucus = 'Dissolvant';
    label = 'Électrique (Dr. Sebi)';
    family = 'Aliment Vivant / Vitaliste';
    note = 'Aliment bio-minéral alcalinisant à haute charge électrolytique favorisant le nettoyage cellulaire.';
  } else if (isHybrid) {
    pral = 2.5;
    density = 55;
    nova = 2;
    freshness = 65;
    mucus = 'Faiblement Mucogène';
    label = 'Aliment Hybride';
    family = 'Féculents & Végétaux Hybrides';
    note = 'Aliment issu d\'hybridations végétales, contenant des amidons modérément mucogènes.';
  } else if (isAnimalMucus) {
    pral = 9.5;
    density = 45;
    nova = 3;
    freshness = 30;
    mucus = 'Mucogène Élevé';
    label = 'Produit Animal / Mucogène';
    family = 'Produits Animaux';
    note = 'Génère une production intense de mucus lymphatique et une charge acide importante.';
  } else {
    pral = 1.0;
    density = 50;
    nova = 2;
    freshness = 60;
    mucus = 'Neutre à Mucogène';
    label = 'Standard';
    family = 'Alimentation Courante';
    note = 'Aliment standard à consommer avec modération dans une démarche de détox.';
  }

  const nameCap = clean.charAt(0).toUpperCase() + clean.slice(1);

  return {
    id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    names: [nameCap, clean],
    name: nameCap,
    emoji,
    family,
    category: family,
    approved: isElectric,
    electric: isElectric,
    hybrid: isHybrid || isUltraProcessed,
    scientific_defaults: {
      pral,
      density,
      label: pral < 0 ? 'Alcalinisant' : 'Acidifiant',
      colorValue: pral < 0 ? '0xFF4ade80' : '0xFFfacc15'
    },
    vitality: {
      nova,
      freshness,
      label: nova === 1 ? 'Aliment Brut (Non transformé)' : nova === 2 ? 'Ingrédient culinaire' : nova === 3 ? 'Aliment transformé' : 'Produit Ultra-Transformé',
      colorValue: nova === 1 ? '0xFF4ade80' : (nova <= 2 ? '0xFFfacc15' : '0xFFef4444')
    },
    specific: {
      mucus,
      hybrid: isHybrid || isUltraProcessed,
      electric: isElectric,
      label
    },
    tags: [isElectric ? 'Dr. Sebi Approved' : isUltraProcessed ? 'Ultra-Transformé (NOVA 4)' : 'VitalTrack Analyzed'],
    note
  };
}

window.analyzeDishWithAI = async function() {
  const input = document.getElementById('aiDishInput');
  const btn = document.getElementById('btnAnalyzeDish');
  const q = (input?.value || '').trim();
  if (!q) {
    showToast('Veuillez entrer une description de plat.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Analyse...';
  }

  try {
    let items = [];
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const data = await res.json();
        items = data.data?.foods || data.data?.items || [];
      }
    } catch (err) {
      console.warn('[AI Dish Analysis] API fetch failed, using local extraction fallback:', err);
    }

    if (!items || items.length === 0) {
      const parts = q.split(/[,+&/]|\bet\b|\bavec\b|\baux\b|\bau\b|\bde\b|\bd['’]/i).map(p => p.trim()).filter(p => p.length >= 2);
      const tokens = parts.length > 0 ? parts : [q];
      items = tokens.map(token => classifyFoodLocally(token));
    }

    const processedItems = [];
    let addedCount = 0;
    items.forEach(item => {
      const name = (item.name || item.names?.[0] || 'Aliment').replace(/^./, c => c.toUpperCase());
      const id = item.id || `dish_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const existing = selectedMealFoods.find(f => f.name.toLowerCase() === name.toLowerCase());
      
      const sc = item.scientific_defaults || item.scientific || {
        pral: item.pral ?? 0,
        density: item.density ?? ((item.pral ?? 0) < 0 ? 80 : 35),
        label: (item.pral ?? 0) < 0 ? 'Alcalinisant' : 'Acidifiant'
      };

      const vt = item.vitality || {
        nova: item.nova ?? (item.electric ? 1 : 2),
        freshness: item.freshness ?? ((item.nova === 1 || item.electric) ? 95 : item.nova === 4 ? 15 : 60),
        label: item.vitalityLabel || (item.nova === 1 ? 'Aliment Brut (Non transformé)' : item.nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment transformé')
      };

      const sp = item.specific || {
        electric: item.electric === true || item.approved === true,
        hybrid: item.hybrid === true,
        mucus: item.mucus || (item.electric ? 'Dissolvant' : item.hybrid ? 'Faiblement Mucogène' : 'Mucogène'),
        label: item.electric ? 'Électrique (Dr. Sebi)' : item.hybrid ? 'Hybride' : 'Standard / Mucogène'
      };

      const foodObj = {
        id: existing ? existing.id : id,
        name,
        names: item.names || [name],
        emoji: item.emoji || '🍽️',
        family: item.family || 'Alimentation',
        approved: sp.electric === true,
        electric: sp.electric === true,
        hybrid: sp.hybrid === true,
        pral: sc.pral ?? 0,
        scientific_defaults: sc,
        nova: vt.nova ?? 1,
        vitality: vt,
        freshness: vt.freshness ?? 80,
        mucus: sp.mucus,
        specific: sp,
        note: item.note
      };

      if (!existing) {
        selectedMealFoods.push(foodObj);
        addedCount++;
      }
      processedItems.push(foodObj);
    });

    renderSelectedMealFoods();
    if (input) input.value = '';

    if (processedItems.length > 0) {
      openFoodModal({
        ...processedItems[0],
        isMealSelection: true,
        allAnalyzedItems: processedItems
      });
      showToast(`✨ ${processedItems.length} aliment(s) identifié(s) ! Profil affiché ci-dessous.`, 'success');
    }
  } catch (e) {
    console.error('Erreur analyse plat:', e);
    showToast("Erreur lors de l'analyse du plat.", 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ri-sparkling-fill"></i> Analyser';
    }
  }
};

window.searchMealFoods = function(query) {
  const q = (query || '').toLowerCase().trim();
  const results = document.getElementById('mealSearchResults');
  if (!q) { results.innerHTML = ''; return; }
  const matches = vitalDb.filter(item => (item.names || []).some(n => n.toLowerCase().includes(q))).slice(0, 10);
  
  if (matches.length === 0) {
    results.innerHTML = `
      <div style="padding: 12px 0; text-align: center;">
        <p class="empty-state-sm" style="margin-bottom: 10px; color: var(--text-dim);">Aucun aliment direct dans la base locale.</p>
        <button type="button" class="btn-primary" style="margin: 0 auto; display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; font-size: 0.9rem;" onclick="askAIToAddMealFood('${esc(q)}')">
          <i class="ri-sparkling-fill"></i> Demander à l'IA d'analyser "${esc(q)}"
        </button>
      </div>
    `;
    return;
  }
  
  results.innerHTML = matches.map(item => {
    const name = (item.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
    return `<div class="food-card" onclick="selectMealFood(${vitalDb.indexOf(item)})"><div class="food-emoji">${item.emoji || '🍽️'}</div><div class="food-info"><div class="food-name">${esc(name)}</div></div></div>`;
  }).join('');
};

window.askAIToAddMealFood = async function(query) {
  const q = (query || '').trim();
  if (!q) return;

  const results = document.getElementById('mealSearchResults');
  const searchInput = document.getElementById('mealSearchInput');
  if (results) {
    results.innerHTML = `<p class="empty-state" style="padding: 14px; text-align: center;"><i class="ri-loader-4-line ri-spin" style="font-size: 1.3rem; vertical-align: middle; margin-right: 8px; color: var(--accent);"></i> Analyse IA de "${esc(q)}" en cours...</p>`;
  }

  try {
    let items = [];
    try {
      const res = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const data = await res.json();
        items = data.data?.foods || data.data?.items || [];
      }
    } catch (err) {
      console.warn('[AI Meal Search] API fetch failed, using local extraction fallback:', err);
    }

    if (!items || items.length === 0) {
      const parts = q.split(/[,+&/]|\bet\b|\bavec\b|\baux\b|\bau\b|\bde\b|\bd['’]/i).map(p => p.trim()).filter(p => p.length >= 2);
      const tokens = parts.length > 0 ? parts : [q];
      items = tokens.map(token => classifyFoodLocally(token));
    }

    const processedItems = [];
    let addedCount = 0;
    items.forEach(item => {
      const name = (item.name || item.names?.[0] || 'Aliment').replace(/^./, c => c.toUpperCase());
      const id = item.id || `dish_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const existing = selectedMealFoods.find(f => f.name.toLowerCase() === name.toLowerCase());

      const sc = item.scientific_defaults || item.scientific || {
        pral: item.pral ?? 0,
        density: item.density ?? ((item.pral ?? 0) < 0 ? 80 : 35),
        label: (item.pral ?? 0) < 0 ? 'Alcalinisant' : 'Acidifiant'
      };

      const vt = item.vitality || {
        nova: item.nova ?? (item.electric ? 1 : 2),
        freshness: item.freshness ?? ((item.nova === 1 || item.electric) ? 95 : item.nova === 4 ? 15 : 60),
        label: item.vitalityLabel || (item.nova === 1 ? 'Aliment Brut (Non transformé)' : item.nova === 4 ? 'Produit Ultra-Transformé' : 'Aliment transformé')
      };

      const sp = item.specific || {
        electric: item.electric === true || item.approved === true,
        hybrid: item.hybrid === true,
        mucus: item.mucus || (item.electric ? 'Dissolvant' : item.hybrid ? 'Faiblement Mucogène' : 'Mucogène'),
        label: item.electric ? 'Électrique (Dr. Sebi)' : item.hybrid ? 'Hybride' : 'Standard / Mucogène'
      };

      const foodObj = {
        id: existing ? existing.id : id,
        name,
        names: item.names || [name],
        emoji: item.emoji || '🍽️',
        family: item.family || 'Alimentation',
        approved: sp.electric === true,
        electric: sp.electric === true,
        hybrid: sp.hybrid === true,
        pral: sc.pral ?? 0,
        scientific_defaults: sc,
        nova: vt.nova ?? 1,
        vitality: vt,
        freshness: vt.freshness ?? 80,
        mucus: sp.mucus,
        specific: sp,
        note: item.note
      };

      if (!existing) {
        selectedMealFoods.push(foodObj);
        addedCount++;
      }
      processedItems.push(foodObj);
    });

    renderSelectedMealFoods();
    if (results) results.innerHTML = '';
    if (searchInput) searchInput.value = '';
    
    if (processedItems.length > 0) {
      openFoodModal({
        ...processedItems[0],
        isMealSelection: true,
        allAnalyzedItems: processedItems
      });
      showToast(`✨ Aliment "${processedItems[0].name}" analysé ! Profil affiché ci-dessous.`, 'success');
    }
  } catch (err) {
    if (results) results.innerHTML = `<p class="empty-state text-danger">${esc(err.message)}</p>`;
    showToast("Erreur lors de l'analyse IA.", 'error');
  }
};



window.searchEditMealFoods = function(query) {
  const q = (query || '').toLowerCase().trim();
  const results = document.getElementById('editMealSearchResults');
  if (!results) return;
  if (!q) { results.innerHTML = ''; return; }
  const matches = vitalDb.filter(item => (item.names || []).some(n => n.toLowerCase().includes(q))).slice(0, 5);
  if (matches.length === 0) {
    results.innerHTML = `<p class="empty-state-sm" style="padding: 6px;">Aucun aliment trouvé dans la base locale.</p>`;
    return;
  }
  results.innerHTML = matches.map(item => {
    const name = (item.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
    return `<div class="food-card" style="padding: 8px; margin-bottom: 4px;" onclick="addEditMealItem('${esc(name)}', '${item.emoji || '🍽️'}')"><div class="food-emoji" style="font-size: 1.2rem;">${item.emoji || '🍽️'}</div><div class="food-info"><div class="food-name" style="font-size: 0.9rem;">${esc(name)}</div></div></div>`;
  }).join('');
};

window.selectMealFood = function(idx) {
  const item = vitalDb[idx]; if (!item) return;
  const name = (item.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
  let target = selectedMealFoods.find(f => f.id === item.id || f.name.toLowerCase() === name.toLowerCase());
  if (!target) {
    const sc = item.scientific_defaults || item.scientific || { pral: item.pral ?? 0 };
    const vt = item.vitality || { nova: item.nova ?? 1, freshness: item.freshness ?? 85 };
    const sp = item.specific || { electric: item.electric === true, hybrid: item.hybrid === true, mucus: item.mucus };
    target = {
      id: item.id,
      name,
      names: item.names || [name],
      emoji: item.emoji || '🍽️',
      family: item.family || 'Alimentation',
      approved: sp.electric === true || item.approved === true,
      electric: sp.electric === true || item.approved === true,
      hybrid: sp.hybrid === true,
      pral: sc.pral ?? 0,
      scientific_defaults: sc,
      nova: vt.nova ?? 1,
      vitality: vt,
      freshness: vt.freshness ?? 85,
      mucus: sp.mucus,
      specific: sp,
      note: item.note
    };
    selectedMealFoods.push(target);
  }
  renderSelectedMealFoods();
  openFoodModal({
    ...item,
    ...target,
    isMealSelection: true,
    allAnalyzedItems: selectedMealFoods
  });
};

window.removeSelectedFood = function(id) {
  selectedMealFoods = selectedMealFoods.filter(f => f.id !== id);
  renderSelectedMealFoods();
};

function renderSelectedMealFoods() {
  const container = document.getElementById('mealSelectedItems');
  if (!container) return;
  container.innerHTML = selectedMealFoods.map(f => `
    <span class="selected-chip clickable" onclick="openFoodModalFromSelection('${f.id}')" title="Cliquer pour voir la carte d'identité 3 onglets">
      ${f.emoji || '🍽️'} ${esc(f.name)}
      <button type="button" onclick="event.stopPropagation(); removeSelectedFood('${f.id}')" title="Retirer">×</button>
    </span>
  `).join('');
}

window.confirmAddMeal = function() {
  if (selectedMealFoods.length === 0) return;
  const meals = store.get('meals', []);
  selectedMealFoods.forEach(f => meals.push({ ...f, timestamp: Date.now() }));
  store.set('meals', meals);
  closeAddMealModal();
  renderMeals();
  renderDashboard();
};

window.addFoodToMeal = function() {
  if (!currentModalFood) return;
  const name = (currentModalFood.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
  const meals = store.get('meals', []);
  meals.push({ id: currentModalFood.id, name, emoji: currentModalFood.emoji || '🍽️', approved: currentModalFood.specific?.electric === true, electric: currentModalFood.specific?.electric === true, hybrid: currentModalFood.specific?.hybrid === true, pral: currentModalFood.scientific_defaults?.pral ?? 0, nova: currentModalFood.vitality?.nova ?? 4, timestamp: Date.now() });
  store.set('meals', meals);
  closeFoodModal();
  renderMeals();
  renderDashboard();
};

function renderMeals() {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  const list = document.getElementById('mealsList');
  if (!list) return;

  if (todayMeals.length === 0) { 
    list.innerHTML = '<p class="empty-state">Aucun repas enregistré. Ajoutez votre premier repas !</p>'; 
    document.getElementById('mealAxisRow').style.display = 'none'; 
    return; 
  }

  document.getElementById('mealAxisRow').style.display = 'grid';
  const avgPral = todayMeals.reduce((s, m) => s + (m.pral ?? (m.scientific?.pral ?? (m.scientific_defaults?.pral ?? 0))), 0) / todayMeals.length;
  const avgNova = todayMeals.reduce((s, m) => s + (m.nova ?? (m.vitality?.nova ?? 4)), 0) / todayMeals.length;
  const vitBreakdown = calculateVitalityBreakdown(todayMeals);
  document.getElementById('mealPral').textContent = (avgPral > 0 ? '+' : '') + avgPral.toFixed(1);
  document.getElementById('mealNova').textContent = avgNova.toFixed(1);
  document.getElementById('mealVitality').textContent = `${vitBreakdown.nutritionScore}%`;

  list.innerHTML = todayMeals.map((m, i) => {
    const isElec = m.electric === true || m.approved === true;
    const pral = m.pral ?? (m.scientific?.pral ?? (m.scientific_defaults?.pral ?? 0));
    return `<div class="meal-item clickable" onclick="openFoodModalFromMeal(${i})" style="cursor:pointer;" title="Cliquer pour ouvrir la carte d'identité 3 onglets">
      <span class="food-emoji">${m.emoji || '🍽️'}</span>
      <div class="meal-item-info">
        <div class="meal-item-name">${esc(m.name)}</div>
        <div class="meal-item-meta">${isElec ? '⚡ Électrique' : (m.hybrid ? '🔀 Hybride' : '⛔ Mucogène')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)} · NOVA ${m.nova ?? 1}</div>
      </div>
      <button class="meal-item-remove" onclick="event.stopPropagation(); removeMeal(${i})" title="Supprimer ce repas"><i class="ri-delete-bin-line"></i></button>
    </div>`;
  }).join('');
}

window.removeMeal = function(idx) {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  if (idx < todayMeals.length) {
    const target = todayMeals[idx];
    const globalIdx = meals.indexOf(target);
    if (globalIdx >= 0) meals.splice(globalIdx, 1);
    store.set('meals', meals);
    renderMeals();
    renderDashboard();
  }
};

// ═══════ FASTING PROGRAMS ═══════
const FASTING_PROGRAMS = [
  { id: 'intermittent', icon: '⏰', name: 'Intermittent', desc: '16h jeûne / 8h repas', hours: 16 },
  { id: 'warrior', icon: '⚔️', name: 'Warrior', desc: '20h jeûne / 4h repas', hours: 20 },
  { id: 'waterFast24', icon: '💧', name: 'Hydrique 24h', desc: 'Eau pure pendant 24h', hours: 24 },
  { id: 'juiceFast', icon: '🧃', name: 'Jus 3 jours', desc: 'Jus frais uniquement', hours: 72 },
  { id: 'fruitFast', icon: '🍎', name: 'Fruits 48h', desc: 'Mono-fruit ou fruits variés', hours: 48 },
  { id: 'grapeCure', icon: '🍇', name: 'Cure de raisins', desc: '3 jours de raisins (Dr. Morse)', hours: 72 },
  { id: 'drySunFast', icon: '☀️', name: 'Sec 16h', desc: 'Ni eau ni nourriture', hours: 16 },
  { id: 'ramadan', icon: '🌙', name: 'Ramadan', desc: 'Jeûne de l\'aube au coucher', hours: 14 },
];

function initFastingPrograms() {
  const grid = document.getElementById('programGrid');
  if (!grid) return;
  grid.innerHTML = FASTING_PROGRAMS.map((p, i) =>
    `<div class="jn-program-tile${i === 0 ? ' selected' : ''}" data-id="${p.id}" onclick="selectProgram('${p.id}')">
      <span class="jn-p-icon">${p.icon}</span>
      <span class="jn-p-title">${esc(p.name)}</span>
      <span class="jn-p-desc">${esc(p.desc)}</span>
    </div>`
  ).join('');
}

window.selectProgram = function(id) {
  const p = FASTING_PROGRAMS.find(x => x.id === id);
  if (!p) return;
  document.getElementById('fastingDuration').value = p.hours;
  const goalEl = document.getElementById('fastGoal');
  if (goalEl) goalEl.textContent = 'Objectif : ' + p.hours + 'h';
  document.getElementById('fastingSafetyWarning').style.display = p.hours > 24 ? 'block' : 'none';
  document.querySelectorAll('.jn-program-tile').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  // Sync select dropdown
  const typeMap = { intermittent:'intermittent', warrior:'warrior', waterFast24:'waterFast', juiceFast:'juiceFast', fruitFast:'fruitFast', grapeCure:'grapeCure', drySunFast:'drySunFast', ramadan:'ramadan' };
  const sel = document.getElementById('fastingType');
  sel.value = typeMap[id] || 'intermittent';
};

// ═══════ MASTERCLASS ARNOLD EHRET ═══════
const ehretMasterclassData = [
  {
    icon: 'ri-drop-line', color: 'rgba(239,68,68,1)', bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))',
    title: 'La Théorie du Mucus',
    shortDesc: 'La pathogenèse et l\'auto-élimination',
    pill: 'Physiologie',
    content: [
      '<p>Selon la théorie du mucus développée par Ehret, la consommation d\'aliments biologiquement inadaptés à l\'espèce humaine (viandes, produits laitiers, œufs, graisses animales et féculents raffinés comme la farine blanche) produit lors de la digestion une substance gluante et adhésive.</p>',
      '<p>Cette matière, assimilable à de la colle, tapisse progressivement l\'estomac et les 10 mètres du canal intestinal, s\'infiltre dans les vaisseaux et engorge le système lymphatique.</p>',
      '<div class="info-box" style="margin: 16px 0;"><strong>V = P - O</strong><br>La Vitalité (V) est égale à la Puissance motrice naturelle (P) diminuée de l\'Obstruction interne (O) générée par le mucus et les toxines.</div>',
      '<p>L\'abondance de globules blancs ne constitue pas une réponse immunitaire optimale, mais représente la manifestation directe du mucus mort et décomposé présent dans la circulation.</p>'
    ]
  },
  {
    icon: 'ri-leaf-line', color: 'rgba(52,211,153,1)', bg: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.2))',
    title: 'Le Régime de Transition',
    shortDesc: 'La préparation méthodique',
    pill: 'Préparation',
    content: [
      '<p>L\'une des mises en garde les plus sévères d\'Ehret concerne l\'imprudence d\'entreprendre un jeûne prolongé à l\'eau sans préparation. La dissolution trop rapide des toxines peut engorger les canaux d\'élimination et provoquer une auto-intoxication grave.</p>',
      '<ul><li><strong>Aliments pauvres en mucus :</strong> légumes cuits non féculents, pommes de terre au four (avec peau), pain complet fortement toasté ou grillé (pour détruire le pouvoir collant de l\'amidon).</li><li><strong>Aliments exempts de mucus :</strong> fruits frais de saison, légumes à feuilles vertes, salades crues.</li></ul>',
      '<p>Avant un jeûne, le canal digestif doit subir un nettoyage mécanique : purge végétale douce la veille, combinée à l\'usage de lavements intestinaux à l\'eau tiède.</p>'
    ]
  },
  {
    icon: 'ri-timer-line', color: 'rgba(96,165,250,1)', bg: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(96,165,250,0.2))',
    title: 'Protocoles de Jeûne',
    shortDesc: 'Classification des modalités',
    pill: 'Exécution',
    content: [
      '<p>Ehret rejette les jeûnes uniformes de très longue durée, leur préférant une approche séquentielle et individualisée :</p>',
      '<ul><li><strong>Non-Breakfast Plan (Quotidien) :</strong> Abstention de nourriture solide le matin. Prolonge l\'élimination nocturne. La sensation de malaise au réveil est le travail d\'élimination ; manger l\'interrompt.</li><li><strong>24 Heures (1-2 fois/semaine) :</strong> Repas unique vers 15h (fruits, puis légumes).</li><li><strong>36 Heures :</strong> Sauter le souper, jeûner le lendemain, rompre le surlendemain matin. Dissout le mucus incrusté.</li><li><strong>Jeûnes Courts Intermittents (2-5 jours) :</strong> Prise de limonade légère. Régénère le sang sans auto-intoxication.</li></ul>'
    ]
  },
  {
    icon: 'ri-windy-line', color: 'rgba(167,139,250,1)', bg: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(167,139,250,0.2))',
    title: 'L\'Hygiène du Jeûneur',
    shortDesc: 'Boissons et activité',
    pill: 'Pendant',
    content: [
      '<p><strong>Boissons :</strong> Ehret met en garde contre l\'eau pure chez les individus très encombrés. La boisson idéale est une limonade très légère (eau + jus de citron frais + minime quantité de miel). L\'acide citrique neutralise la viscosité du mucus. Les jus d\'orange exclusifs sont déconseillés car ils détachent les toxines trop rapidement.</p>',
      '<p><strong>Air Frais :</strong> L\'air pur constitue le carburant fondamental du moteur humain. Gardez les fenêtres ouvertes la nuit.</p>',
      '<p><strong>Crises :</strong> En cas de vertiges (levées brutales) ou palpitations, administrer immédiatement un lavement tiède, s\'allonger, ou si persistant, rompre le jeûne avec des légumes cuits.</p>'
    ]
  },
  {
    icon: 'ri-restaurant-line', color: 'rgba(250,204,21,1)', bg: 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(250,204,21,0.2))',
    title: 'Rompre le Jeûne',
    shortDesc: 'La phase la plus dangereuse',
    pill: 'Critique',
    content: [
      '<p>La rupture du jeûne est la phase la plus délicate. Le premier repas ne doit jamais nourrir, mais agir mécaniquement comme un balai (laxatif).</p>',
      '<div class="info-box" style="margin: 16px 0; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #fca5a5;"><strong>La Règle Absolue :</strong> Le premier repas doit provoquer une selle abondante sous 1 à 3 heures. Sinon, utilisez un lavement immédiatement.</div>',
      '<ul><li><strong>Pour les corps préparés :</strong> Fruits frais sucrés (cerises, raisins). Les acides se mélangent au mucus pour libérer l\'intestin.</li><li><strong>Pour les mangeurs de viande / non-préparés :</strong> Les fruits doux sont interdits (fermentation violente). Rompez avec des légumes non féculents crus et cuits (choucroute, épinards étuvés) et du pain de son grillé.</li></ul>'
    ]
  },
  {
    icon: 'ri-spy-line', color: 'rgba(236,72,153,1)', bg: 'linear-gradient(135deg, rgba(219,39,119,0.2), rgba(236,72,153,0.2))',
    title: 'Le Miroir Magique',
    shortDesc: 'Test de diagnostic interne',
    pill: 'Diagnostic',
    content: [
      '<p>Pour évaluer son degré d\'encrassement interne, Ehret propose le test du "Miroir Magique" :</p>',
      '<p>Jeûnez pendant 1 à 2 jours. L\'épaisse couche de mucus qui recouvre alors votre langue reflète l\'état réel de l\'ensemble de vos muqueuses internes et de votre canal digestif.</p>',
      '<p>Réfutation du mythe de la langue propre : Chez un individu très encombré, poursuivre le jeûne jusqu\'à ce que la langue soit rose est dangereux. Le jeûne doit être interrompu dès que la charge toxique en circulation est trop lourde, puis repris après reconstruction.</p>'
    ]
  }
];

function initMasterclass() {
  const container = document.getElementById('masterclassContainer');
  if (!container) return;

  const tagColors = [
    { bg:'rgba(240,112,156,.14)', color:'#f0709c' },
    { bg:'rgba(55,211,153,.14)', color:'var(--accent)' },
    { bg:'rgba(76,195,240,.14)', color:'#4cc3f0' },
    { bg:'rgba(167,139,250,.14)', color:'#a78bfa' },
    { bg:'rgba(250,204,21,.14)', color:'#facc15' },
    { bg:'rgba(236,72,153,.14)', color:'#ec4899' },
  ];

  container.innerHTML = ehretMasterclassData.map((mc, i) => {
    const tc = tagColors[i % tagColors.length];
    return `
    <div class="jn-lesson-tile" onclick="openMasterclass(${i})">
      <div class="jn-lesson-head">
        <div class="jn-lesson-icon" style="background:${tc.bg}; color:${tc.color};">
          <i class="${mc.icon}"></i>
        </div>
        <span class="jn-lesson-tag" style="background:${tc.bg}; color:${tc.color};">${mc.pill}</span>
      </div>
      <div>
        <div class="jn-lesson-title">${mc.title}</div>
        <div class="jn-lesson-desc">${mc.shortDesc}</div>
      </div>
    </div>
  `;
  }).join('');
}

window.openMasterclass = function(index) {
  const mc = ehretMasterclassData[index];
  document.getElementById('mcHeader').innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
      <div style="width:56px; height:56px; border-radius:16px; background:${mc.bg}; color:${mc.color}; display:flex; align-items:center; justify-content:center; font-size:2rem; box-shadow:0 8px 16px rgba(0,0,0,0.15);">
        <i class="${mc.icon}"></i>
      </div>
      <div>
        <div style="font-size:0.8rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:${mc.color}; margin-bottom:4px;">${mc.pill}</div>
        <h2 style="margin:0; font-size:1.6rem; color:#fff; line-height:1.2;">${mc.title}</h2>
      </div>
    </div>
    <p style="margin:0; color:var(--text-dim); font-size:1rem;">${mc.shortDesc}</p>
  `;
  document.getElementById('mcBody').innerHTML = mc.content.join('');
  document.getElementById('masterclassModal').classList.add('open');
};

window.closeMasterclass = function(e) {
  if (e && e.target !== document.getElementById('masterclassModal')) return;
  document.getElementById('masterclassModal').classList.remove('open');
};

// ═══════ EXPERT ADVICE ═══════
function initExpertAccordion() {
  const expertColors = [
    { bg:'rgba(246,185,59,.14)', color:'#f6b93b' },
    { bg:'rgba(55,211,153,.14)', color:'var(--accent)' },
    { bg:'rgba(246,185,59,.14)', color:'#f6b93b' },
    { bg:'rgba(76,195,240,.14)', color:'#4cc3f0' },
    { bg:'rgba(255,255,255,.06)', color:'var(--text-dim)' },
  ];
  const experts = [
    {
      id: 'ehret',
      name: 'Arnold Ehret',
      title: 'Rational Fasting',
      icon: 'ri-leaf-line',
      color: '#facc15',
      tips: [
        '<strong>Régime de Transition :</strong> Ne commencez jamais un jeûne strict sans transition. Les aliments non-muqueux (fruits, légumes non féculents) sont obligatoires pour éviter un empoisonnement du sang par les toxines.',
        '<strong>Jeûnes Courts :</strong> Privilégiez une série de jeûnes courts (1 à 3 jours) avec une alimentation stricte sans mucus entre-temps, plutôt qu\'un long jeûne dangereux pour un organisme très encrassé.',
        '<strong>Élimination :</strong> Utilisez des lavements doux ou laxatifs naturels. Pendant le jeûne, le corps rejette les déchets dans le côlon. S\'ils stagnent, ils sont réabsorbés (auto-intoxication).',
        '<strong>Rompre le jeûne :</strong> Rompez avec un repas "laxatif" (cerises, pommes ou salade carottes/chou cru) agissant comme un balai intestinal. Ne jamais utiliser d\'aliments lourds.'
      ]
    },
    {
      id: 'morse',
      name: 'Dr. Robert Morse',
      title: 'Détoxification Cellulaire',
      icon: 'ri-drop-line',
      color: '#34d399',
      tips: [
        '<strong>Cure de Raisins :</strong> Excellent pour filtrer et nettoyer le système lymphatique, la "station d\'épuration" de votre corps.',
        '<strong>Les Reins :</strong> Le but du jeûne et des fruits est de relancer la filtration rénale pour évacuer les acides.',
        '<strong>Fruits astringents :</strong> Les agrumes, melons et baies sont les meilleurs extracteurs de mucus et de toxines.'
      ]
    },
    {
      id: 'sebi',
      name: 'Dr. Sebi',
      title: 'Régime Alcalin (Mucusless)',
      icon: 'ri-plant-line',
      color: '#fbbf24',
      tips: [
        '<strong>Alcalinité :</strong> La maladie ne peut exister que dans un environnement acide. Le jeûne et l\'alimentation électrique restaurent le pH du corps.',
        '<strong>Hydratation :</strong> Buvez énormément d\'eau de source naturelle pour accompagner le nettoyage cellulaire.',
        '<strong>Herbes médicinales :</strong> Soutenez vos organes d\'élimination avec des thés de plantes (Bardane, Pissenlit, Salsepareille) recommandées dans la liste.'
      ]
    },
    {
      id: 'wimhof',
      name: 'Wim Hof',
      title: 'Méthode d\'Oxygénation',
      icon: 'ri-windy-line',
      color: '#60a5fa',
      tips: [
        '<strong>Synergie avec le jeûne :</strong> La respiration profonde amplifie les effets du jeûne en alcalinisant le sang (vasoconstriction + oxygénation).',
        '<strong>L\'exposition au froid :</strong> Prendre une douche froide à la fin du jeûne stimule puissamment le système immunitaire et la circulation sanguine.'
      ]
    },
    {
      id: 'general',
      name: 'Conseils Généraux',
      title: 'Pratiques de Base',
      icon: 'ri-information-line',
      color: '#a78bfa',
      tips: [
        'Pendant un jeûne hydrique, buvez 2 à 3L d\'eau, l\'eau citronnée est idéale.',
        'Arrêtez tout jeûne si vous ressentez des vertiges prolongés ou une faiblesse extrême (qui n\'est pas qu\'une simple crise de détox).',
        'Le jeûne de Ramadan ou sec (sans eau) demande un repos accru et une hydratation massive au moment de rompre.'
      ]
    }
  ];

  const container = document.getElementById('expertAccordion');
  if (!container) return;

  const expertIcons = ['🌱', '💧', '🌿', '🌬️', 'ℹ️'];

  container.innerHTML = experts.map((exp, i) => {
    const ec = expertColors[i % expertColors.length];
    return `
    <div class="jn-expert-row${i === 0 ? ' open' : ''}">
      <div class="jn-expert-head" onclick="toggleExpertAccordion(this)">
        <div class="jn-expert-icon" style="background:${ec.bg}; color:${ec.color};">${expertIcons[i] || '📖'}</div>
        <div><div class="jn-expert-name">${exp.name}</div><div class="jn-expert-sub">${exp.title}</div></div>
        <svg class="jn-icon jn-expert-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l5 5 5-5"/></svg>
      </div>
      <div class="jn-expert-body"><div class="jn-expert-body-inner">
        ${exp.tips.map(t => `<div style="margin-bottom:8px;">${t}</div>`).join('')}
      </div></div>
    </div>
  `;
  }).join('');
}

window.toggleExpertAccordion = function(headEl) {
  const row = headEl.closest('.jn-expert-row');
  const wasOpen = row.classList.contains('open');
  // Close all
  document.querySelectorAll('.jn-expert-row').forEach(r => r.classList.remove('open'));
  // Open clicked if it was closed
  if (!wasOpen) row.classList.add('open');
};

// ═══════ FASTING TIMER ═══════
window.toggleFasting = function() { fastingState.active ? stopFasting() : startFasting(); };
function startFasting() {
  const type = document.getElementById('fastingType').value;
  const hours = parseInt(document.getElementById('fastingDuration').value) || 16;
  fastingState = { active: true, startTime: Date.now(), durationMs: hours * 3600000, type, interval: null };
  store.set('fasting-active', { startTime: fastingState.startTime, durationMs: fastingState.durationMs, type });
  fastingState.interval = setInterval(updateFastingUI, 1000);
  updateFastingUI();
  const btn = document.getElementById('fastStartBtn');
  document.getElementById('fastBtnIcon').innerHTML = '<rect x="5" y="5" width="10" height="10" rx="1.5"/>';
  document.getElementById('fastBtnLabel').textContent = 'Arrêter';
  btn.classList.add('stop');
  const statusEl = document.getElementById('timerLabel');
  statusEl.textContent = 'EN COURS';
  statusEl.classList.add('active');
  renderDashboard();
}
function stopFasting() {
  const elapsed = Date.now() - fastingState.startTime;
  const history = store.get('fasting-history', []);
  history.unshift({ type: fastingState.type, startTime: fastingState.startTime, elapsed, targetMs: fastingState.durationMs, completed: elapsed >= fastingState.durationMs });
  store.set('fasting-history', history.slice(0, 50));
  clearInterval(fastingState.interval);
  fastingState = { active: false, startTime: null, durationMs: 0, type: '', interval: null };
  store.del('fasting-active');
  const btn = document.getElementById('fastStartBtn');
  document.getElementById('fastBtnIcon').innerHTML = '<path d="M6 4l10 6-10 6V4z"/>';
  document.getElementById('fastBtnLabel').textContent = 'Démarrer';
  btn.classList.remove('stop');
  document.getElementById('timerDigits').textContent = '00:00:00';
  const statusEl = document.getElementById('timerLabel');
  statusEl.textContent = 'PRÊT';
  statusEl.classList.remove('active');
  document.getElementById('timerProgress').style.strokeDashoffset = '637.6';
  renderFastingHistory(); renderFastingAnalytics(); renderDashboard();
}
function updateFastingUI() {
  if (!fastingState.active) return;
  const elapsed = Date.now() - fastingState.startTime;
  const remaining = Math.max(0, fastingState.durationMs - elapsed);
  const progress = Math.min(1, elapsed / fastingState.durationMs);
  const ts = Math.floor(elapsed / 1000);
  document.getElementById('timerDigits').textContent = `${String(Math.floor(ts/3600)).padStart(2,'0')}:${String(Math.floor((ts%3600)/60)).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}`;
  document.getElementById('timerProgress').style.strokeDashoffset = 637.6 * (1 - progress);
  const statusEl = document.getElementById('timerLabel');
  if (remaining <= 0) { statusEl.textContent = '🎉 OBJECTIF ATTEINT !'; statusEl.classList.add('active'); }
  else { statusEl.textContent = `Reste ${Math.floor(remaining/3600000)}h ${Math.floor((remaining%3600000)/60000)}min`; }
  // Dashboard mirror
  const dt = document.getElementById('dashFastTimer'); if (dt) { dt.textContent = document.getElementById('timerDigits').textContent; }
  const df = document.getElementById('dashFastFill'); if (df) { df.style.width = `${progress * 100}%`; }
  const dft = document.getElementById('dashFastType'); if (dft) { const tl = { intermittent:'⏰ Intermittent', warrior:'⚔️ Warrior', waterFast:'💧 Hydrique', juiceFast:'🧃 Jus', fruitFast:'🍎 Fruits', grapeCure:'🍇 Raisin', drySunFast:'☀️ Sec', ramadan:'🌙 Ramadan' }; dft.textContent = tl[fastingState.type] || fastingState.type; }
}
function loadFastingState() {
  const saved = store.get('fasting-active', null);
  if (saved?.startTime) {
    fastingState = { ...saved, active: true, interval: null };
    fastingState.interval = setInterval(updateFastingUI, 1000);
    updateFastingUI();
    const btn = document.getElementById('fastStartBtn');
    document.getElementById('fastBtnIcon').innerHTML = '<rect x="5" y="5" width="10" height="10" rx="1.5"/>';
    document.getElementById('fastBtnLabel').textContent = 'Arrêter';
    btn.classList.add('stop');
    const statusEl = document.getElementById('timerLabel');
    statusEl.textContent = 'EN COURS'; statusEl.classList.add('active');
  }
}
function renderFastingHistory() {
  const list = document.getElementById('historyList'); if (!list) return;
  const history = store.get('fasting-history', []);
  if (history.length === 0) { list.innerHTML = '<p class="empty-state-sm">Aucune session enregistrée.</p>'; return; }
  const tl = { intermittent:'🍅', warrior:'⚔️', waterFast:'💧', juiceFast:'🧃', fruitFast:'🍎', grapeCure:'🍇', drySunFast:'☀️', ramadan:'🌙' };
  list.innerHTML = history.slice(0, 10).map(h => {
    const d = new Date(h.startTime).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
    return `
    <div class="jn-history-row">
      <div class="jn-history-icon">${tl[h.type]||'✨'}</div>
      <div class="jn-history-info">
        <div class="jn-history-title">${(h.elapsed/3600000).toFixed(1)}h</div>
        <div class="jn-history-sub">${h.completed ? '✅ Objectif atteint' : '⊙ Arrêté plus tôt'}</div>
      </div>
      <div class="jn-history-date">${d}</div>
    </div>`;
  }).join('');
}
function renderFastingAnalytics() {
  const history = store.get('fasting-history', []);
  document.getElementById('analyticTotal').textContent = history.length;
  const totalH = history.reduce((s, h) => s + h.elapsed, 0) / 3600000;
  document.getElementById('analyticHours').textContent = `${totalH.toFixed(0)}h`;
  const longest = history.length ? Math.max(...history.map(h => h.elapsed)) / 3600000 : 0;
  document.getElementById('analyticLongest').textContent = `${longest.toFixed(0)}h`;
  const completed = history.filter(h => h.completed).length;
  document.getElementById('analyticCompletion').textContent = history.length ? `${Math.round(completed / history.length * 100)}%` : '0%';
}

// ═══════ BREATHING ═══════
const breathModes = {
  wimhof: { name: 'Wim Hof', inhale: 2, exhale: 2, hold: 0, breaths: 30, retentionAfter: true },
  relax: { name: 'Relaxation (1:2)', inhale: 4, exhale: 8, hold: 0, breaths: 10, retentionAfter: false },
  box: { name: 'Box Breathing', inhale: 4, exhale: 4, hold: 4, breaths: 8, retentionAfter: false },
};
window.setBreathMode = function(mode) { 
  currentBreathMode = mode; 
  document.querySelectorAll('.breath-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode)); 
  document.getElementById('breathInfo').innerHTML = `<p>${breathModes[mode].name} — ${breathModes[mode].breaths} respirations/tour</p>`; 
};

window.setBreathRounds = function(n) {
  const val = Math.max(1, Math.min(10, parseInt(n) || 3));
  const input = document.getElementById('breathRounds');
  const display = document.getElementById('breathRoundsDisplay');
  if (input) input.value = val;
  if (display) {
    display.textContent = val;
    display.classList.add('pop');
    setTimeout(() => display.classList.remove('pop'), 180);
  }
  document.querySelectorAll('.rounds-presets .preset-pill').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.textContent) === val);
  });
};

window.adjustBreathRounds = function(delta) {
  const input = document.getElementById('breathRounds');
  const current = parseInt(input?.value || '3');
  window.setBreathRounds(current + delta);
};

window.startBreathing = async function() {
  if (breathingActive) { breathingActive = false; resetBreathUI(); return; }
  breathingActive = true;
  const btn = document.getElementById('breathStartBtn'); btn.innerHTML = '<i class="ri-stop-fill"></i> Arrêter'; btn.classList.add('danger');
  const mode = breathModes[currentBreathMode];
  const rounds = parseInt(document.getElementById('breathRounds').value) || 3;
  const circle = document.getElementById('breathCircle'), text = document.getElementById('breathText'), info = document.getElementById('breathInfo');
  const startTime = Date.now();
  try {
    for (let r = 1; r <= rounds && breathingActive; r++) {
      info.innerHTML = `<p>Tour ${r}/${rounds}</p>`;
      for (let b = 1; b <= mode.breaths && breathingActive; b++) {
        circle.className = 'breath-circle inhale'; text.textContent = `Inspirez (${b}/${mode.breaths})`; await sleep(mode.inhale * 1000); if (!breathingActive) break;
        if (mode.hold > 0) { circle.className = 'breath-circle hold'; text.textContent = 'Retenez'; await sleep(mode.hold * 1000); if (!breathingActive) break; }
        circle.className = 'breath-circle exhale'; text.textContent = 'Expirez'; await sleep(mode.exhale * 1000); if (!breathingActive) break;
        if (mode.hold > 0) { circle.className = 'breath-circle hold'; text.textContent = 'Retenez'; await sleep(mode.hold * 1000); }
      }
      if (mode.retentionAfter && breathingActive) {
        circle.className = 'breath-circle hold'; info.innerHTML = `<p>Tour ${r}/${rounds} — Rétention !</p>`;
        for (let s = 30; s > 0 && breathingActive; s--) { text.textContent = `RÉTENTION ${s}s`; await sleep(1000); }
        if (breathingActive) { circle.className = 'breath-circle inhale'; text.textContent = 'RÉCUPÉRATION'; await sleep(15000); }
      }
    }
  } catch {}
  // Save session
  const elapsed = Date.now() - startTime;
  const bh = store.get('breathing-history', []);
  bh.unshift({ mode: currentBreathMode, rounds, elapsed, timestamp: Date.now() });
  store.set('breathing-history', bh.slice(0, 30));
  resetBreathUI(); renderBreathingHistory(); renderDashboard();
};

function resetBreathUI() {
  breathingActive = false;
  document.getElementById('breathCircle').className = 'breath-circle';
  document.getElementById('breathText').textContent = 'Prêt';
  const btn = document.getElementById('breathStartBtn'); btn.innerHTML = '<i class="ri-play-fill"></i> Démarrer'; btn.classList.remove('danger');
  document.getElementById('breathInfo').innerHTML = '<p>Session terminée ✨</p>';
}

function renderBreathingHistory() {
  const el = document.getElementById('breathHistory'); if (!el) return;
  const bh = store.get('breathing-history', []);
  if (bh.length === 0) { el.innerHTML = '<p class="empty-state-sm">Aucune session enregistrée.</p>'; return; }
  el.innerHTML = bh.slice(0, 8).map(s => {
    const d = new Date(s.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const mn = { wimhof: '❄️ Wim Hof', relax: '🧘 Relaxation', box: '📦 Box' };
    const dur = Math.round(s.elapsed / 60000);
    return `<div class="history-item"><span>${mn[s.mode] || s.mode} · ${s.rounds} tours</span><span>${dur}min · ${d}</span></div>`;
  }).join('');
}

// ═══════ SMART INSIGHT ═══════
function initSmartInsight() {
  const insights = [
    '🌿 Les aliments électriques du Dr. Sebi sont naturellement alcalins et non hybridés — privilégiez-les !',
    '💧 Buvez de l\'eau de source au minimum 1L avant 10h du matin pour aider le drainage lymphatique.',
    '🍇 Le Dr. Morse recommande les mono-diètes de raisins pour les cures de detox lymphatique.',
    '❄️ 2 minutes de douche froide après vos respirations Wim Hof activent les graisses brunes.',
    '🌾 Arnold Ehret : la transition est la clé. Ne passez pas brutalement au cru, réduisez progressivement le mucus.',
    '🍋 Le citron, bien qu\'acide au goût, est l\'un des aliments les plus alcalinisants (PRAL très négatif).',
    '🧘 La respiration Box (4-4-4-4) est utilisée par les Navy SEALs pour gérer le stress.',
    '🌙 Le jeûne de Ramadan combine abstinence hydrique diurne et alimentation nocturne — hydratez-vous au ftour et au shour.',
    '👅 Ehret (Miroir Magique) : La couche de mucus sur votre langue après un jour de jeûne reflète l\'encrassement de vos organes internes.',
    '🌬️ Arnold Ehret : "L\'air pur constitue le carburant fondamental du moteur humain". Gardez vos fenêtres ouvertes !',
    '🩺 Ehret : Une abondance de globules blancs n\'est pas optimale, c\'est la manifestation directe de mucus mort dans la circulation.',
    '🩸 Ehret : La vitalité = puissance motrice - obstruction interne (mucus et toxines).'
  ];
  const smartInsightText = document.querySelector('#smartInsight span');
  if (smartInsightText) {
    smartInsightText.textContent = insights[Math.floor(Math.random() * insights.length)];
  } else {
    document.getElementById('smartInsight').textContent = insights[Math.floor(Math.random() * insights.length)];
  }
}

// ═══════ SCANNER ═══════
window.handleScanUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Url = e.target.result;
    
    // Show preview
    document.getElementById('scanPreviewContainer').style.display = 'block';
    document.getElementById('scanPreview').src = base64Url;
    document.getElementById('scanResult').style.display = 'none';
    document.getElementById('scanLoading').style.display = 'block';
    
    // Extract base64 without prefix
    const base64Data = base64Url.split(',')[1];
    
    try {
      const query = "Analyse cet aliment. De quoi s'agit-il ? Est-il électrique, hybride ou mucogène (selon le Dr. Sebi/Ehret) ? Quel est son PRAL approximatif ? Réponds de manière concise, structurée avec des emojis.";
      const profile = store.get('profile', { name: '', goal: 'detox', protocol: 'vitalist' });
      
      const resp = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(VT_APP_KEY ? { 'X-VT-API-Key': VT_APP_KEY } : {}) },
        body: JSON.stringify({ 
          query, 
          profile,
          history: [], 
          fileParts: [{
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'image/jpeg'
            }
          }] 
        }),
      });
      
      document.getElementById('scanLoading').style.display = 'none';
      
      if (!resp.ok) {
        throw new Error(`Erreur ${resp.status}`);
      }
      
      const data = await resp.json();
      const aiText = data.text || 'Aucune réponse.';
      
      document.getElementById('scanResult').style.display = 'block';
      document.getElementById('scanResult').innerHTML = `
        <h3 style="font-family:var(--font);margin-bottom:12px;color:var(--accent)"><i class="ri-sparkling-fill"></i> Résultat de l'analyse</h3>
        <div style="line-height:1.6;font-size:0.95rem">${renderMarkdown(aiText)}</div>
      `;
      
    } catch (err) {
      document.getElementById('scanLoading').style.display = 'none';
      document.getElementById('scanResult').style.display = 'block';
      document.getElementById('scanResult').innerHTML = `<p style="color:var(--danger)">❌ Erreur lors de l'analyse : ${err.message}</p>`;
    }
  };
  reader.readAsDataURL(file);
};

// ═══════ UTILS ═══════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function renderMarkdown(text) {
  // Extract and replace JSON blocks with interactive UI cards
  text = text.replace(/```json[\s\S]*?```/g, match => {
    try {
      const json = match.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      const obj = JSON.parse(json);
      let renderedCards = '';

      // 1. Action Meal Card (Direct meal logging from chat)
      if (obj.actionMeal) {
        const meal = obj.actionMeal;
        const encodedMeal = btoa(unescape(encodeURIComponent(JSON.stringify(meal))));
        const itemsText = Array.isArray(meal.items) ? meal.items.join(', ') : (meal.items || meal.name);
        const categoryLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' };
        const catLabel = categoryLabels[meal.category] || 'Repas Vitaliste';

        renderedCards += `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent);background:rgba(55,211,153,0.06)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-weight:700;font-size:1.05rem;color:var(--text)">${meal.emoji || '🍲'} ${esc(meal.name || 'Repas Proposé')}</span>
            <span class="food-badge badge-electric" style="font-size:0.75rem">${esc(catLabel)}</span>
          </div>
          <div style="font-size:0.88rem;color:var(--text);margin-bottom:6px">
            <strong>Ingrédients :</strong> ${esc(itemsText)}
          </div>
          ${meal.note ? `<div style="font-size:0.82rem;color:var(--text-dim);margin-bottom:12px;font-style:italic">🌿 ${esc(meal.note)}</div>` : ''}
          <button class="btn btn-primary" onclick="handleAddActionMeal('${encodedMeal}')" style="display:inline-flex;align-items:center;gap:6px">
            <i class="ri-restaurant-line"></i> Enregistrer ce repas aux logs du jour
          </button>
        </div>`;
      }

      // 2. Fasting program card
      if (obj.program) {
        const p = obj.program;
        const encodedProg = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
        const sessionsCount = p.configs?.length || 1;
        renderedCards += `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid #f59e0b;background:rgba(245,158,11,0.06)">
          <div style="font-weight:700;margin-bottom:6px;font-size:1.05rem;color:#f59e0b">🔥 ${esc(p.name || 'Programme de Jeûne')}</div>
          <div style="font-size:0.9rem;margin-bottom:4px;color:var(--text)"><strong>Objectif :</strong> ${esc(p.targetObjective || 'Détox & Vitalité')}</div>
          <div style="font-size:0.82rem;color:var(--text-dim);margin-bottom:12px">⏱️ ${sessionsCount} session(s) configurée(s)</div>
          <button class="btn btn-primary" onclick="handleApplyFastingProgram('${encodedProg}')" style="background:#f59e0b;color:#000;display:inline-flex;align-items:center;gap:6px;border:none">
            <i class="ri-fire-line"></i> Programmer ce jeûne
          </button>
        </div>`;
      }

      // 3. Deterministic Diet Plan Request Injection
      if (obj.dietPlanRequest) {
        const req = obj.dietPlanRequest;
        const encodedReq = btoa(unescape(encodeURIComponent(JSON.stringify(req))));
        const protocolLabels = { ehret: 'Transition Ehret', sebi: 'Guide Dr. Sebi', morse: 'Détox Dr. Morse', personalized: 'Programme Personnalisé' };
        const protoName = protocolLabels[req.protocol] || 'Vitaliste';
        const days = req.numDays || 7;
        const objText = req.objective ? ` · ${esc(req.objective)}` : '';
        const restrText = req.restrictions ? `<div style="font-size:0.8rem;color:#f2637a;margin-top:4px">⚠️ Restrictions : ${esc(req.restrictions)}</div>` : '';

        renderedCards += `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent);background:rgba(55,211,153,0.06)">
          <div style="font-weight:700;margin-bottom:8px;color:var(--text)">📅 Plan Alimentaire Proposé</div>
          <div style="font-size:0.9rem;color:var(--text);margin-bottom:4px">
            <strong>${protoName}</strong> (${days} jours)${objText}
          </div>
          ${restrText}
          <div style="font-size:0.8rem;color:var(--text-dim);margin-top:6px;margin-bottom:12px">
            ⚡ Plan déterministe basé sur notre base d'aliments approuvés.
          </div>
          <button class="btn btn-primary" onclick="handleApplyDietPlanRequest('${encodedReq}')">
            <i class="ri-calendar-check-line"></i> Appliquer au calendrier
          </button>
        </div>`;
      }

      // 4. Food suggestion chips
      if (obj.suggestFoods && Array.isArray(obj.suggestFoods)) {
        const chips = obj.suggestFoods.map(f => 
          `<button class="food-chip" onclick="addSuggestedFood(this, '${esc(f)}')" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;margin:4px;border-radius:20px;border:1px solid var(--accent);background:transparent;color:var(--text);cursor:pointer;font-size:0.85rem;transition:all 0.2s">
            <i class="ri-add-circle-line"></i> ${esc(f)}
          </button>`
        ).join('');
        renderedCards += `<div style="margin:12px 0">
          <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px">🥗 Ajouter à ta liste du jour :</div>
          <div style="display:flex;flex-wrap:wrap">${chips}</div>
        </div>`;
      }

      if (renderedCards) return renderedCards;
      return `<pre><code>${esc(JSON.stringify(obj, null, 2))}</code></pre>`;
    } catch { return match; }
  });
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${esc(code.trim())}</code></pre>`)
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\* (.*$)/gm, '<li>$1</li>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

// ═══════ PROACTIVE MASCOT ═══════
window.updateProactiveMascot = function(actionContext = null) {
  const bubble = document.getElementById('mascotSpeechBubble') || document.getElementById('greetingContext');
  if (!bubble) return;
  
  const hour = new Date().getHours();
  let msg = '';
  let mood = 'talking';
  
  if (actionContext === 'scan') {
    msg = "💬 <strong>Bravo pour ce scan !</strong> Vérifie bien l'indice PRAL (acidité) de cet aliment. 🍎";
    mood = 'excited';
  } else if (actionContext === 'meal') {
    msg = "💬 <strong>Repas enregistré !</strong> N'oublie pas de bien mastiquer pour aider ta digestion. 🥗";
    mood = 'proud';
  } else if (actionContext === 'fast_start') {
    msg = "💬 <strong>C'est parti pour le jeûne !</strong> Ton corps commence son nettoyage profond. 💧";
    mood = 'loving';
  } else {
    // Time-based circadian messages
    if (hour >= 4 && hour < 12) {
      msg = currentProtocol === 'vitalist' 
        ? "💬 <strong>Matin (Élimination) :</strong> L'organisme élimine les toxines. Privilégie l'hydratation, les tisanes et les fruits aqueux. 🍋"
        : "💬 <strong>Bonjour !</strong> Pense à bien t'hydrater dès le réveil. 💧";
      mood = 'excited';
    } else if (hour >= 12 && hour < 20) {
      msg = "💬 <strong>Journée (Appropriation) :</strong> Le feu digestif est au maximum ! Moment propice pour des repas vivants et nourrissants. 🍉";
      mood = 'talking';
    } else {
      msg = "💬 <strong>Soir & Nuit (Régénération) :</strong> Mettre le système digestif au repos pour permettre la réparation cellulaire nocturne. 🌙";
      mood = 'sleepy';
    }
  }
  
  bubble.innerHTML = msg;
  
  if (window.appMascot) {
    window.appMascot.setMood(mood, true);
    setTimeout(() => {
      if (window.appMascot) window.appMascot.setMood(mood, false);
    }, 4000);
  }
};

// ═══════ RESOURCES HUB ═══════
window.renderResources = function() {
  const container = document.getElementById('resourcesContainer');
  if (!container) return;
  
  // Hardcoded clean list of resources (No religious content)
  const resources = [
    {
      title: "Guide Nutritionnel Officiel",
      url: "/Nutrional-Guide.pdf", // Note: Adjust path if needed or point to actual PDF hosted URL
      source: "VitalTrack",
      type: "pdf",
      description: "Notre guide complet sur la nutrition vitaliste et les associations alimentaires."
    },
    {
      title: "Le jeûne, une nouvelle thérapie ?",
      url: "https://www.youtube.com/embed/hPXQH6gOuJM",
      source: "ARTE",
      type: "video",
      description: "Documentaire passionnant sur les bienfaits thérapeutiques du jeûne et les études scientifiques."
    },
    {
      title: "What The Health",
      url: "https://www.youtube.com/embed/_ymX8x0IqM8",
      source: "Netflix",
      type: "video",
      description: "L'impact de l'alimentation sur la santé et les maladies chroniques."
    },
    {
      title: "La Santé Dans L'Assiette",
      url: "https://www.youtube.com/embed/69VuB1Tt_n8",
      source: "Netflix",
      type: "video",
      description: "Documentaire explorant le lien entre l'alimentation (focus végétal) et la santé globale."
    },
    {
      title: "DR. SEBI DOCUMENTARY",
      url: "https://www.youtube.com/embed/9ycV9aAWjzM",
      source: "Dr. Sebi",
      type: "video",
      description: "Documentaire complet sur la vie et les enseignements du Dr. Sebi sur la nutrition alcaline."
    },
    {
      title: "Le Système de Guérison du Régime Sans Mucus",
      url: "https://www.amazon.fr/Syst%C3%A8me-gu%C3%A9rison-r%C3%A9gime-sans-mucus/dp/2889241512",
      source: "Arnold Ehret",
      type: "link",
      description: "Le livre fondateur d'Arnold Ehret sur la transition alimentaire et l'élimination de l'obstruction (V = P - O)."
    },
    {
      title: "The Detox Miracle Sourcebook",
      url: "https://www.amazon.fr/Detox-Miracle-Sourcebook-Complete-Regeneration/dp/1935826190",
      source: "Dr. Robert Morse",
      type: "link",
      description: "La bible de la détoxification et de la régénération tissulaire par le Dr. Robert Morse."
    }
  ];
  
  container.innerHTML = resources.map(r => {
    if (r.type === 'video') {
      return `
        <div class="dash-card glass" style="padding:16px;">
          <h3 style="margin-bottom:8px; font-size:1.1rem">${esc(r.title)}</h3>
          <span class="badge badge-warning" style="margin-bottom:12px; display:inline-block">${esc(r.source)}</span>
          <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; background:#000;">
            <iframe src="${r.url}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
          </div>
          <p style="margin-top:12px; font-size:0.9rem; color:var(--text-dim)">${esc(r.description)}</p>
        </div>
      `;
    } else {
      // PDF
      return `
        <div class="dash-card glass" style="padding:16px; display:flex; flex-direction:column;">
          <h3 style="margin-bottom:8px; font-size:1.1rem">${esc(r.title)}</h3>
          <span class="badge badge-success" style="margin-bottom:12px; display:inline-block">${esc(r.source)}</span>
          <p style="font-size:0.9rem; color:var(--text-dim); margin-bottom:16px;">${esc(r.description)}</p>
          <a href="${r.url}" target="_blank" class="btn-primary" style="text-align:center; text-decoration:none;"><i class="ri-file-pdf-line"></i> Ouvrir le Guide PDF</a>
        </div>
      `;
    }
  }).join('');
};

// ═══════ DIET PLAN CALENDAR ═══════

const MONTHS_FR = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
const DAYS_FR = ['dim','lun','mar','mer','jeu','ven','sam'];
const DAYS_FULL_FR = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
const SLOT_META = {
  'Réveil':           { emoji: '🌅', time: '6h–7h',   color: '#f59e0b', gradient: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.03))' },
  'Petit-déjeuner':   { emoji: '🍽️', time: '8h–9h',   color: '#4ade80', gradient: 'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.03))' },
  'Déjeuner':         { emoji: '🥗', time: '12h–13h', color: '#22d3ee', gradient: 'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.03))' },
  'Collation':        { emoji: '🫐', time: '16h',     color: '#a78bfa', gradient: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.03))' },
  'Dîner':            { emoji: '🌙', time: '19h–20h', color: '#f472b6', gradient: 'linear-gradient(135deg,rgba(244,114,182,0.15),rgba(244,114,182,0.03))' },
};

function formatDateShort(d) { return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`; }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

// ── Flexible Calendar ──
let currentDateOffset = 0; // 0 = this week, -1 = last week, etc.

function getWeekDates(offsetWeeks = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + (offsetWeeks * 7));
  monday.setHours(0,0,0,0);
  
  const days = [];
  for(let i=0; i<7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

window.changeCalendarWeek = function(delta) {
  currentDateOffset += delta;
  renderCalendar();
};

function renderCalendar() {
  const grid = document.getElementById('calendarWeekGrid');
  if (!grid) return;
  
  const weekDays = getWeekDates(currentDateOffset);
  const meals = store.get('calendar_meals', []); // { id, dateStr, slot, text, done }
  const today = new Date();
  
  // Update header label
  const wStart = weekDays[0];
  const wEnd = weekDays[6];
  document.getElementById('calendarWeekLabel').textContent = 
    `Du ${wStart.getDate()} ${MONTHS_FR[wStart.getMonth()]} au ${wEnd.getDate()} ${MONTHS_FR[wEnd.getMonth()]}`;

  grid.innerHTML = weekDays.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const isToday = isSameDay(date, today);
    const dayMeals = meals.filter(m => m.dateStr === dateStr);
    
    // Sort meals logically
    const slotOrder = { 'Petit-déjeuner': 1, 'Déjeuner': 2, 'Collation': 3, 'Dîner': 4 };
    dayMeals.sort((a,b) => (slotOrder[a.slot]||99) - (slotOrder[b.slot]||99));

    return `
      <div class="cal-day-block">
        <div class="cal-day-header ${isToday ? 'today' : ''}">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:10px; height:10px; border-radius:50%; background:${isToday ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}"></div>
            ${DAYS_FULL_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}
          </div>
          <button class="btn-icon-small" onclick="openMealModal('${dateStr}')" data-tooltip="Ajouter un repas">
            <i class="ri-add-line"></i>
          </button>
        </div>
        
        <div class="cal-meals-list">
          ${dayMeals.length === 0 ? `
            <div class="cal-empty-day">
              Rien de prévu pour ce jour. <br>
              <a href="#" onclick="openMealModal('${dateStr}'); return false;" style="color:var(--accent); text-decoration:none; margin-top:8px; display:inline-block;">+ Ajouter</a>
            </div>
          ` : dayMeals.map(m => {
            const meta = SLOT_META[m.slot] || { emoji: '🍽️', color: '#4ade80' };
            return `
            <div class="cal-meal-card">
              <div style="flex:1;">
                <div class="cal-meal-slot" style="background:${meta.color}22; color:${meta.color}">
                  ${meta.emoji} ${esc(m.slot)}
                </div>
                <div class="cal-meal-content">${esc(m.text)}</div>
              </div>
              <div class="cal-meal-actions">
                <button class="btn-icon-small magic" onclick="promptAIFixMeal('${m.id}')" data-tooltip="Changer avec l'IA">
                  <i class="ri-magic-line"></i>
                </button>
                <button class="btn-icon-small" onclick="openMealModal('${dateStr}', '${m.id}')">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="btn-icon-small danger" onclick="deleteCalendarMeal('${m.id}')">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ── CRUD Actions ──
let currentEditMeal = null; // { dateStr, id, slot, text }

window.openMealModal = function(dateStr, mealId = null) {
  const scrim = document.getElementById('mealModalScrim');
  const modal = document.getElementById('mealModal');
  const title = document.getElementById('mealModalTitle');
  const input = document.getElementById('mealModalContent');
  const saveBtn = document.getElementById('saveMealBtn');
  
  // Set context
  currentEditMeal = { dateStr, id: mealId, slot: 'Déjeuner', text: '' };
  
  if (mealId) {
    title.textContent = 'Modifier le repas';
    const meals = store.get('calendar_meals', []);
    const m = meals.find(x => x.id === mealId);
    if (m) {
      currentEditMeal.slot = m.slot;
      currentEditMeal.text = m.text;
    }
  } else {
    title.textContent = 'Ajouter un repas';
  }
  
  input.value = currentEditMeal.text;
  
  // UI Selectors
  document.querySelectorAll('#mealSlotSelector .chip-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#mealSlotSelector .chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEditMeal.slot = btn.dataset.slot;
    };
    if (btn.dataset.slot === currentEditMeal.slot) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  
  saveBtn.onclick = saveMealModal;
  
  scrim.classList.add('active');
  modal.classList.add('active');
};

window.closeMealModal = function() {
  document.getElementById('mealModalScrim').classList.remove('active');
  document.getElementById('mealModal').classList.remove('active');
};

function saveMealModal() {
  const input = document.getElementById('mealModalContent').value.trim();
  if (!input) return showToast('Le repas ne peut pas être vide.', 'error');
  
  currentEditMeal.text = input;
  let meals = store.get('calendar_meals', []);
  
  if (currentEditMeal.id) {
    const idx = meals.findIndex(x => x.id === currentEditMeal.id);
    if (idx > -1) meals[idx] = currentEditMeal;
  } else {
    currentEditMeal.id = 'meal_' + Date.now();
    meals.push(currentEditMeal);
  }
  
  store.set('calendar_meals', meals);
  closeMealModal();
  renderCalendar();
  showToast('Repas sauvegardé dans le calendrier !', 'success');
}

window.deleteCalendarMeal = function(id) {
  let meals = store.get('calendar_meals', []);
  meals = meals.filter(x => x.id !== id);
  store.set('calendar_meals', meals);
  renderCalendar();
  showToast('Repas supprimé du calendrier.', 'info');
};

window.promptAIFixMeal = function(id) {
  showPage('chat');
  const chatInput = document.getElementById('chatInput');
  chatInput.value = "IA, j'aimerais changer ce repas. Propose-moi une alternative cohérente. (ID: " + id + ")";
  chatInput.focus();
};

window.promptAIPlan = function() {
  showPage('chat');
  const chatInput = document.getElementById('chatInput');
  chatInput.value = "IA, propose-moi un plan alimentaire de 3 jours pour mon calendrier.";
  chatInput.focus();
};

window.handleApplyDietPlanRequest = function(encodedReq, mode) {
  try {
    const req = JSON.parse(decodeURIComponent(escape(atob(encodedReq))));
    if (!window.applyDietPlanRequest) {
      showToast("⚠️ Erreur : moteur de calendrier non disponible.", "error");
      return;
    }
    const res = window.applyDietPlanRequest(req, mode);

    if (res.conflict) {
      const existingModal = document.getElementById('conflictModalOverlay');
      if (existingModal) existingModal.remove();

      const overlay = document.createElement('div');
      overlay.id = 'conflictModalOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = `<div style="background:var(--surface,#121b27);border:1px solid rgba(255,255,255,0.12);border-radius:22px;padding:24px;max-width:440px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.6);color:var(--text,#f3f6f9);">
        <h3 style="margin:0 0 12px;font-size:1.15rem;font-weight:700;color:var(--text,#f3f6f9)">⚠️ Repas existants détectés</h3>
        <p style="font-size:0.9rem;color:var(--text-mid,#9aa7b8);margin:0 0 20px;line-height:1.4;">Des repas existent déjà dans votre calendrier sur <strong>${res.conflictCount} créneau(x)</strong> pendant cette période. Que souhaitez-vous faire ?</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button onclick="document.getElementById('conflictModalOverlay').remove(); window.handleApplyDietPlanRequest('${encodedReq}', 'replace')" style="padding:12px;border-radius:12px;border:none;background:var(--accent,#37d399);color:#000;font-weight:700;cursor:pointer;font-size:0.95rem;">🔄 Remplacer les jours du plan</button>
          <button onclick="document.getElementById('conflictModalOverlay').remove(); window.handleApplyDietPlanRequest('${encodedReq}', 'merge')" style="padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:var(--text,#f3f6f9);font-weight:600;cursor:pointer;font-size:0.95rem;">➕ Fusionner (ajouter à côté)</button>
          <button onclick="document.getElementById('conflictModalOverlay').remove()" style="padding:10px;border-radius:12px;border:none;background:transparent;color:var(--text-low,#5f6b7c);cursor:pointer;font-size:0.9rem;">Annuler</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      return;
    }

    if (res.ok) {
      showToast(`✅ Plan "${res.meta.name}" (${res.meta.numDays} jours) appliqué au calendrier avec succès !`, 'success');
      if (window.showPage) window.showPage('calendar');
    } else {
      showToast("⚠️ Erreur lors de l'application du plan : " + (res.error || 'Erreur inconnue'), 'error');
    }
  } catch (e) {
    console.error("Erreur lors de l'application du plan", e);
    showToast("Impossible d'appliquer le plan.", 'error');
  }
};

window.addMealsToCalendar = function(mealsJson) {
  try {
    const newMeals = JSON.parse(decodeURIComponent(escape(atob(mealsJson))));
    let meals = store.get('calendar_meals', []);
    
    newMeals.forEach(m => {
      // Calculate date based on dayOffset from today
      const d = new Date();
      d.setDate(d.getDate() + (m.dayOffset || 0));
      const dateStr = d.toISOString().split('T')[0];
      
      meals.push({
        id: 'meal_' + Date.now() + Math.random().toString(36).substr(2, 5),
        dateStr: dateStr,
        slot: m.slot || m.title || 'Déjeuner',
        text: m.text || m.note || '',
        time: m.time,
        tone: m.tone,
        icon: m.icon,
        title: m.title || m.slot,
        tags: m.tags || [],
        note: m.note || m.text,
        done: false
      });
    });
    
    store.set('calendar_meals', meals);
    showToast(`✅ ${newMeals.length} repas ajoutés à ton calendrier !`, 'success');
    showPage('calendar');
    renderCalendar();
  } catch (e) {
    console.error("Erreur lors de l'ajout des repas", e);
    showToast("Une erreur est survenue lors de l'ajout des repas.", 'error');
  }
};

window.handleAddActionMeal = function(encodedMeal) {
  try {
    const meal = JSON.parse(decodeURIComponent(escape(atob(encodedMeal))));
    const meals = store.get('meals', []);
    
    // Calculate PRAL and scores based on items if available
    let totalPral = 0;
    let itemCount = 0;
    const items = Array.isArray(meal.items) ? meal.items : [meal.name];
    
    items.forEach(itemName => {
      const match = vitalDb.find(f => (f.names || []).some(n => n.toLowerCase() === itemName.toLowerCase()) || f.id === itemName.toLowerCase());
      if (match) {
        totalPral += (match.scientific_defaults?.pral ?? -2.5);
        itemCount++;
      } else {
        totalPral += -2.5; // vitalist default
        itemCount++;
      }
    });

    const avgPral = itemCount > 0 ? Number((totalPral / itemCount).toFixed(1)) : -2.5;

    const newMeal = {
      id: 'meal_' + Date.now(),
      name: meal.name || 'Repas Vitaliste',
      category: meal.category || 'lunch',
      items: items,
      emoji: meal.emoji || '🍲',
      note: meal.note || 'Repas suggéré par le coach vitaliste IA',
      approved: true,
      electric: true,
      hybrid: false,
      pral: avgPral,
      nova: 1,
      timestamp: Date.now()
    };

    meals.unshift(newMeal);
    store.set('meals', meals);

    if (window.renderMeals) renderMeals();
    if (window.renderDashboard) renderDashboard();
    if (window.updateProactiveMascot) updateProactiveMascot('meal');
    
    showToast(`🍽️ Repas "${meal.name}" enregistré dans votre journal !`, 'success');
  } catch (err) {
    console.error('Erreur handleAddActionMeal:', err);
    showToast("Impossible d'enregistrer le repas.", 'error');
  }
};

window.handleApplyFastingProgram = function(encodedProgram) {
  try {
    const p = JSON.parse(decodeURIComponent(escape(atob(encodedProgram))));
    const firstConfig = (p.configs && p.configs[0]) || { type: 'waterFast', durationMinutes: 1440 };
    const durationHours = Math.round((firstConfig.durationMinutes || 960) / 60);
    const fastType = firstConfig.type || 'waterFast';
    
    const typeSelect = document.getElementById('fastingType');
    const durationSelect = document.getElementById('fastingDuration');
    if (typeSelect) typeSelect.value = fastType;
    if (durationSelect) durationSelect.value = durationHours.toString();

    // Start fast if not active
    if (!fastingState.active) {
      startFasting();
    }

    showToast(`🔥 Programme "${p.name}" (${durationHours}h) activé !`, 'success');
    if (window.showPage) showPage('fasting');
  } catch (err) {
    console.error('Erreur handleApplyFastingProgram:', err);
    showToast("Impossible d'activer le programme de jeûne.", 'error');
  }
};

window.addSuggestedFood = function(btn, foodName) {
  const meals = store.get('meals', []);
  const match = vitalDb.find(item => item.names && item.names.some(n => n.toLowerCase() === foodName.toLowerCase()));
  meals.push({ 
    id: match?.id || Date.now().toString(),
    name: foodName, 
    emoji: match?.emoji || '🌱', 
    family: match?.category || match?.family || 'Suggestion IA', 
    approved: match?.specific?.electric === true,
    electric: match?.specific?.electric === true,
    hybrid: match?.specific?.hybrid === true,
    pral: match?.scientific_defaults?.pral ?? 0,
    nova: match?.vitality?.nova ?? 4,
    timestamp: Date.now() 
  });
  store.set('meals', meals);
  btn.innerHTML = `<i class="ri-check-line"></i> ${foodName}`;
  btn.style.background = 'rgba(var(--accent-rgb,74,222,128),0.2)';
  btn.style.borderColor = 'var(--accent)'; btn.disabled = true;
};

// ═══════ QUICK-REPLY DETECTION ═══════
function detectQuickReplies(text) {
  const lower = text.toLowerCase();
  if ((lower.includes('protocole') || lower.includes('approche') || lower.includes('inspire')) && (lower.includes('ehret') || lower.includes('sebi') || lower.includes('morse')))
    return ['Arnold Ehret', 'Dr. Sebi', 'Dr. Morse', 'Personnalisé'];
  if ((lower.includes('objectif') || lower.includes('but') || lower.includes('souhait')) && (lower.includes('détox') || lower.includes('poids') || lower.includes('énergie') || lower.includes('transition')))
    return ['Détox & nettoyage', 'Perte de poids', 'Énergie & vitalité', 'Transition en douceur'];
  if (lower.includes('combien de jours') || lower.includes('durée') || lower.includes('nombre de jours'))
    return ['3 jours', '7 jours', '14 jours', '21 jours'];
  if (lower.includes('type de jeûne') || lower.includes('quel jeûne') || lower.includes('forme de jeûne'))
    return ['Jeûne hydrique', 'Jeûne aux jus', 'Jeûne aux fruits', 'Intermittent 16/8'];
  if (lower.includes('?') && (lower.includes('souhaites-tu') || lower.includes('veux-tu') || lower.includes('aimerais-tu') || lower.includes('est-ce que tu') || lower.includes('tu veux') || lower.includes('on y va') || lower.includes('ça te convient') || lower.includes('ça te va') || lower.includes("d'accord") || lower.includes('tu préfères') || lower.includes('intéresse')))
    return ['Oui 👍', 'Non merci'];
  if ((lower.includes('plan alimentaire') || lower.includes('programme nutritionnel')) && lower.includes('?'))
    return ['Oui, crée-moi un plan !', 'Non merci'];
  return [];
}

window.sendQuickReply = function(btn, text) {
  const parent = btn.closest('.quick-replies');
  if (parent) {
    parent.querySelectorAll('.quick-reply-chip').forEach(c => { c.disabled = true; c.style.opacity = '0.4'; });
    btn.style.opacity = '1'; btn.style.background = 'rgba(var(--accent-rgb,74,222,128),0.25)'; btn.style.fontWeight = '600';
  }
  document.getElementById('chatInput').value = text;
  const form = document.getElementById('chatForm');
  if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

// ═══════ WEIGHT TRACKING & MODAL ═══════
window.openWeightModal = function() {
  const modal = document.getElementById('weightModal');
  if (!modal) return;

  const dateInput = document.getElementById('weightDateInput');
  const valInput = document.getElementById('weightValInput');
  const noteInput = document.getElementById('weightNoteInput');

  // Default to today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  if (dateInput) dateInput.value = `${year}-${month}-${day}`;

  // Default value from last entry
  const history = store.get('weight_history', []);
  if (valInput) {
    if (history.length > 0) {
      valInput.value = history[history.length - 1].weight;
    } else {
      valInput.value = '70.0';
    }
  }
  if (noteInput) noteInput.value = '';

  renderWeightHistoryInModal();
  modal.classList.add('open');
};

window.closeWeightModal = function(e) {
  if (!e || e.target === document.getElementById('weightModal') || e.target.closest?.('.modal-close')) {
    document.getElementById('weightModal')?.classList.remove('open');
  }
};

window.stepWeight = function(delta) {
  const valInput = document.getElementById('weightValInput');
  if (!valInput) return;
  let curr = parseFloat(valInput.value) || 70.0;
  curr = Math.round((curr + delta) * 10) / 10;
  if (curr < 20) curr = 20;
  if (curr > 300) curr = 300;
  valInput.value = curr.toFixed(1);
};

window.saveWeightEntry = function() {
  const dateInput = document.getElementById('weightDateInput');
  const valInput = document.getElementById('weightValInput');
  const noteInput = document.getElementById('weightNoteInput');

  const dateStr = dateInput?.value || new Date().toISOString().split('T')[0];
  const w = parseFloat(valInput?.value?.replace(',', '.'));
  const note = noteInput?.value?.trim() || '';

  if (isNaN(w) || w <= 20 || w > 300) {
    showToast('Veuillez entrer un poids valide (ex: 72.5 kg).', 'error');
    return;
  }

  const history = store.get('weight_history', []);
  const entryDate = new Date(`${dateStr}T12:00:00`).toISOString();
  
  history.push({
    id: 'w_' + Date.now(),
    date: entryDate,
    weight: w,
    note
  });

  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  store.set('weight_history', history);

  showToast(`Pesée de ${w} kg enregistrée pour le ${dateStr} !`, 'success');
  renderWeightChart();
  renderWeightHistoryInModal();
  document.getElementById('weightModal')?.classList.remove('open');
};

window.deleteWeightEntry = function(idx) {
  let history = store.get('weight_history', []);
  if (idx >= 0 && idx < history.length) {
    history.splice(idx, 1);
    store.set('weight_history', history);
    showToast('Pesée supprimée.', 'info');
    renderWeightChart();
    renderWeightHistoryInModal();
  }
};

window.renderWeightHistoryInModal = function() {
  const listEl = document.getElementById('weightHistoryList');
  const countEl = document.getElementById('weightHistoryCount');
  if (!listEl) return;

  const history = store.get('weight_history', []);
  if (countEl) countEl.textContent = `${history.length} pesée${history.length > 1 ? 's' : ''}`;

  if (history.length === 0) {
    listEl.innerHTML = '<p class="empty-state-sm" style="text-align:center;padding:8px;">Aucune pesée enregistrée.</p>';
    return;
  }

  const reversed = [...history].reverse();
  listEl.innerHTML = reversed.map((item, rIdx) => {
    const originalIdx = history.length - 1 - rIdx;
    const d = new Date(item.date);
    const dateFormatted = isNaN(d.getTime()) ? item.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `
      <div class="weight-history-item">
        <div>
          <span class="weight-history-val">${item.weight} kg</span>
          <span class="weight-history-date"> · ${dateFormatted}${item.note ? ` (${esc(item.note)})` : ''}</span>
        </div>
        <button class="weight-history-del" onclick="deleteWeightEntry(${originalIdx})" title="Supprimer"><i class="ri-delete-bin-line"></i></button>
      </div>
    `;
  }).join('');
};

window.renderWeightChart = function() {
  const container = document.getElementById('weightChartContainer');
  const empty = document.getElementById('weightChartEmpty');
  const svg = document.getElementById('weightChartSvg');
  if (!container || !empty || !svg) return;
  
  const history = store.get('weight_history', []);
  if (history.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  container.style.display = 'block';
  empty.style.display = 'none';
  
  const w = container.clientWidth || 300;
  const h = container.clientHeight || 120;
  
  const weights = history.map(h => h.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 10;
  
  let pathD = '';
  let pointsHtml = '';
  
  if (history.length === 1) {
    const y = h / 2;
    const x = w / 2;
    pointsHtml = `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)" />
                  <text x="${x}" y="${y - 12}" fill="var(--text)" font-size="10" text-anchor="middle">${history[0].weight} kg</text>`;
  } else {
    history.forEach((entry, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((entry.weight - minW) / range) * h;
      
      if (i === 0) pathD += `M ${x} ${y} `;
      else pathD += `L ${x} ${y} `;
      
      pointsHtml += `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)" />`;
      if (i === 0 || i === history.length - 1) {
         pointsHtml += `<text x="${x}" y="${y - 10}" fill="var(--text-dim)" font-size="10" text-anchor="${i === 0 ? 'start' : 'end'}">${entry.weight} kg</text>`;
      }
    });
  }
  
  svg.innerHTML = `
    <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    ${pointsHtml}
  `;
};

// Hook renderWeightChart into app init
const originalUpdateDash = window.updateDashStats;
window.updateDashStats = function() {
  if(originalUpdateDash) originalUpdateDash();
  renderWeightChart();
  updateCircadianWidget();
};

// ═══════ CIRCADIAN RHYTHM ═══════
window.updateCircadianWidget = function() {
  const timeEl = document.getElementById('circadianTimePill');
  const clockTime = document.getElementById('clockTime');
  const clockPhase = document.getElementById('clockPhase');
  const clockIndicator = document.getElementById('clockIndicator');
  const phaseIcon = document.getElementById('phaseIcon');
  const phaseTitle = document.getElementById('phaseTitle');
  const phaseDesc = document.getElementById('phaseDesc');
  
  if (!timeEl) return; // Not on dashboard

  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${h.toString().padStart(2, '0')}:${m}`;
  timeEl.textContent = timeStr;
  if (clockTime) clockTime.textContent = timeStr;

  let shortCycle = '';
  let fullCycle = '';
  let iconClass = '';
  let descText = '';
  let phaseColor = '';
  
  if (h >= 4 && h < 12) {
    shortCycle = 'ÉLIMINATION';
    fullCycle = 'ÉLIMINATION';
    iconClass = 'ri-sun-cloudy-fill';
    descText = "04h - 12h • Nettoyage corporel & détox. Privilégiez l'eau, les tisanes et les fruits aqueux.";
    phaseColor = '#f59e0b';
  } else if (h >= 12 && h < 20) {
    shortCycle = 'APPROPRIATION';
    fullCycle = 'APPROPRIATION';
    iconClass = 'ri-sun-fill';
    descText = "12h - 20h • Feu digestif au maximum. Moment propice pour les repas et la nutrition.";
    phaseColor = '#10b981';
  } else {
    shortCycle = 'RÉGÉNÉRATION';
    fullCycle = 'ASSIMILATION & RÉGÉNÉRATION';
    iconClass = 'ri-moon-clear-fill';
    descText = "20h - 04h • Réparation cellulaire nocturne. Système digestif au repos complet.";
    phaseColor = '#818cf8';
  }

  if (clockPhase) {
    clockPhase.textContent = shortCycle;
    clockPhase.style.color = phaseColor;
  }
  if (phaseTitle) {
    phaseTitle.textContent = fullCycle;
    phaseTitle.style.color = phaseColor;
  }
  if (phaseDesc) {
    phaseDesc.textContent = descText;
  }
  if (phaseIcon) {
    phaseIcon.className = iconClass;
    phaseIcon.style.color = phaseColor;
  }

  if (clockIndicator) {
    // 0h = 180deg (bottom), 6h = 270deg (left), 12h = 0deg (top), 18h = 90deg (right)
    const minutesTotal = h * 60 + parseInt(m);
    const angle = 180 + (minutesTotal / 1440) * 360;
    clockIndicator.innerHTML = `<i class="${iconClass}" style="color:${phaseColor}"></i>`;
    clockIndicator.style.transform = `rotate(${angle}deg) translateY(-110px) rotate(-${angle}deg)`;
  }
};

updateCircadianWidget();
setInterval(updateCircadianWidget, 30000);
document.addEventListener('DOMContentLoaded', updateCircadianWidget);
