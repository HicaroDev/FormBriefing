# crm-funil, Design Técnico

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `render()` | `()` | `void` | Lê `getBriefingInstances()` + `getClients()`, agrupa em 4 colunas fixas (`COLUMNS`) |
| `columnForStatus(status)` | `(string)` | `string` | Mapeamento many-to-one dos 7 status para 4 colunas |
| `drop(event)` | `(DragEvent)` | `void` | Chama `updateBriefingStatus(instanceId, newStatus)` + `patchInstanceRemote`, re-renderiza |

## Fluxo Principal
1. `render()` carrega instâncias + clientes, monta 4 colunas via `columnForStatus`.
2. Drag nativo HTML5 (`dragstart`/`dragover`/`drop`).
3. Ao soltar, `updateBriefingStatus` (local) + `patchInstanceRemote` (fire-and-forget), depois `render()` de novo.

## Fluxos Alternativos
Nenhum identificado além do drag-and-drop — não há busca, filtro, criação de novo item, ou qualquer ação por botão nesta tela hoje.

## Dependências
- `store.js` — `getBriefingInstances`, `getClients`, `updateBriefingStatus`, `patchInstanceRemote`.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| 4 colunas mapeadas 1:1 aos status reais, não a um funil de vendas separado | `crm.html` (`COLUMNS`, `columnForStatus`) | 🟢 |
| Nenhuma lógica de "lead"/valor/score existe no código real — só no mockup (`crm_forms_hub_glassmorphic`), onde é 100% decorativa/estática | comparação `crm.html` vs. mockup | 🟢 |

## Estado Interno
Nenhum estado próprio — lê sempre do `store.js` (fonte única de verdade local).

## Observabilidade
Nenhuma. 🔴

## Riscos e Lacunas
- 🔴 **Entidade `Lead`/`Deal` não existe** — ver `decisions.md` e `questions.md` desta unit. Esta é a decisão de maior impacto do sistema (ver `traceability/spec-impact-matrix.md`).
- 🔴 **Entidade `Projeto`** (ação "Transformar em Projeto") não existe — compartilhada com a unit `telas-preview-v2`.
- 🟡 Score de IA e insight textual do mockup NÃO aparecem no prompt original do usuário (`prompts_stitch_studio_suite_2.1.md`) — confirmar se é requisito real antes de especificar.
