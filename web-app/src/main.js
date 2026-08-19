/**
 * VitalTrack Web App — Complete Feature Set
 * Dashboard, Chat IA, Recherche, Repas, Favoris, Jeûne (programs+analytics+coach),
 * Respiration (history), Modes/Protocoles, Profil, Food Detail Modal (3 tabs)
 */

import { RAINTREE_HERBS, RAINTREE_PROTOCOLS } from './raintree-data.js';
import { t, getLanguage, setLanguage, toggleLanguage, onLanguageChange } from './i18n.js';
import { pigeonNudges } from './mascot-nudges.js';

// Exposer globalement pour l'interface utilisateur
window.vitalTrackI18n = { t, getLanguage, setLanguage, toggleLanguage, onLanguageChange };
window.pigeonNudges = pigeonNudges;

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

// ═══════ GLOBAL VITAL CONFIRM MODAL ═══════
window.showVitalConfirm = function({
  title = 'Confirmation',
  message = 'Voulez-vous vraiment continuer ?',
  icon = 'ri-alert-fill',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDanger = true
} = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById('vitalConfirmModal');
    if (!modal) {
      resolve(true);
      return;
    }
    const titleEl = document.getElementById('vitalConfirmTitle');
    const bodyEl = document.getElementById('vitalConfirmBody');
    const iconEl = document.getElementById('vitalConfirmIcon');
    const iconBox = document.getElementById('vitalConfirmIconBox');
    const cancelBtn = document.getElementById('vitalConfirmCancelBtn');
    const actionBtn = document.getElementById('vitalConfirmActionBtn');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = message;
    if (iconEl) iconEl.className = icon;
    if (iconBox) {
      iconBox.className = isDanger ? 'vital-confirm-icon-box' : 'vital-confirm-icon-box info';
    }
    if (cancelBtn) cancelBtn.textContent = cancelText;
    if (actionBtn) {
      actionBtn.textContent = confirmText;
      actionBtn.className = isDanger ? 'vital-confirm-btn-action' : 'vital-confirm-btn-action primary';
    }

    const cleanup = () => {
      modal.classList.remove('show');
      cancelBtn.onclick = null;
      actionBtn.onclick = null;
      document.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    actionBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        cleanup();
        resolve(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    modal.classList.add('show');
  });
};

// ═══════ VITAL CUSTOM DATE PICKER ═══════
const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const WEEKDAYS_SHORT_FR = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

window.initVitalDatePicker = function(inputEl) {
  if (!inputEl || inputEl._vitalDatePickerInitialized) return;
  inputEl._vitalDatePickerInitialized = true;

  let currentDate = inputEl.value ? new Date(inputEl.value + 'T12:00:00') : new Date();
  if (isNaN(currentDate.getTime())) currentDate = new Date();

  inputEl.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'vital-datepicker-wrap';
  inputEl.parentNode.insertBefore(wrap, inputEl.nextSibling);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'vital-datepicker-trigger';
  wrap.appendChild(trigger);

  const popover = document.createElement('div');
  popover.className = 'vital-datepicker-popover';
  popover.style.display = 'none';
  wrap.appendChild(popover);

  let viewYear = currentDate.getFullYear();
  let viewMonth = currentDate.getMonth();

  function formatDisplayDate(d) {
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const dStr = d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (isToday) return `Aujourd'hui (${dStr})`;
    if (isYesterday) return `Hier (${dStr})`;
    return dStr;
  }

  function updateTrigger() {
    const val = inputEl.value;
    let d = val ? new Date(val + 'T12:00:00') : new Date();
    if (isNaN(d.getTime())) d = new Date();
    trigger.innerHTML = `
      <div class="vital-datepicker-trigger-val">
        <span class="vital-datepicker-icon"><i class="ri-calendar-event-fill"></i></span>
        <span>${formatDisplayDate(d)}</span>
      </div>
      <i class="ri-arrow-down-s-line vital-datepicker-chevron"></i>
    `;
  }

  function setDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    inputEl.value = dateStr;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    currentDate = d;
    viewYear = d.getFullYear();
    viewMonth = d.getMonth();
    updateTrigger();
    closePopover();
  }

  function renderCalendar() {
    const today = new Date();
    const selectedVal = inputEl.value;
    const selectedDate = selectedVal ? new Date(selectedVal + 'T12:00:00') : null;

    const isTodaySelected = selectedDate && selectedDate.toDateString() === today.toDateString();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const isYesterdaySelected = selectedDate && selectedDate.toDateString() === yesterday.toDateString();
    const dayBefore = new Date(); dayBefore.setDate(today.getDate() - 2);
    const isDayBeforeSelected = selectedDate && selectedDate.toDateString() === dayBefore.toDateString();

    let html = `
      <div class="vital-datepicker-presets">
        <button type="button" class="vital-preset-chip ${isTodaySelected ? 'active' : ''}" data-preset="today">Aujourd'hui</button>
        <button type="button" class="vital-preset-chip ${isYesterdaySelected ? 'active' : ''}" data-preset="yesterday">Hier</button>
        <button type="button" class="vital-preset-chip ${isDayBeforeSelected ? 'active' : ''}" data-preset="dayBefore">Avant-hier</button>
      </div>

      <div class="vital-datepicker-header">
        <div class="vital-datepicker-nav-group">
          <button type="button" class="vital-datepicker-nav" data-nav="prev-year" title="Année précédente"><i class="ri-skip-back-line"></i></button>
          <button type="button" class="vital-datepicker-nav" data-nav="prev-month" title="Mois précédent"><i class="ri-arrow-left-s-line"></i></button>
        </div>

        <div class="vital-datepicker-selectors">
          <select class="vital-dp-select vital-dp-select-month" aria-label="Choisir le mois">
            ${MONTH_NAMES_FR.map((name, i) => `<option value="${i}" ${i === viewMonth ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
          <select class="vital-dp-select vital-dp-select-year" aria-label="Choisir l'année">
            ${Array.from({ length: 30 }, (_, k) => {
              const y = (new Date().getFullYear() - 15) + k;
              return `<option value="${y}" ${y === viewYear ? 'selected' : ''}>${y}</option>`;
            }).join('')}
          </select>
        </div>

        <div class="vital-datepicker-nav-group">
          <button type="button" class="vital-datepicker-nav" data-nav="next-month" title="Mois suivant"><i class="ri-arrow-right-s-line"></i></button>
          <button type="button" class="vital-datepicker-nav" data-nav="next-year" title="Année suivante"><i class="ri-skip-forward-line"></i></button>
        </div>
      </div>

      <div class="vital-datepicker-weekdays">
        ${WEEKDAYS_SHORT_FR.map(w => `<div class="vital-datepicker-wd">${w}</div>`).join('')}
      </div>

      <div class="vital-datepicker-days">
    `;

    const firstDay = new Date(viewYear, viewMonth, 1);
    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = (startDayOfWeek + 6) % 7;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = daysInPrevMonth - i;
      html += `<button type="button" class="vital-datepicker-day other-month" data-action="prev-month-day" data-day="${pDay}">${pDay}</button>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const isCurrentToday = d.toDateString() === today.toDateString();
      const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
      
      let classes = ['vital-datepicker-day'];
      if (isCurrentToday) classes.push('today');
      if (isSelected) classes.push('selected');

      html += `<button type="button" class="${classes.join(' ')}" data-action="pick-day" data-day="${day}">${day}</button>`;
    }

    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      html += `<button type="button" class="vital-datepicker-day other-month" data-action="next-month-day" data-day="${day}">${day}</button>`;
    }

    html += `</div>`;
    popover.innerHTML = html;

    popover.querySelectorAll('[data-preset]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const p = btn.dataset.preset;
        const target = new Date();
        if (p === 'yesterday') target.setDate(target.getDate() - 1);
        if (p === 'dayBefore') target.setDate(target.getDate() - 2);
        setDate(target);
      };
    });

    const monthSel = popover.querySelector('.vital-dp-select-month');
    if (monthSel) {
      monthSel.onchange = (e) => {
        e.stopPropagation();
        viewMonth = parseInt(e.target.value);
        renderCalendar();
      };
      monthSel.onclick = (e) => e.stopPropagation();
    }

    const yearSel = popover.querySelector('.vital-dp-select-year');
    if (yearSel) {
      yearSel.onchange = (e) => {
        e.stopPropagation();
        viewYear = parseInt(e.target.value);
        renderCalendar();
      };
      yearSel.onclick = (e) => e.stopPropagation();
    }

    const prevYearBtn = popover.querySelector('[data-nav="prev-year"]');
    if (prevYearBtn) {
      prevYearBtn.onclick = (e) => {
        e.stopPropagation();
        viewYear--;
        renderCalendar();
      };
    }

    const nextYearBtn = popover.querySelector('[data-nav="next-year"]');
    if (nextYearBtn) {
      nextYearBtn.onclick = (e) => {
        e.stopPropagation();
        viewYear++;
        renderCalendar();
      };
    }

    const prevMonthBtn = popover.querySelector('[data-nav="prev-month"]');
    if (prevMonthBtn) {
      prevMonthBtn.onclick = (e) => {
        e.stopPropagation();
        viewMonth--;
        if (viewMonth < 0) {
          viewMonth = 11;
          viewYear--;
        }
        renderCalendar();
      };
    }

    const nextMonthBtn = popover.querySelector('[data-nav="next-month"]');
    if (nextMonthBtn) {
      nextMonthBtn.onclick = (e) => {
        e.stopPropagation();
        viewMonth++;
        if (viewMonth > 11) {
          viewMonth = 0;
          viewYear++;
        }
        renderCalendar();
      };
    }

    popover.querySelectorAll('[data-action="pick-day"]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const day = parseInt(btn.dataset.day);
        const target = new Date(viewYear, viewMonth, day);
        setDate(target);
      };
    });

    popover.querySelectorAll('[data-action="prev-month-day"]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const day = parseInt(btn.dataset.day);
        let m = viewMonth - 1;
        let y = viewYear;
        if (m < 0) { m = 11; y--; }
        setDate(new Date(y, m, day));
      };
    });

    popover.querySelectorAll('[data-action="next-month-day"]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const day = parseInt(btn.dataset.day);
        let m = viewMonth + 1;
        let y = viewYear;
        if (m > 11) { m = 0; y++; }
        setDate(new Date(y, m, day));
      };
    });
  }

  function openPopover() {
    document.querySelectorAll('.vital-datepicker-popover').forEach(p => {
      if (p !== popover) p.style.display = 'none';
    });
    document.querySelectorAll('.vital-datepicker-trigger').forEach(t => {
      if (t !== trigger) t.classList.remove('active');
    });
    const val = inputEl.value;
    if (val) {
      const d = new Date(val + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        viewYear = d.getFullYear();
        viewMonth = d.getMonth();
      }
    }
    renderCalendar();
    popover.style.display = 'block';
    trigger.classList.add('active');
  }

  function closePopover() {
    popover.style.display = 'none';
    trigger.classList.remove('active');
  }

  trigger.onclick = (e) => {
    e.stopPropagation();
    if (popover.style.display === 'none' || !popover.style.display) {
      openPopover();
    } else {
      closePopover();
    }
  };

  inputEl._updateVitalDatePicker = () => {
    updateTrigger();
  };

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      closePopover();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopover();
  });

  updateTrigger();
};

window.initAllVitalDatePickers = function() {
  document.querySelectorAll('input[type="date"], input.vital-datepicker-input, #calMealDate, #weightDateInput').forEach(input => {
    window.initVitalDatePicker(input);
  });
};

// ═══════ VITAL CUSTOM SELECT / DROPDOWN ═══════
window.initVitalSelect = function(selectEl) {
  if (!selectEl || selectEl._vitalSelectInitialized) return;
  selectEl._vitalSelectInitialized = true;

  selectEl.style.display = 'none';

  const wrap = document.createElement('div');
  wrap.className = 'vital-select-wrap';
  selectEl.parentNode.insertBefore(wrap, selectEl.nextSibling);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'vital-select-trigger';
  wrap.appendChild(trigger);

  const menu = document.createElement('div');
  menu.className = 'vital-select-menu';
  menu.style.display = 'none';
  wrap.appendChild(menu);

  function updateTrigger() {
    const selectedOpt = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
    const text = selectedOpt ? selectedOpt.textContent : '';
    trigger.innerHTML = `
      <div class="vital-select-trigger-text">${text}</div>
      <i class="ri-arrow-down-s-line vital-select-chevron"></i>
    `;
  }

  function renderMenu() {
    menu.innerHTML = Array.from(selectEl.options).map((opt, idx) => {
      const isSelected = idx === selectEl.selectedIndex;
      return `
        <div class="vital-select-option ${isSelected ? 'selected' : ''}" data-idx="${idx}" data-val="${opt.value}">
          <span>${opt.textContent}</span>
          ${isSelected ? '<i class="ri-check-line vital-select-check"></i>' : ''}
        </div>
      `;
    }).join('');

    menu.querySelectorAll('.vital-select-option').forEach(item => {
      item.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.idx);
        selectEl.selectedIndex = idx;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        selectEl.dispatchEvent(new Event('input', { bubbles: true }));
        updateTrigger();
        closeMenu();
      };
    });
  }

  function openMenu() {
    document.querySelectorAll('.vital-select-menu').forEach(m => {
      if (m !== menu) m.style.display = 'none';
    });
    document.querySelectorAll('.vital-select-trigger').forEach(t => {
      if (t !== trigger) t.classList.remove('active');
    });
    renderMenu();
    menu.style.display = 'block';
    trigger.classList.add('active');
  }

  function closeMenu() {
    menu.style.display = 'none';
    trigger.classList.remove('active');
  }

  trigger.onclick = (e) => {
    e.stopPropagation();
    if (menu.style.display === 'none' || !menu.style.display) {
      openMenu();
    } else {
      closeMenu();
    }
  };

  selectEl._updateVitalSelect = () => {
    updateTrigger();
  };

  selectEl.addEventListener('change', () => {
    updateTrigger();
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  updateTrigger();
};

window.initAllVitalSelects = function() {
  document.querySelectorAll('select.custom-vital-select, select.sort-select, #fastingType, #searchSortSelect, #profileGoal, #profileTransitionLevel, #profileActivity, #profileBioregion').forEach(sel => {
    window.initVitalSelect(sel);
  });
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

  // Initialize Custom Controls
  initAllVitalDatePickers();
  initAllVitalSelects();
  initFastingDurationControls();
  
  if (window.VitalMascot) {
    window.appMascot = new window.VitalMascot('mascotCanvas');
  }

  updateProactiveMascot();

  // Évaluation circadienne initiale après chargement (non-intrusive)
  setTimeout(() => {
    if (window.pigeonNudges) window.pigeonNudges.evaluateCircadian();
  }, 7000);

  // Render welcome pigeon portrait
  const welcomeEl = document.getElementById('welcomeMascotPortrait');
  if (welcomeEl && window.renderPigeonPortrait) {
    welcomeEl.innerHTML = window.renderPigeonPortrait(64, 'talking');
  }
  renderResources();

  // Safety warning listener
  const durationInput = document.getElementById('fastingDuration');
  if (durationInput) {
    durationInput.addEventListener('input', () => {
      window.onFastingDurationChange?.();
    });
  }

  try {
    const resp = await fetch('/vital_ranking.json');
    if (resp.ok) {
      const baseDb = await resp.json();
      const customDb = store.get('customFoods', []);
      vitalDb = [...baseDb, ...customDb];
      populateVitalApprovedFoods();
      buildSearchIndex();
      initSearchPage();
      renderRaintreeExplorer();
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
  if (page === 'meals') renderMeals();
  if (page === 'calendar') renderCalendar();
  if (page === 'materia-medica') renderRaintreeExplorer();
  if (page === 'chat') initChatMascot();
};

let _chatMascotRenderer = null;
function initChatMascot() {
  const canvas = document.getElementById('chatMascotCanvas');
  if (canvas && window.PigeonRenderer && !_chatMascotRenderer) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 40 * dpr;
    canvas.height = 48 * dpr;
    canvas.style.width = '40px';
    canvas.style.height = '48px';
    _chatMascotRenderer = new window.PigeonRenderer(canvas);
    _chatMascotRenderer.setAction('idle');
  }
}

window.toggleMobileNav = function() { document.getElementById('mobileNav').classList.toggle('open'); };

// ═══════ THEME ═══════
window.toggleTheme = function() {
  const isDark = !document.documentElement.hasAttribute('data-theme');
  if (isDark) { document.documentElement.setAttribute('data-theme', 'light'); store.set('theme', 'light'); document.getElementById('themeIcon').className = 'ri-sun-line'; }
  else { document.documentElement.removeAttribute('data-theme'); store.set('theme', 'dark'); document.getElementById('themeIcon').className = 'ri-moon-line'; }
};
function loadTheme() { if (store.get('theme') === 'light') { document.documentElement.setAttribute('data-theme', 'light'); document.getElementById('themeIcon').className = 'ri-sun-line'; } }

// ═══════ PROFILE & BIO-MEMORY ENGINE ═══════
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

  let organs = ['reins', 'lymphe'];
  if (Array.isArray(p.targetOrgans) && p.targetOrgans.length > 0) organs = p.targetOrgans;

  return {
    name: p.name || '',
    goal: p.goal || 'detox',
    protocol: currentProtocol || p.protocol || 'vitalist',
    transitionLevel: p.transitionLevel || 'intermediate',
    height: p.height || '',
    currentWeight: p.currentWeight || '',
    targetWeight: p.targetWeight || '',
    age: p.age || '',
    activityLevel: p.activityLevel || 'moderate',
    targetOrgans: organs,
    country: p.country || 'Canada 🍁',
    city: p.city || 'Montréal',
    bioregion: p.bioregion || 'boreal',
    season: p.season || defaultSeason,
    restrictions: p.restrictions || '',
    memories: mems
  };
}

function loadProfile() {
  const p = getUserProfile();
  if (document.getElementById('profileName')) document.getElementById('profileName').value = p.name || '';
  if (document.getElementById('profileGoal')) document.getElementById('profileGoal').value = p.goal || 'detox';
  if (document.getElementById('profileTransitionLevel')) document.getElementById('profileTransitionLevel').value = p.transitionLevel || 'intermediate';
  if (document.getElementById('profileHeight')) document.getElementById('profileHeight').value = p.height || '';
  if (document.getElementById('profileCurrentWeight')) document.getElementById('profileCurrentWeight').value = p.currentWeight || '';
  if (document.getElementById('profileTargetWeight')) document.getElementById('profileTargetWeight').value = p.targetWeight || '';
  if (document.getElementById('profileAge')) document.getElementById('profileAge').value = p.age || '';
  if (document.getElementById('profileActivity')) document.getElementById('profileActivity').value = p.activityLevel || 'moderate';
  if (document.getElementById('profileCountry')) document.getElementById('profileCountry').value = p.country || 'Canada 🍁';
  if (document.getElementById('profileCity')) document.getElementById('profileCity').value = p.city || 'Montréal';
  if (document.getElementById('profileBioregion')) document.getElementById('profileBioregion').value = p.bioregion || 'boreal';
  if (document.getElementById('profileRestrictions')) document.getElementById('profileRestrictions').value = p.restrictions || '';
  if (document.getElementById('profileMemories')) {
    document.getElementById('profileMemories').value = Array.isArray(p.memories) ? p.memories.join('\n') : (p.memories || '');
  }

  // Restore emonctoires chips
  const activeOrgans = p.targetOrgans || ['reins', 'lymphe'];
  document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip').forEach(chip => {
    const organ = chip.dataset.organ;
    chip.classList.toggle('active', activeOrgans.includes(organ));
  });

  // Refresh all custom vital-select UI triggers
  ['profileGoal', 'profileTransitionLevel', 'profileActivity', 'profileBioregion'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el._updateVitalSelect) el._updateVitalSelect();
  });

  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} ! 👋` : 'Salut ! 👋';
  updateLiveAiPreview();
}

window.toggleEmonctoireChip = function(el) {
  if (!el) return;
  el.classList.toggle('active');
  updateLiveAiPreview();
};

window.toggleAiPreviewBox = function() {
  const box = document.getElementById('aiPreviewBox');
  const chevron = document.getElementById('aiPreviewChevron');
  if (!box) return;
  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'block' : 'none';
  if (chevron) chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
};

window.updateLiveAiPreview = function() {
  const preview = document.getElementById('aiPreviewBox');
  if (!preview) return;

  const name = document.getElementById('profileName')?.value.trim() || 'Inconnu';
  const goalEl = document.getElementById('profileGoal');
  const goal = goalEl ? goalEl.options[goalEl.selectedIndex]?.text : 'Détox & Vitalité';
  const transEl = document.getElementById('profileTransitionLevel');
  const transLevel = transEl ? transEl.options[transEl.selectedIndex]?.text : 'Intermédiaire';
  const city = document.getElementById('profileCity')?.value.trim() || 'Montréal';
  const country = document.getElementById('profileCountry')?.value.trim() || 'Canada 🍁';
  const bioregionEl = document.getElementById('profileBioregion');
  const bioregion = bioregionEl ? bioregionEl.options[bioregionEl.selectedIndex]?.text : 'Boréale';

  const activeChips = Array.from(document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip.active'));
  const organs = activeChips.map(c => c.textContent.trim()).join(', ') || 'Système global (Reins & Lymphe)';

  const height = document.getElementById('profileHeight')?.value.trim();
  const curW = document.getElementById('profileCurrentWeight')?.value.trim();
  const tarW = document.getElementById('profileTargetWeight')?.value.trim();
  const age = document.getElementById('profileAge')?.value.trim();
  const actEl = document.getElementById('profileActivity');
  const activity = actEl ? actEl.options[actEl.selectedIndex]?.text : 'Modéré';

  let morpho = [];
  if (height) morpho.push(`Taille: ${height}cm`);
  if (curW) morpho.push(`Poids: ${curW}kg`);
  if (tarW) morpho.push(`Cible: ${tarW}kg`);
  if (age) morpho.push(`Âge: ${age}ans`);
  if (activity) morpho.push(`Activité: ${activity}`);

  const restrictions = document.getElementById('profileRestrictions')?.value.trim() || 'Aucune restriction déclarée';
  const rawMems = document.getElementById('profileMemories')?.value.trim() || '';

  const generatedPrompt = `[CONTEXTE & BIO-PROFIL DE L'UTILISATEUR]
Nom: ${name}
Localisation: ${city}, ${country} (Biorégion: ${bioregion})
Objectif Majeur: ${goal}
Niveau de Transition: ${transLevel}
Émonctoires Prioritaires: ${organs}${morpho.length > 0 ? `\nMorphologie & Métabolisme: ${morpho.join(' | ')}` : ''}
Restrictions Strictes: ${restrictions}${rawMems ? `\nHabitudes Mémorisées:\n- ${rawMems.split('\n').join('\n- ')}` : ''}
[DIRECTIVE COACHING] : Adapter systématiquement l'agressivité des détox, le protocole de jeûne et les plantes médicinales Raintree aux émonctoires prioritaires et au niveau de transition.`;

  preview.textContent = generatedPrompt;
};

