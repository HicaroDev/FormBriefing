# Data Delta — Corrigir autenticação e autorização das rotas de API

> Gerado pelo `/reversa-plan`. Diff conceitual sobre o modelo extraído em `_reversa_sdd/erd-complete.md` e `_reversa_sdd/data-dictionary.md`. **Nenhuma destas alterações foi aplicada ao banco real ainda** — isso é trabalho do `/reversa-coding`, depois de aprovado.

## Tabelas existentes — SEM alteração

- `clientes` — nenhuma coluna nova, nenhuma alteração.
- `instancias_briefing` — nenhuma coluna nova, nenhuma alteração.

Justificativa: o usuário pediu explicitamente para evitar alteração de schema sem necessidade e para não duplicar tabelas; nenhum requisito desta feature exige tocar nessas duas.

## Tabelas novas (aprovação prévia do usuário, sessão de esclarecimentos 2026-10-27)

### `sessions`

Sessão revogável, compartilhada entre admin e cliente (evita duplicar estrutura para dois tipos de sessão).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `text` (PK) | Identificador da sessão (parte do valor do cookie) |
| `tipo` | `text` | `'admin'` ou `'cliente'` |
| `sujeito_id` | `text` | Para `admin`: constante (só existe um); para `cliente`: `cliente_id` + `instancia_id` autorizados |
| `criado_em` | `timestamptz` | Emissão |
| `expira_em` | `timestamptz` | Expiração (7 dias para admin, igual ao atual `SESSION_DURATION_MS`; mais curto para cliente — a definir no `/reversa-to-do`) |
| `revogado_em` | `timestamptz`, nullable | Preenchido no logout/revogação; sessão com este campo preenchido é sempre inválida, mesmo antes de `expira_em` |

### `auth_attempts`

Contagem de tentativas, reaproveitada tanto para o login do admin quanto para o PIN do cliente (evita duplicar tabela de rate limit por fluxo).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `serial` (PK) | — |
| `identificador` | `text` | E-mail do admin OU código do cliente tentado (não armazenar PIN/senha, só o identificador da tentativa) |
| `tipo` | `text` | `'login_admin'` ou `'pin_cliente'` |
| `sucesso` | `boolean` | Se a tentativa foi bem-sucedida |
| `criado_em` | `timestamptz` | Quando a tentativa ocorreu |

Consulta típica de bloqueio: `COUNT(*) WHERE identificador = ? AND tipo = ? AND sucesso = false AND criado_em > now() - intervalo`.

### `audit_log`

Cobre RF-08 ("alterações relevantes e ações administrativas"), que `sessions`/`auth_attempts` não cobrem por si (essas duas só registram login/PIN). Sem esta tabela, RF-08 ficaria parcialmente implementado. Adicionada durante a decomposição em `actions.md` — mesma régua de aprovação das duas tabelas anteriores (aditiva, sem custo externo, sem duplicar as outras duas).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `serial` (PK) | — |
| `ator` | `text` | `'admin'` ou `cliente_id` de quem realizou a ação |
| `acao` | `text` | Identificador curto, ex.: `'login'`, `'logout'`, `'cliente.create'`, `'instancia.delete'` |
| `alvo_tipo` | `text`, nullable | `'cliente'`, `'instancia'`, etc., quando aplicável |
| `alvo_id` | `text`, nullable | ID do registro afetado, quando aplicável |
| `criado_em` | `timestamptz` | Quando a ação ocorreu |

Nunca grava senha, PIN ou token — só identificadores e nomes de ação.

## Variáveis de ambiente novas

| Variável | Uso | Observação |
|---|---|---|
| `ADMIN_TOTP_SECRET` | Segredo TOTP (Base32) do admin, mesmo padrão de `ADMIN_PASSWORD_SALT`/`HASH` | Gerado uma vez no setup (ver `onboarding.md`), configurado manualmente na Vercel |

## Migração

Seguir o padrão já usado em `api/migrate.js` (`CREATE TABLE IF NOT EXISTS ...`) — puramente aditivo, sem `DROP`/`ALTER` destrutivo em tabela existente. Nenhum dado existente de `clientes`/`instancias_briefing` é tocado ou migrado.
