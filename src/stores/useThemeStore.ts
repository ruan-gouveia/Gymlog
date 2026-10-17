import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TemaTipo = 'light' | 'dark' | 'system';

interface ThemeState {
  tema: TemaTipo;
  setTema: (tema: TemaTipo) => void;
  alternarTema: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      tema: 'light',
      setTema: (tema: TemaTipo) => set({ tema }),
      alternarTema: () => {
        const atual = get().tema;
        set({ tema: atual === 'dark' ? 'light' : 'dark' });
      },
    }),
    {
      name: '@gymlog:tema',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
