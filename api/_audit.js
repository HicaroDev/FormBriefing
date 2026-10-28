/**
 * StudioIntake — Log de auditoria
 *
 * Registra quem fez o quê e quando (login, logout, alterações administrativas).
 * Nunca grava senha, PIN ou token em claro — só identificadores e nome da ação.
 */
import { getSql } from './_db.js';

export async function logAction(ator, acao, alvoTipo = null, alvoId = null, sql = getSql()) {
  await sql`
    INSERT INTO audit_log (ator, acao, alvo_tipo, alvo_id)
    VALUES (${ator}, ${acao}, ${alvoTipo}, ${alvoId})
  `;
}
