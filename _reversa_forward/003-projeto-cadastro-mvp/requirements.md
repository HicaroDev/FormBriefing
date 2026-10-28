# Requirements — Cadastro de Projeto (MVP) com vínculo a Cliente

> Terceira feature do ciclo forward do Reversa para FormBriefing / Studio Suite 2.0. Ancorada na extração reversa em `_reversa_sdd/` e nos adendos vigentes das features 001 e 002. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA → `[DÚVIDA]`.
> Sequência confirmada pelo próprio usuário em `_reversa_sdd/gaps.md#Próximo passo`: auth → CRM/Lead → **Projeto/Entregáveis**. Esta feature cobre a parte "Projeto" (MVP); "Entregáveis"/acompanhamento pós-kickoff fica para depois (ver Escopo). As features 001 e 002 estão com código pronto e testado, pendentes só da validação manual do usuário em ambiente real (T026/T020) — esta feature roda em paralelo, mesma decisão já tomada para a 002.

## Objetivo

`projects.html` e `project-detail.html` existem hoje como telas de preview 100% estáticas (zero `store.js`, zero `localStorage`, zero `fetch`, confirmado por busca direta no código) — mostram uma lista de projetos hardcoded e um cliente fictício fixo ("Lumina Movement"). O roadmap do próprio usuário prioriza "Gestão de Projetos" como MVP. Esta feature cria a entidade `Projeto` real, vinculada a um `Cliente` já existente, e conecta as duas telas a dados reais, incluindo controle funcional de horas planejadas x consumidas (decisão explícita do usuário).

## Contexto (ancoragem na extração reversa)

- `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2` — confirma (🟢, RN-PREVIEW-01/02) que `projects.html`/`project-detail.html` não têm nenhuma lógica real hoje e pressupõem uma entidade `Projeto` inexistente.
- `_reversa_sdd/data-dictionary.md#Entidade candidata: Projeto` — schema de referência do manual de implementação do usuário (🟡, "não vinculante, stack diferente"): `phase` (6 fases: `briefing_aprovado`, `imersao_conceito`, `criacao`, `revisao_cliente`, `ajustes_finais`, `entregue`), `contracted_value`, `allocated_hours`/`consumed_hours`, `scope_pillars` (JSONB).
- `_reversa_sdd/questions.md`, Pergunta 7 — decisão do usuário: Projeto é MVP; no MVP precisa de cadastro, vínculo com `Cliente`, informações principais e estados operacionais básicos; acompanhamento avançado (entregáveis, aprovação) fica para depois.
- `_reversa_sdd/questions.md`, Pergunta 9 — decisão do usuário: controle de horas é funcional de verdade (não decorativo); `allocated_hours`/`consumed_hours` com apontamento manual e consulta planejado x realizado.
- `_reversa_sdd/questions.md`, Pergunta 8 — decisão do usuário sobre aprovação de entregável (atualiza status interno + log de auditoria, notificação só preparada) — registrada aqui por rastreabilidade, mas a entidade `Entregavel`/`client-tracking.html` em si ficam fora do escopo desta feature (ver abaixo).
- `_reversa_sdd/code-analysis.md#Módulo: crm-funil` — a ação "Transformar em Projeto" do mockup (card de Lead fechado) foi deliberadamente **não implementada** na feature 002 por falta da entidade `Projeto` — esta feature a reintroduz.
- `_reversa_sdd/erd-complete.md` — `CLIENTE \|\|--o\{ PROJETO : "possui (pós aprovado_kickoff) - CANDIDATA"` já prevista na extração original.
- `_reversa_sdd/addenda/002-crm-funil-lead-projeto.md` (vigente) — `clientes.lead_origem_id` já existe (feature 002), relevante para decidir a origem de um Cliente ao criar um Projeto.

## Escopo

### Dentro do escopo
- Entidade `Projeto` persistida no Postgres (tabela nova, aditiva), vinculada a um `Cliente` existente (`cliente_id` obrigatório).
- Fase do projeto dentre as 6 definidas pelo usuário, com transição livre entre elas no MVP (sem validação formal de sequência — ver RF-09).
- Campos `contracted_value`, `allocated_hours`, `consumed_hours`, `scope_pillars` (lista de pilares de escopo, texto livre).
- Apontamento manual de horas consumidas (incremento ao longo do tempo), com consulta de planejado x realizado.
- Ação "Transformar em Projeto" (ou "Criar Projeto"), disponível a partir de um `Cliente` existente, criando um Projeto novo vinculado, fase inicial `briefing_aprovado`.
- `projects.html` passa a listar os Projetos reais (substitui a lista hardcoded).
- `project-detail.html` passa a mostrar o detalhe real de um Projeto específico (substitui o cliente fictício fixo), incluindo cliente vinculado e progresso de horas planejado x realizado.
- Toda rota administrativa nova exige sessão de admin válida, reaproveitando o guard já corrigido em RN-API-01 (feature 001).
- Log de auditoria (reaproveitando o módulo já existente) para criação, edição e mudança de fase de Projeto.

