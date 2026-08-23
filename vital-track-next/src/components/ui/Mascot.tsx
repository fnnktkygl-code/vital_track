'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface MascotProps {
  className?: string;
}

const VITALIST_NUDGES = [
  "Pensez à boire une eau pure et faiblement minéralisée (< 50 mg/L) !",
  "L'autophagie recycle vos mitochondries usées pendant le jeûne !",
  "Les fruits mûrs bio fournissent une énergie électrique immédiate sans mucus.",
  "Un bol d'air frais stimule l'élimination pulmonaire !",
  "La cohérence cardiaque apaise le nerf vague et optimise la digestion.",
  "Roucoulement de vitalité : vos reins filtrent à merveille aujourd'hui !",
];

export const Mascot: React.FC<MascotProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speechText, setSpeechText] = useState<string>('');
  const [isSpeechVisible, setIsSpeechVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/audio/pigeon-coo-clean.mp3');
      audioRef.current.volume = 0.85;
    }
  }, []);

  const playCoo = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    // Show a random nudge
    const randomNudge = VITALIST_NUDGES[Math.floor(Math.random() * VITALIST_NUDGES.length)];
    setSpeechText(randomNudge);
    setIsSpeechVisible(true);
    setTimeout(() => setIsSpeechVisible(false), 5000);
  };

  // Canvas Animation loop for 3D Pigeon Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    let mouseX = 60;
    let mouseY = 60;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 + Math.sin(t * 1.5) * 2; // subtle organic float

      // Head / Body
      const headGrad = ctx.createRadialGradient(cx - 5, cy - 5, 5, cx, cy, 32);
      headGrad.addColorStop(0, '#C5CFE2');
      headGrad.addColorStop(0.6, '#8A95AC');
      headGrad.addColorStop(1, '#505970');

      // Iridescent Neck Ring
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 24, 12, 0, 0, Math.PI * 2);
      const iridGrad = ctx.createLinearGradient(cx - 24, cy, cx + 24, cy);
      iridGrad.addColorStop(0, '#34D399');
      iridGrad.addColorStop(0.5, '#2DD4BF');
      iridGrad.addColorStop(1, '#818CF8');
      ctx.fillStyle = iridGrad;
      ctx.fill();
      ctx.restore();

      // Main Head
      ctx.beginPath();
      ctx.ellipse(cx, cy, 28, 30, 0, 0, Math.PI * 2);
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Eyes tracking mouse
      const leftEyeX = cx - 11;
      const rightEyeX = cx + 11;
      const eyeY = cy - 4;

      const dx = (mouseX - cx) / w;
      const dy = (mouseY - cy) / h;
      const gazeX = Math.max(-2, Math.min(2, dx * 3));
      const gazeY = Math.max(-2, Math.min(2, dy * 3));

      // Left Eye
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FB923C';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#EA580C';
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(leftEyeX + gazeX, eyeY + gazeY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#141416';
      ctx.fill();
      // Eye Glint
      ctx.beginPath();
      ctx.arc(leftEyeX + gazeX - 1, eyeY + gazeY - 1, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FB923C';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#EA580C';
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(rightEyeX + gazeX, eyeY + gazeY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#141416';
      ctx.fill();
      // Eye Glint
      ctx.beginPath();
      ctx.arc(rightEyeX + gazeX - 1, eyeY + gazeY - 1, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Cere (White nose bump)
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#F5F2EB';
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 7);
      ctx.quadraticCurveTo(cx, cy + 18 + Math.sin(t * 3) * 1.5, cx + 5, cy + 7);
      ctx.fillStyle = '#353942';
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-2xl flex items-center justify-center text-xl hover:scale-110 transition-all border-2 border-emerald-400 cursor-pointer"
        title="Ouvrir la mascotte VitalTrack"
      >
        🐦
      </button>
    );
  }

  return (
    <div className={cn("fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2 select-none", className)}>
      {/* Speech Bubble */}
      {isSpeechVisible && (
        <div className="max-w-xs p-3.5 rounded-2xl bg-slate-900/95 border border-emerald-500/40 text-slate-100 text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 leading-relaxed relative mr-2">
          <div className="flex items-center gap-2 mb-1 text-emerald-400 font-bold">
            <span>🐦 Martinet Vitaliste</span>
          </div>
          <p>{speechText}</p>
          <div className="absolute -bottom-2 right-6 w-3 h-3 bg-slate-900 border-r border-b border-emerald-500/40 rotate-45" />
        </div>
      )}

      {/* Mascot Card */}
      <div className="flex items-center gap-3 p-2 pl-3 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl hover:border-emerald-500/50 transition-all">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={playCoo}
            className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
          >
            💬 Roucouler
          </button>
          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="hover:text-white transition-colors"
              title={soundEnabled ? 'Couper le son' : 'Activer le son'}
            >
              {soundEnabled ? '🔊 Son ON' : '🔇 Muet'}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="hover:text-white transition-colors ml-1"
              title="Réduire"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div
          onClick={playCoo}
          className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
          title="Cliquer pour interagir avec la mascotte"
        >
          <canvas ref={canvasRef} width={80} height={80} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
