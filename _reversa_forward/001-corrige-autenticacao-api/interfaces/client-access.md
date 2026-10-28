# Contrato — `api/client-access.js` (novo)

> Gerado pelo `/reversa-plan`. Endpoint novo; hoje o cliente resolve acesso consultando `GET /api/clients?code=` direto (ver `_reversa_sdd/code-analysis.md#Módulo: auth`, fluxo `portal-auth.js`), sem sessão nem rate limit no servidor. Este contrato substitui esse uso direto.

## `POST /api/client-access`

### Requisição — fluxo de PIN (entrada manual em `portal.html`)
```json
{ "pin": "dígitos digitados pelo cliente" }
```

### Requisição — fluxo de deep link (`?code=...&brief=...` na URL, links do WhatsApp)
```json
{ "codigo": "CLI-XXXX", "brief": "id da instância vindo da URL" }
```

> Atualizado durante a codificação: (1) o sistema real não tem um "código" e um "PIN" separados — no fluxo de PIN, o cliente só digita os dígitos, e o servidor monta `CLI-<dígitos>` internamente (mesmo comportamento de `portal-auth.js` hoje, só validado no servidor agora). (2) o fluxo de deep link também passou a chamar este endpoint antes de redirecionar para `client-form.html` — sem isso, as chamadas de `form-engine.js` a `api/clients`/`api/instances` seriam bloqueadas pelo guard novo (RN-API-01), quebrando um link já compartilhado. Ver `api/client-access.js` e `portal-auth.js`.

### Resposta — sucesso
```json
{ "ok": true, "clienteId": "...", "instanciaId": "..." }
```
Mais `Set-Cookie` com sessão restrita (`HttpOnly`, `Secure`, `SameSite=Strict`, tipo `cliente`, `sujeito_id` = `cliente_id` + `instancia_id` resolvidos).

### Resposta — erro
- `401 { error: "Código ou PIN inválido." }` — mensagem genérica, nunca distingue "código não existe" de "PIN errado" (mantém RN-INTAKE-01, zero-leakage).
- `429 { error: "Muitas tentativas, aguarde." }` — quando o identificador (código informado) excede o limite de tentativas em `auth_attempts` (`tipo: 'pin_cliente'`).

### Regras
- Busca o cliente por correspondência EXATA de `codigo_unico` (remove o fallback por `includes()` de `portal-auth.js`, RF-07).
- Se o cliente tiver múltiplos briefings, resolve conforme a regra já existente (primeiro encontrado, RN-AUTH-03) — esta feature não altera essa regra, só move a validação para o servidor; mudar RN-AUTH-03 fica fora de escopo (ver `requirements.md#Fora do escopo`).
- Toda tentativa (sucesso ou falha) grava linha em `auth_attempts`.
- Sessão emitida tem expiração mais curta que a do admin (valor exato a definir no `/reversa-to-do` — ex.: duração de uma sessão de preenchimento de briefing).

## Idempotência e timeouts
- Não idempotente por natureza (cada chamada é uma tentativa de acesso, contabilizada). Sem timeout customizado.
