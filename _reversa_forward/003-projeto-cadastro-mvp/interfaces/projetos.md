# Interface — `/api/projetos`

> Novo contrato HTTP desta feature. Mesmo padrão de `api/leads.js`: CRUD REST + uma ação não-CRUD (`apontar_horas`). Toda rota exige sessão de admin válida (reaproveita `requireSession`/`isAdmin` de `api/_auth-guard.js`).

## Autenticação

Mesma regra de `api/leads.js`: sem sessão válida → `401`. Sessão de tipo `cliente` → `403`.

## `GET /api/projetos`

Lista todos os Projetos, ordenados por `atualizado_em DESC`.

- **Response 200:** `{ ok:true, projetos: [ { id, cliente_id, nome, fase, contracted_value, allocated_hours, consumed_hours, scope_pillars, criado_em, atualizado_em }, ... ] }`

## `GET /api/projetos?id=<id>`

- **Response 200:** `{ ok:true, projeto: {...} }`
- **Response 404:** `{ ok:false, error:'Projeto não encontrado.' }`

## `GET /api/projetos?meta=fases`

- **Response 200:** `{ ok:true, fases: [ { chave:'briefing_aprovado', rotulo:'Briefing aprovado', ordem:1 }, ... ] }`

## `POST /api/projetos`

Cria um Projeto, vinculado a um Cliente existente ("Transformar em Projeto").

- **Body:** `{ cliente_id, nome, contracted_value?, allocated_hours?, scope_pillars? }` — `cliente_id` e `nome` obrigatórios; `cliente_id` precisa existir em `clientes`; `fase` sempre inicia em `briefing_aprovado` (não aceito no body de criação).
- **Response 201:** `{ ok:true, projeto: {...} }`
- **Response 400:** `{ ok:false, error:'cliente_id e nome são obrigatórios.' }`
- **Response 404:** `{ ok:false, error:'Cliente não encontrado.' }`
- **Efeito colateral:** `logAction(admin, 'projeto_criado', 'projeto', projeto.id)`

## `POST /api/projetos` com `{ action:'apontar_horas', id, horas }`

Incrementa `consumed_hours` atomicamente no servidor (nunca sobrescreve com um valor calculado no cliente).

- **Body:** `{ action:'apontar_horas', id, horas }` — `horas` deve ser número positivo.
- **Response 200:** `{ ok:true, projeto: {...} }`
- **Response 400:** `{ ok:false, error:'horas deve ser um número positivo.' }`
- **Response 404:** `{ ok:false, error:'Projeto não encontrado.' }`
- **Efeito colateral:** `logAction(admin, 'horas_apontadas', 'projeto', id)`

## `PATCH /api/projetos`

Atualização parcial (mesmo padrão `COALESCE`).

- **Body:** `{ id, nome?, fase?, contracted_value?, allocated_hours?, scope_pillars? }` — `id` obrigatório; `fase`, se enviada, deve existir em `projeto_fases`. `consumed_hours` **não** é aceito aqui — só via `apontar_horas` (RF-04).
- **Response 200:** `{ ok:true, projeto: {...} }`
- **Response 400:** `{ ok:false, error:'id é obrigatório.' }` ou `{ ok:false, error:'Fase inválida.' }`
- **Response 404:** `{ ok:false, error:'Projeto não encontrado.' }`
- **Efeito colateral:** `logAction(admin, mudouFase ? 'projeto_fase_alterada' : 'projeto_editado', 'projeto', id)`

## `DELETE /api/projetos?id=<id>`

- **Response 200:** `{ ok:true }`
- **Response 404:** `{ ok:false, error:'Projeto não encontrado.' }`
- **Efeito colateral:** `logAction(admin, 'projeto_excluido', 'projeto', id)`

## Idempotência e timeouts

`GET`/`DELETE` idempotentes. `POST` de criação não idempotente. `POST {action:'apontar_horas'}` **não é idempotente por design** (cada chamada soma de novo — repetir a mesma requisição soma horas duas vezes; o front-end nunca deve reenviar automaticamente em caso de timeout sem confirmação visual). `PATCH` idempotente para o mesmo conjunto de campos. Sem timeout customizado.

## Erros nunca expostos

Mesma exigência de zero-leakage por analogia das features anteriores: mensagens de erro sempre genéricas, nunca stack trace ou mensagem crua do driver Postgres.
