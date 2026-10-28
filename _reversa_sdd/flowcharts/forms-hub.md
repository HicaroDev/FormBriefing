# Fluxograma — módulo `forms-hub`

## Fluxo real (forms-hub.html → render())

```mermaid
flowchart TD
    A[DOMContentLoaded] --> B[getTemplates da store.js]
    B --> C{templates.length == 0?}
    C -->|sim| D["Nenhum modelo cadastrado ainda."]
    C -->|não| E[Para cada template]
    E --> F[Resolve VERTICAL_META pelo tpl.vertical]
    E --> G[templateLabel: resolve titulo com i18n pt/it/en]
    E --> H[Conta secoes e campos]
    F --> I[Renderiza card estático]
    G --> I
    H --> I
    style D fill:#fef3c7
```

Sem clique, sem busca, sem filtro, sem criação/edição — 100% leitura.

## Mockup (06_studio_suite_forms_hub_biblioteca) — superfície x realidade

```mermaid
flowchart LR
    subgraph Mockup["Mockup: biblioteca rica"]
        M1[4 KPIs agregados]
        M2[Abas: Modelos / Respostas / Arquivados]
        M3[Busca + filtro por vertical]
        M4["% conclusão, último uso, link curto por card"]
        M5[Editar / Duplicar / Gerar PIN avulso / Novo modelo]
    end
    subgraph Real["forms-hub.html hoje"]
        R1[Grid simples de cards]
        R2["Só seções/campos reais (contagem)"]
    end
    M1 -.->|requer agregação nova sobre BriefingInstance| GAP1[🔴 lacuna]
    M2 -.->|requer visão por template, hoje é por cliente| GAP2[🔴 lacuna]
    M4 -.->|campos não existem no BriefingTemplate| GAP3[🔴 lacuna]
    M5 -.->|nenhum CRUD de template via UI existe| GAP4[🔴 lacuna]
    style GAP1 fill:#fecaca
    style GAP2 fill:#fecaca
    style GAP3 fill:#fecaca
    style GAP4 fill:#fecaca
```
