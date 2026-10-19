---
name: post-cleanup-reviewer
description: "Roda depois de qualquer limpeza/refatoracao de codigo no StudioIntake, confirmando que simplificar nao quebrou nada e que o codigo removido estava mesmo morto."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Post-Cleanup Reviewer — Revisor Pós-Limpeza de Código

Skill específico para ser acionado **logo depois** de uma passada de limpeza/refatoração de código (remoção de código morto, simplificação, renomeação). Garante que "limpar" não virou "quebrar".

---

## 🎯 Gates de Revisão Pós-Limpeza

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │
│ Código Morto │  Imports &   │   Testes     │  Diff        │
│ Era Mesmo    │  Exports     │   Manuais    │  Revisado    │
│ Morto        │  Intactos    │   Passam     │  Linha a     │
│              │              │              │  Linha       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Gate 1: Código Morto Era Mesmo Morto
- [ ] Antes de remover uma função/variável, `grep -rn` o nome dela em **todo** o projeto (não só no arquivo atual).
- [ ] Confirmar que não é chamada dinamicamente (ex: `window.funcName`, template literal com nome de função) antes de considerá-la morta.

### Gate 2: Imports & Exports Intactos
- [ ] Todo `import { x } from './store.js'` ainda resolve — nenhum nome exportado foi removido/renomeado sem atualizar os importadores.
- [ ] Rodar `npm run build` (Vite) e confirmar que não há erro de módulo não encontrado.

### Gate 3: Testes Manuais Passam
- [ ] Repetir pelo menos os fluxos críticos do `code-integrity-guardian` (Gate 1) após a limpeza.
- [ ] Verificar console do navegador (`read_console_messages`) por erros novos que não existiam antes da limpeza.

### Gate 4: Diff Revisado Linha a Linha
- [ ] `git diff` do commit de limpeza é lido por completo — nunca aprovado "por cima".
- [ ] Nenhuma mudança de comportamento (não só de forma) passou despercebida no diff.

---

## 📋 Protocolo de Execução

```markdown
### 🧹 Relatório — Post-Cleanup Reviewer

**Limpeza Avaliada:** [commit/escopo]

| Gate | Situação | Observações |
| :--- | :---: | :--- |
| Gate 1 — Código Morto Confirmado | ✅/❌ | |
| Gate 2 — Imports/Exports Intactos | ✅/❌ | |
| Gate 3 — Testes Manuais Passam | ✅/❌ | |
| Gate 4 — Diff Revisado | ✅/❌ | |

**Parecer:** [Limpeza segura / Reverter item X]
```

## 🚫 Regras Anti-Racionalização
1. "Essa função não é chamada em lugar nenhum que eu vejo" — REPROVADO sem um `grep` de confirmação no projeto inteiro.
2. "O build passou, está tudo bem" — REPROVADO como único critério. Build passar não prova que o comportamento em runtime está certo.
3. "O diff é grande, vou só olhar por cima" — REPROVADO. Diff grande exige revisão mais cuidadosa, não menos.
