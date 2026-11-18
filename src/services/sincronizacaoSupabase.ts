import { db, obterUsuarioBancoLocal } from '@/database/conexao';
import {
  atualizarConfiguracoesUsuario,
  obterConfiguracoesUsuario,
} from '@/database/configuracoesRepository';
import { obterConfiguracaoLembretes } from '@/database/perfilConsultas';
import type { Exercicio, StatusTreino, Treino } from '@/database/tipos';
import { isSupabaseConfigurado, supabase } from '@/services/supabase';

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

    const { error: erroTreino } = await supabase.from('treinos').upsert(
      {
        user_id: userId,
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
      if (__DEV__) {
        console.warn('[Supabase Sync] Aviso ao sincronizar treino:', erroTreino.message);
      }
      return;
    }

    await supabase
      .from('exercicios')
      .delete()
      .eq('user_id', userId)
      .eq('treino_local_id', treino.id);

    if (exerciciosDoTreino.length > 0) {
      const payload = exerciciosDoTreino.map((ex) => ({
        user_id: userId,
        treino_local_id: treino.id,
        nome: ex.nome,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga: Number(ex.carga),
        descanso: ex.descanso,
        concluida: ex.concluida,
      }));

      const { error: erroEx } = await supabase.from('exercicios').insert(payload);
      if (erroEx && __DEV__) {
        console.warn('[Supabase Sync] Aviso ao sincronizar exercícios:', erroEx.message);
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[Supabase Sync] Falha silenciosa ao sincronizar treino:', error);
    }
  }
}

export async function removerTreinoDaNuvem(treinoId: number): Promise<void> {
  const userId = obterUsuarioBancoLocal();
  if (!userId || !isSupabaseConfigurado) return;

  try {
    await supabase
      .from('treinos')
      .delete()
      .eq('user_id', userId)
      .eq('local_id', treinoId);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Supabase Sync] Falha silenciosa ao remover treino da nuvem:', error);
    }
  }
}

export async function sincronizarPerfilComNuvem(): Promise<void> {
  const userId = obterUsuarioBancoLocal();
  if (!userId || !isSupabaseConfigurado) return;

  try {
    const config = obterConfiguracoesUsuario();
    const lembretes = obterConfiguracaoLembretes();

    await supabase.from('perfis').upsert(
      {
        id: userId,
        nome: config.nome_usuario || 'Usuário',
        meta_semanal: config.meta_semanal || 3,
        lembretes_ativo: lembretes.ativo,
        horario_lembretes: config.horario_lembretes ?? '18:00',
        dias_lembretes: config.dias_lembretes ?? 'Seg, Qua e Sex',
        antecedencia_lembrete: lembretes.antecedenciaMinutos,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[Supabase Sync] Falha silenciosa ao sincronizar perfil:', error);
    }
  }
}

export async function carregarDadosIniciaisDaNuvem(
  userId: string,
  nomePadrao?: string
): Promise<void> {
  if (!userId || !isSupabaseConfigurado) return;

  try {
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
  } catch (error) {
    if (__DEV__) {
      console.warn('[Supabase Sync] Aviso ao restaurar dados da nuvem:', error);
    }
  }
}
