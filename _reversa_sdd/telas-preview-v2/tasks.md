# telas-preview-v2, Tarefas de Implementação

## Pré-requisitos
- [ ] Decisão sobre `Lead`/`Projeto` registrada (`crm-funil/decisions.md`)
- [ ] RN-API-01 corrigido antes de expor qualquer rota nova para estas telas

## Tarefas (todas condicionais à decisão de arquitetura)

- [ ] TC-01, Implementar schema + API de `Projeto`/`Entregavel`, conectar `projects.html`/`project-detail.html`
  - Origem no legado: schema de referência em `manual_de_implementa_o_studio_suite_2.1_para_claude_code.md` seção 5
  - Critério de pronto: quadro Kanban de projetos reflete dados reais, com fases do roadmap do usuário (6 fases)
  - Confiança: 🔴

- [ ] TC-02, Implementar CRUD de `BriefingTemplate` via UI, conectar `form-builder.html`
  - Origem no legado: nenhuma — feature nova
  - Critério de pronto: editar/criar/publicar versão de um template reflete em `forms-hub.html`
  - Confiança: 🔴

- [ ] TC-03, Definir e implementar `AcompanhamentoPosKickoff`, conectar `client-tracking.html`
  - Origem no legado: nenhuma — feature nova
  - Critério de pronto: cliente vê status real de entregáveis do seu projeto, com aprovação/pedido de ajuste persistido
  - Confiança: 🔴

## Tarefas de Teste
N/A até a decisão de escopo ser tomada.

## Ordem Sugerida (conforme priorização do próprio usuário)
1. TC-01 (Projetos, MVP no roadmap) e TC-02 (Editor de modelo, MVP no roadmap) primeiro.
2. TC-03 (Acompanhar projeto) é "Depois" no próprio roadmap do usuário — pode ficar para uma rodada futura.

## Lacunas Pendentes (🔴)
Toda a unit depende de decisão humana — ver `questions.md`.
