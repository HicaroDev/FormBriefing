# crm-funil, Decisões Arquiteturais

> Decisões 1 e 2 foram respondidas pelo usuário em 2026-10-27 (ver `questions.md`, Perguntas 4-6). Decisão 3 mantém a recomendação do Architect, sem objeção do usuário.

## Decisão 1 — Implementar o funil de Lead/Deal?

**Contexto:** o mockup escolhido pelo usuário e o próprio `prompts_stitch_studio_suite_2.1.md` (escrito por ele) especificam um funil de vendas de 6 estágios (Novo lead → Briefing enviado → Briefing recebido → Proposta enviada → Fechado/Perdido) com valor estimado e origem do lead, priorizado como **MVP**. Isso não existe hoje — `crm.html` é só um Kanban sobre o status real de `BriefingInstance`.

**Opções:**
- **A.** Implementar a entidade `Lead` completa (schema em `data-dictionary.md`), nova(s) rota(s) de API, e substituir `crm.html` por um funil de 6 estágios real.
- **B.** Manter o modelo atual (4 colunas sobre `BriefingInstance.status`), portando só os tokens visuais glassmorphic.
- **C.** Híbrido: tratar a coluna "Novo lead" como `Cliente`s sem nenhum `BriefingInstance` ainda (sem criar tabela nova), e as demais colunas como hoje.

**Recomendação do Architect:** opção A é a mais alinhada ao roadmap do próprio usuário, mas tem o maior custo (nova tabela, novas rotas, resolver RN-API-01 antes). Opção C é o meio-termo de menor risco técnico que já cobre o "Novo lead" sem schema novo.

**✅ DECIDIDO (2026-10-27):** **Opção A.** Funil completo com persistência real. Seis estágios iniciais, preferencialmente configuráveis (não hardcoded no código — considerar uma tabela/enum editável). `Lead`, `Cliente` e `Projeto` são entidades distintas e relacionadas; converter um Lead em Cliente preserva o histórico (não é um DELETE+INSERT). Pré-requisito explícito: RN-API-01 corrigido e validado primeiro (Pergunta 3). Interface visual aprovada do mockup deve ser preservada onde for compatível com esse schema.

## Decisão 2 — Score de IA no card do lead

**Contexto:** aparece no mockup glassmorphic, mas **não está no prompt original do usuário** (`prompts_stitch_studio_suite_2.1.md`, tela 03). Provável adição decorativa do gerador Stitch.

**Opções:** manter decorativo (sem lógica), implementar lógica real (heurística ou IA de fato), ou remover.

**✅ DECIDIDO (2026-10-27):** **Remover.** O usuário não quer elementos decorativos simulando funcionalidade inexistente. Só volta a existir se houver pontuação real, baseada em critérios definidos, verificáveis e explicáveis — possivelmente junto com a integração de IA real mencionada na Pergunta 14 (preparar estrutura, sem contratar LLM pago agora).

## Decisão 3 — Fundir CRM + Forms Hub em uma página?

**Contexto:** o mockup de referência funde as duas (nome do arquivo: `crm_forms_hub_glassmorphic`); a implementação real mantém 2 páginas separadas, ambas funcionais hoje.

**Recomendação do Architect:** manter separado — não há ganho funcional em fundir, e fundir aumentaria o custo de manutenção sem resolver nenhuma lacuna.
