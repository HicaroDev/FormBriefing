# Legacy Impact — Corrigir autenticação e autorização das rotas de API (RN-API-01)

> Gerado pelo `/reversa-coding` em 2026-10-27. Estado da política de edição no momento da execução: `.reversa/reversa-config.json` com `allowLegacyEdits: true` e `allowedPaths: ["api/**", "scripts/**", "package.json", "dashboard.js", "portal-auth.js", "login.html", "README.md"]` (liberado pelo usuário). Nenhuma escrita ocorreu fora desses caminhos nem fora das pastas próprias do Reversa.

## Arquivos afetados

| Arquivo | Componente (`_reversa_sdd/architecture.md`) | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `api/migrate.js` | api-backend | delta-de-dados | MEDIUM | 3 tabelas novas (`sessions`, `auth_attempts`, `audit_log`), aditivo, sem tocar `clientes`/`instancias_briefing` |
| `api/_totp.js` (novo) | auth | componente-novo | MEDIUM | TOTP (RFC 6238) manual, sem dependência nova |
| `api/_sessions.js` (novo) | auth | componente-novo | HIGH | Substitui o conceito de sessão (stateless → revogável) |
| `api/_attempts.js` (novo) | auth / api-backend | componente-novo | MEDIUM | Rate limiting novo, antes inexistente |
| `api/_audit.js` (novo) | api-backend | componente-novo | LOW | Log de auditoria novo |
| `api/_auth-guard.js` (novo) | api-backend | componente-novo | HIGH | Ponto único de autorização para `clients.js`/`instances.js` |
| `api/auth.js` | auth | regra-alterada | CRITICAL | Login redesenhado: MFA, cookie, sessão revogável, substitui o esquema HMAC sem estado (RN-AUTH-01/02 preservadas, forma de implementação muda) |
| `api/client-access.js` (novo) | auth / client-intake | componente-novo | HIGH | Corrige RN-AUTH-04, move validação de PIN para o servidor |
| `api/clients.js` | api-backend | regra-nova | CRITICAL | RN-API-01 corrigida: exige sessão, restringe cliente ao próprio registro |
| `api/instances.js` | api-backend | regra-nova | CRITICAL | RN-API-01 corrigida: exige sessão, restringe cliente à própria instância |
| `dashboard.js` | dashboard-core / auth | regra-alterada | HIGH | `requireAuth()` migra de token em `localStorage` para cookie + sessão |
| `portal-auth.js` | client-intake / auth | regra-alterada | HIGH | Resolução de cliente por PIN/deep link move para `api/client-access.js` |
| `login.html` | auth | regra-alterada | MEDIUM | Nova etapa de TOTP no fluxo de login |
| `package.json` | (infra) | componente-novo | LOW | Script `test` (runner nativo `node --test`) |
| `scripts/generate-totp-secret.js` (novo) | (infra) | componente-novo | LOW | Utilitário de setup, fora do runtime da API |
| `README.md` | (doc) | — | LOW | Documentação de configuração do MFA |

## Diff conceitual por componente

**`auth`:** o esquema de sessão deixa de ser um token HMAC autocontido (sem estado, sem revogação) e passa a ser uma sessão com linha própria em `sessions`, lida via cookie `HttpOnly`/`Secure`/`SameSite=Strict`. Login do admin ganha uma segunda etapa (TOTP) quando `ADMIN_TOTP_SECRET` está configurado — sem essa variável, o comportamento de login direto é preservado (janela de migração). `verify` deixa de validar um HMAC e passa a consultar a sessão.

**`api-backend`:** `clients.js`/`instances.js` passam a exigir sessão válida antes de qualquer query (401 sem sessão). Sessão de cliente é restrita ao próprio `cliente_id`/`instancia_id` (403 fora disso). Nenhuma mudança no formato de dados trafegado nem no schema das duas tabelas originais.

**`client-intake`:** a resolução de PIN, que antes acontecia no navegador consultando `clients.js` livremente (com um fallback de correspondência frouxa por `includes()`), agora acontece em `api/client-access.js`, no servidor, com correspondência exata e rate limiting. O fluxo de deep link (`?code=...&brief=...`) também passou a estabelecer sessão antes de abrir o formulário — sem isso, o guard novo bloquearia o preenchimento do briefing.

**`dashboard-core`:** `requireAuth()` não gerencia mais nenhum token manualmente; delega inteiramente ao cookie de sessão e à resposta do servidor.

## Preservadas (regras 🟢 de `_reversa_sdd/domain.md` que continuam intactas)

- **RN-INTAKE-01** (zero-leakage: nunca cai no "primeiro cliente disponível") — não tocada; `client-access.js` preserva a mesma mensagem genérica de erro.
- **RN-AUTH-01** (sessão de admin dura 7 dias) — duração preservada (`SESSION_DURATION_MS` inalterado), só a forma de armazenar a sessão mudou.
- **RN-AUTH-02** (login nunca revela se o erro foi e-mail ou senha) — preservada explicitamente em `api/auth.js`.
- **RN-API-05** (proteção contra SQL injection via template tagged `sql\`...\``) — todas as queries novas seguem o mesmo padrão dos arquivos originais.
- **RN-AUTH-03** (acesso do cliente usa o primeiro briefing encontrado) — comportamento preservado sem alteração; fora do escopo desta feature.
- Schema de `clientes`/`instancias_briefing` — nenhuma coluna alterada ou removida.

## Modificadas

- **RN-API-01** (ausência de autenticação no servidor) — **corrigida** (era o objetivo central desta feature). Era 🔴 LACUNA, agora é comportamento real e testável.
- **RN-AUTH-04** (fallback de busca de cliente por `includes()` nos dois sentidos) — **removida** (RF-07). Correspondência agora é sempre exata.
- **RN-AUTH-05** (falha de rede na verificação de sessão não desloga o admin) — **precisada, não removida**: continua valendo só para falha de REDE; uma resposta explícita do servidor dizendo que a sessão é inválida agora sempre desloga (antes, o código não fazia essa distinção porque não havia conceito de resposta explícita de invalidação vs. erro de rede tratados de formas diferentes no mesmo bloco `catch`).
