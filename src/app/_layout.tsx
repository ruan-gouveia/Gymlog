import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { cores } from '@/constants/tema';
import { db, initDatabase } from '@/database';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const temaNavegacao: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: cores.primaria,
    background: cores.fundo,
    card: cores.superficie,
    text: cores.texto,
    border: cores.borda,
    notification: cores.perigo,
  },
};

export default function LayoutRaiz() {
  const [bancoPronto, setBancoPronto] = useState(false);

  useEffect(() => {
    async function preparar() {
      try {
        initDatabase(db );
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
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercicio/selecionar" />
        <Stack.Screen name="exercicio/registrar" />
      </Stack>
    </ThemeProvider>
  );
}
