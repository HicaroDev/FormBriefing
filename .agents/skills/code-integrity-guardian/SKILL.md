---
name: code-integrity-guardian
description: "Garante que alteracoes no StudioIntake nunca quebram ou removem funcionalidade original ja aprovada: compara comportamento antes/depois e bloqueia regressoes silenciosas."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Code Integrity Guardian — Guardião da Integridade do Código Original

Garante que nenhuma mudança nova quebra, remove ou degrada silenciosamente uma funcionalidade que já funcionava. Atua como "rede de segurança" antes de qualquer commit/push ser considerado concluído.

---

## 🎯 Gates de Integridade

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │
│  Regressão   │  Compatib.   │  Dados Não   │  Rollback    │
│  Funcional   │  Retroativa  │  Perdidos    │  Possível    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Gate 1: Regressão Funcional
- [ ] Todo fluxo que já estava funcionando antes da mudança (cadastro de cliente, disparo de briefing, autosave, submissão, aprovação, ajustes) continua funcionando depois.
- [ ] Rodar manualmente ao menos 1 fluxo ponta a ponta no navegador após qualquer mudança em `store.js`, `form-engine.js` ou `dashboard.js`.

### Gate 2: Compatibilidade Retroativa
- [ ] Templates antigos (`tpl-pilates-v1`, `tpl-physio-v1`, `tpl-events-v1`, `tpl-universal-v1`) continuam renderizando corretamente mesmo após mudanças no motor de formulário (ex: suporte a i18n deve aceitar string pura **e** objeto `{pt,it,en}`).
- [ ] Mudança de schema de dados (ex: formato de `opcoes` em campos) nunca quebra templates que usam o formato antigo.

### Gate 3: Dados Não Perdidos
- [ ] Nenhuma mudança de chave de `localStorage` ou tabela do banco descarta dados reais sem migração ou aviso explícito ao usuário.
- [ ] Antes de renomear/remover uma `STORAGE_KEY`, confirmar que não há dados reais de clientes dependendo da chave antiga (ou migrar explicitamente).

### Gate 4: Rollback Possível
- [ ] Toda mudança está em um commit git separado e identificável — nunca misturada com outras mudanças não relacionadas.
- [ ] `git log --oneline` permite identificar exatamente qual commit introduziu qual comportamento, para reverter cirurgicamente se necessário.

---

## 📋 Protocolo de Execução
Rodar **antes** de qualquer `git push` para produção:

```markdown
### 🔒 Relatório — Code Integrity Guardian

**Mudança Avaliada:** [resumo da mudança / commit]

| Gate | Situação | Observações |
| :--- | :---: | :--- |
| Gate 1 — Regressão Funcional | ✅/❌ | |
| Gate 2 — Compat. Retroativa | ✅/❌ | |
| Gate 3 — Dados Não Perdidos | ✅/❌ | |
| Gate 4 — Rollback Possível | ✅/❌ | |

**Parecer:** [Seguro para publicar / Risco identificado — não publicar]
```

## 🚫 Regras Anti-Racionalização
1. "É uma mudança pequena, não precisa testar tudo de novo" — REPROVADO. Mudanças pequenas são as que mais escondem regressões.
2. "Vou remover esse código antigo, ninguém deve estar usando" — REPROVADO. Confirmar com dados reais (banco/localStorage) antes de assumir que algo está órfão.
3. "Já commitei tudo junto, é mais rápido" — REPROVADO. Commits misturados impossibilitam rollback cirúrgico.
