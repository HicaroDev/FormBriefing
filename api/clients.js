/**
 * StudioIntake — API de Clientes (CRM)
 * GET    ?code=CLI-XXXX  → busca um cliente pelo código único
 * GET    (sem params)    → lista todos os clientes
 * POST   { ...dados }    → cria um cliente
 * PATCH  { id, ...parcial } → atualiza um cliente
 */
import { getSql, jsonResponse } from './_db.js';

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
    const sql = getSql();

    if (req.method === 'GET') {
      const { code, id } = req.query;
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
      return jsonResponse(res, 201, { ok: true });
    }

    if (req.method === 'PATCH') {
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
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
