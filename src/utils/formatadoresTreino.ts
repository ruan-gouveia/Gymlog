export function formatarCronometro(totalSegundos: number): string {
  const total = Math.max(0, Math.floor(totalSegundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const mm = String(minutos).padStart(2, '0');
  const ss = String(segundos).padStart(2, '0');
  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatarVolume(kg: number): string {
  return `${Math.round(kg).toLocaleString('pt-BR')} kg`;
}

export function formatarCarga(carga: number): string {
  return String(carga).replace('.', ',');
}