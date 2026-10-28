# Inventário — FormBriefing / Studio Suite 2.0

> Gerado pelo Scout (fase de reconhecimento). 🟢 CONFIRMADO salvo onde indicado.

## 1. Estrutura de pastas (raiz, excluindo node_modules/.git/.reversa/_reversa_sdd/.vercel/.vite)

```
FormBriefing/
├── .agents/skills/          → skills locais de QA (code-integrity-guardian, mockup-fidelity-auditor, etc.)
├── api/                     → funções serverless Vercel
│   ├── _db.js               → conexão Neon (helper)
│   ├── auth.js              → login do admin (scrypt + HMAC)
│   ├── clients.js           → CRUD de clientes
│   ├── instances.js         → CRUD de instâncias de briefing
│   └── migrate.js           → DDL (CREATE TABLE clientes, instancias_briefing)
├── modelo_site/             → REFERÊNCIA DE DESIGN (Stitch), intocável
│   ├── (mockups v1 soltos: login_studiointake, dashboard_studiointake, briefing_*, control_panel, etc.)
│   └── studio_suite_2.0/    → redesign 2.0 (fonte de verdade visual atual)
│       ├── parte1/          → 01 a 16: login, dashboard, CRM, modal envio, forms hub, editor de modelo,
│       │                      respostas, projeto evolução, acesso PIN, preenchimento, confirmação, acompanhamento
│       └── parte2/           → versões glassmorphic consolidadas: acesso PIN, CRM+Forms Hub, gestão de projetos,
│                                executive hub, portal do cliente + manual de implementação (texto, não código)
├── index.html                → Dashboard principal (entry point autenticado)
├── login.html                 → Login do admin
├── portal.html                 → Acesso do cliente via PIN
├── client-form.html            → Formulário de briefing do cliente
├── crm.html                     → Funil de Vendas (Kanban) — implementação simplificada atual
├── forms-hub.html                → Biblioteca de templates de briefing
├── form-builder.html              → PREVIEW apenas (cópia do mockup, sem lógica)
├── projects.html                   → PREVIEW apenas
├── project-detail.html              → PREVIEW apenas
├── client-tracking.html              → PREVIEW apenas
├── dashboard.js                        → lógica do dashboard (maior arquivo JS, ~100KB)
├── form-engine.js                       → motor do formulário de briefing (stepper, autosave)
├── store.js                              → camada de dados central (localStorage + sync remoto Neon)
├── portal-auth.js                         → autenticação por PIN do portal do cliente
├── ai-briefing-generator.js                → geração assistida de briefing via IA
├── sync-stitch.js                           → utilitário de sincronização com Stitch (não investigado em detalhe)
├── vite.config.js                            → multi-entry build (10 páginas HTML)
├── package.json / package-lock.json          → deps: vite, @neondatabase/serverless
├── SEED.md                                    → spec canônica v1 (Cliente, BriefingTemplate, BriefingInstance, RespostaDigest)
├── TODO.md                                     → roadmap v1, 100% concluído
├── PROJECT_LOG.md / README.md                   → documentação existente
└── 03.md                                          → arquivo solto não rastreado no git (não investigado)
```

## 2. Tecnologias (🟢 CONFIRMADO via package.json)

- **Linguagem principal:** JavaScript (ES Modules, vanilla — sem framework de UI)
- **Build:** Vite ^6.0.0, multi-page app (10 entry points HTML)
- **Backend:** Vercel Serverless Functions (`/api/*.js`)
- **Banco de dados:** Neon Postgres via `@neondatabase/serverless` ^0.10.4
- **Gerenciador de pacotes:** npm
- **Sem framework de frontend** (React/Vue/etc.) — DOM manipulado diretamente via `document.querySelector`/`insertAdjacentHTML`
- **Sem framework de testes configurado**

## 3. Pontos de entrada

| Arquivo | Papel | Status |
|---|---|---|
| `login.html` | Login do admin → `/api/auth` | 🟢 funcional, real |
| `portal.html` | Acesso do cliente via PIN → `portal-auth.js` | 🟢 funcional, real |
| `index.html` | Dashboard principal | 🟢 funcional, real |
| `client-form.html` | Preenchimento do briefing pelo cliente | 🟢 funcional, real |
| `crm.html` | Funil de vendas (Kanban) | 🟡 funcional mas simplificado — fidelidade visual baixa vs. mockup |
| `forms-hub.html` | Biblioteca de templates | 🟢 funcional, real |
| `form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html` | Telas novas do Studio Suite 2.0 | 🔴 apenas preview estático, sem dados/lógica reais |
| `api/auth.js`, `api/clients.js`, `api/instances.js`, `api/migrate.js` | API serverless | 🟢 funcional, real |

Nenhum CI/CD (`.github/workflows`), `Dockerfile` ou `docker-compose.yml` encontrado — deploy é feito via Vercel (git push → build automático).

## 4. Schema de banco de dados (superficial — detalhamento fica para o Archaeologist/Data Master)

DDL inline em `api/migrate.js`:
- `CREATE TABLE IF NOT EXISTS clientes (...)`
- `CREATE TABLE IF NOT EXISTS instancias_briefing (...)`

Sem ORM — queries SQL diretas via `neon()` client.

## 5. Cobertura de testes

🔴 Nenhum arquivo `*.test.*` ou `*.spec.*` encontrado. Nenhum framework de teste nas dependências.

## 6. Referência de design (não é código de produção)

`modelo_site/studio_suite_2.0/` contém os 17 mockups originais gerados no Google Stitch (parte1 + parte2) para o redesign "Studio Suite 2.0", incluindo o manual de implementação em texto (`manual_de_implementa_o_studio_suite_2.1_para_claude_code.md`). Este diretório é a **fonte de verdade visual** e não deve ser alterado — já identificado anteriormente nesta sessão como o mockup correto a seguir para o CRM (`studio_suite_2.0_crm_forms_hub_glassmorphic`).

## 7. Observações para as próximas fases

- O módulo `crm-funil` é candidato direto a reconstrução no `/reversa-forward`, com `studio_suite_2.0_crm_forms_hub_glassmorphic/code.html` como alvo de fidelidade.
- O módulo `telas-preview-v2` ainda não tem entidades de dados (projetos, deliverables, funil de vendas com etapas) — decisão de schema pendente, a ser levantada pelo Architect na fase de interpretação.
- `03.md` está fora do controle de versão (untracked no git) — vale confirmar com o usuário se é relevante antes de qualquer decisão que dependa dele.