window.saveProfile = function() {
  const rawMems = document.getElementById('profileMemories') ? document.getElementById('profileMemories').value : '';
  const mems = rawMems.split('\n').map(s => s.trim()).filter(Boolean);

  const activeChips = Array.from(document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip.active'));
  const targetOrgans = activeChips.map(c => c.dataset.organ);

  const p = {
    name: document.getElementById('profileName') ? document.getElementById('profileName').value.trim() : '',
    goal: document.getElementById('profileGoal') ? document.getElementById('profileGoal').value : 'detox',
    transitionLevel: document.getElementById('profileTransitionLevel') ? document.getElementById('profileTransitionLevel').value : 'intermediate',
    height: document.getElementById('profileHeight') ? document.getElementById('profileHeight').value.trim() : '',
    currentWeight: document.getElementById('profileCurrentWeight') ? document.getElementById('profileCurrentWeight').value.trim() : '',
    targetWeight: document.getElementById('profileTargetWeight') ? document.getElementById('profileTargetWeight').value.trim() : '',
    age: document.getElementById('profileAge') ? document.getElementById('profileAge').value.trim() : '',
    activityLevel: document.getElementById('profileActivity') ? document.getElementById('profileActivity').value : 'moderate',
    targetOrgans: targetOrgans.length > 0 ? targetOrgans : ['reins', 'lymphe'],
    country: document.getElementById('profileCountry') ? document.getElementById('profileCountry').value.trim() : 'Canada 🍁',
    city: document.getElementById('profileCity') ? document.getElementById('profileCity').value.trim() : 'Montréal',
    bioregion: document.getElementById('profileBioregion') ? document.getElementById('profileBioregion').value : 'boreal',
    restrictions: document.getElementById('profileRestrictions') ? document.getElementById('profileRestrictions').value.trim() : '',
    memories: mems
  };
  store.set('profile', p);

  if (document.getElementById('greetName')) document.getElementById('greetName').textContent = p.name ? `Salut ${p.name} ! 👋` : 'Salut ! 👋';
  updateLiveAiPreview();
  if (window.renderWeightChart) window.renderWeightChart();
  showToast('✅ Bio-Profil & Directives IA sauvegardés !', 'success');
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
        const rawItems = m.items || m.ingredients || [];
        let itemsPreview = '';
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const formatted = rawItems.map(it => typeof it === 'string' ? it : (it.name || '')).filter(Boolean);
          if (formatted.length > 0) {
            itemsPreview = `<div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:240px;">
              <span style="color:var(--accent);">🥗</span> ${esc(formatted.join(' · '))}
            </div>`;
          }
        }
        return `<div class="meal-item clickable" onclick="openFoodModalFromMeal(${idx})" style="cursor:pointer;" title="Cliquer pour ouvrir la fiche détaillée">
          <span class="food-emoji">${m.emoji || '🍽️'}</span>
          <div class="meal-item-info" style="flex:1; min-width:0;">
            <div class="meal-item-name">${esc(m.name)}</div>
            ${itemsPreview}
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

  // Le Pigeon passe en mode réflexion / analyse
  if (_chatMascotRenderer) {
    _chatMascotRenderer.setAction('think', true);
  }

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
    if (_chatMascotRenderer) _chatMascotRenderer.setAction('idle', false);
  } finally { 
    sendBtn.disabled = false; 
    input.focus();
    if (_chatMascotRenderer) _chatMascotRenderer.setAction('coo', false);
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
  const typingAvatar = window.renderPigeonPortrait ? window.renderPigeonPortrait(28, 'talking') : '🐦';
  div.innerHTML = `
    <div class="message-avatar">${typingAvatar}</div>
    <div class="message-bubble" style="display:flex; align-items:center; gap:10px; padding:10px 16px;">
      <span style="font-size:0.82rem; color:var(--text-dim); font-weight:600;"><i class="ri-search-eye-line" style="color:#34d399;"></i> Arnold inspecte la mémoire &amp; analyse...</span>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;
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

// Fuzzy search: find items where names match query with precision
function fuzzySearch(q) {
  const matched = new Set();
  const qClean = (q || '').trim().toLowerCase();
  if (!qClean) return [];
  const qWords = qClean.split(/\s+/).filter(w => w.length > 0);

  vitalDb.forEach((item, idx) => {
    const names = item.names || [item.name || ''];
    for (const name of names) {
      const lower = name.toLowerCase();
      
      // 1. Substring exact match of the entire search query
      if (lower.includes(qClean)) {
        matched.add(idx);
        break;
      }

      // 2. Multi-word queries: ALL query words must match a word in the item's name
      if (qWords.length > 1) {
        const itemWords = lower.split(/\s+/).filter(w => w.length > 0);
        const allWordsMatched = qWords.every(qw => {
          if (qw.length < 3) return lower.includes(qw);
          return itemWords.some(iw => {
            if (iw.includes(qw) || qw.includes(iw)) return true;
            if (iw.length >= 3) {
              const maxDist = qw.length <= 4 ? 1 : 2;
              return levenshtein(qw, iw) <= maxDist;
            }
            return false;
          });
        });
        if (allWordsMatched) {
          matched.add(idx);
          break;
        }
      } else if (qWords.length === 1) {
        // Single word query fuzzy matching
        const qw = qWords[0];
        if (qw.length >= 3) {
          const itemWords = lower.split(/\s+/).filter(w => w.length > 0);
          for (const w of itemWords) {
            if (w.length < 3) continue;
            if (levenshtein(qw, w) <= (qw.length <= 4 ? 1 : 2)) {
              matched.add(idx);
              break;
            }
          }
          if (matched.has(idx)) break;
        }
      }
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
  const favs = store.get('favorites', []);
  const favIds = new Set(favs.map(f => f.id));
  const favNames = new Set(favs.map(f => (f.name || '').toLowerCase()));
  return matches.filter(item => {
    const sp = item.specific || {};
    const sc = item.scientific_defaults || item.scientific || {};
    const pral = sc.pral ?? (item.pral ?? 0);
    const nameLower = (item.names?.[0] || item.name || '').toLowerCase();
    const isE = sp.electric === true || item.electric === true || item.approved === true;
    const isH = sp.hybrid === true || item.hybrid === true;
    const mucusStr = (sp.mucus || item.mucus || '').toLowerCase();
    const isDissolvant = mucusStr.includes('dissolvant') || mucusStr.includes('non-muc');
    const isAlcalin = pral < 0 || isDissolvant || isE;
    const isMucus = mucusStr.includes('mucog') || pral > 2.5;

    if (currentSearchFilter === 'favorites') return (item.id && favIds.has(item.id)) || favNames.has(nameLower);
    if (currentSearchFilter === 'electric') return isE;
    if (currentSearchFilter === 'hybrid') return isH;
    if (currentSearchFilter === 'alkaline') return isAlcalin;
    if (currentSearchFilter === 'mucus') return isMucus && !isE && !isDissolvant && pral > 0;
    return true;
  });
}

// Sort a list of items by current sort select value
function applySortItems(items) {
  const sort = document.getElementById('searchSortSelect')?.value || 'relevance';
  const sorted = [...items];
  if (sort === 'pral-asc') sorted.sort((a, b) => (a.scientific_defaults?.pral ?? (a.scientific?.pral ?? (a.pral ?? 0))) - (b.scientific_defaults?.pral ?? (b.scientific?.pral ?? (b.pral ?? 0))));
  else if (sort === 'pral-desc') sorted.sort((a, b) => (b.scientific_defaults?.pral ?? (b.scientific?.pral ?? (b.pral ?? 0))) - (a.scientific_defaults?.pral ?? (a.scientific?.pral ?? (a.pral ?? 0))));
  else if (sort === 'nova-asc') sorted.sort((a, b) => (a.vitality?.nova ?? (a.nova ?? 4)) - (b.vitality?.nova ?? (b.nova ?? 4)));
  else if (sort === 'freshness-desc') sorted.sort((a, b) => (b.vitality?.freshness ?? (b.freshness ?? 0)) - (a.vitality?.freshness ?? (a.freshness ?? 0)));
  else if (sort === 'az') sorted.sort((a, b) => (a.names?.[0] || a.name || '').localeCompare(b.names?.[0] || b.name || '', 'fr'));
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
    _doSearch('');
  }
};

// Debounced search entry point
window.searchFoods = function(query) {
  const q = (query || '').trim();
  // Show/hide clear and AI search buttons
  const clearBtn = document.getElementById('searchClearBtn');
  const aiDirectBtn = document.getElementById('searchAiDirectBtn');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
  if (aiDirectBtn) aiDirectBtn.style.display = q ? 'inline-flex' : 'none';

  clearTimeout(_searchDebounceTimer);
  _searchDebounceTimer = setTimeout(() => _doSearch(q), 200);
};

// Direct AI Search trigger from input button
window.triggerDirectAISearch = function() {
  const input = document.getElementById('searchInput');
  const q = (input?.value || '').trim();
  if (q) {
    askAIToFindFood(q);
  }
};

function _doSearch(q) {
  const resultsEl = document.getElementById('foodResults');
  const emptyState = document.getElementById('searchEmptyState');
  const statsBar = document.getElementById('searchStatsBar');

  if (!q) {
    if (currentSearchFilter === 'favorites') {
      const favs = store.get('favorites', []);
      if (emptyState) emptyState.style.display = 'none';
      if (resultsEl) resultsEl.style.display = 'flex';
      
      const countEl = document.getElementById('searchResultCount');
      if (favs.length === 0) {
        if (statsBar) statsBar.style.display = 'none';
        resultsEl.innerHTML = `
          <div class="empty-state" style="text-align:center; padding:36px 16px; width:100%;">
            <div style="font-size:2.8rem; margin-bottom:10px;">❤️</div>
            <p style="font-weight:700; font-size:1.05rem; color:var(--text); margin-bottom:6px;">Aucun aliment dans vos favoris</p>
            <p style="font-size:0.88rem; color:var(--text-dim); max-width:360px; margin:0 auto;">Recherchez un aliment et cliquez sur le bouton "❤️ Favori" dans sa fiche pour l'ajouter instantanément à vos favoris.</p>
          </div>
        `;
      } else {
        if (statsBar) {
          statsBar.style.display = 'flex';
          if (countEl) countEl.textContent = favs.length === 1 ? '1 favori' : `${favs.length} favoris`;
        }
        const fullFavs = favs.map(f => {
          return vitalDb.find(item => (f.id && item.id === f.id) || (item.names || []).some(n => n.toLowerCase() === (f.name || '').toLowerCase())) || f;
        });
        _lastSearchResults = fullFavs;
        _lastSearchQuery = '';
        const sorted = applySortItems(fullFavs);
        resultsEl.innerHTML = sorted.map(item => renderFoodCard(item)).join('');
      }
      return;
    }

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

  // AI Prompt Banner HTML (always available when query has >= 2 characters)
  const aiBannerHtml = `
    <div class="search-ai-banner" onclick="askAIToFindFood('${esc(q)}')">
      <div class="search-ai-banner-content">
        <div class="search-ai-banner-icon"><i class="ri-sparkling-fill"></i></div>
        <div class="search-ai-banner-text">
          <span class="search-ai-banner-title"><i class="ri-sparkling-line" style="color:var(--accent)"></i> Votre aliment ou plat n'est pas dans la liste ?</span>
          <span class="search-ai-banner-sub">Analyser <strong>« ${esc(q)} »</strong> avec l'IA VitalTrack (classification complète, PRAL & NOVA)</span>
        </div>
      </div>
      <button type="button" class="btn-ai-search" onclick="event.stopPropagation(); askAIToFindFood('${esc(q)}')">
        <i class="ri-search-eye-line"></i> Analyser IA
      </button>
    </div>
  `;

  if (matches.length === 0) {
    if (statsBar) statsBar.style.display = 'none';
    resultsEl.innerHTML = `
      <div style="text-align:center; padding:24px 16px; width:100%;">
        <div style="font-size:2.5rem; margin-bottom:12px;">🔍</div>
        <p class="empty-state" style="margin-bottom:16px; font-size:0.95rem;">Aucun résultat répertorié dans la base pour <strong>« ${esc(q)} »</strong>.</p>
        <button class="btn-primary" style="margin: 0 auto; display: inline-flex; align-items:center; gap:8px; padding:12px 22px; font-weight:700; font-size:0.92rem; box-shadow:0 4px 14px rgba(16,185,129,0.4);" onclick="askAIToFindFood('${esc(q)}')">
          <i class="ri-sparkling-fill"></i> Analyser « ${esc(q)} » avec l'IA VitalTrack
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

  // Render AI banner at top + sorted food cards
  resultsEl.innerHTML = aiBannerHtml + sorted.map(item => renderFoodCard(item)).join('');
}

function renderFoodCard(item, compact = false) {
  const name = ((item.names?.[0] || item.name || 'Inconnu')).replace(/^./, c => c.toUpperCase());
  const sp = item.specific || {};
  const sc = item.scientific_defaults || item.scientific || {};
  const vt = item.vitality || {};
  const isE = sp.electric === true || item.electric === true || item.approved === true;
  const isH = sp.hybrid === true || item.hybrid === true;
  const pral = sc.pral ?? (item.pral ?? 0);
  const mucusStr = (sp.mucus || item.mucus || '').toLowerCase();
  const isDissolvant = mucusStr.includes('dissolvant') || mucusStr.includes('non-muc');
  const isAlcalin = pral < 0 || isDissolvant;
  const nova = vt.nova ?? (item.nova ?? (isE ? 1 : isH ? 2 : 3));
  const freshness = vt.freshness ?? (item.freshness ?? 70);
  
  let bc, bt;
  if (isE) {
    bc = 'badge-electric';
    bt = 'Électrique';
  } else if (isH) {
    bc = 'badge-hybrid';
    bt = 'Hybride';
  } else if (isAlcalin && !mucusStr.includes('mucog')) {
    bc = 'badge-alkaline';
    bt = 'Alcalinisant';
  } else {
    bc = 'badge-mucus';
    bt = 'Mucogène';
  }
  const novaCls = `nova-${Math.min(4, Math.max(1, nova))}`;
  const freshnessColor = freshness >= 80 ? '#34d399' : freshness >= 50 ? '#facc15' : '#ef4444';
  const idx = vitalDb.indexOf(item);
  const favs = store.get('favorites', []);
  const isFav = (item.id && favs.some(f => f.id === item.id)) || favs.some(f => f.name?.toLowerCase() === name.toLowerCase());
  const noteHtml = item.note ? `<div class="food-note" title="${esc(item.note)}">${esc(item.note.slice(0, 70))}${item.note.length > 70 ? '…' : ''}</div>` : '';
  const clickArg = idx >= 0 ? idx : `'${esc(item.id || name)}'`;

  if (compact) {
    return `<div class="food-card-compact" onclick="openFoodModal(${clickArg})">
      <div class="food-emoji">${item.emoji || '🍽️'}</div>
      <div class="food-name">${esc(name)}</div>
      <span class="food-badge ${bc}">${bt}</span>
    </div>`;
  }

  return `<div class="food-card" onclick="openFoodModal(${clickArg})">
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
    <div class="food-card-quick-actions">
      <button type="button" class="food-card-action-btn btn-quick-add" onclick="event.stopPropagation(); quickAddFoodToMeal(${clickArg})" title="Ajouter directement à mes repas du jour">
        <i class="ri-add-line"></i>
      </button>
      <button type="button" class="food-card-action-btn btn-quick-fav ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); quickToggleFavorite(${clickArg})" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
        <i class="${isFav ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
      </button>
    </div>
  </div>`;
}

// ─── Quick Actions directly from food card ───
window.quickAddFoodToMeal = function(idxOrFood) {
  let item = null;
  if (typeof idxOrFood === 'number' || (!isNaN(Number(idxOrFood)) && typeof idxOrFood !== 'object')) {
    item = vitalDb[Number(idxOrFood)];
  } else if (typeof idxOrFood === 'string') {
    item = vitalDb.find(f => f.id === idxOrFood || (f.names || []).some(n => n.toLowerCase() === idxOrFood.toLowerCase()));
  } else if (typeof idxOrFood === 'object' && idxOrFood !== null) {
    item = idxOrFood;
  }
  if (!item) return;

  const name = (item.names?.[0] || item.name || 'Aliment').replace(/^./, c => c.toUpperCase());
  const id = item.id || 'dish_' + Date.now();
  const sc = item.scientific_defaults || item.scientific || {};
  const vt = item.vitality || {};
  const sp = item.specific || {};
  
  const isElec = sp.electric === true || item.electric === true || item.approved === true;
  const isHyb = sp.hybrid === true || item.hybrid === true;
  const pral = sc.pral ?? (item.pral ?? 0);
  const nova = vt.nova ?? (item.nova ?? (isElec ? 1 : isHyb ? 2 : 3));

  const meals = store.get('meals', []);
  meals.push({
    id,
    name,
    emoji: item.emoji || '🍽️',
    family: item.family || item.category || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
    category: item.category || item.family || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
    approved: isElec,
    electric: isElec,
    hybrid: isHyb,
    pral,
    scientific_defaults: { pral, density: sc.density ?? 50 },
    nova,
    vitality: { nova, freshness: vt.freshness ?? 70 },
    freshness: vt.freshness ?? 70,
    mucus: sp.mucus || (isElec ? 'Dissolvant' : isHyb ? 'Faiblement Mucogène' : 'Mucogène'),
    specific: sp,
    note: item.note,
    timestamp: Date.now()
  });
  store.set('meals', meals);
  renderMeals();
  renderDashboard();
  showToast(`✅ « ${name} » ajouté directement à vos repas du jour !`, 'success');
};

window.quickToggleFavorite = function(idxOrFood) {
  let item = null;
  if (typeof idxOrFood === 'number' || (!isNaN(Number(idxOrFood)) && typeof idxOrFood !== 'object')) {
    item = vitalDb[Number(idxOrFood)];
  } else if (typeof idxOrFood === 'string') {
    item = vitalDb.find(f => f.id === idxOrFood || (f.names || []).some(n => n.toLowerCase() === idxOrFood.toLowerCase()));
  } else if (typeof idxOrFood === 'object' && idxOrFood !== null) {
    item = idxOrFood;
  }
  if (!item) return;

  const targetId = item.id;
  const name = (item.names?.[0] || item.name || 'Aliment').replace(/^./, c => c.toUpperCase());
  let favs = store.get('favorites', []);
  const idx = favs.findIndex(f => (targetId && f.id === targetId) || f.name?.toLowerCase() === name.toLowerCase());

  const sc = item.scientific_defaults || item.scientific || {};
  const pral = sc.pral ?? (item.pral ?? 0);
  const isElec = item.specific?.electric === true || item.electric === true || item.approved === true;

  if (idx >= 0) {
    favs.splice(idx, 1);
    showToast(`💔 « ${name} » retiré des favoris.`, 'info');
  } else {
    favs.push({
      id: targetId || `fav_${Date.now()}`,
      name,
      names: item.names || [name],
      emoji: item.emoji || '🍽️',
      family: item.family || item.category || 'Alimentation',
      category: item.category || item.family || 'Alimentation',
      electric: isElec,
      pral,
      scientific_defaults: sc,
      vitality: item.vitality || {},
      specific: item.specific || {}
    });
    showToast(`❤️ « ${name} » ajouté aux favoris !`, 'success');
  }
  store.set('favorites', favs);
  renderFavorites();

  // Re-render current search results so heart icons update instantly
  if (_lastSearchResults.length > 0) {
    renderSearchResults(_lastSearchResults, _lastSearchQuery);
  }
};

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
  vitalDb.forEach(item => { const c = item.category || item.family || 'Autre'; cats[c] = (cats[c] || 0) + 1; });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  grid.innerHTML = sorted.map(([cat, count]) => {
    const emoji = CATEGORY_EMOJIS[cat] || '🍽️';
    const shortName = cat;
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

  const matches = applyFilter(vitalDb.filter(item => (item.category && item.category === cat) || (item.family && item.family === cat)));
  _lastSearchResults = matches;
  _lastSearchQuery = cat;
  renderSearchResults(matches, cat);
};

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
    if (!vitalDb.some(i => i.id === cached.id)) {
      vitalDb.push(cached);
      buildSearchIndex();
      renderCategoryBrowse();
    }
    if (resultsEl) { resultsEl.style.display = 'flex'; }
    if (emptyState) emptyState.style.display = 'none';
    if (statsBar) statsBar.style.display = 'none';
    resultsEl.innerHTML = renderFoodCard(cached);
    openFoodModal(vitalDb.indexOf(cached) >= 0 ? vitalDb.indexOf(cached) : cached);
    return;
  }

  if (resultsEl) {
    resultsEl.style.display = 'flex';
    resultsEl.innerHTML = `<p class="empty-state" style="padding:20px;text-align:center;width:100%;"><i class="ri-loader-4-line ri-spin" style="font-size:1.4rem;vertical-align:middle;margin-right:8px;color:var(--accent)"></i> Analyse scientifique & vitaliste de "${esc(q)}" via l'IA...</p>`;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (statsBar) statsBar.style.display = 'none';

  try {
    let aiFood = null;
    try {
      const res = await fetch('/api/searchFood', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-VT-API-Key': VT_APP_KEY
        },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        aiFood = await res.json();
      }
    } catch (err) {
      console.warn('[AI Food Search] API fetch failed, using local fallback:', err);
    }

    if (!aiFood || !aiFood.name) {
      aiFood = classifyFoodLocally(q);
    }
    aiFood.isNewFromAI = true;

    // Cache result
    aiFood._cachedAt = Date.now();
    _aiSearchCache.set(cacheKey, aiFood);
    const storedC = store.get('ai-food-cache', {});
    storedC[cacheKey] = aiFood;
    const keys = Object.keys(storedC);
    if (keys.length > 60) delete storedC[keys[0]];
    store.set('ai-food-cache', storedC);

    // Add to vitalDb if not present
    const existingIdx = vitalDb.findIndex(i => (aiFood.id && i.id === aiFood.id) || (i.names || []).some(n => n.toLowerCase() === (aiFood.name || '').toLowerCase()));
    let targetIdx;
    if (existingIdx >= 0) {
      vitalDb[existingIdx] = { ...vitalDb[existingIdx], ...aiFood };
      targetIdx = existingIdx;
    } else {
      vitalDb.push(aiFood);
      targetIdx = vitalDb.length - 1;
    }

    // Rebuild index and category browse with new item
    buildSearchIndex();
    renderCategoryBrowse();

    if (resultsEl) resultsEl.innerHTML = renderFoodCard(aiFood);
    openFoodModal(targetIdx);
    showToast(`✨ "${aiFood.names?.[0] || aiFood.name || q}" analysé avec succès !`, 'success');
  } catch (e) {
    if (resultsEl) resultsEl.innerHTML = `<p class="empty-state text-danger">${esc(e.message)}</p>`;
    showToast('Recherche IA terminée avec estimation locale.', 'info');
  }
};

// ─── Init search page (called once after DB loads) ───
function initSearchPage() {
  renderRecentSearches();
  renderCategoryBrowse();

  // Wire debounced input (HTML now has no oninput attr)
  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('input', e => searchFoods(e.target.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') clearSearch();
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) {
          askAIToFindFood(val);
        }
      }
    });
  }
}

// ═══════ PHARMACOPÉE AMAZONIENNE & MATERIA MEDICA (RAINTREE) ═══════
let _currentHerbFilter = 'all';
let _currentHerbQuery = '';
let _currentSelectedHerb = null;

function renderRaintreeExplorer() {
  renderProtocolsList();
  filterAndRenderHerbs();
}
window.renderRaintreeExplorer = renderRaintreeExplorer;

function renderProtocolsList() {
  const grid = document.getElementById('protocolsGrid');
  if (!grid) return;
  grid.innerHTML = RAINTREE_PROTOCOLS.map(proto => {
    const badgeClass = `badge-${proto.badgeColor || 'emerald'}`;
    const herbPills = proto.herbs.map(hId => {
      const h = RAINTREE_HERBS.find(x => x.id === hId);
      if (!h) return '';
      return `<span class="protocol-herb-pill" onclick="event.stopPropagation(); openHerbModal('${h.id}')">
        ${h.emoji} ${esc(h.name)}
      </span>`;
    }).join('');

    return `<div class="protocol-card" onclick="setHerbFilterByHerbs(['${proto.herbs.join("','")}'])">
      <div class="protocol-card-top">
        <span class="protocol-card-title">${esc(proto.title)}</span>
        <span class="protocol-badge ${badgeClass}">${esc(proto.badge)}</span>
      </div>
      <div style="font-size:0.78rem;color:var(--text-dim);">${esc(proto.subtitle)}</div>
      <div class="protocol-directions"><strong>Posologie :</strong> ${esc(proto.directions)}</div>
      <div class="protocol-targets"><i class="ri-check-double-line" style="color:var(--accent)"></i> <strong>Cibles :</strong> ${esc(proto.targets)}</div>
      <div class="protocol-herbs-row">
        <span style="font-size:0.72rem;color:var(--text-dim);align-self:center">Plantes :</span>
        ${herbPills}
      </div>
    </div>`;
  }).join('');
}

window.toggleProtocolsAccordion = function() {
  const grid = document.getElementById('protocolsGrid');
  const icon = document.getElementById('protocolsToggleIcon');
  if (!grid) return;
  const isHidden = grid.style.display === 'none' || !grid.style.display;
  grid.style.display = isHidden ? 'grid' : 'none';
  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

function filterAndRenderHerbs() {
  const query = (_currentHerbQuery || '').trim().toLowerCase();
  const filter = _currentHerbFilter;

  let results = RAINTREE_HERBS.filter(herb => {
    // 1. Tag / Category filter
    if (filter !== 'all') {
      const matchesFilter = (herb.category && herb.category.toLowerCase().includes(filter)) ||
                            (herb.tags && herb.tags.some(t => t.toLowerCase().includes(filter))) ||
                            (herb.id && herb.id.toLowerCase().includes(filter));
      if (!matchesFilter) return false;
    }

    // 2. Query search across name, latinName, synonyms, activeCompounds, mechanisms, indications, tags
    if (query) {
      const qTerms = query.split(/\s+/).filter(Boolean);
      const searchable = [
        herb.name,
        herb.latinName,
        ...(herb.synonyms || []),
        herb.category,
        herb.family,
        herb.origin,
        herb.partsUsed,
        ...(herb.activeCompounds || []),
        herb.mechanisms,
        ...(herb.indications || []),
        ...(herb.tags || []),
        herb.vitalistNote || '',
        herb.tropismBadge?.label || ''
      ].join(' ').toLowerCase();

      // Normalize accents for fuzzy matching
      const normSearchable = searchable.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const allMatch = qTerms.every(term => {
        const normTerm = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normSearchable.includes(normTerm);
      });
      if (!allMatch) return false;
    }

    return true;
  });

  const grid = document.getElementById('materiaHerbsGrid');
  const countEl = document.getElementById('herbResultCount');
  if (countEl) {
    countEl.textContent = `${results.length} plante${results.length > 1 ? 's' : ''} médicinale${results.length > 1 ? 's' : ''} répertoriée${results.length > 1 ? 's' : ''}`;
  }

  if (!grid) return;

  if (results.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: var(--bg-card); border-radius: var(--radius); border: 1px dashed var(--border);">
        <div style="font-size: 2.5rem; margin-bottom: 12px;">🌿</div>
        <h4 style="font-size: 1.1rem; color: var(--text); margin-bottom: 6px;">Aucune plante trouvée pour "${esc(_currentHerbQuery)}"</h4>
        <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 16px;">Essayez un autre mot-clé (ex: <em>Crohn, calculs, candida, ulcère, foie, asthme, reins, fatigue</em>)</p>
        <button class="btn-primary" onclick="clearHerbSearch()" style="margin: 0 auto;">Réinitialiser la recherche</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = results.map(herb => {
    const badgeColorClass = `badge-${herb.tropismBadge?.color || 'emerald'}`;
    const plantImg = herb.image || `/plants/${herb.id === 'boldo-amazonie' ? 'boldo' : herb.id}.jpg`;
    
    // Extrait immédiat et percutant pour l'utilisateur
    const primaryIndications = (herb.indications || []).slice(0, 2).map(ind => esc(ind)).join(' • ');
    
    // Posologie courte pour aperçu
    let quickDose = '';
    if (herb.posology) {
      if (herb.posology.decoction) quickDose = '🔥 Décoction';
      else if (herb.posology.infusion) quickDose = '🫖 Infusion';
      else if (herb.posology.internalDrops) quickDose = '🩸 Gouttes pures';
      else if (herb.posology.capsules) quickDose = '💊 Gélules';
      else if (herb.posology.powder) quickDose = '🥄 Poudre';
    }

    return `
      <div class="herb-card" onclick="openHerbModal('${herb.id}')">
        <div class="herb-card-media">
          <img src="${plantImg}" alt="${esc(herb.name)}" class="herb-card-img" loading="lazy" onerror="this.src='/plants/boldo.jpg'" />
          <div class="herb-card-tropism-chip ${badgeColorClass}">
            <i class="${herb.tropismBadge?.icon || 'ri-leaf-fill'}"></i>
            <span>${esc(herb.tropismBadge?.label || herb.category)}</span>
          </div>
        </div>

        <div class="herb-card-body">
          <div class="herb-card-title-wrap">
            <span class="herb-card-name">${esc(herb.name)}</span>
            <span class="herb-card-latin">${esc(herb.latinName)}</span>
          </div>

          <div class="herb-card-benefit-preview">
            <i class="ri-heart-pulse-fill" style="color:var(--accent);margin-right:4px;"></i>
            <strong>Cible :</strong> ${primaryIndications}
          </div>

          ${quickDose ? `
          <div class="herb-card-posology-chip">
            <i class="ri-cup-line" style="color:var(--accent)"></i> <span>Prise usuelle : <strong>${quickDose}</strong></span>
          </div>` : ''}

          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:8px; border-top:1px solid var(--border); font-size:0.75rem;">
            <a href="${herb.sourceUrl || `https://www.rain-tree.com/${herb.id}.htm`}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" style="color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
              <i class="ri-external-link-line"></i> Source Rain-Tree
            </a>
            <span style="color:var(--text-dim);">${esc(herb.family)}</span>
          </div>

          <button class="herb-card-btn" onclick="event.stopPropagation(); openHerbModal('${herb.id}')" style="margin-top:8px;">
            <i class="ri-eye-line"></i> Consulter la fiche & posologie
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.handleHerbSearchInput = function() {
  const input = document.getElementById('herbSearchInput');
  const clearBtn = document.getElementById('herbClearBtn');
  if (!input) return;
  _currentHerbQuery = input.value;
  if (clearBtn) clearBtn.style.display = _currentHerbQuery ? 'block' : 'none';
  filterAndRenderHerbs();
};

window.clearHerbSearch = function() {
  const input = document.getElementById('herbSearchInput');
  const clearBtn = document.getElementById('herbClearBtn');
  if (input) input.value = '';
  _currentHerbQuery = '';
  if (clearBtn) clearBtn.style.display = 'none';
  _currentHerbFilter = 'all';
  document.querySelectorAll('.materia-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-filter') === 'all');
  });
  filterAndRenderHerbs();
};

window.setHerbFilter = function(filterId) {
  _currentHerbFilter = filterId;
  document.querySelectorAll('.materia-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-filter') === filterId);
  });
  filterAndRenderHerbs();
};

window.filterByTag = function(tag) {
  const input = document.getElementById('herbSearchInput');
  const clearBtn = document.getElementById('herbClearBtn');
  if (input) input.value = tag;
  _currentHerbQuery = tag;
  if (clearBtn) clearBtn.style.display = 'block';
  _currentHerbFilter = 'all';
  document.querySelectorAll('.materia-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-filter') === 'all');
  });
  filterAndRenderHerbs();
};

