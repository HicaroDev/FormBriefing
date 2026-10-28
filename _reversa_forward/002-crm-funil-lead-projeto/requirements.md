# Requirements — Funil de Lead/Deal (CRM) com conversão para Cliente

> Segunda feature do ciclo forward do Reversa para FormBriefing / Studio Suite 2.0. Ancorada na extração reversa em `_reversa_sdd/` e no adendo vigente da feature 001. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA → `[DÚVIDA]`.
> Pré-requisito do próprio usuário (ver `_reversa_sdd/security-architecture-decisions.md` e `gaps.md#Próximo passo`): esta feature só começa depois de RN-API-01 corrigida. Status: feature `001-corrige-autenticacao-api` está em 25/26 ações concluídas (código pronto e testado), falta apenas a validação manual em ambiente real (T026) — rodando em paralelo, conforme decisão explícita do usuário em 2026-10-27.

## Objetivo

Hoje `crm.html` é só um quadro Kanban de 4 colunas sobre o status de `BriefingInstance` — não existe conceito de pré-cliente. O roadmap do próprio usuário (confirmado em `prompts_stitch_studio_suite_2.1.md`, tela 03, e priorizado como MVP) prevê um funil de vendas real, de 6 estágios, com entidade `Lead` própria, que pode ser convertida em `Cliente` preservando histórico. Esta feature implementa esse funil com persistência real, sem descartar o Kanban atual sem decisão explícita (ver Pontos em Aberto).

## Contexto (ancoragem na extração reversa)

- `_reversa_sdd/crm-funil/requirements.md` — confirma (🟢) o estado atual: `crm.html` mapeia 7 valores de `BriefingInstance.status` em 4 colunas (RN-CRM-01), sem conceito de `Lead`/pré-cliente (RN-CRM-03).
- `_reversa_sdd/crm-funil/decisions.md`, Decisão 1 — decisão do usuário (2026-10-27): implementar a Opção A (funil completo, persistência real, 6 estágios preferencialmente configuráveis, `Lead`/`Cliente`/`Projeto` como entidades distintas e relacionadas, conversão sem perda de histórico).
- `_reversa_sdd/crm-funil/decisions.md`, Decisão 2 — score de IA no card do lead deve ser **removido** (decorativo não autorizado pelo usuário).
- `_reversa_sdd/data-dictionary.md#Entidade candidata: Lead` — schema de referência do manual de implementação do próprio usuário: `estimated_value`, `fonte_lead` (enum Instagram/Indicação/Google/WhatsApp), `stage` (6 valores: novo_lead, briefing_enviado, briefing_recebido, proposta_enviada, fechado, perdido).
- `_reversa_sdd/questions.md`, Perguntas 4-6 — respostas do usuário fundamentam RF-01 a RF-07 abaixo.
- `_reversa_sdd/gaps.md#✅ Resolvido` e `#Próximo passo` — confirma a ordem de implementação (auth → CRM/Lead → Projeto/Entregáveis) e que a entidade `Projeto` completa é um passo **seguinte**, fora desta feature.
- `_reversa_sdd/addenda/001-corrige-autenticacao-api.md` (vigente) — RN-API-01 já corrigida: toda rota administrativa nova desta feature deve reaproveitar `_auth-guard.js`/sessão de admin, já existente e testada.
- `_reversa_sdd/erd-complete.md` — `LEAD` já aparece como entidade candidata relacionada a `CLIENTE` (`torna-se`, ao cadastrar formalmente).

## Escopo

### Dentro do escopo
- Entidade `Lead` persistida no Postgres (tabela nova, aditiva), com os campos de referência do próprio usuário: nome/empresa de contato, origem (`fonte_lead`), valor estimado (`estimated_value`), estágio do funil.
- Funil de 6 estágios (novo_lead → briefing_enviado → briefing_recebido → proposta_enviada → fechado / perdido), com os estágios modelados de forma configurável (não hardcoded em `if/switch` espalhado pelo código) — decisão explícita do usuário.
- Interface visual do funil (Kanban de Leads) reaproveitando os tokens Stitch glassmorphic aprovados, sem o score de IA decorativo.
- Ação "Converter em Cliente": transforma um Lead (tipicamente em `fechado`) em um `Cliente` real, preservando o Lead original como histórico (nunca DELETE+INSERT) e vinculando os dois registros.
- Toda rota administrativa nova (CRUD de Lead, mudança de estágio, conversão) exige sessão de admin válida, reaproveitando o guard já corrigido em RN-API-01 — zero acesso sem autenticação, consistente com a correção já entregue.
- Log de auditoria (reaproveitando a tabela/módulo já criado na feature 001) para criação, edição, mudança de estágio, conversão e exclusão de Lead.
- Preenchimento manual do valor estimado e da origem pelo admin; estrutura de dados preparada (mas não implementada) para futura integração externa de propostas/CRM.
- Reserva, no desenho de dados, de um ponto de relação entre `Cliente` e uma futura entidade `Projeto` (ex.: uma coluna ou tabela de referência), para que a feature seguinte (Projeto/Entregáveis) não exija migração destrutiva — sem implementar `Projeto` em si.
- `crm.html` passa a ser a página do funil de Lead; o Kanban atual de acompanhamento de `BriefingInstance.status` (RN-CRM-01/02/03) migra para outra rota/aba, a ser detalhada no `/reversa-plan` (decisão registrada em "Esclarecimentos" abaixo).

