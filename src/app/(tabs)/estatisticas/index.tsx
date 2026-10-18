import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  obterDistribuicaoGruposMusculares,
  obterEvolucaoVolumeTreinos,
  obterResumoEstatisticas,
  type GrupoMuscularDistribuicao,
  type PeriodoFiltro,
  type PontoVolumeTreino,
  type ResumoEstatisticas,
} from '@/database/estatisticasConsultas';
import { SeletorPeriodo } from '@/components/ui/SeletorPeriodo';
import { formatarDuracao, formatarNumero, formatarVolume } from '@/utils/formatacao';

function CardMetrica({
  rotulo,
  valor,
  icone,
}: {
  rotulo: string;
  valor: string;
  icone: keyof typeof Feather.glyphMap;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] p-3.5 shadow-sm shadow-slate-100 dark:shadow-none">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-slate-400 dark:text-[#8E92B8]">{rotulo}</Text>
        <Feather name={icone} size={15} color="#818cf8" />
      </View>
      <Text className="text-xl font-bold text-slate-900 dark:text-white" numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

function GraficoBarrasVolume({
  pontos,
  animProgresso,
  barraSelecionada,
  onSelecionarBarra,
}: {
  pontos: PontoVolumeTreino[];
  animProgresso: Animated.Value;
  barraSelecionada: number | null;
  onSelecionarBarra: (idx: number | null) => void;
}) {
  const volumes = pontos.map((p) => p.volume);
  const maxVolume = Math.max(...volumes, 1000);
  // Arredonda o teto para múltiplos amigáveis de 2000 (ex: 4.000, 6.000, 8.000, 10.000...)
  const teto = Math.max(Math.ceil(maxVolume / 2000) * 2000, 2000);

  // 5 marcas no eixo Y: do teto até 0 em números normais em kg
  const marcasEixoY = [
    teto,
    Math.round(teto * 0.75),
    Math.round(teto * 0.5),
    Math.round(teto * 0.25),
    0,
  ];

  const alturaAreaGrafico = 145;
  const larguraBarra = pontos.length <= 4 ? 30 : pontos.length <= 6 ? 24 : 18;

  return (
    <View className="w-full pt-2 pb-1">
      <View className="flex-row items-stretch" style={{ height: alturaAreaGrafico }}>
        {/* Coluna do Eixo Y - afastada da lateral esquerda do Card, com números normais em kg */}
        <View className="w-16 justify-between items-end pr-3 py-1">
          {marcasEixoY.map((marca, idx) => (
            <Text key={idx} className="text-[11px] font-medium text-slate-400 dark:text-[#8E92B8]">
              {formatarNumero(marca)}
            </Text>
          ))}
        </View>

        {/* Área das Barras com Linhas de Grade Tracejadas e Centralização */}
        <View className="flex-1 relative justify-between">
          {/* Linhas de Grade de Fundo - visibilidade e contraste aprimorados para acessibilidade */}
          <View className="absolute inset-0 justify-between py-2 pointer-events-none">
            {marcasEixoY.map((_, idx) => (
              <View
                key={idx}
                className="w-full border-b border-dashed border-slate-300 dark:border-[#282B54]"
                style={{ opacity: 0.6 }}
              />
            ))}
          </View>

          {/* Barras do período com animação de subida e destaque visual sem popup preto */}
          <View className="flex-1 flex-row items-end justify-around px-2 z-10">
            {pontos.map((ponto, idx) => {
              const estaSelecionada = barraSelecionada === idx;
              const opacidadeBarra =
                barraSelecionada === null || estaSelecionada ? 1 : 0.35;

              const alturaReal = ponto.volume > 0
                ? Math.max(
                    Math.round((ponto.volume / teto) * (alturaAreaGrafico - 20)),
                    6
                  )
                : 4; // barra mínima para indicar dias/períodos zerados

              const alturaAnimada = animProgresso.interpolate({
                inputRange: [0, 1],
                outputRange: [0, alturaReal],
              });

              return (
                <Pressable
                  key={`${ponto.rotulo}-${idx}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar ${ponto.rotulo}`}
                  hitSlop={{ top: 15, bottom: 15, left: 8, right: 8 }}
                  onPress={() => onSelecionarBarra(estaSelecionada ? null : idx)}
                  className="items-center justify-end h-full"
                >
                  <Animated.View
                    style={{
                      height: alturaAnimada,
                      width: larguraBarra,
                      opacity: opacidadeBarra,
                    }}
                    className={`rounded-t-md ${
                      ponto.volume === 0
                        ? 'bg-slate-200 dark:bg-[#202345]'
                        : estaSelecionada
                        ? 'bg-[#4338ca]'
                        : 'bg-[#5c7cfa]'
                    }`}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Rótulos do Eixo X (dias, semanas ou meses) perfeitamente alinhados abaixo de cada barra */}
      <View className="flex-row items-center justify-around pl-16 pr-2 pt-2">
        {pontos.map((ponto, idx) => {
          const estaSelecionada = barraSelecionada === idx;
          return (
            <Pressable
              key={idx}
              onPress={() => onSelecionarBarra(estaSelecionada ? null : idx)}
              className="items-center"
              style={{ width: larguraBarra + 10 }}
            >
              <Text
                className={`text-xs ${
                  estaSelecionada
                    ? 'font-bold text-[#5c7cfa]'
                    : 'font-semibold text-slate-400 dark:text-[#8E92B8]'
                }`}
              >
                {ponto.rotulo}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function Estatisticas() {
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoEstatisticas | null>(null);
  const [grupos, setGrupos] = useState<GrupoMuscularDistribuicao[]>([]);
  const [pontosVolume, setPontosVolume] = useState<PontoVolumeTreino[]>([]);
  const [barraSelecionada, setBarraSelecionada] = useState<number | null>(null);
  const [periodoVolume, setPeriodoVolume] = useState<PeriodoFiltro>('semanas');
  const [carregando, setCarregando] = useState(true);

  // Animação de Fade In e Slide Up para o contêiner dos cards
  const [animOpacidade] = useState(() => new Animated.Value(0));
  const [animTranslacaoY] = useState(() => new Animated.Value(20));

  // Animação de crescimento fluido das barras (Volume e Grupos Musculares)
  const [animProgresso] = useState(() => new Animated.Value(0));

  const dispararAnimacao = useCallback(() => {
    animOpacidade.setValue(0);
    animTranslacaoY.setValue(20);
    animProgresso.setValue(0);

    const usarDriverNativo = Platform.OS !== 'web';
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
      Animated.timing(animProgresso, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [animOpacidade, animTranslacaoY, animProgresso]);

  const carregarDados = useCallback(() => {
    try {
      setCarregando(true);
      const res = obterResumoEstatisticas();
      const distGrupos = obterDistribuicaoGruposMusculares();
      const evolVolume = obterEvolucaoVolumeTreinos(periodoVolume);

      setResumo(res);
      setGrupos(distGrupos);
      setPontosVolume(evolVolume);
      dispararAnimacao();
    } catch (error) {
      console.error('[Estatísticas] Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  }, [periodoVolume, dispararAnimacao]);

  const mudarPeriodo = useCallback(
    (novoPeriodo: PeriodoFiltro) => {
      setPeriodoVolume(novoPeriodo);
      setBarraSelecionada(null);
      try {
        const novoVolume = obterEvolucaoVolumeTreinos(novoPeriodo);
        setPontosVolume(novoVolume);
        animProgresso.setValue(0);
        Animated.timing(animProgresso, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      } catch (error) {
        console.error('[Estatísticas] Erro ao mudar período:', error);
      }
    },
    [animProgresso]
  );

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const semTreinos = !resumo || resumo.totalTreinos === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">Estatísticas</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ir para gráficos de evolução"
            onPress={() => router.push('/estatisticas/evolucao')}
            className="flex-row items-center rounded-xl bg-indigo-50 dark:bg-[#23264D] px-3 py-1.5 active:bg-indigo-100"
          >
            <Text className="mr-1 text-xs font-semibold text-[#5c7cfa]">Evolução</Text>
            <Feather name="trending-up" size={14} color="#5c7cfa" />
          </Pressable>
        </View>

        {semTreinos && !carregando ? (
          <View className="mt-16 items-center justify-center px-4">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Feather name="bar-chart-2" size={32} color="#5c7cfa" />
            </View>
            <Text className="text-center text-lg font-bold text-slate-900">
              Sem dados suficientes
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-500">
              Realize seu primeiro treino para visualizar suas estatísticas e gráficos de evolução.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/novo-treino')}
              className="mt-6 rounded-2xl bg-[#5c7cfa] px-6 py-3 active:bg-indigo-600"
            >
              <Text className="font-semibold text-white">Registrar primeiro treino</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Grid 2x2 com cards de métricas */}
            <View className="gap-3">
              <View className="flex-row gap-3">
                <CardMetrica
                  rotulo="Treinos"
                  valor={String(resumo?.totalTreinos ?? 0)}
                  icone="activity"
                />
                <CardMetrica
                  rotulo="Volume total"
                  valor={formatarVolume(resumo?.volumeTotal ?? 0)}
                  icone="zap"
                />
              </View>
              <View className="flex-row gap-3">
                <CardMetrica
                  rotulo="Tempo total"
                  valor={formatarDuracao(resumo?.tempoTotalMinutos ?? 0)}
                  icone="clock"
                />
                <CardMetrica
                  rotulo="Séries"
                  valor={formatarNumero(resumo?.totalSeries ?? 0)}
                  icone="check-circle"
                />
              </View>
            </View>

            {/* Card com Gráfico: Volume de treino */}
            <View className="mt-5 rounded-3xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] p-4 shadow-sm shadow-slate-100 dark:shadow-none">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-base font-bold text-slate-900 dark:text-white">Volume de treino</Text>
                  <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">
                    {periodoVolume === 'dias'
                      ? 'Distribuição diária (kg)'
                      : periodoVolume === 'semanas'
                      ? 'Progressão das últimas 4 semanas (kg)'
                      : 'Progressão dos últimos 6 meses (kg)'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/estatisticas/evolucao')}
                  className="flex-row items-center"
                >
                  <Text className="mr-0.5 text-xs font-semibold text-[#5c7cfa]">Ver detalhes</Text>
                  <Feather name="chevron-right" size={14} color="#5c7cfa" />
                </Pressable>
              </View>

              {/* Seletor de Períodos: 7 Dias | 4 Semanas | 6 Meses */}
              <View className="mb-3">
                <SeletorPeriodo periodo={periodoVolume} onMudar={mudarPeriodo} />
              </View>

              {pontosVolume.length > 0 ? (
                <Animated.View
                  style={{
                    opacity: animOpacidade,
                    transform: [{ translateY: animTranslacaoY }],
                    width: '100%',
                  }}
                >
                  <GraficoBarrasVolume
                    pontos={pontosVolume}
                    animProgresso={animProgresso}
                    barraSelecionada={barraSelecionada}
                    onSelecionarBarra={setBarraSelecionada}
                  />

                  {/* Card de Insights do Período/Barra Selecionada */}
                  {barraSelecionada !== null && pontosVolume[barraSelecionada] && (() => {
                    const ponto = pontosVolume[barraSelecionada];
                    const somaVolume = pontosVolume.reduce((acc, p) => acc + p.volume, 0);
                    const mediaVolume = Math.round(somaVolume / pontosVolume.length);
                    const diffPercent =
                      mediaVolume > 0
                        ? Math.round(((ponto.volume - mediaVolume) / mediaVolume) * 100)
                        : 0;

                    const ehAcima = diffPercent > 0;
                    const ehAbaixo = diffPercent < 0;
                    const termoPeriodo =
                      periodoVolume === 'dias'
                        ? 'diária'
                        : periodoVolume === 'semanas'
                        ? 'semanal'
                        : 'mensal';

                    return (
                      <View className="mt-3.5 rounded-2xl border border-indigo-100 dark:border-[#282B54] bg-indigo-50/60 dark:bg-[#14152D] p-3.5">
                        {/* Cabeçalho do Card de Insight */}
                        <View className="flex-row items-center justify-between pb-2 border-b border-indigo-100/60 dark:border-[#282B54]/60">
                          <View className="flex-row items-center gap-2">
                            <View className="h-6 w-6 items-center justify-center rounded-lg bg-[#5c7cfa]/20">
                              <Feather name="bar-chart" size={13} color="#5c7cfa" />
                            </View>
                            <Text className="text-xs font-bold text-slate-800 dark:text-white">
                              {ponto.rotulo} • {ponto.data}
                            </Text>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Fechar detalhes do período"
                            hitSlop={10}
                            onPress={() => setBarraSelecionada(null)}
                            className="rounded-full p-1 active:bg-indigo-200/50"
                          >
                            <Feather name="x" size={16} color="#64748b" />
                          </Pressable>
                        </View>

                        {/* Conteúdo do Insight */}
                        <View className="mt-2.5">
                          {ponto.volume === 0 ? (
                            <View className="py-2 items-center">
                              <Text className="text-sm font-medium text-slate-500">
                                Nenhum treino registrado neste período.
                              </Text>
                            </View>
                          ) : (
                            <>
                              <View className="flex-row items-baseline justify-between">
                                <Text className="text-sm font-semibold text-slate-800 dark:text-white" numberOfLines={1}>
                                  {ponto.nome}
                                </Text>
                                <Text className="text-base font-bold text-[#5c7cfa]">
                                  {formatarVolume(ponto.volume)}
                                </Text>
                              </View>

                              {/* Linha de detalhes adicionais (Grupo, Duração e Séries) */}
                              {(ponto.duracao > 0 || ponto.grupoMuscular || ponto.totalSeries > 0) && (
                                <View className="mt-1.5 flex-row items-center gap-3">
                                  {ponto.grupoMuscular ? (
                                    <View className="flex-row items-center gap-1">
                                      <Feather name="tag" size={11} color="#64748b" />
                                      <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">{ponto.grupoMuscular}</Text>
                                    </View>
                                  ) : null}
                                  {ponto.duracao > 0 ? (
                                    <View className="flex-row items-center gap-1">
                                      <Feather name="clock" size={11} color="#64748b" />
                                      <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">{ponto.duracao} min</Text>
                                    </View>
                                  ) : null}
                                  {ponto.totalSeries > 0 ? (
                                    <View className="flex-row items-center gap-1">
                                      <Feather name="layers" size={11} color="#64748b" />
                                      <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">{ponto.totalSeries} séries</Text>
                                    </View>
                                  ) : null}
                                </View>
                              )}

                              {/* Insight Comparativo com a média do período */}
                              <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-white/80 dark:bg-[#1C1E3A] px-2.5 py-1.5 border border-indigo-100/50 dark:border-[#282B54]">
                                <Feather
                                  name={ehAcima ? 'trending-up' : ehAbaixo ? 'trending-down' : 'minus'}
                                  size={13}
                                  color={ehAcima ? '#16a34a' : ehAbaixo ? '#d97706' : '#64748b'}
                                />
                                <Text className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex-1">
                                  {ehAcima
                                    ? `${diffPercent}% acima da sua média ${termoPeriodo} (${formatarNumero(mediaVolume)} kg)`
                                    : ehAbaixo
                                    ? `${Math.abs(diffPercent)}% abaixo da sua média ${termoPeriodo} (${formatarNumero(mediaVolume)} kg)`
                                    : `Na média exata do período (${formatarNumero(mediaVolume)} kg)`}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })()}
                </Animated.View>
              ) : (
                <View className="py-8 items-center justify-center">
                  <Text className="text-xs text-slate-400">Nenhum volume registrado ainda.</Text>
                </View>
              )}
            </View>

            {/* Grupos musculares */}
            <View className="mt-5 rounded-3xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] p-4 shadow-sm shadow-slate-100 dark:shadow-none">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-bold text-slate-900 dark:text-white">Grupos musculares</Text>
                {resumo?.grupoMaisTreinado && (
                  <View className="rounded-full bg-indigo-50 dark:bg-[#23264D] px-2.5 py-0.5">
                    <Text className="text-[11px] font-semibold text-[#5c7cfa]">
                      Mais frequente: {resumo.grupoMaisTreinado}
                    </Text>
                  </View>
                )}
              </View>

              {grupos.length > 0 ? (
                <View className="gap-3">
                  {grupos.map((item) => {
                    const larguraAnimada = animProgresso.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', `${item.porcentagem}%`],
                    });

                    return (
                      <View key={item.grupo}>
                        <View className="mb-1 flex-row items-center justify-between">
                          <Text className="text-sm font-semibold text-slate-800 dark:text-white">{item.grupo}</Text>
                          <Text className="text-sm font-bold text-slate-500 dark:text-[#8E92B8]">
                            {item.porcentagem}%
                          </Text>
                        </View>
                        <View className="h-2.5 w-full overflow-hidden rounded-full bg-indigo-50 dark:bg-[#202345]">
                          <Animated.View
                            className="h-full rounded-full bg-[#5c7cfa]"
                            style={{ width: larguraAnimada }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text className="py-4 text-center text-xs text-slate-400">
                  Nenhum dado muscular computado.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
