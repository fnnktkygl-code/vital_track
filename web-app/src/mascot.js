/**
 * Mascot.js — Pigeon Biset VitalTrack
 * Portage HTML5 Canvas fidèle au nouveau CustomPainter Flutter
 * Design réaliste : iris orange, bandes alaires sombres, col iridescent
 */

// ─────────────────────────────────────────────────────────────
// PALETTE
// ─────────────────────────────────────────────────────────────
const clayBase = '#8D97AE', clayShadow = '#656E85', clayLight = '#B7C1D6', clayHi = '#E2E7F0';
const tealA = '#5FCDA6', tealB = '#3E9678', tealC = '#5D77C4', tealD = '#7C57A8';
const beakBase = '#4A4D57', beakShadow = '#2E303A', beakLight = '#6C6F7C';
const footBase = '#E27C72', footShadow = '#B54C43';
const cereC = '#E9E6E1', cereShadow = '#C9C5BE';
const irisOuter = '#FFA64D', irisInner = '#E0630E', pupilC = '#201C18';
const barDark = '#3A3F4E';
const blushC = 'rgba(255,120,120,0.30)';

function radial(ctx, x,y,r, c1, c2, fx=-0.3, fy=-0.35){
  const g = ctx.createRadialGradient(x+fx*r, y+fy*r, r*0.05, x, y, r);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}
function linear(ctx, x0,y0,x1,y1,c1,c2){
  const g = ctx.createLinearGradient(x0,y0,x1,y1);
  g.addColorStop(0,c1); g.addColorStop(1,c2);
  return g;
}
function lerp(a,b,t){ return a+(b-a)*t; }
function easeOutCubic(t){ return 1-Math.pow(1-t,3); }
function clamp01(t){ return Math.max(0, Math.min(1,t)); }

// ─────────────────────────────────────────────────────────────
// MOOD → NUMERIC POSE
// ─────────────────────────────────────────────────────────────
const MOODS = {
  neutral:    { eyeOpen:1, eyeShape:0, browY:-1, browCurve:1,  browOn:1, mouth:0.15, wingL:-6,  wingR:6,  blush:0, extra:'' },
  talking:    { eyeOpen:1, eyeShape:0, browY:-1, browCurve:1,  browOn:1, mouth:0.35, wingL:-14, wingR:8,  blush:0, extra:'' },
  excited:    { eyeOpen:1, eyeShape:1, browY:-2, browCurve:1,  browOn:1, mouth:1.0,  wingL:-95, wingR:95, blush:0.5, extra:'stars' },
  questioning:{ eyeOpen:1, eyeShape:2, browY:-1, browCurve:-1, browOn:1, mouth:0.25, wingL:-38, wingR:6,  blush:0, extra:'question' },
  sad:        { eyeOpen:1, eyeShape:5, browY:0,  browCurve:-0.5,browOn:1,mouth:-0.6, wingL:-4,  wingR:4,  blush:0.4, extra:'tear' },
  loving:     { eyeOpen:1, eyeShape:3, browY:-1, browCurve:1,  browOn:0, mouth:0.35, wingL:-4,  wingR:4,  blush:0.9, extra:'hearts' },
  proud:      { eyeOpen:1, eyeShape:0, browY:-1, browCurve:1,  browOn:1, mouth:0.35, wingL:-22, wingR:8,  blush:0.2, extra:'' },
  sleepy:     { eyeOpen:0, eyeShape:4, browY:-1, browCurve:0,  browOn:0, mouth:-0.2, wingL:-4,  wingR:4,  blush:0.5, extra:'zzz' },
  stern:      { eyeOpen:1, eyeShape:2, browY:1,  browCurve:-1, browOn:1, mouth:-0.5, wingL:-28, wingR:8,  blush:0, extra:'' },
  scared:     { eyeOpen:1, eyeShape:1, browY:-2, browCurve:1,  browOn:1, mouth:1.0,  wingL:-16, wingR:16, blush:0, extra:'sweat' },
};

function lerpPose(a,b,t){
  const out = {};
  for(const k in a){
    if(typeof a[k] === 'number') out[k] = lerp(a[k], b[k], t);
    else out[k] = t < 0.5 ? a[k] : b[k];
  }
  out._eyeShapeFrom = a.eyeShape; out._eyeShapeTo = b.eyeShape;
  out._extraFrom = a.extra; out._extraTo = b.extra;
  out._crossT = t;
  return out;
}

