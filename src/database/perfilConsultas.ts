import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from './conexao';
import { obterConfiguracoesUsuario } from './configuracoesRepository';
import { obterResumoSemana } from './inicioConsultas';
import type { ConfiguracoesUsuario, Exercicio, Treino } from './tipos';

export type EstatisticasPerfil = {
  totalTreinos: number;
  totalRecordes: number;
  sequenciaSemanas: number;
};

export type ConfiguracaoLembretes = {
  ativo: boolean;
  antecedenciaMinutos: number;
  horarioPadrao: string;
  diasPadrao: string;
};

export type TreinoBackupItem = Treino & {
  exercicios: Exercicio[];
};

export type BackupGymLog = {
  app: string;
  versao: string;
  exportadoEm: string;
  resumo: {
    totalTreinos: number;
    totalTreinosConcluidos: number;
    totalExercicios: number;
    totalRecordes: number;
    sequenciaSemanas: number;
  };
  configuracoesUsuario: ConfiguracoesUsuario & {
    antecedencia_lembrete: number;
  };
  treinos: TreinoBackupItem[];
};

let colunaAntecedenciaVerificada = false;

export function garantirColunaAntecedencia(): void {
  if (colunaAntecedenciaVerificada) return;
  try {
    const colunas = db.getAllSync<{ name: string }>('PRAGMA table_info(configuracoes_usuario);');
    const existe = colunas.some((c) => c.name === 'antecedencia_lembrete');
    if (!existe) {
      db.runSync(
        'ALTER TABLE configuracoes_usuario ADD COLUMN antecedencia_lembrete INTEGER NOT NULL DEFAULT 30;'
      );
    }
    colunaAntecedenciaVerificada = true;
  } catch (error) {
    console.warn('[PerfilConsultas] Aviso ao verificar coluna antecedencia_lembrete:', error);
  }
}

export function obterConfiguracaoLembretes(): ConfiguracaoLembretes {
  garantirColunaAntecedencia();
  const base = obterConfiguracoesUsuario();

  try {
    const linhas = db.getAllSync<{
      lembretes_ativo: number;
      antecedencia_lembrete: number | null;
      horario_lembretes: string | null;
      dias_lembretes: string | null;
    }>(
      `SELECT lembretes_ativo, antecedencia_lembrete, horario_lembretes, dias_lembretes
         FROM configuracoes_usuario
        WHERE id = 1
        LIMIT 1;`
    );

    if (linhas.length > 0) {
      const linha = linhas[0];
      const antecedencia = linha.antecedencia_lembrete ?? 30;
      return {
        ativo: linha.lembretes_ativo === 1,
        antecedenciaMinutos: Math.max(5, Math.min(60, antecedencia)),
        horarioPadrao: linha.horario_lembretes ?? '18:00',
        diasPadrao: linha.dias_lembretes ?? 'Seg, Qua e Sex',
      };
    }
  } catch (error) {
    console.warn('[PerfilConsultas] Falha ao ler antecedencia_lembrete:', error);
  }

  return {
    ativo: base.lembretes_ativo === 1,
    antecedenciaMinutos: 30,
    horarioPadrao: base.horario_lembretes ?? '18:00',
    diasPadrao: base.dias_lembretes ?? 'Seg, Qua e Sex',
  };
}

export function salvarConfiguracaoLembretes(
  ativo: boolean,
  antecedenciaMinutos: number
): ConfiguracaoLembretes {
  garantirColunaAntecedencia();
  const antecedenciaValida = Math.max(5, Math.min(60, Math.round(antecedenciaMinutos)));
  const ativoInt = ativo ? 1 : 0;

  obterConfiguracoesUsuario();

  db.runSync(
    `UPDATE configuracoes_usuario
        SET lembretes_ativo = ?,
            antecedencia_lembrete = ?
      WHERE id = 1;`,
    [ativoInt, antecedenciaValida]
  );

  return obterConfiguracaoLembretes();
}

