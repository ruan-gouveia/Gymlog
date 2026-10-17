import { openDatabaseSync } from 'expo-sqlite';

import { NOME_BANCO } from './initDatabase';

export const db = openDatabaseSync(NOME_BANCO);
db.execSync('PRAGMA foreign_keys = ON;');
