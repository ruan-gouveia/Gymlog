import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChipsFiltro } from '@/components/ui/ChipsFiltro';
import { CardTreino } from '@/components/ui/card-treino';
import { SeletorData } from '@/components/ui/SeletorData';
import { CATEGORIAS_EXERCICIOS, type CategoriaExercicio } from '@/constants/exerciciosCatalogo';
import { listarTreinos, type TreinoResumo } from '@/database/treinoConsultas';
import {
  OPCOES_PERIODO,
  filtrarTreinos,
  obterLimitesPeriodo,
  type PeriodoHistorico,
} from '@/utils/filtroHistorico';

function rotuloContagem(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? 'treino' : 'treinos'}`;
}

export default function Historico() {
  const router = useRouter();
  const [treinos, setTreinos] = useState<TreinoResumo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [hoje, setHoje] = useState(() => new Date());

  const [grupo, setGrupo] = useState<CategoriaExercicio>('Todos');
  const [periodo, setPeriodo] = useState<PeriodoHistorico>('Todo o período');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useFocusEffect(
    useCallback(() => {
      try {
        setTreinos(listarTreinos());
        setHoje(new Date());
        setErro(null);
      } catch (error) {
        console.error('[Histórico] Erro ao consultar treinos:', error);
        setErro('Não foi possível carregar o histórico. Tente novamente.');
      }
    }, [])
  );

  const limites = useMemo(
    () => obterLimitesPeriodo(periodo, dataInicio, dataFim, hoje),
    [periodo, dataInicio, dataFim, hoje]
  );

  const treinosFiltrados = useMemo(
    () => filtrarTreinos(treinos, { grupo, limites }),
    [treinos, grupo, limites]
  );

  const filtroAtivo = grupo !== 'Todos' || periodo !== 'Todo o período';
  const intervaloInvertido =
    periodo === 'Personalizado' &&
    limites.de !== null &&
    limites.ate !== null &&
    limites.de > limites.ate;

  function limparFiltros() {
    setGrupo('Todos');
    setPeriodo('Todo o período');
    setDataInicio('');
    setDataFim('');
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]">
      <FlatList
        data={treinosFiltrados}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="mb-1 pt-4">
            <View className="flex-row items-end justify-between">
              <Text className="text-3xl font-bold text-slate-900 dark:text-white">Histórico</Text>
              <Text className="text-[13px] font-semibold text-slate-400 dark:text-[#8E92B8] mb-1">
                {filtroAtivo
                  ? `${treinosFiltrados.length} de ${rotuloContagem(treinos.length)}`
                  : rotuloContagem(treinos.length)}
              </Text>
            </View>

            <Text className="mt-4 mb-2 text-[13px] font-semibold text-slate-400 dark:text-[#8E92B8]">
              Grupo muscular
            </Text>
            <View style={{ marginHorizontal: -20 }}>
              <ChipsFiltro
                opcoes={CATEGORIAS_EXERCICIOS}
                valor={grupo}
                onChange={setGrupo}
                paddingHorizontal={20}
              />
            </View>

            <Text className="mt-4 mb-2 text-[13px] font-semibold text-slate-400 dark:text-[#8E92B8]">
              Período
            </Text>
            <View style={{ marginHorizontal: -20 }}>
              <ChipsFiltro
                opcoes={OPCOES_PERIODO}
                valor={periodo}
                onChange={setPeriodo}
                paddingHorizontal={20}
              />
            </View>

            {periodo === 'Personalizado' && (
              <View className="mt-4">
                <View className="flex-row gap-3">
                  <SeletorData
                    label="De"
                    valor={dataInicio}
                    onChange={setDataInicio}
                    maximo={dataFim}
                  />
                  <SeletorData
                    label="Até"
                    valor={dataFim}
                    onChange={setDataFim}
                    minimo={dataInicio}
                  />
                </View>
                {intervaloInvertido && (
                  <Text className="mt-2 ml-1 text-xs text-red-500">
                    A data final não pode ser anterior à data inicial.
                  </Text>
                )}
              </View>
            )}

            {filtroAtivo && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Limpar filtros"
                onPress={limparFiltros}
                activeOpacity={0.7}
                className="mt-3 self-start py-1"
              >
                <Text className="text-[13px] font-bold text-[#4F67ED] dark:text-[#7B91FF]">
                  Limpar filtros
                </Text>
              </TouchableOpacity>
            )}

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
              {treinos.length === 0
                ? 'Nenhum treino registrado ainda. Toque no + para começar.'
                : 'Nenhum treino encontrado para os filtros selecionados.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}