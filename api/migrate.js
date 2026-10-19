/**
 * StudioIntake — Migração do Schema (execução única)
 *
 * Cria as tabelas `clientes` e `instancias_briefing` conforme SEED.md §4.5
 * caso ainda não existam. Templates permanecem como dados estáticos do
 * código (form-engine.js / store.js) — não variam por cliente.
 *
 * Acesse uma vez em /api/migrate (GET) após conectar o banco na Vercel.
 */
import { getSql, jsonResponse } from './_db.js';

export default async function handler(req, res) {
  try {
    const sql = getSql();

    await sql`
      CREATE TABLE IF NOT EXISTS clientes (
        id VARCHAR(60) PRIMARY KEY,
        codigo_unico VARCHAR(20) UNIQUE NOT NULL,
        nome_responsavel VARCHAR(255) NOT NULL,
        cargo VARCHAR(150),
        empresa VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        whatsapp VARCHAR(50),
        vertical VARCHAR(50) DEFAULT 'universal',
        status_cliente VARCHAR(30) DEFAULT 'ativo',
        briefings_ids JSONB DEFAULT '[]'::jsonb,
        data_cadastro TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(codigo_unico)`;

    await sql`
      CREATE TABLE IF NOT EXISTS instancias_briefing (
        id VARCHAR(50) PRIMARY KEY,
        cliente_id VARCHAR(60) NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        template_id VARCHAR(60) NOT NULL,
        etapa_nome VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'enviado',
        link_token VARCHAR(100),
        link_seguro VARCHAR(255),
        respostas_brutas JSONB DEFAULT '{}'::jsonb,
        anexos JSONB DEFAULT '[]'::jsonb,
        progresso_percentual INT DEFAULT 0,
        urgencia VARCHAR(30) DEFAULT 'normal',
        budget VARCHAR(100),
        feedback_ajustes TEXT,
        data_envio TIMESTAMPTZ,
        data_resposta TIMESTAMPTZ,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_instancias_cliente ON instancias_briefing(cliente_id)`;

    jsonResponse(res, 200, { ok: true, message: 'Schema criado/verificado com sucesso: clientes + instancias_briefing.' });
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err.message });
  }
}
