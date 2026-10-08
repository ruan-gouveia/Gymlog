import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function Estatisticas() {
  return (
    <TelaPlaceholder
      titulo="Estatísticas"
      descricao="Visão geral e gráficos"
      atalhos={[{ rotulo: 'Evolução', href: '/estatisticas/evolucao' }]}
    />
  );
}
