// calendar-legacy.js

window.PROGRAM_START = new Date(); 
window.TOTAL_JOURS = 30;
window.TOTAL_REPAS_PROGRAMME = 150;
window.completedGlobal = 0; 
window.currentDateKey = "0"; // Offset in days from start

function addDays(d, n){ var r = new Date(d); r.setDate(r.getDate()+n); return r; }
function sameDay(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function getMealsByDate() {
  const stored = window.store.get('calendar_meals', []);
  const byDate = {};
  
  // Initialize next 7 days at least
  for(let i=0; i<7; i++) {
    byDate[i.toString()] = { theme: "Programme Vitaliste", meals: [] };
  }
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  stored.forEach(meal => {
    const mealDate = new Date(meal.dateStr);
    mealDate.setHours(0,0,0,0);
    const diffTime = mealDate - today;
    const offset = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (offset >= 0 && offset < 30) {
      if (!byDate[offset.toString()]) {
        byDate[offset.toString()] = { theme: "Programme Vitaliste", meals: [] };
      }
      byDate[offset.toString()].meals.push({
        id: meal.id,
        time: meal.time || (meal.slot === "Petit-déjeuner" ? "8h-9h" : meal.slot === "Déjeuner" ? "12h-13h" : meal.slot === "Collation" ? "16h" : "19h-20h"),
        tone: meal.tone || (meal.slot === "Dîner" ? "soir" : meal.slot === "Déjeuner" ? "midi" : "matin"),
        icon: meal.icon || (meal.slot === "Petit-déjeuner" ? "🌅" : meal.slot === "Déjeuner" ? "🥗" : meal.slot === "Collation" ? "🌰" : "🌙"),
        title: meal.title || meal.slot,
        tags: meal.tags || [],
        note: meal.note || meal.text,
        done: meal.done || false
      });
    }
  });
  
  return byDate;
}

window.renderStrip = function() {
  var dayStrip = document.getElementById("dayStrip");
  if (!dayStrip) return;
  var today = new Date();
  const byDate = getMealsByDate();
  
  dayStrip.innerHTML = "";
  for(var i=0; i<14; i++){
    var d = addDays(today, i);
    var key = i.toString();
    var isToday = i === 0;
    var wd = isToday ? "AUJ" : d.toLocaleDateString("fr-FR",{weekday:"short"}).replace(".","").toUpperCase();

    var chip = document.createElement("div");
    chip.className = "day-chip" + (key === window.currentDateKey ? " selected" : "") + (isToday ? " is-today" : "");
    chip.dataset.key = key;

    var data = byDate[key] || { meals: [] };
    var dotsHtml = "";
    for(var m=0; m<Math.max(3, Math.min(5, data.meals.length)); m++){
      var isDone = (data.meals[m] && data.meals[m].done) ? "done" : "";
      dotsHtml += "<i class='" + isDone + "'></i>";
    }

    chip.innerHTML =
      "<span class='wd'>" + wd + "</span>" +
      "<span class='dt'>" + d.getDate() + "</span>" +
      "<span class='day-dots'>" + dotsHtml + "</span>" +
      (isToday ? "<span class='today-mark'></span>" : "");

    chip.addEventListener("click", function(){
      window.currentDateKey = this.dataset.key;
      window.renderStrip();
      window.renderDay();
    });
    dayStrip.appendChild(chip);
  }
}

window.renderDay = function() {
  var dayCard = document.getElementById("dayCard");
  if (!dayCard) return;
  
  var today = new Date();
  var byDate = getMealsByDate();
  var data = byDate[window.currentDateKey];
  var offset = parseInt(window.currentDateKey, 10);
  var d = addDays(today, offset);
  var jourIndex = offset + 1;
  var dateLabel = d.toLocaleDateString("fr-FR",{weekday:"long", day:"numeric", month:"long"});
  dateLabel = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  if(!data || data.meals.length === 0){
    dayCard.innerHTML =
      "<div class='empty-state'>" +
      "<svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.4'><rect x='3' y='4' width='14' height='13' rx='2'/><line x1='3' y1='8' x2='17' y2='8'/></svg>" +
      "<div><b style='color:var(--text-mid)'>" + dateLabel + "</b></div>" +
      "<div style='margin-top:4px'>Aucun repas prévu ce jour. Cliquez sur l'icône baguette magique en haut pour générer un plan avec l'IA.</div>" +
      "</div>";
    updateProgramRing();
    return;
  }

  var toneColors = {
    matin:{ bg:"var(--amber-dim)", fg:"var(--amber-2)" },
    midi: { bg:"var(--blue-dim)",  fg:"var(--blue)" },
    soir: { bg:"var(--violet-dim)",fg:"var(--violet)" }
  };

  var html = "";
  html += "<div class='day-card-head'>";
  html += "<div class='day-card-title'><div><h2 style='display:inline'>"+dateLabel+"</h2> <span class='jour-pill'>Jour "+jourIndex+"</span>";
  html += "<div class='day-theme'>🔀 "+(data.theme || 'Programme')+"</div></div></div>";
  html += "<button class='refresh-btn' id='regenDayBtn' title='Régénérer les aliments de ce jour' onclick='window.confirmRegenerateDay()'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round'><path d='M4 10a6 6 0 0 1 10.5-4M16 10a6 6 0 0 1-10.5 4'/><path d='M14.5 3v3h-3M5.5 17v-3h3'/></svg></button>";
  html += "</div>";

  html += "<div class='timeline'><div class='timeline-track'></div><div class='timeline-fill' id='timelineFill'></div>";
  data.meals.forEach(function(meal, idx){
    var checked = meal.done;
    var tone = toneColors[meal.tone] || toneColors.matin;
    html += "<div class='meal-row-wrap" + (checked?" checked":"") + "'>";
    html += "<button class='meal-row' onclick='window.toggleMeal(\""+meal.id+"\")'>";
    html += "<span class='meal-marker'><svg viewBox='0 0 20 20' fill='none' stroke='#06170f' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><path d='M4 10l4 4 8-8'/></svg></span>";
    html += "<span class='meal-body'>";
    html += "<span class='meal-top'><span class='meal-icon' style='background:"+tone.bg+";color:"+tone.fg+"'>"+meal.icon+"</span>";
    html += "<span><span class='meal-title'>"+meal.title+"</span><br><span class='meal-time'>"+meal.time+"</span></span></span>";
    
    html += "<span class='meal-tags'>";
    if (meal.tags) {
      meal.tags.forEach(function(t, tagIdx){
        var safeTagN = (t.n || '').replace(/"/g, '&quot;').replace(/'/g, "\\'");
        var safeEmoji = t.e || '🍽️';
        html += "<span class='meal-tag meal-tag-interactive' title='Cliquer pour remplacer ou demander l\\'avis du Coach IA' onclick='event.stopPropagation();window.openSubstituteModal(\""+meal.id+"\", "+tagIdx+", \""+safeTagN+"\", \""+safeEmoji+"\")'>"+t.e+" "+t.n+" <i class=\"ri-loop-right-line sub-tag-icon\"></i></span>";
      });
    }
    html += "</span>";
    
    html += "<span class='meal-note'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6'><circle cx='10' cy='10' r='7'/><line x1='10' y1='9' x2='10' y2='14'/><circle cx='10' cy='6.5' r='.6' fill='currentColor'/></svg>"+meal.note+"</span>";
    html += "</span></button>";
    html += "<span class='meal-actions'>";
    var firstFood = (meal.tags && meal.tags[0] && meal.tags[0].n) ? meal.tags[0].n.replace(/"/g, '&quot;').replace(/'/g, "\\'") : '';
    var firstEmoji = (meal.tags && meal.tags[0] && meal.tags[0].e) || '🍽️';
    html += "<button class='meal-action-btn' data-tooltip='Varier un aliment' onclick='event.stopPropagation();window.openSubstituteModal(\""+meal.id+"\", 0, \""+firstFood+"\", \""+firstEmoji+"\")'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M4 10a6 6 0 0 1 10.5-4M16 10a6 6 0 0 1-10.5 4'/><path d='M14.5 3v3h-3M5.5 17v-3h3'/></svg></button>";
    html += "<button class='meal-action-btn ai-btn' data-tooltip='Suggérer un autre plat avec l\\'IA' onclick='event.stopPropagation();window.openMealAiSuggestModal(\""+meal.id+"\")' style='color:#34d399; background:rgba(52,211,153,0.1); border-color:rgba(52,211,153,0.3);'><i class=\"ri-sparkling-fill\"></i></button>";
    html += "<button class='meal-action-btn' data-tooltip='Modifier' onclick='event.stopPropagation();window.openCalMealModal(\""+meal.id+"\")'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M13.5 3.5l3 3L7 16l-4 1 1-4z'/></svg></button>";
    html += "<button class='meal-action-btn danger' data-tooltip='Supprimer' onclick='event.stopPropagation();window.deleteMealConfirm(\""+meal.id+"\")'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'><path d='M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10'/></svg></button>";
    html += "</span>";
    html += "</div>";
  });
  html += "</div>";

  html += "<div class='day-footer'><div class='bar'><div class='bar-fill' id='dayBarFill'></div></div><div class='lbl' id='dayFooterLbl'>0 sur "+data.meals.length+" repas complétés</div></div>";
  html += "<button class='uncheck-link' onclick='window.resetDay()'>↺ Tout décocher ce jour</button>";

  dayCard.innerHTML = html;
  
  var done = data.meals.filter(m => m.done).length;
  var total = data.meals.length;
  var pct = total > 0 ? (done/total) : 0;
  
  setTimeout(() => {
    const timeline = document.getElementById("timelineFill");
    const dayBar = document.getElementById("dayBarFill");
    if (timeline) timeline.style.height = (pct*100) + "%";
    if (dayBar) dayBar.style.width = (pct*100) + "%";
  }, 50);
  
  var lbl = document.getElementById("dayFooterLbl");
  if (lbl) lbl.textContent = done + " sur " + total + " repas complétés";
  
  updateProgramRing();
}

window.toggleMeal = function(mealId) {
  let stored = window.store.get('calendar_meals', []);
  const meal = stored.find(m => m.id === mealId);
  if (meal) {
    meal.done = !meal.done;
    window.store.set('calendar_meals', stored);
    window.renderDay();
    window.renderStrip();
  }
}

window.resetDay = function() {
  let stored = window.store.get('calendar_meals', []);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  stored.forEach(meal => {
    const mealDate = new Date(meal.dateStr);
    mealDate.setHours(0,0,0,0);
    const offset = Math.round((mealDate - today) / (1000 * 60 * 60 * 24));
    if (offset.toString() === window.currentDateKey) {
      meal.done = false;
    }
  });
  
  window.store.set('calendar_meals', stored);
  window.renderDay();
  window.renderStrip();
}

window.updateProgramRing = function() {
  const ringFg = document.getElementById("progRingFg");
  if (!ringFg) return;

  const stored = window.store.get('calendar_meals', []);
  const meta = window.store.get('active_plan_meta', null);

  // Avec un plan actif, le dénominateur est la taille DÉCLARÉE du plan
  // (numDays × repas/jour), pas "tout ce qui a jamais été stocké" — sinon
  // le % bouge à chaque repas ajouté manuellement et perd tout son sens.
  const total = meta ? meta.totalMeals : stored.length;
  const done = meta
    ? stored.filter(m => m.done && m.dateStr >= meta.startDateStr).length
    : stored.filter(m => m.done).length;

  window.completedGlobal = done;
  window.TOTAL_REPAS_PROGRAMME = Math.max(1, total);

  const CIRC = 2 * Math.PI * 44;
  ringFg.style.strokeDasharray = CIRC;

  var pct = total === 0 ? 0 : (done / total);
  ringFg.style.strokeDashoffset = CIRC * (1 - pct);

  var pctEl = document.getElementById("progPct");
  if (pctEl) pctEl.textContent = Math.round(pct*100) + "%";

  var progRepasChip = document.getElementById("progRepasChip");
  if (progRepasChip) progRepasChip.textContent = "🍽 " + done + "/" + total + " repas";

  var progTitle = document.getElementById("progTitle");
  if (progTitle) {
    if (meta) {
      const protocolLabels = { ehret: 'Transition Ehret', sebi: 'Guide Dr. Sebi', morse: 'Détox Dr. Morse', personalized: 'Programme Personnalisé' };
      progTitle.textContent = "⚡ " + (meta.title || protocolLabels[meta.protocol] || "Programme Vitaliste");
    } else {
      progTitle.textContent = stored.length > 0 ? "📋 Plan Libre / Manuel" : "📅 Aucun programme actif";
    }
  }

  var progJourChip = document.getElementById("progJourChip");
  if (progJourChip) {
    if (meta) {
      var start = new Date(meta.startDateStr);
      var current = new Date(new Date().setHours(0,0,0,0));
      var offsetDays = Math.round((current - start) / 86400000);
      var jourIndex = Math.min(meta.numDays, Math.max(1, offsetDays + 1));
      progJourChip.textContent = "Jour " + jourIndex + "/" + meta.numDays;
    } else {
      progJourChip.textContent = stored.length > 0 ? (stored.length + " repas saisis") : "Aucun plan actif";
    }
  }

  // Update Stop Button state: Disabled & grayed out if no active program and no meals
  var btnStop = document.getElementById("btnStopCalendar") || document.querySelector(".btn-stop");
  var hasActiveContent = !!meta || stored.length > 0;
  if (btnStop) {
    btnStop.disabled = !hasActiveContent;
    btnStop.classList.toggle('disabled', !hasActiveContent);
    btnStop.style.opacity = hasActiveContent ? '1' : '0.35';
    btnStop.style.pointerEvents = hasActiveContent ? 'auto' : 'none';
    btnStop.style.cursor = hasActiveContent ? 'pointer' : 'not-allowed';
    btnStop.setAttribute('data-tooltip', hasActiveContent ? 'Arrêter et réinitialiser le calendrier' : 'Aucun programme à arrêter');
  }
}

window.clearCalendar = async function() {
  const ok = await (window.showVitalConfirm ? window.showVitalConfirm({
    title: 'Arrêter le programme',
    message: 'Voulez-vous vraiment arrêter votre programme et effacer l\'ensemble du calendrier ?',
    icon: 'ri-alert-line',
    confirmText: 'Arrêter et effacer',
    cancelText: 'Annuler',
    isDanger: true
  }) : Promise.resolve(confirm("Voulez-vous vraiment arrêter votre programme et effacer le calendrier ?")));

  if (ok) {
    window.store.set('calendar_meals', []);
    window.store.set('active_plan_meta', null);
    window.currentDateKey = "0";
    window.renderStrip();
    window.renderDay();
    window.updateProgramRing();
    if (window.showToast) window.showToast('Programme arrêté et calendrier réinitialisé.', 'info');
  }
};

// ═══════ GÉNÉRATION DE PLAN VIA LE CHAT (paramètres uniquement) ═══════
// Le chat ne fournit plus que { numDays, protocol, objective, restrictions }
// (dietPlanRequest) — DietPlanEngine (diet-plan-engine.js) compose le
// calendrier réel à partir de la liste d'aliments approuvés. Voir aussi
// prompts.js : le LLM n'a plus le droit d'inventer des repas.

/**
 * Calcule un plan SANS l'écrire dans le stockage — à utiliser pour
 * afficher une carte de prévisualisation dans le chat ("Voici ton plan —
 * Appliquer / Ajuster / Annuler") avant tout engagement sur le calendrier
 * réel de l'utilisateur.
 */
window.previewDietPlanRequest = function(dietPlanRequest) {
  if (!window.DietPlanEngine) {
    console.error('diet-plan-engine.js non chargé.');
    return null;
  }
  return window.DietPlanEngine.generateDietPlan(dietPlanRequest);
};

/**
 * Applique un plan généré au calendrier réel.
 * - Si des repas existent déjà sur la plage de dates ciblée et qu'aucun
 *   `mode` n'est fourni, ne touche à RIEN et renvoie { conflict:true, ... }
 *   pour que l'appelant (UI chat) demande explicitement à l'utilisateur :
 *   remplacer ces jours, fusionner (ajouter à côté), ou annuler.
 * - mode: 'replace' → supprime les repas existants sur la plage avant d'insérer.
 * - mode: 'merge'   → ajoute les nouveaux repas à côté des existants.
 */
window.applyDietPlanRequest = function(dietPlanRequest, mode) {
  var generated = window.previewDietPlanRequest(dietPlanRequest);
  if (!generated) return { ok: false, error: 'engine_unavailable' };

  var stored = window.store.get('calendar_meals', []);
  var targetDates = {};
  generated.meals.forEach(function(m) { targetDates[m.dateStr] = true; });

  var conflicting = stored.filter(function(m) { return targetDates[m.dateStr]; });

  if (conflicting.length > 0 && !mode) {
    return {
      ok: false,
      conflict: true,
      conflictCount: conflicting.length,
      conflictDates: Object.keys(targetDates).filter(function(d) {
        return stored.some(function(m) { return m.dateStr === d; });
      }),
      preview: generated
    };
  }

  var next = mode === 'replace'
    ? stored.filter(function(m) { return !targetDates[m.dateStr]; })
    : stored.slice();

  next = next.concat(generated.meals);
  window.store.set('calendar_meals', next);
  window.store.set('active_plan_meta', generated.meta);
  window.currentDateKey = "0";

  window.renderStrip();
  window.renderDay();
  window.updateProgramRing();

  return { ok: true, meta: generated.meta };
};

// ═══════ ÉDITION / SUPPRESSION D'UN REPAS UNIQUE ═══════
// Manquait jusqu'ici : seuls "ajouter" et "cocher/décocher" existaient.
// Pas de rigidité — l'utilisateur doit pouvoir corriger un repas (généré
// par l'IA ou saisi à la main) sans tout recommencer.

window.editMeal = function(mealId, changes) {
  var stored = window.store.get('calendar_meals', []);
  var meal = stored.find(function(m) { return m.id === mealId; });
  if (!meal) return false;
  Object.assign(meal, changes);
  window.store.set('calendar_meals', stored);
  window.renderDay();
  window.renderStrip();
  return true;
};

window.deleteMeal = function(mealId) {
  var stored = window.store.get('calendar_meals', []);
  var next = stored.filter(function(m) { return m.id !== mealId; });
  window.store.set('calendar_meals', next);
  window.renderDay();
  window.renderStrip();
  window.updateProgramRing();
};

/**
 * Régénère le CONTENU du jour affiché (nouvelle sélection d'aliments dans
 * la même liste approuvée) — distinct de resetDay() qui ne fait que
 * décocher les repas existants. Miroir de DietPlanGenerator.regenerateDay
 * côté Flutter.
 */
window.regenerateDayContent = function() {
  if (!window.DietPlanEngine) return;
  var meta = window.store.get('active_plan_meta', null);
  var offset = parseInt(window.currentDateKey, 10) || 0;
  var today = new Date(); today.setHours(0,0,0,0);
  var date = addDays(today, offset);

  var fresh = window.DietPlanEngine.regenerateDietDay({
    protocol: meta ? meta.protocol : 'personalized',
    dayIndex: offset,
    numDays: meta ? meta.numDays : 7,
    date: date,
    restrictions: meta ? meta.restrictions : ''
  });

  var stored = window.store.get('calendar_meals', []);
  var dateStr = fresh.length ? fresh[0].dateStr : null;
  var next = stored.filter(function(m) { return m.dateStr !== dateStr; }).concat(fresh);
  window.store.set('calendar_meals', next);

  window.renderDay();
  window.renderStrip();
  window.updateProgramRing();
};

// Intercept existing renderCalendar to point to the new one
window.renderCalendar = function() {
  if (document.getElementById('legacy-calendar')) {
    window.renderStrip();
    window.renderDay();
    window.updateProgramRing();
  }
};

// ═══════ MANUAL MEAL MODAL (ajout ET édition) ═══════
window.openCalMealModal = function(mealId) {
  const overlay = document.getElementById('calMealModalOverlay');
  const modal = document.getElementById('calMealModal');
  if (!overlay || !modal) return;

  window._editingMealId = mealId || null;
  const titleEl = document.getElementById('calMealModalTitle');
  if (titleEl) titleEl.textContent = mealId ? '✏️ Modifier le repas' : '➕ Ajouter un repas';

  const dateInput = document.getElementById('calMealDate');
  const desc = document.getElementById('calMealDesc');
  const slots = document.querySelectorAll('#calMealSlots .chip-btn');

  let existing = null;
  if (mealId) {
    const stored = window.store.get('calendar_meals', []);
    existing = stored.find(m => m.id === mealId) || null;
  }

  if (existing) {
    if (dateInput) dateInput.value = existing.dateStr;
    if (desc) desc.value = existing.note || existing.text || '';
    slots.forEach(s => s.classList.toggle('active', s.dataset.slot === existing.slot));
  } else {
    // Default date to selected day
    const today = new Date();
    const offset = parseInt(window.currentDateKey, 10) || 0;
    const target = new Date(today);
    target.setDate(target.getDate() + offset);
    if (dateInput) dateInput.value = target.toISOString().split('T')[0];
    if (desc) desc.value = '';
    slots.forEach((s, i) => { s.classList.toggle('active', i === 0); });
  }

  if (dateInput && dateInput._updateVitalDatePicker) {
    dateInput._updateVitalDatePicker();
  }

  overlay.style.display = 'block';
  modal.style.display = 'block';
};

window.openAddMealModal = window.openCalMealModal;

window.closeCalMealModal = function() {
  const overlay = document.getElementById('calMealModalOverlay');
  const modal = document.getElementById('calMealModal');
  if (overlay) overlay.style.display = 'none';
  if (modal) modal.style.display = 'none';
  window._editingMealId = null;
};

window.closeCalendarMealModal = window.closeCalMealModal;

// Keyboard Escape listener & document click-outside safety
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    window.closeCalMealModal();
  }
});

