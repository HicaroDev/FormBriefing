# auth

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Autentica o admin do estúdio (e-mail/senha, sem tabela de usuários — credenciais em variáveis de ambiente) e autentica o cliente final por código único (`CLI-XXXX`) + PIN, sem senha nem sessão persistente.

## Responsabilidades
- Validar login do admin e emitir/verificar um token de sessão assinado (HMAC).
- Resolver a identidade do cliente a partir de um código digitado, com fallback de busca.
- Proteger o dashboard (client-side) contra acesso sem token válido.

## Regras de Negócio
- RN-AUTH-01: login do admin é único (sem tabela de usuários), credenciais fixas em `ADMIN_EMAIL`/`ADMIN_PASSWORD_SALT`/`ADMIN_PASSWORD_HASH`. 🟢
- RN-AUTH-02: se `salt` ou `hash` não estiverem configurados no ambiente, a verificação de senha sempre falha (fail-safe). 🟢
- RN-AUTH-03: token de sessão (`"<expiry_ms>.<hmac_hex>"`) usa `timingSafeEqual` na verificação — proteção contra timing attack. 🟢
- RN-AUTH-04: se falha de rede ao verificar o token, `requireAuth()` **deixa passar** (retorna `true`) — comportamento intencional para não travar offline, mas é uma brecha conhecida. 🟡
- RN-AUTH-05: resolução de PIN do cliente tem fallback por `includes()` bidirecional quando o código formatado não casa — heurística frouxa, pode casar por superstring. 🟡
- RN-AUTH-06: ao resolver briefings do cliente, usa sempre o **primeiro** da lista, sem seleção por status/data — pode abrir o briefing errado se houver mais de um. 🟡

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Admin faz login com e-mail+senha e recebe token de sessão válido por período definido | Must | `POST /api/auth {action:'login'}` retorna `{token, expiry}` com credenciais corretas |
| RF-02 | Sessão expirada ou inválida redireciona para `login.html` | Must | `verifyToken` retorna `false` após `expiry`; dashboard redireciona |
| RF-03 | Cliente acessa seu briefing digitando o código único | Must | `resolveClientByCode` resolve local ou remoto |
| RF-04 | Verificação de senha nunca passa sem salt/hash configurados | Must | `verifyPassword` retorna `false` sem env vars |
| RF-05 | Sanitizar BOM/espaços de variáveis de ambiente antes de comparar | Should | `sanitize()` aplicado antes de `scryptSync`/comparação |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Comparação de hash/HMAC via `timingSafeEqual`, não `===` | `api/auth.js` (`verifyToken`, `verifyPassword`) | 🟢 |
| Segurança | Sessão expira em tempo fixo (7 dias, conforme documentado) | `api/auth.js` (`signToken`) | 🟢 |
| Disponibilidade | Falha de rede na verificação não bloqueia o uso offline do dashboard | `dashboard.js` (`requireAuth`) | 🟡 |

## Critérios de Aceitação

```gherkin
Dado um admin com e-mail e senha corretos
Quando ele envia POST /api/auth {action:'login', email, password}
Então recebe {token, expiry} e é redirecionado para index.html

Dado um admin com senha incorreta
Quando ele envia POST /api/auth {action:'login'}
Então recebe erro e o formulário mostra mensagem, sem token

Dado um cliente com código único válido
Quando ele digita os 4+ dígitos do PIN no portal
Então é redirecionado para client-form.html com code e brief corretos

Dado um cliente com código que não resolve em nenhum cliente
Quando ele envia o formulário de acesso
Então vê mensagem de erro, sem redirecionamento
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Login do admin com token HMAC | Must | Caminho crítico, única porta de entrada do painel |
| Fail-safe de senha sem env vars | Must | Falha seguro é inegociável em autenticação |
| Fallback de rede em `requireAuth` | Should | Mitiga indisponibilidade, mas é também uma brecha conhecida (RN-AUTH-04) |
| Heurística de `includes()` no PIN | Could | Caso de borda, risco baixo mas presente (RN-AUTH-05) |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `api/auth.js` | `handler`, `signToken`, `verifyToken`, `verifyPassword`, `sanitize` | 🟢 |
| `login.html` | `handleLoginSubmit` | 🟢 |
| `dashboard.js` | `requireAuth` | 🟢 |
| `portal-auth.js` | `resolveClientByCode`, `setupPinInputs`, `handlePortalAccess` | 🟢 |
