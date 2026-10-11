import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inserirTreino } from '@/database/treinoRepository';

const treinoSchema = z.object({
  data: z.string().min(1, 'A data é obrigatória.'),
  duracao: z
    .string()
    .min(1, 'A duração é obrigatória.')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, { 
      message: 'Deve ser um número válido.' 
    }),
  nome: z
    .string()
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  grupo_muscular: z.string().min(1, 'O grupo muscular é obrigatório.'),
  observacoes: z.string().max(200, 'Máximo de 200 caracteres.').optional(),
});

type TreinoFormData = z.infer<typeof treinoSchema>;

export default function NovoTreino() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
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
      inserirTreino({
        nome: data.nome,
        data: data.data,
        duracao: Number(data.duracao),
        grupo_muscular: data.grupo_muscular,
        observacoes: data.observacoes,
      });

      Alert.alert('Sucesso', 'Treino criado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('[Novo Treino] Erro ao salvar:', error);
      Alert.alert('Erro', 'Erro ao salvar o treino. Tente novamente.');
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

        {/* Botão de Exercícios conforme o protótipo */}
        <View className="mt-4 mb-8">
          <Text className="text-slate-800 font-semibold mb-3">Exercícios</Text>
          <Button 
            title="+ Adicionar exercício" 
            variant="dashed"
            onPress={() => Alert.alert('Aviso', 'Funcionalidade da próxima Issue.')}
          />
        </View>

        {/* Botões Cancelar e Salvar */}
        <View className="flex-row gap-4 mt-auto">
          <View className="flex-1">
            <Button 
              title="Cancelar" 
              variant="outline" 
              onPress={() => router.back()} 
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