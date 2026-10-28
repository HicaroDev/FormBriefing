# Investigation — Funil de Lead/Deal (CRM) com conversão para Cliente

> Pesquisa de fundo por trás das decisões técnicas de `roadmap.md`.

## Por que tabela de configuração em vez de `CHECK CONSTRAINT`/enum fixo para os estágios

Um `ENUM` ou `CHECK (estagio IN (...))` no Postgres exigiria uma migração (`ALTER TYPE`/`ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT`) para adicionar ou renomear um estágio — exatamente o tipo de mudança "hardcoded" que a decisão do usuário (`crm-funil/decisions.md`, Decisão 1) pediu para evitar. Uma tabela separada (`lead_estagios`) permite inserir/editar uma linha sem qualquer deploy ou migração, mesmo sem uma UI de administração nesta feature — a UI pode vir depois, sem exigir mudança de schema. O preço é um `JOIN`/segunda consulta para resolver rótulos, irrelevante em volume de dados tão pequeno (um estúdio de operador único).

## Por que `leads.estagio` ainda é uma FK (não um texto livre)

Mesmo configurável, o valor de `estagio` de um Lead precisa ser sempre um dos valores válidos — uma FK para `lead_estagios(chave)` garante isso no próprio banco, sem depender de validação de aplicação (reaproveitando a mesma filosofia de "nunca confiar só no client-side" da feature 001, RN-API-01).

## Por que a ação "Converter em Cliente" não é um DELETE do Lead seguido de um INSERT em `Cliente`

A decisão do usuário (`crm-funil/decisions.md`, Decisão 1) é explícita: "converter um Lead em Cliente preserva o histórico (não é um DELETE+INSERT)". Tecnicamente isso significa que a linha de `leads` nunca é removida pela conversão — ela só tem seu `estagio` atualizado para `fechado` e ganha uma referência ao `Cliente` recém-criado (`leads.cliente_id`). O `Cliente` novo, por sua vez, guarda `lead_origem_id` apontando de volta — uma relação bidirecional redundante, mas que permite navegar em ambos os sentidos sem depender de um `JOIN` reverso.

## Por que a view de Kanban de briefing migra para dentro de `index.html`, e não para uma página HTML nova

`dashboard.js` já implementa roteamento por hash (`checkHashRoute()`, visto em `_reversa_sdd/code-analysis.md#Módulo: dashboard-core`) alternando `currentView` entre `'briefs'` e `'clients'`. Adicionar um terceiro valor (`'kanban'`, nome final a confirmar no `/reversa-to-do`) é consistente com um padrão que já existe no código, em vez de criar uma 11ª página HTML no projeto (que hoje já tem 10 entry points declarados em `vite.config.js`, por `_reversa_sdd/dependencies.md`). Isso também evita duplicar `requireAuth()`/inicialização de dashboard em mais um arquivo.

## Por que não implementar "Transformar em Projeto" nem o score de IA

Ambos são elementos do mockup de referência (`...crm_forms_hub_glassmorphic`) sem lógica real por trás, confirmados como decorativos em `_reversa_sdd/code-analysis.md#Módulo: crm-funil`. O usuário já decidiu explicitamente remover o score de IA (Decisão 2) e a entidade `Projeto` está fora do escopo desta feature (ver `requirements.md`). Renderizar qualquer um dos dois sem lógica real violaria a diretriz geral do usuário contra "elementos decorativos simulando funcionalidade inexistente" (mesma linguagem usada por ele na Pergunta 5 de `questions.md`).

## Alternativas descartadas

- **Fundir `Lead` na própria tabela `clientes`** (ex.: um booleano `eh_lead`): descartado porque o usuário decidiu explicitamente que `Lead`/`Cliente`/`Projeto` são "entidades distintas e relacionadas" (Decisão 1) — uma tabela única misturaria dois ciclos de vida diferentes (pré-venda vs. pós-venda) e dificultaria a trava de autorização (um Lead nunca deveria ser visível por uma sessão de tipo `cliente`, por exemplo, enquanto `Cliente` tem casos de leitura restrita por `cliente_id`).
- **Endpoint REST aninhado `POST /api/leads/:id/convert`**: tecnicamente mais "RESTful", mas a Vercel resolve funções serverless por arquivo (`api/<nome>.js`), sem roteador dinâmico de path params sem configuração adicional (`vercel.json` com rewrites) — fora do padrão já estabelecido pelo projeto (confirmado em `_reversa_sdd/dependencies.md`: zero configuração de roteamento customizado hoje). O padrão `{action:'convert'}` já tem precedente direto em `api/auth.js`.
