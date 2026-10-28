# Contrato — `api/auth.js` (modificado)

> Gerado pelo `/reversa-plan`. Contrato proposto, ainda não implementado. Compara com o contrato atual documentado em `_reversa_sdd/openapi/studiointake-api.yaml` e `_reversa_sdd/api-backend/contracts.md`.

## Contrato atual (🟢 confirmado no legado)

`POST /api/auth`
- `{ action: 'login', email, password }` → `{ token, expiry }` ou erro
- `{ action: 'verify', token }` → `{ valid: boolean }`

## Contrato proposto (delta)

`POST /api/auth`

### `{ action: 'login', email, password }`
- Se `ADMIN_TOTP_SECRET` configurado: retorna `{ requiresTotp: true, loginTicket }` (um ticket de curta duração, não a sessão final) em vez do token direto.
- Se não configurado: comportamento atual preservado + aviso para configurar MFA (campo `mfaSetupRequired: true` na resposta).
- Erros: mesmo formato atual (`400`/`401` com `{ error }`), sem revelar se o problema foi e-mail ou senha (mantém RN-AUTH-02).
- Toda tentativa (sucesso ou falha) grava uma linha em `auth_attempts` (`tipo: 'login_admin'`).

### `{ action: 'verify-totp', loginTicket, code }` (novo)
- Valida `code` (6 dígitos) contra `ADMIN_TOTP_SECRET` e o `loginTicket`.
- Sucesso: cria linha em `sessions` (`tipo: 'admin'`), responde `Set-Cookie` com o id da sessão (`HttpOnly`, `Secure`, `SameSite=Strict`, `Max-Age` = `SESSION_DURATION_MS`), corpo `{ ok: true }` (sem token no corpo).
- Falha: `401 { error }`, grava tentativa em `auth_attempts`.

### `{ action: 'logout' }` (novo)
- Lê o cookie de sessão, marca `revogado_em = now()` na linha correspondente de `sessions`.
- Responde limpando o cookie (`Set-Cookie` com `Max-Age=0`).
- Idempotente: logout sem sessão válida responde `200` do mesmo jeito (não revela se havia sessão).

### `{ action: 'verify' }` (mantido, semântica muda)
- Em vez de validar um token HMAC autocontido, passa a checar o cookie contra `sessions` (existe, não expirou, não revogado).
- Resposta mantém formato atual: `{ valid: boolean }`.

## Idempotência e timeouts
- Nenhuma operação acima tem efeito colateral em caso de retry idêntico, exceto `auth_attempts` (intencional — cada tentativa conta, mesmo repetida).
- Sem timeout customizado além do default da função serverless da Vercel (consistente com o restante da API, `_reversa_sdd/api-backend/contracts.md`).
