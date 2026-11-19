import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { processarFilaSincronizacao } from '@/services/sincronizacaoSupabase';
import { useSyncStore } from '@/stores/useSyncStore';

export function BannerSincronizacao() {
  const isOnline = useSyncStore((state) => state.isOnline);
  const isSincronizando = useSyncStore((state) => state.isSincronizando);
  const fila = useSyncStore((state) => state.fila);

  const totalFila = fila.length;
  const primeiroDaFila = fila[0];

  if (isOnline && !isSincronizando && totalFila === 0) {
    return null;
  }

  if (!isOnline) {
    return (
      <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
        <View className="flex-row items-center gap-3 flex-1 pr-2">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <Feather name="wifi-off" size={17} color="#D97706" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold text-amber-900 dark:text-amber-300">
              Sem conexão
            </Text>
            <Text className="text-[11px] font-medium text-amber-700 dark:text-amber-200/80 mt-0.5">
              {totalFila > 0
                ? `${totalFila} operação(ões) na fila local aguardando internet.`
                : 'Alterações são salvas localmente e entram na fila de envio.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-[#DCE4FF] dark:border-[#2A2F66] bg-[#EEF2FF] dark:bg-[#1E2248] px-4 py-3">
      <View className="flex-row items-center gap-3 flex-1 pr-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-[#272C5E]">
          {isSincronizando ? (
            <ActivityIndicator size="small" color="#5C7CFA" />
          ) : (
            <Feather name="upload-cloud" size={17} color="#5C7CFA" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-bold text-slate-900 dark:text-white">
            {isSincronizando
              ? `Sincronizando fila com a nuvem (${totalFila})...`
              : `${totalFila} alteração(ões) na fila de sincronização`}
          </Text>
          {primeiroDaFila && (
            <Text
              className="text-[11px] font-medium text-slate-500 dark:text-[#A3A6CC] mt-0.5"
              numberOfLines={1}
            >
              {primeiroDaFila.descricao}
            </Text>
          )}
        </View>
      </View>

      {!isSincronizando && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sincronizar fila agora"
          onPress={() => void processarFilaSincronizacao()}
          activeOpacity={0.75}
          className="rounded-xl bg-[#5C7CFA] px-3 py-1.5"
        >
          <Text className="text-xs font-bold text-white">Enviar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
