'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

interface NavbarProps {
  onToggleMobileNav: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileNav }) => {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState<'fr' | 'en' | 'es'>('fr');

  const toggleLang = () => {
    const nextLang = lang === 'fr' ? 'en' : lang === 'en' ? 'es' : 'fr';
    setLang(nextLang);
  };

  const toggleThemeMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      {/* Mobile Hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="md:hidden w-9 h-9 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 flex items-center justify-center text-lg transition-all cursor-pointer"
          aria-label="Menu"
        >
          <i className="ri-menu-3-line" />
        </button>

        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-sm">
              🐦
            </div>
          </div>
          <span className="text-base font-black text-white">
            Vital<span className="text-emerald-400">Track</span>
          </span>
        </Link>
      </div>

      {/* Desktop Status Badge */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>VitalTrack Coach Pro · Gemini 3.7 & 3.6 Flash</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-slate-200 hover:border-emerald-500 transition-all cursor-pointer"
          title="Changer de langue"
        >
          <span>{lang === 'fr' ? '🇫🇷' : lang === 'en' ? '🇬🇧' : '🇪🇸'}</span>
          <span className="uppercase">{lang}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-emerald-400 hover:border-emerald-500 flex items-center justify-center text-base transition-all cursor-pointer"
          title="Mode sombre / clair"
        >
          <i className={theme === 'light' ? 'ri-sun-line text-amber-400' : 'ri-moon-line text-slate-300'} />
        </button>
      </div>
    </header>
  );
};
