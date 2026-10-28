# Lacunas — FormBriefing / Studio Suite 2.0

> Gerado pelo Reviewer em 2026-10-26. Atualizado em 2026-10-27 após o usuário responder as 14 perguntas de `questions.md`. Os itens abaixo que tinham pergunta correspondente agora têm **decisão registrada** — a lacuna de conhecimento foi resolvida, mesmo que a implementação ainda não tenha sido feita (isso é trabalho do `/reversa-forward`, ainda não executado).

## ✅ Resolvido — decisão do usuário registrada (2026-10-27)

- **RN-API-01** (ausência de autenticação no servidor) — decisão completa em `security-architecture-decisions.md` + `questions.md` Perguntas 1-3: reaproveitar auth existente, exigir MFA/TOTP para admin, sessões seguras, corrigir ANTES de qualquer feature nova. *(Crítico — prioridade de implementação máxima, mas decisão de produto fechada.)*
- Entidade `Lead`/`Deal` e funil de 6 estágios — **implementar completo** (Opção A), estágios configuráveis, `Lead`/`Cliente`/`Projeto` distintos e relacionados. (`crm-funil/decisions.md`, Pergunta 4)
- Score de IA no card do lead — **remover** (decorativo não autorizado). (`crm-funil/decisions.md`, Pergunta 5)
- Origem do valor do lead — **preenchimento manual** pelo admin, estrutura preparada para integração futura. (Pergunta 6)
- Entidade `Projeto` (MVP) — **confirmado**: cadastro, vínculo com cliente, informações principais, estados operacionais básicos no MVP; acompanhamento avançado fica para depois. (Pergunta 7)
- Aprovação de entregável (`AcompanhamentoPosKickoff`) — **atualiza status interno + log de auditoria**, notificação externa (e-mail/WhatsApp) só como arquitetura preparada, não implementada agora. (Pergunta 8)
- Horas do projeto — **controle funcional real**: `allocated_hours`/`consumed_hours`, apontamento manual, consulta planejado x realizado. (Pergunta 9)
- Aba "Respostas recebidas" do Forms Hub — **manter navegação por cliente + adicionar visão por template**, sem duplicar dados. (Pergunta 10)
- "Gerar PIN avulso" — **PIN sempre vinculado a um briefing/formulário existente**, mas pode ser gerado/regenerado antes da conclusão do briefing. (Pergunta 11)
- Validação formal de transição de status (RN-CORE-04) — **implementar no backend**, regras simples e documentadas. (Pergunta 12)
- Código morto `generateAISynthesis` — **remover**, após auditar referências/impacto. (Pergunta 13)
- Expectativa de IA real no `ai-briefing-generator` — **preparar arquitetura para LLM futuro**, manter regras/presets por ora, nunca apresentar como IA generativa já implementada. (Pergunta 14)

## Moderado (ainda sem decisão formal — não cobertos pelas 14 perguntas)
- Upsert parcial de `POST /api/instances` (RN-API-03) e `briefings_ids` órfão após DELETE (RN-API-04) — tratamento específico ainda não perguntado ao usuário; tende a ser resolvido como parte da correção geral de RN-API-01. (`api-backend/`)

## Cosmético / baixo risco (ainda abertos)
- Slug sem transliteração de acentos no fallback de IA. (`ai-briefing-generator/`)
- `VERTICAL_META` duplicado entre `forms-hub.html` e `dashboard.js`. (`forms-hub/`)
- Rate limiting ausente em login e acesso por PIN — **coberto pela decisão de segurança geral** (item 7 de `security-architecture-decisions.md`), portanto já tem direção definida.
- 3 cópias idênticas de `studio_intake_system/DESIGN.md` em `modelo_site/`. (`design-reference-stitch/`)

## Próximo passo
Com as 14 perguntas respondidas, a lacuna de *conhecimento/decisão* está essencialmente fechada. O que resta é a fase de **implementação** (`/reversa-forward`), que deve seguir a ordem definida: auditoria de segurança → correção de autenticação com testes → CRM/Lead → Projeto/Entregáveis, conforme as diretrizes em `security-architecture-decisions.md`.
