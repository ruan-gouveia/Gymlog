import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function Inicio() {
  return (
    <TelaPlaceholder
      titulo="Início"
      descricao="Dashboard"
      atalhos={[
        { rotulo: 'Novo treino', href: '/novo-treino' },
        { rotulo: 'Detalhes de um treino', href: '/historico/1' },
      ]}
    />
  );
}
