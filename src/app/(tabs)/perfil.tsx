import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '@/stores/useThemeStore';
import { agendarForcarBarraNavegacaoEscura } from '@/utils/sistemaNavegacao';

export default function Perfil() {
  const { colorScheme } = useColorScheme();
  const { tema, setTema } = useThemeStore();
  const ehEscuro = colorScheme === 'dark' || tema === 'dark';

  const [metaSemanal, setMetaSemanal] = useState(5);
  const [lembretesAtivos, setLembretesAtivos] = useState(true);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho do Usuário */}
        <View className="items-center mt-2 mb-5">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#4F67ED] mb-3 shadow-md shadow-indigo-500/20">
            <Text className="text-3xl font-extrabold text-white">M</Text>
          </View>
          <Text className="text-[22px] font-bold text-slate-900 dark:text-white">
            Matheus Silva
          </Text>
          <Text className="text-[13px] font-medium text-slate-400 dark:text-[#8E92B8] mt-0.5">
            @matheus.silva · Nível Intermediário
          </Text>
        </View>

        {/* 3 Cards de Estatísticas Globais */}
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm shadow-slate-100 dark:shadow-none">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">30</Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">Treinos</Text>
          </View>

          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm shadow-slate-100 dark:shadow-none">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">12</Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">Recordes</Text>
          </View>

          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm shadow-slate-100 dark:shadow-none">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">4</Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">Sequência</Text>
          </View>
        </View>

        {/* Card Agrupador de Configurações */}
        <View className="rounded-[24px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-4 py-2 mb-4 shadow-sm shadow-slate-100 dark:shadow-none">
          {/* Meta Semanal */}
          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bar-chart-2" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Meta semanal</Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">Treinos por semana</Text>
              </View>
            </View>

            <View className="flex-row items-center rounded-xl border border-slate-200/90 dark:border-[#282B54] bg-[#F4F6FA] dark:bg-[#12132A] h-9 overflow-hidden">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Diminuir meta semanal"
                hitSlop={6}
                onPress={() => setMetaSemanal((m) => Math.max(1, m - 1))}
                className="w-8 h-full items-center justify-center active:bg-slate-200/50 dark:active:bg-[#202348]"
              >
                <Text className="text-base font-bold text-slate-600 dark:text-slate-300">-</Text>
              </Pressable>
              <View className="w-8 h-full items-center justify-center border-l border-r border-slate-200/90 dark:border-[#282B54] bg-white dark:bg-[#181A38]">
                <Text className="text-sm font-bold text-slate-900 dark:text-white text-center">
                  {metaSemanal}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Aumentar meta semanal"
                hitSlop={6}
                onPress={() => setMetaSemanal((m) => Math.min(7, m + 1))}
                className="w-8 h-full items-center justify-center active:bg-slate-200/50 dark:active:bg-[#202348]"
              >
                <Text className="text-base font-bold text-slate-600 dark:text-slate-300">+</Text>
              </Pressable>
            </View>
          </View>

          {/* Toggle do Tema Escuro */}
          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="moon" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Tema escuro</Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">Visual para treinar à noite</Text>
              </View>
            </View>

            <Switch
              value={ehEscuro}
              onValueChange={(val) => {
                setTema(val ? 'dark' : 'light');
                agendarForcarBarraNavegacaoEscura();
              }}
              trackColor={{ false: '#E2E8F0', true: '#5C7CFA' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Lembretes */}
          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bell" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Lembretes</Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">Seg, Qua e Sex às 18:00</Text>
              </View>
            </View>

            <Switch
              value={lembretesAtivos}
              onValueChange={setLembretesAtivos}
              trackColor={{ false: '#E2E8F0', true: '#5C7CFA' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          {/* Backup local */}
          <Pressable className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70 active:opacity-70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="download" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Backup local</Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">Exportar dados (JSON)</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
          </Pressable>

          {/* Sobre o aplicativo */}
          <Pressable className="flex-row items-center justify-between py-3.5 active:opacity-70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <MaterialCommunityIcons name="dumbbell" size={20} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Sobre o aplicativo</Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">GymLog 2.0</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
          </Pressable>
        </View>

        {/* Botão Sair da Conta */}
        <Pressable
          accessibilityRole="button"
          className="items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] py-3.5 bg-white dark:bg-[#1C1E3A] active:opacity-80 shadow-sm shadow-slate-100 dark:shadow-none"
        >
          <Text className="text-[15px] font-bold text-slate-900 dark:text-white">Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
