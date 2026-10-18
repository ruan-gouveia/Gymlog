import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraDescansoFlutuante } from '@/components/treino-ativo/BarraDescansoFlutuante';
import { CardExercicioAoVivo } from '@/components/treino-ativo/CardExercicioAoVivo';
import { CronometroSessao } from '@/components/treino-ativo/CronometroSessao';
import { ModalTreinoConcluido } from '@/components/treino-ativo/ModalTreinoConcluido';
import {
  buscarTreinoPorId,
  concluirTreinoAoVivo,
  formatarDataBr,
  type ExercicioParaSalvar,
  type TreinoDetalhe,
} from '@/database';
import { showToast } from '@/stores/toastStore';
import {
  DESCANSO_PADRAO_SEGUNDOS,
  calcularProgresso,
  descreverProximaSerie,
  useLiveWorkoutStore,
  type ExercicioAoVivo,
} from '@/stores/useLiveWorkoutStore';
import { formatarVolume } from '@/utils/formatadoresTreino';

type ResumoFinal = { volume: number; series: number; minutos: number };

function paraExerciciosAoVivo(treino: TreinoDetalhe): ExercicioAoVivo[] {
  return treino.exercicios.map((ex) => {
    const descanso = ex.series[0]?.descanso;
    return {
      nome: ex.nome,
      descanso: descanso && descanso > 0 ? descanso : DESCANSO_PADRAO_SEGUNDOS,
      series: ex.series.map((s) => ({
        repeticoes: s.repeticoes,
        carga: s.carga,
        concluida: false,
      })),
    };
  });
}

