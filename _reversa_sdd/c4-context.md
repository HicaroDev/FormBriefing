# C4 — Nível 1: Contexto

```mermaid
flowchart TB
    Admin["Hícaro Duarte\n(Estúdio / Admin)"]
    Cliente["Cliente final do estúdio\n(Pilates, Fisio, Eventos, etc.)"]
    Sistema["FormBriefing / Studio Suite 2.0\nPlataforma de briefing e CRM"]
    WhatsApp["WhatsApp\n(wa.me deep link, sem API)"]
    Neon["Neon Postgres\n(banco de dados gerenciado)"]
    Vercel["Vercel\n(hospedagem + funções serverless)"]

    Admin -->|login e-mail/senha, gerencia clientes e briefings| Sistema
    Cliente -->|acessa por código único CLI-XXXX| Sistema
    Sistema -->|gera link + mensagem pré-formatada| WhatsApp
    Sistema -->|lê/grava clientes e instâncias| Neon
    Sistema -->|deploy e execução| Vercel

    style Sistema fill:#f97316,color:#fff
```

Não há integrações reais com serviços de IA (Gemini/Claude/GPT), e-mail transacional, ou calendário — apesar de mencionados em mockups/manual de implementação. `mailto:` é só um link estático de suporte.
