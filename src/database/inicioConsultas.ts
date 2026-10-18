import { db } from './conexao';
import { obterConfiguracoesUsuario } from './configuracoesRepository';
import { ajustarStatusTemporal } from './treinoConsultas';

export type ResumoSemana = {
  treinosConcluidos: number;
  metaSemanal: number;
  porcentagem: number;
  semanasSeguidas: number;
  volumeSemana: number;
  proximoTreino: string | null;
  proximoTreinoData: string | null;
};

export type TreinoDiaItem = {
  id: number;
  nome: string;
  data: string;
  horario: string | null;
  grupo_muscular: string;
  duracao: number;
  status: 'agendado' | 'concluido' | 'nao_realizado';
  totalExercicios: number;
  totalSeries: number;
  volume: number;
};

export type TreinoPendenteItem = {
  id: number;
  nome: string;
  data: string;
  dataLegivel: string;
  grupo_muscular: string;
  horario: string | null;
};

export type UltimoTreinoItem = {
  id: number;
  nome: string;
  grupo_muscular: string;
  data: string;
  dataLegivel: string;
  duracao: number;
  totalExercicios: number;
  volume: number;
};

export type DiaAgendaItem = {
  data: string;
  diaSemana: string;
  diaNumero: number;
  temTreino: boolean;
  isHoje: boolean;
};

const DIAS_SEMANA_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const DIAS_SEMANA_MIN = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
const MESES_NOMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

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

export function formatarDataExtenso(d: Date): string {
  const nomeDia = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ][d.getDay()];
  const dia = d.getDate();
  const mes = MESES_NOMES[d.getMonth()];
  return `${nomeDia}, ${dia} de ${mes}`;
}

