# crm-funil, Tarefas de Implementação

## Pré-requisitos
- [ ] `dashboard-core` disponível (`BriefingInstance`, `Cliente`)
- [ ] Decisão do usuário sobre `Lead`/`Deal` e `Projeto` registrada em `decisions.md`/`questions.md`

## Tarefas (estado atual, sem mudança de escopo)

- [ ] T-01, Reimplementar `columnForStatus` com o mesmo mapeamento many-to-one
  - Origem no legado: `crm.html`
  - Critério de pronto: todos os 7 status de `BriefingInstance` caem em exatamente 1 das 4 colunas
  - Confiança: 🟢

- [ ] T-02, Reimplementar drag-and-drop com persistência local+remota
  - Origem no legado: `crm.html` (listeners de drag-and-drop)
  - Critério de pronto: soltar um card em outra coluna muda o status real e persiste
  - Confiança: 🟢

## Tarefas condicionais (dependem da decisão de `Lead`/`Deal`, ver `questions.md`)

- [ ] TC-01, Se a decisão for implementar o funil de 6 estágios do roadmap do usuário: criar schema de `Lead` (ver `data-dictionary.md`), nova(s) rota(s) de API com autenticação (resolver RN-API-01 primeiro), e refatorar `crm.html` para o novo modelo
  - Confiança: 🔴 (depende de decisão humana)

- [ ] TC-02, Se a decisão for manter o modelo atual com só o visual glassmorphic portado: aplicar tokens de design (`guia_de_estilo_tokens_studio_suite_2.0.md`) sobre as 4 colunas atuais, sem alterar schema
  - Confiança: 🟡

## Tarefas de Teste

- [ ] TT-01, Drag-and-drop entre todas as combinações de coluna persiste o status correto
- [ ] TT-02, Reload da página após drag-and-drop mantém o novo status (via sync remoto)

## Ordem Sugerida
1. T-01/T-02 primeiro — reimplementação do que já existe, sem risco.
2. **Não iniciar TC-01/TC-02 antes da decisão do usuário estar registrada** — este é o ponto de maior raio de impacto do sistema (ver `traceability/spec-impact-matrix.md`).

## Lacunas Pendentes (🔴)
Ver `decisions.md` e `questions.md` desta unit.
