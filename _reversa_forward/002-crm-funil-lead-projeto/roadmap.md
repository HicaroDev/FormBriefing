# Roadmap — Funil de Lead/Deal (CRM) com conversão para Cliente

> Gerado pelo `/reversa-plan` em 2026-10-27. Expressa a abordagem técnica como delta sobre o legado extraído em `_reversa_sdd/` — nunca redescreve a arquitetura inteira.

## Resumo da abordagem

Criar a entidade `Lead` como tabela nova e aditiva no Postgres, com os 6 estágios do funil modelados numa tabela de configuração (`lead_estagios`) em vez de hardcoded, reaproveitando integralmente o guard de autenticação já corrigido na feature 001 (`_auth-guard.js`) — rotas de Lead são 100% admin-only, sem sessão de tipo `cliente`. `crm.html` é reescrito para ser a página do funil de Lead; o Kanban atual (`BriefingInstance.status`) migra para uma nova view hash-roteada dentro de `index.html`/`dashboard.js`, reaproveitando `getBriefingInstances()`/`updateBriefingStatus`/`patchInstanceRemote` já existentes — nenhuma lógica de briefing é descartada, só move de arquivo. A conversão "Lead → Cliente" cria um `Cliente` real vinculado ao Lead de origem (`clientes.lead_origem_id`), sem apagar o Lead (histórico preservado). O score de IA do mockup não é implementado (decisão do usuário).

## Decisões Técnicas

| Decisão | Alternativas consideradas | Escolhida | Justificativa | Confiança |
|---|---|---|---|---|
| Onde persistir os estágios do funil | (a) hardcoded em array JS no front-end; (b) `CHECK CONSTRAINT` com enum fixo no Postgres; (c) tabela de configuração `lead_estagios` | (c) tabela `lead_estagios` | RF-03 (Should) pede que não fique hardcoded num único lugar de código espalhado; uma tabela é o único jeito de ficar genuinamente editável sem deploy, mesmo sem UI de administração nesta feature | 🟡 |
| Como a API expõe os estágios ao front-end | (a) front-end mantém a lista fixa; (b) novo endpoint só pra isso; (c) `GET /api/leads?meta=estagios` | (c) reaproveita a mesma função serverless de Lead, sem criar um 5º arquivo em `api/` | Reduz o número de funções serverless novas (relevante na Vercel, que tem limite por plano); mantém o padrão de um arquivo por entidade já visto em `clients.js`/`instances.js` | 🟡 |
| Como representar a ação "Converter em Cliente" | (a) endpoint REST dedicado `POST /api/leads/:id/convert`; (b) `POST /api/leads` com `{action:'convert', id}`, no mesmo padrão action-based de `api/auth.js` | (b) | `clients.js`/`instances.js` usam REST puro para CRUD, mas o projeto já tem precedente de ações não-CRUD via `{action: ...}` no corpo (`api/auth.js`); evita rotas aninhadas, que a Vercel (funções arquivo-a-arquivo, sem roteador dinâmico) não suporta sem configuração extra | 🟡 |
| Relação Lead↔Cliente↔Projeto | (a) sem nenhuma coluna de relação agora; (b) coluna `lead_origem_id` em `clientes`, nullable | (b) | Satisfaz RF-09 (reservar ponto de relação para a feature de Projeto) sem inventar a tabela `projetos` antes da hora; é aditiva e não força nenhuma migração quando `Projeto` for implementado | 🟢 |
| Autorização das rotas de Lead | (a) nova lógica de permissão paralela; (b) reaproveitar `isAdmin(session)`/`requireSession` de `api/_auth-guard.js` (feature 001) | (b) | RF-05 e RNF de segurança desta feature exigem explicitamente reaproveitar o guard já corrigido e testado — nunca introduzir um segundo caminho de autenticação | 🟢 |
| Destino do Kanban atual de `crm.html` | Ver `requirements.md#Esclarecimentos` | `crm.html` → funil de Lead; Kanban de `BriefingInstance.status` → nova view `#kanban` dentro de `index.html` | Decisão do usuário, já registrada no requirements | 🟢 |
| Ação "Transformar em Projeto" do mockup | (a) implementar algo mínimo agora; (b) não renderizar o botão, já que `Projeto` está fora de escopo | (b) | `Projeto` é explicitamente fora de escopo desta feature (RF-09, Escopo); renderizar um botão que não faz nada violaria a diretriz do usuário contra elementos decorativos (mesma razão do score de IA) | 🟢 |

## Delta Arquitetural

Sobre `_reversa_sdd/architecture.md` (módulo `crm-funil`, que hoje é 0 entidades reais):

