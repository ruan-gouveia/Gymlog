import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { TreinoDiaItem } from '@/database/inicioConsultas';

type CardTreinoHojeProps = {
  treino?: TreinoDiaItem | null;
  treinos?: TreinoDiaItem[];
  rotuloSecao?: string;
  onIniciarTreino: (treinoId: number) => void;
  onVerDetalhes: (treinoId: number) => void;
  onAgendar: () => void;
};

export function CardTreinoHoje({
  treino,
  treinos,
  rotuloSecao = 'Hoje',
  onIniciarTreino,
  onVerDetalhes,
  onAgendar,
}: CardTreinoHojeProps) {
  const listaTreinos = treinos ?? (treino ? [treino] : []);

  if (listaTreinos.length === 0) {
    return (
      <View className="mt-5">
        <Text className="text-[14px] font-semibold text-slate-400 dark:text-[#8E92B8] mb-2 px-0.5">
          {rotuloSecao}
        </Text>
        <View className="bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-5 items-center justify-center">
          <View className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#23264D] items-center justify-center mb-2">
            <MaterialCommunityIcons name="calendar-blank" size={24} color="#8E92B8" />
          </View>
          <Text className="text-[15px] font-bold text-slate-900 dark:text-white text-center">
            Nenhum treino marcado
          </Text>
          <Text className="text-[13px] text-slate-400 dark:text-[#8E92B8] text-center mt-0.5 mb-3">
            Aproveite para descansar ou agendar um novo treino.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Agendar treino"
            onPress={onAgendar}
            activeOpacity={0.7}
            className="bg-[#EBF0FF] dark:bg-[#23264D] px-4 py-2 rounded-xl"
          >
            <Text className="text-[13px] font-bold text-[#4F67ED] dark:text-[#7B91FF]">
              + Agendar treino
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-5">
      <Text className="text-[14px] font-semibold text-slate-400 dark:text-[#8E92B8] mb-2 px-0.5">
        {rotuloSecao}
      </Text>

      <View className="gap-3">
        {listaTreinos.map((t) => {
          const ehConcluido = t.status === 'concluido';
          const ehAgendado = t.status === 'agendado';

          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => onVerDetalhes(t.id)}
              activeOpacity={0.8}
              className="bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] rounded-[24px] p-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-12 h-12 rounded-2xl bg-[#EEF2FF] dark:bg-[#23264D] items-center justify-center mr-3">
                    <MaterialCommunityIcons name="dumbbell" size={22} color="#4F67ED" />
                  </View>

                  <View className="flex-1">
                    <Text
                      className="text-[16px] font-bold text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {t.nome}
                    </Text>
                    <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8] mt-0.5">
                      {t.horario ?? '18:00'} · {t.totalExercicios} {t.totalExercicios === 1 ? 'exercício' : 'exercícios'} · {t.totalSeries} séries
                    </Text>
                  </View>
                </View>

                <View
                  className={`px-3 py-1 rounded-full ${
                    ehConcluido
                      ? 'bg-[#ECFDF5] dark:bg-emerald-950/40'
                      : ehAgendado
                      ? 'bg-[#EEF2FF] dark:bg-[#23264D]'
                      : 'bg-slate-100 dark:bg-[#23264D]'
                  }`}
                >
                  <Text
                    className={`text-[12px] font-bold ${
                      ehConcluido
                        ? 'text-[#059669] dark:text-[#34D399]'
                        : ehAgendado
                        ? 'text-[#4F67ED] dark:text-[#7B91FF]'
                        : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {ehConcluido ? 'Concluído' : ehAgendado ? 'Agendado' : 'Não realizado'}
                  </Text>
                </View>
              </View>

              {ehAgendado && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Iniciar treino"
                  onPress={() => onIniciarTreino(t.id)}
                  activeOpacity={0.8}
                  className="mt-3.5 bg-[#4F67ED] rounded-[16px] py-3.5 flex-row items-center justify-center shadow-sm"
                >
                  <Feather name="play" size={17} color="#FFFFFF" />
                  <Text className="ml-2 text-white text-[15px] font-bold">Iniciar treino</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
