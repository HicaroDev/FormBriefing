# Data Delta — Cadastro de Projeto (MVP) com vínculo a Cliente

> Diff conceitual sobre o modelo extraído em `_reversa_sdd/erd-complete.md` e `_reversa_sdd/data-dictionary.md`. Tudo aditivo.

## Tabela nova: `projeto_fases`

```sql
CREATE TABLE IF NOT EXISTS projeto_fases (
  chave VARCHAR(50) PRIMARY KEY,
  rotulo VARCHAR(100) NOT NULL,
  ordem INT NOT NULL
);

INSERT INTO projeto_fases (chave, rotulo, ordem) VALUES
  ('briefing_aprovado', 'Briefing aprovado', 1),
  ('imersao_conceito', 'Imersão & Conceito', 2),
  ('criacao', 'Criação', 3),
  ('revisao_cliente', 'Revisão do cliente', 4),
  ('ajustes_finais', 'Ajustes finais', 5),
  ('entregue', 'Entregue', 6)
ON CONFLICT (chave) DO NOTHING;
```

Nomenclatura confirmada em `_reversa_sdd/data-dictionary.md#Entidade candidata: Projeto` (🟡, fonte marcada como "não vinculante, stack diferente" — melhor fonte disponível, sem equivalente em `state-machines.md`).

## Tabela nova: `projetos`

```sql
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
);

CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON projetos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_projetos_fase ON projetos(fase);
```

- `cliente_id`: `NOT NULL` + `ON DELETE CASCADE` — mesmo padrão de `instancias_briefing.cliente_id` (um Projeto não existe sem o Cliente que o originou).
- `contracted_value`/`allocated_hours`/`consumed_hours`/`scope_pillars`: nomes em inglês, mantendo a convenção dos campos de referência citados em `data-dictionary.md` (já era assim para `leads.valor_estimado` em português — aqui segui o nome literal da fonte por não haver tradução natural melhor que `contracted_value`/`allocated_hours` em uso nativo no restante do schema; decisão de nomenclatura reversível sem custo, não é contrato externo).
- `scope_pillars`: JSONB, lista simples de strings (pilares de escopo, texto livre) — equivalente aos "4 pilares do briefing" mencionados no mockup, sem precisar de uma tabela filha.

## Ordem de execução no `api/migrate.js`

1. `projeto_fases` (não depende de nada novo)
2. seed das 6 fases (idempotente)
3. `projetos` (depende de `clientes`, já existente, e de `projeto_fases`, criada no passo 1)
4. índices de `projetos`

## Variáveis de ambiente

Nenhuma variável nova.

## Nenhuma migração de dados existentes

Não há nenhum "Projeto" nos dados atuais para migrar — a entidade não existe hoje (confirmado em `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2`, RN-PREVIEW-02).
