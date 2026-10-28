# Data Delta — Funil de Lead/Deal (CRM) com conversão para Cliente

> Diff conceitual sobre o modelo extraído em `_reversa_sdd/erd-complete.md` e `_reversa_sdd/data-dictionary.md`. Tudo aditivo — nenhuma tabela ou coluna existente é removida ou tem seu tipo alterado.

## Tabela nova: `lead_estagios`

Configuração dos estágios do funil — ponto único de verdade (RF-03), evita strings mágicas espalhadas pelo código.

```sql
CREATE TABLE IF NOT EXISTS lead_estagios (
  chave VARCHAR(50) PRIMARY KEY,
  rotulo VARCHAR(100) NOT NULL,
  ordem INT NOT NULL,
  terminal BOOLEAN DEFAULT FALSE
);

INSERT INTO lead_estagios (chave, rotulo, ordem, terminal) VALUES
  ('novo_lead', 'Novo lead', 1, FALSE),
  ('briefing_enviado', 'Briefing enviado', 2, FALSE),
  ('briefing_recebido', 'Briefing recebido', 3, FALSE),
  ('proposta_enviada', 'Proposta enviada', 4, FALSE),
  ('fechado', 'Fechado', 5, TRUE),
  ('perdido', 'Perdido', 6, TRUE)
ON CONFLICT (chave) DO NOTHING;
```

Nomenclatura das chaves confirmada em `_reversa_sdd/state-machines.md#2. Funil de vendas (Lead)` (🟢, fonte: `prompts_stitch_studio_suite_2.1.md`, tela 03) — **não** usar `fechado_ganho`/`fechado_perdido` (erro de rascunho corrigido no `requirements.md` desta feature).

## Tabela nova: `leads`

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_leads_estagio ON leads(estagio);
CREATE INDEX IF NOT EXISTS idx_leads_cliente ON leads(cliente_id);
```

- `id`: mesmo padrão de `clientes.id`/`instancias_briefing.id` (gerado em código, VARCHAR, não serial).
- `estagio`: FK para `lead_estagios(chave)` — garante no banco que nunca existe um valor fora da configuração, mesmo que a validação de aplicação falhe.
- `cliente_id`: preenchido só depois da conversão (RF-04); `NULL` enquanto o Lead não foi convertido. `ON DELETE SET NULL` evita que excluir um `Cliente` (fluxo já existente em `clients.js`) quebre a integridade referencial do Lead histórico.
- `valor_estimado`: `estimated_value` do `data-dictionary.md`, preenchido manualmente pelo admin (RF-07).
- `fonte_lead`: texto livre por ora (não é FK) — o enum de origem (Instagram/Indicação/Google/WhatsApp) é só sugestão de UI, não uma restrição de banco, para não precisar de migração se o usuário quiser adicionar uma origem nova.

## Coluna nova em `clientes`

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lead_origem_id VARCHAR(60) REFERENCES leads(id);
```

- Nullable — todo `Cliente` cadastrado hoje (sem passar por um Lead) continua válido, com `lead_origem_id = NULL`.
- Satisfaz RF-09: reserva o ponto de relação para a feature seguinte (`Projeto`) não precisar inventar como ligar `Cliente` à sua origem comercial.

## Ordem de execução no `api/migrate.js`

1. `lead_estagios` (não depende de nada novo)
2. seed dos 6 estágios (`ON CONFLICT DO NOTHING` — idempotente, roda mesmo que já tenha rodado antes)
3. `leads` (depende de `clientes`, já existente, e de `lead_estagios`, criada no passo 1)
4. índices de `leads`
5. `ALTER TABLE clientes ADD COLUMN lead_origem_id` (depende de `leads`, criada no passo 3) — resolve a FK circular conceitual entre as duas tabelas sem travar a criação

## Variáveis de ambiente

Nenhuma variável nova — reaproveita a mesma connection string já usada por `clientes`/`instancias_briefing`/`sessions`/`auth_attempts`/`audit_log`.

## Nenhuma migração de dados existentes

Não há nenhum "Lead" nos dados atuais para migrar — a entidade não existe hoje (confirmado em `_reversa_sdd/code-analysis.md#Módulo: crm-funil`, "Entidades: 0 reais hoje"). Todo `Cliente` já cadastrado simplesmente ganha `lead_origem_id = NULL` por padrão, sem nenhum `UPDATE` retroativo necessário.
