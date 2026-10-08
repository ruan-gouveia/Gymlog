import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function Historico() {
  return (
    <TelaPlaceholder
      titulo="Histórico"
      descricao="Listagem de treinos"
      atalhos={[{ rotulo: 'Treino de exemplo (#1)', href: '/historico/1' }]}
    />
  );
}
