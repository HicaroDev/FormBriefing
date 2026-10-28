# StudioIntake — Super Google Forms para Agências & Estúdios Criativos

> **Plataforma Boutique de Briefings Inteligentes, CRM de Clientes e Gestão de Kickoff de Produção**  
> Desenvolvido a partir das especificações e mockups oficiais do Google Stitch, com preservação estrita de tokens visuais, tipografia e design de alto padrão.

---

## 🎯 Visão Geral do Sistema

O **StudioIntake** resolve o gargalo crítico entre o fechamento comercial de um cliente e o início efetivo da sprint de design e tecnologia. Substitui formulários genéricos por uma experiência imersiva e criptografada com código único (`CLI-XXXX`), isolamento rigoroso de papéis (Zero-Leakage), salvamento automático em tempo real e síntese executiva para a diretoria criativa.

### 🌟 Destaques & Capacidades Principais

1. **Gestão Centralizada de Clientes (CRM Integrado)**:
   - Identificadores únicos elegantes no formato `CLI-XXXX` (ex: `CLI-8429`, `CLI-1878`).
   - Relacionamento 1:N com briefings faseados por etapa de projeto (*Diagnóstico*, *Identidade*, *Conteúdo*, *Kickoff*).
   - Gerador de link direto com disparo instantâneo formatado para WhatsApp.

2. **Portal do Cliente com Isolamento Rigoroso de Papéis (Zero-Leakage)**:
   - Acesso direto via URL assinada (`/portal.html?code=CLI-XXXX&brief=BRF-YYYY`) ou teclado PIN de 4 dígitos.
   - Remoção de todos os menus de navegação internos da agência.
   - Indicador de sessão segura verificada com badge institucional do cliente.

3. **Motor Dinâmico de Perguntas Parametrizáveis (`form-engine.js`)**:
   - Renderização orientada a esquemas JSON sem HTML manual:
     - 📝 Campos Dissertativos & Textareas estruturadas.
     - 🎴 Cartões Visuais de Seleção Única (ex: atmosferas *Serene & Arquitetônico*, *Earthy & Orgânico*).
     - 🏷️ Pílulas de Múltipla Escolha com limites configuráveis.
     - 🎚️ Sliders de Gradiente Contínuo com legendas nos extremos (ex: *Minimalista vs. Expressivo*).
     - 📁 Dropzone de Upload de Arquivos com validação de extensão e limite em MB.

4. **Persistência Híbrida & Arquitetura Neon Serverless Postgres (`store.js`)**:
   - Funciona 100% offline via LocalStorage no navegador.
   - Esquema DDL completo pronto para implantação no **Neon Postgres Serverless** com pooling de conexões (`@neondatabase/serverless`).

5. **Central de Triagem & Inspetor Operacional (Agency Dashboard)**:
   - Roster de briefings com filtros por status (`Submetidos`, `Em Revisão`, `Kickoff Pronto`, `Carteira de Clientes`).
   - Inspetor dinâmico com alternador entre:
     - ⚡ **Resumo Executivo (Digest)**: Objetivos centrais, orçamento, pilares de design e checklist de kickoff com checkboxes interativos.
     - 🔬 **Raio-X de Respostas**: Visualização detalhada das respostas do cliente, cartões visuais, sliders e anexos com botão de expansão em modal completo.

6. **Ciclo de Ajustes & Kickoff do Diretor de Criação**:
   - Modal customizado **"Solicitar Ajustes"**: permite selecionar motivos frequentes ou digitar orientações específicas. Destrava o formulário do cliente e insere alerta contextual no portal.
   - Ação **"Aprovar Briefing & Gerar Kickoff"**: trava o formulário como aprovado, gera protocolo oficial e checklist de produção.
   - **Exportação Multiformato**: Cópia do Resumo Executivo em Markdown pronto para Notion, Linear ou Trello, além de suporte a impressão/PDF.

7. **Módulo de IA para Geração Parametrizada de Templates (`ai-briefing-generator.js`)**:
   - Botão **"Gerar com IA"** no cabeçalho do Dashboard.
   - Presets calibrados: *Studio de Tatuagem Fine-Line*, *Clínica Dermatológica*, *Restaurante Autoral*.
   - Síntese de novas verticais a partir de qualquer prompt livre.

---

## 🛠️ Tecnologias & Estrutura de Arquivos

```
c:/DEV/FormBriefing/
├── index.html                   # Dashboard Operacional da Agência (Visão Geral + CRM)
├── client-form.html             # Interface do Formulário Dinâmico do Cliente
├── portal.html                  # Gateway Seguro de Acesso do Cliente (Link direto ou PIN)
├── dashboard.js                 # Controlador do Dashboard, Triage, CRM e Modais
├── form-engine.js               # Motor Paramétrico de Renderização de Perguntas & Autosave
├── portal-auth.js               # Autenticação e Resolução de Parâmetros de URL do Portal
├── store.js                     # Camada de Dados Híbrida (LocalStorage + Adaptador Neon)
├── ai-briefing-generator.js     # Módulo de IA para Geração de Templates e Síntese
├── SEED.md                      # Especificação Canônica de Dados e Arquitetura Neon
├── TODO.md                      # Checklist de Execução Faseada (100% Concluído)
└── package.json                 # Configurações do Vite e scripts de desenvolvimento
```

---

