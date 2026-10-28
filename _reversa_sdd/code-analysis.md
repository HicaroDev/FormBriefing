# Análise de Código — FormBriefing / Studio Suite 2.0

> Gerado pelo Archaeologist (fase de escavação). Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Módulo: `auth`

**Arquivos primários:** `login.html` (script inline), `portal.html` + `portal-auth.js`, `api/auth.js`, uso em `dashboard.js` (`requireAuth`)

**Propósito:** 🟢 Autenticar o admin do estúdio (login/senha) e autenticar o cliente final (código único `CLI-XXXX`/PIN), sem tabela de usuários — credenciais do admin vêm de variáveis de ambiente.

### 1. Fluxo de controle

**`api/auth.js` → `handler(req, res)`** 🟢
- Só aceita `POST`. Lê `{ action, email, password, token }` do body.
- `action === 'verify'` → retorna `{ valid: verifyToken(token) }`
- `action === 'login'` → valida email (case-insensitive, trim) + senha (scrypt) → se ok, gera token e retorna `{ token, expiry }`
- Qualquer outra ação → 400 `{ error: 'Ação inválida.' }`

**`signToken(expiry)`** 🟢 — `hmac_sha256(SESSION_SECRET, String(expiry))`, token final = `"<expiry_ms>.<hmac_hex>"`

**`verifyToken(token)`** 🟢
- Rejeita se não tem `.`, se `expiry` não é número, ou se `Date.now() > expiry` (expirado)
- Recalcula o HMAC esperado e compara com `timingSafeEqual` (proteção contra timing attack)

**`verifyPassword(password)`** 🟢
- `scryptSync(password, ADMIN_PASSWORD_SALT, 64).toString('hex')`
- Compara com `ADMIN_PASSWORD_HASH` via `timingSafeEqual`
- Se `salt` ou `hash` não configurados no ambiente → sempre falso (fail-safe)

**`sanitize(str)`** 🟢 — remove caracteres de largura zero/BOM (`[﻿​]`) e `trim()`. 🟡 INFERIDO: existe provavelmente porque variáveis de ambiente coladas na Vercel já vieram com caracteres invisíveis, causando falhas de comparação (combina com o incidente de debug desta sessão sobre hash/salt).

**`login.html` → `handleLoginSubmit(e)`** 🟢
- Lê `#email-field`/`#password-field`, desabilita botão com spinner
- `POST /api/auth { action: 'login' }` → se `!res.ok || !data.token`: mostra erro (`showLoginError`) e reabilita botão
- Se ok: `localStorage.setItem('studiointake_admin_token', data.token)` → feedback visual de sucesso → `setTimeout` 500ms → redireciona para `index.html`
- Erro de rede (`catch`): mostra "Erro de conexão"

**`dashboard.js` → `requireAuth()`** 🟢
- Sem token no localStorage → redireciona para `login.html`, retorna `false`
- Com token → `POST /api/auth { action: 'verify' }`
- Token inválido → remove do localStorage, redireciona para `login.html`
- **Falha de rede** → retorna `true` (deixa passar) — comentário explícito no código: evita travar o dashboard offline por causa da checagem de auth. 🟡 Esse comportamento é a brecha que permite abrir o dashboard localmente sem backend real, setando qualquer token truthy (usado nesta sessão para QA visual).

**`portal-auth.js` → fluxo do cliente** 🟢
- `DOMContentLoaded`: lê query params `code`/`pin` e `brief`/`id`
  - Se `code` + `brief` presentes → redireciona direto para `client-form.html?code=...&brief=...` (deep link)
  - Se só `code` → resolve cliente (`resolveClientByCode`) e pré-popula banner + dígitos do PIN
- `resolveClientByCode(code)`: busca local (`getClientByCode`) → se não achar, busca remoto (`fetchClientByCodeRemote`) e cacheia em `saveClients`
- `setupPinInputs()`: liga listeners de input (filtra não-dígitos, auto-avança foco), `keydown` (Backspace volta foco), `paste` (distribui dígitos colados pelos inputs), e `onsubmit` do form chama `handlePortalAccess()`
- `handlePortalAccess()`:
  1. Concatena os dígitos dos inputs de PIN
  2. Exige mínimo 4 dígitos (`alert` se não)
  3. Monta código `CLI-<4 primeiros dígitos>` e resolve cliente
  4. Fallback: se não achou pelo código formatado, procura em todos os clientes locais por `includes()` nos dois sentidos 🟡 (heurística frouxa — pode casar PIN incorreto por superstring, ver observação de risco abaixo)
  5. Sem cliente → mensagem de erro e `alert`
  6. Busca briefings do cliente (local primeiro, remoto como fallback) e usa o **primeiro** da lista como `briefId` 🟡 (não há seleção por status/mais recente — se o cliente tiver múltiplos briefings, pode abrir o errado)
  7. Sem briefing pendente → mensagem de erro, sem alert
  8. Sucesso → feedback visual, `setTimeout` 500ms → redireciona para `client-form.html?code=...&brief=...`

### 2. Algoritmos e lógica

- **Hash de senha:** `scrypt` (N/r/p padrão do Node, keylen 64) — 🟢 escolha correta para senha de baixo volume (single admin), mas sem fator de custo explícito configurado (usa defaults do Node).
- **Assinatura de sessão:** HMAC-SHA256 sobre o timestamp de expiração — não é JWT, é um esquema simples próprio. 🟢 Funciona, mas o token **não carrega identidade** (não há `user_id`/claims) — qualquer verificação bem-sucedida assume "é o admin", pois só existe um.
- **Comparação constant-time:** `timingSafeEqual` usado tanto na senha quanto no token — 🟢 boa prática contra timing attack.
- **Validação de PIN:** `digits.length < 4` é a única validação de formato — não valida que sejam exatamente os dígitos esperados do código do cliente antes do fallback por `includes()`.

### 3. Estruturas de dados

Ver `data-dictionary.md` para o dicionário completo. Entidades relevantes a este módulo: nenhuma entidade de banco própria — consome `Cliente` e `BriefingInstance` definidos no módulo `dashboard-core`/`client-intake`. O "usuário admin" não é uma entidade de banco, é configuração de ambiente.

### 4. Metadados e configurações

| Variável de ambiente | Uso | Confiança |
|---|---|---|
| `SESSION_SECRET` | chave HMAC do token de sessão | 🟢 |
| `ADMIN_EMAIL` | e-mail do único admin | 🟢 |
| `ADMIN_PASSWORD_SALT` | salt do scrypt | 🟢 |
| `ADMIN_PASSWORD_HASH` | hash esperado (scrypt) | 🟢 |
| `SESSION_DURATION_MS` | constante no código, 7 dias (`1000*60*60*24*7`) | 🟢 |

### Regras de negócio extraídas

- RN-AUTH-01 🟢: sessão de admin dura 7 dias a partir do login (`api/auth.js:13`).
- RN-AUTH-02 🟢: login falha silenciosamente para "senha incorreta" se `ADMIN_PASSWORD_SALT`/`HASH` não estiverem configurados — nunca expõe que é problema de config (`api/auth.js:41-42`).
- RN-AUTH-03 🟡: acesso do cliente ao portal usa o **primeiro** briefing encontrado para aquele código — não há tela de seleção quando há mais de um briefing ativo (`portal-auth.js:161`).
- RN-AUTH-04 🟡 **(risco a validar com o usuário):** fallback de busca de cliente por `includes()` nos dois sentidos pode, em tese, casar um PIN parcial com o código de outro cliente se os dígitos forem substring um do outro (`portal-auth.js:139`). Vale confirmar se isso é aceitável ou se deve ser endurecido no forward.
- RN-AUTH-05 🟢: falha de rede na verificação de sessão do admin (`requireAuth`) **não desloga** o usuário — assume sessão válida (`dashboard.js:78-81`).

