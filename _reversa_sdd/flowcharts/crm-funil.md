# Fluxograma — módulo `crm-funil`

## Implementação atual (crm.html) — 4 colunas por status real

```mermaid
flowchart LR
    A[enviado / rascunho] --> B[em_preenchimento / ajustes_solicitados]
    B --> C[submetido / em_revisao]
    C --> D[aprovado_kickoff]
    style A fill:#eee
    style D fill:#d1fae5
```

Drag-and-drop entre colunas chama `updateBriefingStatus` direto — sem passar por nenhuma etapa de "lead" anterior ao envio do briefing.

## Funil conceitual do mockup — 3 estágios, começando ANTES do briefing existir

```mermaid
flowchart LR
    A["1. Descoberta & Lead<br/>(sem BriefingInstance ainda)"] -->|Disparar Form com PIN| B["2. Formulário Enviado<br/>(BriefingInstance criada, em progresso)"]
    B -->|cliente responde e envia| C["3. Briefing Recebido<br/>(submetido / em_revisao / aprovado_kickoff)"]
    C -->|Transformar em Projeto - AÇÃO SEM BACKEND HOJE| D[("Projeto<br/>entidade inexistente")]
    style A fill:#fef3c7
    style D fill:#fecaca,stroke-dasharray: 5 5
```

## Gap a resolver antes do /reversa-forward

```mermaid
flowchart TD
    A[Decisão do usuário/Architect] --> B{Criar entidade Lead/Deal?}
    B -->|sim| C[Novo schema: valor_deal, fonte_lead, estagio_funil]
    B -->|não| D[Reinterpretar coluna 1 como Clientes sem BriefingInstance]
    A --> E{Manter CRM e Forms Hub separados?}
    E -->|sim, recomendado| F[Portar só o estilo visual glassmorphic para crm.html atual]
    E -->|não| G[Fundir em uma página nova]
    A --> H{Score de IA e insight textual?}
    H -->|lógica real| I[Definir cálculo/integração de IA]
    H -->|decorativo| J[Remover do forward]
```
