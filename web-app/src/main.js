/**
 * VitalTrack Web App — Complete Feature Set
 * Dashboard, Chat IA, Recherche, Repas, Favoris, Jeûne (programs+analytics+coach),
 * Respiration (history), Modes/Protocoles, Profil, Food Detail Modal (3 tabs)
 */

import { RAINTREE_HERBS, RAINTREE_PROTOCOLS } from './raintree-data.js';
import { t, getLanguage, setLanguage, toggleLanguage, onLanguageChange } from './i18n.js';
import { pigeonNudges } from './mascot-nudges.js';
import { auth } from './auth.js';
import { store, formatLocalDate, parseLocalDate, addDaysLocal, getUserStorageKey } from './storage.js';
import { MEDIA_SEARCH_DATABASE, searchMediaKnowledge, getExpandedSearchTokens } from './data/mediaSearchIndex.js';
import { VIDEO_DUBBING_DATABASE, getDubbingDataForVideo } from './data/videoDubbingData.js';
import { dubbingEngine } from './utils/dubbingEngine.js';
import { VITALIST_WISDOM, getRandomWisdom, getCircadianContextWisdom, getDailyWisdom } from './data/vitalistWisdom.js';
import { initRecipesModule } from './recipesModule.js';
import { initDeepSearchModule } from './deepSearchModule.js';
import './styles/bookReader.css';
import { initBookReaderModule, openBookReader } from './bookReaderModule.js';

// Exposer globalement pour l'interface utilisateur
window.store = store;
window.formatLocalDate = formatLocalDate;
window.parseLocalDate = parseLocalDate;
window.addDaysLocal = addDaysLocal;
window.getUserStorageKey = getUserStorageKey;
window.vitalTrackI18n = { t, getLanguage, setLanguage, toggleLanguage, onLanguageChange };
window.pigeonNudges = pigeonNudges;
window.vitalTrackAuth = auth;
window.VITALIST_WISDOM = VITALIST_WISDOM;
window.getRandomWisdom = getRandomWisdom;
window.getCircadianContextWisdom = getCircadianContextWisdom;
window.getDailyWisdom = getDailyWisdom;
window.MEDIA_SEARCH_DATABASE = MEDIA_SEARCH_DATABASE;
window.searchMediaKnowledge = searchMediaKnowledge;
window.getExpandedSearchTokens = getExpandedSearchTokens;
window.VIDEO_DUBBING_DATABASE = VIDEO_DUBBING_DATABASE;
window.getDubbingDataForVideo = getDubbingDataForVideo;
window.dubbingEngine = dubbingEngine;

// ═══════ CONFIG ═══════
const API_BASE = window.location.origin;
const VT_APP_KEY = import.meta.env.VITE_VT_APP_KEY || '';

function getApiHeaders(extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (VT_APP_KEY) headers['X-VT-API-Key'] = VT_APP_KEY;
  const userGeminiKey = localStorage.getItem('vital_custom_gemini_key') || '';
  if (userGeminiKey) headers['X-Gemini-Key'] = userGeminiKey;
  return headers;
}
window.getApiHeaders = getApiHeaders;

function saveCustomGeminiKey(key) {
  const clean = (key || '').trim();
  if (clean) {
    localStorage.setItem('vital_custom_gemini_key', clean);
    showToast('✨ Clé Gemini enregistrée avec succès !', 'success');
  } else {
    localStorage.removeItem('vital_custom_gemini_key');
    showToast('Clé personnalisée supprimée.', 'info');
  }
}
window.saveCustomGeminiKey = saveCustomGeminiKey;

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

// ═══════ TOAST NOTIFICATIONS (UNIFIED STACK) ═══════
function showToast(msg, type = 'success', duration = 3500, action = null) {
  let container = document.getElementById('appToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'appToastContainer';
    container.className = 'app-toast-container';
    document.body.appendChild(container);
  }

  // Limit simultaneous toasts in stack to prevent visual clutter
  const existing = container.querySelectorAll('.app-toast, .pigeon-nudge-toast');
  if (existing.length >= 3) {
    const oldest = existing[0];
    oldest.classList.add('toast-hiding');
    setTimeout(() => { if (oldest.parentNode) oldest.remove(); }, 250);
  }

  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  const iconClass = type === 'success' ? 'ri-checkbox-circle-fill' : (type === 'error' ? 'ri-error-warning-fill' : 'ri-information-fill');

  let actionHtml = '';
  if (action && action.label) {
    const actionIcon = action.icon ? `<i class="${action.icon}" style="font-size:0.9rem;"></i>` : '';
    const onClickStr = typeof action.onClick === 'string' ? action.onClick : '';
    actionHtml = `<button type="button" class="app-toast-btn" id="toast-action-btn" ${onClickStr ? `onclick="${onClickStr}"` : ''}>${actionIcon}<span>${esc(action.label)}</span></button>`;
  }

  toast.innerHTML = `
    <div class="app-toast-icon-wrap">
      <i class="${iconClass}"></i>
    </div>
    <div class="app-toast-content">
      <div class="app-toast-message">${msg}</div>
    </div>
    ${actionHtml}
    <button type="button" class="app-toast-close" onclick="this.closest('.app-toast').remove()" aria-label="Fermer">&times;</button>
  `;

  if (action && typeof action.onClick === 'function') {
    const btn = toast.querySelector('#toast-action-btn');
    if (btn) btn.addEventListener('click', action.onClick);
  }

  container.appendChild(toast);

  let hideTimer = setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
  }, duration);

  toast.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
  });
  toast.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
    }, 1500);
  });
};

// ═══════ GLOBAL VITAL CONFIRM MODAL ═══════
function showVitalConfirm({
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

function initVitalDatePicker(inputEl) {
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

  let viewMode = 'days'; // 'days' | 'months' | 'years'

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
          <button type="button" class="vital-dp-pill-btn ${viewMode === 'months' ? 'active' : ''}" data-toggle-mode="months">
            <span>${MONTH_NAMES_FR[viewMonth]}</span> <i class="ri-arrow-down-s-line"></i>
          </button>
          <button type="button" class="vital-dp-pill-btn ${viewMode === 'years' ? 'active' : ''}" data-toggle-mode="years">
            <span>${viewYear}</span> <i class="ri-arrow-down-s-line"></i>
          </button>
        </div>

        <div class="vital-datepicker-nav-group">
          <button type="button" class="vital-datepicker-nav" data-nav="next-month" title="Mois suivant"><i class="ri-arrow-right-s-line"></i></button>
          <button type="button" class="vital-datepicker-nav" data-nav="next-year" title="Année suivante"><i class="ri-skip-forward-line"></i></button>
        </div>
      </div>
    `;

    if (viewMode === 'months') {
      html += `
        <div class="vital-dp-months-grid">
          ${MONTH_NAMES_FR.map((name, i) => `
            <button type="button" class="vital-dp-month-chip ${i === viewMonth ? 'active' : ''}" data-pick-month="${i}">
              ${name}
            </button>
          `).join('')}
        </div>
      `;
    } else if (viewMode === 'years') {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 25 }, (_, k) => (currentYear - 15) + k);
      html += `
        <div class="vital-dp-years-grid">
          ${years.map(y => `
            <button type="button" class="vital-dp-year-chip ${y === viewYear ? 'active' : ''}" data-pick-year="${y}">
              ${y}
            </button>
          `).join('')}
        </div>
      `;
    } else {
      // Days View
      html += `
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
    }

    popover.innerHTML = html;

    // Attach listeners
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

    popover.querySelectorAll('[data-toggle-mode]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const m = btn.dataset.toggleMode;
        viewMode = (viewMode === m) ? 'days' : m;
        renderCalendar();
      };
    });

    popover.querySelectorAll('[data-pick-month]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        viewMonth = parseInt(btn.dataset.pickMonth);
        viewMode = 'days';
        renderCalendar();
      };
    });

    popover.querySelectorAll('[data-pick-year]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        viewYear = parseInt(btn.dataset.pickYear);
        viewMode = 'days';
        renderCalendar();
      };
    });

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

function initAllVitalDatePickers() {
  document.querySelectorAll('input[type="date"], input.vital-datepicker-input, #calMealDate, #weightDateInput').forEach(input => {
    window.initVitalDatePicker(input);
  });
};

// ═══════ VITAL CUSTOM SELECT / DROPDOWN ═══════
function initVitalSelect(selectEl) {
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

function initAllVitalSelects() {
  document.querySelectorAll('select.custom-vital-select, select.sort-select, #fastingType, #searchSortSelect, #profileGoal, #profileTransitionLevel, #profileLanguage, #profileActivity, #profileBioregion').forEach(sel => {
    window.initVitalSelect(sel);
  });
};

// ═══════ AUTH UI & RGPD DROIT À L'OUBLI ═══════
function updateAuthUI(user) {
  const containers = [
    document.getElementById('googleAuthBtnContainer'),
    document.getElementById('desktopGoogleAuthContainer')
  ].filter(Boolean);

  const avatarButtons = [
    document.getElementById('dashUserProfileBtn'),
    document.getElementById('desktopUserAvatarBtn')
  ].filter(Boolean);

  if (user && user.uid) {
    containers.forEach(container => {
      const isCompact = container.id === 'googleAuthBtnContainer';
      if (isCompact) {
        container.innerHTML = `
          <div class="mobile-user-avatar-wrap" onclick="window.openUserProfileModal()" title="${user.name} (Mon Profil)">
            <img src="${user.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}" alt="${user.name}" class="user-avatar-mini" />
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="user-profile-badge" title="${user.email || user.name}" onclick="window.openUserProfileModal()" style="cursor:pointer;">
            <img src="${user.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}" alt="${user.name}" class="user-avatar-mini" />
            <span class="user-name-label">${user.name}</span>
            <button class="user-logout-btn" title="${t('auth.signOut', {}, 'Se déconnecter')}" onclick="event.stopPropagation(); window.vitalTrackAuth?.signOut()"><i class="ri-logout-box-r-line"></i></button>
          </div>
        `;
      }
    });

    avatarButtons.forEach(btn => {
      btn.innerHTML = `<img src="${user.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}" class="user-avatar-mini" style="width:24px; height:24px; min-width:24px; min-height:24px; max-width:24px; max-height:24px; border-radius:50%; object-fit:cover; display:block;" />`;
      btn.style.padding = '0';
      btn.style.width = '38px';
      btn.style.height = '38px';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.title = `${user.name} - Mon Profil & Badges`;
      btn.onclick = () => window.openUserProfileModal();
    });
  } else {
    containers.forEach(container => {
      const isCompact = container.id === 'googleAuthBtnContainer';
      container.innerHTML = `
        <button class="google-auth-btn ${isCompact ? 'compact' : ''}" onclick="window.openGoogleAuthModal()" title="${t('auth.signInWithGoogle', {}, 'Se connecter avec Google')}">
          <svg class="google-icon-svg" viewBox="0 0 24 24" width="${isCompact ? '15' : '16'}" height="${isCompact ? '15' : '16'}"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          <span class="${isCompact ? 'auth-btn-label-mobile' : 'auth-btn-label'}" data-i18n="${isCompact ? 'auth.signInShort' : 'auth.signInWithGoogle'}">${isCompact ? (window.vitalTrackI18n?.t('auth.signInShort') || 'Connexion') : (window.vitalTrackI18n?.t('auth.signInWithGoogle') || 'Connexion Google')}</span>
        </button>
      `;
    });

    avatarButtons.forEach(btn => {
      const p = typeof getUserProfile === 'function' ? getUserProfile() : {};
      const initial = (p.name && p.name[0]) ? p.name[0].toUpperCase() : '<i class="ri-user-3-line"></i>';
      btn.innerHTML = initial;
      btn.style.padding = '';
      btn.style.width = '38px';
      btn.style.height = '38px';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.title = 'Mon Profil & Badges Vitalistes';
      btn.onclick = () => window.openUserProfileModal();
    });
  }
}

// ═══════ GOOGLE AUTH MODAL CONTROLLERS & AI ACCESS GATE ═══════
function requireAuthForAi(featureName = "cette fonctionnalité IA") {
  const isAuth = window.vitalTrackAuth ? window.vitalTrackAuth.isAuthenticated() : false;
  if (isAuth) {
    return true;
  }
  openGoogleAuthModal(featureName);
  if (window.showToast) {
    window.showToast(`🔒 Connexion requise : Veuillez vous connecter avec Google pour utiliser ${featureName}.`, 'warning', 4500);
  }
  return false;
}

function openGoogleAuthModal(reason) {
  const modal = document.getElementById('googleAuthModal');
  if (modal) {
    const desc = modal.querySelector('p');
    if (desc && reason) {
      desc.innerHTML = `🔒 <strong>Connexion requise</strong> pour accéder à <em>${reason}</em>.<br>Connectez-vous avec votre compte Google pour continuer en illimité et synchroniser vos données.`;
    } else if (desc) {
      desc.textContent = "Synchronisez vos repas, vos cycles de jeûne et vos conversations avec l'IA en toute sécurité sur tous vos appareils.";
    }
    modal.style.display = 'flex';
  }
};

function closeGoogleAuthModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn') && !e.target.closest('.modal-close-btn')) {
    return;
  }
  const modal = document.getElementById('googleAuthModal');
  if (modal) modal.style.display = 'none';
};

async function handleDirectGoogleLogin() {
  if (window.vitalTrackAuth) {
    await window.vitalTrackAuth.signInWithGoogle();
  }
  closeGoogleAuthModal(null);
  closeAiAuthGateModal(null);
}

function handleGoogleAuthForm(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('googleAuthEmailInput');
  if (!input || !input.value.trim()) return;

  const email = input.value.trim();
  if (window.vitalTrackAuth) {
    window.vitalTrackAuth.signInWithEmail(email);
  }
  window.closeGoogleAuthModal(null);
};

// ═══════ USER PROFILE & VITALIST ACHIEVEMENTS HUB ═══════
function openUserProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (!modal) return;
  renderUserProfileModal();
  modal.style.display = 'flex';
};

function closeUserProfileModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn') && !e.target.closest('.modal-close-btn')) {
    return;
  }
  const modal = document.getElementById('userProfileModal');
  if (modal) modal.style.display = 'none';
};

function renderUserProfileModal() {
  const content = document.getElementById('userProfileModalContent');
  if (!content) return;

  const authUser = window.vitalTrackAuth ? window.vitalTrackAuth.getCurrentUser() : null;
  const profile = typeof getUserProfile === 'function' ? getUserProfile() : {};
  const meals = store.get('meals', []);
  const fastingHistory = store.get('fasting-history', []);
  const breathingHistory = store.get('breathing-history', []);
  const viewedPlants = store.get('viewed_plants', []);
  const dailyWater = store.get('daily_water', 0);

  const displayName = (authUser && authUser.name) || profile.name || 'Adepte Vitaliste';
  const displayEmail = (authUser && authUser.email) || 'Espace Local Sécurisé';
  const avatarUrl = (authUser && authUser.picture) || `https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`;

  // KPI Calculations
  const totalFastHours = fastingHistory.reduce((acc, f) => acc + (f.actualHours || f.targetHours || 0), 0);
  const alkalineMeals = meals.filter(m => (m.pral || 0) < 0 || m.foods?.some(f => f.isElectric || f.isRaw));
  const livingMealsCount = alkalineMeals.length;
  const avgVitality = typeof calculateVitalityScore === 'function' ? calculateVitalityScore() : 75;

  // 8 Vitalist Badges State & Progress
  const badges = [
    {
      id: 'mucusless_starter',
      icon: '🍇',
      title: 'Pionnier Sans Mucus',
      desc: 'Consigner son 1er repas vivant ou dissolvant de mucus (Ehret)',
      unlocked: meals.length > 0,
      current: Math.min(1, meals.length),
      target: 1
    },
    {
      id: 'electric_cells',
      icon: '⚡',
      title: 'Électrification Cellulaire',
      desc: 'Enregistrer 5 repas alcalins à PRAL négatif (Dr. Sebi)',
      unlocked: livingMealsCount >= 5,
      current: Math.min(5, livingMealsCount),
      target: 5
    },
    {
      id: 'autophagy_flame',
      icon: '🔥',
      title: 'Flamme de l\'Autophagie',
      desc: 'Valider un 1er jeûne intermittent de 16h ou plus',
      unlocked: fastingHistory.some(f => (f.actualHours || f.targetHours || 0) >= 16),
      current: fastingHistory.some(f => (f.actualHours || f.targetHours || 0) >= 16) ? 1 : 0,
      target: 1
    },
    {
      id: 'deep_fasting_master',
      icon: '👑',
      title: 'Maître du Jeûne Profond',
      desc: 'Accomplir un jeûne de régénération de 24h ou plus',
      unlocked: fastingHistory.some(f => (f.actualHours || f.targetHours || 0) >= 24),
      current: fastingHistory.some(f => (f.actualHours || f.targetHours || 0) >= 24) ? 1 : 0,
      target: 1
    },
    {
      id: 'raintree_explorer',
      icon: '🌿',
      title: 'Herboriste Amazonien',
      desc: 'Étudier 5 monographies de la Pharmacopée Raintree',
      unlocked: viewedPlants.length >= 5,
      current: Math.min(5, viewedPlants.length),
      target: 5
    },
    {
      id: 'prana_master',
      icon: '🧘',
      title: 'Maître du Prāna',
      desc: 'Compléter 3 sessions de respiration consciente (Wim Hof / Cohérence)',
      unlocked: breathingHistory.length >= 3,
      current: Math.min(3, breathingHistory.length),
      target: 3
    },
    {
      id: 'acid_base_harmony',
      icon: '⚖️',
      title: 'Harmonie Acido-Basique',
      desc: 'Atteindre un Score de Vitalité Biologique supérieur à 80',
      unlocked: avgVitality >= 80,
      current: avgVitality,
      target: 80,
      unit: '/100'
    },
    {
      id: 'living_water',
      icon: '💧',
      title: 'Source Vivante H3O2',
      desc: 'Atteindre l\'objectif quotidien de 2L d\'eau vivante structurée',
      unlocked: dailyWater >= 2000,
      current: Math.min(2000, dailyWater),
      target: 2000,
      unit: 'ml'
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Level computation
  const totalXp = (meals.length * 15) + (totalFastHours * 5) + (breathingHistory.length * 20) + (unlockedCount * 50);
  let userLevel = 1;
  let levelTitle = 'Initié Vitaliste 🌱';
  let nextLevelXp = 150;
  let prevLevelXp = 0;

  if (totalXp >= 750) {
    userLevel = 5;
    levelTitle = 'Sage de la Régénération 👑';
    nextLevelXp = 1500;
    prevLevelXp = 750;
  } else if (totalXp >= 400) {
    userLevel = 4;
    levelTitle = 'Maître de l\'Autophagie 🔥';
    nextLevelXp = 750;
    prevLevelXp = 400;
  } else if (totalXp >= 200) {
    userLevel = 3;
    levelTitle = 'Alchimiste Électrique ⚡';
    nextLevelXp = 400;
    prevLevelXp = 200;
  } else if (totalXp >= 75) {
    userLevel = 2;
    levelTitle = 'Praticien Sans Mucus 🌿';
    nextLevelXp = 200;
    prevLevelXp = 75;
  }

  const levelProgressPct = Math.min(100, Math.round(((totalXp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100));

  content.innerHTML = `
    <!-- Header Profil Card -->
    <div style="display:flex; align-items:center; gap:18px; padding-bottom:20px; border-bottom:1px solid var(--border); margin-bottom:20px; flex-wrap:wrap;">
      <div style="position:relative;">
        <img src="${avatarUrl}" alt="${displayName}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:2.5px solid var(--accent); box-shadow:0 0 16px var(--accent-glow);" />
        <div style="position:absolute; bottom:-4px; right:-4px; background:var(--bg); border:1px solid var(--accent); border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800; color:var(--accent);">
          ${userLevel}
        </div>
      </div>
      <div style="flex:1; min-width:200px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <h2 style="font-size:1.35rem; font-weight:800; color:var(--text); margin:0;">${displayName}</h2>
          <span style="background:var(--accent-glow); border:1px solid var(--accent); color:var(--accent); font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:20px;">
            ${levelTitle}
          </span>
        </div>
        <p style="font-size:0.82rem; color:var(--text-dim); margin:4px 0 10px 0;">${displayEmail}</p>

        <!-- XP & Level Progress Bar -->
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.74rem; font-weight:700; color:var(--text-dim); margin-bottom:4px;">
          <span>Niveau ${userLevel}</span>
          <span style="color:var(--accent);">${totalXp} / ${nextLevelXp} XP</span>
        </div>
        <div style="width:100%; height:7px; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; overflow:hidden;">
          <div style="width:${levelProgressPct}%; height:100%; background:linear-gradient(90deg, var(--accent), #60a5fa); border-radius:10px; transition:width 0.4s ease;"></div>
        </div>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:24px;">
      <div style="background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-sm); padding:12px 14px; border-radius:14px; text-align:center;">
        <div style="font-size:1.2rem; margin-bottom:2px;">🔥</div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--text);">${Math.round(totalFastHours)} h</div>
        <div style="font-size:0.72rem; color:var(--text-dim); font-weight:600;">Autophagie Totale</div>
      </div>
      <div style="background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-sm); padding:12px 14px; border-radius:14px; text-align:center;">
        <div style="font-size:1.2rem; margin-bottom:2px;">🥗</div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--text);">${livingMealsCount}</div>
        <div style="font-size:0.72rem; color:var(--text-dim); font-weight:600;">Repas Vivants</div>
      </div>
      <div style="background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-sm); padding:12px 14px; border-radius:14px; text-align:center;">
        <div style="font-size:1.2rem; margin-bottom:2px;">✨</div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--accent);">${avgVitality}/100</div>
        <div style="font-size:0.72rem; color:var(--text-dim); font-weight:600;">Score Vitalité</div>
      </div>
      <div style="background:var(--surface); border:1px solid var(--border); box-shadow:var(--shadow-sm); padding:12px 14px; border-radius:14px; text-align:center;">
        <div style="font-size:1.2rem; margin-bottom:2px;">🧘</div>
        <div style="font-size:1.1rem; font-weight:800; color:#60a5fa;">${breathingHistory.length}</div>
        <div style="font-size:0.72rem; color:var(--text-dim); font-weight:600;">Respirations</div>
      </div>
    </div>

    <!-- Section Badges & Quêtes Vitalistes -->
    <div style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:1.05rem; font-weight:800; color:var(--text); margin:0; display:flex; align-items:center; gap:8px;">
          <i class="ri-medal-fill" style="color:var(--accent);"></i> Badges &amp; Quêtes Vitalistes
        </h3>
        <span style="font-size:0.78rem; font-weight:700; color:var(--accent); background:var(--accent-glow); border:1px solid var(--accent); padding:3px 10px; border-radius:20px;">
          ${unlockedCount} / ${badges.length} Débloqués
        </span>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
        ${badges.map(b => `
          <div style="display:flex; gap:12px; padding:12px 14px; border-radius:14px; background:${b.unlocked ? 'var(--accent-glow)' : 'var(--surface-2)'}; border:1px solid ${b.unlocked ? 'var(--accent)' : 'var(--border)'}; box-shadow:var(--shadow-sm); position:relative; overflow:hidden;">
            <div style="font-size:1.8rem; flex-shrink:0; line-height:1; filter:${b.unlocked ? 'none' : 'grayscale(1) opacity(0.5)'};">
              ${b.icon}
            </div>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:3px;">
                <h4 style="font-size:0.88rem; font-weight:700; color:${b.unlocked ? 'var(--text)' : 'var(--text-dim)'}; margin:0;">${b.title}</h4>
                <span style="font-size:0.68rem; font-weight:700; padding:2px 6px; border-radius:6px; background:${b.unlocked ? 'var(--accent)' : 'var(--badge-bg)'}; color:${b.unlocked ? '#000' : 'var(--text-dim)'};">
                  ${b.unlocked ? '✨ DÉBLOQUÉ' : '🔒 EN COURS'}
                </span>
              </div>
              <p style="font-size:0.75rem; color:var(--text-dim); margin:0 0 6px 0; line-height:1.35;">${b.desc}</p>
              
              <!-- Progress Bar -->
              ${!b.unlocked ? `
                <div style="display:flex; align-items:center; gap:6px;">
                  <div style="flex:1; height:4px; background:var(--border); border-radius:4px; overflow:hidden;">
                    <div style="width:${Math.min(100, Math.round((b.current / b.target) * 100))}%; height:100%; background:var(--accent); border-radius:4px;"></div>
                  </div>
                  <span style="font-size:0.68rem; font-weight:700; color:var(--text-dim);">${b.current}/${b.target}${b.unit || ''}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Quick Action Footer -->
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; border-top:1px solid var(--border); padding-top:16px; flex-wrap:wrap;">
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-secondary" style="font-size:0.82rem; padding:8px 12px; border-radius:10px;" onclick="closeUserProfileModal(null); showPage('modes');">
          <i class="ri-settings-3-line"></i> Paramètres &amp; RGPD
        </button>
        <button type="button" class="btn-secondary" style="font-size:0.82rem; padding:8px 12px; border-radius:10px;" onclick="window.vitalTrackAuth?.exportAllUserData()">
          <i class="ri-download-cloud-line"></i> Export RGPD
        </button>
      </div>
      ${authUser ? `
        <button type="button" class="btn-danger" style="font-size:0.82rem; padding:8px 12px; border-radius:10px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.4); color:#ef4444;" onclick="closeUserProfileModal(null); window.vitalTrackAuth?.signOut();">
          <i class="ri-logout-box-r-line"></i> Se déconnecter
        </button>
      ` : `
        <button type="button" class="btn-primary" style="font-size:0.82rem; padding:8px 14px; border-radius:10px;" onclick="closeUserProfileModal(null); window.vitalTrackAuth?.signInWithGoogle();">
          <i class="ri-google-fill"></i> Connexion Google
        </button>
      `}
    </div>
  `;
};

// ═══════ INIT ═══════
async function initApp() {
  // Init Google Auth & Listeners
  if (window.vitalTrackAuth) {
    window.vitalTrackAuth.initGSI();
    window.vitalTrackAuth.onAuthStateChanged((user) => {
      updateAuthUI(user);
    });
  } else {
    updateAuthUI(null);
  }

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
  initRecipesModule();
  initDeepSearchModule();
  initBookReaderModule();

  // Initialize Custom Controls
  initAllVitalDatePickers();
  initAllVitalSelects();
  initFastingDurationControls();

  // Re-render and update on language change
  onLanguageChange((newLang) => {
    const p = getUserProfile();
    if (document.getElementById('greetName')) {
      const greetWord = window.vitalTrackI18n?.getCircadianGreeting ? window.vitalTrackI18n.getCircadianGreeting(newLang) : (t('dashboard.greeting') || 'Bonjour');
      document.getElementById('greetName').textContent = p.name ? `${greetWord} ${p.name} ! 👋` : `${greetWord} ! 👋`;
    }
    const bubble = document.getElementById('inAppMascotBubble');
    if (bubble) bubble.textContent = `🐦 ${t('mascot.idle')}`;
    if (window.vitalTrackAuth) {
      updateAuthUI(window.vitalTrackAuth.getCurrentUser());
    }
    renderDashboard();
    renderMeals();
  });

  if (window.VitalMascot) {
    window.appMascot = new window.VitalMascot('mascotCanvas');
    window.mascot = window.appMascot;
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
  
  // Initialize Mascot Vital Logos & Screenshot Protection
  if (typeof initAppLogos === 'function') initAppLogos();
  if (typeof initScreenshotProtection === 'function') initScreenshotProtection();

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
}

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

// ═══════ NAVIGATION & HISTORIQUE INTELLIGENT (MOBILE BACK BUTTON) ═══════
function showPage(page, options = {}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link, .bnav-item, .sidebar-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(l => l.classList.add('active'));

  // Highlight Plus tab if current page is in secondary drawer
  const morePages = ['recipes', 'deep-search', 'resources', 'materia-medica', 'breathing', 'search', 'meals', 'favorites', 'modes'];
  if (morePages.includes(page)) {
    const moreBtn = document.getElementById('bnavMoreBtn');
    if (moreBtn) moreBtn.classList.add('active');
  }

  // Toujours fermer la sidebar de chat et le drawer Plus quand on change de page
  if (window.toggleSidebar) window.toggleSidebar(false);
  if (window.toggleMoreDrawer) window.toggleMoreDrawer(false);

  // Gestion intelligente de l'historique du navigateur (évite de quitter l'app au retour)
  if (!options.fromPopState && typeof history !== 'undefined' && history.pushState) {
    try {
      const stateObj = { type: 'page', page: page };
      if (location.hash !== `#${page}`) {
        history.pushState(stateObj, '', `#${page}`);
      } else {
        history.replaceState(stateObj, '', `#${page}`);
      }
    } catch (e) {
      console.warn('History pushState error', e);
    }
  }

  // Remonter en haut de l'écran en douceur
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (page === 'dashboard') renderDashboard();
  if (page === 'deep-search') {
    if (window.renderDeepSearchView) window.renderDeepSearchView();
  }
  if (page === 'recipes') {
    if (window.renderRecipesView) window.renderRecipesView();
  }
  if (page === 'meals') renderMeals();
  if (page === 'calendar') {
    if (window.renderCalendar) window.renderCalendar();
    if (window.renderStrip) window.renderStrip();
    if (window.renderDay) window.renderDay();
    if (window.updateProgramRing) window.updateProgramRing();
  }
  if (page === 'materia-medica') renderRaintreeExplorer();
  if (page === 'favorites') renderFavorites();
  if (page === 'resources') renderResources();
  if (page === 'chat') initChatMascot();
};

// Écouteur global pour intercepter le bouton retour du navigateur / mobile swipe-back
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (e) => {
    // 1. Fermer BookReader si ouvert
    const brModal = document.getElementById('bookReaderModalOverlay');
    if (brModal && brModal.classList.contains('active')) {
      if (window.closeBookReader) window.closeBookReader();
      return;
    }

    // 2. Fermer le Popover du glossaire s'il est ouvert
    const popover = document.getElementById('brGlossaryPopover');
    if (popover && popover.classList.contains('open')) {
      if (window.closeGlossaryPopover) window.closeGlossaryPopover();
      return;
    }

    // 3. Fermer la modale Recette si ouverte
    const recipeModal = document.getElementById('recipeDetailModal');
    if (recipeModal && recipeModal.style.display !== 'none' && recipeModal.innerHTML.trim() !== '') {
      if (window.closeRecipeModal) window.closeRecipeModal();
      return;
    }

    // 4. Fermer le Drawer "Plus" si ouvert
    const moreDrawer = document.getElementById('moreDrawer');
    if (moreDrawer && moreDrawer.classList.contains('open')) {
      if (window.toggleMoreDrawer) window.toggleMoreDrawer(false);
      return;
    }

    // 5. Fermer la sidebar de chat si ouverte
    const chatSidebar = document.getElementById('chatSidebar');
    if (chatSidebar && chatSidebar.classList.contains('open')) {
      if (window.toggleSidebar) window.toggleSidebar(false);
      return;
    }

    // 6. Fermer toute autre modale overlay active
    const activeModals = document.querySelectorAll('.modal-overlay:not([style*="display: none"]):not([style*="display:none"]), .modal.active');
    if (activeModals.length > 0) {
      activeModals.forEach(m => {
        m.style.display = 'none';
        m.classList.remove('active');
      });
      return;
    }

    // 7. Navigation par page
    if (e.state && e.state.page) {
      showPage(e.state.page, { fromPopState: true });
    } else {
      const hash = (location.hash || '').replace('#', '').trim();
      if (hash && document.getElementById(`page-${hash}`)) {
        showPage(hash, { fromPopState: true });
      } else {
        showPage('dashboard', { fromPopState: true });
      }
    }
  });
}

function toggleMoreDrawer(forceOpen) {
  const drawer = document.getElementById('moreDrawer');
  const backdrop = document.getElementById('moreDrawerBackdrop');
  if (!drawer) return;

  const isOpen = drawer.classList.contains('open');
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

  if (shouldOpen) {
    drawer.style.display = 'block';
    if (backdrop) backdrop.style.display = 'block';
    requestAnimationFrame(() => {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('active');
    });
  } else {
    drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    setTimeout(() => {
      if (!drawer.classList.contains('open')) {
        drawer.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
      }
    }, 350);
  }
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

function toggleMobileNav() { document.getElementById('mobileNav').classList.toggle('open'); };

// ═══════ THEME ═══════
function toggleTheme() {
  const isDark = !document.documentElement.hasAttribute('data-theme');
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'light');
    store.set('theme', 'light');
    document.querySelectorAll('.theme-icon, #themeIcon, #themeIconMobile, #desktopThemeIcon').forEach(i => i.className = 'ri-sun-line theme-icon');
  } else {
    document.documentElement.removeAttribute('data-theme');
    store.set('theme', 'dark');
    document.querySelectorAll('.theme-icon, #themeIcon, #themeIconMobile, #desktopThemeIcon').forEach(i => i.className = 'ri-moon-line theme-icon');
  }
  if (typeof updateCircadianWidget === 'function') updateCircadianWidget();
  if (typeof renderDashboard === 'function') renderDashboard();
};
function loadTheme() {
  if (store.get('theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.querySelectorAll('.theme-icon, #themeIcon, #themeIconMobile, #desktopThemeIcon').forEach(i => i.className = 'ri-sun-line theme-icon');
  } else {
    document.querySelectorAll('.theme-icon, #themeIcon, #themeIconMobile, #desktopThemeIcon').forEach(i => i.className = 'ri-moon-line theme-icon');
  }
  if (typeof updateCircadianWidget === 'function') updateCircadianWidget();
}

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
    language: p.language || getLanguage() || 'fr',
    height: p.height || '',
    currentWeight: p.currentWeight || '',
    targetWeight: p.targetWeight || '',
    age: p.age || '',
    activityLevel: p.activityLevel || 'moderate',
    targetOrgans: organs,
    country: p.country || 'France 🇫🇷',
    city: p.city || 'Paris',
    bioregion: p.bioregion || 'temperate',
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
  if (document.getElementById('profileLanguage')) document.getElementById('profileLanguage').value = p.language || getLanguage();
  if (document.getElementById('profileHeight')) document.getElementById('profileHeight').value = p.height || '';
  if (document.getElementById('profileCurrentWeight')) document.getElementById('profileCurrentWeight').value = p.currentWeight || '';
  if (document.getElementById('profileTargetWeight')) document.getElementById('profileTargetWeight').value = p.targetWeight || '';
  if (document.getElementById('profileAge')) document.getElementById('profileAge').value = p.age || '';
  if (document.getElementById('profileActivity')) document.getElementById('profileActivity').value = p.activityLevel || 'moderate';
  if (document.getElementById('profileCountry')) document.getElementById('profileCountry').value = p.country || 'Québec ⚜️';
  if (document.getElementById('profileCity')) document.getElementById('profileCity').value = p.city || 'Montréal';
  if (document.getElementById('profileBioregion')) document.getElementById('profileBioregion').value = p.bioregion || 'boreal';
  if (document.getElementById('profileRestrictions')) document.getElementById('profileRestrictions').value = p.restrictions || '';
  if (document.getElementById('profileMemories')) {
    document.getElementById('profileMemories').value = Array.isArray(p.memories) ? p.memories.join('\n') : (p.memories || '');
  }
  if (document.getElementById('customGeminiKeyInput')) {
    document.getElementById('customGeminiKeyInput').value = localStorage.getItem('vital_custom_gemini_key') || '';
  }

  // Restore emonctoires chips
  const activeOrgans = p.targetOrgans || ['reins', 'lymphe'];
  document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip').forEach(chip => {
    const organ = chip.dataset.organ;
    chip.classList.toggle('active', activeOrgans.includes(organ));
  });

  // Refresh all custom vital-select UI triggers
  ['profileGoal', 'profileTransitionLevel', 'profileLanguage', 'profileVoice', 'profileActivity', 'profileBioregion'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el._updateVitalSelect) el._updateVitalSelect();
  });

  updateTtsVoiceUI();
  if (document.getElementById('greetName')) {
    const curL = getLanguage();
    const greetWord = window.vitalTrackI18n?.getCircadianGreeting ? window.vitalTrackI18n.getCircadianGreeting(curL) : (t('dashboard.greeting') || 'Bonjour');
    document.getElementById('greetName').textContent = p.name ? `${greetWord} ${p.name} ! 👋` : `${greetWord} ! 👋`;
  }
  updateLiveAiPreview();
}

function toggleEmonctoireChip(el) {
  if (!el) return;
  el.classList.toggle('active');
  updateLiveAiPreview();
};

function toggleAiPreviewBox() {
  const box = document.getElementById('aiPreviewBox');
  const chevron = document.getElementById('aiPreviewChevron');
  if (!box) return;
  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'block' : 'none';
  if (chevron) chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
};

