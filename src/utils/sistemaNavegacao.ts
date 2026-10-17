import { NavigationBar } from 'expo-navigation-bar';
import { requireNativeModule } from 'expo-modules-core';
import * as SystemUI from 'expo-system-ui';
import { Appearance, Platform } from 'react-native';

const COR_FUNDO_NAV_BAR = '#12132A';

/**
 * Força a barra de navegação do Android a permanecer escura (#12132A)
 * com botões claros (brancos), mesmo quando o aplicativo está no tema claro.
 */
export function forcarBarraNavegacaoEscura() {
  if (Platform.OS !== 'android') return;

  try {
    // Chama diretamente o módulo nativo para ignorar cache JS de expo-navigation-bar
    const ExpoNavigationBar = requireNativeModule('ExpoNavigationBar');
    ExpoNavigationBar?.setStyle?.('light');
  } catch {
    // Fallback para API pública declarativa
    try {
      NavigationBar.setStyle('light');
    } catch {
      // Ignora erro se não suportado
    }
  }

  // Garante que o fundo do DecorView da Activity Android seja #12132A
  SystemUI.setBackgroundColorAsync(COR_FUNDO_NAV_BAR).catch(() => {});
}

/**
 * Agenda múltiplas aplicações para garantir que a barra permaneça escura
 * mesmo após o Android recriar atributos de janela durante a troca de tema.
 */
export function agendarForcarBarraNavegacaoEscura() {
  if (Platform.OS !== 'android') return;

  forcarBarraNavegacaoEscura();

  const timers = [
    setTimeout(forcarBarraNavegacaoEscura, 40),
    setTimeout(forcarBarraNavegacaoEscura, 120),
    setTimeout(forcarBarraNavegacaoEscura, 250),
    setTimeout(forcarBarraNavegacaoEscura, 500),
  ];

  return () => {
    timers.forEach(clearTimeout);
  };
}

/**
 * Inicializa os ouvintes de mudança de aparência para re-aplicar a barra escura
 * sempre que o Android disparar onConfigurationChanged.
 */
export function iniciarMonitoramentoBarraNavegacao() {
  if (Platform.OS !== 'android') return () => {};

  agendarForcarBarraNavegacaoEscura();

  const subscription = Appearance.addChangeListener(() => {
    agendarForcarBarraNavegacaoEscura();
  });

  return () => {
    subscription.remove();
  };
}
