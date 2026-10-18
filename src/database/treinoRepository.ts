import { db } from './conexao';
import type { RepetirTreino, StatusTreino } from './tipos';

export type NovoTreino = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes?: string;
  status?: StatusTreino;
  horario?: string | null;
  repetir?: RepetirTreino | string;
};

export type ExercicioParaSalvar = {
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso?: number;
  concluida?: number;
};

export const OCORRENCIAS_SEMANAIS = 4;

function formatarHoraAtual(): string {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function formatarDataBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

function somarDiasDataBr(dataBr: string, dias: number): string {
  const [dia, mes, ano] = dataBr.split('/').map(Number);
  return formatarDataBr(new Date(ano, mes - 1, dia + dias));
}

function inserirExercicios(treinoId: number, exercicios: ExercicioParaSalvar[]): void {
  for (const ex of exercicios) {
    db.runSync(
      `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, concluida) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        treinoId,
        ex.nome,
        ex.series,
        ex.repeticoes,
        ex.carga,
        ex.descanso ?? null,
        ex.concluida ?? 0,
      ]
    );
  }
}

function inserirTreino(treino: NovoTreino, exercicios: ExercicioParaSalvar[]): number {
  const resultado = db.runSync(
    `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      treino.nome,
      treino.data,
      treino.duracao,
      treino.grupo_muscular,
      treino.observacoes ?? null,
      treino.status ?? 'concluido',
      treino.horario ?? null,
      treino.repetir ?? 'uma_vez',
    ]
  );

  inserirExercicios(resultado.lastInsertRowId, exercicios);
  return resultado.lastInsertRowId;
}

export function salvarTreinoComExercicios(
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[]
): number {
  let treinoId = 0;

  db.withTransactionSync(() => {
    treinoId = inserirTreino(treino, exercicios);
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
          SET nome = ?,
              data = ?,
              duracao = ?,
              grupo_muscular = ?,
              observacoes = ?,
              status = COALESCE(?, status),
              horario = COALESCE(?, horario),
              repetir = COALESCE(?, repetir)
        WHERE id = ?`,
      [
        treino.nome,
        treino.data,
        treino.duracao,
        treino.grupo_muscular,
        treino.observacoes ?? null,
        treino.status ?? null,
        treino.horario ?? null,
        treino.repetir ?? null,
        id,
      ]
    );

    db.runSync('DELETE FROM exercicios WHERE treino_id = ?', [id]);
    inserirExercicios(id, exercicios);
  });
}

export function agendarTreino(
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[]
): number {
  return salvarTreinoComExercicios(
    {
      ...treino,
      status: 'agendado',
      horario: treino.horario ?? formatarHoraAtual(),
      repetir: treino.repetir ?? 'uma_vez',
    },
    exercicios
  );
}

export function agendarTreinoRecorrente(
  treino: NovoTreino,
  exercicios: ExercicioParaSalvar[],
  ocorrencias: number = OCORRENCIAS_SEMANAIS
): number[] {
  const ids: number[] = [];

  db.withTransactionSync(() => {
    for (let semana = 0; semana < ocorrencias; semana++) {
      ids.push(
        inserirTreino(
          {
            ...treino,
            data: somarDiasDataBr(treino.data, semana * 7),
            status: 'agendado',
            horario: treino.horario ?? formatarHoraAtual(),
            repetir: 'semanal',
          },
          exercicios
        )
      );
    }
  });

  return ids;
}

export function concluirTreinoAoVivo(
  id: number,
  duracaoRealMinutos?: number,
  exerciciosExecutados?: ExercicioParaSalvar[]
): void {
  db.withTransactionSync(() => {
    if (duracaoRealMinutos !== undefined) {
      db.runSync(
        `UPDATE treinos SET status = 'concluido', duracao = ? WHERE id = ?`,
        [duracaoRealMinutos, id]
      );
    } else {
      db.runSync(`UPDATE treinos SET status = 'concluido' WHERE id = ?`, [id]);
    }

    if (exerciciosExecutados && exerciciosExecutados.length > 0) {
      db.runSync('DELETE FROM exercicios WHERE treino_id = ?', [id]);
      inserirExercicios(
        id,
        exerciciosExecutados.map((ex) => ({
          ...ex,
          concluida: ex.concluida ?? 1,
        }))
      );
    } else {
      db.runSync(`UPDATE exercicios SET concluida = 1 WHERE treino_id = ?`, [id]);
    }
  });
}

export function reagendarTreinoParaHoje(id: number, novoHorario?: string): void {
  const agora = new Date();
  const hoje = formatarDataBr(agora);

  db.withTransactionSync(() => {
    let horarioFinal = novoHorario ?? null;

    if (!horarioFinal) {
      const atual = db.getAllSync<{ horario: string | null }>(
        'SELECT horario FROM treinos WHERE id = ? LIMIT 1;',
        [id]
      );
      const horarioSalvo = atual[0]?.horario;
      if (horarioSalvo) {
        const [h, m] = horarioSalvo.trim().split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const dataHoraHoje = new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate(),
            h,
            m,
            0
          );
          if (dataHoraHoje.getTime() <= agora.getTime()) {
            const futuro = new Date(agora.getTime() + 60 * 60 * 1000);
            if (futuro.getDate() !== agora.getDate()) {
              horarioFinal = '23:59';
            } else {
              const fh = String(futuro.getHours()).padStart(2, '0');
              const fm = String(futuro.getMinutes()).padStart(2, '0');
              horarioFinal = `${fh}:${fm}`;
            }
          }
        }
      } else {
        horarioFinal = '23:59';
      }
    }

    db.runSync(
      `UPDATE treinos
          SET data = ?,
              status = 'agendado',
              horario = COALESCE(?, horario)
        WHERE id = ?`,
      [hoje, horarioFinal, id]
    );
  });
}

export function atualizarStatusTreino(id: number, novoStatus: StatusTreino): void {
  db.withTransactionSync(() => {
    db.runSync(`UPDATE treinos SET status = ? WHERE id = ?`, [novoStatus, id]);
  });
}

export function marcarExercicioConcluido(
  exercicioId: number,
  concluida: boolean | number = 1
): void {
  const val = typeof concluida === 'boolean' ? (concluida ? 1 : 0) : concluida;
  db.runSync(`UPDATE exercicios SET concluida = ? WHERE id = ?`, [val, exercicioId]);
}

export function excluirTreino(id: number): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM exercicios WHERE treino_id = ?', [id]);
    db.runSync('DELETE FROM treinos WHERE id = ?', [id]);
  });
}