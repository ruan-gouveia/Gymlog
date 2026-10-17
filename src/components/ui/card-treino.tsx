import { Pressable, Text, View } from 'react-native';

import type { TreinoResumo } from '@/database/treinoConsultas';
import { formatarData, formatarDuracao, formatarVolume } from '@/utils/formatacao';


type CardTreinoProps = {
    treino: TreinoResumo;
    onPress: () => void;
}

export function CardTreino({treino, onPress}: CardTreinoProps) {
    const rotuloExercicios = treino.total_exercicios === 1 ? 'exercício' : 'exercícios';

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir detalhes do treino ${treino.nome}`}
            onPress={onPress}
            className="rounded-2xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-4 py-3 active:opacity-75 shadow-sm shadow-slate-100 dark:shadow-none">
            <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {treino.grupo_muscular}
                </Text>
                <Text className="text-base font-bold text-[#5c7cfa]">{formatarVolume(treino.volume)}</Text>
            </View>
            <Text className="mt-0.5 text-xs text-slate-400 dark:text-[#8E92B8]">{formatarData(treino.data)}</Text>
            <Text className="text-xs text-slate-400 dark:text-[#8E92B8]">
                {treino.total_exercicios} {rotuloExercicios} • {formatarDuracao(treino.duracao)}
            </Text>
        </Pressable>
    )
}