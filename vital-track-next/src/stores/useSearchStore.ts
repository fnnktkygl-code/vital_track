import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchState {
  query: string;
  category: string;
  activeFilter: 'all' | 'electric' | 'hybrid' | 'alkalizing' | 'mucus' | 'favorites';
  favorites: string[]; // food item ids
  setQuery: (q: string) => void;
  setCategory: (c: string) => void;
  setActiveFilter: (f: 'all' | 'electric' | 'hybrid' | 'alkalizing' | 'mucus' | 'favorites') => void;
  toggleFavorite: (id: string) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: '',
      category: 'Tous',
      activeFilter: 'all',
      favorites: ['avocado', 'amaranth_greens', 'black_grapes', 'wild_blueberries'],
      setQuery: (query) => set({ query }),
      setCategory: (category) => set({ category }),
      setActiveFilter: (activeFilter) => set({ activeFilter }),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((f) => f !== id)
            : [...state.favorites, id],
        })),
    }),
    {
      name: 'vital_track_v2_search',
    }
  )
);