### Checkpoint
Módulo `auth` concluído. Entidades: 0 (consome `Cliente`/`BriefingInstance` de outros módulos). Algoritmos: scrypt + HMAC-SHA256, matching de PIN por substring (fallback). Complexidade: média (lógica de auth dupla — admin + cliente — mas arquivos pequenos e bem isolados).

---

## Módulo: `dashboard-core`

**Arquivos primários:** `index.html` (markup + seletores), `dashboard.js` (~100KB, controller), `store.js` (~74KB, camada de dados)

**Propósito:** 🟢 Dashboard operacional da agência — métricas, tabela de briefings/clientes, inspetor lateral de detalhe, modais de criação/disparo/ajuste/aprovação, geração de resumo executivo (digest) e sincronização com o Neon.

### 1. Fluxo de controle

**Inicialização (`DOMContentLoaded`)** 🟢 — `requireAuth()` → se autorizado: `renderMetrics`, `renderDistribution`, `renderRecentActivity`, `setupEventListeners`, `setupModal`, `setupAdjustmentsModal`, `setupAIGeneratorModal`, `checkHashRoute` → seleciona o primeiro briefing (`selectBrief`) ou mostra estado vazio. Registra: `hashchange`, evento customizado `storage`, evento customizado `studiointake:update`, **polling de 3.5s** (hash de estado local) e **polling de 10s** (`syncAllFromRemote`) — 🟡 é uma estratégia de "sincronização em tempo real" por polling, não websocket/SSE.

**`checkHashRoute()`** 🟢 — `#clients`/`#crm` na URL alterna `currentView` para `'clients'` (mostra CRM/carteira de clientes) e ajusta a pílula ativa; qualquer outro hash volta para `'briefs'`.

**`renderTable()`** 🟢 — roteia para `renderClientsTable` se `currentView === 'clients'`, senão aplica filtro (`currentFilter`: all/submitted/review/ready/open/processing) + busca textual (`searchQuery` contra empresa/código/vertical/responsável/id/etapa) sobre `getBriefingInstances()`, e desenha a tabela de briefings com badges de status/urgência calculados inline.

**`selectBrief(briefId, reRenderTable)`** 🟢 — resintetiza o digest a cada seleção (`generateProductionDigest`, nunca usa um digest "congelado"), popula o painel inspetor (header, tags, abas Digest/Raio-X, contato, botões de ação) via `querySelector` em cadeias de classe CSS específicas (⚠️ acoplamento frágil — qualquer troca de classe no HTML do aside quebra o inspetor, já ocorreu um bug desse tipo nesta sessão).

**Ações do diretor:** `approveBriefing` (→ status `aprovado_kickoff` + gera/atualiza digest), `exportBriefingMarkdown` (copia MD pra clipboard), `exportAllBriefingsCSV` (gera CSV de todos os briefings), `openAdjustmentsModal`/`handleConfirmAdjustments` (→ status `ajustes_solicitados` + feedback + mensagem de WhatsApp pronta), `shareWhatsApp` (abre `wa.me` ou copia mensagem).

**Modais:** `setupModal`/`handleCreateClientSubmit` (cadastro de cliente novo + 1º briefing), `setupSendBriefingModal`/`openSendBriefingModal`/`confirmSendBriefing` (disparo de briefing pra cliente já existente — adicionado nesta sessão, substituiu um `prompt()`), `setupAdjustmentsModal`, `setupExpandedRawModal`/`openExpandedRawModal` (visão cheia de respostas, com ações de aprovar/ajustar/exportar), `setupAIGeneratorModal`/`handleGenerateAITemplate` (gera template via `ai-briefing-generator.js`).

### 2. Algoritmos e lógica

- **Geração de código de cliente** (`generateClientCode`, store.js:729) 🟢 — `CLI-` + 4 dígitos aleatórios (1000-9999), checa colisão contra códigos existentes, até 100 tentativas (depois usa mesmo colidindo — 🔴 LACUNA: nenhum tratamento se exceder 100 tentativas, cenário improvável mas sem fallback).
- **Geração de ID de briefing** (`generateBriefingId`, store.js:747) 🟢 — `BRF-<ano>-<seq>`, onde `seq = instances.length + 90` 🟡 INFERIDO: não é um contador persistente, é derivado do tamanho atual da lista — se um briefing for deletado, o próximo ID pode colidir ou repetir sequência (risco a validar).
- **Merge de templates** (`getTemplates`, store.js:832) 🟢 — SEED_TEMPLATES do código SEMPRE sobrescreve o cache local pelo mesmo `id` (garante que mudança de código "ganha" de cache antigo do navegador); templates só existentes em cache (ex: gerados por IA) são preservados.
- **Síntese do Resumo Executivo / Digest** (`generateProductionDigest`, store.js:994) 🟢 — o algoritmo mais complexo do sistema:
  1. Resolve dinamicamente os campos do **template real da instância** (nunca nomes fixos) — qualquer template novo funciona sem alterar esta função.
  2. Objetivo sintetizado = concatenação de todos os campos `textarea` preenchidos (label: valor), com fallback textual se nada preenchido.
  3. Pilares = todos os campos `cards_single_select`/`select` preenchidos, formatados como `label: rótulo da opção`.
  4. Entregáveis = todos os valores de campos `chips_multiselect`.
  5. Integrações técnicas = heurística por vertical do cliente (physio→Cliniko/Mindbody-like, pilates→Mariana Tek/Mindbody, events→credenciamento NFC, fallback→Webhooks/API REST).
  6. Checklist de kickoff: 3 primeiros itens **sempre recalculados** (nunca herdam status antigo); itens 4+ são específicos por vertical e **preservam marcação manual anterior** (casamento por texto do item, não por índice).
  - 🟡 Esse algoritmo é 100% determinístico/baseado em regras — não é "IA" de fato apesar do nome do digest sugerir inteligência; é uma transformação estruturada das respostas brutas.
- **Métricas calculadas** (`renderCalculatedMetrics`) 🟢 — SLA médio = média de horas entre `data_envio` e `data_resposta` nas instâncias respondidas; tempo de descoberta = média de dias entre envio e resposta nos `aprovado_kickoff`; clientes ativos = contagem de `status_cliente === 'ativo'`.
- **Filtro + busca da tabela** (`renderTable`) 🟢 — filtro por status (mapeado many-to-one, ex: "processing" cobre `em_preenchimento` + `ajustes_solicitados`) combinado com busca textual simples (`includes`) sobre uma string concatenada de campos do cliente/instância.

### 3. Estruturas de dados

Ver `data-dictionary.md`. Entidades geridas por este módulo: **Cliente**, **BriefingTemplate**, **BriefingInstance**, **RespostaDigest** (as 4 entidades de SEED.md).

### 4. Metadados e configurações

