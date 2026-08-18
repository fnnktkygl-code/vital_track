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

// ═══════ PROFILE ═══════
function loadProfile() {
  const p = store.get('profile', { name: '', goal: 'detox' });
  document.getElementById('profileName').value = p.name || '';
  document.getElementById('profileGoal').value = p.goal || 'detox';
  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} !` : 'Salut !';
}
window.saveProfile = function() {
  const p = { name: document.getElementById('profileName').value.trim(), goal: document.getElementById('profileGoal').value };
  store.set('profile', p);
  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} !` : 'Salut !';
  showToast('✅ Profil sauvegardé avec succès !', 'success');
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
  const fasts = store.get('fasting-history', []);
  const breaths = store.get('breathing-history', []);
  const favs = store.get('favorites', []);

  document.getElementById('statMeals').textContent = todayMeals.length;
  document.getElementById('statFasts').textContent = fasts.length;
  document.getElementById('statBreaths').textContent = breaths.length;
  document.getElementById('statFavs').textContent = favs.length;

  // Date
  const dateEl = document.getElementById('dashboardDate');
  if (dateEl) {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Date().toLocaleDateString('fr-FR', options);
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  // Vitality score
  const score = calculateVitalityScore(todayMeals);
  const arcScoreEl = document.getElementById('arcScore');
  if (arcScoreEl) arcScoreEl.textContent = todayMeals.length === 0 ? '0' : score;
  const arcProgress = document.getElementById('arcProgress');
  if (arcProgress) {
    const offset = 251 - (251 * (todayMeals.length === 0 ? 0 : score) / 100);
    arcProgress.style.strokeDashoffset = offset;
    arcProgress.style.stroke = todayMeals.length === 0 ? 'rgba(255,255,255,0.1)' : (score >= 70 ? 'var(--accent)' : score >= 40 ? 'var(--warn)' : 'var(--danger)');
  }
  const commentEl = document.getElementById('vitalityScoreComment');
  if (commentEl) {
    if (todayMeals.length === 0) {
      commentEl.style.color = 'var(--text-dim)';
      commentEl.innerHTML = '<i class="ri-information-line"></i> Aucune donnée aujourd\'hui. Enregistrez vos repas pour calculer votre score.';
    } else if (score >= 70) {
      commentEl.style.color = 'var(--accent)';
      commentEl.innerHTML = '<i class="ri-checkbox-circle-fill"></i> Excellente vitalité';
    } else if (score >= 40) {
      commentEl.style.color = 'var(--warn)';
      commentEl.innerHTML = '<i class="ri-error-warning-fill"></i> Correcte, mais améliorable';
    } else {
      commentEl.style.color = 'var(--danger)';
      commentEl.innerHTML = '<i class="ri-close-circle-fill"></i> Vitalité faible';
    }
  }

  // Active fasting card (if exists)
  const dashFastingCard = document.getElementById('dashFastingCard');
  if (dashFastingCard) {
    dashFastingCard.style.display = fastingState.active ? 'block' : 'none';
  }

  // Today's meals (if exists)
  const dashList = document.getElementById('dashMealList');
  if (dashList) {
    if (todayMeals.length === 0) { 
      dashList.innerHTML = `<div class="empty-state-card">
                              <i class="ri-restaurant-2-line"></i>
                              <p>Aucun repas enregistré aujourd'hui.</p>
                            </div>`; 
    }
    else {
      dashList.innerHTML = todayMeals.slice(0, 5).map(m =>
        `<div class="meal-item"><span class="food-emoji">${m.emoji || '🍽️'}</span><div class="meal-item-info"><div class="meal-item-name">${esc(m.name)}</div><div class="meal-item-meta">${m.approved ? '✅ Approuvé' : '⚠️ Non approuvé'} · PRAL ${(m.pral ?? 0).toFixed(1)}</div></div></div>`
      ).join('');
    }
  }

  // Also update widgets
  if(typeof updateCircadianWidget === 'function') updateCircadianWidget();
  if(typeof renderWeightChart === 'function') renderWeightChart();
}

