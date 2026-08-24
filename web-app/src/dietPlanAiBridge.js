/**
 * dietPlanAiBridge.js - AI Diet Plan Parser & Interactive Calendar Bridge
 * Automatically extracts structured multi-day/multi-phase regimens from AI chat responses
 * and provides seamless Japandi Action Cards, customization modals, and 1-click calendar sync.
 */

import { store, formatLocalDate, parseLocalDate, addDaysLocal } from './storage.js';

/**
 * Intelligent parser that extracts days/phases and meals from markdown AI chat responses
 */
export function parseMarkdownDietPlan(text) {
  if (!text || typeof text !== 'string') return null;

  // Permissive check for any diet plan / programme vitaliste
  const hasPlanKeywords = /(?:PROGRAMME|PLAN|SEMAINE|WEEK|JOUR|DAY|PHASE|RITUELS|MENU)/i.test(text) &&
    (/(?:Matin|Petit[- ]d[ée]jeuner|[ÉEe]veil|Hydratation)/i.test(text) || /(?:Midi|D[ée]jeuner|Repas)/i.test(text) || /(?:Soir|D[iî]ner)/i.test(text));

  if (!hasPlanKeywords) return null;

  const sections = [];
  // Matches "JOUR 1", "SEMAINE 1", "2. PROGRAMME TYPE SEMAINE 1", "PHASE 1", "### Semaine 1", etc.
  const sectionRegex = /(?:(?:#+\s*|\*\*\s*|\d+[\.\)]\s*)?(?:PROGRAMME\s*(?:TYPE\s*)?)?(JOUR|DAY|PHASE|SEMAINE|WEEK)\s*(\d+)[^\n:]*[:\-\—]?\s*([^\n]*))/gi;
  
  let match;
  const matches = [];
  while ((match = sectionRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      type: (match[1] || 'SEMAINE').toUpperCase(),
      num: parseInt(match[2], 10),
      rawTitle: (match[3] || '').trim() || `${match[1]} ${match[2]}`
    });
  }

  if (matches.length === 0) {
    matches.push({ index: 0, type: 'SEMAINE', num: 1, rawTitle: 'Programme Vitaliste Évolutif' });
  }

  // Vitalist Daily Slots (No mandatory snacks/collations to respect intermittent digestive rest)
  const slotMarkers = [
    { type: 'hydration', time: '07:30', label: 'Éveil & Hydratation', icon: '💧', regex: /(?:^|\n)\s*(?:[•\*\-]\s*)?(?:(?:\d{1,2}[h:]\d{2}\s*[-–—]\s*)?(?:[ÉEe]veil(?:\s*\([^\)]+\))?|Hydratation(?:\s*\([^\)]+\))?|R[ée]veil(?:\s*\([^\)]+\))?|Au saut du lit))\s*[:—\-]\s*/i },
    { type: 'breakfast', time: '09:00', label: 'Matin Vital (Fruits ou Jus)', icon: '🍉', regex: /(?:^|\n)\s*(?:[•\*\-]\s*)?(?:(?:\d{1,2}[h:]\d{2}\s*[-–—]\s*)?(?:Petit[- ]d[ée]jeuner(?:\s*\([^\)]+\))?|Matin(?:\s*\([^\)]+\))?|1er repas(?:\s*\([^\)]+\))?|Breakfast))\s*[:—\-]\s*/i },
    { type: 'lunch', time: '12:30', label: 'Déjeuner Vivant & Alcalin', icon: '🥗', regex: /(?:^|\n)\s*(?:[•\*\-]\s*)?(?:(?:\d{1,2}[h:]\d{2}\s*[-–—]\s*)?(?:D[ée]jeuner(?:\s*\([^\)]+\))?|Midi(?:\s*\([^\)]+\))?|Repas principal(?:\s*\([^\)]+\))?|Repas vivant(?:\s*\([^\)]+\))?|Lunch))\s*[:—\-]\s*/i },
    { type: 'dinner', time: '19:00', label: 'Dîner de Transition', icon: '🍲', regex: /(?:^|\n)\s*(?:[•\*\-]\s*)?(?:(?:\d{1,2}[h:]\d{2}\s*[-–—]\s*)?(?:D[iî]ner(?:\s*\([^\)]+\))?|Soir(?:\s*\([^\)]+\))?|Repas du soir(?:\s*\([^\)]+\))?|D[iî]ner l[ée]ger(?:\s*\([^\)]+\))?|Dinner))\s*[:—\-]\s*/i }
  ];

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = (i + 1 < matches.length) ? matches[i + 1].index : text.length;
    const chunk = text.substring(current.index, nextIndex);

    // Find all slot positions in chunk
    const foundSlots = [];
    for (const sm of slotMarkers) {
      const m = chunk.match(sm.regex);
      if (m && m.index !== undefined) {
        foundSlots.push({
          type: sm.type,
          time: sm.time,
          label: sm.label,
          icon: sm.icon,
          startIndex: m.index + m[0].length,
          matchIndex: m.index
        });
      }
    }

    foundSlots.sort((a, b) => a.matchIndex - b.matchIndex);

    const meals = [];
    for (let s = 0; s < foundSlots.length; s++) {
      const slot = foundSlots[s];
      const endIdx = (s + 1 < foundSlots.length) ? foundSlots[s + 1].matchIndex : chunk.length;
      let rawFood = chunk.substring(slot.startIndex, endIdx).trim();

      // Clean markdown bullets, extra punctuation and line breaks
      const cleanFood = rawFood
        .replace(/^[\*\-\•\s]+/gm, '')
        .replace(/\n+/g, ' · ')
        .replace(/[*_#`]/g, '')
        .trim();

      if (cleanFood.length > 2) {
        meals.push({
          type: slot.type,
          time: slot.time,
          label: slot.label,
          icon: slot.icon,
          food: cleanFood
        });
      }
    }

    if (meals.length > 0) {
      sections.push({
        dayNum: current.num,
        type: current.type,
        title: current.rawTitle,
        meals: meals
      });
    }
  }

  return sections.length > 0 ? { sections, totalSections: sections.length } : null;
}

