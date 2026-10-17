import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { BottomSheetSelecionarExercicio } from '@/components/exercicio/BottomSheetSelecionarExercicio';
import { Button } from '@/components/ui/button';
import { ChipsFiltro } from '@/components/ui/ChipsFiltro';
import { Input } from '@/components/ui/input';
import { SeletorSegmentado } from '@/components/ui/SeletorSegmentado';
import { CATEGORIAS_EXERCICIOS, type ExercicioCatalogo } from '@/constants/exerciciosCatalogo';
import {
  OCORRENCIAS_SEMANAIS,
  agendarTreino,
  agendarTreinoRecorrente,
  type ExercicioParaSalvar,
  type NovoTreino,
} from '@/database/treinoRepository';
import { showToast } from '@/stores/toastStore';
import { useAgendamentoStore } from '@/stores/useAgendamentoStore';
import { mascararData, mascararHorario } from '@/utils/mascaras';

const REGEX_DATA = /^\d{2}\/\d{2}\/\d{4}$/;
const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

const GRUPOS_MUSCULARES = CATEGORIAS_EXERCICIOS.filter((c) => c !== 'Todos');

const OPCOES_REPETICAO = [
  { valor: 'uma_vez', rotulo: 'Uma vez' },
  { valor: 'semanal', rotulo: `Toda semana (${OCORRENCIAS_SEMANAIS}x)` },
] as const;

function converterDataBr(valor: string): Date | null {
  const [dia, mes, ano] = valor.split('/').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? data : null;
}

const agendamentoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'O nome do treino é obrigatório.')
    .min(3, 'O nome deve ter no mínimo 3 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  data: z
    .string()
    .trim()
    .regex(REGEX_DATA, 'Use o formato DD/MM/AAAA.')
    .refine((v) => converterDataBr(v) !== null, { message: 'Data inexistente.' })
    .refine(
      (v) => {
        const dt = converterDataBr(v);
        if (!dt) return true;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return dt.getTime() >= hoje.getTime();
      },
      { message: 'Escolha hoje ou uma data futura.' }
    ),
  horario: z.string().trim().regex(REGEX_HORARIO, 'Use o formato HH:mm (00:00 a 23:59).'),
  repetir: z.enum(['uma_vez', 'semanal']),
  grupo_muscular: z.string().trim().min(1, 'Selecione o grupo muscular.'),
  observacoes: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

function valoresIniciais(): AgendamentoFormData {
  return {
    nome: '',
    data: new Date().toLocaleDateString('pt-BR'),
    horario: '18:00',
    repetir: 'uma_vez',
    grupo_muscular: '',
    observacoes: '',
  };
}

function RotuloCampo({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-600 dark:text-slate-300 text-sm mb-1.5 font-medium">{label}</Text>
      {children}
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
}

export default function AgendarTreino() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sheetAberto, setSheetAberto] = useState(false);
  const [semExercicios, setSemExercicios] = useState(false);

  const exercicios = useAgendamentoStore((state) => state.exercicios);
  const adicionarDoCatalogo = useAgendamentoStore((state) => state.adicionarDoCatalogo);
  const removerExercicio = useAgendamentoStore((state) => state.removerExercicio);
  const limpar = useAgendamentoStore((state) => state.limpar);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: valoresIniciais(),
  });

  function handleAdicionar(item: ExercicioCatalogo) {
    if (adicionarDoCatalogo(item)) setSemExercicios(false);
  }

  function handleCancelar() {
    limpar();
    reset(valoresIniciais());
    setSemExercicios(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  const onSubmit = (data: AgendamentoFormData) => {
    if (exercicios.length === 0) {
      setSemExercicios(true);
      return;
    }

    try {
      const exerciciosParaInserir: ExercicioParaSalvar[] = exercicios.flatMap((ex) =>
        ex.series.map((s) => ({
          nome: ex.nome,
          series: s.numero,
          repeticoes: s.repeticoes,
          carga: s.carga,
          descanso: ex.descanso,
        }))
      );

      const treino: NovoTreino = {
        nome: data.nome,
        data: data.data,
        duracao: 0, 
        grupo_muscular: data.grupo_muscular,
        observacoes: data.observacoes || undefined,
        horario: data.horario,
        repetir: data.repetir,
      };

      let mensagem: string;
      if (data.repetir === 'semanal') {
        const ids = agendarTreinoRecorrente(treino, exerciciosParaInserir);
        mensagem = `${ids.length} treinos agendados com sucesso!`;
      } else {
        agendarTreino(treino, exerciciosParaInserir);
        mensagem = 'Treino agendado com sucesso!';
      }

      reset(valoresIniciais());
      limpar();
      setSemExercicios(false);

      showToast(mensagem);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Agendar Treino] Erro ao agendar treino:', error);
      showToast('Erro ao agendar o treino. Tente novamente.', 'erro');
      Alert.alert('Erro', 'Não foi possível agendar o treino. Tente novamente.');
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="bg-[#FAFAFC] dark:bg-[#11122B] px-6 pb-4"
          style={{ paddingTop: insets.top + 16 }}
        >
          <Text className="text-3xl font-bold text-slate-900 dark:text-white">
            Agendar treino
          </Text>
        </View>

        <ScrollView
          className="flex-1 bg-[#FAFAFC] dark:bg-[#11122B]"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
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

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Controller
                control={control}
                name="data"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Data"
                    placeholder="DD/MM/AAAA"
                    keyboardType="numeric"
                    maxLength={10}
                    value={value}
                    onChangeText={(texto) => onChange(mascararData(texto))}
                    error={errors.data?.message}
                  />
                )}
              />
            </View>

            <View className="flex-1">
              <Controller
                control={control}
                name="horario"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Horário"
                    placeholder="18:00"
                    keyboardType="numeric"
                    maxLength={5}
                    value={value}
                    onChangeText={(texto) => onChange(mascararHorario(texto))}
                    error={errors.horario?.message}
                  />
                )}
              />
            </View>
          </View>

          <RotuloCampo label="Repetir">
            <Controller
              control={control}
              name="repetir"
              render={({ field: { onChange, value } }) => (
                <SeletorSegmentado opcoes={OPCOES_REPETICAO} valor={value} onChange={onChange} />
              )}
            />
          </RotuloCampo>

          <RotuloCampo label="Grupo muscular" error={errors.grupo_muscular?.message}>
            <Controller
              control={control}
              name="grupo_muscular"
              render={({ field: { onChange, value } }) => (
                <ChipsFiltro opcoes={GRUPOS_MUSCULARES} valor={value} onChange={onChange} />
              )}
            />
          </RotuloCampo>

          <View className="mt-2 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white font-bold text-lg">Exercícios</Text>
              <Text className="text-sm font-semibold text-[#5c7cfa]">
                {exercicios.length === 1 ? '1 adicionado' : `${exercicios.length} adicionados`}
              </Text>
            </View>

            {exercicios.length > 0 && (
              <View className="mb-4 gap-2.5">
                {exercicios.map((ex) => (
                  <View
                    key={ex.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-[#23264D] items-center justify-center mr-3">
                        <MaterialCommunityIcons name="dumbbell" size={20} color="#5c7cfa" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-800 dark:text-white">
                          {ex.nome}
                        </Text>
                        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {ex.series.length}×{ex.series[0]?.repeticoes} • {ex.grupo} • {ex.descanso}s
                          descanso
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removerExercicio(ex.id)}
                      className="p-2 -mr-1"
                      accessibilityLabel={`Remover ${ex.nome}`}
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
              onPress={() => setSheetAberto(true)}
            />
            {semExercicios && (
              <Text className="text-red-500 text-xs mt-2 ml-1">
                Adicione pelo menos 1 exercício.
              </Text>
            )}
          </View>

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

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <Button
                title="Cancelar"
                variant="outline"
                onPress={handleCancelar}
                disabled={isSubmitting}
              />
            </View>
            <View className="flex-1">
              <Button title="Agendar" onPress={handleSubmit(onSubmit)} isLoading={isSubmitting} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheetSelecionarExercicio
        visivel={sheetAberto}
        onFechar={() => setSheetAberto(false)}
        onAdicionar={handleAdicionar}
        idsSelecionados={exercicios.map((e) => e.exercicioCatalogoId)}
      />
    </>
  );
}