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
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      this.triggerNudge({
        mood: 'proud',
        badge: '🍋 Cycle d\'Élimination',
        title: 'Phase de Nettoyage Matinal',
        message: 'Tes émonctoires éliminent activement. Hydrate-toi avec de l\'eau tiède citronnée ou une infusion !'
      });
    } else if (hour >= 12 && hour < 20) {
      this.triggerNudge({
        mood: 'idle',
        badge: '🍉 Cycle d\'Appropriation',
        title: 'Fenêtre Nutritionnelle',
        message: 'Priorité aux aliments vivants, fruits mûrs gorgés d\'eau structurée et légumes riches en minéraux.'
      });
    } else {
      this.triggerNudge({
        mood: 'sleepy',
        badge: '🌙 Cycle d\'Assimilation',
        title: 'Régénération Cellulaire',
        message: 'Repos physiologique profond. C\'est l\'heure de l\'autolyse nocturne des toxines.'
      });
    }
  }

  /**
   * Réagit instantanément à l'enregistrement d'un repas
   * @param {Object} mealData { name, pral, mucogenicScore }
   */
  onMealLogged(mealData = {}) {
    const pral = mealData.pral !== undefined ? mealData.pral : 0;
    const isAcidic = pral > 8 || mealData.isAcidic;
    const isLiving = pral < -5 || mealData.isLiving;

    if (isAcidic) {
      this.triggerNudge({
        mood: 'questioning',
        badge: '⚖️ Équilibre Acido-Basique',
        title: 'Charge Acidifiante Détectée',
        message: 'Pense à compenser ce repas avec un jus vert, du persil frais ou une infusion de prêle alcalinisante !',
        force: true
      });
    } else if (isLiving) {
      this.triggerNudge({
        mood: 'excited',
        badge: '🌿 Vitalité Pure',
        title: 'Aliment Vivant & Alcalin !',
        message: 'Excellent apport en enzymes, potassium et eau cellulaire structurée. Tes cellules te remercient !',
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
