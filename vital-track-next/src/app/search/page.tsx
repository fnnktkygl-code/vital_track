'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSearchStore } from '@/stores/useSearchStore';
import type { FoodItem } from '@/types';

const FULL_FOODS: FoodItem[] = [
  {
    id: 'avocado',
    name: 'Avocat Hass Mûr',
    category: 'Fruits',
    emoji: '🥑',
    pral: -8.2,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 95,
    waterContent: 73,
    family: 'Lauracées',
    benefits: ['Riche en acides gras mono-insaturés', 'Excellente source de potassium et magnésium', 'Alcalinisation tissulaire profonde'],
    precautions: ['Consommer à maturité complète pour une digestibilité optimale'],
    minerals: { potassium: 485, magnesium: 29, calcium: 12, phosphorus: 52 },
  },
  {
    id: 'amaranth_greens',
    name: 'Amaranthe (Feuilles Vertes Sauvages)',
    category: 'Légumes',
    emoji: '🥬',
    pral: -3.0,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 98,
    waterContent: 91,
    family: 'Amaranthacées',
    benefits: ['Densité ionique végétale maximale', 'Chélateur naturel doux des toxines', 'Stimule le péristaltisme'],
    minerals: { potassium: 611, magnesium: 55, calcium: 215, phosphorus: 50 },
  },
  {
    id: 'black_grapes',
    name: 'Raisin Noir aux Pépins',
    category: 'Fruits',
    emoji: '🍇',
    pral: -3.8,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 96,
    waterContent: 81,
    family: 'Vitacées',
    benefits: ['Nettoyant lymphatique par excellence (Dr. Morse)', 'Riche en resvératrol et anthocyanes', 'Solubilise les acides uriques'],
    minerals: { potassium: 191, magnesium: 7, calcium: 10, phosphorus: 20 },
  },
  {
    id: 'wild_blueberries',
    name: 'Myrtilles Sauvages',
    category: 'Fruits',
    emoji: '🫐',
    pral: -2.5,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 94,
    waterContent: 84,
    family: 'Éricacées',
    benefits: ['Antioxydant cérébral et vasculaire de premier ordre', 'Régénération des microcapillaires', 'Tonique hépatique'],
    minerals: { potassium: 77, magnesium: 6, calcium: 6, phosphorus: 12 },
  },
  {
    id: 'cucumber',
    name: 'Concombre Noa Frais',
    category: 'Légumes',
    emoji: '🥒',
    pral: -4.2,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 99,
    waterContent: 96,
    family: 'Cucurbitacées',
    benefits: ['Hydratation cellulaire par eau structurée', 'Dissolution des cristaux acides', 'Soutien direct de la filtration rénale'],
    minerals: { potassium: 147, magnesium: 13, calcium: 16, phosphorus: 24 },
  },
  {
    id: 'bell_pepper',
    name: 'Poivron Doux Mûr',
    category: 'Légumes',
    emoji: '🫑',
    pral: -2.0,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 92,
    waterContent: 92,
    family: 'Solanacées',
    benefits: ['Concentration exceptionnelle en vitamine C vivante', 'Stimulation de la microcirculation'],
    minerals: { potassium: 211, magnesium: 12, calcium: 10, phosphorus: 26 },
  },
  {
    id: 'spinach',
    name: 'Pousses d\'Épinards Crues',
    category: 'Légumes',
    emoji: '🥬',
    pral: -10.5,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 97,
    waterContent: 91,
    family: 'Amaranthacées',
    benefits: ['Champion de l\'indice PRAL alcalinisant', 'Chlorophylle vivante oxygénante', 'Régénération sanguine'],
    minerals: { potassium: 558, magnesium: 79, calcium: 99, phosphorus: 49 },
  },
  {
    id: 'watermelon',
    name: 'Pastèque aux Pépins',
    category: 'Fruits',
    emoji: '🍉',
    pral: -2.2,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 98,
    waterContent: 92,
    family: 'Cucurbitacées',
    benefits: ['Lavage rénal intense', 'Citrulline pour la détoxification de l\'ammoniaque', 'Effet diurétique naturel doux'],
    minerals: { potassium: 112, magnesium: 10, calcium: 7, phosphorus: 11 },
  },
  {
    id: 'lemon',
    name: 'Citron Jaune Mûr',
    category: 'Fruits',
    emoji: '🍋',
    pral: -2.6,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 95,
    waterContent: 89,
    family: 'Rutacées',
    benefits: ['Alcalinisant post-digestif puissant', 'Stimulant de la bile et du foie', 'Fluidifiant des mucosités'],
    minerals: { potassium: 138, magnesium: 8, calcium: 26, phosphorus: 16 },
  },
  {
    id: 'chayote',
    name: 'Chayote / Cristophine',
    category: 'Légumes',
    emoji: '🍈',
    pral: -2.0,
    nova: 1,
    electric: true,
    hybrid: false,
    mucusForming: false,
    freshness: 90,
    waterContent: 94,
    family: 'Cucurbitacées',
    benefits: ['Légume neutre adoucissant', 'Absence totale d\'acidité irritante', 'Parfait en transition'],
    minerals: { potassium: 125, magnesium: 12, calcium: 17, phosphorus: 18 },
  },
];

