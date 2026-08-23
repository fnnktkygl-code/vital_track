/**
 * mascot-nudges.js — Moteur de Micro-Nudges Contextuels & Circadiens
 * Compagnonnage bienveillant, non-intrusif et connecté à la mémoire de VitalTrack
 */

import { Pigeon } from './mascot.js';

class PigeonNudgeEngine {
  constructor() {
    this.container = null;
    this.toastEl = null;
    this.miniCanvas = null;
    this.miniPigeon = null;
    this.hideTimeout = null;
    this.lastNudgeTime = 0;
    this.cooldownMs = 4 * 60 * 1000; // 4 minutes minimum entre 2 nudges spontanés
    this.preference = 'active'; // 'active' | 'zen' | 'quiet'
    this._initPreferences();
  }

  _initPreferences() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('vital_mascot_pref');
      if (saved) this.preference = saved;
    }
  }

  setPreference(pref) {
    this.preference = pref;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vital_mascot_pref', pref);
    }
  }

  init() {
    if (typeof document === 'undefined') return;
    this.container = document.getElementById('appToastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'appToastContainer';
      this.container.className = 'app-toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Déclenche un micro-nudge discret
   * @param {Object} options { mood, badge, title, message, force }
   */
  triggerNudge({ mood = 'idle', badge = '🕊️ Conseil', title = '', message = '', force = false }) {
    if (this.preference === 'quiet') return;
    if (!force && this.preference === 'zen') return;

    const now = Date.now();
    if (!force && (now - this.lastNudgeTime) < this.cooldownMs) {
      return; // Respect strict du cooldown anti-spam
    }
    this.lastNudgeTime = now;

    this.init();
    if (!this.container) return;

    // Limiter le nombre de notifications simultanées pour éviter l'encombrement
    const existing = this.container.querySelectorAll('.app-toast, .pigeon-nudge-toast');
    if (existing.length >= 3) {
      const oldest = existing[0];
      oldest.classList.add('toast-hiding');
      setTimeout(() => { if (oldest.parentNode) oldest.remove(); }, 250);
    }

    const toastId = 'nudge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const toast = document.createElement('div');
    toast.className = 'pigeon-nudge-toast';
    toast.id = toastId;

    toast.innerHTML = `
      <div class="pigeon-nudge-avatar-wrap" onclick="if(window.triggerMascotInPlaceReaction) window.triggerMascotInPlaceReaction();" title="Vital Mascotte">
        <canvas class="mini-nudge-canvas" width="56" height="70"></canvas>
      </div>
      <div class="pigeon-nudge-content">
        <div class="pigeon-nudge-header">
          <span class="pigeon-nudge-badge">${badge}</span>
          <button type="button" class="pigeon-nudge-close" onclick="window.pigeonNudges.dismissElement(this.closest('.pigeon-nudge-toast'))" title="Fermer">&times;</button>
        </div>
        ${title ? `<div class="pigeon-nudge-title">${title}</div>` : ''}
        <div class="pigeon-nudge-text">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);

    const canvas = toast.querySelector('.mini-nudge-canvas');
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 56 * dpr;
      canvas.height = 70 * dpr;
      canvas.style.width = '56px';
      canvas.style.height = '70px';
      const miniPigeon = new Pigeon(canvas);
      miniPigeon.setMood(mood);
      miniPigeon.draw(0.5);
    }

    // Animation d'entrée
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    let dismissTimer = setTimeout(() => {
      this.dismissElement(toast);
    }, 7000);

    // Pause auto-dismiss on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(dismissTimer);
    });
    toast.addEventListener('mouseleave', () => {
      dismissTimer = setTimeout(() => {
        this.dismissElement(toast);
      }, 3000);
    });
  }

  dismissElement(toastEl) {
    if (!toastEl) return;
    toastEl.classList.remove('visible');
    toastEl.classList.add('toast-hiding');
    setTimeout(() => {
      if (toastEl.parentNode) toastEl.remove();
    }, 350);
  }

  dismiss() {
    if (!this.container) return;
    const toasts = this.container.querySelectorAll('.pigeon-nudge-toast');
    toasts.forEach(t => this.dismissElement(t));
  }

  /**
   * Évalue le contexte circadien (Ehret / Shelton)
   */
  evaluateCircadian() {
    const lang = typeof window !== 'undefined' && window.vitalTrackI18n ? window.vitalTrackI18n.getLanguage() : 'fr';
    const hour = new Date().getHours();
    
    const messages = {
      fr: {
        elimBadge: '🍋 Cycle d\'Élimination',
        elimTitle: 'Phase de Nettoyage Matinal',
        elimMsg: 'Tes émonctoires éliminent activement. Hydrate-toi avec de l\'eau tiède citronnée ou une infusion !',
        apprBadge: '🍉 Cycle d\'Appropriation',
        apprTitle: 'Fenêtre Nutritionnelle',
        apprMsg: 'Priorité aux aliments vivants, fruits mûrs gorgés d\'eau structurée et légumes riches en minéraux.',
        assimBadge: '🌙 Cycle d\'Assimilation',
        assimTitle: 'Régénération Cellulaire',
        assimMsg: 'Repos physiologique profond. C\'est l\'heure de l\'autolyse nocturne des toxines.'
      },
      'fr-CA': {
        elimBadge: '🍋 Cycle d\'Élimination',
        elimTitle: 'Phase de Nettoyage Matinal',
        elimMsg: 'Tes émonctoires éliminent activement. Hydrate-toi avec de l\'eau tiède citronnée ou de la sève d\'érable pure !',
        apprBadge: '🍉 Cycle d\'Appropriation',
        apprTitle: 'Fenêtre Nutritionnelle (Dîner & Souper)',
        apprMsg: 'Priorité aux aliments vivants, bleuets sauvages, courges et pousses fraîches boréales.',
        assimBadge: '🌙 Cycle d\'Assimilation',
        assimTitle: 'Régénération Cellulaire',
        assimMsg: 'Repos physiologique complet. C\'est l\'heure de l\'autolyse nocturne régénératrice.'
      },
      en: {
        elimBadge: '🍋 Elimination Cycle',
        elimTitle: 'Morning Cleansing Phase',
        elimMsg: 'Your emunctories are actively clearing acids. Hydrate with warm lemon water or herbal tea!',
        apprBadge: '🍉 Appropriation Cycle',
        apprTitle: 'Active Nutrition Window',
        apprMsg: 'Prioritize living foods, ripe astringent fruits rich in structured water, and mineral-dense greens.',
        assimBadge: '🌙 Assimilation Cycle',
        assimTitle: 'Cellular Regeneration',
        assimMsg: 'Deep physiological rest. Time for nocturnal autolysis and tissue repair.'
      },
      es: {
        elimBadge: '🍋 Ciclo de Eliminación',
        elimTitle: 'Fase de Limpieza Matutina',
        elimMsg: 'Tus emuntorios están eliminando ácidos activamente. ¡Hidrátate con agua tibia con limón o infusión!',
        apprBadge: '🍉 Ciclo de Apropiación',
        apprTitle: 'Ventana Nutricional',
        apprMsg: 'Prioridad a alimentos vivos, frutas maduras con agua estructurada y hojas verdes minerales.',
        assimBadge: '🌙 Ciclo de Asimilación',
        assimTitle: 'Regeneración Celular',
        assimMsg: 'Reposo fisiológico profundo. Tiempo de autólisis nocturna y reparación tisular.'
      }
    };

    const m = messages[lang] || messages.fr;

    if (hour >= 4 && hour < 12) {
      this.triggerNudge({
        mood: 'proud',
        badge: m.elimBadge,
        title: m.elimTitle,
        message: m.elimMsg
      });
    } else if (hour >= 12 && hour < 20) {
      this.triggerNudge({
        mood: 'idle',
        badge: m.apprBadge,
        title: m.apprTitle,
        message: m.apprMsg
      });
    } else {
      this.triggerNudge({
        mood: 'sleepy',
        badge: m.assimBadge,
        title: m.assimTitle,
        message: m.assimMsg
      });
    }
  }

  /**
   * Réagit instantanément à l'enregistrement d'un repas
   * @param {Object} mealData { name, pral, mucogenicScore }
   */
  onMealLogged(mealData = {}) {
    const lang = typeof window !== 'undefined' && window.vitalTrackI18n ? window.vitalTrackI18n.getLanguage() : 'fr';
    const pral = mealData.pral !== undefined ? mealData.pral : 0;
    const isAcidic = pral > 8 || mealData.isAcidic;
    const isLiving = pral < -5 || mealData.isLiving;

    const texts = {
      fr: {
        acidBadge: '⚖️ Équilibre Acido-Basique',
        acidTitle: 'Charge Acidifiante Détectée',
        acidMsg: 'Pense à compenser ce repas avec un jus vert, du persil frais ou une infusion de prêle alcalinisante !',
        livingBadge: '🌿 Vitalité Pure',
        livingTitle: 'Aliment Vivant & Alcalin !',
        livingMsg: 'Excellent apport en enzymes, potassium et eau cellulaire structurée. Tes cellules te remercient !'
      },
      'fr-CA': {
        acidBadge: '⚖️ Équilibre Acido-Basique',
        acidTitle: 'Charge Acidifiante Détectée',
        acidMsg: 'Pense à compenser ce repas avec un jus vert, du persil frais ou une tisane boréale alcalinisante !',
        livingBadge: '🌿 Vitalité Pure',
        livingTitle: 'Aliment Vivant & Alcalin !',
        livingMsg: 'Excellent apport en enzymes, potassium et eau cellulaire structurée. Tes cellules te remercient !'
      },
      en: {
        acidBadge: '⚖️ Acid-Base Balance',
        acidTitle: 'Acidifying Load Detected',
        acidMsg: 'Balance this meal with fresh green juice, leafy parsley, or an alkalizing herbal infusion!',
        livingBadge: '🌿 Pure Vitality',
        livingTitle: 'Living & Alkaline Food!',
        livingMsg: 'Outstanding supply of active enzymes, electrolytes, and structured EZ water. Your cells thank you!'
      },
      es: {
        acidBadge: '⚖️ Equilibrio Ácido-Base',
        acidTitle: 'Carga Acidificante Detectada',
        acidMsg: '¡Compensa esta comida con un jugo verde, perejil fresco o una infusión alcalinizante!',
        livingBadge: '🌿 Vitalidad Pura',
        livingTitle: '¡Alimento Vivo y Alcalino!',
        livingMsg: 'Excelente aporte de enzimas vivas, electrolitos y agua estructurada. ¡Tus células te lo agradecen!'
      }
    };

    const t = texts[lang] || texts.fr;

    if (isAcidic) {
      this.triggerNudge({
        mood: 'questioning',
        badge: t.acidBadge,
        title: t.acidTitle,
        message: t.acidMsg,
        force: true
      });
    } else if (isLiving) {
      this.triggerNudge({
        mood: 'excited',
        badge: t.livingBadge,
        title: t.livingTitle,
        message: t.livingMsg,
        force: true
      });
    }
  }

  /**
   * Réagit aux paliers de jeûne intermittent (Multilingue FR / EN / ES)
   * @param {number} hours 
   */
  onFastingMilestone(hours) {
    const lang = typeof window !== 'undefined' && window.vitalTrackI18n ? window.vitalTrackI18n.getLanguage() : 'fr';
    const texts = {
      fr: {
        m14Badge: '🔥 Palier 14h de Jeûne',
        m14Title: 'Épuisement du Glycogène',
        m14Msg: 'Ton foie bascule en mode cétose douce. La filtration lymphatique s\'accélère !',
        m16Badge: '🌟 Palier 16h : Autophagie',
        m16Title: 'Recyclage Cellulaire Actif',
        m16Msg: 'L\'autophagie tourne à plein régime ! Les protéines endommagées et le mucus sont éliminés.',
        m20Badge: '👑 Jeûne Profond',
        m20Title: 'Régénération Tissulaire',
        m20Msg: 'Autolyse profonde et détoxification cellulaire majeure. Reste à l\'écoute de ton corps !'
      },
      'fr-CA': {
        m14Badge: '🔥 Palier 14h de Jeûne',
        m14Title: 'Épuisement du Glycogène',
        m14Msg: 'Ton foie bascule en mode cétose douce. La filtration lymphatique s\'accélère !',
        m16Badge: '🌟 Palier 16h : Autophagie',
        m16Title: 'Recyclage Cellulaire Actif',
        m16Msg: 'L\'autophagie tourne à plein régime ! Les protéines endommagées et le mucus sont éliminés.',
        m20Badge: '👑 Jeûne Profond',
        m20Title: 'Régénération Tissulaire',
        m20Msg: 'Autolyse profonde et détoxification cellulaire majeure. Reste à l\'écoute de ton corps !'
      },
      en: {
        m14Badge: '🔥 14h Fasting Milestone',
        m14Title: 'Glycogen Depletion',
        m14Msg: 'Your liver is entering mild ketosis. Lymphatic filtration is accelerating!',
        m16Badge: '🌟 16h Milestone: Autophagy',
        m16Title: 'Active Cellular Recycling',
        m16Msg: 'Autophagy is in full swing! Damaged proteins and mucoid debris are cleared.',
        m20Badge: '👑 Deep Fasting',
        m20Title: 'Tissue Regeneration',
        m20Msg: 'Deep cellular autolysis and regeneration underway. Listen to your body!'
      },
      es: {
        m14Badge: '🔥 Fase 14h de Ayuno',
        m14Title: 'Agotamiento del Glucógeno',
        m14Msg: 'Tu hígado entra en cetosis suave. ¡La filtración linfática se acelera!',
        m16Badge: '🌟 Fase 16h: Autofagia',
        m16Title: 'Reciclaje Celular Activo',
        m16Msg: '¡La autofagia funciona al máximo! Se eliminan las proteínas dañadas y el moco.',
        m20Badge: '👑 Ayuno Profundo',
        m20Title: 'Regeneración Tisular',
        m20Msg: 'Autólisis profunda y desintoxicación celular mayor. ¡Permanece atento a tu cuerpo!'
      }
    };

    const t = texts[lang] || texts.fr;

    if (hours === 14) {
      this.triggerNudge({
        mood: 'proud',
        badge: t.m14Badge,
        title: t.m14Title,
        message: t.m14Msg,
        force: true
      });
    } else if (hours === 16) {
      this.triggerNudge({
        mood: 'excited',
        badge: t.m16Badge,
        title: t.m16Title,
        message: t.m16Msg,
        force: true
      });
    } else if (hours >= 20) {
      this.triggerNudge({
        mood: 'excited',
        badge: t.m20Badge,
        title: t.m20Title,
        message: t.m20Msg,
        force: true
      });
    }
  }
}

export const pigeonNudges = new PigeonNudgeEngine();
if (typeof window !== 'undefined') {
  window.pigeonNudges = pigeonNudges;
}
