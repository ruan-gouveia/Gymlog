import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { create } from 'zustand';

export type NomeIconeFeather = ComponentProps<typeof Feather>['name'];

export type VarianteAlerta = 'padrao' | 'perigo' | 'aviso';

export type BotaoAlerta = {
  texto: string;
  estilo?: 'default' | 'cancel' | 'destructive' | 'secondary';
  icone?: NomeIconeFeather;
  onPress?: () => void | Promise<void>;
};

export type ConfigAlerta = {
  titulo: string;
  mensagem: string;
  icone?: NomeIconeFeather;
  variante?: VarianteAlerta;
  botoes?: BotaoAlerta[];
};

interface AlertState {
  visivel: boolean;
  config: ConfigAlerta | null;
  mostrar: (config: ConfigAlerta) => void;
  fechar: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visivel: false,
  config: null,
  mostrar: (config) => set({ visivel: true, config }),
  fechar: () => set({ visivel: false }),
}));

export function mostrarAlerta(config: ConfigAlerta): void {
  useAlertStore.getState().mostrar(config);
}
