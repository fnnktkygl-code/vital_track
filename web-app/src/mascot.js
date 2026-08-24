/**
 * Mascot.js — Pigeon Biset VitalTrack 3D / Organique & Fluide
 * Moteur de rendu Canvas haute fidélité avec cinématique réaliste & Vrai Son de Pigeon
 * 
 * - Ailes parfaitement symétriques (gauche & droite synchronisées)
 * - Rendu sans coutures avec col iridescent soyeux
 * - Vrai enregistrement audio de pigeon biset (Columba livia) au clic sur Roucouler
 * - Zéro son intrusif dans l'application
 */

// ─────────────────────────────────────────────────────────────
// PALETTE BIOMÉCANIQUE & SHADING 3D ORGANIC CLAY
// ─────────────────────────────────────────────────────────────
const clayBase = '#8A95AC';
const clayShadow = '#505970';
const clayDeep = '#353C4D';
const clayLight = '#C5CFE2';
const clayHi = '#F1F5F9';

// Col iridescent dynamique (émeraude, sarcelle, indigo, améthyste)
const IRID_GRAD = [
  '#34D399', // Vert émeraude vif
  '#2DD4BF', // Sarcelle lagon
  '#818CF8', // Indigo doux
  '#C084FC'  // Améthyste violette
];

// Bec & Cire
const beakBase = '#353942';
const beakShadow = '#1E2128';
const beakLight = '#545967';
const cereC = '#F5F2EB';
const cereShadow = '#CDC7BF';

// Yeux (Iris orange concentrique & pupille vitreuse)
const irisOuter = '#FB923C';
const irisInner = '#EA580C';
const pupilC = '#141416';

// Pattes & Griffes
const footBase = '#E0756A';
const footShadow = '#B3453B';
const clawC = '#222328';

// Barres alaires & Nuances
const barDark = '#252934';
const blushC = 'rgba(255, 115, 130, 0.35)';

// ─────────────────────────────────────────────────────────────
// MATH & INTERPOLATION HELPERS
// ─────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function clamp01(t) { return Math.max(0, Math.min(1, t)); }

function radial(ctx, x, y, r, c1, c2, fx = -0.3, fy = -0.35) {
  const g = ctx.createRadialGradient(x + fx * r, y + fy * r, r * 0.05, x, y, r);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

function linear(ctx, x0, y0, x1, y1, c1, c2) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}

// ─────────────────────────────────────────────────────────────
// LECTEUR AUDIO AUTHENTIQUE MULTI-VOCAL (Columba livia & Columba palumbus)
// Vrais enregistrements studio nettoyés : Ramier (Matin cuu cuuu-uu cu), Classique, Nuptial, Territorial, Matin
// ─────────────────────────────────────────────────────────────
class AuthenticPigeonAudio {
  constructor() {
    this.enabled = true;
    this.lastSoundIndex = -1;
    this.audioPool = {};
    this._synthCtx = null;
    this.soundCatalog = [
      { id: 'ramier', file: '/audio/pigeon-coo-ramier.mp3', name: 'Chant Matinal du Pigeon Ramier (cuu cuuu-uu cu)', desc: 'Le chant rythmé et mélodieux du matin (cuu cuuu-uu cu, cuu cuuu-uu cu, cuu cuuu-uu cu)' },
      { id: 'classic', file: '/audio/pigeon-coo-classic.mp3', name: 'Roucoulement Classique d\'Origine', desc: 'Le son authentique de base doux et mélodieux' },
      { id: 'morning', file: '/audio/pigeon-coo-morning.mp3', name: 'Chant du Matin / Aube', desc: 'Roucoulement calme et régulier au réveil sur les toits' },
      { id: 'nuptial', file: '/audio/pigeon-coo-nuptial.mp3', name: 'Roucoulement Nuptial / Parade', desc: 'Roulement vif et dansant de séduction' },
      { id: 'territorial', file: '/audio/pigeon-coo-territorial.mp3', name: 'Roucoulement Territorial', desc: 'Vibration profonde de gorge et jabot gonflé' }
    ];
  }

  _getAudio(soundId) {
    if (typeof window === 'undefined') return null;
    const item = this.soundCatalog.find(s => s.id === soundId) || this.soundCatalog[0];
    if (!this.audioPool[item.id]) {
      const audio = new Audio(item.file);
      audio.volume = 0.95;
      audio.preload = 'auto';
      this.audioPool[item.id] = audio;
    }
    return this.audioPool[item.id];
  }

