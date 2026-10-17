import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  db,
  obterConfiguracoesUsuario,
  salvarMetaSemanal,
  salvarPreferenciaLembretes,
} from '@/database';
import { showToast } from '@/stores/toastStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { agendarForcarBarraNavegacaoEscura } from '@/utils/sistemaNavegacao';

export default function Perfil() {
  const { colorScheme } = useColorScheme();
  const { tema, setTema } = useThemeStore();
  const ehEscuro = colorScheme === 'dark' || tema === 'dark';

  const [nomeUsuario, setNomeUsuario] = useState('Matheus Silva');
  const [metaSemanal, setMetaSemanal] = useState(3);
  const [lembretesAtivos, setLembretesAtivos] = useState(true);

  const [totalTreinos, setTotalTreinos] = useState(0);
  const [totalRecordes, setTotalRecordes] = useState(0);
  const [sequenciaSemanas, setSequenciaSemanas] = useState(2);

  const carregarPerfil = useCallback(() => {
    try {
      const config = obterConfiguracoesUsuario();
      setNomeUsuario(config.nome_usuario || 'Matheus Silva');
      setMetaSemanal(config.meta_semanal || 3);
      setLembretesAtivos(config.lembretes_ativo === 1);

      const treinosRow = db.getAllSync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM treinos WHERE status = 'concluido';"
      );
      setTotalTreinos(treinosRow[0]?.total ?? 0);

      const exerciciosRow = db.getAllSync<{ total: number }>(
        'SELECT COUNT(DISTINCT nome) AS total FROM exercicios;'
      );
      setTotalRecordes(exerciciosRow[0]?.total ?? 0);
      setSequenciaSemanas(Math.max(1, Math.min(6, Math.floor((treinosRow[0]?.total ?? 0) / 4))));
    } catch (e) {
      console.error('[Perfil] Erro ao carregar configurações:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPerfil();
    }, [carregarPerfil])
  );

  const handleAlterarMeta = (nova: number) => {
    const clamped = Math.max(1, Math.min(7, nova));
    setMetaSemanal(clamped);
    try {
      salvarMetaSemanal(clamped);
      showToast(`Meta atualizada para ${clamped} treinos/semana!`);
    } catch (e) {
      console.error('[Perfil] Erro ao salvar meta:', e);
    }
  };

  const handleToggleLembretes = (ativo: boolean) => {
    setLembretesAtivos(ativo);
    try {
      salvarPreferenciaLembretes(ativo);
      showToast(ativo ? 'Lembretes ativados!' : 'Lembretes desativados!');
    } catch (e) {
      console.error('[Perfil] Erro ao salvar lembretes:', e);
    }
  };

  const inicialNome = nomeUsuario.trim().charAt(0).toUpperCase() || 'M';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mt-2 mb-5">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#4F67ED] mb-3 shadow-md shadow-indigo-500/20">
            <Text className="text-3xl font-extrabold text-white">{inicialNome}</Text>
          </View>
          <Text className="text-[22px] font-bold text-slate-900 dark:text-white">
            {nomeUsuario}
          </Text>
          <Text className="text-[13px] font-medium text-slate-400 dark:text-[#8E92B8] mt-0.5">
            @{nomeUsuario.toLowerCase().replace(/\s+/g, '.')} · Nível Intermediário
          </Text>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalTreinos}
            </Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">
              Treinos
            </Text>
          </View>

          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {totalRecordes}
            </Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">
              Exercícios
            </Text>
          </View>

          <View className="flex-1 items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] py-4 px-2 shadow-sm">
            <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {sequenciaSemanas}
            </Text>
            <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mt-1">
              Sequência
            </Text>
          </View>
        </View>

        <View className="rounded-[24px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-4 py-2 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bar-chart-2" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Meta semanal
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  Treinos por semana
                </Text>
              </View>
            </View>

            <View className="flex-row items-center rounded-xl border border-slate-200/90 dark:border-[#282B54] bg-[#F4F6FA] dark:bg-[#12132A] h-9 overflow-hidden">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Diminuir meta semanal"
                hitSlop={6}
                onPress={() => handleAlterarMeta(metaSemanal - 1)}
                activeOpacity={0.7}
                className="w-8 h-full items-center justify-center"
              >
                <Text className="text-base font-bold text-slate-600 dark:text-slate-300">-</Text>
              </TouchableOpacity>
              <View className="w-8 h-full items-center justify-center border-l border-r border-slate-200/90 dark:border-[#282B54] bg-white dark:bg-[#181A38]">
                <Text className="text-sm font-bold text-slate-900 dark:text-white text-center">
                  {metaSemanal}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Aumentar meta semanal"
                hitSlop={6}
                onPress={() => handleAlterarMeta(metaSemanal + 1)}
                activeOpacity={0.7}
                className="w-8 h-full items-center justify-center"
              >
                <Text className="text-base font-bold text-slate-600 dark:text-slate-300">+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="moon" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Tema escuro
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  Visual para treinar à noite
                </Text>
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

          <View className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bell" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Lembretes
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  Seg, Qua e Sex às 18:00
                </Text>
              </View>
            </View>

            <Switch
              value={lembretesAtivos}
              onValueChange={handleToggleLembretes}
              trackColor={{ false: '#E2E8F0', true: '#5C7CFA' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="download" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Backup local
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  Exportar dados (JSON)
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center justify-between py-3.5"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <MaterialCommunityIcons name="dumbbell" size={20} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Sobre o aplicativo
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  GymLog 2.0
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => Alert.alert('Sair da conta', 'Tem certeza que deseja sair?')}
          activeOpacity={0.8}
          className="items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] py-3.5 bg-white dark:bg-[#1C1E3A] shadow-sm"
        >
          <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
            Sair da conta
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
