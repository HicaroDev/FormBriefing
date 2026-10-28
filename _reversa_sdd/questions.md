# Perguntas para Validação — FormBriefing / Studio Suite 2.0

> Gerado pelo Reviewer em 2026-10-26. Consolida todas as perguntas 🔴 das 9 units de spec. Responda o campo **Resposta** de cada uma (ou responda direto no chat/Telegram) — qualquer uma das duas formas funciona.

---

## Pergunta 1 — Autenticação no servidor (prioridade máxima)

**Contexto:** `api/clients.js` e `api/instances.js` não verificam sessão nenhuma (RN-API-01).
**Spec afetada:** `api-backend/requirements.md`, `api-backend/tasks.md`
**Pergunta:** Você prefere reusar o mesmo token HMAC do admin para proteger essas rotas, ou vale introduzir um esquema com claims (ex: JWT) para diferenciar admin de cliente dentro da própria API?
**Impacto:** Define a tarefa T-01 de `api-backend/tasks.md`.

**Resposta (2026-10-27):** Reaproveitar o mecanismo de autenticação existente se atender aos requisitos de segurança — não criar login paralelo. Rotas administrativas exigem autenticação **e** autorização no backend, com sessões seguras (cookies HttpOnly/Secure/SameSite, expiração, revogação, CSRF, reautenticação em operações críticas). MFA (TOTP, compatível Google/Microsoft Authenticator) passa a ser **obrigatório para administradores**; passkeys como evolução futura recomendada. Ver detalhamento completo em `security-architecture-decisions.md`.

---

## Pergunta 2 — Acesso do cliente às rotas de API

**Contexto:** hoje o cliente final também chama `/api/clients`/`/api/instances` direto, sem token.
**Spec afetada:** `api-backend/requirements.md`
**Pergunta:** A correção de autenticação deve continuar permitindo o acesso do cliente por código único, só bloqueando listagem completa e escrita fora do próprio registro? Confirma esse recorte?
**Impacto:** Define o escopo exato de RF-04 em `api-backend/requirements.md`.

**Resposta (2026-10-27):** Confirmado. O cliente continua acessando só os próprios formulários/briefings via código/PIN. O PIN deve ser validado no servidor, criar sessão temporária restrita ao recurso autorizado (com expiração e proteção contra brute-force), gerado de forma criptograficamente segura e armazenado protegido. PIN nunca pode conceder acesso administrativo nem a dados de outros clientes.

---

## Pergunta 3 — Ordem: segurança antes ou depois do CRM?

**Contexto:** corrigir RN-API-01 e decidir `Lead`/`Projeto` são as 2 maiores pendências.
**Spec afetada:** `traceability/spec-impact-matrix.md`
**Pergunta:** Recomendação do Architect é corrigir a autenticação primeiro, para não repetir a falha em rotas novas de `Lead`/`Projeto`. Concorda com essa ordem?
**Impacto:** Define a sequência de implementação no `/reversa-forward`.

**Resposta (2026-10-27):** Confirmado, sem ressalvas. Corrigir e **validar com testes** a autenticação/autorização de todas as rotas existentes antes de iniciar CRM/Lead/Projeto. O usuário pede explicitamente uma auditoria técnica (stack atual, rotas públicas/privadas, vulnerabilidades por severidade, plano de correção) apresentada antes de qualquer implementação começar.

---

## Pergunta 4 — Implementar o funil de Lead/Deal?

**Contexto:** o funil de 6 estágios (Novo lead → ... → Fechado/Perdido) está no seu próprio roadmap como MVP, mas não existe no código.
**Spec afetada:** `crm-funil/decisions.md`, `crm-funil/requirements.md`
**Pergunta:** Confirma que quer implementar o funil completo (opção A em `decisions.md`), ou prefere a opção B (só visual, sem schema novo) ou C (híbrido, usando `Cliente` sem briefing como "lead")?
**Impacto:** Determina se `crm.html` é reescrito do zero ou só re-estilizado.

