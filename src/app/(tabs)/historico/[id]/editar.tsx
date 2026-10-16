import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  TreinoEdicaoForm,
  detalheParaFormulario,
  formularioParaPayload,
  type TreinoEdicaoValues,
} from '@/components/treino-edicao-form';
import { buscarTreinoPorId } from '@/database/treinoConsultas';
import { atualizarTreinoComExercicios } from '@/database/treinoRepository';
import { showToast } from '@/stores/toastStore';

type Carregamento = { valores: TreinoEdicaoValues } | { erro: string };

export default function EditarTreino() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const treinoId = Number(id);

 const carregamento = useMemo<Carregamento>(() => {
  try {
    const treino = Number.isInteger(treinoId) ? buscarTreinoPorId(treinoId) : null;
    if (!treino) return { erro: 'Treino não encontrado.' };
    return { valores: detalheParaFormulario(treino) };
  } catch (error) {
    console.error('[Edição] Erro ao carregar treino:', error);
    return { erro: 'Não foi possível carregar o treino.' };
  }
}, [treinoId]);

  function salvar(valores: TreinoEdicaoValues) {
    try {
      const { treino, exercicios } = formularioParaPayload(valores);
      atualizarTreinoComExercicios(treinoId, treino, exercicios);
      showToast('Treino atualizado com sucesso!');
      router.back(); // a tela de Detalhes recarrega via useFocusEffect
    } catch (error) {
      console.error('[Edição] Erro ao atualizar treino:', error);
      showToast('Erro ao salvar as alterações. Tente novamente.', 'erro');
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/historico'))}
        className="flex-row items-center px-5 pb-2 pt-3"
      >
        <Feather name="chevron-left" size={26} color="#1e293b" />
        <Text className="ml-1 text-xl font-bold text-slate-900">Editar treino</Text>
      </Pressable>

      {'valores' in carregamento ? (
        <TreinoEdicaoForm defaultValues={carregamento.valores} onSubmit={salvar} />
      ) : (
        <Text className="mt-8 px-5 text-center text-sm text-red-500">{carregamento.erro}</Text>
      )}
    </SafeAreaView>
  );
}