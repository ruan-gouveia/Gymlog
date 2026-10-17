import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  EXERCICIOS_CATALOGO,
  CATEGORIAS_EXERCICIOS,
  CategoriaExercicio,
  ExercicioCatalogo,
} from '@/constants/exerciciosCatalogo';
import { useThemeStore } from '@/stores/useThemeStore';

export default function SelecionarExercicio() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaExercicio>('Todos');
  const tema = useThemeStore((state) => state.tema);
  const ehEscuro = tema === 'dark';

  const exerciciosFiltrados = useMemo(() => {
    return EXERCICIOS_CATALOGO.filter((ex) => {
      const bateNome = ex.nome.toLowerCase().includes(busca.trim().toLowerCase());
      const bateCategoria =
        categoriaAtiva === 'Todos' || ex.grupo === categoriaAtiva;
      return bateNome && bateCategoria;
    });
  }, [busca, categoriaAtiva]);

  function selecionar(item: ExercicioCatalogo) {
    router.push({
      pathname: '/exercicio/registrar',
      params: { id: item.id, nome: item.nome, grupo: item.grupo },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#11122B]">
      <View className="px-5 pt-4 pb-2 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-1 -ml-1 mr-3 flex-row items-center"
        >
          <Feather name="chevron-left" size={26} color={ehEscuro ? '#FFFFFF' : '#1e293b'} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">Selecionar exercício</Text>
      </View>

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
            <TouchableOpacity onPress={() => setBusca('')}>
              <Feather name="x" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="py-2">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIAS_EXERCICIOS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const ativa = categoriaAtiva === item;
            return (
              <TouchableOpacity
                onPress={() => setCategoriaAtiva(item)}
                className={`px-4 py-2 rounded-full border ${
                  ativa
                    ? 'bg-[#5c7cfa] border-[#5c7cfa]'
                    : 'bg-white dark:bg-[#1C1E3A] border-slate-300 dark:border-[#282B54]'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    ativa ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={exerciciosFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ItemSeparatorComponent={() => <View className="h-px bg-slate-100 dark:bg-[#202242] my-1" />}
        ListEmptyComponent={() => (
          <View className="py-12 items-center">
            <Feather name="info" size={32} color="#94a3b8" />
            <Text className="text-slate-400 mt-2 text-base">Nenhum exercício encontrado</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => selecionar(item)}
            className="flex-row items-center justify-between py-3.5"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-[#23264D] items-center justify-center mr-3.5">
                <MaterialCommunityIcons name="dumbbell" size={20} color="#5c7cfa" />
              </View>
              <Text className="text-base font-medium text-slate-800 dark:text-white flex-1">
                {item.nome}
              </Text>
            </View>
            <Text className="text-sm text-slate-400 dark:text-slate-500">{item.grupo}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}