function updateLiveAiPreview() {
  const preview = document.getElementById('aiPreviewBox');
  if (!preview) return;

  const name = document.getElementById('profileName')?.value?.trim() || 'Inconnu';
  const goalEl = document.getElementById('profileGoal');
  const goal = goalEl ? goalEl.options?.[goalEl.selectedIndex]?.text : 'Détox & Vitalité';
  const transEl = document.getElementById('profileTransitionLevel');
  const transLevel = transEl ? transEl.options?.[transEl.selectedIndex]?.text : 'Intermédiaire';
  const city = document.getElementById('profileCity')?.value?.trim() || 'Montréal';
  const country = document.getElementById('profileCountry')?.value?.trim() || 'Québec ⚜️';
  const bioregionEl = document.getElementById('profileBioregion');
  const bioregion = bioregionEl ? bioregionEl.options?.[bioregionEl.selectedIndex]?.text : 'Boréale';

  const activeChips = Array.from(document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip.active') || []);
  const organs = activeChips.map(c => c.textContent?.trim() || '').filter(Boolean).join(', ') || 'Système global (Reins & Lymphe)';

  const height = document.getElementById('profileHeight')?.value?.trim();
  const curW = document.getElementById('profileCurrentWeight')?.value?.trim();
  const tarW = document.getElementById('profileTargetWeight')?.value?.trim();
  const age = document.getElementById('profileAge')?.value?.trim();
  const actEl = document.getElementById('profileActivity');
  const activity = actEl ? actEl.options?.[actEl.selectedIndex]?.text : 'Modéré';

  let morpho = [];
  if (height) morpho.push(`Taille: ${height}cm`);
  if (curW) morpho.push(`Poids: ${curW}kg`);
  if (tarW) morpho.push(`Cible: ${tarW}kg`);
  if (age) morpho.push(`Âge: ${age}ans`);

  const restrictions = document.getElementById('profileRestrictions')?.value?.trim() || 'Aucune restriction déclarée';
  const rawMems = document.getElementById('profileMemories')?.value?.trim() || '';

  const generatedPrompt = `[CONTEXTE UTILISATEUR & DIRECTIVES IA]
Identité: ${name} | Localisation: ${city}, ${country} (Biorégion: ${bioregion})
Objectif: ${goal} | Protocole: ${(currentProtocol || 'vitalist').toUpperCase()}
Niveau de Transition: ${transLevel}
Émonctoires Prioritaires: ${organs}${morpho.length > 0 ? `\nMorphologie & Métabolisme: ${morpho.join(' | ')}` : ''}
Restrictions Strictes: ${restrictions}${rawMems ? `\nHabitudes Mémorisées:\n- ${rawMems.split('\n').join('\n- ')}` : ''}
[DIRECTIVE COACHING] : Adapter systématiquement l'agressivité des détox, le protocole de jeûne et les plantes médicinales Raintree aux émonctoires prioritaires et au niveau de transition.`;

  preview.textContent = generatedPrompt;
};

function saveProfile() {
  const rawMems = document.getElementById('profileMemories') ? document.getElementById('profileMemories').value : '';
  const mems = rawMems.split('\n').map(s => s.trim()).filter(Boolean);

  const activeChips = Array.from(document.querySelectorAll('#emonctoireChipsContainer .emonctoire-chip.active'));
  const targetOrgans = activeChips.map(c => c.dataset.organ);
  const chosenLang = document.getElementById('profileLanguage') ? document.getElementById('profileLanguage').value : getLanguage();

  const p = {
    name: document.getElementById('profileName') ? document.getElementById('profileName').value.trim() : '',
    goal: document.getElementById('profileGoal') ? document.getElementById('profileGoal').value : 'detox',
    transitionLevel: document.getElementById('profileTransitionLevel') ? document.getElementById('profileTransitionLevel').value : 'intermediate',
    language: chosenLang,
    height: document.getElementById('profileHeight') ? document.getElementById('profileHeight').value.trim() : '',
    currentWeight: document.getElementById('profileCurrentWeight') ? document.getElementById('profileCurrentWeight').value.trim() : '',
    targetWeight: document.getElementById('profileTargetWeight') ? document.getElementById('profileTargetWeight').value.trim() : '',
    age: document.getElementById('profileAge') ? document.getElementById('profileAge').value.trim() : '',
    activityLevel: document.getElementById('profileActivity') ? document.getElementById('profileActivity').value : 'moderate',
    targetOrgans: targetOrgans.length > 0 ? targetOrgans : ['reins', 'lymphe'],
    country: document.getElementById('profileCountry') ? document.getElementById('profileCountry').value.trim() : 'France 🇫🇷',
    city: document.getElementById('profileCity') ? document.getElementById('profileCity').value.trim() : 'Paris',
    bioregion: document.getElementById('profileBioregion') ? document.getElementById('profileBioregion').value : 'temperate',
    restrictions: document.getElementById('profileRestrictions') ? document.getElementById('profileRestrictions').value.trim() : '',
    memories: mems
  };
  store.set('profile', p);

  if (chosenLang !== getLanguage()) {
    setLanguage(chosenLang);
  }

  if (document.getElementById('greetName')) {
    const curL = getLanguage();
    const greetWord = window.vitalTrackI18n?.getCircadianGreeting ? window.vitalTrackI18n.getCircadianGreeting(curL) : (t('dashboard.greeting') || 'Bonjour');
    document.getElementById('greetName').textContent = p.name ? `${greetWord} ${p.name} ! 👋` : `${greetWord} ! 👋`;
  }
  updateLiveAiPreview();
  if (window.renderWeightChart) window.renderWeightChart();
  showToast(t('settings.saveSuccess', {}, '✅ Bio-Profil & Directives IA sauvegardés !'), 'success');
};

function switchSettingsTab(tabId, btn) {
  document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const sections = document.querySelectorAll('.settings-tab-section');
  sections.forEach(sec => {
    if (tabId === 'all' || sec.dataset.tab === tabId) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
}
window.switchSettingsTab = switchSettingsTab;

// ═══════ PROTOCOL ═══════
function loadProtocol() {
  currentProtocol = store.get('protocol', 'vitalist');
  updateProtocolUI();
}
function setProtocol(mode) {
  currentProtocol = mode;
  store.set('protocol', mode);
  updateProtocolUI();
  updateLiveAiPreview();
  if (window.showToast) {
    const names = { vitalist: '🌿 Vitaliste Intégral', sebi: '🌱 Dr. Sebi', ehret: '🌾 Arnold Ehret', morse: '🍇 Dr. Morse' };
    window.showToast(`Protocole activé : ${names[mode] || mode}`, 'success');
  }
};
function updateProtocolUI() {
  const labels = { vitalist: 'Mode Vitaliste', sebi: 'Mode Dr. Sebi', ehret: 'Mode Ehret', morse: 'Mode Dr. Morse' };
  if (document.getElementById('greetMode')) document.getElementById('greetMode').textContent = labels[currentProtocol] || 'Mode Vitaliste';
  document.querySelectorAll('.protocol-card, .protocol-card-v2').forEach(c => c.classList.toggle('active', c.dataset.mode === currentProtocol));
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

  // Greeting (synchronisé dynamiquement avec la langue sélectionnée)
  const greetEl = document.getElementById('greetName');
  if (greetEl) {
    const p = getUserProfile();
    const currentLang = window.vitalTrackI18n?.getLanguage?.() || 'fr';
    const greetWord = window.vitalTrackI18n?.getCircadianGreeting ? window.vitalTrackI18n.getCircadianGreeting(currentLang) : (window.vitalTrackI18n?.t('dashboard.greeting') || 'Bonjour');
    greetEl.textContent = p.name ? `${greetWord} ${p.name} ! 👋` : `${greetWord} ! 👋`;
  }

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

  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  const levelBadge = document.getElementById('vitalityLevelBadge');
  const commentEl = document.getElementById('vitalityScoreComment');
  if (commentEl && levelBadge) {
    if (todayMeals.length === 0 && !breakdown.hasFasting && !breakdown.hasBreathing) {
      levelBadge.style.background = isLight ? '#f1f5f9' : 'var(--surface-hover)';
      levelBadge.style.borderColor = isLight ? '#cbd5e1' : 'var(--border)';
      levelBadge.style.color = isLight ? '#475569' : 'var(--text-dim)';
      commentEl.textContent = "En attente d'enregistrements aujourd'hui";
    } else if (score >= 70) {
      levelBadge.style.background = isLight ? '#dcfce7' : 'rgba(16,185,129,0.14)';
      levelBadge.style.borderColor = isLight ? '#86efac' : 'rgba(16,185,129,0.3)';
      levelBadge.style.color = isLight ? '#047857' : '#10b981';
      commentEl.textContent = `Vitalité rayonnante · Électrolytes optimaux (${score}/100)`;
    } else if (score >= 40) {
      levelBadge.style.background = isLight ? '#fef3c7' : 'rgba(245,158,11,0.14)';
      levelBadge.style.borderColor = isLight ? '#fde68a' : 'rgba(245,158,11,0.3)';
      levelBadge.style.color = isLight ? '#92400e' : '#f59e0b';
      commentEl.textContent = `Vitalité modérée · Marge d'optimisation (${score}/100)`;
    } else {
      levelBadge.style.background = isLight ? '#fee2e2' : 'rgba(239,68,68,0.14)';
      levelBadge.style.borderColor = isLight ? '#fca5a5' : 'rgba(239,68,68,0.3)';
      levelBadge.style.color = isLight ? '#991b1b' : '#ef4444';
      commentEl.textContent = `Terrain acidifié · Priorité élimination & repos (${score}/100)`;
    }
  }

  // 3 Vital Pillars Mini-Cards
  const vFillN = document.getElementById('vFillNutrition');
  const vPctN = document.getElementById('vPctNutrition');
  if (vFillN && vPctN) {
    if (breakdown.hasMeals) {
      vFillN.style.width = `${breakdown.nutritionScore}%`;
      vFillN.style.background = breakdown.nutritionScore >= 70 ? 'linear-gradient(90deg, #059669, #34d399)' : breakdown.nutritionScore >= 40 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)';
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
      vFillF.style.background = breakdown.fastingScore >= 70 ? 'linear-gradient(90deg, #0284c7, #38bdf8)' : 'linear-gradient(90deg, #0369a1, #0ea5e9)';
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
      vFillB.style.background = 'linear-gradient(90deg, #7c3aed, #a855f7)';
      vPctB.textContent = `${breakdown.breathingScore}%`;
    } else {
      vFillB.style.width = '0%';
      vPctB.textContent = '--';
    }
  }

  // Dynamic Actionable Vitalist Focus Card
  const focusCard = document.getElementById('vitalityFocusCard');
  const focusIconBadge = document.getElementById('vitalityFocusIconBadge');
  const focusIcon = document.getElementById('vitalityFocusIcon');
  const focusTitle = document.getElementById('vitalityFocusTitle');
  const focusTag = document.getElementById('vitalityFocusTag');
  const focusInsight = document.getElementById('vitalityFocusInsight');
  const focusChips = document.getElementById('vitalityFocusChips');

  if (focusCard && focusInsight && focusChips) {
    let fIcon = 'ri-sparkling-fill';
    let fColor = isLight ? '#047857' : '#10b981';
    let fBg = isLight ? '#dcfce7' : 'rgba(16,185,129,0.15)';
    let fBorder = isLight ? '#86efac' : '#10b981';
    let fTag = 'Recommandation';
    let fInsight = '';
    let fChipsList = [];

    const nScore = breakdown.hasMeals ? breakdown.nutritionScore : 0;
    const fScore = breakdown.hasFasting ? breakdown.fastingScore : 0;
    const bScore = breakdown.hasBreathing ? breakdown.breathingScore : 0;

    if (!breakdown.hasMeals && !breakdown.hasFasting && !breakdown.hasBreathing) {
      fIcon = 'ri-seedling-fill';
      fColor = isLight ? '#047857' : '#10b981';
      fBg = isLight ? '#dcfce7' : 'rgba(16,185,129,0.15)';
      fBorder = isLight ? '#86efac' : '#10b981';
      fTag = 'Réveil Cellulaire';
      fInsight = 'Démarrez par une hydratation tiède citronnée et un premier repas vivant riche en micronutriments.';
      fChipsList = [
        { icon: '🍋', label: 'Eau Citronnée' },
        { icon: '🍉', label: 'Fruits Aqueux' },
        { icon: '🫁', label: 'Cohérence Cardiaque' }
      ];
    } else if (breakdown.hasFasting && fScore < 40) {
      fIcon = 'ri-drop-fill';
      fColor = isLight ? '#0369a1' : '#38bdf8';
      fBg = isLight ? '#e0f2fe' : 'rgba(56,189,248,0.15)';
      fBorder = isLight ? '#7dd3fc' : '#38bdf8';
      fTag = 'Émonctoires & Repos';
      fInsight = 'Prolongez la fenêtre de repos digestif pour relancer l\'autophagie et soulager la filtration rénale.';
      fChipsList = [
        { icon: '🛑', label: 'Repos Digestif' },
        { icon: '🫖', label: 'Tisane Dépurative' },
        { icon: '🫘', label: 'Filtration Rénale' }
      ];
    } else if (breakdown.hasMeals && nScore < 60) {
      fIcon = 'ri-leaf-fill';
      fColor = isLight ? '#92400e' : '#f59e0b';
      fBg = isLight ? '#fef3c7' : 'rgba(245,158,11,0.15)';
      fBorder = isLight ? '#fde68a' : '#f59e0b';
      fTag = 'Équilibre PRAL';
      fInsight = 'Charge acide détectée : Augmentez la part de fruits aqueux, pastèque, raisin ou jus verts frais.';
      fChipsList = [
        { icon: '🥗', label: 'Salade Vivante' },
        { icon: '🥤', label: 'Jus Verts Frais' },
        { icon: '🥑', label: 'Bonnes Graisses' }
      ];
    } else if (!breakdown.hasBreathing || bScore < 40) {
      fIcon = 'ri-windy-fill';
      fColor = isLight ? '#6b21a8' : '#a855f7';
      fBg = isLight ? '#f3e8ff' : 'rgba(168,85,247,0.15)';
      fBorder = isLight ? '#d8b4fe' : '#a855f7';
      fTag = 'Oxygénation';
      fInsight = 'Activez 5 minutes de cohérence cardiaque pour stimuler le flux lymphatique et apaiser le système nerveux.';
      fChipsList = [
        { icon: '🫁', label: '5 min Respiration' },
        { icon: '🚶', label: 'Marche Lente' },
        { icon: '🌿', label: 'Détente Nerveuse' }
      ];
    } else {
      fIcon = 'ri-sparkling-fill';
      fColor = isLight ? '#047857' : '#10b981';
      fBg = isLight ? '#dcfce7' : 'rgba(16,185,129,0.15)';
      fBorder = isLight ? '#86efac' : '#10b981';
      fTag = 'Excellence';
      fInsight = 'Électrolytes et vitalité au sommet ! Vos cellules disposent d\'un potentiel électromagnétique maximal.';
      fChipsList = [
        { icon: '✨', label: 'Rayonnement' },
        { icon: '⚡', label: 'Énergie Cellulaire' },
        { icon: '🧬', label: 'Régénération' }
      ];
    }

    if (focusIconBadge) {
      focusIconBadge.style.background = fBg;
      focusIconBadge.style.borderColor = fBorder;
      focusIconBadge.style.color = fColor;
    }
    if (focusIcon) {
      focusIcon.className = fIcon;
    }
    if (focusTitle) {
      focusTitle.style.color = fColor;
    }
    if (focusTag) {
      focusTag.textContent = fTag;
    }
    focusInsight.textContent = fInsight;
    focusChips.innerHTML = fChipsList.map(c => `
      <span class="phase-chip">
        <span>${c.icon}</span>
        <span>${c.label}</span>
      </span>
    `).join('');
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
  if (typeof updateCircadianWidget === 'function') updateCircadianWidget();
  if (typeof initCircadianClockInteractivity === 'function') initCircadianClockInteractivity();
  if (typeof renderWeightChart === 'function') renderWeightChart();
}

function calculateVitalityBreakdown(mealsInput) {
  const meals = (mealsInput && Array.isArray(mealsInput)) ? mealsInput : store.get('meals', []);
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

function openVitalityInfoModal() {
  document.getElementById('vitalityInfoModal')?.classList.add('open');
};

function closeVitalityInfoModal(e) {
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
window.loadChatHistory = loadChatHistory;

function saveConversations() {
  store.set('conversations', conversations);
  store.set('activeConvId', activeConvId);
  renderSidebar();
}

function newConversation() {
  activeConvId = null;
  saveConversations();
  renderActiveConversation();
  if (window.innerWidth <= 900) window.toggleSidebar(false);
};

function switchConversation(id) {
  activeConvId = id;
  saveConversations();
  renderActiveConversation();
  if (window.innerWidth <= 900) window.toggleSidebar(false);
};

let _pendingDeleteConvId = null;

function confirmDeleteConversation(id, e, rawTitle) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  _pendingDeleteConvId = id;
  const target = conversations.find(c => c.id === id);
  const displayTitle = rawTitle || (target ? target.title : 'cette conversation');

  const titlePreview = document.getElementById('deleteConvTitlePreview');
  if (titlePreview) {
    titlePreview.textContent = `« ${displayTitle} »`;
  }

  const modal = document.getElementById('deleteConvModal');
  if (modal) {
    modal.style.display = 'flex';
  }
};

function closeDeleteConvModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-overlay')) {
    return;
  }
  _pendingDeleteConvId = null;
  const modal = document.getElementById('deleteConvModal');
  if (modal) {
    modal.style.display = 'none';
  }
};

function executeDeleteConversation() {
  if (!_pendingDeleteConvId) return;
  const idToDelete = _pendingDeleteConvId;
  _pendingDeleteConvId = null;

  conversations = conversations.filter(c => c.id !== idToDelete);
  if (activeConvId === idToDelete) {
    activeConvId = conversations.length ? conversations[0].id : null;
  }
  saveConversations();
  renderSidebar();
  renderActiveConversation();

  const modal = document.getElementById('deleteConvModal');
  if (modal) {
    modal.style.display = 'none';
  }

  if (window.showToast) {
    window.showToast('🗑️ Conversation supprimée avec succès.', 'info', 3000);
  }
};

function deleteConversation(id, e) {
  window.confirmDeleteConversation(id, e);
};

function filterConversations(query) {
  renderSidebar(query);
};

function toggleSidebar(forceOpen) {
  const sidebar = document.getElementById('chatSidebar');
  const backdrop = document.getElementById('chatSidebarBackdrop');
  if (!sidebar) return;

  const isMobile = window.innerWidth <= 900;

  if (typeof forceOpen === 'boolean') {
    if (forceOpen) {
      sidebar.classList.remove('hidden');
      if (isMobile && backdrop) backdrop.classList.add('active');
    } else {
      sidebar.classList.add('hidden');
      if (backdrop) backdrop.classList.remove('active');
    }
    return;
  }

  const isHidden = sidebar.classList.contains('hidden');
  if (isHidden) {
    sidebar.classList.remove('hidden');
    if (isMobile && backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.add('hidden');
    if (backdrop) backdrop.classList.remove('active');
  }
};

function renderSidebar(filterQuery = '') {
  const list = document.getElementById('sidebarList');
  if (!list) return;

  const q = filterQuery.toLowerCase().trim();
  const filtered = q ? conversations.filter(c => (c.title || '').toLowerCase().includes(q)) : conversations;

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 16px; text-align:center; color:var(--text-dim);">
        <i class="ri-chat-smile-2-line" style="font-size:2rem; color:rgba(52,211,153,0.4); margin-bottom:8px;"></i>
        <span style="font-size:0.86rem; font-weight:600; color:#cbd5e1;">Aucune discussion</span>
        <span style="font-size:0.75rem; margin-top:4px; line-height:1.4;">Démarrez une nouvelle conversation avec le Coach Vitaliste.</span>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.sort((a, b) => (b.updated || 0) - (a.updated || 0)).map(c => {
    const escapedTitle = esc(c.title).replace(/'/g, "\\'");
    const msgCount = Array.isArray(c.messages) ? c.messages.length : 0;
    const dateStr = c.updated ? new Date(c.updated).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    return `
    <div class="conv-item ${c.id === activeConvId ? 'active' : ''}" onclick="switchConversation('${c.id}')">
      <i class="ri-chat-3-line conv-icon" style="color:var(--text-dim); font-size:1.1rem; flex-shrink:0;"></i>
      <div class="conv-item-info">
        <div class="conv-item-title">${esc(c.title || 'Discussion')}</div>
        <div class="conv-item-date">${dateStr} · ${msgCount} msgs</div>
      </div>
      <button class="conv-item-delete" onclick="confirmDeleteConversation('${c.id}', event, '${escapedTitle}')" data-tooltip="Supprimer la discussion" aria-label="Supprimer la discussion">
        <i class="ri-delete-bin-line"></i>
      </button>
    </div>
  `;
  }).join('');
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

  conv.messages.forEach((m, idx) => {
    addMessage(m.text, m.role === 'user', m.model, m.image, idx, m.role === 'error', m.failedQuery, m.contextData || m.contextQuote);
  });
}

// ═══════ VOICE INPUT (ZERO-QUOTA REAL-TIME LIVE STREAMING & WEB SPEECH) ═══════
let _speechRecognition = null;
let _mediaRecorder = null;
let _audioStream = null;
let _audioChunks = [];
let _isListening = false;
let _sessionBaseText = '';
let _voiceRestartTimer = null;
let _voiceSecondsTimer = null;
let _voiceSeconds = 0;
let _userExplicitStop = false;
let _webSpeechCapturedText = false;

function _updateVoiceUI(listening, isFallbackProcessing) {
  const voiceBtn = document.getElementById('chatVoiceBtn');
  const indicator = document.getElementById('chatVoiceIndicator');
  const statusText = document.getElementById('chatVoiceStatus');

  if (voiceBtn) {
    if (listening) {
      voiceBtn.classList.add('recording');
      voiceBtn.innerHTML = '<i class="ri-mic-fill" style="color:#ef4444; animation:pulse 1s infinite;"></i>';
      voiceBtn.title = "Arrêter et valider";
    } else {
      voiceBtn.classList.remove('recording');
      voiceBtn.innerHTML = '<i class="ri-mic-line"></i>';
      voiceBtn.title = "Saisie vocale en direct";
    }
  }

  if (indicator) {
    indicator.style.display = (listening || isFallbackProcessing) ? 'flex' : 'none';
  }

  if (listening) {
    _voiceSeconds = 0;
    if (_voiceSecondsTimer) clearInterval(_voiceSecondsTimer);
    const updateTimerLabel = () => {
      const mins = Math.floor(_voiceSeconds / 60);
      const secs = String(_voiceSeconds % 60).padStart(2, '0');
      if (statusText && _isListening) {
        statusText.textContent = `🎙️ Écoute en direct (${mins}:${secs}) · Parlez à votre rythme`;
      }
    };
    updateTimerLabel();
    _voiceSecondsTimer = setInterval(() => {
      _voiceSeconds++;
      updateTimerLabel();
    }, 1000);
  } else {
    if (_voiceSecondsTimer) {
      clearInterval(_voiceSecondsTimer);
      _voiceSecondsTimer = null;
    }
    if (isFallbackProcessing && statusText) {
      statusText.textContent = '⏳ Transcription en cours...';
    }
  }
}

async function _startMediaRecorder() {
  _audioChunks = [];
  try {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      _audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', ''];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (!m || (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(m))) {
          selectedMime = m;
          break;
        }
      }
      _mediaRecorder = selectedMime ? new MediaRecorder(_audioStream, { mimeType: selectedMime }) : new MediaRecorder(_audioStream);
      _mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          _audioChunks.push(e.data);
        }
      };
      _mediaRecorder.start(250);
    }
  } catch (e) {
    console.warn('[Voice] MediaRecorder capture not available or refused:', e.message);
    _mediaRecorder = null;
    _audioStream = null;
  }
}

function _stopMediaRecorder() {
  return new Promise((resolve) => {
    if (_mediaRecorder && _mediaRecorder.state !== 'inactive') {
      _mediaRecorder.onstop = () => {
        const mime = _mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(_audioChunks, { type: mime });
        _cleanupAudioStream();
        resolve(blob);
      };
      try {
        _mediaRecorder.stop();
      } catch (err) {
        _cleanupAudioStream();
        resolve(null);
      }
    } else {
      _cleanupAudioStream();
      resolve(null);
    }
  });
}

function _cleanupAudioStream() {
  if (_audioStream) {
    try {
      _audioStream.getTracks().forEach(track => track.stop());
    } catch (e) { }
    _audioStream = null;
  }
  _mediaRecorder = null;
}

async function _transcribeWithFallbackApi(audioBlob) {
  if (!audioBlob || audioBlob.size < 1200) {
    _updateVoiceUI(false, false);
    return;
  }
  try {
    _updateVoiceUI(false, true);
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result || '').split(',')[1];
        if (!base64Data) {
          _updateVoiceUI(false, false);
          return;
        }

        const lang = window.vitalTrackI18n?.getLanguage ? window.vitalTrackI18n.getLanguage() : 'fr';
        const resp = await fetch('/api/transcribe', {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            audioData: base64Data,
            mimeType: audioBlob.type || 'audio/webm',
            language: lang
          })
        });

        if (resp.ok) {
          const resJson = await resp.json();
          if (resJson && resJson.text && resJson.text.trim()) {
            const input = document.getElementById('chatInput');
            if (input) {
              const prefix = _sessionBaseText ? _sessionBaseText.trim() + ' ' : '';
              input.value = (prefix + resJson.text.trim()).replace(/\s+/g, ' ').trim();
              input.focus();
            }
          }
        }
      } catch (err) {
        console.warn('[Voice] Fallback transcription error:', err);
      } finally {
        _updateVoiceUI(false, false);
      }
    };
  } catch (err) {
    console.warn('[Voice] FileReader error:', err);
    _updateVoiceUI(false, false);
  }
}

// ═══════ SPEECH MERGER & DEDUPLICATION HELPER ═══════
function _mergeTranscripts(accumulated, currentChunk) {
  if (!accumulated) return (currentChunk || '').trim();
  if (!currentChunk) return (accumulated || '').trim();
  
  const acc = accumulated.trim();
  const curr = currentChunk.trim();
  
  // 1. If curr already contains or starts with acc (Chrome buffer replay)
  if (curr.toLowerCase().startsWith(acc.toLowerCase())) {
    return curr;
  }
  
  // 2. If acc already ends with curr
  if (acc.toLowerCase().endsWith(curr.toLowerCase())) {
    return acc;
  }

  // 3. Find overlap between end of acc and start of curr
  const accWords = acc.split(/\s+/);
  const currWords = curr.split(/\s+/);
  
  let maxOverlap = 0;
  const maxCheck = Math.min(accWords.length, currWords.length, 12);
  
  for (let len = 1; len <= maxCheck; len++) {
    const accEnd = accWords.slice(-len).join(' ').toLowerCase();
    const currStart = currWords.slice(0, len).join(' ').toLowerCase();
    if (accEnd === currStart) {
      maxOverlap = len;
    }
  }
  
  if (maxOverlap > 0) {
    const nonOverlappingCurr = currWords.slice(maxOverlap).join(' ');
    return (acc + ' ' + nonOverlappingCurr).trim();
  }
  
  return (acc + ' ' + curr).trim();
}
window._mergeTranscripts = _mergeTranscripts;

let _accumulatedFinalText = '';

function toggleVoiceInput(forceState, e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
    e.stopPropagation();
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const input = document.getElementById('chatInput');

  const shouldStart = forceState !== undefined ? forceState : !_isListening;

  if (!shouldStart) {
    // 🛑 Arrêt demandé par l'utilisateur
    _userExplicitStop = true;
    _isListening = false;

    if (_voiceRestartTimer) {
      clearTimeout(_voiceRestartTimer);
      _voiceRestartTimer = null;
    }

    if (_speechRecognition) {
      try {
        _speechRecognition.onresult = null;
        _speechRecognition.onend = null;
        _speechRecognition.onerror = null;
        _speechRecognition.stop();
      } catch (err) { }
      _speechRecognition = null;
    }

    _updateVoiceUI(false, false);
    if (input) input.focus();

    // Si WebSpeech était actif, le texte est DÉJÀ écrit en direct dans le champ (0 latence, 0 quota !)
    if (_webSpeechCapturedText || SpeechRecognition) {
      _stopMediaRecorder();
      return;
    }

    // Fallback pour navigateurs sans WebSpeech (ex: Firefox)
    _stopMediaRecorder().then(audioBlob => {
      if (audioBlob) {
        _transcribeWithFallbackApi(audioBlob);
      }
    });
    return;
  }

  // 🎙️ Démarrage d'une nouvelle session vocale en direct
  _userExplicitStop = false;
  _isListening = true;
  _webSpeechCapturedText = false;
  _sessionBaseText = input && input.value ? input.value.trim() : '';
  _accumulatedFinalText = '';

  _updateVoiceUI(true, false);

  if (!SpeechRecognition) {
    // Navigateur sans WebSpeech (ex: Firefox) : enregistrement audio de secours
    _startMediaRecorder();
    return;
  }

  function startRecognitionSession() {
    if (_userExplicitStop) return;

    if (_speechRecognition) {
      try {
        _speechRecognition.onresult = null;
        _speechRecognition.onend = null;
        _speechRecognition.onerror = null;
        _speechRecognition.abort();
      } catch (err) { }
      _speechRecognition = null;
    }

    try {
      _speechRecognition = new SpeechRecognition();
      window._speechRecognition = _speechRecognition;

      const activeLang = window.vitalTrackI18n?.getLanguage ? window.vitalTrackI18n.getLanguage() : 'fr';
      const langMap = {
        'fr': 'fr-FR',
        'fr-CA': 'fr-CA',
        'en': 'en-US',
        'es': 'es-ES'
      };
      _speechRecognition.lang = langMap[activeLang] || 'fr-FR';
      _speechRecognition.continuous = true;
      _speechRecognition.interimResults = true;
      _speechRecognition.maxAlternatives = 1;

      let sessionFinal = '';

      _speechRecognition.onstart = () => {
        if (input) input.focus();
      };

      _speechRecognition.onresult = (event) => {
        let currentFinal = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; ++i) {
          const piece = (event.results[i] && event.results[i][0] && event.results[i][0].transcript) ? event.results[i][0].transcript : '';
          if (event.results[i].isFinal) {
            currentFinal += (currentFinal ? ' ' : '') + piece.trim();
          } else {
            currentInterim += (currentInterim ? ' ' : '') + piece.trim();
          }
        }

        sessionFinal = currentFinal;

        const sessionSpoken = [currentFinal, currentInterim].filter(Boolean).join(' ').trim();
        if (sessionSpoken) {
          _webSpeechCapturedText = true;
        }

        const totalSpoken = _mergeTranscripts(_accumulatedFinalText, sessionSpoken);

        const fullText = _sessionBaseText
          ? (_sessionBaseText + ' ' + totalSpoken).trim()
          : totalSpoken;

        if (input) {
          input.value = fullText;
        }
      };

      _speechRecognition.onerror = (event) => {
        console.warn('[Voice] WebSpeech notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          if (window.showToast) {
            window.showToast("⚠️ Accès micro refusé. Autorisez le microphone pour parler.", "error");
          }
          toggleVoiceInput(false);
          return;
        }
      };

      _speechRecognition.onend = () => {
        if (_isListening && !_userExplicitStop) {
          if (sessionFinal) {
            _accumulatedFinalText = _mergeTranscripts(_accumulatedFinalText, sessionFinal);
          }
          _voiceRestartTimer = setTimeout(() => {
            if (_isListening && !_userExplicitStop) {
              startRecognitionSession();
            }
          }, 100);
        }
      };

      _speechRecognition.start();
    } catch (err) {
      console.warn('[Voice] WebSpeech fallback initialization:', err);
      _startMediaRecorder();
    }
  }

  startRecognitionSession();
}

function cancelVoiceInput(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
    e.stopPropagation();
  }

  _userExplicitStop = true;
  _isListening = false;
  _webSpeechCapturedText = false;

  if (_voiceRestartTimer) {
    clearTimeout(_voiceRestartTimer);
    _voiceRestartTimer = null;
  }

  if (_speechRecognition) {
    try {
      _speechRecognition.onresult = null;
      _speechRecognition.onend = null;
      _speechRecognition.onerror = null;
      _speechRecognition.abort();
    } catch (err) { }
    _speechRecognition = null;
  }

  _stopMediaRecorder();

  const input = document.getElementById('chatInput');
  if (input) {
    input.value = _sessionBaseText;
    input.focus();
  }

  _updateVoiceUI(false, false);
}

// ═══════ IMAGE UPLOAD & PREVIEW ═══════
let pendingChatImage = null; // { mimeType, data, dataUri }

function handleChatImageSelected(e) {
  if (!requireAuthForAi("l'Analyse d'Image par IA")) {
    if (e && e.target) e.target.value = '';
    return;
  }
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
  reader.onload = function (evt) {
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

function removeChatImage() {
  pendingChatImage = null;
  const preview = document.getElementById('chatAttachmentPreview');
  const fileInput = document.getElementById('chatImageInput');
  if (preview) preview.style.display = 'none';
  if (fileInput) fileInput.value = '';
};

// ═══════ CHAT CONTEXT & BACKGROUND ENCODING ═══════
let pendingChatContext = null;

function setChatContext(config) {
  pendingChatContext = config;
  const bar = document.getElementById('chatContextBar');
  const icon = document.getElementById('chatContextIcon');
  const type = document.getElementById('chatContextType');
  const subject = document.getElementById('chatContextSubject');
  const input = document.getElementById('chatInput');

  if (bar && icon && type && subject) {
    icon.textContent = config.icon || '💬';
    type.textContent = config.label || 'Contexte';
    subject.textContent = config.subject || '';
    bar.style.display = 'flex';
  }

  if (input) {
    input.value = '';
    if (config.placeholder) input.placeholder = config.placeholder;
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
window.setChatContext = setChatContext;

function clearChatContext() {
  pendingChatContext = null;
  const bar = document.getElementById('chatContextBar');
  if (bar) bar.style.display = 'none';
  const input = document.getElementById('chatInput');
  if (input) {
    input.placeholder = "Pose une question, explore un sujet santé, un repas, un protocole...";
  }
}
window.clearChatContext = clearChatContext;

function quickChat(query) {
  if (!requireAuthForAi("le Coach Vitaliste IA")) return;
  document.getElementById('chatInput').value = query;
  document.getElementById('chatForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};

// ═══════ GENERATION ABORT & STOP CONTROLLER ═══════
let activeChatAbortController = null;

function stopChatGeneration() {
  if (activeChatAbortController) {
    try {
      activeChatAbortController.abort();
    } catch (e) { }
    activeChatAbortController = null;
  }
  resetChatSendBtn();
  const typingEl = document.getElementById('chat-typing-indicator');
  if (typingEl) typingEl.remove();

  const streamingContainer = document.getElementById('streaming-bubble-container');
  if (streamingContainer) {
    streamingContainer.id = '';
    const bubble = streamingContainer.querySelector('.message-bubble');
    if (bubble) {
      bubble.innerHTML += '<div style="font-size:0.75rem;color:var(--text-dim);font-style:italic;margin-top:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:4px;">⏹️ Réflexion arrêtée par l\'utilisateur</div>';
    }
  }
  if (_chatMascotRenderer) {
    _chatMascotRenderer.setAction('idle', false);
  }
  if (window.showToast) {
    window.showToast("Génération arrêtée.", "info");
  }
}
window.stopChatGeneration = stopChatGeneration;

function resetChatSendBtn() {
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.classList.remove('btn-stop-generating');
    sendBtn.title = "Envoyer";
    sendBtn.innerHTML = '<i class="ri-send-plane-2-fill"></i>';
    sendBtn.onclick = null;
  }
  activeChatAbortController = null;
}
window.resetChatSendBtn = resetChatSendBtn;

async function sendChat(e) {
  if (e) e.preventDefault();
  if (!requireAuthForAi("le Coach Vitaliste IA")) return;

  const input = document.getElementById('chatInput');
  const userRawQuery = input.value.trim();
  const attachedImage = pendingChatImage;
  const activeCtx = pendingChatContext;

  if (!userRawQuery && !attachedImage && !activeCtx) return;

  if (_isListening) {
    window.toggleVoiceInput(false);
  }

  let messageText = userRawQuery;
  let displayUserText = userRawQuery;
  let contextData = null;

  if (activeCtx) {
    messageText = activeCtx.buildPrompt ? activeCtx.buildPrompt(userRawQuery) : `${activeCtx.label} (${activeCtx.subject}) : ${userRawQuery}`;
    contextData = {
      icon: activeCtx.icon || '💬',
      label: activeCtx.label || 'Contexte',
      subject: activeCtx.subject || ''
    };
    displayUserText = userRawQuery || `Adapter "${activeCtx.subject}"`;
    clearChatContext();
  } else if (!userRawQuery && attachedImage) {
    messageText = "Analyse cette photo et donne-moi ton avis vitaliste détaillé.";
    displayUserText = messageText;
  }

  input.value = '';
  window.removeChatImage();

  const welcome = document.getElementById('chatWelcome');
  if (welcome) welcome.style.display = 'none';

  let conv = null;
  if (!activeConvId) {
    // Create new conversation
    conv = {
      id: 'conv_' + Date.now(),
      title: displayUserText.length > 25 ? displayUserText.substring(0, 25) + '...' : displayUserText,
      updated: Date.now(),
      messages: []
    };
    conversations.push(conv);
    activeConvId = conv.id;
  } else {
    conv = conversations.find(c => c.id === activeConvId);
    conv.updated = Date.now();
  }

  conv.messages.push({
    role: 'user',
    text: displayUserText,
    fullPrompt: messageText,
    contextData: contextData,
    image: attachedImage ? attachedImage.dataUri : null,
    timestamp: Date.now()
  });
  saveConversations();
  addMessage(displayUserText, true, null, attachedImage ? attachedImage.dataUri : null, conv.messages.length - 1, false, null, contextData);

  // Configure Stop Button during generation
  activeChatAbortController = new AbortController();
  const sendBtn = document.getElementById('sendBtn');
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.classList.add('btn-stop-generating');
    sendBtn.title = "Arrêter la réflexion";
    sendBtn.innerHTML = '<i class="ri-stop-mini-fill"></i>';
    sendBtn.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      stopChatGeneration();
    };
  }

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
      language: getLanguage(),
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
      headers: getApiHeaders(),
      body: JSON.stringify(reqBody),
      signal: activeChatAbortController.signal
    });

    typingEl.remove();
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }

    let aiText = '';
    let modelUsed = resp.headers.get('X-Model-Used') || 'Gemini 3.7 Flash';
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
            if (dataObj.modelVersion) modelUsed = dataObj.modelVersion;
            else if (dataObj.model) modelUsed = dataObj.model;
            if (dataObj.candidates && dataObj.candidates[0] && dataObj.candidates[0].content) {
              const parts = dataObj.candidates[0].content.parts || [];
              let chunkText = '';
              for (const p of parts) {
                if (p && !p.thought && p.text) {
                  chunkText += p.text;
                }
              }
              if (chunkText) {
                aiText += chunkText;
                const streamingBubble = document.getElementById('streaming-bubble');
                if (streamingBubble) streamingBubble.innerHTML = renderMarkdown(aiText);
                container.scrollTop = container.scrollHeight;
              }
            }
          } catch (e) { }
        }
      }
    }

    // Finalize message UI by replacing the streaming bubble with a normal addMessage call
    const streamingContainer = document.getElementById('streaming-bubble-container');
    if (streamingContainer) streamingContainer.remove();

    // Update badge UI
    const badge = document.getElementById('currentModelBadge');
    if (badge) {
      const displayModel = formatModelName(modelUsed);
      if (modelUsed.includes('gemma')) {
        badge.innerHTML = `<i class="ri-cpu-line" style="color:#22d3ee"></i> ${displayModel}`;
      } else if (modelUsed.includes('pro')) {
        badge.innerHTML = `<i class="ri-server-line" style="color:#fbbf24"></i> ${displayModel}`;
      } else {
        badge.innerHTML = `<i class="ri-flashlight-fill" style="color:#4ade80"></i> ${displayModel}`;
      }
    }

    conv.messages.push({ role: 'model', text: aiText, model: modelUsed, timestamp: Date.now() });
    conv.updated = Date.now();
    saveConversations();
    addMessage(aiText, false, modelUsed, null, conv.messages.length - 1);

  } catch (err) {
    if (typingEl && typingEl.parentNode) typingEl.remove();
    const streamingContainer = document.getElementById('streaming-bubble-container');
    if (streamingContainer) streamingContainer.remove();

    if (err.name === 'AbortError') {
      console.log('Generation aborted by user.');
      return;
    }

    const friendlyError = err.message?.includes('429') 
      ? "Le quota de requêtes est temporairement atteint. Vous pouvez réessayer dans quelques secondes ou utiliser un modèle plus léger."
      : (err.message?.includes('503') 
        ? "Les serveurs IA de Google sont temporairement surchargés. Cliquez sur Réessayer pour relancer la cascade."
        : `Impossible de contacter le coach IA : ${err.message || 'Erreur réseau'}`);

    if (conv) {
      conv.messages.push({
        role: 'error',
        text: friendlyError,
        failedQuery: messageText,
        timestamp: Date.now()
      });
      conv.updated = Date.now();
      saveConversations();
    }

    addMessage(friendlyError, false, null, null, conv ? conv.messages.length - 1 : null, true, messageText);
    if (_chatMascotRenderer) _chatMascotRenderer.setAction('idle', false);
  } finally {
    resetChatSendBtn();
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
    name: 'Cascade Automatique',
    icon: 'ri-instance-line',
    iconColor: '#34d399',
    tagline: 'Failover dynamique anti-surcharge',
    models: [
      { id: 'auto', name: 'Cascade Automatique', badge: 'Recommandé', tagline: 'Bascule fluide du meilleur modèle au modèle de secours en cas de quota' }
    ]
  },
  {
    id: 'flash',
    name: 'Gemini Flash (Rapide & Intelligent)',
    icon: 'ri-flashlight-fill',
    iconColor: '#4ade80',
    tagline: 'Vitesse maximale & réponse instantanée',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Principal ⚡', tagline: 'Génération ultra-réactive avec raisonnement multimodal' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Haute Précision', tagline: 'Modèle stable et véloce pour le coaching quotidien' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Éprouvé', tagline: 'Haute fiabilité et débit constant' }
    ]
  },
  {
    id: 'lite',
    name: 'Gemini Flash Lite (Haute Disponibilité)',
    icon: 'ri-bolt-line',
    iconColor: '#a78bfa',
    tagline: 'Léger, grand débit & zéro temps d\'attente',
    models: [
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', badge: 'Véloce 🚀', tagline: 'Exécution ultrarapide idéale pour les connexions mobiles' },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', badge: 'Économe', tagline: 'Modèle ultraléger haute tolérance aux quotas' }
    ]
  },
  {
    id: 'premium',
    name: 'Gemini Pro (Raisonnement Avancé)',
    icon: 'ri-brain-line',
    iconColor: '#fbbf24',
    tagline: 'Analyse approfondie & protocoles complexes',
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Raisonnement', tagline: 'Synthèse approfondie des terrains biologiques et monographies Raintree' }
    ]
  }
];

