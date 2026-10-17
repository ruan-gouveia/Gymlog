import React from 'react';
import { Text, View } from 'react-native';

import { formatarVolume } from '@/utils/formatacao';

type CardsResumoInicioProps = {
  volumeSemana: number;
  proximoTreino: string | null;
};

export function CardsResumoInicio({
  volumeSemana,
  proximoTreino,
}: CardsResumoInicioProps) {
  return (
    <View className="flex-row gap-3 mt-5">
      <View className="flex-1 bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 shadow-sm min-h-[96px] justify-between">
        <Text className="text-[13px] font-medium text-slate-400 dark:text-[#8E92B8]">
          Volume da semana
        </Text>
        <Text
          className="text-[22px] font-black text-slate-900 dark:text-white mt-1"
          numberOfLines={1}
        >
          {formatarVolume(volumeSemana)}
        </Text>
      </View>

      <View className="flex-1 bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 shadow-sm min-h-[96px] justify-between">
        <Text className="text-[13px] font-medium text-slate-400 dark:text-[#8E92B8]">
          Próximo treino
        </Text>
        <Text
          className={`mt-1 font-bold ${
            proximoTreino
              ? 'text-[22px] font-black text-slate-900 dark:text-white'
              : 'text-[13px] font-medium text-slate-400 dark:text-[#8E92B8] leading-tight'
          }`}
          numberOfLines={2}
        >
          {proximoTreino ?? 'Nenhum treino posterior agendado'}
        </Text>
      </View>
    </View>
  );
}

