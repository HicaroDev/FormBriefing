/**
 * StudioIntake — Migração do Schema (execução única)
 *
 * Cria as tabelas `clientes` e `instancias_briefing` conforme SEED.md §4.5
 * caso ainda não existam. Templates permanecem como dados estáticos do
 * código (form-engine.js / store.js) — não variam por cliente.
 *
 * Também cria `sessions`, `auth_attempts` e `audit_log` — correção de
 * RN-API-01, ver _reversa_forward/001-corrige-autenticacao-api/data-delta.md.
 *
 * Também cria `lead_estagios` e `leads`, e a coluna `clientes.lead_origem_id`
 * — funil de Lead/Deal, ver _reversa_forward/002-crm-funil-lead-projeto/data-delta.md.
 *
 * Também cria `projeto_fases` e `projetos` — cadastro de Projeto (MVP),
 * ver _reversa_forward/003-projeto-cadastro-mvp/data-delta.md.
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

    // --- Correção de RN-API-01 (_reversa_forward/001-corrige-autenticacao-api) ---

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(100) PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL,
        sujeito_id VARCHAR(150) NOT NULL,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        expira_em TIMESTAMPTZ NOT NULL,
        revogado_em TIMESTAMPTZ
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expira ON sessions(expira_em)`;

    await sql`
      CREATE TABLE IF NOT EXISTS auth_attempts (
        id SERIAL PRIMARY KEY,
        identificador VARCHAR(150) NOT NULL,
        tipo VARCHAR(30) NOT NULL,
        sucesso BOOLEAN NOT NULL,
        criado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_auth_attempts_lookup ON auth_attempts(identificador, tipo, criado_em)`;

    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        ator VARCHAR(100) NOT NULL,
        acao VARCHAR(100) NOT NULL,
        alvo_tipo VARCHAR(50),
        alvo_id VARCHAR(100),
        criado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_criado ON audit_log(criado_em)`;

    // --- Funil de Lead/Deal (_reversa_forward/002-crm-funil-lead-projeto) ---

    await sql`
      CREATE TABLE IF NOT EXISTS lead_estagios (
        chave VARCHAR(50) PRIMARY KEY,
        rotulo VARCHAR(100) NOT NULL,
        ordem INT NOT NULL,
        terminal BOOLEAN DEFAULT FALSE
      )
    `;

    await sql`
      INSERT INTO lead_estagios (chave, rotulo, ordem, terminal) VALUES
        ('novo_lead', 'Novo lead', 1, FALSE),
        ('briefing_enviado', 'Briefing enviado', 2, FALSE),
        ('briefing_recebido', 'Briefing recebido', 3, FALSE),
        ('proposta_enviada', 'Proposta enviada', 4, FALSE),
        ('fechado', 'Fechado', 5, TRUE),
        ('perdido', 'Perdido', 6, TRUE)
      ON CONFLICT (chave) DO NOTHING
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(60) PRIMARY KEY,
        nome_contato VARCHAR(255) NOT NULL,
        empresa VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        whatsapp VARCHAR(50),
        fonte_lead VARCHAR(50),
        valor_estimado NUMERIC(12,2),
        estagio VARCHAR(50) NOT NULL DEFAULT 'novo_lead' REFERENCES lead_estagios(chave),
        cliente_id VARCHAR(60) REFERENCES clientes(id) ON DELETE SET NULL,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_leads_estagio ON leads(estagio)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_cliente ON leads(cliente_id)`;

    await sql`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lead_origem_id VARCHAR(60) REFERENCES leads(id)`;

    // --- Cadastro de Projeto / MVP (_reversa_forward/003-projeto-cadastro-mvp) ---

    await sql`
      CREATE TABLE IF NOT EXISTS projeto_fases (
        chave VARCHAR(50) PRIMARY KEY,
        rotulo VARCHAR(100) NOT NULL,
        ordem INT NOT NULL
      )
    `;

    await sql`
      INSERT INTO projeto_fases (chave, rotulo, ordem) VALUES
        ('briefing_aprovado', 'Briefing aprovado', 1),
        ('imersao_conceito', 'Imersão & Conceito', 2),
        ('criacao', 'Criação', 3),
        ('revisao_cliente', 'Revisão do cliente', 4),
        ('ajustes_finais', 'Ajustes finais', 5),
        ('entregue', 'Entregue', 6)
      ON CONFLICT (chave) DO NOTHING
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS projetos (
        id VARCHAR(60) PRIMARY KEY,
        cliente_id VARCHAR(60) NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        fase VARCHAR(50) NOT NULL DEFAULT 'briefing_aprovado' REFERENCES projeto_fases(chave),
        contracted_value NUMERIC(12,2),
        allocated_hours NUMERIC(8,2) DEFAULT 0,
        consumed_hours NUMERIC(8,2) DEFAULT 0,
        scope_pillars JSONB DEFAULT '[]'::jsonb,
        criado_em TIMESTAMPTZ DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON projetos(cliente_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_projetos_fase ON projetos(fase)`;

    jsonResponse(res, 200, { ok: true, message: 'Schema criado/verificado com sucesso: clientes + instancias_briefing + sessions + auth_attempts + audit_log + lead_estagios + leads + projeto_fases + projetos.' });
  } catch (err) {
    jsonResponse(res, 500, { ok: false, error: err.message });
  }
}
