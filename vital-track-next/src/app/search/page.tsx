'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSearchStore } from '@/stores/useSearchStore';
import type { FoodItem } from '@/types';

const SAMPLE_FOODS: FoodItem[] = [
  { id: 'avocado', name: 'Avocat Hass', category: 'Fruits', emoji: '🥑', pral: -8.2, nova: 1, electric: true, freshness: 95 },
  { id: 'amaranth_greens', name: 'Amaranthe (Feuilles)', category: 'Légumes', emoji: '🥬', pral: -3.0, nova: 1, electric: true, freshness: 98 },
  { id: 'black_grapes', name: 'Raisin Noir aux Pépins', category: 'Fruits', emoji: '🍇', pral: -3.8, nova: 1, electric: true, freshness: 96 },
  { id: 'wild_blueberries', name: 'Myrtilles Sauvages', category: 'Fruits', emoji: '🫐', pral: -2.5, nova: 1, electric: true, freshness: 94 },
  { id: 'cucumber', name: 'Concombre Noa', category: 'Légumes', emoji: '🥒', pral: -4.2, nova: 1, electric: true, freshness: 99 },
  { id: 'bell_pepper', name: 'Poivron Doux', category: 'Légumes', emoji: '🫑', pral: -2.0, nova: 1, electric: true, freshness: 92 },
  { id: 'spinach', name: 'Pousses d\'Épinards', category: 'Légumes', emoji: '🥬', pral: -10.5, nova: 1, electric: true, freshness: 97 },
  { id: 'watermelon', name: 'Pastèque aux Pépins', category: 'Fruits', emoji: '🍉', pral: -2.2, nova: 1, electric: true, freshness: 98 },
  { id: 'lemon', name: 'Citron Jaune Mûr', category: 'Fruits', emoji: '🍋', pral: -2.6, nova: 1, electric: true, freshness: 95 },
  { id: 'chayote', name: 'Chayote / Cristophine', category: 'Légumes', emoji: '🍈', pral: -2.0, nova: 1, electric: true, freshness: 90 },
];

export default function SearchPage() {
  const { query, setQuery, category, setCategory, activeFilter, setActiveFilter, favorites, toggleFavorite } = useSearchStore();
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const categories = ['Tous', 'Légumes', 'Fruits', 'Boissons', 'Herbes & Thés', 'À éviter'];

  const filteredFoods = SAMPLE_FOODS.filter((food) => {
    // Query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!food.name.toLowerCase().includes(q) && !food.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Category filter
    if (category !== 'Tous' && food.category !== category) {
      return false;
    }
    // Vitality filter
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
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Recherche d&apos;Aliments & Base de Données
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Composition biochimique, indice PRAL et classification des aliments vivants
        </p>
      </div>

      {/* Search Input Box */}
      <GlassCard className="p-4 sm:p-5 space-y-4">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un aliment ou plat (ex: mangue, chou kale, avocat...)"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setActiveFilter('electric')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'electric'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Électriques (Dr. Sebi)
          </button>
          <button
            onClick={() => setActiveFilter('alkalizing')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'alkalizing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            🌿 Alcalinisants
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === 'favorites'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            ❤️ Favoris ({favorites.length})
          </button>
        </div>

        {/* Category Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs font-semibold px-3 py-1 rounded-xl transition-all ${
                category === cat
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* High-Contrast AI Search Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl flex-shrink-0">
            ✨
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Votre aliment ou plat n&apos;est pas dans la liste ?
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Analyser « {query || 'Légumes'} » avec l&apos;IA VitalTrack (classification complète, PRAL & NOVA)
            </div>
          </div>
        </div>

        <Button variant="primary" size="sm">
          <i className="ri-search-eye-line" />
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
              onClick={() => setSelectedFood(food)}
              className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0">{food.emoji}</span>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {food.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{food.category}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">PRAL {food.pral.toFixed(1)}</span>
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isFav ? 'text-red-500 bg-red-500/10' : 'text-slate-400 hover:text-red-400'
                  }`}
                >
                  <i className={isFav ? 'ri-heart-fill' : 'ri-heart-line'} />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
