/**
 * Mascot.js — Pigeon Biset VitalTrack 3D / Organique & Fluide
 * Moteur de rendu Canvas haute fidélité avec cinématique réaliste
 * Actions : idle, walk (head-bobbing), fly, laugh, coo (jabot), think, peck, celebrate, sleep
 */

// ─────────────────────────────────────────────────────────────
// PALETTE BIOMÉCANIQUE & SHADING 3D
// ─────────────────────────────────────────────────────────────
const clayBase = '#8D97AE';
const clayShadow = '#555E75';
const clayDeep = '#3B4254';
const clayLight = '#CBD5E1';
const clayHi = '#F1F5F9';

// Col iridescent dynamique (émeraude, sarcelle, indigo, améthyste)
const IRID_COLORS = [
  '#4ADE80', // Émeraude vif
  '#2DD4BF', // Sarcelle lagon
  '#818CF8', // Indigo doux
  '#C084FC'  // Améthyste violet
];

// Bec & Cire
const beakBase = '#3E424B';
const beakShadow = '#242730';
const beakLight = '#5C606E';
const cereC = '#FAF8F5';
const cereShadow = '#D4CECA';

// Yeux (Iris orange concentrique & pupille vitreuse)
const irisOuter = '#FB923C';
const irisInner = '#EA580C';
const pupilC = '#18181B';

// Pattes & Griffes
const footBase = '#E27C72';
const footShadow = '#B54C43';
const clawC = '#27272A';

// Barres alaires & Nuances
const barDark = '#2B303C';
const blushC = 'rgba(255, 115, 130, 0.35)';

