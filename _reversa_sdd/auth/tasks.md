# auth, Tarefas de Implementação

## Pré-requisitos
- [ ] Variáveis de ambiente `ADMIN_EMAIL`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` configuradas e sanitizadas
- [ ] Driver Postgres disponível para `portal-auth.js` resolver clientes remotos

## Tarefas

- [ ] T-01, Implementar `signToken`/`verifyToken` com HMAC-SHA256 e `timingSafeEqual`
  - Origem no legado: `api/auth.js`
  - Critério de pronto: token expira exatamente em `expiry`, comparação resistente a timing attack
  - Confiança: 🟢

- [ ] T-02, Implementar `verifyPassword` com fail-safe quando env vars ausentes
  - Origem no legado: `api/auth.js` (`verifyPassword`)
  - Critério de pronto: retorna `false` sem lançar erro quando `salt`/`hash` não configurados
  - Confiança: 🟢

- [ ] T-03, Implementar `requireAuth()` client-side com fallback de rede
  - Origem no legado: `dashboard.js`
  - Critério de pronto: sem token → redireciona; token inválido → redireciona; falha de rede → deixa passar (decisão a revalidar, ver Lacunas)
  - Confiança: 🟡

- [ ] T-04, Implementar resolução de cliente por código com fallback local→remoto
  - Origem no legado: `portal-auth.js` (`resolveClientByCode`)
  - Critério de pronto: resolve local primeiro, cacheia resultado remoto
  - Confiança: 🟢

- [ ] T-05, Decidir se mantém a heurística de `includes()` bidirecional no fallback de PIN
  - Origem no legado: `portal-auth.js` (`handlePortalAccess`, passo 4)
  - Critério de pronto: decisão documentada (manter com teste de regressão, ou substituir por match exato)
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Login com credenciais corretas retorna token válido (happy path RF-01)
- [ ] TT-02, Login com senha incorreta não retorna token, sem leak de timing
- [ ] TT-03, Acesso por código inexistente mostra erro sem redirecionar
- [ ] TT-04, Cliente com 2+ briefings — validar qual é aberto (hoje: sempre o primeiro, RN-AUTH-06)

## Ordem Sugerida
1. T-01 e T-02 primeiro (núcleo de autenticação do admin, sem dependências).
2. T-04 depende de `store.js` (módulo `dashboard-core`) já disponível.
3. T-05 é uma decisão de produto — não bloqueia implementação, mas deve ser resolvida antes de endurecer a segurança (combinar com a correção de RN-API-01 do módulo `api-backend`).

## Lacunas Pendentes (🔴)
- Rate limiting / bloqueio de tentativas, tanto no login do admin quanto no acesso por PIN do cliente — não implementado hoje, mencionado só nos documentos de referência.
- Critério de seleção de briefing quando o cliente tem mais de um (hoje: primeiro da lista, sem ordenação por status/data).
