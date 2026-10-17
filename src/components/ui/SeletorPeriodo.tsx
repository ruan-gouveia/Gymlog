import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';

import type { PeriodoFiltro } from '@/database/estatisticasConsultas';

export function SeletorPeriodo({
  periodo,
  onMudar,
}: {
  periodo: PeriodoFiltro;
  onMudar: (p: PeriodoFiltro) => void;
}) {
  const tema = useThemeStore((s) => s.tema);
  const ehEscuro = tema === 'dark';

  const opcoes: { id: PeriodoFiltro; label: string }[] = [
    { id: 'dias', label: '7 Dias' },
    { id: 'semanas', label: '4 Semanas' },
    { id: 'meses', label: '6 Meses' },
  ];

  return (
    <View className="flex-row rounded-2xl bg-slate-100 dark:bg-[#14152D] p-1 border border-slate-200/50 dark:border-[#23264D]">
      {opcoes.map((op) => {
        const ativo = periodo === op.id;
        return (
          <Pressable
            key={op.id}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${op.label}`}
            onPress={() => onMudar(op.id)}
            className="flex-1 items-center justify-center py-1.5 rounded-xl"
            style={
              ativo
                ? {
                    backgroundColor: ehEscuro ? '#23264D' : '#ffffff',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: ehEscuro ? 0 : 0.08,
                    shadowRadius: 2,
                  }
                : { backgroundColor: 'transparent' }
            }
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: ativo ? '700' : '600',
                color: ativo ? (ehEscuro ? '#7C93FF' : '#4338ca') : (ehEscuro ? '#8E92B8' : '#64748b'),
              }}
            >
              {op.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
