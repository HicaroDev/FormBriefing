# C4 — Nível 2: Containers

```mermaid
flowchart TB
    subgraph Browser["Navegador do Admin"]
        SPA_Admin["Painel do Estúdio\nVite multi-page, JS vanilla\nlogin.html, index.html, crm.html, forms-hub.html"]
        LS_Admin[("localStorage\nBriefingTemplate, RespostaDigest, cache")]
    end
    subgraph BrowserCliente["Navegador do Cliente"]
        SPA_Cliente["Portal do Cliente\nportal.html, client-form.html"]
    end
    subgraph Vercel["Vercel (hospedagem + serverless)"]
        API_auth["/api/auth.js"]
        API_clients["/api/clients.js"]
        API_instances["/api/instances.js"]
        API_migrate["/api/migrate.js"]
    end
    DB[("Neon Postgres\ntabelas: clientes, instancias_briefing")]

    SPA_Admin <-->|fetch JSON| API_auth
    SPA_Admin <-->|fetch JSON, SEM checagem de auth no servidor| API_clients
    SPA_Admin <-->|fetch JSON, SEM checagem de auth no servidor| API_instances
    SPA_Cliente <-->|fetch JSON, mesmo endpoint, sem rota exclusiva| API_clients
    SPA_Cliente <-->|fetch JSON| API_instances
    SPA_Admin --- LS_Admin
    API_clients --> DB
    API_instances --> DB
    API_auth -.->|lê credenciais de env vars, sem tabela| DB

    style API_clients fill:#fecaca
    style API_instances fill:#fecaca
```

`BriefingTemplate` e `RespostaDigest` nunca saem do `localStorage` do navegador do admin — não aparecem neste diagrama como dados do Postgres porque não estão lá (ver `erd-complete.md` e `domain.md`).
