'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StripCalendar } from '@/components/ui/StripCalendar';
import { useFastingStore } from '@/stores/useFastingStore';
import { useMealsStore } from '@/stores/useMealsStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { getActiveCircadianSlot } from '@/lib/vitalism/circadian';
import { getCurrentFastingStage } from '@/lib/vitalism/autophagy';

export default function DashboardPage() {
  const { profile } = useProfileStore();
  const { activeSession, weightHistory } = useFastingStore();
  const { meals } = useMealsStore();

  const circadianSlot = getActiveCircadianSlot();
  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 70.0;

  // Compute Fasting Elapsed
  const elapsedHours = activeSession
    ? (Date.now() - activeSession.startTime) / (1000 * 60 * 60)
    : 0;
  const fastingStage = getCurrentFastingStage(elapsedHours);

  // Compute Today PRAL
  const todayPral = meals.reduce((acc, m) => acc + m.pral, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Circadian Hero Card */}
      <GlassCard className="p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐦</span>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Bonjour {profile.name} !
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tableau de Bord Vitaliste
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Votre organisme est actuellement en phase de <strong>« {circadianSlot.phase} »</strong> (Émonctoire : {circadianSlot.organ} {circadianSlot.emoji}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/scan">
              <Button variant="primary" size="md">
                <i className="ri-camera-lens-line text-lg" />
                <span>Scanner un repas</span>
              </Button>
            </Link>
            <Link href="/fasting">
              <Button variant="secondary" size="md">
                <i className="ri-fire-line text-lg text-emerald-500" />
                <span>{activeSession ? 'Suivre mon jeûne' : 'Démarrer un jeûne'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            🥗
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Repas du jour</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {meals.length}
            </div>
            <div className="text-[11px] font-semibold text-emerald-500">
              PRAL {todayPral > 0 ? `+${todayPral.toFixed(1)}` : todayPral.toFixed(1)}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            🔥
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">État du Jeûne</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {activeSession ? `${elapsedHours.toFixed(1)}h` : 'En pause'}
            </div>
            <div className="text-[11px] font-semibold text-amber-500 truncate max-w-[120px]">
              {activeSession ? fastingStage.name : 'Aucun jeûne actif'}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            ⚖️
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Dernière Pesée</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {latestWeight.toFixed(1)} kg
            </div>
            <div className="text-[11px] font-semibold text-slate-400">
              Cible : {profile.targetWeight} kg
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-500 border border-teal-500/30 flex items-center justify-center text-2xl flex-shrink-0">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400">Score de Vitalité</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-500">
              92 / 100
            </div>
            <div className="text-[11px] font-semibold text-emerald-400">
              Rayonnement optimal
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 7-Day Strip Calendar with Live Daily Routine Checklist */}
      <StripCalendar />

      {/* Circadian Clock Guidance Card */}
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{circadianSlot.emoji}</span>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Horloge Biologique Circadienne · {circadianSlot.organ} ({circadianSlot.hourStart}h00 - {circadianSlot.hourEnd}h00)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {circadianSlot.focusTip}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
