# Adendo — Corrigir autenticação e autorização das rotas de API (RN-API-01)

> Feature: `001-corrige-autenticacao-api` · Data: 2026-10-27 · Cenário: **legado**
> Gerado pelo `/reversa-sync`. Sincronização **parcial** — a feature ainda tem 1 ação aberta (T026, verificação manual em ambiente real), registrada abaixo.

## Vigência

Vigente desde 2026-10-27.

## Resumo da entrega

Até hoje, qualquer requisição HTTP direta a `/api/clients` ou `/api/instances` tinha poder total de leitura/escrita/exclusão sobre todos os clientes e briefings do estúdio, sem autenticação nenhuma no servidor — a única trava existente era client-side (`requireAuth()` em `dashboard.js`), facilmente contornável. Esta entrega corrige essa falha (RN-API-01), sem descartar o mecanismo de autenticação atual e sem bloquear o acesso legítimo do cliente final via código/PIN, adicionando MFA/TOTP para o admin, sessões revogáveis via cookie, validação de PIN no servidor com rate limiting, e um log de auditoria novo.

**Ações concluídas:** 25 de 26 (96%). A única pendente é **T026** — rodar o roteiro manual de `onboarding.md` contra o ambiente real (Vercel + Neon, com os clientes reais Kalea/Carola) — bloqueada neste ambiente por falta de `DATABASE_URL`/deploy real, não por falha técnica. Fica a cargo do usuário; quando executada, uma reexecução deste `/reversa-sync` complementa este adendo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/domain.md` | `#2. Regras de negócio centrais (consolidado dos 9 módulos)` | regra-nova | RN-API-01 deixa de ser 🔴 LACUNA: `clients.js`/`instances.js` agora exigem sessão válida (`401` sem sessão) antes de qualquer query. Ver `legacy-impact.md` da feature. |
| `_reversa_sdd/architecture.md` | `#Dívidas técnicas (consolidado)` | regra-nova | O item 1 da lista ("nenhuma rota de API verifica autenticação no servidor") não é mais válido como dívida técnica — foi corrigido por esta feature. |
| `_reversa_sdd/domain.md` | `#2. Regras de negócio centrais (consolidado dos 9 módulos)` | regra-removida | RN-AUTH-04 (fallback de busca de cliente por `includes()` nos dois sentidos) foi removida; resolução de código agora é sempre exata. |
| `_reversa_sdd/domain.md` | `#2. Regras de negócio centrais (consolidado dos 9 módulos)` | regra-alterada | RN-AUTH-05 (falha de rede não desloga o admin) foi precisada, não removida: vale só para falha de REDE — uma resposta explícita do servidor invalidando a sessão agora sempre desloga. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: auth` | regra-alterada | Esquema de sessão do admin deixa de ser um token HMAC autocontido e sem estado; passa a ser uma sessão revogável, persistida em tabela própria, entregue via cookie `HttpOnly`/`Secure`/`SameSite=Strict`. Login ganha segunda etapa (TOTP) quando `ADMIN_TOTP_SECRET` está configurado. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: client-intake` | regra-alterada | Validação de PIN e do link direto (`?code=...&brief=...`) migrou do navegador (consultando `clients.js` livremente) para `api/client-access.js`, no servidor, com correspondência exata e rate limiting. |
| `_reversa_sdd/erd-complete.md` | (schema geral) | delta-de-dados | 3 tabelas novas, aditivas: `sessions`, `auth_attempts`, `audit_log`. Nenhuma coluna de `clientes`/`instancias_briefing` foi alterada ou removida. Ver `data-delta.md` da feature para o DDL completo. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: api-backend` | componente-novo | Novos módulos de suporte: `api/_totp.js`, `api/_sessions.js`, `api/_attempts.js`, `api/_audit.js`, `api/_auth-guard.js`, `api/client-access.js` — nenhum deles existia na extração original. |

## Regras sob vigilância

W001, W002, W003, W004, W005 — ver `_reversa_forward/001-corrige-autenticacao-api/regression-watch.md` para o detalhe de cada regra e seu sinal de violação.

## Fontes

- `_reversa_forward/001-corrige-autenticacao-api/legacy-impact.md`
- `_reversa_forward/001-corrige-autenticacao-api/regression-watch.md`
- `_reversa_forward/001-corrige-autenticacao-api/requirements.md`
- `_reversa_forward/001-corrige-autenticacao-api/progress.jsonl`
