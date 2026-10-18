# SEED.md — Especificação Arquitetural & Semente do Sistema StudioIntake

> **Propósito do Documento:**  
> Este documento é a **Semente (SEED)** do projeto **StudioIntake** — um ecossistema inteligente de briefings dinâmicos ("Super Google Forms para Agências/Estúdios"), projetado para acelerar o processo de onboarding, descoberta e alinhamento de escopo entre agência e clientes.

---

## 1. Visão do Produto & Conceito Central

### 1.1. O Problema
Atualmente, agências e estúdios dependem de Google Forms genéricos, trocas caóticas de e-mails, mensagens soltas no WhatsApp ou reuniões intermináveis de alinhamento. Isso gera:
- Respostas incompletas e sem contexto visual.
- Falta de centralização por cliente (um mesmo cliente preenche vários formulários ao longo do projeto e nada fica unificado).
- Perda de tempo da equipe técnica traduzindo respostas soltas em especificações reais de projeto.

### 1.2. A Solução: StudioIntake
Um sistema próprio, elegante e parametrizável onde:
1. **Cadastro Centralizado de Clientes:** Cada cliente possui perfil próprio com dados de contato e um **Código Único de Identificação** (ex: `CLI-8429`).
2. **Briefings Modulares por Etapa:** O mesmo cliente pode receber múltiplos briefings ao longo da jornada (ex: *01. Diagnóstico Inicial*, *02. Identidade & Estética*, *03. Validação de Conteúdo*, *04. Checklist de Lançamento*).
3. **Parametrização Flexível (com Suporte a IA):** Os formulários seguem blocos estruturados (perguntas dissertativas, cartões de seleção visual, sliders de tom, checklists e dropzones de uploads de fotos/arquivos), podendo ser gerados manualmente ou através de prompts parametrizados por IA.
4. **Portal do Cliente Isolado & Seguro:** O cliente acessa via link direto com seu código único, visualizando **apenas** o questionário designado a ele — sem menus internos da agência, dados confidenciais de terceiros ou dashboards operacionais.
5. **Dashboard Operacional & Resumo Executivo:** A agência recebe as respostas estruturadas e conta com um **Resumo Executivo** para transformar os dados coletados em diretrizes imediatas de produção.

---

## 2. Separação Estrita de Papéis (Arquitetura de Acessos)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ECOSSISTEMA STUDIOINTAKE                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│       PAINEL DA AGÊNCIA         │   │        PORTAL DO CLIENTE        │
│      (Área Administrativa)      │   │    (Área Externa / Restrita)    │
├─────────────────────────────────┤   ├─────────────────────────────────┤
│ • Gestão de Clientes (CRM)      │   │ • Acesso via Link com Código    │
│ • Geração de Código Único       │   │ • Identificação do Cliente      │
│ • Construtor / Disparo de Brief │   │ • Preenchimento por Seções      │
│ • Visualização de Respostas     │   │ • Upload de Referências/Fotos   │
│ • Raio-X & Resumo Executivo     │   │ • Salvamento Automático         │
│ • Aprovação de Kickoff          │   │ • Envio Seguro & Protocolo      │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

### Regra de Ouro da Interface:
- **Área da Agência:** Acesso por login/senha, visão global de métricas, histórico de todos os clientes e controle total de templates.
- **Área do Cliente:** Acesso por token/código na URL (ex: `/portal?code=CLI-8429&brief=BRF-089`), focado unicamente na experiência imersiva de preenchimento, com identidade limpa e zero ruído corporativo.

---

## 3. Design System & Identidade Visual (Base Stitch)

O sistema herda a sofisticação estética do **Google Stitch**, refinando as proporções para máxima legibilidade e ar de "boutique digital".

### 3.1. Paleta de Cores Semântica

