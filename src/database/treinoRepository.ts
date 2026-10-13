import { db } from './index';

export type NovoTreino = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes?: string;
};

export type ExercicioParaSalvar = {
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso?: number;
};

export function salvarTreinoComExercicios(
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[]
): number {
  let treinoId = 0;

  db.withTransactionSync(() => {
    const resultadoTreino = db.runSync(
      `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        treino.nome,
        treino.data,
        treino.duracao,
        treino.grupo_muscular,
        treino.observacoes ?? null,
      ]
    );

    treinoId = resultadoTreino.lastInsertRowId;

    for (const ex of exercicios) {
      db.runSync(
        `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          treinoId,
          ex.nome,
          ex.series,
          ex.repeticoes,
          ex.carga,
          ex.descanso ?? null,
        ]
      );
    }
  });

  return treinoId;
}