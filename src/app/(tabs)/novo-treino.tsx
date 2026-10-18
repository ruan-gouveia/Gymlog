import { Feather } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { sincronizarNotificacoesAgendadas } from '@/services/notificacoesService';
import { showToast } from '@/stores/toastStore';
import { useAgendamentoStore } from '@/stores/useAgendamentoStore';

const REGEX_DATA = /^\d{2}\/\d{2}\/\d{4}$/;
const REGEX_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

const GRUPOS_MUSCULARES = CATEGORIAS_EXERCICIOS.filter((c) => c !== 'Todos');

const OPCOES_REPETICAO = [
  { valor: 'uma_vez', rotulo: 'Uma vez' },
  { valor: 'semanal', rotulo: `Toda semana (${OCORRENCIAS_SEMANAIS}x)` },
] as const;

function formatarHoraAtual(): string {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function converterDataBr(valor: string): Date | null {
  const [dia, mes, ano] = valor.split('/').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? data : null;
}

const agendamentoSchema = z
  .object({
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
        { message: 'Não é possível agendar treinos em datas passadas.' }
      ),
    horario: z.string().trim().regex(REGEX_HORARIO, 'Use o formato HH:mm (00:00 a 23:59).'),
    repetir: z.enum(['uma_vez', 'semanal']),
    grupo_muscular: z.string().trim().min(1, 'Selecione o grupo muscular.'),
    observacoes: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
  })
  .refine(
    (dados) => {
      const dt = converterDataBr(dados.data);
      if (!dt) return true;
      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
      const dataTreino = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);

      if (dataTreino.getTime() === hoje.getTime()) {
        const [horas, minutos] = dados.horario.split(':').map(Number);
        const dataHoraTreino = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          agora.getDate(),
          horas,
          minutos,
          0
        );
        return dataHoraTreino.getTime() >= agora.getTime();
      }
      return true;
    },
    {
      message: 'Não é possível agendar treinos em horários passados.',
      path: ['horario'],
    }
  );

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

