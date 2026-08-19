// ═══════════════════════════════════════════════════════════════════════════════
// VITALTRACK CENTRALIZED INTERNATIONALIZATION & TAXONOMY ENGINE (i18n / l10n)
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'vitaltrack_lang';

export const SUPPORTED_LANGS = ['fr', 'en'];
let currentLang = localStorage.getItem(STORAGE_KEY) || 'fr';
if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = 'fr';

const listeners = new Set();

// ═══════ CENTRALIZED TAXONOMIES ═══════
export const TAXONOMY = {
  biochemicalStatus: {
    ELECTRIC: {
      id: 'ELECTRIC',
      fr: { name: 'Électrique', badge: '⚡ Électrique', desc: 'Sauvage, non hybridé, alcalinisant, haute vitalité biophotonique' },
      en: { name: 'Electric', badge: '⚡ Electric', desc: 'Wild, non-hybrid, highly alkalizing, rich in biophotons' }
    },
    LIVING: {
      id: 'LIVING',
      fr: { name: 'Vivant & Cru', badge: '🌱 Vivant', desc: 'Cru, frais, riche en eau vivante et enzymes digestives' },
      en: { name: 'Living & Raw', badge: '🌱 Living', desc: 'Raw, fresh, rich in structured water and living enzymes' }
    },
    TRANSITION: {
      id: 'TRANSITION',
      fr: { name: 'Transition douce', badge: '🌿 Transition', desc: 'Faible en mucus, cuit doux à la vapeur, digestion légère' },
      en: { name: 'Mild Transition', badge: '🌿 Transition', desc: 'Low-mucus, gently steamed, easy on the digestive tract' }
    },
    MUCOID: {
      id: 'MUCOID',
      fr: { name: 'Mucogène / Acidifiant', badge: '⚠️ Mucogène', desc: 'Formateur de mucus intestinal, engorge la lymphe et les reins' },
      en: { name: 'Mucoid / Acidifying', badge: '⚠️ Mucoid', desc: 'Mucus-forming, clogs lymphatic channels and kidneys' }
    },
    TOXIC: {
      id: 'TOXIC',
      fr: { name: 'Ultra-transformé / Dénaturé', badge: '⛔ Dénaturé', desc: 'Additifs, huiles hydrogénées, raffinage industriel agressif' },
      en: { name: 'Ultra-processed / Toxic', badge: '⛔ Toxic', desc: 'Additives, trans fats, aggressive industrial refining' }
    }
  },

  emunctories: {
    KIDNEYS: {
      id: 'KIDNEYS',
      fr: { name: 'Reins & Vessie', action: 'Filtration acide & élimination des urates' },
      en: { name: 'Kidneys & Bladder', action: 'Acid filtration & urate elimination' }
    },
    LIVER: {
      id: 'LIVER',
      fr: { name: 'Foie & Vésicule', action: 'Détoxification métabolique & sels biliaires' },
      en: { name: 'Liver & Gallbladder', action: 'Metabolic detox & bile salts flow' }
    },
    LYMPH: {
      id: 'LYMPH',
      fr: { name: 'Système Lymphatique', action: 'Drainage interstitiel & assainissement cellulaire' },
      en: { name: 'Lymphatic System', action: 'Interstitial drainage & cellular cleansing' }
    },
    BOWELS: {
      id: 'BOWELS',
      fr: { name: 'Intestins & Côlon', action: 'Péristaltisme, expulsion des déchets incrustés' },
      en: { name: 'Intestines & Colon', action: 'Peristalsis, mucoid plaque expulsion' }
    },
    SKIN_LUNGS: {
      id: 'SKIN_LUNGS',
      fr: { name: 'Peau & Poumons', action: 'Transpiration, expectoration & élimination volatile' },
      en: { name: 'Skin & Lungs', action: 'Sweat, expectoration & volatile gas release' }
    }
  },

  fastingProtocols: {
    intermittent: {
      fr: { name: 'Intermittent 16:8', desc: '16h de jeûne quotidien / 8h de repas' },
      en: { name: 'Intermittent 16:8', desc: '16h daily fasting / 8h eating window' }
    },
    warrior: {
      fr: { name: 'Warrior 20:4', desc: '20h de jeûne / 4h de repas le soir' },
      en: { name: 'Warrior 20:4', desc: '20h fasting / 4h evening meal window' }
    },
    waterFast: {
      fr: { name: 'Hydrique 24h', desc: 'Eau de source pure avec ou sans citron' },
      en: { name: '24h Water Fast', desc: 'Pure spring water with or without lemon' }
    },
    juiceFast: {
      fr: { name: 'Cure de Jus 3j', desc: 'Jus de légumes verts et fruits à l\'extracteur' },
      en: { name: '3-Day Juice Cleanse', desc: 'Fresh cold-pressed green and fruit juices' }
    },
    fruitFast: {
      fr: { name: 'Jeûne aux Fruits 48h', desc: 'Mono-diète ou fruits aqueux astringents' },
      en: { name: '48h Fruit Feast', desc: 'Mono-fruit or astringent aqueous fruits' }
    },
    grapeCure: {
      fr: { name: 'Cure de Raisins', desc: '3 jours de raisins noirs (Dr. Morse)' },
      en: { name: 'Grape Cure', desc: '3 days of organic black seeded grapes' }
    },
    drySunFast: {
      fr: { name: 'Jeûne Sec 16h', desc: 'Abstention complète eau & nourriture au repos' },
      en: { name: '16h Dry Fast', desc: 'Zero water or food during rest period' }
    },
    ramadan: {
      fr: { name: 'Jeûne de l\'aube', desc: 'Abstention du lever au coucher du soleil' },
      en: { name: 'Dawn to Sunset', desc: 'Fasting from dawn to dusk' }
    }
  }
};

