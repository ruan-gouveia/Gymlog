import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TreinoAtivoPlaceholder() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B] px-5">
      <View className="flex-row items-center pt-3 pb-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          className="mr-3"
        >
          <Feather name="chevron-left" size={26} color="#4F67ED" />
        </Pressable>
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Treino em Andamento</Text>
      </View>

      <View className="flex-1 items-center justify-center px-4">
        <View className="w-16 h-16 rounded-full bg-[#EEF2FF] dark:bg-[#23264D] items-center justify-center mb-4">
          <Feather name="play" size={28} color="#4F67ED" />
        </View>
        <Text className="text-xl font-extrabold text-slate-900 dark:text-white text-center">
          Treino #{id}
        </Text>
        <Text className="text-sm text-slate-400 dark:text-[#8E92B8] text-center mt-2">
          O motor de execução ativa com cronômetro e descanso será iniciado em breve.
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao início"
          onPress={() => router.replace('/(tabs)')}
          className="mt-6 bg-[#4F67ED] rounded-2xl px-6 py-3.5"
        >
          <Text className="text-white font-bold text-sm">Voltar ao Início</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
