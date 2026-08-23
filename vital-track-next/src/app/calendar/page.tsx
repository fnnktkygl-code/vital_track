'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StripCalendar } from '@/components/ui/StripCalendar';

export default function CalendarPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Plan Alimentaire & Calendrier de Transition
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Suivi guidé de vos menus hebdomadaires et des paliers de transition hygiéniste
        </p>
      </div>

      <StripCalendar />
    </div>
  );
}