window.deleteMealConfirm = async function(mealId) {
  const ok = await (window.showVitalConfirm ? window.showVitalConfirm({
    title: 'Supprimer ce repas',
    message: 'Voulez-vous vraiment supprimer ce repas du calendrier ?',
    icon: 'ri-delete-bin-line',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    isDanger: true
  }) : Promise.resolve(confirm('Supprimer ce repas du calendrier ?')));

  if (ok) {
    window.deleteMeal(mealId);
  }
};

window.confirmRegenerateDay = async function() {
  const ok = await (window.showVitalConfirm ? window.showVitalConfirm({
    title: 'Régénérer les aliments du jour',
    message: 'Régénérer les aliments de ce jour avec une nouvelle sélection ? (les cases cochées seront réinitialisées pour ce jour)',
    icon: 'ri-refresh-line',
    confirmText: 'Régénérer',
    cancelText: 'Annuler',
    isDanger: false
  }) : Promise.resolve(confirm('Régénérer les aliments de ce jour avec une nouvelle sélection ?')));

  if (ok) {
    window.regenerateDayContent();
  }
};

window.selectCalSlot = function(btn) {
  const parent = btn.parentElement;
  parent.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.saveManualMeal = function() {
  const dateInput = document.getElementById('calMealDate');
  const desc = document.getElementById('calMealDesc');
  const activeSlot = document.querySelector('#calMealSlots .chip-btn.active');
  
  if (!dateInput || !dateInput.value) { if (window.showToast) window.showToast('Choisis une date.', 'error'); return; }
  if (!desc || !desc.value.trim()) { if (window.showToast) window.showToast('Décris ton repas.', 'error'); return; }
  
  const slot = activeSlot ? activeSlot.dataset.slot : 'Déjeuner';
  const tone = activeSlot ? activeSlot.dataset.tone : 'midi';
  const time = activeSlot ? activeSlot.dataset.time : '12h-13h';
  const icon = activeSlot ? activeSlot.dataset.icon : '🍽️';

  if (window._editingMealId) {
    window.editMeal(window._editingMealId, {
      dateStr: dateInput.value,
      slot: slot, title: slot, tone: tone, time: time, icon: icon,
      text: desc.value.trim(), note: desc.value.trim()
    });
    window.closeCalMealModal();
    window.updateProgramRing();
    return;
  }

  const meals = window.store.get('calendar_meals', []);
  meals.push({
    id: 'meal_' + Date.now() + Math.random().toString(36).substr(2, 5),
    dateStr: dateInput.value,
    slot: slot,
    text: desc.value.trim(),
    time: time,
    tone: tone,
    icon: icon,
    title: slot,
    tags: [],
    note: desc.value.trim(),
    done: false
  });
  window.store.set('calendar_meals', meals);
  
  window.closeCalMealModal();
  
  // Switch to the day we just added to
  const today = new Date();
  today.setHours(0,0,0,0);
  const target = new Date(dateInput.value);
  target.setHours(0,0,0,0);
  const offset = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (offset >= 0) {
    window.currentDateKey = offset.toString();
  }
  
  window.renderStrip();
  window.renderDay();
  window.updateProgramRing();
};

// ═══════════════════════════════════════════════════════════════════════════
// SMART FOOD SUBSTITUTION MODAL & IN-MODAL AI ADVICE
// ═══════════════════════════════════════════════════════════════════════════

window._activeSubContext = null;
window._latestAiMealProposal = null;

window.openSubstituteModal = function(mealId, tagIdx, currentFoodName, currentFoodEmoji) {
  const existing = document.getElementById('substituteModalOverlay');
  if (existing) existing.remove();

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === mealId);
  if (!meal) return;

  tagIdx = parseInt(tagIdx) || 0;
  const currentTag = (meal.tags && meal.tags[tagIdx]) || { n: currentFoodName || 'Aliment', e: currentFoodEmoji || '🍽️' };
  const foodName = currentTag.n;
  const foodEmoji = currentTag.e;

  window._activeSubContext = {
    mealId: mealId,
    tagIdx: tagIdx,
    originalFood: foodName,
    originalEmoji: foodEmoji,
    mealTitle: meal.title || meal.slot || 'Repas',
    dateStr: meal.dateStr || '',
    note: meal.note || ''
  };

  let substitutes = [];
  if (window.DietPlanEngine && window.DietPlanEngine.getFoodSubstitutes) {
    substitutes = window.DietPlanEngine.getFoodSubstitutes(foodName);
  }

  const chipsHtml = substitutes.length > 0
    ? substitutes.map((s, idx) => `
        <button type="button" class="sub-chip ${idx === 0 ? 'selected' : ''}" onclick="window.selectSubstituteChip(this, '${s.name.replace(/'/g, "\\'")}', '${s.emoji}')" style="
          display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:20px;border:1px solid rgba(52,211,153,0.3);
          background:rgba(52,211,153,0.08);color:var(--text,#f3f6f9);cursor:pointer;font-size:0.82rem;font-weight:600;transition:all 0.2s;">
          <span>${s.emoji}</span> <span>${s.name}</span>
        </button>
      `).join('')
    : '<div style="font-size:0.82rem;color:var(--text-dim,#9aa7b8);">Saisissez un aliment ou vos restes disponibles ci-dessous.</div>';

  const defaultSelection = substitutes.length > 0 ? substitutes[0].name : '';

  const overlay = document.createElement('div');
  overlay.id = 'substituteModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';
  
  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:24px;max-width:500px;width:100%;box-shadow:var(--card-shadow);color:var(--text);position:relative;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:12px;background:var(--accent-glow);color:var(--accent);display:grid;place-items:center;font-size:1.2rem;">
            <i class="ri-loop-right-line"></i>
          </div>
          <div>
            <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--text);">Varier / Remplacer l'aliment</h3>
            <div style="font-size:0.8rem;color:var(--text-dim);">${meal.title} · ${meal.dateStr}</div>
          </div>
        </div>
        <button onclick="document.getElementById('substituteModalOverlay').remove()" style="background:var(--surface-hover);border:1px solid var(--border);color:var(--text-dim);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"><i class="ri-close-line"></i></button>
      </div>

      <!-- Current Food Display -->
      <div style="margin-bottom:16px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:0.82rem;color:var(--text-dim);">Aliment actuel du créneau :</span>
        <span style="font-weight:700;font-size:0.95rem;color:var(--accent);display:inline-flex;align-items:center;gap:6px;">
          <span>${foodEmoji}</span> <span>${foodName}</span>
        </span>
      </div>

      <!-- Suggested Substitutes -->
      <div style="margin-bottom:14px;">
        <div style="font-size:0.82rem;font-weight:700;color:var(--text-dim);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <i class="ri-sparkling-fill" style="color:var(--accent)"></i> Alternatives vitalistes 1-clic :
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;" id="subChipsContainer">
          ${chipsHtml}
        </div>
      </div>

      <!-- Custom Food Input -->
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:0.82rem;font-weight:700;color:var(--text-dim);margin-bottom:6px;">Ou saisir un aliment / envie / restes du frigo :</label>
        <input type="text" id="substituteCustomInput" value="${defaultSelection}" placeholder="Ex: Racine de bardane, Avocat et fenouil, Courge..." style="width:100%;box-sizing:border-box;background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-text);padding:12px 14px;border-radius:12px;font-size:0.92rem;outline:none;">
      </div>

      <!-- In-Modal AI Evaluation Box (Dynamically injected) -->
      <div id="aiSubResultBox" style="display:none; margin-bottom:16px; padding:14px; border-radius:14px; background:var(--accent-glow); border:1px solid var(--accent);">
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="display:flex; gap:8px;">
          <button type="button" onclick="window.applySubstitution()" style="flex:1; padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--accent),#059669);color:#ffffff;font-weight:800;font-size:0.9rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 15px var(--accent-glow);">
            <i class="ri-check-line" style="font-size:1.1rem"></i> Valider direct
          </button>
          <button type="button" id="btnAiAnalyzeSub" onclick="window.analyzeAiSubstitution()" style="flex:1.2; padding:12px;border-radius:12px;border:1px solid rgba(251,191,36,0.5);background:rgba(251,191,36,0.12);color:#d97706;font-weight:700;font-size:0.9rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;">
            <i class="ri-sparkling-fill"></i> Analyser avec l'IA
          </button>
        </div>

        <button type="button" onclick="window.askAiAboutSubstitution()" style="padding:8px;border:none;background:transparent;color:var(--text-dim);font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
          <i class="ri-chat-smile-2-line"></i> Discuter de cette recette dans le Chat ➔
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

