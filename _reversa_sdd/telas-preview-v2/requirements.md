# telas-preview-v2

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA
> Estas 4 telas foram explicitamente marcadas como preview pelo próprio commit de redesign (ADR-002) — esta spec documenta o estado atual (visual-only) e as perguntas a resolver antes de implementar de verdade.

## Visão Geral
`form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html` — 4 telas de preview visual, sem nenhuma lógica real, aguardando decisão sobre as entidades `Projeto`/`Entregavel`.

## Responsabilidades (hoje)
- Exibir a intenção visual aprovada (glassmorphism Studio Suite 2.0) para 4 funcionalidades futuras.

## Regras de Negócio
- RN-PREVIEW-01: nenhuma das 4 telas importa `store.js`, usa `localStorage` ou chama `/api` — confirmado por busca direta. 🟢
- RN-PREVIEW-02: `projects.html`/`project-detail.html` pressupõem a entidade `Projeto`, inexistente. 🟢
- RN-PREVIEW-03: `client-tracking.html` implica um 2º portal de cliente, pós-kickoff, distinto do portal de intake. 🟡
- RN-PREVIEW-04: `form-builder.html` implica CRUD de `BriefingTemplate` via UI, inexistente. 🟡

## Requisitos Funcionais (estado atual)

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Preservar a identidade visual aprovada até a decisão de schema | Must | Nenhuma mudança visual sem aprovação |
| RF-02 | Não expor estas 4 URLs como funcionais na navegação principal até terem lógica real | Should | 🔴 não verificado se há algum link ativo apontando para elas hoje |

## Requisitos Não Funcionais
N/A — nenhuma lógica para avaliar.

## Critérios de Aceitação

```gherkin
Dado o estado atual do projeto
Quando alguém acessa form-builder.html, projects.html, project-detail.html ou client-tracking.html diretamente
Então vê a tela estática de preview, sem nenhum dado real carregado ou persistido
```

## Prioridade (MoSCoW)
Todas as 4 telas são **🔶 Pendentes de decisão** — ver `questions.md`. O próprio roadmap do usuário (`prompts_stitch_studio_suite_2.1.md`) já classifica: Projetos (telas 09/10) = MVP; Acompanhar projeto (tela 16) = Depois; Editor de modelo (tela 07) = MVP.

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `form-builder.html` | nenhuma (0 funções JS) | 🟢 |
| `projects.html` | `openProcessDrawer`/`closeProcessDrawer` | 🟢 |
| `project-detail.html` | nenhuma (0 funções JS) | 🟢 |
| `client-tracking.html` | `openNoteDialog`/`closeNoteDialog`/`submitNote`/`handleApprove`/`showToast` | 🟢 |
