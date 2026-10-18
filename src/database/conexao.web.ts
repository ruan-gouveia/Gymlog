import type { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';

import type { ConfiguracoesUsuario, Exercicio, StatusTreino, Treino } from './tipos';

type ConfigWeb = ConfiguracoesUsuario & {
  antecedencia_lembrete: number;
};

type EstadoBancoWeb = {
  nextTreinoId: number;
  nextExercicioId: number;
  treinos: Treino[];
  exercicios: Exercicio[];
  configuracoes_usuario: ConfigWeb[];
};

export const NOME_BANCO = 'gymlog.db';
const STORAGE_KEY = 'gymlog_sqlite_web_v3';

function criarEstadoInicial(): EstadoBancoWeb {
  return {
    nextTreinoId: 1,
    nextExercicioId: 1,
    treinos: [],
    exercicios: [],
    configuracoes_usuario: [
      {
        id: 1,
        meta_semanal: 3,
        nome_usuario: 'Usuário',
        lembretes_ativo: 1,
        horario_lembretes: '18:00',
        dias_lembretes: 'Seg, Qua e Sex',
        antecedencia_lembrete: 30,
      },
    ],
  };
}

function carregarEstado(): EstadoBancoWeb {
  if (typeof window === 'undefined' || !window.localStorage) {
    return criarEstadoInicial();
  }
  try {
    const bruto = window.localStorage.getItem(STORAGE_KEY);
    if (!bruto) return criarEstadoInicial();
    const parsed = JSON.parse(bruto) as Partial<EstadoBancoWeb>;
    return {
      nextTreinoId: parsed.nextTreinoId ?? 1,
      nextExercicioId: parsed.nextExercicioId ?? 1,
      treinos: Array.isArray(parsed.treinos) ? parsed.treinos : [],
      exercicios: Array.isArray(parsed.exercicios) ? parsed.exercicios : [],
      configuracoes_usuario:
        Array.isArray(parsed.configuracoes_usuario) && parsed.configuracoes_usuario.length > 0
          ? parsed.configuracoes_usuario
          : criarEstadoInicial().configuracoes_usuario,
    };
  } catch {
    return criarEstadoInicial();
  }
}

let estado = carregarEstado();
let emTransacao = false;

function persistirEstado(): void {
  if (emTransacao) return;
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // Ignora falha de quota no localStorage
  }
}

function chaveDataIso(dataBr: string): string {
  const p = (dataBr || '').trim().split('/');
  if (p.length !== 3) return dataBr;
  return `${p[2]}${p[1]}${p[0]}`;
}

function normalizarSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

function normalizarParametros(params: unknown[]): unknown[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0] as unknown[];
  }
  return params;
}