export function obterTotalTreinosConcluidos(): number {
  const resultado = db.getAllSync<{ total: number }>(
    `SELECT COUNT(*) AS total
       FROM treinos
      WHERE status = 'concluido';`
  );
  return resultado[0]?.total ?? 0;
}

export function obterTotalRecordes(): number {
  const sessoesPorExercicio = db.getAllSync<{
    nome_normalizado: string;
    treino_id: number;
    data: string;
    carga_maxima: number;
  }>(
    `SELECT
       LOWER(TRIM(e.nome)) AS nome_normalizado,
       t.id AS treino_id,
       t.data AS data,
       MAX(e.carga) AS carga_maxima
     FROM exercicios e
     INNER JOIN treinos t ON t.id = e.treino_id
     WHERE t.status = 'concluido'
       AND e.carga > 0
     GROUP BY LOWER(TRIM(e.nome)), t.id
     ORDER BY
       LOWER(TRIM(e.nome)) ASC,
       substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) ASC,
       t.id ASC;`
  );

  if (sessoesPorExercicio.length === 0) {
    return 0;
  }

  const recordeAtualPorExercicio = new Map<string, number>();
  let recordesSuperados = 0;

  for (const sessao of sessoesPorExercicio) {
    const anterior = recordeAtualPorExercicio.get(sessao.nome_normalizado);
    if (anterior === undefined) {
      recordeAtualPorExercicio.set(sessao.nome_normalizado, sessao.carga_maxima);
    } else if (sessao.carga_maxima > anterior) {
      recordesSuperados += 1;
      recordeAtualPorExercicio.set(sessao.nome_normalizado, sessao.carga_maxima);
    }
  }

  if (recordesSuperados === 0) {
    return recordeAtualPorExercicio.size;
  }

  return recordesSuperados;
}

function parseDataBr(dataStr: string): Date | null {
  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return null;
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const ano = parseInt(partes[2], 10);
  if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(ano)) return null;
  const dt = new Date(ano, mes, dia, 12, 0, 0, 0);
  if (dt.getFullYear() !== ano || dt.getMonth() !== mes || dt.getDate() !== dia) {
    return null;
  }
  return dt;
}

function obterDomingoDaSemana(data: Date): Date {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate() - data.getDay(),
    0,
    0,
    0,
    0
  );
}