function renderModelPicker() {
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

function selectModel(modelId, modelName, iconClass, iconColor) {
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

function toggleModelList(e) {
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


function addMessage(text, isUser, modelUsed = null, imageUri = null, msgIndex = null, isError = false, failedQuery = null, contextQuote = null) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const conv = conversations.find(c => c.id === activeConvId);
  const actualIndex = msgIndex !== null ? msgIndex : (conv ? conv.messages.length - 1 : 0);

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${isUser ? 'user' : 'bot'}`;
  wrapper.dataset.index = actualIndex;

  const div = document.createElement('div');
  div.className = `message ${isUser ? 'user' : 'bot'}`;

  const avatarHtml = !isUser ? `<div class="message-avatar">${window.renderPigeonPortrait ? window.renderPigeonPortrait(24, 'talking') : '🐦'}</div>` : '';
  const imgHtml = imageUri ? `<img src="${imageUri}" class="message-image" alt="Photo jointe">` : '';

  if (isError) {
    div.innerHTML = `${avatarHtml}<div class="message-bubble message-error-card">
      <div class="message-error-header">
        <i class="ri-error-warning-fill"></i>
        <span>Génération interrompue</span>
      </div>
      <div class="message-error-body">${esc(text || 'Une interruption temporaire est survenue.')}</div>
      <div class="message-error-actions">
        <button type="button" class="btn-error-retry" onclick="retryChatMessage(${actualIndex})">
          <i class="ri-refresh-line"></i> Réessayer
        </button>
        <button type="button" class="btn-error-secondary" onclick="copyChatMessageByIndex(${actualIndex}, this)">
          <i class="ri-file-copy-line"></i> Copier la question
        </button>
        <button type="button" class="btn-error-secondary" onclick="switchModelAndRetry('lite', ${actualIndex})">
          <i class="ri-flashlight-line"></i> Essayer avec Flash-Lite
        </button>
      </div>
    </div>`;
    wrapper.appendChild(div);
  } else {
    let badgeHtml = '';
    if (!isUser) {
      const displayModel = formatModelName(modelUsed);
      badgeHtml = `<div style="margin-top:8px;font-size:0.72rem;color:var(--text-dim);opacity:0.85;display:inline-flex;align-items:center;gap:5px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px"><i class="ri-sparkling-fill" style="color:var(--accent);font-size:0.75rem;"></i><span>${esc(displayModel)}</span></div>`;
    }

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

    let quoteHtml = '';
    if (isUser && contextQuote) {
      let icon = '💬';
      let label = 'Contexte';
      let subject = '';
      if (typeof contextQuote === 'object' && contextQuote !== null) {
        icon = contextQuote.icon || '💬';
        label = contextQuote.label || 'Contexte';
        subject = contextQuote.subject || '';
      } else if (typeof contextQuote === 'string') {
        const parts = contextQuote.split(':');
        if (parts.length > 1) {
          label = parts[0].trim();
          subject = parts.slice(1).join(':').trim();
        } else {
          subject = contextQuote;
        }
      }
      quoteHtml = `
        <div class="msg-quoted-reply">
          <div class="msg-quoted-header">
            <span>${icon}</span>
            <span>${esc(label)}</span>
          </div>
          <div class="msg-quoted-subject">${esc(subject)}</div>
        </div>
      `;
    }

    const contentHtml = isUser 
      ? `<div class="msg-user-content">${esc(text)}</div>` 
      : renderMarkdown(text);

    div.innerHTML = `${avatarHtml}<div class="message-bubble">${imgHtml}${quoteHtml}${contentHtml}${quickReplies}${badgeHtml}</div>`;
    wrapper.appendChild(div);

    // Modern Message Action Toolbar (Safe Index-Based Calling)
    const toolbar = document.createElement('div');
    toolbar.className = 'message-toolbar';

    if (isUser) {
      toolbar.innerHTML = `
        <button type="button" class="msg-action-btn" onclick="copyChatMessageByIndex(${actualIndex}, this)" title="Copier la question">
          <i class="ri-file-copy-line"></i> Copier
        </button>
        <button type="button" class="msg-action-btn" onclick="editChatMessage(${actualIndex})" title="Modifier et renvoyer la question">
          <i class="ri-edit-line"></i> Modifier
        </button>
      `;
    } else {
      toolbar.innerHTML = `
        <button type="button" class="msg-action-btn" onclick="copyChatMessageByIndex(${actualIndex}, this)" title="Copier la réponse">
          <i class="ri-file-copy-line"></i> Copier
        </button>
        <button type="button" class="msg-action-btn" onclick="retryChatMessage(${actualIndex})" title="Régénérer cette réponse">
          <i class="ri-refresh-line"></i> Régénérer
        </button>
        <button type="button" class="msg-action-btn" onclick="speakChatMessageByIndex(${actualIndex}, this)" title="Écouter la réponse">
          <i class="ri-volume-up-line"></i> Écouter
        </button>
      `;
    }
    wrapper.appendChild(toolbar);
  }

  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}
window.addMessage = addMessage;

// ═══════ SAFE CLIPBOARD COPY & SPEECHSYNTHESIS ═══════
function copyChatMessageByIndex(idx, btn) {
  const conv = conversations.find(c => c.id === activeConvId);
  let textToCopy = '';
  if (conv && conv.messages && conv.messages[idx]) {
    textToCopy = conv.messages[idx].text || '';
  } else if (btn) {
    const bubble = btn.closest('.message-wrapper')?.querySelector('.message-bubble');
    if (bubble) textToCopy = bubble.innerText.trim();
  }

  if (!textToCopy) return;

  const onSuccess = () => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="ri-check-line" style="color:var(--accent,#34d399)"></i> Copié !';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('copied');
      }, 2000);
    }
    if (window.showToast) {
      window.showToast("✓ Texte copié dans le presse-papier", "success");
    }
  };

  const fallbackCopy = (t) => {
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      document.body.removeChild(ta);
      return false;
    }
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
      if (fallbackCopy(textToCopy)) onSuccess();
      else showToast("Impossible de copier", "error");
    });
  } else {
    if (fallbackCopy(textToCopy)) onSuccess();
    else showToast("Presse-papier non disponible", "error");
  }
}
window.copyChatMessageByIndex = copyChatMessageByIndex;

// Backward-compatible string-based copy
function copyChatMessage(text, btn) {
  if (typeof text === 'number') {
    return copyChatMessageByIndex(text, btn);
  }
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="ri-check-line" style="color:var(--accent)"></i> Copié !';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('copied');
      }, 2000);
    }
    if (window.showToast) window.showToast("✓ Texte copié dans le presse-papier", "success");
  }).catch(() => {
    showToast("Impossible de copier", "error");
  });
}
window.copyChatMessage = copyChatMessage;

const ALL_NEURAL_VOICES = [
  {
    id: 'fr-CA-SylvieNeural',
    name: 'Sylvie (Québec)',
    region: '⚜️ Québec / Canada',
    gender: 'female',
    flag: '⚜️',
    badge: 'Recommandée',
    desc: 'Voix féminine québécoise chaleureuse, posée et ultra-naturelle.',
    sample: 'Bon matin ! Je suis Sylvie, votre coach vitaliste VitalTrack pour vous accompagner chaque jour.'
  },
  {
    id: 'fr-CA-AntoineNeural',
    name: 'Antoine (Québec)',
    region: '⚜️ Québec / Canada',
    gender: 'male',
    flag: '⚜️',
    badge: 'Dynamique',
    desc: 'Voix masculine québécoise énergique, articulée et motivante.',
    sample: 'Bon matin ! Je suis Antoine. Prêt à dynamiser votre énergie vitale et votre régénération ?'
  },
  {
    id: 'fr-CA-JeanNeural',
    name: 'Jean (Québec)',
    region: '⚜️ Québec / Canada',
    gender: 'male',
    flag: '⚜️',
    badge: 'Posée',
    desc: 'Voix masculine québécoise sage, bienveillante et rassurante.',
    sample: 'Bon matin, ici Jean. Prenons le temps d’écouter votre corps et de soutenir vos émonctoires.'
  },
  {
    id: 'fr-CA-ThierryNeural',
    name: 'Thierry (Québec)',
    region: '⚜️ Québec / Canada',
    gender: 'male',
    flag: '⚜️',
    badge: 'Moderne',
    desc: 'Voix masculine québécoise jeune, claire et percutante.',
    sample: 'Bon matin ! C’est Thierry. Regardons ensemble les meilleurs aliments vivants pour votre journée.'
  },
  {
    id: 'fr-FR-DeniseNeural',
    name: 'Denise (France)',
    region: '🇫🇷 France',
    gender: 'female',
    flag: '🇫🇷',
    badge: 'Studio',
    desc: 'Voix féminine classique douce, posée avec une diction claire.',
    sample: 'Bonjour, je suis Denise. Ensemble, explorons le système sans mucus d’Arnold Ehret.'
  },
  {
    id: 'fr-FR-HenriNeural',
    name: 'Henri (France)',
    region: '🇫🇷 France',
    gender: 'male',
    flag: '🇫🇷',
    badge: 'Mentor',
    desc: 'Voix masculine posée et rassurante, style mentor santé.',
    sample: 'Bonjour, je suis Henri. Chaque repas vivant est une opportunité de purification cellulaire.'
  },
  {
    id: 'fr-FR-VivienneMultilingualNeural',
    name: 'Vivienne HD (France)',
    region: '🇫🇷 France',
    gender: 'female',
    flag: '🇫🇷',
    badge: 'HD Expressive',
    desc: 'Voix féminine nouvelle génération HD, ultra-expressive et vivante.',
    sample: 'Bonjour ! Je suis Vivienne. Découvrons ensemble les plantes électriques du Dr. Sebi.'
  },
  {
    id: 'fr-FR-RemyMultilingualNeural',
    name: 'Remy HD (France)',
    region: '🇫🇷 France',
    gender: 'male',
    flag: '🇫🇷',
    badge: 'HD Moderne',
    desc: 'Voix masculine nouvelle génération HD, vivante et captivante.',
    sample: 'Bonjour, je suis Remy. Prêt à libérer votre vitalité avec un protocole adapté ?'
  },
  {
    id: 'fr-FR-EloiseNeural',
    name: 'Eloïse (France)',
    region: '🇫🇷 France',
    gender: 'female',
    flag: '🇫🇷',
    badge: 'Pétillante',
    desc: 'Voix féminine jeune, lumineuse et encourageante.',
    sample: 'Coucou ! Je suis Eloïse. Bravo pour votre engagement sur le chemin de la santé vivante !'
  },
  {
    id: 'fr-BE-CharlineNeural',
    name: 'Charline (Belgique)',
    region: '🇧🇪 Belgique',
    gender: 'female',
    flag: '🇧🇪',
    badge: 'Douce',
    desc: 'Voix féminine belge naturelle, douce et claire.',
    sample: 'Bonjour, je suis Charline. Parlons détoxification et régénération naturelle.'
  },
  {
    id: 'fr-CH-ArianeNeural',
    name: 'Ariane (Suisse)',
    region: '🇨🇭 Suisse',
    gender: 'female',
    flag: '🇨🇭',
    badge: 'Précise',
    desc: 'Voix féminine suisse précise, calme et bienveillante.',
    sample: 'Bonjour, je suis Ariane. Voici vos recommandations vitalistes personnalisées.'
  },
  {
    id: 'en-US-AvaMultilingualNeural',
    name: 'Ava HD (English US)',
    region: '🇺🇸 English',
    gender: 'female',
    flag: '🇺🇸',
    badge: 'HD US',
    desc: 'Ultra-natural HD female voice in English.',
    sample: 'Hello! I am Ava, your personal VitalTrack health coach.'
  },
  {
    id: 'en-US-AndrewMultilingualNeural',
    name: 'Andrew HD (English US)',
    region: '🇺🇸 English',
    gender: 'male',
    flag: '🇺🇸',
    badge: 'HD US',
    desc: 'Clear, modern HD male voice in English.',
    sample: 'Hello! I am Andrew, ready to guide your wellness and detox journey.'
  },
  {
    id: 'es-ES-ElviraNeural',
    name: 'Elvira (Español)',
    region: '🇪🇸 Español',
    gender: 'female',
    flag: '🇪🇸',
    badge: 'Natural',
    desc: 'Voz femenina natural en español.',
    sample: '¡Hola! Soy Elvira, tu entrenadora de salud natural en VitalTrack.'
  }
];

let _currentSpeakingBtn = null;
let _currentAudioInstance = null;
let _currentSampleAudio = null;
let _currentSampleBtn = null;

function getActiveVoiceId() {
  const custom = store.get('preferred_voice_id');
  if (custom) return custom;
  const prof = store.get('user_profile', {});
  const lang = typeof getLanguage === 'function' ? getLanguage() : (prof.language || 'fr-CA');
  const gender = store.get('preferred_voice_gender', 'female');
  
  if (lang === 'fr-CA' || prof.country?.includes('Canada') || prof.bioregion === 'boreal') {
    return gender === 'male' ? 'fr-CA-AntoineNeural' : 'fr-CA-SylvieNeural';
  } else if (lang === 'en') {
    return gender === 'male' ? 'en-US-AndrewMultilingualNeural' : 'en-US-AvaMultilingualNeural';
  } else if (lang === 'es') {
    return 'es-ES-ElviraNeural';
  } else {
    return gender === 'male' ? 'fr-FR-HenriNeural' : 'fr-CA-SylvieNeural';
  }
}
window.getActiveVoiceId = getActiveVoiceId;

function setCustomVoice(voiceId, silent = false) {
  const voiceObj = ALL_NEURAL_VOICES.find(v => v.id === voiceId) || ALL_NEURAL_VOICES[0];
  store.set('preferred_voice_id', voiceObj.id);
  store.set('preferred_voice_gender', voiceObj.gender);
  
  updateTtsVoiceUI();
  
  const select = document.getElementById('profileVoice');
  if (select && select.value !== voiceObj.id) select.value = voiceObj.id;
  
  if (!silent && window.showToast) {
    showToast(`🎙️ Voix activée : ${voiceObj.flag} ${voiceObj.name}`, 'success');
  }
}
window.setCustomVoice = setCustomVoice;

function toggleTtsVoiceGender() {
  openVoiceSelectorModal();
}
window.toggleTtsVoiceGender = toggleTtsVoiceGender;

function updateTtsVoiceUI() {
  const activeVoiceId = getActiveVoiceId();
  const voiceObj = ALL_NEURAL_VOICES.find(v => v.id === activeVoiceId) || ALL_NEURAL_VOICES[0];
  
  const icon = document.getElementById('chatVoiceGenderIcon');
  const label = document.getElementById('chatActiveVoiceLabel');
  if (icon) icon.textContent = voiceObj.flag;
  if (label) {
    const firstName = (voiceObj.name || '').split(' ')[0] || voiceObj.name;
    label.innerHTML = `<span class="voice-name-full">${esc(voiceObj.name)}</span><span class="voice-name-short">${esc(firstName)}</span>`;
  }
  
  const select = document.getElementById('profileVoice');
  if (select && select.value !== voiceObj.id) select.value = voiceObj.id;
}
window.updateTtsVoiceUI = updateTtsVoiceUI;

function openVoiceSelectorModal() {
  const modal = document.getElementById('voiceSelectorModal');
  if (!modal) return;
  renderVoiceModalList();
  modal.style.display = 'flex';
}
window.openVoiceSelectorModal = openVoiceSelectorModal;

function closeVoiceSelectorModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn') && !e.target.closest('.modal-close-btn')) return;
  const modal = document.getElementById('voiceSelectorModal');
  if (modal) modal.style.display = 'none';
  stopVoiceSamplePlayback();
}
window.closeVoiceSelectorModal = closeVoiceSelectorModal;

function stopVoiceSamplePlayback() {
  if (_currentSampleAudio) {
    _currentSampleAudio.pause();
    _currentSampleAudio = null;
  }
  if (_currentSampleBtn) {
    _currentSampleBtn.innerHTML = '<i class="ri-play-circle-line"></i> Écouter';
    _currentSampleBtn.classList.remove('playing');
    _currentSampleBtn = null;
  }
}

async function testVoiceSample(voiceId, btn) {
  if (_currentSampleBtn === btn) {
    stopVoiceSamplePlayback();
    return;
  }
  
  stopVoiceSamplePlayback();
  
  const voiceObj = ALL_NEURAL_VOICES.find(v => v.id === voiceId);
  if (!voiceObj) return;
  
  _currentSampleBtn = btn;
  if (btn) {
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Chargement...';
    btn.classList.add('playing');
  }
  
  try {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        text: voiceObj.sample,
        voice: voiceObj.id
      })
    });
    
    if (!resp.ok) throw new Error(`TTS sample HTTP ${resp.status}`);
    
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentSampleAudio = audio;
    
    audio.onplay = () => {
      if (btn) btn.innerHTML = '<i class="ri-stop-circle-line" style="color:#ef4444;"></i> Arrêter';
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      stopVoiceSamplePlayback();
    };
    
    audio.onerror = () => {
      stopVoiceSamplePlayback();
      if (window.showToast) showToast("Erreur lors de la lecture de l'extrait", "error");
    };
    
    await audio.play();
  } catch (err) {
    console.error('Audio sample error:', err);
    stopVoiceSamplePlayback();
    if (window.showToast) showToast("Impossible de charger l'extrait audio", "error");
  }
}
window.testVoiceSample = testVoiceSample;

function previewCurrentVoice() {
  const select = document.getElementById('profileVoice');
  const voiceId = select ? select.value : getActiveVoiceId();
  testVoiceSample(voiceId, event?.currentTarget || null);
}
window.previewCurrentVoice = previewCurrentVoice;

function renderVoiceModalList() {
  const container = document.getElementById('voiceCardsContainer');
  if (!container) return;
  
  const activeId = getActiveVoiceId();
  
  const regions = {};
  ALL_NEURAL_VOICES.forEach(v => {
    if (!regions[v.region]) regions[v.region] = [];
    regions[v.region].push(v);
  });
  
  let html = '';
  for (const [regionName, voices] of Object.entries(regions)) {
    html += `
      <div style="margin-top:6px;">
        <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#34d399; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
          <span>${regionName}</span>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:10px;">
    `;
    
    voices.forEach(v => {
      const isSelected = v.id === activeId;
      html += `
        <div class="voice-card ${isSelected ? 'selected' : ''}" style="display:flex; flex-direction:column; justify-content:space-between; background:${isSelected ? 'var(--accent-glow)' : 'var(--surface-2)'}; border:1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}; border-radius:14px; padding:14px; transition:all 0.2s ease;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem;">${v.flag}</span>
                <span style="font-weight:700; font-size:0.95rem; color:var(--text);">${esc(v.name)}</span>
              </div>
              <span style="font-size:0.7rem; font-weight:700; background:${isSelected ? 'var(--accent)' : 'var(--badge-bg)'}; color:${isSelected ? '#000' : 'var(--text-dim)'}; padding:2px 8px; border-radius:10px;">
                ${v.badge || (v.gender === 'female' ? 'Femme' : 'Homme')}
              </span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-dim); line-height:1.4; margin:0 0 12px 0;">
              ${esc(v.desc)}
            </p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" class="btn-voice-sample" onclick="testVoiceSample('${v.id}', this)" style="flex:1; padding:8px 12px; border-radius:10px; background:var(--surface); border:1px solid var(--border); color:var(--text); font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s ease;">
              <i class="ri-play-circle-line"></i> Écouter
            </button>
            <button type="button" class="btn-voice-select" onclick="setCustomVoice('${v.id}'); renderVoiceModalList();" style="flex:1.2; padding:8px 14px; border-radius:10px; background:${isSelected ? 'var(--accent)' : 'var(--accent-glow)'}; border:1px solid var(--accent); color:${isSelected ? '#000' : 'var(--accent)'}; font-size:0.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s ease;">
              <i class="${isSelected ? 'ri-check-line' : 'ri-check-double-line'}"></i> ${isSelected ? 'Active ✓' : 'Choisir'}
            </button>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}
window.renderVoiceModalList = renderVoiceModalList;

function stopAudioPlayback() {
  if (_currentAudioInstance) {
    _currentAudioInstance.pause();
    _currentAudioInstance = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (_currentSpeakingBtn) {
    _currentSpeakingBtn.innerHTML = '<i class="ri-volume-up-line"></i> Écouter';
    _currentSpeakingBtn.classList.remove('speaking');
    _currentSpeakingBtn = null;
  }
}
window.stopAudioPlayback = stopAudioPlayback;
window.stopSpeechSynthesis = stopAudioPlayback;

async function speakChatMessageByIndex(idx, btn) {
  if (_currentSpeakingBtn === btn) {
    stopAudioPlayback();
    return;
  }

  stopAudioPlayback();

  const conv = conversations.find(c => c.id === activeConvId);
  let textToSpeak = '';
  if (conv && conv.messages && conv.messages[idx]) {
    textToSpeak = conv.messages[idx].text || '';
  } else if (btn) {
    const bubble = btn.closest('.message-wrapper')?.querySelector('.message-bubble');
    if (bubble) textToSpeak = bubble.innerText.trim();
  }

  if (!textToSpeak) return;

  _currentSpeakingBtn = btn;
  if (btn) {
    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Voix Studio...';
    btn.classList.add('speaking');
  }

  const prof = store.get('user_profile', {});
  const language = typeof getLanguage === 'function' ? getLanguage() : (prof.language || 'fr-CA');
  const activeVoiceId = getActiveVoiceId();

  try {
    const resp = await fetch('/api/tts', {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        text: textToSpeak,
        voice: activeVoiceId,
        language: language === 'fr' && (prof.country?.includes('Canada') || prof.bioregion === 'boreal') ? 'fr-CA' : language
      })
    });

    if (!resp.ok) {
      throw new Error(`TTS HTTP ${resp.status}`);
    }

    const audioBlob = await resp.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    _currentAudioInstance = audio;

    audio.onplay = () => {
      if (btn) {
        btn.innerHTML = '<i class="ri-stop-circle-line" style="color:#ef4444;"></i> Arrêter';
      }
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      stopAudioPlayback();
    };

    audio.onerror = (e) => {
      console.warn('Audio playback error:', e);
      URL.revokeObjectURL(audioUrl);
      stopAudioPlayback();
    };

    await audio.play();

  } catch (err) {
    console.warn('Neural TTS failed, falling back to browser SpeechSynthesis:', err);
    if (!('speechSynthesis' in window)) {
      if (window.showToast) showToast("Lecture audio non disponible", "error");
      stopAudioPlayback();
      return;
    }

    let cleanText = textToSpeak
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[*#_~`>]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utter = new SpeechSynthesisUtterance(cleanText.slice(0, 1500));
    utter.lang = language === 'en' ? 'en-US' : 'fr-FR';
    utter.rate = 1.05;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length) {
      const targetPrefix = language === 'en' ? 'en' : 'fr';
      const targetGenderName = gender === 'male' ? ['Henri', 'Thomas', 'Paul', 'Guy'] : ['Denise', 'Amelie', 'Audrey', 'Julie', 'Jenny'];
      const matched = voices.find(v => v.lang.startsWith(targetPrefix) && targetGenderName.some(n => v.name.includes(n)));
      if (matched) utter.voice = matched;
    }

    if (btn) {
      btn.innerHTML = '<i class="ri-stop-circle-line" style="color:#ef4444;"></i> Arrêter';
    }

    utter.onend = () => stopAudioPlayback();
    utter.onerror = () => stopAudioPlayback();

    window.speechSynthesis.speak(utter);
  }
}
window.speakChatMessageByIndex = speakChatMessageByIndex;

// Backward-compatible string-based speech
function speakChatMessage(text, btn) {
  if (typeof text === 'number') {
    return speakChatMessageByIndex(text, btn);
  }
  speakChatMessageByIndex(null, btn);
}
window.speakChatMessage = speakChatMessage;

function editChatMessage(msgIdx) {
  const conv = conversations.find(c => c.id === activeConvId);
  if (!conv || !conv.messages[msgIdx]) return;
  const msg = conv.messages[msgIdx];
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = msg.text || '';
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  conv.messages = conv.messages.slice(0, msgIdx);
  saveConversations();
  renderActiveConversation();
}
window.editChatMessage = editChatMessage;

function retryChatMessage(msgIdx) {
  const conv = conversations.find(c => c.id === activeConvId);
  if (!conv) return;

  let targetQuery = '';
  if (msgIdx !== undefined && conv.messages[msgIdx]) {
    const targetMsg = conv.messages[msgIdx];
    if (targetMsg.role === 'user') {
      targetQuery = targetMsg.text;
      conv.messages = conv.messages.slice(0, msgIdx);
    } else {
      for (let i = msgIdx - 1; i >= 0; i--) {
        if (conv.messages[i].role === 'user') {
          targetQuery = conv.messages[i].text;
          conv.messages = conv.messages.slice(0, i);
          break;
        }
      }
    }
  } else {
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        targetQuery = conv.messages[i].text;
        conv.messages = conv.messages.slice(0, i);
        break;
      }
    }
  }

  if (targetQuery) {
    saveConversations();
    renderActiveConversation();
    const input = document.getElementById('chatInput');
    if (input) input.value = targetQuery;
    sendChat();
  }
}
window.retryChatMessage = retryChatMessage;

function switchModelAndRetry(modelType, msgIdx) {
  if (modelType === 'lite') {
    selectModel('gemini-3.1-flash-lite-preview', 'Gemini 3.1 Flash Lite', 'ri-flashlight-line', '#22d3ee', 'Éco Rapide');
  }
  retryChatMessage(msgIdx);
}
window.switchModelAndRetry = switchModelAndRetry;

let _thinkingStepTimer = null;
let _thinkingSecondsTimer = null;
const REAL_THINKING_STEPS = [
  { icon: 'ri-search-eye-line', color: 'var(--accent)', text: 'Analyse sémantique de votre question...' },
  { icon: 'ri-book-read-line', color: 'var(--accent-2)', text: 'Consultation des bases Raintree, Ehret & Morse...' },
  { icon: 'ri-capsule-line', color: 'var(--purple)', text: 'Vérification du niveau de transition & mucus...' },
  { icon: 'ri-shield-check-line', color: 'var(--accent)', text: 'Validation des synergies et contre-indications...' },
  { icon: 'ri-sparkling-fill', color: 'var(--warn)', text: 'Formulation des conseils personnalisés...' },
  { icon: 'ri-quill-pen-line', color: 'var(--accent-2)', text: 'Finalisation et mise en page de la réponse...' }
];

function addTypingIndicator() {
  if (_thinkingStepTimer) {
    clearInterval(_thinkingStepTimer);
    _thinkingStepTimer = null;
  }
  if (_thinkingSecondsTimer) {
    clearInterval(_thinkingSecondsTimer);
    _thinkingSecondsTimer = null;
  }

  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.id = 'typing-indicator';
  const typingAvatar = window.renderPigeonPortrait ? window.renderPigeonPortrait(28, 'talking') : '🐦';

  let stepIdx = 0;
  let elapsedSec = 0;
  div.innerHTML = `
    <div class="message-avatar">${typingAvatar}</div>
    <div class="message-bubble dynamic-thinking-bubble">
      <div class="dynamic-thinking-icon-wrap" id="typingStepIcon">
        <i class="${REAL_THINKING_STEPS[0].icon}" style="color:${REAL_THINKING_STEPS[0].color};"></i>
      </div>
      <span class="dynamic-thinking-text" id="typingStepText">${REAL_THINKING_STEPS[0].text}</span>
      <span class="dynamic-thinking-timer" id="typingStepTimer" style="font-size:0.75rem; color:var(--text-dim); font-family:monospace; margin-left:6px; opacity:0.8;">0s</span>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>`;

  _thinkingSecondsTimer = setInterval(() => {
    elapsedSec++;
    const timerSpan = div.querySelector('#typingStepTimer');
    if (timerSpan) timerSpan.textContent = `${elapsedSec}s`;
  }, 1000);

  _thinkingStepTimer = setInterval(() => {
    stepIdx = (stepIdx + 1) % REAL_THINKING_STEPS.length;
    const step = REAL_THINKING_STEPS[stepIdx];
    const iconWrap = div.querySelector('#typingStepIcon');
    const textSpan = div.querySelector('#typingStepText');
    if (iconWrap && textSpan) {
      textSpan.classList.add('step-switching');
      setTimeout(() => {
        iconWrap.innerHTML = `<i class="${step.icon}" style="color:${step.color};"></i>`;
        textSpan.textContent = step.text;
        textSpan.classList.remove('step-switching');
      }, 150);
    }
  }, 1300);

  const origRemove = div.remove.bind(div);
  div.remove = () => {
    if (_thinkingStepTimer) {
      clearInterval(_thinkingStepTimer);
      _thinkingStepTimer = null;
    }
    if (_thinkingSecondsTimer) {
      clearInterval(_thinkingSecondsTimer);
      _thinkingSecondsTimer = null;
    }
    origRemove();
  };

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}
window.addTypingIndicator = addTypingIndicator;

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
function applySortAndRender() {
  if (_lastSearchResults.length > 0) renderSearchResults(_lastSearchResults, _lastSearchQuery);
};

