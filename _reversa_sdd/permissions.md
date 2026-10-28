# Permissões e Papéis — FormBriefing / Studio Suite 2.0

> Gerado pelo Detective. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

---

## 1. Papéis existentes

🟢 Apenas 2 papéis, sem RBAC granular — confirmado em todo o código e pelo histórico Git (42 commits, autor único):

| Papel | Autenticação | Escopo |
|---|---|---|
| **Admin / Estúdio** | Login e-mail+senha (scrypt hash) → sessão HMAC-SHA256, 7 dias. Credenciais fixas em variáveis de ambiente — não há tabela de usuários, não há múltiplos admins. | Acesso total a todos os clientes e instâncias (uma vez autenticado no front-end). |
| **Cliente** | `codigo_unico` (`CLI-XXXX`) + `link_token` da instância, via URL. Sem senha, sem sessão persistente. | Acesso só à(s) própria(s) instância(s) de briefing — mediado pelo zero-leakage gate (RN-INTAKE-01). |

🔴 **Não existem:** papel de "equipe"/colaborador do estúdio (o manual de implementação em `modelo_site/` menciona "Equipe" nas Configurações, mas não há nenhum código real), nem hierarquia de permissões dentro do admin (é tudo-ou-nada).

---

## 2. Matriz de permissões

| Ação | Admin (front-end) | Admin via API direta | Cliente (com código válido) | Cliente (código inválido/alheio) |
|---|---|---|---|---|
| Listar todos os clientes | 🟢 sim | 🔴 sim — **sem checagem de login** (RN-API-01) | ❌ não | ❌ não |
| Ver/editar um cliente específico | 🟢 sim | 🔴 sim — sem checagem | ❌ não | ❌ não |
| Listar todas as instâncias de briefing | 🟢 sim | 🔴 sim — sem checagem | ❌ não | ❌ não |
| Responder/editar sua própria instância | 🟢 sim (via dashboard) | — | 🟢 sim | ❌ não — bloqueado pelo zero-leakage gate |
| Editar instância de outro cliente | 🟢 sim (é o admin) | 🔴 sim — sem checagem | ❌ não | ❌ não |
| Apagar uma instância (`DELETE`) | 🟢 sim | 🔴 sim — sem checagem | ❌ não | ❌ não |
| Gerar/ver resumo executivo (digest) | 🟢 sim | — (sem endpoint, só localStorage) | ❌ não é exposto ao cliente hoje | ❌ não |

🔴 **Achado central desta matriz (já registrado como RN-API-01 no módulo `api-backend`):** a coluna "Admin via API direta" é idêntica à coluna "Admin (front-end)" porque **não existe distinção no servidor** — qualquer requisição HTTP a `/api/clients` ou `/api/instances` tem exatamente os mesmos poderes de um admin logado, sem precisar estar logado. O `requireAuth()` existente é só uma trava de UI em `dashboard.js`, nunca verificada no backend.

---

## 3. Papéis previstos no roadmap do usuário, ainda não implementados

🔴 `modelo_site/studio_suite_2.0/parte1/prompts_stitch_studio_suite_2.1.md` (tela 12 · Configurações) menciona uma seção "Equipe" — sugere intenção futura de múltiplos usuários do lado do estúdio, possivelmente com papéis diferenciados (ex: designer vs. diretor). Sem nenhum detalhe de permissão especificado além do nome da seção — tratar como item de backlog, não como requisito definido.
