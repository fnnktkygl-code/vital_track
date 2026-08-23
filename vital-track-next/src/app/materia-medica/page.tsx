'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';

const SAMPLE_HERBS = [
  {
    id: 'chanca_piedra',
    name: 'Chanca Piedra (Phyllanthus niruri)',
    commonName: 'Brise-pierre',
    region: 'Amazonie & Forêts Tropicales',
    emoji: '🪴',
    properties: ['Drainage rénal', 'Élimination des calculs', 'Protection hépatique'],
    indications: 'Calculs rénaux et biliaires, engorgement rénal, urémie.',
  },
  {
    id: 'cat_claw',
    name: 'Uña de Gato (Uncaria tomentosa)',
    commonName: 'Griffe de Chat',
    region: 'Haute Amazonie péruvienne',
    emoji: '🌿',
    properties: ['Immunomodulateur', 'Anti-inflammatoire profond', 'Nettoyant intestinal'],
    indications: 'Inflammation digestive, faiblesse lymphatique, protection cellulaire.',
  },
  {
    id: 'mullaca',
    name: 'Mullaca (Physalis angulata)',
    commonName: 'Camapu',
    region: 'Bassin amazonien',
    emoji: '🌸',
    properties: ['Antiviral', 'Antibactérien naturel', 'Soutien respiratoire'],
    indications: 'Infections respiratoires, encombrement bronchique, terrain infectieux.',
  },
  {
    id: 'graviola',
    name: 'Graviola / Corossolier (Annona muricata)',
    commonName: 'Guanabana',
    region: 'Forêt tropicale amazonienne',
    emoji: '🍈',
    properties: ['Cytotoxique naturel', 'Apaisant nerveux', 'Antiparasitaire'],
    indications: 'Soutien immunitaire cellulaire, terrain parasitaire, tension nerveuse.',
  },
];

export default function MateriaMedicaPage() {
  const [search, setSearch] = useState('');

  const filtered = SAMPLE_HERBS.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.commonName.toLowerCase().includes(search.toLowerCase()) ||
    h.indications.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Pharmacopée Amazonienne & Plantes Médicinales
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Base de données Raintree Nutrition (Dr. Leslie Taylor) et phytothérapie tropicale d&apos;élimination
        </p>
      </div>

      <GlassCard className="p-4">
        <div className="relative">
          <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une plante ou une indication (ex: reins, calculs, foie, immunité...)"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold outline-none focus:border-emerald-500"
          />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((herb) => (
          <GlassCard key={herb.id} className="p-6 space-y-4 hover:border-emerald-500/50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{herb.emoji}</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {herb.commonName}
                  </h3>
                  <div className="text-xs text-emerald-400 font-mono italic">
                    {herb.name}
                  </div>
                </div>
              </div>
              <Badge variant="purple">{herb.region}</Badge>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400">Propriétés Thérapeutiques :</div>
              <div className="flex flex-wrap gap-1.5">
                {herb.properties.map((p, idx) => (
                  <Badge key={idx} variant="emerald">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400">Indications majeures : </span>
              {herb.indications}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
