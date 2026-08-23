import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';

interface ProfileState {
  profile: UserProfile;
  setProfile: (updates: Partial<UserProfile>) => void;
  setCustomGeminiKey: (key: string) => void;
  resetProfile: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Vitaliste',
  age: 32,
  height: 175,
  currentWeight: 70.0,
  targetWeight: 68.0,
  fastingGoalHours: 16,
  bioregion: 'temperate',
  country: 'France 🇫🇷',
  city: 'Paris',
  restrictions: '',
  memories: 'Sensibilité aux mélanges fruits acides et féculents. Préfère les tisanes tièdes.',
  protocol: 'VITALIST',
  language: 'fr',
  theme: 'dark',
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      setCustomGeminiKey: (key) =>
        set((state) => ({
          profile: { ...state.profile, customGeminiKey: key },
        })),
      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: 'vital_track_v2_profile',
    }
  )
);
