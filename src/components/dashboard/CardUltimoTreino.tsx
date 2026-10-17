import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { UltimoTreinoItem } from '@/database/inicioConsultas';
import { formatarDuracao, formatarVolume } from '@/utils/formatacao';

type CardUltimoTreinoProps = {
  treino: UltimoTreinoItem;
  onPress: () => void;
};

export function CardUltimoTreino({ treino, onPress }: CardUltimoTreinoProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalhes do treino ${treino.nome}`}
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 mb-2.5 flex-row items-center justify-between shadow-sm"
    >
      <View className="flex-row items-center flex-1 pr-3">
        <View className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#23264D] items-center justify-center mr-3">
          <MaterialCommunityIcons name="dumbbell" size={22} color="#4F67ED" />
        </View>

        <View className="flex-1">
          <Text
            className="text-[16px] font-bold text-slate-900 dark:text-white"
            numberOfLines={1}
          >
            {treino.nome}
          </Text>
          <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8] mt-0.5">
            {treino.dataLegivel} · {treino.totalExercicios} {treino.totalExercicios === 1 ? 'exercício' : 'exercícios'} · {formatarDuracao(treino.duracao)}
          </Text>
        </View>
      </View>

      <Text className="text-[15px] font-extrabold text-[#4F67ED] dark:text-[#7B91FF]">
        {formatarVolume(treino.volume)}
      </Text>
    </TouchableOpacity>
  );
}
