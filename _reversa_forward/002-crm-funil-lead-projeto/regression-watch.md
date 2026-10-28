# Regression Watch — Funil de Lead/Deal (CRM) com conversão para Cliente

> Gerado pelo `/reversa-coding`. Regras que mudaram e precisam continuar verdadeiras nas próximas extrações (`/reversa`). Preenchido a partir da seção "Modificadas" de `legacy-impact.md`.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após a mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|--------------------------------|----------------------|---------------------|
| W001 | `_reversa_sdd/code-analysis.md#Módulo: crm-funil`, RN-CRM-03 (superada) | `Lead` existe como entidade real, distinta de `Cliente`/`BriefingInstance`, com `estagio` próprio (não reaproveita `BriefingInstance.status`) | presença | Qualquer código novo que volte a tratar um card do funil de Lead como um `BriefingInstance` já existente, ou que remova a tabela `leads`/`lead_estagios` |
| W002 | `crm.html` (conceito alterado) | `crm.html` é o funil de Lead (estágios de `lead_estagios`); o Kanban de `BriefingInstance.status` vive em `index.html#kanban`, não em `crm.html` | presença | `crm.html` voltar a renderizar colunas de `BriefingInstance.status`, ou a view `#kanban` desaparecer de `index.html` sem um substituto equivalente |
| W003 | `api/leads.js` (novo, reaproveita RN-API-01) | Toda rota de `/api/leads` (`GET`/`POST`/`PATCH`/`DELETE`) rejeita com `401`/`403` qualquer requisição sem sessão de admin válida, antes de qualquer query | presença | Uma alteração em `api/leads.js` que não chame `requireSession`/`isAdmin` de `_auth-guard.js` antes de tocar o banco |

## Observações (sem peso de regressão — eram 🟡/🔴 antes da mudança)

- RF-03 (estágios configuráveis via `lead_estagios`, não hardcoded) foi registrado como "Should" — a tabela de configuração existe e é a fonte de verdade, mas não há UI de administração para editá-la nesta entrega; isso não é uma regressão, é um escopo que nunca existiu.
- O desvio de implementação de T014 (view `#kanban` como script inline em `index.html`, sem tocar `dashboard.js`) está documentado em `legacy-impact.md` e `actions.md` — não é uma regra de negócio, é uma decisão de implementação, registrada aqui só para contexto de uma futura extração que for comparar com o `roadmap.md` original.
- Os testes automatizados (`_leads-rules.test.js`) cobrem só as funções puras — `api/leads.js` em si (como `clients.js`/`instances.js`) não tem teste unitário dedicado, só o roteiro manual de `onboarding.md` (T020, ainda pendente de execução pelo usuário).

## Histórico de re-extrações

(vazio — preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código)

## Arquivadas

(vazio)