function executarRunSync(sqlBruto: string, ...rawParams: unknown[]): SQLiteRunResult {
  const sql = normalizarSql(sqlBruto);
  const sqlUpper = sql.toUpperCase();
  const params = normalizarParametros(rawParams);

  if (
    sqlUpper.startsWith('PRAGMA') ||
    sqlUpper.startsWith('CREATE TABLE') ||
    sqlUpper.startsWith('CREATE INDEX') ||
    sqlUpper.startsWith('ALTER TABLE')
  ) {
    return { lastInsertRowId: 0, changes: 0 };
  }

  if (sqlUpper.startsWith('DELETE FROM EXERCICIOS WHERE TREINO_ID = ?')) {
    const treinoId = Number(params[0]);
    const antes = estado.exercicios.length;
    estado.exercicios = estado.exercicios.filter((e) => e.treino_id !== treinoId);
    persistirEstado();
    return { lastInsertRowId: 0, changes: antes - estado.exercicios.length };
  }

  if (sqlUpper.startsWith('DELETE FROM EXERCICIOS')) {
    const antes = estado.exercicios.length;
    estado.exercicios = [];
    persistirEstado();
    return { lastInsertRowId: 0, changes: antes };
  }

  if (sqlUpper.startsWith('DELETE FROM TREINOS WHERE ID = ?')) {
    const id = Number(params[0]);
    const antes = estado.treinos.length;
    estado.treinos = estado.treinos.filter((t) => t.id !== id);
    estado.exercicios = estado.exercicios.filter((e) => e.treino_id !== id);
    persistirEstado();
    return { lastInsertRowId: 0, changes: antes - estado.treinos.length };
  }

  if (sqlUpper.startsWith('DELETE FROM TREINOS')) {
    const antes = estado.treinos.length;
    estado.treinos = [];
    estado.exercicios = [];
    estado.nextTreinoId = 1;
    estado.nextExercicioId = 1;
    persistirEstado();
    return { lastInsertRowId: 0, changes: antes };
  }

  if (sqlUpper.startsWith('DELETE FROM CONFIGURACOES_USUARIO')) {
    const antes = estado.configuracoes_usuario.length;
    estado.configuracoes_usuario = [];
    persistirEstado();
    return { lastInsertRowId: 0, changes: antes };
  }

  if (sqlUpper.startsWith('INSERT INTO TREINOS')) {
    const statusSql = sqlUpper.includes("'AGENDADO'")
      ? 'agendado'
      : sqlUpper.includes("'NAO_REALIZADO'")
      ? 'nao_realizado'
      : 'concluido';
    const id = estado.nextTreinoId++;
    const novo: Treino = {
      id,
      nome: String(params[0] ?? ''),
      data: String(params[1] ?? ''),
      duracao: Number(params[2] ?? 0),
      grupo_muscular: String(params[3] ?? ''),
      observacoes: params[4] != null ? String(params[4]) : null,
      status: (params[5] != null ? String(params[5]) : statusSql) as StatusTreino,
      horario: params[6] !== undefined ? (params[6] != null ? String(params[6]) : null) : '18:00',
      repetir: (params[7] != null ? String(params[7]) : 'uma_vez') as Treino['repetir'],
    };
    estado.treinos.push(novo);
    persistirEstado();
    return { lastInsertRowId: id, changes: 1 };
  }

  if (sqlUpper.startsWith('INSERT INTO EXERCICIOS')) {
    const id = estado.nextExercicioId++;
    const novo: Exercicio = {
      id,
      treino_id: Number(params[0]),
      nome: String(params[1] ?? ''),
      series: Number(params[2] ?? 1),
      repeticoes: Number(params[3] ?? 0),
      carga: Number(params[4] ?? 0),
      descanso: params[5] != null ? Number(params[5]) : null,
      concluida: params.length >= 7 ? Number(params[6] ?? 0) : 1,
    };
    estado.exercicios.push(novo);
    persistirEstado();
    return { lastInsertRowId: id, changes: 1 };
  }

  if (sqlUpper.startsWith('INSERT OR IGNORE INTO CONFIGURACOES_USUARIO')) {
    if (estado.configuracoes_usuario.length === 0) {
      estado.configuracoes_usuario.push({
        id: 1,
        meta_semanal: params[1] != null ? Number(params[1]) : 3,
        nome_usuario: params[2] != null ? String(params[2]) : 'Usuário',
        lembretes_ativo: params[3] != null ? Number(params[3]) : 1,
        horario_lembretes: params[4] != null ? String(params[4]) : '18:00',
        dias_lembretes: params[5] != null ? String(params[5]) : 'Seg, Qua e Sex',
        antecedencia_lembrete: params[6] != null ? Number(params[6]) : 30,
      });
      persistirEstado();
      return { lastInsertRowId: 1, changes: 1 };
    }
    return { lastInsertRowId: 1, changes: 0 };
  }

  if (sqlUpper.startsWith('UPDATE TREINOS')) {
    if (sqlUpper.includes('SET NOME = ?')) {
      const id = Number(params[8]);
      const t = estado.treinos.find((item) => item.id === id);
      if (t) {
        t.nome = String(params[0]);
        t.data = String(params[1]);
        t.duracao = Number(params[2]);
        t.grupo_muscular = String(params[3]);
        t.observacoes = params[4] != null ? String(params[4]) : null;
        if (params[5] != null) t.status = String(params[5]) as StatusTreino;
        if (params[6] != null) t.horario = String(params[6]);
        if (params[7] != null) t.repetir = String(params[7]) as Treino['repetir'];
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (sqlUpper.includes("SET STATUS = 'CONCLUIDO', DURACAO = ?")) {
      const duracao = Number(params[0]);
      const id = Number(params[1]);
      const t = estado.treinos.find((item) => item.id === id);
      if (t) {
        t.status = 'concluido';
        t.duracao = duracao;
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (sqlUpper.includes("SET STATUS = 'CONCLUIDO' WHERE ID = ?")) {
      const id = Number(params[0]);
      const t = estado.treinos.find((item) => item.id === id);
      if (t) {
        t.status = 'concluido';
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (sqlUpper.includes('SET DATA = ?') && sqlUpper.includes("STATUS = 'AGENDADO'")) {
      const novaData = String(params[0]);
      const novoHorario = params[1] != null ? String(params[1]) : null;
      const id = Number(params[2]);
      const t = estado.treinos.find((item) => item.id === id);
      if (t) {
        t.data = novaData;
        t.status = 'agendado';
        if (novoHorario != null) t.horario = novoHorario;
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (sqlUpper.includes('SET STATUS = ? WHERE ID = ?')) {
      const novoStatus = String(params[0]) as StatusTreino;
      const id = Number(params[1]);
      const t = estado.treinos.find((item) => item.id === id);
      if (t) {
        t.status = novoStatus;
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }
  }

  if (sqlUpper.startsWith('UPDATE EXERCICIOS')) {
    if (sqlUpper.includes('SET CONCLUIDA = 1 WHERE TREINO_ID = ?')) {
      const treinoId = Number(params[0]);
      let changes = 0;
      for (const ex of estado.exercicios) {
        if (ex.treino_id === treinoId) {
          ex.concluida = 1;
          changes++;
        }
      }
      persistirEstado();
      return { lastInsertRowId: 0, changes };
    }

    if (sqlUpper.includes('SET CONCLUIDA = ? WHERE ID = ?')) {
      const val = Number(params[0]);
      const id = Number(params[1]);
      const ex = estado.exercicios.find((item) => item.id === id);
      if (ex) {
        ex.concluida = val;
        persistirEstado();
        return { lastInsertRowId: id, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }
  }

  if (sqlUpper.startsWith('UPDATE CONFIGURACOES_USUARIO')) {
    const cfg = estado.configuracoes_usuario[0] ?? criarEstadoInicial().configuracoes_usuario[0];
    if (estado.configuracoes_usuario.length === 0) {
      estado.configuracoes_usuario.push(cfg);
    }

    if (sqlUpper.includes('SET META_SEMANAL = ? WHERE ID = 1')) {
      cfg.meta_semanal = Number(params[0]);
    } else if (sqlUpper.includes('SET LEMBRETES_ATIVO = ?, ANTECEDENCIA_LEMBRETE = ?')) {
      cfg.lembretes_ativo = Number(params[0]);
      cfg.antecedencia_lembrete = Number(params[1]);
    } else if (
      sqlUpper.includes('SET LEMBRETES_ATIVO = ?') &&
      sqlUpper.includes('HORARIO_LEMBRETES = COALESCE')
    ) {
      cfg.lembretes_ativo = Number(params[0]);
      if (params[1] != null) cfg.horario_lembretes = String(params[1]);
      if (params[2] != null) cfg.dias_lembretes = String(params[2]);
    } else if (sqlUpper.includes('SET META_SEMANAL = ?, NOME_USUARIO = ?')) {
      cfg.meta_semanal = Number(params[0]);
      cfg.nome_usuario = String(params[1]);
      cfg.lembretes_ativo = Number(params[2]);
      cfg.horario_lembretes = String(params[3]);
      cfg.dias_lembretes = String(params[4]);
    }

    persistirEstado();
    return { lastInsertRowId: 1, changes: 1 };
  }

  return { lastInsertRowId: 0, changes: 0 };
}

function executarGetAllSync<T>(sqlBruto: string, ...rawParams: unknown[]): T[] {
  const sql = normalizarSql(sqlBruto);
  const sqlUpper = sql.toUpperCase();
  const params = normalizarParametros(rawParams);

  if (sqlUpper.startsWith('PRAGMA TABLE_INFO(TREINOS)')) {
    return [
      { name: 'id' },
      { name: 'nome' },
      { name: 'data' },
      { name: 'duracao' },
      { name: 'grupo_muscular' },
      { name: 'observacoes' },
      { name: 'status' },
      { name: 'horario' },
      { name: 'repetir' },
    ] as unknown as T[];
  }

  if (sqlUpper.startsWith('PRAGMA TABLE_INFO(EXERCICIOS)')) {
    return [
      { name: 'id' },
      { name: 'treino_id' },
      { name: 'nome' },
      { name: 'series' },
      { name: 'repeticoes' },
      { name: 'carga' },
      { name: 'descanso' },
      { name: 'concluida' },
    ] as unknown as T[];
  }

  if (sqlUpper.startsWith('PRAGMA TABLE_INFO(CONFIGURACOES_USUARIO)')) {
    return [
      { name: 'id' },
      { name: 'meta_semanal' },
      { name: 'nome_usuario' },
      { name: 'lembretes_ativo' },
      { name: 'horario_lembretes' },
      { name: 'dias_lembretes' },
      { name: 'antecedencia_lembrete' },
    ] as unknown as T[];
  }

  if (sqlUpper.includes('FROM SQLITE_MASTER')) {
    return [
      { name: 'treinos' },
      { name: 'exercicios' },
      { name: 'configuracoes_usuario' },
    ] as unknown as T[];
  }

  if (sqlUpper.includes('FROM CONFIGURACOES_USUARIO')) {
    return estado.configuracoes_usuario.slice(0, 1) as unknown as T[];
  }

  if (sqlUpper.startsWith('SELECT COUNT(*) AS TOTAL FROM TREINOS')) {
    if (sqlUpper.includes("WHERE STATUS = 'CONCLUIDO'")) {
      const total = estado.treinos.filter((t) => t.status === 'concluido').length;
      return [{ total }] as unknown as T[];
    }
    return [{ total: estado.treinos.length }] as unknown as T[];
  }

  if (sqlUpper.startsWith('SELECT HORARIO FROM TREINOS WHERE ID = ?')) {
    const id = Number(params[0]);
    const t = estado.treinos.find((item) => item.id === id);
    return (t ? [{ horario: t.horario }] : []) as unknown as T[];
  }

  if (sqlUpper.includes('LOWER(TRIM(E.NOME)) AS NOME_NORMALIZADO')) {
    const concluidosIds = new Set(
      estado.treinos.filter((t) => t.status === 'concluido').map((t) => t.id)
    );
    const treinoMap = new Map(estado.treinos.map((t) => [t.id, t]));
    const grupos = new Map<
      string,
      { nome_normalizado: string; treino_id: number; carga_maxima: number; dataIso: string }
    >();

    for (const ex of estado.exercicios) {
      if (!concluidosIds.has(ex.treino_id) || ex.carga <= 0) continue;
      const nomeNorm = ex.nome.trim().toLowerCase();
      const chave = `${nomeNorm}::${ex.treino_id}`;
      const t = treinoMap.get(ex.treino_id)!;
      const existente = grupos.get(chave);
      if (!existente || ex.carga > existente.carga_maxima) {
        grupos.set(chave, {
          nome_normalizado: nomeNorm,
          treino_id: ex.treino_id,
          carga_maxima: ex.carga,
          dataIso: chaveDataIso(t.data),
        });
      }
    }

    return Array.from(grupos.values())
      .sort((a, b) => a.dataIso.localeCompare(b.dataIso) || a.treino_id - b.treino_id)
      .map(({ nome_normalizado, treino_id, carga_maxima }) => ({
        nome_normalizado,
        treino_id,
        carga_maxima,
      })) as unknown as T[];
  }

  if (
    sqlUpper.includes('SELECT ID, DATA FROM TREINOS') &&
    sqlUpper.includes("WHERE STATUS = 'CONCLUIDO'")
  ) {
    return estado.treinos
      .filter((t) => t.status === 'concluido')
      .sort(
        (a, b) => chaveDataIso(b.data).localeCompare(chaveDataIso(a.data)) || b.id - a.id
      )
      .map((t) => ({ id: t.id, data: t.data })) as unknown as T[];
  }

  if (
    sqlUpper.startsWith(
      'SELECT ID, NOME, DATA, DURACAO, GRUPO_MUSCULAR, OBSERVACOES, STATUS, HORARIO, REPETIR FROM TREINOS'
    )
  ) {
    if (sqlUpper.includes("WHERE STATUS = 'AGENDADO'")) {
      return estado.treinos
        .filter((t) => t.status === 'agendado')
        .sort(
          (a, b) =>
            chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)) ||
            (a.horario ?? '').localeCompare(b.horario ?? '') ||
            a.id - b.id
        ) as unknown as T[];
    }
    return estado.treinos
      .slice()
      .sort(
        (a, b) => chaveDataIso(b.data).localeCompare(chaveDataIso(a.data)) || b.id - a.id
      ) as unknown as T[];
  }

  if (
    sqlUpper.startsWith(
      'SELECT ID, TREINO_ID, NOME, SERIES, REPETICOES, CARGA, DESCANSO, CONCLUIDA FROM EXERCICIOS'
    )
  ) {
    return estado.exercicios
      .slice()
      .sort((a, b) => a.treino_id - b.treino_id || a.id - b.id) as unknown as T[];
  }

  if (
    sqlUpper.startsWith(
      'SELECT T.ID, T.DATA, T.STATUS, T.GRUPO_MUSCULAR, E.REPETICOES, E.CARGA FROM TREINOS T LEFT JOIN EXERCICIOS E'
    )
  ) {
    const linhas: {
      id: number;
      data: string;
      status: string;
      grupo_muscular: string;
      repeticoes: number | null;
      carga: number | null;
    }[] = [];

    const treinosOrdenados = estado.treinos
      .slice()
      .sort((a, b) => chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)));

    for (const t of treinosOrdenados) {
      const exs = estado.exercicios.filter((e) => e.treino_id === t.id);
      if (exs.length === 0) {
        linhas.push({
          id: t.id,
          data: t.data,
          status: t.status,
          grupo_muscular: t.grupo_muscular,
          repeticoes: null,
          carga: null,
        });
      } else {
        for (const e of exs) {
          linhas.push({
            id: t.id,
            data: t.data,
            status: t.status,
            grupo_muscular: t.grupo_muscular,
            repeticoes: e.repeticoes,
            carga: e.carga,
          });
        }
      }
    }
    return linhas as unknown as T[];
  }

  if (
    sqlUpper.startsWith('SELECT NOME, DATA, GRUPO_MUSCULAR FROM TREINOS') ||
    sqlUpper.startsWith('SELECT NOME, GRUPO_MUSCULAR, HORARIO, DATA FROM TREINOS')
  ) {
    return estado.treinos
      .filter((t) => t.status === 'agendado')
      .sort(
        (a, b) =>
          chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)) ||
          (a.horario ?? '').localeCompare(b.horario ?? '') ||
          a.id - b.id
      ) as unknown as T[];
  }

  if (sqlUpper.includes('E.NOME AS EXERCICIO_NOME') && sqlUpper.includes('WHERE T.DATA = ?')) {
    const dataBr = String(params[0]);
    const treinosDia = estado.treinos
      .filter((t) => t.data === dataBr)
      .sort((a, b) => {
        const pesoA = a.status === 'agendado' ? 0 : 1;
        const pesoB = b.status === 'agendado' ? 0 : 1;
        return pesoA - pesoB || b.id - a.id;
      });

    const linhas: unknown[] = [];
    for (const t of treinosDia) {
      const exs = estado.exercicios.filter((e) => e.treino_id === t.id);
      if (exs.length === 0) {
        linhas.push({
          id: t.id,
          nome: t.nome,
          data: t.data,
          horario: t.horario,
          grupo_muscular: t.grupo_muscular,
          duracao: t.duracao,
          status: t.status,
          exercicio_nome: null,
          repeticoes: null,
          carga: null,
        });
      } else {
        for (const e of exs) {
          linhas.push({
            id: t.id,
            nome: t.nome,
            data: t.data,
            horario: t.horario,
            grupo_muscular: t.grupo_muscular,
            duracao: t.duracao,
            status: t.status,
            exercicio_nome: e.nome,
            repeticoes: e.repeticoes,
            carga: e.carga,
          });
        }
      }
    }
    return linhas as T[];
  }

  if (
    sqlUpper.startsWith('SELECT ID, NOME, DATA, GRUPO_MUSCULAR, HORARIO, STATUS FROM TREINOS')
  ) {
    return estado.treinos
      .filter((t) => t.status === 'agendado' || t.status === 'nao_realizado')
      .sort(
        (a, b) =>
          chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)) ||
          (a.horario ?? '').localeCompare(b.horario ?? '') ||
          a.id - b.id
      ) as unknown as T[];
  }

  if (
    sqlUpper.includes('COUNT(DISTINCT E.NOME) AS TOTAL_EXERCICIOS') &&
    sqlUpper.includes("WHERE T.STATUS = 'CONCLUIDO'")
  ) {
    const limite = Number(params[0] ?? 5);
    return estado.treinos
      .filter((t) => t.status === 'concluido')
      .sort(
        (a, b) => chaveDataIso(b.data).localeCompare(chaveDataIso(a.data)) || b.id - a.id
      )
      .slice(0, limite)
      .map((t) => {
        const exs = estado.exercicios.filter((e) => e.treino_id === t.id);
        const nomes = new Set(exs.map((e) => e.nome));
        const volume = exs.reduce((acc, e) => acc + e.repeticoes * e.carga, 0);
        return {
          id: t.id,
          nome: t.nome,
          grupo_muscular: t.grupo_muscular,
          data: t.data,
          duracao: t.duracao,
          total_exercicios: nomes.size,
          volume,
        };
      }) as unknown as T[];
  }

  if (sqlUpper.startsWith('SELECT DISTINCT DATA FROM TREINOS')) {
    if (sqlUpper.includes('WHERE DATA IN')) {
      const datasSet = new Set(params.map(String));
      const encontradas = new Set<string>();
      for (const t of estado.treinos) {
        if (datasSet.has(t.data)) {
          encontradas.add(t.data);
        }
      }
      return Array.from(encontradas).map((data) => ({ data })) as unknown as T[];
    }
    const encontradas = new Set(estado.treinos.map((t) => t.data));
    return Array.from(encontradas).map((data) => ({ data })) as unknown as T[];
  }

  if (sqlUpper.includes('COUNT(DISTINCT E.NOME) AS TOTAL_EXERCICIOS')) {
    return estado.treinos
      .slice()
      .sort(
        (a, b) => chaveDataIso(b.data).localeCompare(chaveDataIso(a.data)) || b.id - a.id
      )
      .map((t) => {
        const exs = estado.exercicios.filter((e) => e.treino_id === t.id);
        const nomes = new Set(exs.map((e) => e.nome));
        const volume = exs.reduce((acc, e) => acc + e.repeticoes * e.carga, 0);
        return {
          id: t.id,
          nome: t.nome,
          grupo_muscular: t.grupo_muscular,
          data: t.data,
          duracao: t.duracao,
          status: t.status,
          horario: t.horario,
          total_exercicios: nomes.size,
          volume,
        };
      }) as unknown as T[];
  }

  if (sqlUpper.includes('E.ID AS EXERCICIO_ID') && sqlUpper.includes('WHERE T.ID = ?')) {
    const id = Number(params[0]);
    const t = estado.treinos.find((item) => item.id === id);
    if (!t) return [];
    const exs = estado.exercicios
      .filter((e) => e.treino_id === id)
      .sort((a, b) => a.id - b.id);

    if (exs.length === 0) {
      return [
        {
          ...t,
          exercicio_id: null,
          exercicio_nome: null,
          numero_serie: null,
          repeticoes: null,
          carga: null,
          descanso: null,
          concluida: null,
        },
      ] as unknown as T[];
    }

    return exs.map((e) => ({
      ...t,
      exercicio_id: e.id,
      exercicio_nome: e.nome,
      numero_serie: e.series,
      repeticoes: e.repeticoes,
      carga: e.carga,
      descanso: e.descanso,
      concluida: e.concluida,
    })) as unknown as T[];
  }

  if (sqlUpper.startsWith('SELECT DATA AS DATA_MAX FROM TREINOS')) {
    const concluidos = estado.treinos.filter((t) => t.status === 'concluido');
    if (concluidos.length === 0) return [];
    const ordenado = concluidos
      .slice()
      .sort((a, b) => chaveDataIso(b.data).localeCompare(chaveDataIso(a.data)));
    return [{ data_max: ordenado[0].data }] as unknown as T[];
  }

  if (sqlUpper.includes('COUNT(ID) AS TOTAL_TREINOS') && sqlUpper.includes('FROM TREINOS')) {
    const concluidos = estado.treinos.filter((t) => t.status === 'concluido');
    const total_treinos = concluidos.length;
    const tempo_total = concluidos.reduce((acc, t) => acc + (t.duracao || 0), 0);
    return [{ total_treinos, tempo_total }] as unknown as T[];
  }

  if (sqlUpper.includes('COUNT(ID) AS TOTAL_SERIES') && sqlUpper.includes('FROM EXERCICIOS')) {
    const idsConcluidos = new Set(
      estado.treinos.filter((t) => t.status === 'concluido').map((t) => t.id)
    );
    const exsConcluidos = estado.exercicios.filter((e) => idsConcluidos.has(e.treino_id));
    const total_series = exsConcluidos.length;
    const volume_total = exsConcluidos.reduce((acc, e) => acc + e.repeticoes * e.carga, 0);
    return [{ total_series, volume_total }] as unknown as T[];
  }

  if (sqlUpper.includes('GRUPO_MUSCULAR, COUNT(ID) AS TOTAL FROM TREINOS')) {
    const contagem = new Map<string, number>();
    for (const t of estado.treinos) {
      if (t.status !== 'concluido') continue;
      contagem.set(t.grupo_muscular, (contagem.get(t.grupo_muscular) ?? 0) + 1);
    }
    const lista = Array.from(contagem.entries())
      .map(([grupo_muscular, total]) => ({ grupo_muscular, total }))
      .sort((a, b) => b.total - a.total || a.grupo_muscular.localeCompare(b.grupo_muscular));
    return lista.slice(0, 1) as unknown as T[];
  }

  if (sqlUpper.includes('GRUPO_MUSCULAR AS GRUPO, COUNT(ID) AS QUANTIDADE FROM TREINOS')) {
    const contagem = new Map<string, number>();
    for (const t of estado.treinos) {
      if (t.status !== 'concluido') continue;
      contagem.set(t.grupo_muscular, (contagem.get(t.grupo_muscular) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .map(([grupo, quantidade]) => ({ grupo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade || a.grupo.localeCompare(b.grupo)) as unknown as T[];
  }

  if (sqlUpper.includes('T.ID AS TREINO_ID, T.NOME AS TREINO_NOME')) {
    return estado.treinos
      .filter((t) => t.status === 'concluido')
      .sort((a, b) => chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)) || a.id - b.id)
      .map((t) => {
        const exs = estado.exercicios.filter((e) => e.treino_id === t.id);
        return {
          treino_id: t.id,
          treino_nome: t.nome,
          data: t.data,
          duracao: t.duracao,
          grupo_muscular: t.grupo_muscular,
          total_series: exs.length,
          volume: exs.reduce((acc, e) => acc + e.repeticoes * e.carga, 0),
        };
      }) as unknown as T[];
  }

  if (sqlUpper.includes('COUNT(DISTINCT E.TREINO_ID) AS TOTALTREINOS FROM EXERCICIOS E')) {
    const idsConcluidos = new Set(
      estado.treinos.filter((t) => t.status === 'concluido').map((t) => t.id)
    );
    const porNome = new Map<string, Set<number>>();
    for (const e of estado.exercicios) {
      if (!idsConcluidos.has(e.treino_id)) continue;
      const conj = porNome.get(e.nome) ?? new Set<number>();
      conj.add(e.treino_id);
      porNome.set(e.nome, conj);
    }
    return Array.from(porNome.entries())
      .map(([nome, ids]) => ({ nome, totalTreinos: ids.size }))
      .sort((a, b) => b.totalTreinos - a.totalTreinos || a.nome.localeCompare(b.nome)) as unknown as T[];
  }

  if (sqlUpper.includes('MAX(E.CARGA) AS CARGA_MAXIMA') && sqlUpper.includes('WHERE E.NOME = ?')) {
    const nomeExercicio = String(params[0]);
    const treinoMap = new Map(
      estado.treinos.filter((t) => t.status === 'concluido').map((t) => [t.id, t])
    );
    const porTreino = new Map<number, Exercicio[]>();

    for (const e of estado.exercicios) {
      if (e.nome !== nomeExercicio) continue;
      if (!treinoMap.has(e.treino_id)) continue;
      const lista = porTreino.get(e.treino_id) ?? [];
      lista.push(e);
      porTreino.set(e.treino_id, lista);
    }

    return Array.from(porTreino.entries())
      .map(([treino_id, exs]) => {
        const t = treinoMap.get(treino_id)!;
        return {
          treino_id,
          data: t.data,
          carga_maxima: Math.max(...exs.map((e) => e.carga)),
          volume_total: exs.reduce((acc, e) => acc + e.repeticoes * e.carga, 0),
          repeticoes_max: Math.max(...exs.map((e) => e.repeticoes)),
          total_series: exs.length,
        };
      })
      .sort(
        (a, b) => chaveDataIso(a.data).localeCompare(chaveDataIso(b.data)) || a.treino_id - b.treino_id
      ) as unknown as T[];
  }

  return [];
}

const dbWeb = {
  execSync(_source: string): void {
    // No-op na Web (schema gerenciado em memória + localStorage)
  },
  runSync(source: string, ...params: unknown[]): SQLiteRunResult {
    return executarRunSync(source, ...params);
  },
  getAllSync<T>(source: string, ...params: unknown[]): T[] {
    return executarGetAllSync<T>(source, ...params);
  },
  withTransactionSync(task: () => void): void {
    emTransacao = true;
    try {
      task();
    } finally {
      emTransacao = false;
      persistirEstado();
    }
  },
} as unknown as SQLiteDatabase;

export const db: SQLiteDatabase = dbWeb;
