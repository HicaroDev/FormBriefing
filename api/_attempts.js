/**
 * StudioIntake — Rate limiting de tentativas (login admin e PIN de cliente)
 *
 * Guarda tentativas em `auth_attempts` (Postgres já existente) em vez de
 * serviço externo — decisão registrada em
 * _reversa_forward/001-corrige-autenticacao-api/requirements.md (Esclarecimentos).
 *
 * Nunca registra a senha/PIN tentado — só o identificador (e-mail ou código
 * do cliente) e se a tentativa deu certo.
 */
import { getSql } from './_db.js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_FAILURES = 5;

export async function registerAttempt(identificador, tipo, sucesso, sql = getSql()) {
  await sql`
    INSERT INTO auth_attempts (identificador, tipo, sucesso)
    VALUES (${identificador}, ${tipo}, ${sucesso})
  `;
}

export async function isBlocked(identificador, tipo, sql = getSql()) {
  const since = new Date(Date.now() - WINDOW_MS);
  const rows = await sql`
    SELECT COUNT(*)::int AS falhas
    FROM auth_attempts
    WHERE identificador = ${identificador}
      AND tipo = ${tipo}
      AND sucesso = false
      AND criado_em > ${since}
  `;
  return (rows[0]?.falhas || 0) >= MAX_FAILURES;
}
