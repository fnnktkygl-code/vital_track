'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { id: 'dashboard', href: '/', label: 'Tableau de Bord', icon: 'ri-dashboard-fill' },
      { id: 'recipes', href: '/recipes', label: 'Recettes', icon: 'ri-restaurant-2-line' },
      { id: 'meals', href: '/meals', label: 'Repas & Journal', icon: 'ri-restaurant-fill' },
      { id: 'fasting', href: '/fasting', label: 'Jeûne & Physiologie', icon: 'ri-fire-fill' },
      { id: 'chat', href: '/chat', label: 'Coach Vital IA', icon: 'ri-chat-smile-3-fill' },
    ],
  },
  {
    title: 'SUIVI & PLANTES',
    items: [
      { id: 'deep-search', href: '/deep-search', label: 'Bilan Deep Search', icon: 'ri-microscope-line' },
      { id: 'search', href: '/search', label: 'Aliments & Base', icon: 'ri-search-line' },
      { id: 'materia-medica', href: '/materia-medica', label: 'Pharmacopée Raintree', icon: 'ri-plant-line' },
      { id: 'scan', href: '/scan', label: 'Scanner Vital IA', icon: 'ri-camera-lens-line' },
      { id: 'calendar', href: '/calendar', label: 'Calendrier & Plan', icon: 'ri-calendar-check-line' },
    ],
  },
  {
    title: 'BIEN-ÊTRE',
    items: [
      { id: 'breathing', href: '/breathing', label: 'Respiration Wim Hof', icon: 'ri-windy-line' },
      { id: 'resources', href: '/resources', label: 'Médias & Bibliothèque', icon: 'ri-play-circle-line' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-slate-900/95 dark:bg-slate-900/95 p-4 border-r border-slate-800 shadow-2xl select-none flex-shrink-0 z-30">
      {/* Brand Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-3 mb-4 rounded-2xl hover:bg-white/5 transition-all"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-indigo-500 p-0.5 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-lg">
            🐦
          </div>
        </div>
        <div>
          <div className="text-base font-black tracking-tight text-white flex items-center gap-1">
            Vital<span className="text-emerald-400">Track</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
            Santé Vivante & IA
          </div>
        </div>
      </Link>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase px-3 block">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 font-extrabold"
                        : "text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-0.5"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <i
                        className={cn(
                          item.icon,
                          "text-base transition-transform duration-200 group-hover:scale-115 group-hover:rotate-3",
                          isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-emerald-400"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {isActive && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile / Settings shortcut */}
      <div className="pt-3 border-t border-slate-800 space-y-1">
        <Link
          href="/landing"
          className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <i className="ri-global-line text-base text-slate-400" />
          <span>Site Vitrine</span>
        </Link>
        <Link
          href="/modes"
          className={cn(
            "flex items-center gap-3 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all",
            pathname === '/modes'
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <i className="ri-settings-3-line text-base" />
          <span>Paramètres & Profil</span>
        </Link>
      </div>
    </aside>
  );
};
