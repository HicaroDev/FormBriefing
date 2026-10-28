# Requirements — Corrigir autenticação e autorização das rotas de API (RN-API-01)

> Primeira feature do ciclo forward do Reversa para FormBriefing / Studio Suite 2.0. Ancorada na extração reversa em `_reversa_sdd/`. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA → `[DÚVIDA]`.

## Objetivo

Hoje, qualquer requisição HTTP direta a `/api/clients` ou `/api/instances` tem poder total de leitura/escrita/exclusão sobre todos os clientes e briefings do estúdio, sem autenticação nenhuma no servidor — a única trava existente é client-side (`requireAuth()` em `dashboard.js`), facilmente contornável. Esta feature corrige essa falha, sem descartar o mecanismo de autenticação atual, e sem bloquear o acesso legítimo do cliente final via código/PIN. É pré-requisito explícito do usuário para qualquer feature nova (CRM/Lead, Projetos).

## Contexto (ancoragem na extração reversa)

- `_reversa_sdd/code-analysis.md#Módulo: api-backend` — confirma RN-API-01 (🟢): nenhum handler de `clients.js`/`instances.js` verifica sessão, token ou cabeçalho de autenticação; `requireAuth()` é puramente client-side.
- `_reversa_sdd/code-analysis.md#Módulo: auth` — confirma o mecanismo de autenticação existente (🟢): `api/auth.js` usa scrypt (senha do admin) + HMAC-SHA256 (token de sessão com expiração, 7 dias, comparação `timingSafeEqual`), credenciais vêm de variáveis de ambiente, sem tabela de usuários. O token **não carrega identidade/claims** — só confirma "é o admin", pois existe apenas um.
- `_reversa_sdd/architecture.md#Dívidas técnicas` — RN-API-01 listado como dívida técnica de severidade alta, prioridade de correção antes de qualquer feature nova.
- `_reversa_sdd/domain.md#2. Regras de negócio centrais` — RN-AUTH-03 (🟡) e RN-AUTH-04 (🟡): acesso do cliente ao portal usa o primeiro briefing encontrado para o código, e tem um fallback de busca por `includes()` nos dois sentidos que pode, em tese, casar PIN parcial com código de outro cliente — relevante para o requisito de blindar o acesso por PIN nesta feature.
- `_reversa_sdd/questions.md#Pergunta 1, 2, 3` e `_reversa_sdd/security-architecture-decisions.md` — decisão do usuário (2026-10-27): reaproveitar a autenticação existente se for segura, MFA/TOTP obrigatório para admin, sessões seguras, correção do servidor ANTES de qualquer CRM/Lead/Projeto, e exigência de auditoria técnica apresentada antes da implementação.

## Escopo

### Dentro do escopo
- Exigir autenticação e autorização no servidor em todas as rotas administrativas (`api/clients.js`, `api/instances.js`, e qualquer outro endpoint administrativo existente ou adicionado).
- Reaproveitar o mecanismo de autenticação atual (`api/auth.js`, scrypt + HMAC) como base, evoluindo-o apenas no necessário para suportar os novos requisitos (ver RF abaixo) — não substituir por um sistema de login paralelo.
- Adicionar MFA (TOTP) obrigatório para o admin, compatível com Google Authenticator e Microsoft Authenticator.
- Migrar sessão para cookies `HttpOnly`, `Secure`, `SameSite`, com expiração, revogação e reautenticação exigida para operações críticas (ex.: exclusão de cliente/instância).
- Proteção CSRF nas rotas que usam cookie de sessão.
- Manter e reforçar o acesso do cliente final por código/PIN: validação no servidor, sessão temporária restrita ao recurso autorizado (aquele `cliente_id`/`instancia_id` especificamente), expiração, e limite de tentativas (anti brute-force).
- Autorização por propriedade de registro: o cliente autenticado por PIN só pode ler/escrever o próprio registro, nunca listagem completa nem registros de outros clientes.
- Rate limiting básico nas rotas de login e de validação de PIN.
- Logs de auditoria para login, alterações relevantes e ações administrativas — nunca registrando senha, PIN ou token em texto.
- Auditoria técnica apresentada ANTES da implementação de código (stack de auth atual, mapa de rotas públicas/privadas, vulnerabilidades por severidade, plano de correção, dependências necessárias, testes que vão comprovar a correção) — exigência explícita do usuário, entregue como parte do `/reversa-plan`/`/reversa-to-do` desta feature, não como código.

