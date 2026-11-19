import * as Network from 'expo-network';
import { AppState, Platform } from 'react-native';

import { db, obterUsuarioBancoLocal } from '@/database/conexao';
import {
  atualizarConfiguracoesUsuario,
  obterConfiguracoesUsuario,
} from '@/database/configuracoesRepository';
import { obterConfiguracaoLembretes } from '@/database/perfilConsultas';
import type { Exercicio, StatusTreino, Treino } from '@/database/tipos';
import { isSupabaseConfigurado, supabase } from '@/services/supabase';
import {
  useSyncStore,
  type ItemFilaSync,
  type PayloadDeleteTreino,
  type PayloadUpsertPerfil,
  type PayloadUpsertTreino,
} from '@/stores/useSyncStore';

type TreinoNuvemRow = {
  local_id: number;
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string | null;
  status: StatusTreino;
  horario: string | null;
  repetir: string | null;
};

type ExercicioNuvemRow = {
  treino_local_id: number;
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number | null;
  concluida: number;
};

let processandoFila = false;
let monitoramentoIniciado = false;

export async function verificarConexaoReal(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'onLine' in navigator) {
    if (!navigator.onLine) {
      useSyncStore.getState().setOnline(false);
      return false;
    }
  }

  try {
    const estadoRede = await Network.getNetworkStateAsync();
    const conectado =
      Boolean(estadoRede.isConnected) && estadoRede.isInternetReachable !== false;
    useSyncStore.getState().setOnline(conectado);
    return conectado;
  } catch {
    const fallbackOnline =
      Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.onLine : true;
    useSyncStore.getState().setOnline(fallbackOnline);
    return fallbackOnline;
  }
}