// ═══════ UI DICTIONARY ═══════
export const TRANSLATIONS = {
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      fasting: 'Jeûne',
      materiaMedica: 'Pharmacopée',
      scanner: 'Scanner Vital',
      breathing: 'Respiration',
      chat: 'Coach IA',
      calendar: 'Calendrier'
    },
    fasting: {
      pageTitle: 'Jeûne & Physiologie Cellulaire',
      pageSubtitle: 'Protocoles ancestraux, minuteur cellulaire et sagesse d\'Arnold Ehret & Dr. Morse',
      programsTitle: 'Programmes de Jeûne',
      programsSub: 'Sélectionnez un protocole validé pour préremplir le minuteur',
      timerTitle: 'Minuteur Vital',
      timerReady: 'PRÊT',
      timerActive: 'EN COURS',
      timerCompleted: 'TERMINÉ',
      timerGoal: 'Objectif',
      typeLabel: 'Type de protocole',
      durationLabel: 'Durée (heures)',
      startBtn: 'Démarrer le jeûne',
      stopBtn: 'Terminer le jeûne',
      safetyWarning: 'Attention : Les jeûnes de plus de 24h nécessitent une préparation préalable et un suivi adapté.',
      masterclassTitle: 'Masterclass : Rational Fasting',
      masterclassSub: 'La méthode scientifique d\'Arnold Ehret pour éliminer le mucus sans crise d\'auto-intoxication',
      expertsTitle: 'Conseils & Sagesse des Maîtres',
      expertsSub: 'Directives d\'Arnold Ehret, Dr. Robert Morse, Dr. Sebi et Wim Hof',
      historyTitle: 'Historique & Statistiques',
      totalSessions: 'Sessions totales',
      cumulatedHours: 'Heures cumulées',
      longestFast: 'Plus long',
      completionRate: 'Taux de complétion',
      noHistory: 'Aucune session de jeûne enregistrée pour le moment.'
    },
    materia: {
      pageTitle: 'Pharmacopée Raintree & Plantes Amazoniennes',
      pageSubtitle: 'Monographies botaniques, phytochimie et indications cliniques du Dr. Leslie Taylor',
      searchPlaceholder: 'Rechercher une plante, symptôme, organe (ex: calculs, reins, foie, candida)...',
      allCategory: 'Toutes les plantes',
      kidneysCategory: 'Reins & Lithiases',
      liverCategory: 'Foie & Détox',
      gutCategory: 'Intestin & Muqueuses',
      immunityCategory: 'Immunité & Antiviral',
      lungsCategory: 'Poumons & Mucus',
      vitalToneCategory: 'Vitalité & Énergie',
      viewMonograph: 'Consulter la fiche & posologie',
      expandMonograph: '📜 Dérouler la monographie scientifique & études Raintree (Dr. Leslie Taylor)',
      collapseMonograph: '🔼 Replier la monographie',
      quickBenefits: 'Bénéfices & Cibles Cliniques Prioritaires',
      posologyTitle: 'Posologie & Préparation Usuelle (Dr. Leslie Taylor)',
      contraindicationsTitle: 'Précautions & Contre-indications',
      vitalistNoteTitle: 'Note Vitaliste & Drainage Émonctoriel',
      synergiesTitle: 'Synergies Botaniques Recommandées',
      askAIBtn: 'Poser une question au Coach IA sur cette plante'
    },
    common: {
      close: 'Fermer',
      back: 'Retour',
      apply: 'Appliquer',
      save: 'Enregistrer',
      search: 'Rechercher',
      cancel: 'Annuler',
      loading: 'Chargement...',
      langName: 'Français'
    }
  },

  en: {
    nav: {
      dashboard: 'Dashboard',
      fasting: 'Fasting',
      materiaMedica: 'Pharmacopoeia',
      scanner: 'Vital Scanner',
      breathing: 'Breathing',
      chat: 'AI Coach',
      calendar: 'Calendar'
    },
    fasting: {
      pageTitle: 'Fasting & Cellular Physiology',
      pageSubtitle: 'Ancestral protocols, cellular timer, and wisdom from Arnold Ehret & Dr. Morse',
      programsTitle: 'Fasting Protocols',
      programsSub: 'Select a validated protocol to automatically preset the timer',
      timerTitle: 'Vitality Fasting Timer',
      timerReady: 'READY',
      timerActive: 'ACTIVE',
      timerCompleted: 'COMPLETED',
      timerGoal: 'Goal',
      typeLabel: 'Protocol type',
      durationLabel: 'Duration (hours)',
      startBtn: 'Start Fasting',
      stopBtn: 'End Fasting Session',
      safetyWarning: 'Caution: Extended fasts over 24h require thorough transition and adapted supervision.',
      masterclassTitle: 'Masterclass: Rational Fasting',
      masterclassSub: 'Arnold Ehret\'s scientific method to eliminate mucus without auto-intoxication crises',
      expertsTitle: 'Wisdom & Expert Guidelines',
      expertsSub: 'Directives from Arnold Ehret, Dr. Robert Morse, Dr. Sebi, and Wim Hof',
      historyTitle: 'History & Analytics',
      totalSessions: 'Total Sessions',
      cumulatedHours: 'Total Hours',
      longestFast: 'Longest Fast',
      completionRate: 'Completion Rate',
      noHistory: 'No recorded fasting sessions yet.'
    },
    materia: {
      pageTitle: 'Raintree Pharmacopoeia & Amazonian Herbs',
      pageSubtitle: 'Botanical monographs, phytochemistry, and clinical targets from Dr. Leslie Taylor',
      searchPlaceholder: 'Search by plant name, symptom, target organ (e.g. stones, kidneys, liver, candida)...',
      allCategory: 'All Botanicals',
      kidneysCategory: 'Kidneys & Lithiasis',
      liverCategory: 'Liver & Gallbladder',
      gutCategory: 'Gut & Mucosa',
      immunityCategory: 'Immunity & Antiviral',
      lungsCategory: 'Lungs & Mucus',
      vitalToneCategory: 'Vital Tone & Energy',
      viewMonograph: 'View Plant Profile & Posology',
      expandMonograph: '📜 Unfold Full Scientific Monograph & Raintree Studies (Dr. Leslie Taylor)',
      collapseMonograph: '🔼 Collapse Monograph',
      quickBenefits: 'Primary Clinical Benefits & Vital Targets',
      posologyTitle: 'Recommended Posology & Preparation (Dr. Leslie Taylor)',
      contraindicationsTitle: 'Precautions & Contraindications',
      vitalistNoteTitle: 'Vitalist Note & Emunctory Drainage',
      synergiesTitle: 'Recommended Botanical Synergies',
      askAIBtn: 'Ask AI Coach about this botanical'
    },
    common: {
      close: 'Close',
      back: 'Back',
      apply: 'Apply',
      save: 'Save',
      search: 'Search',
      cancel: 'Cancel',
      loading: 'Loading...',
      langName: 'English'
    }
  }
};

