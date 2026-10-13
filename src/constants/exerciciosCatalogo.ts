export type CategoriaExercicio = 
  | 'Todos' 
  | 'Peito' 
  | 'Costas' 
  | 'Pernas' 
  | 'Ombros' 
  | 'Bíceps' 
  | 'Tríceps' 
  | 'Abdômen';

export type ExercicioCatalogo = {
  id: string;
  nome: string;
  grupo: CategoriaExercicio;
};

export const CATEGORIAS_EXERCICIOS: CategoriaExercicio[] = [
  'Todos',
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Abdômen',
];

export const EXERCICIOS_CATALOGO: ExercicioCatalogo[] = [
  { id: '1', nome: 'Supino reto', grupo: 'Peito' },
  { id: '2', nome: 'Supino inclinado', grupo: 'Peito' },
  { id: '3', nome: 'Crucifixo', grupo: 'Peito' },
  { id: '4', nome: 'Puxada alta', grupo: 'Costas' },
  { id: '5', nome: 'Remada baixa', grupo: 'Costas' },
  { id: '6', nome: 'Remada curvada', grupo: 'Costas' },
  { id: '7', nome: 'Agachamento livre', grupo: 'Pernas' },
  { id: '8', nome: 'Leg press', grupo: 'Pernas' },
  { id: '9', nome: 'Cadeira extensora', grupo: 'Pernas' },
  { id: '10', nome: 'Desenvolvimento', grupo: 'Ombros' },
  { id: '11', nome: 'Elevação lateral', grupo: 'Ombros' },
  { id: '12', nome: 'Rosca direta', grupo: 'Bíceps' },
  { id: '13', nome: 'Rosca martelo', grupo: 'Bíceps' },
  { id: '14', nome: 'Tríceps pulley', grupo: 'Tríceps' },
  { id: '15', nome: 'Tríceps testa', grupo: 'Tríceps' },
  { id: '16', nome: 'Prancha abdominal', grupo: 'Abdômen' },
  { id: '17', nome: 'Abdominal supra', grupo: 'Abdômen' },
];