/**
 * Builds standard calendar meal items from extracted plan
 */
export function buildCalendarMealsFromPlan(plan, startDate = new Date()) {
  if (!plan || !plan.sections) return [];
  const generatedMeals = [];

  plan.sections.forEach((sec, sIdx) => {
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + sIdx);
    const dateStr = formatLocalDate ? formatLocalDate(targetDate) : targetDate.toISOString().split('T')[0];

    sec.meals.forEach((m, mIdx) => {
      generatedMeals.push({
        id: `cal_ai_${Date.now()}_${sIdx}_${mIdx}_${Math.random().toString(36).substr(2, 4)}`,
        dateStr: dateStr,
        slot: m.label || m.type,
        time: m.time || '12:00',
        text: m.food,
        title: `${m.label || m.type} · ${sec.title || 'Plan Vitaliste'}`,
        note: m.food,
        icon: m.icon || '🥗',
        tone: 'alkaline',
        tags: ['IA Plan', sec.type || 'JOUR'],
        done: false
      });
    });
  });

  return generatedMeals;
}

/**
 * Generates the Japandi Action Card HTML for Chat Messages
 */
export function renderDietPlanActionCardHtml(extractedPlan, tFunc = (k, p, f) => f || k) {
  if (!extractedPlan || !extractedPlan.sections || extractedPlan.sections.length === 0) return '';
  const count = extractedPlan.sections.length;
  const isPhase = extractedPlan.sections[0].type === 'PHASE';
  const unitLabel = isPhase ? `${count} Phases` : `${count} Jours`;
  const encodedPlan = btoa(unescape(encodeURIComponent(JSON.stringify(extractedPlan))));

  const titleText = isPhase
    ? `Protocole & Régime par Étapes (${unitLabel})`
    : `Programme Vitaliste Évolutif (${unitLabel})`;

  // Build Sample Daily Meals Preview
  let dailyMealsPreviewHtml = '';
  const sampleSection = extractedPlan.sections[0];
  if (sampleSection && sampleSection.meals) {
    dailyMealsPreviewHtml = sampleSection.meals.map(m => `
      <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; padding:8px 12px; background:var(--surface-2); border-radius:10px; border:1px solid var(--border);">
        <span style="font-size:1.2rem; line-height:1;">${m.icon || '🥗'}</span>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:0.84rem; color:var(--text);">${m.label || m.type}</div>
          <div style="font-size:0.78rem; color:var(--text-dim); line-height:1.4;">${m.food}</div>
        </div>
      </div>
    `).join('');
  }

  return `
    <div class="ai-diet-plan-smart-card">
      <!-- Header -->
      <div class="plan-smart-header">
        <div class="plan-smart-title-group">
          <div class="plan-smart-icon">
            <i class="ri-sparkling-fill"></i>
          </div>
          <div>
            <div class="plan-smart-title">${titleText}</div>
            <div class="plan-smart-subtitle">Synthèse Japandi · Détoxification lymphatique &amp; filtration rénale</div>
          </div>
        </div>
        <span class="plan-pill accent">⚡ Plan Prêt</span>
      </div>

      <!-- 3 Metrics Chips -->
      <div class="plan-chips-row">
        <span class="plan-pill"><i class="ri-calendar-line"></i> ${count >= 25 ? '30 Jours' : unitLabel}</span>
        <span class="plan-pill accent"><i class="ri-leaf-line"></i> 4-5 Rituels / Jour</span>
        <span class="plan-pill sky"><i class="ri-drop-line"></i> Filtration Rénale &amp; Lymphe</span>
      </div>

      <!-- Accordion 1: 4 Semaines Évolutives -->
      <details class="japandi-plan-accordion" open>
        <summary>
          <span class="acc-title"><i class="ri-road-map-line" style="color:var(--accent)"></i> <strong>Les 4 Paliers Évolutifs du Mois</strong></span>
          <i class="ri-arrow-down-s-line acc-chevron"></i>
        </summary>
        <div class="japandi-accordion-body">
          <div class="plan-week-card">
            <div class="plan-week-header">
              <span class="plan-week-name">🌱 Semaine 1 : Fondation &amp; Hydratation</span>
              <span class="plan-pill" style="font-size:0.7rem; padding:2px 8px;">Jours 1-7</span>
            </div>
            <div class="plan-week-desc">Eau tiède citronnée au réveil, petit-déjeuner de fruits aqueux, introduction d'une soupe crue le soir.</div>
          </div>
          <div class="plan-week-card">
            <div class="plan-week-header">
              <span class="plan-week-name">💧 Semaine 2 : Drainage Rénal &amp; Tisanes</span>
              <span class="plan-pill" style="font-size:0.7rem; padding:2px 8px;">Jours 8-14</span>
            </div>
            <div class="plan-week-desc">Infusions d'ortie dioïque reminéralisante, grande salade balai vivante au déjeuner pour balayer le mucus.</div>
          </div>
          <div class="plan-week-card">
            <div class="plan-week-header">
              <span class="plan-week-name">⚡ Semaine 3 : Alcalinisation Cellulaire (80% Cru)</span>
              <span class="plan-pill" style="font-size:0.7rem; padding:2px 8px;">Jours 15-21</span>
            </div>
            <div class="plan-week-desc">Alimentation vivante haute énergie, graines germées, légumes cuits vapeur douce en ancrage modéré.</div>
          </div>
          <div class="plan-week-card">
            <div class="plan-week-header">
              <span class="plan-week-name">✨ Semaine 4 : Ancrage &amp; Vitalité Durable</span>
              <span class="plan-pill" style="font-size:0.7rem; padding:2px 8px;">Jours 22-30</span>
            </div>
            <div class="plan-week-desc">Consolidation sans obstruction digestive, autonomie nutritionnelle et légèreté lymphatique.</div>
          </div>
        </div>
      </details>

      <!-- Accordion 2: La Journée Type -->
      <details class="japandi-plan-accordion">
        <summary>
          <span class="acc-title"><i class="ri-restaurant-line" style="color:var(--accent)"></i> <strong>La Journée Type &amp; Rituels</strong></span>
          <i class="ri-arrow-down-s-line acc-chevron"></i>
        </summary>
        <div class="japandi-accordion-body">
          ${dailyMealsPreviewHtml || '<p style="color:var(--text-dim);">Repas équilibrés selon les principes d\'Arnold Ehret &amp; Dr. Morse.</p>'}
        </div>
      </details>

      <!-- Accordion 3: Plantes de Soutien -->
      <details class="japandi-plan-accordion">
        <summary>
          <span class="acc-title"><i class="ri-plant-line" style="color:var(--accent)"></i> <strong>Plantes &amp; Tisanes Recommandées</strong></span>
          <i class="ri-arrow-down-s-line acc-chevron"></i>
        </summary>
        <div class="japandi-accordion-body">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="padding:8px 12px; background:var(--surface-2); border-radius:10px; border:1px solid var(--border);">
              <div style="font-weight:700; color:var(--text); font-size:0.84rem;">🌿 Ortie Dioïque (Plante Locale)</div>
              <div style="font-size:0.78rem; color:var(--text-dim); line-height:1.4;">Reminéralisante, soutient la filtration des néphrons et fluidifie la lymphe. Infuser 15 min à couvert.</div>
            </div>
            <div style="padding:8px 12px; background:var(--surface-2); border-radius:10px; border:1px solid var(--border);">
              <div style="font-weight:700; color:var(--text); font-size:0.84rem;">🌱 Chanca Piedra (Amazonie Raintree)</div>
              <div style="font-size:0.78rem; color:var(--text-dim); line-height:1.4;">Protection parenchymateuse et décongestion rénale. Décoction douce 10 min.</div>
            </div>
          </div>
        </div>
      </details>

      <!-- Accordion 4: Aliments à Éviter -->
      <details class="japandi-plan-accordion">
        <summary>
          <span class="acc-title"><i class="ri-forbid-line" style="color:#ef4444"></i> <strong>Aliments à Éliminer Strictement</strong></span>
          <i class="ri-arrow-down-s-line acc-chevron"></i>
        </summary>
        <div class="japandi-accordion-body">
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <span class="plan-pill" style="color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08);">🚫 Produits laitiers (Caséine)</span>
            <span class="plan-pill" style="color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08);">🚫 Viandes rouges &amp; Charcuteries</span>
            <span class="plan-pill" style="color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08);">🚫 Aliments ultra-transformés (NOVA 4)</span>
            <span class="plan-pill" style="color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.08);">🚫 Mélange fruits + repas cuits</span>
          </div>
        </div>
      </details>

      <!-- Action Buttons -->
      <div class="plan-smart-actions">
        <button type="button" class="btn-plan-activate" onclick="window.applyExtractedDietPlanToCalendar('${encodedPlan}')">
          <i class="ri-calendar-check-line"></i> Activer ce Programme au Calendrier
        </button>
        <button type="button" class="btn-plan-customize" onclick="window.previewAndCustomizeDietPlanModal('${encodedPlan}')">
          <i class="ri-edit-line"></i> Adapter &amp; Personnaliser
        </button>
      </div>
    </div>
  `;
}

