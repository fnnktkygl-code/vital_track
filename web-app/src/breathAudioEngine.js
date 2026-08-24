/**
 * ══════════════════════════════════════════════════════════════════════════════
 * BREATH NEURO-ACOUSTIC ENGINE — SYNTHÉTISEUR DE SOUFFLE PUR (JAPANDI & WEB AUDIO)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Générateur de son procédural temps réel Web Audio API :
 * 1. INHALE : Bruit rose lissé par filtre Biquad résonant balayant de 200 Hz à 800 Hz.
 * 2. EXHALE : Bruit rose descendant (600 Hz ➔ 120 Hz) pour le lâcher-prise ("letting go").
 * 3. GONG TIBÉTAIN : Fréquences harmoniques pures (528 Hz / 432 Hz + harmoniques) pour les rétentions.
 * 4. PULSE APNÉE : Pulsation apaisante feutrée pendant la rétention yeux fermés.
 * 
 * 100% procédural : Zéro fichier externe, zéro parasite de micro/gorge, latence 0ms.
 */

class BreathNeuroAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    if (typeof localStorage !== 'undefined') {
      this.enabled = localStorage.getItem('vt_breath_sound_enabled') !== 'false';
    }
    this.volume = 0.85;
    this._noiseBuffer = null;
    this._activeNodes = [];
  }

  _initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _getPinkNoiseBuffer() {
    if (this._noiseBuffer) return this._noiseBuffer;
    if (!this.ctx) return null;

    // Génère 5 secondes de bruit rose (1/f) filtré
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this._noiseBuffer = buffer;
    return buffer;
  }

  stopAll() {
    this._activeNodes.forEach(node => {
      try {
        if (typeof node.stop === 'function') node.stop();
        if (typeof node.disconnect === 'function') node.disconnect();
      } catch (e) {}
    });
    this._activeNodes = [];
  }

  /**
   * Son d'Inspiration (Flux d'air ascendant)
   */
  playInhale(durationSec = 2.0) {
    if (!this.enabled) return;
    const ctx = this._initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const buffer = this._getPinkNoiseBuffer();
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Filtre passe-bas dynamique (balayage montant 180 Hz -> 800 Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.2, now);
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + durationSec * 0.88);

      // Filtre passe-haut doux pour éliminer les infra-basses
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(120, now);

      // Enveloppe d'amplitude (montée progressive)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + durationSec * 0.8);
      gain.gain.linearRampToValueAtTime(0.01, now + durationSec);

      source.connect(filter);
      filter.connect(highpass);
      highpass.connect(gain);
      gain.connect(ctx.destination);

      source.start(now);
      source.stop(now + durationSec + 0.05);

      this._activeNodes.push(source);
    } catch (err) {
      console.warn('Breath audio inhale error:', err);
    }
  }

  /**
   * Son d'Expiration (Relâchement descendant "Letting go")
   */
  playExhale(durationSec = 2.0) {
    if (!this.enabled) return;
    const ctx = this._initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const buffer = this._getPinkNoiseBuffer();
      if (!buffer) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Filtre passe-bas dynamique (balayage descendant 650 Hz -> 140 Hz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(1.8, now);
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + durationSec * 0.85);

      // Filtre passe-haut doux
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(100, now);

      // Enveloppe d'amplitude (lâcher-prise puis extinction douce)
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.95);

      source.connect(filter);
      filter.connect(highpass);
      highpass.connect(gain);
      gain.connect(ctx.destination);

      source.start(now);
      source.stop(now + durationSec + 0.05);

      this._activeNodes.push(source);
    } catch (err) {
      console.warn('Breath audio exhale error:', err);
    }
  }

  /**
   * Bol Tibétain / Cloche Japandi Zen (Transition Rétention / Alertes)
   */
  playTibetanBowl(freq = 528, durationSec = 3.2) {
    if (!this.enabled) return;
    const ctx = this._initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Fondamentale
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Harmonique de bol (ratio 2.76)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, now);

      // Sub-harmonique chaude
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq / 2, now);

      // Enveloppes de gain
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.22 * this.volume, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(0.07 * this.volume, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.7);

      const gain3 = ctx.createGain();
      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.linearRampToValueAtTime(0.09 * this.volume, now + 0.04);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.85);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      gain3.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + durationSec + 0.1);
      osc2.stop(now + durationSec + 0.1);
      osc3.stop(now + durationSec + 0.1);

      this._activeNodes.push(osc1, osc2, osc3);
    } catch (err) {
      console.warn('Breath audio bowl error:', err);
    }
  }

  /**
   * Pulse d'apnée feutré (battement d'ancrage pendant la rétention)
   */
  playRetentionPulse() {
    if (!this.enabled) return;
    const ctx = this._initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);

      this._activeNodes.push(osc);
    } catch (err) {}
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vt_breath_sound_enabled', String(this.enabled));
    }
    if (!this.enabled) {
      this.stopAll();
    } else {
      this._initContext();
      this.playTibetanBowl(432, 1.2);
    }
    this.updateToggleButtonUI();
    return this.enabled;
  }

  updateToggleButtonUI() {
    const btn = document.getElementById('breathSoundToggleBtn');
    if (!btn) return;
    const icon = btn.querySelector('i');
    const label = btn.querySelector('.sound-btn-text');
    if (this.enabled) {
      btn.classList.add('sound-active');
      btn.classList.remove('sound-muted');
      if (icon) icon.className = 'ri-volume-up-fill';
      if (label) label.textContent = (window.vitalTrackI18n?.t ? window.vitalTrackI18n.t('breathing.soundOn') : null) || 'Son Actif';
    } else {
      btn.classList.remove('sound-active');
      btn.classList.add('sound-muted');
      if (icon) icon.className = 'ri-volume-mute-fill';
      if (label) label.textContent = (window.vitalTrackI18n?.t ? window.vitalTrackI18n.t('breathing.soundMuted') : null) || 'Silencieux';
    }
  }
}

export const breathAudio = new BreathNeuroAudioEngine();
if (typeof window !== 'undefined') {
  window.breathAudio = breathAudio;
  window.toggleBreathSound = () => breathAudio.toggleSound();
}
