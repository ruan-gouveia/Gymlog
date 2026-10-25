import { dataBrParaChave, dateParaChave } from '@/utils/datas';

export const OPCOES_PERIODO = [
  'Todo o período',
  '7 dias',
  '30 dias',
  '3 meses',
  'Personalizado',
] as const;

export type PeriodoHistorico = (typeof OPCOES_PERIODO)[number];

export type LimitesPeriodo = {
  /** Chave AAAAMMDD inicial (inclusive). null = sem limite. */
  de: number | null;
  /** Chave AAAAMMDD final (inclusive). null = sem limite. */
  ate: number | null;
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function obterLimitesPeriodo(
  periodo: PeriodoHistorico,
  inicioPersonalizado: string,
  fimPersonalizado: string,
  hoje: Date = new Date()
): LimitesPeriodo {
  const chaveHoje = dateParaChave(hoje);

  switch (periodo) {
    case '7 dias':
      return {
        de: dateParaChave(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 6)),
        ate: chaveHoje,
      };
    case '30 dias':
      return {
        de: dateParaChave(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29)),
        ate: chaveHoje,
      };
    case '3 meses':
      return {
        de: dateParaChave(new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate())),
        ate: chaveHoje,
      };
    case 'Personalizado':
      return {
        de: dataBrParaChave(inicioPersonalizado),
        ate: dataBrParaChave(fimPersonalizado),
      };
    default:
      return { de: null, ate: null };
  }
}

export function filtrarTreinos<T extends { data: string; grupo_muscular: string }>(
  treinos: T[],
  opcoes: { grupo: string; limites: LimitesPeriodo }
): T[] {
  const { grupo, limites } = opcoes;
  const grupoNormalizado = grupo === 'Todos' ? null : normalizar(grupo);
  const semLimites = limites.de === null && limites.ate === null;

  return treinos.filter((treino) => {
    if (grupoNormalizado && !normalizar(treino.grupo_muscular).includes(grupoNormalizado)) {
      return false;
    }

    const chave = dataBrParaChave(treino.data);
    if (chave === null) return semLimites;
    if (limites.de !== null && chave < limites.de) return false;
    if (limites.ate !== null && chave > limites.ate) return false;
    return true;
  });
}