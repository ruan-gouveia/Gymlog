import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

export const NOME_BANCO = 'gymlog.db';

export const SCRIPT_CRIACAO_TABELAS = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS treinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data TEXT NOT NULL,
    duracao INTEGER NOT NULL,
    grupo_muscular TEXT NOT NULL,
    observacoes TEXT
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treino_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    series INTEGER NOT NULL,
    repeticoes INTEGER NOT NULL,
    carga REAL NOT NULL,
    descanso INTEGER,
    FOREIGN KEY (treino_id) REFERENCES treinos (id) ON DELETE CASCADE
  );
`;

export function initDatabase(dbInstancia?: SQLiteDatabase): void {
  const db = dbInstancia ?? openDatabaseSync(NOME_BANCO);

  try {
    db.execSync(SCRIPT_CRIACAO_TABELAS);
    console.log('[SQLite] Banco de dados e tabelas inicializados com sucesso.');
    const tabelas = db.getAllSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
    );
    console.log('[SQLite] Tabelas encontradas no banco:', tabelas);
  } catch (error) {
    console.error('[SQLite] Erro ao inicializar tabelas no banco de dados:', error);
    throw error;
  }
}

export const inicializarBanco = initDatabase;