| Token | Hex | Aplicação |
| :--- | :--- | :--- |
| `primary` | `#3525cd` | Ações principais, destaques ativos, indicadores |
| `primary-container` | `#4f46e5` | Botões de destaque, gradientes de topo, badges |
| `surface` / `background` | `#f9f9ff` | Fundo principal da aplicação |
| `surface-container-lowest` | `#ffffff` | Cards principais, tabelas, modais |
| `surface-container-low` | `#f1f3ff` | Campos de formulário, áreas secundárias |
| `surface-container` | `#e9edff` | Badges de status, containers de ícones |
| `surface-container-high` | `#e1e8fd` | Estados hover, bordas realçadas |
| `on-surface` | `#141b2b` | Tipografia principal (preto azulado profundo) |
| `on-surface-variant` | `#464555` | Descrições, textos secundários e legendas |
| `outline-variant` | `#d3daef` | Linhas delimitadoras sutis de 1px |
| `success` | `#059669` | Status aprovado, salvamento automático ativo |
| `warning` | `#d97706` | Status em revisão, pendências |
| `danger` | `#dc2626` | Urgências altas, erros de validação |

### 3.2. Tipografia
- **Títulos e Headlines:** `Plus Jakarta Sans` (pesos 600, 700, 800) — Confere modernidade, impacto editorial e sofisticação institucional.
- **Corpo, Rótulos e Inputs:** `Inter` (pesos 400, 500, 600) — Máxima legibilidade em formulários longos e densidade de dados.

### 3.3. Padrões de Componentes de Formulário
- **Cards de Seleção Visual (Tone Pickers):** Bordas de 1.5px que se iluminam em tom `primary` com badge de check ao clique.
- **Sliders de Postura de Marca:** Trilhas contínuas com feedback textual dinâmico das pontas (ex: *Minimalista vs. Expressivo*).
- **Chips de Múltipla Escolha (Tag Selector):** Pílulas clicáveis que mudam de estado visual instantaneamente.
- **Dropzone de Arquivos:** Área com drag-and-drop, suporte a múltiplos formatos e listagem de anexos com peso e miniatura.
- **Dock de Ações Flutuante (Action Bar):** Barra inferior fixa com efeito `backdrop-blur` contendo status de sincronização em tempo real e botão de submissão.

---

## 4. Modelagem de Dados & Banco de Dados (Schema)

A estrutura do banco suporta múltiplos clientes e múltiplos formulários por cliente:

```
┌──────────────┐       1:N       ┌──────────────────┐
│   CLIENTE    │ ──────────────< │ BRIEFING_INSTANCE│
└──────────────┘                 └──────────────────┘
                                          │ 1:1
                                          ▼
                                 ┌──────────────────┐
                                 │ RESPOSTA_DIGEST  │
                                 └──────────────────┘
```

### 4.1. Entidade: `Cliente` (Cadastro do Cliente)
```json
{
  "id": "uuid-001",
  "codigo_unico": "CLI-8429",
  "nome_responsavel": "Helena Vasconcellos",
  "cargo": "Diretora Criativa & Co-Fundadora",
  "empresa": "Lumina Movement Reformer Studio",
  "email": "helena@luminamovement.com",
  "whatsapp": "+55 (11) 98452-9011",
  "vertical": "pilates", // pilates, physio, events, universal, etc.
  "status_cliente": "ativo", // ativo, arquivado, lead
  "data_cadastro": "2026-10-15T10:00:00Z",
  "briefings_ids": ["BRF-2025-089"]
}
```