function setSearchFilter(filter) {
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
function searchFoods(query) {
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
function triggerDirectAISearch() {
  const isAuth = window.vitalTrackAuth ? window.vitalTrackAuth.isAuthenticated() : false;
  if (!isAuth) {
    let guestAiCount = parseInt(localStorage.getItem('vt_guest_ai_count') || '0', 10);
    if (guestAiCount >= 3) {
      window.openAiAuthGateModal();
      return;
    }
    guestAiCount++;
    localStorage.setItem('vt_guest_ai_count', guestAiCount.toString());
    const remaining = 3 - guestAiCount;
    if (remaining > 0) {
      if (window.showToast) {
        window.showToast(`✨ Requête IA d'essai ${guestAiCount}/3 (${remaining} restante${remaining > 1 ? 's' : ''} avant connexion Google)`, 'info', 4000);
      }
    } else {
      if (window.showToast) {
        window.showToast(`⚠️ Dernière requête IA d'essai (3/3). Connectez-vous avec Google pour continuer en illimité !`, 'info', 5000);
      }
    }
  }

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
    if (currentSearchFilter !== 'all') {
      let filtered = [];
      if (currentSearchFilter === 'favorites') {
        const favs = store.get('favorites', []);
        filtered = favs.map(f => vitalDb.find(item => (f.id && item.id === f.id) || (item.names || []).some(n => n.toLowerCase() === (f.name || '').toLowerCase())) || f);
      } else if (currentSearchFilter === 'electric') {
        filtered = vitalDb.filter(f => f.specific?.electric === true || f.electric === true || f.approved === true);
      } else if (currentSearchFilter === 'hybrid') {
        filtered = vitalDb.filter(f => f.specific?.hybrid === true || f.hybrid === true);
      } else if (currentSearchFilter === 'mucusless') {
        const mm = (f) => (f.specific?.mucus || f.mucus || '').toLowerCase();
        filtered = vitalDb.filter(f => mm(f).includes('sans mucus') || mm(f).includes('dissolvant') || mm(f).includes('non-muc') || (f.scientific_defaults?.pral ?? f.pral ?? 0) < -2.0);
      } else if (currentSearchFilter === 'acid') {
        filtered = vitalDb.filter(f => (f.scientific_defaults?.pral ?? f.pral ?? 0) > 0);
      }

      if (emptyState) emptyState.style.display = 'none';
      if (resultsEl) resultsEl.style.display = 'flex';

      const countEl = document.getElementById('searchResultCount');
      if (statsBar) {
        statsBar.style.display = 'flex';
        if (countEl) countEl.textContent = `${filtered.length} aliment${filtered.length > 1 ? 's' : ''}`;
      }
      _lastSearchResults = filtered;
      _lastSearchQuery = '';
      const sorted = applySortItems(filtered);
      resultsEl.innerHTML = sorted.map(item => renderFoodCard(item)).join('');
      return;
    }

    // No query and filter is all → show empty state (category browse + popular)
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
function quickAddFoodToMeal(idxOrFood) {
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

function quickToggleFavorite(idxOrFood) {
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

function applyRecentSearch(q) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = q; input.focus(); }
  searchFoods(q);
};

function clearRecentSearches() {
  store.set('search-recents', []);
  renderRecentSearches();
};

function clearSearch() {
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

function browseFoodsByCategory(cat) {
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
async function askAIToFindFood(query) {
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

  let searchMascotRenderer = null;
  let tipInterval = null;

  const VITAL_EDUCATIONAL_TIPS = [
    "🌿 Les aliments à PRAL négatif (alcalins) facilitent le travail de filtration rénale et dissolvent les acides uriques.",
    "🔬 Vital le Détective ausculte les bases botaniques : analyse des alcaloïdes, flavonoïdes et minéraux colloïdaux...",
    "💧 Les fruits frais mûrs apportent une eau biologique hautement structurée (H3O2), optimale pour la lymphe.",
    "⚖️ Selon Arnold Ehret (V = P - O), éliminer l'obstruction digestive libère immédiatement la vitalité naturelle.",
    "🌱 Les graines ancestrales (amarante, fonio, teff, quinoa) conservent leur charge électrique native sans gluten.",
    "🧹 En transition, les légumes racines cuits à la vapeur douce balayent les mucosités intestinales sans choc éliminatif.",
    "🍋 Le citron, bien qu'acide au palais, est un puissant alcalinisant et dissout les dépôts de mucus gastrique.",
    "🌳 La pharmacopée amazonienne Raintree répertorie des plantes majeures pour le drainage hépatique et rénal.",
    "🍇 Les raisins noirs et baies sauvages sont les nettoyants lymphatiques les plus puissants identifiés par le Dr. Morse."
  ];

  if (resultsEl) {
    resultsEl.style.display = 'flex';
    const randTip = VITAL_EDUCATIONAL_TIPS[Math.floor(Math.random() * VITAL_EDUCATIONAL_TIPS.length)];
    resultsEl.innerHTML = `
      <div class="search-mascot-loader glass" style="width:100%; text-align:center; padding:32px 20px; border-radius:18px; border:1px solid rgba(52,211,153,0.3); background:var(--surface-2); backdrop-filter:blur(20px); margin:12px 0;">
        <div style="position:relative; width:110px; height:130px; margin:0 auto 16px auto; display:flex; align-items:center; justify-content:center;">
          <div class="scan-spinner-ring" style="width:125px; height:125px; top:-5px; left:-7px; border-color:rgba(52,211,153,0.15); border-top-color:#34d399;"></div>
          <canvas id="searchMascotCanvas" width="110" height="130" style="width:110px; height:130px; filter:drop-shadow(0 4px 16px rgba(52,211,153,0.35));"></canvas>
        </div>
        <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); color:#34d399; font-size:0.82rem; font-weight:700; padding:5px 14px; border-radius:20px; margin-bottom:12px;">
          <i class="ri-search-eye-line"></i> Vital le Détective ausculte « ${esc(q)} »
        </div>
        <h3 style="font-size:1.15rem; font-weight:800; color:var(--text); margin:0 0 8px 0;">Analyse biochimique &amp; statut vitaliste...</h3>
        
        <div id="searchMascotTipBox" style="min-height:56px; max-width:520px; margin:0 auto 18px auto; padding:12px 16px; background:var(--surface-hover); border:1px solid var(--border); border-radius:12px; font-size:0.86rem; color:var(--text); line-height:1.45; display:flex; align-items:center; justify-content:center; text-align:center; transition:opacity 0.3s ease;">
          ${randTip}
        </div>

        <div class="scan-loading-progress-bar" style="max-width:360px; margin:0 auto 12px auto;">
          <div class="scan-loading-progress-fill"></div>
        </div>
        <span id="searchMascotStep" style="font-size:0.76rem; color:var(--text-dim); font-weight:600;">Étape 1/3 : Identification taxonomique et charge colloïdale...</span>
      </div>
    `;

    const canvas = document.getElementById('searchMascotCanvas');
    if (canvas && window.PigeonRenderer) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 110 * dpr;
      canvas.height = 130 * dpr;
      canvas.style.width = '110px';
      canvas.style.height = '130px';
      searchMascotRenderer = new window.PigeonRenderer(canvas);
      searchMascotRenderer.setInspecting(true);
    }

    const steps = [
      'Étape 1/3 : Identification taxonomique et charge colloïdale...',
      'Étape 2/3 : Calcul de l\'indice PRAL rénal et statut Dr. Sebi...',
      'Étape 3/3 : Synthèse bio-électrique et recommandations vivantes...'
    ];
    let tipIdx = 0;
    let stepIdx = 0;
    tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % VITAL_EDUCATIONAL_TIPS.length;
      stepIdx = (stepIdx + 1) % steps.length;
      const tipBox = document.getElementById('searchMascotTipBox');
      const stepEl = document.getElementById('searchMascotStep');
      if (tipBox) {
        tipBox.style.opacity = '0';
        setTimeout(() => {
          tipBox.innerHTML = VITAL_EDUCATIONAL_TIPS[tipIdx];
          tipBox.style.opacity = '1';
        }, 200);
      }
      if (stepEl) stepEl.textContent = steps[stepIdx];
    }, 2500);
  }
  if (emptyState) emptyState.style.display = 'none';
  if (statsBar) statsBar.style.display = 'none';

  try {
    let aiFood = null;
    try {
      const res = await fetch('/api/searchFood', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ query: q, language: getLanguage() })
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
  } finally {
    if (tipInterval) clearInterval(tipInterval);
    if (searchMascotRenderer) searchMascotRenderer.destroy();
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

function toggleProtocolsAccordion() {
  const grid = document.getElementById('protocolsGrid');
  const icon = document.getElementById('protocolsToggleIcon');
  if (!grid) return;
  const isHidden = grid.style.display === 'none' || !grid.style.display;
  grid.style.display = isHidden ? 'grid' : 'none';
  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

const HERB_PATHOLOGY_THESAURUS = {
  crohn: ['crohn', 'colite', 'intestin', 'côlon', 'colon', 'mici', 'sii', 'muqueuse intestinale', 'muqueuses intestinales', 'muqueuses digestives', 'leaky gut', 'permeabilite', 'perméabilité', 'diverticulite', 'diarrhee', 'diarrhée', 'sangre de grado', 'griffe de chat', 'una de gato'],
  colon: ['colon', 'côlon', 'colite', 'intestin', 'crohn', 'mici', 'sii', 'constipation', 'laxatif', 'diverticulite', 'péristaltisme'],
  intestin: ['intestin', 'intestinal', 'intestinaux', 'crohn', 'colon', 'côlon', 'colite', 'sii', 'microbiote', 'flore', 'dysenterie', 'amibes'],
  ulcere: ['ulcere', 'ulcère', 'ulceres', 'ulcères', 'estomac', 'gastrique', 'gastrite', 'duodenal', 'duodénum', 'rgo', 'reflux', 'brulure', 'brûlure', 'acidite', 'acidité', 'espinheira', 'guacatonga'],
  reins: ['reins', 'rein', 'renal', 'rénale', 'renaux', 'rénaux', 'lithiase', 'lithiases', 'calcul', 'calculs', 'acide urique', 'filtration', 'nephro', 'néphron', 'urinaire', 'vessie', 'diuretique', 'diurétique', 'goutte', 'chanca piedra', 'quebra pedra'],
  calculs: ['calcul', 'calculs', 'lithiase', 'lithiases', 'reins', 'rein', 'vesicule', 'vésicule', 'cristaux', 'urates', 'oxalate', 'chanca', 'quebra pedra', 'pierre'],
  candida: ['candida', 'albicans', 'mycose', 'mycoses', 'champignon', 'champignons', 'fongique', 'antifongique', 'parasite', 'parasites', 'levure', 'biofilm', 'dysbiose', 'pau d\'arco', 'lapacho'],
  foie: ['foie', 'hepatique', 'hépatique', 'bile', 'biliaire', 'biliaires', 'vesicule', 'vésicule', 'jaunisse', 'cholagogue', 'choleretique', 'cholérétique', 'cirrhose', 'boldo', 'carqueja'],
  poumons: ['poumons', 'poumon', 'pulmonaire', 'bronches', 'bronchite', 'mucus', 'glaires', 'asthme', 'toux', 'expectorant', 'respiration', 'guaco', 'jatoba'],
  vitalite: ['vitalite', 'vitalité', 'energie', 'énergie', 'fatigue', 'surrenales', 'surrénales', 'epuisement', 'épuisement', 'adaptogene', 'adaptogène', 'endurance', 'libido', 'tonique', 'maca', 'guarana', 'suma'],
  immunite: ['immunite', 'immunité', 'defenses immunitaires', 'défenses immunitaires', 'systeme immunitaire', 'immunomodulateur', 'globules blancs', 'phagocytose', 'griffe de chat', 'una de gato'],
  cerveau: ['cerveau', 'nerfs', 'nerveux', 'sommeil', 'insomnie', 'anxiete', 'anxiété', 'stress', 'memoire', 'mémoire', 'sedatif', 'sédatif', 'mulungu']
};

function filterAndRenderHerbs() {
  const rawQuery = (_currentHerbQuery || '').trim().toLowerCase();
  const filter = _currentHerbFilter;

  // Normalize helper
  const cleanStr = str => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  let results = RAINTREE_HERBS.filter(herb => {
    // Build full searchable text for this herb
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
    ].join(' ');

    const normSearchable = cleanStr(searchable);

    // 1. Tag / Category filter
    if (filter !== 'all') {
      const thesaurusKeys = HERB_PATHOLOGY_THESAURUS[filter];
      if (thesaurusKeys && thesaurusKeys.length > 0) {
        const matchesThesaurus = thesaurusKeys.some(key => normSearchable.includes(cleanStr(key)));
        if (!matchesThesaurus) return false;
      } else {
        const matchesFilter = (herb.category && cleanStr(herb.category).includes(cleanStr(filter))) ||
          (herb.tags && herb.tags.some(t => cleanStr(t).includes(cleanStr(filter)))) ||
          (herb.id && cleanStr(herb.id).includes(cleanStr(filter)));
        if (!matchesFilter) return false;
      }
    }

    // 2. Query search across all fields + pathology expansion
    if (rawQuery) {
      const qTerms = rawQuery.split(/\s+/).filter(Boolean);
      
      const allMatch = qTerms.every(term => {
        const normTerm = cleanStr(term);
        // Direct string inclusion
        if (normSearchable.includes(normTerm)) return true;

        // Check if term matches any thesaurus category
        for (const [catKey, keywords] of Object.entries(HERB_PATHOLOGY_THESAURUS)) {
          const normKey = cleanStr(catKey);
          const normKeywords = keywords.map(cleanStr);
          if (normKey === normTerm || normKeywords.includes(normTerm)) {
            if (normKeywords.some(kw => normSearchable.includes(kw))) {
              return true;
            }
          }
        }

        return false;
      });

      if (!allMatch) return false;
    }

    return true;
  });

  // Sort results by relevance score so master herbs appear at the top
  if (rawQuery || filter !== 'all') {
    const activeTerm = rawQuery || filter;
    const cleanActive = cleanStr(activeTerm);
    results.sort((a, b) => {
      const getScore = h => {
        let s = 0;
        const normName = cleanStr(h.name);
        const normIndications = (h.indications || []).map(cleanStr).join(' ');
        const normTags = (h.tags || []).map(cleanStr).join(' ');
        const normCategory = cleanStr(h.category);
        
        if (normName.includes(cleanActive)) s += 50;
        if (normIndications.includes(cleanActive)) s += 30;
        if (normCategory.includes(cleanActive)) s += 20;
        if (normTags.includes(cleanActive)) s += 15;
        
        // Primary targeted master herbs bonus
        if (['crohn', 'colon', 'intestin'].includes(cleanActive) && ['sangre', 'catclaw', 'espinheira', 'guacatonga', 'copaiba', 'simaruba'].includes(h.id)) s += 100;
        if (['reins', 'calculs'].includes(cleanActive) && ['chanca', 'abuta', 'ervatostao', 'nettles', 'cipocabeludo'].includes(h.id)) s += 100;
        if (['candida'].includes(cleanActive) && ['paudarco', 'jatoba', 'anamu'].includes(h.id)) s += 100;
        if (['foie'].includes(cleanActive) && ['boldo', 'carqueja', 'artichoke'].includes(h.id)) s += 100;
        if (['ulcere'].includes(cleanActive) && ['espinheira', 'sangre', 'guacatonga', 'copaiba'].includes(h.id)) s += 100;
        if (['poumons'].includes(cleanActive) && ['guaco', 'jatoba', 'amorseco'].includes(h.id)) s += 100;
        if (['vitalite'].includes(cleanActive) && ['maca', 'guarana', 'suma'].includes(h.id)) s += 100;
        if (['cerveau'].includes(cleanActive) && ['mulungu', 'maracuja', 'camomille'].includes(h.id)) s += 100;
        return s;
      };
      return getScore(b) - getScore(a);
    });
  }

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

function handleHerbSearchInput() {
  const input = document.getElementById('herbSearchInput');
  const clearBtn = document.getElementById('herbClearBtn');
  if (!input) return;
  _currentHerbQuery = input.value;
  if (clearBtn) clearBtn.style.display = _currentHerbQuery ? 'block' : 'none';
  filterAndRenderHerbs();
};

function clearHerbSearch() {
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

function setHerbFilter(filterId) {
  _currentHerbFilter = filterId;
  document.querySelectorAll('.materia-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-filter') === filterId);
  });
  filterAndRenderHerbs();
};

function filterByTag(tag) {
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

function setHerbFilterByHerbs(herbIds) {
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

function toggleHerbMonograph() {
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

function openHerbModal(herbId) {
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

function closeHerbModal() {
  const modal = document.getElementById('herbModal');
  if (modal) modal.style.display = 'none';
};

function askAIAboutCurrentHerb() {
  if (!_currentSelectedHerb) return;
  const herb = _currentSelectedHerb;
  closeHerbModal();
  showPage('chat');
  setChatContext({
    type: 'herb_info',
    icon: '🌿',
    label: 'Plante Raintree',
    subject: `${herb.name} (${herb.latinName})`,
    placeholder: `Posez une question sur ${herb.name} (ou appuyez sur Envoyer)...`,
    buildPrompt: (userText) => `Peux-tu m'expliquer en détail les vertus thérapeutiques, le mode de préparation et les synergies de la plante ${herb.name} (${herb.latinName}) selon la pharmacopée Raintree et la vision vitaliste ? ${userText ? `Question précise de l'utilisateur : ${userText}` : ''}`
  });
};

// ═══════ FOOD & MEAL MODAL (DIFFÉRENCIATION ALIMENT / REPAS COMPOSÉ) ═══════
function openFoodModal(idxOrFood) {
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

function switchAnalyzedFoodInModal(idx) {
  if (!currentModalFood || !currentModalFood.allAnalyzedItems || !currentModalFood.allAnalyzedItems[idx]) return;
  const target = currentModalFood.allAnalyzedItems[idx];
  openFoodModal({
    ...target,
    isMealSelection: true,
    allAnalyzedItems: currentModalFood.allAnalyzedItems
  });
};

function confirmAddMealFromModal() {
  closeFoodModal();
  confirmAddMeal();
};

function openFoodModalFromSelection(id) {
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

function setMealCookingMethod(methodId) {
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

function setMealOilQuality(oilId) {
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

function openFoodModalFromMeal(idx) {
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

function removeMealAndCloseModal(idx) {
  if (typeof idx === 'number') {
    removeMeal(idx);
    closeFoodModal();
    showToast('Repas retiré du journal', 'info');
  }
};

function saveAIFoodToDB() {
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

function addFoodToMealFromModal(idx) {
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

function closeFoodModal(e) {
  if (!e || e.target === document.getElementById('foodModal')) {
    document.getElementById('foodModal').classList.remove('open');
  }
};

function setModalTab(tab) {
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
    const vitalityColor = vitalityScore >= 85 ? 'var(--accent)' : vitalityScore >= 60 ? 'var(--warn)' : 'var(--danger)';
    const effectiveNova = cooking.id === 'fry' ? Math.max(3, nova) : nova;
    const novaColor = effectiveNova === 1 ? 'var(--accent)' : effectiveNova === 2 ? 'var(--accent-2)' : effectiveNova === 3 ? 'var(--warn)' : 'var(--danger)';

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
          <span style="font-size:0.75rem; color:${oil.isPositive ? 'var(--accent)' : 'var(--danger)'}; font-weight:600;">${oil.isPositive ? '🟢 Non-oxydé' : '🔴 Oxydé / Pro-inflammatoire'}</span>
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
        <span class="data-value" style="font-weight:700; color:${adjustedIsAlkaline ? 'var(--accent)' : 'var(--warn)'}">
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
        <span class="data-value" style="font-weight:600; color:${cooking.id === 'fry' || !oil.isPositive ? 'var(--warn)' : 'var(--accent)'}">
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
        <span class="data-value" style="font-weight:700; color:${isAlkaline ? 'var(--accent)' : 'var(--warn)'}">
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
    const novaColor = nova === 1 ? 'var(--accent)' : nova === 2 ? 'var(--accent-2)' : nova === 3 ? 'var(--warn)' : 'var(--danger)';
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
    let sebiColor = 'var(--danger)';
    let hybridLabel = isHybrid ? '⚠️ Hybride / Amilacé' : '✅ Végétal Originel & Brut';
    let hybridColor = isHybrid ? 'var(--warn)' : 'var(--accent)';

    if (isAnimal) {
      sebiLabel = '❌ Non Recommandé / Produit Animal';
      sebiColor = 'var(--danger)';
      hybridLabel = '❌ Non Végétal (Règne Animal)';
      hybridColor = 'var(--text-dim)';
    } else if (isMineral) {
      sebiLabel = '🌊 Minéral Naturel Pur';
      sebiColor = 'var(--accent-2)';
      hybridLabel = '🌊 Non Végétal (Règne Minéral)';
      hybridColor = 'var(--text-dim)';
    } else {
      if (sebiStatus === 'sebi_official' || (isElectric && !sp?.label?.includes('Sauvage') && !sp?.label?.includes('Indigène'))) {
        sebiLabel = '⚡ Liste Officielle Dr. Sebi';
        sebiColor = 'var(--accent)';
      } else if (sebiStatus === 'wild_original' || isElectric) {
        sebiLabel = '⚡ Végétal Sauvage / Originel (Conforme Sebi)';
        sebiColor = 'var(--accent)';
      } else if (isAlcalinFood && !isHybrid) {
        sebiLabel = '🌿 Végétal Naturel Alcalin (Hors liste Sebi)';
        sebiColor = 'var(--accent-2)';
      } else if (isHybrid) {
        sebiLabel = '⚠️ Hybride / Amilacé';
        sebiColor = 'var(--warn)';
      }
    }

    let mucusLabel = sp?.mucus ?? (isDissolvant ? 'Dissolvant' : 'Neutre');
    let mucusColor = 'var(--accent)';
    if (isAnimal) {
      mucusLabel = '🔴 Fortement mucogène (Protéines animales putrescibles)';
      mucusColor = 'var(--danger)';
    } else if (isDissolvant) {
      mucusLabel = '🍃 Dissolvant de mucus (Astringent)';
      mucusColor = 'var(--accent)';
    } else if (mucusStr.includes('neutre') || (!mucusStr.includes('mucog') && isAlcalinFood)) {
      mucusLabel = '🟢 Non-mucogène (Neutre)';
      mucusColor = 'var(--accent)';
    } else if (mucusStr.includes('faible') || isHybrid) {
      mucusLabel = '🟡 Faiblement mucogène';
      mucusColor = 'var(--warn)';
    } else {
      mucusLabel = '🔴 Fortement mucogène';
      mucusColor = 'var(--danger)';
    }

    let verdictLabel = sp?.label ?? (isElectric ? '⚡ Électrique & Régénérant' : isAlcalinFood ? '🌿 Végétal Vivant Alcalinisant & Dissolvant' : isHybrid ? '🔀 Hybride modéré' : isAnimal ? '⛔ Animal / Acidogène & Mucogène' : '⛔ Mucogène & Acidogène');
    let verdictColor = isElectric ? 'var(--accent)' : isAlcalinFood ? 'var(--accent-2)' : isHybrid ? 'var(--warn)' : 'var(--danger)';

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
function toggleFavorite() {
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

// ═══════ FAVORITES & CUSTOM DISHES ═══════
let currentFavFilter = 'all';

function setFavFilter(filter) {
  currentFavFilter = filter;
  document.querySelectorAll('.favs-folders .filter-chip').forEach(c => c.classList.remove('active'));
  const activeBtn = document.getElementById(`favFilter${filter.charAt(0).toUpperCase() + filter.slice(1)}`) || document.getElementById('favFilterAll');
  if (activeBtn) activeBtn.classList.add('active');
  renderFavorites();
};

function openCreateDishModal() {
  const form = document.getElementById('createDishForm');
  if (form) form.reset();
  const preview = document.getElementById('dishEmojiPreview');
  if (preview) preview.textContent = '🥗';
  document.querySelectorAll('.dish-emoji-btn').forEach((b, idx) => {
    b.classList.toggle('active', idx === 0);
  });
  const modal = document.getElementById('createDishModal');
  if (modal) modal.style.display = 'flex';
};

function closeCreateDishModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-overlay')) {
    return;
  }
  const modal = document.getElementById('createDishModal');
  if (modal) modal.style.display = 'none';
};

function selectDishEmoji(emoji, btn) {
  const preview = document.getElementById('dishEmojiPreview');
  if (preview) preview.textContent = emoji;
  document.querySelectorAll('.dish-emoji-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
};

function handleSaveCustomDish(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('dishNameInput')?.value?.trim();
  if (!name) return;

  const emoji = document.getElementById('dishEmojiPreview')?.textContent?.trim() || '🥗';
  const rawIng = document.getElementById('dishIngredientsInput')?.value || '';
  const ingredients = rawIng.split(',').map(s => s.trim()).filter(Boolean);
  const profile = document.getElementById('dishProfileInput')?.value || 'electric';
  const notes = document.getElementById('dishNotesInput')?.value?.trim() || '';

  const isElec = profile === 'electric';
  const pral = isElec ? -8.5 : (profile === 'alkaline' ? -5.2 : (profile === 'detox' ? -10.0 : -1.5));

  let favs = store.get('favorites', []);
  const dish = {
    id: `dish_${Date.now()}`,
    type: 'dish',
    name,
    emoji,
    category: 'Plat Personnalisé',
    ingredients,
    profile,
    electric: isElec,
    pral,
    nova: 1,
    notes,
    createdAt: Date.now()
  };

  favs.unshift(dish);
  store.set('favorites', favs);
  window.closeCreateDishModal();
  window.setFavFilter('dish');
  renderFavorites();
  showToast(`✨ Plat « ${name} » enregistré avec succès dans vos Favoris !`, 'success', 3500);
};

function addFavoriteDishToMeals(dishId) {
  const favs = store.get('favorites', []);
  const dish = favs.find(f => f.id === dishId);
  if (!dish) return;

  const meals = store.get('meals', []);
  const newMeal = {
    id: `meal_${Date.now()}`,
    timestamp: Date.now(),
    name: dish.name,
    emoji: dish.emoji || '🥗',
    category: 'repas',
    items: dish.ingredients || [],
    ingredients: dish.ingredients || [],
    electric: dish.electric ?? (dish.profile === 'electric'),
    hybrid: dish.profile === 'transition',
    pral: dish.pral ?? -5,
    nova: dish.nova ?? 1,
    cookingMethod: 'raw',
    notes: dish.notes || 'Plat favori réutilisé'
  };

  meals.push(newMeal);
  store.set('meals', meals);
  renderMeals();
  renderDashboard();
  showToast(`🥗 « ${dish.name} » ajouté avec succès à votre journal du jour !`, 'success', 3500);
};

function chatAboutDish(dishId) {
  const favs = store.get('favorites', []);
  const dish = favs.find(f => f.id === dishId);
  if (!dish) return;

  const ingStr = (dish.ingredients && dish.ingredients.length > 0) ? ` (Ingrédients : ${dish.ingredients.join(', ')})` : '';
  const prompt = `Peux-tu me donner des conseils pour préparer et optimiser mon plat « ${dish.name} »${ingStr} selon les principes vitalistes et émonctoriels ?`;

  showPage('chat');
  setTimeout(() => {
    quickChat(prompt);
  }, 400);
};

function saveMealAsFavoriteDish(idx) {
  const meals = store.get('meals', []);
  const todayMeals = meals.filter(m => isToday(m.timestamp));
  if (idx >= todayMeals.length) return;
  const targetMeal = todayMeals[idx];

  let favs = store.get('favorites', []);
  const dishId = `dish_${Date.now()}`;
  const rawItems = targetMeal.items || targetMeal.ingredients || [];
  const ingredients = Array.isArray(rawItems)
    ? rawItems.map(it => typeof it === 'string' ? it : (it.name || '')).filter(Boolean)
    : [];

  const isElec = targetMeal.electric === true || targetMeal.approved === true;
  const profile = isElec ? 'electric' : (targetMeal.hybrid ? 'transition' : 'alkaline');

  favs.unshift({
    id: dishId,
    type: 'dish',
    name: targetMeal.name || 'Plat Vitaliste',
    emoji: targetMeal.emoji || '🥗',
    category: 'Plat Personnalisé',
    ingredients,
    profile,
    electric: isElec,
    pral: targetMeal.pral ?? (targetMeal.scientific?.pral ?? -5),
    nova: targetMeal.nova ?? 1,
    notes: `Enregistré depuis le journal des repas du ${new Date().toLocaleDateString('fr-FR')}`,
    createdAt: Date.now()
  });

  store.set('favorites', favs);
  renderFavorites();
  showToast(`❤️ Plat « ${targetMeal.name} » ajouté à vos Plats Favoris !`, 'success');
};

function renderFavorites() {
  const favs = store.get('favorites', []);
  const list = document.getElementById('favsList');
  if (!list) return;

  const countAll = favs.length;
  const countDishes = favs.filter(f => f.type === 'dish').length;
  const countFoods = favs.filter(f => f.type === 'food' || (!f.type && !f.id?.startsWith('plant_'))).length;
  const countHerbs = favs.filter(f => f.type === 'herb' || f.id?.startsWith('plant_') || f.family === 'Pharmacopée' || f.category === 'Pharmacopée').length;

  const countAllEl = document.getElementById('favCountAll');
  const countDishesEl = document.getElementById('favCountDishes');
  const countFoodsEl = document.getElementById('favCountFoods');
  const countHerbsEl = document.getElementById('favCountHerbs');

  if (countAllEl) countAllEl.textContent = countAll;
  if (countDishesEl) countDishesEl.textContent = countDishes;
  if (countFoodsEl) countFoodsEl.textContent = countFoods;
  if (countHerbsEl) countHerbsEl.textContent = countHerbs;

  if (favs.length === 0) {
    list.innerHTML = '<p class="empty-state">Aucun favori enregistré. Ajoutez des aliments depuis la recherche ou créez vos propres plats personnalisés !</p>';
    return;
  }

  const filtered = favs.filter(f => {
    if (currentFavFilter === 'dish') return f.type === 'dish';
    if (currentFavFilter === 'food') return f.type === 'food' || (!f.type && !f.id?.startsWith('plant_'));
    if (currentFavFilter === 'herb') return f.type === 'herb' || f.id?.startsWith('plant_') || f.family === 'Pharmacopée' || f.category === 'Pharmacopée';
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-state">Aucun élément dans cette catégorie.</p>`;
    return;
  }

  list.innerHTML = filtered.map(f => {
    if (f.type === 'dish') {
      const isElec = f.electric === true || f.profile === 'electric';
      const badgeText = isElec ? '⚡ 100% Électrique' : (f.profile === 'detox' ? '🥣 Détox Régénérante' : (f.profile === 'transition' ? '🔄 Transition' : '🌿 Alcalinisant'));
      const badgeClass = isElec ? 'badge-electric' : (f.profile === 'transition' ? 'badge-hybrid' : 'badge-alkaline');
      const ingredients = f.ingredients || [];
      const tagsHtml = ingredients.length > 0
        ? `<div class="fav-dish-tags">${ingredients.map(ing => `<span class="fav-dish-tag">${esc(ing)}</span>`).join('')}</div>`
        : '';
      const notesHtml = f.notes
        ? `<div class="fav-dish-notes">${esc(f.notes)}</div>`
        : '';

      return `
      <div class="fav-dish-card">
        <div class="fav-dish-header">
          <div class="fav-dish-title-wrap">
            <div class="fav-dish-emoji">${f.emoji || '🥗'}</div>
            <div>
              <div class="fav-dish-name">${esc(f.name)}</div>
              <div class="fav-dish-meta">Plat &amp; Recette · PRAL ${f.pral > 0 ? '+' : ''}${(f.pral || -5).toFixed(1)} · NOVA ${f.nova || 1}</div>
            </div>
          </div>
          <span class="food-badge ${badgeClass}">${badgeText}</span>
        </div>
        ${tagsHtml}
        ${notesHtml}
        <div class="fav-dish-actions">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn-dish-consume" onclick="addFavoriteDishToMeals('${f.id}')" title="Ajouter directement au journal des repas d'aujourd'hui">
              <i class="ri-restaurant-line"></i> Consommer (Ajouter au journal)
            </button>
            <button type="button" class="btn-dish-chat" onclick="chatAboutDish('${f.id}')" title="Demander des conseils d'optimisation au Coach Vital">
              <i class="ri-chat-smile-3-line"></i> Conseil Coach
            </button>
          </div>
          <button type="button" class="btn-dish-delete" onclick="toggleFavorite({ id: '${f.id}', name: '${esc(f.name).replace(/'/g, "\\'")}' })" title="Retirer des favoris">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>`;
    }

    // Herb / Pharmacopee
    if (f.id?.startsWith('plant_') || f.type === 'herb' || f.family === 'Pharmacopée') {
      return `
      <div class="food-card clickable" onclick="openPlantModal('${f.id}')" style="cursor:pointer;">
        <span class="food-fav-icon" onclick="event.stopPropagation(); toggleFavorite({ id: '${f.id}' });"><i class="ri-heart-fill"></i></span>
        <div class="food-emoji">${f.emoji || '🌿'}</div>
        <div class="food-info">
          <div class="food-name">${esc(f.name)}</div>
          <div class="food-meta">${esc(f.botanical || f.family || 'Plante Médicinale Amazonienne')}</div>
        </div>
        <span class="food-badge badge-electric">Pharmacopée</span>
      </div>`;
    }

    // Standard Food Item
    const isE = f.electric === true || f.approved === true || f.specific?.electric === true;
    const isH = f.hybrid === true || f.specific?.hybrid === true;
    const pral = f.scientific_defaults?.pral ?? (f.pral ?? 0);
    const mucusStr = (f.specific?.mucus || f.mucus || '').toLowerCase();
    const isDissolvant = mucusStr.includes('dissolvant') || mucusStr.includes('non-muc');
    const isAlcalin = pral < 0 || isDissolvant;
    const bc = isE ? 'badge-electric' : isH ? 'badge-hybrid' : (isAlcalin && !mucusStr.includes('mucog')) ? 'badge-alkaline' : 'badge-mucus';
    const bt = isE ? 'Électrique' : isH ? 'Hybride' : (isAlcalin && !mucusStr.includes('mucog')) ? 'Alcalinisant' : 'Mucogène';

    return `<div class="food-card clickable" onclick="openFoodModal('${f.id || esc(f.name)}')" style="cursor:pointer;">
      <span class="food-fav-icon" onclick="event.stopPropagation(); toggleFavorite({ id: '${f.id || esc(f.name)}' });"><i class="ri-heart-fill"></i></span>
      <div class="food-emoji">${f.emoji || '🍽️'}</div>
      <div class="food-info">
        <div class="food-name">${esc(f.name)}</div>
        <div class="food-meta">${esc(f.family || f.category || '')} · PRAL ${pral > 0 ? '+' : ''}${pral.toFixed(1)}</div>
      </div>
      <span class="food-badge ${bc}">${bt}</span>
    </div>`;
  }).join('');
}
window.renderFavorites = renderFavorites;

// ═══════ MEALS ═══════
function showAddMealModal() { selectedMealFoods = []; renderSelectedMealFoods(); document.getElementById('mealSearchResults').innerHTML = ''; document.getElementById('mealSearchInput').value = ''; const aiInput = document.getElementById('aiDishInput'); if (aiInput) aiInput.value = ''; document.getElementById('addMealModal').classList.add('open'); };
function closeAddMealModal(e) { if (!e || e.target === document.getElementById('addMealModal')) document.getElementById('addMealModal').classList.remove('open'); };

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

async function analyzeDishWithAI() {
  if (!requireAuthForAi("l'Analyse IA de Plat")) return;
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
        headers: getApiHeaders(),
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

function searchMealFoods(query) {
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

async function askAIToAddMealFood(query) {
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
        headers: getApiHeaders(),
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



function searchEditMealFoods(query) {
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

function selectMealFood(idx) {
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

function removeSelectedFood(id) {
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

function confirmAddMeal() {
  if (selectedMealFoods.length === 0) return;
  const meals = store.get('meals', []);
  selectedMealFoods.forEach(f => meals.push({ ...f, timestamp: Date.now() }));
  store.set('meals', meals);
  closeAddMealModal();
  renderMeals();
  renderDashboard();
};

function addFoodToMeal() {
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
    const catBadge = m.category ? `<span class="food-badge" style="font-size:0.7rem; padding:2px 6px; background:var(--surface-hover);">${esc(m.category.toUpperCase())}</span>` : '';
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
      <div style="display:flex; align-items:center; gap:4px;">
        <button class="meal-item-save-fav" onclick="event.stopPropagation(); saveMealAsFavoriteDish(${i})" title="Enregistrer dans mes Plats Favoris" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); color:#ef4444; border-radius:8px; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; cursor:pointer;"><i class="ri-heart-add-line"></i></button>
        <button class="meal-item-remove" onclick="event.stopPropagation(); removeMeal(${i})" title="Supprimer ce repas"><i class="ri-delete-bin-line"></i></button>
      </div>
    </div>`;
  }).join('');
}
window.renderMeals = renderMeals;

function removeMeal(idx) {
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

function selectProgram(id) {
  const p = FASTING_PROGRAMS.find(x => x.id === id);
  if (!p) return;
  document.getElementById('fastingDuration').value = p.hours;
  const goalEl = document.getElementById('fastGoal');
  if (goalEl) goalEl.textContent = 'Objectif : ' + p.hours + 'h';
  document.getElementById('fastingSafetyWarning').style.display = p.hours > 24 ? 'block' : 'none';
  document.querySelectorAll('.jn-program-tile').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  // Sync select dropdown
  const typeMap = { intermittent: 'intermittent', warrior: 'warrior', waterFast24: 'waterFast', juiceFast: 'juiceFast', fruitFast: 'fruitFast', grapeCure: 'grapeCure', drySunFast: 'drySunFast', ramadan: 'ramadan' };
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
    { bg: 'rgba(240,112,156,.14)', color: '#f0709c' },
    { bg: 'rgba(55,211,153,.14)', color: 'var(--accent)' },
    { bg: 'rgba(76,195,240,.14)', color: '#4cc3f0' },
    { bg: 'rgba(167,139,250,.14)', color: '#a78bfa' },
    { bg: 'rgba(250,204,21,.14)', color: '#facc15' },
    { bg: 'rgba(236,72,153,.14)', color: '#ec4899' },
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

function openMasterclass(index) {
  const mc = ehretMasterclassData[index];
  document.getElementById('mcHeader').innerHTML = `
    <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
      <div style="width:56px; height:56px; border-radius:16px; background:${mc.bg}; color:${mc.color}; display:flex; align-items:center; justify-content:center; font-size:2rem; box-shadow:0 8px 16px rgba(0,0,0,0.15);">
        <i class="${mc.icon}"></i>
      </div>
      <div>
        <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:${mc.color}; margin-bottom:4px;">${mc.pill}</div>
        <h2 style="margin:0; font-size:1.55rem; color:var(--text); line-height:1.2; font-weight:800;">${mc.title}</h2>
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

function askAIAboutMasterclass(title) {
  document.getElementById('masterclassModal').classList.remove('open');
  showPage('chat');
  setChatContext({
    type: 'lesson_info',
    icon: '📖',
    label: "Leçon d'Arnold Ehret",
    subject: title,
    placeholder: `Posez une question sur cette leçon (ou appuyez sur Envoyer)...`,
    buildPrompt: (userText) => `Peux-tu m'expliquer en profondeur la leçon d'Arnold Ehret sur "${title}" et comment l'appliquer concrètement dans mon hygiène de vie ? ${userText ? `Précision de l'utilisateur : ${userText}` : ''}`
  });
};

function closeMasterclass(e) {
  if (e && e.target !== document.getElementById('masterclassModal')) return;
  document.getElementById('masterclassModal').classList.remove('open');
};

// ═══════ EXPERT ADVICE ═══════
function initExpertAccordion() {
  const expertColors = [
    { bg: 'rgba(246,185,59,.14)', color: '#f6b93b' },
    { bg: 'rgba(55,211,153,.14)', color: 'var(--accent)' },
    { bg: 'rgba(246,185,59,.14)', color: '#f6b93b' },
    { bg: 'rgba(76,195,240,.14)', color: '#4cc3f0' },
    { bg: 'rgba(255,255,255,.06)', color: 'var(--text-dim)' },
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

function toggleExpertAccordion(headEl) {
  const row = headEl.closest('.jn-expert-row');
  const wasOpen = row.classList.contains('open');
  // Close all
  document.querySelectorAll('.jn-expert-row').forEach(r => r.classList.remove('open'));
  // Open clicked if it was closed
  if (!wasOpen) row.classList.add('open');
};

// ═══════ FASTING TIMER & CONTROLS ═══════
function stepFastingDuration(delta) {
  if (fastingState?.active) return;
  const input = document.getElementById('fastingDuration');
  if (!input) return;
  let val = (parseInt(input.value) || 16) + delta;
  val = Math.max(1, Math.min(168, val));
  input.value = val;
  window.onFastingDurationChange();
};

function setFastingDurationPreset(hours) {
  if (fastingState?.active) return;
  const input = document.getElementById('fastingDuration');
  if (input) {
    input.value = hours;
    window.onFastingDurationChange();
  }
};

function onFastingDurationChange() {
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

function initFastingDurationControls() {
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

async function toggleFasting() {
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

function openFastEndModal(elapsedMs, targetMs, type) {
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

function closeFastEndModal() {
  const modal = document.getElementById('fastEndModal');
  if (modal) modal.style.display = 'none';
  pendingFastDebrief = null;
};

function setFastRating(type, val) {
  currentFastRating[type] = parseInt(val);
  const containerId = type === 'energy' ? 'fastRatingEnergy' : 'fastRatingClarity';
  document.querySelectorAll(`#${containerId} .star-rating-btn`).forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.val) === parseInt(val));
  });
};

function toggleElimTag(el) {
  if (!el) return;
  el.classList.toggle('active');
  const tag = el.dataset.tag;
  if (el.classList.contains('active')) {
    if (!currentFastRating.tags.includes(tag)) currentFastRating.tags.push(tag);
  } else {
    currentFastRating.tags = currentFastRating.tags.filter(t => t !== tag);
  }
};

function confirmSaveFastDebrief() {
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
    timerDigits.textContent = `${String(Math.floor(ts / 3600)).padStart(2, '0')}:${String(Math.floor((ts % 3600) / 60)).padStart(2, '0')}:${String(ts % 60).padStart(2, '0')}`;
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
      statusEl.textContent = `Reste ${Math.floor(remaining / 3600000)}h ${Math.floor((remaining % 3600000) / 60000)}min`;
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
    const tl = { intermittent: '⏰ Intermittent', warrior: '⚔️ Warrior', waterFast: '💧 Hydrique', juiceFast: '🧃 Jus', fruitFast: '🍎 Fruits', grapeCure: '🍇 Raisin', drySunFast: '☀️ Sec', ramadan: '🌙 Ramadan' };
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

function deleteFastingEntry(index) {
  const history = store.get('fasting-history', []);
  if (index >= 0 && index < history.length) {
    history.splice(index, 1);
    store.set('fasting-history', history);
    renderFastingHistory();
    renderFastingAnalytics();
    if (window.showToast) window.showToast('Session supprimée de l\'historique', 'info');
  }
};

function showFastingRefeedAdvice(hours, type) {
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

  const tl = { intermittent: '⏰ Intermittent', warrior: '⚔️ Warrior', waterFast: '💧 Hydrique', juiceFast: '🧃 Jus', fruitFast: '🍎 Fruits', grapeCure: '🍇 Raisin', drySunFast: '☀️ Sec', ramadan: '🌙 Ramadan' };
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

function switchBreathingTab(tabName) {
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
  '3-rounds-fr': {
    title: "Vidéo Guidée Wim Hof (3 Rounds) • 🇫🇷 Version Française",
    desc: "Pratiquez directement en rythme avec le guidage vocal français calé en direct sur les cloches, inspirations et temps de rétention.",
    src: "/videos/wim-hof-3-rounds-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    badge: "🇫🇷 VF Guidée HD"
  },
  '3-rounds-en': {
    title: "Guided Wim Hof Breathing (3 Rounds) • 🇬🇧 Original English",
    desc: "Practice directly in rhythm with Wim Hof himself. Authentic original English session with retention bells.",
    src: "/videos/wim-hof-3-rounds.mp4",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    badge: "🇬🇧 Authentic English"
  },
  'tutorial-fr': {
    title: "Tutoriel Officiel Wim Hof • 🇫🇷 Version Française",
    desc: "Explications complètes de la méthode par Wim Hof doublé intégralement en français studio : respiration diaphragmatique, rétentions et alcalinisation.",
    src: "/videos/wim-hof-tutorial-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    badge: "🇫🇷 VF Complète HD"
  },
  'tutorial-en': {
    title: "Wim Hof Method Tutorial • 🇬🇧 Original English",
    desc: "In-depth technique tutorial by Wim Hof on breathing mechanics, cold exposure progression, and mental focus.",
    src: "/videos/wim-hof-tutorial.mp4",
    poster: "/videos/posters/wim-hof-tutorial.jpg",
    badge: "🇬🇧 Authentic English"
  },
  'science-fr': {
    title: "Documentaire : Wim Hof & La Science de l'Immunité • 🇫🇷 Version Française",
    desc: "Grand documentaire scientifique avec Wim Hof et les chercheurs universitaires doublés en français multi-voix sur la modulation du système immunitaire.",
    src: "/videos/wim-hof-science-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-science.jpg",
    badge: "🇫🇷 VF Multi-Voix HD"
  },
  'science-en': {
    title: "Wim Hof: Testing the Immune System • 🇬🇧 Original English",
    desc: "Comprehensive scientific documentary documenting clinical trials at Radboud University and immune modulation in original English.",
    src: "/videos/wim-hof-science.mp4",
    poster: "/videos/posters/wim-hof-science.jpg",
    badge: "🇬🇧 Authentic English"
  },

  // Aliases for compatibility
  '3-rounds': {
    title: "Vidéo Guidée Wim Hof (3 Rounds) • 🇫🇷 Version Française",
    desc: "Pratiquez directement en rythme avec le guidage vocal français calé en direct sur les cloches, inspirations et temps de rétention.",
    src: "/videos/wim-hof-3-rounds-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    badge: "🇫🇷 VF Guidée HD"
  },
  'tutorial': {
    title: "Tutoriel Officiel Wim Hof • 🇫🇷 Version Française",
    desc: "Explications complètes de la méthode par Wim Hof doublé intégralement en français studio : respiration diaphragmatique, rétentions et alcalinisation.",
    src: "/videos/wim-hof-tutorial-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-3-rounds.jpg",
    badge: "🇫🇷 VF Complète HD"
  },
  'science': {
    title: "Documentaire : Wim Hof & La Science de l'Immunité • 🇫🇷 Version Française",
    desc: "Grand documentaire scientifique avec Wim Hof et les chercheurs universitaires doublés en français multi-voix sur la modulation du système immunitaire.",
    src: "/videos/wim-hof-science-fr.mp4?v=20260820_v4_full",
    poster: "/videos/posters/wim-hof-science.jpg",
    badge: "🇫🇷 VF Multi-Voix HD"
  }
};

let _breathingVideoActiveLang = 'fr';

function setBreathingVideoLang(lang) {
  _breathingVideoActiveLang = lang;
  document.querySelectorAll('.breathing-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.querySelectorAll('.breathing-video-group').forEach(group => {
    group.style.display = group.dataset.lang === lang ? 'flex' : 'none';
  });
  // Auto-switch to first video of selected language
  const firstPill = document.querySelector(`.breathing-video-group[data-lang="${lang}"] .preset-pill`);
  if (firstPill) {
    firstPill.click();
  }
}
window.setBreathingVideoLang = setBreathingVideoLang;

function loadBreathingVideo(videoKey, btnEl) {
  const videoData = WIM_HOF_VIDEOS[videoKey] || WIM_HOF_VIDEOS['3-rounds-fr'];
  const videoPlayer = document.getElementById('wimHofVideoPlayer');
  const sourceEl = document.getElementById('wimHofVideoSource');
  const titleEl = document.getElementById('wimHofActiveTitle');
  const descEl = document.getElementById('wimHofActiveDesc');
  const badgeEl = document.getElementById('wimHofActiveBadge');

  if (titleEl) {
    titleEl.innerHTML = `<i class="ri-video-fill" style="color:var(--accent);"></i> ${esc(videoData.title)}`;
  }
  if (descEl) {
    descEl.textContent = videoData.desc;
  }
  if (badgeEl && videoData.badge) {
    badgeEl.textContent = videoData.badge;
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
      videoPlayer.play().catch(() => { });
    }
  }

  if (btnEl) {
    document.querySelectorAll('#breathingTabVideos .preset-pill').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }
};

function setBreathMode(mode) {
  currentBreathMode = mode;
  document.querySelectorAll('.breath-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const desc = breathModes[mode] ? `${breathModes[mode].name} — ${breathModes[mode].breaths} respirations/tour` : '';
  const info = document.getElementById('breathInfo');
  if (info) info.innerHTML = `<p>${desc}</p>`;
};

function setBreathRounds(n) {
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

function adjustBreathRounds(delta) {
  const input = document.getElementById('breathRounds');
  const current = parseInt(input?.value || '3');
  window.setBreathRounds(current + delta);
};

let _retentionResolve = null;
function triggerRecoveryBreath() {
  if (_retentionResolve) {
    _retentionResolve();
    _retentionResolve = null;
  }
};

async function startBreathing() {
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
        ${s.retentions.map((sec, idx) => `<span style="background:rgba(55,211,153,0.1); border:1px solid rgba(55,211,153,0.25); border-radius:6px; padding:2px 6px;">T${idx + 1}: <strong>${Math.floor(sec / 60)}m${(sec % 60).toString().padStart(2, '0')}s</strong></span>`).join('')}
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

// ═══════ DYNAMIC WISDOM CAPSULE & GRIMOIRE ENGINE ═══════
let _currentWisdom = null;
let _wisdomFavorites = JSON.parse(localStorage.getItem('vital_wisdom_favorites') || '[]');

function renderWisdomCapsule(wisdomItem = null) {
  const item = wisdomItem || getDailyWisdom();
  if (!item) return;
  _currentWisdom = item;

  const avatar = document.getElementById('wisdomAuthorAvatar');
  const name = document.getElementById('wisdomAuthorName');
  const work = document.getElementById('wisdomWorkName');
  const quote = document.getElementById('wisdomQuoteText');
  const action = document.getElementById('wisdomTipAction');
  const pill = document.getElementById('wisdomCategoryPill');
  const favBtn = document.getElementById('wisdomFavoriteBtn');
  const favIcon = document.getElementById('wisdomFavoriteIcon');

  if (avatar) {
    avatar.textContent = item.authorAvatar;
    avatar.style.borderColor = `${item.authorColor}55`;
    avatar.style.background = `${item.authorColor}18`;
  }
  if (name) name.textContent = item.author;
  if (work) work.textContent = item.work;
  if (quote) quote.textContent = `« ${item.quote} »`;
  if (action) action.textContent = item.actionableTip;
  if (pill) {
    pill.textContent = item.categoryLabel;
    pill.style.borderColor = `${item.authorColor}44`;
    pill.style.color = item.authorColor;
  }

  const isFav = _wisdomFavorites.includes(item.id);
  if (favBtn && favIcon) {
    if (isFav) {
      favBtn.classList.add('active-fav');
      favIcon.className = 'ri-star-fill';
    } else {
      favBtn.classList.remove('active-fav');
      favIcon.className = 'ri-star-line';
    }
  }
}
window.renderWisdomCapsule = renderWisdomCapsule;

function shuffleWisdomCapsule() {
  const quoteBox = document.getElementById('wisdomQuoteBox');
  if (quoteBox) {
    quoteBox.style.opacity = '0.3';
    quoteBox.style.transform = 'scale(0.98)';
  }
  setTimeout(() => {
    const next = getRandomWisdom();
    renderWisdomCapsule(next);
    if (quoteBox) {
      quoteBox.style.opacity = '1';
      quoteBox.style.transform = 'scale(1)';
    }
  }, 180);
}
window.shuffleWisdomCapsule = shuffleWisdomCapsule;

function toggleWisdomFavorite() {
  if (!_currentWisdom) return;
  const id = _currentWisdom.id;
  const idx = _wisdomFavorites.indexOf(id);
  if (idx > -1) {
    _wisdomFavorites.splice(idx, 1);
  } else {
    _wisdomFavorites.push(id);
  }
  localStorage.setItem('vital_wisdom_favorites', JSON.stringify(_wisdomFavorites));
  renderWisdomCapsule(_currentWisdom);
}
window.toggleWisdomFavorite = toggleWisdomFavorite;

function searchWisdomInDocs() {
  if (!_currentWisdom || !_currentWisdom.searchQuery) return;
  const query = _currentWisdom.searchQuery;
  showPage('resources');
  setTimeout(() => {
    const input = document.getElementById('mediaSearchInput');
    if (input) {
      input.value = query;
      if (typeof window.searchMediaResources === 'function') {
        window.searchMediaResources(query);
      }
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  }, 120);
}
window.searchWisdomInDocs = searchWisdomInDocs;

// ── Grimoire de Sagesse Modal ──
function openWisdomGrimoireModal() {
  const modal = document.getElementById('wisdomGrimoireModal');
  if (!modal) return;
  modal.style.display = 'flex';
  filterWisdomGrimoire();
}
window.openWisdomGrimoireModal = openWisdomGrimoireModal;

function closeWisdomGrimoireModal(e) {
  if (e && e.target && e.target.id !== 'wisdomGrimoireModal' && !e.target.closest('.modal-close-btn')) return;
  const modal = document.getElementById('wisdomGrimoireModal');
  if (modal) modal.style.display = 'none';
}
window.closeWisdomGrimoireModal = closeWisdomGrimoireModal;

function filterWisdomGrimoire() {
  const grid = document.getElementById('wisdomGrimoireGrid');
  if (!grid) return;

  const searchInput = document.getElementById('wisdomGrimoireSearch');
  const authorSelect = document.getElementById('wisdomAuthorFilter');
  const catSelect = document.getElementById('wisdomCategoryFilter');

  const q = (searchInput ? searchInput.value : '').toLowerCase().trim();
  const author = authorSelect ? authorSelect.value : 'all';
  const cat = catSelect ? catSelect.value : 'all';

  let items = VITALIST_WISDOM;

  if (author !== 'all') {
    items = items.filter(w => w.author.toLowerCase().includes(author));
  }
  if (cat === 'favorites') {
    items = items.filter(w => _wisdomFavorites.includes(w.id));
  } else if (cat !== 'all') {
    items = items.filter(w => w.category === cat);
  }
  if (q) {
    items = items.filter(w =>
      w.quote.toLowerCase().includes(q) ||
      w.actionableTip.toLowerCase().includes(q) ||
      w.author.toLowerCase().includes(q) ||
      w.work.toLowerCase().includes(q) ||
      w.categoryLabel.toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-dim);">Aucun précepte ne correspond à vos filtres.</div>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="wisdom-grimoire-card" onclick="window.selectWisdomFromGrimoire('${item.id}')" style="cursor:pointer;" title="Afficher sur le tableau de bord">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem;">${item.authorAvatar}</span>
          <div>
            <div style="font-weight:700; font-size:0.86rem; color:var(--text);">${item.author}</div>
            <div style="font-size:0.72rem; color:var(--text-dim);">${item.work}</div>
          </div>
        </div>
        <span class="wisdom-category-pill" style="color:${item.authorColor}; border-color:${item.authorColor}44;">${item.categoryLabel}</span>
      </div>
      <p style="font-size:0.86rem; font-style:italic; line-height:1.45; color:var(--text); margin:0;">
        « ${item.quote} »
      </p>
      <div style="font-size:0.78rem; background:rgba(16,185,129,0.06); border-radius:8px; padding:8px 10px; border-left:3px solid ${item.authorColor};">
        <strong>Application :</strong> ${item.actionableTip}
      </div>
    </div>
  `).join('');
}
window.filterWisdomGrimoire = filterWisdomGrimoire;

function selectWisdomFromGrimoire(id) {
  const item = VITALIST_WISDOM.find(w => w.id === id);
  if (item) {
    renderWisdomCapsule(item);
    const modal = document.getElementById('wisdomGrimoireModal');
    if (modal) modal.style.display = 'none';
  }
}
window.selectWisdomFromGrimoire = selectWisdomFromGrimoire;

function initSmartInsight() {
  renderWisdomCapsule();
}
window.initSmartInsight = initSmartInsight;

// ═══════ SCANNER IA ═══════
let _scanMascotRenderer = null;
function handleScanUpload(event) {
  if (!requireAuthForAi("le Scanner Visuel & Analyse de Repas IA")) {
    if (event && event.target) event.target.value = '';
    return;
  }
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
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
      const userLang = getLanguage();
      let query = `Analyse cette photo de repas/aliment avec une rigueur absolue.
Identifie clairement les ingrédients visibles, leur statut vitaliste (Dr. Sebi / Arnold Ehret : mucogène, hybride ou électrique), l'indice PRAL estimé (+/- mEq/100g), l'impact sur la lymphe et les reins, et propose des substituts vivants pour électriser le plat.
Inclus un bloc json avec "actionMeal" (avec nom, catégorie, emoji, items, note) et "suggestFoods" (tableau des 5 ingrédients vivants recommandés).`;

      if (userLang === 'en') {
        query = `Analyze this meal/food photo with absolute scientific and vitalist rigor.
Clearly identify visible ingredients, their vitalist classification (Dr. Sebi / Arnold Ehret: mucus-forming, hybrid, or electric), estimated renal PRAL (+/- mEq/100g), lymphatic impact, and suggest living substitutes to electrify the dish.
Include a json block with "actionMeal" (name, category, emoji, items, note) and "suggestFoods" (5 recommended living foods).`;
      } else if (userLang === 'es') {
        query = `Analiza esta foto de comida/plato con absoluto rigor vitalista y científico.
Identifica claramente los ingredientes visibles, su estado vitalista (Dr. Sebi / Arnold Ehret: mucógeno, híbrido o eléctrico), índice PRAL estimado (+/- mEq/100g), impacto en la linfa y los riñones, y propón sustitutos vivos para electrificar el plato.
Incluye un bloque json con "actionMeal" (nombre, categoría, emoji, items, nota) y "suggestFoods" (5 alimentos vivos recomendados).`;
      } else if (userLang === 'fr-CA') {
        query = `Analyse cette photo de repas/aliment avec une rigueur absolue (en utilisant les termes botaniques et de repas du Québec/Canada 🍁 : bleuets, canneberges, courges, déjeuner/dîner/souper).
Identifie clairement les ingrédients visibles, leur statut vitaliste (Dr. Sebi / Arnold Ehret : mucogène, hybride ou électrique), l'indice PRAL estimé (+/- mEq/100g), l'impact sur la lymphe et les reins, et propose des substituts vivants pour électriser le plat.
Inclus un bloc json avec "actionMeal" (avec nom, catégorie, emoji, items, note) et "suggestFoods" (tableau des 5 ingrédients vivants recommandés).`;
      }

      const profile = getUserProfile();

      const resp = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          query,
          profile,
          language: userLang,
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

function askAIAboutScannedDish(dishName) {
  showPage('chat');
  setChatContext({
    type: 'dish_scan',
    icon: '🥗',
    label: 'Plat scanné',
    subject: dishName,
    placeholder: `Comment compenser ce plat ou l'adapter ?`,
    buildPrompt: (userText) => `J'ai scanné mon plat "${dishName}". Peux-tu m'expliquer en détail comment compenser ses effets mucogènes et acidifiants avec des tisanes drainantes et une transition alimentaire adaptée ? ${userText ? `Précision de l'utilisateur : ${userText}` : ''}`
  });
};

// ═══════ UTILS ═══════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function formatModelName(rawName) {
  if (!rawName || rawName === 'Inconnu' || rawName === 'auto') return 'Gemini 3.7 Flash';
  const clean = rawName.replace(/^models\//, '');
  if (clean.includes('3.7-flash') || clean.includes('3.6-flash') || clean.includes('3-flash')) return 'Gemini 3.7 Flash';
  if (clean.includes('2.5-flash')) return 'Gemini 2.5 Flash';
  if (clean.includes('2.5-pro') || clean.includes('3.1-pro') || clean.includes('pro')) return 'Gemini Pro AI';
  if (clean.includes('1.5-flash')) return 'Gemini 1.5 Flash';
  if (clean.includes('1.5-pro')) return 'Gemini 1.5 Pro';
  if (clean.includes('gemma')) return 'Gemma 2';
  return clean;
}
window.formatModelName = formatModelName;

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
        const safeMealName = (meal.name || 'ce repas').replace(/'/g, "\\'");

        renderedCards += `<div class="ai-plan-card glass" style="margin:12px 0;padding:16px;border-radius:14px;border-left:4px solid var(--accent);background:rgba(55,211,153,0.06)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-weight:700;font-size:1.05rem;color:var(--text)">${meal.emoji || '🍲'} ${esc(meal.name || 'Repas Proposé')}</span>
            <span class="food-badge badge-electric" style="font-size:0.75rem">${esc(catLabel)}</span>
          </div>
          <div style="font-size:0.88rem;color:var(--text);margin-bottom:8px">
            <div style="font-weight:600; margin-bottom:4px; color:var(--text-dim); font-size:0.8rem;">Ingrédients :</div>
            <div style="display:flex; flex-wrap:wrap; gap:2px;">${itemsPills}</div>
          </div>
          ${meal.note ? `<div style="font-size:0.82rem;color:var(--text-dim);margin-bottom:12px;font-style:italic">🌿 ${esc(meal.note)}</div>` : ''}
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
            <button class="btn btn-primary" onclick="handleAddActionMeal('${encodedMeal}')" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:10px;font-size:0.88rem;">
              <i class="ri-restaurant-line"></i> Enregistrer ce repas aux logs du jour
            </button>
            <button type="button" class="btn-secondary" onclick="openMealCustomizer('${safeMealName}')" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:0.84rem;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:var(--text);cursor:pointer;">
              <i class="ri-shuffle-line"></i> 🔄 Personnaliser / Remplacer
            </button>
          </div>
          <div style="margin-top:10px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
            <span style="font-size:0.72rem; color:var(--text-dim); margin-right:4px;">Ajustements rapides :</span>
            <button type="button" class="quick-reply-chip" onclick="askMealVariant('${safeMealName}', 'fridge')" style="font-size:0.74rem; padding:3px 10px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--text-dim); cursor:pointer;">
              🥑 Avec mon frigo
            </button>
            <button type="button" class="quick-reply-chip" onclick="askMealVariant('${safeMealName}', 'raw')" style="font-size:0.74rem; padding:3px 10px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--text-dim); cursor:pointer;">
              🌿 Version 100% crue
            </button>
            <button type="button" class="quick-reply-chip" onclick="askMealVariant('${safeMealName}', 'transition')" style="font-size:0.74rem; padding:3px 10px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--text-dim); cursor:pointer;">
              🐟 Aliment de transition
            </button>
          </div>
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

  // Handle headings from ###### down to #
  text = text
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">')
    .replace(/^######\s*(.*$)/gm, '<h6 style="margin:10px 0 4px 0;color:var(--text-dim);font-size:0.9rem;font-weight:700;">$1</h6>')
    .replace(/^#####\s*(.*$)/gm, '<h5 style="margin:12px 0 4px 0;color:var(--text-dim);font-size:0.95rem;font-weight:700;">$1</h5>')
    .replace(/^####\s*(.*$)/gm, '<h4 style="margin:14px 0 6px 0;color:var(--text);font-size:1.0rem;font-weight:700;">$1</h4>')
    .replace(/^###\s*(.*$)/gm, '<h4 style="margin:14px 0 6px 0;color:var(--accent,#34d399);font-size:1.05rem;font-weight:700;">$1</h4>')
    .replace(/^##\s*(.*$)/gm, '<h3 style="margin:16px 0 8px 0;color:var(--text);font-size:1.15rem;font-weight:700;">$1</h3>')
    .replace(/^#\s*(.*$)/gm, '<h2 style="margin:18px 0 10px 0;color:var(--text);font-size:1.25rem;font-weight:700;">$1</h2>')
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre style="background:rgba(0,0,0,0.3);padding:10px 14px;border-radius:10px;overflow-x:auto;margin:8px 0;"><code>${esc(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-size:0.9em;">$1</code>')
    .replace(/^\s*[\*\-]\s+(.*$)/gm, '<li style="margin-bottom:4px;line-height:1.5;">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0 10px 0;">$1</ul>')
    .replace(/<\/ul>\s*<ul[^>]*>/g, '')
    // Bold: complete inline/multiline pairs
    .replace(/\*\*([\s\S]*?)\*\*/g, '<strong style="color:var(--text);font-weight:700;">$1</strong>')
    // Bold: unclosed asterisks at end of lines or streaming chunks (e.g. **word...)
    .replace(/\*\*([^\*\n<]+)(?=\n|<|$)/g, '<strong style="color:var(--text);font-weight:700;">$1</strong>')
    // Italics
    .replace(/\*([^\*\n<]+)\*/g, '<em style="color:rgba(255,255,255,0.9);">$1</em>')
    // Clean any remaining orphaned asterisks
    .replace(/\*\*/g, '')
    .replace(/\n\n+/g, '</p><p style="margin-bottom:10px;line-height:1.6;">')
    .replace(/\n/g, '<br>');

  return text;
}

function cleanMarkdownFormatting(txt) {
  if (!txt) return '';
  return txt
    .replace(/[*_#`~]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function getMatchCenteredSnippet(fullText, fallbackExcerpt, query) {
  const sourceText = cleanMarkdownFormatting(fullText || fallbackExcerpt || '');
  if (!query || !query.trim()) {
    return sourceText.length > 260 ? sourceText.slice(0, 260) + '…' : sourceText;
  }

  const tokens = typeof getExpandedSearchTokens === 'function' ? getExpandedSearchTokens(query) : [query.trim()];
  const lower = sourceText.toLowerCase();

  let bestIdx = -1;
  let bestTokenLen = 0;

  for (const token of tokens) {
    if (!token || token.length < 2) continue;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped, 'i');
    const match = regex.exec(sourceText);
    if (match) {
      if (bestIdx === -1 || match.index < bestIdx) {
        bestIdx = match.index;
        bestTokenLen = token.length;
      }
    }
  }

  if (bestIdx === -1) {
    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      const idx = lower.indexOf(token.toLowerCase());
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestTokenLen = token.length;
      }
    }
  }

  if (bestIdx === -1) {
    return sourceText.length > 260 ? sourceText.slice(0, 260) + '…' : sourceText;
  }

  const start = Math.max(0, bestIdx - 50);
  const end = Math.min(sourceText.length, bestIdx + bestTokenLen + 200);
  let snippet = sourceText.substring(start, end).trim();

  if (start > 0) snippet = '… ' + snippet;
  if (end < sourceText.length) snippet = snippet + ' …';

  return snippet;
}

function highlightMatches(text, query) {
  if (!text) return '';
  const clean = cleanMarkdownFormatting(text);
  if (!query || !query.trim()) return esc(clean);
  
  const tokens = typeof getExpandedSearchTokens === 'function'
    ? getExpandedSearchTokens(query)
    : query.trim().split(/\s+/).filter(t => t.length > 1);

  if (!tokens || tokens.length === 0) return esc(clean);

  let escapedText = esc(clean);
  const sortedTokens = [...tokens].sort((a, b) => b.length - a.length);

  for (const token of sortedTokens) {
    if (token.length < 2) continue;
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = token.length <= 4 ? `\\b(${escapedToken})\\b` : `(${escapedToken})`;
    const regex = new RegExp(pattern, 'gi');
    escapedText = escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  return escapedText;
}

// ═══════ PROACTIVE MASCOT & RICH SPEECH BUBBLE ═══════
function renderMascotSpeechBubble(text, mood = 'talking') {
  const bubble = document.getElementById('mascotSpeechBubble') || document.getElementById('greetingContext');
  if (!bubble) return;

  // Clean text from any legacy markup prefix and any existing outer quotes («, », ", “, ”)
  let cleanText = (text || '')
    .replace(/^[💬🐦]\s*(<strong>.*?<\/strong>)?\s*[:«"“]?\s*/i, '')
    .replace(/^[\s«"“\u00AB\u201C\u2018]+|[\s»"”\u00BB\u201D\u2019]+$/g, '')
    .trim();
  if (!cleanText) cleanText = text;

  const moodBadges = {
    excited: { label: 'Énergie', icon: 'ri-flashlight-fill' },
    proud: { label: 'Bravo', icon: 'ri-award-fill' },
    loving: { label: 'Détox', icon: 'ri-drop-fill' },
    sleepy: { label: 'Régénération', icon: 'ri-moon-fill' },
    talking: { label: 'Conseil', icon: 'ri-sparkling-fill' },
    walk: { label: 'Lymphe & Marche', icon: 'ri-walk-fill' },
    laugh: { label: 'Vitalité', icon: 'ri-emotion-happy-fill' },
    celebrate: { label: 'Victoire', icon: 'ri-magic-fill' },
    coo: { label: 'Roucoulement', icon: 'ri-chat-voice-fill' },
    think: { label: 'Connaissance', icon: 'ri-brain-line' }
  };
  const b = moodBadges[mood] || { label: 'Conseil', icon: 'ri-sparkling-fill' };

  bubble.innerHTML = `
    <div class="speech-bubble-header">
      <div class="speech-bubble-sender">
        <span class="speech-bubble-avatar">🕊️</span>
        <span class="speech-bubble-name">Vital · Guide Biologique</span>
      </div>
      <span class="speech-bubble-badge">
        <i class="${b.icon}"></i> ${b.label}
      </span>
    </div>
    <div class="speech-bubble-text">
      « ${cleanText} »
    </div>
  `;
}
window.renderMascotSpeechBubble = renderMascotSpeechBubble;

function updateProactiveMascot(actionContext = null) {
  const hour = new Date().getHours();
  let msg = '';
  let mood = 'talking';

  if (actionContext === 'scan') {
    msg = "Bravo pour ce scan ! Vérifie bien l'indice PRAL (acidité) et la charge vitale de cet aliment. 🍎";
    mood = 'excited';
  } else if (actionContext === 'meal') {
    msg = "Repas enregistré ! N'oublie pas de bien mastiquer pour faciliter l'assimilation enzymatique. 🥗";
    mood = 'proud';
  } else if (actionContext === 'fast_start') {
    msg = "C'est parti pour le jeûne ! Ton organisme enclenche son processus d'autophagie et de drainage cellulaire. 💧";
    mood = 'loving';
  } else {
    // Time-based circadian messages
    if (hour >= 4 && hour < 12) {
      msg = currentProtocol === 'vitalist'
        ? "Matinée d'élimination : L'organisme filtre les toxines. Privilégie l'hydratation, les tisanes et les fruits aqueux. 🍋"
        : "Bonjour ! Pense à bien réhydrater tes cellules dès le réveil avec une eau pure et vivante. 💧";
      mood = 'excited';
    } else if (hour >= 12 && hour < 20) {
      msg = "Journée d'appropriation : Le feu digestif est au maximum ! Moment propice pour des repas vivants et nourrissants. 🍉";
      mood = 'talking';
    } else {
      msg = "Soirée d'assimilation : Mets le système digestif au repos pour permettre la réparation cellulaire nocturne. 🌙";
      mood = 'sleepy';
    }
  }

  renderMascotSpeechBubble(msg, mood);

  if (window.appMascot) {
    window.appMascot.setMood(mood, true);
    setTimeout(() => {
      if (window.appMascot) window.appMascot.setMood(mood, false);
    }, 4000);
  }
};

// ═══════ MULTIMEDIA & PDF DEEP-SEARCH ENGINE ═══════

let _mediaSearchQuery = '';
let _mediaSearchFilter = 'all';
let _mediaSearchDebounceTimer = null;

function formatSeconds(secs) {
  const s = Math.max(0, Math.floor(secs || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const remSecs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  }
  return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
}

function searchMediaResources(query) {
  const q = (query || '').trim();
  _mediaSearchQuery = q;

  const clearBtn = document.getElementById('mediaSearchClearBtn');
  if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

  clearTimeout(_mediaSearchDebounceTimer);
  _mediaSearchDebounceTimer = setTimeout(() => {
    _renderMediaSearchResults();
  }, 180);
};

function setMediaSearchFilter(filter) {
  _mediaSearchFilter = filter;
  _renderMediaSearchResults();
};

function applyMediaTopicTag(tag) {
  const input = document.getElementById('mediaSearchInput');
  if (input) {
    input.value = tag;
    window.searchMediaResources(tag);
    input.focus();
  }
};

function clearMediaSearch() {
  const input = document.getElementById('mediaSearchInput');
  if (input) {
    input.value = '';
    _mediaSearchQuery = '';
    _mediaSearchFilter = 'all';
    const clearBtn = document.getElementById('mediaSearchClearBtn');
    if (clearBtn) clearBtn.style.display = 'none';
    _renderMediaSearchResults();
  }
};

function _renderMediaSearchResults() {
  const resultsContainer = document.getElementById('mediaSearchResultsContainer');
  const standardCatalog = document.getElementById('mediaStandardCatalog');
  const countBadge = document.getElementById('mediaResultCountBadge');

  // Si aucune recherche saisie, on affiche le catalogue principal propre (ouvrages + vidéos)
  if (!_mediaSearchQuery) {
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
    if (standardCatalog) standardCatalog.style.display = 'block';
    if (countBadge) countBadge.style.display = 'none';
    return;
  }

  // Mode recherche active : on cache le catalogue et on affiche les résultats ciblés
  if (standardCatalog) standardCatalog.style.display = 'none';
  if (resultsContainer) resultsContainer.style.display = 'block';

  const allMatches = searchMediaKnowledge(_mediaSearchQuery, 'all');
  const pdfMatches = allMatches.filter(item => item.type === 'pdf');
  const videoMatches = allMatches.filter(item => item.type === 'video');

  let displayMatches = allMatches;
  if (_mediaSearchFilter === 'pdf') {
    displayMatches = pdfMatches;
  } else if (_mediaSearchFilter === 'video') {
    displayMatches = videoMatches;
  }

  if (countBadge) {
    countBadge.style.display = 'inline-block';
    countBadge.textContent = `${allMatches.length} résultat${allMatches.length > 1 ? 's' : ''}`;
  }

  if (allMatches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="dash-card glass" style="text-align:center; padding:40px 20px; border-radius:16px;">
        <div style="font-size:2.4rem; margin-bottom:10px;">🔍</div>
        <h3 style="color:var(--text); font-size:1.1rem; margin-bottom:6px;">Aucun résultat pour « ${esc(_mediaSearchQuery)} »</h3>
        <p style="color:var(--text-dim); font-size:0.85rem; max-width:480px; margin:0 auto 18px; line-height:1.5;">
          Aucun passage de livre ni extrait vidéo ne correspond à ce terme. Essayez un autre mot-clé (ex: <em>yeux, intestins, colon, crohn, reins, mucus, jeûne, autophagie, dr sebi</em>).
        </p>
        <button type="button" class="btn-secondary" onclick="clearMediaSearch()" style="display:inline-flex; align-items:center; gap:6px; margin:0 auto;">
          <i class="ri-refresh-line"></i> Revenir au catalogue complet
        </button>
      </div>
    `;
    return;
  }

  const limitedMatches = displayMatches.slice(0, 50);

  resultsContainer.innerHTML = `
    <!-- Barre de Filtrage des Résultats de Recherche -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px; padding:12px 16px; background:var(--surface-2); border:1px solid var(--border); border-radius:12px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:0.88rem; font-weight:700; color:var(--text);">
          🎯 ${allMatches.length} passage${allMatches.length > 1 ? 's' : ''} trouvé${allMatches.length > 1 ? 's' : ''} pour « <span style="color:var(--accent);">${esc(_mediaSearchQuery)}</span> »
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <button type="button" class="btn-tab ${_mediaSearchFilter === 'all' ? 'active' : ''}" style="padding:5px 12px; font-size:0.78rem;" onclick="setMediaSearchFilter('all')">
          🌟 Tous (${allMatches.length})
        </button>
        <button type="button" class="btn-tab ${_mediaSearchFilter === 'pdf' ? 'active' : ''}" style="padding:5px 12px; font-size:0.78rem;" onclick="setMediaSearchFilter('pdf')">
          📖 Livres & PDF (${pdfMatches.length})
        </button>
        <button type="button" class="btn-tab ${_mediaSearchFilter === 'video' ? 'active' : ''}" style="padding:5px 12px; font-size:0.78rem;" onclick="setMediaSearchFilter('video')">
          🎬 Vidéos (${videoMatches.length})
        </button>
        <button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.78rem; display:inline-flex; align-items:center; gap:4px;" onclick="clearMediaSearch()" title="Fermer la recherche">
          <i class="ri-close-line"></i> Fermer
        </button>
      </div>
    </div>

    <!-- Grille des Résultats -->
    <div class="media-results-grid">
      ${limitedMatches.map(item => renderMediaResultCard(item, _mediaSearchQuery)).join('')}
    </div>

    ${displayMatches.length > 50 ? `
      <div style="text-align:center; padding:16px; color:var(--text-dim); font-size:0.8rem;">
        Affichage des 50 premiers résultats les plus pertinents sur ${displayMatches.length}.
      </div>
    ` : ''}
  `;
}

function renderMediaResultCard(item, query) {
  if (item.type === 'video') {
    const displayExcerpt = getMatchCenteredSnippet(item.fullText, item.excerpt, query);
    return `
      <div class="media-result-card glass" style="border-left: 3px solid var(--accent);">
        <div>
          <div class="media-card-type-header">
            <span class="media-card-source"><i class="ri-video-fill" style="color:var(--accent);"></i> ${esc(item.source)}</span>
            <span class="timestamp-pill" onclick="playVideoAtTimestamp('${esc(item.mediaUrl)}', ${item.timeSeconds}, '${esc(item.title)}', '${item.videoType}', '${item.youtubeId || ''}', '${esc(item.chapter)}', '${esc(item.source)}')">
              <i class="ri-play-fill"></i> ${item.timeFormatted}
            </span>
          </div>

          <h3 class="media-card-title">${highlightMatches(item.title, query)}</h3>
          <div class="media-card-chapter">
            <i class="ri-movie-line"></i> ${highlightMatches(item.chapter, query)}
          </div>

          <div class="media-card-excerpt">
            ${highlightMatches(displayExcerpt, query)}
          </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:auto; align-items:center;">
          <button type="button" class="btn-primary" style="flex:1; padding:8px 12px; font-size:0.82rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px;" onclick="playVideoAtTimestamp('${esc(item.mediaUrl)}', ${item.timeSeconds}, '${esc(item.title)}', '${item.videoType}', '${item.youtubeId || ''}', '${esc(item.chapter)}', '${esc(item.source)}')">
            <i class="ri-play-circle-fill"></i> Sauter à ${item.timeFormatted}
          </button>
          ${item.mediaUrl.startsWith('http') ? `
            <a href="${item.mediaUrl}&t=${item.timeSeconds}s" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding:8px 10px; font-size:0.8rem; text-decoration:none;" title="Ouvrir sur YouTube">
              <i class="ri-external-link-line"></i>
            </a>
          ` : ''}
        </div>
      </div>
    `;
  } else {
    // PDF Card with Match-Centered Dynamic Snippet & Exact Real PDF Page Number
    const displayExcerpt = getMatchCenteredSnippet(item.fullText, item.excerpt, query);
    return `
      <div class="media-result-card glass" style="border-left: 3px solid #38bdf8;">
        <div>
          <div class="media-card-type-header">
            <span class="media-card-source" style="color:#38bdf8;"><i class="ri-book-2-fill"></i> Ouvrage Fondateur</span>
            <span class="pdf-page-pill" onclick="openPdfPassageModal('${item.id}')">
              <i class="ri-file-pdf-line"></i> Page ${item.pageNumber}
            </span>
          </div>

          <h3 class="media-card-title">${highlightMatches(item.title, query)}</h3>
          <div class="media-card-chapter" style="color:#38bdf8;">
            <i class="ri-bookmark-3-line"></i> ${highlightMatches(item.chapterTitle || '', query)}
          </div>

          <div class="media-card-excerpt" style="border-left-color:#38bdf8;">
            ${highlightMatches(displayExcerpt, query)}
          </div>
        </div>

        <div style="display:flex; gap:8px; margin-top:auto; align-items:center;">
          <button type="button" class="btn-secondary" style="flex:1; padding:8px 12px; font-size:0.82rem; font-weight:600; display:inline-flex; align-items:center; justify-content:center; gap:6px;" onclick="openPdfPassageModal('${item.id}')">
            <i class="ri-eye-line"></i> Lire le passage
          </button>
          <a href="${item.pdfUrl}#page=${item.pageNumber}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="flex:1; padding:8px 12px; font-size:0.82rem; font-weight:700; text-decoration:none; text-align:center; display:inline-flex; align-items:center; justify-content:center; gap:6px; background:#0284c7; border-color:#0284c7;">
            <i class="ri-file-pdf-fill"></i> Page ${item.pageNumber} <i class="ri-arrow-right-up-line"></i>
          </a>
        </div>
      </div>
    `;
  }
}

// ═══════ VIDEO TIMESTAMP PLAYER MODAL & PLAYBACK ═══════
function playVideoAtTimestamp(mediaUrl, seconds = 0, title = '', type = 'local', youtubeId = '', chapter = '', source = '') {
  const modal = document.getElementById('mediaVideoModal');
  const modalSource = document.getElementById('mediaVideoModalSource');
  const modalTitle = document.getElementById('mediaVideoModalTitle');
  const modalChapter = document.getElementById('mediaVideoModalChapter');
  const playerContainer = document.getElementById('mediaVideoPlayerContainer');
  const timelineContainer = document.getElementById('mediaVideoTimelineChapters');
  const timelineSection = document.getElementById('mediaVideoTimelineSection');

  if (!modal || !playerContainer) return;

  if (modalSource) modalSource.textContent = source || (type === 'youtube' ? 'Documentaire YouTube' : 'Média Local HD');
  if (modalTitle) modalTitle.textContent = title || 'Lecture Vidéo';
  if (modalChapter) modalChapter.innerHTML = chapter ? `<span class="timestamp-pill" style="margin-right:6px;"><i class="ri-play-fill"></i> ${formatSeconds(seconds)}</span> ${esc(cleanMarkdownFormatting(chapter))}` : '';

  // Find all chapters of this media in database for the scrubber bar
  const relatedChapters = MEDIA_SEARCH_DATABASE.filter(item => 
    item.type === 'video' && ((youtubeId && item.youtubeId === youtubeId) || (mediaUrl && item.mediaUrl === mediaUrl))
  ).sort((a, b) => a.timeSeconds - b.timeSeconds);

  if (timelineContainer && timelineSection) {
    if (relatedChapters.length > 0) {
      timelineSection.style.display = 'block';
      timelineContainer.innerHTML = relatedChapters.map(c => `
        <button type="button" class="media-chapter-btn ${c.timeSeconds === seconds ? 'active' : ''}" onclick="playVideoAtTimestamp('${esc(c.mediaUrl)}', ${c.timeSeconds}, '${esc(c.title)}', '${c.videoType}', '${c.youtubeId || ''}', '${esc(c.chapter)}', '${esc(c.source)}')">
          ▶ ${c.timeFormatted} · ${esc(cleanMarkdownFormatting(c.chapter))}
        </button>
      `).join('');
    } else {
      timelineSection.style.display = 'none';
      timelineContainer.innerHTML = '';
    }
  }

  // Inject video player (YouTube iframe or Native HTML5 Video)
  if (type === 'youtube' && youtubeId) {
    playerContainer.innerHTML = `
      <iframe 
        id="mediaYoutubeIframe"
        src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${seconds}" 
        title="${esc(title)}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen
        style="width:100%; height:100%; min-height:360px; border:none; border-radius:12px;"
      ></iframe>
    `;
  } else {
    playerContainer.innerHTML = `
      <video id="mediaHtml5Video" controls autoplay playsinline style="width:100%; height:100%; min-height:340px; border-radius:12px; background:#000;">
        <source src="${esc(mediaUrl)}" type="video/mp4">
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
    `;
    const videoEl = document.getElementById('mediaHtml5Video');
    if (videoEl) {
      const applyTime = () => {
        try {
          videoEl.currentTime = Number(seconds) || 0;
          videoEl.play().catch(() => {});
        } catch (e) {}
      };
      if (videoEl.readyState >= 1) {
        applyTime();
      } else {
        videoEl.addEventListener('loadedmetadata', applyTime, { once: true });
        videoEl.addEventListener('canplay', applyTime, { once: true });
      }
    }
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

let videoTimeSyncInterval = null;

function closeMediaVideoModal(e) {
  if (typeof videoTimeSyncInterval !== 'undefined' && videoTimeSyncInterval) {
    clearInterval(videoTimeSyncInterval);
    videoTimeSyncInterval = null;
  }
  dubbingEngine.destroy();

  const modal = document.getElementById('mediaVideoModal');
  const playerContainer = document.getElementById('mediaVideoPlayerContainer');
  if (playerContainer) {
    const vid = playerContainer.querySelector('video');
    if (vid) {
      try {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      } catch (err) {}
    }
    const iframe = playerContainer.querySelector('iframe');
    if (iframe) {
      iframe.src = '';
    }
    playerContainer.innerHTML = '';
  }
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('mediaVideoModal');
      if (modal && modal.style.display !== 'none') {
        closeMediaVideoModal();
      }
    }
  });
}

// ═══════ PDF PASSAGE MODAL ═══════
function openPdfPassageModal(itemId) {
  const item = MEDIA_SEARCH_DATABASE.find(i => i.id === itemId);
  const modal = document.getElementById('pdfPassageModal');
  const content = document.getElementById('pdfPassageModalContent');
  if (!item || !modal || !content) return;

  const displayExcerpt = cleanMarkdownFormatting(item.fullText || item.excerpt || '');

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-right:48px; gap:12px; flex-wrap:wrap;">
      <div style="flex:1; min-width:220px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
          <span class="badge ${item.badgeClass || 'badge-success'}">📚 Ouvrage Fondateur</span>
          <span class="badge" style="background:${item.lang === 'fr' ? 'rgba(52,211,153,0.14)' : 'rgba(56,189,248,0.14)'}; color:${item.lang === 'fr' ? '#34d399' : '#38bdf8'}; border:1px solid ${item.lang === 'fr' ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.3)'}; font-size:0.75rem; font-weight:700;">
            ${item.lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
          </span>
        </div>
        <h3 style="margin:0 0 4px 0; font-size:1.15rem; color:var(--text); font-weight:800; line-height:1.3;">${highlightMatches(item.title, _mediaSearchQuery)}</h3>
        <div style="font-size:0.82rem; color:var(--accent); font-weight:600;"><i class="ri-quill-pen-line"></i> Auteur : <span style="color:var(--text);">${esc(item.author || 'Inconnu')}</span></div>
      </div>
      <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
        <span class="pdf-page-pill" style="font-size:0.85rem; padding:6px 14px; white-space:nowrap; flex-shrink:0;">
          <i class="ri-book-open-line"></i> Page ${item.pageNumber}
        </span>
      </div>
    </div>

    <div style="background:rgba(16,185,129,0.08); border-left:3px solid var(--accent); padding:14px 16px; border-radius:12px; margin-bottom:18px;">
      <div style="font-size:0.88rem; font-weight:700; color:var(--text); margin-bottom:6px;">${highlightMatches(item.chapterTitle || '', _mediaSearchQuery)}</div>
      <p style="font-size:0.92rem; color:var(--text); line-height:1.6; margin:0; font-style:italic;">
        « ${highlightMatches(displayExcerpt, _mediaSearchQuery)} »
      </p>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px;">
      <a href="${item.pdfUrl}#page=${item.pageNumber}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="flex:1; min-width:180px; text-align:center; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:10px 16px; font-weight:700; border-radius:10px;">
        <i class="ri-file-pdf-fill"></i> Ouvrir le PDF à la Page ${item.pageNumber}
      </a>
      <a href="${item.pdfUrl}" download class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:10px 16px; font-weight:600; border-radius:10px;" title="Télécharger le fichier PDF">
        <i class="ri-download-2-line"></i> Télécharger
      </a>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};

function closePdfPassageModal(e) {
  if (e && e.target && e.target.closest('.modal-card') && !e.target.closest('.modal-close-btn')) {
    return;
  }
  const modal = document.getElementById('pdfPassageModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
};

let _resourcesCatalogTab = 'fr';

function setResourcesCatalogTab(tab) {
  _resourcesCatalogTab = tab;
  window.renderResources();
};

// ═══════ RESOURCES HUB ═══════
function renderResources() {
  const container = document.getElementById('resourcesContainer');
  if (!container) return;

  // High-availability verified media and official local documents
  const allBooks = [
    // 🇫🇷 FRENCH TRANSLATIONS & EDITIONS
    {
      id: "ehret-mucusless-fr",
      lang: "fr",
      title: "Système de Guérison du Régime Sans Mucus",
      subtitle: "Édition Intégrale Traduite & Structurée par VitalTrack · Prof. Arnold Ehret",
      url: "/pdfs/arnold-ehret-systeme-de-guerison-du-regime-sans-mucus-fr.pdf",
      author: "Prof. Arnold Ehret (1866–1922)",
      source: "Création & Traduction VitalTrack (D'après l'Original de 1922)",
      size: "1.4 Mo",
      badgeClass: "badge-success",
      badgeText: "✨ Édition & Traduction Interactive VitalTrack",
      extraBadge: "💡 38 Définitions · 536 Annotations",
      icon: "ri-book-open-fill",
      color: "#10b981",
      description: "Traduction intégrale, exhaustive et annotée en français moderne d'après le texte historique de 1922 du Prof. Arnold Ehret. Architecture de lecture interactive, 536 annotations cliniques, dictionnaire vitaliste et mémoire de lecture exacte créés et structurés par VitalTrack Academy."
    },
    {
      id: "morse-detox-fr",
      lang: "fr",
      title: "Le Guide du Miracle de la Détox & Régénération",
      subtitle: "Dr. Robert Morse, N.D. — The Detox Miracle Sourcebook en Français",
      url: "/pdfs/dr-robert-morse-le-guide-du-miracle-de-la-detox-fr.pdf",
      author: "Dr. Robert Morse, N.D.",
      source: "Édition Complète Française",
      size: "265 Ko",
      badgeClass: "badge-purple",
      badgeText: "🇫🇷 Édition Intégrale Française",
      icon: "ri-leaf-line",
      color: "#8b5cf6",
      description: "La bible complète de la régénération cellulaire en français : filtration rénale, grand système lymphatique, pouvoir dissolvant des fruits, iridologie clinique et formules botaniques."
    },
    {
      id: "ehret-fasting-fr",
      lang: "fr",
      title: "Le Jeûne Rationnel & Régénération Physiologique",
      subtitle: "Prof. Arnold Ehret — Rational Fasting en Français",
      url: "/pdfs/arnold-ehret-le-jeune-rationnel-fr.pdf",
      author: "Prof. Arnold Ehret",
      source: "Édition Complète Française",
      size: "190 Ko",
      badgeClass: "badge-warning",
      badgeText: "🇫🇷 Édition Intégrale Française",
      icon: "ri-book-read-line",
      color: "#f59e0b",
      description: "Manuel pratique sur la conduite progressive et sûre du jeûne, l'autolyse des dépôts métaboliques, le balai intestinal et la gestion sans danger des crises d'élimination."
    },
    {
      id: "wolfe-sunfood-fr",
      lang: "fr",
      title: "Le Système de Réussite de l'Alimentation Vivante",
      subtitle: "David Wolfe — The Sunfood Diet Success System en Français",
      url: "/pdfs/david-wolfe-le-systeme-de-reussite-de-l-alimentation-vivante-fr.pdf",
      author: "David Wolfe",
      source: "Édition Complète Française",
      size: "210 Ko",
      badgeClass: "badge-danger",
      badgeText: "🇫🇷 Édition Intégrale Française",
      icon: "ri-sun-line",
      color: "#f43f5e",
      description: "L'encyclopédie de l'alimentation crue vivante : biophotonique, régénération et vision des yeux, enzymes, super-aliments sauvages et équilibre bio-électrique."
    },
    {
      id: "raintree-materia-fr",
      lang: "fr",
      title: "Pharmacopée Botanique Amazonienne (Raintree)",
      subtitle: "Dr. Leslie Taylor — Monographies Thérapeutiques & Phytochimie",
      url: "/pdfs/dr-leslie-taylor-pharmacopee-amazonienne-raintree-fr.pdf",
      author: "Dr. Leslie Taylor",
      source: "Édition Complète Française",
      size: "185 Ko",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Édition Intégrale Française",
      icon: "ri-plant-line",
      color: "#10b981",
      description: "Monographies scientifiques des plantes amazoniennes : Chanca Piedra, Griffe de Chat, Pau d'Arco, Mullaca, Sangre de Grado, posologies et indications cliniques."
    },
    {
      id: "sebi-cleansing-fr",
      lang: "fr",
      title: "Guide de Purification Cellulaire Bio-Électrique",
      subtitle: "Dr. Sebi (Alfredo Bowman) — Bio-Electric Cell Food en Français",
      url: "/pdfs/dr-sebi-guide-de-purification-bio-electrique-cellulaire-fr.pdf",
      author: "Dr. Sebi (Alfredo Bowman)",
      source: "Édition Complète Française",
      size: "165 Ko",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Édition Intégrale Française",
      icon: "ri-flashlight-line",
      color: "#34d399",
      description: "Le protocole officiel du Dr. Sebi sur l'équilibre bio-minéral, les aliments électriques non hybridés, l'alcalinité cellulaire et l'épuration intra-cellulaire."
    },
    {
      id: "sebi-nutritional-guide-fr",
      lang: "fr",
      title: "Guide Nutritionnel Officiel VitalTrack",
      subtitle: "Dr. Sebi & VitalTrack — Guide Pratique & Méthodologique",
      url: "/Nutrional-Guide.pdf",
      author: "Dr. Sebi & VitalTrack",
      source: "VitalTrack (PDF Local)",
      size: "3.9 Mo",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Guide Officiel",
      icon: "ri-booklet-line",
      color: "#10b981",
      description: "Le guide complet de référence sur la nutrition vitaliste, le jeûne intermittent, les combinaisons alimentaires et les protocoles de détoxification."
    },

    // 🇬🇧 AUTHENTIC ORIGINAL ENGLISH EDITIONS
    {
      id: "ehret-mucusless-en",
      lang: "en",
      title: "Mucusless Diet Healing System (Original 1922)",
      subtitle: "Prof. Arnold Ehret — Scientific Method of Eating Your Way to Health",
      url: "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
      author: "Prof. Arnold Ehret",
      source: "Édition Originale Historique Anglaise",
      size: "1.0 Mo",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 Authentic English Original (1922)",
      icon: "ri-book-line",
      color: "#10b981",
      description: "The historical 1922 original English edition of Prof. Arnold Ehret's foundational masterwork on the Mucusless Diet, the V = P - O vitality equation, and rational fasting."
    },
    {
      id: "buhner-antibiotics-en",
      lang: "en",
      title: "Herbal Antibiotics: Natural Alternatives (180 Pages)",
      subtitle: "Stephen Harrod Buhner — Foreword by James A. Duke, Ph.D.",
      url: "https://archive.org/download/165045454HerbalAntibioticsByStephenHarrodBuhner/165045454-Herbal-Antibiotics-by-Stephen-Harrod-Buhner.pdf",
      author: "Stephen Harrod Buhner",
      source: "Authentic English Edition (180 Pages)",
      size: "533 Ko",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-shield-cross-line",
      color: "#6366f1",
      description: "The complete unabridged clinical masterwork on systemic wild herbs, cryptolepine topoisomerase inhibition, cellular membrane preservation, and synergistic botanical antibiotics."
    },
    {
      id: "buhner-antivirals-en",
      lang: "en",
      title: "Herbal Antivirals: Natural Remedies for Resistant Infections",
      subtitle: "Stephen Harrod Buhner — Complete Clinical Reference Book",
      url: "https://archive.org/details/herbal-antivirals",
      author: "Stephen Harrod Buhner",
      source: "Authentic English Edition",
      size: "1.3 Mo",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-virus-line",
      color: "#8b5cf6",
      description: "Complete clinical compendium on systemic antiviral phytotherapy, cytokine storm modulation, Scutellaria baicalensis, Isatis, Cordyceps, and elderberry mechanisms."
    },
    {
      id: "duke-herbs-en",
      lang: "en",
      title: "Handbook of Medicinal Herbs (USDA Reference)",
      subtitle: "Dr. James A. Duke, Ph.D. — CRC Press / USDA",
      url: "https://archive.org/details/handbook-of-medicinal-herbs-james-a-duke",
      author: "Dr. James A. Duke, Ph.D.",
      source: "CRC Press / USDA",
      size: "2.8 Mo",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 USDA Reference Book",
      icon: "ri-test-tube-line",
      color: "#10b981",
      description: "The definitive phytochemical reference quantifying PPM active constituents, biological activities, organic silica, inulin, and clinical actions across thousands of plant species."
    },
    {
      id: "christopher-snh-en",
      lang: "en",
      title: "School of Natural Healing (313 Monographs & Formulas)",
      subtitle: "Dr. John R. Christopher, M.H. — Herbal Legacy Complete Edition",
      url: "https://www.herballegacy.com/Single_Herbs.html",
      author: "Dr. John R. Christopher, M.H.",
      source: "School of Natural Healing",
      size: "1.6 Mo",
      badgeClass: "badge-warning",
      badgeText: "🇬🇧 Complete SNH Library",
      icon: "ri-medicine-bottle-line",
      color: "#f59e0b",
      description: "Complete authentic collection of 313 clinical monographs, master formulas (Kidney, Lower Bowel, Blood Stream, BF&C), and 3-Day cleansing protocols."
    },
    {
      id: "sebi-compendium-en",
      lang: "en",
      title: "The Dr. Sebi Compendium (3-in-1 Healing Journey, 397 Pages)",
      subtitle: "Dr. Sebi Research Center — Herbs, Cures, Treatments & Diet",
      url: "https://archive.org/details/397pg-dr.-sebi-research-center-the-dr.-sebi-compendium-o-a-healing-journey-the-3",
      author: "Dr. Sebi Research Center",
      source: "Dr. Sebi Research Center (397 Pages)",
      size: "444 Ko",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 Authentic 397-Page Book",
      icon: "ri-flashlight-line",
      color: "#34d399",
      description: "Comprehensive 3-in-1 master compendium covering cellular food therapy, intra-cellular mineral balance, wildcrafted herbs, recipes, and detoxification protocols."
    },
    {
      id: "kallas-wildplants-en",
      lang: "en",
      title: "Edible Wild Plants: Wild Foods from Dirt to Plate",
      subtitle: "Dr. John Kallas, Ph.D. — Nutrient Density & Wild Greens",
      url: "https://archive.org/details/Edible_Wild_Plants_Wild_Foods_From_Dirt_To_Plate_by_John_Kallas",
      author: "Dr. John Kallas, Ph.D.",
      source: "Authentic Edition",
      size: "650 Ko",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 Complete Wild Food Book",
      icon: "ri-leaf-fill",
      color: "#22c55e",
      description: "Foundational ethnobotanical guide on nutrient-dense wild greens (purslane omega-3, wild amaranth, stinging nettle, dandelion) compared to cultivated hybrids."
    },
    {
      id: "morse-detox-en",
      lang: "en",
      title: "The Detox Miracle Sourcebook (Original)",
      subtitle: "Raw Foods and Herbs for Complete Cellular Regeneration",
      url: "/pdfs/robert-morse-detox-miracle-sourcebook.pdf",
      author: "Dr. Robert Morse, N.D.",
      source: "Authentic English Original",
      size: "5.3 Mo",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-book-2-line",
      color: "#8b5cf6",
      description: "The complete authoritative reference work on cellular detoxification, lymphatic physiology, kidney filtration, fruit dietetics, and clinical botanical formulas."
    },
    {
      id: "ehret-mucusless-en",
      lang: "en",
      title: "Mucusless Diet Healing System (Original)",
      subtitle: "Authentic 1922 Original English Edition",
      url: "/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf",
      author: "Prof. Arnold Ehret",
      source: "Authentic English Original",
      size: "1.0 Mo",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-book-2-line",
      color: "#38bdf8",
      description: "The historical original English edition by Prof. Arnold Ehret establishing the fundamental law V = P - O and the physiological truth of mucusless healing."
    },
    {
      id: "ehret-fasting-en",
      lang: "en",
      title: "Rational Fasting & Regeneration (Original)",
      subtitle: "Arnold Ehret — Rational Fasting",
      url: "/pdfs/arnold-ehret-rational-fasting.pdf",
      author: "Prof. Arnold Ehret",
      source: "Authentic English Original",
      size: "8.8 Mo",
      badgeClass: "badge-warning",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-book-read-line",
      color: "#f59e0b",
      description: "Arnold Ehret's foundational treatise on rational fasting, safe transition diets, internal bodily cleanliness, and building vitality without auto-intoxication."
    },
    {
      id: "wolfe-sunfood-en",
      lang: "en",
      title: "The Sunfood Diet Success System (Original)",
      subtitle: "David Wolfe — Authentic English Edition",
      url: "/pdfs/david-wolfe-sunfood-diet-success-system.pdf",
      author: "David Wolfe",
      source: "Authentic English Original",
      size: "16.5 Mo",
      badgeClass: "badge-danger",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-sun-line",
      color: "#f43f5e",
      description: "The ultimate raw food and living nutrition masterwork covering enzymes, biophotonics, eye regeneration, wild superfoods, and holistic lifestyle principles."
    },
    {
      id: "sebi-cleansing-en",
      lang: "en",
      title: "Bio-Electric Cell Food Cleansing Guide (Original)",
      subtitle: "Dr. Sebi (Alfredo Bowman) — Authentic English Edition",
      url: "/pdfs/dr-sebi-bio-electric-cell-food-cleansing-guide.pdf",
      author: "Dr. Sebi (Alfredo Bowman)",
      source: "Authentic English Original",
      size: "240 Ko",
      badgeClass: "badge-success",
      badgeText: "🇬🇧 Authentic English Edition",
      icon: "ri-flashlight-line",
      color: "#34d399",
      description: "Dr. Sebi's original bio-electric cell food guide, alkaline nutritional food list, and cellular cleansing compounds for deep cellular healing."
    }
  ];

  const videos = [
    // 🇫🇷 ÉDITIONS FRANÇAISES (VF HD & DOCUMENTAIRES)
    {
      id: "dr_sebi_interview_fr",
      lang: "fr",
      title: "Documentaire : The Rock Newman Show ft. Dr. Sebi (VF HD)",
      localSrc: "/videos/dr-sebi-documentary-fr.mp4?v=20260820_v4_full",
      poster: "/videos/posters/dr-sebi-documentary.jpg",
      source: "WHUT TV • Version Française HD (56 min)",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Version Française Complète",
      type: "local-video",
      description: "L'entretien télévisé et documentaire historique (56 min) avec le Dr. Sebi sur Howard University Television : doublé intégralement en français studio sur l'ensemble des 10 chapitres (biochimie alcaline, aliments électriques, procès de New York, protocoles thérapeutiques)."
    },
    {
      id: "wim_hof_breathing_fr",
      lang: "fr",
      title: "Session Guidée de Respiration Wim Hof (VF HD)",
      localSrc: "/videos/wim-hof-3-rounds-fr.mp4?v=20260820_v4_full",
      poster: "/videos/posters/wim-hof-3-rounds.jpg",
      source: "Wim Hof Officiel • VF HD (11 min)",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Session Guidée en Français",
      type: "local-video",
      description: "Session complète de respiration guidée en 3 cycles avec Wim Hof, avec guidage vocal français calé au rythme des inspirations et des temps de rétention."
    },
    {
      id: "wim_hof_tutorial_fr",
      lang: "fr",
      title: "Tutoriel Officiel & Méthode Wim Hof (VF HD)",
      localSrc: "/videos/wim-hof-tutorial-fr.mp4?v=20260820_v4_full",
      poster: "/videos/posters/wim-hof-3-rounds.jpg",
      source: "Wim Hof Officiel • VF HD (10 min)",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Tutoriel en Français",
      type: "local-video",
      description: "Tutoriel complet avec Wim Hof expliquant les 3 piliers : respiration prānique, exposition au froid et alcalinisation sanguine."
    },
    {
      id: "wim_hof_science_fr",
      lang: "fr",
      title: "Documentaire : Wim Hof & La Science de l'Immunité (VF HD)",
      localSrc: "/videos/wim-hof-science-fr.mp4?v=20260820_v4_full",
      poster: "/videos/posters/wim-hof-science.jpg",
      source: "Radboud University • VF Multi-Voix (44 min)",
      badgeClass: "badge-success",
      badgeText: "🇫🇷 Documentaire Multi-Voix HD",
      type: "local-video",
      description: "Grand documentaire scientifique avec chercheurs et scientifiques universitaires doublés en français multi-voix sur la modulation du système immunitaire et l'autophagie."
    },
    {
      id: "wim_hof_vice",
      lang: "fr",
      title: "Inside the Superhuman World of Wim Hof (Vice Documentaire)",
      url: "https://www.youtube-nocookie.com/embed/Np0jGp6442A",
      watchUrl: "https://www.youtube.com/watch?v=Np0jGp6442A",
      youtubeId: "Np0jGp6442A",
      source: "Vice Media (39 min)",
      badgeClass: "badge-warning",
      badgeText: "🎬 VOSTFR",
      type: "video",
      description: "Le grand reportage d'investigation de Vice Media suivant Wim Hof et les tests scientifiques à l'Université Radboud prouvant le contrôle volontaire du système immunitaire."
    },
    {
      id: "arnold_ehret_masterclass",
      lang: "fr",
      title: "Masterclass : Le Système de Guérison du Régime Sans Mucus",
      url: "https://www.youtube-nocookie.com/embed/EjTWFoqLy34",
      watchUrl: "https://www.youtube.com/watch?v=EjTWFoqLy34",
      youtubeId: "EjTWFoqLy34",
      source: "Masterclass Vitaliste (1h36)",
      badgeClass: "badge-warning",
      badgeText: "🎬 Conférence FR",
      type: "video",
      description: "Masterclass audio-vidéo intégrale sur l'équation vitale V = P - O et les lois fondamentales de la détoxination sans mucus."
    },
    {
      id: "dr_morse_lymphatic",
      lang: "fr",
      title: "Dr. Robert Morse : Le Grand Système Lymphatique & Reins",
      url: "https://www.youtube-nocookie.com/embed/_ufnGrKmL1c",
      watchUrl: "https://www.youtube.com/watch?v=Np0jGp6442A",
      youtubeId: "_ufnGrKmL1c",
      source: "Club Santé Naturelle (56 min)",
      badgeClass: "badge-warning",
      badgeText: "🎬 Conférence FR",
      type: "video",
      description: "Explication magistrale du Dr. Morse sur les deux fluides majeurs (sang et lymphe), la filtration rénale et le drainage des acides cellulaires."
    },
    {
      id: "what_the_health",
      lang: "fr",
      title: "What The Health (Film Documentaire)",
      url: "https://www.youtube-nocookie.com/embed/_ymX8x0IqM8",
      watchUrl: "https://www.youtube.com/watch?v=_ymX8x0IqM8",
      source: "AUM Films (VOSTFR 1h32)",
      badgeClass: "badge-warning",
      badgeText: "🎬 Film Documentaire",
      type: "video",
      description: "Film d'investigation sur les impacts des aliments ultra-transformés et les bénéfices prouvés de la nutrition végétale intégrale."
    },

    // 🇬🇧 AUTHENTIC ORIGINAL ENGLISH EDITIONS
    {
      id: "dr_sebi_interview_en",
      lang: "en",
      title: "The Rock Newman Show ft. Dr. Sebi (Original English HD)",
      localSrc: "/videos/dr-sebi-documentary.mp4",
      poster: "/videos/posters/dr-sebi-documentary.jpg",
      source: "WHUT TV / Howard University (56 min)",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Authentic English Edition",
      type: "local-video",
      description: "The complete historic 56-minute television interview and documentary with Dr. Sebi on WHUT TV: alkaline cell biochemistry, electric cellular food, mucus removal, and natural therapeutic protocols."
    },
    {
      id: "wim_hof_breathing_en",
      lang: "en",
      title: "Guided Wim Hof Breathing (Official English HD)",
      localSrc: "/videos/wim-hof-3-rounds.mp4",
      poster: "/videos/posters/wim-hof-3-rounds.jpg",
      source: "Wim Hof Official (11 min)",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Official English Edition",
      type: "local-video",
      description: "The official original 3-round guided breathing session with Wim Hof (The Iceman), with real-time breathing rhythms and retention timers."
    },
    {
      id: "wim_hof_science_en",
      lang: "en",
      title: "Wim Hof: Testing the Immune System (Original English HD)",
      localSrc: "/videos/wim-hof-science.mp4",
      poster: "/videos/posters/wim-hof-science.jpg",
      source: "Radboud University / Wim Hof (71 min)",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Original English Video",
      type: "local-video",
      description: "Comprehensive scientific documentary documenting clinical trials at Radboud University and voluntary modulation of the human autonomic nervous system and immune response."
    },
    {
      id: "wim_hof_tutorial_en",
      lang: "en",
      title: "Wim Hof: Complete Method Tutorial (Original English HD)",
      localSrc: "/videos/wim-hof-tutorial.mp4",
      poster: "/videos/posters/wim-hof-tutorial.jpg",
      source: "Wim Hof Official Tutorial (20 min)",
      badgeClass: "badge-purple",
      badgeText: "🇬🇧 Original English Video",
      type: "local-video",
      description: "In-depth video tutorial by Wim Hof on breathing mechanics, cold exposure progression, and conscious mental focus."
    }
  ];

  // Filter books and videos according to active tab
  let filteredBooks = allBooks;
  let displayedVideos = videos;

  if (_resourcesCatalogTab === 'fr') {
    filteredBooks = allBooks.filter(b => b.lang === 'fr');
    displayedVideos = videos.filter(v => v.lang === 'fr');
  } else if (_resourcesCatalogTab === 'en') {
    filteredBooks = allBooks.filter(b => b.lang === 'en');
    displayedVideos = videos.filter(v => v.lang === 'en');
  } else if (_resourcesCatalogTab === 'videos') {
    filteredBooks = [];
    displayedVideos = videos;
  }

  const showVideos = displayedVideos.length > 0;

  let html = `
    <!-- Module Moteur de Recherche Multimédia & Deep Search -->
    <div class="media-search-container">
      <div class="dash-card glass" style="padding:20px; margin-bottom:20px; border:1px solid var(--border); background:var(--surface); box-shadow:var(--card-shadow);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <div>
            <h2 style="font-size:1.15rem; font-weight:800; margin:0; color:var(--text); display:flex; align-items:center; gap:8px;">
              <span>🔍</span> Recherche Transversale Bilingue & Horodatée
            </h2>
            <p style="font-size:0.8rem; color:var(--text-dim); margin:2px 0 0 0;">Recherchez un mot-clé ou concept dans les 12 ouvrages intégraux (FR & EN) et vidéos</p>
          </div>
          <span id="mediaResultCountBadge" class="badge badge-success" style="display:none; font-size:0.75rem;"></span>
        </div>

        <div class="media-search-box-wrap">
          <i class="ri-search-line search-icon"></i>
          <input type="text" id="mediaSearchInput" placeholder="Chercher un sujet (ex: eyes, intestins, colon, crohn, autophagie, mucus, reins, dr sebi)..." value="${esc(_mediaSearchQuery)}" oninput="searchMediaResources(this.value)" autocomplete="off" spellcheck="false">
          <button type="button" class="clear-btn" id="mediaSearchClearBtn" onclick="clearMediaSearch()" style="${_mediaSearchQuery ? 'display:flex' : 'display:none'}" aria-label="Effacer la recherche">
            <i class="ri-close-circle-fill"></i>
          </button>
        </div>

        <!-- Suggestions de Mots-Clés Rapides -->
        <div class="media-quick-tags">
          <span style="font-size:0.75rem; color:var(--text-dim); display:flex; align-items:center; gap:4px; font-weight:600;"><i class="ri-price-tag-3-line"></i> Thématiques :</span>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('eyes')">👁️ Eyes / Yeux</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('intestins')">🩺 Intestins & Côlon</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('Crohn')">🛡️ Maladie de Crohn</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('autophagie')">🧬 Autophagie & Jeûne</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('dr sebi')">⚡ Dr. Sebi Électrique</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('mucus')">🍎 Mucus & Toxémie</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('reins')">🫘 Filtration Rénale</button>
          <button type="button" class="media-tag-chip" onclick="applyMediaTopicTag('wim hof')">🌬️ Respiration Wim Hof</button>
        </div>
      </div>
    </div>

    <!-- Conteneur des Résultats Dynamiques de Recherche -->
    <div id="mediaSearchResultsContainer" style="display:none; margin-bottom:24px;"></div>

    <!-- Catalogue Standard (visible quand aucune recherche active) -->
    <div id="mediaStandardCatalog">
      <!-- Onglets de Sélection du Catalogue de la Bibliothèque -->
      <div style="display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; padding-bottom:4px;" class="hide-scrollbar">
        <button type="button" class="btn-tab ${_resourcesCatalogTab === 'all' ? 'active' : ''}" onclick="setResourcesCatalogTab('all')">
          🌟 Tout (${allBooks.length + videos.length})
        </button>
        <button type="button" class="btn-tab ${_resourcesCatalogTab === 'fr' ? 'active' : ''}" onclick="setResourcesCatalogTab('fr')">
          🇫🇷 En Français (${allBooks.filter(b => b.lang === 'fr').length + videos.filter(v => v.lang === 'fr').length})
        </button>
        <button type="button" class="btn-tab ${_resourcesCatalogTab === 'en' ? 'active' : ''}" onclick="setResourcesCatalogTab('en')">
          🇬🇧 In English (${allBooks.filter(b => b.lang === 'en').length + videos.filter(v => v.lang === 'en').length})
        </button>
        <button type="button" class="btn-tab ${_resourcesCatalogTab === 'videos' ? 'active' : ''}" onclick="setResourcesCatalogTab('videos')">
          🎬 Vidéos (${videos.length})
        </button>
      </div>

      <!-- Section Livres & Guides PDF -->
      ${filteredBooks.length > 0 ? `
        <div style="margin-bottom:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">📚</span>
              <div>
                <h2 style="font-size:1.15rem; font-weight:800; margin:0; color:var(--text);">
                  ${_resourcesCatalogTab === 'fr' ? 'Ouvrages Fondateurs en Français (Traduction Intégrale)' : _resourcesCatalogTab === 'en' ? 'Authentic English Original Editions' : 'Ouvrages & Guides PDF Fondateurs (Bilingue FR / EN)'}
                </h2>
                <p style="font-size:0.8rem; color:var(--text-dim); margin:0;">Tous les textes intégraux téléchargeables et consultables directement en local</p>
              </div>
            </div>
            <span class="badge badge-success" style="font-size:0.78rem;">${filteredBooks.length} ouvrage${filteredBooks.length > 1 ? 's' : ''} disponible${filteredBooks.length > 1 ? 's' : ''}</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(360px, 100%), 1fr)); gap:22px;">
            ${filteredBooks.map(b => `
              <div class="dash-card glass" style="padding:22px; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid ${b.color}; background:var(--surface-2); box-shadow:var(--card-shadow); border-radius:16px;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:8px;">
                    ${b.badgeText ? `
                      <span style="font-size:0.75rem; font-weight:700; color:${b.lang === 'fr' ? 'var(--accent)' : 'var(--accent-2)'}; background:${b.lang === 'fr' ? 'var(--accent-glow)' : 'rgba(37,99,235,0.1)'}; padding:4px 10px; border-radius:20px; border:1px solid ${b.lang === 'fr' ? 'var(--accent)' : 'var(--accent-2)'}; display:inline-flex; align-items:center; gap:5px;">
                        ${esc(b.badgeText)}
                      </span>
                    ` : '<span></span>'}
                    <span class="badge ${b.badgeClass}" style="font-size:0.72rem; padding:4px 9px; font-weight:600; white-space:nowrap; border-radius:8px;">${esc(b.size)}</span>
                  </div>

                  <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:10px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:var(--surface-hover); color:${b.color}; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:1.35rem; flex-shrink:0; box-shadow:var(--card-shadow);">
                      <i class="${b.icon}"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                      <h3 style="margin:0 0 4px 0; font-size:1.05rem; font-weight:800; color:var(--text); line-height:1.3; word-break:break-word;">${esc(b.title)}</h3>
                      <div style="font-size:0.78rem; color:${b.color}; font-weight:600; line-height:1.35;">${esc(b.subtitle)}</div>
                    </div>
                  </div>

                  <div style="display:inline-flex; align-items:center; gap:6px; background:var(--surface-hover); border:1px solid var(--border); padding:3px 10px; border-radius:8px; font-size:0.76rem; color:var(--accent); font-weight:600; margin-bottom:12px;">
                    <i class="ri-quill-pen-line"></i> Auteur : <span style="color:var(--text);">${esc(b.author)}</span>
                  </div>

                  <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.55; margin:0 0 14px 0;">${esc(b.description)}</p>

                  ${b.id === 'ehret-mucusless-fr' ? `
                    <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.22); border-radius:10px; padding:10px 12px; margin-bottom:16px;">
                      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; font-size:0.75rem; flex-wrap:wrap; gap:4px;">
                        <span style="font-weight:700; color:var(--accent); display:flex; align-items:center; gap:5px;">
                          <i class="ri-sparkling-fill"></i> Traduction & Structure VitalTrack
                        </span>
                        <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text); font-weight:700;">
                          30 Sections · 536 Annotations
                        </span>
                      </div>
                      <p style="margin:0 0 6px 0; font-size:0.75rem; color:var(--text-dim); line-height:1.4;">
                        Texte d'Arnold Ehret intégralement traduit en français moderne et architecturé pour la liseuse interactive par notre équipe.
                      </p>
                      <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.73rem; border-top:1px dashed rgba(16,185,129,0.2); padding-top:6px; margin-top:4px;">
                        <span style="color:var(--text-dim);">Source originale de 1922 :</span>
                        <a href="/pdfs/arnold-ehret-mucusless-diet-healing-system.pdf" target="_blank" rel="noopener noreferrer" style="color:var(--accent); text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px;">
                          <i class="ri-file-pdf-line"></i> 🇬🇧 PDF Original Anglais
                        </a>
                      </div>
                    </div>
                  ` : ''}
                </div>

                <div style="display:flex; gap:10px; margin-top:auto;">
                  ${b.id === 'ehret-mucusless-fr' ? `
                    <button type="button" onclick="openBookReader('${b.id}')" class="btn-primary" style="flex:1.2; text-align:center; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:0.85rem; font-weight:700; padding:10px 14px; border-radius:10px; box-shadow:0 4px 14px rgba(16,185,129,0.25); cursor:pointer;">
                      <i class="ri-book-read-line"></i> Lire l'Ouvrage
                    </button>
                  ` : `
                    <a href="${b.url}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="flex:1; text-align:center; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:0.85rem; font-weight:700; padding:10px 14px; border-radius:10px; box-shadow:0 4px 14px rgba(16,185,129,0.25);">
                      <i class="ri-file-pdf-line"></i> Consulter
                    </a>
                  `}
                  <a href="${b.url}" download class="btn-secondary" style="flex:0.8; text-align:center; text-decoration:none; padding:10px 12px; display:inline-flex; align-items:center; justify-content:center; gap:6px; font-size:0.85rem; font-weight:600; border-radius:10px; background:var(--surface-hover); border:1px solid var(--border); color:var(--text);" title="Télécharger le fichier PDF">
                    <i class="ri-download-2-line"></i> PDF
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Section Vidéos & Documentaires -->
      ${showVideos ? `
        <div style="margin-top:24px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.4rem;">🎬</span>
              <div>
                <h2 style="font-size:1.15rem; font-weight:800; margin:0; color:var(--text);">Documentaires & Médias Vidéo</h2>
                <p style="font-size:0.8rem; color:var(--text-dim); margin:0;">Enquêtes, conférences et entretiens de référence directement prêts à visionner</p>
              </div>
            </div>
            <span class="badge badge-warning" style="font-size:0.78rem;">${displayedVideos.length} vidéo${displayedVideos.length > 1 ? 's' : ''}</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(min(380px, 100%), 1fr)); gap:18px;">
            ${displayedVideos.map(r => `
              <div class="dash-card glass" style="padding:18px; display:flex; flex-direction:column; justify-content:space-between; border-radius:16px;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
                    <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:var(--text);">${esc(r.title)}</h3>
                    <span class="badge ${r.badgeClass || 'badge-success'}">${esc(r.badgeText || r.source)}</span>
                  </div>

                  <!-- Aperçu Lecteur / Poster -->
                  <div style="position:relative; width:100%; border-radius:12px; overflow:hidden; border:1px solid var(--border); background:#000; box-shadow:0 6px 24px rgba(0,0,0,0.4); margin-bottom:12px;">
                    ${r.type === 'local-video' ? `
                      <video controls playsinline preload="metadata" poster="${r.poster}" style="width:100%; height:auto; display:block; max-height:260px; background:#000;">
                        <source src="${r.localSrc}" type="video/mp4">
                      </video>
                    ` : `
                      <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
                        <iframe src="${r.url}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen loading="lazy"></iframe>
                      </div>
                    `}
                  </div>

                  <p style="font-size:0.85rem; color:var(--text-dim); line-height:1.5; margin:0 0 12px 0;">${esc(r.description)}</p>
                </div>

                <!-- Bouton Lancer Lecteur Grand Format -->
                <div style="display:flex; gap:8px; margin-top:auto;">
                  <button type="button" class="btn-primary" style="flex:1; padding:10px 14px; font-size:0.88rem; font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#10b981,#0284c7); border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 14px rgba(16,185,129,0.3);" onclick="playVideoAtTimestamp('${esc(r.localSrc || r.url || '')}', 0, '${esc(r.title)}', '${r.type === 'local-video' ? 'local' : 'youtube'}', '${r.youtubeId || ''}', 'Introduction', '${esc(r.source)}')">
                    <i class="ri-play-circle-fill" style="font-size:1.1rem;"></i> Visionner en Grand Écran & Chapitres
                  </button>
                  ${r.watchUrl ? `
                    <a href="${r.watchUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding:10px 12px; font-size:0.85rem; text-decoration:none; display:inline-flex; align-items:center; justify-content:center;" title="Ouvrir dans un nouvel onglet">
                      <i class="ri-external-link-line"></i>
                    </a>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Bannière Souveraineté & Pérennité -->
      <div class="dash-card glass" style="margin-top:20px; padding:16px 20px; background:linear-gradient(135deg,rgba(16,185,129,0.06),rgba(59,130,246,0.04)); border:1px dashed var(--border); display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
        <div style="font-size:2rem; color:var(--accent);">🛡️</div>
        <div style="flex:1; min-width:240px;">
          <h4 style="margin:0 0 4px 0; font-size:0.95rem; font-weight:700; color:var(--text);">Pérennité & Souveraineté Locale Maximale</h4>
          <p style="margin:0; font-size:0.8rem; color:var(--text-dim); line-height:1.4;">
            Tous les ouvrages en français et en anglais ainsi que les documentaires sont hébergés et servis localement. Aucun risque de lien brisé ou de censure externe.
          </p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Restore active search if any
  if (_mediaSearchQuery || _mediaSearchFilter !== 'all') {
    _renderMediaSearchResults();
  }
};

// ═══════ DIET PLAN CALENDAR ═══════

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];
const DAYS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const DAYS_FULL_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SLOT_META = {
  'Réveil': { emoji: '🌅', time: '6h–7h', color: '#f59e0b', gradient: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.03))' },
  'Petit-déjeuner': { emoji: '🍽️', time: '8h–9h', color: '#4ade80', gradient: 'linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.03))' },
  'Déjeuner': { emoji: '🥗', time: '12h–13h', color: '#22d3ee', gradient: 'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.03))' },
  'Collation': { emoji: '🫐', time: '16h', color: '#a78bfa', gradient: 'linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.03))' },
  'Dîner': { emoji: '🌙', time: '19h–20h', color: '#f472b6', gradient: 'linear-gradient(135deg,rgba(244,114,182,0.15),rgba(244,114,182,0.03))' },
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
  monday.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function changeCalendarWeek(delta) {
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
    dayMeals.sort((a, b) => (slotOrder[a.slot] || 99) - (slotOrder[b.slot] || 99));

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

function openMealModal(dateStr, mealId = null) {
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

function closeMealModal() {
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

function deleteCalendarMeal(id) {
  let meals = store.get('calendar_meals', []);
  meals = meals.filter(x => x.id !== id);
  store.set('calendar_meals', meals);
  renderCalendar();
  showToast('Repas supprimé du calendrier.', 'info');
};

function promptAIFixMeal(id) {
  showPage('chat');
  setChatContext({
    type: 'meal_fix',
    icon: '🍲',
    label: 'Modifier le repas',
    subject: `Repas #${id}`,
    placeholder: 'Que souhaitez-vous modifier dans ce repas ?',
    buildPrompt: (userText) => `IA, j'aimerais changer ce repas (ID: ${id}). Propose-moi une alternative vitaliste cohérente. ${userText ? `Précisions : ${userText}` : ''}`
  });
};

function promptAIPlan() {
  showPage('chat');
  setChatContext({
    type: 'plan_gen',
    icon: '📅',
    label: 'Plan Alimentaire',
    subject: 'Génération 3 jours',
    placeholder: 'Précisez vos préférences (ou appuyez sur Envoyer)...',
    buildPrompt: (userText) => `IA, propose-moi un plan alimentaire de 3 jours pour mon calendrier vitaliste. ${userText ? `Objectifs ou préférences : ${userText}` : ''}`
  });
};

function handleApplyDietPlanRequest(encodedReq, mode) {
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
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
      overlay.innerHTML = `<div class="conflict-modal-card" style="background:var(--surface,#ffffff);border:1.5px solid var(--border,#cbd5e1);border-radius:24px;padding:28px 24px;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.35);color:var(--text,#0f172a);position:relative;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
          <div style="width:46px;height:46px;border-radius:14px;background:rgba(245,158,11,0.18);color:#d97706;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">
            <i class="ri-calendar-event-line"></i>
          </div>
          <div>
            <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:var(--text,#0f172a);line-height:1.2;">Repas existants détectés</h3>
            <span style="font-size:0.85rem;color:var(--text-dim,#64748b);font-weight:600;">${res.conflictCount} créneau(x) déjà planifié(s) sur cette période</span>
          </div>
        </div>
        <p style="font-size:0.92rem;color:var(--text-mid,#334155);margin:0 0 20px;line-height:1.5;">Des repas sont déjà programmés sur ces dates dans votre calendrier. Choisissez comment intégrer ce nouveau plan :</p>
        
        <div style="display:flex;flex-direction:column;gap:12px;">
          <!-- Option 1 : Remplacer -->
          <button type="button" class="conflict-btn-replace" onclick="document.getElementById('conflictModalOverlay').remove(); window.handleApplyDietPlanRequest('${encodedReq}', 'replace')" style="padding:14px 18px;border-radius:16px;border:none;background:linear-gradient(135deg, var(--accent, #059669), #047857);color:#ffffff;font-weight:700;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;gap:12px;box-shadow:0 6px 18px rgba(5,150,105,0.3);text-align:left;transition:all 0.2s ease;">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
              <i class="ri-refresh-line"></i>
            </div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:0.96rem;">Remplacer les jours du plan</div>
              <div style="font-size:0.78rem;opacity:0.9;font-weight:500;">Écrase le planning actuel sur ces dates</div>
            </div>
          </button>

          <!-- Option 2 : Fusionner (Haute visibilité & contour net) -->
          <button type="button" class="conflict-btn-merge" onclick="document.getElementById('conflictModalOverlay').remove(); window.handleApplyDietPlanRequest('${encodedReq}', 'merge')" style="padding:14px 18px;border-radius:16px;border:2px solid var(--accent, #059669);background:var(--surface-2, #f8fafc);color:var(--text, #0f172a);font-weight:700;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;gap:12px;box-shadow:0 4px 14px rgba(0,0,0,0.06);text-align:left;transition:all 0.2s ease;">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(5,150,105,0.12);color:var(--accent, #059669);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
              <i class="ri-add-circle-line"></i>
            </div>
            <div style="flex:1;">
              <div style="font-weight:800;font-size:0.96rem;color:var(--text, #0f172a);">Fusionner (ajouter à côté)</div>
              <div style="font-size:0.78rem;color:var(--text-dim, #64748b);font-weight:500;">Conserve vos repas actuels et ajoute les nouveaux</div>
            </div>
          </button>

          <!-- Option 3 : Annuler -->
          <button type="button" onclick="document.getElementById('conflictModalOverlay').remove()" style="padding:11px;border-radius:12px;border:1px solid transparent;background:transparent;color:var(--text-dim,#64748b);cursor:pointer;font-size:0.88rem;font-weight:600;margin-top:2px;transition:all 0.2s ease;">
            Annuler
          </button>
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

function addMealsToCalendar(mealsJson) {
  try {
    const newMeals = JSON.parse(decodeURIComponent(escape(atob(mealsJson))));
    let meals = store.get('calendar_meals', []);

    newMeals.forEach(m => {
      // Calculate date based on dayOffset from today
      const d = new Date();
      d.setDate(d.getDate() + (m.dayOffset || 0));
      const dateStr = formatLocalDate(d);

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

function handleAddActionMeal(encodedMeal) {
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

    showToast(
      `<div style="display:flex;flex-direction:column;gap:1px;"><span style="font-weight:700;color:var(--text);">Repas enregistré !</span><span style="color:var(--text-dim);font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px;">« ${esc(newMeal.name)} »</span></div>`,
      'success',
      6000,
      {
        label: 'Voir mon journal →',
        icon: 'ri-book-open-line',
        onClick: "showPage('meals')"
      }
    );
  } catch (err) {
    console.error('Erreur handleAddActionMeal:', err);
    showToast("Impossible d'enregistrer le repas.", 'error');
  }
};

function openMealCustomizer(mealName) {
  setChatContext({
    type: 'meal_replace',
    icon: '🔄',
    label: 'Personnaliser le plat',
    subject: mealName,
    placeholder: 'Quels ingrédients souhaitez-vous remplacer ou ajouter ?',
    buildPrompt: (userText) => `À propos du plat "${mealName}" : Je souhaite adapter la recette. Voici mes souhaits : "${userText || 'propose une variante savoureuse'}". Propose une adaptation vitaliste selon Arnold Ehret avec un bloc actionMeal mis à jour.`
  });
}
window.openMealCustomizer = openMealCustomizer;

function askMealVariant(mealName, variantType) {
  if (variantType === 'fridge') {
    setChatContext({
      type: 'meal_fridge',
      icon: '🥑',
      label: 'Adapter avec mon frigo',
      subject: mealName,
      placeholder: 'Quels aliments avez-vous sous la main ? (ex: courgettes, avocat, cabillaud...)',
      buildPrompt: (userText) => `À propos du plat "${mealName}" : Comment adapter cette recette avec les ingrédients suivants que j'ai au frigo / placard : "${userText || 'ce qui est disponible'}". Donne la recette adaptée selon les règles vitalistes d'Arnold Ehret avec un bloc actionMeal.`
    });
  } else if (variantType === 'raw') {
    setChatContext({
      type: 'meal_raw',
      icon: '🌿',
      label: 'Version 100% crue vivante',
      subject: mealName,
      placeholder: 'Précisez vos préférences (ou appuyez sur Envoyer)...',
      buildPrompt: (userText) => `À propos du plat "${mealName}" : Comment adapter ce plat en version 100% crue, vivante et hautement enzymatique ? ${userText ? `Précisions : ${userText}` : ''} Fournis la recette avec son bloc actionMeal.`
    });
  } else if (variantType === 'transition') {
    setChatContext({
      type: 'meal_transition',
      icon: '🐟',
      label: 'Aliment de transition',
      subject: mealName,
      placeholder: 'Quel aliment de transition voulez-vous ajouter ? (ex: poisson vapeur, quinoa, patate douce...)',
      buildPrompt: (userText) => `À propos du plat "${mealName}" : Comment intégrer l'aliment de transition suivant : "${userText || 'poisson blanc vapeur douce ou féculent doux sans gluten'}" en respectant les règles d'association et de neutralisation du mucus d'Arnold Ehret ? Fournis le bloc actionMeal adapté.`
    });
  }
}
window.askMealVariant = askMealVariant;

function handleApplyFastingProgram(encodedProgram) {
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

function addSuggestedFood(btn, foodName) {
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

function sendQuickReply(btn, text) {
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

function openWeightModal() {
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

function closeWeightModal(e) {
  if (!e || e.target === document.getElementById('weightModal') || e.target.closest?.('.modal-close')) {
    window._editingWeightId = null;
    document.getElementById('weightModal')?.classList.remove('open');
  }
};

function cancelWeightEdit() {
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

function editWeightEntry(entryId) {
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

function stepWeight(delta) {
  const valInput = document.getElementById('weightValInput');
  if (!valInput) return;
  let curr = parseFloat(valInput.value) || 70.0;
  curr = Math.round((curr + delta) * 10) / 10;
  if (curr < 20) curr = 20;
  if (curr > 300) curr = 300;
  valInput.value = curr.toFixed(1);
};

function sanitizeWeightHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return [];
  const map = new Map();
  history.forEach(item => {
    if (!item || item.weight === undefined || item.weight === null) return;
    const w = parseFloat(item.weight);
    if (isNaN(w) || w <= 0) return;
    const dateObj = new Date(item.date);
    if (isNaN(dateObj.getTime())) return;
    const dateStr = dateObj.toISOString().split('T')[0];
    map.set(dateStr, {
      id: item.id || ('w_' + dateStr.replace(/-/g, '')),
      date: `${dateStr}T12:00:00.000Z`,
      weight: Math.round(w * 10) / 10,
      note: item.note || ''
    });
  });
  return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function saveWeightEntry() {
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

  let history = sanitizeWeightHistory(store.get('weight_history', []));
  const entryDate = `${dateStr}T12:00:00.000Z`;

  const existingIdx = history.findIndex(h => h.date.startsWith(dateStr) || (window._editingWeightId && h.id === window._editingWeightId));

  if (existingIdx !== -1) {
    history[existingIdx].date = entryDate;
    history[existingIdx].weight = w;
    history[existingIdx].note = note;
    showToast(`Pesée du ${dateStr} mise à jour (${w} kg) !`, 'success');
  } else {
    const newId = 'w_' + dateStr.replace(/-/g, '') + '_' + Math.random().toString(36).substr(2, 4);
    history.push({
      id: newId,
      date: entryDate,
      weight: w,
      note
    });
    showToast(`Pesée de ${w} kg enregistrée pour le ${dateStr} !`, 'success');
  }

  window._editingWeightId = null;
  history = sanitizeWeightHistory(history);
  store.set('weight_history', history);

  renderWeightChart();
  renderWeightHistoryInModal();
  document.getElementById('weightModal')?.classList.remove('open');
};

async function deleteWeightEntry(idOrIdx) {
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

function renderWeightHistoryInModal() {
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

// ═══════ INTELLIGENT DYNAMIC TARGET WEIGHT ENGINE ═══════
function calculateTargetWeightInsight(curWeight, targetWeight, startWeight) {
  if (isNaN(targetWeight) || targetWeight <= 20 || targetWeight > 300) {
    return {
      status: 'unset',
      badgeText: '+ Définir',
      badgeColor: '#60a5fa',
      badgeBg: 'rgba(96,165,250,0.14)',
      title: '🎯 Objectif de Poids Non Défini',
      message: 'Définissez votre poids physiologique idéal pour activer le suivi dynamique et tracer votre ligne de mire sur le graphique.',
      progressPct: null,
      delta: null,
      isGoalReached: false
    };
  }

  if (isNaN(curWeight) || curWeight <= 0) {
    return {
      status: 'target_set_no_current',
      badgeText: `${targetWeight.toFixed(1)} kg`,
      badgeColor: '#60a5fa',
      badgeBg: 'rgba(96,165,250,0.14)',
      title: `🎯 Cible : ${targetWeight.toFixed(1)} kg`,
      message: 'Enregistrez votre première pesée pour calculer votre écart et votre trajectoire vitale.',
      progressPct: null,
      delta: null,
      isGoalReached: false
    };
  }

  const delta = Math.round((curWeight - targetWeight) * 10) / 10;
  const absDelta = Math.abs(delta);

  // Case 1: EXACTLY AT GOAL (within ±0.2 kg)
  if (absDelta <= 0.2) {
    return {
      status: 'reached',
      badgeText: `🎯 Atteint (${targetWeight.toFixed(1)} kg)`,
      badgeColor: '#34d399',
      badgeBg: 'rgba(52,211,153,0.18)',
      title: '🌟 Félicitations ! Poids Cible Atteint',
      message: `Vous êtes à ${curWeight.toFixed(1)} kg, exactement sur votre objectif de ${targetWeight.toFixed(1)} kg. Bravo pour cette harmonisation métabolique ! Maintenez l'équilibre de vitalité.`,
      progressPct: 100,
      delta: 0,
      isGoalReached: true
    };
  }

  // Case 2: WEIGHT LOSS GOAL (Current > Target)
  if (delta > 0) {
    const isVeryClose = delta <= 2.0;
    const isClose = delta > 2.0 && delta <= 5.0;

    let progressPct = null;
    if (!isNaN(startWeight) && startWeight > targetWeight) {
      const totalToLose = startWeight - targetWeight;
      const alreadyLost = startWeight - curWeight;
      if (totalToLose > 0) {
        progressPct = Math.min(99, Math.max(1, Math.round((alreadyLost / totalToLose) * 100)));
      }
    }

    if (isVeryClose) {
      return {
        status: 'loss_very_close',
        badgeText: `🔥 -${delta.toFixed(1)} kg (Tout proche)`,
        badgeColor: '#10b981',
        badgeBg: 'rgba(16,185,129,0.18)',
        title: `🔥 Dernière Ligne Droite : Plus que ${delta.toFixed(1)} kg !`,
        message: `Actuel : ${curWeight.toFixed(1)} kg (cible ${targetWeight.toFixed(1)} kg). Le but est à portée de main, continuez les fenêtres d'hydratation et le drainage doux.`,
        progressPct: progressPct !== null ? progressPct : 90,
        delta,
        isGoalReached: false
      };
    } else if (isClose) {
      return {
        status: 'loss_in_progress',
        badgeText: `📉 -${delta.toFixed(1)} kg restant`,
        badgeColor: '#60a5fa',
        badgeBg: 'rgba(96,165,250,0.15)',
        title: `📉 En Bonne Voie : -${delta.toFixed(1)} kg pour atteindre la cible`,
        message: `Actuel : ${curWeight.toFixed(1)} kg ➔ Cible : ${targetWeight.toFixed(1)} kg. Le drainage lymphatique et l'alimentation vivante portent leurs fruits.`,
        progressPct: progressPct !== null ? progressPct : 60,
        delta,
        isGoalReached: false
      };
    } else {
      return {
        status: 'loss_far',
        badgeText: `📉 -${delta.toFixed(1)} kg à perdre`,
        badgeColor: '#818cf8',
        badgeBg: 'rgba(129,140,248,0.15)',
        title: `🎯 Cap sur ${targetWeight.toFixed(1)} kg (Écart : -${delta.toFixed(1)} kg)`,
        message: `Actuel : ${curWeight.toFixed(1)} kg. Chaque cycle de régénération nettoie le terrain cellulaire. Progressez à votre rythme sans forcer.`,
        progressPct: progressPct !== null ? progressPct : 30,
        delta,
        isGoalReached: false
      };
    }
  }

  // Case 3: WEIGHT GAIN GOAL (Current < Target, delta < 0)
  if (delta < 0) {
    const isVeryClose = absDelta <= 2.0;
    const isClose = absDelta > 2.0 && absDelta <= 5.0;

    let progressPct = null;
    if (!isNaN(startWeight) && startWeight < targetWeight) {
      const totalToGain = targetWeight - startWeight;
      const alreadyGained = curWeight - startWeight;
      if (totalToGain > 0) {
        progressPct = Math.min(99, Math.max(1, Math.round((alreadyGained / totalToGain) * 100)));
      }
    }

    if (isVeryClose) {
      return {
        status: 'gain_very_close',
        badgeText: `💪 +${absDelta.toFixed(1)} kg (Presque atteint)`,
        badgeColor: '#34d399',
        badgeBg: 'rgba(52,211,153,0.18)',
        title: `💪 Presque au Sommet : Plus que +${absDelta.toFixed(1)} kg !`,
        message: `Actuel : ${curWeight.toFixed(1)} kg (cible ${targetWeight.toFixed(1)} kg). Excellente assimilation cellulaire des nutriments denses !`,
        progressPct: progressPct !== null ? progressPct : 90,
        delta,
        isGoalReached: false
      };
    } else if (isClose) {
      return {
        status: 'gain_in_progress',
        badgeText: `📈 +${absDelta.toFixed(1)} kg restant`,
        badgeColor: '#38bdf8',
        badgeBg: 'rgba(56,189,248,0.15)',
        title: `📈 Phase d'Assimilation : +${absDelta.toFixed(1)} kg restant`,
        message: `Actuel : ${curWeight.toFixed(1)} kg ➔ Cible : ${targetWeight.toFixed(1)} kg. Poursuivez l'apport d'aliments reminéralisants (bananes, graines germées, oléagineux trempés).`,
        progressPct: progressPct !== null ? progressPct : 55,
        delta,
        isGoalReached: false
      };
    } else {
      return {
        status: 'gain_far',
        badgeText: `📈 +${absDelta.toFixed(1)} kg à gagner`,
        badgeColor: '#a78bfa',
        badgeBg: 'rgba(167,139,250,0.15)',
        title: `🌱 Objectif Reminéralisation : +${absDelta.toFixed(1)} kg`,
        message: `Actuel : ${curWeight.toFixed(1)} kg (Cible : ${targetWeight.toFixed(1)} kg). Soutenez l'anabolisme naturel avec une nutrition dense et un sommeil réparateur.`,
        progressPct: progressPct !== null ? progressPct : 25,
        delta,
        isGoalReached: false
      };
    }
  }
}

// ═══════ TARGET WEIGHT MODAL CONTROLLER ═══════
function openTargetWeightModal() {
  const modal = document.getElementById('targetWeightModal');
  const input = document.getElementById('targetWeightModalInput');
  if (!modal) return;

  const profile = typeof getUserProfile === 'function' ? getUserProfile() : {};
  const currentTarget = parseFloat(profile.targetWeight);
  const currentActual = parseFloat(profile.currentWeight) || (store.get('weight_history', []).slice(-1)[0]?.weight) || 70.0;

  if (input) {
    input.value = (!isNaN(currentTarget) && currentTarget > 20) ? currentTarget.toFixed(1) : currentActual.toFixed(1);
    setTimeout(() => {
      input.focus();
      input.select();
    }, 60);
  }

  modal.style.display = 'flex';
  modal.classList.add('open');
}

function closeTargetWeightModal(e) {
  if (e && e.target && e.target !== e.currentTarget && !e.target.classList.contains('modal-close-btn') && !e.target.closest('.modal-close-btn')) return;
  const modal = document.getElementById('targetWeightModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('open');
  }
}

function stepTargetWeight(delta) {
  const input = document.getElementById('targetWeightModalInput');
  if (!input) return;
  let val = parseFloat(input.value) || 70.0;
  val = Math.round((val + delta) * 10) / 10;
  if (val < 20) val = 20;
  if (val > 300) val = 300;
  input.value = val.toFixed(1);
}

function handleTargetWeightForm(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('targetWeightModalInput');
  if (!input) return;

  const tw = parseFloat(input.value.replace(',', '.'));
  if (isNaN(tw) || tw < 20 || tw > 300) {
    showToast('Veuillez entrer un objectif de poids réaliste (ex: 68.5 kg).', 'error');
    return;
  }

  const profile = store.get('profile', {});
  profile.targetWeight = tw.toFixed(1);
  store.set('profile', profile);
  store.set('user_profile', profile);

  if (document.getElementById('profileTargetWeight')) {
    document.getElementById('profileTargetWeight').value = profile.targetWeight;
  }

  showToast(`🎯 Objectif de poids fixé à ${tw.toFixed(1)} kg !`, 'success');
  closeTargetWeightModal();
  renderWeightChart();
}

function clearTargetWeight() {
  const profile = store.get('profile', {});
  profile.targetWeight = '';
  store.set('profile', profile);
  store.set('user_profile', profile);

  if (document.getElementById('profileTargetWeight')) {
    document.getElementById('profileTargetWeight').value = '';
  }

  showToast('Objectif de poids réinitialisé.', 'info');
  closeTargetWeightModal();
  renderWeightChart();
}

window.openTargetWeightModal = openTargetWeightModal;
window.closeTargetWeightModal = closeTargetWeightModal;
window.stepTargetWeight = stepTargetWeight;
window.handleTargetWeightForm = handleTargetWeightForm;
window.clearTargetWeight = clearTargetWeight;
window.calculateTargetWeightInsight = calculateTargetWeightInsight;

// ═══════ MODERN WEIGHT ANALYTICS & INTERACTIVE CHART ═══════
let currentWeightPeriod = 'all';

function setWeightPeriod(period) {
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

function renderWeightChart() {
  const container = document.getElementById('weightChartContainer');
  const empty = document.getElementById('weightChartEmpty');
  const svg = document.getElementById('weightChartSvg');
  const tooltip = document.getElementById('weightChartTooltip');
  if (!container || !empty || !svg) return;

  const history = sanitizeWeightHistory(store.get('weight_history', []));
  const profile = typeof getUserProfile === 'function' ? getUserProfile() : {};

  // Sort all entries chronologically
  const allSorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Update KPI cards regardless of filter
  const curWeightEl = document.getElementById('kpiCurrentWeight');
  const deltaBadgeEl = document.getElementById('kpiDeltaBadge');
  const totalDeltaEl = document.getElementById('kpiTotalDelta');
  const avg7dEl = document.getElementById('kpiAvg7d');
  const targetWeightEl = document.getElementById('kpiTargetWeight');
  const bannerEl = document.getElementById('weightGoalDynamicBanner');

  const curWeightVal = allSorted.length > 0 ? allSorted[allSorted.length - 1].weight : (parseFloat(profile.currentWeight) || null);
  const startWeightVal = allSorted.length > 0 ? allSorted[0].weight : curWeightVal;
  const targetWeightVal = parseFloat(profile.targetWeight);

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

  // 🎯 Calculate Target Weight Insight
  const insight = calculateTargetWeightInsight(curWeightVal, targetWeightVal, startWeightVal);

  if (targetWeightEl) {
    if (insight.status === 'unset') {
      targetWeightEl.innerHTML = `
        <button type="button" onclick="event.stopPropagation(); openTargetWeightModal()" class="btn-set-target-cta">
          <i class="ri-add-circle-fill"></i> <span>Définir cible</span>
        </button>
      `;
    } else {
      targetWeightEl.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:2px; width:100%;">
          <div style="display:flex; align-items:baseline; justify-content:space-between; width:100%;">
            <span style="font-size:1.35rem; font-weight:800; color:#60a5fa;">${targetWeightVal.toFixed(1)} kg</span>
            <button type="button" onclick="event.stopPropagation(); openTargetWeightModal()" class="target-edit-chip" title="Modifier l'objectif"><i class="ri-pencil-line"></i></button>
          </div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
            <span style="font-size:0.7rem; font-weight:700; color:${insight.badgeColor}; background:${insight.badgeBg}; padding:2px 6px; border-radius:6px;">
              ${insight.badgeText}
            </span>
          </div>
        </div>
      `;
    }
  }

  // 💡 Dynamic Insight Banner
  if (bannerEl) {
    if (insight.status === 'unset') {
      bannerEl.style.display = 'flex';
      bannerEl.style.background = 'rgba(96,165,250,0.06)';
      bannerEl.style.borderColor = 'rgba(96,165,250,0.2)';
      bannerEl.innerHTML = `
        <div style="width:36px; height:36px; border-radius:50%; background:rgba(96,165,250,0.15); display:flex; align-items:center; justify-content:center; color:#60a5fa; font-size:1.2rem; flex-shrink:0;">
          <i class="ri-focus-3-line"></i>
        </div>
        <div style="flex:1;">
          <div style="font-size:0.85rem; font-weight:700; color:#60a5fa;">${insight.title}</div>
          <div style="font-size:0.78rem; color:var(--text-dim); margin-top:2px; line-height:1.4;">${insight.message}</div>
        </div>
        <button type="button" onclick="openTargetWeightModal()" class="chip-btn" style="background:#60a5fa; color:#0f172a; font-weight:700; border:none; padding:6px 12px; font-size:0.78rem; flex-shrink:0; cursor:pointer;">
          + Définir
        </button>
      `;
    } else {
      bannerEl.style.display = 'flex';
      const borderCol = insight.isGoalReached ? 'rgba(52,211,153,0.35)' : 'rgba(96,165,250,0.25)';
      const bgCol = insight.isGoalReached ? 'rgba(52,211,153,0.08)' : 'rgba(96,165,250,0.06)';
      bannerEl.style.background = bgCol;
      bannerEl.style.borderColor = borderCol;

      const progressHtml = insight.progressPct !== null ? `
        <div style="margin-top:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.72rem; font-weight:700; margin-bottom:4px;">
            <span style="color:var(--text-dim);">Progression vers l'objectif</span>
            <span style="color:${insight.badgeColor};">${insight.progressPct}%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
            <div style="height:100%; width:${insight.progressPct}%; background:linear-gradient(90deg, #3b82f6, ${insight.badgeColor}); border-radius:10px; transition:width 0.6s ease;"></div>
          </div>
        </div>
      ` : '';

      bannerEl.innerHTML = `
        <div style="display:flex; align-items:flex-start; gap:12px; width:100%;">
          <div style="width:36px; height:36px; border-radius:50%; background:${insight.badgeBg}; display:flex; align-items:center; justify-content:center; color:${insight.badgeColor}; font-size:1.2rem; flex-shrink:0;">
            <i class="${insight.isGoalReached ? 'ri-trophy-fill' : 'ri-compass-3-line'}"></i>
          </div>
          <div style="flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
              <div style="font-size:0.86rem; font-weight:800; color:${insight.badgeColor};">${insight.title}</div>
              <button type="button" onclick="openTargetWeightModal()" style="background:none; border:none; color:var(--text-dim); font-size:0.75rem; cursor:pointer; display:flex; align-items:center; gap:4px; padding:0;">
                <i class="ri-edit-line"></i> Modifier
              </button>
            </div>
            <div style="font-size:0.78rem; color:var(--text-dim); margin-top:3px; line-height:1.45;">${insight.message}</div>
            ${progressHtml}
          </div>
        </div>
      `;
    }
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
  const svgHeight = 260;

  const margin = { top: 32, right: 35, bottom: 48, left: 68 };
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

  // Grid lines & Y Axis Labels (Sophisticated VitalTrack Theme)
  let gridLinesHtml = '';
  let yLabelsHtml = `
    <text x="${margin.left - 14}" y="${margin.top - 12}" fill="var(--accent, #34d399)" font-size="10" font-weight="800" letter-spacing="0.5px" text-anchor="end">POIDS (KG)</text>
  `;
  for (let v = yMin; v <= yMax + 0.001; v += step) {
    const rounded = Math.round(v * 10) / 10;
    const yPos = margin.top + chartH - ((rounded - yMin) / yRange) * chartH;
    gridLinesHtml += `<line x1="${margin.left}" y1="${yPos}" x2="${margin.left + chartW}" y2="${yPos}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4,4" />`;
    yLabelsHtml += `<text x="${margin.left - 14}" y="${yPos + 4}" fill="var(--text-dim, #94a3b8)" font-size="11" font-weight="600" font-family="'Outfit', 'Inter', -apple-system, sans-serif" text-anchor="end">${rounded}</text>`;
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
        <text x="${margin.left + chartW}" y="${targetY - 8}" fill="#60a5fa" font-size="10" font-weight="700" font-family="'Outfit', 'Inter', sans-serif" text-anchor="end">Cible ${targetW} kg</text>
      </g>
    `;
  }

  // Points and Non-Overlapping X date labels
  let pointsHtml = '';
  let xLabelsHtml = '';
  let lastRenderedX = -999;

  coords.forEach((pt, i) => {
    const isFirst = (i === 0);
    const isLast = (i === coords.length - 1);
    const d = new Date(pt.entry.date);
    const dateFormatted = isNaN(d.getTime()) ? pt.entry.date : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    // Sophisticated point marker with glow
    pointsHtml += `
      <g class="chart-point-group" data-idx="${i}">
        <circle cx="${pt.x}" cy="${pt.y}" r="7" fill="var(--accent, #34d399)" opacity="0.18" />
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--accent, #34d399)" stroke="#0f172a" stroke-width="2" />
      </g>
    `;

    // Only render label if not colliding with last rendered label (min 50px clearance)
    const isFarEnough = (pt.x - lastRenderedX >= 50);
    const isNotTooCloseToEnd = (margin.left + chartW - pt.x >= 35);
    if (isFirst || isLast || (isFarEnough && isNotTooCloseToEnd)) {
      let anchor = 'middle';
      let xPos = pt.x;
      if (isFirst) {
        anchor = 'start';
        xPos = Math.max(margin.left, pt.x - 2);
      } else if (isLast) {
        anchor = 'end';
        xPos = Math.min(margin.left + chartW, pt.x + 2);
      }

      xLabelsHtml += `
        <text x="${xPos}" y="${margin.top + chartH + 22}" fill="var(--text-dim, #94a3b8)" font-size="10.5" font-weight="600" font-family="'Outfit', 'Inter', -apple-system, sans-serif" text-anchor="${anchor}">${dateFormatted}</text>
      `;
      lastRenderedX = pt.x;
    }
  });

  svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent, #34d399)" stop-opacity="0.28" />
        <stop offset="100%" stop-color="var(--accent, #34d399)" stop-opacity="0.0" />
      </linearGradient>
      <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(52, 211, 153, 0.4)" />
      </filter>
    </defs>
    ${gridLinesHtml}
    ${yLabelsHtml}
    ${targetLineHtml}
    <line x1="${margin.left}" y1="${margin.top + chartH}" x2="${margin.left + chartW}" y2="${margin.top + chartH}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
    ${coords.length > 1 ? `<path d="${areaPathD}" fill="url(#weightAreaGradient)" />` : ''}
    ${coords.length > 1 ? `<path d="${linePathD}" fill="none" stroke="var(--accent, #34d399)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glowLine)" />` : ''}
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
        <div style="font-weight:800; font-size:0.92rem; color:var(--text); display:flex; align-items:baseline; gap:8px;">
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
function updateDashStats() {
  if (originalUpdateDash) originalUpdateDash();
  renderWeightChart();
  updateCircadianWidget();
};

// ═══════ INTERACTIVE 24H CIRCADIAN RHYTHM & CHRONOBIOLOGY CONTROLLER ═══════
let _isCircadianDragging = false;

function openCircadianScienceModal() {
  const modal = document.getElementById('circadianScienceModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}
window.openCircadianScienceModal = openCircadianScienceModal;

function closeCircadianScienceModal(e) {
  if (e && e.target && e.target.id !== 'circadianScienceModal' && !e.target.closest('.modal-close') && !e.target.closest('.btn-primary')) {
    return;
  }
  const modal = document.getElementById('circadianScienceModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
window.closeCircadianScienceModal = closeCircadianScienceModal;

function getCircadianPhaseData(h, m = 0) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  
  let shortCycle = '';
  let fullCycle = '';
  let iconClass = '';
  let descText = '';
  let phaseColor = '';
  let phaseWindow = '';
  let organName = '';
  let organWindow = '';
  let organIcon = '🫘';
  let organBadgeBg = 'rgba(245,158,11,0.12)';
  let organColor = '#f59e0b';
  let hormoneStatus = '';
  let metabolismTag = '';
  let hormoneIcon = '⚡';
  let hormoneBadgeBg = 'rgba(56,189,248,0.12)';
  let hormoneColor = '#38bdf8';
  let actionChips = [];

  if (h >= 4 && h < 6) {
    shortCycle = 'ÉLIMINATION (Aube)';
    fullCycle = 'ÉLIMINATION & DRAINAGE LYMPHATIQUE';
    iconClass = 'ri-sun-cloudy-fill';
    phaseWindow = '04h - 06h';
    descText = "04h - 06h • Pic de filtration rénale et réveil des émonctoires. Hydratation tiède à jeun (eau citronnée, sève).";
    phaseColor = isLight ? '#b45309' : '#f59e0b';
    organName = "Poumons & Lymphe (03h-05h) • Gros Intestin (05h-07h)";
    organWindow = "04h - 06h";
    organIcon = "🫁";
    organBadgeBg = "rgba(245,158,11,0.15)";
    organColor = "#f59e0b";
    hormoneStatus = "Montée du Cortisol • Insuline Basse (Détox active)";
    metabolismTag = "Catabolisme Détox";
    hormoneIcon = "⚡";
    hormoneBadgeBg = "rgba(56,189,248,0.15)";
    hormoneColor = "#38bdf8";
    actionChips = [
      { icon: '💧', label: 'Eau Tiède Citronnée' },
      { icon: '🌬️', label: 'Respiration Prānique' }
    ];
  } else if (h >= 6 && h < 8) {
    shortCycle = 'ÉLIMINATION';
    fullCycle = 'ÉVACUATION DU CÔLON & RÉVEIL';
    iconClass = 'ri-sun-foggy-fill';
    phaseWindow = '06h - 08h';
    descText = "06h - 08h • Le côlon est en motilité péristaltique maximale. Favorisez l'élimination et la lumière naturelle.";
    phaseColor = isLight ? '#a16207' : '#eab308';
    organName = "Gros Intestin (05h-07h) • Estomac (07h-09h)";
    organWindow = "06h - 08h";
    organIcon = "🌱";
    organBadgeBg = "rgba(234,179,8,0.15)";
    organColor = "#eab308";
    hormoneStatus = "Pic Matinal de Cortisol (Éveil) • Arrêt Mélatonine";
    metabolismTag = "Éveil & Motilité";
    hormoneIcon = "☀️";
    hormoneBadgeBg = "rgba(245,158,11,0.15)";
    hormoneColor = "#f59e0b";
    actionChips = [
      { icon: '🍋', label: 'Hydratation Électrolytique' },
      { icon: '🚶', label: 'Mouvement & Étirements' }
    ];
  } else if (h >= 8 && h < 10) {
    shortCycle = 'PRÉPARATION';
    fullCycle = 'RÉVEIL ENZYMATIQUE & ESTOMAC';
    iconClass = 'ri-sun-foggy-fill';
    phaseWindow = '08h - 10h';
    descText = "08h - 10h • Préchauffage des sucs gastriques. Privilégiez les fruits vivants aqueux ou prolongez le jeûne.";
    phaseColor = isLight ? '#a16207' : '#eab308';
    organName = "Estomac (07h-09h) • Rate & Pancréas (09h-11h)";
    organWindow = "08h - 10h";
    organIcon = "🫘";
    organBadgeBg = "rgba(234,179,8,0.15)";
    organColor = "#eab308";
    hormoneStatus = "Sécrétion de Ghréline • Enzymes Salivaires Actives";
    metabolismTag = "Transition Digestive";
    hormoneIcon = "⚡";
    hormoneBadgeBg = "rgba(56,189,248,0.15)";
    hormoneColor = "#38bdf8";
    actionChips = [
      { icon: '🍉', label: 'Fruits Aqueux Vivants' },
      { icon: '🍵', label: 'Infusion Dépurative' }
    ];
  } else if (h >= 10 && h < 12) {
    shortCycle = 'TRANSITION';
    fullCycle = 'ACTIVATION PANCRÉATIQUE & VIGILANCE';
    iconClass = 'ri-sun-line';
    phaseWindow = '10h - 12h';
    descText = "10h - 12h • Pic de clarté mentale et préparation enzymatique de la rate et du pancréas avant le déjeuner.";
    phaseColor = isLight ? '#047857' : '#10b981';
    organName = "Rate & Pancréas (09h-11h) • Cœur (11h-13h)";
    organWindow = "10h - 12h";
    organIcon = "⚡";
    organBadgeBg = "rgba(16,185,129,0.15)";
    organColor = "#10b981";
    hormoneStatus = "Pic de Vigilance Cérébrale • Dopamine Active";
    metabolismTag = "Optimisation Énergétique";
    hormoneIcon = "🧠";
    hormoneBadgeBg = "rgba(168,85,247,0.15)";
    hormoneColor = "#a855f7";
    actionChips = [
      { icon: '💧', label: 'Hydratation Pré-Repas' },
      { icon: '🥗', label: 'Repas Vivant' }
    ];
  } else if (h >= 12 && h < 14) {
    shortCycle = 'APPROPRIATION';
    fullCycle = 'APPROPRIATION & FEU DIGESTIF';
    iconClass = 'ri-sun-fill';
    phaseWindow = '12h - 14h';
    descText = "12h - 14h • Feu digestif au maximum. Fenêtre optimale pour le repas principal dense, alcalinisant et nutritif.";
    phaseColor = isLight ? '#047857' : '#10b981';
    organName = "Cœur (11h-13h) • Intestin Grêle (13h-15h)";
    organWindow = "12h - 14h";
    organIcon = "🔥";
    organBadgeBg = "rgba(16,185,129,0.15)";
    organColor = "#10b981";
    hormoneStatus = "Sensibilité Maximale à l'Insuline • Pic Sucs Gastriques";
    metabolismTag = "Anabolisme Nutritionnel";
    hormoneIcon = "🥗";
    hormoneBadgeBg = "rgba(16,185,129,0.15)";
    hormoneColor = "#10b981";
    actionChips = [
      { icon: '🥗', label: 'Repas Dense & Vivant' },
      { icon: '🥑', label: 'Lipides Sains & Chlorophylle' }
    ];
  } else if (h >= 14 && h < 16) {
    shortCycle = 'ASSIMILATION';
    fullCycle = 'ABSORPTION MICRONUTRITIONNELLE';
    iconClass = 'ri-sun-fill';
    phaseWindow = '14h - 16h';
    descText = "14h - 16h • L'intestin grêle filtre et absorbe les micronutriments. Marche digestive recommandée.";
    phaseColor = isLight ? '#047857' : '#10b981';
    organName = "Intestin Grêle (13h-15h) • Vessie (15h-17h)";
    organWindow = "14h - 16h";
    organIcon = "🧬";
    organBadgeBg = "rgba(16,185,129,0.15)";
    organColor = "#10b981";
    hormoneStatus = "Captation Cellulaire du Glucose • Transport Actif";
    metabolismTag = "Assimilation & Stockage";
    hormoneIcon = "🚶";
    hormoneBadgeBg = "rgba(56,189,248,0.15)";
    hormoneColor = "#38bdf8";
    actionChips = [
      { icon: '🚶', label: 'Marche Post-Prandiale' },
      { icon: '🫖', label: 'Tisane Digestive (Boldo/Camomille)' }
    ];
  } else if (h >= 16 && h < 18) {
    shortCycle = 'FILTRATION';
    fullCycle = 'DRAINAGE URINAIRE & REINS';
    iconClass = 'ri-sunset-fill';
    phaseWindow = '16h - 18h';
    descText = "16h - 18h • Filtration active de l'urée et des toxines par les reins. Idéal pour une tisane minéralisante.";
    phaseColor = isLight ? '#0f766e' : '#14b8a6';
    organName = "Vessie (15h-17h) • Reins & Filtration (17h-19h)";
    organWindow = "16h - 18h";
    organIcon = "💧";
    organBadgeBg = "rgba(20,184,166,0.15)";
    organColor = "#14b8a6";
    hormoneStatus = "Chute Graduelle du Cortisol • Thermorégulation";
    metabolismTag = "Épuration Rénale";
    hormoneIcon = "🫖";
    hormoneBadgeBg = "rgba(20,184,166,0.15)";
    hormoneColor = "#14b8a6";
    actionChips = [
      { icon: '🌿', label: 'Infusion Ortie / Abuta' },
      { icon: '💧', label: 'Hydratation Rénale' }
    ];
  } else if (h >= 18 && h < 20) {
    shortCycle = 'APPROPRIATION';
    fullCycle = 'CLÔTURE DU REPAS & TRANSITION';
    iconClass = 'ri-sunset-fill';
    phaseWindow = '18h - 20h';
    descText = "18h - 20h • Fin de la fenêtre d'alimentation. Dîner léger avant 20h pour permettre la vidange gastrique.";
    phaseColor = isLight ? '#0f766e' : '#14b8a6';
    organName = "Reins (17h-19h) • Péricarde & Circulation (19h-21h)";
    organWindow = "18h - 20h";
    organIcon = "🥣";
    organBadgeBg = "rgba(20,184,166,0.15)";
    organColor = "#14b8a6";
    hormoneStatus = "Baisse de l'Insuline • Début du Repos Digestif";
    metabolismTag = "Transition Nocturne";
    hormoneIcon = "🍵";
    hormoneBadgeBg = "rgba(56,189,248,0.15)";
    hormoneColor = "#38bdf8";
    actionChips = [
      { icon: '🍲', label: 'Dîner Léger & Minéral' },
      { icon: '🍵', label: 'Tisane Digestive' }
    ];
  } else if (h >= 20 && h < 22) {
    shortCycle = 'ASSIMILATION';
    fullCycle = 'ASSIMILATION CELLULAIRE & DÉTENTE';
    iconClass = 'ri-moon-fill';
    phaseWindow = '20h - 22h';
    descText = "20h - 22h • Montée de la mélatonine et activation du Complexe Moteur Migrant (CMM) pour nettoyer le tube digestif.";
    phaseColor = isLight ? '#4338ca' : '#818cf8';
    organName = "Péricarde (19h-21h) • Système Endocrinien (21h-23h)";
    organWindow = "20h - 22h";
    organIcon = "🌙";
    organBadgeBg = "rgba(129,140,248,0.15)";
    organColor = "#818cf8";
    hormoneStatus = "Sécrétion de Mélatonine • Chute Température Corporelle";
    metabolismTag = "Repos Métabolique";
    hormoneIcon = "🕯️";
    hormoneBadgeBg = "rgba(129,140,248,0.15)";
    hormoneColor = "#818cf8";
    actionChips = [
      { icon: '🕯️', label: 'Lumière Tamisée / Sans Écrans' },
      { icon: '🫁', label: 'Cohérence Cardiaque 5.5s' }
    ];
  } else if (h >= 22 || h < 0) {
    shortCycle = 'SOMMEIL';
    fullCycle = 'ÉQUILIBRE ENDOCRINIEN & SOMMEIL';
    iconClass = 'ri-moon-fill';
    phaseWindow = '22h - 00h';
    descText = "22h - 00h • Sommeil réparateur. Le cerveau active le drainage glymphatique pour évacuer les déchets métaboliques.";
    phaseColor = isLight ? '#4338ca' : '#818cf8';
    organName = "Système Endocrinien (21h-23h) • Vésicule (23h-01h)";
    organWindow = "22h - 00h";
    organIcon = "😴";
    organBadgeBg = "rgba(129,140,248,0.15)";
    organColor = "#818cf8";
    hormoneStatus = "Hormone de Croissance (GH) • Chute Tension Artérielle";
    metabolismTag = "Régénération Tissulaire";
    hormoneIcon = "🛌";
    hormoneBadgeBg = "rgba(168,85,247,0.15)";
    hormoneColor = "#a855f7";
    actionChips = [
      { icon: '🛌', label: 'Sommeil Réparateur' },
      { icon: '🧠', label: 'Nettoyage Glymphatique' }
    ];
  } else if (h >= 0 && h < 2) {
    shortCycle = 'AUTOPHAGIE';
    fullCycle = 'DÉTOX VÉSICULAIRE & AUTOLYSE';
    iconClass = 'ri-moon-clear-fill';
    phaseWindow = '00h - 02h';
    descText = "00h - 02h • Autophagie cellulaire active : recyclage des mitochondries usées et des protéines altérées.";
    phaseColor = isLight ? '#7e22ce' : '#a855f7';
    organName = "Vésicule Biliaire (23h-01h) • Foie (01h-03h)";
    organWindow = "00h - 02h";
    organIcon = "🧬";
    organBadgeBg = "rgba(168,85,247,0.15)";
    organColor = "#a855f7";
    hormoneStatus = "Pic d'Hormone de Croissance • Autophagie Phase 1";
    metabolismTag = "Autophagie & Réparation ADN";
    hormoneIcon = "🛡️";
    hormoneBadgeBg = "rgba(168,85,247,0.15)";
    hormoneColor = "#a855f7";
    actionChips = [
      { icon: '🛡️', label: 'Autophagie Cellulaire' },
      { icon: '✨', label: 'Recyclage Mitochondries' }
    ];
  } else {
    shortCycle = 'RÉGÉNÉRATION';
    fullCycle = 'PURIFICATION DU FOIE & SANG';
    iconClass = 'ri-moon-clear-fill';
    phaseWindow = '02h - 04h';
    descText = "02h - 04h • Le foie accomplit son pic de bio-transformation enzymatique nocturne. Tout le sang est filtré et épuré.";
    phaseColor = isLight ? '#7e22ce' : '#a855f7';
    organName = "Foie & Détox Profonde (01h-03h) • Poumons (03h-05h)";
    organWindow = "02h - 04h";
    organIcon = "🌿";
    organBadgeBg = "rgba(168,85,247,0.15)";
    organColor = "#a855f7";
    hormoneStatus = "Filtration Hépato-Biliaire • Synthèse Antioxydante";
    metabolismTag = "Dépuration Sanguine";
    hormoneIcon = "🩸";
    hormoneBadgeBg = "rgba(239,68,68,0.15)";
    hormoneColor = "#ef4444";
    actionChips = [
      { icon: '🩸', label: 'Purification du Sang' },
      { icon: '💤', label: 'Repos Réparateur Total' }
    ];
  }

  return {
    shortCycle,
    fullCycle,
    iconClass,
    descText,
    phaseColor,
    phaseWindow,
    organName,
    organWindow,
    organIcon,
    organBadgeBg,
    organColor,
    hormoneStatus,
    metabolismTag,
    hormoneIcon,
    hormoneBadgeBg,
    hormoneColor,
    actionChips
  };
}

function updateCircadianDisplay(h, m, isScrubbing = false) {
  const clockTime = document.getElementById('clockTime');
  const clockPhase = document.getElementById('clockPhase');
  const clockIndicator = document.getElementById('clockIndicator');
  const phaseIcon = document.getElementById('phaseIcon');
  const phaseIconBadge = document.getElementById('phaseIconBadge');
  const phaseTitle = document.getElementById('phaseTitle');
  const phaseDesc = document.getElementById('phaseDesc');
  const phaseWindowPill = document.getElementById('phaseWindowPill');
  const phaseActionChips = document.getElementById('phaseActionChips');
  const timePill = document.getElementById('circadianTimePill');
  const hintEl = document.getElementById('clockDragHint');

  // Chrono elements
  const organNameEl = document.getElementById('circadianOrganName');
  const organWindowEl = document.getElementById('circadianOrganWindow');
  const organIconEl = document.getElementById('circadianOrganIcon');
  const organBadgeEl = document.getElementById('circadianOrganIconBadge');
  const hormoneStatusEl = document.getElementById('circadianHormoneStatus');
  const metabolismTagEl = document.getElementById('circadianMetabolismTag');
  const hormoneIconEl = document.getElementById('circadianHormoneIcon');
  const hormoneBadgeEl = document.getElementById('circadianHormoneIconBadge');

  const mPad = m.toString().padStart(2, '0');
  const timeStr = `${h.toString().padStart(2, '0')}:${mPad}`;

  if (clockTime) clockTime.textContent = timeStr;
  if (!isScrubbing && timePill) timePill.textContent = timeStr;

  const data = getCircadianPhaseData(h, m);

  if (clockPhase) {
    clockPhase.textContent = data.shortCycle;
    clockPhase.style.color = data.phaseColor;
  }
  if (phaseTitle) {
    phaseTitle.textContent = data.fullCycle;
    phaseTitle.style.color = data.phaseColor;
  }
  if (phaseDesc) {
    phaseDesc.textContent = data.descText;
  }
  if (phaseWindowPill) {
    phaseWindowPill.textContent = data.phaseWindow;
  }
  if (phaseIcon) {
    phaseIcon.className = data.iconClass;
    phaseIcon.style.color = data.phaseColor;
  }
  if (phaseIconBadge) {
    phaseIconBadge.style.borderColor = data.phaseColor;
    phaseIconBadge.style.color = data.phaseColor;
  }

  // Update Action Chips
  if (phaseActionChips && data.actionChips) {
    phaseActionChips.innerHTML = data.actionChips.map(c => `
      <span class="phase-chip"><span>${c.icon}</span><span>${c.label}</span></span>
    `).join('');
  }

  // Update Organ Peak Card
  if (organNameEl) organNameEl.textContent = data.organName;
  if (organWindowEl) organWindowEl.textContent = data.organWindow;
  if (organIconEl) organIconEl.textContent = data.organIcon;
  if (organBadgeEl) {
    organBadgeEl.style.background = data.organBadgeBg;
    organBadgeEl.style.color = data.organColor;
  }

  // Update Hormonal Card
  if (hormoneStatusEl) hormoneStatusEl.textContent = data.hormoneStatus;
  if (metabolismTagEl) metabolismTagEl.textContent = data.metabolismTag;
  if (hormoneIconEl) hormoneIconEl.textContent = data.hormoneIcon;
  if (hormoneBadgeEl) {
    hormoneBadgeEl.style.background = data.hormoneBadgeBg;
    hormoneBadgeEl.style.color = data.hormoneColor;
  }

  if (clockIndicator) {
    const minutesTotal = h * 60 + m;
    const angle = 180 + (minutesTotal / 1440) * 360;
    clockIndicator.innerHTML = `<i class="${data.iconClass}" style="color:${data.phaseColor}"></i>`;
    clockIndicator.style.transform = `rotate(${angle}deg) translateY(-97px) rotate(-${angle}deg)`;
  }

  if (hintEl) {
    if (isScrubbing) {
      hintEl.innerHTML = `<i class="ri-refresh-line ri-spin" style="color:var(--accent)"></i> <strong style="color:var(--accent)">Exploration en cours : Relâchez pour revenir à l'heure actuelle</strong>`;
    } else {
      hintEl.innerHTML = `<i class="ri-drag-move-2-line"></i> <span>Faites tourner l'horloge pour explorer le cycle 24h</span>`;
    }
  }
}

function updateCircadianWidget() {
  if (_isCircadianDragging) return;
  const timeEl = document.getElementById('circadianTimePill');
  if (!timeEl) return;

  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  updateCircadianDisplay(h, m, false);
}

function initCircadianClockInteractivity() {
  const ring = document.getElementById('circadianClockRing');
  if (!ring || ring._hasCircadianEvents) return;
  ring._hasCircadianEvents = true;

  function getTimeFromEvent(clientX, clientY) {
    const rect = ring.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let deg = Math.atan2(dx, -dy) * (180 / Math.PI);
    if (deg < 0) deg += 360;

    let normDeg = (deg - 180 + 360) % 360;
    let totalMinutes = Math.round((normDeg / 360) * 1440);
    if (totalMinutes >= 1440) totalMinutes = 0;

    totalMinutes = Math.round(totalMinutes / 5) * 5;
    if (totalMinutes >= 1440) totalMinutes = 0;

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h, m };
  }

  function handleStart(clientX, clientY) {
    _isCircadianDragging = true;
    ring.classList.add('dragging');
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (_) {}
    }
    const { h, m } = getTimeFromEvent(clientX, clientY);
    updateCircadianDisplay(h, m, true);
  }

  function handleMove(clientX, clientY) {
    if (!_isCircadianDragging) return;
    const { h, m } = getTimeFromEvent(clientX, clientY);
    updateCircadianDisplay(h, m, true);
  }

  function handleEnd() {
    if (!_isCircadianDragging) return;
    _isCircadianDragging = false;
    ring.classList.remove('dragging');
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch (_) {}
    }
    setTimeout(() => {
      updateCircadianWidget();
    }, 50);
  }

  // Pointer Events (Mouse, Pen, Touch modern)
  ring.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (ring.setPointerCapture && e.pointerId) {
      try { ring.setPointerCapture(e.pointerId); } catch (_) {}
    }
    handleStart(e.clientX, e.clientY);
  });
  ring.addEventListener('pointermove', (e) => {
    if (_isCircadianDragging) {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    }
  });
  ring.addEventListener('pointerup', (e) => {
    handleEnd();
  });
  ring.addEventListener('pointercancel', (e) => {
    handleEnd();
  });

  // Touch Events fallback for iOS WebKit
  ring.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      e.preventDefault();
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  ring.addEventListener('touchmove', (e) => {
    if (_isCircadianDragging && e.touches && e.touches[0]) {
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  ring.addEventListener('touchend', (e) => {
    handleEnd();
  }, { passive: true });

  ring.addEventListener('touchcancel', (e) => {
    handleEnd();
  }, { passive: true });
}

updateCircadianWidget();
setInterval(updateCircadianWidget, 30000);
document.addEventListener('DOMContentLoaded', () => {
  updateCircadianWidget();
  initCircadianClockInteractivity();
});
window.initCircadianClockInteractivity = initCircadianClockInteractivity;

// ═══════════════════════════════════════════════════════════════════════════════
// MASCOT STUDIO HD MODAL CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
let _inAppMascotRenderer = null;
const _mascotQuotes = {
  idle: "Prêt à explorer la vitalité naturelle et drainer les acides !",
  walk: "En route pour stimuler la lymphe et activer la motilité péristaltique ! 🚶",
  laugh: "Hahaha ! La joie et la respiration profonde alcalinisent le terrain ! 😄",
  coo: "Roucouuu ! Écoute le chant de tes cellules régénérées. 🐦",
  think: "J'analyse les flavonoïdes, le PRAL et la charge en mucus... 🧐",
  celebrate: "Félicitations pour tes victoires vitalistes ! 🎉",
  sleep: "Réparation cellulaire et autolyse des déchets... Bonne nuit ! 😴"
};

function openMascotStudioModal() {
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

function closeMascotStudioModal() {
  const modal = document.getElementById('mascotStudioModal');
  if (modal) modal.style.display = 'none';
};

function setInAppMascotAction(action) {
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

function triggerInAppPigeonAction() {
  const actions = ['laugh', 'celebrate', 'coo', 'walk', 'think'];
  const next = actions[Math.floor(Math.random() * actions.length)];
  window.setInAppMascotAction(next);
};

function triggerMascotInPlaceReaction(action) {
  const actions = ['walk', 'laugh', 'celebrate', 'coo', 'think'];
  const act = action || actions[Math.floor(Math.random() * actions.length)];
  
  const m = window.appMascot || window.mascot;
  if (m && typeof m.setAction === 'function') {
    m.setAction(act);
    clearTimeout(window._mascotIdleTimer);
    window._mascotIdleTimer = setTimeout(() => {
      if (m && typeof m.setAction === 'function') {
        m.setAction('idle');
      }
    }, 4500);
  }
  
  if (act === 'coo' && window.pigeonAudio) {
    window.pigeonAudio.playRealCoo();
  }
  
  const speechEl = document.getElementById('mascotSpeechBubble');
  if (speechEl && _mascotQuotes[act]) {
    renderMascotSpeechBubble(_mascotQuotes[act], act);
    speechEl.style.transform = 'scale(1.02)';
    speechEl.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      speechEl.style.transform = 'scale(1)';
    }, 250);
  }
}
window.triggerMascotInPlaceReaction = triggerMascotInPlaceReaction;

// Ambient life behavior: Natural stroll and curiosity every 12s on dashboard
setInterval(() => {
  const m = window.appMascot || window.mascot;
  if (!m || typeof m.setAction !== 'function') return;
  const dashPage = document.getElementById('dashboardPage');
  if (!dashPage || !dashPage.classList.contains('active')) return;
  
  const ambientActions = ['walk', 'think', 'idle'];
  const nextAmbient = ambientActions[Math.floor(Math.random() * ambientActions.length)];
  m.setAction(nextAmbient);
  setTimeout(() => {
    if (m && typeof m.setAction === 'function') m.setAction('idle');
  }, 3500);
}, 12000);

function toggleInAppAudioFx() {
  if (window.pigeonAudio) {
    const enabled = window.pigeonAudio.toggleSound();
    const icon = document.getElementById('inAppSoundIcon');
    const label = document.getElementById('inAppSoundLabel');
    if (icon) icon.className = enabled ? 'ri-volume-up-fill' : 'ri-volume-mute-fill';
    if (label) label.textContent = enabled ? 'Sons Aviaires : Activés' : 'Sons Aviaires : Désactivés';
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 🔐 AI ACCESS GATE MODAL CONTROLLERS (Google Authentication Enforcement)
// ═══════════════════════════════════════════════════════════════════════════

function openAiAuthGateModal() {
  const modal = document.getElementById('aiAuthGateModal');
  if (modal) modal.style.display = 'flex';
};

function closeAiAuthGateModal(e) {
  if (e && e.target && e.target !== e.currentTarget) return;
  const modal = document.getElementById('aiAuthGateModal');
  if (modal) modal.style.display = 'none';
};

async function loginWithGoogleFromGate() {
  window.closeAiAuthGateModal(null);
  if (window.vitalTrackAuth) {
    await window.vitalTrackAuth.signInWithGoogle();
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// 📲 PWA INSTALLATION PROMPT CONTROLLER (Add to Home Screen)
// ═══════════════════════════════════════════════════════════════════════════

let _deferredPwaPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPwaPrompt = e;

    // Check if dismissed recently (< 7 days)
    const lastDismissed = parseInt(localStorage.getItem('vt_pwa_dismissed') || '0', 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - lastDismissed < sevenDays) return;

    // Show banner after 2.5 seconds on mobile
    setTimeout(() => {
      const banner = document.getElementById('pwaInstallBanner');
      if (banner) banner.style.display = 'block';
    }, 2500);
  });

  // Check on load for iOS Safari mobile devices
  window.addEventListener('DOMContentLoaded', () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
      const lastDismissed = parseInt(localStorage.getItem('vt_pwa_dismissed') || '0', 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastDismissed >= sevenDays) {
        setTimeout(() => {
          const banner = document.getElementById('pwaInstallBanner');
          const desc = document.getElementById('pwaBannerDesc');
          if (desc) desc.textContent = 'Ajoutez VitalTrack à votre écran d\'accueil pour un accès hors-ligne instantané.';
          if (banner) banner.style.display = 'block';
        }, 3000);
      }
    }
  });
}

async function triggerPwaInstall() {
  if (_deferredPwaPrompt) {
    _deferredPwaPrompt.prompt();
    const choice = await _deferredPwaPrompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      if (window.showToast) window.showToast('🎉 Merci d\'avoir installé VitalTrack !', 'success');
    }
    _deferredPwaPrompt = null;
    window.dismissPwaBanner();
  } else {
    // Safari / iOS fallback instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      if (window.showToast) {
        window.showToast('📲 Pour installer sur iPhone : Appuyez sur Partager ⎋ puis "Sur l\'écran d\'accueil" ➕', 'info', 7000);
      }
    } else {
      if (window.showToast) {
        window.showToast('ℹ️ Ouvrez le menu de votre navigateur (⋮) et choisissez "Installer l\'application"', 'info', 5000);
      }
    }
    window.dismissPwaBanner();
  }
};

function dismissPwaBanner() {
  const banner = document.getElementById('pwaInstallBanner');
  if (banner) banner.style.display = 'none';
  localStorage.setItem('vt_pwa_dismissed', Date.now().toString());
};

// ═══════ APP LOGOS WITH VITAL MASCOT HEAD ═══════
function initAppLogos() {
  const desktop = document.getElementById('desktopLogoIcon');
  const mobile = document.getElementById('mobileLogoIcon');
  if (window.renderPigeonPortrait) {
    const mascotHeadDesktop = window.renderPigeonPortrait(34, 'idle');
    const mascotHeadMobile = window.renderPigeonPortrait(30, 'idle');
    if (desktop && mascotHeadDesktop) desktop.innerHTML = mascotHeadDesktop;
    if (mobile && mascotHeadMobile) mobile.innerHTML = mascotHeadMobile;
  }
};

// ═══════ SCREENSHOT HANDLING & PRIVACY NOTIFICATION ═══════
let lastScreenshotToastTime = 0;

function initScreenshotProtection() {
  document.body.classList.remove('screenshot-privacy-active');
  const isEnabled = store.get('screenshotProtection', false) === true;
  const toggle = document.getElementById('toggleScreenshotProtection');
  if (toggle) {
    toggle.checked = isEnabled;
  }
};

function handleScreenshotEvent() {
  // Never black out or blur the screen - keep all captures 100% visible and clean
  document.body.classList.remove('screenshot-privacy-active');
}

function setScreenshotProtection(enabled) {
  store.set('screenshotProtection', !!enabled);
  document.body.classList.remove('screenshot-privacy-active');
  if (window.showToast) {
    if (enabled) {
      window.showToast('🛡️ Mode discrétion activé pour vos données personnelles.', 'info', 4000);
    } else {
      window.showToast('📸 Captures d\'écran autorisées et nettes.', 'info', 4000);
    }
  }
};




// ═══════ GLOBAL WINDOW EXPORTS ═══════
if (typeof window !== "undefined") window.showToast = showToast;
if (typeof window !== "undefined") window.showVitalConfirm = showVitalConfirm;
if (typeof window !== "undefined") window.initVitalDatePicker = initVitalDatePicker;
if (typeof window !== "undefined") window.initAllVitalDatePickers = initAllVitalDatePickers;
if (typeof window !== "undefined") window.initVitalSelect = initVitalSelect;
if (typeof window !== "undefined") window.initAllVitalSelects = initAllVitalSelects;
if (typeof window !== "undefined") window.openGoogleAuthModal = openGoogleAuthModal;
if (typeof window !== "undefined") window.closeGoogleAuthModal = closeGoogleAuthModal;
if (typeof window !== "undefined") window.handleDirectGoogleLogin = handleDirectGoogleLogin;
if (typeof window !== "undefined") window.requireAuthForAi = requireAuthForAi;
if (typeof window !== "undefined") window.handleGoogleAuthForm = handleGoogleAuthForm;
if (typeof window !== "undefined") window.openUserProfileModal = openUserProfileModal;
if (typeof window !== "undefined") window.closeUserProfileModal = closeUserProfileModal;
if (typeof window !== "undefined") window.renderUserProfileModal = renderUserProfileModal;
if (typeof window !== "undefined") window.showPage = showPage;
if (typeof window !== "undefined") window.toggleMoreDrawer = toggleMoreDrawer;
if (typeof window !== "undefined") window.toggleMobileNav = toggleMobileNav;
if (typeof window !== "undefined") window.toggleTheme = toggleTheme;
if (typeof window !== "undefined") window.toggleEmonctoireChip = toggleEmonctoireChip;
if (typeof window !== "undefined") window.toggleAiPreviewBox = toggleAiPreviewBox;
if (typeof window !== "undefined") window.updateLiveAiPreview = updateLiveAiPreview;
if (typeof window !== "undefined") window.saveProfile = saveProfile;
if (typeof window !== "undefined") window.setProtocol = setProtocol;
if (typeof window !== "undefined") window.switchSettingsTab = switchSettingsTab;
if (typeof window !== "undefined") window.openVitalityInfoModal = openVitalityInfoModal;
if (typeof window !== "undefined") window.closeVitalityInfoModal = closeVitalityInfoModal;
if (typeof window !== "undefined") window.newConversation = newConversation;
if (typeof window !== "undefined") window.switchConversation = switchConversation;
if (typeof window !== "undefined") window.confirmDeleteConversation = confirmDeleteConversation;
if (typeof window !== "undefined") window.closeDeleteConvModal = closeDeleteConvModal;
if (typeof window !== "undefined") window.executeDeleteConversation = executeDeleteConversation;
if (typeof window !== "undefined") window.deleteConversation = deleteConversation;
if (typeof window !== "undefined") window.filterConversations = filterConversations;
if (typeof window !== "undefined") window.toggleSidebar = toggleSidebar;
if (typeof window !== "undefined") window.toggleVoiceInput = toggleVoiceInput;
if (typeof window !== "undefined") window.cancelVoiceInput = cancelVoiceInput;
if (typeof window !== "undefined") window.handleChatImageSelected = handleChatImageSelected;
if (typeof window !== "undefined") window.removeChatImage = removeChatImage;
if (typeof window !== "undefined") window.quickChat = quickChat;
if (typeof window !== "undefined") window.sendChat = sendChat;
if (typeof window !== "undefined") window.stopChatGeneration = stopChatGeneration;
if (typeof window !== "undefined") window.resetChatSendBtn = resetChatSendBtn;
if (typeof window !== "undefined") window.copyChatMessage = copyChatMessage;
if (typeof window !== "undefined") window.copyChatMessageByIndex = copyChatMessageByIndex;
if (typeof window !== "undefined") window.speakChatMessage = speakChatMessage;
if (typeof window !== "undefined") window.stopSpeechSynthesis = stopSpeechSynthesis;
if (typeof window !== "undefined") window.stopAudioPlayback = stopAudioPlayback;
if (typeof window !== "undefined") window.toggleTtsVoiceGender = toggleTtsVoiceGender;
if (typeof window !== "undefined") window.updateTtsVoiceUI = updateTtsVoiceUI;
if (typeof window !== "undefined") window.openVoiceSelectorModal = openVoiceSelectorModal;
if (typeof window !== "undefined") window.closeVoiceSelectorModal = closeVoiceSelectorModal;
if (typeof window !== "undefined") window.renderVoiceModalList = renderVoiceModalList;
if (typeof window !== "undefined") window.testVoiceSample = testVoiceSample;
if (typeof window !== "undefined") window.previewCurrentVoice = previewCurrentVoice;
if (typeof window !== "undefined") window.setCustomVoice = setCustomVoice;
if (typeof window !== "undefined") window.getActiveVoiceId = getActiveVoiceId;
if (typeof window !== "undefined") window.editChatMessage = editChatMessage;
if (typeof window !== "undefined") window.retryChatMessage = retryChatMessage;
if (typeof window !== "undefined") window.switchModelAndRetry = switchModelAndRetry;
if (typeof window !== "undefined") window.renderModelPicker = renderModelPicker;
if (typeof window !== "undefined") window.selectModel = selectModel;
if (typeof window !== "undefined") window.toggleModelList = toggleModelList;
if (typeof window !== "undefined") window.applySortAndRender = applySortAndRender;
if (typeof window !== "undefined") window.setSearchFilter = setSearchFilter;
if (typeof window !== "undefined") window.searchFoods = searchFoods;
if (typeof window !== "undefined") window.triggerDirectAISearch = triggerDirectAISearch;
if (typeof window !== "undefined") window.quickAddFoodToMeal = quickAddFoodToMeal;
if (typeof window !== "undefined") window.quickToggleFavorite = quickToggleFavorite;
if (typeof window !== "undefined") window.applyRecentSearch = applyRecentSearch;
if (typeof window !== "undefined") window.clearRecentSearches = clearRecentSearches;
if (typeof window !== "undefined") window.clearSearch = clearSearch;
if (typeof window !== "undefined") window.browseFoodsByCategory = browseFoodsByCategory;
if (typeof window !== "undefined") window.askAIToFindFood = askAIToFindFood;
if (typeof window !== "undefined") window.toggleProtocolsAccordion = toggleProtocolsAccordion;
if (typeof window !== "undefined") window.handleHerbSearchInput = handleHerbSearchInput;
if (typeof window !== "undefined") window.clearHerbSearch = clearHerbSearch;
if (typeof window !== "undefined") window.setHerbFilter = setHerbFilter;
if (typeof window !== "undefined") window.filterByTag = filterByTag;
if (typeof window !== "undefined") window.setHerbFilterByHerbs = setHerbFilterByHerbs;
if (typeof window !== "undefined") window.toggleHerbMonograph = toggleHerbMonograph;
if (typeof window !== "undefined") window.openHerbModal = openHerbModal;
if (typeof window !== "undefined") window.closeHerbModal = closeHerbModal;
if (typeof window !== "undefined") window.askAIAboutCurrentHerb = askAIAboutCurrentHerb;
if (typeof window !== "undefined") window.openFoodModal = openFoodModal;
if (typeof window !== "undefined") window.switchAnalyzedFoodInModal = switchAnalyzedFoodInModal;
if (typeof window !== "undefined") window.confirmAddMealFromModal = confirmAddMealFromModal;
if (typeof window !== "undefined") window.openFoodModalFromSelection = openFoodModalFromSelection;
if (typeof window !== "undefined") window.setMealCookingMethod = setMealCookingMethod;
if (typeof window !== "undefined") window.setMealOilQuality = setMealOilQuality;
if (typeof window !== "undefined") window.openFoodModalFromMeal = openFoodModalFromMeal;
if (typeof window !== "undefined") window.removeMealAndCloseModal = removeMealAndCloseModal;
if (typeof window !== "undefined") window.saveAIFoodToDB = saveAIFoodToDB;
if (typeof window !== "undefined") window.addFoodToMealFromModal = addFoodToMealFromModal;
if (typeof window !== "undefined") window.closeFoodModal = closeFoodModal;
if (typeof window !== "undefined") window.setModalTab = setModalTab;
if (typeof window !== "undefined") window.toggleFavorite = toggleFavorite;
if (typeof window !== "undefined") window.setFavFilter = setFavFilter;
if (typeof window !== "undefined") window.openCreateDishModal = openCreateDishModal;
if (typeof window !== "undefined") window.closeCreateDishModal = closeCreateDishModal;
if (typeof window !== "undefined") window.selectDishEmoji = selectDishEmoji;
if (typeof window !== "undefined") window.handleSaveCustomDish = handleSaveCustomDish;
if (typeof window !== "undefined") window.addFavoriteDishToMeals = addFavoriteDishToMeals;
if (typeof window !== "undefined") window.chatAboutDish = chatAboutDish;
if (typeof window !== "undefined") window.saveMealAsFavoriteDish = saveMealAsFavoriteDish;
if (typeof window !== "undefined") window.showAddMealModal = showAddMealModal;
if (typeof window !== "undefined") window.closeAddMealModal = closeAddMealModal;
if (typeof window !== "undefined") window.analyzeDishWithAI = analyzeDishWithAI;
if (typeof window !== "undefined") window.searchMealFoods = searchMealFoods;
if (typeof window !== "undefined") window.askAIToAddMealFood = askAIToAddMealFood;
if (typeof window !== "undefined") window.searchEditMealFoods = searchEditMealFoods;
if (typeof window !== "undefined") window.selectMealFood = selectMealFood;
if (typeof window !== "undefined") window.removeSelectedFood = removeSelectedFood;
if (typeof window !== "undefined") window.confirmAddMeal = confirmAddMeal;
if (typeof window !== "undefined") window.addFoodToMeal = addFoodToMeal;
if (typeof window !== "undefined") window.removeMeal = removeMeal;
if (typeof window !== "undefined") window.selectProgram = selectProgram;
if (typeof window !== "undefined") window.openMasterclass = openMasterclass;
if (typeof window !== "undefined") window.askAIAboutMasterclass = askAIAboutMasterclass;
if (typeof window !== "undefined") window.closeMasterclass = closeMasterclass;
if (typeof window !== "undefined") window.toggleExpertAccordion = toggleExpertAccordion;
if (typeof window !== "undefined") window.stepFastingDuration = stepFastingDuration;
if (typeof window !== "undefined") window.setFastingDurationPreset = setFastingDurationPreset;
if (typeof window !== "undefined") window.onFastingDurationChange = onFastingDurationChange;
if (typeof window !== "undefined") window.initFastingDurationControls = initFastingDurationControls;
if (typeof window !== "undefined") window.toggleFasting = toggleFasting;
if (typeof window !== "undefined") window.openFastEndModal = openFastEndModal;
if (typeof window !== "undefined") window.closeFastEndModal = closeFastEndModal;
if (typeof window !== "undefined") window.setFastRating = setFastRating;
if (typeof window !== "undefined") window.toggleElimTag = toggleElimTag;
if (typeof window !== "undefined") window.confirmSaveFastDebrief = confirmSaveFastDebrief;
if (typeof window !== "undefined") window.deleteFastingEntry = deleteFastingEntry;
if (typeof window !== "undefined") window.showFastingRefeedAdvice = showFastingRefeedAdvice;
if (typeof window !== "undefined") window.switchBreathingTab = switchBreathingTab;
if (typeof window !== "undefined") window.loadBreathingVideo = loadBreathingVideo;
if (typeof window !== "undefined") window.setBreathMode = setBreathMode;
if (typeof window !== "undefined") window.setBreathRounds = setBreathRounds;
if (typeof window !== "undefined") window.adjustBreathRounds = adjustBreathRounds;
if (typeof window !== "undefined") window.triggerRecoveryBreath = triggerRecoveryBreath;
if (typeof window !== "undefined") window.startBreathing = startBreathing;
if (typeof window !== "undefined") window.handleScanUpload = handleScanUpload;
if (typeof window !== "undefined") window.askAIAboutScannedDish = askAIAboutScannedDish;
if (typeof window !== "undefined") window.updateProactiveMascot = updateProactiveMascot;
if (typeof window !== "undefined") window.searchMediaResources = searchMediaResources;
if (typeof window !== "undefined") window.setMediaSearchFilter = setMediaSearchFilter;
if (typeof window !== "undefined") window.applyMediaTopicTag = applyMediaTopicTag;
if (typeof window !== "undefined") window.clearMediaSearch = clearMediaSearch;
if (typeof window !== "undefined") window.playVideoAtTimestamp = playVideoAtTimestamp;
if (typeof window !== "undefined") window.closeMediaVideoModal = closeMediaVideoModal;
if (typeof window !== "undefined") window.openPdfPassageModal = openPdfPassageModal;
if (typeof window !== "undefined") window.closePdfPassageModal = closePdfPassageModal;
if (typeof window !== "undefined") window.setResourcesCatalogTab = setResourcesCatalogTab;
if (typeof window !== "undefined") window.renderResources = renderResources;
if (typeof window !== "undefined") window.changeCalendarWeek = changeCalendarWeek;
if (typeof window !== "undefined") window.openMealModal = openMealModal;
if (typeof window !== "undefined") window.closeMealModal = closeMealModal;
if (typeof window !== "undefined") window.deleteCalendarMeal = deleteCalendarMeal;
if (typeof window !== "undefined") window.promptAIFixMeal = promptAIFixMeal;
if (typeof window !== "undefined") window.promptAIPlan = promptAIPlan;
if (typeof window !== "undefined") window.handleApplyDietPlanRequest = handleApplyDietPlanRequest;
if (typeof window !== "undefined") window.addMealsToCalendar = addMealsToCalendar;
if (typeof window !== "undefined") window.handleAddActionMeal = handleAddActionMeal;
if (typeof window !== "undefined") window.handleApplyFastingProgram = handleApplyFastingProgram;
if (typeof window !== "undefined") window.addSuggestedFood = addSuggestedFood;
if (typeof window !== "undefined") window.sendQuickReply = sendQuickReply;
if (typeof window !== "undefined") window.openWeightModal = openWeightModal;
if (typeof window !== "undefined") window.closeWeightModal = closeWeightModal;
if (typeof window !== "undefined") window.cancelWeightEdit = cancelWeightEdit;
if (typeof window !== "undefined") window.editWeightEntry = editWeightEntry;
if (typeof window !== "undefined") window.stepWeight = stepWeight;
if (typeof window !== "undefined") window.saveWeightEntry = saveWeightEntry;
if (typeof window !== "undefined") window.deleteWeightEntry = deleteWeightEntry;
if (typeof window !== "undefined") window.renderWeightHistoryInModal = renderWeightHistoryInModal;
if (typeof window !== "undefined") window.setWeightPeriod = setWeightPeriod;
if (typeof window !== "undefined") window.renderWeightChart = renderWeightChart;
if (typeof window !== "undefined") window.updateDashStats = updateDashStats;
if (typeof window !== "undefined") window.updateCircadianWidget = updateCircadianWidget;
if (typeof window !== "undefined") window.openMascotStudioModal = openMascotStudioModal;
if (typeof window !== "undefined") window.closeMascotStudioModal = closeMascotStudioModal;
if (typeof window !== "undefined") window.setInAppMascotAction = setInAppMascotAction;
if (typeof window !== "undefined") window.triggerInAppPigeonAction = triggerInAppPigeonAction;
if (typeof window !== "undefined") window.toggleInAppAudioFx = toggleInAppAudioFx;
if (typeof window !== "undefined") window.openAiAuthGateModal = openAiAuthGateModal;
if (typeof window !== "undefined") window.closeAiAuthGateModal = closeAiAuthGateModal;
if (typeof window !== "undefined") window.loginWithGoogleFromGate = loginWithGoogleFromGate;
if (typeof window !== "undefined") window.triggerPwaInstall = triggerPwaInstall;
if (typeof window !== "undefined") window.dismissPwaBanner = dismissPwaBanner;
if (typeof window !== "undefined") window.initScreenshotProtection = initScreenshotProtection;
if (typeof window !== "undefined") window.setScreenshotProtection = setScreenshotProtection;

// ═══════ UNIVERSAL FLOATING GLOBAL TOOLTIP ENGINE (NO OVERFLOW CLIPPING, VIEWPORT CLAMPED) ═══════
function initGlobalFloatingTooltip() {
  if (typeof document === 'undefined') return;

  let tooltipEl = document.getElementById('vitalGlobalTooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'vitalGlobalTooltip';
    document.body.appendChild(tooltipEl);
  }

  let activeTarget = null;
  let showTimer = null;

  function sanitize(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('[title]').forEach(el => {
      const txt = el.getAttribute('title');
      if (txt && !el.hasAttribute('data-tooltip')) {
        el.setAttribute('data-tooltip', txt);
      }
      el.removeAttribute('title');
    });
  }

  function showTooltip(el, text) {
    if (!text || !el || !document.body.contains(el)) return;
    activeTarget = el;
    tooltipEl.textContent = text;
    tooltipEl.style.display = 'block';
    tooltipEl.classList.remove('visible');

    // Measure target and tooltip in viewport coords
    const targetRect = el.getBoundingClientRect();
    const tipRect = tooltipEl.getBoundingClientRect();

    const padding = 12;
    const gap = 8;

    // Calculate X centered horizontally on target
    let x = targetRect.left + (targetRect.width / 2) - (tipRect.width / 2);
    // Viewport clamping (left and right)
    if (x < padding) x = padding;
    if (x + tipRect.width > window.innerWidth - padding) {
      x = window.innerWidth - tipRect.width - padding;
    }

    // Calculate Y (default: above target)
    let y = targetRect.top - tipRect.height - gap;
    // If not enough room above, place below target
    if (y < padding) {
      y = targetRect.bottom + gap;
    }

    tooltipEl.style.left = `${Math.round(x)}px`;
    tooltipEl.style.top = `${Math.round(y)}px`;

    requestAnimationFrame(() => {
      if (activeTarget === el) {
        tooltipEl.classList.add('visible');
      }
    });
  }

  function hideTooltip() {
    activeTarget = null;
    clearTimeout(showTimer);
    if (tooltipEl) {
      tooltipEl.classList.remove('visible');
    }
  }

  // Delegation mouse events
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('[data-tooltip], [title]');
    if (!target) return;

    let text = target.getAttribute('data-tooltip');
    if (!text && target.hasAttribute('title')) {
      text = target.getAttribute('title');
      target.setAttribute('data-tooltip', text);
      target.removeAttribute('title');
    }

    if (!text || !text.trim()) return;

    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      showTooltip(target, text.trim());
    }, 60);
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-tooltip]');
    if (target && target === activeTarget) {
      hideTooltip();
    }
  }, { passive: true });

  // Hide on scroll, touch, or click
  window.addEventListener('scroll', hideTooltip, { passive: true });
  document.addEventListener('click', hideTooltip, { passive: true });
  document.addEventListener('touchstart', hideTooltip, { passive: true });

  // Observe DOM additions to strip native title attributes
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(node => {
            if (node && node.nodeType === 1) {
              if (node.hasAttribute('title')) {
                node.setAttribute('data-tooltip', node.getAttribute('title'));
                node.removeAttribute('title');
              }
              node.querySelectorAll?.('[title]')?.forEach(el => {
                el.setAttribute('data-tooltip', el.getAttribute('title'));
                el.removeAttribute('title');
              });
            }
          });
        } else if (m.type === 'attributes' && m.attributeName === 'title') {
          const target = m.target;
          const txt = target.getAttribute('title');
          if (txt) {
            target.setAttribute('data-tooltip', txt);
            target.removeAttribute('title');
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['title']
    });
  }

  sanitize();
}
initGlobalFloatingTooltip();

// ═══════ BOOTSTRAP INITIALIZATION ═══════
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}
