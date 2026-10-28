# Fluxograma — módulo `dashboard-core`

## Máquina de estados do BriefingInstance (observada no código, sem validador formal)

```mermaid
stateDiagram-v2
    [*] --> rascunho
    rascunho --> enviado
    [*] --> enviado: createBriefingInstance (default)
    enviado --> em_preenchimento: cliente abre o portal e começa a responder
    em_preenchimento --> submetido: cliente envia o formulário completo
    submetido --> em_revisao: equipe abre para análise
    em_revisao --> ajustes_solicitados: handleConfirmAdjustments
    em_revisao --> aprovado_kickoff: approveBriefing
    ajustes_solicitados --> em_preenchimento: cliente reabre e reenvia
    submetido --> aprovado_kickoff: approveBriefing (direto, sem passar por em_revisao)
    aprovado_kickoff --> [*]

    note right of ajustes_solicitados
        Qualquer status pode ir para
        ajustes_solicitados via modal —
        não há guarda de transição no código
    end note
```

## Ciclo de vida do Digest (Resumo Executivo)

```mermaid
flowchart TD
    A[status muda para submetido ou aprovado_kickoff] --> B[generateProductionDigest automático]
    C[selectBrief chamado no dashboard] --> B
    B --> D[Resolve template real da instância]
    D --> E[Extrai objetivo de campos textarea preenchidos]
    D --> F[Extrai pilares de campos select/cards_single_select]
    D --> G[Extrai entregáveis de campos chips_multiselect]
    D --> H[Monta checklist: 3 itens automáticos recalculados + itens de vertical preservando marcação manual]
    E & F & G & H --> I[saveDigest - localStorage apenas, sem persistência remota]
```

## Sincronização dashboard ↔ Neon (polling, não realtime)

```mermaid
flowchart TD
    A[DOMContentLoaded] --> B[syncAllFromRemote imediato]
    B --> C[setInterval 10s: syncAllFromRemote de novo]
    A --> D[setInterval 3.5s: compara hash local de instâncias]
    D --> E{Hash mudou desde última checagem?}
    E -->|sim| F[refreshDashboardData: re-renderiza métricas/tabela/inspetor]
    E -->|não| D
    C --> G{Resposta remota trouxe clients/instances?}
    G -->|sim| H[Substitui cache local - servidor é fonte de verdade]
    G -->|não/falha de rede| I[Silenciosamente ignora, mantém cache local]
```
