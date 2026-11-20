import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import type { ComponentProps } from 'react';
import React, { useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
  type Path,
} from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TreinoDetalhe } from '@/database/treinoConsultas';
import type { ExercicioParaSalvar, NovoTreino } from '@/database/treinoRepository';

const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

const serieSchema = z.object({
  repeticoes: z
    .string()
    .trim()
    .min(1, 'Obrigatório.')
    .regex(/^\d+$/, 'Apenas inteiros.')
    .refine((v) => Number(v) > 0, { message: 'Maior que zero.' }),
  carga: z
    .string()
    .trim()
    .min(1, 'Obrigatório.')
    .regex(/^\d+(\.\d+)?$/, 'Carga inválida.'),
});

const exercicioSchema = z.object({
  nome: z.string().trim().min(1, 'Obrigatório.'),
  descanso: z.string().trim().regex(/^\d*$/, 'Apenas inteiros.'),
  series: z.array(serieSchema).min(1, 'Adicione pelo menos 1 série.'),
});

const treinoSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do treino.'),
  data: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use o formato DD/MM/AAAA.')
    .refine(
      (v) => {
        const [d, m, a] = v.split('/').map(Number);
        const dt = new Date(a, m - 1, d);
        return dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === d;
      },
      { message: 'Data inexistente.' }
    ),
  horario: z
    .string()
    .trim()
    .regex(REGEX_HORARIO, 'Use o formato HH:mm (00:00 a 23:59).')
    .or(z.literal(''))
    .optional(),
  duracao: z
    .string()
    .trim()
    .min(1, 'Obrigatório.')
    .regex(/^\d+$/, 'Apenas inteiros.')
    .refine((v) => Number(v) > 0, { message: 'Maior que zero.' }),
  grupo_muscular: z.string().trim().min(1, 'Informe o grupo muscular.'),
  observacoes: z.string().optional(),
  exercicios: z.array(exercicioSchema).min(1, 'Adicione pelo menos 1 exercício.'),
});

export type TreinoEdicaoValues = z.infer<typeof treinoSchema>;

export function detalheParaFormulario(t: TreinoDetalhe): TreinoEdicaoValues {
  return {
    nome: t.nome,
    data: t.data,
    horario: t.horario ?? '',
    duracao: String(t.duracao),
    grupo_muscular: t.grupo_muscular,
    observacoes: t.observacoes ?? '',
    exercicios: t.exercicios.map((ex) => ({
      nome: ex.nome,
      descanso: ex.series[0]?.descanso != null ? String(ex.series[0].descanso) : '',
      series: ex.series.map((s) => ({
        repeticoes: String(s.repeticoes),
        carga: String(s.carga),
      })),
    })),
  };
}

export function formularioParaPayload(v: TreinoEdicaoValues): {
  treino: NovoTreino;
  exercicios: ExercicioParaSalvar[];
} {
  return {
    treino: {
      nome: v.nome.trim(),
      data: v.data.trim(),
      horario: v.horario?.trim() || null,
      duracao: Number(v.duracao),
      grupo_muscular: v.grupo_muscular.trim(),
      observacoes: v.observacoes?.trim() || undefined,
    },
    exercicios: v.exercicios.flatMap((ex) =>
      ex.series.map((s, i) => ({
        nome: ex.nome.trim(),
        series: i + 1,
        repeticoes: Number(s.repeticoes),
        carga: Number(s.carga),
        descanso: ex.descanso ? Number(ex.descanso) : undefined,
      }))
    ),
  };
}

type CampoProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChangeText' | 'error'> & {
  control: Control<TreinoEdicaoValues>;
  name: Path<TreinoEdicaoValues>;
};

function Campo({ control, name, ...props }: CampoProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <Input
          {...props}
          value={(value as string | undefined) ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
        />
      )}
    />
  );
}

