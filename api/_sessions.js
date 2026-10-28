/**
 * StudioIntake — Sessões revogáveis (admin e cliente)
 *
 * Substitui o token HMAC autocontido (sem estado) por uma sessão com linha
 * própria no banco, para suportar revogação real no servidor (logout) —
 * ver _reversa_forward/001-corrige-autenticacao-api/roadmap.md.
 *
 * Todas as funções que tocam o banco aceitam um `sql` opcional (dependência
 * injetável) para permitir testes unitários sem banco real — ver
 * _sessions.test.js.
 */
import { randomBytes } from 'crypto';
import { getSql } from './_db.js';

export const SESSION_COOKIE_NAME = 'si_session';

export async function createSession(tipo, sujeitoId, durationMs, sql = getSql()) {
  const id = randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + durationMs);
  await sql`
    INSERT INTO sessions (id, tipo, sujeito_id, expira_em)
    VALUES (${id}, ${tipo}, ${sujeitoId}, ${expiraEm})
  `;
  return { id, expiraEm };
}

export async function getSession(sessionId, sql = getSql()) {
  if (!sessionId) return null;
  const rows = await sql`
    SELECT id, tipo, sujeito_id, expira_em, revogado_em
    FROM sessions
    WHERE id = ${sessionId}
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.revogado_em) return null;
  if (new Date(row.expira_em).getTime() < Date.now()) return null;
  return { id: row.id, tipo: row.tipo, sujeitoId: row.sujeito_id };
}

export async function revokeSession(sessionId, sql = getSql()) {
  if (!sessionId) return;
  await sql`
    UPDATE sessions SET revogado_em = NOW()
    WHERE id = ${sessionId} AND revogado_em IS NULL
  `;
}

export function parseCookies(req) {
  const header = req.headers?.cookie;
  if (!header) return {};
  return header.split(';').reduce((acc, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return acc;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export async function resolveSessionFromRequest(req, sql = getSql()) {
  const cookies = parseCookies(req);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return null;
  return getSession(sessionId, sql);
}

export function buildSessionCookie(sessionId, maxAgeMs) {
  const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
  return `${SESSION_COOKIE_NAME}=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}
