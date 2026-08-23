'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

const BOOKS = [
  {
    title: 'Le Miracle de la Détoxination',
    author: 'Dr. Robert Morse',
    emoji: '🍋',
    desc: 'Manuel complet de régénération cellulaire, filtration rénale et alimentation frugivore.',
  },
  {
    title: 'Le Système de Guérison du Régime Sans Mucus',
    author: 'Prof. Arnold Ehret',
    emoji: '🍇',
    desc: 'Théorie fondamentale de la vitalité (V = F - O) et élimination des obstructions.',
  },
  {
    title: 'Guide de Purification Bio-Électrique Cellulaire',
    author: 'Dr. Sebi',
    emoji: '⚡',
    desc: 'Principes des aliments natifs électriques et alcalinisation du sang.',
  },
  {
    title: 'The Healing Power of Rainforest Herbs',
    author: 'Dr. Leslie Taylor',
    emoji: '🪴',
    desc: 'Compendium exhaustif des plantes amazoniennes et de leurs principes actifs validés.',
  },
];

export default function ResourcesPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bibliothèque Vivante & Ressources RAG
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Les 10 Mo de savoirs scientifiques et hygiénistes injectés au cœur du moteur VitalTrack
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BOOKS.map((b, i) => (
          <GlassCard key={i} className="p-6 space-y-3 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{b.emoji}</span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {b.title}
                </h3>
                <div className="text-xs text-emerald-400 font-semibold">{b.author}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{b.desc}</p>
            <Badge variant="emerald">Ouvrage indexé au RAG IA</Badge>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
