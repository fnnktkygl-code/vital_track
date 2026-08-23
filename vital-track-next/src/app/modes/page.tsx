'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useProfileStore } from '@/stores/useProfileStore';

export default function ModesPage() {
  const { profile, setProfile, setCustomGeminiKey } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'ai-context' | 'security'>('profile');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const userContextString = `[BIO-CONTEXTE VITALTRACK]
Identité: ${profile.name} (${profile.age} ans, ${profile.currentWeight}kg, objectif: ${profile.targetWeight}kg)
Biorégion: ${profile.bioregion} | Pays: ${profile.country} | Ville: ${profile.city}
Protocole Actif: ${profile.protocol}
Restrictions: ${profile.restrictions || 'Aucune restriction déclarée'}
Mémoires: ${profile.memories || 'Aucune'}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Protocoles, Profil & Paramètres
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Calibrez vos approches vitalistes, vos émonctoires et la mémoire contextuelle de votre Coach IA
          </p>
        </div>

        {isSaved && (
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black animate-in zoom-in-95">
            ✓ Profil enregistré avec succès !
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          1. Profil & Objectifs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai-context')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ai-context'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          2. Contexte & Directives IA
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          3. Clé API Gemini
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Profile & Goals */}
        {activeTab === 'profile' && (
          <GlassCard className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Prénom ou Pseudo :
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Protocole de Santé Vitaliste :
                </label>
                <select
                  value={profile.protocol}
                  onChange={(e) => setProfile({ protocol: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                >
                  <option value="VITALIST">Approche Hygiéniste Globale (PRAL & Vivant)</option>
                  <option value="SEBI">Dr. Sebi (Alimentation Bio-Électrique Cellulaire)</option>
                  <option value="EHRET">Arnold Ehret (Régime Sans Mucus & Jeûne Rationnel)</option>
                  <option value="MORSE">Dr. Robert Morse (Détoxination Lymphatique & Fruits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Poids Actuel (kg) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.currentWeight}
                  onChange={(e) => setProfile({ currentWeight: parseFloat(e.target.value) || 70 })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Poids Cible (kg) :
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.targetWeight}
                  onChange={(e) => setProfile({ targetWeight: parseFloat(e.target.value) || 68 })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </GlassCard>
        )}

        {/* Tab 2: AI Context & Bioregion */}
        {activeTab === 'ai-context' && (
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xl">
                <i className="ri-brain-line" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Climat, Allergies & Directives Coach IA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Règles de sécurité absolues et consignes libres mémorisées par l&apos;intelligence artificielle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pays :
                </label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ country: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  placeholder="France 🇫🇷, Québec ⚜️..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ville :
                </label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  placeholder="Paris, Montréal..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Biorégion / Climat :
                </label>
                <select
                  value={profile.bioregion}
                  onChange={(e) => setProfile({ bioregion: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                >
                  <option value="boreal">🌲 Boréale / Nordique (Canada, Scandinavie)</option>
                  <option value="temperate">🍂 Tempérée Océanique / Continentale (France, Europe)</option>
                  <option value="mediterranean">☀️ Méditerranéenne / Subtropicale (Sud Europe, USA)</option>
                  <option value="tropical">🌴 Tropicale / Équatoriale (Antilles, Afrique, Asie)</option>
                  <option value="arid">🌵 Aride / Désertique (Maghreb, Moyen-Orient)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Restrictions & Allergies Strictes :
              </label>
              <input
                type="text"
                value={profile.restrictions}
                onChange={(e) => setProfile({ restrictions: e.target.value })}
                placeholder="Ex: sans noix, sans gluten, intolérance aux solanacées, sans arachides..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Directives & Consignes Libres pour le Coach IA :
              </label>
              <textarea
                value={profile.memories}
                onChange={(e) => setProfile({ memories: e.target.value })}
                rows={3}
                placeholder="Ex: Ne mange rien avant 13h, préfère les infusions tièdes en hiver, sensibilité digestive aux agrumes acides le matin..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Live Transparency Console */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <i className="ri-terminal-box-fill text-emerald-400 text-base" />
                <h4 className="text-xs font-bold text-white">
                  Console de Transparence : Bio-Contexte IA injecté en direct
                </h4>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed text-emerald-400/90 whitespace-pre-wrap p-3 bg-black/60 rounded-xl border border-emerald-500/20">
                {userContextString}
              </pre>
            </div>
          </GlassCard>
        )}

        {/* Tab 3: Google Gemini Custom API Key */}
        {activeTab === 'security' && (
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-xl">
                  <i className="ri-key-2-fill" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Clé Personnelle Google Gemini (Optionnelle)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Permet d&apos;utiliser votre propre quota Google AI Studio illimité pour le Coach, le Scanner et la Voix.
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1"
              >
                <span>Obtenir Clé Gratuite</span>
                <i className="ri-external-link-line" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Votre Clé API Gemini (AIzaSy...) :
              </label>
              <input
                type="password"
                value={profile.customGeminiKey || ''}
                onChange={(e) => setCustomGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:border-emerald-500 outline-none"
              />
            </div>
          </GlassCard>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg">
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}
