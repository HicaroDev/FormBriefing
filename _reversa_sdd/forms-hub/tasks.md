# forms-hub, Tarefas de Implementação

## Pré-requisitos
- [ ] `dashboard-core` disponível (`BriefingTemplate`)

## Tarefas

- [ ] T-01, Reimplementar listagem read-only com contagem de seções/campos
  - Origem no legado: `forms-hub.html`
  - Critério de pronto: cobre todos os templates, incluindo os gerados por IA (só-cache)
  - Confiança: 🟢

- [ ] T-02, Centralizar `VERTICAL_META` em `store.js` (ou módulo compartilhado), em vez de duplicar em cada tela
  - Origem no legado: `forms-hub.html:108-114` (RN-FORMS-02)
  - Critério de pronto: `forms-hub.html` e `dashboard.js` (`VERTICAL_LABELS`) consomem a mesma fonte
  - Confiança: 🟡

## Tarefas condicionais (dependem do roadmap do usuário, ver `questions.md`)

- [ ] TC-01, Implementar aba "Respostas recebidas" com agregação por template (taxa de conclusão, tempo médio)
  - Confiança: 🟡 — campos-fonte existem, falta a função de agregação
- [ ] TC-02, Implementar editor de template (form-builder) conectado a CRUD real
  - Confiança: 🔴 — depende da unit `telas-preview-v2`

## Tarefas de Teste

- [ ] TT-01, 0 templates mostra mensagem vazia correta
- [ ] TT-02, Template sem vertical conhecida usa fallback sem quebrar o layout

## Ordem Sugerida
1. T-01 primeiro (sem dependências).
2. T-02 pode ser feito em paralelo, baixo risco.
3. TC-01/TC-02 só após decisão de priorização do usuário (roadmap já marca como MVP em `prompts_stitch_studio_suite_2.1.md`).

## Lacunas Pendentes (🔴)
Ver `questions.md` desta unit.
