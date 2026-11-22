import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  obterDistribuicaoGruposMusculares,
  obterEvolucaoExercicio,
  obterEvolucaoVolumeTreinos,
  obterExerciciosDisponiveis,
  obterResumoEstatisticas,
} from '@/database/estatisticasConsultas';
import { obterDadosParaRelatorio } from '@/database/perfilConsultas';
import type { Exercicio, StatusTreino } from '@/database/tipos';

const COR = {
  fundo: '#11122B',
  card: '#1B1D3A',
  borda: '#2E3160',
  primaria: '#5C7CFA',
  texto: '#F3F4FF',
  muted: '#A3A6CC',
  perigo: '#F2677A',
};

const PALETA = ['#5C7CFA', '#2F9E6B', '#F59F00', '#F2677A', '#9775FA', '#22B8CF', '#FF922B'];

const STATUS_LABEL: Record<StatusTreino, { texto: string; cor: string }> = {
  concluido: { texto: 'Concluído', cor: '#2F9E6B' },
  agendado: { texto: 'Agendado', cor: COR.primaria },
  nao_realizado: { texto: 'Não realizado', cor: COR.perigo },
};

function esc(valor: unknown): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarDuracao(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`;
}

function formatarNumero(n: number): string {
  return Math.round(n).toLocaleString('pt-BR');
}

function agruparExercicios(lista: Exercicio[]): { nome: string; series: Exercicio[] }[] {
  const grupos: { nome: string; series: Exercicio[] }[] = [];
  for (const ex of lista) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nome === ex.nome) ultimo.series.push(ex);
    else grupos.push({ nome: ex.nome, series: [ex] });
  }
  return grupos;
}


type PontoGrafico = { rotulo: string; valor: number };

function svgBarras(dados: PontoGrafico[]): string {
  const W = 520, H = 190, pl = 10, pr = 10, pt = 24, pb = 28;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const slot = (W - pl - pr) / dados.length;
  const bw = Math.min(48, slot * 0.6);
  const alturaUtil = H - pt - pb;

  const barras = dados
    .map((d, i) => {
      const h = (d.valor / max) * alturaUtil;
      const x = pl + slot * i + (slot - bw) / 2;
      const y = H - pb - h;
      const cx = x + bw / 2;
      return `
        <rect x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 0)}" rx="4" fill="${COR.primaria}" />
        <text x="${cx}" y="${y - 6}" text-anchor="middle" font-size="10" fill="#444">${
          d.valor > 0 ? formatarNumero(d.valor) : '–'
        }</text>
        <text x="${cx}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#666">${esc(d.rotulo)}</text>`;
    })
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pl}" y1="${H - pb}" x2="${W - pr}" y2="${H - pb}" stroke="#D5D9F2" />
    ${barras}
  </svg>`;
}