### Fora do escopo
- Qualquer entidade ou rota nova de `Lead`/`Deal`/`Projeto` (feature separada, que só começa depois desta estar corrigida e validada — Pergunta 3 de `questions.md`).
- Passkeys (mencionado pelo usuário como evolução futura recomendada, não obrigatória neste MVP de segurança).
- Integração com provedor de identidade externo (OAuth/SSO) — não mencionado pelo usuário, sistema continua de operador único.
- Reescrever o schema de `clientes`/`instancias_briefing` fora do estritamente necessário para sessão/autenticação (ex.: não se aplica aqui a correção de RN-API-03/RN-API-04, que são sobre upsert e são de outra natureza — ficam registradas em `gaps.md` como pendência separada).

## Requisitos Funcionais

| ID | Requisito | Prioridade (MoSCoW) | Critério de Aceite | Confiança |
|----|-----------|---------------------|---------------------|-----------|
| RF-01 | Toda rota administrativa (`clients.js`, `instances.js` e demais) deve rejeitar com `401`/`403` qualquer requisição sem sessão de admin válida, antes de executar qualquer query | Must | Requisição direta (ex.: `curl`) sem cookie/token válido recebe `401`, nunca retorna dados | 🟢 |
| RF-02 | Login do admin exige segundo fator (TOTP) além de e-mail/senha | Must | Login só é concluído após código TOTP válido; sem TOTP configurado, acesso admin não é liberado | 🟢 |
| RF-03 | Sessão do admin usa cookie `HttpOnly`+`Secure`+`SameSite`, com expiração e endpoint de revogação (logout efetivo) | Must | Cookie não é acessível via JS no browser; logout invalida a sessão no servidor, não só remove o cookie no cliente | 🟢 |
| RF-04 | Operações críticas (ex.: `DELETE`, edição de dados sensíveis) exigem reautenticação ou validação adicional de sessão recente | Should | Uma sessão expirada por inatividade não consegue excluir um registro mesmo com cookie ainda presente | 🟡 |
| RF-05 | Cliente final continua acessando via código/PIN; o PIN é validado no servidor e gera sessão temporária restrita ao `cliente_id`/`instancia_id` correspondente, com expiração própria | Must | Sessão de cliente não consegue listar nem acessar registro de outro `cliente_id` | 🟢 |
| RF-06 | Acesso por PIN tem limite de tentativas (bloqueio temporário após N falhas) | Must | Após N tentativas inválidas, novas tentativas são bloqueadas por um intervalo, mesmo com PIN correto | 🟢 |
| RF-07 | Remover o fallback de busca de cliente por `includes()` nos dois sentidos (RN-AUTH-04) em favor de correspondência exata de código | Should | PIN parcial de um cliente nunca resolve para outro cliente por superstring | 🟡 |
| RF-08 | Logs de auditoria registram login (sucesso/falha), alterações relevantes e ações administrativas, sem nunca persistir senha/PIN/token em claro | Must | Consulta ao log mostra quem fez o quê e quando, sem expor segredo | 🟢 |
| RF-09 | Rate limiting nas rotas `/api/auth` (login) e de validação de PIN, com contagem de tentativas persistida em tabela nova no Postgres/Neon já existente (sem serviço externo) | Should | Sequência de requisições acima do limite recebe `429`; contagem sobrevive a cold start da função serverless | 🟢 |

## Requisitos Não Funcionais

| Tipo | Requisito | Evidência / Fonte | Confiança |
|------|-----------|--------------------|-----------|
| Segurança | Autorização sempre no servidor, nunca só no client (`dashboard.js`/`requireAuth()` atual é insuficiente) | `_reversa_sdd/code-analysis.md#Módulo: api-backend`, RN-API-01 | 🟢 |
| Segurança | Nenhuma alteração de schema do banco sem justificativa técnica apresentada antes | Decisão do usuário, `security-architecture-decisions.md` | 🟢 |
| Segurança | Segredos (chave HMAC, salt, segredo TOTP) em variáveis de ambiente protegidas, nunca hardcoded ou versionado | `_reversa_sdd/code-analysis.md#Módulo: auth` (padrão já usado hoje) | 🟢 |
| Compatibilidade | Mecanismo de auth existente (`api/auth.js`) é a base — evolução, não substituição | `_reversa_sdd/questions.md#Pergunta 1` | 🟢 |
| Operação | Sistema continua de operador único (um admin); não introduzir conceito de múltiplos papéis administrativos nesta feature | `_reversa_sdd/domain.md#1. Glossário` | 🟢 |
| Auditabilidade | Plano técnico e auditoria de vulnerabilidades apresentados antes da implementação de código desta feature | Decisão explícita do usuário | 🟢 |

## Critérios de Aceitação

