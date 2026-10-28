# Domínio de Negócio — FormBriefing / Studio Suite 2.0

> Gerado pelo Detective (fase de interpretação), a partir do código (9 módulos já escavados), do histórico Git (42 commits, autor único `HicaroDev`) e dos documentos de produto escritos pelo próprio usuário em `modelo_site/`. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. Glossário de domínio

| Termo | Significado | Confiança |
|---|---|---|
| **Estúdio** | O negócio do usuário (Hícaro Duarte) — agência/estúdio de design e branding para clientes de pilates, fisioterapia, bem-estar e eventos. Único "tenant" do sistema — não é multi-tenant. | 🟢 |
| **Cliente** | Empresa/responsável já cadastrado no estúdio, com código único `CLI-XXXX`. Não é um "lead" — já passou por essa etapa informalmente (cadastro manual). | 🟢 |
| **Briefing / BriefingInstance** | Uma rodada de levantamento de informações enviada a um `Cliente`, baseada em um `BriefingTemplate`, com progresso e respostas próprias. Um cliente pode ter várias instâncias (ex: Carola teve 3 unificadas em 1 formulário de 3 partes — commit `275cee7`). | 🟢 |
| **Template / BriefingTemplate** | Modelo reutilizável de formulário (seções + campos), por vertical de negócio. Vive só em `localStorage` (seed + gerados por IA), sem tabela própria. | 🟢 |
| **Vertical** | Segmento de mercado do cliente final do estúdio: `pilates`, `physio`, `fisio_pilates`, `events`, `universal`, e novas verticais livres via gerador de IA (ex: `tattoo`, `derma`, `gastronomy`, ou qualquer slug digitado). | 🟢 |
| **PIN / código único** | Mecanismo de acesso do cliente ao seu próprio briefing — `codigo_unico` (`CLI-XXXX`) do Cliente combinado com `link_token`/`link_seguro` da instância. Não é um PIN numérico puro como os mockups descrevem (os mockups descrevem "842 910"; o código real é alfanumérico `CLI-XXXX`). | 🟢 |
| **RespostaDigest / Resumo Executivo** | Síntese pós-preenchimento de um briefing, com objetivo, pilares de design, entregáveis e checklist de kickoff — gerada automaticamente por `generateProductionDigest()` (não pela IA simulada). Só em `localStorage`. | 🟢 |
| **Lead** | 🔴 Não existe no código hoje. Conceito de pré-cliente, antes do cadastro formal — confirmado como item do roadmap MVP do próprio usuário (`prompts_stitch_studio_suite_2.1.md`), não implementado. |
| **Projeto** | 🔴 Não existe no código hoje. Fase pós-aprovação do kickoff, com entregáveis versionados e horas consumidas — também roadmap MVP do usuário, não implementado; 4 telas de preview (`form-builder.html`, `projects.html`, `project-detail.html`, `client-tracking.html`) foram explicitamente deixadas como preview no commit de redesign (`93f74ca`) "até decisão sobre novas entidades de banco". |

---

## 2. Regras de negócio centrais (consolidado dos 9 módulos)

Numeração e detalhe completo em `_reversa_sdd/code-analysis.md`, por módulo. Resumo das mais críticas:

| ID | Regra | Severidade | Módulo |
|---|---|---|---|
| RN-API-01 | Nenhuma rota `/api/clients` ou `/api/instances` verifica autenticação no servidor — só existe trava no front-end | 🔴 Alta | api-backend |
| RN-INTAKE-01 | Zero-leakage: se o código/token da URL não resolve, nunca cai no "primeiro cliente disponível" — confirmado também pelo histórico Git (`7d9d2e0`, `575e27d`: "vazamento de isolamento" foi um bug real em produção, corrigido em pelo menos 2 rodadas) | 🟢 Crítica, já blindada | client-intake |
| RN-CORE-04 | Máquina de estados de `BriefingInstance.status` não tem validação formal de transição no código — qualquer status pode ir para qualquer status | 🟡 Média | dashboard-core |
| — | `RespostaDigest` só existe em `localStorage`, sem tabela/endpoint — perdido ao limpar cache, não sincroniza entre dispositivos (histórico Git confirma isso já causou bugs reais: `bf43452`, `aae0a01`, `fe8884f`) | 🔴 Alta | dashboard-core |
| RN-AI-01 | O gerador de "IA" é 100% baseado em regras/presets estáticos, sem chamada real a um LLM | 🟡 Média (expectativa de produto) | ai-briefing-generator |
| — | O funil de vendas (Lead) e a entidade Projeto são requisitos MVP explícitos do próprio usuário, documentados em `modelo_site/`, nunca implementados — e o commit de redesign mais recente confirma que isso foi uma decisão consciente de adiamento, não um esquecimento | 🟡 Decisão de produto pendente | crm-funil / design-reference-stitch |