window.selectSubstituteChip = function(btn, foodName, emoji) {
  document.querySelectorAll('#subChipsContainer .sub-chip').forEach(c => {
    c.style.background = 'var(--surface-2)';
    c.style.borderColor = 'var(--border)';
    c.style.color = 'var(--text)';
  });
  btn.style.background = 'var(--accent)';
  btn.style.borderColor = 'var(--accent)';
  btn.style.color = '#ffffff';

  const input = document.getElementById('substituteCustomInput');
  if (input) input.value = foodName;
};

window.applySubstitution = function() {
  const ctx = window._activeSubContext;
  const input = document.getElementById('substituteCustomInput');
  if (!ctx || !input) return;

  const newFoodName = input.value.trim();
  if (!newFoodName) {
    if (window.showToast) window.showToast("⚠️ Veuillez choisir ou saisir un aliment.", "error");
    return;
  }

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === ctx.mealId);
  if (!meal) return;

  let newEmoji = '🍽️';
  if (window.DietPlanEngine && window.DietPlanEngine.emojiFor) {
    newEmoji = window.DietPlanEngine.emojiFor(newFoodName);
  }

  if (!Array.isArray(meal.tags)) meal.tags = [];
  if (meal.tags[ctx.tagIdx]) {
    meal.tags[ctx.tagIdx] = { e: newEmoji, n: newFoodName };
  } else {
    meal.tags.push({ e: newEmoji, n: newFoodName });
  }

  window.store.set('calendar_meals', storedMeals);

  const overlay = document.getElementById('substituteModalOverlay');
  if (overlay) overlay.remove();

  window.renderDay();
  window.updateProgramRing();
  if (window.showToast) {
    window.showToast(`✅ "${ctx.originalFood}" remplacé par "${newFoodName}" !`, 'success');
  }
};

