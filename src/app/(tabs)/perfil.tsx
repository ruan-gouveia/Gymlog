import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalLembretes } from '@/components/perfil/ModalLembretes';
import {
  db,
  exportarBancoParaJson,
  obterConfiguracaoLembretes,
  obterConfiguracoesUsuario,
  obterEstatisticasPerfil,
  salvarMetaSemanal,
} from '@/database';
import {
  atualizarPreferenciasESincronizarNotificacoes,
  useNotificacoesTreino,
} from '@/services/notificacoesService';
import { showToast } from '@/stores/toastStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { agendarForcarBarraNavegacaoEscura } from '@/utils/sistemaNavegacao';

type ProximoTreinoPreview = {
  nome: string;
  grupoMuscular: string;
  horario: string;
  data: string;
};

function SwitchFielPrototipo({
  ativo,
  onAlternar,
  accessibilityLabel,
}: {
  ativo: boolean;
  onAlternar: (novoValor: boolean) => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onAlternar(!ativo)}
      hitSlop={8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 999,
        padding: 3,
        backgroundColor: ativo ? '#5C7CFA' : '#E2E8F0',
        justifyContent: 'center',
        alignItems: ativo ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

export default function Perfil() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { tema, setTema } = useThemeStore();
  const ehEscuro = tema === 'system' ? colorScheme === 'dark' : tema === 'dark';

  useNotificacoesTreino(true);

  const [metaSemanal, setMetaSemanal] = useState(3);
  const [lembretesAtivos, setLembretesAtivos] = useState(true);
  const [antecedenciaLembrete, setAntecedenciaLembrete] = useState(30);
  const [proximoTreino, setProximoTreino] = useState<ProximoTreinoPreview | null>(null);

  const [totalTreinos, setTotalTreinos] = useState(0);
  const [totalRecordes, setTotalRecordes] = useState(0);
  const [sequenciaSemanas, setSequenciaSemanas] = useState(0);

  const [modalLembretesVisivel, setModalLembretesVisivel] = useState(false);
  const [modalSobreVisivel, setModalSobreVisivel] = useState(false);
  const [exportandoBackup, setExportandoBackup] = useState(false);

  const versaoApp = Constants.expoConfig?.version ?? '2.0.0';

  const carregarPerfil = useCallback(() => {
    try {
      const config = obterConfiguracoesUsuario();
      const meta = config.meta_semanal || 3;
      setMetaSemanal(meta);

      const configLembretes = obterConfiguracaoLembretes();
      setLembretesAtivos(configLembretes.ativo);
      setAntecedenciaLembrete(configLembretes.antecedenciaMinutos);

      const estatisticas = obterEstatisticasPerfil(meta);
      setTotalTreinos(estatisticas.totalTreinos);
      setTotalRecordes(estatisticas.totalRecordes);
      setSequenciaSemanas(estatisticas.sequenciaSemanas);

      const agendados = db.getAllSync<{
        nome: string;
        grupo_muscular: string;
        horario: string | null;
        data: string;
      }>(
        `SELECT nome, grupo_muscular, horario, data
           FROM treinos
          WHERE status = 'agendado'
          ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) ASC, id ASC
          LIMIT 1;`
      );

      if (agendados.length > 0) {
        setProximoTreino({
          nome: agendados[0].nome,
          grupoMuscular: agendados[0].grupo_muscular || 'Peito',
          horario: agendados[0].horario || '18:00',
          data: agendados[0].data,
        });
      } else {
        setProximoTreino(null);
      }
    } catch (e) {
      console.error('[Perfil] Erro ao carregar dados do perfil:', e);
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
      const estatisticas = obterEstatisticasPerfil(clamped);
      setSequenciaSemanas(estatisticas.sequenciaSemanas);
      showToast(`Meta atualizada para ${clamped} treinos/semana!`);
    } catch (e) {
      console.error('[Perfil] Erro ao salvar meta:', e);
    }
  };

  const handleAlternarTemaEscuro = (ativarEscuro: boolean) => {
    const novoTema = ativarEscuro ? 'dark' : 'light';
    setTema(novoTema);
    setColorScheme(novoTema);
    agendarForcarBarraNavegacaoEscura();
  };

  const handleSalvarLembretes = async (ativo: boolean, antecedenciaMinutos: number) => {
    try {
      const resultado = await atualizarPreferenciasESincronizarNotificacoes(
        ativo,
        antecedenciaMinutos
      );
      setLembretesAtivos(resultado.ativo);
      setAntecedenciaLembrete(resultado.antecedenciaMinutos);

      if (!resultado.ativo) {
        showToast('Lembretes desativados.');
      } else if (!resultado.permitido) {
        showToast('Permissão de notificação negada no dispositivo.', 'erro');
      } else {
        showToast(`Lembretes ativos (${resultado.antecedenciaMinutos} min antes)!`);
      }
    } catch (error) {
      console.error('[Perfil] Erro ao salvar lembretes:', error);
      showToast('Erro ao salvar configurações de lembretes.', 'erro');
    }
  };

  const handleExportarBackup = async () => {
    if (exportandoBackup) return;
    setExportandoBackup(true);
    try {
      const resultado = await exportarBancoParaJson();
      if (resultado.compartilhado) {
        showToast(`Backup JSON exportado (${resultado.totalTreinos} treinos)!`);
      } else {
        Alert.alert(
          'Backup gerado',
          `Arquivo JSON salvo localmente em:\n${resultado.uri}`
        );
      }
    } catch (error) {
      console.error('[Perfil] Erro ao exportar backup JSON:', error);
      showToast('Não foi possível exportar o backup JSON.', 'erro');
    } finally {
      setExportandoBackup(false);
    }
  };

  const handleSairDaConta = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair da sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Dados do Usuário (Genéricos/Mockados conforme especificação) */}
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

        {/* Cards Superiores com Cálculos Reais do SQLite */}
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
              Recordes
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

        {/* Lista de Configurações */}
        <View className="rounded-[24px] border border-[#EAEFF5] dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-4 py-2 mb-4 shadow-sm">
          {/* Meta Semanal */}
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

          {/* Tema Escuro */}
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

            <SwitchFielPrototipo
              ativo={ehEscuro}
              onAlternar={handleAlternarTemaEscuro}
              accessibilityLabel="Alternar tema escuro"
            />
          </View>

          {/* Lembretes (abre ModalLembretes com seta >) */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Configurar lembretes de treino"
            onPress={() => setModalLembretesVisivel(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between py-3.5 border-b border-slate-100 dark:border-[#252852]/70"
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bell" size={18} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                  Lembretes
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]" numberOfLines={1}>
                  {lembretesAtivos
                    ? `Ativado · ${antecedenciaLembrete} min de antecedência`
                    : 'Notificações desativadas'}
                </Text>
              </View>
            </View>

            <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
          </TouchableOpacity>

          {/* Backup Local */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Exportar dados em JSON"
            onPress={handleExportarBackup}
            disabled={exportandoBackup}
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
            {exportandoBackup ? (
              <ActivityIndicator size="small" color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
            ) : (
              <Feather name="chevron-right" size={20} color={ehEscuro ? '#6C7293' : '#94A3B8'} />
            )}
          </TouchableOpacity>

          {/* Sobre o aplicativo */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Sobre o aplicativo GymLog"
            onPress={() => setModalSobreVisivel(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between py-3.5"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854]">
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={20}
                  color={ehEscuro ? '#7C93FF' : '#5C7CFA'}
                />
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
          accessibilityLabel="Sair da conta"
          onPress={handleSairDaConta}
          activeOpacity={0.8}
          className="items-center justify-center rounded-[20px] border border-[#EAEFF5] dark:border-[#23264D] py-3.5 bg-white dark:bg-[#1C1E3A] shadow-sm"
        >
          <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
            Sair da conta
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Lembretes */}
      <ModalLembretes
        visivel={modalLembretesVisivel}
        ativoInicial={lembretesAtivos}
        antecedenciaInicial={antecedenciaLembrete}
        ehEscuro={ehEscuro}
        proximoTreinoInfo={proximoTreino}
        onFechar={() => setModalLembretesVisivel(false)}
        onSalvar={handleSalvarLembretes}
      />

      {/* Modal Sobre o Aplicativo */}
      <Modal
        visible={modalSobreVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalSobreVisivel(false)}
      >
        <Pressable
          onPress={() => setModalSobreVisivel(false)}
          className="flex-1 items-center justify-center px-5"
          style={{ backgroundColor: 'rgba(10, 12, 28, 0.65)' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-[28px] bg-white dark:bg-[#1C1E3A] border border-[#EAEFF5] dark:border-[#23264D] p-6 shadow-xl"
          >
            <View className="items-center mb-4">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#252854] mb-3">
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={32}
                  color={ehEscuro ? '#7C93FF' : '#5C7CFA'}
                />
              </View>
              <Text className="text-[20px] font-extrabold text-slate-900 dark:text-white">
                GymLog 2.0
              </Text>
              <Text className="text-[12px] font-semibold text-[#5C7CFA] dark:text-[#7C93FF] mt-0.5">
                Versão {versaoApp} · Build SDK 57
              </Text>
            </View>

            <Text className="text-[13px] leading-5 text-center text-slate-600 dark:text-[#A3A6CC] mb-4">
              Sistema móvel para planejamento, execução ao vivo e acompanhamento estatístico de
              treinos de musculação com persistência local estruturada.
            </Text>

            <View className="rounded-2xl bg-[#F8FAFC] dark:bg-[#14152D] border border-slate-200/70 dark:border-[#252852] p-3.5 mb-5 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold text-slate-400 dark:text-[#8E92B8]">
                  Persistência Local
                </Text>
                <Text className="text-[12px] font-bold text-slate-800 dark:text-white">
                  SQLite (expo-sqlite) + AsyncStorage
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold text-slate-400 dark:text-[#8E92B8]">
                  Arquitetura & UI
                </Text>
                <Text className="text-[12px] font-bold text-slate-800 dark:text-white">
                  Expo Router · Zustand · NativeWind
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-semibold text-slate-400 dark:text-[#8E92B8]">
                  Recursos Extras
                </Text>
                <Text className="text-[12px] font-bold text-slate-800 dark:text-white">
                  Gráficos · Backup JSON · Lembretes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar sobre o aplicativo"
              onPress={() => setModalSobreVisivel(false)}
              activeOpacity={0.8}
              className="w-full items-center justify-center rounded-2xl py-3.5 bg-[#5C7CFA]"
            >
              <Text className="text-[14px] font-bold text-white">Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
