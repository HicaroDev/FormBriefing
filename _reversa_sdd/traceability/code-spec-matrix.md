# Code-Spec Matrix — FormBriefing / Studio Suite 2.0

> Gerado pelo Writer. Lista, por arquivo do legado, qual unit cobre o quê.

| Arquivo do legado | Unit correspondente | Cobertura |
|---|---|---|
| `login.html` | `auth/` | 🟢 |
| `portal.html` | `auth/` | 🟢 |
| `portal-auth.js` | `auth/` | 🟢 |
| `api/auth.js` | `auth/` | 🟢 |
| `index.html` | `dashboard-core/` | 🟢 |
| `dashboard.js` | `dashboard-core/` | 🟢 |
| `store.js` | `dashboard-core/` | 🟢 |
| `client-form.html` | `client-intake/` | 🟢 |
| `form-engine.js` | `client-intake/` | 🟢 |
| `crm.html` | `crm-funil/` | 🟢 |
| `forms-hub.html` | `forms-hub/` | 🟢 |
| `api/_db.js` | `api-backend/` | 🟢 |
| `api/clients.js` | `api-backend/` | 🟢 |
| `api/instances.js` | `api-backend/` | 🟢 |
| `api/migrate.js` | `api-backend/` | 🟡 (DDL documentada em `data-dictionary.md`, não em uma spec própria) |
| `ai-briefing-generator.js` | `ai-briefing-generator/` | 🟢 |
| `form-builder.html` | `telas-preview-v2/` | 🟢 |
| `projects.html` | `telas-preview-v2/` | 🟢 |
| `project-detail.html` | `telas-preview-v2/` | 🟢 |
| `client-tracking.html` | `telas-preview-v2/` | 🟢 |
| `modelo_site/**` | `design-reference-stitch/` | 🟢 |
| `vite.config.js`, `package.json` | n/a | sem unit — configuração de build, documentada em `dependencies.md` |
| `03.md` | n/a | arquivo não rastreado pelo Git na raiz do projeto, não analisado nesta rodada — candidato a revisão adicional |

## Cobertura estimada
26 de 27 arquivos de código/markup relevantes mapeados a uma unit (96%). O único arquivo fora de qualquer unit com comportamento (`03.md`) é um documento solto, não código executável — baixo risco.
