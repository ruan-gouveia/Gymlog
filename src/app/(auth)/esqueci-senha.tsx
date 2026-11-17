import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { showToast } from '@/stores/toastStore';
import { useThemeStore } from '@/stores/useThemeStore';

export default function TelaEsqueciSenha() {
  const tema = useThemeStore((state) => state.tema);
  const setTema = useThemeStore((state) => state.setTema);
  const ehEscuro = tema === 'dark';

  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSolicitarRecuperacao = () => {
    setErroEmail(null);
    const emailLimpo = email.trim();
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailLimpo) {
      setErroEmail('Informe o seu e-mail cadastrado.');
      return;
    }

    if (!regexEmail.test(emailLimpo)) {
      setErroEmail('Informe um formato de e-mail válido.');
      return;
    }

    setEnviado(true);
    showToast('A recuperação de senha será habilitada em breve.');
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
            <View className="flex-row items-center justify-between mb-2">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Voltar para o login"
                onPress={() => router.replace('/(auth)/login')}
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
              <Text className="text-[28px] font-extrabold tracking-tight text-[#0F172A] dark:text-white text-center">
                Esqueci minha senha
              </Text>
              <Text className="text-[14px] font-medium text-[#64748B] dark:text-[#8E92B8] mt-1.5 text-center leading-5">
                Informe o seu e-mail cadastrado para receber o link de redefinição de senha.
              </Text>
            </View>

            {enviado && (
              <View className="mb-5 flex-row items-center gap-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3.5">
                <Feather name="info" size={18} color="#5C7CFA" />
                <Text className="flex-1 text-xs font-medium text-[#3B5BDB] dark:text-[#93C5FD] leading-4">
                  Funcionalidade em construção: o envio de e-mail de recuperação será integrado na próxima etapa.
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-[#334155] dark:text-[#CBD5E1] text-[14px] mb-2 font-semibold">
                E-mail cadastrado
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
                    if (enviado) setEnviado(false);
                  }}
                  placeholder="voce@email.com"
                  placeholderTextColor={ehEscuro ? '#64688F' : '#94A3B8'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleSolicitarRecuperacao}
                  className="flex-1 text-[15px] text-[#0F172A] dark:text-white h-full"
                />
              </View>
              {erroEmail && (
                <Text className="text-red-500 text-xs mt-1.5 ml-1 font-medium">
                  {erroEmail}
                </Text>
              )}
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Recuperar senha"
              onPress={handleSolicitarRecuperacao}
              activeOpacity={0.85}
              style={{
                shadowColor: '#5C7CFA',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 12,
                elevation: 4,
              }}
              className="h-[54px] items-center justify-center rounded-[16px] bg-[#6378F6] mb-3.5"
            >
              <Text className="text-[16px] font-bold text-white">
                Enviar link de recuperação
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar para o login"
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.75}
              className="h-[54px] items-center justify-center rounded-[16px] border border-[#E2E8F0] dark:border-[#23264D] bg-white dark:bg-[#101327]"
            >
              <Text className="text-[16px] font-bold text-[#0F172A] dark:text-white">
                Voltar para o login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
