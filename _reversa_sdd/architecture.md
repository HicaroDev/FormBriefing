# Arquitetura — FormBriefing / Studio Suite 2.0

> Gerado pelo Architect (fase de interpretação), sintetizando os 9 módulos escavados e o domínio/ADRs do Detective. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão geral

Aplicação monolítica de página múltipla (Vite, 10 entry points HTML + JS vanilla, sem framework de componentes), com um backend mínimo de 4 funções serverless na Vercel sobre Postgres (Neon). Projeto de um único desenvolvedor/usuário (Hícaro Duarte), sem equipe, sem testes automatizados, sem CI/CD — confirmado pelo histórico Git (42 commits, autor único) e pela ausência de framework de teste no `package.json`.

Dois portais claramente segregados:
1. **Painel do estúdio** (`login.html`, `index.html`/dashboard, `crm.html`, `forms-hub.html`, autenticado) — visão completa de todos os clientes/briefings.
2. **Portal do cliente** (`portal.html`, `client-form.html`, acesso por código único) — visão isolada do próprio briefing, protegida pelo gate de zero-leakage (ADR-003).

4 telas adicionais (`form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html`) existem como preview visual sem lógica, aguardando a decisão de arquitetura sobre as entidades `Lead`/`Projeto` (ADR-002).

Diagramas C4 completos em `c4-context.md`, `c4-containers.md`, `c4-components.md`. ERD completo em `erd-complete.md`. Matriz de impacto em `traceability/spec-impact-matrix.md`.

## Dívidas técnicas (consolidado)

1. 🔴 **RN-API-01 (severidade alta):** nenhuma rota de API verifica autenticação no servidor.
2. 🔴 **Assimetria de persistência:** `Cliente`/`BriefingInstance` estão no Postgres; `BriefingTemplate`/`RespostaDigest` só em `localStorage` — já causou bugs reais documentados (ADR-001, domain.md §3).
3. 🔴 **RN-CORE-04:** sem validação formal de transição de status de `BriefingInstance`.
4. 🟡 **`generateAISynthesis` é código morto** — importado, nunca chamado, coexiste com `generateProductionDigest`.
5. 🟡 **Zero testes automatizados, zero CI/CD** — qualquer regressão só é descoberta em produção (consistente com o padrão de "corrigir após descobrir" visto 6+ vezes no histórico Git).
6. 🔴 **4 telas preview sem indicador visual de que são preview** — risco de confusão para quem acessar a URL direta.
7. 🟡 **"IA" do `ai-briefing-generator` é simulada** — risco de expectativa de produto desalinhada caso o usuário queira cobrar funcionalidade real de IA generativa.