  playProceduralWoodpigeonRamier() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._synthCtx) this._synthCtx = new AudioCtx();
      const ctx = this._synthCtx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const t0 = ctx.currentTime;
      // 3 rhythmic morning strophes of "cuu cuuu-uu cu"
      const strophes = [0.05, 1.65, 3.25];

      strophes.forEach(st => {
        const notes = [
          { start: st + 0.0, dur: 0.32, fStart: 390, fEnd: 415, amp: 0.7 },
          { start: st + 0.38, dur: 0.58, fStart: 420, fMid: 475, fEnd: 370, amp: 0.9 },
          { start: st + 1.02, dur: 0.26, fStart: 350, fEnd: 320, amp: 0.6 }
        ];

        notes.forEach(n => {
          const osc = ctx.createOscillator();
          const oscHarm = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(850, t0 + n.start);

          osc.type = 'sine';
          oscHarm.type = 'sine';

          const tStart = t0 + n.start;
          const tDur = n.dur;

          osc.frequency.setValueAtTime(n.fStart, tStart);
          if (n.fMid) {
            osc.frequency.exponentialRampToValueAtTime(n.fMid, tStart + tDur * 0.45);
            osc.frequency.exponentialRampToValueAtTime(n.fEnd, tStart + tDur);
            oscHarm.frequency.setValueAtTime(n.fStart * 2, tStart);
            oscHarm.frequency.exponentialRampToValueAtTime(n.fMid * 2, tStart + tDur * 0.45);
            oscHarm.frequency.exponentialRampToValueAtTime(n.fEnd * 2, tStart + tDur);
          } else {
            osc.frequency.linearRampToValueAtTime(n.fEnd, tStart + tDur);
            oscHarm.frequency.linearRampToValueAtTime(n.fEnd * 2, tStart + tDur);
          }

          gain.gain.setValueAtTime(0.001, tStart);
          gain.gain.exponentialRampToValueAtTime(n.amp * 0.25, tStart + tDur * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, tStart + tDur);

          osc.connect(filter);
          oscHarm.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(tStart);
          oscHarm.start(tStart);
          osc.stop(tStart + tDur + 0.05);
          oscHarm.stop(tStart + tDur + 0.05);
        });
      });
    } catch (e) {
      console.warn('[Pigeon Synth] procedural error:', e);
    }
  }

  playRealCoo(specificType = null) {
    if (!this.enabled || typeof window === 'undefined') return;

    let soundId = specificType;
    if (!soundId || !this.soundCatalog.some(s => s.id === soundId)) {
      // Rotate / Shuffle among the 5 authentic sounds without repeating the same one
      let nextIdx = Math.floor(Math.random() * this.soundCatalog.length);
      if (nextIdx === this.lastSoundIndex) {
        nextIdx = (nextIdx + 1) % this.soundCatalog.length;
      }
      this.lastSoundIndex = nextIdx;
      soundId = this.soundCatalog[nextIdx].id;
    }

    try {
      const audio = this._getAudio(soundId);
      if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policy fallback: use procedural synthesis if ramier
            if (soundId === 'ramier') {
              this.playProceduralWoodpigeonRamier();
            }
          });
        }
      } else if (soundId === 'ramier') {
        this.playProceduralWoodpigeonRamier();
      }
    } catch (e) {
      console.warn('[Pigeon Audio] Playback error:', e);
      if (soundId === 'ramier') {
        this.playProceduralWoodpigeonRamier();
      }
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      Object.values(this.audioPool).forEach(a => {
        try { a.pause(); } catch (e) {}
      });
    }
    return this.enabled;
  }
}

export const pigeonAudio = new AuthenticPigeonAudio();
if (typeof window !== 'undefined') {
  window.pigeonAudio = pigeonAudio;
}

// ─────────────────────────────────────────────────────────────
// PIGEON RENDERER — ARCHITECTURE ANATOMIQUE UNIFIÉE 3D
// ─────────────────────────────────────────────────────────────
export class Pigeon {
  constructor(canvas) {
    this.canvas = canvas;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    this.action = 'idle';
    this.isSpeaking = false;
    this.speed = 1.0;
    this.iridescenceIntensity = 1.0;
    this.particles = [];
    this.isInspecting = false;
  }

  setInspecting(bool) {
    this.isInspecting = !!bool;
    if (this.isInspecting) {
      this.setAction('think');
    }
  }

  setAction(action, isSpeaking = false, tNow) {
    if (!action || action === 'peck' || action === 'fly') action = 'idle';
    if (action === this.action && isSpeaking === this.isSpeaking) return;

    this.action = action;
    this.isSpeaking = isSpeaking;

    if (action === 'celebrate' || action === 'laugh') {
      this._spawnParticles(action);
    }
  }

  setMood(mood, isSpeaking = false) {
    const map = {
      neutral: 'idle',
      talking: 'coo',
      excited: 'celebrate',
      questioning: 'think',
      sad: 'idle',
      loving: 'laugh',
      proud: 'walk',
      sleepy: 'sleep',
      stern: 'think',
      scared: 'think'
    };
    this.setAction(map[mood] || 'idle', isSpeaking);
  }

  setSpeed(s) {
    this.speed = Math.max(0.2, Math.min(3.0, s));
  }

  setIridescence(val) {
    this.iridescenceIntensity = Math.max(0, Math.min(1, val));
  }

