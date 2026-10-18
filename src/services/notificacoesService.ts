import { isRunningInExpoGo } from 'expo';
import type {
  NotificationHandler,
  NotificationPermissionsStatus,
  NotificationRequestInput,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { db } from '@/database/conexao';
import {
  obterConfiguracaoLembretes,
  salvarConfiguracaoLembretes,
} from '@/database/perfilConsultas';
import type { Treino } from '@/database/tipos';

export const CANAL_NOTIFICACOES_ID = 'gymlog-lembretes';

type ModulosNotificacoesLocais = {
  setNotificationHandler: (handler: NotificationHandler | null) => void;
  getPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
  requestPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
  setNotificationChannelAsync: (
    channelId: string,
    channel: {
      name: string;
      importance: number;
      vibrationPattern?: number[];
      lightColor?: string;
      sound?: string | null;
      enableVibrate?: boolean;
    }
  ) => Promise<unknown>;
  scheduleNotificationAsync: (request: NotificationRequestInput) => Promise<string>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  AndroidImportance: { HIGH: number };
  SchedulableTriggerInputTypes: { DATE: SchedulableTriggerInputTypes.DATE };
};

let modulosCache: ModulosNotificacoesLocais | null = null;
let carregamentoTentado = false;

/**
 * Carrega apenas os submódulos de notificações locais do `expo-notifications`,
 * evitando o barrel raiz (`expo-notifications/build/index.js`) que importa
 * `TopicSubscriptionModule` (push notifications/FCM removido do Expo Go Android no SDK 53+).
 */
function obterModulosNotificacoesLocais(): ModulosNotificacoesLocais | null {
  if (Platform.OS === 'web') return null;
  if (modulosCache) return modulosCache;
  if (carregamentoTentado) return null;
  carregamentoTentado = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const handlerMod = require('expo-notifications/build/NotificationsHandler');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const permsMod = require('expo-notifications/build/NotificationPermissions');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const channelMod = require('expo-notifications/build/setNotificationChannelAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const scheduleMod = require('expo-notifications/build/scheduleNotificationAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cancelAllMod = require('expo-notifications/build/cancelAllScheduledNotificationsAsync');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const channelTypesMod = require('expo-notifications/build/NotificationChannelManager.types');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const notifTypesMod = require('expo-notifications/build/Notifications.types');

    modulosCache = {
      setNotificationHandler: handlerMod.setNotificationHandler,
      getPermissionsAsync: permsMod.getPermissionsAsync,
      requestPermissionsAsync: permsMod.requestPermissionsAsync,
      setNotificationChannelAsync: channelMod.setNotificationChannelAsync,
      scheduleNotificationAsync: scheduleMod.scheduleNotificationAsync,
      cancelAllScheduledNotificationsAsync: cancelAllMod.cancelAllScheduledNotificationsAsync,
      AndroidImportance: channelTypesMod.AndroidImportance ?? { HIGH: 6 },
      SchedulableTriggerInputTypes: notifTypesMod.SchedulableTriggerInputTypes ?? { DATE: 'date' },
    };

    return modulosCache;
  } catch (error) {
    console.warn('[Notificações] Módulo nativo de notificações locais indisponível:', error);
    return null;
  }
}

let handlerConfigurado = false;
let canalAndroidPronto = false;
let canalAndroidSuportado = true;

function deveUsarCanalCustomizadoAndroid(): boolean {
  if (Platform.OS !== 'android') return false;
  if (isRunningInExpoGo()) return false;
  return canalAndroidSuportado;
}

export function configurarHandlerNotificacoes(): void {
  if (handlerConfigurado) return;
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return;

    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigurado = true;
  } catch (error) {
    console.warn('[Notificações] Não foi possível configurar o handler:', error);
  }
}

export async function configurarCanalAndroid(): Promise<void> {
  if (!deveUsarCanalCustomizadoAndroid() || canalAndroidPronto) return;
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return;

    await api.setNotificationChannelAsync(CANAL_NOTIFICACOES_ID, {
      name: 'Lembretes de Treino',
      importance: api.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5C7CFA',
      sound: 'default',
      enableVibrate: true,
    });
    canalAndroidPronto = true;
  } catch {
    canalAndroidSuportado = false;
  }
}

export async function verificarPermissaoNotificacoes(): Promise<boolean> {
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return false;

    configurarHandlerNotificacoes();
    const { status, granted } = await api.getPermissionsAsync();
    return Boolean(granted || status === 'granted');
  } catch (error) {
    console.warn('[Notificações] Falha ao verificar permissão:', error);
    return false;
  }
}

