# Roadmap — Cadastro de Projeto (MVP) com vínculo a Cliente

> Gerado pelo `/reversa-plan` em 2026-10-27. Expressa a abordagem técnica como delta sobre o legado extraído em `_reversa_sdd/`.

## Resumo da abordagem

Criar a entidade `Projeto` como tabela nova e aditiva, com a fase modelada numa tabela de configuração (`projeto_fases`), mesmo padrão já usado para `lead_estagios` na feature 002 — reaproveita o guard de autenticação (`_auth-guard.js`) e o módulo de auditoria sem nenhuma alteração. `projects.html` e `project-detail.html` são **reescritas do zero** com um visual mais simples (consistente com os tokens já usados em `crm.html`), em vez de conectar a dados reais o mockup "VisionOS" extremamente elaborado que existe hoje (squads, SLA, Gantt, capacidade de equipe — nenhuma dessas entidades existe ou foi pedida pelo usuário como MVP). A ação "Transformar em Projeto" vive dentro da própria `projects.html` (escolhe um Cliente existente via um seletor), não em `dashboard.js` — mesma decisão de isolamento de risco já tomada na feature 002 para o Kanban de briefing.

## Decisões Técnicas

| Decisão | Alternativas consideradas | Escolhida | Justificativa | Confiança |
|---|---|---|---|---|
| Onde persistir as fases do Projeto | (a) `CHECK CONSTRAINT`/enum fixo; (b) tabela de configuração `projeto_fases` | (b) | Mesma razão da feature 002 (`lead_estagios`): a nomenclatura das fases vem de uma fonte marcada como "não vinculante" em `data-dictionary.md`, então editável sem migração é mais seguro; também mantém o padrão já estabelecido no projeto | 🟡 |
| Reescrever `projects.html`/`project-detail.html` com fidelidade total ao mockup atual, ou com um visual simplificado | (a) fidelidade total (squads, SLA médio, Gantt, matriz de capacidade, membros de equipe fictícios); (b) visual simplificado, consistente com `crm.html` | (b) | O mockup atual (`projects.html`) tem 5 colunas de "fase operacional" diferentes das 6 fases de negócio decididas, mais squads/SLA/capacidade de equipe — nenhuma dessas entidades existe, foi pedida como MVP, ou tem informação suficiente na extração para implementar de verdade. Replicar isso seria reintroduzir exatamente o tipo de "elemento decorativo simulando funcionalidade inexistente" que o usuário já rejeitou para o score de IA do Lead (Decisão 2, `crm-funil/decisions.md`) | 🟢 |
| Onde fica a ação "Transformar em Projeto" | (a) na tabela de Clientes dentro de `dashboard.js`/`index.html`; (b) dentro da própria `projects.html`, com seletor de Cliente | (b) | Evita tocar `dashboard.js` (mesma política de risco da feature 002: arquivo grande e complexo, qualquer edição ali tem custo de regressão desproporcional ao benefício) | 🟡 |
| Apontamento de horas consumidas | (a) `PATCH` genérico que o front-end soma antes de enviar (`consumed_hours` final); (b) ação dedicada `{action:'apontar_horas', horas}` que soma no servidor | (b) | Evita condição de corrida se duas abas apontarem horas quase ao mesmo tempo (soma no servidor é atômica dentro da própria query SQL); mesmo padrão de ação não-CRUD já usado para a conversão de Lead | 🟢 |
| Autorização das rotas de Projeto | Reaproveitar `isAdmin(session)`/`requireSession` de `_auth-guard.js` | Única opção considerada | Mesma exigência de RN-API-01 aplicada a toda rota administrativa nova desde a feature 001 | 🟢 |

## Delta Arquitetural

Sobre `_reversa_sdd/architecture.md` (módulo `telas-preview-v2`, hoje 0% lógica real):

