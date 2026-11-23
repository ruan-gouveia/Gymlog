import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import {
  useAlertStore,
  type BotaoAlerta,
  type NomeIconeFeather,
  type VarianteAlerta,
} from '@/stores/useAlertStore';
import { useThemeStore } from '@/stores/useThemeStore';

function obterVisualVariante(
  variante: VarianteAlerta,
  ehEscuro: boolean,
  iconeCustom?: NomeIconeFeather
): {
  icone: NomeIconeFeather;
  corIcone: string;
  bgIconeClass: string;
} {
  if (variante === 'perigo') {
    return {
      icone: iconeCustom ?? 'trash-2',
      corIcone: ehEscuro ? '#F2677A' : '#EF4444',
      bgIconeClass: 'bg-red-50 dark:bg-red-500/15',
    };
  }

  if (variante === 'aviso') {
    return {
      icone: iconeCustom ?? 'alert-circle',
      corIcone: ehEscuro ? '#FBBF24' : '#D97706',
      bgIconeClass: 'bg-amber-50 dark:bg-amber-500/15',
    };
  }

  return {
    icone: iconeCustom ?? 'info',
    corIcone: ehEscuro ? '#7C93FF' : '#5C7CFA',
    bgIconeClass: 'bg-[#EEF2FF] dark:bg-[#252854]',
  };
}

export function ModalAlerta() {
  const visivel = useAlertStore((state) => state.visivel);
  const config = useAlertStore((state) => state.config);
  const fechar = useAlertStore((state) => state.fechar);
  const tema = useThemeStore((state) => state.tema);
  const ehEscuro = tema === 'dark';

  if (!config) {
    return null;
  }

  const variante: VarianteAlerta = config.variante ?? 'padrao';
  const { icone, corIcone, bgIconeClass } = obterVisualVariante(
    variante,
    ehEscuro,
    config.icone
  );

  const botoes: BotaoAlerta[] =
    config.botoes && config.botoes.length > 0
      ? config.botoes
      : [{ texto: 'Entendi', estilo: 'default' }];

  const handlePressBotao = (botao: BotaoAlerta) => {
    fechar();
    if (botao.onPress) {
      setTimeout(() => {
        void botao.onPress?.();
      }, 60);
    }
  };

  const usarLayoutEmpilhado = botoes.length > 2;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={fechar}
    >
      <Pressable
        onPress={fechar}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(10, 12, 28, 0.65)' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-[400px] rounded-[28px] bg-white dark:bg-[#1C1E3A] border border-[#EAEFF5] dark:border-[#23264D] p-6 shadow-xl"
        >
          <View className="items-center mb-3.5">
            <View
              className={`h-15 w-15 h-[60px] w-[60px] items-center justify-center rounded-2xl mb-3 ${bgIconeClass}`}
            >
              <Feather name={icone} size={26} color={corIcone} />
            </View>
            <Text className="text-[19px] font-extrabold text-slate-900 dark:text-white text-center">
              {config.titulo}
            </Text>
          </View>

          <Text className="text-[13.5px] leading-5 text-center text-slate-500 dark:text-[#A3A6CC] mb-6">
            {config.mensagem}
          </Text>

          {usarLayoutEmpilhado ? (
            <View className="gap-2.5">
              {botoes
                .filter((b) => b.estilo !== 'cancel')
                .map((botao, idx) => {
                  const isDestructive = botao.estilo === 'destructive';
                  const isSecondary = botao.estilo === 'secondary';
                  const btnClass = isDestructive
                    ? 'bg-[#EF4444]'
                    : isSecondary
                    ? 'border border-slate-200 dark:border-[#252854] bg-[#F8FAFC] dark:bg-[#14152D]'
                    : 'bg-[#5C7CFA]';
                  const textClass = isSecondary
                    ? 'text-slate-800 dark:text-white'
                    : 'text-white';
                  const iconColor = isSecondary
                    ? ehEscuro
                      ? '#7C93FF'
                      : '#5C7CFA'
                    : '#FFFFFF';

                  return (
                    <TouchableOpacity
                      key={`${botao.texto}-${idx}`}
                      accessibilityRole="button"
                      accessibilityLabel={botao.texto}
                      onPress={() => handlePressBotao(botao)}
                      activeOpacity={0.8}
                      className={`w-full flex-row items-center justify-center gap-2 rounded-2xl py-3.5 ${btnClass}`}
                    >
                      {botao.icone && (
                        <Feather name={botao.icone} size={16} color={iconColor} />
                      )}
                      <Text className={`text-[14px] font-bold ${textClass}`}>
                        {botao.texto}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

              {botoes
                .filter((b) => b.estilo === 'cancel')
                .map((botao, idx) => (
                  <TouchableOpacity
                    key={`cancel-${botao.texto}-${idx}`}
                    accessibilityRole="button"
                    accessibilityLabel={botao.texto}
                    onPress={() => handlePressBotao(botao)}
                    activeOpacity={0.75}
                    className="w-full items-center justify-center rounded-2xl border border-slate-200 dark:border-[#252854] py-3.5 bg-slate-50 dark:bg-[#14152D] mt-0.5"
                  >
                    <Text className="text-[14px] font-bold text-slate-600 dark:text-[#8E92B8]">
                      {botao.texto}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          ) : botoes.length === 2 ? (
            <View className="flex-row gap-3">
              {botoes.map((botao, idx) => {
                const isCancel = botao.estilo === 'cancel';
                const isDestructive = botao.estilo === 'destructive';

                if (isCancel) {
                  return (
                    <TouchableOpacity
                      key={`${botao.texto}-${idx}`}
                      accessibilityRole="button"
                      accessibilityLabel={botao.texto}
                      onPress={() => handlePressBotao(botao)}
                      activeOpacity={0.75}
                      className="flex-1 items-center justify-center rounded-2xl border border-slate-200 dark:border-[#252854] py-3.5 bg-slate-50 dark:bg-[#14152D]"
                    >
                      <Text className="text-[14px] font-bold text-slate-600 dark:text-[#8E92B8]">
                        {botao.texto}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={`${botao.texto}-${idx}`}
                    accessibilityRole="button"
                    accessibilityLabel={botao.texto}
                    onPress={() => handlePressBotao(botao)}
                    activeOpacity={0.8}
                    className={`flex-1 items-center justify-center rounded-2xl py-3.5 ${
                      isDestructive ? 'bg-[#EF4444]' : 'bg-[#5C7CFA]'
                    }`}
                  >
                    <Text className="text-[14px] font-bold text-white">
                      {botao.texto}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={botoes[0].texto}
              onPress={() => handlePressBotao(botoes[0])}
              activeOpacity={0.8}
              className={`w-full items-center justify-center rounded-2xl py-3.5 ${
                botoes[0].estilo === 'destructive' ? 'bg-[#EF4444]' : 'bg-[#5C7CFA]'
              }`}
            >
              <Text className="text-[14px] font-bold text-white">
                {botoes[0].texto}
              </Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