- `STORAGE_KEYS` (store.js:14) — chaves do localStorage, todas com sufixo `_v3` (`studiointake_clientes_v3`, `studiointake_templates_v3`, `studiointake_instancias_v3`, `studiointake_digests_v3`, `studiointake_config_v3`) — versão bumped manualmente no código quando a estrutura de `SEED_TEMPLATES` muda, para forçar invalidação de cache do navegador.
- `VERTICAL_LABELS` (dashboard.js:248) — mapa de verticais → `{ nome, cor }`: `pilates`, `physio`, `fisio_pilates`, `events`, `universal`.
- `STATUS_ACTIVITY_META` (referenciado em `renderRecentActivity`, definição não lida em detalhe nesta passada) — mapa de status → `{ label, classe }` para badges.
- Máquina de estados (🟢 confirmada no cabeçalho de `store.js` e nos usos de `status`): `rascunho → enviado → em_preenchimento → submetido → em_revisao → ajustes_solicitados → aprovado_kickoff`. 🟡 INFERIDO: a transição não é estritamente linear no código — `ajustes_solicitados` pode ser setado a partir de qualquer status via `handleConfirmAdjustments`, e não há validação de transição (qualquer `updateBriefingStatus(id, novoStatus)` é aceito, sem máquina de estados formal que rejeite transições inválidas).

### Regras de negócio extraídas

- RN-CORE-01 🟢: `getTemplates()` sempre funde SEED_TEMPLATES do código por cima do cache — templates de código nunca ficam "desatualizados" no navegador do cliente (store.js:846-848).
- RN-CORE-02 🟢: ao marcar `submetido` ou `aprovado_kickoff`, o digest de produção é **automaticamente** gerado/resintetizado (store.js:983-985).
- RN-CORE-03 🟢: os 3 primeiros itens do checklist de kickoff são sempre recalculados do zero a cada síntese; apenas itens específicos de vertical (4º em diante) preservam marcação manual anterior (store.js:1100-1108).
- RN-CORE-04 🔴 **(risco, requer validação humana):** não existe validação de transição de status — qualquer chamada a `updateBriefingStatus` aceita qualquer string de status, sem checar se é uma transição válida da máquina de estados documentada em SEED.md.
- RN-CORE-05 🟡: `generateBriefingId` deriva a sequência do tamanho atual da lista de instâncias (`length + 90`), não de um contador incremental persistente — pode gerar duplicatas se uma instância for removida e outra criada na mesma sessão/ano (vale confirmar com o usuário se há exclusão de briefing em algum fluxo).
- RN-CORE-06 🟢: falha de rede em qualquer chamada de sincronização remota (`syncClientRemote`, `syncInstanceRemote`, `patchInstanceRemote`, `fetch*Remote`) nunca quebra a UI — todas são fire-and-forget com fallback silencioso (`apiCall` captura exceção e retorna `null`).
- RN-CORE-07 🟢: `syncAllFromRemote()` trata o banco remoto como fonte de verdade absoluta — substitui (não funde) clientes/instâncias locais a cada sync, para refletir exclusões feitas no servidor (store.js:1454-1457).

### Checkpoint
Módulo `dashboard-core` concluído. Entidades: 4 (Cliente, BriefingTemplate, BriefingInstance, RespostaDigest). Algoritmos principais: geração de código/ID, merge de templates, síntese de digest baseada em regras por vertical, métricas calculadas, filtro+busca. Complexidade: alta (maior módulo do sistema, muita lógica de UI acoplada a estrutura de DOM específica).

---

## Módulo: `client-intake`

**Arquivos primários:** `client-form.html` (markup + stepper), `form-engine.js` (~53KB, motor paramétrico + portal do cliente)

**Propósito:** 🟢 Portal onde o cliente final preenche o briefing — renderiza perguntas dinamicamente a partir do `BriefingTemplate`, com autosave, suporte a 3 idiomas (PT/IT/EN), isolamento de dados entre clientes (zero-leakage) e fluxo de submissão final com confirmação de identidade.

### 1. Fluxo de controle

**`initClientPortal()`** 🟢 (bootstrap principal, chamado em `DOMContentLoaded`):
1. `enforceRoleIsolation()` roda **antes de tudo**, mesmo antes de resolver cliente/instância — remove links internos da agência do header incondicionalmente.
2. Resolve `code`/`pin` e `brief`/`id` da URL. Busca local primeiro (`getClientByCode`, `getBriefingInstanceById`).
3. **Se algum parâmetro foi passado na URL**, sempre revalida contra o banco remoto em paralelo (`fetchClientByCodeRemote` + `fetchInstanceByIdRemote`) — nunca confia só no cache local, para não mostrar ao cliente um status desatualizado.
4. **Regra de segurança crítica (zero-leakage):** se `code` ou `brief` foram informados na URL mas não resolveram (nem local, nem remoto), mostra "link inválido" e **para** — nunca cai no fallback de "primeiro cliente disponível", que vazaria dados de outro cliente que por acaso esteja em cache no mesmo navegador.
5. Fallback de "primeiro cliente/instância disponível" só é usado quando **nenhum parâmetro** foi passado (cenário de teste/demonstração local).
6. Resolve template (pelo `template_id` da instância, ou por vertical do cliente como fallback).
7. Carrega `respostas_brutas`/`anexos` existentes para dentro do estado em memória (`formAnswers`, `uploadedFiles`).
8. Resolve idioma: `?lang=` da URL > preferência salva em `localStorage` > `'pt'` como padrão.
9. Renderiza header, formulário dinâmico, e configura autosave + dock de ações.

**`renderDynamicFormSections()` / `renderField(campo, isReadOnly)`** 🟢 — motor paramétrico: cada tipo de campo (`text`, `textarea`, `select`, `chips_multiselect`, `cards_single_select`, slider, upload) tem sua própria renderização de HTML + binding de evento, via `attachFieldEventListeners`.

**`triggerAutosave()`** 🟢 — debounce de 600ms após qualquer mudança de campo. Ao disparar: calcula `progresso_percentual` (campos preenchidos / total de campos do template), promove status `rascunho → em_preenchimento` automaticamente na primeira resposta, salva local (`updateBriefingInstance`) e remoto (`patchInstanceRemote`, fire-and-forget).

**`handleFinalSubmission()` → `executeFinalSubmission(nome, email)`** 🟢:
1. Abre modal de confirmação de identidade (nome + e-mail, com validação de formato de e-mail via regex).
2. Ao confirmar: grava `__confirmado_nome`/`__confirmado_email` **dentro de `formAnswers`** (chaves com prefixo `__`, para não colidir com ids de campos reais do template).
3. `updateBriefingStatus(id, 'submetido')` + `progresso_percentual: 100`.
4. Sincroniza com o remoto, incluindo `data_resposta`.
5. Gera um **digest preliminar simplificado** direto no cliente (`saveDigest`) — 🟡 observação: esse digest é mais simples que o `generateProductionDigest` do `store.js` e é **sobrescrito** na próxima vez que a agência abrir o briefing no dashboard (`selectBrief` sempre resintetiza). Não é um bug funcional, mas é lógica duplicada/divergente entre dois arquivos para o "mesmo" conceito de digest.
6. Mostra modal de sucesso com número de protocolo.

**Edição pós-submissão (`openEditUnlockModal` → `unlockForEditing`)** 🟢 — só é oferecido quando `status === 'submetido'` (aguardando revisão). Depois que a agência aprova (`aprovado_kickoff`), a opção de editar não é mais oferecida — travado permanentemente. Para desbloquear, exige confirmação do e-mail usado na submissão original (`formAnswers.__confirmado_email`), comparado case-insensitive.

