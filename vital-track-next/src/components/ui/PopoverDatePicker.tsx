'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn, formatLocalDate, parseLocalDate } from '@/lib/utils';

export interface PopoverDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  label?: string;
}

export const PopoverDatePicker: React.FC<PopoverDatePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'years'>('days');
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const d = parseLocalDate(value || formatLocalDate(new Date()));
    return d.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState<number>(() => {
    const d = parseLocalDate(value || formatLocalDate(new Date()));
    return d.getMonth();
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal view when value prop changes
  useEffect(() => {
    if (value) {
      const d = parseLocalDate(value);
      setCurrentYear(d.getFullYear());
      setCurrentMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const selectedDateObj = parseLocalDate(value || formatLocalDate(new Date()));
  const formattedDisplay = selectedDateObj.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleQuickChip = (daysDiff: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysDiff);
    const dateStr = formatLocalDate(d);
    onChange(dateStr);
    setIsOpen(false);
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setCurrentYear(year);
    setViewMode('days');
  };

  const handleSelectDay = (day: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const changeMonth = (diff: number) => {
    let newM = currentMonth + diff;
    let newY = currentYear;
    if (newM > 11) {
      newM = 0;
      newY += 1;
    } else if (newM < 0) {
      newM = 11;
      newY -= 1;
    }
    setCurrentMonth(newM);
    setCurrentYear(newY);
  };

  // Generate days for the grid
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Dim
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const leadingOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Monday

  const yearsRange = Array.from({ length: 16 }, (_, i) => 2015 + i); // 2015 to 2030

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Popover trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold hover:border-emerald-500 transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <i className="ri-calendar-event-line text-emerald-500 text-base" />
          <span>{formattedDisplay}</span>
        </div>
        <i className={cn("ri-arrow-down-s-line text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleQuickChip(0)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 whitespace-nowrap cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip(-1)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
            >
              Hier
            </button>
            <button
              type="button"
              onClick={() => handleQuickChip(-2)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
            >
              Avant-hier
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('2017-06-17');
                setIsOpen(false);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 whitespace-nowrap cursor-pointer"
            >
              ⚡ 17 Juin 2017
            </button>
          </div>

          {/* Month / Year header navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
            >
              <i className="ri-arrow-left-s-line" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {monthNames[currentMonth]}
              </span>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
                className="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                title="Cliquer pour choisir l'année en 1-clic (2015-2030)"
              >
                <span>{currentYear}</span>
                <i className="ri-arrow-down-s-line text-[10px]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>

          {/* 1-Click Year Selection Grid (2015 - 2030) */}
          {viewMode === 'years' ? (
            <div className="grid grid-cols-4 gap-1.5 py-1 max-h-48 overflow-y-auto">
              {yearsRange.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleSelectYear(y)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    y === currentYear
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-500"
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            /* Day Calendar Grid */
            <div>
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
                <span>Lu</span><span>Ma</span><span>Me</span><span>Je</span><span>Ve</span><span>Sa</span><span>Di</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: leadingOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-7" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isCurSelected =
                    selectedDateObj.getDate() === dayNum &&
                    selectedDateObj.getMonth() === currentMonth &&
                    selectedDateObj.getFullYear() === currentYear;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={cn(
                        "h-7 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                        isCurSelected
                          ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500"
                      )}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
