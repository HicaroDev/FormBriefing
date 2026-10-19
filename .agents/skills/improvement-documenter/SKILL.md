---
name: improvement-documenter
description: "Identifica melhorias de ponta no StudioIntake (UX, performance, seguranca, dados) e documenta cada uma com justificativa, esforco estimado e impacto, em PROJECT_LOG.md."
category: enhancement
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Improvement Documenter — Gerador de Melhorias Documentadas

Identifica oportunidades concretas de melhoria no StudioIntake e as documenta de forma estruturada em [`PROJECT_LOG.md`](file:///c:/DEV/FormBriefing/PROJECT_LOG.md), para que decisões de priorização possam ser tomadas com contexto completo — nunca apenas "fiz uma melhoria" sem explicar por quê.

---

## 🎯 Categorias de Melhoria Avaliadas

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│     UX       │  Performance │  Segurança   │    Dados     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### UX
- [ ] Fricção desnecessária no fluxo do cliente (campos redundantes, falta de feedback visual, passos confusos).
- [ ] Fricção no fluxo da agência (dashboard, CRM, disparo de briefing).

### Performance
- [ ] Chamadas de rede redundantes (ex: `syncAllFromRemote` rodando com mais frequência do que necessário).
- [ ] Payloads desnecessariamente grandes (JSONB de respostas, anexos).

### Segurança
- [ ] Dados sensíveis em texto plano onde não precisam estar.
- [ ] Falta de autenticação real em telas que hoje são só visuais (ex: `login.html`).
- [ ] Vazamento de dados entre clientes (violação de isolamento zero-knowledge).

### Dados
- [ ] Inconsistências de encoding (ex: acentuação corrompida ao inserir via terminal Windows).
- [ ] Falta de validação de schema antes de gravar no banco.

---

## 📋 Formato de Documentação (entrada no PROJECT_LOG.md)

Cada melhoria identificada vira uma entrada assim:

```markdown
## [Categoria] Título curto da melhoria

**Problema:** O que está ruim hoje, concretamente (com exemplo reproduzível).
**Impacto:** Quem é afetado e como (cliente final, agência, ambos).
**Proposta:** O que mudar, especificamente.
**Esforço estimado:** Baixo / Médio / Alto.
**Status:** Proposto / Em andamento / Feito (data).
```

## 🚫 Regras Anti-Racionalização
1. "Melhorei isso aqui" sem explicar o problema original — REPROVADO. Toda melhoria precisa do "antes" documentado, não só o "depois".
2. Melhoria cosmética sem impacto real documentado — REPROVADO como prioridade alta; deve ser classificada como esforço baixo e não bloquear entregas urgentes.
3. Misturar "melhoria" com "correção de bug crítico" na mesma entrada — REPROVADO. Bugs que quebram o fluxo do cliente são incidentes, não "melhorias" — tratar com urgência separada.
