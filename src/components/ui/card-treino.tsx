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
            className="rounded-2xl border border-indigo-100 bg-white px-4 py-3 active:bg-indigo-50">
            <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-base font-bold text-slate-900" numberOfLines={1}>
                    {treino.grupo_muscular}
                </Text>
                <Text className="text-base font-bold text-[#5c7cfa]">{formatarVolume(treino.volume)}</Text>
            </View>
            <Text className="mt-0.5 text-xs text-slate-500">{formatarData(treino.data)}</Text>
            <Text className="text-xs text-slate-500">
                {treino.total_exercicios} {rotuloExercicios} • {formatarDuracao(treino.duracao)}
            </Text>
        </Pressable>
    )
}