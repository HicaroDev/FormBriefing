# ai-briefing-generator, Tarefas de Implementação

## Pré-requisitos
- [ ] `dashboard-core` disponível (`addTemplate`, `getTemplates`)

## Tarefas

- [ ] T-01, Reimplementar `generateTemplateFromPrompt` com matching de preset + fallback genérico
  - Origem no legado: `ai-briefing-generator.js:304-403`
  - Critério de pronto: paridade de comportamento com os 3 presets fixos
  - Confiança: 🟢

- [ ] T-02, Corrigir slug do fallback para transliterar acentos antes do regex (RN-AI-04)
  - Origem no legado: `ai-briefing-generator.js:321`
  - Critério de pronto: "Ótica & Joalheria" gera slug limpo (ex: `otica-joalheria`)
  - Confiança: 🟡

- [ ] T-03, Decidir e executar: remover `generateAISynthesis` ou conectá-la a um fluxo real
  - Origem no legado: `ai-briefing-generator.js:413-455` (código morto)
  - Critério de pronto: decisão registrada em `questions.md`, código morto removido ou conectado
  - Confiança: 🟢 (ação simples, decisão é o que falta)

## Tarefas de Teste

- [ ] TT-01, Prompt com palavra-chave de preset retorna o preset correto
- [ ] TT-02, Prompt com acentos gera slug sem caracteres quebrados (após T-02)

## Ordem Sugerida
1. T-01 primeiro (núcleo funcional).
2. T-02 e T-03 são independentes e de baixo risco, podem ser feitas em qualquer ordem.

## Lacunas Pendentes (🔴)
- Se o usuário quiser IA generativa real no futuro, é uma feature nova do zero — nenhuma integração existente para evoluir.
