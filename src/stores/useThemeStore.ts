import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TemaTipo = 'light' | 'dark' | 'system';

interface ThemeState {
  tema: TemaTipo;
  setTema: (tema: TemaTipo) => void;
  alternarTema: () => void;
}

function sincronizarColorSchemeNativo(tema: TemaTipo): void {
  try {
    colorScheme.set(tema === 'system' ? 'system' : tema);
  } catch {}
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      tema: 'light',
      setTema: (tema: TemaTipo) => {
        sincronizarColorSchemeNativo(tema);
        set({ tema });
      },
      alternarTema: () => {
        const atual = get().tema;
        const proximo: TemaTipo = atual === 'dark' ? 'light' : 'dark';
        sincronizarColorSchemeNativo(proximo);
        set({ tema: proximo });
      },
    }),
    {
      name: '@gymlog:tema',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.tema) {
          sincronizarColorSchemeNativo(state.tema);
        }
      },
    }
  )
);
