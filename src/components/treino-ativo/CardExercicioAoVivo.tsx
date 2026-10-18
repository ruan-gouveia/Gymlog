import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { CampoSerie, ExercicioAoVivo } from '@/stores/useLiveWorkoutStore';
import { formatarCarga } from '@/utils/formatadoresTreino';

type StepperProps = {
  rotulo: string;
  valor: string;
  onMenos: () => void;
  onMais: () => void;
};

function Stepper({ rotulo, valor, onMenos, onMais }: StepperProps) {
  return (
    <View className="flex-1">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8E92B8] mb-1.5">
        {rotulo}
      </Text>
      <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 dark:bg-[#14152D] border border-slate-200/70 dark:border-[#23264D] p-1">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${rotulo}`}
          onPress={onMenos}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-xl bg-white dark:bg-[#23264D] items-center justify-center"
        >
          <Feather name="minus" size={18} color="#4F67ED" />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-slate-900 dark:text-white">{valor}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${rotulo}`}
          onPress={onMais}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-xl bg-white dark:bg-[#23264D] items-center justify-center"
        >
          <Feather name="plus" size={18} color="#4F67ED" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CheckboxSerie({ marcada, onPress }: { marcada: boolean; onPress: () => void }) {
  const progresso = useSharedValue(marcada ? 1 : 0);

  useEffect(() => {
    progresso.set(withTiming(marcada ? 1 : 0, { duration: 180 }));
  }, [marcada, progresso]);

  const estiloCaixa = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progresso.get(),
      [0, 1],
      ['rgba(79,103,237,0)', '#4F67ED']
    ),
    borderColor: interpolateColor(progresso.get(), [0, 1], ['#94A3B8', '#4F67ED']),
  }));

  const estiloCheck = useAnimatedStyle(() => ({
    opacity: progresso.get(),
    transform: [{ scale: 0.5 + 0.5 * progresso.get() }],
  }));

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel="Marcar série como concluída"
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width: 34,
            height: 34,
            borderRadius: 10,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloCaixa,
        ]}
      >
        <Animated.View style={estiloCheck}>
          <Feather name="check" size={20} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

type CardExercicioAoVivoProps = {
  exercicio: ExercicioAoVivo;
  onAjustar: (serieIdx: number, campo: CampoSerie, direcao: 1 | -1) => void;
  onAlternar: (serieIdx: number) => void;
};

export function CardExercicioAoVivo({ exercicio, onAjustar, onAlternar }: CardExercicioAoVivoProps) {
  const concluidas = exercicio.series.filter((s) => s.concluida).length;

  return (
    <View className="bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="w-10 h-10 rounded-2xl bg-[#EEF2FF] dark:bg-[#23264D] items-center justify-center mr-3">
            <MaterialCommunityIcons name="dumbbell" size={20} color="#4F67ED" />
          </View>
          <Text className="text-[16px] font-bold text-slate-900 dark:text-white flex-1" numberOfLines={1}>
            {exercicio.nome}
          </Text>
        </View>
        <View className="px-3 py-1 rounded-full bg-[#EEF2FF] dark:bg-[#23264D]">
          <Text className="text-[12px] font-bold text-[#4F67ED] dark:text-[#7B91FF]">
            {concluidas}/{exercicio.series.length}
          </Text>
        </View>
      </View>

      {exercicio.series.map((serie, i) => (
        <View
          key={i}
          className={`rounded-2xl p-3 ${i > 0 ? 'mt-2' : ''} ${
            serie.concluida
              ? 'bg-[#EEF2FF] dark:bg-[#23264D]/60'
              : 'bg-transparent'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[14px] font-bold text-slate-800 dark:text-white">Série {i + 1}</Text>
            <CheckboxSerie marcada={serie.concluida} onPress={() => onAlternar(i)} />
          </View>

          <View className="flex-row gap-3">
            <Stepper
              rotulo="Reps"
              valor={String(serie.repeticoes)}
              onMenos={() => onAjustar(i, 'repeticoes', -1)}
              onMais={() => onAjustar(i, 'repeticoes', 1)}
            />
            <Stepper
              rotulo="Carga (kg)"
              valor={formatarCarga(serie.carga)}
              onMenos={() => onAjustar(i, 'carga', -1)}
              onMais={() => onAjustar(i, 'carga', 1)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}