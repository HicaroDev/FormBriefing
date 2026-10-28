# crm-funil

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA
> ⚠️ Esta unit documenta o estado **atual** do código (`crm.html`). As lacunas de Lead/Deal/Projeto estão detalhadas em `decisions.md` e `questions.md` — não foram resolvidas pelo usuário ainda.

## Visão Geral
Kanban de 4 colunas sobre o status real de `BriefingInstance`. Não é, hoje, um funil de vendas pré-cliente — é um quadro de acompanhamento pós-cadastro.

## Responsabilidades
- Agrupar instâncias de briefing em colunas por status (many-to-one).
- Permitir mudança de status via drag-and-drop, persistindo local e remotamente.

## Regras de Negócio
- RN-CRM-01: `columnForStatus(status)` mapeia os 7 valores de `BriefingInstance.status` em 4 colunas visuais (many-to-one, mesmo mapeamento visto em `dashboard-core`). 🟢
- RN-CRM-02: drag-and-drop chama `updateBriefingStatus` direto, sem passar por nenhuma etapa de "lead" anterior ao envio do briefing. 🟢
- RN-CRM-03: não existe entidade `Lead`/`Deal` hoje — card representa sempre um `BriefingInstance` já existente, vinculado a um `Cliente` já cadastrado. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Cada briefing aparece em exatamente uma das 4 colunas, conforme seu status | Must | `columnForStatus` cobre todos os 7 valores de status sem ambiguidade |
| RF-02 | Arrastar um card entre colunas muda o status real do briefing | Must | `drop` chama `updateBriefingStatus` + `patchInstanceRemote` |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Disponibilidade | Mudança de status local é imediata; sincronização remota é fire-and-forget | `crm.html` (`render`, `drop`) | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um briefing com status em_preenchimento
Quando o diretor arrasta o card para a coluna correspondente a submetido
Então o status do briefing muda para submetido e é persistido local e remotamente

Dado o estado atual do sistema
Quando um card é exibido no Kanban
Então ele representa sempre um BriefingInstance já existente, nunca um pré-cliente sem briefing
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Mapeamento status→coluna (RF-01) | Must | Sem ele o Kanban não tem conteúdo |
| Drag-and-drop muda status real (RF-02) | Must | É a única interação funcional da tela hoje |
| Entidade `Lead`/`Deal` (ver `decisions.md`) | 🔶 Pendente de decisão do usuário | MVP no roadmap do próprio usuário, mas não implementado — não classificar MoSCoW até a decisão ser tomada |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `crm.html` | `render`, `columnForStatus`, listeners de drag-and-drop | 🟢 |