### 2. Algoritmos e lógica

- **Resolução de i18n (`t(val, vars)`)** 🟢 — aceita string pura (compat. com templates antigos) ou objeto `{pt, it, en}`; fallback em cascata `activeLocale → pt → it → en → primeiro valor disponível`; suporta interpolação de variáveis `{nome}`.
- **Cálculo de progresso** 🟢 — `filledCount / totalFields`, considera array vazio como não preenchido.
- **Validação de e-mail** 🟢 — regex simples `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (não é RFC 5322 completo, mas cobre o caso comum).
- **Zero-Leakage Gate (RN crítica)** 🟢 — já detalhado no fluxo acima; é a defesa central contra um cliente ver dados de outro.

### 3. Estruturas de dados

Não introduz novas entidades — consome `Cliente`, `BriefingInstance`, `BriefingTemplate` do módulo `dashboard-core`. Confirma o formato de `anexos[]`: 🟢 `{ nome: string, tamanho: string ("X.X MB"), tipo: string (extensão) }` (`form-engine.js:770-774`).

### 4. Metadados e configurações

- `SUPPORTED_LOCALES = ['pt', 'it', 'en']`, persistido em `localStorage.studiointake_locale`.
- `UI_STRINGS` / `EDIT_UNLOCK_STRINGS` / `SUBMIT_CONFIRM_STRINGS` — dicionários de strings de interface nos 3 idiomas (não são dados de negócio, são i18n da própria aplicação, independente do i18n dos templates).
- Debounce de autosave: 600ms (constante no código).

### Regras de negócio extraídas

- RN-INTAKE-01 🟢 **(segurança crítica)**: nunca cair em fallback de "primeiro cliente disponível" quando um código/brief foi explicitamente passado na URL mas não resolveu — previne vazamento cross-cliente (`form-engine.js:182-185`).
- RN-INTAKE-02 🟢: `enforceRoleIsolation()` roda antes de qualquer resolução de dados, incluindo a tela de erro — menus internos da agência nunca aparecem no portal do cliente, nem em caso de erro.
- RN-INTAKE-03 🟢: autosave promove automaticamente `rascunho → em_preenchimento` na primeira edição, sem ação explícita do cliente.
- RN-INTAKE-04 🟢: edição pós-submissão só é oferecida durante `submetido`; `aprovado_kickoff` é terminal e não oferece reabertura pela UI do cliente (🔴 LACUNA: não há verificação se a agência pode reabrir via dashboard, isso ficaria em `dashboard-core` — não observado nenhum botão para isso).
- RN-INTAKE-05 🟡: o digest gerado na submissão (`executeFinalSubmission`) é mais simples que `generateProductionDigest` e fica obsoleto assim que a agência abre o briefing — risco de confusão se alguém inspecionar o banco entre a submissão e a primeira abertura pela agência (janela pequena, mas existe).
- RN-INTAKE-06 🟢: idioma do briefing é por sessão/navegador (`localStorage`), não por cliente/instância salvo no banco — se o cliente muda de dispositivo, o idioma volta para o padrão `pt` (a menos que `?lang=` seja passado no link).

### Checkpoint
Módulo `client-intake` concluído. Entidades: 0 novas (consome Cliente/BriefingInstance/BriefingTemplate). Algoritmos: motor de renderização paramétrica por tipo de campo, i18n com fallback em cascata, autosave com debounce, gate de isolamento zero-leakage. Complexidade: alta (muita superfície de UI + a regra de segurança mais crítica do sistema).

---

## Módulo: `crm-funil`

**Arquivos primários:** `crm.html` (implementação atual, simplificada) vs. `modelo_site/studio_suite_2.0/parte2/studio_suite_2.0_crm_forms_hub_glassmorphic/code.html` (mockup de referência — fonte de verdade visual escolhida pelo usuário)

**Propósito:** 🟢 Funil de vendas/briefings da agência — é o módulo que o usuário explicitamente pediu para reconstruir com fidelidade ao mockup, após comparar a implementação atual e dizer "nada a ver".

### ⚠️ Achado central: o mockup e a implementação atual não são a mesma coisa conceitualmente

Esta é a descoberta mais importante desta fase de escavação. Não é só uma diferença visual — é uma diferença de **modelo de dados e de conceito de produto**:

| Aspecto | Implementação atual (`crm.html`) | Mockup de referência (`...crm_forms_hub_glassmorphic`) |
|---|---|---|
| Unidade do card | `BriefingInstance` (já existe um briefing enviado) | **Lead/Deal** (pode existir ANTES de qualquer briefing — coluna 1 "Descoberta & Lead" tem botão "Disparar Form com PIN", ou seja, o lead ainda não tem briefing) |
| Colunas | 4, mapeadas 1:1 aos status reais de `BriefingInstance` (enviado/aguardando, em_preenchimento, em_revisão/submetido, aprovado_kickoff) | 3, mapeadas a estágios de **funil de vendas**: "1. Descoberta & Lead", "2. Formulário Enviado", "3. Briefing Recebido" |
| Dados por card | Nome da empresa, código, status, id | Valor do deal (R$), fonte do lead (Inbound Google/Parceiro/LinkedIn Outbound), nome+cargo do contato, % preenchido, tempo desde última atividade, Score de IA (0-100), contagem de anexos, insight textual gerado por IA |
| Métricas de topo | Nenhuma | 4 tiles: Pipeline Total (R$), Deals Ativos, Taxa de Resposta Forms (%), Tempo Médio de Conversão (dias) |
| Ações no card | Nenhuma (só drag-and-drop) | "Disparar Form com PIN", "WhatsApp"/"E-mail" rápidos, "Abrir Briefing Completo", **"Transformar em Projeto"** |
| Sidebar direita | Não existe | Perfil executivo (stats: Estúdios/Retenção/Sprints), calendário interativo, lista de "Agendamentos & Kickoffs" |
| Forms Hub | Página separada (`forms-hub.html`) | 🔴 **Embutido na mesma tela**, como seção inferior ("Biblioteca de Formulários") — o nome do arquivo do mockup já avisa: `crm_forms_hub` |

### 1. Fluxo de controle (implementação atual, `crm.html`)

🟢 `render()` — lê `getBriefingInstances()` + `getClients()`, agrupa cada instância em uma de 4 colunas fixas (`COLUMNS`) via `columnForStatus(status)` (mapeamento many-to-one já visto em `dashboard-core`). Drag-and-drop nativo HTML5 (`dragstart`/`dragover`/`drop`) chama `updateBriefingStatus(instanceId, newStatus)` + `patchInstanceRemote` ao soltar, depois re-renderiza tudo.

🟡 **Nenhuma lógica no mockup é real** — é um protótipo estático do Stitch: os valores em R$, os scores de IA, o "Score: 98/100", o texto "IA: Abertura em 60 dias..." e os botões (`PIN Generator`, `copy-btn`) só têm micro-interações decorativas em JS inline (gera um PIN aleatório visualmente, troca texto do botão por 2.5s) — não chamam nenhuma API real nem gravam nada.

### 2. Lacunas de modelo de dados identificadas (requerem decisão humana antes do forward)

- 🔴 **LACUNA — Entidade "Lead/Deal" não existe.** Hoje só existe `Cliente` (já cadastrado, com código único) e `BriefingInstance` (já vinculado a um cliente). O mockup assume um estágio **anterior** a isso: um lead que ainda não é cliente formal, sem código único, com campos que não existem em nenhuma tabela: `valor_deal` (R$), `fonte_lead` (Inbound Google/Parceiro/LinkedIn Outbound/etc.), talvez vários leads por empresa antes de um virar `Cliente`.
- 🔴 **LACUNA — Score de IA e insight textual.** Nenhum campo nem lógica no backend gera um "Score: 98/100" ou um resumo tipo "IA: Abertura em 60 dias...". Seria preciso ou (a) uma nova chamada de IA real (haveria integração a decidir) ou (b) um cálculo heurístico local, ou (c) remover esse elemento do forward por ser decorativo.
- 🔴 **LACUNA — Ação "Transformar em Projeto".** Não existe entidade `Projeto` no banco hoje (ver módulo `telas-preview-v2` — `projects.html`/`project-detail.html` são só preview, sem backend). Essa ação do mockup pressupõe que ela existirá.
- 🟡 **Fusão CRM + Forms Hub em uma página:** o usuário já tem as duas como páginas separadas e funcionais hoje (`crm.html`, `forms-hub.html`). Fundir ou manter separado é uma decisão de produto, não técnica — a funcionalidade de Forms Hub já existe e funciona isolada.
- 🟡 **Sidebar executiva (perfil + calendário + agendamentos):** `calendário`/`agendamentos de kickoff` não tem nenhuma entidade correspondente no sistema hoje (não há `Reuniao`/`Agendamento`). É 100% decorativo no mockup.

### 3. O que PODE ser aproveitado com fidelidade visual alta, sem exigir novas entidades

- O estilo glassmorphic (`.spatial-glass-panel`, `.spatial-card-subtle`, `.spatial-dock`, cores `brand.orange/amber/emerald/rose/sky`, fonte Plus Jakarta Sans, FontAwesome) — é só CSS/Tailwind config, pode ser portado 1:1.
- A estrutura de 3 colunas de funil, se reinterpretadas para os status reais que **já existem** (`enviado`→Formulário Enviado, `em_preenchimento`→Formulário Enviado com progresso, `submetido`/`em_revisao`/`aprovado_kickoff`→Briefing Recebido) — sem a coluna "Descoberta & Lead" (que exigiria a nova entidade), ou tratando "Descoberta & Lead" como os `Cliente`s que ainda não têm nenhum `BriefingInstance`.
- Botões WhatsApp/E-mail nos cards — já existe `generateWhatsAppMessage` e `shareWhatsApp` reaproveitáveis de `dashboard-core`.
- % preenchido e "tempo desde última atividade" — já existem como `progresso_percentual` e `data_envio`/`data_resposta` em `BriefingInstance`, dá para calcular "há X min/dias" com a mesma lógica de `timeAgo()` já usada em `dashboard.js`.
- Os 4 tiles de métrica do topo — Pipeline Total e Tempo Médio de Conversão exigiriam o campo `valor_deal` (lacuna); mas "Taxa de Resposta Forms" e um tile baseado em `getMetrics()` já existente são viáveis sem mudança de schema.

### Checkpoint
Módulo `crm-funil` concluído. Entidades: 0 reais hoje; identificadas como lacunas `Lead/Deal` (valor, fonte, score de IA) e dependência futura de `Projeto`. Esta análise alimenta diretamente a decisão que o Architect vai levantar na Fase 3 — é o módulo com a maior divergência entre mockup e implementação real do projeto.

---

## Módulo: `forms-hub`

**Arquivos primários:** `forms-hub.html` (único arquivo — HTML + `<script type="module">` inline, sem JS externo próprio); consome `getTemplates()` de `store.js`.

**Propósito:** 🟢 Catálogo somente-leitura de todos os `BriefingTemplate` cadastrados (seed + gerados por IA), agrupados visualmente por vertical, para o admin consultar estrutura (seções/campos) antes de disparar um briefing a um cliente.

### 1. Fluxo de controle

**`forms-hub.html` → `render()`** 🟢 (dispara em `DOMContentLoaded`)
1. Chama `getTemplates()` (store.js) → retorna array de `BriefingTemplate`.
2. Se vazio → mensagem "Nenhum modelo cadastrado ainda."
3. Para cada template: resolve `VERTICAL_META[tpl.vertical]` (mapa fixo só neste arquivo: pilates/physio/fisio_pilates/events/universal → nome+ícone+cor) com fallback para `{ nome: tpl.vertical, icon: 'description', cor: 'text-secondary' }`.
4. `templateLabel(tpl)` 🟢 resolve título com suporte a i18n (`{pt,it,en}` object ou string simples) — mesmo padrão de `resolvePt` já visto em `dashboard-core`.
5. Renderiza um card por template: badge de vertical, título, versão (`tpl.versao`), contagem de seções (`tpl.secoes.length`) e contagem total de campos (soma de `secoes[].campos.length`).

Não há nenhum outro evento, listener de clique, formulário, filtro, busca ou paginação no código real — é renderização estática a partir dos dados, sem interatividade além do que o navegador já dá de graça (scroll).

### 2. Regras de negócio identificadas

- 🟢 **RN-FORMS-01 (somente leitura):** a tela atual não cria, edita, duplica ou arquiva templates — é um painel de consulta. Qualquer template novo só entra via seed em `store.js` ou via `ai-briefing-generator.js` (módulo ainda não analisado).
- 🟡 **RN-FORMS-02 (mapa de vertical duplicado):** `VERTICAL_META` existe apenas dentro de `forms-hub.html`, hardcoded — não é importado de um local compartilhado. Se uma vertical nova for criada em `store.js`, alguém precisa lembrar de atualizar esse mapa aqui também (risco de inconsistência silenciosa — o fallback genérico evita erro, mas perde o ícone/cor correto).
- 🟢 **RN-FORMS-03:** contagem de seções/campos é sempre recalculada ao vivo a partir de `tpl.secoes`, nunca armazenada — reflete fielmente o template atual.

### 3. Comparação com o mockup (`06_studio_suite_forms_hub_biblioteca/code.html`)

| Elemento do mockup | Existe hoje em `forms-hub.html`? |
|---|---|
| 4 KPIs no topo (Modelos ativos, Respostas no mês, Taxa de conclusão, Tempo médio) | 🔴 Nenhum — nenhuma dessas métricas é calculada em nenhum lugar do código |
| Abas "Modelos / Respostas recebidas / Arquivados" com contadores | 🔴 Não existe — a tela só mostra templates, nunca respostas; não existe conceito de template "arquivado" |
| Busca por título/palavra-chave/tag + pills de filtro por vertical | 🔴 Não existe — grid mostra sempre todos os templates |
| Alternância Grid/Lista | 🔴 Não existe — só grid |
| Por card: nº de perguntas/seções, % conclusão, "último uso", link curto (`studiosuite.app/b/...`), badge Ativo | 🟡 Parcial — seções/campos reais existem (🟢); "% conclusão", "último uso" e "link curto" não existem no modelo de dados nem no código |
| Botões "Editar" / "Duplicar" / "Mais opções" por card | 🔴 Decorativos no mockup (sem `onclick` real); zero equivalente funcional hoje |
| Botão "Gerar PIN avulso" | 🔴 Não existe fluxo de gerar PIN isolado — PIN/`link_token` só nasce dentro de `createBriefingInstance`, sempre vinculado a um cliente específico (ver `dashboard-core`) |
| Botão "+ Novo modelo" / card tracejado "Criar a partir de modelo em branco" | 🔴 Não existe criação de template pela UI |
| "Sincronizado via Studio Cloud" | 🟡 Decorativo no mockup, sem lógica de sync real nem lá nem aqui |

### 4. Gaps relevantes para o `/reversa-forward`

- 🔴 **"Taxa de conclusão" e "Tempo médio" por template** exigiriam agregação nova: cruzar todas as `BriefingInstance` que usam um `template_id`, olhar `status` (para taxa) e `data_envio`/`data_resposta` (para tempo médio). Os campos-fonte já existem (🟢, confirmados em `dashboard-core`); falta só a função de agregação — é o gap mais barato de resolver desta tela.
- 🔴 **"Respostas recebidas" como aba dentro do Forms Hub** não existe; o equivalente parcial hoje mora espalhado no CRM (`crm.html`) e no dashboard, organizado por cliente/instância, não por template. Decisão de produto: criar essa visão agregada por template, ou manter a navegação atual por cliente?
- 🔴 **Edição/duplicação/criação de template via UI** — hoje é só código (seed) ou IA (`ai-briefing-generator.js`, ainda não analisado). Se o usuário quiser esses botões funcionais, é feature nova de ponta a ponta (não só UI).
- 🟡 **Templates "arquivados"** — não existe campo de status no `BriefingTemplate` (`data-dictionary.md` → sem campo `status`/`ativo`). Precisaria de novo campo se a aba "Arquivados" for implementada de verdade.

### Checkpoint
Módulo `forms-hub` concluído. Entidade de dados: reutiliza `BriefingTemplate` (já documentada em `data-dictionary.md`, módulo `dashboard-core`), nenhuma entidade nova. Divergência mockup-vs-real é mais rasa que no `crm-funil`: aqui é "tela estática simples" vs. "dashboard rico com métricas e ações que não existem", sem a complicação de um conceito de negócio ausente (`Lead`) — os gaps são todos de agregação/CRUD, não de modelo de dados novo.

---

## Módulo: `api-backend`

**Arquivos primários:** `api/_db.js`, `api/clients.js`, `api/instances.js`, `api/auth.js` (já coberto no módulo `auth`), `api/migrate.js` (DDL já coberto em `data-dictionary.md`)

**Propósito:** 🟢 Camada de acesso a dados — funções serverless da Vercel que expõem CRUD REST-like sobre as duas tabelas Postgres (`clientes`, `instancias_briefing`) via driver `@neondatabase/serverless`.

### 1. Fluxo de controle

**`_db.js` → `getSql()`** 🟢 singleton lazy: resolve a connection string tentando, em ordem, `DATABASE_URL` → `POSTGRES_URL` → `POSTGRES_PRISMA_URL` → `DATABASE_URL_UNPOOLED` → `POSTGRES_URL_NON_POOLING`; `sanitize()` remove BOM/caracteres invisíveis (comentário no código indica que isso corrige um bug real de colar a connection string no PowerShell do Windows). Lança erro explícito se nenhuma variável estiver setada.

**`clients.js` → `handler(req, res)`** 🟢
- `GET ?code=` → busca case-insensitive (`UPPER()` nos dois lados) por `codigo_unico`.
- `GET ?id=` → busca por PK.
- `GET` sem params → lista todos, ordenado por `data_cadastro DESC`.
- `POST` → exige `id`, `codigo_unico`, `empresa`; faz **upsert** (`ON CONFLICT (id) DO UPDATE`) — repostar um `id` existente sobrescreve o registro inteiro, sem distinção entre criar e atualizar.
- `PATCH` → exige `id`; update parcial via `COALESCE` (só sobrescreve campos enviados).

**`instances.js` → `handler(req, res)`** 🟢 mesmo padrão, sobre `instancias_briefing`:
- `GET ?id=` / `GET ?cliente_id=` (ordenado por `criado_em DESC`) / `GET` todos.
- `POST` → exige `id`, `cliente_id`, `template_id`; upsert, mas o `ON CONFLICT ... DO UPDATE SET` só atualiza `etapa_nome`, `status`, `atualizado_em` — os demais campos enviados no POST (`respostas_brutas`, `anexos`, `progresso_percentual` etc.) são **silenciosamente ignorados** se o `id` já existir.
- `PATCH` → update parcial completo e correto via `COALESCE` (é este o endpoint realmente usado pelo autosave do form-engine, confirmado no módulo `client-intake`).
- `DELETE ?id=` → hard delete direto, sem soft-delete/arquivamento.

### 2. Regras de negócio identificadas

- 🟢 **RN-API-01 (SEVERIDADE ALTA — sem autorização no servidor):** nenhum dos handlers de `clients.js`/`instances.js` verifica sessão, token ou cabeçalho de autenticação — não importam nada relacionado a `auth.js` ou a cookies de sessão. O `requireAuth()` visto no módulo `auth` é **só client-side** (`dashboard.js`), ou seja, qualquer requisição HTTP direta a `/api/clients` ou `/api/instances` (GET/POST/PATCH/DELETE) funciona sem login, para quem souber a URL do deploy. Isso expõe listagem completa de clientes e briefings, e permite editar/apagar dados sem autenticação. É o achado de segurança mais crítico de toda a análise até agora — mais grave até que o gap de zero-leakage do `client-intake`, porque ali pelo menos existe uma trava; aqui simplesmente não há trava nenhuma no servidor.
- 🟢 **RN-API-02 (upsert mascarando criar/atualizar):** tanto em `clients.js` quanto em `instances.js`, `POST` com um `id` já existente sobrescreve em vez de falhar — não há verificação de duplicidade. Normalmente inofensivo porque os IDs são gerados com timestamp+random (baixa chance de colisão), mas significa que um bug de reenvio (retry) silenciosamente sobrescreve dados em vez de gerar erro visível.
- 🔴 **RN-API-03 (upsert parcial em `instances.js` POST):** o `ON CONFLICT DO UPDATE SET` de `POST /api/instances` só contempla 3 colunas (`etapa_nome`, `status`, `atualizado_em`). Se algum fluxo do front-end um dia reenviar um `POST` (em vez de `PATCH`) para um id existente esperando atualizar `respostas_brutas`/`progresso_percentual`, a chamada terá sucesso (200/201) mas não vai persistir esses campos — falha silenciosa. Hoje não foi confirmado nenhum caller que faça isso (o autosave usa `PATCH`), mas é uma armadilha latente no próprio endpoint.
- 🔴 **RN-API-04 (órfão em `clientes.briefings_ids`):** `DELETE /api/instances?id=` remove a linha de `instancias_briefing`, mas não atualiza o array `briefings_ids` da linha correspondente em `clientes` — deixa um ID "fantasma" nesse array JSONB. Consistente com o risco já registrado em `data-dictionary.md` sobre esse campo ser mantido em paralelo à FK real.
- 🟢 **RN-API-05 (proteção contra SQL injection):** todas as queries usam o template tagged `sql\`...\`` do `@neondatabase/serverless`, que parametriza automaticamente os valores interpolados — não há concatenação manual de SQL em nenhum dos três arquivos. Ponto positivo confirmado.
- 🟡 **CORS/rate limiting:** nenhum cabeçalho CORS explícito nem limite de taxa foi observado nestes três arquivos — comportamento real depende de configuração da Vercel não verificada nesta sessão (fora do escopo de arquivos de código).