### 4.2. Entidade: `BriefingTemplate` (Modelo Parametrizado)
Define a estrutura de perguntas que pode ser reutilizada ou criada por IA:
```json
{
  "id": "tpl-pilates-v1",
  "titulo": "Briefing de Lançamento & Identidade de Studio",
  "vertical": "pilates",
  "etapa": "descoberta_inicial",
  "secoes": [
    {
      "id": "sec_01",
      "titulo": "Identificação e Responsáveis",
      "campos": [
        { "id": "resp_nome", "tipo": "text", "label": "Nome Completo", "obrigatorio": true },
        { "id": "contato_horario", "tipo": "select", "label": "Melhor Janela de Contato", "opcoes": ["Manhã", "Tarde", "Assíncrono"] }
      ]
    },
    {
      "id": "sec_02",
      "titulo": "Objetivos Estratégicos & Escopo",
      "campos": [
        { "id": "escopo_chips", "tipo": "chips_multiselect", "label": "Entregáveis Contratados", "opcoes": ["Identidade Visual", "Web Design", "App Mobile", "Sinalização 3D"] },
        { "id": "desafio_central", "tipo": "textarea", "label": "Desafio Central do Negócio", "obrigatorio": true }
      ]
    },
    {
      "id": "sec_03",
      "titulo": "Atmosfera e Tom de Marca",
      "campos": [
        { "id": "seletor_tom", "tipo": "cards_single_select", "label": "Energia do Espaço", "opcoes": ["Serene & Arquitetônico", "Earthy & Orgânico", "High-Energy Athletic"] },
        { "id": "slider_estilo", "tipo": "slider_range", "label": "Minimalista vs. Expressivo", "min": 0, "max": 100 }
      ]
    },
    {
      "id": "sec_04",
      "titulo": "Arquivos & Referências",
      "campos": [
        { "id": "anexos_marca", "tipo": "file_upload", "label": "Plantas Baixas, Logotipos ou Moodboards", "formatos": ["pdf", "dwg", "png", "zip"] }
      ]
    }
  ]
}
```

### 4.3. Entidade: `BriefingInstance` (Instância Disparada para o Cliente)
```json
{
  "id": "BRF-2025-089",
  "cliente_id": "uuid-001",
  "template_id": "tpl-pilates-v1",
  "etapa_nome": "Fase 1: Diagnóstico de Marca & Espaço",
  "status": "em_revisao", // rascunho, enviado, respondido, em_revisao, aprovado_kickoff
  "data_envio": "2026-10-16T10:14:00Z",
  "data_resposta": "2026-10-16T14:30:00Z",
  "link_seguro": "http://localhost:3000/portal.html?code=CLI-8429&brief=BRF-2025-089",
  "respostas_brutas": {
    "resp_nome": "Mariana Silveira",
    "desafio_central": "Repensar toda a jornada física e digital de membros para abertura nos Jardins...",
    "seletor_tom": "Serene & Arquitetônico",
    "slider_estilo": 70,
    "anexos": ["Planta_Baixa_Lumina_Jardins.dwg.pdf", "Moodboard_Conceito.png"]
  }
}
```

### 4.4. Entidade: `RespostaDigest` (Resumo Operacional para a Produção)
O briefing respondido gera uma síntese operacional pronta para o time de design e desenvolvimento:
```json
{
  "briefing_id": "BRF-2025-089",
  "cliente_nome": "Lumina Movement Reformer Studio",
  "objetivo_sintetizado": "Lançamento de flagship premium com experiência digital sem fricção.",
  "pilares_design": [
    "Estética Serene & Arquitetônica",
    "Materiais em latão, pedra travertino e linho",
    "Tom de voz reservado e sofisticado"
  ],
  "entregaveis_confirmados": ["Brandbook", "Web App Agendamento", "Sinalização Física"],
  "integracoes_tecnicas": ["Mariana Tek API Webhooks", "Spotify Playlist Sync"],
  "checklist_kickoff": [
    { "item": "Validar planta baixa DWG com equipe de arquitetura", "status": "pendente" },
    { "item": "Receber credenciais sandbox da Mariana Tek", "status": "concluido" },
    { "item": "Agendar sessão de kickoff de direção de arte", "status": "agendado" }
  ]
}
```

### 4.5. Esquema SQL para Neon (PostgreSQL Serverless)
O Neon é o banco relacional nativo ideal por unir confiabilidade PostgreSQL, capacidade JSONB para campos dinâmicos e conexão serverless via HTTP/WebSockets (`@neondatabase/serverless`).

