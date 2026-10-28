# dashboard-core

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Painel operacional do estúdio: métricas, tabela de clientes/briefings, inspetor de detalhe, geração de resumo executivo (digest), ações de aprovação/ajuste/envio, sincronização com o Neon via polling.

## Responsabilidades
- Renderizar métricas, distribuição e atividade recente a partir de `Cliente`/`BriefingInstance`.
- Filtrar/buscar a tabela de briefings e clientes.
- Sintetizar o Resumo Executivo (digest) de forma determinística a cada seleção de briefing.
- Orquestrar as ações do diretor (aprovar, pedir ajuste, exportar, disparar briefing).
- Manter os 4 dados do SEED.md (`Cliente`, `BriefingTemplate`, `BriefingInstance`, `RespostaDigest`) sincronizados entre `localStorage` e Neon (parcialmente — ver Lacunas).

## Regras de Negócio
- RN-CORE-01: `getTemplates()` sempre funde SEED_TEMPLATES do código por cima do cache local. 🟢
- RN-CORE-02: ao marcar `submetido`/`aprovado_kickoff`, o digest é automaticamente (re)gerado. 🟢
- RN-CORE-03: os 3 primeiros itens do checklist de kickoff são sempre recalculados; itens de vertical (4º+) preservam marcação manual por casamento de texto. 🟢
- RN-CORE-04: sem validação de transição de status — qualquer string é aceita. 🔴 (requer validação humana)
- RN-CORE-05: `generateBriefingId` deriva a sequência do tamanho atual da lista, não de contador persistente — risco de colisão se houver exclusão. 🟡
- RN-CORE-06: toda sincronização remota é fire-and-forget, falha silenciosa nunca quebra a UI. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Selecionar um briefing resintetiza o digest a partir das respostas atuais | Must | `selectBrief` chama `generateProductionDigest` sempre, nunca lê um digest congelado |
| RF-02 | Aprovar um briefing muda status para `aprovado_kickoff` e gera/atualiza o digest | Must | `approveBriefing` seguido de leitura confirma status e digest atualizados |
| RF-03 | Templates do código nunca ficam desatualizados por cache do navegador | Must | `getTemplates()` sobrescreve por `id` com SEED_TEMPLATES |
| RF-04 | Filtro e busca da tabela combinam status + texto livre | Should | `renderTable` aplica os dois critérios simultaneamente |
| RF-05 | Checklist de kickoff preserva marcação manual em re-síntese | Should | Item marcado manualmente permanece marcado após nova síntese, exceto os 3 primeiros |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Disponibilidade | Sincronização remota nunca bloqueia a UI em caso de falha | `store.js` (`apiCall`, fire-and-forget) | 🟢 |
| Escalabilidade | Sincronização por polling (3.5s local, 10s remoto), não push/websocket | `dashboard.js` (inicialização) | 🟡 |
| Performance | Resíntese de digest a cada seleção de briefing (não cacheado) | `dashboard.js` (`selectBrief`) | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um briefing com status submetido
Quando o diretor clica em Aprovar
Então o status muda para aprovado_kickoff e o digest é gerado/atualizado

Dado um template alterado no código (SEED_TEMPLATES)
Quando o navegador do admin carrega com cache antigo
Então getTemplates() retorna a versão nova do código, não a do cache

Dado um checklist de kickoff com o 4º item marcado manualmente
Quando o digest é resintetizado após nova resposta do cliente
Então o 4º item permanece marcado, e os 3 primeiros são recalculados do zero
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Síntese do digest (`generateProductionDigest`) | Must | Algoritmo mais complexo e mais usado do sistema |
| `getTemplates()` sempre atualizado | Must | Garante consistência entre deploys e cache de clientes |
| Validação de transição de status (RN-CORE-04) | Should | Ausente hoje, mas de risco moderado dado o uso de um único operador |
| Contador persistente para `generateBriefingId` (RN-CORE-05) | Could | Só relevante se exclusão de briefing for um fluxo real |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `dashboard.js` | `selectBrief`, `renderTable`, `checkHashRoute`, `approveBriefing`, `openAdjustmentsModal` | 🟢 |
| `store.js` | `generateClientCode`, `generateBriefingId`, `getTemplates`, `generateProductionDigest` | 🟢 |