function svgLinha(dados: PontoGrafico[], cor: string): string {
  const W = 520, H = 170, pl = 30, pr = 30, pt = 26, pb = 28;
  const max = Math.max(...dados.map((d) => d.valor), 1);
  const min = Math.min(...dados.map((d) => d.valor));
  const faixa = max - min || 1;
  const alturaUtil = H - pt - pb;

  const pontos = dados.map((d, i) => ({
    x: dados.length === 1 ? W / 2 : pl + ((W - pl - pr) * i) / (dados.length - 1),
    y: pt + alturaUtil - ((d.valor - min) / faixa) * alturaUtil * 0.85 - alturaUtil * 0.075,
    ...d,
  }));

  const caminho = pontos.map((p) => `${p.x},${p.y}`).join(' ');
  const marcadores = pontos
    .map(
      (p) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#fff" stroke="${cor}" stroke-width="2" />
      <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="10" fill="#444">${esc(p.valor)} kg</text>
      <text x="${p.x}" y="${H - 10}" text-anchor="middle" font-size="10" fill="#666">${esc(p.rotulo)}</text>`
    )
    .join('');

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="${pl - 10}" y1="${H - pb}" x2="${W - pr + 10}" y2="${H - pb}" stroke="#D5D9F2" />
    <polyline points="${caminho}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round" />
    ${marcadores}
  </svg>`;
}

function htmlRosca(grupos: { grupo: string; quantidade: number; porcentagem: number }[]): string {
  const total = grupos.reduce((a, g) => a + g.quantidade, 0);
  const r = 52;
  const C = 2 * Math.PI * r;
  let acumulado = 0;

  const segmentos = grupos
    .map((g, i) => {
      const len = (g.quantidade / total) * C;
      const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${PALETA[i % PALETA.length]}"
        stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acumulado}"
        transform="rotate(-90 70 70)" />`;
      acumulado += len;
      return seg;
    })
    .join('');

  const legenda = grupos
    .map(
      (g, i) => `
      <div class="leg-item">
        <span class="leg-cor" style="background:${PALETA[i % PALETA.length]}"></span>
        ${esc(g.grupo)} · ${g.quantidade} (${g.porcentagem}%)
      </div>`
    )
    .join('');

  return `<div class="rosca">
    <svg viewBox="0 0 140 140" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
      ${segmentos}
      <text x="70" y="68" text-anchor="middle" font-size="20" font-weight="700" fill="${COR.fundo}">${total}</text>
      <text x="70" y="84" text-anchor="middle" font-size="9" fill="#666">treinos</text>
    </svg>
    <div class="legenda">${legenda}</div>
  </div>`;
}


function montarHtml(nomeUsuario?: string): { html: string; totalTreinos: number } {
  const relatorio = obterDadosParaRelatorio();
  const resumo = obterResumoEstatisticas();
  const grupos = obterDistribuicaoGruposMusculares();
  const usuario = nomeUsuario || relatorio.configuracoesUsuario.nome_usuario || 'Atleta';
  const geradoEm = new Date().toLocaleString('pt-BR');

  const volumeSemanas = obterEvolucaoVolumeTreinos('semanas').map((p) => ({
    rotulo: p.rotulo,
    valor: p.volume,
  }));
  const volumeMeses = obterEvolucaoVolumeTreinos('meses').map((p) => ({
    rotulo: p.rotulo,
    valor: p.volume,
  }));

  const topExercicios = obterExerciciosDisponiveis().slice(0, 3);
  const graficosExercicios = topExercicios
    .map((ex, i) => {
      const pontos = obterEvolucaoExercicio(ex.nome, 'meses').map((p) => ({
        rotulo: p.rotulo,
        valor: p.cargaMaxima,
      }));
      return `
      <div class="grafico">
        <div class="grafico-titulo">${esc(ex.nome)} <small>· carga máxima (${ex.totalTreinos} treinos)</small></div>
        ${svgLinha(pontos, PALETA[i % PALETA.length])}
      </div>`;
    })
    .join('');

  const secaoGraficos = `
  <h2>Evolução do volume</h2>
  <div class="grafico">
    <div class="grafico-titulo">Volume por semana <small>(kg)</small></div>
    ${svgBarras(volumeSemanas)}
  </div>
  <div class="grafico">
    <div class="grafico-titulo">Volume por mês <small>(kg)</small></div>
    ${svgBarras(volumeMeses)}
  </div>

  <h2>Distribuição por grupo muscular</h2>
  <div class="grafico">
    ${grupos.length === 0 ? '<p class="vazio">Nenhum treino concluído ainda.</p>' : htmlRosca(grupos)}
  </div>

  <h2>Evolução de carga por exercício</h2>
  ${graficosExercicios || '<p class="vazio">Sem exercícios concluídos ainda.</p>'}
`;

  const cardsResumo = [
    ['Treinos concluídos', formatarNumero(resumo.totalTreinos)],
    ['Volume total', `${formatarNumero(resumo.volumeTotal)} kg`],
    ['Tempo total', formatarDuracao(resumo.tempoTotalMinutos)],
    ['Séries', formatarNumero(resumo.totalSeries)],
    ['Recordes', formatarNumero(relatorio.resumo.totalRecordes)],
    ['Sequência', `${relatorio.resumo.sequenciaSemanas} sem.`],
  ]
    .map(
      ([rotulo, valor]) => `
      <div class="metrica">
        <div class="metrica-valor">${esc(valor)}</div>
        <div class="metrica-rotulo">${esc(rotulo)}</div>
      </div>`
    )
    .join('');

  const blocosTreinos = relatorio.treinos
    .map((t) => {
      const status = STATUS_LABEL[t.status] ?? STATUS_LABEL.concluido;
      const exercicios = agruparExercicios(t.exercicios);
      const volume = t.exercicios.reduce((acc, e) => acc + e.repeticoes * e.carga, 0);

      const linhas = exercicios
        .map(
          (ex) => `
          <tr class="ex-titulo"><td colspan="3">${esc(ex.nome)}</td></tr>
          ${ex.series
            .map(
              (s) => `
            <tr>
              <td>Série ${esc(s.series)}</td>
              <td>${esc(s.repeticoes)} reps</td>
              <td>${esc(s.carga)} kg</td>
            </tr>`
            )
            .join('')}`
        )
        .join('');

      return `
      <div class="treino">
        <div class="treino-topo">
          <div>
            <div class="treino-nome">${esc(t.nome)}</div>
            <div class="treino-meta">
              ${esc(t.data)}${t.horario ? ` às ${esc(t.horario)}` : ''}
              · ${esc(t.grupo_muscular)} · ${formatarDuracao(t.duracao)}
            </div>
          </div>
          <span class="badge" style="background:${status.cor}">${status.texto}</span>
        </div>
        ${
          exercicios.length > 0
            ? `<table>${linhas}</table>
               <div class="treino-volume">Volume: <b>${formatarNumero(volume)} kg</b></div>`
            : '<p class="vazio">Sem exercícios registrados.</p>'
        }
        ${t.observacoes ? `<div class="obs">Obs.: ${esc(t.observacoes)}</div>` : ''}
      </div>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif;
         color: #1B1D3A; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
  .capa { background: ${COR.fundo}; color: ${COR.texto}; padding: 36px 40px 28px;
          border-bottom: 6px solid ${COR.primaria}; }
  .capa h1 { margin: 0; font-size: 30px; letter-spacing: 1px; }
  .capa h1 span { color: ${COR.primaria}; }
  .capa p { margin: 6px 0 0; color: ${COR.muted}; font-size: 13px; }
  .conteudo { padding: 24px 40px 32px; }
  h2 { font-size: 16px; color: ${COR.fundo}; border-left: 5px solid ${COR.primaria};
       padding-left: 10px; margin: 24px 0 12px; }
  .metricas { display: flex; flex-wrap: wrap; gap: 10px; }
  .metrica { flex: 1 1 28%; background: ${COR.card}; border: 1px solid ${COR.borda};
             border-radius: 10px; padding: 14px; text-align: center; }
  .metrica-valor { color: ${COR.texto}; font-size: 20px; font-weight: 700; }
  .metrica-rotulo { color: ${COR.muted}; font-size: 11px; margin-top: 4px; }
  .grafico { border: 1px solid #D5D9F2; border-radius: 10px; padding: 12px 14px;
             margin-bottom: 12px; page-break-inside: avoid; }
  .grafico-titulo { font-size: 13px; font-weight: 700; color: ${COR.fundo}; margin-bottom: 6px; }
  .grafico-titulo small { font-weight: 400; color: #777; }
  .rosca { display: flex; align-items: center; gap: 24px; }
  .legenda { flex: 1; }
  .leg-item { font-size: 12px; margin-bottom: 6px; color: #333; }
  .leg-cor { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; }
  .treino { border: 1px solid #D5D9F2; border-radius: 10px; margin-bottom: 14px;
            overflow: hidden; page-break-inside: avoid; }
  .treino-topo { background: ${COR.card}; color: ${COR.texto}; padding: 10px 14px;
                 display: flex; justify-content: space-between; align-items: center; }
  .treino-nome { font-weight: 700; font-size: 14px; }
  .treino-meta { color: ${COR.muted}; font-size: 11px; margin-top: 3px; }
  .badge { color: #fff; font-size: 10px; padding: 4px 10px; border-radius: 12px; white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  td { padding: 5px 14px; border-bottom: 1px solid #EEF0FB; }
  .ex-titulo td { background: #F1F3FF; font-weight: 700; color: ${COR.fundo}; }
  .treino-volume { padding: 8px 14px; font-size: 12px; text-align: right; color: #444; }
  .obs { padding: 0 14px 10px; font-size: 11px; color: #666; font-style: italic; }
  .vazio { padding: 10px 14px; color: #888; font-size: 12px; margin: 0; }
  .rodape { text-align: center; color: #888; font-size: 10px; padding: 16px; }
</style>
</head>
<body>
  <div class="capa">
    <h1>Gym<span>Log</span></h1>
    <p>Relatório de treinos de ${esc(usuario)} · Gerado em ${esc(geradoEm)}</p>
  </div>
  <div class="conteudo">
    <h2>Resumo geral</h2>
    <div class="metricas">${cardsResumo}</div>

    ${secaoGraficos}

    <h2>Histórico de treinos (${relatorio.treinos.length})</h2>
    ${blocosTreinos || '<p class="vazio">Nenhum treino cadastrado.</p>'}
  </div>
  <div class="rodape">GymLog · Diário e Planejador de Treinos</div>
</body>
</html>`;

  return { html, totalTreinos: relatorio.treinos.length };
}

async function gerarArquivoPdf(nomeUsuario?: string) {
  const { html, totalTreinos } = montarHtml(nomeUsuario);
  const dataSlug = new Date().toISOString().slice(0, 10);
  const nomeArquivo = `gymlog-relatorio-${dataSlug}.pdf`;

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { uri: nomeArquivo, nomeArquivo, base64: null, totalTreinos };
  }

  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64) {
    throw new Error('Não foi possível gerar o conteúdo do PDF.');
  }

  const uriDestino = `${FileSystem.cacheDirectory}${nomeArquivo}`;
  await FileSystem.writeAsStringAsync(uriDestino, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return { uri: uriDestino, nomeArquivo, base64, totalTreinos };
}

export async function exportarRelatorioPdf(
  nomeUsuario?: string,
  destino: 'compartilhar' | 'salvar' = 'compartilhar'
): Promise<{ compartilhado: boolean; uri: string; totalTreinos: number }> {
  const { uri, nomeArquivo, base64, totalTreinos } = await gerarArquivoPdf(nomeUsuario);

  if (Platform.OS === 'web') {
    return { compartilhado: true, uri, totalTreinos };
  }

  if (destino === 'salvar' && Platform.OS === 'android') {
    if (!base64) {
      throw new Error('Não foi possível gerar o conteúdo do PDF para salvamento.');
    }
    const saf = FileSystem.StorageAccessFramework;
    const permissao = await saf.requestDirectoryPermissionsAsync();
    if (!permissao.granted) {
      return { compartilhado: false, uri, totalTreinos };
    }
    const novoUri = await saf.createFileAsync(
      permissao.directoryUri,
      nomeArquivo.replace('.pdf', ''),
      'application/pdf'
    );
    await FileSystem.writeAsStringAsync(novoUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { compartilhado: false, uri: novoUri, totalTreinos };
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar relatório do GymLog (PDF)',
      UTI: 'com.adobe.pdf',
    });
    return { compartilhado: true, uri, totalTreinos };
  }

  return { compartilhado: false, uri, totalTreinos };
}