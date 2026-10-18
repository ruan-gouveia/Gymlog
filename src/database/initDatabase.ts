import type { SQLiteDatabase } from 'expo-sqlite';
import { db as dbPadrao } from './conexao';

export const NOME_BANCO = 'gymlog.db';

export const SCRIPT_CRIACAO_TABELAS = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS treinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    data TEXT NOT NULL,
    duracao INTEGER NOT NULL,
    grupo_muscular TEXT NOT NULL,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'concluido',
    horario TEXT,
    repetir TEXT DEFAULT 'uma_vez'
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treino_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    series INTEGER NOT NULL,
    repeticoes INTEGER NOT NULL,
    carga REAL NOT NULL,
    descanso INTEGER,
    concluida INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (treino_id) REFERENCES treinos (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS configuracoes_usuario (
    id INTEGER PRIMARY KEY DEFAULT 1,
    meta_semanal INTEGER NOT NULL DEFAULT 3,
    nome_usuario TEXT NOT NULL DEFAULT 'Usuário',
    lembretes_ativo INTEGER NOT NULL DEFAULT 1,
    horario_lembretes TEXT DEFAULT '18:00',
    dias_lembretes TEXT DEFAULT 'Seg, Qua e Sex',
    antecedencia_lembrete INTEGER NOT NULL DEFAULT 30
  );
`;

export function migrarBanco(db: SQLiteDatabase): void {
  try {
    const colunasTreinos = db.getAllSync<{ name: string }>('PRAGMA table_info(treinos);');
    const nomesColunasTreinos = new Set(colunasTreinos.map((c) => c.name));

    if (!nomesColunasTreinos.has('status')) {
      try {
        db.runSync("ALTER TABLE treinos ADD COLUMN status TEXT NOT NULL DEFAULT 'concluido';");
        console.log("[Migração] Coluna 'status' adicionada à tabela treinos.");
      } catch (e) {
        console.warn("[Migração] Aviso ao adicionar coluna 'status':", e);
      }
    }

    if (!nomesColunasTreinos.has('horario')) {
      try {
        db.runSync('ALTER TABLE treinos ADD COLUMN horario TEXT;');
        console.log("[Migração] Coluna 'horario' adicionada à tabela treinos.");
      } catch (e) {
        console.warn("[Migração] Aviso ao adicionar coluna 'horario':", e);
      }
    }

    if (!nomesColunasTreinos.has('repetir')) {
      try {
        db.runSync("ALTER TABLE treinos ADD COLUMN repetir TEXT DEFAULT 'uma_vez';");
        console.log("[Migração] Coluna 'repetir' adicionada à tabela treinos.");
      } catch (e) {
        console.warn("[Migração] Aviso ao adicionar coluna 'repetir':", e);
      }
    }

    const colunasExercicios = db.getAllSync<{ name: string }>('PRAGMA table_info(exercicios);');
    const nomesColunasExercicios = new Set(colunasExercicios.map((c) => c.name));

    if (!nomesColunasExercicios.has('concluida')) {
      try {
        db.runSync('ALTER TABLE exercicios ADD COLUMN concluida INTEGER NOT NULL DEFAULT 0;');
        console.log("[Migração] Coluna 'concluida' adicionada à tabela exercicios.");
      } catch (e) {
        console.warn("[Migração] Aviso ao adicionar coluna 'concluida':", e);
      }
    }

    db.runSync(`
      CREATE TABLE IF NOT EXISTS configuracoes_usuario (
        id INTEGER PRIMARY KEY DEFAULT 1,
        meta_semanal INTEGER NOT NULL DEFAULT 3,
        nome_usuario TEXT NOT NULL DEFAULT 'Usuário',
        lembretes_ativo INTEGER NOT NULL DEFAULT 1,
        horario_lembretes TEXT DEFAULT '18:00',
        dias_lembretes TEXT DEFAULT 'Seg, Qua e Sex',
        antecedencia_lembrete INTEGER NOT NULL DEFAULT 30
      );
    `);

    const colunasConfig = db.getAllSync<{ name: string }>(
      'PRAGMA table_info(configuracoes_usuario);'
    );
    const nomesColunasConfig = new Set(colunasConfig.map((c) => c.name));

    if (!nomesColunasConfig.has('antecedencia_lembrete')) {
      try {
        db.runSync(
          'ALTER TABLE configuracoes_usuario ADD COLUMN antecedencia_lembrete INTEGER NOT NULL DEFAULT 30;'
        );
        console.log(
          "[Migração] Coluna 'antecedencia_lembrete' adicionada à tabela configuracoes_usuario."
        );
      } catch (e) {
        console.warn("[Migração] Aviso ao adicionar coluna 'antecedencia_lembrete':", e);
      }
    }

    db.runSync(`
      INSERT OR IGNORE INTO configuracoes_usuario (id, meta_semanal, nome_usuario, lembretes_ativo, horario_lembretes, dias_lembretes, antecedencia_lembrete)
      VALUES (1, 3, 'Usuário', 1, '18:00', 'Seg, Qua e Sex', 30);
    `);

    db.runSync('CREATE INDEX IF NOT EXISTS idx_treinos_data_status ON treinos(data, status);');
    db.runSync('CREATE INDEX IF NOT EXISTS idx_exercicios_treino_id ON exercicios(treino_id);');

    console.log('[SQLite] Migrações e índices aplicados com sucesso.');
  } catch (error) {
    console.error('[SQLite] Erro durante a execução das migrações:', error);
    throw error;
  }
}

export function initDatabase(dbInstancia?: SQLiteDatabase): void {
  const db = dbInstancia ?? dbPadrao;

  try {
    db.execSync('PRAGMA foreign_keys = ON;');
    db.execSync(SCRIPT_CRIACAO_TABELAS);
    migrarBanco(db);
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
