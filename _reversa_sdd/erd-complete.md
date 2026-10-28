# ERD Completo — FormBriefing / Studio Suite 2.0

> 🟢 = entidade real (Postgres ou localStorage, confirmada no código) · 🔴 = candidata, não existe hoje (ver `data-dictionary.md` para campos detalhados)

```mermaid
erDiagram
    CLIENTE ||--o{ BRIEFING_INSTANCE : "possui (FK cliente_id, ON DELETE CASCADE)"
    BRIEFING_INSTANCE }o--|| BRIEFING_TEMPLATE : "usa (template_id, sem FK real)"
    BRIEFING_INSTANCE ||--o| RESPOSTA_DIGEST : "gera (briefing_id, sem FK real — localStorage)"

    LEAD ||--o| CLIENTE : "torna-se (ao cadastrar formalmente) - CANDIDATA"
    CLIENTE ||--o{ PROJETO : "possui (pós aprovado_kickoff) - CANDIDATA"
    PROJETO ||--o{ ENTREGAVEL : "possui - CANDIDATA"

    CLIENTE {
        varchar id PK
        varchar codigo_unico UK
        varchar nome_responsavel
        varchar empresa
        varchar vertical
        varchar status_cliente
        jsonb briefings_ids "duplicado da FK real, pode ficar orfao"
    }
    BRIEFING_INSTANCE {
        varchar id PK
        varchar cliente_id FK
        varchar template_id "sem FK real p/ BriefingTemplate"
        varchar status "sem validacao de transicao"
        jsonb respostas_brutas
        jsonb anexos
        int progresso_percentual
    }
    BRIEFING_TEMPLATE {
        string id PK "so em localStorage"
        string vertical
        array secoes "sem status/arquivado"
    }
    RESPOSTA_DIGEST {
        string id PK "so em localStorage"
        string briefing_id "sem FK real"
        array checklist_kickoff
    }
    LEAD {
        uuid id PK "CANDIDATA - nao existe"
        string stage "6 estagios, roadmap MVP do usuario"
        numeric estimated_value
        string fonte_lead
    }
    PROJETO {
        uuid id PK "CANDIDATA - nao existe"
        string phase "6 fases, roadmap MVP do usuario"
        numeric contracted_value
        int allocated_hours
        int consumed_hours
    }
    ENTREGAVEL {
        uuid id PK "CANDIDATA - nao existe"
        string version
        string status
    }
```

## Notas sobre integridade referencial

- 🟢 `BriefingInstance.cliente_id → clientes.id` é a única FK real no banco (`ON DELETE CASCADE`, confirmado em `api/migrate.js`).
- 🔴 `BriefingInstance.template_id` **não** é uma FK de banco — é só uma string que deve coincidir com um `id` de `BriefingTemplate` no `localStorage`; não há integridade garantida (um template pode ser apagado do `localStorage` e a instância continuaria referenciando um id inexistente, sem erro).
- 🔴 `Cliente.briefings_ids` (JSONB) duplica a mesma relação que a FK real já expressa — mantido manualmente, pode ficar órfão (RN-API-04, já registrado no módulo `api-backend`).
- 🔴 `RespostaDigest.briefing_id` também não é FK real — mesma limitação de `BriefingTemplate`.