// ─────────────────────────────────────────────────────────────
// MATH & INTERPOLATION HELPERS
// ─────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
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
// PIGEON RENDERER (Canvas 100 x 125 normalised coordinate space)
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
    this.transStart = 0;
    this.transDur = 0.35;
    this.fromAction = 'idle';
    this.toAction = 'idle';
    this.transitioning = false;
    this.particles = [];
  }

  setAction(action, isSpeaking = false, tNow) {
    if (!action) action = 'idle';
    if (tNow === undefined) tNow = performance.now() / 1000;
    if (action === this.action && isSpeaking === this.isSpeaking) return;

    this.fromAction = this.action;
    this.action = action;
    this.toAction = action;
    this.isSpeaking = isSpeaking;
    this.transStart = tNow;
    this.transitioning = true;

    // Spawn burst particles on celebrate / laugh
    if (action === 'celebrate' || action === 'laugh') {
      this._spawnParticles(action);
    }
  }

  setMood(mood, isSpeaking = false) {
    // Backward compatibility with previous mood names
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
      scared: 'fly'
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
    const count = type === 'celebrate' ? 12 : 6;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: 50 + (Math.random() - 0.5) * 40,
        y: 60 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 45,
        vy: -20 - Math.random() * 35,
        size: 2.5 + Math.random() * 3.5,
        life: 1.0,
        decay: 0.6 + Math.random() * 0.4,
        type: type === 'celebrate' ? (Math.random() > 0.5 ? 'star' : 'sparkle') : 'note',
        color: ['#FBBF24', '#34D399', '#60A5FA', '#F472B6'][Math.floor(Math.random() * 4)]
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
    const scale = W / 100;

    // Base time scaled by speed
    const t = tNow * this.speed;
    const dt = 0.016 * this.speed;
    this._updateParticles(dt);

    // Dynamic animation parameters based on active action
    const act = this.action;
    let bodyY = 0, bodyTilt = 0, bodyRoll = 0;
    let headX = 0, headY = 0, headTilt = 0, headScale = 1.0;
    let wingAngleL = 0, wingAngleR = 0, wingSpan = 1.0;
    let footL_Y = 0, footL_Rot = 0, footR_Y = 0, footR_Rot = 0;
    let tailAngle = 0, tailSpread = 1.0;
    let cropPuff = 0; // Gonflement du jabot / gorge
    let eyeBlinkL = 0, eyeBlinkR = 0, eyeShape = 'round';
    let mouthOpen = 0;
    let shadowScale = 1.0, shadowAlpha = 0.18;

    // Natural blinking
    const blinkCycle = (t % 3.6);
    if (blinkCycle > 3.42) {
      const u = (blinkCycle - 3.42) / 0.18;
      eyeBlinkL = Math.sin(Math.PI * u);
      eyeBlinkR = Math.sin(Math.PI * Math.min(1, u * 1.1));
    }

    // ───────────────────────────────────────────────
    // ACTION CINEMATICS
    // ───────────────────────────────────────────────
    if (act === 'idle') {
      // Gentle breathing & micro-bobs
      const breathe = Math.sin(t * Math.PI * 2 / 2.4);
      bodyY = breathe * 0.8;
      headY = Math.sin(t * Math.PI * 2 / 2.4 + 0.8) * 1.2;
      wingAngleL = -5 + Math.sin(t * Math.PI * 2 / 2.0) * 2;
      wingAngleR = 5 - Math.sin(t * Math.PI * 2 / 2.0) * 2;
      tailAngle = Math.sin(t * Math.PI * 2 / 3.2) * 2.5;
    } else if (act === 'walk') {
      // Realistic pigeon gait : head thrusts forward then stays fixed as body moves
      const walkCycle = (t * 2.8) % (Math.PI * 2);
      const walkPhase = Math.sin(walkCycle);
      const walkCos = Math.cos(walkCycle);

      // Head-bobbing characteristic of Columba livia
      headX = Math.max(0, Math.sin(walkCycle * 2)) * 4.5;
      headY = Math.sin(walkCycle * 2) * 1.8;
      bodyY = Math.abs(walkPhase) * 2.2;
      bodyTilt = walkCos * 3.5;

      // Alternating footsteps with knee bend and foot lift
      footL_Y = Math.max(0, -walkPhase) * 6;
      footL_Rot = -walkPhase * 25;
      footR_Y = Math.max(0, walkPhase) * 6;
      footR_Rot = walkPhase * 25;

      wingAngleL = -8 + walkPhase * 4;
      wingAngleR = 8 + walkPhase * 4;
      tailAngle = walkCos * 6;
    } else if (act === 'fly') {
      // In-flight hovering with wide wing flapping
      const flapFreq = t * 6.5;
      const flap = Math.sin(flapFreq);
      bodyY = -12 + flap * 3.5;
      headY = -12 + flap * 1.5;
      shadowScale = 0.55 - flap * 0.1;
      shadowAlpha = 0.08;

      wingAngleL = flap * 75 - 15;
      wingAngleR = -flap * 75 + 15;
      wingSpan = 1.35;

      footL_Y = -6; footL_Rot = 35;
      footR_Y = -6; footR_Rot = 35;
      tailAngle = Math.sin(t * 3) * 4;
      tailSpread = 1.3;
    } else if (act === 'laugh') {
      // Bouncy joyful laughter
      const laughFreq = t * 7.0;
      const bounce = Math.abs(Math.sin(laughFreq));
      bodyY = -bounce * 4.5;
      headY = -bounce * 6.0;
      headTilt = Math.sin(t * 3.5) * 5;
      mouthOpen = 0.4 + bounce * 0.45;
      eyeShape = 'happy';
      wingAngleL = -30 - bounce * 25;
      wingAngleR = 30 + bounce * 25;
      tailAngle = Math.sin(laughFreq) * 8;
    } else if (act === 'coo') {
      // Cooing / Talking with puffed crop (throat)
      const cooCycle = Math.sin(t * 3.2);
      cropPuff = Math.max(0, cooCycle) * 7.0;
      headY = -cooCycle * 2.0;
      headTilt = -cooCycle * 4.0;
      mouthOpen = 0.25 + Math.max(0, cooCycle) * 0.5;
      wingAngleL = -15 + cooCycle * 6;
      wingAngleR = 15 - cooCycle * 6;
      tailAngle = cooCycle * 4;
    } else if (act === 'think') {
      // Inquisitive head tilt
      headTilt = 22;
      headX = 2.5;
      headY = -1.5;
      eyeShape = 'inquisitive';
      wingAngleL = -18;
      wingAngleR = 8;
      tailAngle = 3;
    } else if (act === 'peck') {
      // Fast downward pecking cycle
      const peckCycle = (t * 2.2) % 1.0;
      let peckT = 0;
      if (peckCycle < 0.35) {
        peckT = Math.sin((peckCycle / 0.35) * Math.PI);
      }
      headY = peckT * 22;
      headX = peckT * 8;
      headTilt = peckT * 42;
      bodyTilt = peckT * 12;
      tailAngle = -peckT * 18;
      mouthOpen = peckT * 0.3;
    } else if (act === 'celebrate') {
      // Victory leap & star burst
      const jumpCycle = Math.sin(t * 4.5);
      const jump = Math.max(0, jumpCycle);
      bodyY = -jump * 9.0;
      headY = -jump * 11.0;
      wingAngleL = -85 + jump * 20;
      wingAngleR = 85 - jump * 20;
      wingSpan = 1.3;
      eyeShape = 'happy';
      mouthOpen = 0.7;
      shadowScale = 0.65;
    } else if (act === 'sleep') {
      // Sleep & calm breathing
      const sleepBreathe = Math.sin(t * Math.PI * 2 / 4.0);
      bodyY = 3 + sleepBreathe * 0.6;
      headY = 5 + sleepBreathe * 0.8;
      eyeShape = 'sleep';
      eyeBlinkL = 1.0; eyeBlinkR = 1.0;
      wingAngleL = -4; wingAngleR = 4;
      tailAngle = 0;
    }

    if (this.isSpeaking && act !== 'sleep') {
      mouthOpen = Math.max(mouthOpen, 0.35 + 0.45 * Math.abs(Math.sin(t * 12)));
    }

    // ───────────────────────────────────────────────
    // CANVAS DRAW EXECUTION
    // ───────────────────────────────────────────────
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.scale(scale, scale);

    // Ground Shadow
    this._drawGroundShadow(ctx, shadowScale, shadowAlpha);

    // Tail Feathers (behind body)
    this._drawTail(ctx, tailAngle, tailSpread, bodyY);

    // Feet (articulated)
    this._drawFeet(ctx, footL_Y, footL_Rot, footR_Y, footR_Rot, bodyY);

    // Left Wing (back)
    this._drawWing(ctx, 'L', wingAngleL, wingSpan, bodyY);

    // Body & Crop (Pectoral muscle & belly)
    this._drawBody(ctx, bodyY, bodyTilt, bodyRoll, cropPuff);

    // Iridescent Neck Collar
    this._drawCollar(ctx, bodyY, headX, headY, headTilt, cropPuff, t);

    // Right Wing (front)
    this._drawWing(ctx, 'R', wingAngleR, wingSpan, bodyY);

    // Head & Facial Features
    this._drawHead(ctx, headX, headY, headTilt, eyeBlinkL, eyeBlinkR, eyeShape, mouthOpen, bodyY, cropPuff);

    // Particle FX
    this._drawParticles(ctx);

    ctx.restore();
  }

  _drawGroundShadow(ctx, scaleRatio, alpha) {
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(50, 118, 26 * scaleRatio, 6 * scaleRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, angleDeg, spread, bodyY) {
    ctx.save();
    ctx.translate(50, 94 + bodyY);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.scale(spread, 1.0);

    // 3 layered rectrices (tail feathers)
    const g = linear(ctx, 0, 0, 0, 26, clayBase, clayDeep);
    ctx.fillStyle = g;

    // Central feather
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.bezierCurveTo(-18, 14, -10, 26, -4, 28);
    ctx.quadraticCurveTo(0, 30, 4, 28);
    ctx.bezierCurveTo(10, 26, 18, 14, 16, -2);
    ctx.closePath();
    ctx.fill();

    // Dark terminal band (barre caudale sombre)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = barDark;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(0, 26, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feather shafts (rachis)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 28);
    ctx.moveTo(-7, 2); ctx.lineTo(-6, 26);
    ctx.moveTo(7, 2); ctx.lineTo(6, 26);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  _drawFeet(ctx, lY, lRot, rY, rRot, bodyY) {
    const drawSingleFoot = (cx, cy, yOffset, rotDeg) => {
      ctx.save();
      ctx.translate(cx, cy + bodyY - yOffset);
      ctx.rotate(rotDeg * Math.PI / 180);

      // Thigh plume shadow
      ctx.fillStyle = clayShadow;
      ctx.beginPath();
      ctx.ellipse(0, -11, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tarsus (jambe écailleuse)
      ctx.fillStyle = linear(ctx, -2, -10, 2, 0, footBase, footShadow);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-2.2, -10, 4.4, 11, 2.2) : ctx.rect(-2.2, -10, 4.4, 11);
      ctx.fill();

      // 3 Toes with claws (3 doigts antérieurs)
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

        // Claw tip (griffe noire)
        ctx.fillStyle = clawC;
        ctx.beginPath();
        ctx.ellipse(t.dx + Math.sin(t.rot) * 2.8, t.dy + Math.cos(t.rot) * 2.8, 1.1, 1.4, t.rot, 0, Math.PI * 2);
        ctx.fill();
      });

      // Posterior toe (hallux)
      ctx.fillStyle = footShadow;
      ctx.beginPath();
      ctx.ellipse(0, -1.5, 1.8, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawSingleFoot(39, 109, lY, lRot);
    drawSingleFoot(61, 109, rY, rRot);
  }

  _drawBody(ctx, bodyY, tilt, roll, cropPuff) {
    ctx.save();
    const cx = 50, cy = 82 + bodyY;
    ctx.translate(cx, cy);
    ctx.rotate(tilt * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Main 3D clay body egg silhouette
    ctx.beginPath();
    ctx.moveTo(cx - 27 - cropPuff * 0.3, cy - 8);
    ctx.bezierCurveTo(cx - 28 - cropPuff * 0.5, cy - 26, cx - 15, cy - 34, cx, cy - 34);
    ctx.bezierCurveTo(cx + 15, cy - 34, cx + 28 + cropPuff * 0.5, cy - 26, cx + 27 + cropPuff * 0.3, cy - 8);
    ctx.bezierCurveTo(cx + 26, cy + 14, cx + 15, cy + 31, cx, cy + 32);
    ctx.bezierCurveTo(cx - 15, cy + 31, cx - 26, cy + 14, cx - 27 - cropPuff * 0.3, cy - 8);
    ctx.closePath();

    ctx.fillStyle = radial(ctx, cx - 7, cy - 18, 50, clayLight, clayShadow, -0.3, -0.4);
    ctx.fill();

    // Belly soft ambient warmth (ventre légèrement plus clair)
    ctx.save();
    ctx.clip();
    const bellyG = ctx.createRadialGradient(cx, cy + 14, 4, cx, cy + 14, 26);
    bellyG.addColorStop(0, 'rgba(241, 245, 249, 0.45)');
    bellyG.addColorStop(1, 'rgba(141, 151, 174, 0)');
    ctx.fillStyle = bellyG;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 12, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pectoral specular highlight (reflet modelé 3D)
    ctx.globalAlpha = 0.35;
    const specG = linear(ctx, cx - 22, cy - 28, cx + 4, cy - 4, clayHi, 'rgba(255,255,255,0)');
    ctx.fillStyle = specG;
    ctx.beginPath();
    ctx.ellipse(cx - 10, cy - 18, 16, 24, -0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _drawWing(ctx, side, angleDeg, span, bodyY) {
    const right = side === 'R';
    const m = right ? 1 : -1;
    const px = right ? 70 : 30, py = 56 + bodyY;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angleDeg * Math.PI / 180);
    ctx.scale(m * span, span);

    // Anatomical wing contour (épaule, coude et pennes rémiges)
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.bezierCurveTo(14, -11, 20, -2, 19, 16);
    ctx.bezierCurveTo(18, 34, 15, 52, 9, 62);
    ctx.bezierCurveTo(3, 56, 1, 42, 1, 26);
    ctx.bezierCurveTo(1, 10, 0, -2, 2, -10);
    ctx.closePath();

    ctx.fillStyle = linear(ctx, 0, -10, 0, 60, clayLight, clayShadow);
    ctx.fill();

    // Dual black wing bars (les 2 barres alaires noires caractéristiques)
    ctx.save();
    ctx.clip();

    ctx.fillStyle = barDark;
    ctx.globalAlpha = 0.88;

    // Bar 1 (haute)
    ctx.beginPath();
    ctx.moveTo(1, 21);
    ctx.bezierCurveTo(10, 19, 17, 22, 17, 28);
    ctx.bezierCurveTo(10, 26, 2, 27, 1, 30);
    ctx.closePath();
    ctx.fill();

    // Bar 2 (basse)
    ctx.beginPath();
    ctx.moveTo(1, 37);
    ctx.bezierCurveTo(9, 35, 14, 38, 13, 44);
    ctx.bezierCurveTo(8, 42, 2, 43, 1, 46);
    ctx.closePath();
    ctx.fill();

    // Wingtip primary flight feathers gradient
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = barDark;
    ctx.beginPath();
    ctx.ellipse(8, 58, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Feather separator ridge (relief 3D)
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(1, -8);
    ctx.quadraticCurveTo(0, 25, 4, 58);
    ctx.stroke();

    // Wing shoulder specular edge (lumière rasante)
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(3, -8);
    ctx.quadraticCurveTo(15, -8, 18, 4);
    ctx.stroke();

    ctx.restore();
  }

  _drawCollar(ctx, bodyY, headX, headY, headTilt, cropPuff, t) {
    ctx.save();
    const cx = 50 + headX * 0.5, cy = 56 + bodyY;
    ctx.translate(cx, cy);
    ctx.rotate(headTilt * 0.3 * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Organic wavy neck collar boundary
    ctx.beginPath();
    ctx.moveTo(26 - cropPuff * 0.4, 55);
    ctx.bezierCurveTo(23 - cropPuff * 0.5, 64, 26, 73, 33, 75);
    ctx.bezierCurveTo(37, 76.5, 39, 70, 42, 66);
    ctx.bezierCurveTo(45, 70, 46, 77 + cropPuff * 0.3, 50, 83 + cropPuff * 0.4);
    ctx.bezierCurveTo(54, 77 + cropPuff * 0.3, 55, 70, 58, 66);
    ctx.bezierCurveTo(61, 70, 63, 76.5, 67, 75);
    ctx.bezierCurveTo(74, 73, 77 + cropPuff * 0.5, 64, 74 + cropPuff * 0.4, 55);
    ctx.quadraticCurveTo(50, 62 + cropPuff * 0.2, 26 - cropPuff * 0.4, 55);
    ctx.closePath();

    // Dynamic Iridescent Multi-Stop Gradient (shifts with time and motion)
    const phase = (Math.sin(t * 1.5) * 0.15);
    const g = ctx.createLinearGradient(cx, 50, cx, 83 + cropPuff * 0.4);
    g.addColorStop(0, IRID_COLORS[0]);
    g.addColorStop(clamp01(0.38 + phase), IRID_COLORS[1]);
    g.addColorStop(clamp01(0.68 + phase), IRID_COLORS[2]);
    g.addColorStop(1, IRID_COLORS[3]);

    ctx.fillStyle = g;
    ctx.globalAlpha = 0.85 * this.iridescenceIntensity + 0.15;
    ctx.fill();

    // Shimmering feather barbules
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(32, 64);
    ctx.quadraticCurveTo(50, 70 + cropPuff * 0.3, 68, 64);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.moveTo(42, 66); ctx.quadraticCurveTo(43, 73, 40, 79);
    ctx.moveTo(58, 66); ctx.quadraticCurveTo(57, 73, 60, 79);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  _drawHead(ctx, hX, hY, hTilt, blinkL, blinkR, eyeShape, mouthOpen, bodyY, cropPuff) {
    ctx.save();
    const cx = 50 + hX, cy = 40 + hY + bodyY * 0.5;
    ctx.translate(cx, cy);
    ctx.rotate(hTilt * Math.PI / 180);
    ctx.translate(-cx, -cy);

    // Cranial silhouette (tête ronde en argile douce 3D)
    ctx.beginPath();
    ctx.ellipse(cx, cy, 21.0, 22.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = radial(ctx, cx - 6, cy - 7, 28, clayHi, clayShadow, -0.35, -0.4);
    ctx.fill();

    // Cheeks subtle blush
    if (eyeShape === 'happy') {
      ctx.save();
      ctx.fillStyle = blushC;
      ctx.filter = 'blur(2px)';
      ctx.beginPath(); ctx.ellipse(cx - 15, cy + 9, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx + 15, cy + 9, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Cere (Cire blanche crayeuse au-dessus du bec)
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6.2, 6.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = radial(ctx, cx - 1, cy + 5, 8, cereC, cereShadow, -0.2, -0.3);
    ctx.fill();

    // Nostril notches (narines délicates)
    ctx.fillStyle = '#A39E96';
    ctx.beginPath(); ctx.ellipse(cx - 2.4, cy + 6.8, 0.8, 1.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 2.4, cy + 6.8, 0.8, 1.2, 0.3, 0, Math.PI * 2); ctx.fill();

    // Beak (Bec)
    this._drawBeak(ctx, cx, cy + 11, mouthOpen);

    // Eyes (Yeux vivants)
    this._drawEye(ctx, cx - 15, cy - 3, blinkL, eyeShape, 'L');
    this._drawEye(ctx, cx + 15, cy - 3, blinkR, eyeShape, 'R');

    // Subtle brow expression
    this._drawEyebrows(ctx, cx, cy, eyeShape);

    ctx.restore();
  }

  _drawBeak(ctx, cx, top, mouthOpen) {
    const gape = mouthOpen * 6.5;
    ctx.save();

    // Upper mandible (mandibule supérieure)
    ctx.beginPath();
    ctx.moveTo(cx - 5.8, top);
    ctx.quadraticCurveTo(cx, top - 6.5, cx + 5.8, top);
    ctx.quadraticCurveTo(cx + 1.8, top + 8 + gape * 0.1, cx, top + 11.5 + gape * 0.2);
    ctx.quadraticCurveTo(cx - 1.8, top + 8 + gape * 0.1, cx - 5.8, top);
    ctx.closePath();
    ctx.fillStyle = radial(ctx, cx, top - 1, 9, beakLight, beakShadow, 0, -0.5);
    ctx.fill();

    // Beak interior / tongue if open
    if (mouthOpen > 0.04) {
      ctx.beginPath();
      ctx.moveTo(cx - 3.8, top + 6.5);
      ctx.quadraticCurveTo(cx, top + 9 + gape, cx + 3.8, top + 6.5);
      ctx.quadraticCurveTo(cx, top + 10 + gape * 0.6, cx - 3.8, top + 6.5);
      ctx.fillStyle = '#6B2121';
      ctx.fill();

      // Tongue tip (langue rose)
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.ellipse(cx, top + 7.5 + gape * 0.4, 1.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lower mandible (mandibule inférieure)
    ctx.beginPath();
    const dy = 7.5 + gape;
    ctx.moveTo(cx - 4.9, top + 2 + gape * 0.5);
    ctx.quadraticCurveTo(cx, top + dy, cx + 4.9, top + 2 + gape * 0.5);
    ctx.quadraticCurveTo(cx, top + dy - 3.2, cx - 4.9, top + 2 + gape * 0.5);
    ctx.fillStyle = linear(ctx, cx, top, cx, top + dy, beakBase, beakShadow);
    ctx.fill();

    // Specular shine on beak culmen (arête dorsale brillante)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, top - 2.2, 2.0, 1.1, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawEye(ctx, cx, cy, blinkAmt, shape, side) {
    const r = 8.8;
    ctx.save();

    // Eye socket ambient shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(cx, cy + 0.5, r + 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Clip to eyeball circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (shape === 'sleep' || blinkAmt >= 0.95) {
      // Eyelids fully closed (paupières avec cils doux)
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
      // Crescent happy eye (^ ^)
      ctx.fillStyle = radial(ctx, cx, cy, r, cereC, cereShadow);
      ctx.fill();
      ctx.fillStyle = radial(ctx, cx, cy, r * 0.85, irisOuter, irisInner);
      ctx.fill();
      ctx.fillStyle = pupilC;
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.fill();

      // Curved happy lid
      ctx.fillStyle = radial(ctx, cx, cy - r * 0.4, r * 1.4, clayHi, clayShadow);
      ctx.beginPath();
      ctx.moveTo(cx - r - 1, cy - r - 1);
      ctx.lineTo(cx + r + 1, cy - r - 1);
      ctx.lineTo(cx + r + 1, cy + 2);
      ctx.quadraticCurveTo(cx, cy - 4, cx - r - 1, cy + 2);
      ctx.closePath();
      ctx.fill();
    } else {
      // Standard / Inquisitive Eye with dual concentric iris rings
      // Sclera (blanc doux)
      ctx.fillStyle = radial(ctx, cx, cy, r, cereC, cereShadow, -0.3, -0.3);
      ctx.fill();

      // Outer vibrant orange iris ring
      const irisR = r * 0.82;
      ctx.beginPath();
      ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
      ctx.fillStyle = radial(ctx, cx, cy, irisR, irisOuter, irisInner, -0.25, -0.3);
      ctx.fill();

      // Deep dark pupil
      const pr = irisR * (shape === 'inquisitive' ? 0.44 : 0.52);
      const pOffsetX = shape === 'inquisitive' ? (side === 'L' ? 1.2 : -1.2) : 0.4;
      const pOffsetY = shape === 'inquisitive' ? -0.8 : 0.5;

      ctx.beginPath();
      ctx.arc(cx + pOffsetX, cy + pOffsetY, pr, 0, Math.PI * 2);
      ctx.fillStyle = pupilC;
      ctx.fill();

      // Primary crisp white catchlight (reflet vitreux principal)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + pOffsetX - pr * 0.36, cy + pOffsetY - pr * 0.38, pr * 0.38, 0, Math.PI * 2);
      ctx.fill();

      // Secondary specular glint (micro-reflet diffus)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(cx + pOffsetX + pr * 0.4, cy + pOffsetY + pr * 0.4, pr * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Upper eyelid blink overlay if partially blinking
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
      // One brow raised
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

  setSpeed(s) {
    if (this.pigeon) this.pigeon.setSpeed(s);
  }

  setIridescence(val) {
    if (this.pigeon) this.pigeon.setIridescence(val);
  }

  resize() {
    // Re-render immediately on scale change
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
    this.canvas.width = 100 * dpr;
    this.canvas.height = 125 * dpr;
    this.canvas.style.width = '100px';
    this.canvas.style.height = '125px';

    this.pigeon = new Pigeon(this.canvas);
    this.startTime = performance.now();
    this.loop = this.loop.bind(this);
    this.running = true;
    requestAnimationFrame(this.loop);

    // Click on canvas opens HD Studio modal in the app!
    this.canvas.style.cursor = 'pointer';
    this.canvas.title = 'Cliquez pour ouvrir la vue Grand Plan HD de la Mascotte';
    this.canvas.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window !== 'undefined' && window.openMascotStudioModal) {
        window.openMascotStudioModal();
      }
    });
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
  window.renderPigeonPortrait = function(size = 28, mood = 'talking') {
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

    return portrait.toDataURL();
  };
}

