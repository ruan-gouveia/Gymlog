import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { TreinoPendenteItem } from '@/database/inicioConsultas';

type CardTreinoPendenteProps = {
  treino: TreinoPendenteItem;
  onReagendarHoje: (treinoId: number) => void;
  onExcluir: (treinoId: number) => void;
};

export function CardTreinoPendente({
  treino,
  onReagendarHoje,
  onExcluir,
}: CardTreinoPendenteProps) {
  return (
    <View className="bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 mb-3 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-bold text-slate-900 dark:text-white">
          {treino.nome}
        </Text>
        <View className="bg-slate-100 dark:bg-[#23264D] px-2.5 py-0.5 rounded-full">
          <Text className="text-[12px] font-medium text-slate-500 dark:text-[#8E92B8]">
            Não realizado
          </Text>
        </View>
      </View>

      <Text className="text-[13px] text-slate-400 dark:text-[#8E92B8] mt-0.5">
        Era para {treino.dataLegivel}
      </Text>

      <View className="flex-row items-center gap-3 mt-3.5">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Reagendar ${treino.nome} para hoje`}
          onPress={() => onReagendarHoje(treino.id)}
          activeOpacity={0.8}
          className="flex-1 bg-[#4F67ED] rounded-[16px] py-2.5 items-center justify-center shadow-sm"
        >
          <Text className="text-white font-bold text-[14px]">Reagendar p/ hoje</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${treino.nome}`}
          onPress={() => onExcluir(treino.id)}
          activeOpacity={0.8}
          className="flex-1 border border-slate-200 dark:border-[#2E3160] bg-white dark:bg-[#1C1E3A] rounded-[16px] py-2.5 items-center justify-center"
        >
          <Text className="text-slate-700 dark:text-slate-200 font-bold text-[14px]">Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
