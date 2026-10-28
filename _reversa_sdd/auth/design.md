# auth, Design Técnico

## Interface

| Método | Caminho | Entrada | Saída | Status codes |
|--------|---------|---------|-------|--------------|
| POST | `/api/auth` `{action:'login'}` | `{email, password}` | `{token, expiry}` ou `{error}` | 200, 400, 401 |
| POST | `/api/auth` `{action:'verify'}` | `{token}` | `{valid: boolean}` | 200 |

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `signToken(expiry)` | `(expiry: number)` | `string` | `"<expiry_ms>.<hmac_hex>"`, HMAC-SHA256 com `SESSION_SECRET` |
| `verifyToken(token)` | `(token: string)` | `boolean` | Rejeita sem `.`, expiry não-numérico, expirado, ou HMAC não bate (`timingSafeEqual`) |
| `verifyPassword(password)` | `(password: string)` | `boolean` | `scryptSync(password, ADMIN_PASSWORD_SALT, 64)` comparado via `timingSafeEqual` |
| `requireAuth()` | `()` | `boolean` | Client-side only; sem token → redireciona; falha de rede → deixa passar |

## Fluxo Principal
1. Admin submete e-mail/senha em `login.html` → `POST /api/auth {action:'login'}`.
2. `api/auth.js` valida e-mail (case-insensitive) + `verifyPassword`.
3. Se válido, gera `expiry = Date.now() + 7 dias` e `signToken(expiry)`.
4. Front-end grava token em `localStorage.studiointake_admin_token`, redireciona para `index.html`.
5. A cada carregamento do dashboard, `requireAuth()` chama `POST /api/auth {action:'verify'}`.

## Fluxos Alternativos
- **Token expirado/inválido:** remove do `localStorage`, redireciona para `login.html`.
- **Falha de rede na verificação:** `requireAuth()` retorna `true` (deixa passar) — comportamento documentado no próprio código, não é bug, mas é uma brecha (RN-AUTH-04).
- **Cliente com código que não resolve direto:** fallback por `includes()` bidirecional em todos os clientes locais.

## Dependências
- `crypto` (Node) — `scryptSync`, `createHmac`, `timingSafeEqual`.
- `store.js` — `getClientByCode`, `fetchClientByCodeRemote`, `saveClients` (usado por `portal-auth.js`).

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Sem tabela de usuários — único admin via env vars | `api/auth.js` | 🟢 |
| Token opaco auto-contido (`expiry.hmac`), sem necessidade de lookup em banco | `api/auth.js` (`signToken`/`verifyToken`) | 🟢 |
| Sanitização de BOM antes de comparar segredos (origem: bug real ao colar env var na Vercel) | `api/auth.js` (`sanitize`) | 🟡 |

## Estado Interno
- `localStorage.studiointake_admin_token` — único estado de sessão do admin, client-side.
- Nenhum estado de sessão do cliente — resolução de identidade é feita a cada acesso, sem persistência.

## Observabilidade
Nenhum log estruturado ou métrica observada nestes arquivos. 🔴

## Riscos e Lacunas
- 🔴 Sem rate limiting ou bloqueio de tentativas no login do admin nem no acesso por PIN do cliente (o manual de implementação de referência menciona isso, mas não existe no código real).
- 🟡 Fallback de rede em `requireAuth()` é uma escolha deliberada, mas combinada com a ausência de autenticação nas rotas `/api/clients`/`/api/instances` (ver módulo `api-backend`), amplia a superfície de risco.
- 🟡 Seleção do "primeiro briefing" do cliente sem critério de status/data (RN-AUTH-06) pode abrir o briefing errado quando há múltiplos.
