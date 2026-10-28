/**
 * StudioIntake — API de Instâncias de Briefing
 * GET    ?id=BRF-XXX           → busca uma instância pelo id (admin, ou cliente pela própria instância)
 * GET    ?cliente_id=...       → lista instâncias de um cliente (admin, ou cliente pelo próprio cliente_id)
 * GET    (sem params)          → lista todas as instâncias (admin)
 * POST   { ...dados }          → cria uma instância (admin)
 * PATCH  { id, ...parcial }    → atualiza uma instância (admin, ou cliente na própria instância — usado pelo autosave)
 * DELETE ?id=BRF-XXX           → remove uma instância (admin)
 *
 * Correção de RN-API-01: toda requisição exige sessão válida
 * (`_auth-guard.js`). Sessão de cliente só lê/edita a própria instância —
 * nunca lista tudo, cria ou exclui. Ver
 * _reversa_forward/001-corrige-autenticacao-api/interfaces/clients-instances.md.
 */
import { getSql, jsonResponse } from './_db.js';
import { requireSession, isAdmin, clientScope } from './_auth-guard.js';
import { logAction } from './_audit.js';

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
    const session = await requireSession(req, res);
    if (!session) return; // requireSession já respondeu 401

    const sql = getSql();
    const admin = isAdmin(session);
    const scope = admin ? null : clientScope(session);

    if (req.method === 'GET') {
      const { id, cliente_id } = req.query;

      if (!admin) {
        if (id && id === scope?.instanciaId) {
          const rows = await sql`SELECT * FROM instancias_briefing WHERE id = ${id} LIMIT 1`;
          return jsonResponse(res, 200, { instance: rows[0] ? rowToInstance(rows[0]) : null });
        }
        if (cliente_id && cliente_id === scope?.clienteId) {
          const rows = await sql`SELECT * FROM instancias_briefing WHERE cliente_id = ${cliente_id} ORDER BY criado_em DESC`;
          return jsonResponse(res, 200, { instances: rows.map(rowToInstance) });
        }
        return jsonResponse(res, 403, { error: 'Acesso não autorizado a este recurso.' });
      }

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
      if (!admin) return jsonResponse(res, 403, { error: 'Acesso não autorizado.' });

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
      await logAction('admin', 'instancia.create', 'instancia', d.id);
      return jsonResponse(res, 201, { ok: true });
    }

    if (req.method === 'PATCH') {
      const d = req.body || {};
      if (!d.id) return jsonResponse(res, 400, { error: 'Campo obrigatório: id' });

      if (!admin && d.id !== scope?.instanciaId) {
        return jsonResponse(res, 403, { error: 'Acesso não autorizado a este recurso.' });
      }

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
      await logAction(admin ? 'admin' : scope.clienteId, 'instancia.update', 'instancia', d.id);
      return jsonResponse(res, 200, { ok: true });
    }

    if (req.method === 'DELETE') {
      if (!admin) return jsonResponse(res, 403, { error: 'Acesso não autorizado.' });

      const { id } = req.query;
      if (!id) return jsonResponse(res, 400, { error: 'Parâmetro obrigatório: id' });
      await sql`DELETE FROM instancias_briefing WHERE id = ${id}`;
      await logAction('admin', 'instancia.delete', 'instancia', id);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