- **Novo:** `api/projetos.js` — função serverless, mesmo padrão de `api/leads.js` (CRUD REST + ação `apontar_horas`), protegida por `_auth-guard.js`.
- **Novo:** `api/_projeto-rules.js` — funções puras (validação de fase, validação de horas não-negativas), mesmo padrão de `api/_leads-rules.js`.
- **Modificado:** `projects.html` — reescrita, deixa de ser mockup estático (squads/SLA/Gantt fictícios) e passa a listar Projetos reais com um Kanban simples por fase (6 colunas), reaproveitando os tokens visuais já usados em `crm.html`.
- **Modificado:** `project-detail.html` — reescrita, deixa de mostrar o cliente fictício fixo "Lumina Movement" e passa a mostrar o detalhe real de um Projeto (via `?id=` na URL), incluindo apontamento de horas.
- **Modificado:** `api/migrate.js` — 2 tabelas novas (`projeto_fases`, `projetos`), aditivo.
- **Não tocado:** `dashboard.js`, `crm.html`, `index.html`, `api/clients.js`, `api/instances.js`, `api/leads.js`, `api/auth.js` — reaproveitados como estão.

## Delta de Dados

Resumo (detalhe completo em `data-delta.md`):
- Tabela nova `projeto_fases` (config das 6 fases, seedada na migração, mesmo padrão de `lead_estagios`).
- Tabela nova `projetos` (FK obrigatória para `clientes` via `cliente_id`, FK para `projeto_fases` via `fase`).
- Nenhuma coluna ou tabela existente é removida ou alterada em tipo.

## Delta de Contratos

Resumo (detalhe completo em `interfaces/projetos.md`):
- Novo: `GET /api/projetos`, `GET /api/projetos?id=`, `GET /api/projetos?meta=fases`, `POST /api/projetos` (criar e `{action:'apontar_horas'}`), `PATCH /api/projetos`, `DELETE /api/projetos?id=`.
- Nenhum contrato existente é alterado.

## Plano de Migração

1. `api/migrate.js` ganha as novas tabelas, sempre `IF NOT EXISTS`/`ON CONFLICT DO NOTHING` — idempotente, mesmo padrão das features 001/002.
2. `api/projetos.js` é criado e testado isoladamente (`_projeto-rules.test.js`) antes de qualquer alteração visual.
3. `projects.html`/`project-detail.html` são reescritas só depois do endpoint estar testado.
4. Sem feature flag — mesmo raciocínio das features anteriores (operador único, `onboarding.md` é o roteiro de validação).

## Riscos

- **Divergência visual entre o mockup original e a entrega real:** o usuário aprovou visualmente um mockup muito mais rico (squads, SLA, Gantt) do que o que será entregue. Mitigação: `onboarding.md` e o relatório final deixam isso explícito, nos mesmos termos já usados para o score de IA do Lead — "elemento decorativo não implementado por decisão própria do usuário", não uma omissão acidental.
- **Dependência das features 001/002 ainda não 100% validadas em produção:** mesma observação de sempre — `api/projetos.js` reaproveita o mesmo guard, qualquer ajuste se propaga automaticamente.
- **Nomenclatura de fase vem de fonte "não vinculante":** mesma mitigação da feature 002 para `lead_estagios` — tabela de configuração, ajustável sem migração.

## Critério de Pronto

- [ ] `projeto_fases` e `projetos` existem no Postgres, com as 6 fases seedadas
- [ ] `GET/POST/PATCH/DELETE /api/projetos` rejeitam com `401`/`403` qualquer requisição sem sessão de admin válida
- [ ] Criar um Projeto a partir de um Cliente existente, mudar de fase e apontar horas funciona de ponta a ponta via `projects.html`/`project-detail.html`
- [ ] Nenhum elemento decorativo sem lógica real (squads, SLA, Gantt, capacidade de equipe) aparece nas telas reescritas
- [ ] Testes automatizados cobrindo `api/_projeto-rules.js` passam via `npm test`
- [ ] Log de auditoria registra as ações de Projeto (criar, editar, mudar fase, apontar horas, excluir)