### Checkpoint
Módulo `api-backend` concluído. Nenhuma entidade de dados nova (reaproveita `Cliente`/`BriefingInstance` já documentadas). Achado mais importante: **ausência total de verificação de autenticação no servidor** para `/api/clients` e `/api/instances` — recomendo que isso vá para a Fase 3 (Detective/Architect) como item de alta prioridade, independente de qualquer decisão sobre o CRM visual.

---

## Módulo: `ai-briefing-generator`

**Arquivos primários:** `ai-briefing-generator.js` (455 linhas, único arquivo); importado por `dashboard.js` (modal "Gerar Template com IA").

**Propósito:** 🟢 Gerar novos `BriefingTemplate` (por preset ou por prompt livre) e, em teoria, sintetizar um resumo executivo — mas a "IA" aqui é inteiramente simulada por regras, não uma chamada real a um modelo de linguagem.

### 1. Fluxo de controle

**`generateTemplateFromPrompt(userPrompt, category)`** 🟢 (chamada por `handleGenerateAITemplate` em `dashboard.js:2053`, a partir de um modal com 3 botões de preset + campo de texto livre)
1. Normaliza o prompt para minúsculas.
2. Procura correspondência por substring (nos dois sentidos) contra os 3 `AI_PRESETS` fixos (`tattoo`, `derma`, `gastronomy`) — compara contra `key`, `vertical` e `name`.
3. Se achar preset: clona profundamente (`JSON.parse(JSON.stringify(...))`) o template fixo daquele preset e só troca o `id` por um novo timestamp.
4. Se não achar: monta um template genérico de 4 seções interpolando o texto do `userPrompt` nos labels/descrições/título — estrutura fixa (identificação, escopo, atmosfera, anexos), só o texto muda.
5. Persiste via `addTemplate()` (store.js) e retorna o template novo — o dashboard então injeta uma nova `<option>` no select de vertical do modal de cadastro de clientes.

