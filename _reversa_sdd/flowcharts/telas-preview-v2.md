# Fluxograma — módulo `telas-preview-v2`

## O que existe vs. o que seria necessário

```mermaid
flowchart TD
    subgraph Hoje["Hoje: 4 páginas HTML estáticas"]
        A[form-builder.html\n0 funções JS]
        B[projects.html\nabre/fecha painel só]
        C[project-detail.html\n0 funções JS]
        D[client-tracking.html\ndialogs e toast só]
    end
    subgraph Faltando["Para virar real"]
        E[Entidade Projeto\nschema + API + migrate.js]
        F[CRUD de BriefingTemplate\nvia UI - editor de seções/campos]
        G[Portal pós-kickoff\nnovo fluxo de acompanhamento p/ cliente]
    end
    A -.-> F
    B -.-> E
    C -.-> E
    D -.-> G
    style E fill:#fecaca
    style F fill:#fecaca
    style G fill:#fecaca
```

Nenhuma das 4 telas importa `store.js`, usa `localStorage` ou chama `/api/*` — confirmado por busca direta no código, não por inferência.