## 3. Arqueologia Git — linha do tempo de decisões

Histórico completo: 42 commits, autor único (`HicaroDev`), de `2026-10-18` a `2026-10-26` (8 dias de desenvolvimento intenso). 🟢

1. **`9c0bf2a` — Commit inicial do StudioIntake.**
2. **`7dc7d4a` — Briefings trilíngues (PT/IT/EN) para clientes reais "Kalea Pilates e Fisio".** 🟢 confirma que o sistema já tem clientes reais usando-o, não é só protótipo.
3. **`01db7eb` — Conecta banco Postgres real (Neon).** Marco arquitetural: antes disso tudo era `localStorage`. Seguido por uma sequência de commits de estabilização (`1d1bf83`, `44385b1`, `5005daa` — este último é a origem exata do `sanitize()` de BOM em `_db.js`, confirmando que foi um bug real ao colar a connection string no Windows).
4. **`442dd05` — Corrige fluxo de PIN para buscar no banco remoto** (antes buscava só local) → **`4c6bf57` — Limpa tela de PIN de dígitos demo fixos.**
5. **`275cee7` — Unifica os 3 briefings da Carola em um único formulário de 3 partes.** 🟢 outro cliente real nomeado, evidência de uso em produção.
6. **Trio de correções de segurança de isolamento:** `7d9d2e0` → `575e27d` → `f8cb3aa` (nessa ordem: "código inválido cai no cliente errado", vazamento residual, botão de envio falso). 🟢 confirma que a regra RN-INTAKE-01 nasceu de **incidentes reais em produção**, não de um exercício teórico — justifica por que ela é tratada como a mais crítica do sistema.
7. **`255f922` — Confirmação de nome/e-mail antes do envio final.** Proteção contra erro humano, adicionada depois dos incidentes de vazamento.
8. **Trio do Resumo Executivo:** `aae0a01` → `bf43452` → `fe8884f` (resumo fictício para templates novos → sempre atualizado, não mais em cache antigo → preservação indevida de status nos itens automáticos do checklist). 🟢 confirma que a limitação de `RespostaDigest` em `localStorage` já gerou pelo menos 3 rodadas de bugs reais.
9. **Trio de trava de edição pós-aprovação:** `0a36aaa` → `6068cd2` → `f6f1ad4` (permite reabrir com confirmação de e-mail → trava após aprovação do kickoff → corrige formulário não refletindo aprovação feita em outro dispositivo). 🟢 evidência de uma regra de negócio implícita real: **depois de `aprovado_kickoff`, o formulário não deve mais ser editável sem uma reabertura explícita e confirmada por e-mail.**
10. **`783d7da` — Ativa login real do Dashboard da agência.** O login era mockado antes dessa data.
11. **Onda de limpeza de dados fictícios do Dashboard:** `26ce1ff` → `06bf3bf` → `0c48048` → `6315253` → `f6bd50d`/`7feba60` → `20ff68e`. 🟢 **padrão recorrente identificado**: pelo menos 6 rodadas distintas de "descobrir e remover dado fake/decorativo deixado por uma versão anterior" ao longo do histórico — ver ADR-002 abaixo.
12. **`93f74ca` (HEAD) — Redesign Studio Suite 2.0.** A mensagem do próprio commit já diz, nas palavras do autor: *"Inclui 4 telas de pré-visualização (Editor de Modelo, Gestão de Projetos, Evolução, Acompanhamento do Cliente) marcadas como preview até decisão sobre novas entidades de banco. Arquiva o pacote de design Stitch em `modelo_site/`."* 🟢 **confirma, na origem, que o gap Lead/Projeto já era conhecido e foi uma decisão consciente de adiar — exatamente o achado central deste Reversa.**

## 4. Padrão recorrente (para ADR)

Ao longo de 8 dias e 42 commits, o padrão "construir a tela a partir do mockup Stitch com dados de exemplo → descobrir em produção que o dado é fake/decorativo → trocar por dado real" se repete pelo menos 6 vezes (login, avatar do cliente, PIN do cabeçalho, métricas do dashboard, páginas mockup órfãs, botões decorativos). Isso é consistente com o próprio fluxo de trabalho do projeto: gerar a tela no Stitch primeiro, depois "aterrissar" caso a caso. Relevante para a Fase 4 (Writer): as specs devem deixar explícito, desde o início, o que é dado real vs. decorativo em cada tela nova, para não repetir o padrão uma sétima vez com o CRM/Forms Hub glassmorphic.
