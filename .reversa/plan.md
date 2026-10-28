# Plano de Engenharia Reversa — FormBriefing / Studio Suite 2.0

> Gerado manualmente (instalação sem CLI). Fase 2 já adaptada aos módulos reais identificados na análise rápida da raiz do projeto.

## Fase 1 — Reconhecimento
- [x] **Scout** — Mapeamento da superfície do projeto (estrutura, stack, dependências, entry points) ✅

## Fase 2 — Escavação (por módulo)
- [x] **Archaeologist** — Módulo `auth` (login.html, portal.html, portal-auth.js, api/auth.js) ✅
- [x] **Archaeologist** — Módulo `dashboard-core` (index.html, dashboard.js, store.js) ✅
- [x] **Archaeologist** — Módulo `client-intake` (client-form.html, form-engine.js) ✅
- [x] **Archaeologist** — Módulo `crm-funil` (crm.html — candidato a reconstrução com fidelidade ao mockup Stitch) ✅
- [x] **Archaeologist** — Módulo `forms-hub` (forms-hub.html) ✅
- [x] **Archaeologist** — Módulo `api-backend` (api/*.js, Neon Postgres) ✅
- [x] **Archaeologist** — Módulo `ai-briefing-generator` (ai-briefing-generator.js) ✅
- [x] **Archaeologist** — Módulo `telas-preview-v2` (form-builder.html, projects.html, project-detail.html, client-tracking.html — ainda sem dados/lógica reais) ✅
- [x] **Archaeologist** — Referência de design `modelo_site/studio_suite_2.0` (HTMLs originais do Stitch, mantidos intactos como fonte de verdade visual) ✅

## Fase 3 — Interpretação
- [x] **Detective** — Regras de negócio implícitas, histórico Git, máquinas de estado, permissões ✅
- [x] **Architect** — Diagramas C4, ERD, mapa de integrações, Spec Impact Matrix (incluindo entidades novas que o CRM/Forms Hub/Projetos vão exigir) ✅

## Fase 4 — Geração
- [x] **Writer** — Specs executáveis (requirements.md, design.md, tasks.md) por unidade ✅ (9 units, 34 arquivos de unit + 3 globais)

## Fase 5 — Revisão
- [x] **Reviewer** — Revisão crítica das specs geradas ✅ (confiança geral 63%, 14 perguntas consolidadas em questions.md)

---

**Regra absoluta mantida:** nenhum arquivo pré-existente do projeto (HTML, JS, CSS do Stitch em `modelo_site/`, ou qualquer arquivo do app real) é apagado, modificado ou sobrescrito pelo Reversa. Toda a análise e as specs ficam em `.reversa/` e `_reversa_sdd/`. A implementação real (ex: reconstrução de `crm.html`) só acontece depois, na fase `/reversa-forward`, sobre as specs aprovadas.
