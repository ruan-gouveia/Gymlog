import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { atualizarConfiguracoesUsuario } from '@/database';
import {
  configurarLembrarDeMim,
  isSupabaseConfigurado,
  supabase,
} from '@/services/supabase';
import { showToast } from '@/stores/toastStore';
import { mostrarAlerta } from '@/stores/useAlertStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { dataBrParaDate, dateParaDataBr } from '@/utils/datas';
import { mascararData } from '@/utils/mascaras';

const IDADE_MINIMA = 12;
const ANO_MINIMO = 1920;

function obterDataMaximaNascimento(): Date {
  const hoje = new Date();
  return new Date(
    hoje.getFullYear() - IDADE_MINIMA,
    hoje.getMonth(),
    hoje.getDate(),
    23,
    59,
    59,
    999
  );
}

function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const diferencaMes = hoje.getMonth() - dataNascimento.getMonth();
  if (
    diferencaMes < 0 ||
    (diferencaMes === 0 && hoje.getDate() < dataNascimento.getDate())
  ) {
    idade--;
  }
  return idade;
}

function traduzirErroCadastro(mensagem: string): string {
  const msg = mensagem.toLowerCase();
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Este e-mail já está cadastrado. Tente fazer login.';
  }
  if (msg.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) {
    return 'Informe um endereço de e-mail válido.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Falha de conexão com o servidor. Verifique sua internet.';
  }
  return mensagem || 'Não foi possível criar a sua conta.';
}