function SeriesDoExercicio({
  control,
  exercicioIndex,
}: {
  control: Control<TreinoEdicaoValues>;
  exercicioIndex: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercicios.${exercicioIndex}.series`,
  });

  return (
    <View>
      {fields.map((campo, i) => (
        <View key={campo.id} className="mb-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-slate-800 dark:text-white">Série {i + 1}</Text>
            {fields.length > 1 && (
              <TouchableOpacity onPress={() => remove(i)} hitSlop={8}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Campo
                control={control}
                name={`exercicios.${exercicioIndex}.series.${i}.repeticoes`}
                label="Repetições"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Campo
                control={control}
                name={`exercicios.${exercicioIndex}.series.${i}.carga`}
                label="Carga (kg)"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      ))}
      <Button
        title="+ Adicionar série"
        variant="dashed"
        onPress={() => append({ repeticoes: '10', carga: '0' })}
      />
    </View>
  );
}

type Props = {
  defaultValues: TreinoEdicaoValues;
  onSubmit: (valores: TreinoEdicaoValues) => void | Promise<void>;
  rotuloSubmit?: string;
};

export function TreinoEdicaoForm({
  defaultValues,
  onSubmit,
  rotuloSubmit = 'Salvar alterações',
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<TreinoEdicaoValues>({
    resolver: zodResolver(treinoSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'exercicios' });

  const [mostrarPickerIOS, setMostrarPickerIOS] = useState(false);
  const [dataHoraIOS, setDataHoraIOS] = useState(new Date());
  const [callbackHorarioIOS, setCallbackHorarioIOS] = useState<((h: string) => void) | null>(null);

  function abrirSeletorHorario(horarioAtual: string, onSelecionar: (h: string) => void) {
    const [h, m] = (horarioAtual || '18:00').split(':').map(Number);
    const dataRef = new Date();
    dataRef.setHours(isNaN(h) ? 18 : h);
    dataRef.setMinutes(isNaN(m) ? 0 : m);
    dataRef.setSeconds(0);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataRef,
        mode: 'time',
        is24Hour: true,
        onValueChange: (_event: DateTimePickerChangeEvent, selectedDate?: Date) => {
          if (!selectedDate) return;
          const horas = String(selectedDate.getHours()).padStart(2, '0');
          const minutos = String(selectedDate.getMinutes()).padStart(2, '0');
          onSelecionar(`${horas}:${minutos}`);
        },
      });
    } else if (Platform.OS === 'ios') {
      setDataHoraIOS(dataRef);
      setCallbackHorarioIOS(() => onSelecionar);
      setMostrarPickerIOS(true);
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Campo
            control={control}
            name="nome"
            label="Nome do treino"
            placeholder="Ex: Treino de Peito"
          />

          {/* Data e Horário lado a lado */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Campo control={control} name="data" label="Data" placeholder="DD/MM/AAAA" />
            </View>

            <View className="flex-1">
              <Controller
                control={control}
                name="horario"
                render={({ field: { onChange, value }, fieldState: { error } }) =>
                  Platform.OS === 'web' ? (
                    <Input
                      label="Horário"
                      placeholder="18:00"
                      value={value ?? ''}
                      onChangeText={onChange}
                      error={error?.message}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => abrirSeletorHorario(value ?? '', onChange)}
                    >
                      <View style={{ pointerEvents: 'none' }}>
                        <Input
                          label="Horário"
                          placeholder="18:00"
                          value={value ?? ''}
                          editable={false}
                          error={error?.message}
                        />
                      </View>
                    </TouchableOpacity>
                  )
                }
              />
            </View>
          </View>

          {/* Duração e Grupo Muscular lado a lado */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Campo
                control={control}
                name="duracao"
                label="Duração (min)"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Campo
                control={control}
                name="grupo_muscular"
                label="Grupo muscular"
                placeholder="Ex: Peito"
              />
            </View>
          </View>

          <Campo control={control} name="observacoes" label="Observações" multiline />

          <Text className="mb-3 mt-2 text-lg font-bold text-slate-900 dark:text-white">
            Exercícios
          </Text>

          {fields.map((campo, i) => (
            <View
              key={campo.id}
              className="mb-4 rounded-2xl border border-indigo-100 dark:border-[#282B54] bg-white dark:bg-[#1C1E3A] p-4"
            >
              <View className="flex-row items-start gap-3">
                <View className="flex-1">
                  <Campo control={control} name={`exercicios.${i}.nome`} label="Exercício" />
                </View>
                {fields.length > 1 && (
                  <TouchableOpacity onPress={() => remove(i)} hitSlop={8} className="mt-8">
                    <Feather name="trash-2" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <Campo
                control={control}
                name={`exercicios.${i}.descanso`}
                label="Descanso (segundos)"
                keyboardType="numeric"
              />

              <SeriesDoExercicio control={control} exercicioIndex={i} />
            </View>
          ))}

          <View className="mb-6">
            <Button
              title="+ Adicionar exercício"
              variant="dashed"
              onPress={() =>
                append({ nome: '', descanso: '60', series: [{ repeticoes: '10', carga: '0' }] })
              }
            />
          </View>

          <Button title={rotuloSubmit} isLoading={isSubmitting} onPress={handleSubmit(onSubmit)} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para iOS */}
      {mostrarPickerIOS && (
        <Modal transparent animationType="fade" visible={mostrarPickerIOS}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white dark:bg-[#1C1E3A] p-4 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-3">
                <TouchableOpacity onPress={() => setMostrarPickerIOS(false)}>
                  <Text className="text-slate-500 font-bold">Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (callbackHorarioIOS) {
                      const horas = String(dataHoraIOS.getHours()).padStart(2, '0');
                      const minutos = String(dataHoraIOS.getMinutes()).padStart(2, '0');
                      callbackHorarioIOS(`${horas}:${minutos}`);
                    }
                    setMostrarPickerIOS(false);
                  }}
                >
                  <Text className="text-[#4F67ED] font-bold">Definir</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dataHoraIOS}
                mode="time"
                is24Hour
                display="spinner"
                onValueChange={(_, d) => {
                  if (d) setDataHoraIOS(d);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}