import { Feather } from '@expo/vector-icons';
import { Link, useRouter, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Tela } from '@/components/ui/tela';

export type AtalhoNavegacao = {
  rotulo: string;
  href: Href;
};

type TelaPlaceholderProps = {
  titulo: string;
  descricao?: string;
  atalhos?: AtalhoNavegacao[];
  exibirVoltar?: boolean;
};

export function TelaPlaceholder({
  titulo,
  descricao,
  atalhos = [],
  exibirVoltar = false,
}: TelaPlaceholderProps) {
  const router = useRouter();

  return (
    <Tela>
      {exibirVoltar && router.canGoBack() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          className="flex-row items-center self-start mt-2 mb-2"
        >
          <Feather name="chevron-left" size={22} className="text-slate-900 dark:text-white" />
          <Text className="text-base text-slate-900 dark:text-white ml-1 font-medium">Voltar</Text>
        </Pressable>
      )}

      <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mt-4">{titulo}</Text>
      {descricao && (
        <Text className="text-sm font-medium text-slate-400 dark:text-[#8E92B8] mt-1">{descricao}</Text>
      )}

      <View className="mt-6 gap-3">
        {atalhos.map((atalho) => (
          <Link key={atalho.rotulo} href={atalho.href} asChild>
            <Pressable className="flex-row items-center justify-between rounded-2xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] px-4 py-3.5 active:opacity-70 shadow-sm shadow-slate-100 dark:shadow-none">
              <Text className="text-[15px] font-semibold text-slate-900 dark:text-white">{atalho.rotulo}</Text>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </Pressable>
          </Link>
        ))}
      </View>
    </Tela>
  );
}
