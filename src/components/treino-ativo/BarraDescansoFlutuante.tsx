import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  AJUSTE_DESCANSO_SEGUNDOS,
  restanteDoDescansoMs,
  type DescansoAtivo,
} from '@/stores/useLiveWorkoutStore';
import { formatarCronometro } from '@/utils/formatadoresTreino';
import { useAgora } from '@/utils/useAgora';

const TAMANHO = 60;
const RAIO = 25;
const TRACO = 5;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

type BarraDescansoFlutuanteProps = {
  descanso: DescansoAtivo;
  bottomInset: number;
  onAlternarPausa: () => void;
  onAjustar: (deltaSegundos: number) => void;
  onEncerrar: () => void;
};

export function BarraDescansoFlutuante({
  descanso,
  bottomInset,
  onAlternarPausa,
  onAjustar,
  onEncerrar,
}: BarraDescansoFlutuanteProps) {
  const pausado = descanso.restanteMs !== null;
  const agora = useAgora(250, !pausado);
  const restanteMs = restanteDoDescansoMs(descanso, agora);
  const acabou = restanteMs <= 0;
  const disparouRef = useRef(false);

  useEffect(() => {
    if (!acabou || disparouRef.current) return;
    disparouRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onEncerrar();
  }, [acabou, onEncerrar]);

  const fracao = Math.min(1, restanteMs / descanso.totalMs);
  const deslocamento = CIRCUNFERENCIA * (1 - fracao);

  return (
    <View
      className="absolute left-4 right-4 rounded-[24px] bg-white dark:bg-[#1C1E3A] border border-slate-200 dark:border-[#23264D] p-4"
      style={{
        bottom: bottomInset + 12,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View className="flex-row items-center">
        <View style={{ width: TAMANHO, height: TAMANHO }} className="items-center justify-center">
          <Svg width={TAMANHO} height={TAMANHO} viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}>
            <Circle
              cx={TAMANHO / 2}
              cy={TAMANHO / 2}
              r={RAIO}
              stroke="#94A3B8"
              strokeOpacity={0.25}
              strokeWidth={TRACO}
              fill="none"
            />
            <Circle
              cx={TAMANHO / 2}
              cy={TAMANHO / 2}
              r={RAIO}
              stroke="#4F67ED"
              strokeWidth={TRACO}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUNFERENCIA} ${CIRCUNFERENCIA}`}
              strokeDashoffset={deslocamento}
              rotation={-90}
              origin={`${TAMANHO / 2}, ${TAMANHO / 2}`}
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text
              className="text-[13px] font-bold text-slate-900 dark:text-white"
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {formatarCronometro(Math.ceil(restanteMs / 1000))}
            </Text>
          </View>
        </View>

        <View className="flex-1 px-3">
          <Text className="text-[14px] font-bold text-slate-900 dark:text-white">
            {pausado ? 'Descanso pausado' : 'Descanso'}
          </Text>
          {descanso.proximo && (
            <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8] mt-0.5" numberOfLines={1}>
              Próximo: {descanso.proximo}
            </Text>
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Pular descanso"
          onPress={onEncerrar}
          hitSlop={10}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color="#8E92B8" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Diminuir 15 segundos"
          onPress={() => onAjustar(-AJUSTE_DESCANSO_SEGUNDOS)}
          activeOpacity={0.7}
          className="h-11 px-5 rounded-2xl bg-slate-100 dark:bg-[#23264D] items-center justify-center"
        >
          <Text className="text-[14px] font-bold text-slate-700 dark:text-white">-15s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={pausado ? 'Retomar descanso' : 'Pausar descanso'}
          onPress={onAlternarPausa}
          activeOpacity={0.8}
          className="w-14 h-14 rounded-full bg-[#4F67ED] items-center justify-center"
        >
          <Feather name={pausado ? 'play' : 'pause'} size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Aumentar 15 segundos"
          onPress={() => onAjustar(AJUSTE_DESCANSO_SEGUNDOS)}
          activeOpacity={0.7}
          className="h-11 px-5 rounded-2xl bg-slate-100 dark:bg-[#23264D] items-center justify-center"
        >
          <Text className="text-[14px] font-bold text-slate-700 dark:text-white">+15s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}