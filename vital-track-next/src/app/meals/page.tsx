'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMealsStore } from '@/stores/useMealsStore';
import { formatLocalDate } from '@/lib/utils';

export default function MealsPage() {
  const { meals, addMeal, deleteMeal } = useMealsStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'juice'>('lunch');
  const [mealPral, setMealPral] = useState('-5.0');
  const [mealNova, setMealNova] = useState<1 | 2 | 3 | 4>(1);

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    addMeal({
      date: formatLocalDate(new Date()),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      mealType,
      name: mealName.trim(),
      emoji: mealType === 'juice' ? '🥤' : mealType === 'breakfast' ? '🥑' : '🥗',
      items: [{ name: mealName.trim(), pral: parseFloat(mealPral) || -5.0, nova: mealNova, isElectric: true }],
      pral: parseFloat(mealPral) || -5.0,
      nova: mealNova,
      hybrid: false,
      freshnessScore: 95,
    });

    setIsAddModalOpen(false);
    setMealName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Repas & Journal Nutritionnel
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Journalisation des repas vivants, balance PRAL et micronutriments alcalinisants
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
          <i className="ri-add-line text-lg" />
          <span>Ajouter un repas</span>
        </Button>
      </div>

      {/* Meals List */}
      <div className="space-y-3">
        {meals.map((meal) => (
          <GlassCard key={meal.id} className="p-5 flex items-center justify-between gap-4 bg-slate-900/90 border-slate-800">
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-3xl flex-shrink-0">{meal.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400">{meal.time}</span>
                  <Badge variant={meal.pral < 0 ? 'emerald' : 'warning'}>
                    PRAL {meal.pral > 0 ? `+${meal.pral.toFixed(1)}` : meal.pral.toFixed(1)}
                  </Badge>
                  <Badge variant="neutral">NOVA {meal.nova}</Badge>
                </div>
                <h3 className="text-sm sm:text-base font-black text-white truncate">
                  {meal.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => deleteMeal(meal.id)}
              className="text-slate-400 hover:text-red-400 p-2 cursor-pointer transition-colors"
              title="Supprimer"
            >
              <i className="ri-delete-bin-line text-lg" />
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Add Meal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <i className="ri-restaurant-line text-emerald-400" />
                <span>Ajouter un repas au journal</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nom du plat / Repas :
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Ex: Salade de pousses d'épinards, concombre et avocat"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Moment du repas :
                  </label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  >
                    <option value="breakfast">Petit-déjeuner</option>
                    <option value="lunch">Déjeuner</option>
                    <option value="dinner">Dîner</option>
                    <option value="juice">Jus / Smoothie</option>
                    <option value="snack">Collation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Indice PRAL estimé :
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={mealPral}
                    onChange={(e) => setMealPral(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full">
                  Enregistrer dans le journal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