// ─────────────────────────────────────────────────────────────
// PIGEON RENDERER — design space 100 x 122
// ─────────────────────────────────────────────────────────────
class Pigeon {
  constructor(canvas) {
    this.canvas = canvas;
    if (!canvas) return;
    this.ctx = canvas.getContext('2d');
    this.mood = 'talking';
    this.isSpeaking = false;
    this.pose = {...MOODS.talking};
    this.fromPose = {...MOODS.talking};
    this.toPose = {...MOODS.talking};
    this.transStart = 0;
    this.transDur = 0.38;
    this.transitioning = false;
  }

  setMood(mood, isSpeaking, tNow){
    if (!MOODS[mood]) mood = 'talking';
    if(tNow === undefined) tNow = performance.now()/1000;
    if(mood === this.mood && isSpeaking === this.isSpeaking) return;
    this.fromPose = this._currentTarget(tNow);
    this.mood = mood; this.isSpeaking = isSpeaking;
    this.toPose = this._targetPose();
    this.transStart = tNow; this.transitioning = true;
  }

  _targetPose(){
    const base = MOODS[this.mood] || MOODS.talking;
    if(this.isSpeaking && this.mood !== 'sleepy'){
      return {...base, mouth: 0.8};
    }
    return base;
  }

  _currentTarget(tNow){
    if(!this.transitioning) return this.toPose;
    const td = clamp01((tNow-this.transStart)/this.transDur);
    return lerpPose(this.fromPose, this.toPose, easeOutCubic(td));
  }

  draw(tNow){
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.canvas.width, H = this.canvas.height;
    const scale = W/100;

    let pose;
    if(this.transitioning){
      const td = clamp01((tNow-this.transStart)/this.transDur);
      pose = lerpPose(this.fromPose, this.toPose, easeOutCubic(td));
      if(td >= 1) this.transitioning = false;
    } else {
      pose = this.toPose;
      pose._eyeShapeFrom = pose.eyeShape; pose._eyeShapeTo = pose.eyeShape; pose._crossT = 1;
      pose._extraFrom = pose.extra; pose._extraTo = pose.extra;
    }
    this.lastPose = pose;

    const breathe = Math.sin(tNow*Math.PI*2/3.0);
    const headBob = Math.sin(tNow*Math.PI*2/3.0 + 1.1);
    const wingIdleL = Math.sin(tNow*Math.PI*2/2.6);
    const wingIdleR = Math.sin(tNow*Math.PI*2/2.6 + Math.PI*0.8);
    const tailSway = Math.sin(tNow*Math.PI*2/4.2);

    function blinkFor(period, phaseOffset, duration){
      const cyc = ((tNow+phaseOffset) % period);
      const start = period - duration;
      if(cyc < start) return 1;
      const u = (cyc-start)/duration;
      return 1 - Math.sin(Math.PI*u);
    }
    let blinkL = blinkFor(4.4, 0, 0.32);
    let blinkR = blinkFor(4.4, 0.05, 0.30);
    if(pose.eyeOpen < 0.5){
      blinkL = 0.1 + 0.05*(1+Math.sin(tNow*2)); blinkR = blinkL;
    }

    let mouthOpen = pose.mouth;
    if(this.isSpeaking){
      mouthOpen = clamp01(0.35 + 0.45*Math.max(0, Math.sin(tNow*Math.PI*2*2.6)));
    }

    ctx.save();
    ctx.clearRect(0,0,W,H);
    ctx.scale(scale, scale);
    ctx.translate(0, headBob*0.5);

    this._drawShadow(ctx);
    this._drawTail(ctx, tailSway*3);
    this._drawWing(ctx, 'L', pose.wingL + wingIdleL*3, breathe);
    this._drawWing(ctx, 'R', pose.wingR + wingIdleR*3, breathe);
    this._drawBody(ctx, breathe);
    this._drawFeet(ctx);
    this._drawHead(ctx, pose, blinkL, blinkR, mouthOpen, headBob);
    this._drawExtras(ctx, pose);
    ctx.restore();
  }

