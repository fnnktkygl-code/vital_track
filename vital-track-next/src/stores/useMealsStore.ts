import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealEntry } from '@/types';
import { formatLocalDate } from '@/lib/utils';

interface MealsState {
  meals: MealEntry[];
  addMeal: (meal: Omit<MealEntry, 'id'>) => void;
  deleteMeal: (id: string) => void;
  getMealsByDate: (dateStr: string) => MealEntry[];
}

export const useMealsStore = create<MealsState>()(
  persist(
    (set, get) => ({
      meals: [
        {
          id: 'm1',
          date: formatLocalDate(new Date()),
          time: '08:30',
          mealType: 'breakfast',
          name: 'Jus Vert Électrique & Raisin Noir',
          emoji: '🥑',
          items: [
            { name: 'Raisin noir bio', pral: -3.8, nova: 1, isElectric: true },
            { name: 'Concombre & Céleri branche', pral: -4.2, nova: 1, isElectric: true },
          ],
          pral: -8.0,
          nova: 1,
          hybrid: false,
          freshnessScore: 98,
        },
        {
          id: 'm2',
          date: formatLocalDate(new Date()),
          time: '12:45',
          mealType: 'lunch',
          name: 'Grande Salade Alcaline aux Pousses d\'Épinards & Avocat',
          emoji: '🥗',
          items: [
            { name: 'Pousses d\'épinards', pral: -10.5, nova: 1, isElectric: true },
            { name: 'Avocat Hass mûr', pral: -8.2, nova: 1, isElectric: true },
            { name: 'Graines de chanvre crues', pral: -1.2, nova: 1, isElectric: true },
          ],
          pral: -19.9,
          nova: 1,
          hybrid: false,
          freshnessScore: 95,
        },
      ],

      addMeal: (meal) => {
        const newMeal: MealEntry = {
          id: `meal_${Date.now()}`,
          ...meal,
        };
        set((state) => ({
          meals: [newMeal, ...state.meals],
        }));
      },

      deleteMeal: (id) => {
        set((state) => ({
          meals: state.meals.filter((m) => m.id !== id),
        }));
      },

      getMealsByDate: (dateStr) => {
        return get().meals.filter((m) => m.date === dateStr);
      },
    }),
    {
      name: 'vital_track_v2_meals',
    }
  )
);
