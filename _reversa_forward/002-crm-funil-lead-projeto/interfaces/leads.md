# Interface — `/api/leads`

> Novo contrato HTTP desta feature. Segue o mesmo padrão de `api/clients.js`/`api/instances.js` para CRUD puro, e o padrão `{action: ...}` de `api/auth.js` para a ação de conversão. Toda rota exige sessão de admin válida (reaproveita `requireSession`/`isAdmin` de `api/_auth-guard.js`, feature 001) — **nunca** aceita sessão de tipo `cliente`.

## Autenticação

Todas as chamadas abaixo exigem o cookie de sessão de admin (`si_session`, `HttpOnly`/`Secure`/`SameSite=Strict`, emitido por `POST /api/auth`). Sem sessão válida: `401 { ok:false, error:'Sessão inválida ou expirada.' }`. Com sessão válida mas de tipo `cliente`: `403 { ok:false, error:'Acesso restrito ao administrador.' }`.

## `GET /api/leads`

Lista todos os Leads, ordenados por `atualizado_em DESC`.

- **Response 200:** `{ ok:true, leads: [ { id, nome_contato, empresa, email, whatsapp, fonte_lead, valor_estimado, estagio, cliente_id, criado_em, atualizado_em }, ... ] }`

## `GET /api/leads?id=<id>`

Busca um Lead por PK.

- **Response 200:** `{ ok:true, lead: {...} }`
- **Response 404:** `{ ok:false, error:'Lead não encontrado.' }`

## `GET /api/leads?meta=estagios`

Retorna a configuração dos estágios do funil, ordenada por `ordem` — usado pelo front-end para renderizar as colunas do Kanban sem hardcoded.

- **Response 200:** `{ ok:true, estagios: [ { chave:'novo_lead', rotulo:'Novo lead', ordem:1, terminal:false }, ... ] }`

## `POST /api/leads`

Cria um Lead novo.

- **Body:** `{ nome_contato, empresa, email?, whatsapp?, fonte_lead?, valor_estimado?, estagio? }` — `nome_contato` e `empresa` obrigatórios; `estagio` default `novo_lead` se omitido, deve existir em `lead_estagios` se informado.
- **Response 201:** `{ ok:true, lead: {...} }`
- **Response 400:** `{ ok:false, error:'nome_contato e empresa são obrigatórios.' }` ou `{ ok:false, error:'Estágio inválido.' }`
- **Efeito colateral:** `logAction(admin, 'lead_criado', 'lead', lead.id)`

## `POST /api/leads` com `{ action:'convert', id }`

Converte um Lead em Cliente, preservando o Lead como histórico.

- **Body:** `{ action:'convert', id }`
- **Comportamento:** cria um `Cliente` novo (gera `codigo_unico` pelo mesmo gerador já usado em `dashboard-core`, copia `empresa`/`email`/`whatsapp`/`nome_contato→nome_responsavel` do Lead), seta `clientes.lead_origem_id = lead.id`, depois atualiza `leads.estagio='fechado'` e `leads.cliente_id = <cliente novo>` — nessa ordem (cria Cliente primeiro, nunca o inverso, para nunca deixar `leads.cliente_id` apontando para um Cliente que não existe).
- **Response 200:** `{ ok:true, lead:{...}, cliente:{...} }`
- **Response 404:** `{ ok:false, error:'Lead não encontrado.' }`
- **Response 409:** `{ ok:false, error:'Lead já foi convertido.' }` (se `leads.cliente_id` já estiver preenchido — conversão não é idempotente por design, repetir é erro de uso)
- **Efeito colateral:** `logAction(admin, 'lead_convertido', 'lead', lead.id)`

## `PATCH /api/leads`

Atualização parcial (mesmo padrão `COALESCE` de `clients.js`/`instances.js`).

- **Body:** `{ id, nome_contato?, empresa?, email?, whatsapp?, fonte_lead?, valor_estimado?, estagio? }` — `id` obrigatório.
- **Response 200:** `{ ok:true, lead:{...} }`
- **Response 400:** `{ ok:false, error:'id é obrigatório.' }` ou `{ ok:false, error:'Estágio inválido.' }`
- **Response 404:** `{ ok:false, error:'Lead não encontrado.' }`
- **Efeito colateral:** `logAction(admin, 'lead_editado', 'lead', id)`; se o corpo incluir `estagio` e ele mudar de valor, loga adicionalmente `logAction(admin, 'lead_estagio_alterado', 'lead', id)`.

## `DELETE /api/leads?id=<id>`

Exclusão definitiva (hard delete, mesmo padrão de `instances.js`).

- **Response 200:** `{ ok:true }`
- **Response 404:** `{ ok:false, error:'Lead não encontrado.' }`
- **Efeito colateral:** `logAction(admin, 'lead_excluido', 'lead', id)`

## Idempotência e timeouts

- `GET`/`DELETE` são idempotentes. `POST` de criação não é idempotente (gera `id` novo a cada chamada, mesmo padrão de `clients.js`). `POST {action:'convert'}` não é idempotente por design (ver 409 acima). `PATCH` é idempotente para o mesmo conjunto de campos.
- Sem timeout customizado — mesmo comportamento padrão das funções serverless da Vercel já em produção (`clients.js`/`instances.js`), sem SLA diferente documentado.

## Erros nunca expostos

Nenhuma resposta de erro desta API deve conter stack trace, nome de coluna do banco ou mensagem de driver Postgres crua — mesma exigência de zero-leakage já aplicada em `api/client-access.js` (RN-INTAKE-01), por analogia: mensagens de erro de Lead são sempre genéricas e em português, nunca ecoam a exceção original.
