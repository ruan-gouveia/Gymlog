import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { salvarTreinoComExercicios } from '@/database/treinoRepository';
import { useWorkoutStore } from '@/stores/useWorkoutStore';

const treinoSchema = z.object({
  data: z.string().min(1, 'A data é obrigatória.'),
  duracao: z
    .string()
    .min(1, 'A duração é obrigatória.')
    .regex(/^\d+$/, 'Informe a duração em minutos (apenas números inteiros).')
    .refine((val) => Number(val) > 0, { message: 'A duração deve ser maior que zero.' }),
  nome: z
    .string()
    .trim()
    .min(1, 'O nome do treino é obrigatório.')
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  grupo_muscular: z.string().trim().min(1, 'O grupo muscular é obrigatório.'),
  observacoes: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
});

type TreinoFormData = z.infer<typeof treinoSchema>;

export default function NovoTreino() {
  const router = useRouter();
  const { draftExercises, removeExercise, clearWorkout } = useWorkoutStore();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TreinoFormData>({
    resolver: zodResolver(treinoSchema),
    defaultValues: {
      data: new Date().toLocaleDateString('pt-BR'),
      duracao: '',
      nome: '',
      grupo_muscular: '',
      observacoes: '',
    },
  });

  const onSubmit = (data: TreinoFormData) => {
    try {
      const exerciciosParaInserir = draftExercises.flatMap((ex) =>
        ex.series.map((s) => ({
          nome: ex.nome,
          series: s.numero,
          repeticoes: s.repeticoes,
          carga: s.carga,
          descanso: ex.descanso,
        }))
      );

      salvarTreinoComExercicios(
        {
          nome: data.nome,
          data: data.data,
          duracao: Number(data.duracao),
          grupo_muscular: data.grupo_muscular,
          observacoes: data.observacoes,
        },
        exerciciosParaInserir
      );

      reset({
        data: new Date().toLocaleDateString('pt-BR'),
        duracao: '',
        nome: '',
        grupo_muscular: '',
        observacoes: '',
      });
      clearWorkout();

      Alert.alert('Sucesso', 'Treino e exercícios gravados com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('[Novo Treino] Erro na transação SQLite:', error);
      Alert.alert('Erro', 'Erro ao salvar o treino completo. Tente novamente.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#ffffff' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        className="flex-1 bg-white" 
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-slate-900 mb-8 mt-4">Novo treino</Text>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller
              control={control}
              name="data"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Data"
                  placeholder="DD/MM/AAAA"
                  value={value}
                  onChangeText={onChange}
                  error={errors.data?.message}
                />
              )}
            />
          </View>

          <View className="flex-1">
            <Controller
              control={control}
              name="duracao"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Duração (min)"
                  placeholder="Ex: 60"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                  error={errors.duracao?.message}
                />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="nome"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Nome do treino"
              placeholder="Ex: Treino de Peito"
              value={value}
              onChangeText={onChange}
              error={errors.nome?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="grupo_muscular"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Grupo muscular ou objetivo"
              placeholder="Ex: Peito · Hipertrofia"
              value={value}
              onChangeText={onChange}
              error={errors.grupo_muscular?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="observacoes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Observações"
              placeholder="Foco na fase excêntrica..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={value}
              onChangeText={onChange}
              error={errors.observacoes?.message}
            />
          )}
        />

        <View className="mt-4 mb-8">
          <Text className="text-slate-900 font-bold text-lg mb-3">Exercícios</Text>

          {draftExercises.length > 0 && (
            <View className="mb-4 gap-2.5">
              {draftExercises.map((ex) => (
                <View
                  key={ex.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="dumbbell" size={20} color="#5c7cfa" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-800">{ex.nome}</Text>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {ex.series.length} série(s) • {ex.grupo}
                        {ex.descanso ? ` • ${ex.descanso}s descanso` : ''}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeExercise(ex.id)}
                    className="p-2 -mr-1"
                  >
                    <Feather name="trash-2" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Button 
            title="+ Adicionar exercício" 
            variant="dashed"
            onPress={() => router.push('/exercicio/selecionar')}
          />
        </View>

        <View className="flex-row gap-4 mt-auto">
          <View className="flex-1">
            <Button 
              title="Cancelar" 
              variant="outline" 
              onPress={() => {
                clearWorkout();
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }} 
              disabled={isSubmitting} 
            />
          </View>
          <View className="flex-1">
            <Button 
              title="Salvar" 
              onPress={handleSubmit(onSubmit)} 
              isLoading={isSubmitting} 
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}