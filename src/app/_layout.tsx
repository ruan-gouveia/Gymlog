import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { NavigationBar } from 'expo-navigation-bar';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Toast } from '@/components/ui/Toast';
import { coresClaras, coresEscuras } from '@/constants/tema';
import { db, initDatabase } from '@/database';
import { popularBancoComDadosDeTeste } from '@/database/seed';
import { useThemeStore } from '@/stores/useThemeStore';
import {
  agendarForcarBarraNavegacaoEscura,
  iniciarMonitoramentoBarraNavegacao,
} from '@/utils/sistemaNavegacao';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const [bancoPronto, setBancoPronto] = useState(false);
  const { colorScheme, setColorScheme } = useColorScheme();
  const tema = useThemeStore((state) => state.tema);

  useEffect(() => {
    if (tema === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(tema);
    }
  }, [tema, setColorScheme]);

  const ehEscuro = colorScheme === 'dark' || tema === 'dark';
  const coresAtuais = ehEscuro ? coresEscuras : coresClaras;

  useEffect(() => {
    const limpar = iniciarMonitoramentoBarraNavegacao();
    return limpar;
  }, []);

  useEffect(() => {
    const limpar = agendarForcarBarraNavegacaoEscura();
    return limpar;
  }, [ehEscuro, tema]);

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

  useEffect(() => {
    async function preparar() {
      try {
        agendarForcarBarraNavegacaoEscura();
        initDatabase(db);
        if (__DEV__) {
          popularBancoComDadosDeTeste();
        }
        setBancoPronto(true);
      } catch (error) {
        console.error('[App] Falha ao inicializar o banco de dados:', error);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    preparar();
  }, []);

  if (!bancoPronto) {
    return null;
  }

  return (
    <View className={`flex-1 ${ehEscuro ? 'dark' : ''}`} style={{ backgroundColor: '#12132A' }}>
      <ThemeProvider value={temaNavegacao}>
        <StatusBar style={ehEscuro ? 'light' : 'dark'} />
        <NavigationBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: coresAtuais.fundo },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" /> 
        </Stack>
        <Toast />
      </ThemeProvider>
    </View>
  );
}
