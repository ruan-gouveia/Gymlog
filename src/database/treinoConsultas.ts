import type { RepetirTreino, StatusTreino, Treino } from './tipos';
import { db } from './conexao';

export type TreinoResumo = Pick<
  Treino,
  'id' | 'nome' | 'grupo_muscular' | 'data' | 'duracao' | 'status' | 'horario'
> & {
  total_exercicios: number;
  volume: number;
};

export function ajustarStatusTemporal(status: StatusTreino, dataStr: string): StatusTreino {
  if (status !== 'agendado') return status;

  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return status;

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const ano = parseInt(partes[2], 10);
  const dataTreino = new Date(ano, mes, dia, 0, 0, 0);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (dataTreino.getTime() < hoje.getTime()) {
    return 'nao_realizado';
  }

  return status;
}

export function listarTreinos(): TreinoResumo[] {
  const lista = db.getAllSync<TreinoResumo>(
    `
    SELECT
      t.id,
      t.nome,
      t.grupo_muscular,
      t.data,
      t.duracao,
      t.status,
      t.horario,
      COUNT(DISTINCT e.nome) AS total_exercicios,
      COALESCE(SUM(e.repeticoes * e.carga), 0) AS volume
    FROM treinos t
    LEFT JOIN exercicios e ON e.treino_id = t.id
    GROUP BY t.id
    ORDER BY
      substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) DESC,
      t.id DESC
  `
  );

  return lista.map((t) => ({
    ...t,
    status: ajustarStatusTemporal(t.status, t.data),
  }));
}

export type SerieDetalhe = {
  id: number;
  numero: number;
  repeticoes: number;
  carga: number;
  descanso: number | null;
  concluida: number;
};

export type ExercicioDetalhe = {
  nome: string;
  series: SerieDetalhe[];
};

export type TreinoDetalhe = Treino & {
  exercicios: ExercicioDetalhe[];
  total_series: number;
  volume: number;
};

type LinhaTreinoExercicio = Treino & {
  exercicio_id: number | null;
  exercicio_nome: string | null;
  numero_serie: number | null;
  repeticoes: number | null;
  carga: number | null;
  descanso: number | null;
  concluida: number | null;
};

export function buscarTreinoPorId(id: number): TreinoDetalhe | null {
  const linhas = db.getAllSync<LinhaTreinoExercicio>(
    `SELECT
        t.id, t.nome, t.data, t.duracao, t.grupo_muscular, t.observacoes,
        t.status, t.horario, t.repetir,
        e.id AS exercicio_id,
        e.nome AS exercicio_nome,
        e.series AS numero_serie,
        e.repeticoes,
        e.carga,
        e.descanso,
        e.concluida
    FROM treinos t
    LEFT JOIN exercicios e ON e.treino_id = t.id
    WHERE t.id = ?
    ORDER BY e.id ASC`,
    [id]
  );

  if (linhas.length === 0) return null;

  const exercicios: ExercicioDetalhe[] = [];
  let volume = 0;
  let totalSeries = 0;

  for (const l of linhas) {
    if (l.exercicio_id === null) continue;

    const serie: SerieDetalhe = {
      id: l.exercicio_id,
      numero: l.numero_serie!,
      repeticoes: l.repeticoes!,
      carga: l.carga!,
      descanso: l.descanso,
      concluida: l.concluida ?? 0,
    };

    volume += serie.repeticoes * serie.carga;
    totalSeries += 1;

    const ultimo = exercicios[exercicios.length - 1];
    if (ultimo && ultimo.nome === l.exercicio_nome) {
      ultimo.series.push(serie);
    } else {
      exercicios.push({ nome: l.exercicio_nome!, series: [serie] });
    }
  }

  const {
    id: treinoId,
    nome,
    data,
    duracao,
    grupo_muscular,
    observacoes,
    status,
    horario,
    repetir,
  } = linhas[0];

  return {
    id: treinoId,
    nome,
    data,
    duracao,
    grupo_muscular,
    observacoes,
    status: ajustarStatusTemporal(status ?? 'concluido', data),
    horario: horario ?? null,
    repetir: (repetir as RepetirTreino) ?? 'uma_vez',
    exercicios,
    total_series: totalSeries,
    volume,
  };
}