```sql
-- Habilita extensão para UUIDs nativos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CLIENTES (CRM)
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_unico VARCHAR(20) UNIQUE NOT NULL, -- Ex: CLI-8429
    nome_responsavel VARCHAR(255) NOT NULL,
    cargo VARCHAR(150),
    empresa VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(50),
    vertical VARCHAR(50) DEFAULT 'universal', -- pilates, physio, events, universal
    status_cliente VARCHAR(30) DEFAULT 'ativo', -- ativo, arquivado, lead
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clientes_codigo ON clientes(codigo_unico);

-- 2. TABELA DE MODELOS / TEMPLATES DE BRIEFING
CREATE TABLE templates_briefing (
    id VARCHAR(50) PRIMARY KEY, -- Ex: tpl-pilates-v1
    titulo VARCHAR(255) NOT NULL,
    vertical VARCHAR(50) NOT NULL,
    etapa VARCHAR(100) NOT NULL,
    secoes JSONB NOT NULL, -- Blocos de perguntas dinâmicas
    versao INT DEFAULT 1,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE INSTÂNCIAS DE BRIEFING DISPARADAS
CREATE TABLE instancias_briefing (
    id VARCHAR(50) PRIMARY KEY, -- Ex: BRF-2025-089
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    template_id VARCHAR(50) NOT NULL REFERENCES templates_briefing(id),
    etapa_nome VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'rascunho', 
    -- Status permitidos: rascunho, enviado, em_preenchimento, submetido, em_revisao, ajustes_solicitados, aprovado_kickoff
    link_token VARCHAR(100) UNIQUE NOT NULL,
    respostas_brutas JSONB DEFAULT '{}'::jsonb,
    anexos JSONB DEFAULT '[]'::jsonb,
    progresso_percentual INT DEFAULT 0,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_resposta TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_instancias_cliente ON instancias_briefing(cliente_id);
CREATE INDEX idx_instancias_status ON instancias_briefing(status);

-- 4. TABELA DE RESUMOS EXECUTIVOS (DIGEST PARA PRODUÇÃO)
CREATE TABLE resumos_digest (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    briefing_id VARCHAR(50) UNIQUE NOT NULL REFERENCES instancias_briefing(id) ON DELETE CASCADE,
    objetivo_sintetizado TEXT,
    pilares_design JSONB DEFAULT '[]'::jsonb,
    entregaveis_confirmados JSONB DEFAULT '[]'::jsonb,
    integracoes_tecnicas JSONB DEFAULT '[]'::jsonb,
    checklist_kickoff JSONB DEFAULT '[]'::jsonb,
    aprovado_por VARCHAR(150),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

> **Estratégia Híbrida de Armazenamento (`store.js`):**  
> O aplicativo implementa uma interface unificada no `store.js`. Em ambiente local/offline, ele opera via `localStorage` / Mock DB para testes instantâneos. Ao configurar a variável de ambiente `DATABASE_URL` do Neon, ele migra transparentemente para execução direta via driver Serverless HTTP do Neon.

---

## 5. Fluxo de Vida & Máquina de Estados (State Machine)

### 5.1. Ciclo de Transições de Status
```
[ 1. rascunho ] ──────── Agência cria o briefing e define perguntas
      │
      ▼
[ 2. enviado ] ───────── Link gerado com código único e disparado ao cliente
      │
      ▼
[ 3. em_preenchimento ] ─ Cliente acessa o portal e salva respostas parciais
      │
      ▼
[ 4. submetido ] ─────── Cliente envia; formulário é bloqueado para edição
      │
      ▼
[ 5. em_revisao ] ────── Agência tria as respostas e gera o Resumo Operacional
      │
      ├───────────────────────┐
      ▼                       ▼
