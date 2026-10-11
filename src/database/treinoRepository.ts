import { db } from './index';

export type NovoTreino = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes?: string;
};

export function inserirTreino(treino: NovoTreino): void {
    
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