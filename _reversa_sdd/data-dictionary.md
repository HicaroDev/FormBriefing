# Dicionário de Dados — FormBriefing / Studio Suite 2.0

> Gerado pelo Archaeologist. Consolida campos, tipos, obrigatoriedade e origem de cada entidade real do sistema (banco de dados + estruturas centrais de `store.js`). Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## Módulo `auth`

Nenhuma entidade de dados própria. Credenciais do admin vivem em variáveis de ambiente (ver `code-analysis.md` → seção 4). O "usuário" autenticado não tem registro em banco.

---

## Módulo `crm-funil`

🔴 **LACUNA — nenhuma destas entidades existe hoje no banco ou no código.** São inferidas a partir do que o mockup `studio_suite_2.0_crm_forms_hub_glassmorphic` pressupõe. Listadas aqui para a Fase 3 (Architect) decidir, com o usuário, se/como serão criadas.

### Entidade candidata: Lead (ou extensão de Cliente)

🟡 **Atualizado após o módulo `design-reference-stitch`:** esta entidade não é invenção do mockup — está no roadmap priorizado como MVP pelo próprio usuário (`prompts_stitch_studio_suite_2.1.md`, tela 03) e tem um schema de referência completo no manual de implementação (`leads` com `stage` enum: `new_lead/brief_sent/brief_received/proposal_sent/closed_won/closed_lost`, `estimated_value`). A tabela abaixo incorpora esses campos de referência.

| Campo | Tipo (sugerido) | Origem |
|---|---|---|
| `valor_deal` / `estimated_value` | numeric/decimal (R$) | 🔴 novo — usado nos tiles de Pipeline Total e nos cards; já previsto no manual de implementação |
| `fonte_lead` | string (enum: Instagram, Indicação, Google, WhatsApp — conforme prompt original da tela 03) | 🔴 novo |
| `estagio_funil` / `stage` | string (enum: novo_lead, briefing_enviado, briefing_recebido, proposta_enviada, fechado, perdido) | 🔴 novo — 6 estágios conforme prompt original (não 3 como o mockup glassmorphic simplificou); distinto da máquina de estados de `BriefingInstance.status` |
| `score_ia` | int (0-100) | 🔴 novo — 🟡 **não está no prompt original do usuário**, aparece só no mockup glassmorphic (`parte2`); provável adição decorativa do Stitch, confirmar com o usuário antes de tratar como requisito |
| `insight_ia` | string (texto curto) | 🔴 novo — mesma observação do score |

### Entidade candidata: Projeto

🔴 Não existe hoje. Necessária para a ação "Transformar em Projeto" do mockup e para dar vida real a `projects.html`/`project-detail.html` (módulo `telas-preview-v2`, confirmado: nenhuma das duas telas importa `store.js`/API — são 100% estáticas). Também priorizada como MVP pelo próprio usuário (telas 09/10 do roadmap). Schema de referência do manual de implementação (não vinculante, stack diferente): `phase` (enum: briefing_aprovado, imersao_conceito, criacao, revisao_cliente, ajustes_finais, entregue — 6 fases conforme prompt original), `contracted_value`, `allocated_hours`/`consumed_hours`, `scope_pillars` (JSONB), mais uma entidade filha `Entregavel` (título, versão, status: aguardando_aprovacao/aprovado/ajustar, thumbnail/arquivo).

### Entidade candidata: AcompanhamentoPosKickoff

🔴 Não existe hoje. Inferida a partir de `client-tracking.html` (módulo `telas-preview-v2`) — um portal de cliente separado do `portal.html` de intake, para acompanhar entregas/aprovações de um projeto já em andamento (pós-`aprovado_kickoff`). Sem campos confirmados, sem relação definida com `Projeto` (provavelmente dependente dela).

---

## Módulo `dashboard-core`

### Entidade: Cliente

🟢 CONFIRMADO — tabela `clientes` (`api/migrate.js`) + função `createClient` (`store.js:794`)

| Campo | Tipo (Postgres) | Obrigatório | Default | Origem |
|---|---|---|---|---|
| `id` | VARCHAR(60), PK | sim | `'cli_' + timestamp36 + random` (gerado no client) | 🟢 |
| `codigo_unico` | VARCHAR(20), UNIQUE | sim | `generateClientCode()` → `CLI-XXXX` | 🟢 |
| `nome_responsavel` | VARCHAR(255) | sim | `'Contato Principal'` | 🟢 |
| `cargo` | VARCHAR(150) | não | `'Gestor Responsável'` | 🟢 |
| `empresa` | VARCHAR(255) | sim | `'Nova Empresa'` | 🟢 |
| `email` | VARCHAR(255) | não | `'contato@cliente.com'` | 🟢 |
| `whatsapp` | VARCHAR(50) | não | `''` | 🟢 |
| `vertical` | VARCHAR(50) | não | `'universal'` | 🟢 — valores observados: `pilates`, `physio`, `fisio_pilates`, `events`, `universal` |
| `status_cliente` | VARCHAR(30) | não | `'ativo'` | 🟢 — único outro valor não observado no código (🔴 LACUNA: não há função que marque cliente como inativo) |
| `briefings_ids` | JSONB (array) | não | `[]` | 🟢 — lista de IDs de `BriefingInstance`, mantida em paralelo à FK real (`cliente_id` na tabela de instâncias) |
| `data_cadastro` | TIMESTAMPTZ | não | `NOW()` / `new Date().toISOString()` | 🟢 |
| `atualizado_em` | TIMESTAMPTZ | não | `NOW()` | 🟢 (não observado sendo atualizado manualmente no client-side; 🟡 provavelmente um trigger/default do Postgres, a confirmar em `api/clients.js`) |

