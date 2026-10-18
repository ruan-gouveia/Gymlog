import { db } from './conexao';

type ExercicioSeed = {
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number;
  concluida?: number;
};

type TreinoSeed = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string;
  status: 'concluido' | 'agendado' | 'nao_realizado';
  horario: string;
  repetir: 'uma_vez' | 'semanalmente';
  exercicios: ExercicioSeed[];
};

function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function adicionarDias(base: Date, dias: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0);
  d.setDate(d.getDate() + dias);
  return d;
}

function construirExerciciosDoGrupo(
  grupo: string,
  fatorCarga: number,
  repBase: number,
  nivelVolume: number,
  variante: number
): { nomeTreino: string; exercicios: ExercicioSeed[] } {
  const oscilacaoCarga = (variante % 3) - 1; // -1, 0, +1
  const oscilacaoRep = variante % 2 === 0 ? 0 : 1;

  if (grupo === 'Peito') {
    const supino = Math.max(20, Math.round(30 * fatorCarga) + oscilacaoCarga * 2);
    const inclinado = Math.max(14, Math.round(22 * fatorCarga) + oscilacaoCarga);
    const crucifixo = Math.max(10, Math.round(13 * fatorCarga) + oscilacaoCarga);
    const cross = Math.max(12, Math.round(16 * fatorCarga) + oscilacaoCarga * 2);

    const exercicios: ExercicioSeed[] = [
      { nome: 'Supino reto', series: 1, repeticoes: repBase + oscilacaoRep, carga: supino - 2, descanso: 90 },
      { nome: 'Supino reto', series: 2, repeticoes: repBase, carga: supino, descanso: 90 },
      { nome: 'Supino reto', series: 3, repeticoes: Math.max(repBase - 2, 5), carga: supino + 2, descanso: 120 },
      { nome: 'Supino inclinado', series: 1, repeticoes: repBase + 1, carga: inclinado, descanso: 75 },
      { nome: 'Supino inclinado', series: 2, repeticoes: repBase - 1, carga: inclinado + 2, descanso: 75 },
      { nome: 'Crucifixo', series: 1, repeticoes: repBase + 2, carga: crucifixo, descanso: 60 },
      { nome: 'Crucifixo', series: 2, repeticoes: repBase + 1, carga: crucifixo, descanso: 60 },
    ];

    if (nivelVolume >= 4) {
      exercicios.push(
        { nome: 'Crossover polia', series: 1, repeticoes: 14, carga: cross, descanso: 60 },
        { nome: 'Crossover polia', series: 2, repeticoes: 12, carga: cross + 2, descanso: 60 }
      );
    }
    if (nivelVolume >= 5) {
      exercicios.push(
        { nome: 'Supino reto', series: 4, repeticoes: Math.max(repBase - 3, 5), carga: supino + 4, descanso: 120 }
      );
    }

    return {
      nomeTreino: variante % 2 === 0 ? 'Treino A - Peito e Peitoral Superior' : 'Treino de Peito - Força e Volume',
      exercicios,
    };
  }

  if (grupo === 'Costas') {
    const puxada = Math.max(28, Math.round(36 * fatorCarga) + oscilacaoCarga * 2);
    const remada = Math.max(24, Math.round(30 * fatorCarga) + oscilacaoCarga * 2);
    const serrote = Math.max(14, Math.round(18 * fatorCarga) + oscilacaoCarga);

    const exercicios: ExercicioSeed[] = [
      { nome: 'Puxada frontal', series: 1, repeticoes: repBase + 1, carga: puxada - 2, descanso: 90 },
      { nome: 'Puxada frontal', series: 2, repeticoes: repBase, carga: puxada, descanso: 90 },
      { nome: 'Puxada frontal', series: 3, repeticoes: Math.max(repBase - 2, 6), carga: puxada + 4, descanso: 90 },
      { nome: 'Remada curvada', series: 1, repeticoes: repBase, carga: remada, descanso: 90 },
      { nome: 'Remada curvada', series: 2, repeticoes: Math.max(repBase - 2, 6), carga: remada + 2, descanso: 90 },
    ];

    if (nivelVolume >= 3) {
      exercicios.push(
        { nome: 'Remada serrote', series: 1, repeticoes: repBase + 1, carga: serrote, descanso: 60 },
        { nome: 'Remada serrote', series: 2, repeticoes: repBase, carga: serrote + 2, descanso: 60 }
      );
    }
    if (nivelVolume >= 5) {
      exercicios.push(
        { nome: 'Remada curvada', series: 3, repeticoes: Math.max(repBase - 3, 5), carga: remada + 4, descanso: 90 }
      );
    }

    return {
      nomeTreino: variante % 2 === 0 ? 'Treino B - Costas e Dorsal' : 'Treino de Costas - Espessura e Tração',
      exercicios,
    };
  }

  if (grupo === 'Pernas') {
    const agacho = Math.max(35, Math.round(44 * fatorCarga) + oscilacaoCarga * 3);
    const leg = Math.max(80, Math.round(105 * fatorCarga) + oscilacaoCarga * 5);
    const extensora = Math.max(25, Math.round(32 * fatorCarga) + oscilacaoCarga * 2);
    const flexora = Math.max(22, Math.round(28 * fatorCarga) + oscilacaoCarga * 2);

    const exercicios: ExercicioSeed[] = [
      { nome: 'Agachamento livre', series: 1, repeticoes: repBase + 1, carga: agacho - 4, descanso: 120 },
      { nome: 'Agachamento livre', series: 2, repeticoes: repBase, carga: agacho, descanso: 120 },
      { nome: 'Agachamento livre', series: 3, repeticoes: Math.max(repBase - 2, 5), carga: agacho + 6, descanso: 120 },
      { nome: 'Leg press', series: 1, repeticoes: repBase + 2, carga: leg, descanso: 90 },
      { nome: 'Leg press', series: 2, repeticoes: repBase, carga: leg + 10, descanso: 90 },
      { nome: 'Cadeira extensora', series: 1, repeticoes: repBase + 2, carga: extensora, descanso: 60 },
      { nome: 'Cadeira extensora', series: 2, repeticoes: repBase, carga: extensora + 3, descanso: 60 },
    ];

    if (nivelVolume >= 4) {
      exercicios.push(
        { nome: 'Mesa flexora', series: 1, repeticoes: 12 + oscilacaoRep, carga: flexora, descanso: 60 },
        { nome: 'Mesa flexora', series: 2, repeticoes: 10 + oscilacaoRep, carga: flexora + 4, descanso: 60 }
      );
    }

    return {
      nomeTreino: variante % 2 === 0 ? 'Treino C - Pernas Completo' : 'Treino de Pernas - Quadríceps e Posterior',
      exercicios,
    };
  }

  if (grupo === 'Ombros') {
    const desenv = Math.max(10, Math.round(14 * fatorCarga) + oscilacaoCarga);
    const elevacao = Math.max(6, Math.round(8 * fatorCarga) + (variante % 2));
    const invertido = Math.max(5, Math.round(7 * fatorCarga));

    const exercicios: ExercicioSeed[] = [
      { nome: 'Desenvolvimento com halteres', series: 1, repeticoes: repBase + 1, carga: desenv, descanso: 90 },
      { nome: 'Desenvolvimento com halteres', series: 2, repeticoes: repBase, carga: desenv + 2, descanso: 90 },
      { nome: 'Desenvolvimento com halteres', series: 3, repeticoes: Math.max(repBase - 2, 6), carga: desenv + 3, descanso: 90 },
      { nome: 'Elevação lateral', series: 1, repeticoes: repBase + 4, carga: elevacao, descanso: 60 },
      { nome: 'Elevação lateral', series: 2, repeticoes: repBase + 2, carga: elevacao + 1, descanso: 60 },
    ];

    if (nivelVolume >= 4) {
      exercicios.push(
        { nome: 'Crucifixo invertido', series: 1, repeticoes: 15, carga: invertido, descanso: 60 },
        { nome: 'Crucifixo invertido', series: 2, repeticoes: 12, carga: invertido + 2, descanso: 60 }
      );
    }

    return {
      nomeTreino: 'Treino D - Ombros e Deltoides',
      exercicios,
    };
  }

  // Braços
  const rosca = Math.max(8, Math.round(11 * fatorCarga) + oscilacaoCarga);
  const triceps = Math.max(14, Math.round(20 * fatorCarga) + oscilacaoCarga * 2);
  const martelo = Math.max(8, Math.round(12 * fatorCarga) + oscilacaoCarga);

  const exercicios: ExercicioSeed[] = [
    { nome: 'Rosca direta', series: 1, repeticoes: repBase + 1, carga: rosca, descanso: 60 },
    { nome: 'Rosca direta', series: 2, repeticoes: repBase, carga: rosca + 2, descanso: 60 },
    { nome: 'Rosca direta', series: 3, repeticoes: Math.max(repBase - 2, 6), carga: rosca + 3, descanso: 60 },
    { nome: 'Tríceps corda', series: 1, repeticoes: repBase + 2, carga: triceps, descanso: 60 },
    { nome: 'Tríceps corda', series: 2, repeticoes: repBase, carga: triceps + 3, descanso: 60 },
    { nome: 'Rosca martelo', series: 1, repeticoes: 12, carga: martelo, descanso: 60 },
  ];

  if (nivelVolume >= 4) {
    exercicios.push(
      { nome: 'Rosca martelo', series: 2, repeticoes: 10, carga: martelo + 2, descanso: 60 },
      { nome: 'Tríceps corda', series: 3, repeticoes: Math.max(repBase - 2, 8), carga: triceps + 5, descanso: 60 }
    );
  }

  return {
    nomeTreino: 'Treino E - Bíceps e Tríceps',
    exercicios,
  };
}