export default function SearchPage() {
  const { query, setQuery, category, setCategory, activeFilter, setActiveFilter, favorites, toggleFavorite } = useSearchStore();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [modalTab, setModalTab] = useState<'scientific' | 'vitality' | 'specific'>('scientific');

  const categories = ['Tous', 'Légumes', 'Fruits', 'Boissons', 'Herbes & Thés', 'À éviter'];

  const filteredFoods = FULL_FOODS.filter((food) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!food.name.toLowerCase().includes(q) && !food.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (category !== 'Tous' && food.category !== category) return false;
    if (activeFilter === 'electric' && !food.electric) return false;
    if (activeFilter === 'hybrid' && !food.hybrid) return false;
    if (activeFilter === 'alkalizing' && food.pral > -0.5) return false;
    if (activeFilter === 'mucus' && !food.mucusForming) return false;
    if (activeFilter === 'favorites' && !favorites.includes(food.id)) return false;

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Recherche d&apos;Aliments & Base de Données
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Composition biochimique, indice PRAL et classification des aliments vivants
        </p>
      </div>

      {/* Search Input Box */}
      <GlassCard className="p-4 sm:p-5 space-y-4 bg-slate-900/90 border-slate-800">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un aliment ou plat (ex: mangue, chou kale, avocat...)"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-700 bg-slate-950 text-white text-sm font-semibold outline-none focus:border-emerald-500 transition-all shadow-inner placeholder-slate-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setActiveFilter('electric')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'electric'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            ⚡ Électriques (Dr. Sebi)
          </button>
          <button
            onClick={() => setActiveFilter('alkalizing')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'alkalizing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            🌿 Alcalinisants
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'favorites'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            ❤️ Favoris ({favorites.length})
          </button>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                category === cat
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* High-Contrast AI Search Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl flex-shrink-0">
            ✨
          </div>
          <div>
            <div className="text-xs font-black text-white">
              Votre aliment ou plat n&apos;est pas dans la liste ?
            </div>
            <div className="text-[11px] text-slate-300">
              Analyser « {query || 'Légumes'} » avec l&apos;IA VitalTrack (classification complète, PRAL & NOVA)
            </div>
          </div>
        </div>

        <Button variant="primary" size="sm">
          <i className="ri-search-eye-line text-base" />
          <span>Analyser IA</span>
        </Button>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredFoods.map((food) => {
          const isFav = favorites.includes(food.id);
          return (
            <GlassCard
              key={food.id}
              onClick={() => {
                setSelectedFood(food);
                setModalTab('scientific');
              }}
              className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all bg-slate-900/90 border-slate-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0">{food.emoji}</span>
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-white truncate">
                    {food.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{food.category}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-400">PRAL {food.pral.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={food.electric ? 'electric' : 'neutral'}>
                  {food.electric ? 'ÉLECTRIQUE' : 'HYBRIDE'}
                </Badge>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(food.id);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isFav ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-red-400'
                  }`}
                >
                  <i className={isFav ? 'ri-heart-fill' : 'ri-heart-line text-lg'} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* 3-Tab Interactive Food Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedFood.emoji}</span>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedFood.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedFood.electric ? 'electric' : 'neutral'}>
                      {selectedFood.electric ? '⚡ Aliment Électrique' : '🔀 Hybride'}
                    </Badge>
                    <Badge variant="emerald">NOVA {selectedFood.nova}</Badge>
                    <span className="text-xs font-bold text-emerald-400">
                      PRAL {selectedFood.pral.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <button
                onClick={() => setModalTab('scientific')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'scientific' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔬 1. Scientifique
              </button>
              <button
                onClick={() => setModalTab('vitality')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'vitality' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                💚 2. Vitalité
              </button>
              <button
                onClick={() => setModalTab('specific')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modalTab === 'specific' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌿 3. Spécifique
              </button>
            </div>

            {/* Tab 1: Scientifique */}
            {modalTab === 'scientific' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 font-bold block mb-1">Indice PRAL :</span>
                    <span className="text-lg font-black text-emerald-400">{selectedFood.pral} mEq/100g</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Formule Remer & Manz</span>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <span className="text-slate-400 font-bold block mb-1">Teneur en Eau :</span>
                    <span className="text-lg font-black text-teal-300">{selectedFood.waterContent || 85}%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Eau structurée naturelle</span>
                  </div>
                </div>

                {selectedFood.minerals && (
                  <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-2">
                    <span className="font-bold text-white block">Profil Minéral (mg / 100g) :</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      <div className="p-2 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 block">K (Potassium)</span>
                        <span className="font-black text-emerald-400">{selectedFood.minerals.potassium || '—'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 block">Mg (Magnésium)</span>
                        <span className="font-black text-teal-400">{selectedFood.minerals.magnesium || '—'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 block">Ca (Calcium)</span>
                        <span className="font-black text-indigo-400">{selectedFood.minerals.calcium || '—'}</span>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-xl">
                        <span className="text-slate-400 block">P (Phosphore)</span>
                        <span className="font-black text-amber-400">{selectedFood.minerals.phosphorus || '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Vitalité */}
            {modalTab === 'vitality' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                  <span className="font-black text-emerald-400 block mb-1">Impact sur la Vitalité Cellulaire :</span>
                  <p className="text-slate-200 leading-relaxed">
                    Aliment à haute fréquence vibratoire ne générant aucun dépôt d&apos;acide urique ou de mucus dans les tubules rénaux et les parois du côlon.
                  </p>
                </div>

                {selectedFood.benefits && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-white block">Bénéfices Majeurs :</span>
                    <ul className="space-y-1 text-slate-300">
                      {selectedFood.benefits.map((b, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Spécifique */}
            {modalTab === 'specific' && (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <span className="font-bold text-white block mb-1">Famille Botanique :</span>
                  <span className="text-emerald-400 font-mono">{selectedFood.family || 'Plante Vivante'}</span>
                </div>
                <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700">
                  <span className="font-bold text-white block mb-1">Combinaisons Alimentaires Idéales :</span>
                  <span>À consommer seul ou avec des légumes à feuilles vertes pour une assimilation optimale sans fermentation.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
