import { Text, TouchableOpacity, View } from 'react-native';

export type OpcaoSegmentada<T extends string> = { valor: T; rotulo: string };

type SeletorSegmentadoProps<T extends string> = {
  opcoes: readonly OpcaoSegmentada<T>[];
  valor: T;
  onChange: (valor: T) => void;
};

export function SeletorSegmentado<T extends string>({
  opcoes,
  valor,
  onChange,
}: SeletorSegmentadoProps<T>) {
  return (
    <View className="flex-row rounded-2xl bg-slate-100 dark:bg-[#14152D] p-1 border border-slate-200/50 dark:border-[#23264D]">
      {opcoes.map((opcao) => {
        const ativo = valor === opcao.valor;
        return (
          <TouchableOpacity
            key={opcao.valor}
            accessibilityRole="button"
            accessibilityLabel={opcao.rotulo}
            accessibilityState={{ selected: ativo }}
            activeOpacity={0.8}
            onPress={() => onChange(opcao.valor)}
            className={`flex-1 items-center justify-center py-2 rounded-xl ${
              ativo ? 'bg-white dark:bg-[#23264D]' : ''
            }`}
          >
            <Text
              className={`text-xs ${
                ativo
                  ? 'font-bold text-indigo-700 dark:text-[#7C93FF]'
                  : 'font-semibold text-slate-500 dark:text-[#8E92B8]'
              }`}
            >
              {opcao.rotulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}