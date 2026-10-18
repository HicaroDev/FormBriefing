# TODO.md — Roteiro de Execução Passo a Passo (Roadmap Atômico)

> **Projeto:** StudioIntake (Super Google Forms para Agências & Estúdios)  
> **Referência Técnica:** [`SEED.md`](file:///c:/DEV/FormBriefing/SEED.md)  
> **Status Geral:** Pronto para Execução Faseada

---

## 📋 Fase 1: Fundação & Camada de Dados (Data Store & Modelagem)

- [x] **1.1. Estruturação do Esquema de Dados Local/Database (com suporte Neon Postgres)**
  - Implementar em `store.js` os esquemas definidos no [`SEED.md`](file:///c:/DEV/FormBriefing/SEED.md) com arquitetura híbrida (LocalStorage para desenvolvimento e testes locais imediatos + adaptador pronto para conexão Neon Serverless):
    - Tabela/Coleção `clientes` com `id`, `codigo_unico`, `nome`, `empresa`, `email`, `whatsapp`, `vertical`.
    - Tabela/Coleção `templates_briefing` com blocos de perguntas dinâmicas (texto, chips, sliders, cards, upload).
    - Tabela/Coleção `instancias_briefing` vinculadas ao `cliente_id` com status de progresso.
    - Tabela/Coleção `resumos_digest` para sintetizar respostas em checklists de produção.
- [x] **1.2. Gerador de Código Único do Cliente**
  - Criar função utilitária `generateClientCode()` que cria identificadores elegantes e memoráveis (ex: `CLI-8429`, `CLI-3011`).
- [x] **1.3. Carga Inicial de Dados de Demonstração (Seed Data)**
  - Popular o banco com 3 clientes reais para teste imediato:
    - *Lumina Movement* (`CLI-8429` • Pilates)
    - *OrthoMovement Clinic* (`CLI-5193` • Fisioterapia)
    - *Apex BioTech Summit* (`CLI-7361` • Eventos)

---

## 👥 Fase 2: Módulo de Cadastro & Gestão de Clientes (Painel Agência)

- [x] **2.1. Interface de Cadastro de Clientes**
  - Criar aba/modal no Dashboard para cadastrar novos clientes:
    - Nome do responsável, nome da empresa/marca, e-mail, WhatsApp e vertical de atuação.
    - Geração automática e exibição do **Código Único**.
- [x] **2.2. Listagem de Clientes & Histórico de Briefings**
  - Criar visão de clientes no Dashboard mostrando quantos briefings cada cliente já recebeu, quais estão pendentes e quais já foram respondidos.
- [x] **2.3. Ação "Disparar Novo Briefing para Cliente"**
  - Botão no card do cliente que seleciona uma etapa de projeto (ex: *Diagnóstico*, *Validação de Identidade*, *Checklist de Lançamento*), gera o link seguro com o código do cliente e copia para a área de transferência.

---

## ⚙️ Fase 3: Motor Dinâmico de Perguntas (Form Engine Parametrizável)

- [x] **3.1. Renderer Dinâmico de Blocos de Perguntas**
  - Criar componente que recebe um JSON de template e renderiza os campos sem necessidade de criar arquivos HTML manuais:
    - Campo de Texto / Dissertativo (`textarea`, `input`)
    - Cartões Visuais com Seleção Única (`cards_single_select` - como os tons Serene/Earthy/Pulse)
    - Pílulas de Múltipla Escolha (`chips_multiselect` - como escopos contratados)
    - Sliders de Gradiente Contínuo (`slider_range` - como minimalista vs. expressivo)
    - Seletor de Dropdown / Horários (`select`)
    - Área de Anexo de Arquivos / Fotos (`file_upload`)
- [x] **3.2. Biblioteca de Templates Padrão por Vertical**
  - Configurar os 4 templates prontos:
    - Template Pilates Reformer (Aparelhos, Agendamento, Vibe)
    - Template Fisioterapia & Saúde (EHR, Protocolos Clínicos, LGPD)
    - Template Eventos & Produção (Palco LED, Credenciamento NFC, Ingressos)
    - Template Universal de Negócios (BriefOS)

---

## 🚪 Fase 4: Portal do Cliente (Experiência Exclusiva e Isolada)

- [x] **4.1. Limpeza e Isolamento de Telas**
  - Remover do portal do cliente qualquer menu de navegação que aponte para telas internas da agência (Dashboard, outros briefs, etc.).
  - Deixar apenas o branding limpo do projeto, identificação da empresa do cliente e status de sessão segura.
- [x] **4.2. Acesso via Link Direto com Código Vinculado**
  - Permitir abertura direta via URL: `/portal.html?code=CLI-8429&brief=BRF-089`.
  - Caso o cliente acesse sem parâmetros, exibir a tela de inserção de código PIN para identificação.
- [x] **4.3. Motor de Salvamento Automático & Feedback Visual**
  - Salvar cada resposta no `localStorage` / banco a cada alteração de campo, com indicador visual sutil (*"Salvo automaticamente há poucos segundos"*).
- [x] **4.4. Fluxo de Submissão & Tela de Confirmação**
  - Botão de envio no dock flutuante inferior.
  - Ao submeter: travar o formulário para edição, gerar protocolo de envio e exibir tela comemorativa de agradecimento.

---

## 📊 Fase 5: Central de Triagem & Resumo Executivo para Produção

- [x] **5.1. Atualização em Tempo Real no Dashboard da Agência**
  - Assim que o cliente submete o briefing, o status na tabela do Dashboard muda automaticamente de *Enviado* para *Respondido / Em Revisão*.
- [x] **5.2. Painel de Raio-X & Visualizador de Respostas**
  - Ao clicar em uma linha da tabela, abrir o drawer lateral exibindo todas as respostas fornecidas pelo cliente organizadas por blocos.
- [x] **5.3. Gerador do Resumo Operacional (Digest de Produção)**
  - Sintetizar as respostas em:
    - Resumo dos objetivos centrais.
    - Diretrizes visuais escolhidas (cores, tom, atmosfera).
    - Checklist acionável de tarefas para o time de design e desenvolvimento iniciar a produção.
- [x] **5.4. Ações do Diretor de Criação**
  - Botão *"Aprovar & Gerar Kickoff"* (marca como pronto para sprint).
  - Botão *"Solicitar Ajustes ao Cliente"* (envia nota de feedback).
  - Botão *"Exportar Resumo Executivo em PDF/Markdown"*.

---

## 🤖 Fase 6: Módulo de IA para Geração Parametrizada de Novos Briefings

- [x] **6.1. Especificação de Prompt/Skill para Geração de Briefings**
  - Criar instrução padronizada onde a IA recebe:
    - *Nome do Cliente, Ramo de Atuação, Etapa do Projeto e Desafio.*
    - Retorna o JSON rigoroso de campos pronto para ser renderizado pelo motor dinâmico.
- [x] **6.2. Gerador de Resumo por IA Pós-Preenchimento**
  - Função que lê o JSON de respostas preenchido pelo cliente e gera automaticamente o Resumo Executivo e o Checklist de Tarefas para a agência.

---

## 🚀 Fase 7: Polimento, Testes de Usabilidade & Validação

- [x] **7.1. Teste de Fluxo Completo Ponta a Ponta**
  - Cadastrar novo cliente ➔ Gerar briefing ➔ Abrir link como cliente ➔ Preencher e anexar arquivos ➔ Submeter ➔ Avaliar no Dashboard.
- [x] **7.2. Teste de Responsividade Mobile**
  - Garantir preenchimento perfeito em smartphones (clientes frequentemente respondem briefings no celular pelo link recebido no WhatsApp).
- [x] **7.3. Documentação & Entrega Final**
  - Atualizar o `README.md` com o guia de uso prático para a agência.
