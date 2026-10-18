import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Svg,
  Text as SvgText,
} from 'react-native-svg';

import { SeletorPeriodo } from '@/components/ui/SeletorPeriodo';
import {
  obterEvolucaoExercicio,
  obterExerciciosDisponiveis,
  type PeriodoFiltro,
  type PontoEvolucaoExercicio,
} from '@/database/estatisticasConsultas';
import { formatarNumero, formatarVolume } from '@/utils/formatacao';
import { useThemeStore } from '@/stores/useThemeStore';

type MetricaTipo = 'Volume' | 'Carga' | 'Repetições';

type PontoSelecionado = {
  exercicio: string;
  metrica: MetricaTipo;
  periodo: PeriodoFiltro;
  index: number;
  valor: number;
  rotulo: string;
  data?: string;
  x: number;
  y: number;
} | null;

const usarDriverNativo = Platform.OS !== 'web';

function formatarRotuloEixoY(y: string): string {
  const num = Number(y);
  if (isNaN(num) || num === 0) return '0';
  if (num >= 1000000) {
    const m = num / 1000000;
    return `${m.toFixed(m >= 10 ? 0 : 1).replace('.0', '')}M`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1).replace('.0', '')}k`;
  }
  return String(Math.round(num));
}

export default function Evolucao() {
  const router = useRouter();
  const tema = useThemeStore((s) => s.tema);
  const ehEscuro = tema === 'dark';
  const [metrica, setMetrica] = useState<MetricaTipo>('Carga');
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('semanas');
  const [versao, setVersao] = useState(0);
  const [exercicioManual, setExercicioManual] = useState<string | null>(null);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoSelecionado>(null);

  // Animação de Fade In, Slide Up e Crescimento da linha a partir da base
  const [animOpacidade] = useState(() => new Animated.Value(0));
  const [animTranslacaoY] = useState(() => new Animated.Value(15));
  const [animScaleY] = useState(() => new Animated.Value(0));

  const dispararAnimacao = useCallback(() => {
    animOpacidade.setValue(0);
    animTranslacaoY.setValue(15);
    animScaleY.setValue(0);

    Animated.parallel([
      Animated.timing(animOpacidade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: usarDriverNativo,
      }),
      Animated.timing(animTranslacaoY, {
        toValue: 0,
        duration: 450,
        useNativeDriver: usarDriverNativo,
      }),
      Animated.timing(animScaleY, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: usarDriverNativo,
      }),
    ]).start();
  }, [animOpacidade, animTranslacaoY, animScaleY]);

  useFocusEffect(
    useCallback(() => {
      setVersao((v) => v + 1);
    }, [])
  );

  const exercicios = useMemo(() => {
    void versao;
    try {
      return obterExerciciosDisponiveis();
    } catch (error) {
      console.error('[Evolução] Erro ao carregar exercícios:', error);
      return [];
    }
  }, [versao]);

  const exercicioSelecionado = useMemo(() => {
    if (exercicioManual && exercicios.some((e) => e.nome === exercicioManual)) {
      return exercicioManual;
    }
    return exercicios[0]?.nome ?? '';
  }, [exercicioManual, exercicios]);

  // Ponto ativo derivado do exercício, métrica e período atuais
  const pontoAtivo =
    pontoSelecionado?.exercicio === exercicioSelecionado &&
    pontoSelecionado?.metrica === metrica &&
    pontoSelecionado?.periodo === periodo
      ? pontoSelecionado
      : null;

  const pontos = useMemo(() => {
    void versao;
    if (!exercicioSelecionado) return [];
    try {
      return obterEvolucaoExercicio(exercicioSelecionado, periodo);
    } catch (error) {
      console.error('[Evolução] Erro ao carregar histórico do exercício:', error);
      return [];
    }
  }, [exercicioSelecionado, periodo, versao]);

  // Dispara animação sempre que mudar o exercício, métrica ou período selecionado
  useEffect(() => {
    dispararAnimacao();
  }, [metrica, periodo, exercicioSelecionado, dispararAnimacao]);

  const valoresMetrica = useMemo(() => {
    return pontos.map((p) => {
      switch (metrica) {
        case 'Volume':
          return Math.round(p.volumeTotal);
        case 'Repetições':
          return p.repeticoesMax;
        case 'Carga':
        default:
          return p.cargaMaxima;
      }
    });
  }, [pontos, metrica]);

  // Variação entre o primeiro e o último registro
  const deltaFormatado = useMemo(() => {
    if (valoresMetrica.length < 2) return null;
    const inicial = valoresMetrica[0];
    const final = valoresMetrica[valoresMetrica.length - 1];
    const delta = final - inicial;
    const sinal = delta > 0 ? '+' : '';

    if (metrica === 'Volume') return `${sinal}${formatarNumero(delta)} kg`;
    if (metrica === 'Repetições') return `${sinal}${delta} reps`;
    return `${sinal}${formatarNumero(delta)} kg`;
  }, [valoresMetrica, metrica]);

  const subtituloMetrica = useMemo(() => {
    switch (metrica) {
      case 'Volume':
        return 'Evolução do volume (kg)';
      case 'Repetições':
        return 'Evolução das repetições (máx/treino)';
      case 'Carga':
      default:
        return 'Evolução da carga máxima (kg)';
    }
  }, [metrica]);

  const unidadeSufixoEixoY = useMemo(() => {
    switch (metrica) {
      case 'Volume':
        return ''; // Abreviado com 'k' via formatYLabel
      case 'Repetições':
        return ''; // Número limpo para não colidir
      case 'Carga':
      default:
        return ' kg';
    }
  }, [metrica]);

  const formatarValorTooltip = useCallback((val: number) => {
    switch (metrica) {
      case 'Volume':
        return formatarVolume(val);
      case 'Repetições':
        return `${Math.round(val)} reps`;
      case 'Carga':
      default:
        return `${formatarNumero(val)} kg`;
    }
  }, [metrica]);

  const formatarValorItem = (ponto: PontoEvolucaoExercicio) => {
    switch (metrica) {
      case 'Volume':
        return formatarVolume(ponto.volumeTotal);
      case 'Repetições':
        return `${ponto.repeticoesMax} reps`;
      case 'Carga':
      default:
        return `${formatarNumero(ponto.cargaMaxima)} kg`;
    }
  };

  const larguraTela = Dimensions.get('window').width;
  // ScrollView px-5 (40px) + Card p-4 (32px) => espaço interior útil do card
  const larguraGrafico = Math.max(larguraTela - 72, 280);

  // Prepara dados para o LineChart com os valores do período
  const dadosGrafico = useMemo(() => {
    if (pontos.length === 0) return null;

    if (pontos.length === 1) {
      return {
        labels: [pontos[0].rotulo, pontos[0].rotulo],
        datasets: [{ data: [valoresMetrica[0], valoresMetrica[0]] }],
      };
    }

    return {
      labels: pontos.map((p) => p.rotulo),
      datasets: [{ data: valoresMetrica }],
    };
  }, [pontos, valoresMetrica]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View className="mb-3 flex-row items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/estatisticas'))}
            className="mr-2 py-2"
          >
            <Feather name="chevron-left" size={28} color="#5C7CFA" />
          </Pressable>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">Evolução</Text>
        </View>

        {/* Pílulas de Seleção de Métrica */}
        <View className="mb-3 flex-row gap-2">
          {(['Volume', 'Carga', 'Repetições'] as MetricaTipo[]).map((m) => {
            const ativo = metrica === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityLabel={`Visualizar métrica ${m}`}
                onPress={() => setMetrica(m)}
                className={`rounded-full border px-5 py-2 ${
                  ativo
                    ? 'border-[#5c7cfa] bg-[#5c7cfa]'
                    : 'border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A]'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    ativo ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Seletor de Períodos: 7 Dias | 4 Semanas | 6 Meses */}
        <View className="mb-4">
          <SeletorPeriodo periodo={periodo} onMudar={setPeriodo} />
        </View>

        {/* Seletor de Exercício (quando há exercícios) */}
        {exercicios.length > 0 && (
          <View className="mb-4">
            <Text className="mb-2 text-xs font-medium text-slate-400 dark:text-[#8E92B8]">Selecione o exercício</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {exercicios.map((ex) => {
                const selecionado = ex.nome === exercicioSelecionado;
                return (
                  <Pressable
                    key={ex.nome}
                    accessibilityRole="button"
                    onPress={() => setExercicioManual(ex.nome)}
                    className={`mr-2 rounded-xl border px-3.5 py-1.5 ${
                      selecionado
                        ? 'border-indigo-300 dark:border-[#5c7cfa] bg-indigo-100 dark:bg-[#23264D]'
                        : 'border-slate-200 dark:border-[#23264D] bg-slate-50 dark:bg-[#14152D]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        selecionado ? 'text-[#3b5bdb] dark:text-[#7C93FF]' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ex.nome}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Estado Vazio Geral */}
        {exercicios.length === 0 ? (
          <View className="mt-16 items-center justify-center px-4">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Feather name="trending-up" size={32} color="#5c7cfa" />
            </View>
            <Text className="text-center text-lg font-bold text-slate-900">
              Sem dados de evolução
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              Cadastre exercícios nos seus treinos para visualizar as curvas de evolução de carga,
              volume e repetições.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/novo-treino')}
              className="mt-6 rounded-2xl bg-[#5c7cfa] px-6 py-3 active:bg-indigo-600"
            >
              <Text className="font-semibold text-white">Criar novo treino</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Card com o Gráfico */}
            <View className="mb-5 rounded-3xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] p-4 shadow-sm shadow-slate-100 dark:shadow-none">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-lg font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {exercicioSelecionado || 'Exercício'}
                  </Text>
                  <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">
                    {subtituloMetrica} • {periodo === 'dias' ? '7 dias' : periodo === 'semanas' ? '4 semanas' : '6 meses'}
                  </Text>
                </View>

                {deltaFormatado && (
                  <View className="rounded-full bg-[#5c7cfa] px-3 py-1">
                    <Text className="text-xs font-bold text-white">{deltaFormatado}</Text>
                  </View>
                )}
              </View>

              {dadosGrafico ? (
                <>
                  <Animated.View
                    style={{
                      opacity: animOpacidade,
                      transform: [
                        { translateY: animTranslacaoY },
                        { scaleY: animScaleY },
                      ],
                      width: '100%',
                      alignItems: 'center',
                      position: 'relative',
                    }}
                  >
                    {pontoAtivo && (() => {
                      const LARGURA_TOOLTIP = 110;
                      // Se o ponto estiver muito perto do topo do gráfico, inverte para surgir imediatamente abaixo do nó
                      const surgeAbaixo = pontoAtivo.y < 44;
                      const leftPos = Math.max(
                        6,
                        Math.min(pontoAtivo.x - LARGURA_TOOLTIP / 2, larguraGrafico - LARGURA_TOOLTIP - 6)
                      );
                      const topPos = surgeAbaixo ? pontoAtivo.y + 12 : pontoAtivo.y - 42;

                      return (
                        <View
                          style={{
                            position: 'absolute',
                            left: leftPos,
                            top: topPos,
                            width: LARGURA_TOOLTIP,
                            zIndex: 40,
                            alignItems: 'center',
                            pointerEvents: 'none',
                          }}
                        >
                          {/* Triângulo / Setinha apontando para CIMA quando surge abaixo do nó */}
                          {surgeAbaixo && (
                            <View className="h-2 w-2 rotate-45 bg-slate-900 -mb-1 z-10" />
                          )}

                          <View className="rounded-xl bg-slate-900 px-2.5 py-1.5 shadow-md w-full items-center justify-center">
                            <Text className="text-[11px] font-bold text-white text-center" numberOfLines={1}>
                              {pontoAtivo.rotulo}: {formatarValorTooltip(pontoAtivo.valor)}
                            </Text>
                          </View>

                          {/* Triângulo / Setinha apontando para BAIXO quando surge acima do nó */}
                          {!surgeAbaixo && (
                            <View className="h-2 w-2 rotate-45 bg-slate-900 -mt-1 z-10" />
                          )}
                        </View>
                      );
                    })()}

                    {Platform.OS === 'web' ? (
                      (() => {
                        const alturaSvg = 190;
                        const padTop = 16;
                        const padRight = 64;
                        const basePos = alturaSvg * 0.75;
                        const serie = dadosGrafico.datasets[0]?.data ?? [];
                        const rotulosX = dadosGrafico.labels ?? [];
                        const minVal = serie.length > 0 ? Math.min(...serie) : 0;
                        const maxVal = serie.length > 0 ? Math.max(...serie) : 0;
                        const scaler = maxVal - minVal || 1;
                        const qtdLinhasH = minVal === maxVal ? 1 : 4;
                        const xMax = Math.max(serie.length, 1);

                        const calcX = (idx: number) =>
                          padRight + (idx * (larguraGrafico - padRight)) / xMax;
                        const calcY = (val: number) => {
                          const h = alturaSvg * ((val - minVal) / scaler);
                          return ((alturaSvg - h) / 4) * 3 + padTop;
                        };

                        const coords = serie.map((val, idx) => ({
                          x: calcX(idx),
                          y: calcY(val),
                          val,
                        }));

                        const caminhoLinha =
                          coords.length === 0
                            ? 'M0,0'
                            : [
                                `M${Math.floor(coords[0].x)},${Math.floor(coords[0].y)}`,
                                ...coords.slice(0, -1).map((_, i) => {
                                  const x0 = Math.floor(coords[i].x);
                                  const y0 = Math.floor(coords[i].y);
                                  const x1 = Math.floor(coords[i + 1].x);
                                  const y1 = Math.floor(coords[i + 1].y);
                                  const xMid = (x0 + x1) / 2;
                                  const yMid = (y0 + y1) / 2;
                                  const cpX1 = (xMid + x0) / 2;
                                  const cpX2 = (xMid + x1) / 2;
                                  return `Q ${cpX1}, ${y0}, ${xMid}, ${yMid} Q ${cpX2}, ${y1}, ${x1}, ${y1}`;
                                }),
                              ].join(' ');

                        const yBaseSombra = (alturaSvg / 4) * 3 + padTop;
                        const caminhoSombra =
                          coords.length > 0
                            ? `${caminhoLinha} L${coords[coords.length - 1].x},${yBaseSombra} L${padRight},${yBaseSombra} Z`
                            : 'M0,0';

                        const corGrade = ehEscuro ? '#282B54' : '#94a3b8';
                        const opacidadeGrade = ehEscuro ? 0.6 : 0.35;
                        const corRotulo = ehEscuro
                          ? 'rgba(142, 146, 184, 0.8)'
                          : 'rgba(100, 116, 139, 0.8)';
                        const corFundo = ehEscuro ? '#1C1E3A' : '#ffffff';

                        return (
                          <View
                            style={{
                              width: larguraGrafico,
                              height: alturaSvg,
                              borderRadius: 16,
                              position: 'relative',
                            }}
                          >
                            <Svg width={larguraGrafico} height={alturaSvg}>
                              <Defs>
                                <LinearGradient
                                  id="gradSombraEvolucaoWeb"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2={String(alturaSvg)}
                                  gradientUnits="userSpaceOnUse"
                                >
                                  <Stop
                                    offset="0"
                                    stopColor="rgba(92, 124, 250, 1)"
                                    stopOpacity="0.1"
                                  />
                                  <Stop
                                    offset="1"
                                    stopColor="rgba(92, 124, 250, 1)"
                                    stopOpacity="0.1"
                                  />
                                </LinearGradient>
                              </Defs>

                              <Rect
                                width="100%"
                                height={alturaSvg}
                                rx={16}
                                ry={16}
                                fill={corFundo}
                              />

                              {Array.from({ length: qtdLinhasH + 1 }).map((_, i) => {
                                const y = (basePos / qtdLinhasH) * i + padTop;
                                return (
                                  <Line
                                    key={`h-line-${i}`}
                                    x1={padRight}
                                    y1={y}
                                    x2={larguraGrafico}
                                    y2={y}
                                    stroke={corGrade}
                                    strokeDasharray="4"
                                    strokeOpacity={opacidadeGrade}
                                    strokeWidth={1.2}
                                  />
                                );
                              })}

                              {serie.map((_, i) => {
                                const x = Math.floor(
                                  ((larguraGrafico - padRight) / Math.max(serie.length, 1)) * i +
                                    padRight
                                );
                                return (
                                  <Line
                                    key={`v-line-${i}`}
                                    x1={x}
                                    y1={0}
                                    x2={x}
                                    y2={basePos + padTop}
                                    stroke={corGrade}
                                    strokeDasharray="4"
                                    strokeOpacity={opacidadeGrade}
                                    strokeWidth={1.2}
                                  />
                                );
                              })}

                              {Array.from({
                                length: qtdLinhasH === 1 ? 1 : qtdLinhasH + 1,
                              }).map((_, i) => {
                                const valBruto =
                                  qtdLinhasH === 1
                                    ? (serie[0] ?? 0)
                                    : (scaler / qtdLinhasH) * i + minVal;
                                const yLabel = `${formatarRotuloEixoY(
                                  valBruto.toFixed(0)
                                )}${unidadeSufixoEixoY}`;
                                const x = padRight - 8;
                                const y = basePos - (basePos / qtdLinhasH) * i + padTop;
                                return (
                                  <SvgText
                                    key={`h-label-${i}`}
                                    x={x}
                                    y={y}
                                    textAnchor="end"
                                    fontSize={12}
                                    fill={corRotulo}
                                  >
                                    {yLabel}
                                  </SvgText>
                                );
                              })}

                              {rotulosX.map((rotulo, i) => {
                                const x =
                                  ((larguraGrafico - padRight) / Math.max(rotulosX.length, 1)) * i +
                                  padRight;
                                const y = basePos + padTop + 24;
                                return (
                                  <SvgText
                                    key={`v-label-${i}`}
                                    x={x}
                                    y={y}
                                    textAnchor="middle"
                                    fontSize={12}
                                    fill={corRotulo}
                                  >
                                    {rotulo}
                                  </SvgText>
                                );
                              })}

                              <Path
                                d={caminhoSombra}
                                fill="url(#gradSombraEvolucaoWeb)"
                                strokeWidth={0}
                              />
                              <Path
                                d={caminhoLinha}
                                fill="none"
                                stroke="rgba(92, 124, 250, 0.2)"
                                strokeWidth={3}
                              />

                              {coords.map((pt, i) => (
                                <Circle
                                  key={`dot-${i}`}
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={5}
                                  strokeWidth={2}
                                  stroke="#5c7cfa"
                                  fill={corFundo}
                                />
                              ))}
                            </Svg>

                            {coords.map((pt, idx) => (
                              <Pressable
                                key={`dot-btn-${idx}`}
                                accessibilityRole="button"
                                accessibilityLabel={`Selecionar ponto ${
                                  pontos[idx]?.rotulo ?? idx + 1
                                }`}
                                onPress={() => {
                                  const indiceReal = Math.min(idx, pontos.length - 1);
                                  const ponto = pontos[indiceReal];
                                  if (!ponto) return;
                                  setPontoSelecionado((atual) =>
                                    atual?.index === indiceReal &&
                                    atual?.exercicio === exercicioSelecionado &&
                                    atual?.metrica === metrica &&
                                    atual?.periodo === periodo
                                      ? null
                                      : {
                                          exercicio: exercicioSelecionado,
                                          metrica,
                                          periodo,
                                          index: indiceReal,
                                          valor: valoresMetrica[indiceReal] ?? pt.val,
                                          rotulo: ponto.rotulo,
                                          data: ponto.data,
                                          x: pt.x,
                                          y: pt.y,
                                        }
                                  );
                                }}
                                style={{
                                  position: 'absolute',
                                  left: pt.x - 14,
                                  top: pt.y - 14,
                                  width: 28,
                                  height: 28,
                                  borderRadius: 14,
                                }}
                              />
                            ))}
                          </View>
                        );
                      })()
                    ) : (
                      <LineChart
                        data={dadosGrafico}
                        width={larguraGrafico}
                        height={190}
                        bezier
                        yAxisLabel=""
                        yAxisSuffix={unidadeSufixoEixoY}
                        yLabelsOffset={8}
                        onDataPointClick={(data) => {
                          const ponto = pontos[data.index];
                          if (!ponto) return;
                          setPontoSelecionado((atual) =>
                            atual?.index === data.index &&
                            atual?.exercicio === exercicioSelecionado &&
                            atual?.metrica === metrica &&
                            atual?.periodo === periodo
                              ? null
                              : {
                                  exercicio: exercicioSelecionado,
                                  metrica,
                                  periodo,
                                  index: data.index,
                                  valor: valoresMetrica[data.index] ?? data.value,
                                  rotulo: ponto.rotulo,
                                  data: ponto.data,
                                  x: data.x,
                                  y: data.y,
                                }
                          );
                        }}
                        chartConfig={{
                          backgroundColor: ehEscuro ? '#1C1E3A' : '#ffffff',
                          backgroundGradientFrom: ehEscuro ? '#1C1E3A' : '#ffffff',
                          backgroundGradientTo: ehEscuro ? '#1C1E3A' : '#ffffff',
                          decimalPlaces: 0,
                          formatYLabel: formatarRotuloEixoY,
                          color: (opacity = 1) => `rgba(92, 124, 250, ${opacity})`,
                          labelColor: (opacity = 1) =>
                            ehEscuro
                              ? `rgba(142, 146, 184, ${opacity})`
                              : `rgba(100, 116, 139, ${opacity})`,
                          propsForDots: {
                            r: '5',
                            strokeWidth: '2',
                            stroke: '#5c7cfa',
                            fill: ehEscuro ? '#1C1E3A' : '#ffffff',
                          },
                          propsForBackgroundLines: {
                            strokeDasharray: '4',
                            stroke: ehEscuro ? '#282B54' : '#94a3b8',
                            strokeOpacity: ehEscuro ? 0.6 : 0.35,
                            strokeWidth: 1.2,
                          },
                        }}
                        style={{
                          borderRadius: 16,
                        }}
                      />
                    )}
                  </Animated.View>

                  {/* Card de Insights Analíticos com Cálculo de Delta */}
                  {pontoAtivo && (() => {
                    const index = pontoAtivo.index;
                    const ponto = pontos[index];
                    if (!ponto) return null;

                    const valorAtual = valoresMetrica[index] ?? 0;
                    const pontoAnterior = index > 0 ? pontos[index - 1] : null;
                    const valorAnterior = index > 0 ? (valoresMetrica[index - 1] ?? 0) : null;
                    const delta = valorAnterior !== null ? valorAtual - valorAnterior : null;
                    const deltaPercent =
                      valorAnterior && valorAnterior > 0 && delta !== null
                        ? Math.round((Math.abs(delta) / valorAnterior) * 100)
                        : 0;

                    const somaValores = valoresMetrica.reduce((a, b) => a + b, 0);
                    const mediaPeriodo =
                      valoresMetrica.length > 0
                        ? Math.round(somaValores / valoresMetrica.length)
                        : 0;
                    const diffMedia =
                      mediaPeriodo > 0
                        ? Math.round(((valorAtual - mediaPeriodo) / mediaPeriodo) * 100)
                        : 0;

                    const ehAumento = delta !== null && delta > 0;
                    const ehQueda = delta !== null && delta < 0;
                    const ehNeutro = delta !== null && delta === 0;

                    let fraseDelta = 'Ponto de partida do período';
                    if (ehAumento && delta !== null && pontoAnterior) {
                      if (metrica === 'Volume') {
                        fraseDelta = `Aumento de +${formatarVolume(delta)} (+${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      } else if (metrica === 'Repetições') {
                        fraseDelta = `Aumento de +${delta} reps (+${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      } else {
                        fraseDelta = `Aumento de +${formatarNumero(delta)} kg (+${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      }
                    } else if (ehQueda && delta !== null && pontoAnterior) {
                      if (metrica === 'Volume') {
                        fraseDelta = `Redução de -${formatarVolume(Math.abs(delta))} (-${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      } else if (metrica === 'Repetições') {
                        fraseDelta = `Queda de -${Math.abs(delta)} reps (-${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      } else {
                        fraseDelta = `Queda de -${formatarNumero(Math.abs(delta))} kg (-${deltaPercent}%) em relação a ${pontoAnterior.rotulo}`;
                      }
                    } else if (ehNeutro && pontoAnterior) {
                      if (metrica === 'Volume') {
                        fraseDelta = `Manteve o mesmo volume de ${formatarVolume(valorAtual)} de ${pontoAnterior.rotulo}`;
                      } else if (metrica === 'Repetições') {
                        fraseDelta = `Manteve as mesmas ${valorAtual} reps de ${pontoAnterior.rotulo}`;
                      } else {
                        fraseDelta = `Manteve a carga máxima de ${formatarNumero(valorAtual)} kg de ${pontoAnterior.rotulo}`;
                      }
                    }

                    return (
                      <View className="mt-4 rounded-3xl border border-indigo-100 dark:border-[#282B54] bg-indigo-50/60 dark:bg-[#14152D] p-4">
                        {/* Cabeçalho do Card */}
                        <View className="flex-row items-center justify-between pb-2.5 border-b border-indigo-100/70 dark:border-[#282B54]/70">
                          <View className="flex-row items-center gap-2">
                            <View className="h-7 w-7 items-center justify-center rounded-xl bg-[#5c7cfa]/20">
                              <Feather name="trending-up" size={14} color="#5c7cfa" />
                            </View>
                            <View>
                              <Text className="text-xs font-bold text-slate-800 dark:text-white">
                                {ponto.rotulo} • {ponto.data}
                              </Text>
                              <Text className="text-[11px] text-slate-400 dark:text-[#8E92B8]">{exercicioSelecionado}</Text>
                            </View>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Fechar insight do ponto"
                            hitSlop={12}
                            onPress={() => setPontoSelecionado(null)}
                            className="rounded-full p-1.5 active:bg-indigo-200/50"
                          >
                            <Feather name="x" size={16} color="#64748b" />
                          </Pressable>
                        </View>

                        {/* Valor principal da métrica */}
                        <View className="mt-3 flex-row items-baseline justify-between">
                          <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">{subtituloMetrica}</Text>
                          <Text className="text-xl font-bold text-[#5c7cfa]">
                            {formatarValorTooltip(valorAtual)}
                          </Text>
                        </View>

                        {/* Detalhes complementares da sessão */}
                        <View className="mt-2 flex-row flex-wrap items-center gap-2">
                          <View className="flex-row items-center gap-1 rounded-lg bg-white dark:bg-[#1C1E3A] px-2 py-1 border border-indigo-100/60 dark:border-[#282B54]">
                            <Feather name="disc" size={11} color="#64748b" />
                            <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              Carga máx: {formatarNumero(ponto.cargaMaxima)} kg
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1 rounded-lg bg-white dark:bg-[#1C1E3A] px-2 py-1 border border-indigo-100/60 dark:border-[#282B54]">
                            <Feather name="repeat" size={11} color="#64748b" />
                            <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              Reps máx: {ponto.repeticoesMax}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1 rounded-lg bg-white dark:bg-[#1C1E3A] px-2 py-1 border border-indigo-100/60 dark:border-[#282B54]">
                            <Feather name="zap" size={11} color="#64748b" />
                            <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              Volume: {formatarVolume(ponto.volumeTotal)}
                            </Text>
                          </View>
                        </View>

                        {/* Insight Analítico (Delta com ponto anterior) */}
                        <View
                          className={`mt-3 flex-row items-center gap-2 rounded-2xl px-3 py-2.5 border ${
                            ehAumento
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/50'
                              : ehQueda
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/50'
                              : 'bg-white dark:bg-[#1C1E3A] border-indigo-100/70 dark:border-[#282B54]'
                          }`}
                        >
                          <Feather
                            name={
                              ehAumento
                                ? 'arrow-up-right'
                                : ehQueda
                                ? 'arrow-down-right'
                                : ehNeutro
                                ? 'minus'
                                : 'flag'
                            }
                            size={15}
                            color={ehAumento ? '#16a34a' : ehQueda ? '#dc2626' : '#64748b'}
                          />
                          <Text
                            className={`text-xs font-semibold flex-1 ${
                              ehAumento
                                ? 'text-emerald-800 dark:text-emerald-300'
                                : ehQueda
                                ? 'text-rose-800 dark:text-rose-300'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {fraseDelta}
                          </Text>
                        </View>

                        {/* Comparação com a média geral do período */}
                        {mediaPeriodo > 0 && (
                          <View className="mt-2 flex-row items-center gap-1.5 px-1">
                            <Feather
                              name={diffMedia >= 0 ? 'trending-up' : 'trending-down'}
                              size={12}
                              color={diffMedia >= 0 ? '#16a34a' : '#d97706'}
                            />
                            <Text className="text-[11px] font-medium text-slate-500">
                              {diffMedia >= 0 ? `${diffMedia}% acima` : `${Math.abs(diffMedia)}% abaixo`} da média do período ({formatarValorTooltip(mediaPeriodo)})
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </>
              ) : (
                <View className="py-10 items-center justify-center">
                  <Text className="text-xs text-slate-400">
                    Nenhum registro para este exercício.
                  </Text>
                </View>
              )}
            </View>

            {/* Lista com Histórico Semanal/Por Treino */}
            <View className="gap-2.5">
              <Text className="text-sm font-bold text-slate-900">Histórico de registros</Text>

              {pontos.length > 0 ? (
                pontos.map((p, index) => (
                  <View
                    key={`${p.treinoId}-${index}`}
                    className="flex-row items-center justify-between rounded-2xl border border-indigo-100 bg-white px-4 py-3.5"
                  >
                    <View>
                      <Text className="text-sm font-semibold text-slate-800">{p.rotulo}</Text>
                      <Text className="text-xs text-slate-400">{p.data}</Text>
                    </View>
                    <Text className="text-base font-bold text-[#5c7cfa]">
                      {formatarValorItem(p)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="py-4 text-center text-xs text-slate-400">
                  Nenhum registro para listar.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