window.analyzeAiSubstitution = async function() {
  const ctx = window._activeSubContext;
  const input = document.getElementById('substituteCustomInput');
  const resultBox = document.getElementById('aiSubResultBox');
  const btn = document.getElementById('btnAiAnalyzeSub');
  if (!ctx || !input || !resultBox) return;

  const targetFood = input.value.trim() || ctx.originalFood;
  if (!targetFood) {
    if (window.showToast) window.showToast("Veuillez saisir un aliment à évaluer.", "info");
    return;
  }

  resultBox.style.display = 'block';
  resultBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; color:var(--accent); font-weight:600; font-size:0.85rem;">
      <i class="ri-loader-4-line ri-spin" style="font-size:1.1rem;"></i>
      <span>Le Coach Vitaliste analyse la compatibilité de "${targetFood}"...</span>
    </div>
  `;
  if (btn) btn.disabled = true;

  try {
    const prof = window.store.get('user_profile', {});
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `En tant que coach vitaliste expert (Arnold Ehret, Dr. Sebi, Dr. Morse), donne une évaluation concise en 3 points pour remplacer "${ctx.originalFood}" par "${targetFood}" lors du repas "${ctx.mealTitle}" (${ctx.dateStr}) :
1. Compatibilité vitaliste & impact émonctoires (reins, lymphe, foie, intestins).
2. Mode de préparation ou consommation conseillé.
3. Verdict : Valide ou Déconseille.
Reste très concis (3 à 4 phrases au total). Termine par une ligne JSON : {"foodName":"${targetFood}","emoji":"🌿"}`.trim(),
        profile: prof,
        language: prof.language || 'fr-CA',
        history: []
      })
    });

    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const replyText = data.text || '';

    let finalEmoji = '🌿';
    let cleanExplanation = replyText;
    const jsonMatch = replyText.match(/\{[\s\S]*"foodName"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.emoji) finalEmoji = parsed.emoji;
      } catch (e) {}
      cleanExplanation = replyText.replace(jsonMatch[0], '').trim();
    } else if (window.DietPlanEngine && window.DietPlanEngine.emojiFor) {
      finalEmoji = window.DietPlanEngine.emojiFor(targetFood);
    }

    resultBox.innerHTML = `
      <div style="font-size:0.82rem; line-height:1.5; color:var(--text); margin-bottom:12px;">
        <div style="font-weight:700; color:var(--accent); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
          <i class="ri-shield-check-line"></i> Avis du Coach Vitaliste :
        </div>
        <div>${cleanExplanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>
      </div>
      <button type="button" onclick="window.applyAiAnalyzedSubstitution('${targetFood.replace(/'/g, "\\'")}', '${finalEmoji}')" style="width:100%; padding:10px; border-radius:10px; background:var(--accent); color:#ffffff; font-weight:800; font-size:0.88rem; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 12px var(--accent-glow);">
        <i class="ri-check-line"></i> Appliquer "${finalEmoji} ${targetFood}" au calendrier
      </button>
    `;
  } catch (err) {
    console.error('AI analysis error:', err);
    resultBox.innerHTML = `
      <div style="font-size:0.82rem; color:var(--danger);">
        ⚠️ Analyse instantanée indisponible. Vous pouvez valider directement le remplacement ci-dessus.
      </div>
    `;
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.applyAiAnalyzedSubstitution = function(foodName, emoji) {
  const ctx = window._activeSubContext;
  if (!ctx) return;

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === ctx.mealId);
  if (!meal) return;

  if (!Array.isArray(meal.tags)) meal.tags = [];
  if (meal.tags[ctx.tagIdx]) {
    meal.tags[ctx.tagIdx] = { e: emoji || '🌿', n: foodName };
  } else {
    meal.tags.push({ e: emoji || '🌿', n: foodName });
  }

  window.store.set('calendar_meals', storedMeals);

  const overlay = document.getElementById('substituteModalOverlay');
  if (overlay) overlay.remove();

  window.renderDay();
  window.updateProgramRing();
  if (window.showToast) {
    window.showToast(`✅ "${ctx.originalFood}" remplacé par "${foodName}" !`, 'success');
  }
};

window.askAiAboutSubstitution = function() {
  const ctx = window._activeSubContext;
  const input = document.getElementById('substituteCustomInput');
  if (!ctx || !input) return;

  const targetFood = input.value.trim() || ctx.originalFood;
  const prompt = `Bonjour Coach Vital ! Pour mon ${ctx.mealTitle} du ${ctx.dateStr}, je souhaite remplacer "${ctx.originalFood}" par "${targetFood}". Qu'en penses-tu selon mon protocole vitaliste ? Quels sont les bénéfices et comment bien le préparer ?`;

  const overlay = document.getElementById('substituteModalOverlay');
  if (overlay) overlay.remove();

  if (window.showPage) window.showPage('chat');
  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.value = prompt;
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
      chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// WHOLE MEAL AI SUGGESTION MODAL
// ═══════════════════════════════════════════════════════════════════════════

window.openMealAiSuggestModal = function(mealId) {
  const existing = document.getElementById('mealAiModalOverlay');
  if (existing) existing.remove();

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === mealId);
  if (!meal) return;

  const currentTags = (meal.tags || []).map(t => `${t.e || '🍽️'} ${t.n || ''}`).join(', ');

  const overlay = document.createElement('div');
  overlay.id = 'mealAiModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.2s ease;';

  overlay.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:24px;max-width:520px;width:100%;box-shadow:var(--card-shadow);color:var(--text);position:relative;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:12px;background:var(--accent-glow);color:var(--accent);display:grid;place-items:center;font-size:1.2rem;">
            <i class="ri-sparkling-fill"></i>
          </div>
          <div>
            <h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--text);">Suggérer un repas avec l'IA</h3>
            <div style="font-size:0.8rem;color:var(--text-dim);">${meal.title} · ${meal.dateStr}</div>
          </div>
        </div>
        <button onclick="document.getElementById('mealAiModalOverlay').remove()" style="background:var(--surface-hover);border:1px solid var(--border);color:var(--text-dim);width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;"><i class="ri-close-line"></i></button>
      </div>

      <!-- Current Meal Summary -->
      <div style="margin-bottom:14px;padding:10px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;">
        <span style="font-size:0.78rem;color:var(--text-dim);display:block;margin-bottom:2px;">Plat actuellement prévu :</span>
        <span style="font-weight:700;font-size:0.9rem;color:var(--text);">${meal.title} : ${currentTags || 'Aucun aliment'}</span>
      </div>

      <!-- Mood & Preference Quick Pills -->
      <div style="margin-bottom:14px;">
        <div style="font-size:0.8rem;font-weight:700;color:var(--text-dim);margin-bottom:8px;">
          🌿 Choisissez une orientation ou ambiance :
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;" id="mealAiPills">
          <button type="button" class="chip-btn" onclick="window.selectMealAiPill(this, 'Plat crémeux et rassasiant')" style="background:var(--accent-glow); border:1px solid var(--accent); color:var(--accent); border-radius:16px; padding:6px 12px; font-size:0.8rem; cursor:pointer;">🥑 Crémeux & Doux</button>
          <button type="button" class="chip-btn" onclick="window.selectMealAiPill(this, 'Plat chaud ou cuit à la vapeur douce')" style="background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:16px; padding:6px 12px; font-size:0.8rem; cursor:pointer;">🍲 Chaud / Vapeur</button>
          <button type="button" class="chip-btn" onclick="window.selectMealAiPill(this, 'Assiette crue, croquante et très vivante')" style="background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:16px; padding:6px 12px; font-size:0.8rem; cursor:pointer;">🥗 Cru & Croquant</button>
          <button type="button" class="chip-btn" onclick="window.selectMealAiPill(this, 'Repas très léger détoxifiant et hydratant')" style="background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:16px; padding:6px 12px; font-size:0.8rem; cursor:pointer;">🥣 Détox & Léger</button>
          <button type="button" class="chip-btn" onclick="window.selectMealAiPill(this, 'Recette optimisée avec les restes du frigo')" style="background:var(--surface-2); border:1px solid var(--border); color:var(--text); border-radius:16px; padding:6px 12px; font-size:0.8rem; cursor:pointer;">🧑‍🍳 Selon mon frigo</button>
        </div>
      </div>

      <!-- Freeform prompt / fridge items -->
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-dim);margin-bottom:6px;">
          Vos envies précises ou ingrédients disponibles (optionnel) :
        </label>
        <textarea id="mealAiCustomPrompt" rows="2" placeholder="Ex: J'ai des courgettes, un avocat et du citron. Pas de salade verte." style="width:100%;box-sizing:border-box;background:var(--input-bg);border:1px solid var(--input-border);color:var(--input-text);padding:10px 12px;border-radius:12px;font-size:0.88rem;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>

      <!-- Generated Suggestion Preview Card -->
      <div id="mealAiSuggestionResult" style="display:none; margin-bottom:16px; padding:14px; border-radius:14px; background:var(--accent-glow); border:1px solid var(--accent);">
      </div>

      <!-- Actions -->
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button type="button" id="btnGenerateMealAi" onclick="window.generateMealAiProposal('${meal.id}')" style="padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,var(--accent),#059669);color:#ffffff;font-weight:800;font-size:0.92rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 15px var(--accent-glow);">
          <i class="ri-sparkling-fill"></i> Générer la proposition du Coach IA
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

