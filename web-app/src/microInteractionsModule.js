/**
 * microInteractionsModule.js
 * 
 * Module Maître des Micro-Interactions et du Design System Unifié (Style Apple x Kawaii Japonais).
 * Gère le Bandeau Calendrier Hebdo Horizontal (Strip), le Date Picker Pop-over avec saut d'année
 * 1-clic (2015-2030), l'effet Liquid Ripple universel, et le contrôle global de vitesse d'animation.
 */

import { store } from './storage.js';

// --- ÉTAT DU BANDEAU CALENDRIER HEBDO ---
let _stripActiveDate = new Date();

// --- ÉTAT DU DATE PICKER POP-OVER (PESÉE & LOGS) ---
let _weightPopYear = new Date().getFullYear();
let _weightPopMonth = new Date().getMonth(); // 0-11
let _weightPopDay = new Date().getDate();
let _isWeightYearGridOpen = false;

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_NAMES_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];

/**
 * Initialisation complète du module de micro-interactions
 */
export function initMicroInteractionsModule() {
  // Attacher les fonctions au scope global window pour les handlers HTML
  window.refreshDailyStripRoutine = refreshDailyStripRoutine;
  window.selectStripDay = selectStripDay;
  window.toggleStripRoutineTask = toggleStripRoutineTask;
  
  window.toggleWeightDatePickerPop = toggleWeightDatePickerPop;
  window.setWeightDateQuick = setWeightDateQuick;
  window.setWeightDateExact = setWeightDateExact;
  window.toggleWeightPopYearGrid = toggleWeightPopYearGrid;
  window.weightPopSelectYear = weightPopSelectYear;
  window.weightPopSelectDay = weightPopSelectDay;
  window.weightPopPrevMonth = weightPopPrevMonth;
  window.weightPopNextMonth = weightPopNextMonth;
  window.weightPopPrevYear = weightPopPrevYear;
  window.weightPopNextYear = weightPopNextYear;

  window.setAnimationSpeed = setAnimationSpeed;
  window.createAppleRipple = createAppleRipple;

  // Restaurer la vitesse d'animation sauvegardée
  try {
    const savedSpeed = localStorage.getItem('vt_anim_speed');
    if (savedSpeed) {
      setAnimationSpeed(parseFloat(savedSpeed));
    }
  } catch (_) {}

  // Initialiser les composants dès que le DOM est prêt
  initStripCalendar();
  initWeightDatePicker();
  initGlobalRippleListener();

  // Initialiser la date par défaut dans le formulaire de pesée
  syncWeightDateToForm();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BANDEAU CALENDRIER HEBDO HORIZONTAL (STRIP CALENDAR)
// ═══════════════════════════════════════════════════════════════════════════════

export function initStripCalendar() {
  const container = document.getElementById('stripDaysContainer');
  if (!container) return;

  renderStripDays();
  renderStripDailyRoutine();
}

export function refreshDailyStripRoutine() {
  renderStripDays();
  renderStripDailyRoutine();
  if (window.showToast) {
    window.showToast('🔄 Calendrier et routine synchronisés !');
  }
}

function renderStripDays() {
  const container = document.getElementById('stripDaysContainer');
  const badge = document.getElementById('stripActiveDateBadge');
  if (!container) return;

  container.innerHTML = '';

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 (Dim) à 6 (Sam)
  const mondayOffset = (currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + mondayOffset);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  const activeISO = formatISODate(_stripActiveDate);

  days.forEach(d => {
    const iso = formatISODate(d);
    const isSelected = (iso === activeISO);
    const isToday = (iso === formatISODate(today));
    const dayOfWeek = DAY_NAMES_SHORT[d.getDay()];
    const dayNum = d.getDate();

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `strip-day-pill ${isSelected ? 'active' : ''} ${isToday ? 'is-today' : ''}`;
    btn.style.cssText = `
      padding: 10px 14px;
      border-radius: 18px;
      border: 1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'};
      background: ${isSelected ? 'var(--accent)' : 'var(--surface)'};
      color: ${isSelected ? '#ffffff' : 'var(--text)'};
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-width: 58px;
      flex-shrink: 0;
      transition: all calc(0.2s * var(--speed-factor, 1)) var(--apple-spring);
      box-shadow: ${isSelected ? '0 6px 18px rgba(5, 150, 105, 0.35)' : 'none'};
      transform: ${isSelected ? 'scale(1.05)' : 'scale(1)'};
    `;

    btn.onclick = () => selectStripDay(iso);
    btn.innerHTML = `
      <span style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: ${isSelected ? '0.9' : '0.6'};">${dayOfWeek}</span>
      <span style="font-size: 1.1rem; font-weight: 900; line-height: 1;">${dayNum}</span>
      ${isToday && !isSelected ? '<span style="width: 5px; height: 5px; border-radius: 50%; background: var(--accent); margin-top: 1px;"></span>' : ''}
    `;

    container.appendChild(btn);
  });

  if (badge) {
    const currentLang = window.vitalTrackI18n?.getLanguage?.() || 'fr';
    const localeMap = { 'fr': 'fr-FR', 'en': 'en-US', 'es': 'es-ES', 'fr-CA': 'fr-CA' };
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const formatted = _stripActiveDate.toLocaleDateString(localeMap[currentLang] || 'fr-FR', options);
    badge.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}

export function selectStripDay(dateISO) {
  const parts = dateISO.split('-');
  if (parts.length === 3) {
    _stripActiveDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    renderStripDays();
    renderStripDailyRoutine();
  }
}

function renderStripDailyRoutine() {
  const routineBox = document.getElementById('stripDailyRoutineBox');
  if (!routineBox) return;

  const iso = formatISODate(_stripActiveDate);

  const taskKeys = [
    { id: `task_morning_${iso}`, title: 'Réveil : Tisane Vivifiante Menthe Poivrée & Citron', time: '06h30 - 08h00', icon: '🍵', desc: 'Hydratation cellulaire et éveil rénal' },
    { id: `task_break_${iso}`, title: 'Petit-déjeuner : Fruits Mûrs de Saison ou Jus Vert', time: '08h30 - 10h00', icon: '🥑', desc: 'Énergie électrique instantanée sans encrassement' },
    { id: `task_lunch_${iso}`, title: 'Déjeuner : Grande Salade Alcaline ou Repas Vivant', time: '12h00 - 14h00', icon: '🥗', desc: 'Feu digestif maximal, densité micronutritionnelle' },
    { id: `task_dinner_${iso}`, title: 'Dîner Léger : Légumes Vapeur & Bouillon Reminéralisant', time: '18h30 - 20h00', icon: '🍲', desc: 'Préparation au repos digestif nocturne' }
  ];

  let completedCount = 0;
  taskKeys.forEach(t => {
    const val = localStorage.getItem(`vt_strip_task_${t.id}`);
    if (val === 'true') completedCount++;
  });

  const percent = Math.round((completedCount / taskKeys.length) * 100);

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:1px solid var(--border); padding-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:0.85rem; font-weight:800; color:var(--text);">Routine & Rituels du Jour</span>
        <span style="font-size:0.75rem; font-weight:800; background:var(--accent-glow); color:var(--accent); padding:2px 8px; border-radius:10px;">${completedCount}/${taskKeys.length} validés (${percent}%)</span>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        <button type="button" onclick="window.showPage('meals')" class="app-btn-secondary" style="padding:4px 10px; font-size:0.75rem;">
          <i class="ri-add-line"></i> Ajouter au journal
        </button>
      </div>
    </div>

    <!-- Progress Bar -->
    <div style="width:100%; height:6px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden;">
      <div style="height:100%; width:${percent}%; background:linear-gradient(90deg, #059669, #34d399); border-radius:100px; transition:width calc(0.3s * var(--speed-factor, 1)) var(--apple-spring);"></div>
    </div>

    <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
  `;

  taskKeys.forEach(task => {
    const isDone = (localStorage.getItem(`vt_strip_task_${task.id}`) === 'true');
    html += `
      <div onclick="window.toggleStripRoutineTask('${task.id}')" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:16px; background:var(--surface); border:1px solid ${isDone ? 'rgba(16,185,129,0.3)' : 'var(--border)'}; cursor:pointer; transition:all calc(0.2s * var(--speed-factor, 1)) var(--apple-spring);" class="routine-task-row">
        <div style="display:flex; align-items:center; gap:12px; min-width:0;">
          <span style="width:22px; height:22px; border-radius:50%; border:2px solid ${isDone ? 'var(--accent)' : 'var(--border-strong)'}; background:${isDone ? 'var(--accent)' : 'transparent'}; color:#ffffff; font-size:0.75rem; font-weight:900; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s var(--apple-spring);">
            ${isDone ? '✓' : ''}
          </span>
          <div style="min-width:0;">
            <strong style="font-size:0.82rem; font-weight:700; color:${isDone ? 'var(--text-dim)' : 'var(--text)'}; text-decoration:${isDone ? 'line-through' : 'none'}; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${task.title}
            </strong>
            <span style="font-size:0.72rem; color:var(--text-low);">${task.time} • ${task.desc}</span>
          </div>
        </div>
        <span style="font-size:1.1rem; flex-shrink:0; margin-left:8px;">${task.icon}</span>
      </div>
    `;
  });

  html += `</div>`;
  routineBox.innerHTML = html;
}

export function toggleStripRoutineTask(taskId) {
  const current = localStorage.getItem(`vt_strip_task_${taskId}`) === 'true';
  localStorage.setItem(`vt_strip_task_${taskId}`, current ? 'false' : 'true');
  renderStripDailyRoutine();
  if (window.showToast) {
    window.showToast(current ? 'Tâche décochée' : '✓ Rituel vitaliste validé !');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DATE PICKER POP-OVER AVEC SAUT D'ANNÉE 1-CLIC (2015-2030)
// ═══════════════════════════════════════════════════════════════════════════════

export function initWeightDatePicker() {
  const today = new Date();
  _weightPopYear = today.getFullYear();
  _weightPopMonth = today.getMonth();
  _weightPopDay = today.getDate();
  _isWeightYearGridOpen = false;

  updateWeightPopCalendarView();
}

function syncWeightDateToForm() {
  const hiddenInput = document.getElementById('weightDateInput');
  const displayVal = document.getElementById('weightDateDisplayVal');
  if (!hiddenInput) return;

  const yyyy = _weightPopYear;
  const mm = String(_weightPopMonth + 1).padStart(2, '0');
  const dd = String(_weightPopDay).padStart(2, '0');
  hiddenInput.value = `${yyyy}-${mm}-${dd}`;

  if (displayVal) {
    const today = new Date();
    const isToday = (yyyy === today.getFullYear() && _weightPopMonth === today.getMonth() && _weightPopDay === today.getDate());
    if (isToday) {
      displayVal.textContent = `Aujourd'hui (${dd} ${MONTH_NAMES_FR[_weightPopMonth].toLowerCase()} ${yyyy})`;
    } else {
      displayVal.textContent = `${dd} ${MONTH_NAMES_FR[_weightPopMonth]} ${yyyy}`;
    }
  }
}

