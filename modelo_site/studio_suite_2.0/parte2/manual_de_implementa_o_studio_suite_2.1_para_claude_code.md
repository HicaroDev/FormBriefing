# Guia de Implementação e Arquitetura · Studio Suite 2.1 (Para Claude Code)

Este manual foi elaborado especificamente como uma instrução técnica para o **Claude Code** (e agentes CLI de engenharia de software) implementar, estruturar e colocar em execução o ecossistema completo do **Studio Suite 2.1** com fidelidade arquitetural, semântica e visual.

---

## 1. Visão Geral da Arquitetura do Sistema

O **Studio Suite 2.1** é uma plataforma SaaS fullstack voltada para estúdios criativos de alto padrão (arquitetura, branding, bem-estar, pilates e fisioterapia), dividida em dois grandes portais:
1. **Atelier Executive Hub (Área Interna do Estúdio):** Autenticado via SSO/Email, com dock de navegação flutuante lateral (72px), painel de CRM em Kanban, biblioteca de modelos (Forms Hub), editor visual de formulários (Form Builder), gerenciamento de projetos por entregáveis e agenda de alinhamento com clientes.
2. **Client Discovery Portal (Área Externa do Cliente):** Sem dock de navegação. Acessado por URL pública assinada ou autenticação segura via **PIN de 6 dígitos** (com rate limiting e expiração). Fluxo guiado em etapas (wizard persistente com autosave), tela de confirmação/protocolo e área de acompanhamento de status do projeto contratado.

---

## 2. Stack Recomendada & Pré-requisitos

Para máxima compatibilidade com os artefatos de UI gerados e produtividade com Tailwind CSS:

- **Framework Web:** Next.js 14+ (App Router) ou Vite + React 18 / Remix.
- **Linguagem:** TypeScript (estrito).
- **Estilização:** Tailwind CSS v3.4+ com suporte a plugins de backdrop-filter e forms.
- **Gerenciador de Estado:** Zustand ou TanStack React Query v5.
- **Validação de Schemas:** Zod.
- **Ícones:** Material Symbols Outlined (Google Fonts).
- **Tipografia:** Google Fonts (`Plus Jakarta Sans` para toda a UI e `JetBrains Mono` para códigos/PINs).
- **Banco de Dados & Auth:** Supabase (PostgreSQL + Row Level Security + Auth + Storage para anexos) ou Prisma com PostgreSQL.

---

## 3. Design System Tokens & Configuração Tailwind

No arquivo `tailwind.config.js` ou `tailwind.config.ts`, declare a seguinte extensão de tema:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316', // Laranja Atelier Principal
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
        },
        surface: {
          canvas: '#FBF8F3',
          base: 'rgba(255, 255, 255, 0.70)',
          dark: '#1E293B',
        },
        ink: {
          title: '#0F172A',
          body: '#475569',
          muted: '#64748B',
          placeholder: '#94A3B8',
          border: '#E2E8F0',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          security: '#0D9488',
          info: '#0284C7',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'dock': '24px',
        'card': '20px',
        'field': '12px',
      },
      boxShadow: {
        'glass': '0 20px 40px -15px rgba(230, 81, 0, 0.07), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
        'glass-hover': '0 25px 50px -12px rgba(230, 81, 0, 0.12), 0 12px 30px -4px rgba(0, 0, 0, 0.06)',
      },
      backgroundImage: {
        'atelier-gradient': 'linear-gradient(135deg, #FBF8F3 0%, #F5EFEB 50%, #ECE4DB 100%)',
        'primary-gradient': 'linear-gradient(135deg, #F97316 0%, #E65100 100%)',
        'highlight-gradient': 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)',
      },
      backdropBlur: {
        'glass': '20px',
      }
    },
  },
  plugins: [],
};
export default config;
```

---

## 4. Estrutura de Diretórios Recomendada

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/                     # Tela 01 · Login do Estúdio
│   ├── (studio)/                      # Layout compartilhado com Dock Lateral (72px)
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Tela 02 · Dashboard Executivo
│   │   ├── crm/
│   │   │   ├── page.tsx               # Tela 03 · Funil de Vendas (Kanban)
│   │   │   └── [leadId]/page.tsx      # Tela 04 · Ficha do Cliente (Lumina Movement)
│   │   ├── forms/
│   │   │   ├── page.tsx               # Tela 06 & 06b · Forms Hub (Modelos & Respostas)
│   │   │   ├── builder/[modelId]/     # Tela 07 · Editor de Modelo (Form Builder)
│   │   │   └── responses/[responseId]/# Tela 08 · Respostas do Briefing
│   │   ├── projects/
│   │   │   ├── page.tsx               # Tela 09 · Projetos Quadro Geral
│   │   │   └── [projectId]/page.tsx   # Tela 10 · Evolução do Projeto (#PLT-2026-08)
│   │   ├── schedule/page.tsx          # Tela 11 · Agenda do Estúdio
│   │   └── settings/page.tsx          # Tela 12 · Configurações do Estúdio
│   └── (portal)/                      # Layout do Cliente (Sem Dock lateral)
│       ├── layout.tsx
│       ├── access/page.tsx            # Tela 13 · Acesso por PIN
│       ├── brief/[token]/page.tsx     # Tela 14, 14b, 14c · Wizard de Preenchimento
│       ├── success/[token]/page.tsx   # Tela 15 · Briefing Enviado com Sucesso
│       └── tracking/[projectId]/page.tsx # Tela 16 · Acompanhamento de Projeto
├── components/
│   ├── ui/                            # Cards de vidro, botões, badges, inputs
│   ├── studio/
│   │   ├── StudioDock.tsx             # Dock lateral flutuante de 72px
│   │   ├── TopHeader.tsx              # Barra de topo com busca e avatar
│   │   ├── ModalSendPin.tsx           # Tela 05 · Modal de Envio com PIN & WhatsApp
│   │   └── KanbanBoard.tsx
│   └── portal/
│       ├── PinInputGrid.tsx           # 6 inputs numéricos de foco sequencial
│       └── BriefWizardStep.tsx
├── lib/
│   ├── supabase/
│   ├── types.ts                       # Schemas e tipagens de domínio
│   └── validators/                    # Validações Zod (PIN, Briefing, Lead)
```

