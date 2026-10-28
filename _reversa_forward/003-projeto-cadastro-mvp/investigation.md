# Investigation — Cadastro de Projeto (MVP) com vínculo a Cliente

> Pesquisa de fundo por trás das decisões técnicas de `roadmap.md`.

## Por que reescrever `projects.html`/`project-detail.html` em vez de conectar o mockup existente a dados reais

Ao ler o código real de `projects.html`, encontrei um nível de elaboração muito maior do que o esperado por `_reversa_sdd/code-analysis.md#Módulo: telas-preview-v2` (que só confirma "0% lógica real", sem detalhar a profundidade visual): 5 colunas de "fase operacional" (Backlog & Kickoff, Em Criação & Design, Validação & Review, Desenvolvimento & APIs, Concluído & Handover) — diferentes das 6 fases de negócio decididas pelo usuário —, métricas de SLA médio, Gantt/Linha do Tempo, Matriz de Capacidade, squads nomeados (Nexus/Forge/Vetting) com membros de equipe fictícios (Diego Ramos, Marina Costa etc.), todos sem nenhuma entidade correspondente no sistema (não existe `Squad`, não existe `MembroEquipe`, não existe métrica de SLA calculada em lugar nenhum). `project-detail.html` tem a mesma característica — um cliente fictício fixo ("Lumina Movement") com histórico de marcos, squad responsável, "travamento de escopo" — também sem nenhuma entidade de apoio no backend.

Implementar fidelidade total a isso significaria inventar pelo menos 3 entidades novas (`Squad`, `MembroEquipe`, algum conceito de SLA/sprint) que: (a) não foram pedidas pelo usuário em nenhuma das 14 perguntas respondidas; (b) não têm nenhum dado de origem real no sistema (não há cadastro de funcionários/squads em lugar nenhum do código); (c) contradizem diretamente a decisão já tomada pelo usuário na Pergunta 7 ("não precisa do acompanhamento completo ainda") e a diretriz geral contra "elementos decorativos simulando funcionalidade inexistente" (mesma linguagem usada para rejeitar o score de IA do Lead, Decisão 2 de `crm-funil/decisions.md`).

Por isso a decisão foi reescrever as duas telas com um recorte mais simples e honesto: Projeto real, Cliente vinculado, fase (das 6 decididas), valor contratado, horas planejadas x consumidas — exatamente o que foi pedido como MVP, com o mesmo padrão visual (glassmorphism leve) já usado em `crm.html`, em vez dos tokens "VisionOS" mais elaborados do mockup original.

## Por que a tabela de fases (`projeto_fases`) segue o mesmo padrão de `lead_estagios`

Mesma razão da feature 002: a nomenclatura das 6 fases vem de `data-dictionary.md`, que cita o manual de implementação de referência como "não vinculante, stack diferente" — a fonte mais confiável disponível, mas explicitamente não uma especificação fechada. Uma tabela de configuração permite ajustar nomes/ordem sem migração, consistente com a forma como o funil de Lead já foi resolvido.

## Por que "Transformar em Projeto" fica em `projects.html`, não em `dashboard.js`

A alternativa óbvia seria um botão na tabela/carteira de clientes (`index.html`, renderizada por `dashboard.js`). Descartada pela mesma razão de risco já registrada na feature 002 (T014): `dashboard.js` tem ~100KB e lógica de DOM acoplada (confirmado em `_reversa_sdd/code-analysis.md#Módulo: dashboard-core`, "acoplamento frágil — qualquer troca de classe no HTML do aside quebra o inspetor, já ocorreu um bug desse tipo"). Colocar a ação em `projects.html` (uma página nova e simples) com um seletor de Cliente (consultando `GET /api/clients`, rota já existente e já autenticada) entrega a mesma funcionalidade sem esse risco.

## Por que o apontamento de horas é uma ação atômica no servidor, não um PATCH do valor final

Se o front-end lesse `consumed_hours`, somasse localmente e mandasse de volta via `PATCH`, duas abas abertas ao mesmo tempo apontando horas poderiam se sobrescrever (a segunda `PATCH` sobrescreveria o valor, perdendo o incremento da primeira). Uma ação dedicada (`{action:'apontar_horas', horas}`) soma direto na query SQL (`consumed_hours = consumed_hours + ${horas}`), atômica no próprio banco — mesmo cuidado que já foi aplicado ao rate limiting da feature 001 (nunca confiar em estado lido e re-escrito pelo cliente para contagens).

## Alternativas descartadas

- **Adicionar `Squad`/`MembroEquipe` de verdade:** descartado — nenhuma pergunta das 14 respondidas pelo usuário menciona equipe/squads como requisito; seria escopo novo não autorizado, não uma correção de lacuna já mapeada.
- **Validação formal de sequência de fase (como RN-CORE-04 seria para `BriefingInstance`):** descartado para o MVP — o usuário só decidiu isso explicitamente para `BriefingInstance.status` (Pergunta 12), não para `Projeto.fase`. Registrado como RF-09 "Should", não bloqueante.