**Resposta (2026-10-27):** **Opção A** — funil completo com persistência real no banco. Seis estágios iniciais, preferencialmente configuráveis (não hardcoded). `Lead`, `Cliente` e `Projeto` ficam como entidades distintas porém relacionadas, permitindo converter um Lead em Cliente sem perder o histórico. Manter a interface visual aprovada sempre que compatível com essa estrutura.

---

## Pergunta 5 — Score de IA no card do lead

**Contexto:** aparece no mockup glassmorphic, mas não está no seu prompt original escrito para o Stitch.
**Spec afetada:** `crm-funil/decisions.md`
**Pergunta:** Mantém decorativo, implementa lógica real, ou remove?
**Impacto:** Define se há trabalho de IA/heurística adicional no funil.

**Resposta (2026-10-27):** **Remover por enquanto.** Diretriz geral do usuário é não ter elementos decorativos que simulem funcionalidade inexistente. Só reintroduzir se for implementada uma pontuação real, baseada em critérios definidos, verificáveis e explicáveis — integração de IA real fica para depois (ver Pergunta 14).

---

## Pergunta 6 — Origem do valor estimado do lead

**Contexto:** se o funil de Lead for implementado, `estimated_value`/`fonte_lead` precisam de uma origem.
**Spec afetada:** `crm-funil/decisions.md`, `data-dictionary.md`
**Pergunta:** Preenchimento manual pelo admin, ou integração futura com alguma ferramenta de CRM externa?
**Impacto:** Define se há integração externa nova a construir.

**Resposta (2026-10-27):** Preenchimento manual pelo admin por enquanto. Deixar a estrutura preparada para futura integração com propostas comerciais, contratos e eventualmente CRMs externos — sem construir essa integração agora, e sem contratar nada pago sem autorização explícita.

---

## Pergunta 7 — Prioridade de Projetos vs. Editor de modelo

**Contexto:** seu roadmap marca Projetos (telas 09/10) e Editor de modelo (tela 07) como MVP, Acompanhar projeto (tela 16) como "Depois".
**Spec afetada:** `telas-preview-v2/tasks.md`
**Pergunta:** Confirma essa ordem, ou mudou de prioridade desde que escreveu o roadmap?
**Impacto:** Define a sequência de implementação das 4 telas de preview.

**Resposta (2026-10-27):** Confirmado. Projetos e Editor de Modelo = MVP; Acompanhamento avançado de projeto = fase posterior. No MVP, `Projeto` já precisa ter cadastro, vínculo com `Cliente`, informações principais e estados operacionais básicos (não precisa do acompanhamento completo ainda).

---

## Pergunta 8 — Notificação de aprovação de entregável

**Contexto:** `client-tracking.html` tem botões "Aprovar"/"Pedir ajuste" para entregáveis de projeto.
**Spec afetada:** `telas-preview-v2/questions.md`
**Pergunta:** Isso deve gerar notificação para o estúdio (e-mail/WhatsApp), ou só atualizar o status no painel interno?
**Impacto:** Define se é preciso integração de notificação nova.

**Resposta (2026-10-27):** Por enquanto, só atualizar o status interno do entregável automaticamente + registrar histórico da operação (log de auditoria), com notificação interna quando necessário. Deixar a arquitetura preparada para notificação futura por e-mail/WhatsApp, mas sem criar essa dependência agora.

---

## Pergunta 9 — Rastreamento de horas do projeto

**Contexto:** o manual de implementação de referência tem campos de horas planejadas/consumidas por projeto.
**Spec afetada:** `telas-preview-v2/questions.md`, `data-dictionary.md`
**Pergunta:** Você quer rastrear horas de verdade, ou é só decoração visual do mockup?
**Impacto:** Define se `Projeto` precisa dos campos `allocated_hours`/`consumed_hours`.

