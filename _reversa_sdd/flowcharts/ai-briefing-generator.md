# Fluxograma — módulo `ai-briefing-generator`

## generateTemplateFromPrompt — "IA" real é matching de regras

```mermaid
flowchart TD
    A[Usuário digita prompt ou clica preset] --> B[handleGenerateAITemplate]
    B --> C[generateTemplateFromPrompt]
    C --> D{Prompt contém key/vertical/name\nde algum AI_PRESETS?}
    D -->|sim| E[Clona template fixo do preset\nsó troca o id]
    D -->|não| F[Monta template genérico de 4 seções\ninterpolando o texto livre nos labels]
    E --> G[addTemplate - persiste em store.js/localStorage]
    F --> G
    G --> H[Atualiza select de vertical no modal de clientes]
    H --> I[Toast de sucesso]
    style D fill:#fef3c7
```

Nenhuma chamada de rede a um LLM real ocorre em nenhum ramo deste fluxo — `AI_BRIEFING_SYSTEM_PROMPT` é só uma string de documentação, nunca enviada a lugar nenhum.

## Código morto confirmado

```mermaid
flowchart LR
    A["generateAISynthesis\n(ai-briefing-generator.js)"] -. importada mas nunca chamada .-> B[dashboard.js]
    C["generateProductionDigest\n(store.js)"] -->|usada de fato| B
    style A fill:#fecaca,stroke-dasharray: 5 5
    style C fill:#d1fae5
```
