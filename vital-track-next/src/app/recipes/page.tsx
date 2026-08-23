'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

const VITAL_RECIPES = [
  {
    id: 'r1',
    title: 'Jus Vert Hautement Oxygénant & Électrique',
    emoji: '🥤',
    prepTime: '10 min',
    pral: -8.5,
    ingredients: ['2 branches de céleri', '1 concombre noa', '1 bouquet de persil plat', '1/2 citron vert'],
    description: 'Boisson ionisante drainante favorisant la filtration rénale et l\'oxygénation cellulaire.',
  },
  {
    id: 'r2',
    title: 'Grande Salade Minéralisante aux Graines Vivantes',
    emoji: '🥗',
    prepTime: '15 min',
    pral: -16.2,
    ingredients: ['Pousses d\'épinards', 'Avocat hass', 'Graines de chanvre', 'Algues dulse', 'Huile d\'olive première pression'],
    description: 'Repas alcalinisant dense en magnésium et potassium organique pour régénérer la muqueuse intestinale.',
  },
  {
    id: 'r3',
    title: 'Bouillon Reminéralisant de Légumes Racines & Feuilles',
    emoji: '🍲',
    prepTime: '25 min',
    pral: -12.0,
    ingredients: ['Poireaux', 'Carottes', 'Persil', 'Thym', 'Sel de Guérande brut'],
    description: 'Idéal en rupture de jeûne ou en dîner d\'hiver pour apaiser le système digestif sans surcharge.',
  },
];

export default function RecipesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Recettes Vivantes & Alchimie Culinaire
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Créations culinaires conformes aux principes de non-encrassement cellulaire (Ehret, Morse, Sebi)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {VITAL_RECIPES.map((r) => (
          <GlassCard key={r.id} className="p-6 space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{r.emoji}</span>
                <Badge variant="emerald">PRAL {r.pral}</Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {r.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {r.description}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <span className="font-bold text-slate-300">Ingrédients :</span>
              <ul className="text-slate-400 space-y-1 text-[11px]">
                {r.ingredients.map((ing, i) => (
                  <li key={i}>• {ing}</li>
                ))}
              </ul>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
