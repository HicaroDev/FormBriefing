# Roadmap — [Nome da Feature]

> Template do `/reversa-plan`. Expressa a abordagem técnica como DELTA sobre o legado já extraído em `_reversa_sdd/` — nunca redescreve a arquitetura inteira. Cada decisão técnica carrega confiança: 🟢 CONFIRMADO (apoiado em evidência do legado ou decisão explícita do usuário) | 🟡 INFERIDO/PREMISSA (decisão razoável sem confirmação direta, ou assumida a partir de um `[DÚVIDA]` aceito) | 🔴 LACUNA.

## Resumo da abordagem
[2-4 linhas: a estratégia escolhida, em uma frase cada decisão principal]

## Princípios Aplicados
[Lista de princípios de `.reversa/principles.md` avaliados, com conflitos se houver. Omitir seção se o arquivo não existir.]

## Decisões Técnicas

| Decisão | Alternativas consideradas | Escolhida | Justificativa | Confiança |
|---|---|---|---|---|
| [tema] | [opções] | [escolha] | [por quê] | 🟢 |

## Delta Arquitetural
[O que muda em relação a `_reversa_sdd/architecture.md` — componentes novos, componentes modificados, nada removido sem justificativa]

## Delta de Dados
[Resumo; detalhe completo fica em `data-delta.md`]

## Delta de Contratos
[Resumo dos contratos HTTP/fila/etc. afetados; detalhe completo fica em `interfaces/`]

## Plano de Migração
[Passos para não quebrar o que já funciona — feature flags, migração em etapas, período de transição]

## Riscos
[Riscos técnicos específicos desta abordagem, com mitigação]

## Critério de Pronto
- [ ] [condição objetiva e verificável]
