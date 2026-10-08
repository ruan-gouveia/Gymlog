import { openDatabaseSync } from 'expo-sqlite';

import { NOME_BANCO, initDatabase, inicializarBanco } from './initDatabase';

export const db = openDatabaseSync(NOME_BANCO);
db.execSync('PRAGMA foreign_keys = ON;');

export { NOME_BANCO, initDatabase, inicializarBanco };
export * from './tipos';
