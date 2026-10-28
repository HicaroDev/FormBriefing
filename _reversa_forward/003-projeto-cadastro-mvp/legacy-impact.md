# Legacy Impact — Cadastro de Projeto (MVP) com vínculo a Cliente

> Gerado pelo `/reversa-coding` em 2026-10-27. Estado da política de edição no momento da execução: `.reversa/reversa-config.json` com `allowLegacyEdits: true` e `allowedPaths` incluindo, a partir desta feature, também `projects.html` e `project-detail.html` (liberados pelo usuário durante esta execução). Nenhuma escrita ocorreu fora desses caminhos nem fora das pastas próprias do Reversa. `dashboard.js`, `crm.html` e `index.html` estavam liberados mas **não foram tocados**.

## Arquivos afetados

| Arquivo | Componente (`_reversa_sdd/architecture.md`) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `api/migrate.js` | telas-preview-v2 / api-backend | delta-de-dados | MEDIUM | 2 tabelas novas (`projeto_fases`, `projetos`), aditivo |
| `api/_projeto-rules.js` (novo) | telas-preview-v2 | componente-novo | LOW | Validação de fase/horas, funções puras |
| `api/_projeto-rules.test.js` (novo) | telas-preview-v2 | componente-novo | LOW | 5 testes automatizados |
| `api/projetos.js` (novo) | telas-preview-v2 / api-backend | componente-novo | HIGH | Primeira API real da entidade `Projeto` (0 reais hoje); reaproveita o guard de RN-API-01 |
| `projects.html` | telas-preview-v2 | regra-alterada | HIGH | Deixa de ser mockup 100% estático (squads/SLA/Gantt fictícios) e passa a ser um Kanban real sobre `Projeto.fase` |
| `project-detail.html` | telas-preview-v2 | regra-alterada | HIGH | Deixa de mostrar um cliente fictício fixo e passa a mostrar o detalhe real de um Projeto via `?id=` |
| `README.md` | (doc) | — | LOW | Documentação da entidade Projeto e do que foi deliberadamente não implementado |

## Diff conceitual por componente

**`telas-preview-v2`:** sai de "0% lógica real, 4 telas estáticas" (confirmado em `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2`) para 2 das 4 telas (`projects.html`, `project-detail.html`) conectadas a uma entidade `Projeto` real. As outras 2 (`form-builder.html`, `client-tracking.html`) permanecem estáticas, fora do escopo desta feature. RN-PREVIEW-02 (`Projeto` inexistente) está superada para essas 2 telas.

**Divergência visual deliberada:** o mockup original de `projects.html`/`project-detail.html` tinha squads nomeados, membros de equipe fictícios, SLA médio, Gantt e matriz de capacidade — nenhuma dessas entidades existe no sistema ou foi pedida pelo usuário. A entrega reescreve as duas telas com um recorte mais simples (mesmos tokens visuais de `crm.html`), removendo os elementos decorativos. Está documentado em `investigation.md` e comunicado explicitamente no relatório ao usuário — não é uma omissão acidental.

**`api-backend`:** ganha uma quinta função serverless (`api/projetos.js`), seguindo o mesmo padrão de autenticação de `clients.js`/`instances.js`/`leads.js`.

## Preservadas (regras 🟢 de `_reversa_sdd/domain.md` que continuam intactas)

- **RN-API-01** (correção da feature 001) — preservada e estendida a `api/projetos.js`.
- **RN-PREVIEW-01** (as 4 telas eram mockups estáticos) — ainda vale integralmente para `form-builder.html`/`client-tracking.html`, que não foram tocadas.
- Schema de `clientes`/`leads`/`instancias_briefing` — nenhuma coluna alterada ou removida.

## Modificadas

- **RN-PREVIEW-02** (parcialmente superada) — `projects.html`/`project-detail.html` deixam de pressupor uma entidade `Projeto` inexistente; ela agora existe e está conectada. A regra continua válida apenas para as 2 telas fora do escopo (`form-builder.html`, `client-tracking.html`).