export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return false;

    configurarHandlerNotificacoes();
    await configurarCanalAndroid();

    const atual = await api.getPermissionsAsync();
    if (atual.granted || atual.status === 'granted') {
      return true;
    }

    const solicitado = await api.requestPermissionsAsync();
    return Boolean(solicitado.granted || solicitado.status === 'granted');
  } catch (error) {
    console.warn('[Notificações] Falha ao solicitar permissão:', error);
    return false;
  }
}

export function calcularDataDisparoNotificacao(
  dataBr: string,
  horarioStr: string | null | undefined,
  antecedenciaMinutos: number
): Date | null {
  const partesData = dataBr.trim().split('/');
  if (partesData.length !== 3) return null;

  const dia = parseInt(partesData[0], 10);
  const mes = parseInt(partesData[1], 10) - 1;
  const ano = parseInt(partesData[2], 10);
  if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(ano)) return null;

  const horarioLimpo = (horarioStr ?? '18:00').trim();
  const partesHora = horarioLimpo.split(':');
  const hora = partesHora.length >= 1 ? parseInt(partesHora[0], 10) : 18;
  const minuto = partesHora.length >= 2 ? parseInt(partesHora[1], 10) : 0;

  const horaValida = Number.isNaN(hora) ? 18 : Math.max(0, Math.min(23, hora));
  const minutoValido = Number.isNaN(minuto) ? 0 : Math.max(0, Math.min(59, minuto));

  const dataTreino = new Date(ano, mes, dia, horaValida, minutoValido, 0, 0);
  if (
    dataTreino.getFullYear() !== ano ||
    dataTreino.getMonth() !== mes ||
    dataTreino.getDate() !== dia
  ) {
    return null;
  }

  const antecedenciaMs = Math.max(1, antecedenciaMinutos) * 60 * 1000;
  return new Date(dataTreino.getTime() - antecedenciaMs);
}

export function formatarHorarioDisparo(
  horarioTreino: string,
  antecedenciaMinutos: number
): string {
  const partes = horarioTreino.trim().split(':');
  const h = parseInt(partes[0] ?? '18', 10);
  const m = parseInt(partes[1] ?? '0', 10);
  const totalMinutos =
    ((Number.isNaN(h) ? 18 : h) * 60 + (Number.isNaN(m) ? 0 : m) - antecedenciaMinutos + 1440) %
    1440;
  const hh = String(Math.floor(totalMinutos / 60)).padStart(2, '0');
  const mm = String(totalMinutos % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export type AgendamentoTreinoInput = {
  treinoId?: number;
  nome: string;
  grupoMuscular: string;
  data: string;
  horario?: string | null;
  antecedenciaMinutos?: number;
};

export async function agendarNotificacaoParaTreino(
  input: AgendamentoTreinoInput
): Promise<string | null> {
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return null;

    const config = obterConfiguracaoLembretes();
    if (!config.ativo) return null;

    const temPermissao = await verificarPermissaoNotificacoes();
    if (!temPermissao) return null;

    const antecedencia = input.antecedenciaMinutos ?? config.antecedenciaMinutos;
    const dataDisparo = calcularDataDisparoNotificacao(
      input.data,
      input.horario ?? config.horarioPadrao,
      antecedencia
    );

    if (!dataDisparo || dataDisparo.getTime() <= Date.now()) {
      return null;
    }

    const focoTreino = input.grupoMuscular?.trim() || input.nome?.trim() || 'Treino';

    const idNotificacao = await api.scheduleNotificationAsync({
      content: {
        title: 'Gymlog · Hora de se preparar!',
        body: `Gymlog: Você tem um treino de ${focoTreino} em ${antecedencia} minutos!`,
        sound: true,
        data: {
          treinoId: input.treinoId ?? null,
          data: input.data,
          horario: input.horario ?? '18:00',
          antecedenciaMinutos: antecedencia,
        },
      },
      trigger: {
        type: api.SchedulableTriggerInputTypes.DATE,
        date: dataDisparo,
        channelId: deveUsarCanalCustomizadoAndroid() ? CANAL_NOTIFICACOES_ID : undefined,
      },
    });

    return idNotificacao;
  } catch (error) {
    console.warn('[Notificações] Erro ao agendar notificação para treino:', error);
    return null;
  }
}

export async function cancelarTodasNotificacoes(): Promise<void> {
  try {
    const api = obterModulosNotificacoesLocais();
    if (!api) return;
    await api.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Notificações] Aviso ao cancelar notificações agendadas:', error);
  }
}