## 🚀 Como Executar Localmente

1. **Instalar dependências (se necessário)**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   O servidor estará ativo em: `http://localhost:3000/`.

3. **Rotas Principais**:
   - **Painel de Controle da Agência:** `http://localhost:3000/`
   - **Carteira de Clientes (CRM):** `http://localhost:3000/#clients`
   - **Portal do Cliente (Acesso por PIN):** `http://localhost:3000/portal.html`
   - **Link Direto do Cliente (Exemplo):** `http://localhost:3000/portal.html?code=CLI-8429&brief=BRF-2025-089`

---

## 🔐 Autenticação e Segurança da API

Correção de RN-API-01 (`_reversa_forward/001-corrige-autenticacao-api/`): toda rota administrativa (`api/clients.js`, `api/instances.js`, `api/auth.js`) agora exige sessão válida no servidor — não existe mais acesso direto sem login.

- **Login do admin:** e-mail/senha + segundo fator (TOTP), se `ADMIN_TOTP_SECRET` estiver configurado.
- **Configurar o MFA (uma vez):**
  ```bash
  node scripts/generate-totp-secret.js
  ```
  Copie o valor gerado para a variável de ambiente `ADMIN_TOTP_SECRET` na Vercel, e cadastre a mesma chave no Google Authenticator / Microsoft Authenticator (opção "inserir chave manualmente"). Sem essa variável configurada, o login funciona normalmente, mas sem o segundo fator.
- **Acesso do cliente (PIN):** validado no servidor via `POST /api/client-access`, com bloqueio temporário após tentativas demais.
- **Testes automatizados:**
  ```bash
  npm test
  ```
  Roda a suíte `node --test` sobre `api/*.test.js` (TOTP, sessões, rate limiting). Veja o roteiro de teste manual completo em `_reversa_forward/001-corrige-autenticacao-api/onboarding.md`.

---

## 🧭 Funil de Lead/Deal (CRM)

Correção de `_reversa_forward/002-crm-funil-lead-projeto/`: `crm.html` agora é o funil de Lead (6 estágios configuráveis, persistidos em `leads`/`lead_estagios`), não mais o Kanban de acompanhamento de briefing.

- **Criar/mover/excluir Lead:** só o admin, via `crm.html` (arrastar o card entre colunas, ou botão "Novo Lead"). API protegida por sessão (`/api/leads`), mesma trava da feature 001.
- **Converter em Cliente:** disponível nos estágios finais (`fechado`/`perdido`); cria um `Cliente` real vinculado ao Lead, sem apagar o Lead (histórico preservado em `clientes.lead_origem_id`).
- **Kanban de acompanhamento de briefing** (o que antes vivia em `crm.html`): migrou para dentro do Dashboard — acesse em `index.html#kanban` ou pelo item "Acompanhamento de Briefings" no menu lateral. Nenhuma função foi perdida, só mudou de endereço.
- Sem score de IA no card do Lead (decisão do usuário) e sem a ação "Transformar em Projeto" do mockup (entidade `Projeto` ainda não implementada — próxima feature do roadmap).

## 🏗️ Projetos (MVP)

Correção de `_reversa_forward/003-projeto-cadastro-mvp/`: `projects.html`/`project-detail.html` deixam de ser mockups estáticos e passam a mostrar Projetos reais, vinculados a um `Cliente` existente.

- **Criar Projeto ("Transformar em Projeto"):** botão "Novo Projeto" em `projects.html`, disponível para qualquer Cliente cadastrado (não só os originados de Lead).
- **6 fases** (briefing aprovado → imersão/conceito → criação → revisão do cliente → ajustes finais → entregue), movidas por drag-and-drop, sem validação de sequência obrigatória no MVP.
- **Horas:** apontamento manual de horas consumidas em `project-detail.html`, com consulta planejado x realizado.
- **Deliberadamente não implementado:** squads, SLA médio, Gantt/linha do tempo, matriz de capacidade de equipe e histórico de marcos — existiam só no mockup visual original, sem nenhuma entidade real por trás (mesma diretriz aplicada ao score de IA do Lead). Entregáveis e o portal de acompanhamento pós-kickoff do cliente ficam para uma feature futura.

## 📋 Clientes & Briefings Pré-Carregados (Seed Data)

| Código | Empresa | Vertical | Responsável | Briefing ID | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `CLI-8429` | Lumina Movement | Pilates Reformer | Mariana Silveira | `BRF-2025-089` | Em Revisão |
| `CLI-5193` | OrthoMovement Clinic | Fisioterapia | Dr. Rodrigo Mendes | `BRF-2025-088` | Kickoff Pronto |
| `CLI-7361` | Apex BioTech Summit | Eventos & Grande Porte | Beatriz Prado | `BRF-2025-087` | Submetido |

---

## 🛡️ Garantias de Qualidade & Fidelidade Visual

- ✅ **Preservação de Tokens Stitch:** Cores primárias (`#3525cd`), superfícies (`#f9f9ff`), tipografia (`Plus Jakarta Sans`, `Inter`) e iconografia `Material Symbols Outlined` mantidas 100% fiéis aos mockups.
- ✅ **Zero-Knowledge Security:** Clientes nunca têm acesso a rotas ou dados de outros clientes da agência.
- ✅ **Persistência Resiliente:** Respostas salvas a cada caractere digitado ou clique de seleção.
