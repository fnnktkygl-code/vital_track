'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PopoverDatePicker } from '@/components/ui/PopoverDatePicker';
import { useFastingStore } from '@/stores/useFastingStore';
import { FASTING_STAGES, getCurrentFastingStage } from '@/lib/vitalism/autophagy';
import { formatLocalDate } from '@/lib/utils';

export default function FastingPage() {
  const { activeSession, startFast, stopFast, weightHistory, addWeightEntry, deleteWeightEntry } = useFastingStore();
  const [selectedWeightDate, setSelectedWeightDate] = useState<string>(() => formatLocalDate(new Date()));
  const [weightValue, setWeightValue] = useState<string>('70.0');
  const [weightNote, setWeightNote] = useState<string>('');
  const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(false);

  const elapsedHours = activeSession
    ? (Date.now() - activeSession.startTime) / (1000 * 60 * 60)
    : 0;

  const currentStage = getCurrentFastingStage(elapsedHours);

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(weightValue);
    if (!isNaN(num) && num > 20 && num < 300) {
      addWeightEntry({
        date: selectedWeightDate,
        weight: num,
        note: weightNote,
      });
      setIsWeightModalOpen(false);
      setWeightNote('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Jeûne & Physiologie Cellulaire
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Suivi des 7 phases d&apos;autophagie, cétogenèse et régénération des émonctoires
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsWeightModalOpen(true)}
          className="gap-2"
        >
          <i className="ri-scales-3-line text-lg" />
          <span>Enregistrer une pesée</span>
        </Button>
      </div>

      {/* Main Fasting Timer Card */}
      <GlassCard className="p-6 sm:p-8 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800">
        <div className="max-w-md mx-auto space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/10">
            {activeSession ? '🔥' : '⏳'}
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-1">
              {activeSession ? `Jeûne en cours (${activeSession.type})` : 'Prêt pour le prochain jeûne'}
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono my-2">
              {activeSession ? `${elapsedHours.toFixed(2)}h` : '00:00:00'}
            </div>
            <p className="text-xs text-slate-400">
              {activeSession
                ? `Phase actuelle : ${currentStage.name}`
                : 'Activez l\'autophagie pour régénérer vos émonctoires et détoxifier vos cellules.'}
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {activeSession ? (
              <Button
                variant="danger"
                size="lg"
                onClick={() => stopFast('Fin de jeûne')}
                className="w-full max-w-xs font-black"
              >
                <i className="ri-stop-circle-line text-xl" />
                <span>Rompre le jeûne</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => startFast(16, '16:8')}
                className="w-full max-w-xs font-black"
              >
                <i className="ri-play-circle-line text-xl" />
                <span>Démarrer le jeûne 16:8</span>
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 7 Stages of Autophagy Progression */}
      <GlassCard className="p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🧬</span> 7 Phases d&apos;Autophagie & Dynamique Cellulaire
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FASTING_STAGES.map((st) => {
            const isReached = elapsedHours >= st.minHours && activeSession;
            const isCurrent = currentStage.id === st.id && activeSession;

            return (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg'
                    : isReached
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{st.emoji}</span>
                    <span className="text-xs font-bold">{st.name}</span>
                  </div>
                  <Badge variant={isReached ? 'emerald' : 'neutral'}>
                    {st.minHours}h - {st.maxHours > 100 ? '∞' : `${st.maxHours}h`}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{st.description}</p>
                <ul className="text-[10px] space-y-0.5 text-slate-500">
                  {st.biologicalProcesses.map((p, idx) => (
                    <li key={idx}>• {p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Weight History Table with Popover Date Picker */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>⚖️</span> Historique des Pesées
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {weightHistory.length} pesées enregistrées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Poids (kg)</th>
                <th className="py-2.5 px-3">Note / Contexte</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {weightHistory.map((w) => (
                <tr key={w.id} className="hover:bg-white/5">
                  <td className="py-3 px-3 font-semibold text-white">{w.date}</td>
                  <td className="py-3 px-3 font-black text-emerald-400">{w.weight.toFixed(1)} kg</td>
                  <td className="py-3 px-3 text-slate-400">{w.note || '—'}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => deleteWeightEntry(w.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Supprimer"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Weight Modal with Popover DatePicker */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="ri-scales-3-line text-emerald-400" />
                <span>Enregistrer une pesée</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWeightModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWeight} className="space-y-4">
              <PopoverDatePicker
                label="Date de la pesée :"
                value={selectedWeightDate}
                onChange={setSelectedWeightDate}
              />

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Poids (kg) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-white text-base font-black focus:border-emerald-500 outline-none"
                  placeholder="70.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Note / Contexte (optionnel) :
                </label>
                <input
                  type="text"
                  value={weightNote}
                  onChange={(e) => setWeightNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-white text-xs focus:border-emerald-500 outline-none"
                  placeholder="Ex: à jeun au réveil, fin de jeûne..."
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full">
                  Valider la pesée
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
