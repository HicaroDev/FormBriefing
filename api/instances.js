/**
 * StudioIntake — API de Instâncias de Briefing
 * GET    ?id=BRF-XXX           → busca uma instância pelo id
 * GET    ?cliente_id=...       → lista instâncias de um cliente
 * GET    (sem params)          → lista todas as instâncias
 * POST   { ...dados }          → cria uma instância
 * PATCH  { id, ...parcial }    → atualiza uma instância (usado pelo autosave)
 * DELETE ?id=BRF-XXX           → remove uma instância
 */
import { getSql, jsonResponse } from './_db.js';

function rowToInstance(row) {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    template_id: row.template_id,
    etapa_nome: row.etapa_nome,
    status: row.status,
    link_token: row.link_token,
    link_seguro: row.link_seguro,
    respostas_brutas: row.respostas_brutas || {},
    anexos: row.anexos || [],
    progresso_percentual: row.progresso_percentual || 0,
    urgencia: row.urgencia,
    budget: row.budget,
    feedback_ajustes: row.feedback_ajustes,
    data_envio: row.data_envio,
    data_resposta: row.data_resposta
  };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const { id, cliente_id } = req.query;
      if (id) {
        const rows = await sql`SELECT * FROM instancias_briefing WHERE id = ${id} LIMIT 1`;
        return jsonResponse(res, 200, { instance: rows[0] ? rowToInstance(rows[0]) : null });
      }
      if (cliente_id) {
        const rows = await sql`SELECT * FROM instancias_briefing WHERE cliente_id = ${cliente_id} ORDER BY criado_em DESC`;
        return jsonResponse(res, 200, { instances: rows.map(rowToInstance) });
      }
      const rows = await sql`SELECT * FROM instancias_briefing ORDER BY criado_em DESC`;
      return jsonResponse(res, 200, { instances: rows.map(rowToInstance) });
    }

    if (req.method === 'POST') {
      const d = req.body || {};
      if (!d.id || !d.cliente_id || !d.template_id) {
        return jsonResponse(res, 400, { error: 'Campos obrigatórios: id, cliente_id, template_id' });
      }
      await sql`
        INSERT INTO instancias_briefing (id, cliente_id, template_id, etapa_nome, status, link_token, link_seguro, respostas_brutas, anexos, progresso_percentual, urgencia, budget, data_envio)
        VALUES (${d.id}, ${d.cliente_id}, ${d.template_id}, ${d.etapa_nome || ''}, ${d.status || 'enviado'}, ${d.link_token || ''}, ${d.link_seguro || ''}, ${JSON.stringify(d.respostas_brutas || {})}, ${JSON.stringify(d.anexos || [])}, ${d.progresso_percentual || 0}, ${d.urgencia || 'normal'}, ${d.budget || ''}, ${d.data_envio || new Date().toISOString()})
        ON CONFLICT (id) DO UPDATE SET
          etapa_nome = EXCLUDED.etapa_nome,
          status = EXCLUDED.status,
          atualizado_em = NOW()
      `;
      return jsonResponse(res, 201, { ok: true });
    }

    if (req.method === 'PATCH') {
      const d = req.body || {};
      if (!d.id) return jsonResponse(res, 400, { error: 'Campo obrigatório: id' });
      await sql`
        UPDATE instancias_briefing SET
          status = COALESCE(${d.status}, status),
          respostas_brutas = COALESCE(${d.respostas_brutas ? JSON.stringify(d.respostas_brutas) : null}, respostas_brutas),
          anexos = COALESCE(${d.anexos ? JSON.stringify(d.anexos) : null}, anexos),
          progresso_percentual = COALESCE(${d.progresso_percentual}, progresso_percentual),
          feedback_ajustes = COALESCE(${d.feedback_ajustes}, feedback_ajustes),
          data_resposta = COALESCE(${d.data_resposta}, data_resposta),
          atualizado_em = NOW()
        WHERE id = ${d.id}
      `;
      return jsonResponse(res, 200, { ok: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return jsonResponse(res, 400, { error: 'Parâmetro obrigatório: id' });
      await sql`DELETE FROM instancias_briefing WHERE id = ${id}`;
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
