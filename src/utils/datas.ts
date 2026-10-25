const REGEX_DATA_BR = /^\d{2}\/\d{2}\/\d{4}$/;

export function dataBrParaDate(valor: string): Date | null {
  const texto = valor.trim();
  if (!REGEX_DATA_BR.test(texto)) return null;

  const [dia, mes, ano] = texto.split('/').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const valida =
    data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
  return valida ? data : null;
}

export function dateParaDataBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}


export function dateParaChave(data: Date): number {
  return data.getFullYear() * 10000 + (data.getMonth() + 1) * 100 + data.getDate();
}

export function dataBrParaChave(valor: string): number | null {
  const data = dataBrParaDate(valor);
  return data ? dateParaChave(data) : null;
}