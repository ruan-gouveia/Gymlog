import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgendaHorizontal } from '@/components/dashboard/AgendaHorizontal';
import { CardMetaSemanal } from '@/components/dashboard/CardMetaSemanal';
import { CardTreinoHoje } from '@/components/dashboard/CardTreinoHoje';
import { CardTreinoPendente } from '@/components/dashboard/CardTreinoPendente';
import { CardUltimoTreino } from '@/components/dashboard/CardUltimoTreino';
import { CardsResumoInicio } from '@/components/dashboard/CardsResumoInicio';
import {
  excluirTreino,
  formatarDataBr,
  formatarDataExtenso,
  obterConfiguracoesUsuario,
  obterDiasAgenda,
  obterResumoSemana,
  obterTreinosDoDia,
  obterTreinosPendentes,
  obterUltimosTreinos,
  reagendarTreinoParaHoje,
  type ConfiguracoesUsuario,
  type DiaAgendaItem,
  type ResumoSemana,
  type TreinoDiaItem,
  type TreinoPendenteItem,
  type UltimoTreinoItem,
} from '@/database';
import { showToast } from '@/stores/toastStore';

export default function InicioDashboard() {
  const router = useRouter();

  const dataHojeStr = useMemo(() => formatarDataBr(new Date()), []);
  const [dataSelecionada, setDataSelecionada] = useState<string>(dataHojeStr);

  const [configUsuario, setConfigUsuario] = useState<ConfiguracoesUsuario | null>(() => {
    try {
      return obterConfiguracoesUsuario();
    } catch {
      return null;
    }
  });

  const [resumoSemana, setResumoSemana] = useState<ResumoSemana>(() => {
    try {
      return obterResumoSemana();
    } catch {
      return {
        treinosConcluidos: 0,
        metaSemanal: 3,
        porcentagem: 0,
        semanasSeguidas: 2,
        volumeSemana: 0,
        proximoTreino: null,
      };
    }
  });

  const [treinosDoDia, setTreinosDoDia] = useState<TreinoDiaItem[]>(() => {
    try {
      return obterTreinosDoDia(dataHojeStr);
    } catch {
      return [];
    }
  });

  const [treinosPendentes, setTreinosPendentes] = useState<TreinoPendenteItem[]>(() => {
    try {
      return obterTreinosPendentes(dataHojeStr);
    } catch {
      return [];
    }
  });

  const [ultimosTreinos, setUltimosTreinos] = useState<UltimoTreinoItem[]>(() => {
    try {
      return obterUltimosTreinos(3);
    } catch {
      return [];
    }
  });

  const [diasAgenda, setDiasAgenda] = useState<DiaAgendaItem[]>(() => {
    try {
      return obterDiasAgenda(new Date());
    } catch {
      return [];
    }
  });

  const carregarDados = useCallback(() => {
    try {
      const config = obterConfiguracoesUsuario();
      setConfigUsuario(config);
      setResumoSemana(obterResumoSemana());
      setTreinosDoDia(obterTreinosDoDia(dataSelecionada));
      setTreinosPendentes(obterTreinosPendentes(dataHojeStr));
      setUltimosTreinos(obterUltimosTreinos(3));
      setDiasAgenda(obterDiasAgenda(new Date()));
    } catch (error) {
      console.error('[Dashboard] Erro ao carregar dados:', error);
    }
  }, [dataSelecionada, dataHojeStr]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const nomeExibicao = useMemo(() => {
    const nome = configUsuario?.nome_usuario?.trim();
    if (!nome) return 'Ruan';
    return nome.split(' ')[0];
  }, [configUsuario?.nome_usuario]);

  const dataExtenso = useMemo(() => formatarDataExtenso(new Date()), []);

  const handleSelecionarDia = useCallback((data: string) => {
    setDataSelecionada(data);
    try {
      setTreinosDoDia(obterTreinosDoDia(data));
    } catch (error) {
      console.error('[Dashboard] Erro ao carregar treinos do dia:', error);
    }
  }, []);

  const handleReagendar = (treinoId: number) => {
    try {
      reagendarTreinoParaHoje(treinoId);
      showToast('Treino reagendado para hoje com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('[Dashboard] Erro ao reagendar treino:', error);
      showToast('Erro ao reagendar treino.', 'erro');
    }
  };

  const handleExcluirPendente = (treinoId: number) => {
    Alert.alert('Excluir treino', 'Tem certeza que deseja excluir este treino pendente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          try {
            excluirTreino(treinoId);
            showToast('Treino excluído com sucesso.');
            carregarDados();
          } catch (error) {
            console.error('[Dashboard] Erro ao excluir treino pendente:', error);
            showToast('Erro ao excluir o treino.', 'erro');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 14 }}
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-medium text-slate-400 dark:text-[#8E92B8]">
              {dataExtenso}
            </Text>
            <Text className="text-[28px] font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
              Olá, {nomeExibicao}!
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Ir para o perfil"
            onPress={() => router.push('/(tabs)/perfil')}
            activeOpacity={0.7}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#1C1E3A] border border-slate-200 dark:border-[#23264D] items-center justify-center"
          >
            <Feather name="user" size={20} color="#4F67ED" />
          </TouchableOpacity>
        </View>

        <CardMetaSemanal
          treinosConcluidos={resumoSemana.treinosConcluidos}
          metaSemanal={resumoSemana.metaSemanal}
          semanasSeguidas={resumoSemana.semanasSeguidas}
        />

        <AgendaHorizontal
          dias={diasAgenda}
          dataSelecionada={dataSelecionada}
          onSelecionarDia={handleSelecionarDia}
          onAgendarPress={() => router.push('/(tabs)/novo-treino')}
        />

        <CardTreinoHoje
          treinos={treinosDoDia}
          rotuloSecao={dataSelecionada === dataHojeStr ? 'Hoje' : `Treino de ${dataSelecionada}`}
          onIniciarTreino={(id) =>
            router.push({ pathname: '/treino-ativo/[id]' as any, params: { id: String(id) } })
          }
          onVerDetalhes={(id) =>
            router.push({ pathname: '/historico/[id]', params: { id: String(id) } })
          }
          onAgendar={() => router.push('/(tabs)/novo-treino')}
        />

        {treinosPendentes.length > 0 && (
          <View className="mt-6">
            <Text className="text-[18px] font-bold text-slate-900 dark:text-white mb-3 px-0.5">
              Pendentes
            </Text>
            {treinosPendentes.map((item) => (
              <CardTreinoPendente
                key={item.id}
                treino={item}
                onReagendarHoje={handleReagendar}
                onExcluir={handleExcluirPendente}
              />
            ))}
          </View>
        )}

        <CardsResumoInicio
          volumeSemana={resumoSemana.volumeSemana}
          proximoTreino={resumoSemana.proximoTreino}
        />

        {ultimosTreinos.length > 0 && (
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3 px-0.5">
              <Text className="text-[18px] font-bold text-slate-900 dark:text-white">
                Últimos treinos
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Ver todos os treinos do histórico"
                onPress={() => router.push('/(tabs)/historico')}
                activeOpacity={0.7}
                className="py-1 px-1"
              >
                <Text className="text-[13px] font-bold text-[#4F67ED] dark:text-[#7B91FF]">
                  Ver todos
                </Text>
              </TouchableOpacity>
            </View>

            {ultimosTreinos.map((item) => (
              <CardUltimoTreino
                key={item.id}
                treino={item}
                onPress={() =>
                  router.push({ pathname: '/historico/[id]', params: { id: String(item.id) } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
