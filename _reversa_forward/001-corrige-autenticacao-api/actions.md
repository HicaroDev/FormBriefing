# Actions — Corrigir autenticação e autorização das rotas de API (RN-API-01)

> Gerado pelo `/reversa-to-do` a partir de `roadmap.md` + `data-delta.md` + `interfaces/`. `[//]` marca ações paralelizáveis (arquivos diferentes, sem dependência entre si). Nenhuma linha de código real foi escrita ainda — isso é trabalho do `/reversa-coding`.

## Resumo
- Total de ações: 26
- Total paralelizáveis (`[//]`): 13
- Maior cadeia de dependência: T002 → T007 → T014 → T016 → T021 → T026 (6 níveis)

## Fase 1 — Preparação

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T001 | Migração aditiva: criar tabela `sessions` (`CREATE TABLE IF NOT EXISTS`, mesmo padrão já usado) | — | `api/migrate.js` | 🟢 | [X] |
| T002 | Migração aditiva: criar tabela `auth_attempts` | T001 (mesmo arquivo) | `api/migrate.js` | 🟢 | [X] |
| T003 | Migração aditiva: criar tabela `audit_log` | T002 (mesmo arquivo) | `api/migrate.js` | 🟢 | [X] |
| T004 | `[//]` Script `generate-totp-secret.js`: gera segredo aleatório em Base32 para colar em `ADMIN_TOTP_SECRET` | — | `scripts/generate-totp-secret.js` | 🟢 | [X] |
| T005 | `[//]` Criar `api/_totp.js`: `generateSecret()`, `verifyTotp(secret, code, window)` — RFC 6238 com `crypto` nativo do Node | — | `api/_totp.js` | 🟢 | [X] |
| T006 | Criar `api/_sessions.js`: `createSession(tipo, sujeitoId, duracaoMs)`, `getSession(sessionId)`, `revokeSession(sessionId)` sobre a tabela `sessions` | T001 | `api/_sessions.js` | 🟢 | [X] |
| T007 | `[//]` Criar `api/_attempts.js`: `registerAttempt(identificador, tipo, sucesso)`, `isBlocked(identificador, tipo)` sobre `auth_attempts` | T002 | `api/_attempts.js` | 🟢 | [X] |
| T008 | `[//]` Criar `api/_audit.js`: `logAction(ator, acao, alvoTipo, alvoId)` sobre `audit_log` | T003 | `api/_audit.js` | 🟢 | [X] |
| T009 | Criar `api/_auth-guard.js`: lê cookie de sessão, resolve via `_sessions.js`, retorna `{ tipo, sujeitoId }` ou `null` | T006 | `api/_auth-guard.js` | 🟢 | [X] |

## Fase 2 — Testes

> Projeto hoje tem zero framework de teste (`_reversa_sdd/inventory.md#5. Cobertura de testes`). T010 introduz o runner nativo do Node (`node:test`), sem dependência nova — alinhado com as diretrizes do usuário (testes automatizados de autenticação/autorização, item 10 de `security-architecture-decisions.md`).

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T010 | `[//]` Configurar `node --test` como script `test` em `package.json` (runner nativo, zero dependência nova) | — | `package.json` | 🟡 | [X] |
| T011 | `[//]` Testes de `_totp.js`: vetores oficiais da RFC 4226, código correto aceito, código fora da janela rejeitado, formato inválido rejeitado | T005, T010 | `api/_totp.test.js` | 🟢 | [X] |
| T012 | `[//]` Testes de `_attempts.js`: bloqueio ativa após 5 falhas consecutivas; tentativa bem-sucedida não conta para bloqueio; identificadores/tipos diferentes não se cruzam | T007, T010 | `api/_attempts.test.js` | 🟢 | [X] |
| T013 | `[//]` Testes de `_sessions.js`: sessão revogada nunca é válida; sessão expirada nunca é válida; sessão de cliente nunca resolve para outro `sujeito_id` | T006, T010 | `api/_sessions.test.js` | 🟢 | [X] |

