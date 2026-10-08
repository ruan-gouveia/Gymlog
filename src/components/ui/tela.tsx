import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cores, espacamento } from '@/constants/tema';

type TelaProps = {
  children: ReactNode;
  bordas?: Edge[];
  style?: StyleProp<ViewStyle>;
};

export function Tela({ children, bordas = ['top', 'left', 'right'], style }: TelaProps) {
  return (
    <SafeAreaView edges={bordas} style={[estilos.tela, style]}>
      {children}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingHorizontal: espacamento.md,
  },
});
