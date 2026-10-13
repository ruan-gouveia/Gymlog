import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

const serieSchema = z.object({
  repeticoes: z
    .string()
    .trim()
    .min(1, 'Obrigatório.')
    .regex(/^\d+$/, 'Apenas inteiros.')
    .refine((val) => Number(val) > 0, { message: 'Maior que zero.' }),
  carga: z
    .string()
    .trim()
    .min(1, 'Obrigatório.')
    .regex(/^\d+(\.\d+)?$/, 'Carga inválida.')
    .refine((val) => Number(val) >= 0, { message: 'Mínimo 0 kg.' }),
});

const registroSchema = z.object({
  series: z.array(serieSchema).min(1, 'Adicione pelo menos 1 série.'),
  descanso: z
    .string()
    .trim()
    .regex(/^\d*$/, 'Apenas inteiros.')
    .optional(),
});

type RegistroFormData = z.infer<typeof registroSchema>;

export default function RegistrarExercicio() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; nome: string; grupo: string }>();
  const addExercise = useWorkoutStore((state) => state.addExercise);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistroFormData>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      series: [
        { repeticoes: '12', carga: '40' },
        { repeticoes: '12', carga: '40' },
        { repeticoes: '10', carga: '45' },
      ],
      descanso: '60',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'series',
  });

  function onSubmit(data: RegistroFormData) {
    
    addExercise({
      id: `${Date.now()}-${Math.random()}`,
      exercicioCatalogoId: params.id || '1',
      nome: params.nome || 'Exercício',
      grupo: params.grupo || 'Geral',
      series: data.series.map((s, index) => ({
        numero: index + 1,
        repeticoes: Number(s.repeticoes),
        carga: Number(s.carga),
      })),
      descanso: data.descanso ? Number(data.descanso) : undefined,
    });

    Alert.alert('Sucesso', 'Exercício adicionado ao treino!', [
      {
        text: 'OK',
        onPress: () => {
          router.navigate('/(tabs)/novo-treino');
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          <View className="pt-3 pb-2 flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-1 -ml-1 mr-2 flex-row items-center"
            >
              <Feather name="chevron-left" size={26} color="#1e293b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-800">Registrar exercício</Text>
          </View>

          <View className="flex-row items-center justify-between mt-3 mb-6">
            <Text className="text-2xl font-bold text-slate-900 flex-1 pr-3">
              {params.nome || 'Exercício'}
            </Text>
            <View className="bg-[#5c7cfa] px-3.5 py-1 rounded-full">
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                {params.grupo || 'Treino'}
              </Text>
            </View>
          </View>

          {fields.map((field, index) => (
            <View
              key={field.id}
              className="mb-4 p-4 rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-bold text-slate-800">
                  Série {index + 1}
                </Text>
                {fields.length > 1 && (
                  <TouchableOpacity
                    onPress={() => remove(index)}
                    className="p-1"
                  >
                    <Feather name="trash-2" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name={`series.${index}.repeticoes`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Repetições"
                        placeholder="Ex: 12"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        error={errors.series?.[index]?.repeticoes?.message}
                      />
                    )}
                  />
                </View>

                <View className="flex-1">
                  <Controller
                    control={control}
                    name={`series.${index}.carga`}
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Carga (kg)"
                        placeholder="Ex: 40"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={onChange}
                        error={errors.series?.[index]?.carga?.message}
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          ))}

          <View className="mt-2 mb-4">
            <Controller
              control={control}
              name="descanso"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Descanso (segundos)"
                  placeholder="Ex: 60"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={errors.descanso?.message}
                />
              )}
            />
          </View>

          <View className="mb-6">
            <Button
              title="+ Adicionar série"
              variant="dashed"
              onPress={() => append({ repeticoes: '10', carga: '0' })}
            />
          </View>

          <Button
            title="Salvar"
            onPress={handleSubmit(onSubmit)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}