import { Feather } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Tela } from '@/components/ui/tela';
import { cores, espacamento, raios, tipografia } from '@/constants/tema';

export type AtalhoNavegacao = {
  rotulo: string;
  href: Href;
};

type TelaPlaceholderProps = {
  titulo: string;
  descricao?: string;
  atalhos?: AtalhoNavegacao[];
  exibirVoltar?: boolean;
};

export function TelaPlaceholder({
  titulo,
  descricao,
  atalhos = [],
  exibirVoltar = false,
}: TelaPlaceholderProps) {
  const router = useRouter();

  return (
    <Tela>
      {exibirVoltar && router.canGoBack() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          style={estilos.voltar}>
          <Feather name="chevron-left" size={22} color={cores.texto} />
          <Text style={estilos.textoVoltar}>Voltar</Text>
        </Pressable>
      )}

      <Text style={estilos.titulo}>{titulo}</Text>
      {descricao && <Text style={estilos.descricao}>{descricao}</Text>}

      <View style={estilos.atalhos}>
        {atalhos.map((atalho) => (
          <Link key={atalho.rotulo} href={atalho.href} asChild>
            <Pressable style={({ pressed }) => [estilos.atalho, pressed && estilos.atalhoPressionado]}>
              <Text style={estilos.textoAtalho}>{atalho.rotulo}</Text>
              <Feather name="chevron-right" size={18} color={cores.textoSecundario} />
            </Pressable>
          </Link>
        ))}
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: espacamento.sm,
  },
  textoVoltar: {
    color: cores.texto,
    fontSize: tipografia.corpo,
  },
  titulo: {
    color: cores.texto,
    fontSize: tipografia.titulo,
    fontWeight: '700',
    marginTop: espacamento.md,
  },
  descricao: {
    color: cores.textoSecundario,
    fontSize: tipografia.corpo,
    marginTop: espacamento.xs,
  },
  atalhos: {
    gap: espacamento.sm,
    marginTop: espacamento.lg,
  },
  atalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: 1,
    borderRadius: raios.md,
    paddingHorizontal: espacamento.md,
    paddingVertical: espacamento.md,
  },
  atalhoPressionado: {
    backgroundColor: cores.superficieElevada,
  },
  textoAtalho: {
    color: cores.texto,
    fontSize: tipografia.corpo,
    fontWeight: '500',
  },
});
