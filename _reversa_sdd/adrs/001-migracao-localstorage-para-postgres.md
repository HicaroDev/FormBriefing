# ADR-001 — Migração de localStorage para Postgres (Neon)

**Status:** Aceito (implementado) · **Data:** ~2026-10-19/21 (commits `01db7eb` até `5005daa`) · **Confiança:** 🟢 CONFIRMADO (retroativo, reconstruído do histórico Git)

## Contexto
A primeira versão do StudioIntake guardava clientes e instâncias de briefing só em `localStorage` do navegador. Isso impedia sincronização entre dispositivos — um briefing respondido em um navegador não aparecia em outro.

## Decisão
Conectar um banco Postgres real (Neon, via `@neondatabase/serverless`) e migrar `clientes`/`instancias_briefing` para tabelas reais, mantendo `localStorage` apenas como cache/fallback e para entidades que não migraram (`BriefingTemplate`, `RespostaDigest`).

## Consequências observadas
- Resolveu sincronização entre dispositivos para clientes e instâncias.
- Introduziu um bug real de conexão (BOM na connection string colada no PowerShell do Windows) corrigido em `5005daa` — hoje existe como `sanitize()` em `api/_db.js`.
- `BriefingTemplate` e `RespostaDigest` **não foram migrados** — continuam só em `localStorage`, criando a assimetria arquitetural hoje documentada como lacuna em `data-dictionary.md`.
