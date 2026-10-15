import { openDatabaseSync } from "expo-sqlite";
import { NOME_BANCO } from "./initDatabase";
import { Exercicio, Treino } from "./tipos";

const db = openDatabaseSync(NOME_BANCO);
db.execSync("PRAGMA foreign_keys = ON;");

export type TreinoInput = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string | null;
};

export type ExercicioInput = {
  id?: number; // ausente = exercício novo
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
};

export function buscarTreinoPorId(id: number): Treino | null {
  return (
    db.getFirstSync<Treino>("SELECT * FROM treinos WHERE id = ?", [id]) ?? null
  );
}

export function listarExerciciosPorTreino(treinoId: number): Exercicio[] {
  return db.getAllSync<Exercicio>(
    "SELECT * FROM exercicios WHERE treino_id = ? ORDER BY id",
    [treinoId],
  );
}

export function excluirTreino(id: number): void {
  db.withTransactionSync(() => {
    // Explícito: não depende do PRAGMA da conexão atual.
    db.runSync("DELETE FROM exercicios WHERE treino_id = ?", [id]);
    db.runSync("DELETE FROM treinos WHERE id = ?", [id]);
  });
}

export function atualizarTreino(
  id: number,
  treino: TreinoInput,
  exercicios: ExercicioInput[],
): void {
  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE treinos
         SET nome = ?, data = ?, duracao = ?, grupo_muscular = ?, observacoes = ?
       WHERE id = ?`,
      [
        treino.nome,
        treino.data,
        treino.duracao,
        treino.grupo_muscular,
        treino.observacoes,
        id,
      ],
    );

    // Remove os exercícios que o usuário tirou na edição.
    const idsMantidos = exercicios.flatMap((e) =>
      e.id !== undefined ? [e.id] : [],
    );
    if (idsMantidos.length > 0) {
      const marcadores = idsMantidos.map(() => "?").join(",");
      db.runSync(
        `DELETE FROM exercicios WHERE treino_id = ? AND id NOT IN (${marcadores})`,
        [id, ...idsMantidos],
      );
    } else {
      db.runSync("DELETE FROM exercicios WHERE treino_id = ?", [id]);
    }

    // Atualiza os existentes e insere os novos (descanso é preservado).
    for (const ex of exercicios) {
      if (ex.id !== undefined) {
        db.runSync(
          `UPDATE exercicios SET nome = ?, series = ?, repeticoes = ?, carga = ?
           WHERE id = ? AND treino_id = ?`,
          [ex.nome, ex.series, ex.repeticoes, ex.carga, ex.id, id],
        );
      } else {
        db.runSync(
          `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga)
           VALUES (?, ?, ?, ?, ?)`,
          [id, ex.nome, ex.series, ex.repeticoes, ex.carga],
        );
      }
    }
  });
}
