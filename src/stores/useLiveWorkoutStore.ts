import { create } from 'zustand';

export type SerieAoVivo = {
  repeticoes: number;
  carga: number;
  concluida: boolean;
};

export type ExercicioAoVivo = {
  nome: string;
  descanso: number;
  series: SerieAoVivo[];
};

export type CampoSerie = 'repeticoes' | 'carga';

export type DescansoAtivo = {
  totalMs: number;
  /** Timestamp do fim da contagem (quando rodando). */
  fimEm: number | null;
  /** Tempo restante congelado (quando pausado). */
  restanteMs: number | null;
  proximo: string | null;
};

export type ProgressoTreino = {
  totalSeries: number;
  seriesConcluidas: number;
  volume: number;
};

export const PASSO_REPETICOES = 1;
export const PASSO_CARGA = 2.5;
export const DESCANSO_PADRAO_SEGUNDOS = 60;
export const AJUSTE_DESCANSO_SEGUNDOS = 15;

const arredondar = (n: number) => Math.round(n * 100) / 100;

export function calcularProgresso(exercicios: ExercicioAoVivo[]): ProgressoTreino {
  let totalSeries = 0;
  let seriesConcluidas = 0;
  let volume = 0;

  for (const ex of exercicios) {
    for (const s of ex.series) {
      totalSeries += 1;
      if (s.concluida) {
        seriesConcluidas += 1;
        volume += s.repeticoes * s.carga;
      }
    }
  }

  return { totalSeries, seriesConcluidas, volume };
}

export function descreverProximaSerie(exercicios: ExercicioAoVivo[]): string | null {
  for (const ex of exercicios) {
    const indice = ex.series.findIndex((s) => !s.concluida);
    if (indice !== -1) return `${ex.nome} · Série ${indice + 1}`;
  }
  return null;
}

export function restanteDoDescansoMs(descanso: DescansoAtivo, agora: number): number {
  if (descanso.restanteMs !== null) return descanso.restanteMs;
  return Math.max(0, (descanso.fimEm ?? agora) - agora);
}

function atualizarSerie(
  exercicios: ExercicioAoVivo[],
  exercicioIdx: number,
  serieIdx: number,
  alterar: (serie: SerieAoVivo) => SerieAoVivo
): ExercicioAoVivo[] {
  return exercicios.map((ex, i) =>
    i !== exercicioIdx
      ? ex
      : { ...ex, series: ex.series.map((s, j) => (j === serieIdx ? alterar(s) : s)) }
  );
}

interface LiveWorkoutStore {
  treinoId: number | null;
  nome: string;
  tempoInicio: number | null;
  exercicios: ExercicioAoVivo[];
  descanso: DescansoAtivo | null;

  iniciar: (treinoId: number, nome: string, exercicios: ExercicioAoVivo[]) => void;
  ajustarSerie: (
    exercicioIdx: number,
    serieIdx: number,
    campo: CampoSerie,
    direcao: 1 | -1
  ) => void;
  /** Alterna a série e retorna o novo estado (true = concluída). */
  alternarSerie: (exercicioIdx: number, serieIdx: number) => boolean;
  iniciarDescanso: (segundos: number, proximo: string | null) => void;
  ajustarDescanso: (deltaSegundos: number) => void;
  pausarOuRetomarDescanso: () => void;
  pararDescanso: () => void;
  resetar: () => void;
}

export const useLiveWorkoutStore = create<LiveWorkoutStore>((set, get) => ({
  treinoId: null,
  nome: '',
  tempoInicio: null,
  exercicios: [],
  descanso: null,

  iniciar: (treinoId, nome, exercicios) =>
    set({ treinoId, nome, exercicios, tempoInicio: Date.now(), descanso: null }),

  ajustarSerie: (exercicioIdx, serieIdx, campo, direcao) =>
    set((state) => ({
      exercicios: atualizarSerie(state.exercicios, exercicioIdx, serieIdx, (serie) => {
        const passo = campo === 'carga' ? PASSO_CARGA : PASSO_REPETICOES;
        const minimo = campo === 'carga' ? 0 : 1;
        return { ...serie, [campo]: Math.max(minimo, arredondar(serie[campo] + direcao * passo)) };
      }),
    })),

  alternarSerie: (exercicioIdx, serieIdx) => {
    const atual = get().exercicios[exercicioIdx]?.series[serieIdx];
    if (!atual) return false;

    const concluida = !atual.concluida;
    set((state) => ({
      exercicios: atualizarSerie(state.exercicios, exercicioIdx, serieIdx, (s) => ({
        ...s,
        concluida,
      })),
    }));
    return concluida;
  },

  iniciarDescanso: (segundos, proximo) => {
    const totalMs = segundos * 1000;
    set({ descanso: { totalMs, fimEm: Date.now() + totalMs, restanteMs: null, proximo } });
  },

  ajustarDescanso: (deltaSegundos) =>
    set((state) => {
      const d = state.descanso;
      if (!d) return state;

      const deltaMs = deltaSegundos * 1000;
      if (d.restanteMs !== null) {
        const restanteMs = Math.max(0, d.restanteMs + deltaMs);
        return { descanso: { ...d, restanteMs, totalMs: Math.max(d.totalMs, restanteMs) } };
      }

      const fimEm = (d.fimEm ?? Date.now()) + deltaMs;
      return {
        descanso: { ...d, fimEm, totalMs: Math.max(d.totalMs, fimEm - Date.now()) },
      };
    }),

  pausarOuRetomarDescanso: () =>
    set((state) => {
      const d = state.descanso;
      if (!d) return state;

      if (d.restanteMs !== null) {
        return { descanso: { ...d, fimEm: Date.now() + d.restanteMs, restanteMs: null } };
      }
      return {
        descanso: { ...d, restanteMs: Math.max(0, (d.fimEm ?? Date.now()) - Date.now()), fimEm: null },
      };
    }),

  pararDescanso: () => set({ descanso: null }),

  resetar: () =>
    set({ treinoId: null, nome: '', tempoInicio: null, exercicios: [], descanso: null }),
}));