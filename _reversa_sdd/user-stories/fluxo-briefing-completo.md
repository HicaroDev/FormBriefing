# User Story — Ciclo completo de um briefing

> Extraído dos módulos `auth`, `dashboard-core`, `client-intake`, `crm-funil`. Escala: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Como estúdio (admin)
**Quero** cadastrar um cliente e disparar um briefing com código/WhatsApp
**Para** iniciar a coleta de informações sem usar e-mail/Google Docs

1. 🟢 Admin faz login (`auth`).
2. 🟢 Admin cadastra cliente novo (`handleCreateClientSubmit`) ou usa um existente.
3. 🟢 Admin dispara briefing via modal (`confirmSendBriefing`) — gera `BriefingInstance`, código/link, mensagem de WhatsApp pronta.
4. 🟢 Briefing aparece no Kanban (`crm-funil`) na coluna correspondente a `enviado`.

## Como cliente final
**Quero** preencher meu briefing pelo celular, sem instalar nada
**Para** responder no meu tempo, sem perder progresso

5. 🟢 Cliente acessa o link, digita o código único (`client-intake`, `auth`).
6. 🟢 Zero-leakage gate garante que só vê seus próprios dados.
7. 🟢 Formulário é preenchido com autosave; status avança para `em_preenchimento`.
8. 🟢 Cliente confirma nome/e-mail e submete; status avança para `submetido`.

## Como estúdio (admin), de novo
**Quero** revisar a resposta e aprovar ou pedir ajuste
**Para** decidir o kickoff do projeto

9. 🟢 Admin abre o briefing no dashboard; digest é resintetizado automaticamente.
10. 🟢 Admin aprova (`aprovado_kickoff`, trava edição) ou pede ajuste (`ajustes_solicitados`, libera reabertura com confirmação de e-mail).

## Lacuna identificada neste fluxo
- 🔴 Após `aprovado_kickoff`, não existe nenhuma tela real de "Projeto" para dar continuidade visível ao cliente ou ao estúdio — é aqui que `telas-preview-v2` e a decisão de `Lead`/`Projeto` (`crm-funil`) se conectam ao fluxo.