export function toggleWeightDatePickerPop() {
  const box = document.getElementById('weightDatePopBox');
  const arrow = document.getElementById('weightDatePopArrow');
  if (!box) return;

  const isVisible = (box.style.display === 'flex');
  box.style.display = isVisible ? 'none' : 'flex';
  if (arrow) {
    arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
  }

  if (!isVisible) {
    _isWeightYearGridOpen = false;
    updateWeightPopCalendarView();
  }
}

export function setWeightDateQuick(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);

  _weightPopYear = d.getFullYear();
  _weightPopMonth = d.getMonth();
  _weightPopDay = d.getDate();
  _isWeightYearGridOpen = false;

  syncWeightDateToForm();
  toggleWeightDatePickerPop();
}

export function setWeightDateExact(year, month, day) {
  _weightPopYear = year;
  _weightPopMonth = month;
  _weightPopDay = day;
  _isWeightYearGridOpen = false;

  syncWeightDateToForm();
  toggleWeightDatePickerPop();
  if (window.showToast) {
    window.showToast(`✓ Date fixée au ${day} ${MONTH_NAMES_FR[month]} ${year}`);
  }
}

export function toggleWeightPopYearGrid() {
  _isWeightYearGridOpen = !_isWeightYearGridOpen;
  updateWeightPopCalendarView();
}

