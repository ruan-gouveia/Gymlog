import { db } from './conexao';
import type { ConfiguracoesUsuario } from './tipos';

const CONFIG_PADRAO: ConfiguracoesUsuario = {
  id: 1,
  meta_semanal: 3,
  nome_usuario: 'Usuário',
  lembretes_ativo: 1,
  horario_lembretes: '18:00',
  dias_lembretes: 'Seg, Qua e Sex',
};

export function obterConfiguracoesUsuario(): ConfiguracoesUsuario {
  const configs = db.getAllSync<ConfiguracoesUsuario>(
    'SELECT id, meta_semanal, nome_usuario, lembretes_ativo, horario_lembretes, dias_lembretes FROM configuracoes_usuario WHERE id = 1 LIMIT 1;'
  );

  if (configs.length > 0) {
    return configs[0];
  }

  db.runSync(
    `INSERT OR IGNORE INTO configuracoes_usuario (id, meta_semanal, nome_usuario, lembretes_ativo, horario_lembretes, dias_lembretes)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      CONFIG_PADRAO.id,
      CONFIG_PADRAO.meta_semanal,
      CONFIG_PADRAO.nome_usuario,
      CONFIG_PADRAO.lembretes_ativo,
      CONFIG_PADRAO.horario_lembretes,
      CONFIG_PADRAO.dias_lembretes,
    ]
  );

  return CONFIG_PADRAO;
}

export function salvarMetaSemanal(meta: number): void {
  const metaValida = Math.max(1, Math.min(meta, 7));
  db.runSync(
    'UPDATE configuracoes_usuario SET meta_semanal = ? WHERE id = 1;',
    [metaValida]
  );
}

export function salvarPreferenciaLembretes(
  lembretesAtivo: boolean | number,
  horario?: string,
  dias?: string
): void {
  const ativoInt = typeof lembretesAtivo === 'boolean' ? (lembretesAtivo ? 1 : 0) : lembretesAtivo;

  db.runSync(
    `UPDATE configuracoes_usuario
        SET lembretes_ativo = ?,
            horario_lembretes = COALESCE(?, horario_lembretes),
            dias_lembretes = COALESCE(?, dias_lembretes)
      WHERE id = 1;`,
    [ativoInt, horario ?? null, dias ?? null]
  );
}

export function atualizarConfiguracoesUsuario(
  dados: Partial<Omit<ConfiguracoesUsuario, 'id'>>
): void {
  const atual = obterConfiguracoesUsuario();
  const novaMeta = dados.meta_semanal !== undefined ? dados.meta_semanal : atual.meta_semanal;
  const novoNome = dados.nome_usuario !== undefined ? dados.nome_usuario : atual.nome_usuario;
  const novoLembreteAtivo =
    dados.lembretes_ativo !== undefined ? dados.lembretes_ativo : atual.lembretes_ativo;
  const novoHorario =
    dados.horario_lembretes !== undefined ? dados.horario_lembretes : atual.horario_lembretes;
  const novosDias = dados.dias_lembretes !== undefined ? dados.dias_lembretes : atual.dias_lembretes;

  db.runSync(
    `UPDATE configuracoes_usuario
        SET meta_semanal = ?,
            nome_usuario = ?,
            lembretes_ativo = ?,
            horario_lembretes = ?,
            dias_lembretes = ?
      WHERE id = 1;`,
    [novaMeta, novoNome, novoLembreteAtivo, novoHorario, novosDias]
  );
}
