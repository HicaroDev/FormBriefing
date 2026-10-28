# Dependências — FormBriefing / Studio Suite 2.0

> 🟢 CONFIRMADO via `package.json` (única fonte de dependências do projeto; sem `requirements.txt`, `pom.xml`, `go.mod`, `Gemfile` ou `Cargo.toml`).

## Produção

| Pacote | Versão | Uso |
|---|---|---|
| `@neondatabase/serverless` | `^0.10.4` | Cliente Postgres serverless usado em `api/_db.js` e pelas demais funções `/api/*` para falar com o Neon |

## Desenvolvimento

| Pacote | Versão | Uso |
|---|---|---|
| `vite` | `^6.0.0` | Dev server + build multi-página (10 entry points declarados em `vite.config.js`) |

## Scripts (`package.json`)

| Script | Comando | Uso |
|---|---|---|
| `dev` / `start` | `vite` | Servidor de desenvolvimento local |
| `build` | `vite build` | Build de produção (gera `dist/`, usado pelo deploy automático da Vercel) |
| `preview` | `vite preview` | Serve o build localmente para inspeção |

## Variáveis de ambiente (🟡 INFERIDO a partir do uso em `api/`, não há `.env.example`)

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` / `POSTGRES_URL` — connection string do Neon
- `SESSION_SECRET` — assinatura HMAC do token de sessão do admin
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH` — credenciais do admin (scrypt)

`.env.local` existe no projeto mas não foi lido em detalhe por conter segredos reais — apenas confirmada sua existência.

## Sem gerenciamento de dependências para:
- Frontend (nenhum framework de UI — JS vanilla + DOM direto)
- Testes (nenhum framework configurado)
- CI/CD (nenhum pipeline encontrado)