**`generateAISynthesis(briefingInstance, client)`** 🟢 função existe e é exportada, **mas é código morto**: importada em `dashboard.js:41` junto com as outras duas, porém nunca chamada em nenhum lugar do arquivo (confirmado por busca de `generateAISynthesis(` em todo `dashboard.js` — zero ocorrências de chamada). A função realmente usada para gerar o resumo executivo é `generateProductionDigest()` (em `store.js`, já documentada no módulo `dashboard-core`).

### 2. Regras de negócio identificadas

- 🟢 **RN-AI-01 (a "IA" é simulada, não real):** `AI_BRIEFING_SYSTEM_PROMPT` documenta um prompt system rigoroso "para Gemini/Claude/GPT-4" (comentário explícito no código), mas **nunca é enviado a lugar nenhum** — não há `fetch`, chamada de SDK, `import` de cliente de LLM, nem variável de ambiente de API key neste arquivo. Toda a "geração" é correspondência de string contra 3 presets estáticos + interpolação de texto em um template fixo. Isso deve ficar muito claro para qualquer decisão de produto sobre "melhorar a IA" — hoje não existe integração real para melhorar, seria preciso construir do zero.
- 🟢 **RN-AI-02 (`generateAISynthesis` é código morto):** importada mas nunca invocada; coexiste com `generateProductionDigest()` (store.js), que é a implementação de fato usada pelo dashboard e é mais sofisticada (resolve campos dinamicamente, preserva itens de checklist marcados manualmente). `generateAISynthesis` assume nomes fixos de campo (`seletor_tom`, `slider_estilo`, `escopo_chips`, `desafio_central`) e um checklist com 5 itens hardcoded — não generaliza para templates que não usem exatamente esses IDs.
- 🟢 **RN-AI-03:** o matching de preset é por substring em ambas direções e case-insensitive — qualquer prompt que contenha a palavra-chave (`tattoo`, `derma`, `gastronomy`) ou o nome completo do preset ativa o preset fixo, ignorando o resto do texto digitado pelo usuário.
- 🟡 **RN-AI-04 (slug sem transliteração de acentos):** no fallback de prompt livre, o slug é gerado com `replace(/[^a-z0-9]/g, '-')` sem remover acentos antes — um prompt como "Ótica & Joalheria" gera um slug cheio de hifens repetidos/truncados em vez de algo limpo como `otica-joalheria`. Inferido da leitura do regex, não testado em runtime.
- 🟡 **Templates gerados por IA só existem no `localStorage` do navegador que os criou** — consistente com o que já foi registrado em `data-dictionary.md` (módulo `dashboard-core`): não há tabela/endpoint para `BriefingTemplate`, então um template de IA criado em um navegador não aparece em outro dispositivo/navegador.