  _drawShadow(ctx){
    ctx.save();
    ctx.filter = 'blur(2.5px)';
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(50,117,24,5,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  _drawBody(ctx, breathe){
    ctx.save();
    const cx=50, cy=82;
    const bw = 27 + breathe*0.4, bh = 32 + breathe*0.6;
    ctx.translate(cx,cy);
    ctx.scale(bw/27, bh/32);
    ctx.translate(-cx,-cy);

    ctx.beginPath();
    ctx.moveTo(cx-27, cy-8);
    ctx.bezierCurveTo(cx-28, cy-24, cx-15, cy-33, cx, cy-33);
    ctx.bezierCurveTo(cx+15, cy-33, cx+28, cy-24, cx+27, cy-8);
    ctx.bezierCurveTo(cx+26, cy+12, cx+15, cy+30, cx, cy+31);
    ctx.bezierCurveTo(cx-15, cy+30, cx-26, cy+12, cx-27, cy-8);
    ctx.closePath();
    ctx.fillStyle = radial(ctx, cx-8, cy-16, 48, clayLight, clayShadow);
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.3;
    const g = linear(ctx, cx-20,cy-26, cx+6,cy+2, clayHi, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx-10, cy-16, 15, 22, -0.5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  _drawWing(ctx, side, angleDeg, breathe){
    const right = side==='R';
    const m = right ? 1 : -1;
    const px = right ? 70 : 30, py = 55;
    ctx.save();
    ctx.translate(px,py);
    ctx.rotate(angleDeg*Math.PI/180);

    const wing = new Path2D();
    wing.moveTo(m*2,-9);
    wing.bezierCurveTo(m*13,-10, m*18,-1, m*17,16);
    wing.bezierCurveTo(m*17,32, m*14,48, m*8,59);
    wing.bezierCurveTo(m*3,54, m*1,41, m*1,26);
    wing.bezierCurveTo(m*1,10, m*0,-2, m*2,-9);
    wing.closePath();

    ctx.fillStyle = linear(ctx, 0,-9,0,58, clayLight, clayShadow);
    ctx.fill(wing);

    ctx.save();
    ctx.clip(wing);
    ctx.fillStyle = barDark;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(m*1,20); ctx.bezierCurveTo(m*10,18,m*16,21,m*16,27);
    ctx.bezierCurveTo(m*9,25,m*2,26,m*1,29); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(m*1,35); ctx.bezierCurveTo(m*8,33,m*13,36,m*12,42);
    ctx.bezierCurveTo(m*7,40,m*2,41,m*1,44); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = barDark;
    ctx.beginPath(); ctx.ellipse(m*7,55,7,9,0,0,Math.PI*2); ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(m*1,-7); ctx.quadraticCurveTo(m*0,24,m*3,56); ctx.stroke();

    ctx.globalAlpha=0.4;
    ctx.strokeStyle='rgba(255,255,255,0.55)';
    ctx.lineWidth=1.3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(m*3,-7); ctx.quadraticCurveTo(m*14,-7,m*17,3); ctx.stroke();

    ctx.restore();
  }

  _drawTail(ctx, sway){
    ctx.save();
    ctx.translate(50,92);
    ctx.rotate(sway*Math.PI/180);
    const tail = new Path2D();
    tail.moveTo(-16,-2);
    tail.bezierCurveTo(-17,12,-11,24,-5,28);
    tail.quadraticCurveTo(0,30,5,28);
    tail.bezierCurveTo(11,24,17,12,16,-2);
    tail.closePath();
    ctx.fillStyle = linear(ctx,0,-2,0,28, clayLight, clayShadow);
    ctx.fill(tail);
    ctx.save();
    ctx.clip(tail);
    ctx.fillStyle = barDark; ctx.globalAlpha=0.55;
    ctx.beginPath(); ctx.ellipse(0,27,17,7,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-5,2); ctx.lineTo(-3,25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5,2); ctx.lineTo(3,25); ctx.stroke();
    ctx.restore();
  }

  _drawCollar(ctx){
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(27,55);
    ctx.bezierCurveTo(24,63, 27,71, 34,73);
    ctx.bezierCurveTo(38,74.5, 40,69, 42,65);
    ctx.bezierCurveTo(45,69, 46,75, 50,81);
    ctx.bezierCurveTo(54,75, 55,69, 58,65);
    ctx.bezierCurveTo(60,69, 62,74.5, 66,73);
    ctx.bezierCurveTo(73,71, 76,63, 73,55);
    ctx.quadraticCurveTo(50,61, 27,55);
    ctx.closePath();

    const g = ctx.createLinearGradient(50,50,50,81);
    g.addColorStop(0,   '#79D9B8');
    g.addColorStop(0.4, '#5FBFA0');
    g.addColorStop(0.68,'#7C8FD0');
    g.addColorStop(1,   '#9A6DCB');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle='rgba(0,0,0,0.10)'; ctx.lineWidth=1.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(42,65); ctx.quadraticCurveTo(43,72,40,78); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(58,65); ctx.quadraticCurveTo(57,72,60,78); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.ellipse(50,56,30,6,0,0,Math.PI*2); ctx.fill();
    ctx.restore();

    ctx.globalAlpha=0.5;
    ctx.strokeStyle='rgba(255,255,255,0.65)';
    ctx.lineWidth=1.8; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(33,63); ctx.quadraticCurveTo(50,68,67,63);
    ctx.stroke();
    ctx.restore();
  }

  _drawHead(ctx, pose, blinkL, blinkR, mouthOpen, headBob){
    ctx.save();
    const cx=50, cy=40;

    this._drawCollar(ctx);

    ctx.beginPath();
    ctx.ellipse(cx,cy,20.5,21.5,0,0,Math.PI*2);
    ctx.fillStyle = radial(ctx, cx-6, cy-7, 26, clayHi, clayShadow, -0.35,-0.4);
    ctx.fill();

    if(pose.blush > 0.01){
      ctx.globalAlpha = pose.blush;
      ctx.fillStyle = blushC;
      ctx.filter='blur(2px)';
      ctx.beginPath(); ctx.ellipse(33,49,6,4,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(67,49,6,4,0,0,Math.PI*2); ctx.fill();
      ctx.filter='none'; ctx.globalAlpha=1;
    }

    ctx.beginPath();
    ctx.ellipse(50,46,6,3.4,0,0,Math.PI*2);
    ctx.fillStyle = radial(ctx,49,45,7,cereC,cereShadow);
    ctx.fill();

    this._drawBeak(ctx, mouthOpen);

    this._drawEye(ctx, 35,37, pose, blinkL, 'L');
    this._drawEye(ctx, 65,37, pose, blinkR, 'R');

    this._drawBrow(ctx, 35,29, pose, false);
    this._drawBrow(ctx, 65,29, pose, true);

    ctx.restore();
  }

  _drawBeak(ctx, mouthOpen){
    const cx=50, top=51;
    const gape = mouthOpen*6;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx-5.5, top+1);
    ctx.quadraticCurveTo(cx, top-7, cx+5.5, top+1);
    ctx.quadraticCurveTo(cx+1.6, top+8+gape*0.15, cx, top+11+gape*0.25);
    ctx.quadraticCurveTo(cx-1.6, top+8+gape*0.15, cx-5.5, top+1);
    ctx.closePath();
    ctx.fillStyle = radial(ctx,cx,top-1,8,beakLight,beakShadow,0,-0.6);
    ctx.fill();

    if(mouthOpen > 0.05){
      ctx.beginPath();
      ctx.moveTo(cx-3.6, top+7);
      ctx.quadraticCurveTo(cx, top+9+gape, cx+3.6, top+7);
      ctx.quadraticCurveTo(cx, top+10+gape*0.6, cx-3.6, top+7);
      ctx.fillStyle = '#5C2A2A';
      ctx.fill();
    }

    ctx.beginPath();
    const dy = 7+gape;
    ctx.moveTo(cx-4.8, top+2+gape*0.5);
    ctx.quadraticCurveTo(cx, top+dy, cx+4.8, top+2+gape*0.5);
    ctx.quadraticCurveTo(cx, top+dy-3, cx-4.8, top+2+gape*0.5);
    ctx.fillStyle = linear(ctx,cx,top,cx,top+dy,beakBase,beakShadow);
    ctx.fill();

    ctx.fillStyle='rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.ellipse(cx-1.5, top-2, 1.8, 1, -0.3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  _drawEye(ctx, cx, cy, pose, blink, side){
    const r = 8.6;
    const shapeFrom = pose._eyeShapeFrom, shapeTo = pose._eyeShapeTo, ct = pose._crossT;

    ctx.save();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.clip();
    this._drawEyeShape(ctx,cx,cy,r,shapeFrom, ct<1? 1-Math.min(ct*2,1):0);
    this._drawEyeShape(ctx,cx,cy,r,shapeTo, ct>0? Math.min(ct*2,1):1);

    const closeAmt = 1-blink;
    if(closeAmt > 0.01){
      const lidY = cy - r + closeAmt*(r*2);
      ctx.beginPath();
      ctx.rect(cx-r-1, cy-r-1, r*2+2, (lidY-(cy-r))+1);
      ctx.fillStyle = radial(ctx,cx,cy-r*0.6,r*1.4,clayHi,clayShadow,-0.2,-0.5);
      ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(cx-r,lidY); ctx.quadraticCurveTo(cx,lidY+1.3,cx+r,lidY); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  _drawEyeShape(ctx,cx,cy,r,shape,alpha){
    if(alpha<=0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if(shape===4){
      ctx.strokeStyle=clayShadow; ctx.lineWidth=2.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(cx-7,cy); ctx.quadraticCurveTo(cx,cy-6,cx+7,cy); ctx.stroke();
      ctx.restore(); return;
    }
    if(shape===3){
      const hr = r*0.95;
      ctx.beginPath();
      ctx.moveTo(cx,cy+hr);
      ctx.bezierCurveTo(cx-hr*1.4,cy+hr*0.1, cx-hr*0.9,cy-hr*1.1, cx,cy-hr*0.15);
      ctx.bezierCurveTo(cx+hr*0.9,cy-hr*1.1, cx+hr*1.4,cy+hr*0.1, cx,cy+hr);
      ctx.closePath();
      ctx.fillStyle = radial(ctx,cx-2,cy-2,hr*1.6,'#FF9FC6','#D8437E',-0.2,-0.3);
      ctx.fill();
      ctx.restore(); return;
    }
    const rr = shape===1 ? r*1.06 : r*0.96;
    ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2);
    ctx.fillStyle = radial(ctx,cx,cy,rr,cereC,cereShadow,-0.3,-0.35);
    ctx.fill();

    const irisR = rr*0.8;
    ctx.beginPath(); ctx.arc(cx,cy,irisR,0,Math.PI*2);
    ctx.fillStyle = radial(ctx,cx,cy,irisR, irisOuter, irisInner, -0.25,-0.3);
    ctx.fill();

    const pr = irisR*0.5;
    const px=cx+0.5, py=cy+0.6;
    ctx.beginPath(); ctx.arc(px,py,pr,0,Math.PI*2); ctx.fillStyle=pupilC; ctx.fill();
    ctx.beginPath(); ctx.arc(px-pr*0.32,py-pr*0.35,pr*0.34,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();

    if(shape===2 || shape===5){
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2); ctx.clip();
      const topCover = shape===2 ? rr*0.55 : rr*0.15;
      const botCover = shape===2 ? rr*0.05 : rr*0.55;
      ctx.fillStyle = radial(ctx,cx,cy-rr*0.6,rr*1.3,clayHi,clayShadow,-0.2,-0.5);
      ctx.beginPath(); ctx.rect(cx-rr-1,cy-rr-1, rr*2+2, (cy-topCover)-(cy-rr)+1); ctx.fill();
      ctx.beginPath(); ctx.rect(cx-rr-1,cy+botCover-1, rr*2+2, rr-botCover+2); ctx.fill();
      ctx.restore();
      if(shape===5){
        const tx=cx+rr*0.75, ty=cy+rr*0.5;
        ctx.beginPath();
        ctx.moveTo(tx,ty-2.4);
        ctx.bezierCurveTo(tx+2,ty,tx+2,ty+3.4,tx,ty+3.4);
        ctx.bezierCurveTo(tx-2,ty+3.4,tx-2,ty,tx,ty-2.4);
        ctx.closePath();
        ctx.fillStyle = radial(ctx,tx-0.6,ty-0.6,3,'#FFFFFF','#63B9EE',-0.2,-0.2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawBrow(ctx, cx, cy, pose, flip){
    if(pose.browOn < 0.02) return;
    const f = flip ? -1 : 1;
    const curve = pose.browCurve;
    ctx.save();
    ctx.globalAlpha = pose.browOn;
    ctx.strokeStyle = '#4C4D7A';
    ctx.lineWidth = 2.2; ctx.lineCap='round';
    const y = cy + pose.browY*0.6;
    ctx.beginPath();
    const startY = y + (curve<0 ? -curve*2.5*f : 0);
    const ctrlY = y - curve*4;
    const endX = cx+6.5, endY = y + (curve<0 ? curve*3*f : 0);
    ctx.moveTo(cx-6.5, startY);
    ctx.quadraticCurveTo(cx, ctrlY, endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  _drawFeet(ctx){
    const foot=(cx,cy)=>{
      ctx.save();
      ctx.fillStyle = linear(ctx,cx,cy-10,cx,cy,footBase,footShadow);
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(cx-2.4,cy-10,4.8,10,2.4) : ctx.rect(cx-2.4,cy-10,4.8,10);
      ctx.fill();
      ctx.fillStyle = footBase;
      [[-4,3],[0,4.5],[4,3]].forEach(([dx,dy])=>{
        ctx.beginPath(); ctx.ellipse(cx+dx,cy+dy,2.6,4,dx*0.05,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
    };
    foot(39,109); foot(61,109);
  }

  _drawExtras(ctx, pose){
    const from = pose._extraFrom, to = pose._extraTo, ct = pose._crossT;
    const draw = (type, alpha)=>{
      if(!type || alpha<=0.01) return;
      ctx.save(); ctx.globalAlpha=alpha;
      ctx.font='700 11px sans-serif'; ctx.textBaseline='alphabetic';
      if(type==='stars'){ ctx.fillStyle='#fff'; ctx.fillText('✦',10,24); ctx.fillText('✦',82,16); }
      if(type==='question'){ ctx.fillStyle='#8C7BCC'; ctx.font='800 16px sans-serif'; ctx.fillText('?',16,22); }
      if(type==='zzz'){ ctx.fillStyle='#6B8FC8'; ctx.font='800 14px sans-serif'; ctx.fillText('z',70,26); ctx.font='800 18px sans-serif'; ctx.fillText('Z',80,14); }
      if(type==='hearts'){ ctx.fillStyle='#FF6FA0'; ctx.font='12px sans-serif'; ctx.fillText('♥',12,24); ctx.fillText('♥',82,18); }
      if(type==='sweat'){ ctx.fillStyle='#8AB6E8'; ctx.beginPath(); ctx.ellipse(20,24,2.2,3.4,0,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    };
    draw(from, 1-ct); draw(to, ct);
  }
}

// ─────────────────────────────────────────────────────────────
// BACKWARD-COMPATIBLE API (wraps Pigeon as VitalMascot)
// ─────────────────────────────────────────────────────────────
class VitalMascot {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = 100 * dpr;
    this.canvas.height = 122 * dpr;
    this.canvas.style.width = '100px';
    this.canvas.style.height = '122px';

    this.pigeon = new Pigeon(this.canvas);
    this.startTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setMood(mood, isSpeaking = false) {
    if (!this.pigeon) return;
    const tNow = (performance.now() - this.startTime) / 1000;
    this.pigeon.setMood(mood, isSpeaking, tNow);
  }

  loop(time) {
    if (!this.pigeon) return;
    const elapsed = (time - this.startTime) / 1000;
    this.pigeon.draw(elapsed);
    requestAnimationFrame(this.loop);
  }
}

window.VitalMascot = VitalMascot;

// ─────────────────────────────────────────────────────────────
// STATIC PORTRAIT RENDERER (head-only, clipped circle, no animation)
// ─────────────────────────────────────────────────────────────
window.renderPigeonPortrait = function(size = 28, mood = 'talking') {
  const dpr = window.devicePixelRatio || 1;
  const offscreen = document.createElement('canvas');
  offscreen.width = 100 * dpr;
  offscreen.height = 122 * dpr;

  const p = new Pigeon(offscreen);
  p.mood = mood;
  p.toPose = {...(MOODS[mood] || MOODS.talking)};
  p.toPose._eyeShapeFrom = p.toPose.eyeShape;
  p.toPose._eyeShapeTo = p.toPose.eyeShape;
  p.toPose._crossT = 1;
  p.toPose._extraFrom = p.toPose.extra;
  p.toPose._extraTo = p.toPose.extra;
  p.draw(0);

  const portrait = document.createElement('canvas');
  const pSize = size * dpr;
  portrait.width = pSize;
  portrait.height = pSize;
  const pCtx = portrait.getContext('2d');

  pCtx.beginPath();
  pCtx.arc(pSize / 2, pSize / 2, pSize / 2, 0, Math.PI * 2);
  pCtx.clip();

  // Head region: x=22..78, y=13..69 in the 100x122 design space
  const srcX = 22 * dpr;
  const srcY = 13 * dpr;
  const srcW = 56 * dpr;
  const srcH = 56 * dpr;
  pCtx.drawImage(offscreen, srcX, srcY, srcW, srcH, 0, 0, pSize, pSize);

  return `<img src="${portrait.toDataURL()}" width="${size}" height="${size}" style="border-radius:50%;display:block" alt="Pigeon mascot">`;
};
