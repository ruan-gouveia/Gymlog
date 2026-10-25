import { NavigationBar } from 'expo-navigation-bar';
import { requireNativeModule } from 'expo-modules-core';
import * as SystemUI from 'expo-system-ui';
import { Appearance, Platform } from 'react-native';

const COR_FUNDO_NAV_BAR = '#12132A';

let timersPendentes: ReturnType<typeof setTimeout>[] = [];

function limparTimersPendentes() {
  if (timersPendentes.length > 0) {
    timersPendentes.forEach(clearTimeout);
    timersPendentes = [];
  }
}

export function forcarBarraNavegacaoEscura() {
  if (Platform.OS !== 'android') return;

  try {
    const ExpoNavigationBar = requireNativeModule('ExpoNavigationBar');
    ExpoNavigationBar?.setStyle?.('light');
  } catch {
    try {
      NavigationBar.setStyle('light');
    } catch {}
  }

  SystemUI.setBackgroundColorAsync(COR_FUNDO_NAV_BAR).catch(() => {});
}

export function agendarForcarBarraNavegacaoEscura() {
  if (Platform.OS !== 'android') return () => {};

  limparTimersPendentes();
  forcarBarraNavegacaoEscura();

  timersPendentes = [
    setTimeout(forcarBarraNavegacaoEscura, 60),
    setTimeout(forcarBarraNavegacaoEscura, 220),
  ];

  return limparTimersPendentes;
}

export function iniciarMonitoramentoBarraNavegacao() {
  if (Platform.OS !== 'android') return () => {};

  agendarForcarBarraNavegacaoEscura();

  const subscription = Appearance.addChangeListener(() => {
    agendarForcarBarraNavegacaoEscura();
  });

  return () => {
    subscription.remove();
    limparTimersPendentes();
  };
}
