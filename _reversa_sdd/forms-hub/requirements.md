# forms-hub

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Catálogo somente-leitura dos `BriefingTemplate` cadastrados, agrupados visualmente por vertical.

## Responsabilidades
- Listar todos os templates disponíveis com contagem de seções/campos.
- Resolver título/ícone/cor por vertical.

## Regras de Negócio
- RN-FORMS-01: tela é 100% somente-leitura — não cria, edita, duplica ou arquiva templates. 🟢
- RN-FORMS-02: `VERTICAL_META` é um mapa hardcoded local, não compartilhado — risco de desatualização se nova vertical for criada. 🟡
- RN-FORMS-03: contagem de seções/campos é sempre recalculada ao vivo, nunca armazenada. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Listar todos os templates com badge de vertical, título, versão, contagem de seções/campos | Must | `render()` cobre todos os templates de `getTemplates()` |
| RF-02 | Template i18n (`{pt,it,en}`) exibe o rótulo correto | Should | `templateLabel` resolve objeto ou string |
| RF-03 | Vertical sem entrada em `VERTICAL_META` ainda renderiza com fallback genérico | Should | Fallback `{nome: tpl.vertical, icon: 'description', cor: 'text-secondary'}` |

## Requisitos Não Funcionais

Nenhum requisito não-funcional com evidência direta no código (tela estática, sem rede própria além de `getTemplates()` local). 🔴

## Critérios de Aceitação

```gherkin
Dado 0 templates cadastrados
Quando a tela carrega
Então mostra "Nenhum modelo cadastrado ainda."

Dado um template com vertical "tattoo" (sem entrada em VERTICAL_META)
Quando a tela renderiza o card
Então usa o fallback genérico (ícone description, cor secundária) sem erro
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Listagem read-only (RF-01) | Must | Única função real da tela hoje |
| Sincronizar `VERTICAL_META` com fonte central de verticais | Should | Risco atual é baixo (fallback existe), mas cresce com mais verticais via IA |
| Abas Respostas/Arquivados, KPIs, busca/filtro (do mockup) | 🔶 Pendente | MVP no roadmap do usuário (ver `questions.md`), não implementado |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `forms-hub.html` | `render`, `templateLabel` | 🟢 |
