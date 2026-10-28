/**
 * StudioIntake — API do Funil de Lead/Deal (CRM)
 * GET    ?meta=estagios  → lista os estágios configurados do funil (admin)
 * GET    ?id=...         → busca um Lead por id (admin)
 * GET    (sem params)    → lista todos os Leads (admin)
 * POST   { ...dados }    → cria um Lead (admin)
 * POST   { action:'convert', id } → converte um Lead em Cliente (admin)
 * PATCH  { id, ...parcial } → atualiza um Lead, incluindo mudança de estágio (admin)
 * DELETE ?id=...         → exclui um Lead (admin)
 *
 * 100% admin-only: reaproveita o guard de sessão corrigido em RN-API-01
 * (api/_auth-guard.js, feature 001) — nunca aceita sessão de tipo `cliente`.
 * Ver _reversa_forward/002-crm-funil-lead-projeto/interfaces/leads.md.
 */
import { getSql, jsonResponse } from './_db.js';
import { requireSession, isAdmin } from './_auth-guard.js';
import { logAction } from './_audit.js';
import { validarEstagio, montarClienteApartirDeLead } from './_leads-rules.js';

function rowToLead(row) {
  return {
    id: row.id,
    nome_contato: row.nome_contato,
    empresa: row.empresa,
    email: row.email,
    whatsapp: row.whatsapp,
    fonte_lead: row.fonte_lead,
    valor_estimado: row.valor_estimado === null ? null : Number(row.valor_estimado),
    estagio: row.estagio,
    cliente_id: row.cliente_id,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em
  };
}

async function estagiosValidos(sql) {
  const rows = await sql`SELECT chave FROM lead_estagios`;
  return rows.map(r => r.chave);
}

async function gerarCodigoClienteUnico(sql) {
  for (let tentativas = 0; tentativas < 100; tentativas++) {
    const candidato = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    const existe = await sql`SELECT 1 FROM clientes WHERE codigo_unico = ${candidato} LIMIT 1`;
    if (existe.length === 0) return candidato;
  }
  // Extremamente improvável (mesma ressalva já documentada em store.js#generateClientCode).
  return `CLI-${Date.now().toString().slice(-4)}`;
}

function gerarIdLead() {
  return 'lead_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function gerarIdCliente() {
  return 'cli_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
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

      if (meta === 'estagios') {
        const rows = await sql`SELECT chave, rotulo, ordem, terminal FROM lead_estagios ORDER BY ordem`;
        return jsonResponse(res, 200, { estagios: rows });
      }

      if (id) {
        const rows = await sql`SELECT * FROM leads WHERE id = ${id} LIMIT 1`;
        if (!rows[0]) return jsonResponse(res, 404, { error: 'Lead não encontrado.' });
        return jsonResponse(res, 200, { lead: rowToLead(rows[0]) });
      }

      const rows = await sql`SELECT * FROM leads ORDER BY atualizado_em DESC`;
      return jsonResponse(res, 200, { leads: rows.map(rowToLead) });
    }

    if (req.method === 'POST') {
      const d = req.body || {};

      if (d.action === 'convert') {
        if (!d.id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });

        const leadRows = await sql`SELECT * FROM leads WHERE id = ${d.id} LIMIT 1`;
        const lead = leadRows[0];
        if (!lead) return jsonResponse(res, 404, { error: 'Lead não encontrado.' });
        if (lead.cliente_id) return jsonResponse(res, 409, { error: 'Lead já foi convertido.' });

        const payload = montarClienteApartirDeLead(lead);
        const clienteId = gerarIdCliente();
        const codigoUnico = await gerarCodigoClienteUnico(sql);

        await sql`
          INSERT INTO clientes (id, codigo_unico, nome_responsavel, empresa, email, whatsapp, vertical, status_cliente, lead_origem_id, data_cadastro)
          VALUES (${clienteId}, ${codigoUnico}, ${payload.nome_responsavel}, ${payload.empresa}, ${payload.email}, ${payload.whatsapp}, ${payload.vertical}, ${payload.status_cliente}, ${lead.id}, NOW())
        `;

        const atualizados = await sql`
          UPDATE leads SET cliente_id = ${clienteId}, estagio = 'fechado', atualizado_em = NOW()
          WHERE id = ${d.id}
          RETURNING *
        `;

        await logAction('admin', 'lead_convertido', 'lead', d.id);

        const clienteRows = await sql`SELECT * FROM clientes WHERE id = ${clienteId} LIMIT 1`;
        return jsonResponse(res, 200, { lead: rowToLead(atualizados[0]), cliente: clienteRows[0] });
      }

      if (!d.nome_contato || !d.empresa) {
        return jsonResponse(res, 400, { error: 'nome_contato e empresa são obrigatórios.' });
      }

      const estagio = d.estagio || 'novo_lead';
      const validas = await estagiosValidos(sql);
      if (!validarEstagio(estagio, validas)) {
        return jsonResponse(res, 400, { error: 'Estágio inválido.' });
      }

      const id = gerarIdLead();
      const rows = await sql`
        INSERT INTO leads (id, nome_contato, empresa, email, whatsapp, fonte_lead, valor_estimado, estagio)
        VALUES (${id}, ${d.nome_contato}, ${d.empresa}, ${d.email || ''}, ${d.whatsapp || ''}, ${d.fonte_lead || ''}, ${d.valor_estimado || null}, ${estagio})
        RETURNING *
      `;

      await logAction('admin', 'lead_criado', 'lead', id);
      return jsonResponse(res, 201, { lead: rowToLead(rows[0]) });
    }

    if (req.method === 'PATCH') {
      const d = req.body || {};
      if (!d.id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });

      const atuais = await sql`SELECT estagio FROM leads WHERE id = ${d.id} LIMIT 1`;
      if (!atuais[0]) return jsonResponse(res, 404, { error: 'Lead não encontrado.' });

      if (d.estagio) {
        const validas = await estagiosValidos(sql);
        if (!validarEstagio(d.estagio, validas)) {
          return jsonResponse(res, 400, { error: 'Estágio inválido.' });
        }
      }

      const rows = await sql`
        UPDATE leads SET
          nome_contato = COALESCE(${d.nome_contato}, nome_contato),
          empresa = COALESCE(${d.empresa}, empresa),
          email = COALESCE(${d.email}, email),
          whatsapp = COALESCE(${d.whatsapp}, whatsapp),
          fonte_lead = COALESCE(${d.fonte_lead}, fonte_lead),
          valor_estimado = COALESCE(${d.valor_estimado}, valor_estimado),
          estagio = COALESCE(${d.estagio}, estagio),
          atualizado_em = NOW()
        WHERE id = ${d.id}
        RETURNING *
      `;

      const mudouEstagio = d.estagio && d.estagio !== atuais[0].estagio;
      await logAction('admin', mudouEstagio ? 'lead_estagio_alterado' : 'lead_editado', 'lead', d.id);

      return jsonResponse(res, 200, { lead: rowToLead(rows[0]) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return jsonResponse(res, 400, { error: 'id é obrigatório.' });

      const rows = await sql`DELETE FROM leads WHERE id = ${id} RETURNING id`;
      if (!rows[0]) return jsonResponse(res, 404, { error: 'Lead não encontrado.' });

      await logAction('admin', 'lead_excluido', 'lead', id);
      return jsonResponse(res, 200, { ok: true });
    }

    return jsonResponse(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
