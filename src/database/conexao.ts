import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const NOME_BANCO = 'gymlog_v2.db';

const cacheBancos = new Map<string, SQLiteDatabase>();
let usuarioAtualId: string | null = null;

export function obterNomeArquivoBanco(userId: string | null = usuarioAtualId): string {
  if (!userId || !userId.trim()) {
    return 'gymlog_anon_v2.db';
  }
  const limpo = userId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  return `gymlog_user_${limpo}.db`;
}

function obterInstanciaAtiva(): SQLiteDatabase {
  const nomeArquivo = obterNomeArquivoBanco(usuarioAtualId);
  const existente = cacheBancos.get(nomeArquivo);
  if (existente) {
    return existente;
  }

  const novaInstancia = openDatabaseSync(nomeArquivo);
  novaInstancia.execSync('PRAGMA foreign_keys = ON;');
  cacheBancos.set(nomeArquivo, novaInstancia);
  return novaInstancia;
}

export function definirUsuarioBancoLocal(userId: string | null): void {
  const novoId = userId?.trim() || null;
  if (usuarioAtualId === novoId && cacheBancos.has(obterNomeArquivoBanco(novoId))) {
    return;
  }
  usuarioAtualId = novoId;
  obterInstanciaAtiva();
}

export function obterUsuarioBancoLocal(): string | null {
  return usuarioAtualId;
}

export const db = new Proxy({} as SQLiteDatabase, {
  get(_target, prop, _receiver) {
    const instancia = obterInstanciaAtiva();
    const valor = Reflect.get(instancia, prop, instancia);
    if (typeof valor === 'function') {
      return valor.bind(instancia);
    }
    return valor;
  },
});
