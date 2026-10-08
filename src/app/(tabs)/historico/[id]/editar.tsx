import { useLocalSearchParams } from 'expo-router';

import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function EditarTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <TelaPlaceholder
      titulo={`Editar treino #${id}`}
      descricao="Edição de treino"
      exibirVoltar
    />
  );
}
