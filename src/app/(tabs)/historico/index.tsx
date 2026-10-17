import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardTreino } from '@/components/ui/card-treino';
import { listarTreinos, type TreinoResumo } from '@/database/treinoConsultas';


export default function Historico() {
  const router = useRouter();
  const [treinos, setTreino] = useState<TreinoResumo[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        setTreino(listarTreinos());
        setErro(null);
      } catch (error) {
        console.error('[Histórico] Erro ao consultar treinos:', error);
        setErro('Não foi possivel carregar o histórico. Tente novamente');
      }
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <FlatList
        data={treinos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View className="mb-1 pt-4">
            <Text className="text-3xl font-bold text-slate-900 dark:text-white">Histórico</Text>

            <View className="mt-3 flex-row gap-2">
              <Pressable className="rounded-full bg-[#5c7cfa] px-3.5 py-1.5">
                <Text className="text-xs font-semibold text-white">Todos os grupos musculares</Text>
              </Pressable>
              <Pressable className="rounded-full border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-3.5 py-1.5">
                <Text className="text-xs font-semibold text-slate-800 dark:text-slate-200">Período</Text>
              </Pressable>
            </View>

            {erro && <Text className="mt-4 text-sm text-red-500">{erro}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <CardTreino
            treino={item}
            onPress={() =>
              router.push({ pathname: '/historico/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        ListEmptyComponent={
          erro ? null : (
            <Text className="mt-10 text-center text-sm text-slate-400 dark:text-[#8E92B8]">
              Nenhum treino registrado ainda. Toque no + para começar.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}