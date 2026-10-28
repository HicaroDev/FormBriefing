# Roadmap — Corrigir autenticação e autorização das rotas de API (RN-API-01)

> Gerado pelo `/reversa-plan`. Delta sobre o legado documentado em `_reversa_sdd/`. Escala: 🟢 CONFIRMADO | 🟡 PREMISSA/INFERIDO | 🔴 LACUNA.

## Resumo da abordagem

Evoluir o esquema de autenticação atual (`api/auth.js`, scrypt + HMAC, sem claims) em vez de substituí-lo: adicionar MFA/TOTP ao login do admin, trocar o transporte de sessão de `localStorage`+header para cookie `HttpOnly`/`Secure`/`SameSite` com revogação real no servidor, criar um endpoint dedicado de autenticação do cliente por PIN (hoje o cliente só consulta `clients.js` livremente), e adicionar um middleware de autorização em `clients.js`/`instances.js` que todo handler passa a chamar antes de tocar no banco. Duas tabelas novas no Postgres existente (`sessions`, `auth_attempts`) cobrem revogação de sessão e rate limiting, sem serviço externo. TOTP é implementado com o módulo `crypto` nativo do Node (HMAC-SHA1, RFC 6238) — zero dependência nova, consistente com o estilo já usado em `api/auth.js`.

## Princípios Aplicados

Não existe `.reversa/principles.md` neste projeto — nenhum princípio formal a verificar. As diretrizes gerais de implementação do usuário (`_reversa_sdd/security-architecture-decisions.md`) fazem esse papel aqui e foram seguidas em cada decisão abaixo.

## Decisões Técnicas

| Decisão | Alternativas consideradas | Escolhida | Justificativa | Confiança |
|---|---|---|---|---|
| Biblioteca TOTP | (a) `otpauth`/`speakeasy` (dependência nova) · (b) implementação manual com `crypto` nativo do Node | **(b) Implementação manual** | Zero dependência nova; `api/auth.js` já implementa HMAC/scrypt manualmente — mantém o mesmo estilo; RFC 6238 é simples (HMAC-SHA1 truncado) | 🟢 (decidido na sessão de esclarecimentos, 2026-10-27) |
| Onde guardar o segredo TOTP do admin | (a) nova coluna/tabela no Postgres · (b) variável de ambiente `ADMIN_TOTP_SECRET` | **(b) Variável de ambiente** | Existe só um admin; `ADMIN_EMAIL`/`ADMIN_PASSWORD_SALT`/`ADMIN_PASSWORD_HASH` já seguem esse padrão (`_reversa_sdd/code-analysis.md#Módulo: auth`); evita tabela para um único valor | 🟢 |
| Transporte de sessão | (a) manter token em `localStorage` + header · (b) cookie `HttpOnly`/`Secure`/`SameSite` | **(b) Cookie** | Requisito explícito RF-03; `localStorage` é acessível via JS (risco XSS) e não é compatível com revogação real no servidor sem estado adicional | 🟢 |
| Revogação de sessão | (a) manter esquema stateless (HMAC + expiry, sem revogação real) · (b) tabela `sessions` com estado | **(b) Tabela `sessions`** | RF-03 exige logout efetivo no servidor; esquema atual (`signToken`/`verifyToken`) não suporta isso sem estado — é o mínimo de stateful necessário | 🟢 |
| Rate limiting (login admin + PIN cliente) | (a) em memória por instância serverless · (b) serviço externo pago · (c) tabela `auth_attempts` no Postgres existente | **(c) Tabela `auth_attempts`** | Decidido na sessão de esclarecimentos (2026-10-27); memória é frágil em serverless (cold start isola instâncias); serviço externo pago foi explicitamente descartado pelo usuário | 🟢 |
| Acesso do cliente por PIN | (a) manter cliente consultando `clients.js` livremente (atual) · (b) endpoint dedicado `api/client-access.js` que valida PIN no servidor e emite sessão restrita | **(b) Endpoint dedicado** | RF-05/RF-06 exigem validação e rate limit no servidor; hoje `portal-auth.js` resolve cliente direto via `GET /api/clients?code=`, sem sessão nem limite — é o mesmo buraco de RN-API-01, só que do lado do cliente | 🟢 |
| Fallback de busca por `includes()` (RN-AUTH-04) | (a) manter · (b) remover, exigir match exato | **(b) Remover** | RF-07; decisão já registrada no `requirements.md`, risco de casar PIN parcial com cliente errado | 🟢 |

## Delta Arquitetural

Sobre `_reversa_sdd/architecture.md` e `_reversa_sdd/c4-components.md`:

