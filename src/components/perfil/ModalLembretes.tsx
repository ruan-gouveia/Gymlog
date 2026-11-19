import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useAnimatedValue,
  View,
} from 'react-native';

import { formatarHorarioDisparo } from '@/services/notificacoesService';

function SwitchLembretes({
  ativo,
  onAlternar,
  ehEscuro,
  accessibilityLabel,
}: {
  ativo: boolean;
  onAlternar: (novoValor: boolean) => void;
  ehEscuro: boolean;
  accessibilityLabel: string;
}) {
  const progresso = useAnimatedValue(ativo ? 1 : 0);

  useEffect(() => {
    Animated.spring(progresso, {
      toValue: ativo ? 1 : 0,
      damping: 18,
      stiffness: 240,
      mass: 0.7,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [ativo, progresso]);

  const handlePress = () => {
    const proximo = !ativo;
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    onAlternar(proximo);
  };

  const translateX = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 22],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: ativo }}
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      hitSlop={8}
      style={{
        width: 52,
        height: 30,
        borderRadius: 999,
        padding: 3,
        backgroundColor: ativo ? '#5C7CFA' : ehEscuro ? '#2E325A' : '#E2E8F0',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}

type ModalLembretesProps = {
  visivel: boolean;
  ativoInicial: boolean;
  antecedenciaInicial: number;
  ehEscuro: boolean;
  proximoTreinoInfo?: {
    nome: string;
    grupoMuscular: string;
    horario: string;
    data: string;
  } | null;
  onFechar: () => void;
  onSalvar: (ativo: boolean, antecedenciaMinutos: number) => Promise<void> | void;
};

const MIN_ANTECEDENCIA = 5;
const MAX_ANTECEDENCIA = 60;
const OPCOES_RAPIDAS = [15, 30, 45, 60];

export function ModalLembretes({
  visivel,
  ativoInicial,
  antecedenciaInicial,
  ehEscuro,
  proximoTreinoInfo,
  onFechar,
  onSalvar,
}: ModalLembretesProps) {
  const valorInicialSeguro = Math.max(
    MIN_ANTECEDENCIA,
    Math.min(MAX_ANTECEDENCIA, antecedenciaInicial || 30)
  );
  const [ativo, setAtivo] = useState<boolean>(ativoInicial);
  const [antecedencia, setAntecedencia] = useState<number>(valorInicialSeguro);
  const [textoInput, setTextoInput] = useState<string>(String(valorInicialSeguro));
  const [larguraBarra, setLarguraBarra] = useState<number>(0);
  const [salvando, setSalvando] = useState<boolean>(false);

  const sincronizarEstadoInicial = () => {
    setAtivo(ativoInicial);
    const valorSeguro = Math.max(
      MIN_ANTECEDENCIA,
      Math.min(MAX_ANTECEDENCIA, antecedenciaInicial || 30)
    );
    setAntecedencia(valorSeguro);
    setTextoInput(String(valorSeguro));
  };

  const atualizarValor = (novoValor: number) => {
    const limitado = Math.max(MIN_ANTECEDENCIA, Math.min(MAX_ANTECEDENCIA, Math.round(novoValor)));
    setAntecedencia(limitado);
    setTextoInput(String(limitado));
  };

  const handleToqueSlider = (evento: GestureResponderEvent) => {
    if (!ativo || larguraBarra <= 0) return;
    const x = Math.max(0, Math.min(larguraBarra, evento.nativeEvent.locationX));
    const proporcao = x / larguraBarra;
    const bruto = MIN_ANTECEDENCIA + proporcao * (MAX_ANTECEDENCIA - MIN_ANTECEDENCIA);
    const arredondadoCinco = Math.round(bruto / 5) * 5;
    atualizarValor(arredondadoCinco);
  };

  const handleLayoutSlider = (evento: LayoutChangeEvent) => {
    setLarguraBarra(evento.nativeEvent.layout.width);
  };

  const handleMudarTexto = (txt: string) => {
    const limpo = txt.replace(/[^0-9]/g, '');
    setTextoInput(limpo);
    if (limpo.length > 0) {
      const num = parseInt(limpo, 10);
      if (!Number.isNaN(num)) {
        setAntecedencia(Math.max(MIN_ANTECEDENCIA, Math.min(MAX_ANTECEDENCIA, num)));
      }
    }
  };

  const handleFimEdicaoTexto = () => {
    const num = parseInt(textoInput, 10);
    if (Number.isNaN(num)) {
      atualizarValor(30);
    } else {
      atualizarValor(num);
    }
  };

  const handleConfirmar = async () => {
    setSalvando(true);
    try {
      await onSalvar(ativo, antecedencia);
      onFechar();
    } finally {
      setSalvando(false);
    }
  };

  const porcentagemSlider =
    ((antecedencia - MIN_ANTECEDENCIA) / (MAX_ANTECEDENCIA - MIN_ANTECEDENCIA)) * 100;

  const horarioExemplo = proximoTreinoInfo?.horario ?? '18:00';
  const grupoExemplo = proximoTreinoInfo?.grupoMuscular ?? 'Peito';
  const horarioNotificacao = formatarHorarioDisparo(horarioExemplo, antecedencia);

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      onShow={sincronizarEstadoInicial}
      onRequestClose={onFechar}
    >
      <Pressable
        onPress={onFechar}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(10, 12, 28, 0.65)' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full rounded-[28px] bg-white dark:bg-[#1C1E3A] border border-[#EAEFF5] dark:border-[#23264D] p-6 shadow-xl"
        >
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] dark:bg-[#252854]">
                <Feather name="bell" size={20} color={ehEscuro ? '#7C93FF' : '#5C7CFA'} />
              </View>
              <View>
                <Text className="text-[18px] font-extrabold text-slate-900 dark:text-white">
                  Lembretes de Treino
                </Text>
                <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8]">
                  Notificações locais inteligentes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar modal de lembretes"
              onPress={onFechar}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-[#252854]"
            >
              <Feather name="x" size={18} color={ehEscuro ? '#8E92B8' : '#64748B'} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between rounded-2xl bg-[#F8FAFC] dark:bg-[#14152D] border border-slate-200/80 dark:border-[#252852] px-4 py-3.5 mb-5">
            <View className="flex-1 pr-3">
              <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                Ativar lembretes gerais
              </Text>
              <Text className="text-[12px] text-slate-400 dark:text-[#8E92B8] mt-0.5">
                Receba alertas antes dos treinos agendados
              </Text>
            </View>
            <SwitchLembretes
              ativo={ativo}
              onAlternar={setAtivo}
              ehEscuro={ehEscuro}
              accessibilityLabel="Ativar lembretes gerais"
            />
          </View>

          <View style={{ opacity: ativo ? 1 : 0.45, pointerEvents: ativo ? 'auto' : 'none' }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[14px] font-bold text-slate-800 dark:text-white">
                Antecedência da Notificação
              </Text>
              <View className="flex-row items-center rounded-xl bg-[#EEF2FF] dark:bg-[#252854] px-2.5 py-1">
                <TextInput
                  value={textoInput}
                  onChangeText={handleMudarTexto}
                  onBlur={handleFimEdicaoTexto}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={ativo}
                  selectTextOnFocus
                  className="text-[14px] font-extrabold text-[#4F67ED] dark:text-[#7C93FF] min-w-[24px] text-center p-0"
                />
                <Text className="text-[12px] font-bold text-[#4F67ED] dark:text-[#7C93FF] ml-1">
                  min
                </Text>
              </View>
            </View>

            <View className="my-2">
              <View
                onLayout={handleLayoutSlider}
                onStartShouldSetResponder={() => ativo}
                onMoveShouldSetResponder={() => ativo}
                onResponderGrant={handleToqueSlider}
                onResponderMove={handleToqueSlider}
                className="h-9 justify-center"
              >
                <View className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-[#252854] overflow-hidden">
                  <View
                    className="h-full rounded-full bg-[#5C7CFA]"
                    style={{ width: `${Math.max(0, Math.min(100, porcentagemSlider))}%` }}
                  />
                </View>
                <View
                  style={{
                    left: `${Math.max(0, Math.min(100, porcentagemSlider))}%`,
                    marginLeft: -11,
                    pointerEvents: 'none',
                  }}
                  className="absolute h-5 w-5 rounded-full bg-white border-[3px] border-[#5C7CFA] shadow"
                />
              </View>

              <View className="flex-row justify-between px-0.5 mt-0.5">
                <Text className="text-[11px] font-medium text-slate-400 dark:text-[#8E92B8]">
                  5 min
                </Text>
                <Text className="text-[11px] font-medium text-slate-400 dark:text-[#8E92B8]">
                  30 min
                </Text>
                <Text className="text-[11px] font-medium text-slate-400 dark:text-[#8E92B8]">
                  60 min
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 mt-2 mb-4">
              {OPCOES_RAPIDAS.map((opcao) => {
                const selecionada = antecedencia === opcao;
                return (
                  <TouchableOpacity
                    key={opcao}
                    accessibilityRole="button"
                    accessibilityLabel={`Antecedência de ${opcao} minutos`}
                    onPress={() => atualizarValor(opcao)}
                    activeOpacity={0.75}
                    className={`flex-1 items-center justify-center py-2.5 rounded-xl border ${
                      selecionada
                        ? 'bg-[#5C7CFA] border-[#5C7CFA]'
                        : 'bg-[#F8FAFC] dark:bg-[#14152D] border-slate-200 dark:border-[#252852]'
                    }`}
                  >
                    <Text
                      className={`text-[13px] font-bold ${
                        selecionada ? 'text-white' : 'text-slate-700 dark:text-[#8E92B8]'
                      }`}
                    >
                      {opcao} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="rounded-2xl bg-[#EEF2FF]/80 dark:bg-[#14152D] border border-[#DDE4FF] dark:border-[#252854] p-3.5 mb-5">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center gap-1.5">
                  <Feather name="clock" size={13} color={ehEscuro ? '#7C93FF' : '#4F67ED'} />
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-[#4F67ED] dark:text-[#7C93FF]">
                    Prévia do agendamento ({horarioNotificacao})
                  </Text>
                </View>
                <Text className="text-[11px] font-semibold text-slate-400 dark:text-[#8E92B8]">
                  Treino às {horarioExemplo}
                </Text>
              </View>
              <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                &ldquo;Gymlog: Você tem um treino de {grupoExemplo} em {antecedencia} minutos!&rdquo;
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
              onPress={onFechar}
              activeOpacity={0.75}
              className="flex-1 items-center justify-center rounded-2xl border border-slate-200 dark:border-[#252854] py-3.5 bg-slate-50 dark:bg-[#14152D]"
            >
              <Text className="text-[14px] font-bold text-slate-600 dark:text-[#8E92B8]">
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Salvar lembretes"
              onPress={handleConfirmar}
              disabled={salvando}
              activeOpacity={0.8}
              className="flex-1 items-center justify-center rounded-2xl py-3.5 bg-[#5C7CFA]"
            >
              <Text className="text-[14px] font-bold text-white">
                {salvando ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
