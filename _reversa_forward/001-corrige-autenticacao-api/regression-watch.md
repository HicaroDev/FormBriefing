# Regression Watch — Corrigir autenticação e autorização das rotas de API

> Gerado pelo `/reversa-coding`. Regras que mudaram e precisam continuar verdadeiras nas próximas extrações (`/reversa`). Preenchido a partir da seção "Modificadas" de `legacy-impact.md`.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após a mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|--------------------------------|----------------------|---------------------|
| W001 | `_reversa_sdd/domain.md#2. Regras de negócio centrais`, RN-API-01 | `/api/clients` e `/api/instances` rejeitam (`401`) qualquer requisição sem sessão válida, antes de qualquer query ao banco | presença | Uma nova rota administrativa, ou uma alteração em `clients.js`/`instances.js`, que não chama `requireSession`/`_auth-guard.js` antes de tocar o banco |
| W002 | `_reversa_sdd/domain.md#2`, RN-AUTH-04 (removida) | Resolução de cliente por código nunca usa correspondência parcial/`includes()` — sempre exata | ausência | Qualquer `includes()`/`LIKE`/`%` reaparecendo na resolução de `codigo_unico` em `client-access.js` ou em qualquer novo fluxo de PIN |
| W003 | `_reversa_sdd/domain.md#2`, RN-AUTH-05 (precisada) | Falha de REDE não desloga o admin; uma resposta explícita do servidor dizendo que a sessão é inválida sempre desloga | redação | `requireAuth()` em `dashboard.js` voltar a tratar os dois casos (erro de rede vs. resposta `valid: false`) de forma idêntica |
| W004 | `api/auth.js` (novo comportamento) | Sessão de admin é revogável — logout invalida a sessão no servidor, não só remove o cookie no cliente | presença | `action: 'logout'` deixar de chamar `revokeSession` |
| W005 | `api/clients.js`/`api/instances.js` (novo comportamento) | Sessão de tipo `cliente` nunca lista todos os registros, nunca acessa `id`/`cliente_id` fora do próprio `sujeito_id` | presença | Qualquer `GET` sem filtro por sessão de cliente retornando mais de um registro |

## Observações (sem peso de regressão — eram 🟡/🔴 antes da mudança)

- `audit_log` cobre só os pontos instrumentados nesta feature (login, logout, CRUD de cliente/instância, acesso de cliente) — não é uma auditoria exaustiva de toda ação do sistema. Se o usuário esperar mais cobertura, é uma feature nova, não uma regressão desta.
- `RF-04` (reautenticação para operações críticas) foi registrado no `requirements.md` como "Should", não "Must" — não foi implementado nesta rodada de coding (não há ação correspondente em `actions.md`). Não é uma regressão: nunca existiu.
- Os testes automatizados (`_totp.test.js`, `_sessions.test.js`, `_attempts.test.js`) rodam com fakes em memória, sem banco real — não substituem o roteiro manual de `onboarding.md` (T026, ainda pendente de execução pelo usuário).

## Histórico de re-extrações

(vazio — preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código)

## Arquivadas

(vazio)
