import { db } from './conexao';

type ExercicioSeed = {
  nome: string;
  series: number;
  repeticoes: number;
  carga: number;
  descanso: number;
};

type TreinoSeed = {
  nome: string;
  data: string;
  duracao: number;
  grupo_muscular: string;
  observacoes: string;
  exercicios: ExercicioSeed[];
};

function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

export function popularBancoComDadosDeTeste(): void {
  try {
    console.log('[Seed] Iniciando população do banco de dados com dados de teste variados...');

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM exercicios;');
      db.runSync('DELETE FROM treinos;');

      const hoje = new Date(2026, 9, 16);

      const treinosParaInserir: TreinoSeed[] = [];

      const gruposPorSemana = [
        ['Peito', 'Costas', 'Pernas', 'Peito', 'Braços'],
        ['Pernas', 'Costas', 'Peito', 'Ombros', 'Costas'],
        ['Peito', 'Pernas', 'Costas', 'Peito', 'Braços'],
        ['Costas', 'Peito', 'Pernas', 'Ombros', 'Peito'],
        ['Pernas', 'Costas', 'Peito', 'Braços', 'Pernas'],
        ['Peito', 'Costas', 'Pernas', 'Ombros', 'Peito'],
      ];

      const perfilSemana = [
        { repPrincipal: 12, fatorCarga: 1.0, multExercicios: 3, duracaoBase: 45, obs: 'Adaptação e técnica' },
        { repPrincipal: 10, fatorCarga: 1.15, multExercicios: 4, duracaoBase: 55, obs: 'Cargas subindo com consistência' },
        { repPrincipal: 8, fatorCarga: 1.3, multExercicios: 5, duracaoBase: 65, obs: 'Dia de força máxima' },
        { repPrincipal: 15, fatorCarga: 0.95, multExercicios: 2, duracaoBase: 35, obs: 'Deload ativo / dia com fadiga' },
        { repPrincipal: 9, fatorCarga: 1.35, multExercicios: 4, duracaoBase: 50, obs: 'Excelente recuperação e foco' },
        { repPrincipal: 12, fatorCarga: 1.45, multExercicios: 5, duracaoBase: 70, obs: 'Novo pico de volume e cargas batidas' },
      ];

      for (let semana = 1; semana <= 6; semana++) {
        const perfil = perfilSemana[semana - 1];
        const cronogramaGrupos = gruposPorSemana[semana - 1];
        const diasOffsetBase = 42 - (semana - 1) * 7;

        cronogramaGrupos.forEach((grupo, idxTreino) => {
          const diasAtras = diasOffsetBase - idxTreino;
          const dataTreino = new Date(hoje);
          dataTreino.setDate(hoje.getDate() - diasAtras);
          const dataFormatada = formatarData(dataTreino);

          let exercicios: ExercicioSeed[] = [];
          let nomeTreino = '';
          const duracao = perfil.duracaoBase + (idxTreino % 2 === 0 ? 5 : -5);

          const eSegundoTreinoDoGrupoNaSemana = cronogramaGrupos.indexOf(grupo) !== idxTreino;

          if (grupo === 'Peito') {
            const cargaSupino = Math.round(32 * perfil.fatorCarga);
            const cargaInclinado = Math.round(24 * perfil.fatorCarga);
            const cargaCrucifixo = Math.round(14 * perfil.fatorCarga);
            const cargaCross = Math.round(18 * perfil.fatorCarga);

            if (!eSegundoTreinoDoGrupoNaSemana) {
              nomeTreino = `Treino de Peito - Força`;
              exercicios.push(
                { nome: 'Supino reto', series: 1, repeticoes: perfil.repPrincipal, carga: cargaSupino, descanso: 90 },
                { nome: 'Supino reto', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaSupino + 2, descanso: 90 },
                { nome: 'Supino reto', series: 3, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaSupino + 2, descanso: 90 },
                { nome: 'Crucifixo', series: 1, repeticoes: perfil.repPrincipal + 2, carga: cargaCrucifixo, descanso: 60 },
                { nome: 'Crucifixo', series: 2, repeticoes: perfil.repPrincipal, carga: cargaCrucifixo, descanso: 60 }
              );
              if (perfil.multExercicios >= 4) {
                exercicios.push(
                  { nome: 'Supino inclinado', series: 1, repeticoes: perfil.repPrincipal, carga: cargaInclinado, descanso: 60 },
                  { nome: 'Supino inclinado', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaInclinado, descanso: 60 }
                );
              }
            } else {
              nomeTreino = `Treino de Peito - Volume e Isolamento`;
              exercicios.push(
                { nome: 'Supino inclinado', series: 1, repeticoes: perfil.repPrincipal, carga: cargaInclinado, descanso: 60 },
                { nome: 'Supino inclinado', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaInclinado, descanso: 60 },
                { nome: 'Crossover polia', series: 1, repeticoes: 15, carga: cargaCross, descanso: 60 },
                { nome: 'Crossover polia', series: 2, repeticoes: 12, carga: cargaCross + 2, descanso: 60 }
              );
            }
          } else if (grupo === 'Costas') {
            nomeTreino = `Treino de Costas`;
            const cargaPuxada = Math.round(38 * perfil.fatorCarga);
            const cargaRemada = Math.round(32 * perfil.fatorCarga);
            const cargaSerrote = Math.round(20 * perfil.fatorCarga);

            exercicios.push(
              { nome: 'Puxada frontal', series: 1, repeticoes: perfil.repPrincipal, carga: cargaPuxada, descanso: 90 },
              { nome: 'Puxada frontal', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaPuxada + 4, descanso: 90 },
              { nome: 'Puxada frontal', series: 3, repeticoes: Math.max(perfil.repPrincipal - 3, 5), carga: cargaPuxada + 4, descanso: 90 }
            );

            if (perfil.multExercicios >= 3) {
              exercicios.push(
                { nome: 'Remada curvada', series: 1, repeticoes: perfil.repPrincipal, carga: cargaRemada, descanso: 90 },
                { nome: 'Remada curvada', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaRemada + 2, descanso: 90 }
              );
            }

            if (perfil.multExercicios >= 4) {
              exercicios.push(
                { nome: 'Remada serrote', series: 1, repeticoes: perfil.repPrincipal, carga: cargaSerrote, descanso: 60 },
                { nome: 'Remada serrote', series: 2, repeticoes: perfil.repPrincipal, carga: cargaSerrote, descanso: 60 }
              );
            }
          } else if (grupo === 'Pernas') {
            nomeTreino = `Treino de Pernas`;
            const cargaAgachamento = Math.round(45 * perfil.fatorCarga);
            const cargaLegPress = Math.round(110 * perfil.fatorCarga);
            const cargaExtensora = Math.round(35 * perfil.fatorCarga);
            const cargaFlexora = Math.round(30 * perfil.fatorCarga);

            exercicios.push(
              { nome: 'Agachamento livre', series: 1, repeticoes: perfil.repPrincipal, carga: cargaAgachamento, descanso: 120 },
              { nome: 'Agachamento livre', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaAgachamento + 5, descanso: 120 },
              { nome: 'Agachamento livre', series: 3, repeticoes: Math.max(perfil.repPrincipal - 4, 5), carga: cargaAgachamento + 10, descanso: 120 }
            );

            if (perfil.multExercicios >= 3) {
              exercicios.push(
                { nome: 'Leg press', series: 1, repeticoes: perfil.repPrincipal + 2, carga: cargaLegPress, descanso: 90 },
                { nome: 'Leg press', series: 2, repeticoes: perfil.repPrincipal, carga: cargaLegPress + 15, descanso: 90 },
                { nome: 'Cadeira extensora', series: 1, repeticoes: perfil.repPrincipal, carga: cargaExtensora, descanso: 60 },
                { nome: 'Cadeira extensora', series: 2, repeticoes: perfil.repPrincipal, carga: cargaExtensora, descanso: 60 }
              );
            }

            if (perfil.multExercicios >= 5) {
              exercicios.push(
                { nome: 'Mesa flexora', series: 1, repeticoes: 12, carga: cargaFlexora, descanso: 60 },
                { nome: 'Mesa flexora', series: 2, repeticoes: 10, carga: cargaFlexora + 5, descanso: 60 }
              );
            }
          } else if (grupo === 'Ombros') {
            nomeTreino = `Treino de Ombros`;
            const cargaDesenv = Math.round(14 * perfil.fatorCarga);
            const cargaElevacao = Math.round(8 * perfil.fatorCarga);

            exercicios.push(
              { nome: 'Desenvolvimento com halteres', series: 1, repeticoes: perfil.repPrincipal, carga: cargaDesenv, descanso: 90 },
              { nome: 'Desenvolvimento com halteres', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaDesenv + 2, descanso: 90 }
            );

            if (perfil.multExercicios >= 3) {
              exercicios.push(
                { nome: 'Elevação lateral', series: 1, repeticoes: perfil.repPrincipal + 3, carga: cargaElevacao, descanso: 60 },
                { nome: 'Elevação lateral', series: 2, repeticoes: perfil.repPrincipal + 2, carga: cargaElevacao, descanso: 60 }
              );
            }

            if (perfil.multExercicios >= 4) {
              exercicios.push(
                { nome: 'Crucifixo invertido', series: 1, repeticoes: 15, carga: Math.max(cargaElevacao - 2, 4), descanso: 60 }
              );
            }
          } else {
            nomeTreino = `Treino de Braços`;
            const cargaRosca = Math.round(12 * perfil.fatorCarga);
            const cargaTriceps = Math.round(22 * perfil.fatorCarga);

            exercicios.push(
              { nome: 'Rosca direta', series: 1, repeticoes: perfil.repPrincipal, carga: cargaRosca, descanso: 60 },
              { nome: 'Rosca direta', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaRosca + 2, descanso: 60 },
              { nome: 'Tríceps corda', series: 1, repeticoes: perfil.repPrincipal, carga: cargaTriceps, descanso: 60 },
              { nome: 'Tríceps corda', series: 2, repeticoes: Math.max(perfil.repPrincipal - 2, 6), carga: cargaTriceps + 3, descanso: 60 }
            );

            if (perfil.multExercicios >= 4) {
              exercicios.push(
                { nome: 'Rosca martelo', series: 1, repeticoes: 12, carga: cargaRosca + 1, descanso: 60 }
              );
            }
          }

          treinosParaInserir.push({
            nome: nomeTreino,
            data: dataFormatada,
            duracao,
            grupo_muscular: grupo,
            observacoes: `Semana ${semana} - ${perfil.obs}`,
            exercicios,
          });
        });
      }

      for (const t of treinosParaInserir) {
        const res = db.runSync(
          `INSERT INTO treinos (nome, data, duracao, grupo_muscular, observacoes, status, horario, repetir)
           VALUES (?, ?, ?, ?, ?, 'concluido', '18:00', 'uma_vez')`,
          [t.nome, t.data, t.duracao, t.grupo_muscular, t.observacoes]
        );

        const treinoId = res.lastInsertRowId;

        for (const e of t.exercicios) {
          db.runSync(
            `INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, concluida)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [treinoId, e.nome, e.series, e.repeticoes, e.carga, e.descanso]
          );
        }
      }

      db.runSync(`
        INSERT OR IGNORE INTO configuracoes_usuario (id, meta_semanal, nome_usuario, lembretes_ativo, horario_lembretes, dias_lembretes)
        VALUES (1, 3, 'Matheus Silva', 1, '18:00', 'Seg, Qua e Sex');
      `);

      console.log(`[Seed] Sucesso: ${treinosParaInserir.length} treinos variados inseridos nas últimas 6 semanas!`);
    });
  } catch (error) {
    console.error('[Seed] Erro ao popular banco com dados de teste:', error);
  }
}