### Fora do escopo
- Entidade `Projeto` completa (cadastro, fases, horas, entregáveis) e as telas `projects.html`/`project-detail.html` — feature separada e posterior, conforme a própria ordem definida pelo usuário em `gaps.md#Próximo passo`.
- `AcompanhamentoPosKickoff` (portal de cliente pós-kickoff) — depende de `Projeto`, que está fora do escopo aqui.
- Score de IA real ou heurístico no card do lead — decisão do usuário foi remover, não substituir por outra lógica (Decisão 2).
- Qualquer integração paga ou externa de CRM/propostas comerciais — estrutura preparada, integração não construída agora (Pergunta 6).
- Reautenticação adicional para operações críticas de Lead (RF-04 da feature 001, que já ficou como "Should" não implementado) — não é objetivo desta feature reabrir essa decisão.

## Requisitos Funcionais

| ID | Requisito | Prioridade (MoSCoW) | Critério de Aceite | Confiança |
|----|-----------|---------------------|---------------------|-----------|
| RF-01 | Existe uma entidade `Lead` persistida no Postgres, com os campos de referência do próprio usuário (contato, empresa, origem, valor estimado, estágio) | Must | Um Lead criado sobrevive a um redeploy/cold start da função serverless, consultável por API autenticada | 🟢 |
| RF-02 | O funil tem exatamente os 6 estágios definidos pelo usuário (novo_lead, briefing_enviado, briefing_recebido, proposta_enviada, fechado, perdido) | Must | Um Lead criado começa em `novo_lead`; mover para qualquer um dos outros 5 estágios é possível e persistido | 🟢 |
| RF-03 | Os estágios do funil são modelados de forma configurável (não espalhados como strings mágicas pelo código) | Should | Adicionar/renomear um estágio não exige alterar lógica de negócio em múltiplos arquivos — localizado em um único ponto de configuração | 🟡 |
| RF-04 | Ação "Converter em Cliente" cria um `Cliente` real a partir de um Lead, vinculando os dois registros, sem apagar o Lead original | Must | Após a conversão, o Lead continua consultável (histórico) e o novo `Cliente` referencia o Lead de origem | 🟢 |
| RF-05 | Toda rota administrativa nova desta feature (CRUD de Lead, mudança de estágio, conversão) rejeita com `401`/`403` qualquer requisição sem sessão de admin válida, antes de qualquer query | Must | Requisição direta sem cookie/sessão válida nunca retorna ou altera dados de Lead | 🟢 |
| RF-06 | O card de Lead não exibe nenhum score de IA ou insight decorativo não implementado | Must | Nenhum campo de "score" ou "insight de IA" aparece na UI do funil | 🟢 |
| RF-07 | Campos `valor_estimado`/`fonte_lead` são preenchidos manualmente pelo admin; o desenho de dados não impede evoluir para integração externa depois | Should | Formulário de Lead aceita esses campos como entrada manual; nenhuma integração externa é chamada | 🟢 |
| RF-08 | Criação, edição, mudança de estágio, conversão e exclusão de Lead geram entrada no log de auditoria já existente (RF-08 da feature 001), sem persistir dado sensível | Must | Consulta ao log de auditoria mostra a ação de Lead, quem fez e quando | 🟢 |
| RF-09 | O desenho de dados reserva um ponto de relação entre `Cliente` e a futura entidade `Projeto`, sem implementar `Projeto` | Should | A feature seguinte (Projeto) consegue se conectar a `Cliente` sem precisar de migração destrutiva do que foi entregue aqui | 🟡 |

## Requisitos Não Funcionais