export default function TelaCadastro() {
  const tema = useThemeStore((state) => state.tema);
  const setTema = useThemeStore((state) => state.setTema);
  const ehEscuro = tema === 'dark';

  const dataInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const emailInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const senhaInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const confirmarSenhaInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [mostrarModalData, setMostrarModalData] = useState(false);
  const [dataPickerTemp, setDataPickerTemp] = useState<Date>(() => {
    const padrao = new Date();
    padrao.setFullYear(padrao.getFullYear() - 20);
    return padrao;
  });

  const [diaWeb, setDiaWeb] = useState('01');
  const [mesWeb, setMesWeb] = useState('01');
  const [anoWeb, setAnoWeb] = useState(() => String(new Date().getFullYear() - 20));

  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroData, setErroData] = useState<string | null>(null);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [erroConfirmarSenha, setErroConfirmarSenha] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const dataMaximaPermitida = useMemo(() => obterDataMaximaNascimento(), []);
  const dataMinimaPermitida = useMemo(() => new Date(ANO_MINIMO, 0, 1), []);
  const dataMaximaFormatada = useMemo(
    () => dateParaDataBr(dataMaximaPermitida),
    [dataMaximaPermitida]
  );

  const validarEAplicarData = (dataStr: string): boolean => {
    const dt = dataBrParaDate(dataStr);
    if (!dt) {
      setErroData('Data inválida. Use o formato DD/MM/AAAA.');
      return false;
    }

    if (dt.getFullYear() < ANO_MINIMO) {
      setErroData(`Informe um ano a partir de ${ANO_MINIMO}.`);
      return false;
    }

    if ( calcularIdade(dt) < IDADE_MINIMA || dt.getTime() > dataMaximaPermitida.getTime()) {
      const msg = `Cadastro permitido apenas para maiores de ${IDADE_MINIMA} anos (nascidos até ${dataMaximaFormatada}).`;
      setErroData(msg);
      showToast(`Idade mínima: ${IDADE_MINIMA} anos.`, 'erro');
      return false;
    }

    setErroData(null);
    setDataNascimento(dateParaDataBr(dt));
    return true;
  };

  const handleDigitarData = (texto: string) => {
    const mascarada = mascararData(texto);

    if (mascarada.length < 10) {
      setDataNascimento(mascarada);
      if (erroData) setErroData(null);
      return;
    }

    const dt = dataBrParaDate(mascarada);
    if (!dt) {
      setDataNascimento(mascarada.slice(0, 6));
      setErroData('Data inexistente no calendário.');
      return;
    }

    if (dt.getFullYear() < ANO_MINIMO) {
      setDataNascimento(mascarada.slice(0, 6));
      setErroData(`Ano inválido. Informe um ano a partir de ${ANO_MINIMO}.`);
      return;
    }

    if (calcularIdade(dt) < IDADE_MINIMA || dt.getTime() > dataMaximaPermitida.getTime()) {
      setDataNascimento(mascarada.slice(0, 6));
      const msg = `Não é permitido cadastrar menores de ${IDADE_MINIMA} anos (máx: ${dataMaximaFormatada}).`;
      setErroData(msg);
      showToast(`Idade mínima permitida: ${IDADE_MINIMA} anos.`, 'erro');
      return;
    }

    setErroData(null);
    setDataNascimento(mascarada);
  };

  const abrirSeletorDataNascimento = () => {
    const dataAtualValida = dataBrParaDate(dataNascimento);
    const dataInicial =
      dataAtualValida && dataAtualValida.getTime() <= dataMaximaPermitida.getTime()
        ? dataAtualValida
        : dataMaximaPermitida;

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dataInicial,
        mode: 'date',
        minimumDate: dataMinimaPermitida,
        maximumDate: dataMaximaPermitida,
        onValueChange: (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
          if (
            calcularIdade(selectedDate) < IDADE_MINIMA ||
            selectedDate.getTime() > dataMaximaPermitida.getTime()
          ) {
            mostrarAlerta({
              titulo: 'Idade mínima',
              mensagem: `Você precisa ter pelo menos ${IDADE_MINIMA} anos de idade para criar uma conta.`,
              variante: 'aviso',
              icone: 'calendar',
            });
            return;
          }
          setErroData(null);
          setDataNascimento(dateParaDataBr(selectedDate));
        },
      });
      return;
    }

    setDataPickerTemp(dataInicial);
    setDiaWeb(String(dataInicial.getDate()).padStart(2, '0'));
    setMesWeb(String(dataInicial.getMonth() + 1).padStart(2, '0'));
    setAnoWeb(String(dataInicial.getFullYear()));
    setMostrarModalData(true);
  };

  const handleConfirmarModalData = () => {
    if (Platform.OS === 'web') {
      const candidato = `${diaWeb.padStart(2, '0')}/${mesWeb.padStart(2, '0')}/${anoWeb}`;
      if (validarEAplicarData(candidato)) {
        setMostrarModalData(false);
      }
      return;
    }

    if (
      calcularIdade(dataPickerTemp) < IDADE_MINIMA ||
      dataPickerTemp.getTime() > dataMaximaPermitida.getTime()
    ) {
      setErroData(
        `Cadastro permitido apenas para maiores de ${IDADE_MINIMA} anos (nascidos até ${dataMaximaFormatada}).`
      );
      showToast(`Idade mínima: ${IDADE_MINIMA} anos.`, 'erro');
      return;
    }

    setErroData(null);
    setDataNascimento(dateParaDataBr(dataPickerTemp));
    setMostrarModalData(false);
  };

  const validarFormulario = (): boolean => {
    let valido = true;
    setErroNome(null);
    setErroData(null);
    setErroEmail(null);
    setErroSenha(null);
    setErroConfirmarSenha(null);
    setErroGeral(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErroNome('Informe o seu nome.');
      valido = false;
    } else if (nomeLimpo.length < 2) {
      setErroNome('O nome deve ter pelo menos 2 caracteres.');
      valido = false;
    }

    if (!dataNascimento.trim()) {
      setErroData('Informe a sua data de nascimento.');
      valido = false;
    } else if (!validarEAplicarData(dataNascimento)) {
      valido = false;
    }

    const emailLimpo = email.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailLimpo) {
      setErroEmail('Informe o seu e-mail.');
      valido = false;
    } else if (!regexEmail.test(emailLimpo)) {
      setErroEmail('Informe um formato de e-mail válido.');
      valido = false;
    }

    if (!senha) {
      setErroSenha('Crie uma senha.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter pelo menos 6 caracteres.');
      valido = false;
    }

    if (!confirmarSenha) {
      setErroConfirmarSenha('Confirme a sua senha.');
      valido = false;
    } else if (confirmarSenha !== senha) {
      setErroConfirmarSenha('As senhas não coincidem.');
      valido = false;
    }

    return valido;
  };

  const handleCadastro = async () => {
    if (!validarFormulario()) return;

    if (!isSupabaseConfigurado) {
      const msg =
        'Configure EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.';
      setErroGeral(msg);
      showToast('Variáveis do Supabase ausentes no .env', 'erro');
      return;
    }

    setCarregando(true);
    setErroGeral(null);

    const nomeLimpo = nome.trim();
    const emailNormalizado = email.trim().toLowerCase();

    try {
      await configurarLembrarDeMim(true, emailNormalizado);

      const { data, error } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: senha,
        options: {
          data: {
            nome: nomeLimpo,
            data_nascimento: dataNascimento,
          },
        },
      });

      if (error) {
        const msgTraduzida = traduzirErroCadastro(error.message);
        setErroGeral(msgTraduzida);
        showToast(msgTraduzida, 'erro');
        return;
      }

      try {
        atualizarConfiguracoesUsuario({ nome_usuario: nomeLimpo });
      } catch {}

      if (data.session) {
        showToast(`Bem-vindo(a), ${nomeLimpo}!`);
        router.replace('/(tabs)');
      } else {
        showToast('Cadastro realizado! Faça login para continuar.');
        router.replace('/(auth)/login');
      }
    } catch {
      const msg = 'Ocorreu um erro inesperado ao criar sua conta.';
      setErroGeral(msg);
      showToast(msg, 'erro');
    } finally {
      setCarregando(false);
    }
  };

  const anoMaximoPermitido = dataMaximaPermitida.getFullYear();

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC] dark:bg-[#0D0F22]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 20 }}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          <View className="w-full max-w-[400px] self-center">
            <View className="flex-row items-center justify-between mb-2">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Voltar para login"
                onPress={() => router.replace('/(auth)/login')}
                disabled={carregando}
                activeOpacity={0.75}
                className="h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-[#23264D] bg-white dark:bg-[#141730]"
              >
                <Feather
                  name="arrow-left"
                  size={18}
                  color={ehEscuro ? '#F3F4FF' : '#0F172A'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Alternar tema claro ou escuro"
                onPress={() => setTema(ehEscuro ? 'light' : 'dark')}
                activeOpacity={0.75}
                className="h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] dark:border-[#23264D] bg-white dark:bg-[#141730]"
              >
                <Feather
                  name={ehEscuro ? 'sun' : 'moon'}
                  size={18}
                  color={ehEscuro ? '#7C93FF' : '#5C7CFA'}
                />
              </TouchableOpacity>
            </View>

            <View className="items-center mb-7">
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#6378F6] mb-4"
                style={{
                  shadowColor: '#5C7CFA',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 6,
                }}
              >
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={34}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '-45deg' }] }}
                />
              </View>
              <Text className="text-[28px] font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                Criar Conta
              </Text>
              <Text className="text-[14px] font-medium text-[#64748B] dark:text-[#8E92B8] mt-1 text-center">
                Cadastre-se no GymLog para salvar seus treinos!
              </Text>
            </View>

            {erroGeral && (
              <View className="mb-4 flex-row items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <Feather name="alert-circle" size={18} color="#EF4444" />
                <Text className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {erroGeral}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-1.5 font-semibold">
                Nome
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[52px] ${
                  erroNome
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
                  value={nome}
                  onChangeText={(texto) => {
                    setNome(texto);
                    if (erroNome) setErroNome(null);
                  }}
                  placeholder="Como você quer ser chamado(a)?"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => dataInputRef.current?.focus()}
                  editable={!carregando}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
              </View>
              {erroNome && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {erroNome}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-1.5 font-semibold">
                Data de nascimento
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[52px] ${
                  erroData
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
                  ref={dataInputRef}
                  value={dataNascimento}
                  onChangeText={handleDigitarData}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  keyboardType="numeric"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  editable={!carregando}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Abrir calendário de data de nascimento"
                  onPress={abrirSeletorDataNascimento}
                  disabled={carregando}
                  hitSlop={8}
                  className="pl-2 py-1"
                >
                  <Feather
                    name="calendar"
                    size={18}
                    color={ehEscuro ? '#7C93FF' : '#5C7CFA'}
                  />
                </TouchableOpacity>
              </View>
              {erroData ? (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {erroData}
                </Text>
              ) : (
                <Text className="text-[#94A3B8] dark:text-[#64688F] text-[11px] mt-1 ml-1">
                  Idade mínima: {IDADE_MINIMA} anos (nascidos até {dataMaximaFormatada})
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-1.5 font-semibold">
                E-mail
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[52px] ${
                  erroEmail
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
                  ref={emailInputRef}
                  value={email}
                  onChangeText={(texto) => {
                    setEmail(texto);
                    if (erroEmail) setErroEmail(null);
                  }}
                  placeholder="voce@email.com"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="next"
                  onSubmitEditing={() => senhaInputRef.current?.focus()}
                  editable={!carregando}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
              </View>
              {erroEmail && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {erroEmail}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-1.5 font-semibold">
                Senha
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[52px] ${
                  erroSenha
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
                  ref={senhaInputRef}
                  value={senha}
                  onChangeText={(texto) => {
                    setSenha(texto);
                    if (erroSenha) setErroSenha(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmarSenhaInputRef.current?.focus()}
                  editable={!carregando}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  onPress={() => setMostrarSenha((prev) => !prev)}
                  hitSlop={8}
                >
                  <Feather
                    name={mostrarSenha ? 'eye-off' : 'eye'}
                    size={18}
                    color={ehEscuro ? '#8E92B8' : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>
              {erroSenha && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {erroSenha}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-1.5 font-semibold">
                Confirmar senha
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[52px] ${
                  erroConfirmarSenha
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
                  ref={confirmarSenhaInputRef}
                  value={confirmarSenha}
                  onChangeText={(texto) => {
                    setConfirmarSenha(texto);
                    if (erroConfirmarSenha) setErroConfirmarSenha(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  editable={!carregando}
                  onSubmitEditing={() => void handleCadastro()}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
              </View>
              {erroConfirmarSenha && (
                <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {erroConfirmarSenha}
                </Text>
              )}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Criar conta"
              onPress={() => void handleCadastro()}
              disabled={carregando}
              activeOpacity={0.85}
              style={{
                shadowColor: '#5C7CFA',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 12,
                elevation: 4,
              }}
              className={`h-[54px] items-center justify-center rounded-[16px] bg-[#6378F6] mb-3.5 ${
                carregando ? 'opacity-70' : 'opacity-100'
              }`}
            >
              {carregando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[16px] font-bold text-white">Criar conta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Já tenho uma conta"
              onPress={() => router.replace('/(auth)/login')}
              disabled={carregando}
              activeOpacity={0.75}
              className="h-[54px] items-center justify-center rounded-[16px] border border-[#E2E8F0] dark:border-[#23264D] bg-white dark:bg-[#101327]"
            >
              <Text className="text-[16px] font-bold text-[#0F172A] dark:text-white">
                Já tenho uma conta
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {mostrarModalData && (
        <Modal
          transparent
          animationType="fade"
          visible={mostrarModalData}
          onRequestClose={() => setMostrarModalData(false)}
        >
          <Pressable
            onPress={() => setMostrarModalData(false)}
            className="flex-1 bg-black/60 justify-end"
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1C1E3A] p-5 rounded-t-3xl border-t border-[#E2E8F0] dark:border-[#23264D]"
            >
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={() => setMostrarModalData(false)} hitSlop={8}>
                  <Text className="text-[#64748B] dark:text-[#8E92B8] font-semibold text-base">
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <Text className="text-[#0F172A] dark:text-white font-bold text-base">
                  Data de nascimento
                </Text>
                <TouchableOpacity onPress={handleConfirmarModalData} hitSlop={8}>
                  <Text className="text-[#5C7CFA] dark:text-[#7C93FF] font-bold text-base">
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === 'web' ? (
                <View className="py-3">
                  <Text className="text-xs text-[#64748B] dark:text-[#8E92B8] mb-3 text-center">
                    Selecione dia, mês e ano (máx: {dataMaximaFormatada})
                  </Text>
                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1">
                        Dia
                      </Text>
                      <TextInput
                        value={diaWeb}
                        onChangeText={(v) => setDiaWeb(v.replace(/\D/g, '').slice(0, 2))}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="DD"
                        className="rounded-xl border border-[#E2E8F0] dark:border-[#282B54] bg-[#F8FAFC] dark:bg-[#14152D] px-3 py-2.5 text-center text-base font-bold text-[#0F172A] dark:text-white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1">
                        Mês
                      </Text>
                      <TextInput
                        value={mesWeb}
                        onChangeText={(v) => setMesWeb(v.replace(/\D/g, '').slice(0, 2))}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="MM"
                        className="rounded-xl border border-[#E2E8F0] dark:border-[#282B54] bg-[#F8FAFC] dark:bg-[#14152D] px-3 py-2.5 text-center text-base font-bold text-[#0F172A] dark:text-white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-[#334155] dark:text-[#CBD5E1] mb-1">
                        Ano (≤ {anoMaximoPermitido})
                      </Text>
                      <TextInput
                        value={anoWeb}
                        onChangeText={(v) => {
                          const limpo = v.replace(/\D/g, '').slice(0, 4);
                          if (limpo.length === 4 && Number(limpo) > anoMaximoPermitido) {
                            setAnoWeb(String(anoMaximoPermitido));
                            showToast(`Ano máximo permitido: ${anoMaximoPermitido}`, 'erro');
                            return;
                          }
                          setAnoWeb(limpo);
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                        placeholder="AAAA"
                        className="rounded-xl border border-[#E2E8F0] dark:border-[#282B54] bg-[#F8FAFC] dark:bg-[#14152D] px-3 py-2.5 text-center text-base font-bold text-[#0F172A] dark:text-white"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <DateTimePicker
                  value={dataPickerTemp}
                  mode="date"
                  display="spinner"
                  minimumDate={dataMinimaPermitida}
                  maximumDate={dataMaximaPermitida}
                  onValueChange={(_, d) => {
                    if (d) {
                      if (d.getTime() > dataMaximaPermitida.getTime()) {
                        setDataPickerTemp(dataMaximaPermitida);
                      } else {
                        setDataPickerTemp(d);
                      }
                    }
                  }}
                />
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
