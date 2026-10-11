import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...rest }: InputProps) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 text-sm mb-1.5 font-medium">{label}</Text>
      <TextInput
        className={`bg-white text-slate-900 px-4 py-3 rounded-2xl border ${
          error ? 'border-red-500' : 'border-slate-300'
        } text-base`}
        placeholderTextColor="#94a3b8"
        {...rest}
      />
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}