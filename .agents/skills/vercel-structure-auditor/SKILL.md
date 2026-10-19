---
name: vercel-structure-auditor
description: "Audita a estrutura de deploy do StudioIntake na Vercel: build, variaveis de ambiente, rotas /api serverless e conexao real com o banco Postgres (Neon) em producao."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Vercel Structure Auditor — Auditor de Infraestrutura de Deploy

Audita se o deploy em produção na Vercel (`https://form-briefing-eight.vercel.app`) está estruturalmente correto: build, variáveis de ambiente, funções serverless (`/api`) e conexão real com o banco Neon Postgres.

---

## 🎯 Gates de Auditoria

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │
│   Build &    │   Env Vars   │   Rotas API  │   Conexão    │
│   Deploy     │              │  Serverless  │   Real c/ DB │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Gate 1: Build & Deploy
- [ ] `vercel ls` mostra o deployment mais recente com status `Ready` em `Production`.
- [ ] O HTML servido (`curl -s https://form-briefing-eight.vercel.app/<pagina>.html`) referencia bundles `/assets/*.js` com hash **diferente** do deploy anterior (confirma que o build pegou o código novo).
- [ ] Nenhuma página core (`index.html`, `portal.html`, `client-form.html`, `dashboard.js`, `store.js`, `form-engine.js`) retorna 404.

### Gate 2: Variáveis de Ambiente
- [ ] `vercel env ls production` lista `DATABASE_URL` (ou `POSTGRES_URL`) em **Production**.
- [ ] Nenhuma variável sensível aparece em texto plano em arquivos versionados (`git grep -i "postgresql://"` deve retornar vazio fora de `.env.local`/`.gitignore`).

### Gate 3: Rotas API Serverless
- [ ] `curl -s -i https://form-briefing-eight.vercel.app/api/migrate` retorna `200 {"ok":true,...}` (não 404, não 500).
- [ ] `curl -s https://form-briefing-eight.vercel.app/api/clients` retorna JSON válido (lista de clientes), não HTML de erro.
- [ ] `curl -s https://form-briefing-eight.vercel.app/api/instances` retorna JSON válido.

### Gate 4: Conexão Real com o Banco
- [ ] Um cliente criado via `POST /api/clients` é recuperável via `GET /api/clients?code=...` **em uma aba de navegador nova, sem localStorage prévio** (prova que não é só cache local).
- [ ] Autosave de um formulário (`PATCH /api/instances`) reflete no banco (confirmar com `GET /api/instances?id=...` logo após).

---

## 📋 Relatório de Auditoria

```markdown
### 🛡️ Relatório — Vercel Structure Auditor

| Gate | Situação | Observações |
| :--- | :---: | :--- |
| Gate 1 — Build & Deploy | ✅/❌ | |
| Gate 2 — Env Vars | ✅/❌ | |
| Gate 3 — Rotas API | ✅/❌ | |
| Gate 4 — Conexão Real c/ DB | ✅/❌ | |

**Parecer:** [Aprovado para enviar links a clientes reais / Bloqueios encontrados]
```

## 🚫 Regras Anti-Racionalização
1. "A API retornou 500 mas deve ser só cache" — REPROVADO. Investigar a mensagem de erro exata antes de assumir qualquer coisa.
2. "Testei no localhost, deve estar igual em produção" — REPROVADO. Localhost não roda `/api` (sem servidor serverless); produção precisa ser testada separadamente.
3. "A env var existe, não precisa testar a conexão de verdade" — REPROVADO. Prova é uma chamada real que grava e lê do banco.