## Fase 3 — Núcleo

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T014 | Modificar `api/auth.js`: `action: 'login'` passa a checar `ADMIN_TOTP_SECRET` (se configurado, retorna `loginTicket` em vez de token); grava tentativa via `_attempts.js`; mantém RN-AUTH-02 (nunca revela se o erro foi e-mail ou senha) | T005, T007 | `api/auth.js` | 🟢 | [X] |
| T015 | Adicionar `action: 'verify-totp'` em `api/auth.js`: valida código, cria sessão via `_sessions.js`, emite cookie `HttpOnly`/`Secure`/`SameSite=Strict` | T006, T014 | `api/auth.js` | 🟢 | [X] |
| T016 | Adicionar `action: 'logout'` em `api/auth.js`: revoga sessão via `_sessions.js`, limpa cookie, resposta idempotente | T006, T014 | `api/auth.js` | 🟢 | [X] |
| T017 | Atualizar `action: 'verify'` em `api/auth.js` para checar sessão via `_auth-guard.js`/`_sessions.js` em vez do HMAC autocontido atual | T009, T014 | `api/auth.js` | 🟢 | [X] |
| T018 | `[//]` Criar `api/client-access.js`: valida PIN (dígitos → `CLI-<dígitos>`) por correspondência exata (remove fallback `includes()`, RF-07), aplica `_attempts.js`, emite sessão `tipo: 'cliente'` via `_sessions.js` | T006, T007 | `api/client-access.js` | 🟢 | [X] |
| T019 | `[//]` Aplicar `_auth-guard.js` no topo de `api/clients.js`: `401` sem sessão; para sessão `cliente`, `403` em listagem/`POST`/`DELETE`/registro de outro `sujeito_id` | T009 | `api/clients.js` | 🟢 | [X] |
| T020 | `[//]` Aplicar `_auth-guard.js` no topo de `api/instances.js`, mesma regra de T019 | T009 | `api/instances.js` | 🟢 | [X] |
| T021 | Instrumentar `_audit.js` nos pontos relevantes: login, logout, criação/edição/exclusão de cliente e instância (toca `auth.js`, `clients.js`, `instances.js`, `client-access.js`) | T008, T014, T015, T016, T017, T018, T019, T020 | `api/auth.js`, `api/clients.js`, `api/instances.js`, `api/client-access.js` | 🟡 | [X] |

## Fase 4 — Integração

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T022 | `[//]` Atualizar `dashboard.js` (`requireAuth()`): parar de gerenciar token em `localStorage`, confiar no cookie, usar `verify`; preservar RN-AUTH-05 só para falha de REDE | T017 | `dashboard.js` | 🟢 | [X] |
| T023 | `[//]` Atualizar `portal-auth.js` para chamar `api/client-access.js` (PIN e deep link) em vez de consultar `api/clients.js` diretamente | T018 | `portal-auth.js` | 🟢 | [X] |
| T024 | `[//]` Atualizar `login.html`: campo de código TOTP após login+senha (`totpForm`), fluxo de `verify-totp` | T015 | `login.html` | 🟢 | [X] |

## Fase 5 — Polimento

| ID | Descrição | Dependências | Arquivo alvo | Confiança | Status |
|----|-----------|---------------|--------------|-----------|--------|
| T025 | `[//]` Documentar no README do projeto como gerar e configurar `ADMIN_TOTP_SECRET` na Vercel, apontando para `onboarding.md` desta feature | T004 | `README.md` | 🟢 | [X] |
| T026 | Executar manualmente o roteiro completo de `onboarding.md` (MFA, bloqueio sem sessão, PIN de cliente, regressão com Kalea/Carola) antes de considerar a feature pronta | T022, T023, T024, T025 | — (verificação manual) | 🟢 | [ ] — **requer o usuário**: precisa de `DATABASE_URL`/deploy real, que este ambiente não tem |
