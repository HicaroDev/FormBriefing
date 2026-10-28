# Actions — Funil de Lead/Deal (CRM) com conversão para Cliente

> Gerado pelo `/reversa-to-do` a partir de `roadmap.md` + `data-delta.md` + `interfaces/`. `[//]` marca ações paralelizáveis (arquivos diferentes, sem dependência entre si). Nenhuma linha de código real foi escrita ainda — isso é trabalho do `/reversa-coding`.

## Resumo
- Total de ações: 20
- Total paralelizáveis (`[//]`): 7
- Maior cadeia de dependência: T001 → T002 → T003 → T004 → T006 → T008 → T010 → T016 (8 níveis)

## Fase 1 — Preparação

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T001 | Migração aditiva: criar tabela `lead_estagios` + seed dos 6 estágios (`novo_lead` ... `perdido`, `ON CONFLICT DO NOTHING`) | — | `api/migrate.js` | 🟢 | [X] |
| T002 | Migração aditiva: criar tabela `leads` (FK para `clientes` e `lead_estagios`) + índices (`idx_leads_estagio`, `idx_leads_cliente`) | T001 (mesmo arquivo, FK para `lead_estagios`) | `api/migrate.js` | 🟢 | [X] |
| T003 | Migração aditiva: `ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lead_origem_id` (FK para `leads`) | T002 (mesmo arquivo, FK para `leads`) | `api/migrate.js` | 🟢 | [X] |
| T004 | `[//]` Criar `api/_leads-rules.js`: `ESTAGIOS_PADRAO` (fallback local só para validação, nunca fonte de verdade), `validarEstagio(estagio, estagiosValidos)`, `montarClienteApartirDeLead(lead)` — funções puras, sem tocar o banco | — | `api/_leads-rules.js` | 🟡 | [X] |

## Fase 2 — Testes

> Mesmo padrão da feature 001: só o módulo puro (`_leads-rules.js`) ganha teste automatizado dedicado; `api/leads.js` (igual a `clients.js`/`instances.js`) é validado manualmente via `onboarding.md`.

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T005 | `[//]` Testes de `_leads-rules.js`: estágio válido aceito, estágio fora da lista rejeitado, `montarClienteApartirDeLead` mapeia `nome_contato→nome_responsavel` corretamente e nunca inclui `score_ia`/campos decorativos | T004 | `api/_leads-rules.test.js` | 🟢 | [X] |

## Fase 3 — Núcleo

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T006 | Criar `api/leads.js`: aplica `requireSession`/`isAdmin` de `api/_auth-guard.js` (feature 001, já existente) no topo — `401` sem sessão, `403` se sessão não-admin, antes de qualquer query | T002, T003 | `api/leads.js` | 🟢 | [X] |
| T007 | `[//]` Adicionar `GET /api/leads` (lista todos, ordenado por `atualizado_em DESC`) e `GET /api/leads?id=` | T006 | `api/leads.js` | 🟢 | [X] |
| T008 | `[//]` Adicionar `GET /api/leads?meta=estagios` (lê `lead_estagios` ordenado por `ordem`) | T006 | `api/leads.js` | 🟢 | [X] |
| T009 | Adicionar `POST /api/leads` (criação): exige `nome_contato`/`empresa`, usa `validarEstagio` de `_leads-rules.js`, default `novo_lead` | T006, T004 | `api/leads.js` | 🟢 | [X] |
| T010 | Adicionar `PATCH /api/leads`: update parcial via `COALESCE`, usa `validarEstagio` se `estagio` for enviado, detecta se o valor de `estagio` mudou (para log diferenciado em T013) | T009 | `api/leads.js` | 🟢 | [X] |
| T011 | Adicionar `DELETE /api/leads?id=` (hard delete) | T006 | `api/leads.js` | 🟢 | [X] |
| T012 | Adicionar `POST /api/leads` com `{action:'convert', id}`: usa `montarClienteApartirDeLead` de `_leads-rules.js`, cria `Cliente` (gera `codigo_unico` pelo mesmo gerador de `dashboard-core`/`store.js`), seta `clientes.lead_origem_id`, depois `leads.cliente_id`/`leads.estagio='fechado'`, nessa ordem; retorna `409` se o Lead já tiver `cliente_id` preenchido | T009, T010, T004 | `api/leads.js` | 🟡 | [X] |
| T013 | Instrumentar `logAction` (reaproveitando `api/_audit.js`, feature 001) nas 5 ações: `lead_criado`, `lead_editado`, `lead_estagio_alterado`, `lead_convertido`, `lead_excluido` | T009, T010, T011, T012 | `api/leads.js` | 🟢 | [X] |

## Fase 4 — Integração

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T014 | `[//]` Extrair a lógica atual de Kanban de `crm.html` (`render`, `columnForStatus`, drag-and-drop sobre `BriefingInstance.status`) para uma nova view `#kanban` dentro de `index.html`, reaproveitando `getBriefingInstances()`/`updateBriefingStatus`/`patchInstanceRemote` já existentes — sem alterar o comportamento, só o arquivo onde mora. Implementado como `<script type="module">` inline independente, sem tocar `dashboard.js` (menor risco de regressão no dashboard existente do que integrar ao `currentView` de `dashboard.js` — desvio registrado aqui, roadmap.md previa tocar os dois arquivos) | — | `index.html` | 🟡 | [X] |
| T015 | Reescrever `crm.html` para ser o funil de Lead: consome `GET /api/leads` e `GET /api/leads?meta=estagios` para renderizar as colunas dinamicamente (nunca hardcoded) | T014, T007, T008 | `crm.html` | 🟡 | [X] |
| T016 | Implementar drag-and-drop do funil de Lead em `crm.html`: chama `PATCH /api/leads` com o novo `estagio` ao soltar o card | T015, T010 | `crm.html` | 🟢 | [X] |
| T017 | Implementar formulário de criação de Lead e ação "Converter em Cliente" em `crm.html` (chama `POST /api/leads` e `POST /api/leads` com `{action:'convert'}`), sem renderizar score de IA nem botão "Transformar em Projeto" | T015, T009, T012 | `crm.html` | 🟢 | [X] |

## Fase 5 — Polimento

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T018 | `[//]` Reaproveitar os tokens visuais glassmorphic aprovados (`glass-surface`, cores `primary`/`surface-container`, Plus Jakarta Sans/Inter) no novo `crm.html`, sem os elementos 100% decorativos do mockup (sidebar executiva, calendário, score de IA) — já satisfeito pela implementação de T015-T017 (mesmos tokens de `index.html`/antigo `crm.html`), sem necessidade de retrabalho | T017 | `crm.html` | 🟡 | [X] |
| T019 | `[//]` Atualizar `README.md`: documentar a nova localização do Kanban de briefing (`#kanban`) e o funil de Lead em `crm.html` | T014, T015 | `README.md` | 🟢 | [X] |
| T020 | Executar manualmente o roteiro completo de `onboarding.md` (Kanban de briefing não regrediu, criar/mover/converter Lead, bloqueio sem sessão, auditoria) antes de considerar a feature pronta | T013, T016, T017, T018 | — (verificação manual) | 🟢 | [ ] — **pode precisar do usuário**: se o ambiente de coding não tiver `DATABASE_URL`/deploy real (mesma limitação da feature 001) |