---

## 5. Modelagem de Dados (PostgreSQL / Supabase Schema)

```sql
-- Enums essenciais
CREATE TYPE lead_stage AS ENUM ('new_lead', 'brief_sent', 'brief_received', 'proposal_sent', 'closed_won', 'closed_lost');
CREATE TYPE project_phase AS ENUM ('brief_approved', 'immersion_concept', 'creation', 'client_review', 'final_adjustments', 'delivered');
CREATE TYPE pin_status AS ENUM ('active', 'expired', 'blocked');

-- 1. Clientes / Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  segment TEXT NOT NULL, -- Pilates, Fisioterapia, Bem-Estar, Eventos
  city TEXT DEFAULT 'São Paulo',
  stage lead_stage DEFAULT 'new_lead',
  estimated_value NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Briefings e Autenticação por PIN
CREATE TABLE client_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  model_id UUID NOT NULL,
  pin_code VARCHAR(6) NOT NULL, -- Ex: '842910'
  pin_status pin_status DEFAULT 'active',
  failed_attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  allow_autosave BOOLEAN DEFAULT TRUE,
  progress_percentage INT DEFAULT 0,
  current_step INT DEFAULT 1,
  answers_json JSONB DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Projetos Operacionais
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- Ex: '#PLT-2026-08'
  lead_id UUID REFERENCES leads(id),
  title TEXT NOT NULL,
  phase project_phase DEFAULT 'brief_approved',
  contracted_value NUMERIC(10,2) NOT NULL,
  target_delivery_date DATE NOT NULL,
  allocated_hours INT DEFAULT 120,
  consumed_hours INT DEFAULT 0,
  scope_pillars JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Entregáveis do Projeto
CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  version VARCHAR(10) DEFAULT 'v1.0',
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, changes_requested
  thumbnail_url TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Regras de Negócio e Implementação Passo a Passo para o Claude Code

### Passo 1: Autenticação & Validação de PIN (Lado Cliente)
1. Crie o componente `PinInputGrid.tsx` com 6 campos numéricos individuais.
2. Cada dígito inserido avança o foco automaticamente (`onInput` / `ref.focus()`).
3. Backspace com campo vazio move o foco para o anterior.
4. Implemente proteção contra força bruta: se `failed_attempts >= 3`, marque `pin_status = 'blocked'` e exiba o aviso de bloqueio.
5. Se `expires_at < now()`, exiba o estado expirado com CTA para solicitar novo PIN no WhatsApp de Hícaro (`+55 11 98842-9100`).

### Passo 2: Wizard do Briefing com Autosave
1. Salvar rascunhos em tempo real com debounce de 1500ms via `PATCH /api/briefings/[id]`.
2. A navegação entre as 4 etapas nunca deve recarregar a página.
3. Seção 3 (Estética) deve gravar a atmosfera selecionada e o valor percentual da régua de sofisticação (0% a 100%).
4. Seção 4 (Upload) deve aceitar `.dwg`, `.pdf`, `.zip`, `.png`, gravando metadados de tamanho e nome.
5. Ao concluir, atualize a etapa do lead no CRM para `brief_received`.

### Passo 3: CRM Funil e Modal de Envio
1. No quadro Kanban do CRM, suporte atualização otimista de status via drag-and-drop (`@hello-pangea/dnd` ou `@dnd-kit`).
2. O botão "Enviar Briefing" abre o modal `ModalSendPin.tsx` que:
   - Gera um PIN aleatório de 6 dígitos formatado como `XXX XXX`;
   - Monta o link curto seguro;
   - Gera a mensagem pré-formatada para WhatsApp com deep link `https://wa.me/{phone}?text=...`.

---

## 7. Comandos de Inicialização Rápida

Para iniciar o projeto do zero:
```bash
# 1. Criação do app Next.js
npx create-next-app@latest studio-suite --typescript --tailwind --eslint --app --src-dir

# 2. Instalação das dependências essenciais
cd studio-suite
npm install @supabase/supabase-js @tanstack/react-query lucide-react clsx tailwind-merge zod zustand

# 3. Execução em desenvolvimento
npm run dev
```

Este manual fornece todas as referências estruturais, cromáticas e comportamentais necessárias para transformar a especificação do Studio Suite 2.1 em código de produção robusto e elegante.
