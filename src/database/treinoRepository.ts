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

function inserirExercicios(treinoId: number, exercicios: ExercicioParaSalvar[]): void {
  for (const ex of exercicios) {
    db.runSync(
      `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [treinoId, ex.nome, ex.series, ex.repeticoes, ex.carga, ex.descanso ?? null]
    );
  }
}

export function salvarTreinoComExercicios(
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[]
): number {
  let treinoId = 0;

  db.withTransactionSync(() => {
    const resultadoTreino = db.runSync(
      `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes) 
       VALUES (?, ?, ?, ?, ?)`,
      [treino.nome, treino.data, treino.duracao, treino.grupo_muscular, treino.observacoes ?? null]
    );

    treinoId = resultadoTreino.lastInsertRowId;
    inserirExercicios(treinoId, exercicios);
  });

  return treinoId;
}

export function atualizarTreinoComExercicios(
  id: number,
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[]
): void {
  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE treinos
          SET nome = ?, data = ?, duracao = ?, grupo_muscular = ?, observacoes = ?
        WHERE id = ?`,
      [treino.nome, treino.data, treino.duracao, treino.grupo_muscular, treino.observacoes ?? null, id]
    );

    
    db.runSync('DELETE FROM exercicios WHERE treino_id = ?', [id]);
    inserirExercicios(id, exercicios);
  });
}

export function excluirTreino(id: number): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM exercicios WHERE treino_id = ?', [id]);
    db.runSync('DELETE FROM treinos WHERE id = ?', [id]);
  });
}