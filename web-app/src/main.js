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
    }
  } catch (e) { console.warn('Could not load food database:', e); }
});

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
  alert('✅ Profil sauvegardé !');
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
  document.getElementById('arcScore').textContent = score;
  const arcProgress = document.getElementById('arcProgress');
  if (arcProgress) {
    const offset = 251 - (251 * score / 100);
    arcProgress.style.strokeDashoffset = offset;
    arcProgress.style.stroke = score >= 70 ? 'var(--accent)' : score >= 40 ? 'var(--warn)' : 'var(--danger)';
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
    
    // Pass the full conversation history directly to the backend
    const resp = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(VT_APP_KEY ? { 'X-VT-API-Key': VT_APP_KEY } : {}) },
      body: JSON.stringify({ query, profile, history: conv.messages.slice(0, -1) }),
    });
    
    typingEl.remove();
    if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error || `HTTP ${resp.status}`); }
    
    const data = await resp.json();
    const aiText = data.text || 'Désolé, je n\'ai pas pu répondre.';
    const modelUsed = data.model || 'Inconnu';
    
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

window.toggleModelList = function() {
  const dropdown = document.getElementById('modelDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
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
  
  alert('✅ Aliment ajouté définitivement à votre base de données !');
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
window.showAddMealModal = function() { selectedMealFoods = []; renderSelectedMealFoods(); document.getElementById('mealSearchResults').innerHTML = ''; document.getElementById('mealSearchInput').value = ''; document.getElementById('addMealModal').classList.add('open'); };
window.closeAddMealModal = function(e) { if (!e || e.target === document.getElementById('addMealModal')) document.getElementById('addMealModal').classList.remove('open'); };

window.searchMealFoods = function(query) {
  const q = (query || '').toLowerCase().trim();
  const results = document.getElementById('mealSearchResults');
  if (!q) { results.innerHTML = ''; return; }
  const matches = vitalDb.filter(item => (item.names || []).some(n => n.toLowerCase().includes(q))).slice(0, 10);
  
  if (matches.length === 0) {
    results.innerHTML = `
      <p class="empty-state">Aucun résultat.</p>
      <button class="btn-primary" style="margin: 0 auto; display: flex;" onclick="askAIToFindFood('${esc(q)}')">
        ✨ Demander à l'IA de chercher "${esc(q)}"
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
      if (res.status === 404) throw new Error("L'IA n'a pas trouvé cet aliment.");
      throw new Error("Erreur lors de la recherche IA.");
    }

    const aiFood = await res.json();
    vitalDb.push(aiFood);
    const newIdx = vitalDb.length - 1;
    
    openFoodModal(newIdx);
    
    if (resultsEl) resultsEl.innerHTML = '<p class="empty-state">Consultez la modale pour valider l\'aliment.</p>';
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = `<p class="empty-state text-danger">${esc(e.message)}</p>`;
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
  grid.innerHTML = FASTING_PROGRAMS.map(p =>
    `<div class="program-card" data-id="${p.id}" onclick="selectProgram('${p.id}')">
      <h5><span style="font-size:1.4rem;">${p.icon}</span> ${esc(p.name)}</h5>
      <p>${esc(p.desc)}</p>
    </div>`
  ).join('');
}

window.selectProgram = function(id) {
  const p = FASTING_PROGRAMS.find(x => x.id === id);
  if (!p) return;
  document.getElementById('fastingDuration').value = p.hours;
  document.getElementById('fastingSafetyWarning').style.display = p.hours > 24 ? 'flex' : 'none';
  document.querySelectorAll('.program-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));
  // Map program to select
  const typeMap = { intermittent: 'intermittent', warrior: 'intermittent', waterFast24: 'waterFast', juiceFast: 'juiceFast', fruitFast: 'fruitFast', grapeCure: 'grapeCure', drySunFast: 'drySunFast', ramadan: 'intermittent' };
  document.getElementById('fastingType').value = typeMap[id] || 'intermittent';
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

  container.innerHTML = ehretMasterclassData.map((mc, i) => `
    <div class="mc-card" onclick="openMasterclass(${i})">
      <div class="mc-pill">${mc.pill}</div>
      <div class="mc-icon-wrap" style="color:${mc.color}; background:${mc.bg};">
        <i class="${mc.icon}"></i>
      </div>
      <div class="mc-title">${mc.title}</div>
      <div class="mc-desc">${mc.shortDesc}</div>
    </div>
  `).join('');
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

  container.innerHTML = experts.map((exp, i) => `
    <div class="expert-acc-item" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; overflow:hidden; transition:all 0.3s ease;">
      <div class="expert-acc-header" onclick="toggleExpertAccordion(${i})" style="padding:16px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:${exp.color}; font-size:1.2rem;">
            <i class="${exp.icon}"></i>
          </div>
          <div>
            <div style="font-weight:700; color:var(--text); font-size:1rem;">${exp.name}</div>
            <div style="font-size:0.75rem; color:var(--text-dim);">${exp.title}</div>
          </div>
        </div>
        <i class="ri-arrow-down-s-line" id="acc-icon-${i}" style="font-size:1.4rem; color:var(--text-dim); transition:transform 0.3s ease;"></i>
      </div>
      <div class="expert-acc-content" id="acc-content-${i}" style="max-height:0; overflow:hidden; transition:max-height 0.3s ease;">
        <div style="padding:0 16px 16px 60px; display:flex; flex-direction:column; gap:12px;">
          ${exp.tips.map(t => `<div style="font-size:0.9rem; color:var(--text); line-height:1.5; border-left:2px solid ${exp.color}40; padding-left:12px;">${t}</div>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

window.toggleExpertAccordion = function(index) {
  const content = document.getElementById(`acc-content-${index}`);
  const icon = document.getElementById(`acc-icon-${index}`);
  const isExpanded = content.style.maxHeight !== '0px';
  
  // Close all
  document.querySelectorAll('.expert-acc-content').forEach(el => el.style.maxHeight = '0px');
  document.querySelectorAll('.expert-acc-header i').forEach(el => el.style.transform = 'rotate(0deg)');
  document.querySelectorAll('.expert-acc-item').forEach(el => el.style.background = 'rgba(255,255,255,0.02)');
  
  // Open clicked if it was closed
  if (!isExpanded) {
    content.style.maxHeight = content.scrollHeight + 'px';
    icon.style.transform = 'rotate(180deg)';
    content.parentElement.style.background = 'rgba(255,255,255,0.05)';
  }
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
  const btn = document.getElementById('fastStartBtn'); btn.innerHTML = '<i class="ri-stop-fill"></i> Arrêter'; btn.classList.add('danger');
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
  const btn = document.getElementById('fastStartBtn'); btn.innerHTML = '<i class="ri-play-fill"></i> Démarrer'; btn.classList.remove('danger');
  document.getElementById('timerDigits').textContent = '00:00:00';
  document.getElementById('timerLabel').textContent = 'Terminé ✨';
  document.getElementById('timerProgress').style.strokeDashoffset = '565.48';
  renderFastingHistory(); renderFastingAnalytics(); renderDashboard();
}
function updateFastingUI() {
  if (!fastingState.active) return;
  const elapsed = Date.now() - fastingState.startTime;
  const remaining = Math.max(0, fastingState.durationMs - elapsed);
  const progress = Math.min(1, elapsed / fastingState.durationMs);
  const ts = Math.floor(elapsed / 1000);
  document.getElementById('timerDigits').textContent = `${String(Math.floor(ts/3600)).padStart(2,'0')}:${String(Math.floor((ts%3600)/60)).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}`;
  document.getElementById('timerProgress').style.strokeDashoffset = 565.48 * (1 - progress);
  document.getElementById('timerLabel').textContent = remaining <= 0 ? '🎉 Objectif atteint !' : `Reste ${Math.floor(remaining/3600000)}h ${Math.floor((remaining%3600000)/60000)}min`;
  // Dashboard mirror
  const dt = document.getElementById('dashFastTimer'); if (dt) { dt.textContent = document.getElementById('timerDigits').textContent; }
  const df = document.getElementById('dashFastFill'); if (df) { df.style.width = `${progress * 100}%`; }
  const dft = document.getElementById('dashFastType'); if (dft) { const tl = { intermittent:'⏰ Intermittent', waterFast:'💧 Hydrique', juiceFast:'🧃 Jus', fruitFast:'🍎 Fruits', grapeCure:'🍇 Raisin', drySunFast:'☀️ Sec', monoFruit:'🍌 Mono-fruit' }; dft.textContent = tl[fastingState.type] || fastingState.type; }
}
function loadFastingState() {
  const saved = store.get('fasting-active', null);
  if (saved?.startTime) { fastingState = { ...saved, active: true, interval: null }; fastingState.interval = setInterval(updateFastingUI, 1000); updateFastingUI(); const btn = document.getElementById('fastStartBtn'); btn.innerHTML = '<i class="ri-stop-fill"></i> Arrêter'; btn.classList.add('danger'); }
}
function renderFastingHistory() {
  const list = document.getElementById('historyList'); if (!list) return;
  const history = store.get('fasting-history', []);
  if (history.length === 0) { list.innerHTML = '<div class="empty-state-card" style="margin-top:16px;"><i class="ri-history-line"></i><p>Aucune session enregistrée.</p></div>'; return; }
  const tl = { intermittent:'⏰', waterFast:'💧', juiceFast:'🧃', fruitFast:'🍎', grapeCure:'🍇', drySunFast:'☀️', monoFruit:'🍌' };
  list.innerHTML = '<div style="background:rgba(255,255,255,0.02); border-radius:16px; border:1px solid rgba(255,255,255,0.05); overflow:hidden;">' + history.slice(0, 10).map(h => {
    const d = new Date(h.startTime).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}); 
    return `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:16px; border-bottom:1px solid rgba(255,255,255,0.05);">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
          ${tl[h.type]||'✨'}
        </div>
        <div>
          <div style="font-weight:700; font-size:1rem; color:var(--text);">${(h.elapsed/3600000).toFixed(1)}h</div>
          <div style="font-size:0.75rem; color:var(--text-dim); margin-top:2px;">
            ${h.completed ? '<span style="color:var(--accent);"><i class="ri-checkbox-circle-fill"></i> Objectif atteint</span>' : '<span style="color:#fca5a5;"><i class="ri-stop-circle-line"></i> Arrêté plus tôt</span>'}
          </div>
        </div>
      </div>
      <div style="font-size:0.85rem; color:var(--text-dim); font-weight:500; background:rgba(0,0,0,0.2); padding:4px 10px; border-radius:20px;">
        ${d}
      </div>
    </div>`;
  }).join('') + '</div>';
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

      // Diet Plan Request card
      if (obj.dietPlanRequest) {
        const dp = obj.dietPlanRequest;
        const protoLabels = { sebi: 'Dr. Sebi ⚡', ehret: 'Arnold Ehret 🌿', morse: 'Dr. Morse 💧', personalized: 'Personnalisé 🤝' };
        return `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent)">
          <div style="font-weight:600;margin-bottom:8px">📅 Plan alimentaire proposé</div>
          <div style="font-size:0.9rem;color:var(--text-dim);margin-bottom:12px">
            <span>🏷️ ${protoLabels[dp.protocol] || dp.protocol}</span> · 
            <span>📆 ${dp.numDays} jours</span> · 
            <span>🎯 ${esc(dp.objective || '')}</span>
            ${dp.restrictions ? ` · <span>⚠️ ${esc(dp.restrictions)}</span>` : ''}
          </div>
          <button class="btn btn-primary" onclick="generatePlanFromChat('${dp.protocol}', ${dp.numDays}, '${esc(dp.objective || '')}', '${esc(dp.restrictions || '')}')">
            <i class="ri-calendar-check-line"></i> Activer et remplir mon calendrier
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
  const bubble = document.getElementById('mascotSpeechBubble');
  if (!bubble) return;
  
  const hour = new Date().getHours();
  let msg = '';
  let mood = 'talking';
  
  if (actionContext === 'scan') {
    msg = "Bravo pour ce scan ! Vérifie bien l'indice PRAL (acidité) de cet aliment.";
    mood = 'excited';
  } else if (actionContext === 'meal') {
    msg = "Repas enregistré. N'oublie pas de bien mastiquer pour aider ta digestion !";
    mood = 'proud';
  } else if (actionContext === 'fast_start') {
    msg = "C'est parti pour le jeûne ! Ton corps commence son processus de nettoyage profond. 💧";
    mood = 'loving';
  } else {
    // Time-based
    if (hour >= 5 && hour < 11) {
      msg = profile.protocol === 'vitalist' 
        ? "Bonjour ! L'heure est à l'élimination. Un jus de citron ou de céleri pour commencer ? 🍋"
        : "Bonjour ! Pense à bien t'hydrater dès le matin. 💧";
      mood = 'excited';
    } else if (hour >= 11 && hour < 15) {
      msg = "C'est le milieu de la journée. Si tu manges, privilégie des fruits riches en eau ! 🍉";
      mood = 'talking';
    } else if (hour >= 15 && hour < 19) {
      msg = "Une petite baisse d'énergie ? Quelques respirations profondes peuvent t'aider ! 🌬️";
      mood = 'questioning';
    } else {
      msg = "La soirée approche. C'est bientôt l'heure de mettre le système digestif au repos pour une bonne régénération nocturne. 🌙";
      mood = 'sleepy';
    }
  }
  
  bubble.innerHTML = msg;
  
  if (window.appMascot) {
    window.appMascot.setMood(mood, true);
    setTimeout(() => {
      if (window.appMascot) window.appMascot.setMood(mood, false);
    }, 3000);
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

// ── Diet Plan Generator ──
function buildFoodPools(restrictions = '') {
  const restrictedWords = restrictions.toLowerCase().split(/[,;/\n]/).map(s => s.trim()).filter(Boolean);
  const byCategory = {};
  vitalDb.forEach(item => {
    if (!item.specific || item.specific.electric !== true) return;
    if (!item.names || !item.names.length) return;
    const cat = item.category || 'Autres';
    if (!byCategory[cat]) byCategory[cat] = [];
    const rawName = item.names[1] || item.names[0];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    byCategory[cat].push({ name, emoji: item.emoji || '🌱' });
  });

  function clean(list, fallback) {
    const source = (list && list.length) ? list : fallback;
    const filtered = source.filter(item => {
      const n = typeof item === 'string' ? item : item.name;
      return !restrictedWords.some(r => n.toLowerCase().includes(r));
    });
    return (filtered.length ? filtered : fallback).map(x => typeof x === 'string' ? { name: x, emoji: '🌱' } : x);
  }

  return {
    fruits: clean(byCategory['Fruits'], [{name:'Papaye',emoji:'🥭'},{name:'Mangue',emoji:'🥭'},{name:'Raisin',emoji:'🍇'},{name:'Pastèque',emoji:'🍉'}]),
    veggies: clean(byCategory['Légumes'], [{name:'Kale',emoji:'🥬'},{name:'Concombre',emoji:'🥒'},{name:'Avocat',emoji:'🥑'},{name:'Roquette',emoji:'🥬'}]),
    grains: clean(byCategory['Céréales'], [{name:'Quinoa',emoji:'🌾'},{name:'Amarante',emoji:'🌾'},{name:'Sarrasin',emoji:'🌾'}]),
    herbs: clean(byCategory['Herbes & Thés'], [{name:'Tisane gingembre',emoji:'🫚'},{name:'Tisane menthe',emoji:'🍵'}]),
    nuts: clean(byCategory['Noix & Graines'], [{name:'Graines de courge',emoji:'🎃'},{name:'Graines de tournesol',emoji:'🌻'}]),
  };
}

function pick(list, dayIndex, seed, offset = 0) { return list[(dayIndex + seed + offset) % list.length]; }
function pickN(list, n, dayIndex, seed, offset = 0) {
  const out = []; const seen = new Set();
  for (let k = 0; out.length < n && k < n + list.length; k++) {
    const item = list[(dayIndex + seed + offset + k) % list.length];
    if (!seen.has(item.name)) { seen.add(item.name); out.push(item); }
  }
  return out;
}

function phaseLabel(protocol, dayIndex, numDays) {
  const ratio = numDays <= 1 ? 1.0 : dayIndex / (numDays - 1);
  const activeProtocol = Array.isArray(protocol) && protocol.length > 0 
    ? protocol[dayIndex % protocol.length] 
    : (Array.isArray(protocol) ? 'ehret' : protocol);
    
  const phases = {
    ehret: [['Élimination douce (Ehret)',0.34],['Transition mucusless (Ehret)',0.7],['Régénération (Ehret)',1]],
    sebi: [['Nettoyage alcalin (Sebi)',0.34],['Reconstruction minérale (Sebi)',0.7],['Équilibre bio-minéral (Sebi)',1]],
    morse: [['Activation lymphatique (Morse)',0.34],['Détoxification (Morse)',0.7],['Régénération cellulaire (Morse)',1]],
  };
  const p = phases[activeProtocol] || [['Mise en route',0.34],['Approfondissement',0.7],['Ancrage',1]];
  for (const [label, threshold] of p) if (ratio < threshold || threshold === 1) return label;
  return 'Ancrage';
}

function buildDay(protocol, dayIndex, numDays, date, pools, seed) {
  const { fruits, veggies, grains, herbs, nuts } = pools;
  const earlyRatio = numDays <= 1 ? 1.0 : dayIndex / (numDays - 1);
  let meals;
  const wrap = (x) => Array.isArray(x) ? x : [x];

  const activeProtocol = Array.isArray(protocol) && protocol.length > 0 
    ? protocol[dayIndex % protocol.length] 
    : (Array.isArray(protocol) ? 'ehret' : protocol);

  switch (activeProtocol) {
    case 'ehret':
      meals = [
        { slot: 'Réveil', items: [{name:'Eau tiède citronnée',emoji:'🍋'}], note: "Draine la lymphe.", done: false },
        { slot: 'Petit-déjeuner', items: pickN(fruits, earlyRatio < 0.3 ? 1 : 2, dayIndex, seed), note: 'Mono-fruit de préférence.', done: false },
        { slot: 'Déjeuner', items: [...pickN(veggies, 2, dayIndex, seed), ...(earlyRatio > 0.4 ? wrap(pick(grains, dayIndex, seed, 1)) : [])], note: 'Salade crue + féculent sans mucus.', done: false },
        { slot: 'Dîner', items: pickN(veggies, 2, dayIndex, seed, 3), note: 'Repas léger, 3h avant coucher.', done: false },
      ];
      break;
    case 'sebi':
      meals = [
        { slot: 'Réveil', items: wrap(pick(herbs, dayIndex, seed)), note: 'Tisane approuvée Dr. Sebi.', done: false },
        { slot: 'Petit-déjeuner', items: pickN(fruits, 2, dayIndex, seed), note: 'Fruits approuvés.', done: false },
        { slot: 'Déjeuner', items: [...pickN(veggies, 2, dayIndex, seed, 1), pick(grains, dayIndex, seed)], note: 'Céréale sans gluten + feuilles.', done: false },
        { slot: 'Collation', items: wrap(pick(nuts, dayIndex, seed)), note: 'Petite poignée.', done: false },
        { slot: 'Dîner', items: pickN(veggies, 2, dayIndex, seed, 2), note: 'Vapeur + huile approuvée.', done: false },
      ];
      break;
    case 'morse':
      meals = [
        { slot: 'Réveil', items: [{name:'Eau de source',emoji:'💧'}], note: 'Hydrate le système lymphatique.', done: false },
        { slot: 'Petit-déjeuner', items: pickN(fruits, 2, dayIndex, seed), note: 'Fruits astringents.', done: false },
        { slot: 'Déjeuner', items: pickN(veggies, 3, dayIndex, seed), note: 'Grande salade crue.', done: false },
        { slot: 'Collation', items: wrap(pick(fruits, dayIndex, seed, 2)), note: 'Un fruit si besoin.', done: false },
        { slot: 'Dîner', items: pickN(veggies, 2, dayIndex, seed, 1), note: 'Léger, vapeur.', done: false },
      ];
      break;
    default:
      meals = [
        { slot: 'Réveil', items: [{name:'Eau tiède citronnée',emoji:'🍋'}], note: '', done: false },
        { slot: 'Petit-déjeuner', items: pickN(fruits, 2, dayIndex, seed), note: 'Fruits frais et mûrs.', done: false },
        { slot: 'Déjeuner', items: [...pickN(veggies, 2, dayIndex, seed), pick(grains, dayIndex, seed)], note: '', done: false },
        { slot: 'Collation', items: wrap(pick(nuts, dayIndex, seed)), note: '', done: false },
        { slot: 'Dîner', items: pickN(veggies, 2, dayIndex, seed, 2), note: '', done: false },
      ];
  }
  return { dayIndex, date: date.toISOString(), phaseLabel: phaseLabel(protocol, dayIndex, numDays), meals };
}

function generateDietPlan({ protocol, numDays, objective, restrictions = '', source = 'wizard' }) {
  const proto = ['ehret','sebi','morse','personalized'].includes(protocol) ? protocol : 'personalized';
  const days = Math.max(1, Math.min(30, numDays));
  const pools = buildFoodPools(restrictions);
  const start = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const protoLabels = { sebi: 'Guide Dr. Sebi', ehret: 'Transition Ehret', morse: 'Détox Dr. Morse', personalized: 'Plan Vitaliste' };
  const daysList = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDay); d.setDate(d.getDate() + i);
    daysList.push(buildDay(proto, i, days, d, pools, 0));
  }
  return {
    id: 'plan_' + Date.now(),
    name: `${protoLabels[proto] || 'Plan Vitaliste'}${objective ? ' — ' + objective : ''}`,
    protocol: proto, objective: objective || '', startDate: start.toISOString(),
    days: daysList, isActive: true, endDate: null, source, restrictions: restrictions || '',
  };
}

// ── Calendar Rendering ──
function renderCalendar() {
  const plan = store.get('active_plan', null);
  const emptyEl = document.getElementById('calendarEmpty');
  const wizardEl = document.getElementById('calendarWizard');
  const activeEl = document.getElementById('calendarActive');
  if (!emptyEl || !activeEl) return;
  if (!plan) { emptyEl.style.display = ''; wizardEl.style.display = 'none'; activeEl.style.display = 'none'; return; }
  emptyEl.style.display = 'none'; wizardEl.style.display = 'none'; activeEl.style.display = '';

  const protoEmojis = { sebi: '⚡', ehret: '🌿', morse: '💧', personalized: '🤝' };
  const protoLabels = { sebi: 'Dr. Sebi', ehret: 'Ehret', morse: 'Dr. Morse', personalized: 'Vitaliste' };
  const totalMeals = plan.days.reduce((s, d) => s + d.meals.length, 0);
  const doneMeals = plan.days.reduce((s, d) => s + d.meals.filter(m => m.done).length, 0);
  const pct = totalMeals ? Math.round((doneMeals / totalMeals) * 100) : 0;
  const today = new Date();
  const selectedIdx = store.get('cal_selected_day', 0);
  const todayIdx = plan.days.findIndex(d => isSameDay(new Date(d.date), today));
  const daysPast = todayIdx >= 0 ? todayIdx + 1 : 0;

  activeEl.innerHTML = `
    <!-- Header Card -->
    <div class="dash-card glass" style="margin-bottom:24px; padding:24px; background: linear-gradient(145deg, rgba(30,58,138,0.1) 0%, rgba(16,185,129,0.05) 100%);">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap;">
        
        <div style="display:flex; align-items:center; gap:20px;">
          <!-- Progress Circle -->
          <div style="position:relative; width:80px; height:80px; flex-shrink:0;">
            <svg viewBox="0 0 36 36" style="transform:rotate(-90deg); width:100%; height:100%; drop-shadow: 0 4px 10px rgba(16,185,129,0.2);">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" stroke-width="3" stroke-dasharray="${pct}, 100" stroke-linecap="round" style="transition:stroke-dasharray 1s ease-out"/>
            </svg>
            <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <span style="font-weight:800; font-size:1.1rem; color:var(--text); line-height:1;">${pct}%</span>
            </div>
          </div>
          
          <!-- Plan Info -->
          <div>
            <h2 style="margin:0; font-size:1.3rem; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px;">
              ${protoEmojis[plan.protocol] || '🌱'} ${esc(plan.name)}
            </h2>
            <div style="font-size:0.85rem; color:var(--text-dim); margin-top:6px; display:flex; align-items:center; gap:12px;">
              <span><i class="ri-calendar-event-line"></i> ${plan.days.length} jours</span>
              <span><i class="ri-user-star-line"></i> ${protoLabels[plan.protocol] || 'Vitaliste'}</span>
            </div>
            <div style="font-size:0.85rem; color:var(--accent); margin-top:4px; font-weight:500;">
              <i class="ri-restaurant-2-line"></i> ${doneMeals}/${totalMeals} repas · Jour ${daysPast}/${plan.days.length}
            </div>
          </div>
        </div>
        
        <button class="chip-btn" onclick="endActivePlan()" style="border-color:rgba(239,68,68,0.3); color:#fca5a5;" data-tooltip="Terminer et archiver ce plan">
          <i class="ri-stop-circle-line"></i> Arrêter
        </button>
      </div>
    </div>

    <!-- Days Strip -->
    <div style="margin-bottom:24px; padding-bottom:12px; overflow-x:auto; -webkit-overflow-scrolling:touch; mask-image: linear-gradient(to right, black 85%, transparent 100%);">
      <div id="calDayStrip" style="display:flex; gap:12px; min-width:max-content; padding:0 4px;"></div>
    </div>
    
    <!-- Day Detail -->
    <div id="calDayDetail"></div>
  `;

  const strip = document.getElementById('calDayStrip');
  strip.innerHTML = plan.days.map((d, i) => {
    const dt = new Date(d.date); const isToday = isSameDay(dt, today);
    const allDone = d.meals.every(m => m.done); const selected = i === selectedIdx;
    const isPast = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return `<button onclick="selectCalDay(${i})" style="flex-shrink:0; width:64px; padding:12px 6px; border-radius:16px; cursor:pointer; text-align:center;
      border: 1px solid ${selected ? 'var(--accent)' : 'rgba(255,255,255,0.05)'};
      background: ${selected ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)'};
      color: var(--text); opacity: ${isPast && !selected ? '0.4' : '1'}; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative;
      box-shadow: ${selected ? '0 4px 12px rgba(16,185,129,0.1)' : 'none'};">
      <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:${isToday ? 'var(--accent)' : 'var(--text-dim)'}; font-weight:${selected||isToday ? '700' : '500'}">${isToday ? 'Auj' : DAYS_FR[dt.getDay()]}</div>
      <div style="font-size:1.3rem; font-weight:700; margin:4px 0; color:${selected ? 'var(--accent)' : 'var(--text)'}">${dt.getDate()}</div>
      <div style="display:flex; justify-content:center; gap:3px; margin-top:6px;">
        ${d.meals.map(m => `<div style="width:5px; height:5px; border-radius:50%; background:${m.done ? 'var(--accent)' : 'rgba(255,255,255,0.15)'}"></div>`).join('')}
      </div>
      ${allDone ? '<div style="position:absolute; top:-4px; right:-4px; font-size:0.6rem; background:var(--accent); color:#000; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.3);"><i class="ri-check-line"></i></div>' : ''}
    </button>`;
  }).join('');

  const selectedChip = strip.children[selectedIdx];
  if (selectedChip) selectedChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  renderCalDay(plan, selectedIdx);
}

function renderCalDay(plan, dayIdx) {
  const detail = document.getElementById('calDayDetail');
  const day = plan.days[dayIdx];
  if (!day) { detail.innerHTML = ''; return; }
  const dt = new Date(day.date); const today = new Date(); const isToday = isSameDay(dt, today);
  const completedCount = day.meals.filter(m => m.done).length;

  detail.innerHTML = `
    <div class="dash-card glass" style="padding:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:12px;">
            <h3 style="margin:0; font-size:1.3rem; font-weight:700;">${isToday ? '📍 Aujourd\'hui' : DAYS_FULL_FR[dt.getDay()]} ${dt.getDate()} ${MONTHS_FR[dt.getMonth()]}</h3>
            <span style="font-size:0.75rem; padding:4px 10px; border-radius:12px; background:rgba(16,185,129,0.1); color:var(--accent); font-weight:600; border:1px solid rgba(16,185,129,0.2);">Jour ${day.dayIndex + 1}</span>
          </div>
          <div style="font-size:0.9rem; color:var(--text-dim); margin-top:6px;"><i class="ri-magic-line" style="color:var(--accent);"></i> ${esc(day.phaseLabel)}</div>
        </div>
        <div style="display:flex; gap:8px;">
          ${isToday ? '<button class="chip-btn" onclick="addTodayToTracker()" data-tooltip="Ajouter les repas du jour au suivi"><i class="ri-add-circle-line"></i> Suivi</button>' : ''}
          <button class="chip-btn" onclick="regenerateCalDay(${dayIdx})" data-tooltip="Nouvelles suggestions"><i class="ri-refresh-line"></i></button>
        </div>
      </div>
      
      <div style="position:relative; padding-left:32px; margin-bottom:16px;">
        <div style="position:absolute; left:14px; top:12px; bottom:12px; width:2px; background:linear-gradient(to bottom, var(--accent) 0%, rgba(16,185,129,0.1) 100%); border-radius:2px;"></div>
        
        ${day.meals.map((m, mi) => {
          const meta = SLOT_META[m.slot] || { emoji: '🍽️', time: '', color: '#4ade80' };
          return `
          <div style="position:relative; margin-bottom:20px;">
            <!-- Timeline Dot -->
            <div style="position:absolute; left:-24px; top:16px; width:14px; height:14px; border-radius:50%; background:${m.done ? 'var(--accent)' : 'var(--bg-card)'}; border:2px solid var(--accent); z-index:1; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(16,185,129,0.3);">
               ${m.done ? '<div style="width:6px; height:6px; background:#000; border-radius:50%;"></div>' : ''}
            </div>
            
            <!-- Meal Card -->
            <div onclick="openEditMealModal(${dayIdx}, ${mi})" class="glass" style="
              border-radius:16px; padding:16px 20px; cursor:pointer;
              background: ${m.done ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.02)'};
              border: 1px solid ${m.done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'};
              transition: all 0.2s ease; opacity:${m.done ? '0.7' : '1'};">
              
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <div style="width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; font-size:1.4rem; border:1px solid rgba(255,255,255,0.05);">
                    ${meta.emoji}
                  </div>
                  <div>
                    <div style="font-weight:700; font-size:1.05rem; color:var(--text); ${m.done ? 'text-decoration:line-through; color:var(--text-dim);' : ''}">${esc(m.slot)}</div>
                    <div style="font-size:0.8rem; color:${meta.color}; margin-top:2px;">
                      <i class="ri-time-line"></i> ${meta.time}
                    </div>
                  </div>
                </div>
                
                <!-- Checkbox -->
                <div style="width:28px; height:28px; border-radius:8px; border:2px solid ${m.done ? 'var(--accent)' : 'rgba(255,255,255,0.15)'};
                  display:flex; align-items:center; justify-content:center; background:${m.done ? 'var(--accent)' : 'transparent'}; transition:all 0.2s;">
                  ${m.done ? '<i class="ri-check-line" style="font-size:1.1rem; color:#000; font-weight:800;"></i>' : ''}
                </div>
              </div>
              
              <div style="display:flex; flex-wrap:wrap; gap:8px; ${m.note ? 'margin-bottom:10px;' : ''}">
                ${m.items.map(item => {
                  const n = typeof item === 'string' ? item : item.name;
                  const e = typeof item === 'string' ? '🌱' : (item.emoji || '🌱');
                  return `<span style="padding:6px 12px; border-radius:24px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.15); font-size:0.85rem; color:var(--text); display:inline-flex; align-items:center; gap:6px; font-weight:500;">
                    <span>${e}</span> ${esc(n)}
                  </span>`;
                }).join('')}
              </div>
              
              ${m.note ? `<div style="font-size:0.85rem; color:var(--text-dim); font-style:italic; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:8px; border-left:2px solid rgba(255,255,255,0.1);"><i class="ri-information-line"></i> ${esc(m.note)}</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="text-align:center; padding-top:16px; border-top:1px dashed rgba(255,255,255,0.1); font-size:0.85rem; color:var(--text-dim); font-weight:500;">
        <i class="ri-flag-2-line" style="color:var(--accent);"></i> ${completedCount} sur ${day.meals.length} repas complétés
      </div>
    </div>
  `;
}

window.selectCalDay = function(idx) { store.set('cal_selected_day', idx); renderCalendar(); };

let editMealCtx = null;

window.openEditMealModal = function(dayIdx, mealIdx) {
  const plan = store.get('active_plan', null); if (!plan) return;
  const meal = plan.days[dayIdx].meals[mealIdx];
  editMealCtx = { dayIdx, mealIdx, meal: JSON.parse(JSON.stringify(meal)) };
  
  document.getElementById('editMealTitle').innerHTML = `🍽️ Éditer : ${esc(meal.slot)}`;
  document.getElementById('editMealNote').value = editMealCtx.meal.note || '';
  document.getElementById('editMealSearchInput').value = '';
  document.getElementById('editMealSearchResults').innerHTML = '';
  
  renderEditMealItems();
  updateEditMealDoneBtn();
  
  document.getElementById('editMealModal').style.display = 'flex';
};

window.closeEditMealModal = function(e) {
  if (e && e.target !== document.getElementById('editMealModal')) return;
  document.getElementById('editMealModal').style.display = 'none';
  editMealCtx = null;
};

function renderEditMealItems() {
  const container = document.getElementById('editMealItems');
  container.innerHTML = editMealCtx.meal.items.map((item, i) => {
    const n = typeof item === 'string' ? item : item.name;
    const e = typeof item === 'string' ? '🌱' : (item.emoji || '🌱');
    return `<span style="padding:6px 12px;border-radius:20px;background:rgba(255,255,255,0.06);font-size:0.85rem;display:inline-flex;align-items:center;gap:6px">
      <span>${e}</span> ${esc(n)}
      <i class="ri-close-circle-fill" style="cursor:pointer;color:var(--text-dim)" onclick="removeEditMealItem(${i})"></i>
    </span>`;
  }).join('');
}

window.removeEditMealItem = function(idx) {
  editMealCtx.meal.items.splice(idx, 1);
  renderEditMealItems();
};

window.searchEditMealFoods = function(q) {
  const res = document.getElementById('editMealSearchResults');
  if (q.length < 2) { res.innerHTML = ''; return; }
  const matches = vitalDb.filter(i => i.names && i.names.some(n => n.toLowerCase().includes(q.toLowerCase()))).slice(0,5);
  res.innerHTML = matches.map(m => `
    <div class="meal-search-item" onclick="addEditMealItem('${esc(m.names[1]||m.names[0])}', '${m.emoji||'🌱'}')">
      <span>${m.emoji||'🌱'} ${esc(m.names[1]||m.names[0])}</span>
      <i class="ri-add-circle-line"></i>
    </div>
  `).join('');
};

window.addEditMealItem = function(name, emoji) {
  editMealCtx.meal.items.push({ name, emoji });
  renderEditMealItems();
  document.getElementById('editMealSearchInput').value = '';
  document.getElementById('editMealSearchResults').innerHTML = '';
};

window.toggleEditMealDone = function() {
  editMealCtx.meal.done = !editMealCtx.meal.done;
  updateEditMealDoneBtn();
};

function updateEditMealDoneBtn() {
  const btn = document.getElementById('editMealDoneBtn');
  if (editMealCtx.meal.done) {
    btn.className = 'btn-primary';
    btn.innerHTML = '<i class="ri-check-line"></i> Terminé';
  } else {
    btn.className = 'btn-outline';
    btn.innerHTML = '<i class="ri-check-line"></i> Marquer Terminé';
  }
}

window.saveEditMeal = function() {
  if (!editMealCtx) return;
  const plan = store.get('active_plan', null);
  editMealCtx.meal.note = document.getElementById('editMealNote').value;
  plan.days[editMealCtx.dayIdx].meals[editMealCtx.mealIdx] = editMealCtx.meal;
  store.set('active_plan', plan);
  renderCalendar();
  closeEditMealModal();
};

window.regenerateCalDay = function(dayIdx) {
  const plan = store.get('active_plan', null); if (!plan) return;
  const pools = buildFoodPools(plan.restrictions);
  const dt = new Date(plan.days[dayIdx].date);
  plan.days[dayIdx] = buildDay(plan.protocol, dayIdx, plan.days.length, dt, pools, (Date.now() % 97) + 1);
  store.set('active_plan', plan); renderCalendar();
};

window.endActivePlan = function() {
  if (!confirm('Arrêter ce plan alimentaire ?')) return;
  const plan = store.get('active_plan', null);
  if (plan) { plan.isActive = false; plan.endDate = new Date().toISOString(); const h = store.get('plan_history', []); h.unshift(plan); store.set('plan_history', h); }
  store.del('active_plan'); store.set('cal_selected_day', 0); renderCalendar();
};

window.addTodayToTracker = function() {
  const plan = store.get('active_plan', null); if (!plan) return;
  const today = new Date();
  const todayPlan = plan.days.find(d => isSameDay(new Date(d.date), today)); if (!todayPlan) return;
  const meals = store.get('meals', []);
  const allItems = todayPlan.meals.flatMap(m => m.items);
  allItems.forEach(item => {
    const foodName = typeof item === 'string' ? item : item.name;
    const match = vitalDb.find(dbItem => dbItem.names && dbItem.names.some(n => n.toLowerCase() === foodName.toLowerCase()));
    meals.push({ 
      id: match?.id || Date.now().toString(), 
      name: foodName, 
      emoji: typeof item === 'string' ? (match?.emoji || '🌱') : (item.emoji || match?.emoji || '🌱'), 
      family: match?.category || match?.family || 'Plan alimentaire', 
      approved: match?.specific?.electric === true,
      electric: match?.specific?.electric === true,
      hybrid: match?.specific?.hybrid === true,
      pral: match?.scientific_defaults?.pral ?? 0,
      nova: match?.vitality?.nova ?? 4,
      timestamp: Date.now() 
    });
  });
  store.set('meals', meals); renderMeals();
  alert(`✅ ${allItems.length} aliment(s) ajouté(s) au suivi du jour !`);
};

// ── Wizard ──
let wizardStep = 0;
let wizardData = { objectives: [], protocols: [], numDays: 7, restrictions: '' };
const wizardObjectives = [
  { emoji: '🧹', label: 'Détox & nettoyage' },
  { emoji: '⚖️', label: 'Perte de poids' },
  { emoji: '⚡', label: 'Énergie & vitalité' },
  { emoji: '🌱', label: 'Transition en douceur' },
];
const wizardProtocols = [
  { id: 'ehret', emoji: '🌿', label: 'Arnold Ehret', tagline: 'Transition progressive sans mucus' },
  { id: 'sebi', emoji: '⚡', label: 'Dr. Sebi', tagline: 'Guide alcalin strict, zéro hybride' },
  { id: 'morse', emoji: '💧', label: 'Dr. Morse', tagline: 'Fruits, détox et drainage lymphatique' },
  { id: 'personalized', emoji: '🤝', label: 'Personnalisé', tagline: 'Un mélange des trois, à ton rythme' },
];
const wizardDurations = [3, 7, 14, 21];

window.showCalendarWizard = function() {
  wizardStep = 0;
  wizardData = { objectives: [], protocols: currentProtocol !== 'vitalist' ? [currentProtocol] : [], numDays: 7, restrictions: '' };
  document.getElementById('calendarEmpty').style.display = 'none';
  document.getElementById('calendarWizard').style.display = '';
  renderWizardStep();
};

function renderWizardStep() {
  const labels = [
    'Étape 1/4 — Ton objectif ? (Multi-choix possible)',
    'Étape 2/4 — Quel protocole ? (Mix possible)',
    'Étape 3/4 — Combien de jours ?',
    'Étape 4/4 — Restrictions ? (optionnel)'
  ];
  document.getElementById('wizardStepLabel').textContent = labels[wizardStep];
  [1,2,3,4].forEach(i => document.getElementById(`wizardStep${i}`).style.display = i === wizardStep + 1 ? '' : 'none');
  document.getElementById('wizardBackBtn').style.display = wizardStep > 0 ? '' : 'none';
  document.getElementById('wizardNextBtn').textContent = wizardStep === 3 ? '🌱 Générer mon plan' : 'Suivant →';

  if (wizardStep === 0) {
    document.getElementById('wizardObjectives').innerHTML = wizardObjectives.map(o => {
      const isSelected = wizardData.objectives.includes(o.label);
      return `<button class="wizard-opt ${isSelected ? 'selected' : ''}" onclick="wizardToggleObjective('${o.label}')" style="
        display:flex;align-items:center;gap:12px;padding:14px 18px;border-radius:12px;border:2px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
        background:${isSelected ? 'rgba(var(--accent-rgb,74,222,128),0.1)' : 'rgba(255,255,255,0.03)'};
        cursor:pointer;width:100%;margin-bottom:8px;color:var(--text);font-size:0.95rem;text-align:left">
        <span style="font-size:1.5rem">${o.emoji}</span> ${o.label}
        ${isSelected ? '<i class="ri-checkbox-circle-fill" style="margin-left:auto;color:var(--accent);font-size:1.2rem"></i>' : ''}
      </button>`;
    }).join('');
  }
  if (wizardStep === 1) {
    document.getElementById('wizardProtocols').innerHTML = wizardProtocols.map(p => {
      const isSelected = wizardData.protocols.includes(p.id);
      return `<button class="wizard-opt ${isSelected ? 'selected' : ''}" onclick="wizardToggleProtocol('${p.id}')" style="
        display:flex;flex-direction:column;gap:4px;padding:14px 18px;border-radius:12px;border:2px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
        background:${isSelected ? 'rgba(var(--accent-rgb,74,222,128),0.1)' : 'rgba(255,255,255,0.03)'};
        cursor:pointer;width:100%;margin-bottom:8px;color:var(--text);text-align:left;position:relative">
        <div style="display:flex;align-items:center;gap:8px;font-size:1rem"><span style="font-size:1.3rem">${p.emoji}</span> <strong>${p.label}</strong></div>
        <div style="font-size:0.8rem;color:var(--text-dim);padding-right:20px">${p.tagline}</div>
        ${isSelected ? '<i class="ri-checkbox-circle-fill" style="position:absolute;top:14px;right:18px;color:var(--accent);font-size:1.2rem"></i>' : ''}
      </button>`;
    }).join('');
  }
  if (wizardStep === 2) {
    document.getElementById('wizardDurations').innerHTML = wizardDurations.map(d => `
      <button class="wizard-opt ${wizardData.numDays === d ? 'selected' : ''}" onclick="wizardSelectDuration(${d})" style="
        padding:16px 24px;border-radius:12px;border:2px solid ${wizardData.numDays === d ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
        background:${wizardData.numDays === d ? 'rgba(var(--accent-rgb,74,222,128),0.1)' : 'rgba(255,255,255,0.03)'};
        cursor:pointer;margin:4px;color:var(--text);font-size:1.1rem;font-weight:600;min-width:80px">
        ${d} jours
      </button>`).join('');
  }
}

window.wizardToggleObjective = function(label) {
  if (wizardData.objectives.includes(label)) wizardData.objectives = wizardData.objectives.filter(x => x !== label);
  else wizardData.objectives.push(label);
  renderWizardStep(); 
};
window.wizardToggleProtocol = function(id) {
  if (wizardData.protocols.includes(id)) wizardData.protocols = wizardData.protocols.filter(x => x !== id);
  else wizardData.protocols.push(id);
  renderWizardStep(); 
};
window.wizardSelectDuration = function(d) { wizardData.numDays = d; renderWizardStep(); };

window.wizardNext = function() {
  if (wizardStep === 0 && wizardData.objectives.length === 0) { alert('Choisis au moins un objectif !'); return; }
  if (wizardStep === 1 && wizardData.protocols.length === 0) { alert('Choisis au moins un protocole !'); return; }
  if (wizardStep < 3) { wizardStep++; renderWizardStep(); return; }
  wizardData.restrictions = document.getElementById('wizardRestrictions')?.value || '';
  const plan = generateDietPlan({ protocol: wizardData.protocols, numDays: wizardData.numDays, objective: wizardData.objectives.join(' & '), restrictions: wizardData.restrictions, source: 'wizard' });
  store.set('active_plan', plan); store.set('cal_selected_day', 0);
  document.getElementById('calendarWizard').style.display = 'none';
  renderCalendar();
};
window.wizardBack = function() { if (wizardStep > 0) { wizardStep--; renderWizardStep(); } };

// ── Chat integration ──
window.generatePlanFromChat = function(protocol, numDays, objective, restrictions) {
  const plan = generateDietPlan({ protocol, numDays, objective, restrictions, source: 'chat' });
  store.set('active_plan', plan); store.set('cal_selected_day', 0);
  showPage('calendar');
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

// ═══════ WEIGHT TRACKING ═══════
window.promptWeightEntry = function() {
  const wStr = prompt('Entrez votre poids du jour (en kg, ex: 72.5) :');
  if (!wStr) return;
  const w = parseFloat(wStr.replace(',', '.'));
  if (isNaN(w) || w <= 0 || w > 300) { alert('Poids invalide.'); return; }
  
  const history = store.get('weight_history', []);
  history.push({ date: new Date().toISOString(), weight: w });
  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  store.set('weight_history', history);
  renderWeightChart();
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
