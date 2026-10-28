# Adendo — Funil de Lead/Deal (CRM) com conversão para Cliente

> Feature: `002-crm-funil-lead-projeto` · Data: 2026-10-27 · Cenário: **legado**
> Gerado pelo `/reversa-sync`. Sincronização **parcial** — a feature ainda tem 1 ação aberta (T020, verificação manual em ambiente real), registrada abaixo.

## Vigência

Vigente desde 2026-10-27.

## Resumo da entrega

Até esta entrega, `_reversa_sdd/code-analysis.md#Módulo: crm-funil` confirmava "0 entidades reais hoje": `crm.html` era só um Kanban sobre `BriefingInstance.status`, sem conceito de Lead/pré-cliente. Esta entrega implementa a entidade `Lead` real (persistida, 6 estágios configuráveis via `lead_estagios`), reescreve `crm.html` para ser o funil de Lead, e migra o Kanban antigo de acompanhamento de briefing para uma nova view (`#kanban`) dentro de `index.html`, sem perda de função.

**Ações concluídas:** 19 de 20 (95%). A única pendente é **T020** — rodar o roteiro manual de `onboarding.md` contra o ambiente real (Vercel + Neon) — bloqueada neste ambiente por falta de `DATABASE_URL`/deploy real, mesma limitação já registrada no adendo da feature 001. Fica a cargo do usuário; quando executada, uma reexecução deste `/reversa-sync` complementa este adendo.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/code-analysis.md` | `#Módulo: crm-funil` | regra-nova | RN-CRM-03 ("não existe entidade Lead/Deal hoje") está superada: `Lead` agora existe, persistida, distinta de `Cliente`/`BriefingInstance`. RN-CRM-01/02 (mapeamento de status, drag-and-drop) continuam válidas, só migraram de arquivo — ver linha de `dashboard-core` abaixo. |
| `_reversa_sdd/data-dictionary.md` | `#Entidade candidata: Lead` | delta-de-dados | Os campos de referência (`estimated_value`→`valor_estimado`, `fonte_lead`, `stage`→`estagio`) foram implementados; `score_ia`/`insight_ia` foram deliberadamente **não** implementados (decisão do usuário, Decisão 2 de `crm-funil/decisions.md`). |
| `_reversa_sdd/erd-complete.md` | (diagrama geral) | delta-de-dados | A relação candidata `LEAD \|\|--o\| CLIENTE: "torna-se"` deixa de ser 🔴 candidata e passa a ser 🟢 real, implementada via `clientes.lead_origem_id` + `leads.cliente_id`. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: api-backend` | componente-novo | `api/leads.js` segue o mesmo padrão de proteção de sessão corrigido em RN-API-01 (feature 001) — quarta função serverless administrativa do projeto. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: dashboard-core` | regra-alterada | O Kanban de `BriefingInstance.status` (antes só em `crm.html`) passa a viver em `index.html#kanban`, como view adicional hash-roteada; comportamento idêntico, arquivo diferente. |

## Regras sob vigilância

W001, W002, W003 — ver `_reversa_forward/002-crm-funil-lead-projeto/regression-watch.md` para o detalhe de cada regra e seu sinal de violação.

## Fontes

- `_reversa_forward/002-crm-funil-lead-projeto/legacy-impact.md`
- `_reversa_forward/002-crm-funil-lead-projeto/regression-watch.md`
- `_reversa_forward/002-crm-funil-lead-projeto/requirements.md`
- `_reversa_forward/002-crm-funil-lead-projeto/progress.jsonl`
