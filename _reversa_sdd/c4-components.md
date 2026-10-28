# C4 — Nível 3: Componentes

## Container: Painel do Estúdio (front-end)

```mermaid
flowchart TB
    dashboard["dashboard.js\nrequireAuth, render listas, filtros"]
    store["store.js\ngetClients/getTemplates/getInstances,\ngenerateProductionDigest, seeds"]
    crm["crm.html\nKanban sobre BriefingInstance.status"]
    formshub["forms-hub.html\ncatálogo read-only de templates"]
    aigen["ai-briefing-generator.js\ngenerateTemplateFromPrompt (regras),\ngenerateAISynthesis (código morto)"]
    portalauth["portal-auth.js / login.html\nauth client-side"]

    dashboard --> store
    crm --> store
    formshub --> store
    dashboard --> aigen
    aigen --> store
    dashboard --> portalauth
```

## Container: Portal do Cliente (front-end)

```mermaid
flowchart TB
    formengine["form-engine.js\ninitClientPortal, zero-leakage gate,\nautosave, i18n"]
    clientform["client-form.html"]
    portalhtml["portal.html\naccess screen"]

    portalhtml --> formengine
    clientform --> formengine
```

## Container: API (Vercel serverless)

```mermaid
flowchart TB
    dbjs["_db.js\ngetSql singleton, sanitize BOM"]
    auth["auth.js\nscrypt + HMAC session token"]
    clientsjs["clients.js\nCRUD clientes, upsert"]
    instancesjs["instances.js\nCRUD instancias_briefing,\nupsert parcial em POST (RN-API-03)"]
    migrate["migrate.js\nDDL das 2 tabelas"]

    auth --> dbjs
    clientsjs --> dbjs
    instancesjs --> dbjs
    migrate --> dbjs

    style clientsjs fill:#fecaca
    style instancesjs fill:#fecaca
```

Nenhum dos 3 handlers de API (`auth.js` é exceção parcial — ele PRODUZ a sessão, mas não é CONSUMIDO por `clients.js`/`instances.js`) importa ou verifica a sessão gerada por `auth.js` — confirma visualmente o RN-API-01.