```gherkin
Dado que não existe sessão de admin válida
Quando uma requisição é feita diretamente a GET /api/clients
Então a resposta é 401 e nenhum dado de cliente é retornado

Dado que o admin forneceu e-mail e senha corretos
Quando o código TOTP não é fornecido ou é inválido
Então o login não é concluído e nenhuma sessão é criada

Dado um cliente autenticado por PIN válido para a instância X
Quando ele tenta acessar a instância Y (de outro cliente) pela API
Então a resposta é 403 e nenhum dado da instância Y é retornado

Dado um PIN incorreto informado repetidamente
Quando o número de tentativas excede o limite configurado
Então novas tentativas são bloqueadas temporariamente, mesmo que o PIN correto seja informado depois desse limite
```

## Riscos e Impactos no Sistema Existente

- **Login real quebrar fluxo existente:** o login atual (`login.html`) e o dashboard (`dashboard.js`) consomem `api/auth.js` hoje sem MFA — adicionar TOTP exige mudança no front-end de login (nova etapa) e precisa de uma migração/fallback para a primeira vez que o admin configurar o TOTP, sem travá-lo fora do próprio sistema. Mitigação: etapa de "configurar TOTP" explícita no primeiro login pós-deploy, documentada no plano.
- **Cliente final perder acesso:** qualquer endurecimento no fluxo de PIN (remover fallback por `includes()`, adicionar limite de tentativas) pode bloquear acessos legítimos se os critérios forem calibrados errado. Mitigação: validar com os códigos reais já em produção (`CLI-XXXX` de clientes nomeados como "Kalea" e "Carola") antes de publicar.
- **Migração de sessão para cookie:** mudar de `localStorage` (token) para cookie `HttpOnly` muda como `dashboard.js` lê o estado de autenticação no front-end — impacto em todo o dashboard, não só na API. Mitigação: tratar como parte explícita do plano técnico, com teste manual do fluxo completo de login→dashboard→logout antes de considerar concluído.
- **Alteração de schema do banco:** esta feature já tem aprovação prévia do usuário (sessão de esclarecimentos, 2026-10-27) para criar uma tabela nova dedicada a tentativas de PIN/login, para viabilizar rate limiting (RF-09) sem serviço externo pago. Qualquer outra alteração de schema fora dessa, se necessária, ainda precisa ser justificada e aprovada explicitamente antes.

## Esclarecimentos

### Sessão 2026-10-27

- **Q:** TOTP compatível com Google/Microsoft Authenticator é padrão (RFC 6238) — existe preferência de biblioteca Node específica, ou a escolha técnica fica livre para o `/reversa-plan` propor e submeter à aprovação?
  **R:** Sim, escolha livre — não precisa perguntar de novo. A biblioteca é decidida no plano técnico, que ainda vai ser apresentado para aprovação antes da implementação (exigência já registrada em RF/Riscos abaixo).
- **Q:** Rate limiting de tentativas de PIN/login precisa guardar estado entre requisições — guardar numa tabela nova no mesmo Postgres/Neon já existente, ou em serviço externo (ex.: Upstash/Vercel KV)?
  **R:** Sim, usar o banco de dados que já existe (Postgres/Neon) — sem contratar serviço externo novo, consistente com a diretriz do usuário de não introduzir integrações pagas sem autorização.

## Pontos em Aberto

Nenhum ponto em aberto nesta feature — os dois pontos levantados na redação inicial foram resolvidos na sessão de esclarecimentos acima.

## Rastreabilidade

| Artefato da extração reversa | Relação com esta feature |
|---|---|
| `_reversa_sdd/code-analysis.md#Módulo: api-backend` | Confirma o problema (RN-API-01) que esta feature corrige |
| `_reversa_sdd/code-analysis.md#Módulo: auth` | Mecanismo de auth existente, base a ser reaproveitada e evoluída |
| `_reversa_sdd/domain.md` | RN-AUTH-03/04 (fallback de PIN) e RN-API-01/02 — contexto de risco adicional a tratar junto |
| `_reversa_sdd/architecture.md#Dívidas técnicas` | Classifica RN-API-01 como prioridade de correção antes de qualquer feature nova |
| `_reversa_sdd/security-architecture-decisions.md` | Fonte primária das decisões de produto/segurança desta feature |
| `_reversa_sdd/questions.md` (Perguntas 1, 2, 3, 12) | Respostas do usuário que fundamentam RF-01 a RF-09 |
| `_reversa_sdd/gaps.md` | Lista RN-API-03/RN-API-04 como pendências relacionadas, fora do escopo desta feature |
