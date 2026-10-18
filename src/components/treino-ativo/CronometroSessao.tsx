import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatarCronometro } from '@/utils/formatadoresTreino';
import { useAgora } from '@/utils/useAgora';

export function CronometroSessao({ tempoInicio }: { tempoInicio: number | null }) {
  const agora = useAgora(500, tempoInicio !== null);
  const segundos = tempoInicio !== null ? Math.floor((agora - tempoInicio) / 1000) : 0;

  return (
    <View className="flex-row items-center mt-0.5">
      <Feather name="clock" size={12} color="#8E92B8" />
      <Text
        className="ml-1 text-[13px] font-semibold text-slate-500 dark:text-[#8E92B8]"
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatarCronometro(segundos)}
      </Text>
    </View>
  );
}