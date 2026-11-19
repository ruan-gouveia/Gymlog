import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { Exercicio, Treino } from '@/database/tipos';

export type TipoOperacaoSync = 'UPSERT_TREINO' | 'DELETE_TREINO' | 'UPSERT_PERFIL';

export type PayloadUpsertTreino = {
  treino: Treino;
  exercicios: Exercicio[];
};

export type PayloadDeleteTreino = {
  local_id: number;
};

export type PayloadUpsertPerfil = {
  nome: string;
  meta_semanal: number;
  lembretes_ativo: boolean;
  horario_lembretes: string;
  dias_lembretes: string;
  antecedencia_lembrete: number;
};

export type ItemFilaSync = {
  id: string;
  userId: string;
  tipo: TipoOperacaoSync;
  entidadeId: number;
  descricao: string;
  payload: PayloadUpsertTreino | PayloadDeleteTreino | PayloadUpsertPerfil;
  criadoEm: string;
  tentativas: number;
  ultimoErro?: string;
};

type NovoItemFilaInput = Omit<ItemFilaSync, 'id' | 'criadoEm' | 'tentativas'>;

interface SyncState {
  userIdAtivo: string | null;
  fila: ItemFilaSync[];
  isOnline: boolean;
  isSincronizando: boolean;
  ultimaSincronizacao: string | null;
  ultimoErro: string | null;
  carregarFilaDoUsuario: (userId: string | null) => Promise<ItemFilaSync[]>;
  enfileirarOperacao: (input: NovoItemFilaInput) => Promise<void>;
  removerItemDaFila: (id: string) => Promise<void>;
  registrarFalhaItem: (id: string, erro: string) => Promise<void>;
  setOnline: (online: boolean) => void;
  setSincronizando: (sincronizando: boolean) => void;
  registrarSucessoSincronizacao: () => void;
}

const PREFIXO_FILA_STORAGE = '@gymlog:fila_sync:';

function obterChaveFila(userId: string): string {
  return `${PREFIXO_FILA_STORAGE}${userId}`;
}

async function salvarFilaNoStorage(userId: string | null, fila: ItemFilaSync[]): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(obterChaveFila(userId), JSON.stringify(fila));
  } catch (error) {
    console.warn('[SyncStore] Erro ao persistir fila no AsyncStorage:', error);
  }
}

export const useSyncStore = create<SyncState>((set, get) => ({
  userIdAtivo: null,
  fila: [],
  isOnline: true,
  isSincronizando: false,
  ultimaSincronizacao: null,
  ultimoErro: null,

  carregarFilaDoUsuario: async (userId: string | null) => {
    if (!userId) {
      set({ userIdAtivo: null, fila: [], isSincronizando: false, ultimoErro: null });
      return [];
    }

    try {
      const bruto = await AsyncStorage.getItem(obterChaveFila(userId));
      const filaCarregada: ItemFilaSync[] = bruto ? (JSON.parse(bruto) as ItemFilaSync[]) : [];
      const filaValida = Array.isArray(filaCarregada)
        ? filaCarregada.filter((item) => item && item.userId === userId)
        : [];
      set({ userIdAtivo: userId, fila: filaValida });
      return filaValida;
    } catch (error) {
      console.warn('[SyncStore] Erro ao carregar fila do AsyncStorage:', error);
      set({ userIdAtivo: userId, fila: [] });
      return [];
    }
  },

  enfileirarOperacao: async (input: NovoItemFilaInput) => {
    const { fila, userIdAtivo } = get();
    const userId = input.userId || userIdAtivo;
    if (!userId) return;

    const agora = new Date().toISOString();
    const novoId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let novaFila = [...fila];

    if (input.tipo === 'UPSERT_TREINO') {
      const idxExistente = novaFila.findIndex(
        (item) =>
          item.userId === userId &&
          item.tipo === 'UPSERT_TREINO' &&
          item.entidadeId === input.entidadeId
      );

      if (idxExistente >= 0) {
        novaFila[idxExistente] = {
          ...novaFila[idxExistente],
          descricao: input.descricao,
          payload: input.payload,
          criadoEm: agora,
        };
      } else {
        novaFila.push({
          ...input,
          userId,
          id: novoId,
          criadoEm: agora,
          tentativas: 0,
        });
      }
    } else if (input.tipo === 'DELETE_TREINO') {
      novaFila = novaFila.filter(
        (item) => !(item.userId === userId && item.entidadeId === input.entidadeId && item.tipo !== 'UPSERT_PERFIL')
      );
      novaFila.push({
        ...input,
        userId,
        id: novoId,
        criadoEm: agora,
        tentativas: 0,
      });
    } else if (input.tipo === 'UPSERT_PERFIL') {
      const idxExistente = novaFila.findIndex(
        (item) => item.userId === userId && item.tipo === 'UPSERT_PERFIL'
      );

      if (idxExistente >= 0) {
        novaFila[idxExistente] = {
          ...novaFila[idxExistente],
          descricao: input.descricao,
          payload: input.payload,
          criadoEm: agora,
        };
      } else {
        novaFila.push({
          ...input,
          userId,
          id: novoId,
          criadoEm: agora,
          tentativas: 0,
        });
      }
    }

    set({ fila: novaFila, userIdAtivo: userId });
    await salvarFilaNoStorage(userId, novaFila);
  },

  removerItemDaFila: async (id: string) => {
    const { fila, userIdAtivo } = get();
    const novaFila = fila.filter((item) => item.id !== id);
    set({ fila: novaFila, ultimoErro: null });
    await salvarFilaNoStorage(userIdAtivo, novaFila);
  },

  registrarFalhaItem: async (id: string, erro: string) => {
    const { fila, userIdAtivo } = get();
    const novaFila = fila.map((item) =>
      item.id === id
        ? {
            ...item,
            tentativas: item.tentativas + 1,
            ultimoErro: erro,
          }
        : item
    );
    set({ fila: novaFila, ultimoErro: erro });
    await salvarFilaNoStorage(userIdAtivo, novaFila);
  },

  setOnline: (online: boolean) => {
    set({ isOnline: online });
  },

  setSincronizando: (sincronizando: boolean) => {
    set({ isSincronizando: sincronizando });
  },

  registrarSucessoSincronizacao: () => {
    const horario = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    set({ ultimaSincronizacao: horario, ultimoErro: null });
  },
}));
