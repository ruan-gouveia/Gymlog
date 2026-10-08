export type Treino = {
  id: number;
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string | null;
};

export type Exercicio = {
  id: number;
  treino_id: number;
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number | null;
};
