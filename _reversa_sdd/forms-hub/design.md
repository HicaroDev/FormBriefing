# forms-hub, Design Técnico

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `render()` | `()` | `void` | Lê `getTemplates()`, monta grid de cards |
| `templateLabel(tpl)` | `(BriefingTemplate)` | `string` | Resolve título i18n ou string simples |

## Fluxo Principal
1. `DOMContentLoaded` → `render()`.
2. `getTemplates()` (store.js) retorna array de `BriefingTemplate`.
3. Para cada template: resolve `VERTICAL_META`, `templateLabel`, conta seções/campos.
4. Renderiza card estático (sem clique, sem listener de ação).

## Fluxos Alternativos
- **0 templates:** mensagem "Nenhum modelo cadastrado ainda."
- **Vertical desconhecida:** fallback genérico de ícone/cor.

## Dependências
- `store.js` — `getTemplates`.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Tela é puramente de leitura, sem nenhuma ação de escrita | `forms-hub.html` | 🟢 |
| Mapa de vertical duplicado localmente em vez de importado | `forms-hub.html:108-114` | 🟡 |

## Estado Interno
Nenhum — lê sempre do `store.js`.

## Observabilidade
Nenhuma. 🔴

## Riscos e Lacunas
- 🔴 Aba "Respostas recebidas", KPIs (taxa de conclusão, tempo médio), busca/filtro, criação/edição/duplicação de template, "Gerar PIN avulso" — tudo do mockup, nada implementado. Ver `questions.md`.
- 🟡 Taxa de conclusão e tempo médio por template são computáveis hoje (campos-fonte existem em `BriefingInstance`), só falta a função de agregação — é o gap mais barato de resolver desta tela, se priorizado.
