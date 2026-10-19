---
name: mockup-fidelity-auditor
description: "Compara qualquer tela do StudioIntake contra os mockups originais do Google Stitch em modelo_site/, auditando fonte, tamanho, cor, espacamento e componentes."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Mockup Fidelity Auditor — Auditor de Fidelidade Visual

Compara qualquer tela implementada contra o mockup original correspondente em `modelo_site/` (origem Google Stitch), garantindo que nada foi "simplificado" ou desviou do design aprovado.

---

## 🎯 Gates de Auditoria

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │
│  Tipografia  │     Cor      │  Espaçamento │  Componentes │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Mapa de Mockups ↔ Telas Implementadas
| Mockup (`modelo_site/`) | Tela Implementada |
| :--- | :--- |
| `dashboard_studiointake/code.html` | `index.html` + `dashboard.js` |
| `login_studiointake/code.html` | `login.html` |
| `acesso_ao_formul_rio_c_digo_do_cliente/code.html` | `portal.html` |
| `preenchimento_do_briefing_portal_do_cliente/code.html` | `client-form.html` + `form-engine.js` |

> `pilates.html`, `physio.html`, `events.html` e `universal.html` foram removidos do projeto em 2026-10-19 (mockups órfãos do Stitch, nunca migrados para dados reais — ver `PROJECT_LOG.md`). Os mockups correspondentes (`briefing_pilates/`, `briefing_physiotherapy/`, `briefing_events/`, `universal_briefing_form_template/`) continuam em `modelo_site/` só como referência histórica de design, sem tela implementada para comparar.

### Gate 1: Tipografia
- [ ] Títulos/headlines usam `Plus Jakarta Sans` peso 600/700/800.
- [ ] Corpo, labels e inputs usam `Inter` peso 400/500/600.
- [ ] Nenhuma fonte genérica do sistema (`sans-serif`, `Arial`) vaza para headings.

### Gate 2: Cor
- [ ] `primary` = `#3525cd`, `surface`/`background` = `#f9f9ff`, `on-surface` = `#141b2b` (conferir contra `SEED.md` §3.1).
- [ ] Nenhuma cor hardcoded fora da paleta semântica aparece em elementos novos.

### Gate 3: Espaçamento
- [ ] Paddings/margins de cards, seções e inputs batem com as classes utilitárias do mockup correspondente (comparar visualmente lado a lado via screenshot).
- [ ] Grid/gap de cards de seleção (`cards_single_select`) mantém a mesma proporção do mockup.

### Gate 4: Componentes
- [ ] Cards de tom (Tone Pickers) têm borda 1.5px + check badge ao selecionar.
- [ ] Sliders mostram feedback textual dinâmico nas pontas.
- [ ] Chips mudam de estado visual instantaneamente ao clique.
- [ ] Dropzone de upload tem ícone, texto de instrução e lista de anexados.

---

## 📋 Protocolo de Execução
1. Tirar screenshot da tela implementada (navegador real, não apenas ler o HTML).
2. Abrir o mockup correspondente (`modelo_site/<pasta>/code.html` ou `screen.png`) lado a lado.
3. Preencher o relatório abaixo campo a campo — nunca aprovar "por amostragem".

```markdown
### 🎨 Relatório — Mockup Fidelity Auditor

**Tela Auditada:** [ex: client-form.html — Template Pilates Finalização]
**Mockup de Referência:** [ex: preenchimento_do_briefing_portal_do_cliente/code.html]

| Gate | Situação | Desvio Encontrado |
| :--- | :---: | :--- |
| Gate 1 — Tipografia | ✅/❌ | |
| Gate 2 — Cor | ✅/❌ | |
| Gate 3 — Espaçamento | ✅/❌ | |
| Gate 4 — Componentes | ✅/❌ | |

**Parecer:** [Fiel ao mockup / Lista de correções necessárias]
```

## 🚫 Regras Anti-Racionalização
1. "Ficou parecido, deve estar ok" — REPROVADO. Comparação precisa ser pixel-a-pixel nos tokens (cor, fonte, espaçamento), não por impressão.
2. "O mockup é só referência, posso adaptar" — REPROVADO. O mockup Stitch é regra de ouro conforme `SEED.md` e `qa-seed-todo-guardian`.
