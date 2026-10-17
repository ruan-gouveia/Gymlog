/** @jsxImportSource react */
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useRouter } from 'expo-router';
import { type ComponentProps, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { agendarForcarBarraNavegacaoEscura } from '@/utils/sistemaNavegacao';

type NomeIcone = ComponentProps<typeof Feather>['name'];

type ItemBarra =
  | { tipo: 'aba'; rota: string; icone: NomeIcone; rotulo: string }
  | { tipo: 'acao'; rota: string; icone: NomeIcone; rotulo: string };

const ITENS_BARRA: ItemBarra[] = [
  { tipo: 'aba', rota: 'index', icone: 'home', rotulo: 'Início' },
  { tipo: 'aba', rota: 'historico', icone: 'list', rotulo: 'Histórico' },
  { tipo: 'acao', rota: 'novo-treino', icone: 'plus', rotulo: 'Novo treino' },
  { tipo: 'aba', rota: 'estatisticas', icone: 'bar-chart-2', rotulo: 'Estatísticas' },
  { tipo: 'aba', rota: 'perfil', icone: 'user', rotulo: 'Perfil' },
];

// Cores fixas do tema escuro da Tab Bar (sempre escura conforme o protótipo V2)
const CORES_TAB_BAR = {
  fundo: '#12132A',
  borda: '#1F2244',
  primaria: '#5C7CFA',
  inativo: '#8A8DB5',
  branco: '#FFFFFF',
};

const TAMANHO_BOTAO_CENTRAL = 58;

export function BarraAbas({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const rotaAtiva = state.routes[state.index]?.name;

  useEffect(() => {
    const limpar = agendarForcarBarraNavegacaoEscura();
    return limpar;
  }, [rotaAtiva]);

  function navegarPara(item: ItemBarra) {
    if (item.tipo === 'acao') {
      router.push('/novo-treino');
      return;
    }

    const rota = state.routes.find((r) => r.name === item.rota);
    if (!rota) {
      router.push(`/(tabs)/${item.rota}` as never);
      return;
    }

    const evento = navigation.emit({
      type: 'tabPress',
      target: rota.key,
      canPreventDefault: true,
    });

    if (rotaAtiva !== item.rota && !evento.defaultPrevented) {
      navigation.navigate(rota.name, rota.params);
    }
  }

  return (
    <View
      style={[
        estilos.barra,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {ITENS_BARRA.map((item) => {
        const focado = rotaAtiva === item.rota;

        if (item.tipo === 'acao') {
          return (
            <View key={item.rota} style={estilos.itemCentral}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.rotulo}
                accessibilityState={{ selected: focado }}
                onPress={() => navegarPara(item)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={({ pressed }) => [
                  estilos.botaoCentral,
                  pressed && estilos.botaoCentralPressionado,
                ]}
              >
                <Feather name={item.icone} size={28} color={CORES_TAB_BAR.branco} />
              </Pressable>
            </View>
          );
        }

        const rota = state.routes.find((r) => r.name === item.rota);
        const rotulo = (rota && descriptors[rota.key]?.options.title) ?? item.rotulo;
        const cor = focado ? CORES_TAB_BAR.primaria : CORES_TAB_BAR.inativo;

        return (
          <Pressable
            key={item.rota}
            accessibilityRole="tab"
            accessibilityLabel={rotulo}
            accessibilityState={{ selected: focado }}
            onPress={() => navegarPara(item)}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
            style={estilos.item}
          >
            <View style={estilos.iconeContainer}>
              <Feather name={item.icone} size={22} color={cor} />
            </View>
            <Text
              style={[
                estilos.rotulo,
                {
                  color: cor,
                  fontWeight: focado ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: CORES_TAB_BAR.fundo,
    borderTopColor: CORES_TAB_BAR.borda,
    borderTopWidth: 1,
    paddingTop: 10,
    minHeight: 68,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconeContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotulo: {
    fontSize: 11,
    textAlign: 'center',
  },
  itemCentral: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCentral: {
    width: TAMANHO_BOTAO_CENTRAL,
    height: TAMANHO_BOTAO_CENTRAL,
    borderRadius: TAMANHO_BOTAO_CENTRAL / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CORES_TAB_BAR.primaria,
    marginTop: -28,
    borderWidth: 4,
    borderColor: CORES_TAB_BAR.fundo,
    elevation: 8,
    shadowColor: CORES_TAB_BAR.primaria,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  botaoCentralPressionado: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
});
