import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { DiaAgendaItem } from '@/database/inicioConsultas';

type AgendaHorizontalProps = {
  dias: DiaAgendaItem[];
  dataSelecionada: string;
  onSelecionarDia: (data: string) => void;
  onAgendarPress: () => void;
};

export function AgendaHorizontal({
  dias,
  dataSelecionada,
  onSelecionarDia,
  onAgendarPress,
}: AgendaHorizontalProps) {
  return (
    <View className="mt-6">
      <View className="flex-row items-center justify-between mb-3 px-0.5">
        <Text className="text-[18px] font-bold text-slate-900 dark:text-white">Agenda</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Agendar novo treino"
          onPress={onAgendarPress}
          activeOpacity={0.7}
          className="flex-row items-center bg-[#EBF0FF] dark:bg-[#23264D] px-3 py-1.5 rounded-full"
        >
          <Feather name="plus" size={14} color="#4F67ED" />
          <Text className="ml-1 text-[12px] font-bold text-[#4F67ED] dark:text-[#7B91FF]">
            Agendar
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between">
        {dias.map((dia) => {
          const selecionado = dia.data === dataSelecionada;

          return (
            <TouchableOpacity
              key={dia.data}
              onPress={() => onSelecionarDia(dia.data)}
              activeOpacity={0.7}
              className={`flex-1 max-w-[46px] h-[74px] rounded-[18px] items-center justify-center py-2 ${
                selecionado
                  ? 'bg-[#4F67ED]'
                  : 'bg-white dark:bg-[#1C1E3A] border border-slate-200 dark:border-[#23264D]'
              }`}
            >
              <Text
                className={`text-[11px] font-bold tracking-tight ${
                  selecionado ? 'text-white' : 'text-slate-400 dark:text-[#8E92B8]'
                }`}
              >
                {dia.diaSemana}
              </Text>
              <Text
                className={`text-[19px] font-black mt-0.5 ${
                  selecionado ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}
              >
                {dia.diaNumero}
              </Text>

              {dia.temTreino ? (
                <View
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    selecionado ? 'bg-white' : 'bg-[#4F67ED]'
                  }`}
                />
              ) : (
                <View className="h-1.5 mt-1" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