window.setHerbFilterByHerbs = function(herbIds) {
  const grid = document.getElementById('materiaHerbsGrid');
  if (!grid) return;
  const filtered = RAINTREE_HERBS.filter(h => herbIds.includes(h.id));
  const countEl = document.getElementById('herbResultCount');
  if (countEl) countEl.textContent = `${filtered.length} plantes du protocole`;
  
  grid.innerHTML = filtered.map(herb => {
    const badgeColorClass = `badge-${herb.tropismBadge?.color || 'emerald'}`;
    const plantImg = herb.image || `/plants/${herb.id === 'boldo-amazonie' ? 'boldo' : herb.id}.jpg`;
    const primaryIndications = (herb.indications || []).slice(0, 2).map(ind => esc(ind)).join(' • ');

    return `
      <div class="herb-card" onclick="openHerbModal('${herb.id}')">
        <div class="herb-card-media">
          <img src="${plantImg}" alt="${esc(herb.name)}" class="herb-card-img" loading="lazy" onerror="this.src='/plants/boldo.jpg'" />
          <div class="herb-card-tropism-chip ${badgeColorClass}">
            <i class="${herb.tropismBadge?.icon || 'ri-leaf-fill'}"></i>
            <span>${esc(herb.tropismBadge?.label || herb.category)}</span>
          </div>
        </div>

        <div class="herb-card-body">
          <div class="herb-card-title-wrap">
            <span class="herb-card-name">${esc(herb.name)}</span>
            <span class="herb-card-latin">${esc(herb.latinName)}</span>
          </div>

          <div class="herb-card-benefit-preview">
            <i class="ri-heart-pulse-fill" style="color:var(--accent);margin-right:4px;"></i>
            <strong>Cible :</strong> ${primaryIndications}
          </div>

          <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding-top:8px; border-top:1px solid var(--border); font-size:0.75rem;">
            <a href="${herb.sourceUrl || `https://www.rain-tree.com/${herb.id}.htm`}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" style="color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:4px; font-weight:600;">
              <i class="ri-external-link-line"></i> Source Rain-Tree
            </a>
            <span style="color:var(--text-dim);">${esc(herb.family)}</span>
          </div>

          <button class="herb-card-btn" onclick="event.stopPropagation(); openHerbModal('${herb.id}')" style="margin-top:8px;">
            <i class="ri-eye-line"></i> Consulter la fiche & posologie
          </button>
        </div>
      </div>
    `;
  }).join('');
};

window.toggleHerbMonograph = function() {
  const drawer = document.getElementById('herbMonographDrawer');
  const btn = document.getElementById('herbMonographBtn');
  const icon = document.getElementById('herbMonographIcon');
  const text = document.getElementById('herbMonographBtnText');
  if (!drawer || !btn) return;

  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    btn.classList.remove('open');
    if (text) text.textContent = 'Dérouler la monographie scientifique & études Raintree (Dr. Leslie Taylor)';
  } else {
    drawer.classList.add('open');
    btn.classList.add('open');
    if (text) text.textContent = 'Replier la monographie scientifique';
  }
};

window.openHerbModal = function(herbId) {
  const herb = RAINTREE_HERBS.find(h => h.id === herbId);
  if (!herb) return;
  _currentSelectedHerb = herb;

  const modal = document.getElementById('herbModal');
  const imgEl = document.getElementById('herbModalImg');
  const nameEl = document.getElementById('herbModalName');
  const latinEl = document.getElementById('herbModalLatin');
  const tropismBadge = document.getElementById('herbModalTropismBadge');
  const tropismLabel = document.getElementById('herbModalTropismLabel');
  const tropismIcon = document.getElementById('herbModalTropismIcon');
  const bodyEl = document.getElementById('herbModalBody');

  const plantImg = herb.image || `/plants/${herb.id === 'boldo-amazonie' ? 'boldo' : herb.id}.jpg`;
  if (imgEl) {
    imgEl.src = plantImg;
    imgEl.onerror = () => { imgEl.src = '/plants/boldo.jpg'; };
  }
  if (nameEl) nameEl.textContent = herb.name;
  if (latinEl) latinEl.textContent = `${herb.latinName} — Famille des ${herb.family}`;
  
  if (tropismBadge && herb.tropismBadge) {
    tropismBadge.className = `herb-card-tropism-chip badge-${herb.tropismBadge.color || 'emerald'}`;
    if (tropismLabel) tropismLabel.textContent = herb.tropismBadge.label || herb.category;
    if (tropismIcon) tropismIcon.className = herb.tropismBadge.icon || 'ri-leaf-fill';
  }

  if (bodyEl) {
    const synonymsStr = (herb.synonyms || []).join(', ');
    const compoundsList = (herb.activeCompounds || []).map(c => `<li>• ${esc(c)}</li>`).join('');
    const indicationsList = (herb.indications || []).map(ind => `
      <li class="herb-benefit-item">
        <i class="ri-checkbox-circle-fill"></i>
        <span>${esc(ind)}</span>
      </li>
    `).join('');
    
    let posologyHtml = '';
    if (herb.posology) {
      if (herb.posology.decoction) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">🔥 Décoction :</span> ${esc(herb.posology.decoction)}</div>`;
      if (herb.posology.infusion) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">🫖 Infusion :</span> ${esc(herb.posology.infusion)}</div>`;
      if (herb.posology.tincture) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">💧 Teinture / Extrait hydroalcoolique :</span> ${esc(herb.posology.tincture)}</div>`;
      if (herb.posology.internalDrops) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">🩸 Sève pure / Gouttes :</span> ${esc(herb.posology.internalDrops)}</div>`;
      if (herb.posology.powder) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">🥄 Poudre lyophilisée :</span> ${esc(herb.posology.powder)}</div>`;
      if (herb.posology.capsules) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">💊 Gélules :</span> ${esc(herb.posology.capsules)}</div>`;
      if (herb.posology.oil) posologyHtml += `<div class="herb-posology-item"><span class="herb-posology-type">🫒 Huile végétale brute :</span> ${esc(herb.posology.oil)}</div>`;
      if (herb.posology.standardDosage && !posologyHtml) {
        posologyHtml = `<div class="herb-posology-item"><span class="herb-posology-type">📋 Posologie Raintree :</span> ${esc(herb.posology.standardDosage)}</div>`;
      }
    }

    const formattedMechanisms = (herb.mechanisms || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p style="margin-bottom:10px">${p}</p>`)
      .join('');

    const synergiesList = (herb.synergies || []).map(s => `<span class="protocol-herb-pill" style="margin-right:6px;margin-bottom:6px;display:inline-flex;align-items:center;gap:4px"><i class="ri-links-line"></i> ${esc(s)}</span>`).join('');

    const sourceUrl = herb.sourceUrl || `https://www.rain-tree.com/${herb.id}.htm`;

    bodyEl.innerHTML = `
      <!-- BANNIÈRE SOURCE PRIMAIRE OFFICIELLE & LIEN EXTERNE -->
      <div style="margin-bottom:16px; padding:12px 14px; background:rgba(52,211,153,0.08); border:1px solid rgba(52,211,153,0.3); border-radius:10px; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
          <span style="font-size:0.82rem; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:6px;">
            <i class="ri-shield-check-fill"></i> Source Primaire Vérifiée — Base Raintree
          </span>
          <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.78rem; font-weight:600; color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:6px; padding:5px 12px; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); border-radius:6px; transition:all 0.2s;">
            <span>Consulter la fiche originale sur Rain-Tree.com</span> <i class="ri-external-link-line"></i>
          </a>
        </div>
        <div style="font-size:0.78rem; color:var(--text-dim); line-height:1.4;">
          Monographie officielle rédigée par le <strong>Dr. Leslie Taylor, N.D.</strong> issue des recherches ethnobotaniques et des publications cliniques sur <em>${esc(herb.latinName)}</em> (${esc(herb.family)}).
        </div>
      </div>

      <!-- ZONE 1 : APERÇU IMMÉDIAT -->
      <div class="herb-preview-card" style="border-left:4px solid var(--accent)">
        <div class="herb-preview-title"><i class="ri-shield-star-fill"></i> Bénéfices Majeurs & Cibles Cliniques</div>
        <ul class="herb-benefit-list">
          ${indicationsList}
        </ul>
      </div>

      <div class="herb-preview-card" style="border-left:4px solid #38bdf8">
        <div class="herb-preview-title" style="color:#38bdf8"><i class="ri-cup-fill"></i> Posologie Pratique & Mode d'Emploi</div>
        <div class="herb-posology-box">
          ${posologyHtml || '<div class="herb-posology-item">Infusion ou décoction standard : 1 tasse 2 à 3 fois par jour.</div>'}
        </div>
      </div>

      ${herb.contraindications ? `
      <div class="herb-preview-card" style="border-left:4px solid #f87171;background:rgba(239,68,68,0.05)">
        <div class="herb-preview-title" style="color:#f87171"><i class="ri-alarm-warning-fill"></i> Précautions & Contre-indications</div>
        <div style="font-size:0.88rem;color:#fca5a5;line-height:1.5">
          ${esc(herb.contraindications)}
        </div>
      </div>` : ''}

      <!-- ZONE 2 : ACCORDÉON DÉROULANT (Monographie Scientifique Complète) -->
      <button class="herb-monograph-toggle" id="herbMonographBtn" onclick="toggleHerbMonograph()">
        <span><i class="ri-microscope-fill" style="color:var(--accent);margin-right:8px"></i> <span id="herbMonographBtnText">Dérouler la monographie scientifique & études Raintree</span></span>
        <i class="ri-arrow-down-s-line" id="herbMonographIcon"></i>
      </button>

      <div class="herb-monograph-drawer" id="herbMonographDrawer">
        <div class="herb-drawer-section">
          <div class="herb-drawer-title"><i class="ri-information-fill"></i> Carte d'Identité & Origine Botanique</div>
          <div style="font-size:0.86rem;line-height:1.55;color:var(--text-dim)">
            <div><strong>Noms usuels :</strong> ${esc(synonymsStr)}</div>
            <div style="margin-top:4px"><strong>Origine :</strong> ${esc(herb.origin)}</div>
            <div style="margin-top:4px"><strong>Partie utilisée :</strong> ${esc(herb.partsUsed)}</div>
            <div style="margin-top:4px"><strong>Lien direct Raintree :</strong> <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);">${sourceUrl}</a></div>
          </div>
        </div>

        <div class="herb-drawer-section">
          <div class="herb-drawer-title"><i class="ri-flask-fill"></i> Principes Phytochimiques Actifs</div>
          <ul style="list-style:none;padding-left:0;display:flex;flex-direction:column;gap:5px;font-size:0.86rem;color:var(--text)">
            ${compoundsList}
          </ul>
        </div>

        <div class="herb-drawer-section">
          <div class="herb-drawer-title"><i class="ri-stethoscope-fill"></i> Mécanismes Physiologiques & Pharmacodynamie (Dr. Leslie Taylor)</div>
          <div style="line-height:1.6;font-size:0.88rem;color:var(--text)">
            ${formattedMechanisms}
          </div>
        </div>

        ${herb.vitalistNote ? `
        <div class="herb-drawer-section" style="border-left:3px solid var(--accent);background:rgba(52,211,153,0.06)">
          <div class="herb-drawer-title"><i class="ri-leaf-fill"></i> Vision Vitaliste & Détoxification Émonctorielle</div>
          <div style="font-size:0.88rem;color:var(--text);line-height:1.55">
            ${esc(herb.vitalistNote)}
          </div>
        </div>` : ''}

        ${herb.synergies && herb.synergies.length ? `
        <div class="herb-drawer-section">
          <div class="herb-drawer-title"><i class="ri-compass-3-fill"></i> Synergies Botaniques Amazoniennes</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
            ${synergiesList}
          </div>
        </div>` : ''}
      </div>
    `;
  }

  if (modal) modal.style.display = 'flex';
};

window.closeHerbModal = function() {
  const modal = document.getElementById('herbModal');
  if (modal) modal.style.display = 'none';
};

window.askAIAboutCurrentHerb = function() {
  if (!_currentSelectedHerb) return;
  const herb = _currentSelectedHerb;
  closeHerbModal();
  showPage('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = `Peux-tu m'expliquer en détail les vertus thérapeutiques, le mode de préparation et les synergies de la plante ${herb.name} (${herb.latinName}) selon la pharmacopée Raintree et la vision vitaliste ?`;
    chatInput.focus();
  }
};

// ═══════ FOOD & MEAL MODAL (DIFFÉRENCIATION ALIMENT / REPAS COMPOSÉ) ═══════
window.openFoodModal = function(idxOrFood) {
  let item = null;
  let isMealContext = false;
  let isMealSelection = false;
  let mealIndex = undefined;

  if (typeof idxOrFood === 'number' || (!isNaN(Number(idxOrFood)) && typeof idxOrFood !== 'object')) {
    item = vitalDb[Number(idxOrFood)];
  } else if (typeof idxOrFood === 'string') {
    item = vitalDb.find(f => f.id === idxOrFood || (f.names || []).some(n => n.toLowerCase() === idxOrFood.toLowerCase()));
  } else if (typeof idxOrFood === 'object' && idxOrFood !== null) {
    item = idxOrFood;
    isMealContext = idxOrFood.isMealItem === true;
    isMealSelection = idxOrFood.isMealSelection === true;
    mealIndex = idxOrFood.mealIndex;
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

  const isE = sp.electric === true || item.electric === true || item.approved === true;
  const isHyb = sp.hybrid === true || item.hybrid === true;
  const pral = sc.pral ?? (item.pral ?? 0);
  const mucusStr = (sp.mucus || item.mucus || '').toLowerCase();
  const isDissolvant = mucusStr.includes('dissolvant') || mucusStr.includes('non-muc');
  const isAlcalin = pral < 0 || isDissolvant;

  let modalSubtitleTag = '';
  if (isE) modalSubtitleTag = '⚡ Électrique';
  else if (isHyb) modalSubtitleTag = '🔀 Hybride';
  else if (isAlcalin && !mucusStr.includes('mucog')) modalSubtitleTag = '🌿 Alcalinisant & Dissolvant';
  else modalSubtitleTag = '⛔ Mucogène';

  // Determine if Composed Meal
  const rawItems = item.items || item.ingredients;
  const hasItems = Array.isArray(rawItems) && rawItems.length > 0;
  const isComposedMeal = item.isComposedMeal === true || (hasItems && rawItems.length > 1) || (isMealContext && hasItems);

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

  // Header Subtitle
  let headerSubtitle = `${esc(item.family || 'Aliment')} · ${modalSubtitleTag}`;
  if (isComposedMeal) {
    const categoryLabels = { breakfast: 'PETIT-DÉJEUNER', lunch: 'DÉJEUNER', dinner: 'DÎNER', snack: 'COLLATION' };
    const catLabel = categoryLabels[item.category] || (item.category ? item.category.toUpperCase() : 'REPAS VITALISTE');
    const count = hasItems ? rawItems.length : 1;
    headerSubtitle = `<span style="color:var(--accent); font-weight:700;">[${esc(catLabel)}]</span> · ${modalSubtitleTag} · 🥗 ${count} ingrédient${count > 1 ? 's' : ''}`;
  }

  document.getElementById('modalFoodHeader').innerHTML = `
    <div style="font-size:3rem;margin-bottom:8px">${item.emoji || '🍽️'}</div>
    <h2 style="font-family:var(--font);font-weight:700;font-size:1.35rem;">${esc(name)}</h2>
    <p style="color:var(--text-dim);font-size:0.88rem;margin-top:4px;">
      ${headerSubtitle}
    </p>
    ${multiNavHtml}
  `;

  // Render Tabs Bar dynamically
  const tabsBar = document.getElementById('modalTabsBar') || document.querySelector('#foodModal .modal-tabs');
  if (tabsBar) {
    if (isComposedMeal) {
      const count = hasItems ? rawItems.length : 1;
      tabsBar.innerHTML = `
        <button class="tab active" data-tab="meal_ingredients" onclick="setModalTab('meal_ingredients')">🥗 Ingrédients (${count})</button>
        <button class="tab" data-tab="meal_balance" onclick="setModalTab('meal_balance')">🔬 Bilan & PRAL</button>
        <button class="tab" data-tab="meal_coach" onclick="setModalTab('meal_coach')">💡 Note & Conseil</button>
      `;
    } else {
      tabsBar.innerHTML = `
        <button class="tab active" data-tab="scientific" onclick="setModalTab('scientific')">🔬 Scientifique</button>
        <button class="tab" data-tab="vitality" onclick="setModalTab('vitality')">💚 Vitalité</button>
        <button class="tab" data-tab="specific" onclick="setModalTab('specific')">🌿 Spécifique</button>
      `;
    }
  }

  currentModalFood._parsed = { 
    name, 
    sc, 
    vt, 
    sp, 
    item, 
    isComposedMeal, 
    mealIndex, 
    isMealContext,
    cookingMethod: item.cookingMethod || (isE ? 'steam' : 'bake'),
    oilQuality: item.oilQuality || (isE ? 'raw_olive' : 'none')
  };
  
  if (isComposedMeal) {
    setModalTab('meal_ingredients');
  } else {
    setModalTab('scientific');
  }

  const favs = store.get('favorites', []);
  const isFav = item.id ? favs.some(f => f.id === item.id) : (favs.some(f => f.name?.toLowerCase() === name.toLowerCase()));

  // Render modal actions based on context
  const actionsContainer = document.getElementById('modalActionsContainer');
  if (actionsContainer) {
    if (isMealContext) {
      actionsContainer.innerHTML = `
        <div style="display:flex; gap:8px; width:100%;">
          ${typeof mealIndex === 'number' ? `<button type="button" class="btn-outline" style="color:#ef4444; border-color:rgba(239,68,68,0.3); flex:1;" onclick="removeMealAndCloseModal(${mealIndex})"><i class="ri-delete-bin-line"></i> Supprimer</button>` : ''}
          <button type="button" class="btn-primary" style="flex:1.5;" onclick="closeFoodModal()"><i class="ri-check-line"></i> Fermer</button>
        </div>
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
      const isNewAI = item.isNewFromAI === true;
      actionsContainer.innerHTML = `
        <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">
          <button class="btn-primary" style="flex:2; min-width:140px;" onclick="addFoodToMealFromModal(${idx})"><i class="ri-add-line"></i> Ajouter au repas</button>
          <button class="btn-outline" id="modalFavBtn" style="flex:1; min-width:90px;" onclick="toggleFavorite()"><i class="ri-heart-line"></i> Favori</button>
          ${isNewAI ? '<button class="btn-outline" style="flex:1.2; min-width:120px;" onclick="saveAIFoodToDB()"><i class="ri-save-line"></i> Sauvegarder</button>' : ''}
        </div>
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

// ═══════ COOKING METHODS & OIL ALTERATIONS ENGINE ═══════
const COOKING_METHODS = {
  raw: {
    id: 'raw',
    label: 'Cru / Vivant (< 42°C)',
    emoji: '🥗',
    tempMax: 42,
    vitalityRetention: 100,
    pralModifier: 0,
    description: 'Enzymes digestives intactes, vitamines thermolabiles (Vit C, B9) 100% préservées. Zéro glycation (0 AGEs).'
  },
  steam: {
    id: 'steam',
    label: 'Vapeur Douce (< 95°C)',
    emoji: '♨️',
    tempMax: 95,
    vitalityRetention: 90,
    pralModifier: +0.2,
    description: 'Rupture ménagée des parois végétales sans caramélisation. Sels minéraux et antioxydants préservés à 90%.'
  },
  simmer: {
    id: 'simmer',
    label: 'Mijoté / Bouillon (< 100°C)',
    emoji: '🍲',
    tempMax: 100,
    vitalityRetention: 75,
    pralModifier: +0.5,
    description: 'Minéraux transférés dans le bouillon (à consommer). Enzymes détruites, digestion adoucie.'
  },
  bake: {
    id: 'bake',
    label: 'Four / Rôti (140°C - 180°C)',
    emoji: '🍳',
    tempMax: 180,
    vitalityRetention: 60,
    pralModifier: +1.2,
    description: 'Réactions de Maillard modérées (brunissement). Perte enzymatique totale et peroxydation lipidique débutante.'
  },
  fry: {
    id: 'fry',
    label: 'Friture / Haute T° (> 180°C)',
    emoji: '🔥',
    tempMax: 220,
    vitalityRetention: 35,
    pralModifier: +2.5,
    description: 'Formation d\'acrylamides, d\'acroléine et de graisses peroxydées. Surcharge majeure des émonctoires (foie & reins).'
  }
};

const OIL_QUALITIES = {
  none: {
    id: 'none',
    label: 'Sans huile ajoutée',
    emoji: '💧',
    lipidQuality: 'Pureté naturelle des aliments',
    healthImpact: 'Zéro surcharge lymphatique ou hépatique',
    isPositive: true
  },
  raw_olive: {
    id: 'raw_olive',
    label: 'Huile d\'Olive Extra-Vierge Crue',
    emoji: '🫒',
    lipidQuality: '1ère pression à froid, acide oléique & polyphénols',
    healthImpact: 'Anti-inflammatoire, protecteur cardiovasculaire',
    isPositive: true
  },
  raw_cold_pressed: {
    id: 'raw_cold_pressed',
    label: 'Huile d\'Avocat / Lin Crue',
    emoji: '🥑',
    lipidQuality: 'Oméga-3 & 9 vivants non-oxydés',
    healthImpact: 'Régénération membranaire et fluidification lymphatique',
    isPositive: true
  },
  cooked_refined: {
    id: 'cooked_refined',
    label: 'Huile Chauffée / Raffinée (Friture)',
    emoji: '⚠️',
    lipidQuality: 'Peroxydation lipidique & radicaux libres',
    healthImpact: 'Colles lipidiques obstruant le foie et la lymphe',
    isPositive: false
  }
};

window.setMealCookingMethod = function(methodId) {
  if (!currentModalFood || !currentModalFood._parsed) return;
  currentModalFood._parsed.cookingMethod = methodId;
  if (currentModalFood._parsed.item) currentModalFood._parsed.item.cookingMethod = methodId;
  if (typeof currentModalFood._parsed.mealIndex === 'number') {
    const meals = store.get('meals', []);
    const todayMeals = meals.filter(m => isToday(m.timestamp));
    if (todayMeals[currentModalFood._parsed.mealIndex]) {
      todayMeals[currentModalFood._parsed.mealIndex].cookingMethod = methodId;
      store.set('meals', meals);
      if (window.renderMeals) renderMeals();
    }
  }
  setModalTab('meal_balance');
};

window.setMealOilQuality = function(oilId) {
  if (!currentModalFood || !currentModalFood._parsed) return;
  currentModalFood._parsed.oilQuality = oilId;
  if (currentModalFood._parsed.item) currentModalFood._parsed.item.oilQuality = oilId;
  if (typeof currentModalFood._parsed.mealIndex === 'number') {
    const meals = store.get('meals', []);
    const todayMeals = meals.filter(m => isToday(m.timestamp));
    if (todayMeals[currentModalFood._parsed.mealIndex]) {
      todayMeals[currentModalFood._parsed.mealIndex].oilQuality = oilId;
      store.set('meals', meals);
      if (window.renderMeals) renderMeals();
    }
  }
  setModalTab('meal_balance');
};

window.openFoodModalFromMeal = function(idx) {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  if (idx >= 0 && idx < todayMeals.length) {
    const m = todayMeals[idx];
    const isElec = m.electric === true || m.approved === true;
    const isHyb = m.hybrid === true;
    const nova = m.nova ?? (isElec ? 1 : 2);
    const pral = m.pral ?? 0;
    
    // Check if composed meal or has items
    const rawItems = m.items || m.ingredients;
    const hasItems = Array.isArray(rawItems) && rawItems.length > 0;
    const match = vitalDb.find(f => f.id === m.id || (f.names || []).some(n => n.toLowerCase() === (m.name || '').toLowerCase()));
    
    // If it is a pure raw food item from DB with no custom ingredients/note
    if (match && !hasItems && !m.note && !m.isComposedMeal) {
      openFoodModal({ ...match, isMealItem: true, mealIndex: idx, cookingMethod: m.cookingMethod || 'raw', oilQuality: m.oilQuality || 'none' });
      return;
    }

    const items = hasItems ? rawItems : (match ? [match.name || match.names[0]] : [m.name]);

    openFoodModal({
      id: m.id,
      name: m.name,
      emoji: m.emoji || (match ? match.emoji : '🍲'),
      family: m.family || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
      category: m.category || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
      items: items,
      ingredients: items,
      cookingMethod: m.cookingMethod || (isElec ? 'steam' : 'bake'),
      oilQuality: m.oilQuality || (isElec ? 'raw_olive' : 'none'),
      note: m.note || (isElec ? 'Repas vitaliste équilibré respectant le bio-équilibre minéral.' : nova === 4 ? 'Aliment transformé fortement acidifiant.' : 'Repas enregistré.'),
      isComposedMeal: true,
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
      isMealItem: true,
      mealIndex: idx
    });
  }
};

window.removeMealAndCloseModal = function(idx) {
  if (typeof idx === 'number') {
    removeMeal(idx);
    closeFoodModal();
    showToast('Repas retiré du journal', 'info');
  }
};

window.saveAIFoodToDB = function() {
  const item = currentModalFood;
  if (!item) return;
  delete item.isNewFromAI;
  
  const customDb = store.get('customFoods', []);
  const existingIdx = customDb.findIndex(f => (item.id && f.id === item.id) || (f.names && f.names[0] === item.names?.[0]));
  if (existingIdx >= 0) {
    customDb[existingIdx] = item;
  } else {
    customDb.push(item);
  }
  store.set('customFoods', customDb);
  
  if (!vitalDb.some(f => (item.id && f.id === item.id) || (f.names && f.names[0] === item.names?.[0]))) {
    vitalDb.push(item);
  }
  
  buildSearchIndex();
  renderCategoryBrowse();
  
  showToast('✅ Aliment sauvegardé définitivement dans votre base !', 'success');
  
  const actionsContainer = document.getElementById('modalActionsContainer');
  if (actionsContainer) {
    const idx = vitalDb.indexOf(item);
    const favs = store.get('favorites', []);
    const isFav = item.id ? favs.some(f => f.id === item.id) : (favs.some(f => f.name?.toLowerCase() === (item.names?.[0] || item.name || '').toLowerCase()));
    actionsContainer.innerHTML = `
      <div style="display:flex; gap:8px; width:100%; flex-wrap:wrap;">
        <button class="btn-primary" style="flex:2; min-width:140px;" onclick="addFoodToMealFromModal(${idx})"><i class="ri-add-line"></i> Ajouter au repas</button>
        <button class="btn-outline" id="modalFavBtn" style="flex:1; min-width:90px;" onclick="toggleFavorite()"><i class="ri-heart-line"></i> Favori</button>
      </div>
    `;
    const favBtn = document.getElementById('modalFavBtn');
    if (favBtn) {
      favBtn.innerHTML = isFav ? '<i class="ri-heart-fill"></i> Retirer' : '<i class="ri-heart-line"></i> Favori';
      favBtn.classList.toggle('active-fav', isFav);
    }
  }
};

window.addFoodToMealFromModal = function(idx) {
  let f = (idx >= 0 && vitalDb[idx]) ? vitalDb[idx] : currentModalFood;
  if (!f) return;
  const name = (f.names?.[0] || f.name || '?').replace(/^./, c => c.toUpperCase());
  const id = f.id || 'dish_' + Date.now();
  const sc = f.scientific_defaults || f.scientific || {};
  const vt = f.vitality || {};
  const sp = f.specific || {};
  
  const isElec = sp.electric === true || f.electric === true || f.approved === true;
  const isHyb = sp.hybrid === true || f.hybrid === true;
  const pral = sc.pral ?? (f.pral ?? 0);
  const nova = vt.nova ?? (f.nova ?? (isElec ? 1 : isHyb ? 2 : 3));
  
  const meals = store.get('meals', []);
  meals.push({
    id,
    name,
    emoji: f.emoji || '🍽️',
    family: f.family || f.category || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
    category: f.category || f.family || (isElec ? 'Vitaliste' : isHyb ? 'Hybride' : 'Alimentation'),
    approved: isElec,
    electric: isElec,
    hybrid: isHyb,
    pral,
    scientific_defaults: { pral, density: sc.density ?? 50 },
    nova,
    vitality: { nova, freshness: vt.freshness ?? 70 },
    freshness: vt.freshness ?? 70,
    mucus: sp.mucus || (isElec ? 'Dissolvant' : isHyb ? 'Faiblement Mucogène' : 'Mucogène'),
    specific: sp,
    note: f.note,
    timestamp: Date.now()
  });
  store.set('meals', meals);
  
  window.closeFoodModal();
  renderMeals();
  renderDashboard();
  showToast(`✅ « ${name} » ajouté directement à vos repas du jour !`, 'success');
};

window.closeFoodModal = function(e) { 
  if (!e || e.target === document.getElementById('foodModal')) {
    document.getElementById('foodModal').classList.remove('open'); 
  }
};

window.setModalTab = function(tab) {
  document.querySelectorAll('.modal-tabs .tab, #modalTabsBar .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const content = document.getElementById('modalTabContent');
  if (!currentModalFood) return;
  const { name, sc, vt, sp, item, isComposedMeal } = currentModalFood._parsed || {};

  const pral = sc?.pral ?? (item?.pral ?? 0);
  const isAlkaline = pral < 0;
  const nova = vt?.nova ?? (item?.nova ?? 1);
  const isElectric = sp?.electric === true || item?.electric === true || item?.approved === true;
  const isHybrid = sp?.hybrid === true || item?.hybrid === true;

  // ═══════ 1. COMPOSÉ: INGRÉDIENTS & COMPOSITION ═══════
  if (tab === 'meal_ingredients') {
    const rawItems = item?.items || item?.ingredients || [];
    const items = Array.isArray(rawItems) ? rawItems : (typeof rawItems === 'string' ? rawItems.split(/,\s*|\s*·\s*/).filter(Boolean) : [rawItems]);
    
    content.innerHTML = `
      <div style="margin-bottom:12px; font-size:0.85rem; color:var(--text-dim); display:flex; align-items:center; justify-content:space-between;">
        <span><i class="ri-restaurant-line" style="color:var(--accent);"></i> <strong>${items.length} ingrédients</strong> composent ce repas :</span>
      </div>
      <div class="meal-ingredients-list" style="display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto; padding-right:4px;">
        ${items.map(it => {
          const itName = typeof it === 'string' ? it : (it.name || 'Ingrédient');
          // Match in DB if possible
          const matched = vitalDb.find(f => (f.names || []).some(n => n.toLowerCase() === itName.toLowerCase()) || f.id === itName.toLowerCase() || (f.name && f.name.toLowerCase() === itName.toLowerCase()) || (f.names && f.names.some(n => itName.toLowerCase().includes(n.toLowerCase()))));
          
          let itEmoji = it.emoji;
          if (!itEmoji && matched) itEmoji = matched.emoji;
          if (!itEmoji) {
            const lower = itName.toLowerCase();
            if (lower.includes('moule')) itEmoji = '🦪';
            else if (lower.includes('sardine') || lower.includes('poisson')) itEmoji = '🐟';
            else if (lower.includes('concombre')) itEmoji = '🥒';
            else if (lower.includes('olive')) itEmoji = '🫒';
            else if (lower.includes('basilic') || lower.includes('persil') || lower.includes('herbe')) itEmoji = '🌿';
            else if (lower.includes('citron')) itEmoji = '🍋';
            else if (lower.includes('avocat')) itEmoji = '🥑';
            else if (lower.includes('tomate')) itEmoji = '🍅';
            else if (lower.includes('salade') || lower.includes('romaine')) itEmoji = '🥬';
            else itEmoji = '🌱';
          }

          const isElec = matched ? (matched.specific?.electric || matched.electric || matched.approved) : true;
          const pralVal = matched ? (matched.scientific_defaults?.pral ?? -2.0) : -2.0;
          const pralLabel = pralVal < 0 ? `PRAL ${pralVal.toFixed(1)} (Alcalin)` : `PRAL +${pralVal.toFixed(1)}`;
          const badgeClass = isElec ? 'badge-electric' : 'badge-hybrid';
          const badgeText = isElec ? '⚡ Électrique' : '🔀 Hybride';
          
          return `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.3rem;">${itEmoji}</span>
                <div>
                  <div style="font-weight:600; font-size:0.9rem; color:var(--text);">${esc(itName)}</div>
                  <div style="font-size:0.75rem; color:var(--text-dim);">${esc(pralLabel)}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="food-badge ${badgeClass}" style="font-size:0.72rem; padding:3px 7px;">${badgeText}</span>
                ${matched ? `<button type="button" class="btn-sm-action" onclick="openFoodModal('${matched.id}')" title="Voir la fiche détaillée de cet ingrédient" style="background:rgba(55,211,153,0.1); color:var(--accent); border:1px solid rgba(55,211,153,0.3); border-radius:6px; padding:3px 8px; font-size:0.75rem; cursor:pointer;"><i class="ri-information-line"></i></button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top:14px; padding:10px 12px; background:rgba(55,211,153,0.06); border:1px solid rgba(55,211,153,0.2); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
        <strong style="color:var(--accent);">💡 Astuce Vitaliste :</strong> Chaque aliment apporte ses propres biominéraux vivants. Cliquez sur <i class="ri-information-line"></i> pour inspecter la fiche d'un ingrédient spécifique.
      </div>
    `;
    return;
  }

  // ═══════ 2. COMPOSÉ: BILAN, CUISSONS & QUALITÉ DES HUILES ═══════
  if (tab === 'meal_balance') {
    const cooking = COOKING_METHODS[currentModalFood._parsed.cookingMethod || item?.cookingMethod || 'steam'] || COOKING_METHODS.steam;
    const oil = OIL_QUALITIES[currentModalFood._parsed.oilQuality || item?.oilQuality || (isElectric ? 'raw_olive' : 'none')] || OIL_QUALITIES.none;

    const basePral = Number((sc?.pral ?? (item?.pral ?? 0)).toFixed(1));
    const adjustedPral = Number((basePral + cooking.pralModifier + (oil.isPositive ? -0.2 : 0.8)).toFixed(1));
    const adjustedIsAlkaline = adjustedPral < 0;
    
    // Bio-enzymatic vitality score
    const vitalityScore = Math.max(20, Math.min(100, Math.round(cooking.vitalityRetention * (oil.isPositive ? 1.0 : 0.8))));
    const vitalityColor = vitalityScore >= 85 ? '#4ade80' : vitalityScore >= 60 ? '#facc15' : '#ef4444';
    const effectiveNova = cooking.id === 'fry' ? Math.max(3, nova) : nova;
    const novaColor = effectiveNova === 1 ? '#4ade80' : effectiveNova === 2 ? '#38bdf8' : effectiveNova === 3 ? '#facc15' : '#ef4444';

    content.innerHTML = `
      <!-- 1. Cuisson & Altération Thermique -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px;">
        <div style="font-size:0.82rem; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span><i class="ri-fire-line"></i> Mode de Cuisson</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">Temp. max : ${cooking.tempMax}°C</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
          ${Object.values(COOKING_METHODS).map(cm => `
            <button type="button" class="preset-pill ${cm.id === cooking.id ? 'active' : ''}" onclick="setMealCookingMethod('${cm.id}')" style="font-size:0.78rem; padding:4px 10px;">
              ${cm.emoji} ${esc(cm.label)}
            </button>
          `).join('')}
        </div>
        <p style="font-size:0.78rem; color:var(--text-dim); line-height:1.4; margin:0;">${esc(cooking.description)}</p>
      </div>

      <!-- 2. Qualité des Lipides & Huiles -->
      <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px;">
        <div style="font-size:0.82rem; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span><i class="ri-drop-line"></i> Matières Grasses & Huiles</span>
          <span style="font-size:0.75rem; color:${oil.isPositive ? '#4ade80' : '#ef4444'}; font-weight:600;">${oil.isPositive ? '🟢 Non-oxydé' : '🔴 Oxydé / Pro-inflammatoire'}</span>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
          ${Object.values(OIL_QUALITIES).map(oq => `
            <button type="button" class="preset-pill ${oq.id === oil.id ? 'active' : ''}" onclick="setMealOilQuality('${oq.id}')" style="font-size:0.78rem; padding:4px 10px;">
              ${oq.emoji} ${esc(oq.label)}
            </button>
          `).join('')}
        </div>
        <p style="font-size:0.78rem; color:var(--text-dim); line-height:1.4; margin:0;">
          <strong style="color:var(--text);">${esc(oil.lipidQuality)} :</strong> ${esc(oil.healthImpact)}
        </p>
      </div>

      <!-- 3. Impact Physiologique & Rénal Réel -->
      <div class="data-row">
        <span class="data-label">Vitalité Bio-Enzymatique Réelle</span>
        <span class="data-value" style="font-weight:800; color:${vitalityColor}">
          ${vitalityScore}% ${vitalityScore >= 85 ? '✨ Vivant & Intact' : vitalityScore >= 60 ? '⚡ Préservation Moyenne' : '⚠️ Glycation (AGEs) & Dénaturé'}
        </span>
      </div>
      <div class="data-row">
        <span class="data-label">Charge PRAL ajustée (après cuisson)</span>
        <span class="data-value" style="font-weight:700; color:${adjustedIsAlkaline ? '#4ade80' : '#facc15'}">
          ${adjustedPral > 0 ? '+' : ''}${adjustedPral.toFixed(1)} mEq ${adjustedIsAlkaline ? '(Alcalinisant)' : '(Acidifiant)'}
        </span>
      </div>
      <div class="data-row">
        <span class="data-label">Impact Rénal & Émonctoires</span>
        <span class="data-value" style="font-weight:600;">
          ${adjustedIsAlkaline ? '🟢 Élimination fluide & Préservation minérale' : '🟡 Métabolites acides à tamponner'}
        </span>
      </div>
      <div class="data-row">
        <span class="data-label">Indice de Transformation NOVA</span>
        <span class="data-value" style="font-weight:700; color:${novaColor}">
          NOVA ${effectiveNova}/4
        </span>
      </div>
      <div class="data-row">
        <span class="data-label">Impact Lymphatique & Mucus</span>
        <span class="data-value" style="font-weight:600; color:${cooking.id === 'fry' || !oil.isPositive ? '#facc15' : '#4ade80'}">
          ${cooking.id === 'fry' || !oil.isPositive ? '⚠️ Colles lipidiques chauffées' : '🍃 Dissolvant & Non-obstruant'}
        </span>
      </div>
      <div style="margin-top:14px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
        <strong style="color:var(--text)">Bilan global du plat :</strong> ${cooking.id === 'raw' ? 'Alimentation vivante et pure sans altération enzymatique.' : cooking.id === 'steam' ? 'Cuisson respectueuse libérant les fibres sans caramélisation ni fuite minérale majeure.' : cooking.id === 'fry' ? 'La friture génère des réactions de glycation avancée (AGEs) et altère les corps gras.' : 'Préparation thermique modérée préservant les nutriments digestibles.'}
      </div>
    `;
    return;
  }

  // ═══════ 3. COMPOSÉ: NOTE & CONSEIL COACH ═══════
  if (tab === 'meal_coach') {
    const coachNote = item?.note || currentModalFood.note || 'Repas vitaliste équilibré conçu pour maximiser l\'hydratation cellulaire et régénérer le système digestif.';
    const categoryLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' };
    const catName = categoryLabels[item?.category] || (item?.category || 'Repas');
    
    content.innerHTML = `
      <div style="padding:14px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:10px; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="font-size:1.2rem;">💡</span>
          <strong style="color:var(--text); font-size:0.95rem;">Note & Recommandations du Coach IA :</strong>
        </div>
        <p style="font-size:0.88rem; color:var(--text); line-height:1.5; margin:0;">
          ${esc(coachNote)}
        </p>
      </div>
      <div class="data-row">
        <span class="data-label">Moment du repas</span>
        <span class="data-value" style="font-weight:600;">${esc(catName)}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Tisane drainante recommandée</span>
        <span class="data-value" style="color:var(--accent);">🌿 Ortie & Citron ou Gingembre doux</span>
      </div>
      <div style="margin-top:14px; padding:10px 12px; background:rgba(55,211,153,0.06); border:1px solid rgba(55,211,153,0.2); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
        <strong style="color:var(--accent)">Historique permanent :</strong> Ces recommandations restent associées à ce repas dans votre journal même après réinitialisation du chat.
      </div>
    `;
    return;
  }

  // ═══════ ALIMENT BRUT / SCIENTIFIQUE ═══════
  if (tab === 'scientific') {
    const srcName = currentModalFood.source || item?.source || 'USDA FoodData Central / Table PRAL (Remer & Manz)';
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
      <div style="margin-top:8px; padding:6px 10px; background:rgba(16,185,129,0.05); border:1px dashed var(--border); border-radius:6px; font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; gap:6px;">
        <i class="ri-book-read-line" style="color:var(--accent);"></i>
        <span><strong>Source vérifiée :</strong> ${esc(srcName)}</span>
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
      <div style="margin-top:8px; padding:6px 10px; background:rgba(16,185,129,0.05); border:1px dashed var(--border); border-radius:6px; font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; gap:6px;">
        <i class="ri-book-read-line" style="color:var(--accent);"></i>
        <span><strong>Source méthodologique :</strong> Classification NOVA (Université de São Paulo, Pr. Carlos Monteiro)</span>
      </div>
    `;
  } else {
    // ═══════ SPÉCIFIQUE / VITALISTE & SEBI ═══════
    const cat = (currentModalFood.category || item?.category || '').toLowerCase();
    const fam = (currentModalFood.family || item?.family || '').toLowerCase();
    const lbl = (sp?.label || item?.specific?.label || '').toLowerCase();
    const foodName = (currentModalFood.names?.[0] || currentModalFood.name || '').toLowerCase();

    const isAnimal = cat.includes('poisson') || cat.includes('viande') || cat.includes('lait') || 
                     cat.includes('oeuf') || cat.includes('charcut') || cat.includes('fruit de mer') || 
                     fam.includes('clupeidae') || fam.includes('bov') || fam.includes('suid') || 
                     lbl.includes('animal') || foodName.includes('sardine') || foodName.includes('thon') || 
                     foodName.includes('saumon') || foodName.includes('viande') || foodName.includes('poulet') || 
                     foodName.includes('boeuf') || foodName.includes('porc') || foodName.includes('fromage');

    const isMineral = cat.includes('sel') || cat.includes('eau') || cat.includes('miner') || foodName.includes('sel marin');

    const mucusStr = (sp?.mucus || item?.mucus || '').toLowerCase();
    const isDissolvant = !isAnimal && (mucusStr.includes('dissolvant') || mucusStr.includes('non-muc'));
    const isAlcalinFood = !isAnimal && ((sc?.pral ?? 0) < 0 || isDissolvant);
    const sebiStatus = sp?.sebiStatus || item?.sebiStatus;
    
    let sebiLabel = '❌ Non Recommandé / Acidifiant';
    let sebiColor = '#ef4444';
    let hybridLabel = isHybrid ? '⚠️ Hybride / Amilacé' : '✅ Végétal Originel & Brut';
    let hybridColor = isHybrid ? '#facc15' : '#4ade80';

    if (isAnimal) {
      sebiLabel = '❌ Non Recommandé / Produit Animal';
      sebiColor = '#ef4444';
      hybridLabel = '❌ Non Végétal (Règne Animal)';
      hybridColor = '#94a3b8';
    } else if (isMineral) {
      sebiLabel = '🌊 Minéral Naturel Pur';
      sebiColor = '#38bdf8';
      hybridLabel = '🌊 Non Végétal (Règne Minéral)';
      hybridColor = '#94a3b8';
    } else {
      if (sebiStatus === 'sebi_official' || (isElectric && !sp?.label?.includes('Sauvage') && !sp?.label?.includes('Indigène'))) {
        sebiLabel = '⚡ Liste Officielle Dr. Sebi';
        sebiColor = '#4ade80';
      } else if (sebiStatus === 'wild_original' || isElectric) {
        sebiLabel = '⚡ Végétal Sauvage / Originel (Conforme Sebi)';
        sebiColor = '#4ade80';
      } else if (isAlcalinFood && !isHybrid) {
        sebiLabel = '🌿 Végétal Naturel Alcalin (Hors liste Sebi)';
        sebiColor = '#38bdf8';
      } else if (isHybrid) {
        sebiLabel = '⚠️ Hybride / Amilacé';
        sebiColor = '#facc15';
      }
    }

    let mucusLabel = sp?.mucus ?? (isDissolvant ? 'Dissolvant' : 'Neutre');
    let mucusColor = '#4ade80';
    if (isAnimal) {
      mucusLabel = '🔴 Fortement mucogène (Protéines animales putrescibles)';
      mucusColor = '#ef4444';
    } else if (isDissolvant) {
      mucusLabel = '🍃 Dissolvant de mucus (Astringent)';
      mucusColor = '#4ade80';
    } else if (mucusStr.includes('neutre') || (!mucusStr.includes('mucog') && isAlcalinFood)) {
      mucusLabel = '🟢 Non-mucogène (Neutre)';
      mucusColor = '#2dd4bf';
    } else if (mucusStr.includes('faible') || isHybrid) {
      mucusLabel = '🟡 Faiblement mucogène';
      mucusColor = '#facc15';
    } else {
      mucusLabel = '🔴 Fortement mucogène';
      mucusColor = '#ef4444';
    }

    let verdictLabel = sp?.label ?? (isElectric ? '⚡ Électrique & Régénérant' : isAlcalinFood ? '🌿 Végétal Vivant Alcalinisant & Dissolvant' : isHybrid ? '🔀 Hybride modéré' : isAnimal ? '⛔ Animal / Acidogène & Mucogène' : '⛔ Mucogène & Acidogène');
    let verdictColor = isElectric ? '#4ade80' : isAlcalinFood ? '#38bdf8' : isHybrid ? '#facc15' : '#ef4444';

    const noteText = currentModalFood.note || item?.note;

    content.innerHTML = `
      <div class="data-row">
        <span class="data-label">Polarité & Origine (Dr. Sebi)</span>
        <span class="data-value" style="font-weight:700; color:${sebiColor}">${sebiLabel}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Nature Botanique & Hybridation</span>
        <span class="data-value" style="font-weight:600; color:${hybridColor}">${hybridLabel}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Indice Mucus (Arnold Ehret)</span>
        <span class="data-value" style="font-weight:600; color:${mucusColor}">${mucusLabel}</span>
      </div>
      <div class="data-row">
        <span class="data-label">Verdict Vitaliste</span>
        <span class="data-value" style="font-weight:700; color:${verdictColor}">${verdictLabel}</span>
      </div>
      ${noteText ? `
        <div style="margin-top:14px; padding:10px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
          <strong style="color:var(--text)"><i class="ri-information-line" style="color:var(--accent);"></i> Précision Thérapeutique :</strong> ${esc(noteText)}
        </div>
      ` : ''}
      <div style="margin-top:8px; padding:6px 10px; background:rgba(16,185,129,0.05); border:1px dashed var(--border); border-radius:6px; font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; gap:6px;">
        <i class="ri-shield-check-line" style="color:var(--accent);"></i>
        <span><strong>Sources méthodologiques :</strong> Guide Nutritionnel Dr. Sebi & Système de Guérison du Régime Sans Mucus (Arnold Ehret)</span>
      </div>
    `;
  }
};

// ═══════ FAVORITES ═══════
window.toggleFavorite = function() {
  if (!currentModalFood) return;
  let favs = store.get('favorites', []);
  const targetId = currentModalFood.id;
  const name = (currentModalFood.names?.[0] || currentModalFood.name || 'Inconnu').replace(/^./, c => c.toUpperCase());
  const idx = favs.findIndex(f => (targetId && f.id === targetId) || f.name?.toLowerCase() === name.toLowerCase());
  
  const sc = currentModalFood.scientific_defaults || currentModalFood.scientific || {};
  const pral = sc.pral ?? (currentModalFood.pral ?? 0);
  const isElec = currentModalFood.specific?.electric === true || currentModalFood.electric === true || currentModalFood.approved === true;

  if (idx >= 0) { 
    favs.splice(idx, 1); 
    showToast(`💔 "${name}" retiré des favoris`, 'info');
  } else {
    favs.push({ 
      id: targetId || `fav_${Date.now()}`, 
      name, 
      names: currentModalFood.names || [name],
      emoji: currentModalFood.emoji || '🍽️', 
      family: currentModalFood.family || currentModalFood.category || 'Alimentation', 
      category: currentModalFood.category || currentModalFood.family || 'Alimentation', 
      electric: isElec, 
      pral,
      scientific_defaults: sc,
      vitality: currentModalFood.vitality || {},
      specific: currentModalFood.specific || {}
    });
    showToast(`❤️ "${name}" ajouté aux favoris !`, 'success');
  }
  store.set('favorites', favs);
  const isFav = favs.some(f => (targetId && f.id === targetId) || f.name?.toLowerCase() === name.toLowerCase());
  const favBtn = document.getElementById('modalFavBtn');
  if (favBtn) {
    favBtn.innerHTML = isFav ? '<i class="ri-heart-fill"></i> Retirer' : '<i class="ri-heart-line"></i> Favori';
    favBtn.classList.toggle('active-fav', isFav);
  }
  renderFavorites();

  // Also re-render search if on search page
  if (currentSearchFilter === 'favorites') {
    _doSearch(document.getElementById('searchInput')?.value || '');
  } else if (_lastSearchResults.length > 0) {
    renderSearchResults(_lastSearchResults, _lastSearchQuery);
  }
};

function renderFavorites() {
  const favs = store.get('favorites', []);
  const list = document.getElementById('favsList');
  if (!list) return;
  if (favs.length === 0) { list.innerHTML = '<p class="empty-state">Aucun favori. Ajoutez des aliments depuis la recherche.</p>'; return; }
  list.innerHTML = favs.map(f => {
    const isE = f.electric === true || f.approved === true || f.specific?.electric === true;
    const isH = f.hybrid === true || f.specific?.hybrid === true;
    const pral = f.scientific_defaults?.pral ?? (f.pral ?? 0);
    const mucusStr = (f.specific?.mucus || f.mucus || '').toLowerCase();
    const isDissolvant = mucusStr.includes('dissolvant') || mucusStr.includes('non-muc');
    const isAlcalin = pral < 0 || isDissolvant;
    const bc = isE ? 'badge-electric' : isH ? 'badge-hybrid' : (isAlcalin && !mucusStr.includes('mucog')) ? 'badge-alkaline' : 'badge-mucus';
    const bt = isE ? 'Électrique' : isH ? 'Hybride' : (isAlcalin && !mucusStr.includes('mucog')) ? 'Alcalinisant' : 'Mucogène';

    return `<div class="food-card clickable" onclick="openFoodModal('${f.id || esc(f.name)}')" style="cursor:pointer;">
      <span class="food-fav-icon"><i class="ri-heart-fill"></i></span>
      <div class="food-emoji">${f.emoji || '🍽️'}</div>
      <div class="food-info">
        <div class="food-name">${esc(f.name)}</div>
        <div class="food-meta">${esc(f.family || f.category || '')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)}</div>
      </div>
      <span class="food-badge ${bc}">${bt}</span>
    </div>`;
  }).join('');
}

// ═══════ MEALS ═══════
window.showAddMealModal = function() { selectedMealFoods = []; renderSelectedMealFoods(); document.getElementById('mealSearchResults').innerHTML = ''; document.getElementById('mealSearchInput').value = ''; const aiInput = document.getElementById('aiDishInput'); if (aiInput) aiInput.value = ''; document.getElementById('addMealModal').classList.add('open'); };
window.closeAddMealModal = function(e) { if (!e || e.target === document.getElementById('addMealModal')) document.getElementById('addMealModal').classList.remove('open'); };

function classifyFoodLocally(token) {
  const clean = (token || '').trim();
  const lower = clean.toLowerCase();

  // 1. Check in vitalDb for exact or whole-word match first
  const match = vitalDb.find(item => (item.names || [item.name || '']).some(n => {
    const nl = n.toLowerCase();
    return nl === lower || (lower.length >= 3 && nl.split(/\s+/).includes(lower));
  }));
  if (match) return match;

  // 2. Fast Food / Junk Food / Ultra-Processed / Complex Dishes
  const isUltraProcessed = /burrito|wrap|tacos|fajita|quesadilla|nachos|poutine|burger|hamburger|cheeseburger|pizza|frite|frites|hot-?dog|kebab|shawarma|nugget|nuggets|chips|raclette|fondue|tartiflette|bacon|saucisse|soda|coca|donut|croissant|gaufre|biscuit|snack|fast-?food|croque-?monsieur|lasagne|quiche|p[aâ]t[eé]|p[aâ]t[eé]\s*chinois|hachis|hachis\s*parmentier|tourti[eè]re|gratin|moussaka|shepherd|cottage\s*pie|boeuf\s*bourguignon|chili\s*con\s*carne|cordon\s*bleu/i.test(lower);
  
  // 3. Electric & Wild Original Foods (Dr. Sebi + African/Amazonian/Nordic Wild Superfoods)
  const isElectric = !isUltraProcessed && /avocat|concombre|mangue|papaye|melon|pasteque|pastèque|datte|figue|pomme|poire|cerise|prune|raisin|citron|citron vert|lime|kale|amarante|fonio|quinoa|kamut|teff|courgette|lin|chia|sésame|sesame|olive|roquette|cresson|mache|mâche|gingembre|aneth|basilic|coriandre|origan|romarin|thym|sauvage|spiruline|clémentine|mandarine|mûre|framboise|myrtille|fraise|strawberry|raspberry|blueberry|blackberry|moringa|baobab|bouye|bissap|hibiscus|bleuet|canneberge|argousier|ortie|pissenlit|ditakh|dettarium|madd|saba|gombo|soursop|corossol|sureau|aronia|camu|acai|acerola|pousse|germe/i.test(lower);
  
  // 4. Natural Living Plant Foods / Fresh Fruits & Raw Greens (Non-Sebi living foods: PRAL negative, NOVA 1, Mucus Dissolving)
  const isNaturalPlantAlkaline = !isUltraProcessed && !isElectric && /fruit|baie|berry|goyave|guava|lychee|litchi|passion|maracuja|grenade|pomegranate|kiwi|abricot|apricot|peche|pêche|nectarine|ananas|pineapple|mangoustan|mangosteen|kaki|persimmon|pitaya|dragon|tamarin|tamarind|agrumes|orange|mandarine|clementine|pamplemousse|salade|laitue|verdure|epinard|épinard|tisane|infusion/i.test(lower);

  // 5. Hybridized / Acidifying Starchy Foods
  const isHybrid = !isUltraProcessed && !isElectric && !isNaturalPlantAlkaline && /carotte|mais|maïs|pomme de terre|patate|riz|ble|blé|soja|tofu|seitan|haricot|lentille|pois|aubergine|champignon/i.test(lower);
  
  // 6. Animal Products / Dairy / Standard Mucus-forming
  const isAnimalMucus = !isUltraProcessed && !isElectric && !isNaturalPlantAlkaline && !isHybrid && /viande|poulet|boeuf|bœuf|porc|veau|agneau|canard|dinde|fromage|lait|creme|crème|beurre|oeuf|œuf|poisson|saumon|thon|crevette/i.test(lower);

  let emoji = '🍽️';
  let family = 'Alimentation';
  let category = 'Alimentation';

  if (/burrito|wrap|tacos|fajita|quesadilla/i.test(lower)) { emoji = '🌯'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/poutine|frite/i.test(lower)) { emoji = '🍟'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/burger/i.test(lower)) { emoji = '🍔'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/pizza/i.test(lower)) { emoji = '🍕'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/kebab|shawarma/i.test(lower)) { emoji = '🥙'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/p[aâ]t[eé]|hachis|lasagne|gratin|quiche|tourti[eè]re/i.test(lower)) { emoji = '🥘'; family = 'Plats Cuisinés & Fast Food'; category = 'Plats Cuisinés & Fast Food'; }
  else if (/avocat/i.test(lower)) { emoji = '🥑'; family = 'Fruits'; category = 'Fruits'; }
  else if (/concombre/i.test(lower)) { emoji = '🥒'; family = 'Légumes'; category = 'Légumes'; }
  else if (/mangue/i.test(lower)) { emoji = '🥭'; family = 'Fruits'; category = 'Fruits'; }
  else if (/papaye/i.test(lower)) { emoji = '🍈'; family = 'Fruits'; category = 'Fruits'; }
  else if (/pomme/i.test(lower)) { emoji = '🍎'; family = 'Fruits'; category = 'Fruits'; }
  else if (/banane/i.test(lower)) { emoji = '🍌'; family = 'Fruits'; category = 'Fruits'; }
  else if (/melon|pasteque|pastèque/i.test(lower)) { emoji = '🍉'; family = 'Fruits'; category = 'Fruits'; }
  else if (/raisin/i.test(lower)) { emoji = '🍇'; family = 'Fruits'; category = 'Fruits'; }
  else if (/citron/i.test(lower)) { emoji = '🍋'; family = 'Fruits'; category = 'Fruits'; }
  else if (/fraise|strawberry/i.test(lower)) { emoji = '🍓'; family = 'Fruits'; category = 'Fruits'; }
  else if (/framboise|myrtille|blueberry|raspberry/i.test(lower)) { emoji = '🫐'; family = 'Fruits'; category = 'Fruits'; }
  else if (/salade|laitue|kale|roquette/i.test(lower)) { emoji = '🥗'; family = 'Légumes'; category = 'Légumes'; }
  else if (/riz|quinoa|cereale|amarante|fonio|kamut/i.test(lower)) { emoji = '🌾'; family = 'Céréales'; category = 'Céréales'; }
  else if (/haricot|lentille|pois/i.test(lower)) { emoji = '🫘'; family = 'Légumineuses'; category = 'Légumineuses'; }
  else if (/amande|noix|noisette|chia|lin|sesame|sésame/i.test(lower)) { emoji = '🥜'; family = 'Noix & Graines'; category = 'Noix & Graines'; }
  else if (/the|thé|tisane|infusion/i.test(lower)) { emoji = '🍵'; family = 'Herbes & Thés'; category = 'Herbes & Thés'; }
  else if (/pain|baguette|boulange/i.test(lower)) { emoji = '🥖'; family = 'Pain & Boulangerie'; category = 'Pain & Boulangerie'; }
  else if (/fromage/i.test(lower)) { emoji = '🧀'; family = 'Produits Laitiers'; category = 'Produits Laitiers'; }
  else if (/viande|boeuf|bœuf|steak|poulet|porc/i.test(lower)) { emoji = '🥩'; family = 'Viandes & Charcuterie'; category = 'Viandes & Charcuterie'; }
  else if (/poisson|saumon|thon|crevette/i.test(lower)) { emoji = '🐟'; family = 'Poissons & Fruits de mer'; category = 'Poissons & Fruits de mer'; }
  else if (isNaturalPlantAlkaline) { emoji = '🌿'; family = 'Fruits & Végétaux'; category = 'Fruits'; }

  let pral, density, nova, freshness, mucus, label, note, sebiStatus;

  if (isUltraProcessed) {
    pral = 15.8;
    density = 20;
    nova = 4;
    freshness = 20;
    mucus = 'Fortement Mucogène';
    label = 'Ultra-Transformé / Fast Food';
    sebiStatus = 'non_approved';
    if (!category || category === 'Alimentation') {
      family = 'Plats Cuisinés & Fast Food';
      category = 'Plats Cuisinés & Fast Food';
    }
    note = 'Plat complexe ultra-transformé générant une forte acidose rénale (PRAL +' + pral.toFixed(1) + ') et une charge mucogène élevée.';
  } else if (isElectric) {
    pral = -4.5;
    density = 90;
    nova = 1;
    freshness = 95;
    mucus = 'Dissolvant';
    label = 'Électrique (Dr. Sebi & Sauvage)';
    sebiStatus = /ditakh|dettarium|madd|saba|bouye|baobab|bissap|moringa|camu|aronia|sureau|argousier/i.test(lower) ? 'wild_original' : 'sebi_official';
    if (!category || category === 'Alimentation') {
      family = 'Fruits';
      category = 'Fruits';
    }
    note = 'Aliment bio-minéral alcalinisant à haute charge électrolytique favorisant le nettoyage cellulaire.';
  } else if (isNaturalPlantAlkaline) {
    pral = -3.2;
    density = 85;
    nova = 1;
    freshness = 90;
    mucus = 'Dissolvant';
    label = 'Végétal Vivant Alcalinisant';
    sebiStatus = 'natural_alkaline';
    if (!category || category === 'Alimentation') {
      family = 'Fruits & Végétaux';
      category = 'Fruits';
    }
    note = 'Fruit ou végétal naturel vivant, alcalinisant et dissolvant naturel des mucosités et toxines.';
  } else if (isHybrid) {
    pral = 2.5;
    density = 55;
    nova = 2;
    freshness = 65;
    mucus = 'Faiblement Mucogène';
    label = 'Aliment Hybride';
    sebiStatus = 'hybrid';
    if (!category || category === 'Alimentation') {
      family = 'Céréales';
      category = 'Céréales';
    }
    note = 'Aliment issu d\'hybridations végétales, contenant des amidons modérément mucogènes.';
  } else if (isAnimalMucus) {
    pral = 10.5;
    density = 40;
    nova = 3;
    freshness = 30;
    mucus = 'Mucogène Élevé';
    label = 'Produit Animal / Mucogène';
    sebiStatus = 'non_approved';
    if (!category || category === 'Alimentation') {
      family = 'Viandes & Charcuterie';
      category = 'Viandes & Charcuterie';
    }
    note = 'Génère une production intense de mucus lymphatique et une charge acide importante.';
  } else {
    pral = 0.5;
    density = 60;
    nova = 1;
    freshness = 75;
    mucus = 'Neutre';
    label = 'Végétal Brut / Neutre';
    sebiStatus = 'natural_alkaline';
    family = 'Alimentation Naturelle';
    note = 'Aliment brut naturel analysé selon les règles vitalistes.';
  }

  const nameCap = clean.charAt(0).toUpperCase() + clean.slice(1);

  return {
    id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    names: [nameCap, clean],
    name: nameCap,
    emoji,
    family,
    category,
    approved: isElectric || isNaturalPlantAlkaline,
    electric: isElectric,
    sebiStatus,
    hybrid: isHybrid || isUltraProcessed,
    scientific_defaults: {
      pral,
      density,
      label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant',
      colorValue: pral < 0 ? '0xFF4ade80' : '0xFFfacc15'
    },
    scientific: {
      pral,
      density,
      label: pral < 0 ? 'Alcalinisant puissant' : pral <= 4 ? 'Faiblement acidifiant' : 'Fortement acidifiant',
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
      sebiStatus,
      label
    },
    tags: [isElectric ? 'Dr. Sebi / Sauvage' : isNaturalPlantAlkaline ? 'Végétal Vivant Alcalinisant' : isUltraProcessed ? 'Ultra-Transformé (NOVA 4)' : 'VitalTrack Analyzed'],
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
      const id = item.id || ('dish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
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
    const rawItems = m.items || m.ingredients || [];
    let itemsPreview = '';
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const formatted = rawItems.map(it => typeof it === 'string' ? it : (it.name || '')).filter(Boolean);
      if (formatted.length > 0) {
        itemsPreview = `<div class="meal-item-ingredients" style="font-size:0.8rem; color:var(--text-dim); margin:3px 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:85vw;">
          <span style="color:var(--accent);">🥗</span> ${esc(formatted.join(' · '))}
        </div>`;
      }
    }
    const cookingObj = COOKING_METHODS[m.cookingMethod];
    const catBadge = m.category ? `<span class="food-badge" style="font-size:0.7rem; padding:2px 6px; background:rgba(255,255,255,0.06);">${esc(m.category.toUpperCase())}</span>` : '';
    const cookingBadge = cookingObj ? `<span class="food-badge" style="font-size:0.7rem; padding:2px 6px; background:rgba(55,211,153,0.1); color:var(--accent);">${cookingObj.emoji} ${esc(cookingObj.label.split(' ')[0])}</span>` : '';

    return `<div class="meal-item clickable" onclick="openFoodModalFromMeal(${i})" style="cursor:pointer;" title="Cliquer pour ouvrir la fiche détaillée du repas">
      <span class="food-emoji">${m.emoji || '🍽️'}</span>
      <div class="meal-item-info" style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="meal-item-name" style="font-weight:700;">${esc(m.name)}</span>
          ${catBadge}
          ${cookingBadge}
        </div>
        ${itemsPreview}
        <div class="meal-item-meta">${isElec ? '⚡ Électrique' : (m.hybrid ? '🔀 Hybride' : '⛔ Mucogène')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)} · NOVA ${m.nova ?? 1}${cookingObj ? ` · ${cookingObj.emoji} ${cookingObj.label.split(' ')[0]}` : ''}</div>
      </div>
      <button class="meal-item-remove" onclick="event.stopPropagation(); removeMeal(${i})" title="Supprimer ce repas"><i class="ri-delete-bin-line"></i></button>
    </div>`;
  }).join('');
}
window.renderMeals = renderMeals;

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
      '<p>Selon la théorie du mucus développée par Arnold Ehret, la consommation d\'aliments biologiquement inadaptés à l\'espèce humaine (viandes, produits laitiers, œufs, graisses animales et féculents raffinés comme la farine blanche) produit lors de la digestion une substance gluante et adhésive.</p>',
      '<p>Cette matière, assimilable à de la colle, tapisse progressivement l\'estomac et les 10 mètres du canal intestinal, s\'infiltre dans les vaisseaux et engorge le système lymphatique.</p>',
      '<div class="mc-callout-formula"><div class="mc-formula-tag">V = P - O</div><div class="mc-formula-text"><strong>Équation Fondamentale d\'Ehret :</strong> La Vitalité (<strong>V</strong>) est égale à la Puissance motrice naturelle (<strong>P</strong>) diminuée de l\'Obstruction interne (<strong>O</strong>) générée par le mucus et les toxines.</div></div>',
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
      '<ul class="mc-list"><li><span class="mc-bullet">●</span><div><strong>Aliments pauvres en mucus :</strong> légumes cuits non féculents, pommes de terre au four (avec peau), pain complet fortement toasté ou grillé (pour détruire le pouvoir collant de l\'amidon).</div></li><li><span class="mc-bullet">●</span><div><strong>Aliments exempts de mucus :</strong> fruits frais de saison, légumes à feuilles vertes, salades crues.</div></li></ul>',
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
      '<ul class="mc-list"><li><span class="mc-bullet">●</span><div><strong>Plan sans petit-déjeuner (Quotidien) :</strong> Abstention de nourriture solide le matin. Prolonge l\'élimination nocturne. La sensation de malaise au réveil est le travail d\'élimination ; manger l\'interrompt.</div></li><li><span class="mc-bullet">●</span><div><strong>24 Heures (1-2 fois/semaine) :</strong> Repas unique vers 15h (fruits, puis légumes).</div></li><li><span class="mc-bullet">●</span><div><strong>36 Heures :</strong> Sauter le souper, jeûner le lendemain, rompre le surlendemain matin. Dissout le mucus incrusté.</div></li><li><span class="mc-bullet">●</span><div><strong>Jeûnes Courts Intermittents (2-5 jours) :</strong> Prise de limonade légère. Régénère le sang sans auto-intoxication.</div></li></ul>'
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
      '<div class="mc-callout-danger"><div class="mc-callout-icon"><i class="ri-alarm-warning-fill"></i></div><div><div class="mc-callout-title">La Règle Absolue du Premier Repas</div><div class="mc-callout-body">Le premier repas doit obligatoirement provoquer une selle abondante sous 1 à 3 heures. Sinon, utilisez un lavement tiède immédiatement.</div></div></div>',
      '<ul class="mc-list"><li><span class="mc-bullet">●</span><div><strong>Pour les corps préparés :</strong> Fruits frais sucrés (cerises, raisins). Les acides se mélangent au mucus pour libérer l\'intestin.</div></li><li><span class="mc-bullet">●</span><div><strong>Pour les mangeurs de viande / non-préparés :</strong> Les fruits doux sont interdits (fermentation violente). Rompez avec des légumes non féculents crus et cuits (choucroute, épinards étuvés) et du pain de son grillé.</div></li></ul>'
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
      '<p><strong>Réfutation du mythe de la langue propre :</strong> Chez un individu très encombré, poursuivre le jeûne jusqu\'à ce que la langue soit rose est dangereux. Le jeûne doit être interrompu dès que la charge toxique en circulation est trop lourde, puis repris après reconstruction.</p>'
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
        <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:${mc.color}; margin-bottom:4px;">${mc.pill}</div>
        <h2 style="margin:0; font-size:1.55rem; color:#fff; line-height:1.2; font-weight:800;">${mc.title}</h2>
      </div>
    </div>
    <p style="margin:0; color:var(--text-dim); font-size:0.95rem;">${mc.shortDesc}</p>
  `;
  
  const footerBtn = `
    <div class="mc-footer-actions">
      <button class="herb-ask-ai-btn" onclick="askAIAboutMasterclass('${esc(mc.title.replace(/'/g, "\\'"))}')">
        <i class="ri-sparkling-fill"></i> Approfondir cette leçon avec le Coach IA
      </button>
    </div>
  `;
  
  document.getElementById('mcBody').innerHTML = mc.content.join('') + footerBtn;
  document.getElementById('masterclassModal').classList.add('open');
};

window.askAIAboutMasterclass = function(title) {
  document.getElementById('masterclassModal').classList.remove('open');
  showPage('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = `Peux-tu m'expliquer en profondeur la leçon d'Arnold Ehret sur "${title}" et comment l'appliquer concrètement dans mon hygiène de vie ?`;
    chatInput.focus();
  }
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
      title: 'Le Jeûne Rationnel',
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
        <i class="ri-arrow-down-s-line jn-expert-chevron"></i>
      </div>
      <div class="jn-expert-body"><div class="jn-expert-body-inner">
        <ul>
          ${exp.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
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

// ═══════ FASTING TIMER & CONTROLS ═══════
window.stepFastingDuration = function(delta) {
  if (fastingState?.active) return;
  const input = document.getElementById('fastingDuration');
  if (!input) return;
  let val = (parseInt(input.value) || 16) + delta;
  val = Math.max(1, Math.min(168, val));
  input.value = val;
  window.onFastingDurationChange();
};

window.setFastingDurationPreset = function(hours) {
  if (fastingState?.active) return;
  const input = document.getElementById('fastingDuration');
  if (input) {
    input.value = hours;
    window.onFastingDurationChange();
  }
};

window.onFastingDurationChange = function() {
  const input = document.getElementById('fastingDuration');
  if (!input) return;
  let hours = parseInt(input.value) || 16;
  hours = Math.max(1, Math.min(168, hours));
  input.value = hours;

  // Update preset chips
  document.querySelectorAll('#fastingDurationPresets .vital-duration-chip').forEach(chip => {
    const h = parseInt(chip.dataset.h);
    chip.classList.toggle('active', h === hours);
  });

  // Safety warning
  const warn = document.getElementById('fastingSafetyWarning');
  if (warn) warn.style.display = hours > 24 ? 'block' : 'none';

  // Fast goal
  const goalEl = document.getElementById('fastGoal');
  if (goalEl) goalEl.textContent = `Objectif : ${hours}h`;
};

window.initFastingDurationControls = function() {
  const select = document.getElementById('fastingType');
  if (select) {
    select.addEventListener('change', () => {
      if (fastingState?.active) return;
      const opt = select.options[select.selectedIndex];
      if (opt && opt.dataset.hours) {
        window.setFastingDurationPreset(parseInt(opt.dataset.hours));
      }
    });
  }
  window.onFastingDurationChange();
};

window.toggleFasting = async function() {
  if (fastingState.active) {
    await stopFasting();
  } else {
    startFasting();
  }
};

function startFasting() {
  const type = document.getElementById('fastingType')?.value || 'intermittent';
  const hours = parseInt(document.getElementById('fastingDuration')?.value) || 16;
  fastingState = { active: true, startTime: Date.now(), durationMs: hours * 3600000, type, interval: null };
  store.set('fasting-active', { startTime: fastingState.startTime, durationMs: fastingState.durationMs, type });
  fastingState.interval = setInterval(updateFastingUI, 1000);
  updateFastingUI();

  // Button state
  const btn = document.getElementById('fastStartBtn');
  const icon = document.getElementById('fastBtnIcon');
  const label = document.getElementById('fastBtnLabel');
  if (btn) {
    btn.className = 'jn-btn-start running stop';
  }
  if (icon) icon.className = 'ri-stop-circle-fill';
  if (label) label.textContent = 'Arrêter le jeûne';

  // Ring status
  const statusEl = document.getElementById('timerLabel');
  if (statusEl) {
    statusEl.textContent = '🔥 EN COURS';
    statusEl.classList.add('active');
  }

  // Lock controls
  document.getElementById('jnFieldType')?.classList.add('locked');
  document.getElementById('jnFieldDuration')?.classList.add('locked');
  const lockBadge = document.getElementById('jnTypeLockBadge');
  if (lockBadge) lockBadge.style.display = 'inline-flex';

  if (window.showToast) window.showToast(`Jeûne démarré ! Objectif : ${hours}h`, 'success');
  renderDashboard();
}

// ═══════ FASTING METABOLIC STAGES & DEBRIEF ENGINE ═══════
const FASTING_METABOLIC_STAGES = [
  { id: 1, minH: 0, maxH: 4, name: "Digestion & Glycémie", icon: "🥗", desc: "Assimilation des nutriments, insuline active." },
  { id: 2, minH: 4, maxH: 8, name: "Chute de l'Insuline", icon: "📉", desc: "Stabilisation du sucre sanguin, repos pancréatique." },
  { id: 3, minH: 8, maxH: 12, name: "Bascule en Cétose", icon: "⚡", desc: "Déplétion glycogène du foie, bascule lipidique." },
  { id: 4, minH: 12, maxH: 16, name: "Brûlage des Graisses", icon: "🔥", desc: "Production active de corps cétoniques, détox initiale." },
  { id: 5, minH: 16, maxH: 24, name: "Autophagie Active", icon: "🧬", desc: "Nettoyage cellulaire profond & recyclage des protéines." },
  { id: 6, minH: 24, maxH: 999, name: "Régénération Profonde", icon: "🌟", desc: "Drainage lymphatique, élimination mucus & cellules souches." }
];

let pendingFastDebrief = null;
let currentFastRating = { energy: 3, clarity: 4, tags: [] };

function getUnlockedStages(hours) {
  return FASTING_METABOLIC_STAGES.filter(s => hours >= s.minH);
}

function getRefeedingProtocol(hours, type) {
  if (hours < 16) {
    return `
      <ul class="refeed-list">
        <li><strong>Premier apport :</strong> Un grand verre d'eau tempérée avec un filet de citron jaune ou d'eau de coco fraîche.</li>
        <li><strong>Repas de rupture :</strong> Fruits aqueux de saison (pomme douce, pastèque, raisin ou papaye) ou salade de jeunes pousses avec concombre.</li>
        <li><strong>Conseil d'Arnold Ehret :</strong> Mangez lentement et mastiquez jusqu'à liquéfaction complète pour réveiller la motilité intestinale en douceur.</li>
      </ul>
    `;
  } else if (hours < 24) {
    return `
      <ul class="refeed-list">
        <li><strong>1. Hydratation réveil :</strong> Eau citronnée tiède (alcalinisante) 20 minutes avant le premier aliment.</li>
        <li><strong>2. Repas balai d'Ehret :</strong> Pomme râpée crue ou salade de carottes râpées assaisonnées d'un filet de citron (sans huile lourde) pour balayer les toxines libérées dans le tube digestif.</li>
        <li><strong>3. À éviter absolument :</strong> Féculents lourds (pains, pâtes, riz dense), produits laitiers ou protéines animales qui bloqueraient brutalement l'élimination en cours.</li>
      </ul>
    `;
  } else if (hours < 48) {
    return `
      <ul class="refeed-list">
        <li><strong>1. Rupture progressive :</strong> 250ml de jus vert fraîchement extrait (concombre, céleri, pomme, épinards) ou eau de source pure.</li>
        <li><strong>2. Première assiette (1h après) :</strong> Légumes non féculents légèrement étuvés (courgettes, épinards, blettes) ou compote de pommes maison sans sucre.</li>
        <li><strong>3. Règle d'or de Morse & Ehret :</strong> La durée de la reprise doit être au moins égale à la moitié de la durée du jeûne pour éviter toute crise d'auto-intoxication.</li>
      </ul>
    `;
  } else {
    return `
      <ul class="refeed-list">
        <li><strong>⚠️ Phase ultra-délicate (Jeûne prolongé de ${hours.toFixed(0)}h) :</strong> Votre système digestif est en sommeil réparateur profond.</li>
        <li><strong>1. Jour 1 :</strong> Exclusivement des jus de fruits sub-acides dilués (raisin ou pomme 50/50 avec eau de source) par petites gorgées espacées de 2h.</li>
        <li><strong>2. Jour 2 :</strong> Fruits aqueux mous mûrs à point (figues fraîches, raisins, melon, papaye).</li>
        <li><strong>3. Interdiction stricte :</strong> Jamais de noix, graines, féculents denses, sel ou aliments cuits gras avant 72h de reprise.</li>
      </ul>
    `;
  }
}

function updateLiveFastingStages(elapsedHours, targetHours) {
  const currentStage = FASTING_METABOLIC_STAGES.slice().reverse().find(s => elapsedHours >= s.minH) || FASTING_METABOLIC_STAGES[0];
  const badge = document.getElementById('currentStageBadge');
  if (badge) {
    badge.innerHTML = `${currentStage.icon} Phase ${currentStage.id} : ${currentStage.name}`;
  }

  const fill = document.getElementById('stagesProgressFill');
  if (fill) {
    const maxReference = Math.max(targetHours || 16, 24);
    const pct = Math.min(100, (elapsedHours / maxReference) * 100);
    fill.style.width = `${Math.max(5, pct)}%`;
  }

  FASTING_METABOLIC_STAGES.forEach(stg => {
    const el = document.getElementById(`stageCard${stg.id}`);
    if (el) {
      const isReached = elapsedHours >= stg.minH;
      const isCurrent = currentStage.id === stg.id;
      el.classList.toggle('completed', isReached && !isCurrent);
      el.classList.toggle('active', isCurrent);
    }
  });
}

window.openFastEndModal = function(elapsedMs, targetMs, type) {
  const modal = document.getElementById('fastEndModal');
  if (!modal) return;

  const elapsedHours = elapsedMs / 3600000;
  const targetHours = targetMs / 3600000;
  const completed = elapsedMs >= targetMs;

  pendingFastDebrief = {
    elapsedMs,
    targetMs,
    type,
    startTime: fastingState.startTime || Date.now() - elapsedMs,
    completed
  };

  currentFastRating = { energy: 3, clarity: 4, tags: [] };

  document.getElementById('fastDebriefElapsed').textContent = `${elapsedHours.toFixed(1)}h`;
  document.getElementById('fastDebriefGoal').textContent = `${targetHours.toFixed(0)}h`;
  const statEl = document.getElementById('fastDebriefStatus');
  if (statEl) {
    statEl.textContent = completed ? 'Accompli 🎉' : 'Arrêté plus tôt ⏱️';
    statEl.style.color = completed ? '#34d399' : '#f59e0b';
  }

  // Stages badges
  const unlocked = getUnlockedStages(elapsedHours);
  const badgesContainer = document.getElementById('fastDebriefStagesBadges');
  if (badgesContainer) {
    badgesContainer.innerHTML = unlocked.map(u => `
      <span class="jn-stage-badge-sm" style="background:rgba(52,211,153,0.15); border-color:rgba(52,211,153,0.4); color:var(--accent);">
        ${u.icon} ${u.name} (${u.minH}h+)
      </span>
    `).join('');
  }

  // Refeeding guide
  const refeedContainer = document.getElementById('fastDebriefRefeedContent');
  if (refeedContainer) {
    refeedContainer.innerHTML = getRefeedingProtocol(elapsedHours, type);
  }

  // Reset ratings UI
  document.querySelectorAll('#fastRatingEnergy .star-rating-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.val === '3');
  });
  document.querySelectorAll('#fastRatingClarity .star-rating-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.val === '4');
  });
  document.querySelectorAll('#fastElimTags .elim-tag-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  if (document.getElementById('fastDebriefNote')) {
    document.getElementById('fastDebriefNote').value = '';
  }

  modal.style.display = 'flex';
};

