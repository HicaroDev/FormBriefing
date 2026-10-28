# Regression Watch — Cadastro de Projeto (MVP) com vínculo a Cliente

> Gerado pelo `/reversa-coding`. Regras que mudaram e precisam continuar verdadeiras nas próximas extrações (`/reversa`).

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após a mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|--------------------------------|----------------------|---------------------|
| W001 | `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2`, RN-PREVIEW-02 (parcialmente superada) | `projects.html`/`project-detail.html` consomem `Projeto` real via `/api/projetos`; `form-builder.html`/`client-tracking.html` continuam 100% estáticas (RN-PREVIEW-02 ainda vale para essas 2) | presença | `projects.html`/`project-detail.html` voltarem a usar dados hardcoded, ou `form-builder.html`/`client-tracking.html` ganharem lógica real sem uma feature dedicada que documente essa mudança |
| W002 | `projects.html`/`project-detail.html` (decisão de produto) | As telas NUNCA voltam a exibir squads, SLA médio, Gantt, matriz de capacidade ou membros de equipe fictícios sem uma entidade real por trás | ausência | Qualquer elemento visual novo nessas telas que não tenha campo correspondente em `projetos`/`clientes` |
| W003 | `api/projetos.js` (novo, reaproveita RN-API-01) | Toda rota de `/api/projetos` rejeita com `401`/`403` qualquer requisição sem sessão de admin válida, antes de qualquer query | presença | Uma alteração em `api/projetos.js` que não chame `requireSession`/`isAdmin` antes de tocar o banco |

## Observações (sem peso de regressão — eram 🟡/🔴 antes da mudança)

- RF-09 (validação formal de sequência de fase) foi registrado como "Should" e não implementado — qualquer fase aceita qualquer transição no MVP; não é regressão, nunca existiu.
- `Entregavel` e `client-tracking.html` continuam fora do escopo (decisão do usuário, Pergunta 7) — feature futura separada.
- Os testes automatizados (`_projeto-rules.test.js`) cobrem só as funções puras — `api/projetos.js` em si não tem teste unitário dedicado, só o roteiro manual de `onboarding.md` (T018, pendente de execução pelo usuário).

## Histórico de re-extrações

(vazio — preenchido pelo agente reverso quando `/reversa` rodar de novo sobre este código)

## Arquivadas

(vazio)