function calculateVitalityScore(meals) {
  if (meals.length === 0) return 0;
  let score = 0;
  meals.forEach(m => {
    if (m.electric) score += 25;
    else if (m.approved) score += 15;
    else if (m.hybrid) score += 5;
    if ((m.pral ?? 0) < 0) score += 10;
    if ((m.nova ?? 4) <= 1) score += 10;
  });
  return Math.min(100, Math.round(score / meals.length));
}

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
  
  conv.messages.forEach(m => addMessage(m.text, m.role === 'user', m.model));
}

window.quickChat = function(query) {
  document.getElementById('chatInput').value = query;
  document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};

window.sendChat = async function(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  if (!query) return;
  input.value = '';
  
  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'none';

  let conv = null;
  if (!activeConvId) {
    // Create new conversation
    conv = {
      id: 'conv_' + Date.now(),
      title: query.length > 25 ? query.substring(0, 25) + '...' : query,
      updated: Date.now(),
      messages: []
    };
    conversations.push(conv);
    activeConvId = conv.id;
  } else {
    conv = conversations.find(c => c.id === activeConvId);
    conv.updated = Date.now();
  }

  conv.messages.push({ role: 'user', text: query });
  saveConversations();
  addMessage(query, true);

  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  const typingEl = addTypingIndicator();

  try {
    const profile = store.get('profile', { name: '', goal: 'detox', protocol: 'vitalist' });
    
    // Call the backend with stream=true to bypass the 10s Vercel timeout
    const resp = await fetch(`${API_BASE}/api/chat?stream=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(VT_APP_KEY ? { 'X-VT-API-Key': VT_APP_KEY } : {}) },
      body: JSON.stringify({ query, profile, history: conv.messages.slice(0, -1), model: store.get('selected_model', 'auto') }),
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
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', badge: 'Fastest ⚡', tagline: 'Modèle réactif de dernière génération pour le chat instantané' },
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


function addMessage(text, isUser, modelUsed = null) {
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
  div.innerHTML = `${avatarHtml}<div class="message-bubble">${isUser ? esc(text) : renderMarkdown(text)}${quickReplies}${badgeHtml}</div>`;
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

// ═══════ SEARCH ═══════
window.setSearchFilter = function(filter) {
  currentSearchFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  searchFoods(document.getElementById('searchInput').value);
};

window.searchFoods = function(query) {
  const results = document.getElementById('foodResults');
  const q = (query || '').toLowerCase().trim();
  let matches = q ? vitalDb.filter(item => (item.names || []).some(n => n.toLowerCase().includes(q) || q.includes(n.toLowerCase()))) : vitalDb.slice(0, 30);

  if (currentSearchFilter !== 'all') {
    matches = matches.filter(item => {
      const sp = item.specific || {};
      if (currentSearchFilter === 'electric') return sp.electric === true;
      if (currentSearchFilter === 'hybrid') return sp.hybrid === true;
      if (currentSearchFilter === 'alkaline') return (item.scientific_defaults?.pral ?? 0) < 0;
      return true;
    });
  }
  matches = matches.slice(0, 30);

  if (matches.length === 0) {
    results.innerHTML = `
      <p class="empty-state">Aucun aliment trouvé.</p>
      <button class="btn-primary" style="margin: 0 auto; display: flex;" onclick="askAIToFindFood('${esc(q)}')">
        ✨ Demander à l'IA de chercher "${esc(q)}"
      </button>
    `;
    return;
  }
  results.innerHTML = matches.map(item => renderFoodCard(item)).join('');
};

function renderFoodCard(item) {
  const name = ((item.names?.[0] || 'Inconnu')).replace(/^./, c => c.toUpperCase());
  const sp = item.specific || {}; const sc = item.scientific_defaults || {};
  const isE = sp.electric === true; const isH = sp.hybrid === true;
  const pral = sc.pral ?? 0;
  const bc = isE ? 'badge-electric' : isH ? 'badge-hybrid' : 'badge-mucus';
  const bt = isE ? 'Électrique' : isH ? 'Hybride' : 'Mucogène';
  return `<div class="food-card" onclick="openFoodModal(${vitalDb.indexOf(item)})"><div class="food-emoji">${item.emoji || '🍽️'}</div><div class="food-info"><div class="food-name">${esc(name)}</div><div class="food-meta">${esc(item.family || '')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)}</div></div><span class="food-badge ${bc}">${bt}</span></div>`;
}

// ═══════ FOOD MODAL ═══════
window.openFoodModal = function(idx) {
  const item = vitalDb[idx]; if (!item) return;
  currentModalFood = item;
  const name = ((item.names?.[0] || 'Inconnu')).replace(/^./, c => c.toUpperCase());
  const sp = item.specific || {}; const sc = item.scientific_defaults || {}; const vt = item.vitality || {};
  const isE = sp.electric === true;

  document.getElementById('modalFoodHeader').innerHTML = `<div style="font-size:3rem;margin-bottom:8px">${item.emoji || '🍽️'}</div><h2 style="font-family:var(--font);font-weight:700">${esc(name)}</h2><p style="color:var(--text-dim)">${esc(item.family || 'Inconnu')} · ${isE ? '⚡ Électrique' : sp.hybrid ? '🔀 Hybride' : '⛔ Mucogène'}</p>`;

  currentModalFood._parsed = { name, sc, vt, sp };
  setModalTab('scientific');

  const favs = store.get('favorites', []);
  const isFav = favs.some(f => f.id === item.id);



  // Render modal actions based on if it's from AI
  const actionsContainer = document.getElementById('modalActionsContainer');
  if (actionsContainer) {
    if (item.isNewFromAI) {
      actionsContainer.innerHTML = `
        <button class="btn-primary full-w" onclick="saveAIFoodToDB(${idx})"><i class="ri-save-line"></i> Confirmer et Sauvegarder dans ma base</button>
      `;
    } else {
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

window.saveAIFoodToDB = function(idx) {
  const item = vitalDb[idx];
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
  selectMealFood(idx);
  window.closeFoodModal();
  showPage('meals');
};

window.closeFoodModal = function(e) { if (!e || e.target === document.getElementById('foodModal')) document.getElementById('foodModal').classList.remove('open'); };

window.setModalTab = function(tab) {
  document.querySelectorAll('.modal-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const content = document.getElementById('modalTabContent');
  if (!currentModalFood) return;
  const { sc, vt, sp } = currentModalFood._parsed || {};

  if (tab === 'scientific') {
    content.innerHTML = `<div class="data-row"><span class="data-label">PRAL</span><span class="data-value" style="color:${(sc?.pral??0) < 0 ? '#4ade80' : '#facc15'}">${(sc?.pral??0).toFixed(1)}</span></div><div class="data-row"><span class="data-label">Effet</span><span class="data-value">${(sc?.pral??0) < 0 ? '🟢 Alcalinisant' : '🟡 Acidifiant'}</span></div><div class="data-row"><span class="data-label">Densité nutritionnelle</span><span class="data-value">${sc?.density ?? '?'}/100</span></div><div class="data-bar"><div class="data-bar-fill" style="width:${sc?.density ?? 0}%;background:var(--accent)"></div></div>`;
  } else if (tab === 'vitality') {
    content.innerHTML = `<div class="data-row"><span class="data-label">Score NOVA</span><span class="data-value" style="color:${(vt?.nova??4) <= 1 ? '#4ade80' : '#ef4444'}">${vt?.nova ?? '?'}/4</span></div><div class="data-row"><span class="data-label">Classification</span><span class="data-value">${vt?.label ?? 'Inconnu'}</span></div><div class="data-row"><span class="data-label">Fraîcheur</span><span class="data-value">${vt?.freshness ?? 0}%</span></div><div class="data-bar"><div class="data-bar-fill" style="width:${vt?.freshness ?? 0}%;background:var(--accent-2)"></div></div>`;
  } else {
    content.innerHTML = `<div class="data-row"><span class="data-label">Électrique (Dr. Sebi)</span><span class="data-value">${sp?.electric ? '✅ Oui' : '❌ Non'}</span></div><div class="data-row"><span class="data-label">Hybride</span><span class="data-value">${sp?.hybrid ? '⚠️ Oui' : '✅ Non'}</span></div><div class="data-row"><span class="data-label">Mucus</span><span class="data-value">${sp?.mucus ?? 'Inconnu'}</span></div><div class="data-row"><span class="data-label">Verdict</span><span class="data-value">${sp?.label ?? 'Inconnu'}</span></div>${currentModalFood.note ? `<p style="margin-top:12px;color:var(--text-dim);font-size:0.85rem;line-height:1.5">${esc(currentModalFood.note)}</p>` : ''}`;
  }
};

// ═══════ FAVORITES ═══════
window.toggleFavorite = function() {
  if (!currentModalFood) return;
  let favs = store.get('favorites', []);
  const idx = favs.findIndex(f => f.id === currentModalFood.id);
  if (idx >= 0) { favs.splice(idx, 1); } else {
    const name = (currentModalFood.names?.[0] || 'Inconnu').replace(/^./, c => c.toUpperCase());
    favs.push({ id: currentModalFood.id, name, emoji: currentModalFood.emoji || '🍽️', family: currentModalFood.family || '', electric: currentModalFood.specific?.electric === true, pral: currentModalFood.scientific_defaults?.pral ?? 0 });
  }
  store.set('favorites', favs);
  const isFav = favs.some(f => f.id === currentModalFood.id);
  document.getElementById('modalFavBtn').innerHTML = isFav ? '<i class="ri-heart-fill"></i> Retirer' : '<i class="ri-heart-line"></i> Favori';
  document.getElementById('modalFavBtn').classList.toggle('active-fav', isFav);
  renderFavorites();
};

function renderFavorites() {
  const favs = store.get('favorites', []);
  const list = document.getElementById('favsList');
  if (!list) return;
  if (favs.length === 0) { list.innerHTML = '<p class="empty-state">Aucun favori. Ajoutez des aliments depuis la recherche.</p>'; return; }
  list.innerHTML = favs.map(f => `<div class="food-card"><div class="food-emoji">${f.emoji}</div><div class="food-info"><div class="food-name">${esc(f.name)}</div><div class="food-meta">${esc(f.family)} · PRAL ${(f.pral??0).toFixed(1)}</div></div><span class="food-badge ${f.electric ? 'badge-electric' : 'badge-mucus'}">${f.electric ? 'Électrique' : 'Mucogène'}</span></div>`).join('');
}

// ═══════ MEALS ═══════
window.showAddMealModal = function() { selectedMealFoods = []; renderSelectedMealFoods(); document.getElementById('mealSearchResults').innerHTML = ''; document.getElementById('mealSearchInput').value = ''; const aiInput = document.getElementById('aiDishInput'); if (aiInput) aiInput.value = ''; document.getElementById('addMealModal').classList.add('open'); };
window.closeAddMealModal = function(e) { if (!e || e.target === document.getElementById('addMealModal')) document.getElementById('addMealModal').classList.remove('open'); };

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
    const res = await fetch('/api/analyze-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });

    let items = [];
    if (res.ok) {
      const data = await res.json();
      items = data.data?.foods || data.data?.items || [];
    }

    if (!items || items.length === 0) {
      // Heuristic fallback
      const parts = q.split(/[,+&/]|\bet\b|\bavec\b|\baux\b|\bau\b|\bde\b|\bd['’]/i).map(p => p.trim()).filter(p => p.length >= 2);
      const tokens = parts.length > 0 ? parts : [q];
      items = tokens.map(token => {
        const match = vitalDb.find(item => (item.names || []).some(n => n.toLowerCase().includes(token.toLowerCase())));
        if (match) return match;
        return {
          id: 'dish_' + Date.now() + '_' + token,
          names: [token.charAt(0).toUpperCase() + token.slice(1)],
          emoji: '🌱',
          specific: { electric: true },
          scientific_defaults: { pral: -2.0 },
          vitality: { nova: 1 }
        };
      });
    }

    let addedCount = 0;
    items.forEach(item => {
      const name = (item.name || item.names?.[0] || 'Aliment').replace(/^./, c => c.toUpperCase());
      const id = item.id || `dish_${Date.now()}_${Math.random()}`;
      if (!selectedMealFoods.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        selectedMealFoods.push({
          id,
          name,
          emoji: item.emoji || '🍽️',
          approved: item.specific?.electric === true || item.approved === true,
          electric: item.specific?.electric === true || item.approved === true,
          hybrid: item.specific?.hybrid === true,
          pral: item.scientific_defaults?.pral ?? item.scientific?.pral ?? 0,
          nova: item.vitality?.nova ?? 1
        });
        addedCount++;
      }
    });

    renderSelectedMealFoods();
    if (input) input.value = '';
    showToast(`✨ ${addedCount} aliment(s) identifié(s) et ajouté(s) au repas !`, 'success');
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
      <p class="empty-state">Aucun aliment direct dans la base locale.</p>
      <button class="btn-primary" style="margin: 0 auto; display: flex;" onclick="askAIToFindFood('${esc(q)}')">
        ✨ Demander à l'IA d'analyser "${esc(q)}"
      </button>
    `;
    return;
  }
  
  results.innerHTML = matches.map(item => {
    const name = (item.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
    return `<div class="food-card" onclick="selectMealFood(${vitalDb.indexOf(item)})"><div class="food-emoji">${item.emoji || '🍽️'}</div><div class="food-info"><div class="food-name">${esc(name)}</div></div></div>`;
  }).join('');
};

window.askAIToFindFood = async function(query) {
  const q = query.trim();
  if (!q) return;

  const resultsEl = document.getElementById('foodResults') || document.getElementById('mealSearchResults');
  if (resultsEl) {
    resultsEl.innerHTML = `<p class="empty-state"><i class="ri-loader-4-line ri-spin"></i> Recherche de "${esc(q)}" via l'IA...</p>`;
  }

  try {
    const res = await fetch('/api/searchFood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    
    if (!res.ok) {
      throw new Error("Erreur lors de la recherche IA.");
    }

    const aiFood = await res.json();
    vitalDb.push(aiFood);
    const newIdx = vitalDb.length - 1;
    
    openFoodModal(newIdx);
    
    if (resultsEl) resultsEl.innerHTML = '<p class="empty-state">Consultez la modale pour valider l\'aliment.</p>';
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = `<p class="empty-state text-danger">${esc(e.message)}</p>`;
    showToast("Recherche IA terminée avec classification estimée.", 'info');
  }
};

window.selectMealFood = function(idx) {
  const item = vitalDb[idx]; if (!item) return;
  const name = (item.names?.[0] || '?').replace(/^./, c => c.toUpperCase());
  if (selectedMealFoods.find(f => f.id === item.id)) return;
  selectedMealFoods.push({ id: item.id, name, emoji: item.emoji || '🍽️', approved: item.specific?.electric === true, electric: item.specific?.electric === true, hybrid: item.specific?.hybrid === true, pral: item.scientific_defaults?.pral ?? 0, nova: item.vitality?.nova ?? 4 });
  renderSelectedMealFoods();
};

window.removeSelectedFood = function(id) { selectedMealFoods = selectedMealFoods.filter(f => f.id !== id); renderSelectedMealFoods(); };

function renderSelectedMealFoods() {
  document.getElementById('mealSelectedItems').innerHTML = selectedMealFoods.map(f => `<span class="selected-chip">${f.emoji} ${esc(f.name)} <button onclick="removeSelectedFood('${f.id}')">×</button></span>`).join('');
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

  if (todayMeals.length === 0) { list.innerHTML = '<p class="empty-state">Aucun repas enregistré. Ajoutez votre premier repas !</p>'; document.getElementById('mealAxisRow').style.display = 'none'; return; }

  document.getElementById('mealAxisRow').style.display = 'grid';
  const avgPral = todayMeals.reduce((s, m) => s + (m.pral ?? 0), 0) / todayMeals.length;
  const avgNova = todayMeals.reduce((s, m) => s + (m.nova ?? 4), 0) / todayMeals.length;
  const vitScore = calculateVitalityScore(todayMeals);
  document.getElementById('mealPral').textContent = avgPral.toFixed(1);
  document.getElementById('mealNova').textContent = avgNova.toFixed(1);
  document.getElementById('mealVitality').textContent = `${vitScore}%`;

  list.innerHTML = todayMeals.map((m, i) =>
    `<div class="meal-item"><span class="food-emoji">${m.emoji || '🍽️'}</span><div class="meal-item-info"><div class="meal-item-name">${esc(m.name)}</div><div class="meal-item-meta">${m.electric ? '⚡ Électrique' : m.hybrid ? '🔀 Hybride' : '⛔ Mucogène'} · PRAL ${(m.pral??0).toFixed(1)}</div></div><button class="meal-item-remove" onclick="removeMeal(${i})"><i class="ri-delete-bin-line"></i></button></div>`
  ).join('');
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
window.setBreathMode = function(mode) { currentBreathMode = mode; document.querySelectorAll('.breath-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode)); document.getElementById('breathInfo').innerHTML = `<p>${breathModes[mode].name} — ${breathModes[mode].breaths} respirations/tour</p>`; };

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

      // Deterministic Diet Plan Request Injection
      if (obj.dietPlanRequest) {
        const req = obj.dietPlanRequest;
        const encodedReq = btoa(unescape(encodeURIComponent(JSON.stringify(req))));
        const protocolLabels = { ehret: 'Transition Ehret', sebi: 'Guide Dr. Sebi', morse: 'Détox Dr. Morse', personalized: 'Programme Personnalisé' };
        const protoName = protocolLabels[req.protocol] || 'Vitaliste';
        const days = req.numDays || 7;
        const objText = req.objective ? ` · ${esc(req.objective)}` : '';
        const restrText = req.restrictions ? `<div style="font-size:0.8rem;color:#f2637a;margin-top:4px">⚠️ Restrictions : ${esc(req.restrictions)}</div>` : '';

        return `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent)">
          <div style="font-weight:600;margin-bottom:8px">📅 Plan Alimentaire Proposé</div>
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

      // Legacy Calendar Meals Injection (backward compatibility)
      if (obj.calendarMeals && Array.isArray(obj.calendarMeals)) {
        const meals = obj.calendarMeals;
        const encodedMeals = btoa(unescape(encodeURIComponent(JSON.stringify(meals))));
        return `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent)">
          <div style="font-weight:600;margin-bottom:8px">📅 Menus générés par l'IA</div>
          <div style="font-size:0.9rem;color:var(--text-dim);margin-bottom:12px">
            <span>🍽️ ${meals.length} repas proposés</span>
          </div>
          <button class="btn btn-primary" onclick="addMealsToCalendar('${encodedMeals}')">
            <i class="ri-calendar-check-line"></i> Ajouter au calendrier
          </button>
        </div>`;
      }

      // Food suggestion chips
      if (obj.suggestFoods && Array.isArray(obj.suggestFoods)) {
        const chips = obj.suggestFoods.map(f => 
          `<button class="food-chip" onclick="addSuggestedFood(this, '${esc(f)}')" style="display:inline-flex;align-items:center;gap:4px;padding:6px 14px;margin:4px;border-radius:20px;border:1px solid var(--accent);background:transparent;color:var(--text);cursor:pointer;font-size:0.85rem;transition:all 0.2s">
            <i class="ri-add-circle-line"></i> ${esc(f)}
          </button>`
        ).join('');
        return `<div style="margin:12px 0">
          <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px">🥗 Ajouter à ta liste du jour :</div>
          <div style="display:flex;flex-wrap:wrap">${chips}</div>
        </div>`;
      }

      // Fasting program card
      if (obj.program) {
        const p = obj.program;
        return `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid #f59e0b">
          <div style="font-weight:600;margin-bottom:8px">🔥 Programme de jeûne proposé</div>
          <div style="font-size:0.9rem;margin-bottom:4px"><strong>${esc(p.name)}</strong></div>
          <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px">${esc(p.targetObjective || '')}</div>
          <div style="font-size:0.8rem;color:var(--text-dim)">${p.configs?.length || 0} session(s) planifiée(s)</div>
        </div>`;
      }

      // Fallback: render as formatted JSON
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
    if (hour >= 5 && hour < 11) {
      msg = profile.protocol === 'vitalist' 
        ? "💬 <strong>Matin (Élimination) :</strong> L'organisme élimine les toxines de la nuit. Un jus de citron tiède pour favoriser le drainage ? 🍋"
        : "💬 <strong>Bonjour !</strong> Pense à bien t'hydrater dès le réveil. 💧";
      mood = 'excited';
    } else if (hour >= 11 && hour < 15) {
      msg = "💬 <strong>Midi (Appropriation) :</strong> Le feu digestif est au maximum ! Privilégie des aliments vivants et riches en eau. 🍉";
      mood = 'talking';
    } else if (hour >= 15 && hour < 19) {
      msg = "💬 <strong>Après-midi (Assimilation) :</strong> Une baisse de forme ? Quelques respirations profondes pour réoxygéner tes cellules. 🌬️";
      mood = 'questioning';
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
  const desc = document.getElementById('circadianDesc');
  
  if (!timeEl) return; // Not on dashboard

  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${h}:${m}`;
  timeEl.textContent = timeStr;
  if (clockTime) clockTime.textContent = timeStr;

  let cycle = '';
  let emoji = '';
  let text = '';
  
  if (h >= 4 && h < 12) {
    cycle = 'ÉLIMINATION';
    emoji = 'ri-sun-cloudy-fill';
    text = `<div class="info-box"><i class="${emoji}"></i> <div><strong>${cycle}</strong><br><span style="color:var(--text-dim)">Le corps se nettoie. Privilégiez l'eau et les jus.</span></div></div>`;
  } else if (h >= 12 && h < 20) {
    cycle = 'APPROPRIATION';
    emoji = 'ri-sun-fill';
    text = `<div class="info-box"><i class="${emoji}"></i> <div><strong>${cycle}</strong><br><span style="color:var(--text-dim)">Feu digestif au maximum. Moment des repas denses.</span></div></div>`;
  } else {
    cycle = 'REPOS PROFOND';
    emoji = 'ri-moon-clear-fill';
    text = `<div class="info-box"><i class="${emoji}"></i> <div><strong>${cycle}</strong><br><span style="color:var(--text-dim)">Priorité à la récupération, système digestif au repos.</span></div></div>`;
  }

  if (clockPhase) clockPhase.textContent = cycle;
  if (desc) desc.innerHTML = text;

  if (clockIndicator) {
    // 0h = 180deg (bottom), 6h = 270deg (left), 12h = 0deg (top), 18h = 90deg (right)
    const minutesTotal = h * 60 + parseInt(m);
    // map 0-1440 to 180-540 degrees
    const angle = 180 + (minutesTotal / 1440) * 360;
    clockIndicator.innerHTML = `<i class="${emoji}"></i>`;
    clockIndicator.style.transform = `rotate(${angle}deg) translateY(-110px) rotate(-${angle}deg)`;
  }
};

setInterval(updateCircadianWidget, 60000);