window.closeFastEndModal = function() {
  const modal = document.getElementById('fastEndModal');
  if (modal) modal.style.display = 'none';
  pendingFastDebrief = null;
};

window.setFastRating = function(type, val) {
  currentFastRating[type] = parseInt(val);
  const containerId = type === 'energy' ? 'fastRatingEnergy' : 'fastRatingClarity';
  document.querySelectorAll(`#${containerId} .star-rating-btn`).forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.val) === parseInt(val));
  });
};

window.toggleElimTag = function(el) {
  if (!el) return;
  el.classList.toggle('active');
  const tag = el.dataset.tag;
  if (el.classList.contains('active')) {
    if (!currentFastRating.tags.includes(tag)) currentFastRating.tags.push(tag);
  } else {
    currentFastRating.tags = currentFastRating.tags.filter(t => t !== tag);
  }
};

window.confirmSaveFastDebrief = function() {
  if (!pendingFastDebrief) {
    closeFastEndModal();
    return;
  }

  const note = document.getElementById('fastDebriefNote')?.value.trim() || '';
  const elapsedH = (pendingFastDebrief.elapsedMs / 3600000).toFixed(1);
  const unlocked = getUnlockedStages(pendingFastDebrief.elapsedMs / 3600000);

  const history = store.get('fasting-history', []);
  history.unshift({
    type: pendingFastDebrief.type,
    startTime: pendingFastDebrief.startTime,
    elapsed: pendingFastDebrief.elapsedMs,
    targetMs: pendingFastDebrief.targetMs,
    completed: pendingFastDebrief.completed,
    energy: currentFastRating.energy,
    clarity: currentFastRating.clarity,
    tags: currentFastRating.tags,
    note: note,
    stagesCount: unlocked.length
  });
  store.set('fasting-history', history.slice(0, 50));

  clearInterval(fastingState.interval);
  fastingState = { active: false, startTime: null, durationMs: 0, type: '', interval: null };
  store.del('fasting-active');

  // Reset Button state
  const btn = document.getElementById('fastStartBtn');
  const icon = document.getElementById('fastBtnIcon');
  const label = document.getElementById('fastBtnLabel');
  if (btn) btn.className = 'jn-btn-start idle';
  if (icon) icon.className = 'ri-play-fill';
  if (label) label.textContent = 'Démarrer le jeûne';

  // Reset Ring status
  const timerDigits = document.getElementById('timerDigits');
  if (timerDigits) timerDigits.textContent = '00:00:00';
  const statusEl = document.getElementById('timerLabel');
  if (statusEl) {
    statusEl.textContent = 'PRÊT';
    statusEl.classList.remove('active');
  }
  const prog = document.getElementById('timerProgress');
  if (prog) prog.style.strokeDashoffset = '637.6';

  // Unlock controls
  document.getElementById('jnFieldType')?.classList.remove('locked');
  document.getElementById('jnFieldDuration')?.classList.remove('locked');
  const lockBadge = document.getElementById('jnTypeLockBadge');
  if (lockBadge) lockBadge.style.display = 'none';

  closeFastEndModal();
  if (window.showToast) window.showToast(`🎉 Session de ${elapsedH}h enregistrée dans votre journal !`, 'success');

  renderFastingHistory();
  renderFastingAnalytics();
  renderDashboard();
};

