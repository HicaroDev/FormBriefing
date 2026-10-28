# dashboard-core, Tarefas de Implementação

## Pré-requisitos
- [ ] `auth` (requireAuth) disponível
- [ ] `api-backend` disponível para sincronização remota
- [ ] Schema de `BriefingTemplate` (seções/campos) estável antes de implementar `generateProductionDigest`

## Tarefas

- [ ] T-01, Implementar `generateProductionDigest` com resolução dinâmica de campos por tipo
  - Origem no legado: `store.js:994-1108`
  - Critério de pronto: funciona com qualquer template novo sem alterar a função; preserva marcação manual de itens de vertical
  - Confiança: 🟢

- [ ] T-02, Implementar `getTemplates()` com merge SEED-sobre-cache
  - Origem no legado: `store.js:832-848`
  - Critério de pronto: template de código sempre vence por `id`; templates só-cache (IA) preservados
  - Confiança: 🟢

- [ ] T-03, Implementar sincronização por polling (3.5s local, 10s remoto) com fallback silencioso
  - Origem no legado: `dashboard.js` (inicialização)
  - Critério de pronto: falha de rede não gera erro visível, dado local permanece utilizável
  - Confiança: 🟢

- [ ] T-04, Decidir e implementar validação de transição de status (RN-CORE-04)
  - Origem no legado: ausente — lacuna identificada em `data-dictionary.md`/`state-machines.md`
  - Critério de pronto: `updateBriefingStatus` rejeita transições fora do diagrama de `state-machines.md` §1
  - Confiança: 🔴

- [ ] T-05, Substituir `generateBriefingId` por contador persistente (se exclusão de briefing for fluxo real)
  - Origem no legado: `store.js:747` (RN-CORE-05)
  - Critério de pronto: IDs nunca colidem mesmo após exclusão de instâncias
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Aprovar briefing muda status e atualiza digest (happy path RF-02)
- [ ] TT-02, Checklist de kickoff preserva item marcado manualmente entre sínteses
- [ ] TT-03, Template alterado no código sobrescreve cache do navegador do admin
- [ ] TT-04, Falha de rede simulada durante polling não quebra a tabela/inspetor

## Tarefas de Migração de Dados (se aplicável)
- [ ] TM-01, Migrar `BriefingTemplate` e `RespostaDigest` de `localStorage` para Postgres (ver ADR-001, pré-requisito para T-04 e para qualquer agregação cross-dispositivo)

## Ordem Sugerida
1. T-02 e T-03 primeiro (infraestrutura de dados).
2. T-01 depende de T-02 (templates precisam estar corretos antes da síntese).
3. T-04 é independente, mas de alto valor — priorizar junto com a correção de RN-API-01 (módulo `api-backend`).
4. T-05 só se exclusão de briefing for confirmada como fluxo real pelo usuário.

## Lacunas Pendentes (🔴)
- Validação formal de máquina de estados de `BriefingInstance.status` (RN-CORE-04).
- Observabilidade (logs/métricas) — nenhuma existe hoje, tratar como item de backlog separado.
