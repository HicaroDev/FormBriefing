# Adendo — Cadastro de Projeto (MVP) com vínculo a Cliente

> Feature: `003-projeto-cadastro-mvp` · Data: 2026-10-27 · Cenário: **legado**
> Gerado pelo `/reversa-sync`. Sincronização **parcial** — a feature ainda tem 1 ação aberta (T018, verificação manual em ambiente real).

## Vigência

Vigente desde 2026-10-27.

## Resumo da entrega

`_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2` confirmava que `projects.html`/`project-detail.html` eram mockups 100% estáticos, sem nenhuma entidade `Projeto` real por trás. Esta entrega implementa a entidade `Projeto` (persistida, vinculada a `Cliente`, com 6 fases configuráveis), reescreve as duas telas para consumir dados reais, e remove deliberadamente os elementos decorativos do mockup original (squads, SLA, Gantt, capacidade de equipe) sem entidade real correspondente.

**Ações concluídas:** 17 de 18 (94%). A única pendente é **T018** — roteiro manual de `onboarding.md` contra o ambiente real — bloqueada neste ambiente por falta de `DATABASE_URL`/deploy real, mesma limitação das features 001/002.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/code-analysis.md` | `#Módulo: telas-preview-v2` | regra-alterada | RN-PREVIEW-02 está superada para `projects.html`/`project-detail.html` (agora conectadas a `Projeto` real); ainda vale para `form-builder.html`/`client-tracking.html`, não tocadas. |
| `_reversa_sdd/data-dictionary.md` | `#Entidade candidata: Projeto` | delta-de-dados | Campos de referência (`contracted_value`, `allocated_hours`/`consumed_hours`, `phase`→`fase`) implementados; `scope_pillars` implementado como JSONB simples. Entidade filha `Entregavel` **não** implementada (fora de escopo, feature futura). |
| `_reversa_sdd/erd-complete.md` | (diagrama geral) | delta-de-dados | A relação candidata `CLIENTE \|\|--o\{ PROJETO` deixa de ser 🔴 candidata e passa a ser 🟢 real, via `projetos.cliente_id`. |
| `_reversa_sdd/code-analysis.md` | `#Módulo: api-backend` | componente-novo | `api/projetos.js` segue o mesmo padrão de proteção de RN-API-01 — quinta função serverless administrativa do projeto. |

## Regras sob vigilância

W001, W002, W003 — ver `_reversa_forward/003-projeto-cadastro-mvp/regression-watch.md`.

## Fontes

- `_reversa_forward/003-projeto-cadastro-mvp/legacy-impact.md`
- `_reversa_forward/003-projeto-cadastro-mvp/regression-watch.md`
- `_reversa_forward/003-projeto-cadastro-mvp/requirements.md`
- `_reversa_forward/003-projeto-cadastro-mvp/progress.jsonl`
