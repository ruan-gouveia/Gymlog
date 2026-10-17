export type StatusTreino = 'agendado' | 'concluido' | 'nao_realizado';
export type RepetirTreino = 'uma_vez' | 'semanal';

export type Treino = {
  id: number;
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string | null;
  status: StatusTreino;
  horario: string | null;
  repetir: RepetirTreino | string;
};

export type Exercicio = {
  id: number;
  treino_id: number;
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number | null;
  concluida: number;
};

export type ConfiguracoesUsuario = {
  id: number;
  meta_semanal: number;
  nome_usuario: string;
  lembretes_ativo: number;
  horario_lembretes: string | null;
  dias_lembretes: string | null;
};