  _spawnParticles(type) {
    this.particles = [];
    const count = type === 'celebrate' ? 14 : 7;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: 50 + (Math.random() - 0.5) * 36,
        y: 55 + (Math.random() - 0.5) * 26,
        vx: (Math.random() - 0.5) * 50,
        vy: -25 - Math.random() * 38,
        size: 2.8 + Math.random() * 3.2,
        life: 1.0,
        decay: 0.65 + Math.random() * 0.4,
        type: type === 'celebrate' ? (Math.random() > 0.5 ? 'star' : 'sparkle') : 'note',
        color: ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A78BFA'][Math.floor(Math.random() * 5)]
      });
    }
  }

  _updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(tNow) {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.canvas.width, H = this.canvas.height;
    const scale = Math.min(W / 100, H / 125);

    const t = tNow * this.speed;
    const dt = 0.016 * this.speed;
    this._updateParticles(dt);

    const act = this.action;
    let bodyY = 0, bodyPitch = 0;
    let headX = 0, headY = 0, headPitch = 0;
    let wingSpread = 0, wingFlapAngle = 0;
    let footL_Y = 0, footL_Rot = 0, footR_Y = 0, footR_Rot = 0;
    let tailPitch = 0, tailFan = 1.0;
    let cropPuff = 0;
    let eyeBlinkL = 0, eyeBlinkR = 0, eyeShape = 'round';
    let mouthOpen = 0;
    let shadowScale = 1.0, shadowAlpha = 0.2;

    // Clignement naturel
    const blinkCycle = (t % 3.6);
    if (blinkCycle > 3.42) {
      const u = (blinkCycle - 3.42) / 0.18;
      eyeBlinkL = Math.sin(Math.PI * u);
      eyeBlinkR = Math.sin(Math.PI * Math.min(1, u * 1.1));
    }

    // ───────────────────────────────────────────────
    // CINÉMATIQUES DES 8 ACTIONS MAJEURES
    // ───────────────────────────────────────────────
    if (act === 'idle') {
      const breathe = Math.sin(t * Math.PI * 2 / 2.5);
      bodyY = breathe * 0.9;
      headY = Math.sin(t * Math.PI * 2 / 2.5 + 0.8) * 1.3;
      wingSpread = 0;
      wingFlapAngle = 0;
      tailPitch = Math.sin(t * Math.PI * 2 / 3.2) * 3;
    } else if (act === 'walk') {
      const walkCycle = (t * 3.2) % (Math.PI * 2);
      const walkSin = Math.sin(walkCycle);
      const walkCos = Math.cos(walkCycle);

      headX = Math.max(0, Math.sin(walkCycle * 2)) * 5.0;
      headY = Math.sin(walkCycle * 2) * 1.5;
      bodyY = Math.abs(walkSin) * 2.5;
      bodyPitch = walkCos * 4.0;

      footL_Y = Math.max(0, -walkSin) * 7.5;
      footL_Rot = -walkSin * 28;
      footR_Y = Math.max(0, walkSin) * 7.5;
      footR_Rot = walkSin * 28;

      tailPitch = walkCos * 6.0;
      wingSpread = 0.05;
    } else if (act === 'coo') {
      const cooCycle = Math.sin(t * 3.4);
      cropPuff = Math.max(0, cooCycle) * 8.5;
      headY = -cooCycle * 2.5;
      headPitch = -cooCycle * 5.0;
      mouthOpen = 0.25 + Math.max(0, cooCycle) * 0.55;
      tailPitch = cooCycle * 4.0;
      wingSpread = 0.08;
    } else if (act === 'laugh') {
      const bounce = Math.abs(Math.sin(t * 7.5));
      bodyY = -bounce * 5.0;
      headY = -bounce * 6.5;
      headPitch = Math.sin(t * 4) * 6;
      mouthOpen = 0.45 + bounce * 0.45;
      eyeShape = 'happy';
      wingSpread = 0.45;
      wingFlapAngle = Math.sin(t * 12) * 20;
      tailPitch = Math.sin(t * 8) * 8;
    } else if (act === 'think') {
      headPitch = 20;
      headX = 2.8;
      headY = -1.5;
      eyeShape = 'inquisitive';
      tailPitch = 4;
    } else if (act === 'celebrate') {
      const jump = Math.max(0, Math.sin(t * 4.5));
      bodyY = -jump * 10.0;
      headY = -jump * 12.0;
      wingSpread = 0.95;
      wingFlapAngle = 55 - jump * 30;
      eyeShape = 'happy';
      mouthOpen = 0.7;
      shadowScale = 0.6;
    } else if (act === 'sleep') {
      const sleepBreathe = Math.sin(t * Math.PI * 2 / 4.2);
      bodyY = 3.5 + sleepBreathe * 0.6;
      headY = 5.5 + sleepBreathe * 0.8;
      eyeShape = 'sleep';
      eyeBlinkL = 1.0; eyeBlinkR = 1.0;
      tailPitch = -5;
    }

    if (this.isSpeaking && act !== 'sleep') {
      mouthOpen = Math.max(mouthOpen, 0.35 + 0.45 * Math.abs(Math.sin(t * 12)));
    }

    // ───────────────────────────────────────────────
    // EXÉCUTION DU RENDU CANVAS SYMETRIQUE & FLUIDE
    // ───────────────────────────────────────────────
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.scale(scale, scale);

    // 1. Ombre au sol
    this._drawGroundShadow(ctx, shadowScale, shadowAlpha);

    // 2. Queue (Rectrices)
    this._drawTail(ctx, tailPitch, tailFan, bodyY, bodyPitch);

    // 3. Pattes articulées
    this._drawFeet(ctx, footL_Y, footL_Rot, footR_Y, footR_Rot, bodyY, bodyPitch);

    // 4. Ailes Symétriques Gauche & Droite (Dessinées en couche harmonieuse)
    this._drawSymmetricalWings(ctx, wingSpread, wingFlapAngle, bodyY, bodyPitch);

    // 5. Tronc & Cou Unifié 3D (sans coupure)
    this._drawUnifiedBodyAndNeck(ctx, bodyY, bodyPitch, cropPuff, headX, headY, headPitch, t);

    // 6. Tête & Yeux & Bec (Scellés à la nuque)
    this._drawHead(ctx, headX, headY, headPitch, eyeBlinkL, eyeBlinkR, eyeShape, mouthOpen, bodyY, bodyPitch, cropPuff, t);

    // 7. Particules
    this._drawParticles(ctx);

    ctx.restore();
  }

  _drawGroundShadow(ctx, scaleRatio, alpha) {
    ctx.save();
    ctx.filter = 'blur(3.5px)';
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(50, 118, 25 * scaleRatio, 6.5 * scaleRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, pitchDeg, fanRatio, bodyY, bodyPitch) {
    ctx.save();
    const pivotX = 50, pivotY = 94 + bodyY;
    ctx.translate(pivotX, pivotY);
    ctx.rotate((pitchDeg - bodyPitch * 0.4) * Math.PI / 180);
    ctx.scale(fanRatio, 1.0);

    const g = linear(ctx, 0, 0, 0, 28, clayBase, clayDeep);
    ctx.fillStyle = g;

    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.bezierCurveTo(-18, 14, -11, 26, -4, 28);
    ctx.quadraticCurveTo(0, 30, 4, 28);
    ctx.bezierCurveTo(11, 26, 18, 14, 16, -2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = barDark;
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.ellipse(0, 26, 16, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _drawFeet(ctx, lY, lRot, rY, rRot, bodyY, bodyPitch) {
    const drawSingleFoot = (cx, cy, yOffset, rotDeg) => {
      ctx.save();
      ctx.translate(cx, cy + bodyY - yOffset);
      ctx.rotate((rotDeg + bodyPitch * 0.3) * Math.PI / 180);

      ctx.fillStyle = clayShadow;
      ctx.beginPath();
      ctx.ellipse(0, -11, 4.2, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = linear(ctx, -2, -10, 2, 0, footBase, footShadow);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-2.2, -10, 4.4, 11, 2.2) : ctx.rect(-2.2, -10, 4.4, 11);
      ctx.fill();

      const toes = [
        { dx: -4.5, dy: 3.5, rot: -0.25, len: 4.8 },
        { dx: 0, dy: 5.2, rot: 0, len: 5.4 },
        { dx: 4.5, dy: 3.5, rot: 0.25, len: 4.8 }
      ];

      toes.forEach(t => {
        ctx.fillStyle = footBase;
        ctx.beginPath();
        ctx.ellipse(t.dx, t.dy, 2.2, t.len * 0.6, t.rot, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = clawC;
        ctx.beginPath();
        ctx.ellipse(t.dx + Math.sin(t.rot) * 2.8, t.dy + Math.cos(t.rot) * 2.8, 1.1, 1.4, t.rot, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = footShadow;
      ctx.beginPath();
      ctx.ellipse(0, -1.5, 1.8, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawSingleFoot(39, 109, lY, lRot);
    drawSingleFoot(61, 109, rY, rRot);
  }

  // ─────────────────────────────────────────────────────────────
  // AILES PARFAITEMENT SYMÉTRIQUES (Gauches & Droites Synchronisées)
  // ─────────────────────────────────────────────────────────────
  _drawSymmetricalWings(ctx, spreadAmt, flapAngleDeg, bodyY, bodyPitch) {
    const drawSingleWing = (side) => {
      const right = side === 'R';
      const m = right ? 1 : -1;
      // Positionnement symétrique sur les épaules/flancs
      const shoulderX = 50 + m * 22;
      const shoulderY = 56 + bodyY;

      ctx.save();
      ctx.translate(shoulderX, shoulderY);
      // Rotation symétrique en V (les deux ailes s'ouvrent et battent vers l'extérieur)
      ctx.rotate((bodyPitch * 0.4 + m * flapAngleDeg * (0.85 + spreadAmt * 0.35)) * Math.PI / 180);
      ctx.scale(m, 1.0);

      // 4 pennes rémiges douces et profilées
      const feathers = [
        { len: 48, w: 8.5, rot: 0.08 + spreadAmt * 0.32, col: clayDeep },
        { len: 44, w: 8.0, rot: 0.02 + spreadAmt * 0.22, col: clayShadow },
        { len: 40, w: 7.5, rot: -0.04 + spreadAmt * 0.12, col: clayBase },
        { len: 34, w: 7.0, rot: -0.10 + spreadAmt * 0.02, col: clayLight }
      ];

      feathers.forEach(f => {
        ctx.save();
        ctx.rotate(f.rot);

        ctx.fillStyle = linear(ctx, 0, 0, 0, f.len, clayLight, f.col);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(f.w * 0.8, f.len * 0.35, f.w * 0.85, f.len * 0.75, 0, f.len);
        ctx.bezierCurveTo(-f.w * 0.4, f.len * 0.75, -f.w * 0.3, f.len * 0.35, 0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(0, f.len - 3);
        ctx.stroke();

        ctx.restore();
      });

      // Couverture d'épaule douce et profilée
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(12, -6, 16, 8, 14, 24);
      ctx.bezierCurveTo(11, 32, 4, 36, -2, 34);
      ctx.bezierCurveTo(-7, 26, -5, 6, 0, -6);
      ctx.closePath();
      ctx.fillStyle = linear(ctx, 0, -6, 0, 34, clayHi, clayShadow);
      ctx.fill();

      // Barres alaires caractéristiques
      ctx.save();
      ctx.clip();
      ctx.fillStyle = barDark;
      ctx.globalAlpha = 0.8;

      ctx.beginPath();
      ctx.ellipse(7, 16, 9, 2.6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(6, 25, 8, 2.4, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(10, -4, 12, 10);
      ctx.stroke();

      ctx.restore();
      ctx.restore();
    };

    // Dessin simultané et symétrique des deux ailes
    drawSingleWing('L');
    drawSingleWing('R');
  }

  _drawUnifiedBodyAndNeck(ctx, bodyY, bodyPitch, cropPuff, hX, hY, hPitch, t) {
    ctx.save();
    const cx = 50, cy = 82 + bodyY;
    ctx.translate(cx, cy);
    ctx.rotate(bodyPitch * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Silhouette monocoque unifiée
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy + 12);
    ctx.bezierCurveTo(cx - 28, cy - 6, cx - 27 - cropPuff * 0.4, cy - 24, cx - 18 - cropPuff * 0.4, cy - 36);
    ctx.bezierCurveTo(cx - 15, cy - 44, cx - 14, cy - 50, cx, cy - 50);
    ctx.bezierCurveTo(cx + 14, cy - 50, cx + 15, cy - 44, cx + 18 + cropPuff * 0.4, cy - 36);
    ctx.bezierCurveTo(cx + 27 + cropPuff * 0.4, cy - 24, cx + 28, cy - 6, cx + 26, cy + 12);
    ctx.bezierCurveTo(cx + 15, cy + 31, cx - 15, cy + 31, cx - 26, cy + 12);
    ctx.closePath();

    ctx.fillStyle = radial(ctx, cx - 7, cy - 18, 52, clayLight, clayShadow, -0.3, -0.4);
    ctx.fill();

    // Col iridescent doux fusionné dans la gorge
    ctx.save();
    ctx.clip();

    const iridG = ctx.createLinearGradient(cx - 15, cy - 48, cx + 15, cy - 24);
    const phase = Math.sin(t * 1.8) * 0.15;
    iridG.addColorStop(0, IRID_GRAD[0]);
    iridG.addColorStop(clamp01(0.35 + phase), IRID_GRAD[1]);
    iridG.addColorStop(clamp01(0.68 + phase), IRID_GRAD[2]);
    iridG.addColorStop(1, IRID_GRAD[3]);

    ctx.globalAlpha = 0.85 * this.iridescenceIntensity;
    ctx.fillStyle = iridG;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 36, 19 + cropPuff * 0.4, 13 + cropPuff * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy - 37, 14, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Ventre lumineux
    const bellyG = ctx.createRadialGradient(cx, cy + 14, 4, cx, cy + 14, 26);
    bellyG.addColorStop(0, 'rgba(241, 245, 249, 0.45)');
    bellyG.addColorStop(1, 'rgba(138, 149, 172, 0)');
    ctx.fillStyle = bellyG;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Reflet spéculaire doux
    ctx.globalAlpha = 0.3;
    const specG = linear(ctx, cx - 22, cy - 28, cx + 4, cy - 4, clayHi, 'rgba(255,255,255,0)');
    ctx.fillStyle = specG;
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 16, 16, 22, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  _drawHead(ctx, hX, hY, hPitch, blinkL, blinkR, eyeShape, mouthOpen, bodyY, bodyPitch, cropPuff, t = 0) {
    ctx.save();
    const cx = 50 + hX;
    const cy = 40 + hY + bodyY * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate((hPitch + bodyPitch * 0.4) * Math.PI / 180);
    ctx.translate(-cx, -cy);

    ctx.beginPath();
    ctx.ellipse(cx, cy, 21.0, 22.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = radial(ctx, cx - 6, cy - 7, 28, clayHi, clayShadow, -0.35, -0.4);
    ctx.fill();

    if (eyeShape === 'happy') {
      ctx.save();
      ctx.fillStyle = blushC;
      ctx.filter = 'blur(2px)';
      ctx.beginPath(); ctx.ellipse(cx - 15, cy + 9, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 15, cy + 9, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Cire douce (Cere)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6.2, 6.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = radial(ctx, cx - 1, cy + 5, 8, cereC, cereShadow, -0.2, -0.3);
    ctx.fill();

    ctx.fillStyle = '#A39E96';
    ctx.beginPath(); ctx.ellipse(cx - 2.4, cy + 6.8, 0.8, 1.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 2.4, cy + 6.8, 0.8, 1.2, 0.3, 0, Math.PI * 2); ctx.fill();

    this._drawBeak(ctx, cx, cy + 11, mouthOpen);

    this._drawEye(ctx, cx - 15, cy - 3, blinkL, eyeShape, 'L');
    this._drawEye(ctx, cx + 15, cy - 3, blinkR, eyeShape, 'R');

    this._drawEyebrows(ctx, cx, cy, eyeShape);

    // Dessin des lunettes d'inspecteur / observateur scientifique lors des chargements et analyses
    if (this.isInspecting || this.action === 'think') {
      this._drawInspectorGlasses(ctx, cx, cy, t);
    }

    ctx.restore();
  }

  _drawInspectorGlasses(ctx, cx, cy, t = 0) {
    ctx.save();
    const eyeLeftX = cx - 15;
    const eyeRightX = cx + 15;
    const eyeY = cy - 3;
    const glassR = 9.5;

    // Monture dorée fine & chic
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 4;

    // Verre Gauche
    ctx.beginPath();
    ctx.arc(eyeLeftX, eyeY, glassR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
    ctx.fill();
    ctx.stroke();

    // Verre Droit
    ctx.beginPath();
    ctx.arc(eyeRightX, eyeY, glassR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
    ctx.fill();
    ctx.stroke();

    // Pont de nez
    ctx.beginPath();
    ctx.moveTo(eyeLeftX + glassR - 1, eyeY - 1);
    ctx.quadraticCurveTo(cx, eyeY - 3.5, eyeRightX - glassR + 1, eyeY - 1);
    ctx.stroke();

    // Branches
    ctx.beginPath();
    ctx.moveTo(eyeLeftX - glassR, eyeY - 1);
    ctx.lineTo(eyeLeftX - glassR - 5, eyeY - 3);
    ctx.moveTo(eyeRightX + glassR, eyeY - 1);
    ctx.lineTo(eyeRightX + glassR + 5, eyeY - 3);
    ctx.stroke();

    // Reflets lumineux blancs obliques
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(eyeLeftX - 4, eyeY - 4);
    ctx.lineTo(eyeLeftX - 1, eyeY - 7);
    ctx.moveTo(eyeRightX - 4, eyeY - 4);
    ctx.lineTo(eyeRightX - 1, eyeY - 7);
    ctx.stroke();

    // Icône de loupe animée au-dessus de la tête
    const floatY = Math.sin(t * 3.5) * 2.5;
    ctx.fillStyle = '#34D399';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText('🔍', cx + 16, cy - 22 + floatY);

    ctx.restore();
  }

  _drawBeak(ctx, cx, top, mouthOpen) {
    const gape = mouthOpen * 6.5;
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(cx - 5.8, top);
    ctx.quadraticCurveTo(cx, top - 6.5, cx + 5.8, top);
    ctx.quadraticCurveTo(cx + 1.8, top + 8 + gape * 0.1, cx, top + 11.5 + gape * 0.2);
    ctx.quadraticCurveTo(cx - 1.8, top + 8 + gape * 0.1, cx - 5.8, top);
    ctx.closePath();
    ctx.fillStyle = radial(ctx, cx, top - 1, 9, beakLight, beakShadow, 0, -0.5);
    ctx.fill();

    if (mouthOpen > 0.04) {
      ctx.beginPath();
      ctx.moveTo(cx - 3.8, top + 6.5);
      ctx.quadraticCurveTo(cx, top + 9 + gape, cx + 3.8, top + 6.5);
      ctx.quadraticCurveTo(cx, top + 10 + gape * 0.6, cx - 3.8, top + 6.5);
      ctx.fillStyle = '#6B2121';
      ctx.fill();

      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.ellipse(cx, top + 7.5 + gape * 0.4, 1.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    const dy = 7.5 + gape;
    ctx.moveTo(cx - 4.9, top + 2 + gape * 0.5);
    ctx.quadraticCurveTo(cx, top + dy, cx + 4.9, top + 2 + gape * 0.5);
    ctx.quadraticCurveTo(cx, top + dy - 3.2, cx - 4.9, top + 2 + gape * 0.5);
    ctx.fillStyle = linear(ctx, cx, top, cx, top + dy, beakBase, beakShadow);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, top - 2.2, 2.0, 1.1, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawEye(ctx, cx, cy, blinkAmt, shape, side) {
    const r = 8.8;
    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy + 0.5, r + 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (shape === 'sleep' || blinkAmt >= 0.95) {
      ctx.fillStyle = radial(ctx, cx, cy - r * 0.5, r * 1.5, clayHi, clayShadow, -0.2, -0.4);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy);
      ctx.quadraticCurveTo(cx, cy + 3.5, cx + 7, cy);
      ctx.stroke();
    } else if (shape === 'happy') {
      ctx.fillStyle = radial(ctx, cx, cy, r, cereC, cereShadow);
      ctx.fill();
      ctx.fillStyle = radial(ctx, cx, cy, r * 0.85, irisOuter, irisInner);
      ctx.fill();
      ctx.fillStyle = pupilC;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = radial(ctx, cx, cy - r * 0.4, r * 1.4, clayHi, clayShadow);
      ctx.beginPath();
      ctx.moveTo(cx - r - 1, cy - r - 1);
      ctx.lineTo(cx + r + 1, cy - r - 1);
      ctx.lineTo(cx + r + 1, cy + 2);
      ctx.quadraticCurveTo(cx, cy - 4, cx - r - 1, cy + 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = radial(ctx, cx, cy, r, cereC, cereShadow, -0.3, -0.3);
      ctx.fill();

      const irisR = r * 0.82;
      ctx.beginPath();
      ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
      ctx.fillStyle = radial(ctx, cx, cy, irisR, irisOuter, irisInner, -0.25, -0.3);
      ctx.fill();

      const pr = irisR * (shape === 'inquisitive' ? 0.44 : 0.52);
      const pOffsetX = shape === 'inquisitive' ? (side === 'L' ? 1.2 : -1.2) : 0.4;
      const pOffsetY = shape === 'inquisitive' ? -0.8 : 0.5;

      ctx.beginPath();
      ctx.arc(cx + pOffsetX, cy + pOffsetY, pr, 0, Math.PI * 2);
      ctx.fillStyle = pupilC;
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + pOffsetX - pr * 0.36, cy + pOffsetY - pr * 0.38, pr * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx + pOffsetX + pr * 0.4, cy + pOffsetY + pr * 0.4, pr * 0.2, 0, Math.PI * 2);
      ctx.fill();

      if (blinkAmt > 0.05) {
        const lidY = cy - r + blinkAmt * (r * 2);
        ctx.fillStyle = radial(ctx, cx, cy - r * 0.6, r * 1.5, clayHi, clayShadow, -0.2, -0.5);
        ctx.beginPath();
        ctx.rect(cx - r - 1, cy - r - 1, r * 2 + 2, lidY - (cy - r) + 1);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx - r, lidY);
        ctx.quadraticCurveTo(cx, lidY + 1.5, cx + r, lidY);
        ctx.stroke();
      }
    }

    ctx.restore();
    ctx.restore();
  }

  _drawEyebrows(ctx, cx, cy, shape) {
    ctx.save();
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    if (shape === 'inquisitive') {
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy - 14);
      ctx.quadraticCurveTo(cx - 15, cy - 18, cx - 10, cy - 14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 13);
      ctx.quadraticCurveTo(cx + 15, cy - 15, cx + 20, cy - 13);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawParticles(ctx) {
    if (!this.particles.length) return;
    ctx.save();
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);

      if (p.type === 'star') {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(Math.cos(i * Math.PI / 2) * p.size, Math.sin(i * Math.PI / 2) * p.size);
          ctx.lineTo(Math.cos(i * Math.PI / 2 + Math.PI / 4) * (p.size * 0.35), Math.sin(i * Math.PI / 2 + Math.PI / 4) * (p.size * 0.35));
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = '700 12px sans-serif';
        ctx.fillText('♫', -4, 4);
      }
      ctx.restore();
    });
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────
// PIGEON RENDERER CONTROLLER FOR APPS & STUDIO
// ─────────────────────────────────────────────────────────────
export class PigeonRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    if (!canvas) return;

    this.pigeon = new Pigeon(canvas);
    this.startTime = performance.now();
    this.loop = this.loop.bind(this);
    this.running = true;
    requestAnimationFrame(this.loop);
  }

  setAction(action, isSpeaking = false) {
    if (!this.pigeon) return;
    const tNow = (performance.now() - this.startTime) / 1000;
    this.pigeon.setAction(action, isSpeaking, tNow);
  }

  setInspecting(bool) {
    if (this.pigeon) this.pigeon.setInspecting(bool);
  }

  setSpeed(s) {
    if (this.pigeon) this.pigeon.setSpeed(s);
  }

  setIridescence(val) {
    if (this.pigeon) this.pigeon.setIridescence(val);
  }

  resize() {
    if (this.pigeon) {
      const elapsed = (performance.now() - this.startTime) / 1000;
      this.pigeon.draw(elapsed);
    }
  }

  loop(time) {
    if (!this.running || !this.pigeon) return;
    const elapsed = (time - this.startTime) / 1000;
    this.pigeon.draw(elapsed);
    requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
  }
}

// ─────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE VITALMASCOT API (for app chat & dashboard)
// ─────────────────────────────────────────────────────────────
export class VitalMascot {
  constructor(canvasId) {
    if (typeof document === 'undefined') return;
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!this.canvas) return;

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const initialW = this.canvas.offsetWidth || this.canvas.width || 100;
    const initialH = this.canvas.offsetHeight || this.canvas.height || 125;
    this.canvas.width = initialW * dpr;
    this.canvas.height = initialH * dpr;
    this.canvas.style.width = initialW + 'px';
    this.canvas.style.height = initialH + 'px';
    this.canvas.style.background = 'transparent';
    this.canvas.style.webkitTapHighlightColor = 'transparent';
    this.canvas.style.outline = 'none';
    this.canvas.style.userSelect = 'none';

    this.pigeon = new Pigeon(this.canvas);
    this.startTime = performance.now();
    this.loop = this.loop.bind(this);
    this.running = true;
    requestAnimationFrame(this.loop);

    // Click on canvas triggers playful in-place reaction without opening any popup/modal or rectangle overlay
    this.canvas.style.cursor = 'pointer';
    this.canvas.removeAttribute('title');
    const handleClick = (e) => {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      const actions = ['laugh', 'celebrate', 'coo', 'walk', 'think'];
      const next = actions[Math.floor(Math.random() * actions.length)];
      this.setAction(next);
      if (typeof window !== 'undefined' && window.triggerMascotInPlaceReaction) {
        window.triggerMascotInPlaceReaction(next);
      }
    };
    this.canvas.addEventListener('click', handleClick);
    this.canvas.addEventListener('touchend', (e) => {
      handleClick(e);
    }, { passive: true });
  }

  setMood(mood, isSpeaking = false) {
    if (!this.pigeon) return;
    this.pigeon.setMood(mood, isSpeaking);
  }

  setAction(action, isSpeaking = false) {
    if (!this.pigeon) return;
    const tNow = (performance.now() - this.startTime) / 1000;
    this.pigeon.setAction(action, isSpeaking, tNow);
  }

  setInspecting(bool) {
    if (this.pigeon) this.pigeon.setInspecting(bool);
  }

  loop(time) {
    if (!this.running || !this.pigeon) return;
    const elapsed = (time - this.startTime) / 1000;
    this.pigeon.draw(elapsed);
    requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
  }
}

if (typeof window !== 'undefined') {
  window.PigeonRenderer = PigeonRenderer;
  window.Pigeon = Pigeon;
  window.VitalMascot = VitalMascot;

  // ─────────────────────────────────────────────────────────────
  // STATIC PORTRAIT RENDERER (Circle clipped head for chat avatars)
  // ─────────────────────────────────────────────────────────────
  window.renderPigeonPortrait = function(size = 28, mood = 'talking', asImgTag = true) {
    const dpr = window.devicePixelRatio || 1;
    const offscreen = document.createElement('canvas');
    offscreen.width = 100 * dpr;
    offscreen.height = 125 * dpr;

    const p = new Pigeon(offscreen);
    p.setMood(mood);
    p.draw(0.4);

    const portrait = document.createElement('canvas');
    const pSize = size * dpr;
    portrait.width = pSize;
    portrait.height = pSize;
    const pCtx = portrait.getContext('2d');

    pCtx.beginPath();
    pCtx.arc(pSize / 2, pSize / 2, pSize / 2, 0, Math.PI * 2);
    pCtx.clip();

    // Draw head crop
    pCtx.drawImage(
      offscreen,
      20 * dpr, 10 * dpr, 60 * dpr, 60 * dpr,
      0, 0, pSize, pSize
    );

    const dataUrl = portrait.toDataURL();
    if (!asImgTag) return dataUrl;

    return `<img src="${dataUrl}" alt="Pigeon" style="width:${size}px; height:${size}px; border-radius:50%; object-fit:cover; display:inline-block; vertical-align:middle; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3));">`;
  };
}
