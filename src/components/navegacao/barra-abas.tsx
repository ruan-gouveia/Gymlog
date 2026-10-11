/** @jsxImportSource react */
import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, espacamento, tipografia } from '@/constants/tema';

type NomeIcone = ComponentProps<typeof Feather>['name'];

type ItemBarra =
  | { tipo: 'aba'; rota: string; icone: NomeIcone }
  | { tipo: 'acao'; rota: string; icone: NomeIcone; rotulo: string };

const ITENS_BARRA: ItemBarra[] = [
  { tipo: 'aba', rota: 'index', icone: 'home' },
  { tipo: 'aba', rota: 'historico', icone: 'list' },
  { tipo: 'acao', rota: 'novo-treino', icone: 'plus', rotulo: 'Novo treino' },
  { tipo: 'aba', rota: 'estatisticas', icone: 'bar-chart-2' },
  { tipo: 'aba', rota: 'perfil', icone: 'user' },
];

const TAMANHO_BOTAO_CENTRAL = 56;

export function BarraAbas({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rotaAtiva = state.routes[state.index]?.name;

  function navegarPara(nomeRota: string) {
    const rota = state.routes.find((r) => r.name === nomeRota);
    if (!rota) return;

    const evento = navigation.emit({
      type: 'tabPress',
      target: rota.key,
      canPreventDefault: true,
    });

    if (rotaAtiva !== nomeRota && !evento.defaultPrevented) {
      navigation.navigate(rota.name, rota.params);
    }
  }

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, espacamento.sm) }]}>
      {ITENS_BARRA.map((item) => {
        const focado = rotaAtiva === item.rota;

        if (item.tipo === 'acao') {
          return (
            <View key={item.rota} style={estilos.item}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.rotulo}
                accessibilityState={{ selected: focado }}
                onPress={() => navegarPara(item.rota)}
                style={({ pressed }) => [
                  estilos.botaoCentral,
                  pressed && estilos.botaoCentralPressionado,
                ]}>
                <Feather name={item.icone} size={26} color={cores.texto} />
              </Pressable>
            </View>
          );
        }

        const rota = state.routes.find((r) => r.name === item.rota);
        const rotulo = (rota && descriptors[rota.key]?.options.title) ?? item.rota;
        const cor = focado ? cores.primaria : cores.textoInativo;

        return (
          <Pressable
            key={item.rota}
            accessibilityRole="tab"
            accessibilityLabel={rotulo}
            accessibilityState={{ selected: focado }}
            onPress={() => navegarPara(item.rota)}
            style={estilos.item}>
            <Feather name={item.icone} size={22} color={cor} />
            <Text style={[estilos.rotulo, { color: cor }]} numberOfLines={1}>
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
    alignItems: 'flex-end',
    backgroundColor: cores.superficie,
    borderTopColor: cores.borda,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: espacamento.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  rotulo: {
    fontSize: tipografia.legenda - 1,
    fontWeight: '500',
  },
  botaoCentral: {
    width: TAMANHO_BOTAO_CENTRAL,
    height: TAMANHO_BOTAO_CENTRAL,
    borderRadius: TAMANHO_BOTAO_CENTRAL / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.primaria,
    marginTop: -TAMANHO_BOTAO_CENTRAL / 2,
    borderWidth: 4,
    borderColor: cores.fundo,
    elevation: 6,
    shadowColor: cores.primaria,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  botaoCentralPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
