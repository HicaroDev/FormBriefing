/**
 * StudioIntake — API de Cadastro de Projeto (MVP)
 * GET    ?meta=fases     → lista as fases configuradas do Projeto (admin)
 * GET    ?id=...         → busca um Projeto por id (admin)
 * GET    (sem params)    → lista todos os Projetos (admin)
 * POST   { ...dados }    → cria um Projeto, vinculado a um Cliente existente (admin)
 * POST   { action:'apontar_horas', id, horas } → soma horas consumidas (admin)
 * PATCH  { id, ...parcial } → atualiza um Projeto, incluindo mudança de fase (admin)
 * DELETE ?id=...         → exclui um Projeto (admin)
 *
 * 100% admin-only: reaproveita o guard de sessão corrigido em RN-API-01
 * (api/_auth-guard.js, feature 001) — nunca aceita sessão de tipo `cliente`.
 * Ver _reversa_forward/003-projeto-cadastro-mvp/interfaces/projetos.md.
 */
import { getSql, jsonResponse } from './_db.js';
import { requireSession, isAdmin } from './_auth-guard.js';
import { logAction } from './_audit.js';
import { validarFase, validarHoras } from './_projeto-rules.js';

function rowToProjeto(row) {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    nome: row.nome,
    fase: row.fase,
    contracted_value: row.contracted_value === null ? null : Number(row.contracted_value),
    allocated_hours: Number(row.allocated_hours || 0),
    consumed_hours: Number(row.consumed_hours || 0),
    scope_pillars: row.scope_pillars || [],
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  };
}

async function fasesValidas(sql) {
  const rows = await sql`SELECT chave FROM projeto_fases`;
  return rows.map(r => r.chave);
}

function gerarIdProjeto() {
  return 'proj_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export default async function handler(req, res) {
  try {
    const session = await requireSession(req, res);
    if (!session) return; // requireSession já respondeu 401

    if (!isAdmin(session)) {
      return jsonResponse(res, 403, { error: 'Acesso restrito ao administrador.' });
    }

    const sql = getSql();

    if (req.method === 'GET') {
      const { id, meta } = req.query;

      if (meta === 'fases') {
        const rows = await sql`SELECT chave, rotulo, ordem FROM projeto_fases ORDER BY ordem`;
        return jsonResponse(res, 200, { fases: rows });
      }

      if (id) {
        const rows = await sql`SELECT * FROM projetos WHERE id = ${id} LIMIT 1`;
        if (!rows[0]) return jsonResponse(res, 404, { error: 'Projeto não encontrado.' });
        return jsonResponse(res, 200, { projeto: rowToProjeto(rows[0]) });
      }

      const rows = await sql`SELECT * FROM projetos ORDER BY atualizado_em DESC`;
      return jsonResponse(res, 200, { projetos: rows.map(rowToProjeto) });
    }

    if (req.method === 'POST') {
      const d = req.body || {};

      if (d.action === 'apontar_horas') {
        if (!d.id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });
        if (!validarHoras(d.horas)) {
          return jsonResponse(res, 400, { error: 'horas deve ser um número positivo.' });
        }

        const rows = await sql`
          UPDATE projetos SET consumed_hours = consumed_hours + ${Number(d.horas)}, atualizado_em = NOW()
          WHERE id = ${d.id}
          RETURNING *
        `;
        if (!rows[0]) return jsonResponse(res, 404, { error: 'Projeto não encontrado.' });

        await logAction('admin', 'horas_apontadas', 'projeto', d.id);
        return jsonResponse(res, 200, { projeto: rowToProjeto(rows[0]) });
      }

      if (!d.cliente_id || !d.nome) {
        return jsonResponse(res, 400, { error: 'cliente_id e nome são obrigatórios.' });
      }

      const clienteRows = await sql`SELECT id FROM clientes WHERE id = ${d.cliente_id} LIMIT 1`;
      if (!clienteRows[0]) return jsonResponse(res, 404, { error: 'Cliente não encontrado.' });

      const id = gerarIdProjeto();
      const rows = await sql`
        INSERT INTO projetos (id, cliente_id, nome, contracted_value, allocated_hours, scope_pillars)
        VALUES (${id}, ${d.cliente_id}, ${d.nome}, ${d.contracted_value || null}, ${d.allocated_hours || 0}, ${JSON.stringify(d.scope_pillars || [])})
        RETURNING *
      `;

      await logAction('admin', 'projeto_criado', 'projeto', id);
      return jsonResponse(res, 201, { projeto: rowToProjeto(rows[0]) });
    }

    if (req.method === 'PATCH') {
      const d = req.body || {};
      if (!d.id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });

      const atuais = await sql`SELECT fase FROM projetos WHERE id = ${d.id} LIMIT 1`;
      if (!atuais[0]) return jsonResponse(res, 404, { error: 'Projeto não encontrado.' });

      if (d.fase) {
        const validas = await fasesValidas(sql);
        if (!validarFase(d.fase, validas)) {
          return jsonResponse(res, 400, { error: 'Fase inválida.' });
        }
      }

      const rows = await sql`
        UPDATE projetos SET
          nome = COALESCE(${d.nome}, nome),
          fase = COALESCE(${d.fase}, fase),
          contracted_value = COALESCE(${d.contracted_value}, contracted_value),
          allocated_hours = COALESCE(${d.allocated_hours}, allocated_hours),
          scope_pillars = COALESCE(${d.scope_pillars ? JSON.stringify(d.scope_pillars) : null}, scope_pillars),
          atualizado_em = NOW()
        WHERE id = ${d.id}
        RETURNING *
      `;

      const mudouFase = d.fase && d.fase !== atuais[0].fase;
      await logAction('admin', mudouFase ? 'projeto_fase_alterada' : 'projeto_editado', 'projeto', d.id);

      return jsonResponse(res, 200, { projeto: rowToProjeto(rows[0]) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });

      const rows = await sql`DELETE FROM projetos WHERE id = ${id} RETURNING id`;
      if (!rows[0]) return jsonResponse(res, 404, { error: 'Projeto não encontrado.' });

      await logAction('admin', 'projeto_excluido', 'projeto', id);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
