import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function SelecionarExercicio() {
  return (
    <TelaPlaceholder
      titulo="Selecionar exercício"
      descricao="Catálogo e busca de exercícios"
      exibirVoltar
      atalhos={[{ rotulo: 'Supino reto', href: '/exercicio/registrar' }]}
    />
  );
}
