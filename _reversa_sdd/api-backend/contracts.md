# api-backend, Contratos HTTP

## `/api/clients`

### GET
- `?code=CLI-XXXX` → `{client: Cliente | null}` (busca case-insensitive)
- `?id=...` → `{client: Cliente | null}`
- sem params → `{clients: Cliente[]}` ordenado por `data_cadastro DESC`

### POST
- Body obrigatório: `id`, `codigo_unico`, `empresa`. Demais campos opcionais com default.
- Resposta: `201 {ok: true}` (upsert — não distingue criar de atualizar).
- Erro: `400 {error: 'Campos obrigatórios: id, codigo_unico, empresa'}`.

### PATCH
- Body obrigatório: `id`. Demais campos opcionais (atualização parcial via `COALESCE`).
- Resposta: `200 {ok: true}`.

## `/api/instances`

### GET
- `?id=BRF-XXX` → `{instance: BriefingInstance | null}`
- `?cliente_id=...` → `{instances: BriefingInstance[]}` ordenado por `criado_em DESC`
- sem params → `{instances: BriefingInstance[]}`

### POST
- Body obrigatório: `id`, `cliente_id`, `template_id`.
- Resposta: `201 {ok: true}`.
- ⚠️ Em `id` já existente, só `etapa_nome`/`status`/`atualizado_em` são de fato atualizados (RN-API-03) — não usar POST para atualização, usar PATCH.

### PATCH
- Body obrigatório: `id`. Atualiza `status`, `respostas_brutas`, `anexos`, `progresso_percentual`, `feedback_ajustes`, `data_resposta` via `COALESCE`.
- Resposta: `200 {ok: true}`.

### DELETE
- `?id=BRF-XXX` → remove a linha.
- Resposta: `200 {ok: true}`.
- ⚠️ Não limpa `clientes.briefings_ids` (RN-API-04).

## Autenticação (contrato desejado, não implementado)

🔴 **Nenhum destes endpoints exige autenticação hoje.** O contrato correto deveria exigir, em toda requisição: header `Authorization: Bearer <token>` (mesmo token emitido por `/api/auth`), verificado via `verifyToken` antes de processar qualquer verbo. Ver `requirements.md` RF-04 e `questions.md`.
