export function formatarNumero(valor: number): string {
  const [inteiro, decimal] = String(Math.round(valor * 10) / 10).split('.');
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decimal ? `${comMilhar},${decimal}` : comMilhar;
}

export const formatarVolume = (valor: number) => `${formatarNumero(valor)} kg`;

export function formatarDuracao(minutos: number) : string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h === 0 ? `${m}min` : `${h}h ${String(m).padStart(2, '0')}min`;
}

export function formatarData(data: string): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : data;
}


export function resumirSeries(series: {repeticoes: number, carga: number}[]) : string {
    const primeira = series[0];
    const uniforme = series.every(
    (s) => s.repeticoes === primeira.repeticoes && s.carga === primeira.carga
  );
  if (uniforme) {
    return `${series.length} × ${primeira.repeticoes} | ${formatarNumero(primeira.carga)} kg`;
  }
  return series.map((s) => `${s.repeticoes}×${formatarNumero(s.carga)}kg`).join(' · ');
}