async function stopFasting() {
  if (!fastingState.active) return;
  const elapsed = Date.now() - fastingState.startTime;
  openFastEndModal(elapsed, fastingState.durationMs, fastingState.type);
}

function updateFastingUI() {
  if (!fastingState.active) {
    updateLiveFastingStages(0, 16);
    return;
  }
  const elapsed = Date.now() - fastingState.startTime;
  const elapsedHours = elapsed / 3600000;
  const targetHours = fastingState.durationMs / 3600000;
  const remaining = Math.max(0, fastingState.durationMs - elapsed);
  const progress = Math.min(1, elapsed / fastingState.durationMs);
  const ts = Math.floor(elapsed / 1000);

  const timerDigits = document.getElementById('timerDigits');
  if (timerDigits) {
    timerDigits.textContent = `${String(Math.floor(ts/3600)).padStart(2,'0')}:${String(Math.floor((ts%3600)/60)).padStart(2,'0')}:${String(ts%60).padStart(2,'0')}`;
  }
  const prog = document.getElementById('timerProgress');
  if (prog) {
    prog.style.strokeDashoffset = 637.6 * (1 - progress);
  }
  const statusEl = document.getElementById('timerLabel');
  if (statusEl) {
    if (remaining <= 0) {
      statusEl.textContent = '🎉 OBJECTIF ATTEINT !';
      statusEl.classList.add('active');
    } else {
      statusEl.textContent = `Reste ${Math.floor(remaining/3600000)}h ${Math.floor((remaining%3600000)/60000)}min`;
    }
  }

  // Update live stages visual
  updateLiveFastingStages(elapsedHours, targetHours);

  // Détection des paliers de jeûne pour le micro-nudge du Pigeon
  const wholeHours = Math.floor(elapsedHours);
  if ((wholeHours === 14 || wholeHours === 16 || wholeHours === 20) && !window._triggeredMilestones?.has(wholeHours)) {
    if (!window._triggeredMilestones) window._triggeredMilestones = new Set();
    window._triggeredMilestones.add(wholeHours);
    if (window.pigeonNudges) window.pigeonNudges.onFastingMilestone(wholeHours);
  }

  // Dashboard mirror
  const dt = document.getElementById('dashFastTimer');
  if (dt && timerDigits) { dt.textContent = timerDigits.textContent; }
  const df = document.getElementById('dashFastFill');
  if (df) { df.style.width = `${progress * 100}%`; }
  const dft = document.getElementById('dashFastType');
  if (dft) {
    const tl = { intermittent:'⏰ Intermittent', warrior:'⚔️ Warrior', waterFast:'💧 Hydrique', juiceFast:'🧃 Jus', fruitFast:'🍎 Fruits', grapeCure:'🍇 Raisin', drySunFast:'☀️ Sec', ramadan:'🌙 Ramadan' };
    dft.textContent = tl[fastingState.type] || fastingState.type;
  }
}