### Entidade: BriefingInstance (`instancias_briefing`)

🟢 CONFIRMADO — tabela `instancias_briefing` (`api/migrate.js`) + função `createBriefingInstance` (`store.js:927`)

| Campo | Tipo (Postgres) | Obrigatório | Default | Origem |
|---|---|---|---|---|
| `id` | VARCHAR(50), PK | sim | `generateBriefingId()` → `BRF-<ano>-<seq>` | 🟢 |
| `cliente_id` | VARCHAR(60), FK → clientes(id) ON DELETE CASCADE | sim | — | 🟢 |
| `template_id` | VARCHAR(60) | sim | `'tpl-universal-v1'` | 🟢 |
| `etapa_nome` | VARCHAR(255) | sim | `'Fase 1: Diagnóstico Inicial'` | 🟢 |
| `status` | VARCHAR(50) | não | `'enviado'` | 🟢 — valores: `rascunho, enviado, em_preenchimento, submetido, em_revisao, ajustes_solicitados, aprovado_kickoff` |
| `link_token` | VARCHAR(100) | não | `'tok_' + random36` | 🟢 |
| `link_seguro` | VARCHAR(255) | não | `portal.html?code=...&brief=...` | 🟢 |
| `respostas_brutas` | JSONB | não | `{}` | 🟢 — formato livre: chave = id do campo do template, valor = string/array/objeto dependendo do tipo do campo |
| `anexos` | JSONB (array) | não | `[]` | 🟢 — itens esperados `{ nome, tamanho }` (🟡 INFERIDO pelo uso em `dashboard.js`, schema completo não confirmado — ver módulo `client-intake`) |
| `progresso_percentual` | INT | não | `0` | 🟢 |
| `urgencia` | VARCHAR(30) | não | `'normal'` | 🟢 — valores: `normal`, `high` |
| `budget` | VARCHAR(100) | não | `'A definir'` | 🟢 |
| `feedback_ajustes` | TEXT | não | `null` | 🟢 — preenchido por `handleConfirmAdjustments` |
| `data_envio` | TIMESTAMPTZ | não | `new Date().toISOString()` no momento da criação | 🟢 |
| `data_resposta` | TIMESTAMPTZ | não | `null`, setado quando `status === 'submetido'` | 🟢 |
| `criado_em` / `atualizado_em` | TIMESTAMPTZ | não | `NOW()` | 🟢 |

### Entidade: BriefingTemplate

🟡 INFERIDO — não tem tabela no Postgres (confirmado: `migrate.js` só cria `clientes` e `instancias_briefing`). Vive como dado estático em `store.js` (`SEED_TEMPLATES`) + cache em `localStorage`. Templates gerados por IA (`ai-briefing-generator.js`) só existem no localStorage do navegador que os criou — 🔴 LACUNA: não sincronizam entre dispositivos/navegadores.

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `id` | string | sim | 🟢 ex: `tpl-pilates-v1` |
| `titulo` | string \| `{pt,it,en}` | sim | 🟢 — suporta i18n opcional (ver `resolvePt` em store.js) |
| `vertical` | string | sim | 🟢 |
| `etapa` | string | não | 🟢 ex: `descoberta_inicial` |
| `versao` | number | não | 🟢 |
| `secoes[]` | array | sim | 🟢 — cada seção: `{ id, titulo, descricao, campos[] }` |
| `secoes[].campos[]` | array | sim | 🟢 — cada campo: `{ id, tipo, label, obrigatorio?, placeholder?, opcoes? }` |

Tipos de campo observados (🟢, usados em `generateProductionDigest` e no form engine): `text`, `select`, `textarea`, `chips_multiselect`, `cards_single_select`, slider (campos com `slider`/`estilo` no id).

### Entidade: RespostaDigest

🟡 INFERIDO — **sem tabela no Postgres nem endpoint `/api`** (confirmado: nenhuma referência a "digest" em `api/`). Vive **somente** em `localStorage` (`studiointake_digests_v3`) — 🔴 LACUNA / risco: um digest aprovado é perdido se o navegador limpar o cache, e não aparece se o diretor abrir o dashboard em outro dispositivo.

| Campo | Tipo | Obrigatório | Origem |
|---|---|---|---|
| `id` | string | gerado | 🟢 `'dig_' + timestamp36` |
| `briefing_id` | string | sim | 🟢 |
| `cliente_nome` | string | sim | 🟢 |
| `objetivo_sintetizado` | string | sim | 🟢 |
| `pilares_design` | string[] | sim | 🟢 |
| `entregaveis_confirmados` | string[] | sim | 🟢 |
| `integracoes_tecnicas` | string[] | sim | 🟢 |
| `checklist_kickoff` | `{item, status}[]` | sim | 🟢 — `status`: `concluido` \| `pendente` |
| `aprovado_por` | string | não | 🟢 default `'Diretoria de Criação'` |
| `data_aprovacao` | string (ISO) \| null | não | 🟢 |

---
