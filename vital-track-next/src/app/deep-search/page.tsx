'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProfileStore } from '@/stores/useProfileStore';

export default function DeepSearchPage() {
  const { profile } = useProfileStore();
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    setReport(null);

    // Simulated Deep Clinical Synthesis
    setTimeout(() => {
      setReport({
        score: 88,
        summary: `Synthèse clinique pour ${profile.name} : terrain présentant une excellente réactivité cellulaire avec légère acidose résiduelle. Les émonctoires rénal et lymphatique doivent être stimulés par des jus de fruits astringents et des tisanes diurétiques.`,
        emunctories: [
          { name: 'Reins & Filtration', status: 'Filtration active (bonne élimination des sédiments)', score: 85 },
          { name: 'Côlon & Muqueuses', status: 'Transit régulier, absence d\'encrassement mucogène', score: 92 },
          { name: 'Foie & Vésicule', status: 'Capacité de détoxification hépatique optimale', score: 90 },
          { name: 'Système Lymphatique', status: 'Stase modérée nécessitant mouvement et hydratation ionisée', score: 78 },
          { name: 'Peau & Poumons', status: 'Élimination sudoripare et gazeuse normale', score: 88 },
        ],
        recommendations: [
          'Introduire 500 ml de jus de raisin noir ou de pastèque à jeun au réveil.',
          'Conserver une fenêtre de repos digestif quotidien de 16h minimum.',
          'Pratiquer 10 minutes de cohérence cardiaque et de brossage à sec de la lymphe.',
        ],
      });
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bilan Clinique Global & Deep Search
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Raisonnement approfondi multi-émonctoires, analyse de terrain et synthèse RAG (Gemini 3.7 Flash)
        </p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleGenerateReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Décrivez vos symptômes, vos bilans ou votre objectif clinique :
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              placeholder="Ex: Fatigue au réveil, sensation de lourdeur après les repas, langue chargée, souhait de régénération rénale..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-700 bg-slate-900 text-white text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500"
              required
            />
          </div>

          <Button type="submit" variant="primary" size="lg" isLoading={isGenerating}>
            <i className="ri-microscope-line text-lg" />
            <span>Générer le Bilan Clinique Approfondi</span>
          </Button>
        </form>
      </GlassCard>

      {report && (
        <GlassCard className="p-6 space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">
                Rapport de Vitalité Synthétisé
              </h3>
              <p className="text-xs text-slate-400">
                Généré selon les protocoles Dr. Morse & Arnold Ehret
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold">Score Global</div>
              <div className="text-2xl font-black text-emerald-400">{report.score} / 100</div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 leading-relaxed">
            {report.summary}
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              État des 5 Émonctoires
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.emunctories.map((em: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{em.name}</span>
                    <span className="text-xs font-black text-emerald-400">{em.score}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{em.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Plan d&apos;Action Recommandé
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {report.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
