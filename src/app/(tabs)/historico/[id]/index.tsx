import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { buscarTreinoPorId, type TreinoDetalhe } from '@/database/treinoConsultas';
import { formatarData, formatarDuracao, formatarVolume, resumirSeries } from '@/utils/formatacao';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


function CardResumo({rotulo, valor}: {rotulo: string; valor: string}) {
  return (
    <View className="flex-1 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-3">
      <Text className="text-xs text-slate-500">{rotulo}</Text>
      <Text  className="mt-1 text-lg font-bold text-slate-900">{valor}</Text>
    </View>
  )
}

export default function DetalhesTreino() {
  const router = useRouter();
  const {id} = useLocalSearchParams<{id: string}>();
  const [treino, setTreino] = useState<TreinoDetalhe | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        const treinoId = Number(id);
        setTreino(Number.isInteger(treinoId) ? buscarTreinoPorId(treinoId) : null);
        setErro(null);
      } catch (error) {
        console.error('[Detalhes] Erro ao consultar treino:', error);
        setErro('Não foi possível carregar os detalhes do treino.');
      } finally {
        setCarregado(true);
      }
    }, [id])
  );

  const cabecalho = (
    <Pressable 
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={12}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/historico'))}
      className="flex-row items-center pb-2 pt-3"
    >
      <Feather name="chevron-left" size={26} color="#1e293b" />
      <Text className="ml-1 text-xl font-bold text-slate-900">Detalhes</Text>
    </Pressable>
  );

  if (!treino) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white px-5">
        {cabecalho}
        {carregado && (
          <Text className={`mt-8 text-center text-sm ${erro ? 'text-red-500' : 'text-slate-500'}`}>
            {erro ?? 'Treino não encontrado.'}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32, gap: 12 }}>
        {cabecalho}

        <View>
          <Text className="text-2xl font-bold text-slate-900">{treino.nome}</Text>
          <Text className="text-xs text-slate-500">{formatarData(treino.data)}</Text>
        </View>

        <View className="flex-row gap-3">
          <CardResumo rotulo="Exercícios" valor={String(treino.exercicios.length)} />
          <CardResumo rotulo="Séries" valor={String(treino.total_series)} />
        </View>
        <View className="flex-row gap-3">
          <CardResumo rotulo="Volume" valor={formatarVolume(treino.volume)} />
          <CardResumo rotulo="Duração" valor={formatarDuracao(treino.duracao)} />
        </View>

        {treino.exercicios.length === 0 && (
          <Text className="text-sm text-slate-500">Nenhum exercício registrado neste treino.</Text>
        )}
        {treino.exercicios.map((ex, index) => (
          <View
            key={`${ex.nome}-${index}`}
            className="flex-row items-center justify-between rounded-2xl border border-indigo-100 bg-white px-4 py-3">
            <Text className="flex-1 pr-3 text-sm font-semibold text-slate-900">{ex.nome}</Text>
            <Text className="text-xs text-slate-600">{resumirSeries(ex.series)}</Text>
          </View>
        ))}

        {!!treino.observacoes && (
          <View>
            <Text className="mb-1 text-xs text-slate-500">Observações</Text>
            <View className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <Text className="text-sm text-slate-900">{treino.observacoes}</Text>
            </View>
          </View>
        )}

        <View className="mt-2 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/historico/[id]/editar', params: { id: String(treino.id) } })
            }
            className="h-12 flex-1 items-center justify-center rounded-2xl bg-[#5c7cfa]">
            <Text className="text-base font-semibold text-white">Editar</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            // TODO: implementar exclusão (confirmação + DELETE em cascata) na issue de Delete.
            onPress={() => Alert.alert('Em breve', 'A exclusão será implementada em outra issue.')}
            className="h-12 flex-1 items-center justify-center rounded-2xl border border-indigo-100 bg-white">
            <Text className="text-base font-semibold text-slate-900">Excluir</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}