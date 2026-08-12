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
      meal.tags.forEach(function(t){ html += "<span class='meal-tag'>"+t.e+" "+t.n+"</span>"; });
    }
    html += "</span>";
    
    html += "<span class='meal-note'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6'><circle cx='10' cy='10' r='7'/><line x1='10' y1='9' x2='10' y2='14'/><circle cx='10' cy='6.5' r='.6' fill='currentColor'/></svg>"+meal.note+"</span>";
    html += "</span></button>";
    html += "<span class='meal-actions'>";
    html += "<button class='meal-action-btn' title='Modifier' onclick='event.stopPropagation();window.openAddMealModal(\""+meal.id+"\")'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M13.5 3.5l3 3L7 16l-4 1 1-4z'/></svg></button>";
    html += "<button class='meal-action-btn danger' title='Supprimer' onclick='event.stopPropagation();window.deleteMealConfirm(\""+meal.id+"\")'><svg class='icon' viewBox='0 0 20 20' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'><path d='M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10'/></svg></button>";
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

  var progJourChip = document.getElementById("progJourChip");
  if (progJourChip) {
    if (meta) {
      var start = new Date(meta.startDateStr);
      var current = new Date(new Date().setHours(0,0,0,0));
      var offsetDays = Math.round((current - start) / 86400000);
      var jourIndex = Math.min(meta.numDays, Math.max(1, offsetDays + 1));
      progJourChip.textContent = "Jour " + jourIndex + "/" + meta.numDays;
    } else {
      progJourChip.textContent = "Aucun plan actif";
    }
  }
}

window.clearCalendar = function() {
  if (confirm("Voulez-vous vraiment arrêter votre programme et effacer le calendrier ?")) {
    window.store.set('calendar_meals', []);
    window.store.set('active_plan_meta', null);
    window.currentDateKey = "0";
    window.renderStrip();
    window.renderDay();
    window.updateProgramRing();
  }
}

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

window.deleteMealConfirm = function(mealId) {
  if (confirm('Supprimer ce repas du calendrier ?')) {
    window.deleteMeal(mealId);
  }
};

window.confirmRegenerateDay = function() {
  if (confirm('Régénérer les aliments de ce jour avec une nouvelle sélection ? (les cases cochées seront réinitialisées pour ce jour)')) {
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
  
  if (!dateInput || !dateInput.value) { alert('Choisis une date.'); return; }
  if (!desc || !desc.value.trim()) { alert('Décris ton repas.'); return; }
  
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
