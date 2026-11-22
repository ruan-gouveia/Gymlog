import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
  type Theme,
} from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { LogBox, View } from 'react-native';

import { Toast } from '@/components/ui/Toast';
import { coresClaras, coresEscuras } from '@/constants/tema';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useThemeStore } from '@/stores/useThemeStore';
import {
  agendarForcarBarraNavegacaoEscura,
  iniciarMonitoramentoBarraNavegacao,
} from '@/utils/sistemaNavegacao';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

LogBox.ignoreLogs(['ImageBackground is deprecated']);

const warnOriginal = console.warn;
console.warn = (...args: unknown[]) => {
  const primeiraMsg = typeof args[0] === 'string' ? args[0] : '';
  if (
    primeiraMsg.includes('ImageBackground is deprecated') ||
    primeiraMsg.includes('"shadow*" style props are deprecated') ||
    primeiraMsg.includes('props.pointerEvents is deprecated') ||
    primeiraMsg.includes('Cannot record touch end without a touch start') ||
    primeiraMsg.includes('TouchableMixin is deprecated') ||
    primeiraMsg.includes('`useNativeDriver` is not supported')
  ) {
    return;
  }
  warnOriginal(...args);
};

void SplashScreen.preventAutoHideAsync().catch(() => {});

function GuardiaoRotasAuth({ inicializacaoConcluida }: { inicializacaoConcluida: boolean }) {
  const { session } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!inicializacaoConcluida) return;

    const emGrupoAuth = segments[0] === '(auth)';

    if (!session && !emGrupoAuth) {
      router.replace('/(auth)/login');
    } else if (session && emGrupoAuth) {
      router.replace('/(tabs)');
    }

    void SplashScreen.hideAsync().catch(() => {});
  }, [inicializacaoConcluida, session, segments, router]);

  return null;
}

function NavegacaoRaiz({ bancoPronto }: { bancoPronto: boolean }) {
  const { session, carregando: carregandoAuth } = useAuth();
  const tema = useThemeStore((state) => state.tema);

  const ehEscuro = tema === 'dark';
  const coresAtuais = ehEscuro ? coresEscuras : coresClaras;

  useEffect(() => {
    const limpar = iniciarMonitoramentoBarraNavegacao();
    return limpar;
  }, []);

  useEffect(() => {
    const limpar = agendarForcarBarraNavegacaoEscura();
    return limpar;
  }, [ehEscuro]);

  const temaNavegacao: Theme = useMemo(
    () => ({
      ...(ehEscuro ? DarkTheme : DefaultTheme),
      colors: {
        ...(ehEscuro ? DarkTheme.colors : DefaultTheme.colors),
        primary: coresAtuais.primaria,
        background: coresAtuais.fundo,
        card: coresAtuais.superficie,
        text: coresAtuais.texto,
        border: coresAtuais.borda,
        notification: coresAtuais.perigo,
      },
    }),
    [ehEscuro, coresAtuais]
  );

  const inicializacaoConcluida = bancoPronto && !carregandoAuth;

  if (!inicializacaoConcluida) {
    return null;
  }

  return (
    <View className={`flex-1 ${ehEscuro ? 'dark' : ''}`} style={{ backgroundColor: '#12132A' }}>
      <ThemeProvider value={temaNavegacao}>
        <GuardiaoRotasAuth inicializacaoConcluida={inicializacaoConcluida} />
        <StatusBar style={ehEscuro ? 'light' : 'dark'} />
        <NavigationBar style="light" />
        <Stack
          key={session?.user?.id ?? 'anon'}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: coresAtuais.fundo },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="treino-ativo/[id]" options={{ gestureEnabled: false }} />
        </Stack>
        <Toast />
      </ThemeProvider>
    </View>
  );
}

export default function LayoutRaiz() {
  const [bancoPronto, setBancoPronto] = useState(false);

  useEffect(() => {
    try {
      agendarForcarBarraNavegacaoEscura();
    } catch (error) {
      console.error('[App] Falha ao configurar barra de navegação:', error);
    } finally {
      setBancoPronto(true);
    }
  }, []);

  return (
    <AuthProvider>
      <NavegacaoRaiz bancoPronto={bancoPronto} />
    </AuthProvider>
  );
}
