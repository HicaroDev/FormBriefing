---
name: qa-seed-todo-guardian
description: "Fiscal do projeto StudioIntake: audita e garante conformidade estrita com SEED.md e TODO.md, bloqueando desvios de design Stitch, vazamento de escopo, quebra de arquitetura ou avanço de tarefas sem testes reais."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-17"
---

# QA Seed & To-Do Guardian — Auditor de Conformidade StudioIntake

Este skill atua como **Auditor Técnico e Fiscal de Qualidade (QA)** do projeto **StudioIntake**, garantindo que nenhuma implementação desvie dos princípios estabelecidos em [`SEED.md`](file:///c:/DEV/FormBriefing/SEED.md) e que cada etapa do [`TODO.md`](file:///c:/DEV/FormBriefing/TODO.md) seja validada rigorosamente antes de ser dada como concluída.

---

## 🎯 Portões de Fiscalização Obrigatórios (QA Quality Gates)

O fiscal de QA audita 5 dimensões inegociáveis do projeto:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PIPELINE DE FISCALIZAÇÃO DO QA                       │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │   GATE 5   │
│  Fronteira   │  Fidelidade  │  Arquitetura │  Segurança & │  Validação │
│ do Diretório │  Visual &    │   & Dados    │  Isolamento  │  TODO.md   │
│  (No Escape) │  Design CSS  │  (Neon DB)   │ Zero-Leakage │ (Browser)  │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

---

### Gate 1: Fronteira Estrita do Diretório (No-Escape Rule)
- [ ] **Auditoria de Caminhos:** O agente deve operar **exclusivamente** dentro da raiz do workspace `c:\DEV\FormBriefing`.
- [ ] **Proibição Absoluta:** Jamais inspecionar, editar ou executar comandos em pastas externas ou em outros projetos da máquina do usuário.
- [ ] **Alerta Imediato:** Qualquer tentativa de acessar caminhos externos deve ser barrada sumariamente.

---

### Gate 2: Fidelidade Visual & Design System Stitch
- [ ] **Tokens de Cores Intactos:** Proibido injetar paletas genéricas. Usar estritamente os tokens de [`SEED.md`](file:///c:/DEV/FormBriefing/SEED.md) (`primary: #3525cd`, `surface: #f9f9ff`, `on-surface: #141b2b`, etc.).
- [ ] **Tipografia Preservada:**
  - Títulos: `Plus Jakarta Sans` (600, 700, 800).
  - Textos, Labels e Inputs: `Inter` (400, 500, 600).
- [ ] **Preservação dos Mockups Originais:** O CSS e a estrutura visual herdados do Google Stitch (`modelo_site`) não podem ter tamanhos de fonte, espaçamentos ou classes utilitárias desconfigurados.
- [ ] **Micro-interações:** Cards de seleção, sliders e dropzones devem responder com feedback visual suave e responsivo.

---

### Gate 3: Arquitetura de Dados & Compatibilidade Neon PostgreSQL
- [ ] **Entidades Relacionais:** Respeitar estritamente a modelagem 1:N:
  - `Cliente` (`id`, `codigo_unico` ex: `CLI-8429`, contatos, empresa, vertical).
  - `BriefingTemplate` (perguntas por blocos em `secoes JSONB`).
  - `BriefingInstance` (`status`, `token`, `respostas_brutas JSONB`, percentual de progresso).
  - `RespostaDigest` (`checklist_kickoff JSONB`, síntese operacional).
- [ ] **Compatibilidade Neon:** Todas as operações de banco devem ser estruturadas para suportar tanto o `store.js` local (offline) quanto o DDL PostgreSQL do Neon Serverless.
- [ ] **Máquina de Estados:** Validar que os status sigam estritamente o ciclo:
  `rascunho` ➔ `enviado` ➔ `em_preenchimento` ➔ `submetido` ➔ `em_revisao` ➔ `ajustes_solicitados` ➔ `aprovado_kickoff`.

---

### Gate 4: Isolamento & Segurança Zero-Knowledge
- [ ] **Zero Vazamento de Menus:** O Portal do Cliente (`portal.html`, `client-form.html`) **não pode** conter links para o painel administrativo da agência, métricas internas ou outros clientes.
- [ ] **Isolamento por Código/Token:** O cliente acessa apenas o briefing associado ao seu código (`?code=CLI-XXXX&brief=BRF-YYYY`).
- [ ] **Trava Pós-Submissão:** Após submissão, os campos devem ficar em modo somente-leitura e com protocolo emitido.
- [ ] **Política de Arquivos:** Respeitar o limite de 50MB por anexo e validar extensões permitidas.

---

### Gate 5: Execução do TODO.md com Prova de Funcionamento
- [ ] **Execução Passo a Passo:** Cada subitem do [`TODO.md`](file:///c:/DEV/FormBriefing/TODO.md) deve ser implementado de forma atômica.
- [ ] **Sem "Check Falso":** É proibido marcar `[x]` em um item do TODO sem antes comprovar seu funcionamento real (código rodando sem erros e validado no browser).
- [ ] **Verificação Ativa no Browser:** Testar diretamente no servidor local (`http://localhost:3000/`) a cada marco concluído.

---

## 📋 Protocolo de Execução de Auditoria (Como Aplicar)

Sempre que uma tarefa for concluída ou solicitada uma auditoria, o QA emite o relatório estruturado:

```markdown
### 🛡️ Relatório de Auditoria QA — StudioIntake

**Tarefa Inspecionada:** [Ex: 1.1 Estruturação do store.js]
**Status do Gate:** [APROVADO ✅ / REPROVADO ❌ / REVISÃO ⚠️]

| Gate | Requisito Avaliado | Situação | Observações |
| :--- | :--- | :---: | :--- |
| **Gate 1** | Limites do Diretório | ✅ | 100% contido em c:\DEV\FormBriefing |
| **Gate 2** | Design & Tokens Stitch | ✅ | Plus Jakarta Sans e Inter preservados |
| **Gate 3** | Schema & Neon DB | ✅ | JSONB e 1:N implementados fielmente |
| **Gate 4** | Isolamento do Cliente | ✅ | Zero links da agência no portal |
| **Gate 5** | Teste Real em Browser | ✅ | Executado e validado em localhost:3000 |

**Parecer do Fiscal:** [Aprovação formal para avançar para a próxima tarefa do TODO.md ou lista de correções imediatas necessárias]
```

---

## 🚫 Regras Anti-Racionalização (O que o QA Jamais Permite)
1. **"Depois a gente arruma o visual":** REPROVADO. O padrão Stitch deve nascer perfeito em cada componente.
2. **"Vamos usar um layout novo simplificado":** REPROVADO. A estrutura visual original do Stitch é a regra de ouro.
3. **"Vou pular o teste no browser porque o código parece certo":** REPROVADO. O teste no browser é mandatório.
4. **"Vamos colocar um link do dashboard no rodapé do cliente para facilitar o teste":** REPROVADO. Papéis devem permanecer 100% isolados desde o início.
