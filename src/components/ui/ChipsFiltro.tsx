import { ScrollView, Text, TouchableOpacity } from 'react-native';

type ChipsFiltroProps<T extends string> = {
  opcoes: readonly T[];
  valor: string;
  onChange: (valor: T) => void;
  paddingHorizontal?: number;
};

export function ChipsFiltro<T extends string>({
  opcoes,
  valor,
  onChange,
  paddingHorizontal = 0,
}: ChipsFiltroProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal, gap: 8 }}
    >
      {opcoes.map((opcao) => {
        const ativa = valor === opcao;
        return (
          <TouchableOpacity
            key={opcao}
            onPress={() => onChange(opcao)}
            activeOpacity={0.8}
            className={`px-4 py-2 rounded-full border ${
              ativa
                ? 'bg-[#5c7cfa] border-[#5c7cfa]'
                : 'bg-white dark:bg-[#1C1E3A] border-slate-300 dark:border-[#282B54]'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                ativa ? 'text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {opcao}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}