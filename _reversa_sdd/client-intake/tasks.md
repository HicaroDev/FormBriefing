# client-intake, Tarefas de Implementação

## Pré-requisitos
- [ ] `dashboard-core` (Cliente, BriefingInstance, BriefingTemplate) disponível
- [ ] `api-backend` disponível para revalidação remota
- [ ] Decisão sobre unificar ou não o digest preliminar com `generateProductionDigest`

## Tarefas

- [ ] T-01, Implementar o gate de zero-leakage (RN-INTAKE-01)
  - Origem no legado: `form-engine.js:182-185`
  - Critério de pronto: parâmetro inválido nunca expõe outro cliente, em nenhum caminho de código
  - Confiança: 🟢
  - **Tratar como caminho crítico de segurança — cobertura de teste obrigatória (ver ADR-003).**

- [ ] T-02, Implementar `enforceRoleIsolation()` executando antes de qualquer outra lógica
  - Origem no legado: `form-engine.js` (`initClientPortal`, passo 1)
  - Critério de pronto: menus internos da agência nunca aparecem, nem em tela de erro
  - Confiança: 🟢

- [ ] T-03, Implementar motor paramétrico de renderização de campos
  - Origem no legado: `form-engine.js` (`renderDynamicFormSections`, `renderField`)
  - Critério de pronto: cobre todos os tipos observados (text, textarea, select, chips_multiselect, cards_single_select, slider, upload)
  - Confiança: 🟢

- [ ] T-04, Implementar autosave com debounce e promoção automática de status
  - Origem no legado: `form-engine.js` (`triggerAutosave`)
  - Critério de pronto: 600ms de debounce, promove `rascunho→em_preenchimento` na primeira edição
  - Confiança: 🟢

- [ ] T-05, Implementar submissão final com confirmação de identidade
  - Origem no legado: `form-engine.js` (`handleFinalSubmission`, `executeFinalSubmission`)
  - Critério de pronto: grava `__confirmado_*`, muda status para `submetido`, gera protocolo
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Código/brief inválido nunca expõe outro cliente (happy + falha, RF-01) — **prioridade máxima**
- [ ] TT-02, Autosave salva progresso sem ação explícita do cliente
- [ ] TT-03, Reabertura em `submetido` funciona com e-mail correto e falha com e-mail errado
- [ ] TT-04, `aprovado_kickoff` não oferece reabertura pela UI

## Ordem Sugerida
1. T-01 e T-02 antes de qualquer outra coisa — são a base de segurança de todo o módulo.
2. T-03 e T-04 podem ser paralelos, ambos dependem do schema de `BriefingTemplate`.
3. T-05 depende de T-04 (autosave já funcionando).

## Lacunas Pendentes (🔴)
- Caminho de reabertura pós-`aprovado_kickoff` pela agência (se existir, não foi encontrado no código lido).
- Decisão sobre unificar o digest preliminar da submissão com `generateProductionDigest`.