### Fora do escopo
- Entidade `Entregavel` e o portal `client-tracking.html` (aprovação/ajuste de entregáveis pós-kickoff pelo cliente) — explicitamente "depois" na decisão do usuário (Pergunta 7); feature futura separada ("Acompanhamento Pós-Kickoff").
- Notificação externa (e-mail/WhatsApp) de aprovação de entregável — decisão do usuário (Pergunta 8) já prevê isso, mas só se aplica quando `Entregavel` existir, fora desta feature.
- `form-builder.html` (editor de modelo de briefing) — módulo `forms-hub`, também MVP no roadmap do usuário, mas assunto distinto (RN-PREVIEW-04), não misturar nesta feature.
- Validação formal de sequência de transição de fase (equivalente ao RN-CORE-04 de `BriefingInstance`) — registrada como "Should" (RF-09), não bloqueante para o MVP.
- Multi-usuário ou atribuição de projeto a um profissional específico — sistema continua de operador único.

## Requisitos Funcionais

| ID | Requisito | Prioridade (MoSCoW) | Critério de Aceite | Confiança |
|----|-----------|---------------------|---------------------|-----------|
| RF-01 | Existe uma entidade `Projeto` persistida no Postgres, vinculada a um `Cliente` existente (`cliente_id` obrigatório) | Must | Um Projeto criado sem `cliente_id` válido é rejeitado; um Projeto criado sobrevive a um redeploy/cold start | 🟢 |
| RF-02 | Projeto tem uma `fase` dentre as 6 definidas (`briefing_aprovado`, `imersao_conceito`, `criacao`, `revisao_cliente`, `ajustes_finais`, `entregue`), iniciando em `briefing_aprovado` | Must | Um Projeto criado começa em `briefing_aprovado`; mover para qualquer uma das outras 5 fases é possível e persistido | 🟡 |
| RF-03 | Projeto tem `contracted_value`, `allocated_hours`, `consumed_hours` e `scope_pillars`, todos persistidos | Must | Os 4 campos são salvos e lidos corretamente via API | 🟢 |
| RF-04 | Horas consumidas podem ser apontadas manualmente (incremento), e o sistema mostra planejado x realizado | Must | Apontar 2h duas vezes resulta em `consumed_hours = 4`; a UI mostra os dois valores lado a lado | 🟢 |
| RF-05 | Toda rota administrativa nova (CRUD de Projeto, apontamento de horas) rejeita com `401`/`403` qualquer requisição sem sessão de admin válida, antes de qualquer query | Must | Requisição direta sem cookie/sessão válida nunca retorna ou altera dados de Projeto | 🟢 |
| RF-06 | `projects.html` lista todos os Projetos reais, com cliente, fase e valores | Must | A tela não exibe mais nenhum dado hardcoded de projeto | 🟢 |
| RF-07 | `project-detail.html` mostra o detalhe real de um Projeto específico (cliente vinculado, fase, valores, horas) | Must | A tela não exibe mais o cliente fictício fixo "Lumina Movement" | 🟢 |
| RF-08 | Ação "Transformar em Projeto" cria um Projeto novo vinculado a um Cliente existente, fase inicial `briefing_aprovado` | Must | Após a ação, o Projeto aparece em `projects.html` vinculado ao Cliente correto | 🟢 |
| RF-09 | Mudança de fase não valida sequência formal (qualquer fase para qualquer fase é aceita no MVP) | Should | Não há bloqueio técnico de transição, mas a UI sugere a ordem natural das 6 fases | 🟡 |
| RF-10 | Criação, edição e mudança de fase de Projeto geram entrada no log de auditoria já existente, sem persistir dado sensível | Must | Consulta ao log de auditoria mostra a ação de Projeto, quem fez e quando | 🟢 |

## Requisitos Não Funcionais

