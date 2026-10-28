# telas-preview-v2, Design Técnico

## Interface
Nenhuma interface de dados real hoje — puramente apresentacional.

| Arquivo | Funções JS | Dado usado |
|---|---|---|
| `form-builder.html` | nenhuma | Texto estático "Briefing Pilates v2.4" |
| `projects.html` | abre/fecha painel lateral | Lista hardcoded no HTML |
| `project-detail.html` | nenhuma | Cliente fictício "Lumina Movement" |
| `client-tracking.html` | dialogs/toast, sem persistência | Mesmo cliente fictício |

## Fluxo Principal
Carregamento estático de HTML/Tailwind. Sem fetch, sem import de `store.js`.

## Fluxos Alternativos
N/A.

## Dependências (hoje)
Nenhuma — zero acoplamento com o restante do sistema. Isso significa risco de retrabalho **baixo** ao decidir a arquitetura real (nada para migrar, é greenfield dentro do próprio repositório).

## Decisões de Design Identificadas
Nenhuma decisão de design real foi tomada no código — só visualmente, no mockup. Ver `_reversa_sdd/crm-funil/decisions.md` para a decisão compartilhada de `Projeto`.

## Estado Interno
N/A.

## Observabilidade
N/A.

## Riscos e Lacunas
- 🔴 Entidade `Projeto`/`Entregavel` (compartilhada com `crm-funil`).
- 🔴 Entidade `AcompanhamentoPosKickoff` (só para `client-tracking.html`) — ver `data-dictionary.md`.
- 🔴 CRUD de `BriefingTemplate` via UI (só para `form-builder.html`) — ver unit `forms-hub`.
