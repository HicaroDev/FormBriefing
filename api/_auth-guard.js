/**
 * StudioIntake — Guard de autorização para rotas administrativas
 *
 * Corrige RN-API-01: antes, `clients.js`/`instances.js` não verificavam
 * sessão nenhuma no servidor. Agora toda requisição passa por aqui primeiro.
 *
 * Uso:
 *   const session = await requireSession(req, res);
 *   if (!session) return; // já respondeu 401
 *   if (!isAdmin(session)) { ...restrinja por sujeitoId... }
 */
import { resolveSessionFromRequest } from './_sessions.js';
import { jsonResponse } from './_db.js';

export async function requireSession(req, res) {
  const session = await resolveSessionFromRequest(req);
  if (!session) {
    jsonResponse(res, 401, { error: 'Não autenticado.' });
    return null;
  }
  return session;
}

export function isAdmin(session) {
  return session?.tipo === 'admin';
}

/** Para sessão de cliente, `sujeitoId` é "<clienteId>:<instanciaId>" (ver
 * api/client-access.js). Retorna os dois pedaços separados. */
export function clientScope(session) {
  if (!session || session.tipo !== 'cliente') return null;
  const [clienteId, instanciaId] = String(session.sujeitoId).split(':');
  return { clienteId, instanciaId };
}
