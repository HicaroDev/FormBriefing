# Requirements — [Nome da Feature]

> Template do ciclo forward do Reversa (`/reversa-requirements`). Descreve O QUE a feature deve fazer — não o como. Ancorado na extração reversa em `_reversa_sdd/` quando ela existir. Escala de confiança por item: 🟢 CONFIRMADO (evidência direta no código legado ou decisão explícita do usuário) | 🟡 INFERIDO (dedução razoável, sem confirmação direta) | 🔴 LACUNA (sem evidência nem decisão — vira `[DÚVIDA]`). Máximo de três marcadores `[DÚVIDA]` no documento inicial.

## Objetivo
[1-3 linhas: o problema que esta feature resolve e por quê, em linguagem de negócio]

## Contexto (ancoragem na extração reversa)
- Fonte: `_reversa_sdd/<arquivo>#<seção>` — [o que essa fonte confirma]
- Fonte: `_reversa_sdd/<arquivo>#<seção>` — [o que essa fonte confirma]

## Escopo

### Dentro do escopo
- [item]

### Fora do escopo
- [item, com justificativa curta de por que fica fora]

## Requisitos Funcionais

| ID | Requisito | Prioridade (MoSCoW) | Critério de Aceite | Confiança |
|----|-----------|---------------------|---------------------|-----------|
| RF-01 | [descrição] | Must | [como validar] | 🟢 |

## Requisitos Não Funcionais

| Tipo | Requisito | Evidência / Fonte | Confiança |
|------|-----------|--------------------|-----------|
| Segurança | [descrição] | `_reversa_sdd/<arquivo>` ou decisão do usuário | 🟢 |

## Critérios de Aceitação

```gherkin
Dado [pré-condição]
Quando [ação]
Então [resultado esperado]

Dado [condição de erro]
Quando [ação inválida]
Então [comportamento de falha esperado]
```

## Riscos e Impactos no Sistema Existente
- [risco] — [mitigação proposta]

## Pontos em Aberto
- [DÚVIDA] [pergunta objetiva, com as opções conhecidas se houver]

## Rastreabilidade

| Artefato da extração reversa | Relação com esta feature |
|---|---|
| `_reversa_sdd/<arquivo>` | [confirma / contradiz / contextualiza] |
