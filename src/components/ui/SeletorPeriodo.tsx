import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { PeriodoFiltro } from '@/database/estatisticasConsultas';

export function SeletorPeriodo({
  periodo,
  onMudar,
}: {
  periodo: PeriodoFiltro;
  onMudar: (p: PeriodoFiltro) => void;
}) {
  const opcoes: { id: PeriodoFiltro; label: string }[] = [
    { id: 'dias', label: '7 Dias' },
    { id: 'semanas', label: '4 Semanas' },
    { id: 'meses', label: '6 Meses' },
  ];

  return (
    <View className="flex-row rounded-2xl bg-slate-100 p-1">
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
                    backgroundColor: '#ffffff',
                    elevation: 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                  }
                : { backgroundColor: 'transparent' }
            }
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: ativo ? '700' : '600',
                color: ativo ? '#4338ca' : '#64748b',
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
