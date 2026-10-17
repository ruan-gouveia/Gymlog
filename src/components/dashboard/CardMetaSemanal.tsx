import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type CardMetaSemanalProps = {
  treinosConcluidos: number;
  metaSemanal: number;
  semanasSeguidas?: number;
};

export function CardMetaSemanal({
  treinosConcluidos,
  metaSemanal,
  semanasSeguidas = 2,
}: CardMetaSemanalProps) {
  const metaValida = Math.max(1, metaSemanal);
  const progresso = Math.min(1, Math.max(0, treinosConcluidos / metaValida));

  const tamanho = 74;
  const espessura = 7;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const offset = circunferencia - progresso * circunferencia;

  return (
    <View className="rounded-[24px] bg-[#4F67ED] dark:bg-[#3D52D5] p-5 flex-row items-center justify-between shadow-sm">
      <View className="flex-1 pr-3">
        <Text className="text-[13px] font-medium text-indigo-100">Meta da semana</Text>
        <Text className="text-[24px] font-extrabold text-white mt-0.5">
          {treinosConcluidos} de {metaValida} treinos
        </Text>
        <View className="flex-row items-center mt-2.5">
          <MaterialCommunityIcons name="fire" size={16} color="#FED7AA" />
          <Text className="ml-1 text-[12px] font-medium text-indigo-100">
            {semanasSeguidas} {semanasSeguidas === 1 ? 'semana seguida' : 'semanas seguidas'} na meta
          </Text>
        </View>
      </View>

      <View style={{ width: tamanho, height: tamanho }} className="items-center justify-center">
        <Svg width={tamanho} height={tamanho}>
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth={espessura}
            fill="none"
          />
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke="#FFFFFF"
            strokeWidth={espessura}
            strokeDasharray={`${circunferencia} ${circunferencia}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          />
        </Svg>
      </View>
    </View>
  );
}
