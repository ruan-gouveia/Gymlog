import { db } from './index';

export type ResumoEstatisticas = {
  totalTreinos: number;
  volumeTotal: number;
  tempoTotalMinutos: number;
  totalSeries: number;
  grupoMaisTreinado: string | null;
};

export type GrupoMuscularDistribuicao = {
  grupo: string;
  quantidade: number;
  porcentagem: number;
};

export type PeriodoFiltro = 'dias' | 'semanas' | 'meses';

export type PontoVolumeTreino = {
  treinoId: number;
  nome: string;
  data: string;
  rotulo: string;
  volume: number;
  duracao: number;
  grupoMuscular: string;
  totalSeries: number;
  totalTreinos?: number;
};

export type PontoEvolucaoExercicio = {
  treinoId: number;
  data: string;
  rotulo: string;
  cargaMaxima: number;
  volumeTotal: number;
  repeticoesMax: number;
  totalSeries: number;
};

export type ExercicioDisponivel = {
  nome: string;
  totalTreinos: number;
};

export function parseDataBr(dataStr: string): Date {
  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return new Date();
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const ano = parseInt(partes[2], 10);
  return new Date(ano, mes, dia, 12, 0, 0);
}

export function formatarDataBr(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function formatarDiaMes(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}`;
}

const DIAS_SEMANA_SIGLAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES_SIGLAS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type IntervaloPeriodo = {
  inicio: Date;
  fim: Date;
  rotulo: string;
  dataFormatada: string;
};

function obterDataReferencia(): Date {
  const linhaMax = db.getAllSync<{ data_max: string }>(
    `SELECT data AS data_max FROM treinos 
     ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) DESC 
     LIMIT 1`
  );
  const agora = new Date();
  if (linhaMax.length > 0 && linhaMax[0].data_max) {
    const dataUltimo = parseDataBr(linhaMax[0].data_max);
    if (dataUltimo.getTime() > agora.getTime()) {
      return dataUltimo;
    }
  }
  return agora;
}

function gerarIntervalos(periodo: PeriodoFiltro, dataRef: Date): IntervaloPeriodo[] {
  if (periodo === 'dias') {
    // 7 dias da semana: Domingo a Sábado (Domingo como primeiro dia da semana em todos os gráficos)
    const diffParaDomingo = dataRef.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const domingoSemanaAtual = new Date(
      dataRef.getFullYear(),
      dataRef.getMonth(),
      dataRef.getDate() - diffParaDomingo,
      0, 0, 0
    );

    const dias: IntervaloPeriodo[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(
        domingoSemanaAtual.getFullYear(),
        domingoSemanaAtual.getMonth(),
        domingoSemanaAtual.getDate() + i,
        0, 0, 0
      );
      const inicio = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const fim = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      dias.push({
        inicio,
        fim,
        rotulo: DIAS_SEMANA_SIGLAS[d.getDay()],
        dataFormatada: formatarDataBr(d),
      });
    }
    return dias;
  }

  if (periodo === 'semanas') {
    // 4 semanas de calendário: Domingo a Sábado (Regra de negócio: Domingo é o primeiro dia e Sábado o último)
    const diffParaDomingo = dataRef.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const domingoSemanaAtual = new Date(
      dataRef.getFullYear(),
      dataRef.getMonth(),
      dataRef.getDate() - diffParaDomingo,
      0, 0, 0
    );

    const semanas: IntervaloPeriodo[] = [];
    for (let i = 3; i >= 0; i--) {
      const inicio = new Date(
        domingoSemanaAtual.getFullYear(),
        domingoSemanaAtual.getMonth(),
        domingoSemanaAtual.getDate() - i * 7,
        0, 0, 0
      );
      const fim = new Date(
        inicio.getFullYear(),
        inicio.getMonth(),
        inicio.getDate() + 6,
        23, 59, 59, 999
      );
      const numSemana = 4 - i;
      semanas.push({
        inicio,
        fim,
        rotulo: `Sem ${numSemana}`,
        dataFormatada: `${formatarDiaMes(inicio)} a ${formatarDiaMes(fim)}`,
      });
    }
    return semanas;
  }

  // 'meses' (6 meses)
  const meses: IntervaloPeriodo[] = [];
  for (let i = 5; i >= 0; i--) {
    const ano = dataRef.getFullYear();
    const mesIndex = dataRef.getMonth() - i;
    const inicio = new Date(ano, mesIndex, 1, 0, 0, 0);
    const fim = new Date(ano, mesIndex + 1, 0, 23, 59, 59, 999);
    meses.push({
      inicio,
      fim,
      rotulo: MESES_SIGLAS[inicio.getMonth()],
      dataFormatada: `${MESES_NOMES[inicio.getMonth()]}/${inicio.getFullYear()}`,
    });
  }
  return meses;
}

export function obterResumoEstatisticas(): ResumoEstatisticas {
  const treinosInfo = db.getAllSync<{ total_treinos: number; tempo_total: number }>(
    `SELECT 
       COUNT(id) AS total_treinos,
       COALESCE(SUM(duracao), 0) AS tempo_total
     FROM treinos`
  );

  const seriesInfo = db.getAllSync<{ total_series: number; volume_total: number }>(
    `SELECT 
       COUNT(id) AS total_series,
       COALESCE(SUM(repeticoes * carga), 0) AS volume_total
     FROM exercicios`
  );

  const grupoMaisTreinadoRow = db.getAllSync<{ grupo_muscular: string; total: number }>(
    `SELECT 
       grupo_muscular,
       COUNT(id) AS total
     FROM treinos
     GROUP BY grupo_muscular
     ORDER BY total DESC, grupo_muscular ASC
     LIMIT 1`
  );

  const totalTreinos = treinosInfo[0]?.total_treinos ?? 0;
  const tempoTotalMinutos = treinosInfo[0]?.tempo_total ?? 0;
  const totalSeries = seriesInfo[0]?.total_series ?? 0;
  const volumeTotal = seriesInfo[0]?.volume_total ?? 0;
  const grupoMaisTreinado = grupoMaisTreinadoRow[0]?.grupo_muscular ?? null;

  return {
    totalTreinos,
    volumeTotal,
    tempoTotalMinutos,
    totalSeries,
    grupoMaisTreinado,
  };
}

export function obterDistribuicaoGruposMusculares(): GrupoMuscularDistribuicao[] {
  const linhas = db.getAllSync<{ grupo: string; quantidade: number }>(
    `SELECT 
       grupo_muscular AS grupo,
       COUNT(id) AS quantidade
     FROM treinos
     GROUP BY grupo_muscular
     ORDER BY quantidade DESC, grupo ASC`
  );

  const total = linhas.reduce((acc, curr) => acc + curr.quantidade, 0);
  if (total === 0) return [];

  return linhas.map((linha) => ({
    grupo: linha.grupo,
    quantidade: linha.quantidade,
    porcentagem: Math.round((linha.quantidade / total) * 100),
  }));
}

export function obterEvolucaoVolumeTreinos(periodo: PeriodoFiltro = 'semanas'): PontoVolumeTreino[] {
  const dataRef = obterDataReferencia();
  const intervalos = gerarIntervalos(periodo, dataRef);

  const linhas = db.getAllSync<{
    treino_id: number;
    treino_nome: string;
    data: string;
    duracao: number;
    grupo_muscular: string;
    total_series: number;
    volume: number;
  }>(
    `SELECT
       t.id AS treino_id,
       t.nome AS treino_nome,
       t.data AS data,
       t.duracao AS duracao,
       t.grupo_muscular AS grupo_muscular,
       COUNT(e.id) AS total_series,
       COALESCE(SUM(e.repeticoes * e.carga), 0) AS volume
     FROM treinos t
     LEFT JOIN exercicios e ON e.treino_id = t.id
     GROUP BY t.id
     ORDER BY
       substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) ASC,
       t.id ASC`
  );

  const treinosComData = linhas.map((t) => ({
    ...t,
    dataDate: parseDataBr(t.data),
  }));

  return intervalos.map((intervalo) => {
    const treinosDoPeriodo = treinosComData.filter(
      (t) => t.dataDate >= intervalo.inicio && t.dataDate <= intervalo.fim
    );

    if (treinosDoPeriodo.length === 0) {
      return {
        treinoId: 0,
        nome: 'Nenhum treino',
        data: intervalo.dataFormatada,
        rotulo: intervalo.rotulo,
        volume: 0,
        duracao: 0,
        grupoMuscular: '',
        totalSeries: 0,
        totalTreinos: 0,
      };
    }

    const volumeTotal = treinosDoPeriodo.reduce((acc, t) => acc + t.volume, 0);
    const duracaoTotal = treinosDoPeriodo.reduce((acc, t) => acc + t.duracao, 0);
    const totalSeries = treinosDoPeriodo.reduce((acc, t) => acc + t.total_series, 0);
    const grupos = Array.from(
      new Set(treinosDoPeriodo.map((t) => t.grupo_muscular).filter(Boolean))
    ).join(', ');

    const nome =
      treinosDoPeriodo.length === 1
        ? treinosDoPeriodo[0].treino_nome
        : `${treinosDoPeriodo.length} treinos no período`;

    return {
      treinoId: treinosDoPeriodo[treinosDoPeriodo.length - 1].treino_id,
      nome,
      data: intervalo.dataFormatada,
      rotulo: intervalo.rotulo,
      volume: volumeTotal,
      duracao: duracaoTotal,
      grupoMuscular: grupos,
      totalSeries,
      totalTreinos: treinosDoPeriodo.length,
    };
  });
}

export function obterExerciciosDisponiveis(): ExercicioDisponivel[] {
  return db.getAllSync<ExercicioDisponivel>(
    `SELECT 
       e.nome,
       COUNT(DISTINCT e.treino_id) AS totalTreinos
     FROM exercicios e
     GROUP BY e.nome
     ORDER BY totalTreinos DESC, e.nome ASC`
  );
}

export function obterEvolucaoExercicio(
  nomeExercicio: string,
  periodo: PeriodoFiltro = 'semanas'
): PontoEvolucaoExercicio[] {
  const dataRef = obterDataReferencia();
  const intervalos = gerarIntervalos(periodo, dataRef);

  const linhas = db.getAllSync<{
    treino_id: number;
    data: string;
    carga_maxima: number;
    volume_total: number;
    repeticoes_max: number;
    total_series: number;
  }>(
    `SELECT
       t.id AS treino_id,
       t.data AS data,
       MAX(e.carga) AS carga_maxima,
       SUM(e.repeticoes * e.carga) AS volume_total,
       MAX(e.repeticoes) AS repeticoes_max,
       COUNT(e.id) AS total_series
     FROM exercicios e
     JOIN treinos t ON t.id = e.treino_id
     WHERE e.nome = ?
     GROUP BY t.id
     ORDER BY
       substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) ASC,
       t.id ASC`,
    [nomeExercicio]
  );

  const registrosComData = linhas.map((r) => ({
    ...r,
    dataDate: parseDataBr(r.data),
  }));

  const dataInicioPrimeiroIntervalo = intervalos[0]?.inicio ?? new Date();
  const anteriores = registrosComData.filter((r) => r.dataDate < dataInicioPrimeiroIntervalo);

  let ultimaCargaConhecida =
    anteriores.length > 0
      ? anteriores[anteriores.length - 1].carga_maxima
      : registrosComData[0]?.carga_maxima ?? 0;

  let ultimasRepsConhecidas =
    anteriores.length > 0
      ? anteriores[anteriores.length - 1].repeticoes_max
      : registrosComData[0]?.repeticoes_max ?? 0;

  return intervalos.map((intervalo) => {
    const registrosDoPeriodo = registrosComData.filter(
      (r) => r.dataDate >= intervalo.inicio && r.dataDate <= intervalo.fim
    );

    if (registrosDoPeriodo.length === 0) {
      return {
        treinoId: 0,
        data: intervalo.dataFormatada,
        rotulo: intervalo.rotulo,
        cargaMaxima: ultimaCargaConhecida,
        volumeTotal: 0,
        repeticoesMax: ultimasRepsConhecidas,
        totalSeries: 0,
      };
    }

    const cargaMaxima = Math.max(...registrosDoPeriodo.map((r) => r.carga_maxima));
    const repeticoesMax = Math.max(...registrosDoPeriodo.map((r) => r.repeticoes_max));
    const volumeTotal = registrosDoPeriodo.reduce((acc, r) => acc + r.volume_total, 0);
    const totalSeries = registrosDoPeriodo.reduce((acc, r) => acc + r.total_series, 0);

    ultimaCargaConhecida = cargaMaxima;
    ultimasRepsConhecidas = repeticoesMax;

    return {
      treinoId: registrosDoPeriodo[registrosDoPeriodo.length - 1].treino_id,
      data: intervalo.dataFormatada,
      rotulo: intervalo.rotulo,
      cargaMaxima,
      volumeTotal,
      repeticoesMax,
      totalSeries,
    };
  });
}
