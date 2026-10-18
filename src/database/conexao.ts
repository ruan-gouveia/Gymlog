import { openDatabaseSync } from 'expo-sqlite';

export const NOME_BANCO = 'gymlog.db';

export const db = openDatabaseSync(NOME_BANCO);
db.execSync('PRAGMA foreign_keys = ON;');