| Tipo | Requisito | Evidência / Fonte | Confiança |
|------|-----------|--------------------|-----------|
| Segurança | Toda rota nova de Projeto reaproveita o guard de sessão já corrigido (RN-API-01), nunca introduz um caminho de acesso paralelo sem autenticação | `_reversa_sdd/addenda/001-corrige-autenticacao-api.md` | 🟢 |
| Dados | Nenhuma alteração destrutiva em `clientes`/`leads`/`instancias_briefing`; tabela de Projeto é aditiva | Decisão do usuário, consistente com as features 001/002 | 🟢 |
| Auditabilidade | Ações administrativas sobre Projeto são logadas via o módulo de auditoria já existente, nunca registrando dado sensível | RF-10 desta feature + RF-08 da feature 001 | 🟢 |
| Compatibilidade visual | Tokens Stitch glassmorphic aprovados são preservados em `projects.html`/`project-detail.html` ao conectá-las a dados reais | `_reversa_sdd/telas-preview-v2/requirements.md`, RF-01 | 🟢 |
| Operação | Sistema continua de operador único; não introduz conceito de atribuição de projeto a múltiplos profissionais | `_reversa_sdd/domain.md#1. Glossário` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado um Cliente existente, sem Projeto ainda
Quando o admin aciona "Transformar em Projeto" para esse Cliente
Então um Projeto novo é criado, vinculado a esse Cliente, na fase briefing_aprovado

Dado um Projeto com allocated_hours=40 e consumed_hours=10
Quando o admin aponta mais 5 horas consumidas
Então consumed_hours passa a ser 15, e a consulta planejado x realizado mostra 15 de 40

Dado que não existe sessão de admin válida
Quando uma requisição é feita diretamente à API de Projeto (criar, editar, apontar horas, mudar fase)
Então a resposta é 401 e nenhuma alteração ocorre

Dado o estado atual do sistema
Quando o admin abre projects.html ou project-detail.html
Então vê dados reais de Projetos existentes, nunca a lista hardcoded ou o cliente fictício fixo de antes
```

## Riscos e Impactos no Sistema Existente

- **Escopo da ação "Transformar em Projeto":** ver Pontos em Aberto — decisão de produto sobre de onde essa ação fica disponível.
- **Confusão com o "Transformar em Projeto" do card de Lead (mockup):** o mockup original colocava esse botão no card de Lead fechado (antes de existir `Cliente`), mas a conversão Lead→Cliente já foi resolvida na feature 002 antes de chegar a Projeto. Mitigação: a ação desta feature parte do `Cliente` (já convertido ou cadastrado direto), não do Lead — consistente com o funil completo Lead→Cliente→Projeto já decidido (Decisão 1 de `crm-funil/decisions.md`).
- **Dependência das features 001/002 ainda não 100% validadas em produção:** mesma observação já registrada nas duas features anteriores — as rotas de Projeto reaproveitam o mesmo guard, então qualquer ajuste necessário se propaga automaticamente.
- **Nomenclatura das 6 fases vem de uma fonte marcada como "não vinculante":** `data-dictionary.md` registra essas fases a partir do manual de implementação de referência (stack diferente do projeto real), não do código-fonte atual (que não tem nenhuma fase implementada). Mitigação: adotada como 🟡 INFERIDO, melhor fonte disponível; se o usuário quiser nomes diferentes, é um ajuste de dado de configuração, não de arquitetura.

## Esclarecimentos

### Sessão 2026-10-27

- **Q:** A ação "Transformar em Projeto" deve ficar disponível: (a) só para Clientes que vieram de um Lead convertido (`clientes.lead_origem_id` preenchido), ou (b) para qualquer Cliente, incluindo os cadastrados diretamente sem passar por um Lead?
  **R:** Opção (b), conforme recomendação apresentada — o usuário pediu para eu não travar o andamento do projeto esperando respostas que eu mesmo já sei decidir; segue a recomendação (disponível para qualquer Cliente, sem restringir por origem).

## Pontos em Aberto

Nenhum ponto em aberto nesta feature.

## Rastreabilidade

| Artefato da extração reversa | Relação com esta feature |
|---|---|
| `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2` | Confirma o estado atual (0% lógica real) que esta feature corrige |
| `_reversa_sdd/telas-preview-v2/requirements.md` | RN-PREVIEW-01/02, estado atual de `projects.html`/`project-detail.html` |
| `_reversa_sdd/data-dictionary.md#Entidade candidata: Projeto` | Schema de referência dos campos de Projeto |
| `_reversa_sdd/questions.md` (Perguntas 7, 8, 9) | Respostas do usuário que fundamentam o escopo e RF-02/03/04/09 |
| `_reversa_sdd/gaps.md` | Confirma a ordem (auth → CRM/Lead → Projeto) e que Entregáveis/acompanhamento ficam para depois |
| `_reversa_sdd/addenda/001-corrige-autenticacao-api.md` | Guard de autenticação a ser reaproveitado nas novas rotas de Projeto |
| `_reversa_sdd/addenda/002-crm-funil-lead-projeto.md` | `clientes.lead_origem_id` já existente, relevante para a origem do Cliente |
| `_reversa_sdd/erd-complete.md` | Relação `CLIENTE`→`PROJETO` já prevista na extração original |
