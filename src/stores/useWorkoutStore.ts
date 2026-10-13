import { create } from 'zustand';

export type SerieRascunho = {
  numero: number;
  repeticoes: number;
  carga: number;
};

export type ExercicioRascunho = {
  id: string; 
  exercicioCatalogoId: string;
  nome: string;
  grupo: string;
  series: SerieRascunho[];
  descanso?: number;
};

interface WorkoutStore {
  draftExercises: ExercicioRascunho[];
  addExercise: (exercise: ExercicioRascunho) => void;
  removeExercise: (id: string) => void;
  clearWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  draftExercises: [],
  addExercise: (exercise) =>
    set((state) => ({
      draftExercises: [...state.draftExercises, exercise],
    })),
  removeExercise: (id) =>
    set((state) => ({
      draftExercises: state.draftExercises.filter((e) => e.id !== id),
    })),
  clearWorkout: () => set({ draftExercises: [] }),
}));