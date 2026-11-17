import type { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isSupabaseConfigurado, supabase } from '@/services/supabase';

export type AuthContextData = {
  session: Session | null;
  user: User | null;
  carregando: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({
  session: null,
  user: null,
  carregando: true,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function restaurarSessao() {
      if (!isSupabaseConfigurado) {
        if (ativo) {
          setSession(null);
          setUser(null);
          setCarregando(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] Falha ao restaurar sessão:', error.message);
        }
        if (ativo) {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.warn('[Auth] Erro inesperado ao verificar sessão:', error);
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void restaurarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      if (!ativo) return;
      setSession(novaSessao);
      setUser(novaSessao?.user ?? null);
      setCarregando(false);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const valor = useMemo<AuthContextData>(
    () => ({
      session,
      user,
      carregando,
      isLoading: carregando,
      signOut,
    }),
    [session, user, carregando, signOut]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