async function executarItemNoSupabase(item: ItemFilaSync): Promise<void> {
  if (item.tipo === 'UPSERT_TREINO') {
    const { treino, exercicios } = item.payload as PayloadUpsertTreino;

    const { error: erroTreino } = await supabase.from('treinos').upsert(
      {
        user_id: item.userId,
        local_id: treino.id,
        nome: treino.nome,
        data: treino.data,
        duracao: treino.duracao,
        grupo_muscular: treino.grupo_muscular,
        observacoes: treino.observacoes,
        status: treino.status,
        horario: treino.horario,
        repetir: String(treino.repetir ?? 'uma_vez'),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,local_id' }
    );

    if (erroTreino) {
      throw new Error(erroTreino.message);
    }

    const { error: erroDelEx } = await supabase
      .from('exercicios')
      .delete()
      .eq('user_id', item.userId)
      .eq('treino_local_id', treino.id);

    if (erroDelEx) {
      throw new Error(erroDelEx.message);
    }

    if (exercicios.length > 0) {
      const payloadEx = exercicios.map((ex) => ({
        user_id: item.userId,
        treino_local_id: treino.id,
        nome: ex.nome,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga: Number(ex.carga),
        descanso: ex.descanso,
        concluida: ex.concluida,
      }));

      const { error: erroInsEx } = await supabase.from('exercicios').insert(payloadEx);
      if (erroInsEx) {
        throw new Error(erroInsEx.message);
      }
    }
    return;
  }

  if (item.tipo === 'DELETE_TREINO') {
    const { local_id } = item.payload as PayloadDeleteTreino;
    const { error } = await supabase
      .from('treinos')
      .delete()
      .eq('user_id', item.userId)
      .eq('local_id', local_id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  if (item.tipo === 'UPSERT_PERFIL') {
    const perfil = item.payload as PayloadUpsertPerfil;
    const { error } = await supabase.from('perfis').upsert(
      {
        id: item.userId,
        nome: perfil.nome || 'Usuário',
        meta_semanal: perfil.meta_semanal || 3,
        lembretes_ativo: perfil.lembretes_ativo,
        horario_lembretes: perfil.horario_lembretes ?? '18:00',
        dias_lembretes: perfil.dias_lembretes ?? 'Seg, Qua e Sex',
        antecedencia_lembrete: perfil.antecedencia_lembrete,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function processarFilaSincronizacao(): Promise<boolean> {
  if (processandoFila || !isSupabaseConfigurado) {
    return false;
  }

  const userId = obterUsuarioBancoLocal();
  if (!userId) {
    return false;
  }

  const online = await verificarConexaoReal();
  if (!online) {
    return false;
  }

  const { fila } = useSyncStore.getState();
  if (fila.length === 0) {
    return true;
  }

  processandoFila = true;
  useSyncStore.getState().setSincronizando(true);

  try {
    while (useSyncStore.getState().fila.length > 0) {
      const aindaOnline = await verificarConexaoReal();
      if (!aindaOnline) {
        break;
      }

      const itemAtual = useSyncStore.getState().fila[0];
      if (!itemAtual) break;

      if (itemAtual.userId !== userId) {
        break;
      }

      try {
        await executarItemNoSupabase(itemAtual);
        await useSyncStore.getState().removerItemDaFila(itemAtual.id);
        useSyncStore.getState().registrarSucessoSincronizacao();
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'Falha de conexão com o servidor.';

        if (
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('failed to fetch')
        ) {
          useSyncStore.getState().setOnline(false);
        }

        await useSyncStore.getState().registrarFalhaItem(itemAtual.id, msg);
        if (__DEV__) {
          console.warn('[Offline-First] Item mantido na fila para nova tentativa:', msg);
        }
        break;
      }
    }

    return useSyncStore.getState().fila.length === 0;
  } finally {
    processandoFila = false;
    useSyncStore.getState().setSincronizando(false);
  }
}

export function iniciarMonitoramentoRedeSync(): () => void {
  if (monitoramentoIniciado) {
    return () => {};
  }
  monitoramentoIniciado = true;

  void verificarConexaoReal().then((online) => {
    if (online) {
      void processarFilaSincronizacao();
    }
  });

  const subNetwork = Network.addNetworkStateListener((state) => {
    const conectado = Boolean(state.isConnected) && state.isInternetReachable !== false;
    useSyncStore.getState().setOnline(conectado);
    if (conectado) {
      void processarFilaSincronizacao();
    }
  });

  const subAppState = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      void verificarConexaoReal().then((online) => {
        if (online) {
          void processarFilaSincronizacao();
        }
      });
    }
  });

  const handleWebOnline = () => {
    useSyncStore.getState().setOnline(true);
    void processarFilaSincronizacao();
  };

  const handleWebOffline = () => {
    useSyncStore.getState().setOnline(false);
  };

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('online', handleWebOnline);
    window.addEventListener('offline', handleWebOffline);
  }

  return () => {
    monitoramentoIniciado = false;
    subNetwork.remove();
    subAppState.remove();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.removeEventListener('online', handleWebOnline);
      window.removeEventListener('offline', handleWebOffline);
    }
  };
}

export async function sincronizarTreinoComNuvem(treinoId: number): Promise<void> {
  const userId = obterUsuarioBancoLocal();
  if (!userId || !isSupabaseConfigurado) return;

  try {
    const todosTreinos = db.getAllSync<Treino>(
      `SELECT id, nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir
         FROM treinos
        ORDER BY substr(data, 7, 4) || substr(data, 4, 2) || substr(data, 1, 2) DESC, id DESC;`
    );
    const treino = todosTreinos.find((t) => t.id === treinoId);
    if (!treino) return;

    const todosExercicios = db.getAllSync<Exercicio>(
      `SELECT id, treino_id, nome, series, repeticoes, carga, descanso, concluida
         FROM exercicios
        ORDER BY treino_id ASC, id ASC;`
    );
    const exerciciosDoTreino = todosExercicios.filter((e) => e.treino_id === treinoId);

    await useSyncStore.getState().enfileirarOperacao({
      userId,
      tipo: 'UPSERT_TREINO',
      entidadeId: treino.id,
      descricao: `Salvar treino: ${treino.nome}`,
      payload: {
        treino,
        exercicios: exerciciosDoTreino,
      },
    });

    void processarFilaSincronizacao();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Offline-First] Erro ao enfileirar treino:', error);
    }
  }
}

export async function removerTreinoDaNuvem(treinoId: number): Promise<void> {
  const userId = obterUsuarioBancoLocal();
  if (!userId || !isSupabaseConfigurado) return;

  try {
    await useSyncStore.getState().enfileirarOperacao({
      userId,
      tipo: 'DELETE_TREINO',
      entidadeId: treinoId,
      descricao: `Excluir treino #${treinoId}`,
      payload: {
        local_id: treinoId,
      },
    });

    void processarFilaSincronizacao();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Offline-First] Erro ao enfileirar exclusão de treino:', error);
    }
  }
}

