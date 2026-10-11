import { openDatabaseSync } from 'expo-sqlite';
import { NOME_BANCO } from './initDatabase';

export type NovoTreino = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes?: string;
};

export function inserirTreino(treino: NovoTreino): void {
  const db = openDatabaseSync(NOME_BANCO);

  // O runSync gerencia a inserção nativamente e resolve o NullPointerException no Android
  db.runSync(
    `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes) VALUES (?, ?, ?, ?, ?)`,
    [
      treino.nome,
      treino.data,
      treino.duracao,
      treino.grupo_muscular,
      treino.observacoes ?? null,
    ]
  );
}