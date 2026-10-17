export const coresClaras = {
  fundo: '#FFFFFF',
  superficie: '#FFFFFF',
  superficieElevada: '#F8FAFC',
  borda: '#E2E8F0',
  primaria: '#5C7CFA',
  primariaSuave: '#EEF2FF',
  texto: '#0F172A',
  textoSecundario: '#64748B',
  textoInativo: '#94A3B8',
  sucesso: '#16A34A',
  perigo: '#EF4444',
} as const;

export const coresEscuras = {
  fundo: '#11122B',
  superficie: '#1B1D3A',
  superficieElevada: '#24274D',
  borda: '#2E3160',
  primaria: '#5C7CFA',
  primariaSuave: '#2A2E66',
  texto: '#F3F4FF',
  textoSecundario: '#A3A6CC',
  textoInativo: '#6E7199',
  sucesso: '#4ADE9B',
  perigo: '#F2677A',
} as const;

export function obterCoresTema(ehEscuro: boolean) {
  return ehEscuro ? coresEscuras : coresClaras;
}

// Mantido para compatibilidade imediata com estilos legados
export const cores = coresClaras;

export const espacamento = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const raios = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const tipografia = {
  titulo: 26,
  subtitulo: 18,
  corpo: 15,
  legenda: 12,
} as const;
