import { create } from 'zustand';

import type { ExercicioCatalogo } from '@/constants/exerciciosCatalogo';

export type SerieAgendada = {
  numero: number;
  repeticoes: number;
  carga: number;
};

export type ExercicioAgendado = {
  id: string;
  exercicioCatalogoId: string;
  nome: string;
  grupo: string;
  series: SerieAgendada[];
  descanso: number;
};

export type PadraoSeries = {
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number;
};

export const PADRAO_SERIES_INICIAL: PadraoSeries = {
  series: 3,
  repeticoes: 12,
  carga: 20,
  descanso: 60,
};

function gerarIdExercicio(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface AgendamentoStore {
  exercicios: ExercicioAgendado[];
  padrao: PadraoSeries;
  adicionarDoCatalogo: (item: ExercicioCatalogo) => boolean;
  removerExercicio: (id: string) => void;
  alterarSeries: (id: string, delta: number) => void;
  alterarRepeticoes: (id: string, delta: number) => void;
  alterarCarga: (id: string, delta: number) => void;
  definirPadrao: (parcial: Partial<PadraoSeries>) => void;
  limpar: () => void;
}

export const useAgendamentoStore = create<AgendamentoStore>((set, get) => ({
  exercicios: [],
  padrao: PADRAO_SERIES_INICIAL,

  adicionarDoCatalogo: (item) => {
    const { exercicios, padrao } = get();
    if (exercicios.some((e) => e.exercicioCatalogoId === item.id)) return false;

    const novo: ExercicioAgendado = {
      id: gerarIdExercicio(),
      exercicioCatalogoId: item.id,
      nome: item.nome,
      grupo: item.grupo,
      series: Array.from({ length: padrao.series }, (_, i) => ({
        numero: i + 1,
        repeticoes: padrao.repeticoes,
        carga: padrao.carga,
      })),
      descanso: padrao.descanso,
    };

    set({ exercicios: [...exercicios, novo] });
    return true;
  },

  removerExercicio: (id) =>
    set((state) => ({ exercicios: state.exercicios.filter((e) => e.id !== id) })),

  alterarSeries: (id, delta) =>
    set((state) => ({
      exercicios: state.exercicios.map((ex) => {
        if (ex.id !== id) return ex;
        const totalAtual = ex.series.length;
        const novoTotal = Math.max(1, Math.min(15, totalAtual + delta));
        if (novoTotal === totalAtual) return ex;

        const reps = ex.series[0]?.repeticoes ?? 12;
        const carga = ex.series[0]?.carga ?? 20;

        return {
          ...ex,
          series: Array.from({ length: novoTotal }, (_, i) => ({
            numero: i + 1,
            repeticoes: reps,
            carga,
          })),
        };
      }),
    })),

  alterarRepeticoes: (id, delta) =>
    set((state) => ({
      exercicios: state.exercicios.map((ex) => {
        if (ex.id !== id) return ex;
        const repsAtual = ex.series[0]?.repeticoes ?? 12;
        const novasReps = Math.max(1, Math.min(100, repsAtual + delta));
        return {
          ...ex,
          series: ex.series.map((s) => ({ ...s, repeticoes: novasReps })),
        };
      }),
    })),

  alterarCarga: (id, delta) =>
    set((state) => ({
      exercicios: state.exercicios.map((ex) => {
        if (ex.id !== id) return ex;
        const cargaAtual = ex.series[0]?.carga ?? 20;
        const novaCarga = Math.max(0, Math.min(500, cargaAtual + delta));
        return {
          ...ex,
          series: ex.series.map((s) => ({ ...s, carga: novaCarga })),
        };
      }),
    })),

  definirPadrao: (parcial) => set((state) => ({ padrao: { ...state.padrao, ...parcial } })),

  limpar: () => set({ exercicios: [] }),
}));