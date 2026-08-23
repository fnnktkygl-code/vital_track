import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FastingSession, WeightEntry, FastingType } from '@/types';

interface FastingState {
  activeSession: FastingSession | null;
  history: FastingSession[];
  weightHistory: WeightEntry[];
  startFast: (targetHours?: number, type?: FastingType) => void;
  stopFast: (notes?: string, feelingScore?: number) => void;
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => void;
  deleteWeightEntry: (id: string) => void;
}

export const useFastingStore = create<FastingState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      history: [],
      weightHistory: [
        { id: 'w1', date: '2026-08-17', weight: 71.2, note: 'Reprise jeûne hydrique' },
        { id: 'w2', date: '2026-08-20', weight: 70.5, note: 'Énergie optimale' },
        { id: 'w3', date: '2026-08-23', weight: 70.0, note: 'Pesée à jeun' },
      ],

      startFast: (targetHours = 16, type = '16:8') => {
        const newSession: FastingSession = {
          id: `fast_${Date.now()}`,
          startTime: Date.now(),
          targetHours,
          type,
          isActive: true,
        };
        set({ activeSession: newSession });
      },

      stopFast: (notes, feelingScore) => {
        const { activeSession, history } = get();
        if (!activeSession) return;

        const finishedSession: FastingSession = {
          ...activeSession,
          endTime: Date.now(),
          isActive: false,
          notes,
          feelingScore,
        };

        set({
          activeSession: null,
          history: [finishedSession, ...history],
        });
      },

      addWeightEntry: (entry) => {
        const newEntry: WeightEntry = {
          id: `w_${Date.now()}`,
          ...entry,
        };
        set((state) => ({
          weightHistory: [...state.weightHistory, newEntry].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          ),
        }));
      },

      deleteWeightEntry: (id) => {
        set((state) => ({
          weightHistory: state.weightHistory.filter((w) => w.id !== id),
        }));
      },
    }),
    {
      name: 'vital_track_v2_fasting',
    }
  )
);
