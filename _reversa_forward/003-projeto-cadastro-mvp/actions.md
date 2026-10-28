# Actions — Cadastro de Projeto (MVP) com vínculo a Cliente

> Gerado pelo `/reversa-to-do` a partir de `roadmap.md` + `data-delta.md` + `interfaces/`. `[//]` marca ações paralelizáveis.

## Resumo
- Total de ações: 18
- Total paralelizáveis (`[//]`): 6
- Maior cadeia de dependência: T001 → T002 → T005 → T008 → T009 → T013 → T014 (7 níveis)

## Fase 1 — Preparação

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T001 | Migração aditiva: criar tabela `projeto_fases` + seed das 6 fases (`ON CONFLICT DO NOTHING`) | — | `api/migrate.js` | 🟢 | [X] |
| T002 | Migração aditiva: criar tabela `projetos` (FK obrigatória para `clientes`, FK para `projeto_fases`) + índices | T001 (mesmo arquivo, FK para `projeto_fases`) | `api/migrate.js` | 🟢 | [X] |
| T003 | `[//]` Criar `api/_projeto-rules.js`: `validarFase(fase, fasesValidas)`, `validarHoras(horas)` (número positivo) — funções puras | — | `api/_projeto-rules.js` | 🟡 | [X] |

## Fase 2 — Testes

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T004 | `[//]` Testes de `_projeto-rules.js`: fase válida aceita, fase inválida rejeitada, horas positivas aceitas, horas zero/negativas/não-numéricas rejeitadas | T003 | `api/_projeto-rules.test.js` | 🟢 | [X] |

## Fase 3 — Núcleo

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T005 | Criar `api/projetos.js`: aplica `requireSession`/`isAdmin` de `_auth-guard.js` no topo — `401`/`403` antes de qualquer query | T002 | `api/projetos.js` | 🟢 | [X] |
| T006 | `[//]` Adicionar `GET /api/projetos` (lista) e `GET /api/projetos?id=` | T005 | `api/projetos.js` | 🟢 | [X] |
| T007 | `[//]` Adicionar `GET /api/projetos?meta=fases` | T005 | `api/projetos.js` | 🟢 | [X] |
| T008 | Adicionar `POST /api/projetos` (criação): exige `cliente_id`/`nome`, valida que o Cliente existe, fase sempre inicia em `briefing_aprovado` | T005, T003 | `api/projetos.js` | 🟢 | [X] |
| T009 | Adicionar `PATCH /api/projetos`: update parcial via `COALESCE`, usa `validarFase` se `fase` for enviada, nunca aceita `consumed_hours` no body | T008 | `api/projetos.js` | 🟢 | [X] |
| T010 | `[//]` Adicionar `DELETE /api/projetos?id=` | T005 | `api/projetos.js` | 🟢 | [X] |
| T011 | Adicionar `POST /api/projetos` com `{action:'apontar_horas', id, horas}`: soma atômica em `consumed_hours` via SQL, usa `validarHoras` | T008, T003 | `api/projetos.js` | 🟢 | [X] |
| T012 | Instrumentar `logAction` (reaproveitando `api/_audit.js`) nas 5 ações: `projeto_criado`, `projeto_editado`, `projeto_fase_alterada`, `horas_apontadas`, `projeto_excluido` | T008, T009, T010, T011 | `api/projetos.js` | 🟢 | [X] |

## Fase 4 — Integração

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T013 | Reescrever `projects.html` do zero: Kanban de 6 colunas (fases reais, via `GET /api/projetos?meta=fases`), lista de Projetos reais (`GET /api/projetos`), botão "Novo Projeto" com seletor de Cliente (`GET /api/clients`, já existente) chamando `POST /api/projetos`. Remove squads/SLA/Gantt/capacidade (decorativos, sem entidade real) | T006, T007, T008 | `projects.html` | 🟡 | [X] |
| T014 | Implementar drag-and-drop de fase em `projects.html`: `PATCH /api/projetos` com a nova `fase` | T013, T009 | `projects.html` | 🟢 | [X] |
| T015 | Reescrever `project-detail.html` do zero: detalhe real de um Projeto via `?id=` na URL (`GET /api/projetos?id=`), dados do Cliente vinculado (`GET /api/clients?id=`, já existente e autenticado), apontamento de horas (`POST {action:'apontar_horas'}`), planejado x realizado. Remove cliente fictício fixo e histórico de marcos decorativo | T008, T011 | `project-detail.html` | 🟡 | [X] |

## Fase 5 — Polimento

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T016 | `[//]` Reaproveitar os tokens visuais já usados em `crm.html` (`glass-surface`, paleta `primary`/`surface-container`, Plus Jakarta Sans/Inter) em `projects.html`/`project-detail.html` — já satisfeito pela implementação de T013/T015, sem retrabalho necessário | T013, T015 | `projects.html`, `project-detail.html` | 🟡 | [X] |
| T017 | `[//]` Atualizar `README.md`: documentar a entidade Projeto e o que foi deliberadamente não implementado (squads/SLA/Gantt) | T013, T015 | `README.md` | 🟢 | [X] |
| T018 | Executar manualmente o roteiro completo de `onboarding.md` (fases, apontamento de horas, bloqueio sem sessão, auditoria) antes de considerar a feature pronta | T012, T014, T015, T016 | — (verificação manual) | 🟢 | [ ] — **requer o usuário**: precisa de `DATABASE_URL`/deploy real, que este ambiente não tem