function chaveSemana(domingo: Date): string {
  const ano = domingo.getFullYear();
  const mes = String(domingo.getMonth() + 1).padStart(2, '0');
  const dia = String(domingo.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function obterSequenciaSemanasNaMeta(metaSemanalParam?: number): number {
  const config = obterConfiguracoesUsuario();
  const metaSemanal = Math.max(1, metaSemanalParam ?? config.meta_semanal ?? 3);

  if (metaSemanalParam === undefined) {
    try {
      const resumo = obterResumoSemana();
      if (resumo.semanasSeguidas > 0) {
        return resumo.semanasSeguidas;
      }
    } catch {
      // Continua para o cálculo direto caso ocorra erro
    }
  }

  const treinosConcluidos = db.getAllSync<{ id: number; data: string }>(
    `SELECT id, data
       FROM treinos
      WHERE status = 'concluido'
      ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) DESC, id DESC;`
  );

  if (treinosConcluidos.length === 0) {
    return 0;
  }

  const treinosPorSemana = new Map<string, number>();
  let dataMaisRecente: Date | null = null;

  for (const t of treinosConcluidos) {
    const dt = parseDataBr(t.data);
    if (!dt) continue;

    if (!dataMaisRecente || dt.getTime() > dataMaisRecente.getTime()) {
      dataMaisRecente = dt;
    }

    const domingo = obterDomingoDaSemana(dt);
    const chave = chaveSemana(domingo);
    treinosPorSemana.set(chave, (treinosPorSemana.get(chave) ?? 0) + 1);
  }

  if (treinosPorSemana.size === 0) {
    return 0;
  }

  const ref = dataMaisRecente ?? new Date();
  const cursor = obterDomingoDaSemana(ref);

  let sequencia = 0;
  let tolerouPrimeiraSemanaParcial = false;

  for (let i = 0; i < 104; i++) {
    const chave = chaveSemana(cursor);
    const concluidosNaSemana = treinosPorSemana.get(chave) ?? 0;

    if (concluidosNaSemana >= metaSemanal) {
      sequencia += 1;
      cursor.setDate(cursor.getDate() - 7);
      continue;
    }

    if (sequencia === 0 && !tolerouPrimeiraSemanaParcial && i === 0) {
      tolerouPrimeiraSemanaParcial = true;
      cursor.setDate(cursor.getDate() - 7);
      continue;
    }

    break;
  }

  return sequencia;
}

export function obterEstatisticasPerfil(metaSemanalParam?: number): EstatisticasPerfil {
  const totalTreinos = obterTotalTreinosConcluidos();
  const totalRecordes = obterTotalRecordes();
  const sequenciaSemanas = obterSequenciaSemanasNaMeta(metaSemanalParam);

  return {
    totalTreinos,
    totalRecordes,
    sequenciaSemanas,
  };
}

export function obterDadosParaBackup(): BackupGymLog {
  const configBase = obterConfiguracoesUsuario();
  const configLembretes = obterConfiguracaoLembretes();
  const estatisticas = obterEstatisticasPerfil(configBase.meta_semanal);

  const treinos = db.getAllSync<Treino>(
    `SELECT id, nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir
       FROM treinos
      ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) DESC, id DESC;`
  );

  const exercicios = db.getAllSync<Exercicio>(
    `SELECT id, treino_id, nome, series, repeticoes, carga, descanso, concluida
       FROM exercicios
      ORDER BY treino_id ASC, id ASC;`
  );

  const exerciciosPorTreino = new Map<number, Exercicio[]>();
  for (const ex of exercicios) {
    const lista = exerciciosPorTreino.get(ex.treino_id) ?? [];
    lista.push(ex);
    exerciciosPorTreino.set(ex.treino_id, lista);
  }

  const treinosComExercicios: TreinoBackupItem[] = treinos.map((t) => ({
    ...t,
    exercicios: exerciciosPorTreino.get(t.id) ?? [],
  }));

  return {
    app: 'GymLog',
    versao: '2.0.0',
    exportadoEm: new Date().toISOString(),
    resumo: {
      totalTreinos: treinos.length,
      totalTreinosConcluidos: estatisticas.totalTreinos,
      totalExercicios: exercicios.length,
      totalRecordes: estatisticas.totalRecordes,
      sequenciaSemanas: estatisticas.sequenciaSemanas,
    },
    configuracoesUsuario: {
      ...configBase,
      lembretes_ativo: configLembretes.ativo ? 1 : 0,
      antecedencia_lembrete: configLembretes.antecedenciaMinutos,
    },
    treinos: treinosComExercicios,
  };
}

export async function exportarBancoParaJson(): Promise<{
  compartilhado: boolean;
  uri: string;
  totalTreinos: number;
}> {
  const dados = obterDadosParaBackup();
  const conteudoJson = JSON.stringify(dados, null, 2);
  const dataSlug = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `gymlog-backup-${dataSlug}.json`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([conteudoJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      compartilhado: true,
      uri: nomeArquivo,
      totalTreinos: dados.treinos.length,
    };
  }

  const arquivo = new File(Paths.cache, nomeArquivo);
  if (arquivo.exists) {
    arquivo.delete();
  }
  arquivo.create();
  arquivo.write(conteudoJson);

  const uri = arquivo.uri;
  const disponivel = await Sharing.isAvailableAsync();

  if (disponivel) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar Backup do GymLog (JSON)',
      UTI: 'public.json',
    });
    return {
      compartilhado: true,
      uri,
      totalTreinos: dados.treinos.length,
    };
  }

  return {
    compartilhado: false,
    uri,
    totalTreinos: dados.treinos.length,
  };
}