export default function TreinoAtivo() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treinoId = Number(id);
  const insets = useSafeAreaInsets();

  const nome = useLiveWorkoutStore((s) => s.nome);
  const tempoInicio = useLiveWorkoutStore((s) => s.tempoInicio);
  const exercicios = useLiveWorkoutStore((s) => s.exercicios);
  const descanso = useLiveWorkoutStore((s) => s.descanso);
  const pronto = useLiveWorkoutStore((s) => s.treinoId === treinoId);

  const iniciar = useLiveWorkoutStore((s) => s.iniciar);
  const resetar = useLiveWorkoutStore((s) => s.resetar);
  const ajustarSerie = useLiveWorkoutStore((s) => s.ajustarSerie);
  const alternarSerie = useLiveWorkoutStore((s) => s.alternarSerie);
  const iniciarDescanso = useLiveWorkoutStore((s) => s.iniciarDescanso);
  const ajustarDescanso = useLiveWorkoutStore((s) => s.ajustarDescanso);
  const pausarOuRetomarDescanso = useLiveWorkoutStore((s) => s.pausarOuRetomarDescanso);
  const pararDescanso = useLiveWorkoutStore((s) => s.pararDescanso);

  const [resumo, setResumo] = useState<ResumoFinal | null>(null);

  const progresso = useMemo(() => calcularProgresso(exercicios), [exercicios]);
  const percentual =
    progresso.totalSeries > 0 ? (progresso.seriesConcluidas / progresso.totalSeries) * 100 : 0;

  useEffect(() => {
    try {
      const treino = buscarTreinoPorId(treinoId);

      if (!treino) {
        showToast('Treino não encontrado.', 'erro');
        router.replace('/(tabs)');
        return;
      }

      if (treino.status === 'concluido') {
        showToast('Este treino já foi concluído.');
        router.replace({ pathname: '/historico/[id]', params: { id: String(treino.id) } });
        return;
      }

      if (treino.data !== formatarDataBr(new Date())) {
        showToast('Só é possível iniciar treinos agendados para hoje.', 'erro');
        router.replace('/(tabs)');
        return;
      }

      if (treino.exercicios.length === 0) {
        showToast('Este treino não possui exercícios.', 'erro');
        router.replace('/(tabs)');
        return;
      }

      iniciar(treino.id, treino.nome, paraExerciciosAoVivo(treino));
    } catch (error) {
      console.error('[Treino Ativo] Erro ao carregar treino:', error);
      showToast('Erro ao carregar o treino.', 'erro');
      router.replace('/(tabs)');
    }

    return () => resetar();
  }, [treinoId, iniciar, resetar]);

  const confirmarSaida = useCallback(() => {
    Alert.alert('Sair do treino?', 'O progresso desta sessão será perdido.', [
      { text: 'Continuar treinando', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
        },
      },
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (resumo !== null) return false;
        confirmarSaida();
        return true;
      });
      return () => sub.remove();
    }, [confirmarSaida, resumo])
  );

  const handleAlternar = (exercicioIdx: number, serieIdx: number) => {
    const marcou = alternarSerie(exercicioIdx, serieIdx);

    if (!marcou) {
      void Haptics.selectionAsync();
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const atual = useLiveWorkoutStore.getState().exercicios;
    const proximo = descreverProximaSerie(atual);
    if (proximo) {
      iniciarDescanso(atual[exercicioIdx].descanso, proximo);
    } else {
      pararDescanso();
    }
  };

  const finalizar = () => {
    const inicio = useLiveWorkoutStore.getState().tempoInicio ?? Date.now();
    const minutos = Math.max(1, Math.round((Date.now() - inicio) / 60000));

    // Só as séries marcadas vão para o histórico, renumeradas por exercício.
    const executados: ExercicioParaSalvar[] = exercicios.flatMap((ex) =>
      ex.series
        .filter((s) => s.concluida)
        .map((s, i) => ({
          nome: ex.nome,
          series: i + 1,
          repeticoes: s.repeticoes,
          carga: s.carga,
          descanso: ex.descanso,
          concluida: 1,
        }))
    );

    try {
      concluirTreinoAoVivo(treinoId, minutos, executados);
      pararDescanso();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResumo({ volume: progresso.volume, series: progresso.seriesConcluidas, minutos });
    } catch (error) {
      console.error('[Treino Ativo] Erro ao finalizar treino:', error);
      showToast('Erro ao salvar o treino. Tente novamente.', 'erro');
    }
  };

  const handleFinalizar = () => {
    if (progresso.seriesConcluidas === 0) {
      Alert.alert('Nenhuma série concluída', 'Marque pelo menos uma série para finalizar o treino.');
      return;
    }

    const pendentes = progresso.totalSeries - progresso.seriesConcluidas;
    if (pendentes > 0) {
      Alert.alert(
        'Finalizar treino?',
        pendentes === 1
          ? '1 série não marcada será descartada.'
          : `${pendentes} séries não marcadas serão descartadas.`,
        [
          { text: 'Continuar treino', style: 'cancel' },
          { text: 'Finalizar', onPress: finalizar },
        ]
      );
      return;
    }

    finalizar();
  };

  if (!pronto) {
    return <View className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]" />;
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <View className="px-5 pt-3 pb-3 flex-row items-center">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sair do treino"
          onPress={confirmarSaida}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#1C1E3A] border border-slate-200 dark:border-[#23264D] items-center justify-center"
        >
          <Feather name="x" size={20} color="#4F67ED" />
        </TouchableOpacity>

        <View className="flex-1 px-3">
          <Text className="text-[17px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>
            {nome}
          </Text>
          <CronometroSessao tempoInicio={tempoInicio} />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Finalizar treino"
          onPress={handleFinalizar}
          activeOpacity={0.8}
          className="bg-[#4F67ED] px-4 py-2.5 rounded-2xl"
        >
          <Text className="text-white text-[14px] font-bold">Finalizar</Text>
        </TouchableOpacity>
      </View>

      <View className="px-5 pb-3">
        <Text className="text-[13px] font-semibold text-slate-500 dark:text-[#8E92B8] mb-2">
          {progresso.seriesConcluidas} de {progresso.totalSeries} séries ·{' '}
          {formatarVolume(progresso.volume)} levantados
        </Text>
        <View className="h-2 rounded-full bg-slate-200 dark:bg-[#23264D] overflow-hidden">
          <View
            className="h-2 rounded-full bg-[#4F67ED]"
            style={{ width: `${percentual}%` }}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: descanso ? 220 + insets.bottom : 40 + insets.bottom,
        }}
      >
        {exercicios.map((ex, i) => (
          <CardExercicioAoVivo
            key={`${ex.nome}-${i}`}
            exercicio={ex}
            onAjustar={(serieIdx, campo, direcao) => ajustarSerie(i, serieIdx, campo, direcao)}
            onAlternar={(serieIdx) => handleAlternar(i, serieIdx)}
          />
        ))}
      </ScrollView>

      {descanso && (
        <BarraDescansoFlutuante
          descanso={descanso}
          bottomInset={insets.bottom}
          onAlternarPausa={pausarOuRetomarDescanso}
          onAjustar={ajustarDescanso}
          onEncerrar={pararDescanso}
        />
      )}

      <ModalTreinoConcluido
        visivel={resumo !== null}
        volume={resumo?.volume ?? 0}
        series={resumo?.series ?? 0}
        minutos={resumo?.minutos ?? 0}
        onVoltarInicio={() => router.replace('/(tabs)')}
        onVerDetalhes={() =>
          router.replace({ pathname: '/historico/[id]', params: { id: String(treinoId) } })
        }
      />
    </SafeAreaView>
  );
}