export async function sincronizarPerfilComNuvem(): Promise<void> {
  const userId = obterUsuarioBancoLocal();
  if (!userId || !isSupabaseConfigurado) return;

  try {
    const config = obterConfiguracoesUsuario();
    const lembretes = obterConfiguracaoLembretes();

    await useSyncStore.getState().enfileirarOperacao({
      userId,
      tipo: 'UPSERT_PERFIL',
      entidadeId: 1,
      descricao: 'Atualizar preferências do perfil',
      payload: {
        nome: config.nome_usuario || 'Usuário',
        meta_semanal: config.meta_semanal || 3,
        lembretes_ativo: lembretes.ativo,
        horario_lembretes: config.horario_lembretes ?? '18:00',
        dias_lembretes: config.dias_lembretes ?? 'Seg, Qua e Sex',
        antecedencia_lembrete: lembretes.antecedenciaMinutos,
      },
    });

    void processarFilaSincronizacao();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Offline-First] Erro ao enfileirar atualização de perfil:', error);
    }
  }
}

export async function carregarDadosIniciaisDaNuvem(
  userId: string,
  nomePadrao?: string
): Promise<void> {
  if (!userId || !isSupabaseConfigurado) return;

  try {
    const filaPendente = await useSyncStore.getState().carregarFilaDoUsuario(userId);
    const online = await verificarConexaoReal();

    if (!online) {
      return;
    }

    if (filaPendente.length > 0) {
      await processarFilaSincronizacao();
    }

    const { data: perfilNuvem, error: erroPerfil } = await supabase
      .from('perfis')
      .select('nome, meta_semanal, lembretes_ativo, horario_lembretes, dias_lembretes')
      .eq('id', userId)
      .maybeSingle();

    if (!erroPerfil && perfilNuvem) {
      atualizarConfiguracoesUsuario({
        nome_usuario: perfilNuvem.nome || nomePadrao || 'Usuário',
        meta_semanal: perfilNuvem.meta_semanal ?? 3,
        lembretes_ativo: perfilNuvem.lembretes_ativo ? 1 : 0,
        horario_lembretes: perfilNuvem.horario_lembretes ?? '18:00',
        dias_lembretes: perfilNuvem.dias_lembretes ?? 'Seg, Qua e Sex',
      });
    } else if (nomePadrao) {
      atualizarConfiguracoesUsuario({ nome_usuario: nomePadrao });
      void sincronizarPerfilComNuvem();
    }

    const contagemLocal = db.getAllSync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM treinos;'
    );
    const totalLocal = contagemLocal[0]?.total ?? 0;

    if (totalLocal > 0) {
      return;
    }

    const { data: treinosNuvem, error: erroTreinos } = await supabase
      .from('treinos')
      .select(
        'local_id, nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir'
      )
      .eq('user_id', userId)
      .order('local_id', { ascending: true });

    if (erroTreinos || !treinosNuvem || treinosNuvem.length === 0) {
      useSyncStore.getState().registrarSucessoSincronizacao();
      return;
    }

    const { data: exerciciosNuvem } = await supabase
      .from('exercicios')
      .select('treino_local_id, nome, series, repeticoes, carga, descanso, concluida')
      .eq('user_id', userId)
      .order('id', { ascending: true });

    const exsPorTreino = new Map<number, ExercicioNuvemRow[]>();
    for (const ex of (exerciciosNuvem ?? []) as ExercicioNuvemRow[]) {
      const lista = exsPorTreino.get(ex.treino_local_id) ?? [];
      lista.push(ex);
      exsPorTreino.set(ex.treino_local_id, lista);
    }

    db.withTransactionSync(() => {
      for (const t of treinosNuvem as TreinoNuvemRow[]) {
        const res = db.runSync(
          `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.nome,
            t.data,
            t.duracao ?? 0,
            t.grupo_muscular,
            t.observacoes ?? null,
            t.status ?? 'concluido',
            t.horario ?? null,
            t.repetir ?? 'uma_vez',
          ]
        );
        const novoIdLocal = res.lastInsertRowId;
        const exs = exsPorTreino.get(t.local_id) ?? [];
        for (const ex of exs) {
          db.runSync(
            `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, concluida) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              novoIdLocal,
              ex.nome,
              ex.series,
              ex.repeticoes,
              Number(ex.carga),
              ex.descanso ?? null,
              ex.concluida ?? 0,
            ]
          );
        }
      }
    });

    useSyncStore.getState().registrarSucessoSincronizacao();
  } catch (error) {
    if (__DEV__) {
      console.warn('[Offline-First] Aviso ao restaurar dados da nuvem:', error);
    }
  }
}
