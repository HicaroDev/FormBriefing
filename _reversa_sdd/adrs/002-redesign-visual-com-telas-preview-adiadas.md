# ADR-002 — Redesign visual Studio Suite 2.0 com telas de preview adiadas

**Status:** Aceito (implementado) · **Data:** 2026-10-26 (commit `93f74ca`) · **Confiança:** 🟢 CONFIRMADO (mensagem do próprio commit)

## Contexto
O usuário encomendou mockups visuais no Google Stitch ("Studio Suite 2.0") para modernizar a identidade visual (glassmorphism laranja/vidro) de login, portal, dashboard, formulário de cliente, CRM e Forms Hub. Os mockups incluíam telas para funcionalidades que ainda não existiam no backend: funil de vendas com Lead, editor de modelo de briefing, gestão de projetos, evolução de projeto e acompanhamento do cliente pós-kickoff.

## Decisão
Aplicar a nova identidade visual **mantendo toda a funcionalidade real existente** (login real, CRM como Kanban sobre o status real de `BriefingInstance`, Forms Hub listando templates reais, modal de envio com código/WhatsApp substituindo `prompt()`), e **marcar explicitamente como preview** as 4 telas que dependeriam de entidades de banco novas (`form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html`) — citação literal da mensagem do commit: *"marcadas como preview até decisão sobre novas entidades de banco"*. O pacote de design Stitch foi arquivado em `modelo_site/` como referência.

## Consequências observadas
- O usuário percebeu a tela de CRM resultante como "não tem nada a ver" com o mockup que ele gostava — a decisão de "manter a funcionalidade real" significou simplificar o funil de 6 estágios do mockup (com Lead/valor/origem) para as 4 colunas de status reais de `BriefingInstance`, uma divergência conceitual relevante o suficiente para motivar esta sessão de engenharia reversa.
- As 4 telas de preview ficaram no repositório sem nenhuma lógica (confirmado no módulo `telas-preview-v2`: zero imports de `store.js`/API) — tecnicamente corretas quanto ao escopo anunciado, mas sem nenhum indicador visual de "preview" para quem acessa a URL direta hoje (🟡 ponto de atenção de UX, não verificado nesta sessão).
- Esta ADR é o documento-chave que confirma: a divergência mockup-vs-real do CRM não é um defeito de implementação, é uma decisão consciente de escopo já tomada — a pendência é decidir **quando e como** fechar essa lacuna, não **se** ela existe.
