# Índice de Skills — StudioIntake (FormBriefing)

Catálogo de todos os skills locais deste projeto, em `c:\DEV\FormBriefing\.agents\skills\`. Cada um é um auditor/fiscal especializado, com formato de "gates" (portões de aprovação) e relatório estruturado.

| Skill | O que faz | Quando usar |
| :--- | :--- | :--- |
| [`qa-seed-todo-guardian`](qa-seed-todo-guardian/SKILL.md) | Fiscal geral: audita conformidade com `SEED.md` e `TODO.md` (design, arquitetura, dados, isolamento, testes reais). | Antes de marcar qualquer item do TODO como concluído. |
| [`vercel-structure-auditor`](vercel-structure-auditor/SKILL.md) | Audita o deploy de produção na Vercel: build, env vars, rotas `/api`, conexão real com o banco. | Depois de qualquer deploy, antes de considerar a produção estável. |
| [`mockup-fidelity-auditor`](mockup-fidelity-auditor/SKILL.md) | Compara qualquer tela contra o mockup original do Stitch (`modelo_site/`): fonte, cor, espaçamento, componentes. | Depois de implementar ou alterar qualquer tela visual. |
| [`link-health-checker`](link-health-checker/SKILL.md) | Confirma que um link gerado para cliente real abre a tela certa, sem 404 nem cache fantasma. | Antes de enviar qualquer link a um cliente real. |
| [`code-integrity-guardian`](code-integrity-guardian/SKILL.md) | Garante que mudanças não quebram funcionalidade já aprovada (regressão, compatibilidade, dados). | Antes de todo `git push` para produção. |
| [`post-cleanup-reviewer`](post-cleanup-reviewer/SKILL.md) | Revisa depois de uma limpeza/refatoração de código, confirmando que nada quebrou. | Logo após qualquer passada de limpeza/simplificação de código. |
| [`improvement-documenter`](improvement-documenter/SKILL.md) | Identifica e documenta melhorias (UX, performance, segurança, dados) em `PROJECT_LOG.md`. | Quando sobrar tempo entre entregas urgentes, para não perder ideias de melhoria. |

---

## Como esses skills se encaixam no ciclo de trabalho

```
Pedido do usuário
      │
      ▼
Implementação (código)
      │
      ▼
code-integrity-guardian  ──►  mockup-fidelity-auditor
      │                              │
      ▼                              ▼
   git push                   (se tela visual)
      │
      ▼
vercel-structure-auditor
      │
      ▼
link-health-checker  ──►  Link liberado para envio ao cliente real
      │
      ▼
(periodicamente)
improvement-documenter  ──►  PROJECT_LOG.md
      │
(quando houver limpeza de código)
post-cleanup-reviewer
```

## Documentação complementar
- [`PROJECT_LOG.md`](file:///c:/DEV/FormBriefing/PROJECT_LOG.md) — histórico completo do que foi construído, por quê, e estado atual do projeto (para retomar em outra sessão).
- [`SEED.md`](file:///c:/DEV/FormBriefing/SEED.md) — especificação arquitetural canônica.
- [`TODO.md`](file:///c:/DEV/FormBriefing/TODO.md) — roadmap faseado original.
