'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';

export default function BreathingPage() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inspire' | 'retention' | 'expire' | 'ready'>('ready');
  const [counter, setCounter] = useState(4);
  const [rounds, setRounds] = useState(1);

  useEffect(() => {
    let timer: any;
    if (isActive) {
      if (counter > 0) {
        timer = setTimeout(() => setCounter(counter - 1), 1000);
      } else {
        // Cycle phases
        if (phase === 'inspire') {
          setPhase('retention');
          setCounter(7);
        } else if (phase === 'retention') {
          setPhase('expire');
          setCounter(8);
        } else if (phase === 'expire') {
          setPhase('inspire');
          setCounter(4);
          setRounds((r) => r + 1);
        } else {
          setPhase('inspire');
          setCounter(4);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isActive, counter, phase]);

  const toggleSession = () => {
    if (isActive) {
      setIsActive(false);
      setPhase('ready');
      setCounter(4);
    } else {
      setIsActive(true);
      setPhase('inspire');
      setCounter(4);
      setRounds(1);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Respiration & Cohérence Cardiaque (4-7-8)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Stimulation du nerf vague, oxygénation cellulaire et drainage lymphatique
        </p>
      </div>

      <GlassCard className="p-8 sm:p-12 space-y-6 flex flex-col items-center justify-center min-h-[380px]">
        {/* Breathing Circle with Apple Spring Animation */}
        <div
          className={`w-44 h-44 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-1000 shadow-2xl ${
            phase === 'inspire'
              ? 'scale-125 bg-emerald-500/20 border-emerald-400 shadow-emerald-500/30'
              : phase === 'retention'
              ? 'scale-125 bg-amber-500/20 border-amber-400 shadow-amber-500/30'
              : phase === 'expire'
              ? 'scale-90 bg-purple-500/20 border-purple-400 shadow-purple-500/30'
              : 'bg-slate-800 border-slate-700'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-widest text-slate-300">
            {phase === 'inspire' ? 'Inspirez' : phase === 'retention' ? 'Bloquez' : phase === 'expire' ? 'Expirez' : 'Prêt'}
          </div>
          <div className="text-4xl font-black text-white font-mono my-1">
            {isActive ? counter : '🫁'}
          </div>
          {isActive && (
            <div className="text-[10px] text-slate-400 font-bold">
              Cycle {rounds}
            </div>
          )}
        </div>

        <Button
          variant={isActive ? 'danger' : 'primary'}
          size="lg"
          onClick={toggleSession}
          className="font-black px-8"
        >
          {isActive ? 'Arrêter la séance' : 'Commencer l\'exercice'}
        </Button>
      </GlassCard>
    </div>
  );
}
