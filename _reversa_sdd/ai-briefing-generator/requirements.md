# ai-briefing-generator

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Gera novos `BriefingTemplate` por preset estático ou prompt livre, usando correspondência de regras — não é uma integração real com LLM, apesar do nome e do comentário do código.

## Responsabilidades
- Gerar template a partir de 1 dos 3 presets fixos (tattoo/derma/gastronomy) ou de texto livre.
- Persistir o template gerado via `addTemplate` (store.js).

## Regras de Negócio
- RN-AI-01: a geração é 100% simulada por regras/presets estáticos, sem chamada real a LLM. 🟢
- RN-AI-02: `generateAISynthesis` é código morto (importado, nunca chamado). 🟢
- RN-AI-03: matching de preset é por substring bidirecional case-insensitive. 🟢
- RN-AI-04: slug do fallback não translitera acentos antes do regex. 🟡

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Selecionar um preset gera o template fixo correspondente com novo id | Must | `generateTemplateFromPrompt` clona e persiste |
| RF-02 | Prompt livre sem match de preset gera template genérico de 4 seções com texto interpolado | Should | Estrutura fixa preenchida com o texto do usuário |
| RF-03 | Template gerado atualiza o select de vertical no modal de cadastro de cliente | Should | `handleGenerateAITemplate` injeta nova `<option>` |

## Requisitos Não Funcionais
Nenhum identificado com evidência direta (não há chamada de rede, não há timeout configurado). 🔴

## Critérios de Aceitação

```gherkin
Dado o prompt "quero algo para um estúdio de tatuagem"
Quando generateTemplateFromPrompt é chamado
Então retorna o preset fixo "tattoo" com um novo id

Dado o prompt "Ótica & Joalheria" (sem preset correspondente)
Quando generateTemplateFromPrompt é chamado
Então gera um template genérico de 4 seções com o texto interpolado nos labels
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Geração por preset/regras (RF-01/RF-02) | Should | Funcional e usado, mas não é diferencial real de produto hoje |
| Remover ou conectar `generateAISynthesis` | Must (decisão, não feature) | Código morto gera confusão de manutenção |
| Integração real com LLM | Won't (a menos que o usuário decida o contrário) | Não implementado, nenhuma evidência de intenção imediata além do comentário no código |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `ai-briefing-generator.js` | `generateTemplateFromPrompt`, `generateAISynthesis`, `AI_PRESETS` | 🟢 |
