import type { Treino } from ".";
import { db } from ".";

export type TreinoResumo = Pick<Treino, 'id' | 'nome' | 'grupo_muscular' | 'data' | 'duracao' > & {
    total_exercicios: number;
    volume: number;
};

export function listarTreinos(): TreinoResumo[] {
    return db.getAllSync<TreinoResumo>(
        `
    SELECT
      t.id,
      t.nome,
      t.grupo_muscular,
      t.data,
      t.duracao,
      COUNT(DISTINCT e.nome) AS total_exercicios,
      COALESCE(SUM(e.repeticoes * e.carga), 0) AS volume
    FROM treinos t
    LEFT JOIN exercicios e ON e.treino_id = t.id
    GROUP BY t.id
    ORDER BY
      substr(t.data, 7, 4) || substr(t.data, 4, 2) || substr(t.data, 1, 2) DESC,
      t.id DESC
  `
    );

}

export type SerieDetalhe ={
    id: number;
    numero: number;
    repeticoes: number;
    carga: number;
};

export type ExercicioDetalhe ={
    nome: string;
    series: SerieDetalhe[];

};

export type TreinoDetalhe = Treino &{
    exercicios: ExercicioDetalhe[];
    total_series: number;
    volume: number;
};

type LinhaTreinoExercicio = Treino & {
    exercicio_id: number | null;
    exercicio_nome: string | null;
    numero_serie: number | null;
    repeticoes: number | null;
    carga: number | null;
};

export function buscarTreinoPorId(id: number): TreinoDetalhe | null {
    const linhas = db.getAllSync<LinhaTreinoExercicio>(
        `SELECT
            t.id, t.nome, t.data, t.duracao, t.grupo_muscular, t.observacoes,
            e.id AS exercicio_id,
            e.nome AS exercicio_nome,
            e.series AS numero_serie,
            e.repeticoes,
            e.carga
        FROM treinos t
        LEFT JOIN exercicios e ON e.treino_id = t.id
        WHERE t.id = ?
        ORDER BY e.id ASC`,
        [id]
    );

    if (linhas.length === 0)return null;

    const exercicios: ExercicioDetalhe[] = [];
    let volume = 0;
    let totalSeries = 0;
    
    for (const l of linhas){
        if (l.exercicio_id === null) continue;
        
        const serie: SerieDetalhe = {
            id: l.exercicio_id,
            numero: l.numero_serie!,
            repeticoes: l.repeticoes!,
            carga: l.carga!,
        };

        volume += serie.repeticoes * serie.carga;
        totalSeries += 1;

        const ultimo = exercicios[exercicios.length - 1];
        if (ultimo && ultimo.nome === l.exercicio_nome) {
            ultimo.series.push(serie);
        } else {
            exercicios.push({nome: l.exercicio_nome!, series: [serie]});
        }
    }

    const {id: treinoId, nome, data, duracao, grupo_muscular, observacoes} = linhas[0];
    return {
        id: treinoId, nome, data, duracao, grupo_muscular, observacoes, exercicios,
        total_series: totalSeries, volume
    };
} 

