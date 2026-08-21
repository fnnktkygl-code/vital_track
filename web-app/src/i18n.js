// ═══════════════════════════════════════════════════════════════════════════════
// VITALTRACK CENTRALIZED INTERNATIONALIZATION & TAXONOMY ENGINE (i18n / l10n)
// ═══════════════════════════════════════════════════════════════════════════════

import { SUPPORTED_LANGS, LANG_CONFIG, TRANSLATIONS, TAXONOMY } from './locales/index.js';

export { SUPPORTED_LANGS, LANG_CONFIG, TRANSLATIONS, TAXONOMY };

const STORAGE_KEY = 'vitaltrack_lang';

let currentLang = 'fr';
if (typeof localStorage !== 'undefined') {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LANGS.includes(saved)) {
    currentLang = saved;
  } else {
    localStorage.setItem(STORAGE_KEY, 'fr');
  }
}

const listeners = new Set();

// ═══════ GETTERS & SETTERS ═══════
export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang.startsWith('fr') ? 'fr' : lang;
  }
  listeners.forEach(fn => {
    try { fn(lang); } catch (e) { console.error('i18n listener error:', e); }
  });
  updateDOMTranslations();
}

export function toggleLanguage() {
  const order = ['fr', 'en', 'es', 'fr-CA'];
  const nextIdx = (order.indexOf(currentLang) + 1) % order.length;
  const next = order[nextIdx];
  setLanguage(next);
  return next;
}

export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// ═══════ TRANSLATION RESOLVER (t) ═══════
export function t(keyPath, params = {}, fallback = '') {
  if (!keyPath || typeof keyPath !== 'string') return fallback || '';

  const parts = keyPath.split('.');
  let dict = TRANSLATIONS[currentLang];
  let val = dict;

  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      val = null;
      break;
    }
  }

  // Fallback cascade: currentLang -> fr -> en -> fallback -> keyPath
  if (typeof val !== 'string') {
    let fb = TRANSLATIONS.fr;
    for (const p of parts) {
      if (fb && typeof fb === 'object' && p in fb) {
        fb = fb[p];
      } else {
        fb = null;
        break;
      }
    }
    if (typeof fb === 'string') {
      val = fb;
    } else {
      let fbEn = TRANSLATIONS.en;
      for (const p of parts) {
        if (fbEn && typeof fbEn === 'object' && p in fbEn) {
          fbEn = fbEn[p];
        } else {
          fbEn = null;
          break;
        }
      }
      val = typeof fbEn === 'string' ? fbEn : (fallback || keyPath);
    }
  }

  if (typeof val !== 'string') return fallback || keyPath;

  // Parameter interpolation: {name}, {count}, etc.
  let result = val;
  if (params && typeof params === 'object') {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramVal));
    }
  }
  return result;
}

// ═══════ CIRCADIAN & TAXONOMY HELPERS ═══════
export function getCircadianGreeting(lang = currentLang) {
  const hour = new Date().getHours();
  if (lang === 'fr-CA') {
    if (hour >= 5 && hour < 12) return 'Bon matin';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }
  if (lang === 'fr') {
    if (hour >= 5 && hour < 18) return 'Bonjour';
    return 'Bonsoir';
  }
  if (lang === 'en') {
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
  if (lang === 'es') {
    if (hour >= 5 && hour < 12) return 'Buenos días';
    if (hour >= 12 && hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
  return 'Bonjour';
}

export function getTaxonomyStatus(statusKey, lang = currentLang) {
  const item = TAXONOMY.biochemicalStatus[statusKey];
  if (!item) return null;
  return item[lang] || item.fr;
}

export function getTaxonomyEmunctory(emunctoryKey, lang = currentLang) {
  const item = TAXONOMY.emunctories[emunctoryKey];
  if (!item) return null;
  return item[lang] || item.fr;
}

export function getTaxonomyProtocol(protocolKey, lang = currentLang) {
  const item = TAXONOMY.fastingProtocols[protocolKey];
  if (!item) return null;
  return item[lang] || item.fr;
}

// ═══════ DOM SCANNER & LOCALIZATION UPDATER ═══════
export function updateDOMTranslations() {
  if (typeof document === 'undefined') return;

  // 1. Text & HTML content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.innerHTML = translated;
      }
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('placeholder', translated);
      }
    }
  });

  // 3. Titles / Tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('title', translated);
      }
    }
  });

  // 4. Aria labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('aria-label', translated);
      }
    }
  });

  // 5. Input values / Submit buttons
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        el.setAttribute('value', translated);
      }
    }
  });

  // 6. Language selector buttons in header & menus
  const cfg = LANG_CONFIG[currentLang] || LANG_CONFIG.fr;
  document.querySelectorAll('.lang-toggle-btn').forEach(btn => {
    btn.innerHTML = `${cfg.flag} <span style="font-weight:700;">${cfg.short}</span>`;
    btn.setAttribute('title', `${cfg.name} (${t('header.langToggleTitle')})`);
  });

  const langSelect = document.getElementById('globalLangSelect');
  if (langSelect && langSelect.value !== currentLang) {
    langSelect.value = currentLang;
  }
}

// ═══════ GLOBAL EXPOSURE FOR SPA & TEMPLATES ═══════
if (typeof window !== 'undefined') {
  window.vitalTrackI18n = {
    SUPPORTED_LANGS,
    LANG_CONFIG,
    TRANSLATIONS,
    TAXONOMY,
    getLanguage,
    setLanguage,
    toggleLanguage,
    onLanguageChange,
    getCircadianGreeting,
    getTaxonomyStatus,
    getTaxonomyEmunctory,
    getTaxonomyProtocol,
    updateDOMTranslations,
    t
  };
  window.t = t;
  window.setLanguage = setLanguage;
  window.getCircadianGreeting = getCircadianGreeting;
}
