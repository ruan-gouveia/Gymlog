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

const CHAVE_LEMBRAR_SESSAO = '@gymlog:auth_lembrar_de_mim';
const CHAVE_EMAIL_LEMBRADO = '@gymlog:auth_email_salvo';

const memoriaSessaoVolatil = new Map<string, string>();
let persistirSessaoEmDisco = true;

function podeUsarStorage(): boolean {
  return !(Platform.OS === 'web' && typeof window === 'undefined');
}

export async function configurarLembrarDeMim(
  lembrar: boolean,
  email?: string
): Promise<void> {
  persistirSessaoEmDisco = lembrar;
  if (!podeUsarStorage()) return;

  try {
    await AsyncStorage.setItem(CHAVE_LEMBRAR_SESSAO, lembrar ? 'true' : 'false');
    if (lembrar && email?.trim()) {
      await AsyncStorage.setItem(CHAVE_EMAIL_LEMBRADO, email.trim().toLowerCase());
    } else if (!lembrar) {
      await AsyncStorage.removeItem(CHAVE_EMAIL_LEMBRADO);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Supabase] Falha ao salvar preferência Lembrar de mim:', error);
    }
  }
}

export async function obterPreferenciaLembrar(): Promise<boolean> {
  if (!podeUsarStorage()) return true;
  try {
    const valor = await AsyncStorage.getItem(CHAVE_LEMBRAR_SESSAO);
    const lembrar = valor !== 'false';
    persistirSessaoEmDisco = lembrar;
    return lembrar;
  } catch {
    return true;
  }
}

export async function obterEmailLembrado(): Promise<string> {
  if (!podeUsarStorage()) return '';
  try {
    return (await AsyncStorage.getItem(CHAVE_EMAIL_LEMBRADO)) ?? '';
  } catch {
    return '';
  }
}

const storageSeguro = {
  getItem: async (key: string): Promise<string | null> => {
    const emMemoria = memoriaSessaoVolatil.get(key);
    if (emMemoria !== undefined) {
      return emMemoria;
    }
    if (!podeUsarStorage() || !persistirSessaoEmDisco) {
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoriaSessaoVolatil.set(key, value);
    if (!podeUsarStorage()) return;

    if (persistirSessaoEmDisco) {
      await AsyncStorage.setItem(key, value);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    memoriaSessaoVolatil.delete(key);
    if (!podeUsarStorage()) return;
    await AsyncStorage.removeItem(key);
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