export async function sincronizarNotificacoesAgendadas(): Promise<{
  agendadas: number;
  ativo: boolean;
  antecedenciaMinutos: number;
}> {
  const config = obterConfiguracaoLembretes();

  await cancelarTodasNotificacoes();

  if (!config.ativo) {
    return {
      agendadas: 0,
      ativo: false,
      antecedenciaMinutos: config.antecedenciaMinutos,
    };
  }

  const api = obterModulosNotificacoesLocais();
  if (!api) {
    return {
      agendadas: 0,
      ativo: true,
      antecedenciaMinutos: config.antecedenciaMinutos,
    };
  }

  const permitido = await verificarPermissaoNotificacoes();
  if (!permitido) {
    return {
      agendadas: 0,
      ativo: true,
      antecedenciaMinutos: config.antecedenciaMinutos,
    };
  }

  await configurarCanalAndroid();

  const treinosAgendados = db.getAllSync<
    Pick<Treino, 'id' | 'nome' | 'grupo_muscular' | 'data' | 'horario' | 'status'>
  >(
    `SELECT id, nome, grupo_muscular, data, horario, status
       FROM treinos
      WHERE status = 'agendado'
      ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) ASC, id ASC;`
  );

  let agendadas = 0;
  const agora = Date.now();

  for (const t of treinosAgendados) {
    const horarioTreino = t.horario ?? config.horarioPadrao ?? '18:00';
    let dataDisparo = calcularDataDisparoNotificacao(
      t.data,
      horarioTreino,
      config.antecedenciaMinutos
    );

    if (!dataDisparo) continue;

    const dataTreinoExata = calcularDataDisparoNotificacao(t.data, horarioTreino, 0);
    if (dataDisparo.getTime() <= agora && dataTreinoExata && dataTreinoExata.getTime() > agora) {
      dataDisparo = new Date(agora + 5000);
    }

    if (dataDisparo.getTime() <= agora) continue;

    try {
      const foco = t.grupo_muscular?.trim() || t.nome?.trim() || 'Treino';

      await api.scheduleNotificationAsync({
        content: {
          title: 'Gymlog · Lembrete de Treino',
          body: `Gymlog: Você tem um treino de ${foco} em ${config.antecedenciaMinutos} minutos!`,
          sound: true,
          data: {
            treinoId: t.id,
            data: t.data,
            horario: horarioTreino,
            antecedenciaMinutos: config.antecedenciaMinutos,
          },
        },
        trigger: {
          type: api.SchedulableTriggerInputTypes.DATE,
          date: dataDisparo,
          channelId: deveUsarCanalCustomizadoAndroid() ? CANAL_NOTIFICACOES_ID : undefined,
        },
      });
      agendadas += 1;
    } catch (error) {
      console.warn('[Notificações] Falha ao agendar treino ID', t.id, error);
    }
  }

  return {
    agendadas,
    ativo: true,
    antecedenciaMinutos: config.antecedenciaMinutos,
  };
}

export async function atualizarPreferenciasESincronizarNotificacoes(
  ativo: boolean,
  antecedenciaMinutos: number
): Promise<{
  permitido: boolean;
  agendadas: number;
  ativo: boolean;
  antecedenciaMinutos: number;
}> {
  let permitido = true;
  if (ativo) {
    permitido = await solicitarPermissaoNotificacoes();
  }

  const salvo = salvarConfiguracaoLembretes(ativo, antecedenciaMinutos);
  const resultadoSync = await sincronizarNotificacoesAgendadas();

  return {
    permitido,
    agendadas: resultadoSync.agendadas,
    ativo: salvo.ativo,
    antecedenciaMinutos: salvo.antecedenciaMinutos,
  };
}

export function useNotificacoesTreino(solicitarAoMontar = false) {
  const [permissaoConcedida, setPermissaoConcedida] = useState<boolean>(false);

  const solicitarPermissao = useCallback(async () => {
    const ok = await solicitarPermissaoNotificacoes();
    setPermissaoConcedida(ok);
    if (ok) {
      await sincronizarNotificacoesAgendadas();
    }
    return ok;
  }, []);

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      configurarHandlerNotificacoes();
      const config = obterConfiguracaoLembretes();

      if (solicitarAoMontar && config.ativo) {
        const ok = await solicitarPermissaoNotificacoes();
        if (ativo) setPermissaoConcedida(ok);
        if (ok) {
          await sincronizarNotificacoesAgendadas();
        }
      } else {
        const jaTem = await verificarPermissaoNotificacoes();
        if (ativo) setPermissaoConcedida(jaTem);
        if (jaTem && config.ativo) {
          await sincronizarNotificacoesAgendadas();
        }
      }
    }

    void inicializar();

    return () => {
      ativo = false;
    };
  }, [solicitarAoMontar]);

  return {
    permissaoConcedida,
    solicitarPermissao,
    sincronizarNotificacoesAgendadas,
  };
}