/**
 * 1-Click Application of Extracted Diet Plan to Calendar with Conflict Management
 */
export function applyExtractedDietPlanToCalendar(encodedPlan, conflictMode = null) {
  try {
    const plan = JSON.parse(decodeURIComponent(escape(atob(encodedPlan))));
    const newMeals = buildCalendarMealsFromPlan(plan, new Date());
    if (!newMeals || newMeals.length === 0) {
      if (window.showToast) window.showToast("⚠️ Aucun repas n'a pu être extrait du plan.", "error");
      return;
    }

    const storedMeals = store.get('calendar_meals', []);
    const targetDates = {};
    newMeals.forEach(m => { targetDates[m.dateStr] = true; });

    const conflicting = storedMeals.filter(m => targetDates[m.dateStr]);

    if (conflicting.length > 0 && !conflictMode) {
      // Show Japandi Conflict Resolution Modal
      const existingModal = document.getElementById('conflictModalOverlay');
      if (existingModal) existingModal.remove();

      const overlay = document.createElement('div');
      overlay.id = 'conflictModalOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn 0.2s ease;';
      overlay.innerHTML = `
        <div class="conflict-modal-card glass" style="background:var(--surface,#ffffff);border:1.5px solid var(--border,#cbd5e1);border-radius:24px;padding:28px 24px;max-width:480px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.35);color:var(--text,#0f172a);position:relative;">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            <div style="width:46px;height:46px;border-radius:14px;background:rgba(245,158,11,0.18);color:#d97706;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">
              <i class="ri-calendar-event-line"></i>
            </div>
            <div>
              <h3 style="margin:0;font-size:1.2rem;font-weight:800;color:var(--text,#0f172a);line-height:1.2;">Repas existants détectés</h3>
              <span style="font-size:0.85rem;color:var(--text-dim,#64748b);font-weight:600;">${conflicting.length} créneau(x) déjà planifié(s) sur ces dates</span>
            </div>
          </div>
          <p style="font-size:0.92rem;color:var(--text-mid,#334155);margin:0 0 20px;line-height:1.5;">Des repas sont déjà programmés sur cette période. Choisissez comment intégrer ce nouveau plan IA :</p>
          
          <div style="display:flex;flex-direction:column;gap:12px;">
            <button type="button" onclick="document.getElementById('conflictModalOverlay').remove(); window.applyExtractedDietPlanToCalendar('${encodedPlan}', 'replace')" style="padding:14px 18px;border-radius:16px;border:none;background:linear-gradient(135deg, var(--accent, #059669), #047857);color:#ffffff;font-weight:700;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;gap:12px;box-shadow:0 6px 18px rgba(5,150,105,0.3);text-align:left;">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
                <i class="ri-refresh-line"></i>
              </div>
              <div style="flex:1;">
                <div style="font-weight:800;font-size:0.96rem;">Remplacer les jours du plan</div>
                <div style="font-size:0.78rem;opacity:0.9;font-weight:500;">Écrase le planning existant sur ces dates</div>
              </div>
            </button>

            <button type="button" onclick="document.getElementById('conflictModalOverlay').remove(); window.applyExtractedDietPlanToCalendar('${encodedPlan}', 'merge')" style="padding:14px 18px;border-radius:16px;border:2px solid var(--accent, #059669);background:var(--surface-2, #f8fafc);color:var(--text, #0f172a);font-weight:700;cursor:pointer;font-size:0.95rem;display:flex;align-items:center;gap:12px;text-align:left;">
              <div style="width:36px;height:36px;border-radius:10px;background:rgba(5,150,105,0.12);color:var(--accent, #059669);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">
                <i class="ri-add-circle-line"></i>
              </div>
              <div style="flex:1;">
                <div style="font-weight:800;font-size:0.96rem;color:var(--text, #0f172a);">Fusionner (ajouter à côté)</div>
                <div style="font-size:0.78rem;color:var(--text-dim, #64748b);font-weight:500;">Conserve vos repas actuels et ajoute les repas IA</div>
              </div>
            </button>

            <button type="button" onclick="document.getElementById('conflictModalOverlay').remove()" style="padding:11px;border-radius:12px;border:1px solid transparent;background:transparent;color:var(--text-dim,#64748b);cursor:pointer;font-size:0.88rem;font-weight:600;margin-top:2px;">
              Annuler
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      return;
    }

    const next = conflictMode === 'replace'
      ? storedMeals.filter(m => !targetDates[m.dateStr]).concat(newMeals)
      : storedMeals.concat(newMeals);

    store.set('calendar_meals', next);

    if (window.showToast) {
      window.showToast(`📅 Plan de ${plan.sections.length} jour(s) appliqué à votre calendrier !`, 'success', 3500);
    }

    if (typeof window.showPage === 'function') {
      window.showPage('calendar');
    }

    if (typeof window.renderCalendar === 'function') window.renderCalendar();
    if (typeof window.renderStrip === 'function') window.renderStrip();
    if (typeof window.renderDay === 'function') window.renderDay();
    if (typeof window.refreshDailyStripRoutine === 'function') window.refreshDailyStripRoutine();

  } catch (err) {
    console.error('[dietPlanAiBridge] apply error:', err);
    if (window.showToast) window.showToast("⚠️ Impossible d'appliquer le plan au calendrier.", 'error');
  }
}

/**
 * Opens Interactive Japandi Customizer Modal for Diet Plan
 */
export function previewAndCustomizeDietPlanModal(encodedPlan) {
  try {
    const plan = JSON.parse(decodeURIComponent(escape(atob(encodedPlan))));
    const modal = document.getElementById('previewDietPlanModal');
    const container = document.getElementById('previewDietPlanModalContent');
    if (!modal || !container) return;

    let sectionsHtml = '';
    plan.sections.forEach((sec, sIdx) => {
      let mealsInputs = '';
      sec.meals.forEach((m, mIdx) => {
        mealsInputs += `
          <div class="customizer-meal-row" style="background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:8px;" data-section-idx="${sIdx}" data-meal-idx="${mIdx}">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <span style="font-weight:700; font-size:0.85rem; color:var(--text); display:flex; align-items:center; gap:6px;">
                ${m.icon || '🥗'} ${m.label || m.type}
              </span>
              <div style="display:flex; align-items:center; gap:6px;">
                <button type="button" class="btn-substitute-mini" onclick="window.substituteCustomizerFood(this)" style="background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); color:var(--accent); border-radius:8px; padding:3px 8px; font-size:0.75rem; font-weight:700; cursor:pointer;" title="Proposer une alternative">
                  <i class="ri-loop-right-line"></i> Varier
                </button>
                <button type="button" onclick="this.closest('.customizer-meal-row').remove()" style="background:transparent; border:none; color:#ef4444; cursor:pointer; font-size:0.9rem;" title="Supprimer ce créneau">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
            <textarea class="form-input-v2 meal-edit-text" style="min-height:50px; font-size:0.85rem; line-height:1.4; resize:vertical; width:100%;">${m.food}</textarea>
          </div>
        `;
      });

      sectionsHtml += `
        <div class="customizer-section-card" style="background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:16px; margin-bottom:14px;" data-section-idx="${sIdx}">
          <div style="font-weight:800; font-size:0.95rem; color:var(--accent); margin-bottom:10px; display:flex; align-items:center; gap:8px;">
            <i class="ri-calendar-2-line"></i> ${sec.type} ${sec.dayNum} : ${sec.title}
          </div>
          <div class="customizer-meals-list">
            ${mealsInputs}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div style="width:44px; height:44px; border-radius:14px; background:rgba(16,185,129,0.2); color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0;">
          <i class="ri-magic-line"></i>
        </div>
        <div>
          <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:var(--text);">Adapter &amp; Personnaliser le Plan</h3>
          <span style="font-size:0.8rem; color:var(--text-dim);">Ajustez les repas selon vos envies et validez pour enregistrer dans votre calendrier</span>
        </div>
      </div>

      <div style="margin-bottom:14px; padding:10px 14px; background:var(--surface-2); border-radius:12px; border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <span style="font-size:0.85rem; font-weight:700; color:var(--text);"><i class="ri-calendar-event-line" style="color:var(--accent)"></i> Date de début :</span>
        <select id="planStartChoice" class="form-input-v2" style="padding:6px 12px; font-size:0.82rem; border-radius:8px; border:1px solid var(--border); background:var(--surface); color:var(--text);">
          <option value="0">Démarrer aujourd'hui</option>
          <option value="1">Démarrer demain</option>
          <option value="next_monday">Démarrer lundi prochain</option>
        </select>
      </div>

      <div style="max-height:50vh; overflow-y:auto; padding-right:4px; margin-bottom:16px;">
        ${sectionsHtml}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:10px; border-top:1px solid var(--border);">
        <button type="button" class="btn-secondary" onclick="window.closePreviewDietPlanModal(null)" style="padding:10px 18px; border-radius:12px; font-size:0.88rem; font-weight:600;">
          Annuler
        </button>
        <button type="button" class="btn-primary" onclick="window.saveAndApplyCustomizedDietPlan()" style="padding:10px 22px; border-radius:12px; font-size:0.9rem; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
          <i class="ri-check-line"></i> Enregistrer dans mon Calendrier
        </button>
      </div>
    `;

    modal.style.display = 'flex';
  } catch (err) {
    console.error('[dietPlanAiBridge] preview modal error:', err);
  }
}

export function substituteCustomizerFood(btnEl) {
  const row = btnEl.closest('.customizer-meal-row');
  if (!row) return;
  const textarea = row.querySelector('.meal-edit-text');
  if (!textarea) return;

  const suggestions = [
    "Monodiète de pastèque ou melon d'eau de saison (100% vivant et hydratant)",
    "Grande salade vivante : roquette, concombre, graines de tournesol germées, jus de citron",
    "Gaspacho cru : tomates mûres, poivrons doux, basilic frais et ail doux",
    "Légumes d'été cuits vapeur douce (courgettes, aubergines) + patate douce tiède",
    "Infusion reminéralisante d'ortie dioïque et de prêle des champs",
    "Bol de baies sauvages : myrtilles fraîches, framboises et mûres locales"
  ];
  const choice = suggestions[Math.floor(Math.random() * suggestions.length)];
  textarea.value = choice;
  if (window.showToast) window.showToast("✨ Repas varié avec succès !", "success");
}

/**
 * Saves the edited plan from the modal directly to Calendar
 */
export function saveAndApplyCustomizedDietPlan() {
  const container = document.getElementById('previewDietPlanModalContent');
  if (!container) return;

  const startChoice = document.getElementById('planStartChoice')?.value || '0';
  let startDate = new Date();
  if (startChoice === '1') {
    startDate.setDate(startDate.getDate() + 1);
  } else if (startChoice === 'next_monday') {
    const day = startDate.getDay();
    const diff = startDate.getDate() + (day === 0 ? 1 : (8 - day));
    startDate.setDate(diff);
  }

  const sectionCards = container.querySelectorAll('.customizer-section-card');
  const sections = [];

  sectionCards.forEach((secEl, sIdx) => {
    const title = secEl.querySelector('div')?.textContent?.trim() || `Jour ${sIdx + 1}`;
    const mealRows = secEl.querySelectorAll('.customizer-meal-row');
    const meals = [];

    mealRows.forEach(row => {
      const label = row.querySelector('span')?.textContent?.trim() || 'Repas';
      const text = row.querySelector('.meal-edit-text')?.value?.trim() || '';
      if (text) {
        meals.push({
          type: 'meal',
          time: '12:00',
          label: label,
          food: text
        });
      }
    });

    if (meals.length > 0) {
      sections.push({
        dayNum: sIdx + 1,
        type: 'JOUR',
        title: title,
        meals: meals
      });
    }
  });

  const updatedPlan = { sections, totalSections: sections.length };
  const encodedPlan = btoa(unescape(encodeURIComponent(JSON.stringify(updatedPlan))));

  closePreviewDietPlanModal();
  applyExtractedDietPlanToCalendar(encodedPlan);
}

export function closePreviewDietPlanModal(event = null) {
  if (event && event.target && event.target.id !== 'previewDietPlanModal') return;
  const modal = document.getElementById('previewDietPlanModal');
  if (modal) modal.style.display = 'none';
}

/**
 * Intelligent parser that extracts a single meal/dish proposal from markdown AI responses
 * when no JSON block was provided.
 */
export function extractSingleMealFromMarkdown(text) {
  if (!text || typeof text !== 'string') return null;
  // If text already has an explicit diet plan with multiple days, let parseMarkdownDietPlan handle it
  if (/(?:JOUR|DAY|SEMAINE|WEEK)\s*\d+/i.test(text) && /(?:Matin|Midi|Soir|Hydratation)/i.test(text)) {
    return null;
  }

  // Look for recipe / dish patterns:
  const hasRecipeKeywords = /(?:ingr[ée]dients?|recette|pr[ée]paration|assiette|bol|salade|smoothie|velout[ée]|soupe|d[ée]coction|jus|plat|d[ée]jeuner|d[iî]ner|petit[- ]d[ée]jeuner)/i.test(text);
  if (!hasRecipeKeywords) return null;

  // 1. Detect dish title
  let dishName = '';
  let emoji = '🥗';

  // Pattern 1: Heading with emoji/title (e.g. ### 🥗 Salade Détoxifiante or ### Salade ...)
  const headingMatch = text.match(/(?:^|\n)###?\s*([^\n]+)/);
  if (headingMatch && !headingMatch[1].toLowerCase().includes('directive') && !headingMatch[1].toLowerCase().includes('conseil') && !headingMatch[1].toLowerCase().includes('principe') && !headingMatch[1].toLowerCase().includes('priorité')) {
    const rawHeading = headingMatch[1].replace(/[*_#`]/g, '').trim();
    const emojiMatch = rawHeading.match(/([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}])/u);
    if (emojiMatch) emoji = emojiMatch[1];
    dishName = rawHeading.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu, '').replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();
  }

  // Pattern 2: Bold title (e.g. **Salade de concombre et avocat**)
  if (!dishName) {
    const boldMatch = text.match(/\*\*([^\*\n]{4,50})\*\*/);
    if (boldMatch && !boldMatch[1].toLowerCase().includes('ingrédient') && !boldMatch[1].toLowerCase().includes('préparation') && !boldMatch[1].toLowerCase().includes('pral')) {
      dishName = boldMatch[1].trim();
    }
  }

  // Pattern 3: Explicit recipe label (e.g. Recette : Salade ...)
  if (!dishName) {
    const recipeMatch = text.match(/(?:Recette|Plat|Proposition|Repas)\s*:\s*([^\n\.,]+)/i);
    if (recipeMatch) dishName = recipeMatch[1].replace(/[*_#`]/g, '').trim();
  }

  if (!dishName || dishName.length < 3) {
    dishName = "Plat Vitaliste Personnalisé";
  }

  // 2. Detect category (breakfast, lunch, dinner, snack)
  let category = 'lunch';
  const lower = text.toLowerCase();
  if (lower.includes('petit-déjeuner') || lower.includes('petit déjeuner') || lower.includes('matin') || lower.includes('smoothie') || lower.includes('breakfast')) {
    category = 'breakfast';
    if (emoji === '🥗') emoji = '🍉';
  } else if (lower.includes('dîner') || lower.includes('diner') || lower.includes('souper') || lower.includes('soir') || lower.includes('dinner')) {
    category = 'dinner';
    if (emoji === '🥗') emoji = '🍲';
  } else if (lower.includes('collation') || lower.includes('snack') || lower.includes('tisane') || lower.includes('décoction') || lower.includes('infusion')) {
    category = 'snack';
    if (emoji === '🥗') emoji = '🍵';
  }

  // 3. Extract ingredients (bullets after Ingrédients: or general list)
  const items = [];
  const ingMatch = text.match(/(?:Ingr[ée]dients?|Composants?)[^:\n]*:?\s*([\s\S]*?)(?=(?:Pr[ée]paration|Instructions?|B[ée]n[ée]fices?|Conseils?|Astuce|###|```|$))/i);
  
  if (ingMatch && ingMatch[1]) {
    const lines = ingMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•') || /^\d+[\.\)]/.test(line)) {
        const clean = line.replace(/^[*\-•\d\.\)]+\s*/, '').replace(/[*_`]/g, '').trim();
        if (clean.length > 2 && clean.length < 80) {
          items.push(clean);
        }
      }
    }
  }

  // If no ingredients list found, scan all bullet points in message
  if (items.length === 0) {
    const allBullets = text.match(/^[*\-•]\s+([^\n]+)/gm);
    if (allBullets && allBullets.length > 0) {
      for (const b of allBullets.slice(0, 6)) {
        const clean = b.replace(/^[*\-•]\s+/, '').replace(/[*_`]/g, '').trim();
        if (clean.length > 2 && clean.length < 80 && !clean.includes('###')) {
          items.push(clean);
        }
      }
    }
  }

  if (items.length === 0) {
    items.push(dishName);
  }

  // 4. Calculate estimated vitality metrics
  const isTransition = lower.includes('transition') || lower.includes('cuit') || lower.includes('poisson') || lower.includes('vapeur') || lower.includes('féculent');
  const isAcid = lower.includes('acidifiant') || lower.includes('viande') || lower.includes('fromage');
  
  const pralScore = isAcid ? +8.5 : (isTransition ? -3.5 : -11.2);
  const vitalityScore = isAcid ? 45 : (isTransition ? 75 : 95);
  const isElectric = !isAcid && !isTransition;
  const isMucusForming = isAcid;

  // Extract a brief note
  let note = "Équilibre acido-basique, fluidification lymphatique et régénération cellulaire.";
  if (category === 'breakfast') note = "Éveil enzymatique et hydratation cellulaire sans surcharge digestive.";
  if (category === 'dinner') note = "Dîner léger facilitant le repos hépatique et le sommeil réparateur.";
  if (isTransition) note = "Plat de transition doux respectant la loi d'association d'Arnold Ehret.";

  return {
    name: dishName,
    category,
    emoji,
    items,
    pralScore,
    vitalityScore,
    isElectric,
    isMucusForming,
    note
  };
}

/**
 * Renders an Interactive Japandi Action Card for a Single Proposed Meal/Recipe
 */
export function renderMealActionCardHtml(meal, tFunc = (k, p, f) => f || k) {
  if (!meal) return '';
  const encodedMeal = btoa(unescape(encodeURIComponent(JSON.stringify(meal))));
  const rawItems = Array.isArray(meal.items) ? meal.items : (Array.isArray(meal.ingredients) ? meal.ingredients : [meal.name]);
  
  const catLabels = {
    breakfast: '🌅 Petit-déjeuner Vital',
    lunch: '🥗 Déjeuner Vivant',
    dinner: '🍲 Dîner de Transition',
    snack: '🍵 Éveil & Collation'
  };
  const catLabel = catLabels[meal.category] || meal.category || 'Repas Vitaliste';

  const isElectric = meal.isElectric !== false && !meal.isMucusForming;
  const pralText = meal.pralScore !== undefined ? `PRAL ${meal.pralScore > 0 ? '+' : ''}${meal.pralScore}` : 'Alcalinisant';
  const vitalityBadge = isElectric
    ? `<span class="plan-pill accent" style="font-size:0.75rem;"><i class="ri-flashlight-fill"></i> ⚡ 100% Électrique</span>`
    : `<span class="plan-pill" style="font-size:0.75rem; color:#f59e0b; border-color:rgba(245,158,11,0.3); background:rgba(245,158,11,0.08);"><i class="ri-shuffle-line"></i> 🟡 Transition</span>`;

  const itemsPills = rawItems.map(it => `
    <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:var(--surface-2, rgba(255,255,255,0.05)); border:1px solid var(--border); border-radius:12px; font-size:0.8rem; color:var(--text); margin:2px 3px 2px 0;">
      <i class="ri-leaf-line" style="color:var(--accent); font-size:0.75rem;"></i> ${typeof it === 'string' ? it : it.name}
    </span>
  `).join('');

  const safeMealName = (meal.name || 'ce repas').replace(/'/g, "\\'");

  return `
    <div class="ai-meal-action-card glass" style="margin:14px 0; padding:16px 18px; border-radius:18px; border:1.5px solid var(--accent); background:rgba(16,185,129,0.05); box-shadow:0 8px 24px rgba(0,0,0,0.15);">
      <!-- Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.6rem; line-height:1;">${meal.emoji || '🥗'}</span>
          <div>
            <div style="font-weight:800; font-size:1.05rem; color:var(--text); line-height:1.2;">${meal.name || 'Plat Proposé'}</div>
            <div style="font-size:0.78rem; color:var(--text-dim);">${catLabel} · ${pralText}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          ${vitalityBadge}
        </div>
      </div>

      <!-- Ingrédients Chips -->
      <div style="margin-bottom:10px;">
        <div style="font-size:0.78rem; font-weight:700; color:var(--text-dim); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Ingrédients Clés :</div>
        <div style="display:flex; flex-wrap:wrap; gap:3px;">
          ${itemsPills}
        </div>
      </div>

      ${meal.note ? `<div style="font-size:0.82rem; color:var(--text-dim); margin-bottom:12px; line-height:1.4; font-style:italic;">🌿 ${meal.note}</div>` : ''}

      <!-- 3 Primary Action Buttons -->
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
        <button type="button" class="btn-primary" onclick="window.handleAddActionMeal('${encodedMeal}')" style="display:inline-flex; align-items:center; gap:6px; padding:9px 16px; border-radius:12px; font-size:0.86rem; font-weight:700; cursor:pointer;">
          <i class="ri-add-circle-fill"></i> Ajouter aux Repas du Jour
        </button>
        <button type="button" class="btn-secondary" onclick="window.openScheduleMealModal('${encodedMeal}')" style="display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border-radius:12px; font-size:0.84rem; font-weight:700; background:var(--surface-2); border:1px solid var(--border); color:var(--text); cursor:pointer;">
          <i class="ri-calendar-event-fill" style="color:var(--accent);"></i> Planifier au Calendrier
        </button>
        <button type="button" class="btn-secondary" onclick="window.saveMealToCustomRecipes('${encodedMeal}')" style="display:inline-flex; align-items:center; gap:6px; padding:9px 14px; border-radius:12px; font-size:0.84rem; font-weight:700; background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.3); color:var(--accent); cursor:pointer;" title="Enregistrer dans ma base de recettes">
          <i class="ri-bookmark-3-fill"></i> Sauvegarder dans Mes Recettes
        </button>
      </div>

      <!-- Quick AI Adjustments Bar -->
      <div style="margin-top:12px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.06); display:flex; flex-wrap:wrap; gap:5px; align-items:center;">
        <span style="font-size:0.74rem; font-weight:700; color:var(--text-dim); margin-right:4px;">Ajuster avec l'IA :</span>
        <button type="button" class="quick-reply-chip" onclick="window.askMealVariant('${safeMealName}', 'fridge')" style="font-size:0.75rem; padding:4px 10px; border-radius:50px; background:var(--surface-2); border:1px solid var(--border); color:var(--text); cursor:pointer;">
          🥑 Avec mon frigo
        </button>
        <button type="button" class="quick-reply-chip" onclick="window.askMealVariant('${safeMealName}', 'raw')" style="font-size:0.75rem; padding:4px 10px; border-radius:50px; background:var(--surface-2); border:1px solid var(--border); color:var(--text); cursor:pointer;">
          🌿 Version 100% crue
        </button>
        <button type="button" class="quick-reply-chip" onclick="window.askMealVariant('${safeMealName}', 'transition')" style="font-size:0.75rem; padding:4px 10px; border-radius:50px; background:var(--surface-2); border:1px solid var(--border); color:var(--text); cursor:pointer;">
          🥣 Aliment de transition
        </button>
        <button type="button" class="quick-reply-chip" onclick="window.openMealCustomizer('${safeMealName}')" style="font-size:0.75rem; padding:4px 10px; border-radius:50px; background:rgba(52,211,153,0.12); border:1px solid rgba(52,211,153,0.3); color:var(--accent); cursor:pointer;">
          🔄 Autre variante...
        </button>
      </div>
    </div>
  `;
}

// Global window bindings
if (typeof window !== 'undefined') {
  window.dietPlanAiBridge = {
    parseMarkdownDietPlan,
    buildCalendarMealsFromPlan,
    renderDietPlanActionCardHtml,
    extractSingleMealFromMarkdown,
    renderMealActionCardHtml,
    applyExtractedDietPlanToCalendar,
    previewAndCustomizeDietPlanModal,
    substituteCustomizerFood,
    saveAndApplyCustomizedDietPlan,
    closePreviewDietPlanModal
  };
  window.extractSingleMealFromMarkdown = extractSingleMealFromMarkdown;
  window.renderMealActionCardHtml = renderMealActionCardHtml;
  window.applyExtractedDietPlanToCalendar = applyExtractedDietPlanToCalendar;
  window.previewAndCustomizeDietPlanModal = previewAndCustomizeDietPlanModal;
  window.substituteCustomizerFood = substituteCustomizerFood;
  window.saveAndApplyCustomizedDietPlan = saveAndApplyCustomizedDietPlan;
  window.closePreviewDietPlanModal = closePreviewDietPlanModal;
}
