import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { atualizarConfiguracoesUsuario } from '@/database';
import { isSupabaseConfigurado, supabase } from '@/services/supabase';
import { showToast } from '@/stores/toastStore';
import { useThemeStore } from '@/stores/useThemeStore';

function traduzirErroAuth(mensagem: string): string {
  const msg = mensagem.toLowerCase();
  if (msg.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de fazer login.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Falha de conexão com o servidor. Verifique sua internet.';
  }
  return mensagem || 'Não foi possível entrar na sua conta.';
}

export default function TelaLogin() {
  const tema = useThemeStore((state) => state.tema);
  const setTema = useThemeStore((state) => state.setTema);
  const ehEscuro = tema === 'dark';

  const senhaInputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarDeMim, setLembrarDeMim] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const validarFormulario = (): boolean => {
    let valido = true;
    setErroEmail(null);
    setErroSenha(null);
    setErroGeral(null);

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
      setErroSenha('Informe a sua senha.');
      valido = false;
    } else if (senha.length < 6) {
      setErroSenha('A senha deve ter pelo menos 6 caracteres.');
      valido = false;
    }

    return valido;
  };

  const handleLogin = async () => {
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        const msgTraduzida = traduzirErroAuth(error.message);
        setErroGeral(msgTraduzida);
        showToast(msgTraduzida, 'erro');
        return;
      }

      const nomeMeta =
        typeof data.user?.user_metadata?.nome === 'string'
          ? data.user.user_metadata.nome.trim()
          : '';
      if (nomeMeta) {
        try {
          atualizarConfiguracoesUsuario({ nome_usuario: nomeMeta });
        } catch {}
      }

      showToast('Bem-vindo ao GymLog!');
      router.replace('/(tabs)');
    } catch {
      const msg = 'Ocorreu um erro inesperado ao conectar com o servidor.';
      setErroGeral(msg);
      showToast(msg, 'erro');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC] dark:bg-[#0D0F22]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 24 }}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="px-6"
        >
          <View className="w-full max-w-[400px] self-center">
            <View className="flex-row justify-end mb-2">
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

            <View className="items-center mb-9">
              <View
                className="h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#6378F6] mb-5"
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
              <Text className="text-[32px] font-extrabold tracking-tight text-[#0F172A] dark:text-white">
                GymLog
              </Text>
              <Text className="text-[14px] font-medium text-[#64748B] dark:text-[#8E92B8] mt-1.5 text-center">
                Seu treino. Seu progresso. Seu histórico.
              </Text>
            </View>

            {erroGeral && (
              <View className="mb-5 flex-row items-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3">
                <Feather name="alert-circle" size={18} color="#EF4444" />
                <Text className="flex-1 text-xs font-medium text-red-600 dark:text-red-400">
                  {erroGeral}
                </Text>
              </View>
            )}

            <View className="mb-5">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-2 font-semibold">
                E-mail ou usuário
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[54px] ${
                  erroEmail
                    ? 'border-red-500'
                    : 'border-[#E2E8F0] dark:border-[#23264D]'
                }`}
              >
                <TextInput
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
                <Text className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                  {erroEmail}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-2 font-semibold">
                Senha
              </Text>
              <View
                className={`flex-row items-center rounded-[16px] border bg-white dark:bg-[#141730] px-4 h-[54px] ${
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
                  autoComplete="password"
                  returnKeyType="done"
                  editable={!carregando}
                  onSubmitEditing={() => void handleLogin()}
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
                <Text className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                  {erroSenha}
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-between mb-6 mt-1">
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: lembrarDeMim }}
                accessibilityLabel="Lembrar de mim"
                onPress={() => setLembrarDeMim((prev) => !prev)}
                activeOpacity={0.7}
                className="flex-row items-center gap-2 py-1"
              >
                <View
                  className={`h-4 w-4 items-center justify-center rounded border ${
                    lembrarDeMim
                      ? 'border-[#5C7CFA] bg-[#5C7CFA]'
                      : 'border-[#CBD5E1] dark:border-[#383D6E] bg-white dark:bg-[#141730]'
                  }`}
                >
                  {lembrarDeMim && <Feather name="check" size={11} color="#FFFFFF" />}
                </View>
                <Text className="text-[14px] font-medium text-[#64748B] dark:text-[#8E92B8]">
                  Lembrar de mim
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Esqueci minha senha"
                onPress={() => router.push('/(auth)/esqueci-senha')}
                disabled={carregando}
                activeOpacity={0.7}
                className="py-1"
              >
                <Text className="text-[14px] font-bold text-[#5C7CFA] dark:text-[#7C93FF]">
                  Esqueci minha senha
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              onPress={() => void handleLogin()}
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
                <Text className="text-[16px] font-bold text-white">Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Criar conta"
              onPress={() => router.push('/(auth)/cadastro')}
              disabled={carregando}
              activeOpacity={0.75}
              className="h-[54px] items-center justify-center rounded-[16px] border border-[#E2E8F0] dark:border-[#23264D] bg-white dark:bg-[#101327]"
            >
              <Text className="text-[16px] font-bold text-[#0F172A] dark:text-white">
                Criar conta
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
