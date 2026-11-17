import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const rawSupabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const rawSupabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_KEY ??
  ''
).trim();

const urlEhValida = /^https?:\/\/.+/i.test(rawSupabaseUrl);

export const isSupabaseConfigurado = Boolean(urlEhValida && rawSupabaseAnonKey);

if (!isSupabaseConfigurado && __DEV__) {
  if (rawSupabaseUrl && !urlEhValida) {
    console.warn(
      '[Supabase] EXPO_PUBLIC_SUPABASE_URL inválida: deve começar com https:// (ex: https://xyz.supabase.co).'
    );
  } else {
    console.warn(
      '[Supabase] Variáveis EXPO_PUBLIC_SUPABASE_URL e/ou EXPO_PUBLIC_SUPABASE_ANON_KEY não definidas no .env.'
    );
  }
}

const storageSeguro = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  urlEhValida ? rawSupabaseUrl : 'https://placeholder.supabase.co',
  rawSupabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: storageSeguro,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
