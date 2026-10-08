import { useLocalSearchParams } from 'expo-router';

import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function DetalhesTreino() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <TelaPlaceholder
      titulo={`Treino #${id}`}
      descricao="Detalhes do treino"
      exibirVoltar
      atalhos={[
        { rotulo: 'Editar', href: { pathname: '/historico/[id]/editar', params: { id } } },
      ]}
    />
  );
}
