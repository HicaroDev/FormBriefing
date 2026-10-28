# api-backend, Design Técnico

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| GET | `/api/clients?code=` | — | `{client: Cliente\|null}` | 200 |
| GET | `/api/clients?id=` | — | `{client: Cliente\|null}` | 200 |
| GET | `/api/clients` | — | `{clients: Cliente[]}` | 200 |
| POST | `/api/clients` | `Cliente` (parcial) | `{ok: true}` | 201, 400, 500 |
| PATCH | `/api/clients` | `{id, ...parcial}` | `{ok: true}` | 200, 400, 500 |
| GET | `/api/instances?id=` | — | `{instance: BriefingInstance\|null}` | 200 |
| GET | `/api/instances?cliente_id=` | — | `{instances: BriefingInstance[]}` | 200 |
| GET | `/api/instances` | — | `{instances: BriefingInstance[]}` | 200 |
| POST | `/api/instances` | `BriefingInstance` (parcial) | `{ok: true}` | 201, 400, 500 |
| PATCH | `/api/instances` | `{id, ...parcial}` | `{ok: true}` | 200, 400, 500 |
| DELETE | `/api/instances?id=` | — | `{ok: true}` | 200, 400, 500 |

Ver `contracts.md` para o detalhamento completo por verbo.

## Fluxo Principal
1. `getSql()` resolve a connection string (cacheada em singleton após a primeira chamada).
2. Cada handler despacha por `req.method`.
3. Queries usam `sql\`...\`` tagged template — parametrização automática.

## Fluxos Alternativos
- **Nenhuma env var de banco configurada:** `getSql()` lança erro explícito.
- **`POST` com `id` existente:** upsert via `ON CONFLICT`, não erro de duplicidade.
- **`DELETE` de instância:** remove a linha, mas não atualiza `clientes.briefings_ids` (RN-API-04).

## Dependências
- `@neondatabase/serverless` — driver HTTP do Postgres.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Resolução de connection string tenta 5 nomes de env var em ordem | `api/_db.js:18-27` | 🟢 |
| Sanitização de BOM antes de usar a connection string (origem: bug real, commit `5005daa`) | `api/_db.js:11-16` | 🟢 |
| Nenhuma camada de autenticação/autorização nos handlers de CRUD | `api/clients.js`, `api/instances.js` | 🟢 |

## Estado Interno
`sqlClient` — singleton em memória da função serverless (reaproveitado entre invocações na mesma instância fria/quente da Vercel).

## Observabilidade
Nenhum log estruturado — erros só retornam `{error: err.message}` no corpo da resposta 500. 🔴

## Riscos e Lacunas
- 🔴 RN-API-01: ausência de autenticação no servidor — tratar como prioridade máxima antes de expor qualquer nova rota (ex: `Lead`/`Projeto`).
- 🔴 RN-API-03: upsert parcial em `POST /api/instances` pode mascarar perda de dado se algum caller futuro usar POST para atualizar.
- 🔴 RN-API-04: `briefings_ids` pode ficar órfão após DELETE de instância.
