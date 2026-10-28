# Spec Impact Matrix — FormBriefing / Studio Suite 2.0

> Qual componente impacta qual. Usar na Fase 4 (Writer) para sequenciar as specs e avaliar risco de regressão.

| Componente | Impacta | Observação |
|---|---|---|
| `store.js` | `dashboard.js`, `crm.html`, `forms-hub.html`, `ai-briefing-generator.js`, `form-engine.js` | Módulo mais central do front-end — qualquer alteração de schema de `Cliente`/`BriefingInstance`/`BriefingTemplate`/`RespostaDigest` se propaga para praticamente toda a aplicação. |
| `api/_db.js` | `api/clients.js`, `api/instances.js`, `api/auth.js`, `api/migrate.js` | Ponto único de conexão com o banco — qualquer mudança de driver/connection string afeta todas as rotas. |
| `api/clients.js` + `api/instances.js` (RN-API-01) | Toda a segurança do sistema | Adicionar autenticação no servidor aqui é pré-requisito lógico antes de expor qualquer nova funcionalidade de API (ex: endpoints de `Lead`/`Projeto`), para não repetir a mesma falha em superfície nova. |
| `BriefingInstance.status` (máquina de estados, RN-CORE-04) | `crm.html` (Kanban), `dashboard.js`, `generateProductionDigest` | Qualquer novo estágio de funil (`Lead`) que precise coexistir com este status deve decidir a relação entre as duas máquinas de estado (ver `state-machines.md` §1 vs §2) antes de implementar. |
| Decisão `Lead`/`Projeto` (ADR-002) | `crm.html`, `forms-hub.html` (aba "Respostas recebidas"), `form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html`, `api/migrate.js` (novas tabelas), `data-dictionary.md` | É a decisão de maior raio de impacto de todo o sistema — afeta 6 arquivos de UI e exige nova(s) tabela(s) de banco. Deve ser resolvida **antes** de qualquer spec de Writer para esses 6 arquivos. |
| `BriefingTemplate` (só localStorage) | `forms-hub.html`, `ai-briefing-generator.js`, `generateProductionDigest`, "Respostas recebidas" (Tela 06 do roadmap) | Migrar para Postgres (seguindo o padrão de ADR-001) é pré-requisito para qualquer feature de "templates compartilhados entre dispositivos" ou agregação de métricas por template (taxa de conclusão, tempo médio — já identificadas como lacuna em `forms-hub`). |
| `ai-briefing-generator.js` (`generateAISynthesis`, código morto) | Nenhum componente ativo hoje | Decisão simples e isolada: remover ou conectar — não bloqueia nenhuma outra spec. |
| `modelo_site/prompts_stitch_studio_suite_2.1.md` (roadmap do usuário) | Priorização de toda a Fase 4 (Writer) | Deve ser a referência primária de ordem de implementação — já tem MVP/Depois definido por tela, evitando redescobrir prioridades do zero. |