// ═══════ HELPER FUNCTIONS ═══════
export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach(fn => {
    try { fn(lang); } catch (e) { console.error(e); }
  });
  updateDOMTranslations();
}

export function toggleLanguage() {
  const next = currentLang === 'fr' ? 'en' : 'fr';
  setLanguage(next);
  return next;
}

export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function t(keyPath, params = {}, fallback = '') {
  const parts = keyPath.split('.');
  let current = TRANSLATIONS[currentLang];
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to FR if key missing in EN
      let fb = TRANSLATIONS.fr;
      for (const p of parts) {
        if (fb && typeof fb === 'object' && p in fb) fb = fb[p];
        else { fb = null; break; }
      }
      current = fb !== null ? fb : (fallback || keyPath);
      break;
    }
  }

  if (typeof current !== 'string') return fallback || keyPath;

  let result = current;
  for (const [paramKey, paramVal] of Object.entries(params)) {
    result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
  }
  return result;
}

export function getTaxonomyStatus(statusKey) {
  const item = TAXONOMY.biochemicalStatus[statusKey];
  if (!item) return null;
  return item[currentLang] || item.fr;
}

export function getTaxonomyEmunctory(emunctoryKey) {
  const item = TAXONOMY.emunctories[emunctoryKey];
  if (!item) return null;
  return item[currentLang] || item.fr;
}

export function updateDOMTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('placeholder', translated);
      }
    }
  });

  // Update language toggle button label if present
  const langToggleBtn = document.getElementById('globalLangToggleBtn');
  if (langToggleBtn) {
    langToggleBtn.innerHTML = currentLang === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN';
    langToggleBtn.setAttribute('title', currentLang === 'fr' ? 'Passer en Anglais' : 'Switch to French');
  }
}

// Global exposure for non-module handlers
if (typeof window !== 'undefined') {
  window.vitalTrackI18n = {
    getLanguage,
    setLanguage,
    toggleLanguage,
    onLanguageChange,
    t,
    TAXONOMY
  };
}