function loadFastingState() {
  const saved = store.get('fasting-active', null);
  const btn = document.getElementById('fastStartBtn');
  const icon = document.getElementById('fastBtnIcon');
  const label = document.getElementById('fastBtnLabel');
  const statusEl = document.getElementById('timerLabel');
  const lockBadge = document.getElementById('jnTypeLockBadge');

  if (saved?.startTime) {
    fastingState = { ...saved, active: true, interval: null };
    fastingState.interval = setInterval(updateFastingUI, 1000);
    updateFastingUI();

    if (btn) btn.className = 'jn-btn-start running stop';
    if (icon) icon.className = 'ri-stop-circle-fill';
    if (label) label.textContent = 'Arrêter le jeûne';
    if (statusEl) {
      statusEl.textContent = '🔥 EN COURS';
      statusEl.classList.add('active');
    }

    document.getElementById('jnFieldType')?.classList.add('locked');
    document.getElementById('jnFieldDuration')?.classList.add('locked');
    if (lockBadge) lockBadge.style.display = 'inline-flex';
  } else {
    if (btn) btn.className = 'jn-btn-start idle';
    if (icon) icon.className = 'ri-play-fill';
    if (label) label.textContent = 'Démarrer le jeûne';
    if (statusEl) {
      statusEl.textContent = 'PRÊT';
      statusEl.classList.remove('active');
    }
    document.getElementById('jnFieldType')?.classList.remove('locked');
    document.getElementById('jnFieldDuration')?.classList.remove('locked');
    if (lockBadge) lockBadge.style.display = 'none';
    updateLiveFastingStages(0, 16);
  }
}

window.deleteFastingEntry = function(index) {
  const history = store.get('fasting-history', []);
  if (index >= 0 && index < history.length) {
    history.splice(index, 1);
    store.set('fasting-history', history);
    renderFastingHistory();
    renderFastingAnalytics();
    if (window.showToast) window.showToast('Session supprimée de l\'historique', 'info');
  }
};

window.showFastingRefeedAdvice = function(hours, type) {
  const protocolHtml = getRefeedingProtocol(hours, type);
  if (window.showVitalConfirm) {
    window.showVitalConfirm({
      title: `Protocole de Rupture (${hours.toFixed(1)}h)`,
      message: protocolHtml,
      icon: 'ri-restaurant-2-line',
      confirmText: 'Compris !',
      cancelText: 'Fermer',
      isPrimary: true
    });
  } else {
    alert(`Protocole de rupture conseillé pour ${hours.toFixed(1)}h de jeûne.`);
  }
};

function renderFastingHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const history = store.get('fasting-history', []);
  if (history.length === 0) {
    list.innerHTML = '<p class="empty-state-sm" data-i18n="fasting.noHistory">Aucune session enregistrée.</p>';
    return;
  }

  const tl = { intermittent:'⏰ Intermittent', warrior:'⚔️ Warrior', waterFast:'💧 Hydrique', juiceFast:'🧃 Jus', fruitFast:'🍎 Fruits', grapeCure:'🍇 Raisin', drySunFast:'☀️ Sec', ramadan:'🌙 Ramadan' };
  const tagLabels = { tongue: '👅 Langue', lightness: '🕊️ Légèreté', sweat: '💦 Transpiration', thirst: '💧 Soif', euphoria: '✨ Clarté' };

  list.innerHTML = history.slice(0, 20).map((h, idx) => {
    const d = new Date(h.startTime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    const hours = h.elapsed / 3600000;
    const stages = getUnlockedStages(hours);
    const highestStage = stages[stages.length - 1] || FASTING_METABOLIC_STAGES[0];

    const tagsHtml = (h.tags && Array.isArray(h.tags) && h.tags.length > 0)
      ? h.tags.map(t => `<span class="jn-stage-badge-sm" style="background:rgba(96,165,250,0.1); border-color:rgba(96,165,250,0.25); color:#93c5fd;">${tagLabels[t] || t}</span>`).join('')
      : '';

    const feelingsText = (h.energy || h.clarity)
      ? `<span style="font-size:0.75rem; color:var(--text-dim);">⚡ Énergie : ${h.energy || '?'}/5 · 🧠 Clarté : ${h.clarity || '?'}/5</span>`
      : '';

    return `
    <div class="jn-rich-card">
      <div class="jn-rich-top">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size:1.5rem; width:42px; height:42px; border-radius:12px; background:rgba(52,211,153,0.1); display:flex; align-items:center; justify-content:center; border:1px solid rgba(52,211,153,0.25);">
            ${highestStage.icon}
          </div>
          <div>
            <div style="display:flex; align-items:baseline; gap:8px;">
              <span style="font-size:1.15rem; font-weight:800; color:var(--text);">${hours.toFixed(1)}h</span>
              <span style="font-size:0.78rem; font-weight:700; color:${h.completed ? '#34d399' : '#f59e0b'};">
                ${h.completed ? '✅ Objectif validé' : '⊙ Arrêté avant'}
              </span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px;">
              ${tl[h.type] || h.type} · ${d}
            </div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="weight-history-btn edit" onclick="showFastingRefeedAdvice(${hours}, '${h.type}')" title="Voir les conseils de reprise alimentaire">
            <i class="ri-restaurant-line"></i>
          </button>
          <button class="weight-history-btn del" onclick="deleteFastingEntry(${idx})" title="Supprimer cette entrée">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>

      <div class="jn-rich-badges">
        <span class="jn-stage-badge-sm">${highestStage.name}</span>
        ${hours >= 16 ? '<span class="jn-stage-badge-sm" style="color:#facc15; border-color:rgba(250,204,21,0.3); background:rgba(250,204,21,0.1);">🧬 Autophagie Validée</span>' : ''}
        ${tagsHtml}
      </div>

      ${feelingsText || h.note ? `
        <div style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:4px;">
          ${feelingsText}
          ${h.note ? `<div style="font-size:0.78rem; color:var(--text); font-style:italic;">« ${esc(h.note)} »</div>` : ''}
        </div>
      ` : ''}
    </div>`;
  }).join('');
}

function renderFastingAnalytics() {
  const history = store.get('fasting-history', []);
  const totalEl = document.getElementById('analyticTotal');
  const hoursEl = document.getElementById('analyticHours');
  const autophEl = document.getElementById('analyticAutophagy');
  const longestEl = document.getElementById('analyticLongest');

  if (totalEl) totalEl.textContent = history.length;
  const totalH = history.reduce((s, h) => s + (h.elapsed || 0), 0) / 3600000;
  if (hoursEl) hoursEl.textContent = `${totalH.toFixed(0)}h`;

  const autophagyCycles = history.filter(h => (h.elapsed / 3600000) >= 16).length;
  if (autophEl) autophEl.textContent = autophagyCycles;

  const longest = history.length ? Math.max(...history.map(h => h.elapsed || 0)) / 3600000 : 0;
  if (longestEl) longestEl.textContent = `${longest.toFixed(0)}h`;
}

// ═══════ BREATHING & WIM HOF ENGINE ═══════
const breathModes = {
  wimhof: { name: 'Wim Hof (Alcalinisant)', inhale: 2, exhale: 2, hold: 0, breaths: 30, retentionAfter: true },
  relax: { name: 'Relaxation (1:2)', inhale: 4, exhale: 8, hold: 0, breaths: 10, retentionAfter: false },
  box: { name: 'Box Breathing (Focus)', inhale: 4, exhale: 4, hold: 4, breaths: 8, retentionAfter: false },
  sleep: { name: '4-7-8 Sommeil Profond', inhale: 4, exhale: 8, hold: 7, breaths: 6, retentionAfter: false },
};

window.switchBreathingTab = function(tabName) {
  const btnTimer = document.getElementById('tabBtnBreathingTimer');
  const btnVideos = document.getElementById('tabBtnBreathingVideos');
  const btnGuide = document.getElementById('tabBtnBreathingGuide');

  const paneTimer = document.getElementById('breathingTabTimer');
  const paneVideos = document.getElementById('breathingTabVideos');
  const paneGuide = document.getElementById('breathingTabGuide');

  if (btnTimer) btnTimer.classList.toggle('active', tabName === 'timer');
  if (btnVideos) btnVideos.classList.toggle('active', tabName === 'videos');
  if (btnGuide) btnGuide.classList.toggle('active', tabName === 'guide');

  if (paneTimer) paneTimer.style.display = tabName === 'timer' ? 'block' : 'none';
  if (paneVideos) paneVideos.style.display = tabName === 'videos' ? 'block' : 'none';
  if (paneGuide) paneGuide.style.display = tabName === 'guide' ? 'block' : 'none';
};

const WIM_HOF_VIDEOS = {
  '3-rounds': {
    title: "Vidéo Guidée Officielle Wim Hof (3 Rounds)",
    desc: "Pratiquez directement en rythme avec Wim Hof lui-même. Suivez les cloches et les indications vocales.",
    src: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg"
  },
  'tutorial': {
    title: "Tutoriel & Technique Pas-à-Pas",
    desc: "Explications détaillées de la technique de respiration par Wim Hof : posture, volume pulmonaire, et rétention.",
    src: "/videos/wim-hof-tutorial.mp4",
    poster: "/videos/posters/wim-hof-tutorial.jpg"
  },
  'science': {
    title: "La Science, l'Immunité & l'Étude Radboud",
    desc: "Analyse médicale et scientifique de l'impact de l'hyperventilation contrôlée et du froid sur le système nerveux autonome.",
    src: "/videos/wim-hof-science.mp4",
    poster: "/videos/posters/wim-hof-science.jpg"
  },
  'tybOi4hjZFQ': {
    title: "Vidéo Guidée Officielle Wim Hof (3 Rounds)",
    desc: "Pratiquez directement en rythme avec Wim Hof lui-même. Suivez les cloches et les indications vocales.",
    src: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg"
  },
  'nzCaZBQkeP8': {
    title: "Tutoriel & Technique Pas-à-Pas",
    desc: "Explications détaillées de la technique de respiration par Wim Hof : posture, volume pulmonaire, et rétention.",
    src: "/videos/wim-hof-tutorial.mp4",
    poster: "/videos/posters/wim-hof-tutorial.jpg"
  },
  'nzCaZQqAs9I': {
    title: "Tutoriel & Technique Pas-à-Pas",
    desc: "Explications détaillées de la technique de respiration par Wim Hof : posture, volume pulmonaire, et rétention.",
    src: "/videos/wim-hof-tutorial.mp4",
    poster: "/videos/posters/wim-hof-tutorial.jpg"
  },
  'D6EPuUdIC1E': {
    title: "La Science, l'Immunité & l'Étude Radboud",
    desc: "Analyse médicale et scientifique de l'impact de l'hyperventilation contrôlée et du froid sur le système nerveux autonome.",
    src: "/videos/wim-hof-science.mp4",
    poster: "/videos/posters/wim-hof-science.jpg"
  }
};

