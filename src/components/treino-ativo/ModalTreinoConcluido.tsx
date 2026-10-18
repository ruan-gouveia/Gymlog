import { Feather } from '@expo/vector-icons';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { formatarVolume } from '@/utils/formatadoresTreino';

type ModalTreinoConcluidoProps = {
  visivel: boolean;
  volume: number;
  series: number;
  minutos: number;
  onVoltarInicio: () => void;
  onVerDetalhes: () => void;
};

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-slate-50 dark:bg-[#14152D] border border-slate-200/70 dark:border-[#23264D] py-3">
      <Text className="text-[16px] font-extrabold text-slate-900 dark:text-white">{valor}</Text>
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8E92B8] mt-0.5">
        {rotulo}
      </Text>
    </View>
  );
}

export function ModalTreinoConcluido({
  visivel,
  volume,
  series,
  minutos,
  onVoltarInicio,
  onVerDetalhes,
}: ModalTreinoConcluidoProps) {
  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onVoltarInicio}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View className="w-full rounded-[28px] bg-white dark:bg-[#1C1E3A] border border-slate-200 dark:border-[#23264D] p-6 items-center">
          <View
            className="w-20 h-20 rounded-full bg-[#4F67ED] items-center justify-center mb-4"
            style={{
              shadowColor: '#4F67ED',
              shadowOpacity: 0.6,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
              elevation: 14,
            }}
          >
            <Feather name="check" size={40} color="#FFFFFF" />
          </View>

          <Text className="text-[24px] font-extrabold text-slate-900 dark:text-white">
            Treino concluído!
          </Text>
          <Text className="text-[14px] text-slate-400 dark:text-[#8E92B8] text-center mt-1 mb-5">
            Mandou bem! Veja o resumo da sessão.
          </Text>

          <Text className="text-[32px] font-extrabold text-[#4F67ED] dark:text-[#7B91FF]">
            {formatarVolume(volume)}
          </Text>
          <Text className="text-[12px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#8E92B8] mb-4">
            Volume levantado
          </Text>

          <View className="flex-row gap-3 w-full mb-6">
            <Metrica rotulo="Séries" valor={String(series)} />
            <Metrica rotulo="Tempo" valor={`${minutos} min`} />
          </View>

          <View className="w-full gap-3">
            <Button title="Voltar ao início" onPress={onVoltarInicio} />
            <Button title="Ver detalhes" variant="outline" onPress={onVerDetalhes} />
          </View>
        </View>
      </View>
    </Modal>
  );
}