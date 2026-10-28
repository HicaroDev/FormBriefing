/**
 * StudioIntake — API de Clientes (CRM)
 * GET    ?code=CLI-XXXX  → busca um cliente pelo código único (admin)
 * GET    ?id=...         → busca um cliente por id (admin, ou cliente pelo próprio id)
 * GET    (sem params)    → lista todos os clientes (admin)
 * POST   { ...dados }    → cria um cliente (admin)
 * PATCH  { id, ...parcial } → atualiza um cliente (admin)
 *
 * Correção de RN-API-01: toda requisição agora exige sessão válida
 * (`_auth-guard.js`). Sessão de cliente só pode ler o próprio registro —
 * nunca lista, cria, exclui, ou lê outro cliente. Ver
 * _reversa_forward/001-corrige-autenticacao-api/interfaces/clients-instances.md.
 */
import { getSql, jsonResponse } from './_db.js';
import { requireSession, isAdmin, clientScope } from './_auth-guard.js';
import { logAction } from './_audit.js';

function rowToClient(row) {
  return {
    id: row.id,
    codigo_unico: row.codigo_unico,
    nome_responsavel: row.nome_responsavel,
    cargo: row.cargo,
    empresa: row.empresa,
    email: row.email,
    whatsapp: row.whatsapp,
    vertical: row.vertical,
    status_cliente: row.status_cliente,
    briefings_ids: row.briefings_ids || [],
    data_cadastro: row.data_cadastro
  };
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req, res);
    if (!session) return; // requireSession já respondeu 401

    const sql = getSql();
    const admin = isAdmin(session);

    if (req.method === 'GET') {
      const { code, id } = req.query;

      if (!admin) {
        const scope = clientScope(session);

        // form-engine.js resolve o próprio cliente tanto por `code` quanto
        // por `id` (fetchClientByCodeRemote / getClientById) — ambos
        // continuam permitidos, restritos ao registro da própria sessão.
        if (code) {
          const rows = await sql`SELECT * FROM clientes WHERE UPPER(codigo_unico) = UPPER(${code}) LIMIT 1`;
          const row = rows[0];
          if (!row || row.id !== scope?.clienteId) {
            return jsonResponse(res, 403, { error: 'Acesso não autorizado a este recurso.' });
          }
          return jsonResponse(res, 200, { client: rowToClient(row) });
        }

        if (!id || id !== scope?.clienteId) {
          return jsonResponse(res, 403, { error: 'Acesso não autorizado a este recurso.' });
        }
        const rows = await sql`SELECT * FROM clientes WHERE id = ${id} LIMIT 1`;
        return jsonResponse(res, 200, { client: rows[0] ? rowToClient(rows[0]) : null });
      }

      if (code) {
        const rows = await sql`SELECT * FROM clientes WHERE UPPER(codigo_unico) = UPPER(${code}) LIMIT 1`;
        return jsonResponse(res, 200, { client: rows[0] ? rowToClient(rows[0]) : null });
      }
      if (id) {
        const rows = await sql`SELECT * FROM clientes WHERE id = ${id} LIMIT 1`;
        return jsonResponse(res, 200, { client: rows[0] ? rowToClient(rows[0]) : null });
      }
      const rows = await sql`SELECT * FROM clientes ORDER BY data_cadastro DESC`;
      return jsonResponse(res, 200, { clients: rows.map(rowToClient) });
    }

    if (req.method === 'POST') {
      if (!admin) return jsonResponse(res, 403, { error: 'Acesso não autorizado.' });

      const d = req.body || {};
      if (!d.id || !d.codigo_unico || !d.empresa) {
        return jsonResponse(res, 400, { error: 'Campos obrigatórios: id, codigo_unico, empresa' });
      }
      await sql`
        INSERT INTO clientes (id, codigo_unico, nome_responsavel, cargo, empresa, email, whatsapp, vertical, status_cliente, briefings_ids, data_cadastro)
        VALUES (${d.id}, ${d.codigo_unico}, ${d.nome_responsavel || ''}, ${d.cargo || ''}, ${d.empresa}, ${d.email || ''}, ${d.whatsapp || ''}, ${d.vertical || 'universal'}, ${d.status_cliente || 'ativo'}, ${JSON.stringify(d.briefings_ids || [])}, ${d.data_cadastro || new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          nome_responsavel = EXCLUDED.nome_responsavel,
          cargo = EXCLUDED.cargo,
          empresa = EXCLUDED.empresa,
          email = EXCLUDED.email,
          whatsapp = EXCLUDED.whatsapp,
          vertical = EXCLUDED.vertical,
          status_cliente = EXCLUDED.status_cliente,
          briefings_ids = EXCLUDED.briefings_ids,
          atualizado_em = NOW()
      `;
      await logAction('admin', 'cliente.create', 'cliente', d.id);
      return jsonResponse(res, 201, { ok: true });
    }

    if (req.method === 'PATCH') {
      if (!admin) return jsonResponse(res, 403, { error: 'Acesso não autorizado.' });

      const d = req.body || {};
      if (!d.id) return jsonResponse(res, 400, { error: 'Campo obrigatório: id' });
      await sql`
        UPDATE clientes SET
          nome_responsavel = COALESCE(${d.nome_responsavel}, nome_responsavel),
          cargo = COALESCE(${d.cargo}, cargo),
          empresa = COALESCE(${d.empresa}, empresa),
          email = COALESCE(${d.email}, email),
          whatsapp = COALESCE(${d.whatsapp}, whatsapp),
          status_cliente = COALESCE(${d.status_cliente}, status_cliente),
          briefings_ids = COALESCE(${d.briefings_ids ? JSON.stringify(d.briefings_ids) : null}, briefings_ids),
          atualizado_em = NOW()
        WHERE id = ${d.id}
      `;
      await logAction('admin', 'cliente.update', 'cliente', d.id);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