function valoresIniciais(): AgendamentoFormData {
  return {
    nome: '',
    data: new Date().toLocaleDateString('pt-BR'),
    horario: formatarHoraAtual(),
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

  const [mostrarPickerIOS, setMostrarPickerIOS] = useState(false);
  const [modoPickerIOS, setModoPickerIOS] = useState<'date' | 'time'>('time');
  const [dataHoraIOS, setDataHoraIOS] = useState(new Date());
  const [callbackHorarioIOS, setCallbackHorarioIOS] = useState<((h: string) => void) | null>(null);
  const [callbackDataIOS, setCallbackDataIOS] = useState<((d: string) => void) | null>(null);

  const exercicios = useAgendamentoStore((state) => state.exercicios);
  const adicionarDoCatalogo = useAgendamentoStore((state) => state.adicionarDoCatalogo);
  const removerExercicio = useAgendamentoStore((state) => state.removerExercicio);
  const alterarSeries = useAgendamentoStore((state) => state.alterarSeries);
  const alterarRepeticoes = useAgendamentoStore((state) => state.alterarRepeticoes);
  const alterarCarga = useAgendamentoStore((state) => state.alterarCarga);
  const limpar = useAgendamentoStore((state) => state.limpar);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: valoresIniciais(),
  });

  function abrirSeletorData(dataAtual: string, onSelecionar: (d: string) => void) {
    const dataRef = converterDataBr(dataAtual) ?? new Date();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataRef.getTime() < hoje.getTime() ? hoje : dataRef,
        mode: 'date',
        minimumDate: hoje,
        onValueChange: (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
          const hojeVerificacao = new Date();
          hojeVerificacao.setHours(0, 0, 0, 0);
          if (selectedDate.getTime() < hojeVerificacao.getTime()) {
            Alert.alert('Data inválida', 'Escolha a data de hoje ou uma data futura.');
            return;
          }
          const dia = String(selectedDate.getDate()).padStart(2, '0');
          const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const ano = selectedDate.getFullYear();
          onSelecionar(`${dia}/${mes}/${ano}`);
        },
      });
    } else {
      setDataHoraIOS(dataRef.getTime() < hoje.getTime() ? hoje : dataRef);
      setModoPickerIOS('date');
      setCallbackDataIOS(() => onSelecionar);
      setMostrarPickerIOS(true);
    }
  }

  function abrirSeletorHorario(
    horarioAtual: string,
    dataAtualStr: string,
    onSelecionar: (h: string) => void
  ) {
    const [h, m] = (horarioAtual || formatarHoraAtual()).split(':').map(Number);
    const dataRef = new Date();
    dataRef.setHours(isNaN(h) ? 18 : h);
    dataRef.setMinutes(isNaN(m) ? 0 : m);
    dataRef.setSeconds(0);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataRef,
        mode: 'time',
        is24Hour: true,
        onValueChange: (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
          const dt = converterDataBr(dataAtualStr);
          const agora = new Date();
          if (dt) {
            const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
            const dataTreino = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);
            if (dataTreino.getTime() === hoje.getTime()) {
              const dataHoraEscolhida = new Date(
                agora.getFullYear(),
                agora.getMonth(),
                agora.getDate(),
                selectedDate.getHours(),
                selectedDate.getMinutes(),
                0
              );
              if (dataHoraEscolhida.getTime() < agora.getTime()) {
                Alert.alert(
                  'Horário inválido',
                  'Não é possível selecionar horários passados para o dia de hoje.'
                );
                return;
              }
            }
          }
          const horas = String(selectedDate.getHours()).padStart(2, '0');
          const minutos = String(selectedDate.getMinutes()).padStart(2, '0');
          onSelecionar(`${horas}:${minutos}`);
        },
      });
    } else {
      setDataHoraIOS(dataRef);
      setModoPickerIOS('time');
      setCallbackHorarioIOS(() => onSelecionar);
      setMostrarPickerIOS(true);
    }
  }

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

    const dt = converterDataBr(data.data);
    if (!dt) {
      Alert.alert('Data inválida', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
    const dataTreino = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0);

    if (dataTreino.getTime() < hoje.getTime()) {
      Alert.alert(
        'Data inválida',
        'Não é possível agendar treinos em datas passadas. Escolha a data de hoje ou uma data futura.'
      );
      return;
    }

    if (dataTreino.getTime() === hoje.getTime()) {
      const [horas, minutos] = data.horario.split(':').map(Number);
      const dataHoraTreino = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate(),
        horas,
        minutos,
        0
      );
      if (dataHoraTreino.getTime() < agora.getTime()) {
        Alert.alert(
          'Horário inválido',
          'Não é possível agendar treinos com horários passados para a data de hoje. Escolha um horário futuro.'
        );
        return;
      }
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

      void sincronizarNotificacoesAgendadas();

      reset(valoresIniciais());
      limpar();
      setSemExercicios(false);

      showToast(mensagem);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Agendar Treino] Erro ao agendar treino:', error);
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
          className="bg-[#FAFAFC] dark:bg-[#11122B] px-6 pb-2 flex-row items-center gap-3"
          style={{ paddingTop: insets.top + 12 }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={handleCancelar}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1C1E3A] border border-slate-200/80 dark:border-[#23264D] items-center justify-center shadow-sm"
          >
            <Feather name="chevron-left" size={22} color="#4F67ED" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
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
                placeholder="Ex.: Treino de Peito"
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
                render={({ field: { onChange, value } }) =>
                  Platform.OS === 'web' ? (
                    <Input
                      label="Data"
                      placeholder="DD/MM/AAAA"
                      value={value}
                      onChangeText={onChange}
                      error={errors.data?.message}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => abrirSeletorData(value, onChange)}
                    >
                      <View style={{ pointerEvents: 'none' }}>
                        <Input
                          label="Data"
                          placeholder="DD/MM/AAAA"
                          value={value}
                          editable={false}
                          error={errors.data?.message}
                        />
                      </View>
                    </TouchableOpacity>
                  )
                }
              />
            </View>

            <View className="flex-1">
              <Controller
                control={control}
                name="horario"
                render={({ field: { onChange, value } }) =>
                  Platform.OS === 'web' ? (
                    <Input
                      label="Horário"
                      placeholder={formatarHoraAtual()}
                      value={value}
                      onChangeText={onChange}
                      error={errors.horario?.message}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => abrirSeletorHorario(value, getValues('data'), onChange)}
                    >
                      <View style={{ pointerEvents: 'none' }}>
                        <Input
                          label="Horário"
                          placeholder={formatarHoraAtual()}
                          value={value}
                          editable={false}
                          error={errors.horario?.message}
                        />
                      </View>
                    </TouchableOpacity>
                  )
                }
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
                {exercicios.length === 1 ? '1 adicionado(s)' : `${exercicios.length} adicionado(s)`}
              </Text>
            </View>

            {exercicios.length > 0 && (
              <View className="mb-4">
                {exercicios.map((ex) => (
                  <View
                    key={ex.id}
                    className="p-4 rounded-[24px] border border-slate-200/80 dark:border-[#23264D] bg-white dark:bg-[#1C1E3A] mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <Text className="text-[16px] font-bold text-slate-900 dark:text-white">
                        {ex.nome}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removerExercicio(ex.id)}
                        hitSlop={8}
                        className="p-1"
                        accessibilityLabel={`Remover ${ex.nome}`}
                      >
                        <Feather name="x" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-2.5">
                      <View className="flex-1">
                        <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mb-1.5">
                          Séries
                        </Text>
                        <View className="flex-row items-center justify-between bg-[#F4F6FB] dark:bg-[#12132A] rounded-xl border border-slate-200/80 dark:border-[#282B54] h-10 px-1">
                          <TouchableOpacity
                            onPress={() => alterarSeries(ex.id, -1)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Diminuir séries"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">-</Text>
                          </TouchableOpacity>
                          <Text className="text-[14px] font-bold text-slate-900 dark:text-white text-center flex-1">
                            {ex.series.length}
                          </Text>
                          <TouchableOpacity
                            onPress={() => alterarSeries(ex.id, 1)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Aumentar séries"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-1">
                        <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mb-1.5">
                          Reps
                        </Text>
                        <View className="flex-row items-center justify-between bg-[#F4F6FB] dark:bg-[#12132A] rounded-xl border border-slate-200/80 dark:border-[#282B54] h-10 px-1">
                          <TouchableOpacity
                            onPress={() => alterarRepeticoes(ex.id, -1)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Diminuir repetições"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">-</Text>
                          </TouchableOpacity>
                          <Text className="text-[14px] font-bold text-slate-900 dark:text-white text-center flex-1">
                            {ex.series[0]?.repeticoes ?? 12}
                          </Text>
                          <TouchableOpacity
                            onPress={() => alterarRepeticoes(ex.id, 1)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Aumentar repetições"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-1">
                        <Text className="text-[12px] font-medium text-slate-400 dark:text-[#8E92B8] mb-1.5">
                          Kg
                        </Text>
                        <View className="flex-row items-center justify-between bg-[#F4F6FB] dark:bg-[#12132A] rounded-xl border border-slate-200/80 dark:border-[#282B54] h-10 px-1">
                          <TouchableOpacity
                            onPress={() => alterarCarga(ex.id, -2)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Diminuir carga"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">-</Text>
                          </TouchableOpacity>
                          <Text className="text-[14px] font-bold text-slate-900 dark:text-white text-center flex-1">
                            {ex.series[0]?.carga ?? 20}
                          </Text>
                          <TouchableOpacity
                            onPress={() => alterarCarga(ex.id, 2)}
                            activeOpacity={0.6}
                            className="w-7 h-8 items-center justify-center rounded-lg"
                            accessibilityLabel="Aumentar carga"
                          >
                            <Text className="text-[16px] font-bold text-slate-700 dark:text-slate-300">+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
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
                placeholder="Algo importante sobre o treino"
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
                    if (modoPickerIOS === 'time' && callbackHorarioIOS) {
                      const horas = String(dataHoraIOS.getHours()).padStart(2, '0');
                      const minutos = String(dataHoraIOS.getMinutes()).padStart(2, '0');
                      callbackHorarioIOS(`${horas}:${minutos}`);
                    } else if (modoPickerIOS === 'date' && callbackDataIOS) {
                      const dia = String(dataHoraIOS.getDate()).padStart(2, '0');
                      const mes = String(dataHoraIOS.getMonth() + 1).padStart(2, '0');
                      const ano = dataHoraIOS.getFullYear();
                      callbackDataIOS(`${dia}/${mes}/${ano}`);
                    }
                    setMostrarPickerIOS(false);
                  }}
                >
                  <Text className="text-[#4F67ED] font-bold">Definir</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dataHoraIOS}
                mode={modoPickerIOS}
                is24Hour
                minimumDate={new Date()}
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