window.selectMealAiPill = function(btn, promptText) {
  document.querySelectorAll('#mealAiPills .chip-btn').forEach(b => {
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.borderColor = 'rgba(255,255,255,0.1)';
    b.style.color = 'var(--text)';
  });
  btn.style.background = 'rgba(52,211,153,0.15)';
  btn.style.borderColor = '#34d399';
  btn.style.color = '#34d399';

  const ta = document.getElementById('mealAiCustomPrompt');
  if (ta) ta.value = promptText;
};

window.generateMealAiProposal = async function(mealId) {
  const ta = document.getElementById('mealAiCustomPrompt');
  const resBox = document.getElementById('mealAiSuggestionResult');
  const btn = document.getElementById('btnGenerateMealAi');
  if (!resBox) return;

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === mealId);
  if (!meal) return;

  const userNotes = ta ? ta.value.trim() : '';

  resBox.style.display = 'block';
  resBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; color:#34d399; font-weight:600; font-size:0.85rem;">
      <i class="ri-loader-4-line ri-spin" style="font-size:1.1rem;"></i>
      <span>Création d'un plat vitaliste sur-mesure...</span>
    </div>
  `;
  if (btn) btn.disabled = true;

  try {
    const prof = window.store.get('user_profile', {});
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `En tant que chef & coach vitaliste (Ehret, Sebi, Morse), propose UN SEUL plat vitaliste équilibré pour le créneau "${meal.title}" (${meal.dateStr}).
Préférences / Contraintes : "${userNotes || 'Plat digeste et revitalisant'}".
Retourne STRICTEMENT et UNIQUEMENT un objet JSON sous cette forme :
{
  "title": "Nom appétissant du plat",
  "tags": [
    { "e": "🥑", "n": "Avocat Hass" },
    { "e": "🥒", "n": "Courgette vapeur" },
    { "e": "🌿", "n": "Origan" }
  ],
  "note": "Brève astuce de préparation (1 phrase)."
}`.trim(),
        profile: prof,
        language: prof.language || 'fr-CA',
        history: []
      })
    });

    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const replyText = data.text || '';

    let mealData = null;
    const jsonMatch = replyText.match(/\{[\s\S]*"title"[\s\S]*"tags"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        mealData = JSON.parse(jsonMatch[0]);
      } catch (e) {}
    }

    if (!mealData) {
      mealData = {
        title: userNotes ? `Assiette vitaliste personnalisée` : 'Plat vitaliste de saison',
        tags: [
          { e: '🥑', n: 'Avocat créole' },
          { e: '🥒', n: 'Courgette crue' },
          { e: '🍋', n: 'Jus de citron vert' }
        ],
        note: 'Assaisonnement doux à l\'huile d\'olive et herbes fraîches.'
      };
    }

    window._latestAiMealProposal = { mealId: mealId, ...mealData };

    const tagsHtml = (mealData.tags || []).map(t => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);padding:4px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;color:#fff;">${t.e || '🍽️'} ${t.n || ''}</span>`).join(' ');

    resBox.innerHTML = `
      <div style="margin-bottom:12px;">
        <div style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#34d399; margin-bottom:4px;">✨ Proposition sur-mesure</div>
        <div style="font-weight:800; font-size:1.05rem; color:#fff; margin-bottom:8px;">${mealData.title}</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">${tagsHtml}</div>
        <div style="font-size:0.8rem; color:var(--text-dim,#9aa7b8); font-style:italic;">${mealData.note || ''}</div>
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" onclick="window.applyAiMealProposal()" style="flex:1.2; padding:10px 14px; border-radius:10px; background:#34d399; color:#000; font-weight:800; font-size:0.88rem; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 12px rgba(52,211,153,0.3);">
          <i class="ri-check-line"></i> Appliquer à ce repas
        </button>
        <button type="button" onclick="window.generateMealAiProposal('${mealId}')" style="flex:1; padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; font-weight:600; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
          <i class="ri-refresh-line"></i> Autre idée
        </button>
      </div>
    `;
  } catch (err) {
    console.error('Meal AI error:', err);
    resBox.innerHTML = `<div style="font-size:0.82rem; color:#f87171;">⚠️ Impossible de générer la proposition. Veuillez réessayer.</div>`;
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.applyAiMealProposal = function() {
  const proposal = window._latestAiMealProposal;
  if (!proposal || !proposal.mealId) return;

  const storedMeals = window.store.get('calendar_meals', []);
  const meal = storedMeals.find(m => m.id === proposal.mealId);
  if (!meal) return;

  if (proposal.tags && proposal.tags.length > 0) {
    meal.tags = proposal.tags;
  }
  if (proposal.note) {
    meal.note = proposal.note;
  }
  if (proposal.title) {
    meal.title = meal.slot || proposal.title;
  }

  window.store.set('calendar_meals', storedMeals);

  const overlay = document.getElementById('mealAiModalOverlay');
  if (overlay) overlay.remove();

  window.renderDay();
  window.updateProgramRing();
  if (window.showToast) {
    window.showToast(`✅ Repas mis à jour avec le plat sur-mesure !`, 'success');
  }
};

