'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Mascot } from '@/components/ui/Mascot';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans flex w-full relative">
      {/* Desktop Left Sidebar (Visible on md and above) */}
      <Sidebar />

      {/* Mobile Slide-over Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Navigation</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar isMobile onItemClick={() => setMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar onToggleMobileNav={() => setMobileNavOpen(!mobileNavOpen)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating Animated 3D Mascot */}
      <Mascot />
    </div>
  );
}
