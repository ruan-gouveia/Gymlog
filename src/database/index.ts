import * as SQLite from 'expo-sqlite';

export const NOME_BANCO = 'gymlog.db';

export const db = SQLite.openDatabaseSync(NOME_BANCO);

export function inicializarBanco(): void {
  db.execSync('PRAGMA foreign_keys = ON;');
}