export function formatarDataLegivel(d: Date): string {
  const diaSemana = DIAS_SEMANA_MIN[d.getDay()];
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${diaSemana}, ${dia}/${mes}`;
}

function calcularSequenciaSemanas(
  treinos: Map<number, { data: string; status: string; volume: number }>,
  dataRef: Date
): number {
  const semanasComTreino = new Set<string>();

  for (const [, t] of treinos) {
    if (t.status === 'concluido') {
      const dt = parseDataBr(t.data);
      const diff = dt.getDay();
      const dom = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - diff);
      const chave = `${dom.getFullYear()}-${dom.getMonth()}-${dom.getDate()}`;
      semanasComTreino.add(chave);
    }
  }

  let streak = 0;
  const cursor = new Date(
    dataRef.getFullYear(),
    dataRef.getMonth(),
    dataRef.getDate() - dataRef.getDay()
  );

  for (let i = 0; i < 52; i++) {
    const chave = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (semanasComTreino.has(chave)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 7);
        continue;
      }
      break;
    }
  }

  return Math.max(1, streak);
}

export function obterResumoSemana(dataRef?: Date): ResumoSemana {
  const agora = dataRef ?? new Date();
  const diffParaDomingo = agora.getDay();
  const domingo = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate() - diffParaDomingo,
    0, 0, 0
  );
  const sabado = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate() - diffParaDomingo + 6,
    23, 59, 59
  );

  const config = obterConfiguracoesUsuario();
  const metaSemanal = config.meta_semanal || 3;

  const todasLinhas = db.getAllSync<{
    id: number;
    data: string;
    status: string;
    grupo_muscular: string;
    repeticoes: number | null;
    carga: number | null;
  }>(
    `SELECT t.id, t.data, t.status, t.grupo_muscular, e.repeticoes, e.carga
       FROM treinos t
       LEFT JOIN exercicios e ON e.treino_id = t.id
      ORDER BY substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) ASC`
  );

  const treinosPorId = new Map<number, {
    data: string;
    status: string;
    grupo_muscular: string;
    volume: number;
  }>();

  for (const l of todasLinhas) {
    if (!treinosPorId.has(l.id)) {
      treinosPorId.set(l.id, {
        data: l.data,
        status: l.status,
        grupo_muscular: l.grupo_muscular,
        volume: 0,
      });
    }
    if (l.repeticoes != null && l.carga != null) {
      const atual = treinosPorId.get(l.id)!;
      atual.volume += l.repeticoes * l.carga;
    }
  }

  let treinosConcluidosSemana = 0;
  let volumeSemana = 0;

  for (const [, t] of treinosPorId) {
    const dataTreino = parseDataBr(t.data);
    const time = dataTreino.getTime();

    if (time >= domingo.getTime() && time <= sabado.getTime() && t.status === 'concluido') {
      treinosConcluidosSemana += 1;
      volumeSemana += t.volume;
    }
  }

  let proximoTreino: string | null = null;
  let proximoTreinoData: string | null = null;
  const proximosAgendados = db.getAllSync<{ nome: string; data: string; grupo_muscular: string }>(
    `SELECT nome, data, grupo_muscular
       FROM treinos
      WHERE status = 'agendado'
      ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) ASC, id ASC`
  );

  const amanhaInicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1, 0, 0, 0);

  for (const p of proximosAgendados) {
    const dataP = parseDataBr(p.data);
    dataP.setHours(0, 0, 0, 0);
    if (dataP.getTime() >= amanhaInicio.getTime()) {
      proximoTreino = p.grupo_muscular || p.nome;
      proximoTreinoData = formatarDataLegivel(dataP);
      break;
    }
  }

  const semanasSeguidas = calcularSequenciaSemanas(treinosPorId, agora);
  const porcentagem = Math.min(100, Math.round((treinosConcluidosSemana / metaSemanal) * 100));

  return {
    treinosConcluidos: treinosConcluidosSemana,
    metaSemanal,
    porcentagem,
    semanasSeguidas,
    volumeSemana,
    proximoTreino,
    proximoTreinoData,
  };
}

export function obterTreinosDoDia(dataBr: string): TreinoDiaItem[] {
  const hojeStr = formatarDataBr(new Date());
  const linhas = db.getAllSync<{
    id: number;
    nome: string;
    data: string;
    horario: string | null;
    grupo_muscular: string;
    duracao: number;
    status: 'agendado' | 'concluido' | 'nao_realizado';
    exercicio_nome: string | null;
    repeticoes: number | null;
    carga: number | null;
  }>(
    `SELECT t.id, t.nome, t.data, t.horario, t.grupo_muscular, t.duracao, t.status,
            e.nome AS exercicio_nome, e.repeticoes, e.carga
       FROM treinos t
       LEFT JOIN exercicios e ON e.treino_id = t.id
      WHERE t.data = ?
      ORDER BY CASE WHEN t.status = 'agendado' THEN 0 ELSE 1 END, t.id DESC`,
    [dataBr]
  );

  if (linhas.length === 0) return [];

  const treinosMap = new Map<number, {
    id: number;
    nome: string;
    data: string;
    horario: string | null;
    grupo_muscular: string;
    duracao: number;
    status: 'agendado' | 'concluido' | 'nao_realizado';
    exerciciosNomes: Set<string>;
    totalSeries: number;
    volume: number;
  }>();

  for (const l of linhas) {
    if (!treinosMap.has(l.id)) {
      treinosMap.set(l.id, {
        id: l.id,
        nome: l.nome,
        data: l.data,
        horario: l.horario,
        grupo_muscular: l.grupo_muscular,
        duracao: l.duracao,
        status: ajustarStatusTemporal(l.status, l.data, l.horario),
        exerciciosNomes: new Set(),
        totalSeries: 0,
        volume: 0,
      });
    }

    const t = treinosMap.get(l.id)!;
    if (l.exercicio_nome) {
      t.exerciciosNomes.add(l.exercicio_nome);
      t.totalSeries += 1;
    }
    if (l.repeticoes != null && l.carga != null) {
      t.volume += l.repeticoes * l.carga;
    }
  }

  return Array.from(treinosMap.values())
    .filter((t) => !(dataBr === hojeStr && t.status === 'nao_realizado'))
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      data: t.data,
      horario: t.horario,
      grupo_muscular: t.grupo_muscular,
      duracao: t.duracao,
      status: t.status,
      totalExercicios: t.exerciciosNomes.size,
      totalSeries: t.totalSeries,
      volume: t.volume,
    }));
}

export function obterTreinosPendentes(_dataHojeBr?: string): TreinoPendenteItem[] {
  const hojeStr = formatarDataBr(new Date());

  const linhas = db.getAllSync<{
    id: number;
    nome: string;
    data: string;
    grupo_muscular: string;
    horario: string | null;
    status: 'agendado' | 'concluido' | 'nao_realizado';
  }>(
    `SELECT id, nome, data, grupo_muscular, horario, status
       FROM treinos
      WHERE status IN ('agendado', 'nao_realizado')
      ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) ASC, horario ASC, id ASC`
  );

  const pendentes: TreinoPendenteItem[] = [];

  for (const l of linhas) {
    const statusCalculado = ajustarStatusTemporal('agendado', l.data, l.horario);

    if (statusCalculado === 'nao_realizado') {
      const dataTreino = parseDataBr(l.data);
      const baseLegivel = formatarDataLegivel(dataTreino);
      const dataLegivel =
        l.data === hojeStr && l.horario ? `${baseLegivel} às ${l.horario}` : baseLegivel;

      pendentes.push({
        id: l.id,
        nome: l.nome,
        data: l.data,
        dataLegivel,
        grupo_muscular: l.grupo_muscular,
        horario: l.horario,
      });
    }
  }

  return pendentes;
}

export function obterUltimosTreinos(limite = 5): UltimoTreinoItem[] {
  const linhas = db.getAllSync<{
    id: number;
    nome: string;
    grupo_muscular: string;
    data: string;
    duracao: number;
    total_exercicios: number;
    volume: number;
  }>(
    `SELECT t.id, t.nome, t.grupo_muscular, t.data, t.duracao,
            COUNT(DISTINCT e.nome) AS total_exercicios,
            COALESCE(SUM(e.repeticoes * e.carga), 0) AS volume
       FROM treinos t
       LEFT JOIN exercicios e ON e.treino_id = t.id
      WHERE t.status = 'concluido'
      GROUP BY t.id
      ORDER BY substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) DESC, t.id DESC
      LIMIT ?`,
    [limite]
  );

  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    grupo_muscular: l.grupo_muscular,
    data: l.data,
    dataLegivel: formatarDataLegivel(parseDataBr(l.data)),
    duracao: l.duracao,
    totalExercicios: l.total_exercicios,
    volume: l.volume,
  }));
}

export function obterDiasAgenda(dataRef?: Date): DiaAgendaItem[] {
  const agora = dataRef ?? new Date();
  const diffParaDomingo = agora.getDay();
  const domingo = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate() - diffParaDomingo,
    12, 0, 0
  );

  const hojeStr = formatarDataBr(new Date());

  const datasNoBanco = new Set<string>();
  const treinosDatas = db.getAllSync<{ data: string }>(
    `SELECT DISTINCT data FROM treinos`
  );
  for (const t of treinosDatas) {
    datasNoBanco.add(t.data);
  }

  const dias: DiaAgendaItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate() + i, 12, 0, 0);
    const dataFormatada = formatarDataBr(d);

    dias.push({
      data: dataFormatada,
      diaSemana: DIAS_SEMANA_ABREV[d.getDay()],
      diaNumero: d.getDate(),
      temTreino: datasNoBanco.has(dataFormatada),
      isHoje: dataFormatada === hojeStr,
    });
  }

  return dias;
}