[ 6. ajustes_solicitados ]  [ 7. aprovado_kickoff ]
(cliente recebe feedback)   (projeto liberado para sprint de design/dev)
```

### 5.2. Fluxo Operacional Ponta a Ponta
```
[ AGÊNCIA ]                            [ CLIENTE ]
     │                                      │
     ├─ 1. Cadastra Cliente (Código Único)  │
     ├─ 2. Escolhe ou Gera Briefing via IA │
     ├─ 3. Dispara Link Seguro (WhatsApp) ─>│
     │                                      ├─ 4. Abre Portal com Código Vinculado
     │                                      ├─ 5. Preenche Perguntas com Autosave
     │                                      ├─ 6. Anexa Fotos, Arquivos e Diretrizes
     │<──────── 7. Submete Briefing ────────┤
     │
     ├─ 8. Agência recebe notificação em tempo real
     ├─ 9. Sistema gera o Resumo Operacional (Digest)
     └─ 10. Diretor Aprova & Despacha Kickoff de Produção
```

---

## 6. Diretrizes Operacionais Complementares

### 6.1. Política de Uploads & Mídia
Para garantir integridade de dados e fluidez no carregamento:
- **Limite por Arquivo:** Máximo de 50MB por arquivo (até 200MB por formulário).
- **Tipos Permitidos:**
  - *Identidade & Vetores:* `.ai`, `.svg`, `.eps`, `.pdf`.
  - *Imagens & Fotos:* `.png`, `.jpg`, `.jpeg`, `.webp`.
  - *Documentos & Arquitetura:* `.pdf`, `.dwg`, `.docx`, `.zip`.
- **Experiência Visual:** Miniatura imediata para imagens, badge de tamanho em KB/MB, barra de progresso de upload e opção de exclusão com 1 clique antes do envio final.

### 6.2. Templates de Disparo Rápido (WhatsApp & E-mail)
O painel da agência conta com o botão **"Copiar Mensagem WhatsApp"** gerando o texto padronizado:

> *"Olá, {NOME}! Tudo bem? 👋*\n\n*Aqui é da equipe de criação. Para darmos o próximo passo com excelência no projeto da **{EMPRESA}**, preparamos um briefing interativo e exclusivo:*\n\n*🔗 **Acesse pelo link:** {LINK_SEGURO}*\n*🔑 **Seu Código de Acesso:** {CODIGO_UNICO}*\n\n*O preenchimento leva cerca de 7 minutos e salva suas respostas automaticamente a cada passo. Qualquer dúvida, estamos por aqui!"*

### 6.3. Formatos de Exportação do Resumo Executivo
O diretor de criação ou gerente de projeto pode exportar o **Digest** em 3 formatos:
1. **Markdown Formatado:** Pronto para colar diretamente em cards do **Notion, ClickUp, Trello, Linear ou Jira**.
2. **PDF / Impressão Limpa:** Folha de rosto executiva estilizada para apresentação ao time ou em reunião de kickoff com o cliente.
3. **JSON de Integração:** Carga de dados bruta para alimentar automações e webhooks.

### 6.4. Privacidade, Segurança & LGPD
- **Isolamento Rígido Zero-Knowledge:** A rota do portal externo carrega unicamente os dados da instância vinculada ao código (`CLI-XXXX` + `BRF-YYYY`). Nenhuma lista de clientes ou histórico alheio trafega no payload.
- **Termo de Consentimento:** Checkbox obrigatório no rodapé antes do envio final: *"Declaro que os dados fornecidos e arquivos anexados representam a visão oficial da empresa para este projeto."*
- **Bloqueio Pós-Envio:** Ao clicar em submeter, o status muda para `submetido` e os campos entram em modo somente-leitura com selo visual de submissão confirmada.

---

## 7. Motor de Parametrização & Prompting de IA

Para atender à necessidade de gerar novos briefings sob medida mantendo o padrão visual e de tokens do sistema:
- O sistema aceita instruções em linguagem natural (ex: *"Gere um briefing de 5 perguntas para coletar a aprovação da paleta de cores e tipografia da cliente Lumina Pilates"*).
- O motor de IA produzirá a especificação estrita no formato de blocos JSON definidos em `BriefingTemplate`.
- A tela do cliente renderiza dinamicamente esses blocos preservando exatamente os componentes visuais, cores e tipografia Stitch, sem necessidade de codificar um arquivo HTML manual do zero para cada novo cliente.