export function popularBancoComDadosDeTeste(forcarReset = false): void {
  try {
    if (!forcarReset) {
      const existentes = db.getAllSync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM treinos;'
      );
      const totalExistente = existentes[0]?.total ?? 0;
      if (totalExistente >= 95) {
        console.log('[Seed] Seed semestral (6 meses) já aplicado no banco. Mantendo dados locais.');
        return;
      }
      if (totalExistente > 0) {
        console.log(
          `[Seed] Banco atual contém ${totalExistente} treinos (seed antigo). Limpando banco para inserir histórico completo de 6 meses...`
        );
      }
    }

    console.log('[Seed] Iniciando limpeza do SQLite e população com dados realistas de 6 meses...');

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM exercicios;');
      db.runSync('DELETE FROM treinos;');
      db.runSync('DELETE FROM configuracoes_usuario;');

      try {
        db.runSync("DELETE FROM sqlite_sequence WHERE name IN ('treinos', 'exercicios');");
      } catch {
        // Ignora caso sqlite_sequence ainda não exista
      }

      const hoje = new Date();
      const domingoAtual = adicionarDias(hoje, -hoje.getDay());

      const treinosParaInserir: TreinoSeed[] = [];

      // Rotação variada de grupos musculares ao longo das 26 semanas (6 meses)
      const gradesSemanais: { diaSemana: number; grupo: string; horario: string }[][] = [
        [
          { diaSemana: 1, grupo: 'Peito', horario: '18:30' },
          { diaSemana: 2, grupo: 'Costas', horario: '19:00' },
          { diaSemana: 4, grupo: 'Pernas', horario: '18:00' },
          { diaSemana: 6, grupo: 'Ombros', horario: '10:30' },
        ],
        [
          { diaSemana: 1, grupo: 'Costas', horario: '18:00' },
          { diaSemana: 2, grupo: 'Peito', horario: '18:30' },
          { diaSemana: 4, grupo: 'Pernas', horario: '19:00' },
          { diaSemana: 5, grupo: 'Braços', horario: '18:30' },
        ],
        [
          { diaSemana: 1, grupo: 'Peito', horario: '18:30' },
          { diaSemana: 2, grupo: 'Pernas', horario: '18:00' },
          { diaSemana: 3, grupo: 'Costas', horario: '19:00' },
          { diaSemana: 5, grupo: 'Ombros', horario: '18:30' },
          { diaSemana: 6, grupo: 'Braços', horario: '11:00' },
        ],
        [
          { diaSemana: 1, grupo: 'Pernas', horario: '18:00' },
          { diaSemana: 3, grupo: 'Peito', horario: '19:00' },
          { diaSemana: 4, grupo: 'Costas', horario: '18:30' },
          { diaSemana: 6, grupo: 'Peito', horario: '10:00' },
        ],
        [
          { diaSemana: 1, grupo: 'Peito', horario: '18:30' },
          { diaSemana: 2, grupo: 'Costas', horario: '18:30' },
          { diaSemana: 3, grupo: 'Pernas', horario: '19:00' },
          { diaSemana: 5, grupo: 'Ombros', horario: '18:00' },
          { diaSemana: 6, grupo: 'Costas', horario: '10:30' },
        ],
      ];

      // 25 semanas anteriores completas (Semanas 1 a 25)
      for (let indiceSemana = 25; indiceSemana >= 1; indiceSemana--) {
        const numeroSemana = 26 - indiceSemana; // 1 .. 25
        const domingoDaSemana = adicionarDias(domingoAtual, -indiceSemana * 7);

        // Periodização realista ao longo de 6 meses com ondas de carga, volume e repetições
        const progressoLinear = (numeroSemana - 1) / 25; // 0.0 -> 0.96
        const ehSemanaDeload = numeroSemana === 8 || numeroSemana === 16 || numeroSemana === 24;
        const ehSemanaChoque = numeroSemana === 7 || numeroSemana === 12 || numeroSemana === 20 || numeroSemana === 23;

        let fatorCarga = 0.88 + progressoLinear * 0.62;
        if (ehSemanaDeload) fatorCarga -= 0.08;
        if (ehSemanaChoque) fatorCarga += 0.05;

        const cicloReps = [12, 10, 8, 11, 9, 14, 7, 10];
        const repBase = ehSemanaDeload
          ? 14
          : ehSemanaChoque
          ? 7
          : cicloReps[numeroSemana % cicloReps.length];

        const nivelVolume = ehSemanaDeload
          ? 2
          : ehSemanaChoque
          ? 5
          : 3 + (numeroSemana % 3);

        // Na última semana completa (indiceSemana === 1), garante 6 dias de treino variados (Seg a Sáb)
        // para que o gráfico de 7 Dias em Estatísticas fique rico e bem distribuído
        const cronograma =
          indiceSemana === 1
            ? [
                { diaSemana: 1, grupo: 'Peito', horario: '18:30' },
                { diaSemana: 2, grupo: 'Costas', horario: '19:00' },
                { diaSemana: 3, grupo: 'Pernas', horario: '18:00' },
                { diaSemana: 4, grupo: 'Ombros', horario: '18:30' },
                { diaSemana: 5, grupo: 'Braços', horario: '19:00' },
                { diaSemana: 6, grupo: 'Pernas', horario: '10:30' },
              ]
            : gradesSemanais[numeroSemana % gradesSemanais.length];

        cronograma.forEach((slot, idxSlot) => {
          const dataTreino = adicionarDias(domingoDaSemana, slot.diaSemana);
          const { nomeTreino, exercicios } = construirExerciciosDoGrupo(
            slot.grupo,
            fatorCarga + idxSlot * 0.015,
            repBase,
            nivelVolume,
            numeroSemana + idxSlot
          );

          const duracaoBase = ehSemanaDeload ? 42 : ehSemanaChoque ? 68 : 54;
          const duracao = duracaoBase + ((numeroSemana + idxSlot) % 4) * 4 - 4;

          const faseNome =
            numeroSemana <= 4
              ? 'Adaptação e Base'
              : numeroSemana <= 9
              ? 'Hipertrofia Estrutural I'
              : numeroSemana <= 14
              ? 'Força e Densidade'
              : numeroSemana <= 19
              ? 'Volume Metabólico'
              : numeroSemana <= 23
              ? 'Hipertrofia Avançada II'
              : 'Pico de Performance';

          treinosParaInserir.push({
            nome: nomeTreino,
            data: formatarData(dataTreino),
            duracao,
            grupo_muscular: slot.grupo,
            observacoes: `Semana ${numeroSemana} (${faseNome}) - ${
              ehSemanaDeload
                ? 'Semana regenerativa e ajuste técnico'
                : ehSemanaChoque
                ? 'Progressão máxima de carga e alta intensidade'
                : 'Execução controlada e boa recuperação entre séries'
            }`,
            status: 'concluido',
            horario: slot.horario,
            repetir: 'semanalmente',
            exercicios,
          });
        });
      }

      // Se a semana atual já avançou além de domingo, adiciona treinos concluídos nos dias anteriores da semana atual
      const diaSemanaHoje = hoje.getDay();
      for (let d = 1; d < diaSemanaHoje; d++) {
        if (d === 1 || d === 2 || d === 4 || d === 5) {
          const grupoDia = d === 1 ? 'Peito' : d === 2 ? 'Costas' : d === 4 ? 'Pernas' : 'Ombros';
          const dataDia = adicionarDias(domingoAtual, d);
          const { nomeTreino, exercicios } = construirExerciciosDoGrupo(
            grupoDia,
            1.52,
            9,
            5,
            26 + d
          );
          treinosParaInserir.push({
            nome: nomeTreino,
            data: formatarData(dataDia),
            duracao: 62,
            grupo_muscular: grupoDia,
            observacoes: 'Semana 26 (Pico de Performance) - Ritmo forte na semana atual',
            status: 'concluido',
            horario: '18:30',
            repetir: 'semanalmente',
            exercicios,
          });
        }
      }

      // 1. Treino concluído hoje cedo (para contabilizar na meta da semana atual e histórico recente)
      const { exercicios: exsHojeConcluido } = construirExerciciosDoGrupo('Peito', 1.54, 8, 5, 27);
      treinosParaInserir.push({
        nome: 'Treino de Peito - Força e PR',
        data: formatarData(hoje),
        duracao: 64,
        grupo_muscular: 'Peito',
        observacoes: 'Semana 26 - Novo recorde pessoal no supino reto!',
        status: 'concluido',
        horario: '09:00',
        repetir: 'semanalmente',
        exercicios: exsHojeConcluido,
      });

      // 2. Treino Pendente (ontem às 18:00 com status 'agendado' -> exibido na seção Pendentes da tela inicial)
      const ontem = adicionarDias(hoje, -1);
      const { exercicios: exsPendente } = construirExerciciosDoGrupo('Ombros', 1.48, 10, 4, 25);
      treinosParaInserir.push({
        nome: 'Treino de Ombros e Trapézio',
        data: formatarData(ontem),
        duracao: 50,
        grupo_muscular: 'Ombros',
        observacoes: 'Sessão focada em deltoide lateral e posterior',
        status: 'agendado',
        horario: '18:00',
        repetir: 'uma_vez',
        exercicios: exsPendente.map((e) => ({ ...e, concluida: 0 })),
      });

      // 3. Treino Agendado para Hoje à noite (23:30 -> exibido na seção Hoje com botão "Iniciar treino")
      const { exercicios: exsHojeAgendado } = construirExerciciosDoGrupo('Braços', 1.5, 10, 4, 26);
      treinosParaInserir.push({
        nome: 'Treino de Bíceps e Tríceps',
        data: formatarData(hoje),
        duracao: 48,
        grupo_muscular: 'Braços',
        observacoes: 'Sessão complementar de braços e antebraço',
        status: 'agendado',
        horario: '23:30',
        repetir: 'semanalmente',
        exercicios: exsHojeAgendado.map((e) => ({ ...e, concluida: 0 })),
      });

      // 4. Próximos treinos agendados na semana (para preencher "Próximo treino" e a agenda horizontal)
      const amanha = adicionarDias(hoje, 1);
      const { exercicios: exsAmanha } = construirExerciciosDoGrupo('Costas', 1.52, 9, 4, 27);
      treinosParaInserir.push({
        nome: 'Treino B - Costas e Dorsal',
        data: formatarData(amanha),
        duracao: 58,
        grupo_muscular: 'Costas',
        observacoes: 'Foco em puxadas pesadas e remada curvada',
        status: 'agendado',
        horario: '18:30',
        repetir: 'semanalmente',
        exercicios: exsAmanha.map((e) => ({ ...e, concluida: 0 })),
      });

      const daquiTresDias = adicionarDias(hoje, 3);
      const { exercicios: exsFuturo } = construirExerciciosDoGrupo('Pernas', 1.52, 8, 5, 28);
      treinosParaInserir.push({
        nome: 'Treino C - Pernas Completo',
        data: formatarData(daquiTresDias),
        duracao: 65,
        grupo_muscular: 'Pernas',
        observacoes: 'Agachamento livre e leg press pesado',
        status: 'agendado',
        horario: '19:00',
        repetir: 'semanalmente',
        exercicios: exsFuturo.map((e) => ({ ...e, concluida: 0 })),
      });

      for (const t of treinosParaInserir) {
        const res = db.runSync(
          `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.nome,
            t.data,
            t.duracao,
            t.grupo_muscular,
            t.observacoes,
            t.status,
            t.horario,
            t.repetir,
          ]
        );

        const treinoId = res.lastInsertRowId;

        for (const e of t.exercicios) {
          db.runSync(
            `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, concluida)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              treinoId,
              e.nome,
              e.series,
              e.repeticoes,
              e.carga,
              e.descanso,
              e.concluida ?? (t.status === 'concluido' ? 1 : 0),
            ]
          );
        }
      }

      db.runSync(`
        INSERT OR IGNORE INTO configuracoes_usuario (id, meta_semanal, nome_usuario, lembretes_ativo, horario_lembretes, dias_lembretes, antecedencia_lembrete)
        VALUES (1, 4, 'Usuário', 1, '18:30', 'Seg, Ter, Qui e Sex', 30);
      `);

      console.log(
        `[Seed] Sucesso: banco limpo e populado com ${treinosParaInserir.length} treinos distribuídos nos últimos 6 meses!`
      );
    });
  } catch (error) {
    console.error('[Seed] Erro ao popular banco com dados de teste:', error);
  }
}
