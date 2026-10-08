import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function NovoTreino() {
  return (
    <TelaPlaceholder
      titulo="Novo treino"
      descricao="Cadastro de treino"
      atalhos={[{ rotulo: 'Adicionar exercício', href: '/exercicio/selecionar' }]}
    />
  );
}
