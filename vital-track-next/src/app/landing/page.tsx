'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-8 max-w-3xl mx-auto py-12 animate-in fade-in duration-300">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
        <div className="w-full h-full bg-slate-950 rounded-3xl flex items-center justify-center text-4xl">
          🐦
        </div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
          <span>✨ VitalTrack 2.0 · Standard Industrie Next.js 15 & IA</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          L&apos;Application Maître de la Santé Vivante & de la Régénération
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Suivez votre équilibre acido-basique (PRAL), activez vos phases d&apos;autophagie cellulaire et scannez vos assiettes avec la vision multimodale Gemini 3.7.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/">
          <Button variant="primary" size="lg" className="text-base px-8 font-black">
            <span>Accéder à l&apos;Application</span>
            <i className="ri-arrow-right-line" />
          </Button>
        </Link>
        <Link href="/scan">
          <Button variant="secondary" size="lg" className="text-base px-8">
            <i className="ri-camera-lens-line" />
            <span>Tester le Scanner IA</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
