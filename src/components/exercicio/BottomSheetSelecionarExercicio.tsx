import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ChipsFiltro } from '@/components/ui/ChipsFiltro';
import {
  CATEGORIAS_EXERCICIOS,
  EXERCICIOS_CATALOGO,
  type CategoriaExercicio,
  type ExercicioCatalogo,
} from '@/constants/exerciciosCatalogo';

const DURACAO_ANIMACAO = 220;
const DISTANCIA_PARA_FECHAR = 120;
const VELOCIDADE_PARA_FECHAR = 800;

type Props = {
  visivel: boolean;
  onFechar: () => void;
  onAdicionar: (item: ExercicioCatalogo) => void;
  idsSelecionados: string[];
};

export function BottomSheetSelecionarExercicio({
  visivel,
  onFechar,
  onAdicionar,
  idsSelecionados,
}: Props) {
  const { height } = useWindowDimensions();
  const alturaSheet = Math.round(height * 0.85);
  const translateY = useSharedValue(height);

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaExercicio>('Todos');

  const aoMontarConteudo = useCallback(() => {
    translateY.set(alturaSheet);
    translateY.set(withTiming(0, { duration: DURACAO_ANIMACAO }));
  }, [alturaSheet, translateY]);

  const fechar = useCallback(() => {
    Keyboard.dismiss();
    translateY.set(withTiming(alturaSheet, { duration: DURACAO_ANIMACAO }));
    setTimeout(() => {
      setBusca('');
      setCategoriaAtiva('Todos');
      onFechar();
    }, DURACAO_ANIMACAO);
  }, [alturaSheet, onFechar, translateY]);

  const arrastar = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      translateY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > DISTANCIA_PARA_FECHAR || e.velocityY > VELOCIDADE_PARA_FECHAR) {
        fechar();
      } else {
        translateY.set(withTiming(0, { duration: 150 }));
      }
    });

  const estiloSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.get() }],
  }));

  const estiloFundo = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, 1 - translateY.get() / alturaSheet)),
  }));

  const exerciciosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return EXERCICIOS_CATALOGO.filter((ex) => {
      const bateNome = ex.nome.toLowerCase().includes(termo);
      const bateCategoria = categoriaAtiva === 'Todos' || ex.grupo === categoriaAtiva;
      return bateNome && bateCategoria;
    });
  }, [busca, categoriaAtiva]);

  function adicionar(item: ExercicioCatalogo) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdicionar(item);
  }

  const total = idsSelecionados.length;
  const textoContador = total === 1 ? '1 adicionado' : `${total} adicionados`;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={aoMontarConteudo}
      onRequestClose={fechar}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }, estiloFundo]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={fechar}
          accessibilityLabel="Fechar seleção de exercícios"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' }}
        >
          <Animated.View style={[{ height: alturaSheet, maxHeight: '100%' }, estiloSheet]}>
            <View className="flex-1 overflow-hidden rounded-t-3xl bg-white dark:bg-[#11122B]">
              <GestureDetector gesture={arrastar}>
                <View className="px-5 pt-3 pb-2">
                  <View className="self-center w-10 h-1.5 rounded-full bg-slate-300 dark:bg-[#383D6E] mb-3" />
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                      Adicionar exercício
                    </Text>
                    <Text className="text-sm font-semibold text-[#5c7cfa]">{textoContador}</Text>
                  </View>
                </View>
              </GestureDetector>

              <View className="px-5 my-3">
                <View className="flex-row items-center bg-white dark:bg-[#1C1E3A] border border-slate-300 dark:border-[#282B54] rounded-2xl px-4 py-3">
                  <Feather name="search" size={20} color="#94a3b8" />
                  <TextInput
                    placeholder="Buscar exercício..."
                    placeholderTextColor="#94a3b8"
                    value={busca}
                    onChangeText={setBusca}
                    className="flex-1 ml-3 text-base text-slate-900 dark:text-white"
                    autoCapitalize="none"
                  />
                  {busca.length > 0 && (
                    <TouchableOpacity onPress={() => setBusca('')} hitSlop={8}>
                      <Feather name="x" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View className="py-2">
                <ChipsFiltro
                  opcoes={CATEGORIAS_EXERCICIOS}
                  valor={categoriaAtiva}
                  onChange={setCategoriaAtiva}
                  paddingHorizontal={20}
                />
              </View>

              <FlatList
                data={exerciciosFiltrados}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-slate-100 dark:bg-[#202242] my-1" />
                )}
                ListEmptyComponent={() => (
                  <View className="py-12 items-center">
                    <Feather name="info" size={32} color="#94a3b8" />
                    <Text className="text-slate-400 mt-2 text-base">Nenhum exercício encontrado</Text>
                  </View>
                )}
                renderItem={({ item }) => {
                  const adicionado = idsSelecionados.includes(item.id);
                  return (
                    <View className="flex-row items-center justify-between py-3">
                      <View className="flex-row items-center flex-1 pr-3">
                        <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-[#23264D] items-center justify-center mr-3.5">
                          <MaterialCommunityIcons name="dumbbell" size={20} color="#5c7cfa" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-medium text-slate-800 dark:text-white">
                            {item.nome}
                          </Text>
                          <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.grupo}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => adicionar(item)}
                        disabled={adicionado}
                        activeOpacity={0.7}
                        accessibilityLabel={
                          adicionado ? `${item.nome} já adicionado` : `Adicionar ${item.nome}`
                        }
                        className={`w-9 h-9 rounded-full items-center justify-center ${
                          adicionado ? 'bg-emerald-500' : 'bg-[#5c7cfa]'
                        }`}
                      >
                        <Feather name={adicionado ? 'check' : 'plus'} size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}