**Resposta (2026-10-27):** Controle funcional de verdade, não decorativo. Implementar horas planejadas e horas efetivamente consumidas, com apontamento manual vinculado ao projeto, e permitir consultar a diferença entre planejado x realizado. `Projeto` precisa dos campos `allocated_hours`/`consumed_hours`.

---

## Pergunta 10 — Aba "Respostas recebidas" do Forms Hub

**Contexto:** MVP no seu roadmap, mas hoje a navegação é só por cliente/instância (dashboard/CRM), não por template.
**Spec afetada:** `forms-hub/questions.md`
**Pergunta:** Quer essa agregação por template, ou prefere manter a navegação atual por cliente?
**Impacto:** Define se é preciso nova função de agregação em `forms-hub.html`.

**Resposta (2026-10-27):** Manter a navegação atual por cliente **e** adicionar uma visão consolidada por template, sem duplicar dados. Precisa permitir identificar quais clientes responderam, quais formulários estão pendentes, e consultar as respostas recebidas por template.

---

## Pergunta 11 — "Gerar PIN avulso"

**Contexto:** botão do mockup que gera PIN independente de criar uma instância completa.
**Spec afetada:** `forms-hub/questions.md`
**Pergunta:** Você quer esse fluxo independente, ou PIN sempre deve nascer junto com um briefing (como hoje)?
**Impacto:** Define se é preciso uma rota de API nova.

**Resposta (2026-10-27):** Meio-termo: o PIN deve continuar vinculado a um briefing/formulário específico (nunca "avulso" sem finalidade), mas pode ser gerado ou regenerado independentemente da conclusão desse briefing — desde que já exista o registro vinculado. Não criar PIN sem recurso associado.

---

## Pergunta 12 — Validação de transição de status

**Contexto:** hoje qualquer chamada a `updateBriefingStatus` aceita qualquer string, sem checar se é uma transição válida (RN-CORE-04).
**Spec afetada:** `dashboard-core/tasks.md`, `state-machines.md`
**Pergunta:** Quer que eu implemente a validação formal (rejeitando transições fora do diagrama documentado), mesmo sendo um sistema de operador único hoje?
**Impacto:** Define a tarefa T-04 de `dashboard-core/tasks.md`.

**Resposta (2026-10-27):** Sim, implementar validação de transições no backend. Deve impedir mudanças inválidas, respeitar permissões do usuário e preservar integridade dos dados. Regras simples e documentadas, compatíveis com a operação atual de administrador único.

---

## Pergunta 13 — Código morto `generateAISynthesis`

**Contexto:** função importada em `dashboard.js`, nunca chamada.
**Spec afetada:** `ai-briefing-generator/questions.md`
**Pergunta:** Removo, ou você quer que eu conecte esse caminho alternativo de digest a algum fluxo real?
**Impacto:** Define a tarefa T-03 de `ai-briefing-generator/tasks.md`.

**Resposta (2026-10-27):** Remover, se de fato não houver dependências — mas **antes de remover, auditar todas as referências e impacto** para garantir que nenhuma funcionalidade existente seja comprometida.

---

## Pergunta 14 — Expectativa de IA real

**Contexto:** o gerador de templates por "IA" hoje é 100% regras/presets, sem LLM real, apesar do comentário no código mencionar Gemini/Claude/GPT-4.
**Spec afetada:** `ai-briefing-generator/requirements.md`
**Pergunta:** Você espera, em algum momento, uma integração real com LLM aqui, ou o comportamento atual atende bem?
**Impacto:** Define se vale abrir uma unit nova de integração de IA no `/reversa-forward`.

**Resposta (2026-10-27):** Sim, quer a plataforma preparada para integração futura com LLM real. Por ora, manter o comportamento atual baseado em regras/presets (desde que funcione corretamente), sem contratar APIs pagas agora. Requisito importante: **não apresentar as automações por regras como se fossem IA generativa** — rótulos/UI devem ser honestos sobre o que é hoje.