export function weightPopSelectYear(year) {
  _weightPopYear = year;
  _isWeightYearGridOpen = false;
  updateWeightPopCalendarView();
  if (window.showToast) {
    window.showToast(`Année sélectionnée : ${year}`);
  }
}

export function weightPopSelectDay(day) {
  _weightPopDay = day;
  syncWeightDateToForm();
  toggleWeightDatePickerPop();
  if (window.showToast) {
    window.showToast(`✓ Date : ${day} ${MONTH_NAMES_FR[_weightPopMonth]} ${_weightPopYear}`);
  }
}

export function weightPopPrevMonth() {
  _weightPopMonth--;
  if (_weightPopMonth < 0) {
    _weightPopMonth = 11;
    _weightPopYear--;
  }
  updateWeightPopCalendarView();
}

export function weightPopNextMonth() {
  _weightPopMonth++;
  if (_weightPopMonth > 11) {
    _weightPopMonth = 0;
    _weightPopYear++;
  }
  updateWeightPopCalendarView();
}

export function weightPopPrevYear() {
  _weightPopYear--;
  updateWeightPopCalendarView();
}

export function weightPopNextYear() {
  _weightPopYear++;
  updateWeightPopCalendarView();
}

function updateWeightPopCalendarView() {
  const monthTxt = document.getElementById('weightPopMonthTxt');
  const yearTxt = document.getElementById('weightPopYearTxt');
  const container = document.getElementById('weightPopCalendarContainer');

  if (monthTxt) monthTxt.textContent = MONTH_NAMES_FR[_weightPopMonth];
  if (yearTxt) yearTxt.textContent = _weightPopYear;

  if (!container) return;

  if (_isWeightYearGridOpen) {
    // Grille 1-Clic d'Années 2015 à 2030 (4 colonnes)
    let html = `<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px; padding:6px 0;">`;
    for (let y = 2015; y <= 2030; y++) {
      const isSel = (y === _weightPopYear);
      html += `
        <button type="button" onclick="window.weightPopSelectYear(${y})" style="
          padding: 8px 4px;
          border-radius: 12px;
          border: 1px solid ${isSel ? 'var(--accent)' : 'var(--border)'};
          background: ${isSel ? 'var(--accent)' : 'var(--surface-2)'};
          color: ${isSel ? '#ffffff' : 'var(--text)'};
          font-weight: ${isSel ? '900' : '600'};
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s var(--apple-spring);
        ">${y}</button>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
  } else {
    // Grille Mensuelle 7x5
    let html = `
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:2px; text-align:center; font-size:0.65rem; font-weight:800; color:var(--text-low); margin-bottom:4px; text-transform:uppercase;">
        <span>Lu</span><span>Ma</span><span>Me</span><span>Je</span><span>Ve</span><span>Sa</span><span>Di</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; text-align:center;">
    `;

    const firstDay = new Date(_weightPopYear, _weightPopMonth, 1);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(_weightPopYear, _weightPopMonth + 1, 0).getDate();

    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSel = (d === _weightPopDay);
      html += `
        <button type="button" onclick="window.weightPopSelectDay(${d})" style="
          padding: 6px 0;
          border-radius: 10px;
          border: 1px solid ${isSel ? 'var(--accent)' : 'transparent'};
          background: ${isSel ? 'var(--accent)' : 'transparent'};
          color: ${isSel ? '#ffffff' : 'var(--text)'};
          font-weight: ${isSel ? '900' : '600'};
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s var(--apple-spring);
        ">${d}</button>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. EFFET LIQUID RIPPLE UNIVERSEL & TIMING RESORT APPLE
// ═══════════════════════════════════════════════════════════════════════════════

export function createAppleRipple(event, button) {
  if (!button) return;
  const circle = document.createElement('span');
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;
  const rect = button.getBoundingClientRect();

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${(event.clientX || (rect.left + radius)) - rect.left - radius}px`;
  circle.style.top = `${(event.clientY || (rect.top + radius)) - rect.top - radius}px`;
  circle.classList.add('ripple-effect');

  const oldRipple = button.getElementsByClassName('ripple-effect')[0];
  if (oldRipple) oldRipple.remove();

  button.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

function initGlobalRippleListener() {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.app-btn-primary, .app-btn-secondary, .btn-primary, .btn-secondary, .chip-btn, .strip-day-pill');
    if (btn) {
      createAppleRipple(e, btn);
    }
  }, { passive: true });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CONTRÔLEUR GLOBAL DE VITESSE D'ANIMATION (--speed-factor)
// ═══════════════════════════════════════════════════════════════════════════════

export function setAnimationSpeed(factor) {
  const clamped = Math.max(0.25, Math.min(3.0, factor || 1.0));
  document.documentElement.style.setProperty('--speed-factor', clamped.toString());
  try {
    localStorage.setItem('vt_anim_speed', clamped.toString());
  } catch (_) {}
  if (window.showToast) {
    window.showToast(`Vitesse d'animation réglée à ${clamped}x`);
  }
}

function formatISODate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
