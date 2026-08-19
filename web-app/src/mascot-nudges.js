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
    this.container = document.getElementById('pigeonNudgeContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'pigeonNudgeContainer';
      this.container.className = 'pigeon-nudge-container';
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

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Créer ou réutiliser l'élément toast
    this.container.innerHTML = `
      <div class="pigeon-nudge-toast" id="pigeonNudgeToast">
        <div class="pigeon-nudge-avatar-wrap" onclick="if(window.openMascotStudioModal) window.openMascotStudioModal();">
          <canvas id="miniNudgeCanvas" width="56" height="70"></canvas>
        </div>
        <div class="pigeon-nudge-content">
          <div class="pigeon-nudge-header">
            <span class="pigeon-nudge-badge">${badge}</span>
            <button type="button" class="pigeon-nudge-close" onclick="window.pigeonNudges.dismiss()">&times;</button>
          </div>
          ${title ? `<div class="pigeon-nudge-title">${title}</div>` : ''}
          <div class="pigeon-nudge-text">${message}</div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('miniNudgeCanvas');
    if (canvas) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 56 * dpr;
      canvas.height = 70 * dpr;
      canvas.style.width = '56px';
      canvas.style.height = '70px';
      this.miniPigeon = new Pigeon(canvas);
      this.miniPigeon.setMood(mood);
      this.miniPigeon.draw(0.5);
    }

    // Animation d'entrée
    const toast = document.getElementById('pigeonNudgeToast');
    if (toast) {
      requestAnimationFrame(() => {
        toast.classList.add('visible');
      });

      // Pause auto-dismiss on hover (Industry best practice)
      toast.addEventListener('mouseenter', () => {
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
      });
      toast.addEventListener('mouseleave', () => {
        if (!this.hideTimeout) {
          this.hideTimeout = setTimeout(() => this.dismiss(), 3000);
        }
      });
    }

    // Auto-dismiss après 6.5 secondes
    this.hideTimeout = setTimeout(() => {
      this.dismiss();
    }, 6500);
  }

  dismiss() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    const toast = document.getElementById('pigeonNudgeToast');
    if (toast) {
      toast.classList.remove('visible');
      setTimeout(() => {
        if (this.container) this.container.innerHTML = '';
      }, 350);
    }
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
   * Réagit aux paliers de jeûne intermittent
   * @param {number} hours 
   */
  onFastingMilestone(hours) {
    if (hours === 14) {
      this.triggerNudge({
        mood: 'proud',
        badge: '🔥 Palier 14h de Jeûne',
        title: 'Épuisement du Glycogène',
        message: 'Ton foie bascule en mode cétose douce. La filtration lymphatique s\'accélère !',
        force: true
      });
    } else if (hours === 16) {
      this.triggerNudge({
        mood: 'excited',
        badge: '🌟 Palier 16h : Autophagie',
        title: 'Recyclage Cellulaire Actif',
        message: 'L\'autophagie tourne à plein régime ! Les protéines endommagées et le mucus sont éliminés.',
        force: true
      });
    } else if (hours >= 20) {
      this.triggerNudge({
        mood: 'excited',
        badge: '👑 Jeûne Profond',
        title: 'Régénération Tissulaire',
        message: 'Autolyse profonde et détoxification cellulaire majeure. Reste à l\'écoute de ton corps !',
        force: true
      });
    }
  }
}

export const pigeonNudges = new PigeonNudgeEngine();
if (typeof window !== 'undefined') {
  window.pigeonNudges = pigeonNudges;
}
