# Máquinas de Estado — FormBriefing / Studio Suite 2.0

> Gerado pelo Detective. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. `BriefingInstance.status` (entidade central do sistema)

🟢 Valores confirmados em `store.js`/`dashboard.js`/`api/migrate.js`: `rascunho`, `enviado`, `em_preenchimento`, `submetido`, `em_revisao`, `ajustes_solicitados`, `aprovado_kickoff`.

```mermaid
stateDiagram-v2
    [*] --> rascunho
    rascunho --> enviado: admin envia
    enviado --> em_preenchimento: cliente abre o link
    em_preenchimento --> submetido: cliente envia (com confirmação de nome/e-mail)
    submetido --> em_revisao: admin abre para revisar
    em_revisao --> ajustes_solicitados: admin pede ajuste (feedback_ajustes)
    em_revisao --> aprovado_kickoff: admin aprova
    ajustes_solicitados --> em_preenchimento: cliente reabre (confirmação de e-mail, commit 0a36aaa)
    aprovado_kickoff --> em_preenchimento: reabertura excepcional (antes da trava do commit 6068cd2)
    aprovado_kickoff --> [*]: trava de edição (commit 6068cd2, pós-kickoff)
```

🔴 **LACUNA confirmada (RN-CORE-04):** não existe nenhuma função de validação de transição no código — qualquer valor de `status` pode ser escrito diretamente via `PATCH /api/instances` sem checagem contra o diagrama acima. O diagrama representa o fluxo **pretendido** pelas regras de negócio observadas no histórico Git (ex: trava pós-`aprovado_kickoff`), não uma validação real.

🟡 **Reabertura excepcional:** o commit `0a36aaa` ("Permite reabrir briefing já enviado para edição, com confirmação de e-mail") sugere que existe um caminho de volta de qualquer status para `em_preenchimento`, mediado por confirmação manual de e-mail no client-side — não uma regra de máquina de estados formal, mais uma função de UI isolada.

---

## 2. Funil de vendas (Lead) — 🔴 não implementado, desenhado no roadmap

Conforme `prompts_stitch_studio_suite_2.1.md` (tela 03), o usuário especificou 6 estágios — distintos da máquina de estados acima:

```mermaid
stateDiagram-v2
    [*] --> novo_lead
    novo_lead --> briefing_enviado: enviar briefing (gera PIN)
    briefing_enviado --> briefing_recebido: cliente responde 100%
    briefing_recebido --> proposta_enviada: criar proposta
    proposta_enviada --> fechado: cliente aceita
    proposta_enviada --> perdido: cliente recusa
    fechado --> [*]: "Transformar em projeto"
```

Nenhuma destas transições tem código correspondente hoje — toda a máquina é 🔴 lacuna, mas com especificação de produto já definida pelo usuário.

---

## 3. PIN de acesso do cliente — 🟢 confirmado, mais simples que o mockup descreve

O mockup descreve um PIN numérico de 6 dígitos com bloqueio após 3 tentativas e expiração por tempo. O código real usa `codigo_unico` (`CLI-XXXX`, alfanumérico, sem expiração nem contagem de tentativas):

```mermaid
stateDiagram-v2
    [*] --> aguardando_codigo
    aguardando_codigo --> validando: usuário digita código
    validando --> acesso_liberado: código resolve para 1 cliente/instância
    validando --> acesso_negado: código não resolve (NUNCA cai no primeiro cliente disponível — RN-INTAKE-01)
    acesso_negado --> aguardando_codigo
```

🔴 **LACUNA:** não há bloqueio por tentativas nem expiração do código no código real — ambos existem só no mockup/manual de implementação.
