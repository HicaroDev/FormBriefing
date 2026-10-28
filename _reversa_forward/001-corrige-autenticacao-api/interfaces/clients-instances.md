# Contrato — `api/clients.js` e `api/instances.js` (modificados)

> Gerado pelo `/reversa-plan`. Contrato de dados mantido igual ao atual (`_reversa_sdd/openapi/studiointake-api.yaml`); o delta é exclusivamente de autorização, aplicada por um guard compartilhado (`api/_auth-guard.js`, novo).

## O que NÃO muda

- Formato de requisição/resposta de `GET`/`POST`/`PATCH`/`DELETE` em ambos os arquivos — igual ao documentado em `_reversa_sdd/api-backend/contracts.md`.
- Comportamento de upsert (`RN-API-02`), as lacunas conhecidas `RN-API-03`/`RN-API-04` — permanecem como estão, fora do escopo desta feature (`gaps.md`).

## O que muda

Toda requisição passa primeiro por `_auth-guard.js`, que:

1. Lê o cookie de sessão. Sem cookie válido (ausente, expirado ou revogado em `sessions`) → `401 { error: "Não autenticado." }`, nenhuma query ao banco é executada.
2. Sessão `tipo: 'admin'` → segue para o handler normalmente, sem restrição adicional (admin continua vendo tudo, como hoje).
3. Sessão `tipo: 'cliente'` →
   - `GET` sem filtro (listagem completa) → `403` (cliente nunca lista todos).
   - `GET`/`PATCH` com `id`/`cliente_id`/`instancia_id` que não corresponde ao `sujeito_id` da própria sessão → `403`.
   - `POST`/`DELETE` → `403` sempre (cliente nunca cria nem exclui registro via estes endpoints; criação/alteração do próprio briefing continua pelo fluxo de `client-form.html`/`form-engine.js`, que usa `PATCH /api/instances` já autorizado ao próprio registro — comportamento preservado).

## Erros novos

| Código | Quando |
|---|---|
| `401` | Sem sessão válida |
| `403` | Sessão válida, mas sem permissão para o recurso pedido |

## Idempotência e timeouts
Sem mudança em relação ao contrato atual — `_auth-guard.js` só adiciona uma checagem antes, não altera semântica de retry nem timeout.
