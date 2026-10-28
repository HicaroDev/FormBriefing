# Legacy Impact — Funil de Lead/Deal (CRM) com conversão para Cliente

> Gerado pelo `/reversa-coding` em 2026-10-27. Estado da política de edição no momento da execução: `.reversa/reversa-config.json` com `allowLegacyEdits: true` e `allowedPaths: ["api/**", "scripts/**", "package.json", "dashboard.js", "portal-auth.js", "login.html", "README.md", "index.html", "crm.html"]` — os dois últimos (`index.html`, `crm.html`) foram liberados pelo usuário no meio desta execução, a pedido, antes de qualquer escrita neles. Nenhuma escrita ocorreu fora desses caminhos nem fora das pastas próprias do Reversa. `dashboard.js` estava liberado mas **não foi tocado** (ver desvio registrado abaixo).

## Arquivos afetados

| Arquivo | Componente (`_reversa_sdd/architecture.md`) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `api/migrate.js` | crm-funil / api-backend | delta-de-dados | MEDIUM | 2 tabelas novas (`lead_estagios`, `leads`), aditivo; 1 coluna nova em `clientes` (`lead_origem_id`), nullable |
| `api/_leads-rules.js` (novo) | crm-funil | componente-novo | LOW | Validação de estágio + montagem do payload de conversão, funções puras |
| `api/_leads-rules.test.js` (novo) | crm-funil | componente-novo | LOW | 7 testes automatizados (`node --test`) |
| `api/leads.js` (novo) | crm-funil / api-backend | componente-novo | HIGH | Primeira API real da entidade `Lead` (0 reais hoje); reaproveita o guard de RN-API-01 |
| `index.html` | dashboard-core | regra-nova | MEDIUM | Nova view `#kanban`, acomoda a lógica que saiu de `crm.html`; `dashboard-view`/`kanban-view` alternam por hash |
| `crm.html` | crm-funil | regra-alterada | HIGH | Deixa de ser o Kanban de `BriefingInstance.status` e passa a ser o funil de Lead — mudança de conceito de produto, não só de UI |
| `README.md` | (doc) | — | LOW | Documentação da nova localização do Kanban e do funil de Lead |

## Diff conceitual por componente

**`crm-funil`:** sai de "0 entidades reais" (confirmado em `_reversa_sdd/code-analysis.md#Módulo: crm-funil`) para uma entidade `Lead` real, persistida, com funil de 6 estágios configuráveis (`lead_estagios`) em vez de hardcoded. A divergência entre o mockup de referência e a implementação (documentada extensamente na extração) é parcialmente resolvida: o modelo de dados agora existe, mas o score de IA e a ação "Transformar em Projeto" do mockup permanecem deliberadamente não implementados.

**`api-backend`:** ganha uma quarta função serverless (`api/leads.js`), seguindo exatamente o mesmo padrão de autenticação de `clients.js`/`instances.js` (guard de RN-API-01) — nenhuma rota nova fica desprotegida.

**`dashboard-core`:** ganha uma view adicional (`#kanban`) hash-roteada, mas via um script inline independente em `index.html`, não através do `currentView`/`checkHashRoute` já existente em `dashboard.js`. **Desvio do `roadmap.md`**, que previa tocar `dashboard.js` também: optei por isolar a lógica do Kanban de briefing do controller principal (~100KB, lógica complexa e acoplada ao DOM, conforme a própria extração já descreve) para reduzir o risco de regressão no dashboard existente. Nenhuma função de `dashboard.js` foi alterada; o comportamento de `#clients`/padrão continua idêntico.

## Preservadas (regras 🟢 de `_reversa_sdd/domain.md` que continuam intactas)

- **RN-API-01** (correção da feature 001: toda rota administrativa exige sessão) — preservada e estendida a `api/leads.js`, nunca contornada.
- **RN-CRM-01/02** (mapeamento `BriefingInstance.status` → 4 colunas, drag-and-drop chamando `updateBriefingStatus`) — preservadas integralmente, apenas migradas de arquivo (`crm.html` → `index.html#kanban`), mesmo código, mesmo comportamento.
- Schema de `clientes`/`instancias_briefing` — nenhuma coluna alterada ou removida (`lead_origem_id` é aditiva e nullable).
- **RN-INTAKE-01** (zero-leakage) — não tocada, fora do escopo desta feature.

## Modificadas

- **RN-CRM-03** (não existe entidade `Lead`/`Deal` hoje; card representa sempre um `BriefingInstance` já existente) — **superada**: `Lead` agora existe como entidade real e distinta de `Cliente`/`BriefingInstance`, com seu próprio ciclo de vida (pré-cliente). A regra deixa de descrever o sistema atual.
- **Conceito de `crm.html`** (não é uma regra de negócio 🟢, mas uma decisão de produto registrada na extração) — a página deixa de ser o Kanban de acompanhamento e passa a ser o funil de Lead; a função antiga não foi removida, só realocada para `index.html#kanban` (ver `requirements.md#Esclarecimentos`, decisão do usuário).
