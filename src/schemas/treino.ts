import { Exercicio, Treino } from "@/database";
import type { ExercicioInput, TreinoInput } from "@/database/treinos";
import { z } from "zod";

const inteiroPositivo = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine(
    (v) => /^\d+$/.test(v) && Number(v) > 0,
    "Informe um inteiro maior que 0",
  );

const carga = z
  .string()
  .trim()
  .min(1, "Obrigatório")
  .refine((v) => {
    const n = Number(v.replace(",", "."));
    return !Number.isNaN(n) && n >= 0;
  }, "Carga inválida");

const dataValida = z
  .string()
  .trim()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato DD/MM/AAAA")
  .refine((v) => {
    const [d, m, a] = v.split("/").map(Number);
    const dt = new Date(a, m - 1, d);
    return (
      dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === d
    );
  }, "Data inexistente");

export const treinoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do treino"),
  data: dataValida,
  duracao: inteiroPositivo,
  grupo_muscular: z.string().trim().min(1, "Informe o grupo muscular"),
  observacoes: z.string().optional(),
  exercicios: z
    .array(
      z.object({
        dbId: z.number().optional(),
        nome: z.string().trim().min(1, "Nome obrigatório"),
        series: inteiroPositivo,
        repeticoes: inteiroPositivo,
        carga,
      }),
    )
    .min(1, "Adicione ao menos um exercício"),
});

export type TreinoFormValues = z.infer<typeof treinoSchema>;

export function paraFormValue(
  treino: Treino,
  exercicios: Exercicio[],
): TreinoFormValues {
  return {
    nome: treino.nome,
    data: treino.data,
    duracao: String(treino.duracao),
    grupo_muscular: treino.grupo_muscular,
    observacoes: treino.observacoes ?? "",
    exercicios: exercicios.map((e) => ({
      dbId: e.id,
      nome: e.nome,
      series: String(e.series),
      repeticoes: String(e.repeticoes),
      carga: String(e.carga),
    })),
  };
}

export function paraPayload(v: TreinoFormValues): {
  treino: TreinoInput;
  exercicios: ExercicioInput[];
} {
  return {
    treino: {
      nome: v.nome.trim(),
      data: v.data.trim(),
      duracao: Number(v.duracao),
      grupo_muscular: v.grupo_muscular.trim(),
      observacoes: v.observacoes?.trim() ? v.observacoes.trim() : null,
    },
    exercicios: v.exercicios.map((e) => ({
      id: e.dbId,
      nome: e.nome.trim(),
      series: Number(e.series),
      repeticoes: Number(e.repeticoes),
      carga: Number(e.carga.replace(",", ".")),
    })),
  };
}