| Tipo | Requisito | Evidência / Fonte | Confiança |
|------|-----------|--------------------|-----------|
| Segurança | Toda rota nova de Lead reaproveita o guard de sessão já corrigido (RN-API-01), nunca introduz um caminho de acesso paralelo sem autenticação | `_reversa_sdd/addenda/001-corrige-autenticacao-api.md` | 🟢 |
| Dados | Nenhuma alteração destrutiva em `clientes`/`instancias_briefing`; tabela(s) de Lead são aditivas | Decisão do usuário, consistente com a feature 001 | 🟢 |
| Compatibilidade visual | Tokens Stitch glassmorphic aprovados são preservados onde compatíveis com o schema real (sem o score de IA) | `_reversa_sdd/crm-funil/decisions.md`, Decisão 1 | 🟢 |
| Auditabilidade | Ações administrativas sobre Lead são logadas via o módulo de auditoria já existente, nunca registrando dado sensível | RF-08 desta feature + RF-08 da feature 001 | 🟢 |
| Operação | Sistema continua de operador único (um admin); não introduz conceito de múltiplos papéis ou atribuição de Lead a vendedores distintos | `_reversa_sdd/domain.md#1. Glossário` | 🟡 |

## Critérios de Aceitação

```gherkin
Dado um Lead no estágio novo_lead
Quando o admin move o card para proposta_enviada
Então o estágio é persistido no banco e refletido em qualquer sessão subsequente

Dado um Lead no estágio fechado
Quando o admin aciona "Converter em Cliente"
Então um Cliente novo é criado vinculado ao Lead original, o Lead não é apagado, e o histórico de estágios permanece consultável

Dado que não existe sessão de admin válida
Quando uma requisição é feita diretamente à API de Lead (criar, editar, mover estágio, excluir)
Então a resposta é 401 e nenhuma alteração ocorre

Dado o estado atual do sistema
Quando um card de Lead é exibido no funil
Então ele nunca mostra score de IA, insight de IA ou qualquer indicador decorativo não implementado
```

## Riscos e Impactos no Sistema Existente

- **Migração do Kanban atual (`crm.html`) para outra rota:** `crm.html` passa a ser o funil de Lead; o Kanban de `BriefingInstance.status` (RN-CRM-01/02/03) precisa de um novo lugar na navegação sem quebrar o acesso que o time do estúdio já usa hoje. Mitigação: `/reversa-plan` define a rota/aba de destino e garante que a transição seja comunicada (ex.: link ou aviso na posição antiga).
- **Dependência da feature 001 ainda não 100% validada em produção:** o guard de autenticação que as novas rotas de Lead vão reaproveitar está codificado e testado (16/16 testes automatizados), mas a validação manual contra o ambiente real (T026) ainda está pendente. Mitigação: as rotas de Lead devem ser escritas reaproveitando exatamente o mesmo `_auth-guard.js` já existente, sem lógica de autenticação paralela — qualquer problema encontrado na validação de T026 se propaga e se corrige num único lugar.
- **Migração de dados não-destrutiva:** a tabela de Lead é inteiramente nova; não há dados legados de "Lead" para migrar (a entidade não existe hoje). Risco baixo.

## Esclarecimentos

### Sessão 2026-10-27

- **Q:** O Kanban atual de `crm.html` (4 colunas sobre `BriefingInstance.status`, RN-CRM-01/02/03) deve ser: (a) totalmente substituído pelo novo funil de Lead, (b) mantido em abas na mesma página ("Leads" e "Briefings em Andamento"), ou (c) `crm.html` passa a ser o funil de Lead e o Kanban de briefing migra para outra rota/aba separada?
  **R:** Opção (c), conforme recomendação apresentada — `crm.html` passa a ser o funil de Lead (6 estágios); o Kanban de acompanhamento de `BriefingInstance.status` migra para fora dessa página (rota/aba separada, a ser detalhada no `/reversa-plan`), já que o dashboard principal (`index.html`) já cobre parte dessa visão via "Roster de briefings com filtros por status".

## Pontos em Aberto

Nenhum ponto em aberto nesta feature.

## Rastreabilidade

| Artefato da extração reversa | Relação com esta feature |
|---|---|
| `_reversa_sdd/crm-funil/requirements.md` | Confirma o estado atual (`crm.html` sobre `BriefingInstance.status`), que esta feature evolui ou substitui |
| `_reversa_sdd/crm-funil/decisions.md` | Decisões 1 e 2, fonte primária do escopo desta feature |
| `_reversa_sdd/data-dictionary.md#Entidade candidata: Lead` | Schema de referência dos campos de Lead |
| `_reversa_sdd/questions.md` (Perguntas 4, 5, 6) | Respostas do usuário que fundamentam RF-01 a RF-07 |
| `_reversa_sdd/gaps.md` | Confirma a ordem (auth → CRM/Lead → Projeto) e que Projeto fica para a feature seguinte |
| `_reversa_sdd/addenda/001-corrige-autenticacao-api.md` | Guard de autenticação a ser reaproveitado nas novas rotas de Lead |
| `_reversa_sdd/erd-complete.md` | Relação `LEAD`→`CLIENTE` já esperada na extração como entidade candidata |