### Checkpoint
Módulo `ai-briefing-generator` concluído. Nenhuma entidade nova (gera instâncias de `BriefingTemplate`, já documentada). Achado mais importante: o nome do módulo promete IA real, mas a implementação é 100% baseada em regras/presets estáticos — ponto relevante caso o usuário queira cobrar funcionalidade de "geração por IA" no futuro, e há código morto (`generateAISynthesis`) que merece decisão de remover ou efetivamente conectar.

---

## Módulo: `telas-preview-v2`

**Arquivos primários:** `form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html`

**Propósito:** 🟢 Quatro telas de preview visual (Studio Suite 2.0) para funcionalidades que ainda não têm nenhuma lógica real — editor de modelo de briefing (drag-and-drop), hub de projetos pós-kickoff, detalhe de um projeto e portal de acompanhamento do cliente.

### 1. Verificação de integração real

Busca por `import ... from './store.js'`, `<script type="module">`, `localStorage` e `fetch(` nos quatro arquivos: **zero ocorrências em todos eles.** Isso confirma, de forma direta no código (não inferência), que nenhuma destas telas está conectada a `store.js`, à API ou a qualquer persistência.

| Arquivo | Funções JS inline | Dado usado |
|---|---|---|
| `form-builder.html` | 🔴 nenhuma (0 funções) | Texto estático "Briefing Pilates v2.4" |
| `projects.html` | 🟡 `openProcessDrawer`/`closeProcessDrawer` (só abre/fecha painel lateral) | Lista de projetos hardcoded no HTML |
| `project-detail.html` | 🔴 nenhuma (0 funções) | Cliente fictício "Lumina Movement" |
| `client-tracking.html` | 🟡 `openNoteDialog`/`closeNoteDialog`/`submitNote`/`handleApprove`/`showToast` (manipulam só o DOM, sem persistir nada) | Mesmo cliente fictício "Lumina Movement" |

### 2. Regras de negócio identificadas

- 🟢 **RN-PREVIEW-01:** as 4 telas são mockups estáticos funcionais apenas visualmente — nenhuma delas lê ou grava em `store.js`, `localStorage` ou `/api/*`. Dados exibidos (nomes de clientes, status, progresso) são todos texto fixo no HTML.
- 🟢 **RN-PREVIEW-02 (dependem da entidade `Projeto`, ainda inexistente):** `projects.html` e `project-detail.html` pressupõem uma entidade `Projeto` pós-"Transformar em Projeto" — a mesma lacuna já registrada no módulo `crm-funil` (nenhum schema, nenhuma tabela, nenhuma API).
- 🟡 **RN-PREVIEW-03 (`client-tracking.html` implica um 2º portal de cliente):** diferente do `portal.html` já documentado (módulo `auth`/`client-intake`, usado para responder o briefing), esta tela é um portal pós-kickoff para o cliente acompanhar entregas/aprovações de um projeto em andamento — função de negócio nova, sem overlap direto com a máquina de estados de `BriefingInstance.status` já existente.
- 🟡 **RN-PREVIEW-04 (`form-builder.html` implica CRUD de template ainda não implementado):** a tela de edição de modelo (editor drag-and-drop de seções/campos) reforça o gap já registrado no módulo `forms-hub` — hoje não existe nenhum caminho de código para editar um `BriefingTemplate` existente pela UI.

