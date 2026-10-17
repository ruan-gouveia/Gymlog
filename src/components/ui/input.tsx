

import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...rest }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 dark:text-slate-300 text-sm mb-1.5 font-medium">{label}</Text>
      <TextInput
        className={`bg-white dark:bg-[#1C1E3A] text-slate-900 dark:text-white px-4 py-3 rounded-2xl border ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-[#282B54]'
        } text-base`}
        placeholderTextColor="#94a3b8"
        {...rest}
      />
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}