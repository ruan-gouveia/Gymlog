import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type TelaProps = {
  children: ReactNode;
  bordas?: Edge[];
  style?: StyleProp<ViewStyle>;
};

export function Tela({ children, bordas = ['top', 'left', 'right'], style }: TelaProps) {
  return (
    <SafeAreaView edges={bordas} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B] px-4" style={style}>
      {children}
    </SafeAreaView>
  );
}