- **Novo:** `api/leads.js` — função serverless nova, mesmo padrão de `api/clients.js`/`api/instances.js` (CRUD REST + uma ação `convert`), protegida por `_auth-guard.js`.
- **Novo:** `api/_leads-rules.js` — funções puras extraídas de `api/leads.js` (validação de estágio contra a lista configurada, montagem do payload de `Cliente` a partir de um `Lead`), sem tocar o banco — mesma razão de existir de `api/_totp.js` na feature 001: lógica pura é testável sem fakes de banco, e `clients.js`/`instances.js` (que não têm lógica pura equivalente) continuam sem teste unitário dedicado, só validados manualmente via `onboarding.md` — mantém o mesmo padrão já estabelecido no projeto.
- **Modificado:** `crm.html` — deixa de ler `getBriefingInstances()`/`getClients()` e `columnForStatus`; passa a consumir `/api/leads` e `/api/leads?meta=estagios`. Lógica de drag-and-drop é reescrita para chamar `PATCH /api/leads` em vez de `updateBriefingStatus`.
- **Modificado:** `index.html` + `dashboard.js` — ganham uma nova view hash-roteada (`#kanban`, nome a confirmar no `/reversa-to-do`) que reaproveita literalmente a lógica de `columnForStatus`/drag-and-drop que hoje mora em `crm.html` (é um recorte-e-cola de lógica já existente, não lógica nova).
- **Modificado:** `api/migrate.js` — 2 tabelas novas (`leads`, `lead_estagios`) + 1 coluna nova em `clientes` (`lead_origem_id`), tudo aditivo.
- **Modificado:** `api/_audit.js` — nenhuma mudança de código, só novos valores de `acao` reaproveitando a função `logAction` já existente (`lead_criado`, `lead_editado`, `lead_estagio_alterado`, `lead_convertido`, `lead_excluido`).
- **Não tocado:** `api/clients.js`, `api/instances.js`, `api/auth.js`, `api/_sessions.js`, `api/_attempts.js`, `api/_auth-guard.js`, `api/client-access.js` — reaproveitados como estão, sem alteração de comportamento.

## Delta de Dados

Resumo (detalhe completo em `data-delta.md`):
- Tabela nova `lead_estagios` (config dos 6 estágios, seedada na migração).
- Tabela nova `leads` (FK para `clientes` opcional via `cliente_id`, FK para `lead_estagios` via `estagio`).
- Coluna nova `clientes.lead_origem_id` (nullable, FK para `leads`).
- Nenhuma coluna ou tabela existente é removida ou alterada em tipo.

## Delta de Contratos

Resumo (detalhe completo em `interfaces/leads.md`):
- Novo: `GET /api/leads`, `GET /api/leads?id=`, `GET /api/leads?meta=estagios`, `POST /api/leads` (criar e `{action:'convert'}`), `PATCH /api/leads`, `DELETE /api/leads?id=`.
- Nenhum contrato existente (`/api/clients`, `/api/instances`, `/api/auth`, `/api/client-access`) é alterado.

## Plano de Migração

1. `api/migrate.js` ganha as novas tabelas/coluna, sempre com `IF NOT EXISTS`/`ADD COLUMN IF NOT EXISTS` — idempotente, seguro rodar múltiplas vezes, não quebra se já tiver sido rodado (mesmo padrão da feature 001).
2. `api/leads.js` é criado e testado isoladamente (com fakes em memória, mesmo padrão de `_sessions.test.js`/`_attempts.test.js`) antes de qualquer alteração em `crm.html`.
3. `crm.html` é reescrito só depois do endpoint estar testado — página fica "burra", só consome a API.
4. A view `#kanban` é extraída para `index.html`/`dashboard.js` **antes** de `crm.html` perder a lógica antiga, para garantir que a função de acompanhamento de briefing nunca fique indisponível entre um deploy e outro.
5. Não há feature flag: é um sistema de operador único (o próprio usuário), e o `onboarding.md` desta feature serve como o roteiro de validação manual antes de considerar pronto — mesmo padrão adotado na feature 001.

## Riscos

- **Confusão de navegação durante a transição:** o usuário está acostumado a `crm.html` ser o Kanban de briefing; vai passar a ser o funil de Lead. Mitigação: `onboarding.md` começa justamente validando que a nova localização do Kanban de briefing (`#kanban` em `index.html`) está acessível e funcional, antes de qualquer outro teste.
- **FK circular conceitual (`leads.cliente_id` ↔ `clientes.lead_origem_id`):** as duas tabelas se referenciam mutuamente. Mitigação: ordem de criação no `migrate.js` evita o problema (ver `data-delta.md`); nenhuma linha é inserida com as duas FKs simultaneamente exceto no momento exato da conversão, que roda em sequência segura (cria Cliente → atualiza Lead → nunca o inverso).
- **Dependência da feature 001 (T026) ainda não validada em produção:** mesma observação do `requirements.md` — as rotas de Lead reaproveitam o guard já escrito, então qualquer ajuste necessário na validação de T026 se propaga automaticamente para aqui, sem retrabalho.
- **Ação "Transformar em Projeto" ausente no funil novo:** usuário pode estranhar a falta do botão que existe no mockup. Mitigação: comunicar explicitamente no `onboarding.md` que essa ausência é intencional (Projeto é a próxima feature), não um bug.

## Critério de Pronto

- [ ] `leads` e `lead_estagios` existem no Postgres, com os 6 estágios seedados
- [ ] `GET/POST/PATCH/DELETE /api/leads` rejeitam com `401`/`403` qualquer requisição sem sessão de admin válida
- [ ] Criar, mover de estágio e excluir um Lead funciona de ponta a ponta via `crm.html`
- [ ] "Converter em Cliente" cria um `Cliente` novo, vinculado ao Lead original, sem apagar o Lead
- [ ] Nenhum score de IA ou insight decorativo aparece no card de Lead
- [ ] O Kanban de acompanhamento de `BriefingInstance.status` continua acessível (agora em `#kanban` dentro de `index.html`), sem perda de funcionalidade
- [ ] Testes automatizados cobrindo `api/_leads-rules.js` (validação de estágio, montagem do payload de conversão) passam via `npm test`, mesmo padrão de cobertura já aplicado a `_totp.js`/`_sessions.js`/`_attempts.js`
- [ ] Log de auditoria registra as 5 ações de Lead (criar, editar, mudar estágio, converter, excluir)