### Checkpoint
Módulo `telas-preview-v2` concluído. Nenhuma entidade nova confirmada (reaproveita a lacuna `Projeto` já registrada em `crm-funil`, mais uma lacuna adicional de "acompanhamento pós-kickoff" ainda sem nome formal). É o módulo com a menor profundidade de código real de todos os analisados — risco de retrabalho é baixo (não há lógica para preservar), mas o escopo de construção é o maior, pois tudo aqui precisa ser implementado do zero.

---

## Módulo: `design-reference-stitch`

**Arquivos primários:** toda a pasta `modelo_site/` — HTMLs originais do Google Stitch (não tocados pelo Reversa) e, mais importante, 3 documentos markdown que **não são mockup visual, são especificação escrita pelo próprio usuário/produto**:
- `modelo_site/studio_suite_2.0/parte1/prompts_stitch_studio_suite_2.1.md` (239 linhas)
- `modelo_site/studio_suite_2.0/parte2/manual_de_implementa_o_studio_suite_2.1_para_claude_code.md` (262 linhas)
- `modelo_site/studiointake_product_requirements_document_prd.md` (122 linhas, em inglês, de uma geração anterior/mais genérica chamada "StudioIntake")

**Propósito:** 🟢 Preservar, como fonte de verdade visual E de intenção de produto, todo o material gerado com o Google Stitch antes da reconstrução — telas soltas da era "StudioIntake" (genérica, em inglês) e o conjunto "Studio Suite 2.0" (atual, em português), em duas ondas (`parte1` = telas base/MVP, `parte2` = variação "glassmorphic" mais rica visualmente).

### 1. Achado crítico — o `prompts_stitch_studio_suite_2.1.md` é o roadmap do próprio usuário, não só um mockup

Este arquivo é a transcrição dos prompts que o usuário escreveu, em primeira pessoa, para gerar cada tela no Stitch — incluindo uma **tabela de 16 telas com coluna de Status (Existe/Parcial/Falta) e Prioridade (MVP/Depois)** (linhas 7-24). Isso muda a natureza da divergência já registrada no módulo `crm-funil`:

| # | Tela | Status (do próprio usuário) | Prioridade |
|---|---|---|---|
| 03 | CRM · Funil de vendas | Parcial | **MVP** |
| 04 | CRM · Ficha do cliente | Falta | Depois |
| 05 | Modal · Enviar briefing com PIN | Falta | **MVP** |
| 06 | Forms Hub · Biblioteca | Parcial | **MVP** |
| 07 | Forms Hub · Editor de modelo | Falta | **MVP** |
| 08 | Respostas do briefing | Falta | **MVP** |
| 09/10 | Projetos (Quadro / Evolução) | Existe/Parcial | **MVP** |
| 15 | Cliente · Briefing enviado | Falta | **MVP** |
| 16 | Cliente · Acompanhar projeto | Falta | Depois |

🟢 **CONCLUSÃO — isso não é "o mockup inventou um produto diferente".** O funil de vendas (Lead → Briefing enviado → Briefing recebido → Proposta enviada → Fechado/Perdido), com valor estimado, origem do lead, e a entidade `Projeto` com fases/entregáveis/horas, **são pedidos explícitos do próprio usuário, já priorizados como MVP por ele mesmo**, só que nunca foram implementados no código real — só desenhados no Stitch. A pergunta de arquitetura da Fase 3 deixa de ser "o usuário quer isso de verdade?" e passa a ser "como implementar o que ele já decidiu que quer, na ordem que ele já priorizou?".

- 🟡 **Nuance importante:** o prompt original da tela 03 (linha 77-89) **não menciona** "score de IA" nem "insight gerado por IA" em nenhum momento — esses elementos existem no mockup glassmorphic (`parte2`) mas não no prompt original do usuário. Ou seja, o score de IA parece ter sido uma adição decorativa do próprio Stitch/do gerador visual, não um pedido explícito do usuário. Vale confirmar com ele antes de tratar como requisito.

### 2. Achado adicional — schema de referência completo no manual de implementação

O `manual_de_implementa_o_studio_suite_2.1_para_claude_code.md` contém um schema SQL de referência completo (seção 5, linhas 153-217) para `leads`, `client_briefings`, `projects` e `deliverables` — escrito para uma stack hipotética (Next.js/TypeScript/Supabase/Zustand), **diferente da stack real do projeto** (Vite/vanilla JS/Neon/Vercel). Não deve ser copiado literalmente, mas é uma referência valiosa de quais campos o usuário/designer já havia pensado para `Lead` (`stage` enum, `estimated_value`) e `Projeto` (`phase` enum, `contracted_value`, `allocated_hours`/`consumed_hours`, `deliverables` com versionamento e status de aprovação) — alimenta diretamente o dicionário de dados candidato já registrado no módulo `crm-funil`.

### 3. Inventário do restante de `modelo_site/`

- **Era "StudioIntake" (anterior, genérica, em inglês)** — `control_panel/`, `dashboard_studiointake/`, `login_studiointake/`, `universal_briefing_form_template/`, `briefing_pilates/`, `briefing_physiotherapy/`, `briefing_events/`, `acesso_ao_formulario_codigo_do_cliente/`, `preenchimento_do_briefing_portal_do_cliente/` — cada pasta com `code.html` + `screen.png`. Correspondem ao PRD em inglês (`studiointake_product_requirements_document_prd.md`), uma geração de produto mais antiga/genérica (personas de Pilates/Fisioterapia/Eventos com métricas e integrações — Mindbody, Cliniko, Tito/Stripe — nunca implementadas no código real). 🟡 Valor histórico/referência, superada pela era "Studio Suite 2.0".
- **Era "Studio Suite 2.0" `parte1`** (16 telas numeradas, MVP mais sóbrio) e **`parte2`** (5 telas "glassmorphic", visualmente mais ricas, incluindo o arquivo de CRM+Forms Hub já analisado em `crm-funil`/`forms-hub`).
- **`guia_de_estilo_tokens_studio_suite_2.0.md`** (54 linhas) — guia de tokens de design condensado; redundante com o "Bloco base" já transcrito no `prompts_stitch_studio_suite_2.1.md` (linhas 26-52), que é mais completo.
- **`studio_intake_system/DESIGN.md`** — confirmado **idêntico** (`diff` sem diferenças) nas 3 cópias existentes (`modelo_site/`, `parte1/`, `parte2/`) — é o export do design system do Stitch, duplicado a cada rodada de geração, sem conteúdo novo entre as cópias.

### Checkpoint
Módulo `design-reference-stitch` concluído — e com ele, a Fase 2 (Escavação) completa, 9 de 9 módulos. Nenhuma entidade de código nova (são documentos de referência, não implementação), mas o achado do roadmap priorizado pelo próprio usuário é o dado mais importante para a Fase 3: resolve boa parte da pergunta "isso é intencional?" que ficou aberta no módulo `crm-funil`, restando confirmar com ele apenas o item do score de IA (que não está no prompt original) e a ordem de execução.

---