window.loadBreathingVideo = function(videoKey, btnEl) {
  const videoData = WIM_HOF_VIDEOS[videoKey] || WIM_HOF_VIDEOS['3-rounds'];
  const videoPlayer = document.getElementById('wimHofVideoPlayer');
  const sourceEl = document.getElementById('wimHofVideoSource');
  const titleEl = document.getElementById('wimHofActiveTitle');
  const descEl = document.getElementById('wimHofActiveDesc');

  if (titleEl) {
    titleEl.innerHTML = `<i class="ri-video-fill" style="color:var(--accent);"></i> ${videoData.title}`;
  }
  if (descEl) {
    descEl.textContent = videoData.desc;
  }

  if (videoPlayer) {
    const wasPlaying = !videoPlayer.paused;
    if (sourceEl) {
      sourceEl.src = videoData.src;
    }
    videoPlayer.src = videoData.src;
    videoPlayer.poster = videoData.poster;
    videoPlayer.load();
    if (wasPlaying) {
      videoPlayer.play().catch(() => {});
    }
  }

  if (btnEl && btnEl.parentElement) {
    btnEl.parentElement.querySelectorAll('.preset-pill').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
};

window.setBreathMode = function(mode) { 
  currentBreathMode = mode; 
  document.querySelectorAll('.breath-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode)); 
  const desc = breathModes[mode] ? `${breathModes[mode].name} — ${breathModes[mode].breaths} respirations/tour` : '';
  const info = document.getElementById('breathInfo');
  if (info) info.innerHTML = `<p>${desc}</p>`; 
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

let _retentionResolve = null;
window.triggerRecoveryBreath = function() {
  if (_retentionResolve) {
    _retentionResolve();
    _retentionResolve = null;
  }
};

window.startBreathing = async function() {
  if (breathingActive) { 
    breathingActive = false; 
    if (_retentionResolve) { _retentionResolve(); _retentionResolve = null; }
    resetBreathUI(); 
    return; 
  }
  breathingActive = true;
  const btn = document.getElementById('breathStartBtn'); 
  if (btn) { btn.innerHTML = '<i class="ri-stop-fill"></i> Arrêter la session'; btn.classList.add('danger'); }
  
  const mode = breathModes[currentBreathMode] || breathModes.wimhof;
  const rounds = parseInt(document.getElementById('breathRounds')?.value) || 3;
  const circle = document.getElementById('breathCircle');
  const text = document.getElementById('breathText');
  const subText = document.getElementById('breathSubText');
  const info = document.getElementById('breathInfo');
  const retAction = document.getElementById('breathRetentionAction');
  
  const startTime = Date.now();
  const sessionRetentions = [];

  try {
    for (let r = 1; r <= rounds && breathingActive; r++) {
      if (info) info.innerHTML = `<p style="color:var(--accent); font-weight:700;">Tour ${r} sur ${rounds}</p>`;
      
      // Phase 1: Guided Breaths
      for (let b = 1; b <= mode.breaths && breathingActive; b++) {
        if (circle) circle.className = 'breath-circle inhale'; 
        if (text) text.textContent = `${b}`;
        if (subText) subText.textContent = `Inspirez à fond (${b}/${mode.breaths})`;
        await sleep(mode.inhale * 1000); 
        if (!breathingActive) break;

        if (mode.hold > 0) { 
          if (circle) circle.className = 'breath-circle hold'; 
          if (subText) subText.textContent = 'Bloquez'; 
          await sleep(mode.hold * 1000); 
          if (!breathingActive) break; 
        }

        if (circle) circle.className = 'breath-circle exhale'; 
        if (subText) subText.textContent = 'Relâchez le souffle'; 
        await sleep(mode.exhale * 1000); 
        if (!breathingActive) break;
      }

      // Phase 2: Retention on empty lungs (Wim Hof)
      if (mode.retentionAfter && breathingActive) {
        if (circle) circle.className = 'breath-circle hold'; 
        if (subText) subText.textContent = 'Poumons vides · Retenez';
        if (retAction) retAction.style.display = 'block';
        if (info) info.innerHTML = `<p style="color:#38bdf8;">Tour ${r}/${rounds} — Rétention Poumons Vides</p>`;
        
        let retentionSec = 0;
        let isHolding = true;

        const retentionPromise = new Promise(resolve => {
          _retentionResolve = resolve;
        });

        const timerPromise = (async () => {
          while (isHolding && breathingActive && retentionSec < 360) {
            retentionSec++;
            const m = Math.floor(retentionSec / 60);
            const s = (retentionSec % 60).toString().padStart(2, '0');
            if (text) text.textContent = `${m}:${s}`;
            await sleep(1000);
          }
        })();

        await Promise.race([retentionPromise, timerPromise]);
        isHolding = false;
        _retentionResolve = null;
        if (retAction) retAction.style.display = 'none';
        sessionRetentions.push(retentionSec);

        // Phase 3: Recovery Breath (15 seconds)
        if (breathingActive) {
          if (circle) circle.className = 'breath-circle inhale'; 
          if (subText) subText.textContent = 'Inspirez à fond & Bloquez (15s)';
          if (info) info.innerHTML = `<p style="color:#10b981;">Tour ${r}/${rounds} — Récupération (15s)</p>`;
          
          for (let s = 15; s > 0 && breathingActive; s--) {
            if (text) text.textContent = `${s}s`;
            await sleep(1000);
          }
        }
      }
    }
  } catch (e) {
    console.error('Breathing session error:', e);
  }

  // Save session
  const elapsed = Date.now() - startTime;
  const bh = store.get('breathing-history', []);
  bh.unshift({ 
    mode: currentBreathMode, 
    rounds, 
    elapsed, 
    retentions: sessionRetentions,
    timestamp: Date.now() 
  });
  store.set('breathing-history', bh.slice(0, 30));
  resetBreathUI(); 
  renderBreathingHistory(); 
  renderDashboard();
  if (breathingActive === false) {
    showToast('✨ Félicitations pour votre session de respiration !', 'success');
  }
};

function resetBreathUI() {
  breathingActive = false;
  const circle = document.getElementById('breathCircle');
  const text = document.getElementById('breathText');
  const subText = document.getElementById('breathSubText');
  const retAction = document.getElementById('breathRetentionAction');
  const btn = document.getElementById('breathStartBtn');
  const info = document.getElementById('breathInfo');

  if (circle) circle.className = 'breath-circle';
  if (text) text.textContent = 'Prêt';
  if (subText) subText.textContent = 'Appuyez sur Démarrer';
  if (retAction) retAction.style.display = 'none';
  if (btn) { btn.innerHTML = '<i class="ri-play-fill"></i> Démarrer la session'; btn.classList.remove('danger'); }
  if (info) info.innerHTML = '<p>Session prête ✨</p>';
}

function renderBreathingHistory() {
  const el = document.getElementById('breathHistory'); 
  if (!el) return;
  const bh = store.get('breathing-history', []);
  if (bh.length === 0) { 
    el.innerHTML = '<p class="empty-state-sm">Aucune session enregistrée.</p>'; 
    return; 
  }
  
  el.innerHTML = bh.slice(0, 8).map(s => {
    const d = new Date(s.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const mn = { wimhof: '❄️ Wim Hof', relax: '🧘 Relaxation', box: '📦 Box Breathing', sleep: '🌙 4-7-8 Sommeil' };
    const dur = Math.round(s.elapsed / 60000) || 1;
    let retentionsBadge = '';
    if (Array.isArray(s.retentions) && s.retentions.length > 0) {
      retentionsBadge = `<div style="font-size:0.78rem; color:var(--accent); margin-top:4px; display:flex; gap:6px; flex-wrap:wrap;">
        ${s.retentions.map((sec, idx) => `<span style="background:rgba(55,211,153,0.1); border:1px solid rgba(55,211,153,0.25); border-radius:6px; padding:2px 6px;">T${idx+1}: <strong>${Math.floor(sec/60)}m${(sec%60).toString().padStart(2, '0')}s</strong></span>`).join('')}
      </div>`;
    }
    return `
      <div class="history-item" style="flex-direction:column; align-items:flex-start; gap:4px; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:10px; margin-bottom:8px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <strong style="color:var(--text); font-size:0.9rem;">${mn[s.mode] || s.mode} · ${s.rounds} tour${s.rounds > 1 ? 's' : ''}</strong>
          <span style="font-size:0.8rem; color:var(--text-dim);">${dur} min · ${d}</span>
        </div>
        ${retentionsBadge}
      </div>
    `;
  }).join('');
}
window.renderBreathingHistory = renderBreathingHistory;

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

// ═══════ SCANNER IA ═══════
let _scanMascotRenderer = null;
window.handleScanUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Url = e.target.result;
    
    // Show preview & activate laser scan animation
    const previewContainer = document.getElementById('scanPreviewContainer');
    const promptZone = document.getElementById('scanPromptZone');
    const imageWrapper = document.getElementById('scanImageWrapper');
    const scanPreview = document.getElementById('scanPreview');
    const scanResult = document.getElementById('scanResult');
    const scanLoading = document.getElementById('scanLoading');
    const loadingStatus = document.getElementById('scanLoadingStatus');

    if (previewContainer) previewContainer.style.display = 'block';
    if (promptZone) promptZone.style.display = 'none';
    if (scanPreview) scanPreview.src = base64Url;
    if (imageWrapper) imageWrapper.classList.add('scanning');
    if (scanResult) scanResult.style.display = 'none';
    if (scanLoading) {
      scanLoading.style.display = 'block';
      const scanCanvas = document.getElementById('scanMascotCanvas');
      if (scanCanvas && window.PigeonRenderer) {
        const dpr = window.devicePixelRatio || 1;
        scanCanvas.width = 110 * dpr;
        scanCanvas.height = 130 * dpr;
        scanCanvas.style.width = '110px';
        scanCanvas.style.height = '130px';
        if (!_scanMascotRenderer) {
          _scanMascotRenderer = new window.PigeonRenderer(scanCanvas);
        }
        _scanMascotRenderer.setInspecting(true);
      }
    }

    // Cycle through descriptive status steps while waiting
    const statusSteps = [
      '🔍 Détection des ingrédients et classification NOVA...',
      '⚖️ Calcul de l\'indice PRAL et équilibre acido-basique...',
      '🌊 Évaluation de l\'impact lymphatique et filtration rénale...',
      '⚡ Génération du protocole d\'électrisation et substituts vivants...'
    ];
    let stepIdx = 0;
    const statusInterval = setInterval(() => {
      stepIdx = (stepIdx + 1) % statusSteps.length;
      if (loadingStatus) loadingStatus.textContent = statusSteps[stepIdx];
    }, 1800);
    
    // Extract base64 without prefix
    const base64Data = base64Url.split(',')[1];
    
    try {
      const query = `Analyse cette photo de repas/aliment avec une rigueur absolue.
Identifie clairement les ingrédients visibles, leur statut vitaliste (Dr. Sebi / Arnold Ehret : mucogène, hybride ou électrique), l'indice PRAL estimé (+/- mEq/100g), l'impact sur la lymphe et les reins, et propose des substituts vivants pour électriser le plat.
Inclus un bloc json avec "actionMeal" (avec nom, catégorie, emoji, items, note) et "suggestFoods" (tableau des 5 ingrédients vivants recommandés).`;
      
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
      
      clearInterval(statusInterval);
      if (imageWrapper) imageWrapper.classList.remove('scanning');
      if (scanLoading) scanLoading.style.display = 'none';
      
      if (!resp.ok) {
        throw new Error(`Erreur serveur (${resp.status})`);
      }
      
      const data = await resp.json();
      const aiText = data.text || 'Aucune réponse.';
      
      renderScanResult(aiText);
      
    } catch (err) {
      clearInterval(statusInterval);
      if (imageWrapper) imageWrapper.classList.remove('scanning');
      if (scanLoading) scanLoading.style.display = 'none';
      if (scanResult) {
        scanResult.style.display = 'block';
        scanResult.innerHTML = `
          <div class="scan-card glass" style="border-left:4px solid var(--danger);padding:24px">
            <h4 style="color:var(--danger);display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <i class="ri-error-warning-line"></i> Erreur lors de l'analyse visuelle
            </h4>
            <p style="color:var(--text-dim);font-size:0.9rem">${esc(err.message)}</p>
            <button class="btn-primary" onclick="document.getElementById('scanUpload').click()" style="margin-top:14px">
              <i class="ri-refresh-line"></i> Réessayer avec une autre photo
            </button>
          </div>
        `;
      }
    }
  };
  reader.readAsDataURL(file);
};

function formatChemicals(str) {
  if (!str) return '';
  return str
    .replace(/\$H_?2SO_?4\$/gi, 'H₂SO₄')
    .replace(/\$H_?3PO_?4\$/gi, 'H₃PO₄')
    .replace(/\$H_?2O\$/gi, 'H₂O')
    .replace(/\$CO_?2\$/gi, 'CO₂')
    .replace(/\$([A-Za-z0-9_]+)\$/g, '$1');
}

function renderScanResult(aiText) {
  const container = document.getElementById('scanResult');
  if (!container) return;

  // 1. Extract JSON block if present
  let actionMealData = null;
  let suggestedFoods = [];
  const jsonMatch = aiText.match(/```json([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed.actionMeal) actionMealData = parsed.actionMeal;
      if (parsed.suggestFoods && Array.isArray(parsed.suggestFoods)) suggestedFoods = parsed.suggestFoods;
    } catch (e) {
      console.warn('JSON parsing error in scan result:', e);
    }
  }

  // Remove JSON block from text for analysis
  let text = aiText.replace(/```json[\s\S]*?```/g, '').trim();
  text = formatChemicals(text);

  // 2. Extract Dish Name & Overview Summary
  let dishName = 'Plat / Assortiment Détecté';
  let dishDesc = '';
  let overallStatus = 'mucus';
  let statusBadgeLabel = 'Fortement Mucogène & Acidifiant';
  let statusBadgeClass = 'badge-mucus-danger';
  let statusBadgeIcon = 'ri-error-warning-fill';

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let summaryParagraphs = [];

  let idx = 0;
  while (idx < lines.length && !lines[idx].startsWith('---') && !lines[idx].match(/^[1-3]\./) && !lines[idx].match(/statut vitaliste/i)) {
    const line = lines[idx];
    if (line.includes('**')) {
      const bMatch = line.match(/\*\*(.*?)\*\*/);
      if (bMatch && bMatch[1].length > 3 && !bMatch[1].toLowerCase().includes('scan') && !bMatch[1].toLowerCase().includes('statut')) {
        dishName = bMatch[1].replace(/^./, c => c.toUpperCase());
      }
    }
    if (!line.startsWith('🍃') && !line.startsWith('📸') && !line.startsWith('Scan') && !line.startsWith('###')) {
      summaryParagraphs.push(line);
    }
    idx++;
  }

  dishDesc = summaryParagraphs.join(' ')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/Il s'agit d'un assortiment de /i, 'Assortiment de ')
    .replace(/Il s'agit de /i, '')
    .trim();

  if (!dishDesc && lines.length > 0) {
    dishDesc = lines[0].replace(/^[^\w]+/, '');
  }

  // Detect overall vitality status
  const lowerText = text.toLowerCase();
  if (lowerText.includes('hautement mucogène') || lowerText.includes('fortement mucogène') || lowerText.includes('très acidifiant') || lowerText.includes('colle digestive') || lowerText.includes('acide sulfurique')) {
    overallStatus = 'mucus';
    statusBadgeLabel = '⛔ Fortement Mucogène & Acidifiant';
    statusBadgeClass = 'badge-mucus-danger';
    statusBadgeIcon = 'ri-close-circle-fill';
  } else if (lowerText.includes('100% électrique') || lowerText.includes('aliment électrique') || lowerText.includes('fortement alcalinisant')) {
    overallStatus = 'electric';
    statusBadgeLabel = '⚡ 100% Électrique & Alcalinisant';
    statusBadgeClass = 'badge-electric-success';
    statusBadgeIcon = 'ri-flashlight-fill';
  } else if (lowerText.includes('hybride') || lowerText.includes('toléré')) {
    overallStatus = 'hybrid';
    statusBadgeLabel = '🔀 Hybride / Toléré en transition';
    statusBadgeClass = 'badge-hybrid-warning';
    statusBadgeIcon = 'ri-shuffle-fill';
  }

  // 3. Extract Section 1: Statut Vitaliste
  let sebiItems = [];
  const sebiSectionMatch = text.match(/(?:1\.\s*🔍?\s*Statut Vitaliste[\s\S]*?)(?=---|\n2\.|$)/i);
  if (sebiSectionMatch) {
    const sLines = sebiSectionMatch[0].split('\n').map(l => l.trim()).filter(Boolean);
    let currentGroup = 'mucus';
    for (const sLine of sLines) {
      if (sLine.match(/1\.\s*🔍?\s*Statut Vitaliste/i)) continue;
      if (sLine.includes('Mucogène') || sLine.includes('Acidifiant') || sLine.includes('🔴')) {
        currentGroup = 'mucus';
      } else if (sLine.includes('Végétaux') || sLine.includes('Neutres') || sLine.includes('🟡') || sLine.includes('Hybrides')) {
        currentGroup = 'neutral';
      } else if (sLine.includes('Électrique') || sLine.includes('Vivant') || sLine.includes('🟢')) {
        currentGroup = 'electric';
      }

      if (sLine.startsWith('*') || sLine.startsWith('-') || sLine.startsWith('•')) {
        const cleanL = sLine.replace(/^[\*\-\•]\s*/, '').trim();
        if (cleanL.length > 5 && !cleanL.includes('🔴') && !cleanL.includes('🟡') && !cleanL.includes('🟢')) {
          let name = '';
          let details = cleanL;
          if (cleanL.includes(' : ') || cleanL.includes(':')) {
            const parts = cleanL.split(/ : |:/);
            name = parts[0].replace(/\*\*/g, '').trim();
            details = parts.slice(1).join(': ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').trim();
          } else {
            name = cleanL.replace(/\*\*(.*?)\*\*/g, '$1');
            details = '';
          }
          sebiItems.push({ group: currentGroup, name, details });
        }
      }
    }
  }

  // 4. Extract Section 2: Indice PRAL Estimé
  let pralGlobal = '+15 à +25 mEq/100g (Acidifiant)';
  let pralNumeric = 18;
  let pralDetails = [];
  const pralSectionMatch = text.match(/(?:2\.\s*⚖️?\s*Indice PRAL[\s\S]*?)(?=---|\n3\.|$)/i);
  if (pralSectionMatch) {
    const pLines = pralSectionMatch[0].split('\n').map(l => l.trim()).filter(Boolean);
    for (const pLine of pLines) {
      if (pLine.match(/2\.\s*⚖️?\s*Indice PRAL/i)) continue;
      if (pLine.includes('PRAL Global') || pLine.includes('Global :')) {
        pralGlobal = pLine.replace(/^[\*\-\•]\s*/, '').replace(/PRAL Global\s*:\s*/i, '').replace(/\*\*/g, '').trim();
        const numMatch = pralGlobal.match(/([+\-]?\d+(?:\.\d+)?)/);
        if (numMatch) pralNumeric = parseFloat(numMatch[1]);
      } else if (pLine.includes('mEq') || pLine.includes(':')) {
        pralDetails.push(pLine.replace(/^[\*\-\•]\s*/, '').replace(/\*/g, '').trim());
      }
    }
  }

  const clampedPral = Math.max(-30, Math.min(30, pralNumeric));
  const pralPercent = Math.round(((clampedPral + 30) / 60) * 100);

  // 5. Extract Section 3: Impact Émonctoriel & Lymphatique
  let lymphImpact = 'Congestion des liquides interstitiels par excès de graisses saturées et protéines animales.';
  let kidneysImpact = 'Sollicitation intense des reins pour neutraliser et filtrer l\'acide urique, urates et phosphates.';
  const emunctoryMatch = text.match(/(?:3\.\s*🌊?\s*Impact Émonctoriel[\s\S]*?)(?=---|💡|\n4\.|$)/i);
  if (emunctoryMatch) {
    const eLines = emunctoryMatch[0].split('\n').map(l => l.trim()).filter(Boolean);
    for (const eLine of eLines) {
      if (eLine.match(/3\.\s*🌊?\s*Impact/i)) continue;
      if (eLine.toLowerCase().includes('lymphe')) {
        lymphImpact = eLine.replace(/^[\*\-\•]\s*/, '').replace(/Lymphe\s*:\s*/i, '').replace(/\*\*/g, '').trim();
      } else if (eLine.toLowerCase().includes('rein') || eLine.toLowerCase().includes('digestif') || eLine.toLowerCase().includes('foie')) {
        kidneysImpact = eLine.replace(/^[\*\-\•]\s*/, '').replace(/Reins?\s*:\s*/i, '').replace(/\*\*/g, '').trim();
      }
    }
  }

  // 6. Extract Section 4: Protocole d'Électrisation & Substitutions
  let electrifyText = "Remplacez le pain blanc par des <strong>tranches de concombre cru</strong> ou des <strong>crackers de graines de lin déshydratées</strong>, et substituez la charcuterie par du <strong>guacamole frais</strong>, des <strong>bâtonnets de légumes croquants</strong> et des <strong>micro-pousses vivantes</strong>.";
  const electrifyMatch = text.match(/(?:💡|4\.)[\s\S]*?(?:Pour "Électriser"|Électriser|Substitutions)[\s\S]*?(?=```json|$)/i);
  if (electrifyMatch) {
    const cleanElec = electrifyMatch[0]
      .replace(/^[\s\S]*?(?:Pour "Électriser"[^:\n]*:?|Substitutions[^:\n]*:?)/i, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();
    if (cleanElec.length > 10) electrifyText = cleanElec;
  }

  // Build Sebi Items HTML
  let sebiItemsHtml = '';
  if (sebiItems.length > 0) {
    sebiItemsHtml = sebiItems.map(item => {
      let icon = '🔴';
      if (item.group === 'neutral') icon = '🟡';
      if (item.group === 'electric') icon = '🟢';
      return `
        <div class="scan-item-row">
          <span class="scan-item-bullet">${icon}</span>
          <div>
            <div class="scan-item-name">${esc(item.name)}</div>
            ${item.details ? `<div class="scan-item-details">${item.details}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else {
    sebiItemsHtml = `
      <div class="scan-item-row">
        <span class="scan-item-bullet">🔴</span>
        <div>
          <div class="scan-item-name">Charge mucogène et acidifiante identifiée</div>
          <div class="scan-item-details">Présence d'amidons transformés, graisses saturées ou protéines génératrices de colles intestinales.</div>
        </div>
      </div>
    `;
  }

  // Build PRAL details HTML
  const pralDetailsHtml = pralDetails.map(pd => {
    return `<div style="font-size:0.82rem;color:var(--text-dim);margin-top:6px;display:flex;align-items:center;gap:6px">
      <i class="ri-arrow-right-s-line" style="color:var(--accent)"></i> ${esc(pd)}
    </div>`;
  }).join('');

  // Build Suggest Foods chips HTML
  let suggestChipsHtml = '';
  if (suggestedFoods && suggestedFoods.length > 0) {
    const chips = suggestedFoods.map(f => 
      `<button class="food-chip" onclick="addSuggestedFood(this, '${esc(f)}')" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;margin:4px;border-radius:20px;border:1px solid var(--accent);background:rgba(55,211,153,0.08);color:var(--text);cursor:pointer;font-size:0.84rem;font-weight:600;transition:all 0.2s">
        <i class="ri-add-circle-line" style="color:var(--accent)"></i> ${esc(f)}
      </button>`
    ).join('');
    suggestChipsHtml = `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-weight:600">
          <i class="ri-leaf-line" style="color:var(--accent)"></i> Ingrédients vivants suggérés à ajouter :
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${chips}</div>
      </div>
    `;
  }

  // Generate action meal payload
  let actionMealBtnHtml = '';
  if (actionMealData) {
    const encodedMeal = btoa(unescape(encodeURIComponent(JSON.stringify(actionMealData))));
    actionMealBtnHtml = `
      <button class="scan-btn-primary" onclick="handleAddActionMeal('${encodedMeal}')">
        <i class="ri-restaurant-line"></i> Enregistrer ce repas dans mon journal
      </button>
    `;
  } else {
    const fallbackMeal = {
      name: dishName,
      category: 'lunch',
      emoji: overallStatus === 'electric' ? '🥗' : overallStatus === 'hybrid' ? '🍲' : '🍕',
      items: [dishName],
      note: `Scanné via Vision IA (${statusBadgeLabel})`
    };
    const encodedMeal = btoa(unescape(encodeURIComponent(JSON.stringify(fallbackMeal))));
    actionMealBtnHtml = `
      <button class="scan-btn-primary" onclick="handleAddActionMeal('${encodedMeal}')">
        <i class="ri-restaurant-line"></i> Enregistrer ce repas dans mon journal
      </button>
    `;
  }

  container.innerHTML = `
    <!-- Hero Dish Overview -->
    <div class="scan-dish-hero glass">
      <div class="scan-dish-top">
        <div class="scan-dish-title">
          <span style="font-size:1.6rem">${overallStatus === 'electric' ? '🥗' : overallStatus === 'hybrid' ? '🍲' : '🍕'}</span>
          <span>${esc(dishName)}</span>
        </div>
        <div class="scan-vital-badge ${statusBadgeClass}">
          <i class="${statusBadgeIcon}"></i>
          <span>${esc(statusBadgeLabel)}</span>
        </div>
      </div>
      <div class="scan-dish-desc">${dishDesc}</div>
    </div>

    <!-- Diagnostic Sections Grid -->
    <div class="scan-grid-sections">
      
      <!-- Card 1: Statut Vitaliste -->
      <div class="scan-card glass">
        <div class="scan-card-header">
          <div class="scan-card-icon"><i class="ri-microscope-line"></i></div>
          <div class="scan-card-title">1. Statut Vitaliste & Mucus (Dr. Sebi / Ehret)</div>
        </div>
        <div class="scan-items-list">
          ${sebiItemsHtml}
        </div>
      </div>

      <!-- Card 2: Indice PRAL -->
      <div class="scan-card glass">
        <div class="scan-card-header">
          <div class="scan-card-icon"><i class="ri-scales-3-line"></i></div>
          <div class="scan-card-title">2. Indice PRAL & Équilibre Acido-Basique</div>
        </div>
        <div class="scan-pral-meter">
          <div class="scan-pral-header">
            <span style="font-size:0.85rem;color:var(--text-dim);font-weight:600">Charge Rénale Estimée</span>
            <span class="scan-pral-val ${pralNumeric > 5 ? 'val-acid' : pralNumeric < -2 ? 'val-alkaline' : 'val-neutral'}">
              ${esc(pralGlobal)}
            </span>
          </div>
          <div class="scan-pral-track">
            <div class="scan-pral-pointer" style="left: ${pralPercent}%"></div>
          </div>
          <div class="scan-pral-labels">
            <span>🟢 Alcalinisant (-30)</span>
            <span>🟡 Neutre (0)</span>
            <span>🔴 Acidifiant (+30)</span>
          </div>
        </div>
        ${pralDetailsHtml ? `<div style="margin-top:8px">${pralDetailsHtml}</div>` : ''}
      </div>

      <!-- Card 3: Impact Émonctoriel -->
      <div class="scan-card glass">
        <div class="scan-card-header">
          <div class="scan-card-icon"><i class="ri-drop-line"></i></div>
          <div class="scan-card-title">3. Impact Émonctoriel & Lymphatique (Morse)</div>
        </div>
        <div class="scan-emunctory-grid">
          <div class="scan-emunctory-tile">
            <div class="scan-emunctory-name" style="color:#60a5fa"><i class="ri-water-flash-line"></i> Lymphe & Fluides</div>
            <div class="scan-emunctory-text">${esc(lymphImpact)}</div>
          </div>
          <div class="scan-emunctory-tile">
            <div class="scan-emunctory-name" style="color:#f59e0b"><i class="ri-filter-3-line"></i> Reins & Filtration</div>
            <div class="scan-emunctory-text">${esc(kidneysImpact)}</div>
          </div>
        </div>
      </div>

      <!-- Card 4: Protocole d'Électrisation -->
      <div class="scan-card glass scan-electrify-card">
        <div class="scan-card-header">
          <div class="scan-card-icon" style="background:rgba(245,158,11,0.2);color:#fbbf24"><i class="ri-flashlight-line"></i></div>
          <div class="scan-card-title" style="color:#fbbf24">💡 Comment "Électriser" ce repas</div>
        </div>
        <div class="scan-electrify-text">
          ${electrifyText}
        </div>
        ${suggestChipsHtml}
      </div>

    </div>

    <!-- Actions Row -->
    <div class="scan-actions-row">
      ${actionMealBtnHtml}
      <button class="scan-btn-secondary" onclick="askAIAboutScannedDish('${esc(dishName.replace(/'/g, "\\'"))}')">
        <i class="ri-chat-smile-3-fill" style="color:var(--accent)"></i> Discuter de ce plat avec l'IA
      </button>
      <button class="scan-btn-secondary" onclick="document.getElementById('scanUpload').click()" style="flex:0 1 auto;min-width:140px">
        <i class="ri-camera-lens-line"></i> Nouveau scan
      </button>
    </div>
  `;

  container.style.display = 'flex';
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.renderScanResult = renderScanResult;

window.askAIAboutScannedDish = function(dishName) {
  showPage('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = `J'ai scanné mon plat "${dishName}". Peux-tu m'expliquer en détail comment compenser ses effets mucogènes et acidifiants avec des tisanes drainantes et une transition alimentaire adaptée ?`;
    chatInput.focus();
  }
};

// ═══════ UTILS ═══════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function renderMarkdown(text) {
  if (!text) return '';
  text = formatChemicals(text);

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
        const rawItems = Array.isArray(meal.items) ? meal.items : (Array.isArray(meal.ingredients) ? meal.ingredients : typeof (meal.items || meal.ingredients) === 'string' ? (meal.items || meal.ingredients).split(/,\s*|\s*·\s*/).filter(Boolean) : [meal.name]);
        const categoryLabels = { breakfast: 'Petit-déjeuner', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' };
        const catLabel = categoryLabels[meal.category] || 'Repas Vitaliste';
        const itemsPills = rawItems.map(it => `<span style="display:inline-block; padding:3px 9px; background:rgba(255,255,255,0.06); border:1px solid var(--border); border-radius:12px; font-size:0.8rem; margin:2px 4px 2px 0;">🥗 ${esc(typeof it === 'string' ? it : it.name)}</span>`).join('');

        renderedCards += `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:12px;border-left:4px solid var(--accent);background:rgba(55,211,153,0.06)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-weight:700;font-size:1.05rem;color:var(--text)">${meal.emoji || '🍲'} ${esc(meal.name || 'Repas Proposé')}</span>
            <span class="food-badge badge-electric" style="font-size:0.75rem">${esc(catLabel)}</span>
          </div>
          <div style="font-size:0.88rem;color:var(--text);margin-bottom:8px">
            <div style="font-weight:600; margin-bottom:4px; color:var(--text-dim);">Ingrédients :</div>
            <div style="display:flex; flex-wrap:wrap; gap:2px;">${itemsPills}</div>
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

  // Handle dividers and clean lists first
  text = text
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">')
    .replace(/^\s*[\*\-]\s+(.*$)/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
    .replace(/<\/ul>\s*<ul[^>]*>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h4 style="margin:12px 0 6px 0;color:var(--accent)">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 style="margin:14px 0 8px 0;color:var(--text)">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 style="margin:16px 0 10px 0;color:var(--text)">$1</h2>')
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${esc(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n+/g, '</p><p style="margin-bottom:8px">')
    .replace(/\n/g, '<br>');

  return text;
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
  
  // High-availability verified media and official local documents
  const books = [
    {
      title: "Guide Nutritionnel Officiel VitalTrack",
      subtitle: "Guide Méthodologique & Pratique",
      url: "/Nutrional-Guide.pdf",
      author: "VitalTrack",
      source: "VitalTrack (PDF Local)",
      size: "3.9 Mo",
      badgeClass: "badge-success",
      icon: "ri-booklet-line",
      color: "#10b981",
      description: "Le guide complet de référence sur la nutrition vitaliste, le jeûne intermittent, les combinaisons alimentaires et les protocoles de détoxification."
    },
    {
      title: "Système de Guérison du Régime Sans Mucus",
      subtitle: "Arnold Ehret — Mucusless Diet Healing System",
      url: "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
      author: "Prof. Arnold Ehret",
      source: "Arnold Ehret (PDF Intégral)",
      size: "1.0 Mo",
      badgeClass: "badge-success",
      icon: "ri-book-2-line",
      color: "#38bdf8",
      description: "L'ouvrage fondateur d'Arnold Ehret exposant la cause première de l'encrassement cellulaire (mucus, toxines), la transition sans mucus et l'équation fondamentale V = P - O."
    },
    {
      title: "Le Jeûne Rationnel & Régénération",
      subtitle: "Arnold Ehret — Rational Fasting",
      url: "/pdfs/arnold-ehret-rational-fasting.pdf",
      author: "Prof. Arnold Ehret",
      source: "Arnold Ehret (PDF Intégral)",
      size: "8.8 Mo",
      badgeClass: "badge-success",
      icon: "ri-book-read-line",
      color: "#f59e0b",
      description: "Manuel pratique d'Arnold Ehret sur la conduite progressive et sûre du jeûne, l'autolyse des dépôts métaboliques et la maîtrise des crises d'élimination."
    },
    {
      title: "Guide de Régénération & Détoxification Cellulaire",
      subtitle: "Dr. Robert Morse — The Detox Miracle Sourcebook",
      url: "/pdfs/robert-morse-detox-miracle-sourcebook.pdf",
      author: "Dr. Robert Morse, N.D.",
      source: "Dr. Robert Morse (PDF Intégral)",
      size: "5.3 Mo",
      badgeClass: "badge-success",
      icon: "ri-leaf-line",
      color: "#a78bfa",
      description: "La bible de la régénération cellulaire : filtration rénale, grand système lymphatique, pouvoir dissolvant des fruits et herboristerie clinique."
    },
    {
      title: "Le Système de Réussite de l'Alimentation Vivante",
      subtitle: "David Wolfe — The Sunfood Diet Success System",
      url: "/pdfs/david-wolfe-sunfood-diet-success-system.pdf",
      author: "David Wolfe",
      source: "David Wolfe (PDF Intégral)",
      size: "16.5 Mo",
      badgeClass: "badge-success",
      icon: "ri-sun-line",
      color: "#f43f5e",
      description: "L'encyclopédie de l'alimentation crue vivante, des superaliments sauvages, de la biophotonique et de la revitalisation enzymatique globale."
    },
    {
      title: "L'Alimentation Cellulaire Bio-Électrique",
      subtitle: "Dr. Sebi — The Bio-Electric Cell Food Cleansing Guide",
      url: "/pdfs/dr-sebi-bio-electric-cell-food-cleansing-guide.pdf",
      author: "Dr. Sebi (Alfredo Bowman)",
      source: "Dr. Sebi (PDF Intégral)",
      size: "240 Ko",
      badgeClass: "badge-success",
      icon: "ri-flashlight-line",
      color: "#34d399",
      description: "Le protocole authentique du Dr. Sebi sur l'équilibre bio-minéral, l'alcalinité cellulaire et les complexes botaniques d'épuration intra-cellulaire."
    }
  ];

  const videos = [
    {
      title: "Documentaire : The Rock Newman Show ft. Dr. Sebi",
      localSrc: "/videos/dr-sebi-documentary.mp4",
      poster: "/videos/posters/dr-sebi-documentary.jpg",
      source: "WHUT TV / Dr. Sebi (Média Local HD • 56 min)",
      badgeClass: "badge-success",
      type: "local-video",
      description: "L'entretien télévisé et documentaire historique (56 min) avec le Dr. Sebi sur Howard University Television : explications détaillées sur la biochimie alcaline, la nutrition électrique cellulaire, le nettoyage du mucus et les protocoles thérapeutiques naturels."
    },
    {
      title: "Le jeûne, une nouvelle thérapie ?",
      url: "https://www.youtube-nocookie.com/embed/_ufnGrKmL1c",
      watchUrl: "https://www.youtube.com/watch?v=_ufnGrKmL1c",
      source: "ARTE Documentaire (56 min)",
      badgeClass: "badge-warning",
      type: "video",
      description: "Enquête médicale et scientifique d'ARTE sur les mécanismes de l'autophagie et les protocoles cliniques de jeûne thérapeutique."
    },
    {
      title: "What The Health",
      url: "https://www.youtube-nocookie.com/embed/_ymX8x0IqM8",
      watchUrl: "https://www.youtube.com/watch?v=_ymX8x0IqM8",
      source: "AUM Films (VOSTFR 1h32)",
      badgeClass: "badge-warning",
      type: "video",
      description: "Film d'investigation sur les impacts des aliments ultra-transformés et les bénéfices prouvés de la nutrition végétale intégrale."
    },
    {
      title: "La Santé Dans L'Assiette (Forks Over Knives)",
      url: "https://www.youtube-nocookie.com/embed/EjTWFoqLy34",
      watchUrl: "https://www.youtube.com/watch?v=EjTWFoqLy34",
      source: "Forks Over Knives (1h36)",
      badgeClass: "badge-warning",
      type: "video",
      description: "Documentaire pionnier mené par les Drs Campbell et Esselstyn démontrant comment inverser les maladies chroniques par l'alimentation végétale vivante."
    }
  ];

  let html = `
    <!-- Section Livres & Guides PDF -->
    <div style="margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
        <span style="font-size:1.4rem;">📚</span>
        <div>
          <h2 style="font-size:1.15rem; font-weight:800; margin:0; color:#fff;">Ouvrages & Guides PDF Fondateurs</h2>
          <p style="font-size:0.8rem; color:var(--text-dim); margin:0;">Tous les textes intégraux téléchargeables et consultables directement en local (sans lien tiers)</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">
        ${books.map(b => `
          <div class="dash-card glass" style="padding:18px; display:flex; flex-direction:column; justify-content:space-between; border-left:3px solid ${b.color};">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:36px; height:36px; border-radius:10px; background:rgba(255,255,255,0.06); color:${b.color}; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
                    <i class="${b.icon}"></i>
                  </div>
                  <div>
                    <h3 style="margin:0; font-size:0.96rem; font-weight:700; color:#fff; line-height:1.2;">${esc(b.title)}</h3>
                    <div style="font-size:0.75rem; color:${b.color}; font-weight:600; margin-top:2px;">${esc(b.subtitle)}</div>
                  </div>
                </div>
                <span class="badge ${b.badgeClass}" style="white-space:nowrap; font-size:0.7rem;">${esc(b.size)}</span>
              </div>
              <div style="font-size:0.78rem; color:var(--accent); font-weight:600; margin-bottom:6px;">Auteur : ${esc(b.author)}</div>
              <p style="font-size:0.82rem; color:var(--text-dim); line-height:1.45; margin:0 0 14px 0;">${esc(b.description)}</p>
            </div>
            <div style="display:flex; gap:8px; margin-top:auto;">
              <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="flex:1; text-align:center; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:0.82rem; padding:8px 12px;">
                <i class="ri-file-pdf-line"></i> Consulter
              </a>
              <a href="${b.url}" download class="btn-secondary" style="text-align:center; text-decoration:none; padding:8px 12px; display:inline-flex; align-items:center; justify-content:center; gap:4px; font-size:0.82rem;" title="Télécharger le fichier PDF">
                <i class="ri-download-2-line"></i> Télécharger
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Section Vidéos & Documentaires -->
    <div style="margin-top:24px;">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
        <span style="font-size:1.4rem;">🎬</span>
        <div>
          <h2 style="font-size:1.15rem; font-weight:800; margin:0; color:#fff;">Documentaires & Médias Vidéo</h2>
          <p style="font-size:0.8rem; color:var(--text-dim); margin:0;">Enquêtes, conférences et entretiens de référence sur la régénération cellulaire</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr; gap:18px;">
        ${videos.map(r => {
          if (r.type === 'local-video') {
            return `
              <div class="dash-card glass" style="padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                  <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:#fff;">${esc(r.title)}</h3>
                  <span class="badge ${r.badgeClass || 'badge-success'}">${esc(r.source)}</span>
                </div>
                <div style="position:relative; width:100%; border-radius:12px; overflow:hidden; border:1px solid var(--border); background:#000; box-shadow:0 6px 24px rgba(0,0,0,0.4); margin-bottom:12px;">
                  <video controls playsinline preload="metadata" poster="${r.poster}" style="width:100%; height:auto; display:block; max-height:420px; background:#000;">
                    <source src="${r.localSrc}" type="video/mp4">
                    Votre navigateur ne supporte pas la lecture directe de cette vidéo.
                  </video>
                </div>
                <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.5; margin:0;">${esc(r.description)}</p>
              </div>
            `;
          } else {
            return `
              <div class="dash-card glass" style="padding:18px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                  <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:#fff;">${esc(r.title)}</h3>
                  <span class="badge ${r.badgeClass || 'badge-warning'}">${esc(r.source)}</span>
                </div>
                <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; border:1px solid var(--border); background:#000; box-shadow:0 6px 24px rgba(0,0,0,0.4); margin-bottom:12px;">
                  <iframe src="${r.url}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy"></iframe>
                </div>
                <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.5; margin-bottom:10px;">${esc(r.description)}</p>
                ${r.watchUrl ? `
                  <div style="text-align:right;">
                    <a href="${r.watchUrl}" target="_blank" rel="noopener noreferrer" style="font-size:0.8rem; color:var(--accent); text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                      <i class="ri-external-link-line"></i> Ouvrir dans un nouvel onglet
                    </a>
                  </div>
                ` : ''}
              </div>
            `;
          }
        }).join('')}
      </div>
    </div>

    <!-- Bannière Souveraineté & Pérennité -->
    <div class="dash-card glass" style="margin-top:20px; padding:16px 20px; background:linear-gradient(135deg,rgba(16,185,129,0.06),rgba(59,130,246,0.04)); border:1px dashed var(--border); display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <div style="font-size:1.8rem; color:var(--accent);"><i class="ri-shield-check-line"></i></div>
      <div style="flex:1; min-width:260px;">
        <h4 style="margin:0 0 4px 0; font-size:0.92rem; color:var(--text);">Conservation & Souveraineté des Savoirs</h4>
        <p style="margin:0; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
          Les ouvrages originaux et les documentaires clés sont directement hébergés et servis en local pour vous garantir un accès perpétuel, hors-ligne et sans dépendance à des plateformes tierces.
        </p>
      </div>
    </div>
  `;

  container.innerHTML = html;
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

  // Micro-nudge bienveillant du Pigeon selon la nature du repas
  if (window.pigeonNudges) {
    const lower = input.toLowerCase();
    const isAcidic = lower.includes('viande') || lower.includes('fromage') || lower.includes('pain') || lower.includes('café') || lower.includes('sucre') || lower.includes('lait');
    const isLiving = lower.includes('pomme') || lower.includes('jus') || lower.includes('salade') || lower.includes('fruit') || lower.includes('cru') || lower.includes('orange') || lower.includes('raisin');
    window.pigeonNudges.onMealLogged({ name: input, isAcidic, isLiving });
  }
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
    const rawItems = Array.isArray(meal.items) ? meal.items : (Array.isArray(meal.ingredients) ? meal.ingredients : typeof (meal.items || meal.ingredients) === 'string' ? (meal.items || meal.ingredients).split(/,\s*|\s*·\s*/).filter(Boolean) : [meal.name || 'Repas']);
    
    rawItems.forEach(itemEntry => {
      const itemName = typeof itemEntry === 'string' ? itemEntry : (itemEntry.name || '');
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

    const nameLower = (meal.name || '').toLowerCase();
    const noteLower = (meal.note || '').toLowerCase();
    let detectedCooking = meal.cookingMethod;
    if (!detectedCooking) {
      if (nameLower.includes('frit') || noteLower.includes('friture') || nameLower.includes('chips')) detectedCooking = 'fry';
      else if (nameLower.includes('four') || noteLower.includes('rôti') || nameLower.includes('roti') || nameLower.includes('gratin')) detectedCooking = 'bake';
      else if (nameLower.includes('soupe') || nameLower.includes('bouillon') || nameLower.includes('mijot')) detectedCooking = 'simmer';
      else if (nameLower.includes('salade') || nameLower.includes('cru') || nameLower.includes('smoothie') || nameLower.includes('carpaccio')) detectedCooking = 'raw';
      else detectedCooking = 'steam';
    }

    let detectedOil = meal.oilQuality;
    if (!detectedOil) {
      if (detectedCooking === 'fry' || noteLower.includes('tournesol') || noteLower.includes('raffin')) detectedOil = 'cooked_refined';
      else if (noteLower.includes('avocat') || noteLower.includes('lin') || noteLower.includes('chanvre')) detectedOil = 'raw_cold_pressed';
      else if (noteLower.includes('olive') || detectedCooking === 'raw' || detectedCooking === 'steam') detectedOil = 'raw_olive';
      else detectedOil = 'none';
    }

    const newMeal = {
      id: 'meal_' + Date.now(),
      name: meal.name || 'Repas Vitaliste',
      category: meal.category || 'dinner',
      items: rawItems,
      ingredients: rawItems,
      emoji: meal.emoji || '🍲',
      cookingMethod: detectedCooking,
      oilQuality: detectedOil,
      note: meal.note || 'Repas suggéré par le coach vitaliste IA',
      approved: true,
      electric: true,
      hybrid: false,
      isComposedMeal: true,
      pral: meal.pral ?? avgPral,
      nova: meal.nova ?? (detectedCooking === 'fry' ? 3 : 1),
      timestamp: Date.now()
    };

    meals.unshift(newMeal);
    store.set('meals', meals);

    if (window.renderMeals) renderMeals();
    if (window.renderDashboard) renderDashboard();
    if (window.updateProactiveMascot) updateProactiveMascot('meal');
    
    showToast(`🍽️ Repas "${newMeal.name}" enregistré dans votre journal !`, 'success');
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
window._editingWeightId = null;

window.openWeightModal = function() {
  const modal = document.getElementById('weightModal');
  if (!modal) return;

  window._editingWeightId = null;
  const dateInput = document.getElementById('weightDateInput');
  const valInput = document.getElementById('weightValInput');
  const noteInput = document.getElementById('weightNoteInput');
  const modalTitle = document.getElementById('weightModalTitle');
  const submitText = document.getElementById('weightSubmitText');
  const cancelBtn = document.getElementById('weightCancelEditBtn');

  if (modalTitle) modalTitle.innerHTML = '<i class="ri-scales-3-line"></i> Enregistrer une pesée';
  if (submitText) submitText.textContent = 'Valider la pesée';
  if (cancelBtn) cancelBtn.style.display = 'none';

  // Default to today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  if (dateInput) {
    dateInput.value = `${year}-${month}-${day}`;
    if (dateInput._updateVitalDatePicker) dateInput._updateVitalDatePicker();
  }

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
    window._editingWeightId = null;
    document.getElementById('weightModal')?.classList.remove('open');
  }
};

window.cancelWeightEdit = function() {
  window._editingWeightId = null;
  const dateInput = document.getElementById('weightDateInput');
  const valInput = document.getElementById('weightValInput');
  const noteInput = document.getElementById('weightNoteInput');
  const modalTitle = document.getElementById('weightModalTitle');
  const submitText = document.getElementById('weightSubmitText');
  const cancelBtn = document.getElementById('weightCancelEditBtn');

  if (modalTitle) modalTitle.innerHTML = '<i class="ri-scales-3-line"></i> Enregistrer une pesée';
  if (submitText) submitText.textContent = 'Valider la pesée';
  if (cancelBtn) cancelBtn.style.display = 'none';

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  if (dateInput) {
    dateInput.value = `${year}-${month}-${day}`;
    if (dateInput._updateVitalDatePicker) dateInput._updateVitalDatePicker();
  }

  const history = store.get('weight_history', []);
  if (valInput) {
    valInput.value = history.length > 0 ? history[history.length - 1].weight : '70.0';
  }
  if (noteInput) noteInput.value = '';

  renderWeightHistoryInModal();
};

window.editWeightEntry = function(entryId) {
  const history = store.get('weight_history', []);
  const entry = history.find(h => h.id === entryId);
  if (!entry) return;

  window._editingWeightId = entryId;

  const dateInput = document.getElementById('weightDateInput');
  const valInput = document.getElementById('weightValInput');
  const noteInput = document.getElementById('weightNoteInput');
  const modalTitle = document.getElementById('weightModalTitle');
  const submitText = document.getElementById('weightSubmitText');
  const cancelBtn = document.getElementById('weightCancelEditBtn');

  if (modalTitle) modalTitle.innerHTML = '<i class="ri-edit-line"></i> Modifier la pesée';
  if (submitText) submitText.textContent = 'Mettre à jour la pesée';
  if (cancelBtn) cancelBtn.style.display = 'block';

  // Format date for input
  const d = new Date(entry.date);
  if (!isNaN(d.getTime()) && dateInput) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
    if (dateInput._updateVitalDatePicker) dateInput._updateVitalDatePicker();
  }

  if (valInput) valInput.value = entry.weight;
  if (noteInput) noteInput.value = entry.note || '';

  renderWeightHistoryInModal();
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

  if (window._editingWeightId) {
    const idx = history.findIndex(h => h.id === window._editingWeightId);
    if (idx !== -1) {
      history[idx].date = entryDate;
      history[idx].weight = w;
      history[idx].note = note;
      showToast(`Pesée mise à jour (${w} kg) !`, 'success');
    }
    window._editingWeightId = null;
  } else {
    const newId = 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    history.push({
      id: newId,
      date: entryDate,
      weight: w,
      note
    });
    showToast(`Pesée de ${w} kg enregistrée pour le ${dateStr} !`, 'success');
  }

  // Ensure every item has an id
  history.forEach((item, idx) => {
    if (!item.id) item.id = 'w_' + (Date.now() + idx);
  });

  history.sort((a, b) => new Date(a.date) - new Date(b.date));
  store.set('weight_history', history);

  renderWeightChart();
  renderWeightHistoryInModal();
  document.getElementById('weightModal')?.classList.remove('open');
};

window.deleteWeightEntry = async function(idOrIdx) {
  let history = store.get('weight_history', []);
  let idx = typeof idOrIdx === 'string' ? history.findIndex(h => h.id === idOrIdx) : idOrIdx;
  if (idx < 0 || idx >= history.length) return;

  const item = history[idx];
  const dateFormatted = new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const ok = await (window.showVitalConfirm ? window.showVitalConfirm({
    title: 'Supprimer cette pesée ?',
    message: `Voulez-vous supprimer la pesée de <strong>${item.weight} kg</strong> du ${dateFormatted} ?`,
    icon: 'ri-delete-bin-line',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    isDanger: true
  }) : Promise.resolve(confirm('Supprimer cette pesée ?')));

  if (!ok) return;

  if (window._editingWeightId === item.id) {
    window.cancelWeightEdit();
  }

  history.splice(idx, 1);
  store.set('weight_history', history);
  showToast('Pesée supprimée.', 'info');
  renderWeightChart();
  renderWeightHistoryInModal();
};

window.renderWeightHistoryInModal = function() {
  const listEl = document.getElementById('weightHistoryList');
  const countEl = document.getElementById('weightHistoryCount');
  if (!listEl) return;

  const history = store.get('weight_history', []);
  let modified = false;
  history.forEach((item, idx) => {
    if (!item.id) {
      item.id = 'w_' + (Date.now() + idx);
      modified = true;
    }
  });
  if (modified) store.set('weight_history', history);

  if (countEl) countEl.textContent = `${history.length} pesée${history.length > 1 ? 's' : ''}`;

  if (history.length === 0) {
    listEl.innerHTML = '<p class="empty-state-sm" style="text-align:center;padding:12px;">Aucune pesée enregistrée.</p>';
    return;
  }

  const reversed = [...history].reverse();
  listEl.innerHTML = reversed.map((item) => {
    const isEditing = window._editingWeightId === item.id;
    const d = new Date(item.date);
    const dateFormatted = isNaN(d.getTime()) ? item.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    return `
      <div class="weight-history-item ${isEditing ? 'editing' : ''}">
        <div>
          <span class="weight-history-val">${item.weight} kg</span>
          <span class="weight-history-date"> · ${dateFormatted}${item.note ? ` (${esc(item.note)})` : ''}</span>
        </div>
        <div class="weight-history-actions">
          <button class="weight-history-btn edit" onclick="editWeightEntry('${item.id}')" title="Modifier cette pesée"><i class="ri-edit-line"></i></button>
          <button class="weight-history-btn del" onclick="deleteWeightEntry('${item.id}')" title="Supprimer cette pesée"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    `;
  }).join('');
};

// ═══════ MODERN WEIGHT ANALYTICS & INTERACTIVE CHART ═══════
let currentWeightPeriod = 'all';

window.setWeightPeriod = function(period) {
  currentWeightPeriod = period;
  document.querySelectorAll('#weightPeriodBar .period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  renderWeightChart();
};

function getSmoothSplinePath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

window.renderWeightChart = function() {
  const container = document.getElementById('weightChartContainer');
  const empty = document.getElementById('weightChartEmpty');
  const svg = document.getElementById('weightChartSvg');
  const tooltip = document.getElementById('weightChartTooltip');
  if (!container || !empty || !svg) return;

  const history = store.get('weight_history', []);
  const profile = typeof getUserProfile === 'function' ? getUserProfile() : {};

  // Sort all entries chronologically
  const allSorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update KPI cards regardless of filter
  const curWeightEl = document.getElementById('kpiCurrentWeight');
  const deltaBadgeEl = document.getElementById('kpiDeltaBadge');
  const totalDeltaEl = document.getElementById('kpiTotalDelta');
  const avg7dEl = document.getElementById('kpiAvg7d');
  const targetWeightEl = document.getElementById('kpiTargetWeight');

  if (allSorted.length > 0) {
    const latest = allSorted[allSorted.length - 1];
    const first = allSorted[0];
    const prev = allSorted.length > 1 ? allSorted[allSorted.length - 2] : null;

    if (curWeightEl) curWeightEl.textContent = `${latest.weight} kg`;

    if (deltaBadgeEl) {
      if (prev) {
        const diff = Math.round((latest.weight - prev.weight) * 10) / 10;
        if (diff < 0) {
          deltaBadgeEl.textContent = `📉 ${diff} kg`;
          deltaBadgeEl.style.background = 'rgba(52,211,153,0.15)';
          deltaBadgeEl.style.color = '#34d399';
        } else if (diff > 0) {
          deltaBadgeEl.textContent = `📈 +${diff} kg`;
          deltaBadgeEl.style.background = 'rgba(239,68,68,0.15)';
          deltaBadgeEl.style.color = '#f87171';
        } else {
          deltaBadgeEl.textContent = `➡️ 0.0 kg`;
          deltaBadgeEl.style.background = 'rgba(255,255,255,0.08)';
          deltaBadgeEl.style.color = 'var(--text-dim)';
        }
      } else {
        deltaBadgeEl.textContent = 'Départ';
        deltaBadgeEl.style.background = 'rgba(255,255,255,0.08)';
        deltaBadgeEl.style.color = 'var(--text-dim)';
      }
    }

    if (totalDeltaEl) {
      const totDiff = Math.round((latest.weight - first.weight) * 10) / 10;
      totalDeltaEl.textContent = totDiff <= 0 ? `${totDiff} kg` : `+${totDiff} kg`;
      totalDeltaEl.style.color = totDiff <= 0 ? 'var(--accent)' : '#f87171';
    }

    // 7-day average
    const now = Date.now();
    const last7dEntries = allSorted.filter(h => (now - new Date(h.date).getTime()) <= 7 * 86400000);
    if (avg7dEl) {
      if (last7dEntries.length > 0) {
        const avg = last7dEntries.reduce((s, h) => s + h.weight, 0) / last7dEntries.length;
        avg7dEl.textContent = `${avg.toFixed(1)} kg`;
      } else {
        avg7dEl.textContent = `${latest.weight.toFixed(1)} kg`;
      }
    }
  } else {
    if (curWeightEl) curWeightEl.textContent = '-- kg';
    if (deltaBadgeEl) deltaBadgeEl.textContent = '';
    if (totalDeltaEl) totalDeltaEl.textContent = '-- kg';
    if (avg7dEl) avg7dEl.textContent = '-- kg';
  }

  if (targetWeightEl) {
    targetWeightEl.textContent = profile.targetWeight ? `${profile.targetWeight} kg` : 'Non défini';
  }

  if (!history || history.length === 0) {
    container.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  // Filter entries based on active period
  const nowTime = Date.now();
  let cutoff = 0;
  if (currentWeightPeriod === '7d') cutoff = nowTime - 7 * 86400000;
  else if (currentWeightPeriod === '1m') cutoff = nowTime - 30 * 86400000;
  else if (currentWeightPeriod === '3m') cutoff = nowTime - 90 * 86400000;
  else if (currentWeightPeriod === '6m') cutoff = nowTime - 180 * 86400000;
  else if (currentWeightPeriod === '1y') cutoff = nowTime - 365 * 86400000;

  let sorted = allSorted.filter(h => new Date(h.date).getTime() >= cutoff);
  if (sorted.length === 0) {
    sorted = allSorted.slice(-5); // fallback to latest entries if filter is empty
  }

  container.style.display = 'block';
  empty.style.display = 'none';

  const svgWidth = Math.max(320, container.clientWidth || 600);
  const svgHeight = 240;

  const margin = { top: 25, right: 35, bottom: 40, left: 60 };
  const chartW = svgWidth - margin.left - margin.right;
  const chartH = svgHeight - margin.top - margin.bottom;

  const weights = sorted.map(h => h.weight);
  const targetW = parseFloat(profile.targetWeight);
  if (!isNaN(targetW) && targetW > 20 && targetW < 300) {
    weights.push(targetW);
  }

  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const span = Math.max(2, rawMax - rawMin);

  let step = 2;
  if (span > 30) step = 10;
  else if (span > 15) step = 5;
  else if (span <= 4) step = 1;

  let yMin = Math.max(0, Math.floor((rawMin - step * 0.5) / step) * step);
  let yMax = Math.ceil((rawMax + step * 0.5) / step) * step;
  if (yMax === yMin) { yMax += step; yMin = Math.max(0, yMin - step); }
  const yRange = yMax - yMin;

  // Grid lines
  let gridLinesHtml = '';
  let yLabelsHtml = '';
  for (let v = yMin; v <= yMax + 0.001; v += step) {
    const rounded = Math.round(v * 10) / 10;
    const yPos = margin.top + chartH - ((rounded - yMin) / yRange) * chartH;
    gridLinesHtml += `<line x1="${margin.left}" y1="${yPos}" x2="${margin.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4,4" />`;
    yLabelsHtml += `<text x="${margin.left - 12}" y="${yPos + 4}" fill="var(--text-dim, #94a3b8)" font-size="11" font-weight="600" text-anchor="end">${rounded} kg</text>`;
  }

  // Calculate coordinates with proportional time spacing
  const minTime = new Date(sorted[0].date).getTime();
  const maxTime = new Date(sorted[sorted.length - 1].date).getTime();
  const timeSpan = Math.max(1, maxTime - minTime);

  const coords = [];
  sorted.forEach((entry, i) => {
    const t = new Date(entry.date).getTime();
    const xRatio = timeSpan === 0 ? 0.5 : (t - minTime) / timeSpan;
    const x = margin.left + xRatio * chartW;
    const y = margin.top + chartH - ((entry.weight - yMin) / yRange) * chartH;
    coords.push({ x, y, entry, timestamp: t });
  });

  // Spline Path
  const linePathD = getSmoothSplinePath(coords);
  let areaPathD = '';
  if (coords.length > 1) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    areaPathD = `${linePathD} L ${last.x} ${margin.top + chartH} L ${first.x} ${margin.top + chartH} Z`;
  }

  // Target Goal Line
  let targetLineHtml = '';
  if (!isNaN(targetW) && targetW >= yMin && targetW <= yMax) {
    const targetY = margin.top + chartH - ((targetW - yMin) / yRange) * chartH;
    targetLineHtml = `
      <g>
        <line x1="${margin.left}" y1="${targetY}" x2="${margin.left + chartW}" y2="${targetY}" stroke="#60a5fa" stroke-dasharray="6,4" stroke-width="1.5" opacity="0.75" />
        <text x="${margin.left + chartW}" y="${targetY - 6}" fill="#60a5fa" font-size="10" font-weight="700" text-anchor="end">Objectif ${targetW} kg</text>
      </g>
    `;
  }

  // Points and smart X date labels
  let pointsHtml = '';
  let xLabelsHtml = '';
  const stride = Math.ceil(coords.length / 5);

  coords.forEach((pt, i) => {
    const isMajor = (i === 0 || i === coords.length - 1 || i % stride === 0);
    const d = new Date(pt.entry.date);
    const dateFormatted = isNaN(d.getTime()) ? pt.entry.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

    // Subtle point marker
    pointsHtml += `
      <g class="chart-point-group" data-idx="${i}">
        <circle cx="${pt.x}" cy="${pt.y}" r="6" fill="var(--accent)" opacity="0.2" />
        <circle cx="${pt.x}" cy="${pt.y}" r="3.5" fill="var(--accent)" stroke="#0f172a" stroke-width="2" />
      </g>
    `;

    if (isMajor) {
      xLabelsHtml += `
        <text x="${pt.x}" y="${margin.top + chartH + 18}" fill="var(--text-dim, #94a3b8)" font-size="10" font-weight="600" text-anchor="middle">${dateFormatted}</text>
      `;
    }
  });

  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.32" />
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.0" />
      </linearGradient>
    </defs>
    ${gridLinesHtml}
    ${yLabelsHtml}
    ${targetLineHtml}
    <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    ${coords.length > 1 ? `<path d="${areaPathD}" fill="url(#weightAreaGradient)" />` : ''}
    ${coords.length > 1 ? `<path d="${linePathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
    ${pointsHtml}
    ${xLabelsHtml}
    <!-- Interactive crosshair line -->
    <line id="chartCrosshairLine" x1="0" y1="${margin.top}" x2="0" y2="${margin.top + chartH}" stroke="rgba(52,211,153,0.5)" stroke-width="1.5" stroke-dasharray="3,3" style="display:none;" />
    <circle id="chartHoverCircle" cx="0" cy="0" r="6" fill="#34d399" stroke="#fff" stroke-width="2.5" style="display:none;" />
    <!-- Invisible overlay for pointer interaction -->
    <rect id="chartOverlay" x="${margin.left}" y="${margin.top}" width="${chartW}" height="${chartH}" fill="transparent" style="cursor:crosshair;" />
  `;

  // Attach interactive tooltip handlers
  const overlay = svg.querySelector('#chartOverlay');
  const crosshair = svg.querySelector('#chartCrosshairLine');
  const hoverCircle = svg.querySelector('#chartHoverCircle');

  function handlePointerMove(e) {
    if (!coords || coords.length === 0 || !tooltip) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const clientX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const svgX = clientX * scaleX;

    // Find nearest point
    let nearest = coords[0];
    let minDist = Infinity;
    coords.forEach(pt => {
      const dist = Math.abs(pt.x - svgX);
      if (dist < minDist) {
        minDist = dist;
        nearest = pt;
      }
    });

    if (nearest && crosshair && hoverCircle) {
      crosshair.setAttribute('x1', nearest.x);
      crosshair.setAttribute('x2', nearest.x);
      crosshair.style.display = 'block';

      hoverCircle.setAttribute('cx', nearest.x);
      hoverCircle.setAttribute('cy', nearest.y);
      hoverCircle.style.display = 'block';

      // Position HTML tooltip
      const d = new Date(nearest.entry.date);
      const dateStr = isNaN(d.getTime()) ? nearest.entry.date : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const prevEntry = allSorted[allSorted.indexOf(nearest.entry) - 1];
      const deltaText = prevEntry ? (nearest.entry.weight - prevEntry.weight).toFixed(1) : null;
      const deltaFormatted = deltaText !== null ? (parseFloat(deltaText) <= 0 ? `📉 ${deltaText} kg` : `📈 +${deltaText} kg`) : 'Première pesée';

      tooltip.innerHTML = `
        <div style="font-weight:800; font-size:0.92rem; color:#fff; display:flex; align-items:baseline; gap:8px;">
          <span>${nearest.entry.weight} kg</span>
          <span style="font-size:0.75rem; font-weight:700; color:${deltaText && parseFloat(deltaText) <= 0 ? '#34d399' : '#f87171'};">${deltaFormatted}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-dim); margin-top:3px;">${dateStr}</div>
        ${nearest.entry.note ? `<div style="font-size:0.74rem; color:#93c5fd; margin-top:4px; font-style:italic;">« ${esc(nearest.entry.note)} »</div>` : ''}
      `;

      const tooltipX = (nearest.x / svgWidth) * rect.width;
      const tooltipY = (nearest.y / svgHeight) * rect.height;

      tooltip.style.display = 'block';
      tooltip.style.left = `${Math.min(rect.width - 160, Math.max(10, tooltipX - 70))}px`;
      tooltip.style.top = `${Math.max(10, tooltipY - 65)}px`;
    }
  }

  function handlePointerLeave() {
    if (crosshair) crosshair.style.display = 'none';
    if (hoverCircle) hoverCircle.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
  }

  if (overlay) {
    overlay.addEventListener('pointermove', handlePointerMove);
    overlay.addEventListener('pointerleave', handlePointerLeave);
    overlay.addEventListener('touchmove', handlePointerMove, { passive: true });
    overlay.addEventListener('touchend', handlePointerLeave);
  }
};

// Window resize handler for weight chart
window.addEventListener('resize', () => {
  const container = document.getElementById('weightChartContainer');
  if (container && container.style.display !== 'none') {
    renderWeightChart();
  }
});

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

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT STUDIO HD MODAL CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
let _inAppMascotRenderer = null;
const _mascotQuotes = {
  idle: "« Prêt à explorer la vitalité naturelle et drainer les acides ! »",
  walk: "« En route pour stimuler la lymphe et activer la motilité péristaltique ! 🚶 »",
  laugh: "« Hahaha ! La joie et la respiration profonde alcalinisent le terrain ! 😄 »",
  coo: "« Roucouuu ! Écoute le chant de tes cellules régénérées. 🐦 »",
  think: "« J'analyse les flavonoïdes, le PRAL et la charge en mucus... 🧐 »",
  celebrate: "« Félicitations pour tes victoires vitalistes ! 🎉 »",
  sleep: "« Réparation cellulaire et autolyse des déchets... Bonne nuit ! 😴 »"
};

window.openMascotStudioModal = function() {
  const modal = document.getElementById('mascotStudioModal');
  if (!modal) return;
  modal.style.display = 'flex';
  
  const canvas = document.getElementById('inAppMascotCanvas');
  if (canvas && window.PigeonRenderer) {
    if (!_inAppMascotRenderer) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 220 * dpr;
      canvas.height = 260 * dpr;
      canvas.style.width = '220px';
      canvas.style.height = '260px';
      _inAppMascotRenderer = new window.PigeonRenderer(canvas);
    }
    _inAppMascotRenderer.setAction('idle');
  }
};

window.closeMascotStudioModal = function() {
  const modal = document.getElementById('mascotStudioModal');
  if (modal) modal.style.display = 'none';
};

window.setInAppMascotAction = function(action) {
  if (_inAppMascotRenderer) {
    _inAppMascotRenderer.setAction(action);
  }
  // Jouer le vrai son de pigeon UNIQUEMENT lors d'un clic explicite sur Roucouler dans la modale
  if (action === 'coo' && window.pigeonAudio) {
    window.pigeonAudio.playRealCoo();
  }
  const bubble = document.getElementById('inAppMascotBubble');
  if (bubble && _mascotQuotes[action]) {
    bubble.textContent = `🐦 ${_mascotQuotes[action]}`;
  }
};

window.triggerInAppPigeonAction = function() {
  const actions = ['laugh', 'celebrate', 'coo', 'walk', 'think'];
  const next = actions[Math.floor(Math.random() * actions.length)];
  window.setInAppMascotAction(next);
};

window.toggleInAppAudioFx = function() {
  if (window.pigeonAudio) {
    const enabled = window.pigeonAudio.toggleSound();
    const icon = document.getElementById('inAppSoundIcon');
    const label = document.getElementById('inAppSoundLabel');
    if (icon) icon.className = enabled ? 'ri-volume-up-fill' : 'ri-volume-mute-fill';
    if (label) label.textContent = enabled ? 'Sons Aviaires : Activés' : 'Sons Aviaires : Désactivés';
  }
};