- **Novo:** middleware `api/_auth-guard.js` — função compartilhada chamada no topo de `clients.js`, `instances.js` e (se existir) outros endpoints administrativos. Resolve a sessão a partir do cookie, checa tipo (`admin` vs `cliente`) e, para `cliente`, verifica que o recurso pedido pertence ao `cliente_id`/`instancia_id` da própria sessão.
- **Novo:** `api/client-access.js` — endpoint que recebe o código/PIN do cliente, valida no servidor (reaproveitando a lógica hoje em `portal-auth.js`, mas movida para o backend), aplica rate limiting via `auth_attempts`, e emite sessão restrita em `sessions`.
- **Modificado:** `api/auth.js` — adiciona etapa de TOTP no `action: 'login'`, novo `action: 'verify-totp'` (ou equivalente), novo `action: 'logout'` que revoga a sessão em `sessions`, e emissão de cookie em vez de retornar token no corpo.
- **Modificado:** `api/clients.js`, `api/instances.js` — passam a chamar `_auth-guard.js` antes de qualquer query. Handlers de `cliente` autenticado filtram automaticamente pelo próprio `cliente_id`.
- **Modificado:** `dashboard.js` (`requireAuth()`) — deixa de gerenciar token em `localStorage`; passa a confiar no cookie e num endpoint `GET /api/auth?action=session` para saber se a sessão é válida (o comportamento atual de "falha de rede deixa passar", RN-AUTH-05, deve ser revisto — ver Riscos).
- **Modificado:** `portal-auth.js` — deixa de consultar `clients.js` diretamente; passa a chamar `api/client-access.js`.
- **Não muda:** `form-engine.js`, `store.js` (camada de dados), schema de `clientes`/`instancias_briefing` (nenhuma coluna nova nessas duas tabelas).

## Delta de Dados

Resumo (detalhe completo em `data-delta.md`): três tabelas novas (`sessions`, `auth_attempts`, `audit_log` — a terceira adicionada na decomposição em `actions.md` para cobrir RF-08 por completo), zero alteração nas tabelas existentes (`clientes`, `instancias_briefing`), um novo env var (`ADMIN_TOTP_SECRET`).

## Delta de Contratos

Resumo (detalhe completo em `interfaces/`): `api/auth.js` muda de contrato (login passa a ter 2 etapas, cookie em vez de token no corpo, novo `logout`); `api/client-access.js` é contrato novo; `api/clients.js`/`api/instances.js` mantêm o mesmo contrato de dados, mas agora exigem sessão válida (erros `401`/`403` novos nos casos sem sessão).

## Plano de Migração

1. **Aditivo primeiro:** criar as tabelas novas e o endpoint `client-access.js` sem remover nada do fluxo atual — nada quebra ainda.
2. **TOTP opcional-depois-obrigatório:** no primeiro deploy, se `ADMIN_TOTP_SECRET` não estiver configurado, o login funciona normalmente mas exibe aviso "configure o MFA"; depois que o admin configurar e confirmar, `login` passa a exigir TOTP sempre. Evita trancar o próprio admin fora do sistema no meio da migração.
3. **Cookie em paralelo com token antigo por uma janela curta:** `api/auth.js` passa a emitir cookie E ainda aceitar o token antigo por um tempo, até confirmar que o dashboard migrou para o novo fluxo — depois disso, o token antigo é desativado.
4. **Fechar a porta:** só depois dos passos 1-3 validados manualmente é que `clients.js`/`instances.js` passam a exigir sessão (`_auth-guard.js` em modo bloqueante). Antes disso, pode rodar em modo "log apenas" (loga quem acessaria sem sessão, sem bloquear ainda) para validar que nenhum fluxo legítimo seria quebrado.
5. **Cliente migra para `client-access.js`:** troca `portal-auth.js` para o novo endpoint só depois do passo 4 confirmado.

## Riscos

- **RN-AUTH-05 (falha de rede não desloga) precisa ser revisto:** hoje é intencional (não travar o dashboard offline). Com cookie+sessão revogável, mantemos esse comportamento para falha de REDE (deixa passar), mas uma resposta explícita `401` do servidor (sessão revogada/expirada) deve sempre deslogar — distinção a deixar clara no `/reversa-to-do`.
- **Admin perder acesso ao configurar TOTP errado:** mitigado pelo plano de migração (passo 2) e por um "código de recuperação" único exibido uma vez no momento da configuração do TOTP (texto simples, guardado pelo usuário fora do sistema — não é um requisito novo, é prática padrão de TOTP).
- **Clientes reais em produção (`Kalea`, `Carola`) não podem perder acesso durante a migração do PIN:** mitigado pelo plano de migração (passos 1 e 5 — endpoint novo convive com o antigo até confirmação manual).
- **Duas tabelas novas = duas migrações novas em `api/migrate.js`:** seguir o mesmo padrão `CREATE TABLE IF NOT EXISTS` já usado (não é destrutivo, é aditivo).

## Critério de Pronto

- [ ] `GET/POST/PATCH/DELETE /api/clients` e `/api/instances` retornam `401`/`403` sem sessão válida, confirmado com `curl` direto (sem UI)
- [ ] Login do admin exige TOTP válido depois de configurado
- [ ] Logout revoga a sessão no servidor (nova tentativa com o cookie antigo falha)
- [ ] Cliente só acessa o próprio `cliente_id`/`instancia_id` via `client-access.js` + sessão restrita
- [ ] PIN errado repetido é bloqueado temporariamente (`auth_attempts`)
- [ ] Clientes reais existentes (`Kalea`, `Carola`) testados manualmente sem perda de acesso
- [ ] Nenhuma alteração nas tabelas `clientes`/`instancias_briefing`
