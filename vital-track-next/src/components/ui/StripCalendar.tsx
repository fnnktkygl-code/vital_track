'use client';

import React, { useState, useEffect } from 'react';
import { cn, formatLocalDate, parseLocalDate, addDaysLocal } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import confetti from 'canvas-confetti';

interface DayPill {
  dateStr: string;
  dayShort: string;
  dayNum: number;
  monthShort: string;
  isToday: boolean;
}

interface RoutineTask {
  id: string;
  title: string;
  slot: string;
  desc: string;
  emoji: string;
  completed: boolean;
}

const DEFAULT_TASKS: Omit<RoutineTask, 'completed'>[] = [
  {
    id: 'wake_tea',
    title: 'Réveil : Tisane Vivifiante Menthe Poivrée & Citron',
    slot: '06h30 - 08h00',
    desc: 'Hydratation cellulaire et éveil rénal',
    emoji: '🍵',
  },
  {
    id: 'fruit_breakfast',
    title: 'Petit-déjeuner : Fruits Mûrs de Saison ou Jus Vert',
    slot: '08h30 - 10h00',
    desc: 'Énergie électrique instantanée sans encrassement',
    emoji: '🥑',
  },
  {
    id: 'living_lunch',
    title: 'Déjeuner : Grande Salade Alcaline ou Repas Vivant',
    slot: '12h00 - 14h00',
    desc: 'Feu digestif maximal, densité micronutritionnelle',
    emoji: '🥗',
  },
  {
    id: 'light_dinner',
    title: 'Dîner Léger : Légumes Vapeur & Bouillon Reminéralisant',
    slot: '18h30 - 20h00',
    desc: 'Préparation au repos digestif nocturne',
    emoji: '🍲',
  },
];

export const StripCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatLocalDate(new Date()));
  const [days, setDays] = useState<DayPill[]>([]);
  const [tasks, setTasks] = useState<RoutineTask[]>([]);

  // Compute 7-day strip window centered around today
  useEffect(() => {
    const todayStr = formatLocalDate(new Date());
    const today = parseLocalDate(todayStr);
    const dayOfWeek = today.getDay(); // 0 = Dim, 1 = Lun
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const stripDays: DayPill[] = [];
    const dayNames = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + diffToMonday + i);
      const dStr = formatLocalDate(d);

      stripDays.push({
        dateStr: dStr,
        dayShort: dayNames[d.getDay()],
        dayNum: d.getDate(),
        monthShort: monthNames[d.getMonth()],
        isToday: dStr === todayStr,
      });
    }

    setDays(stripDays);
  }, []);

  // Load routine tasks for selected date
  useEffect(() => {
    const storageKey = `vital_routine_${selectedDate}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    // Default tasks
    setTasks(DEFAULT_TASKS.map(t => ({ ...t, completed: false })));
  }, [selectedDate]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId) {
          const nextVal = !t.completed;
          if (nextVal) {
            confetti({
              particleCount: 25,
              spread: 45,
              origin: { y: 0.8 },
              colors: ['#10B981', '#34D399', '#059669'],
            });
          }
          return { ...t, completed: nextVal };
        }
        return t;
      });

      localStorage.setItem(`vital_routine_${selectedDate}`, JSON.stringify(updated));
      return updated;
    });
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const selectedDateObj = parseLocalDate(selectedDate);
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <GlassCard className="p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 flex items-center justify-center text-xl flex-shrink-0">
            🥗
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Plan Alimentaire & Calendrier de Transition
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suivi hebdomadaire selon les directives vitalistes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 capitalize">
            {formattedSelectedDate}
          </span>
          <button
            onClick={() => setSelectedDate(formatLocalDate(new Date()))}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm transition-all"
            title="Revenir à aujourd'hui"
          >
            <i className="ri-refresh-line" />
          </button>
        </div>
      </div>

      {/* 7-Day Horizontal Strip Pills */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
        {days.map(d => {
          const isSelected = d.dateStr === selectedDate;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 rounded-2xl border transition-all duration-200 cursor-pointer select-none",
                isSelected
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 scale-[1.04]"
                  : "bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <span className={cn("text-[10px] font-bold tracking-wider", isSelected ? "text-white/90" : "text-slate-400")}>
                {d.dayShort}
              </span>
              <span className="text-base sm:text-lg font-black my-0.5">
                {d.dayNum}
              </span>
              {d.isToday && (
                <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-emerald-400")} />
              )}
            </button>
          );
        })}
      </div>

      {/* Routine & Checklist of the Day */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Routine & Rituels du Jour
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {completedCount}/{tasks.length} validés ({progressPct}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Task Items */}
        <div className="space-y-2.5">
          {tasks.map(t => (
            <div
              key={t.id}
              onClick={() => toggleTask(t.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none",
                t.completed
                  ? "bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white"
                  : "bg-slate-100/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-xs font-bold border",
                    t.completed
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "border-slate-300 dark:border-slate-600 text-transparent"
                  )}
                >
                  ✓
                </div>
                <div className="min-w-0">
                  <div className={cn("text-xs font-bold truncate", t.completed && "line-through text-slate-400 dark:text-slate-500")}>
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {t.slot} · {t.desc}
                  </div>
                </div>
              </div>
              <span className="text-lg flex-shrink-0 ml-2">{t.emoji}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};
