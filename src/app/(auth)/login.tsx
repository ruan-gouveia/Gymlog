import { TelaPlaceholder } from '@/components/ui/tela-placeholder';

export default function Login() {
  return (
    <TelaPlaceholder
      titulo="Bem-vindo de volta"
      descricao="Login"
      atalhos={[
        { rotulo: 'Entrar', href: '/(tabs)' },
        { rotulo: 'Criar conta', href: '/cadastro' },
      ]}
    />
  );
}
