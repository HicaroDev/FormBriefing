# PROJECT_LOG.md — Histórico StudioIntake (FormBriefing)

> Documento de continuidade: o que foi feito, por quê, e o que falta. Leia isto primeiro ao retomar o projeto em outra sessão.

---

## 1. Visão Geral

**StudioIntake** é uma plataforma de briefings inteligentes para a agência do Hicaro (Atelier Intake), construída a partir de mockups do Google Stitch. Vive em `c:\DEV\FormBriefing`, publicada em produção na Vercel: **https://form-briefing-eight.vercel.app**

Repositório: **https://github.com/HicaroDev/FormBriefing** (branch `main`).

Caso de uso real em andamento: captar e finalizar o projeto da cliente **Carola Vitali**, proprietária da **Kalea Pilates** (código `CLI-9790`), que também tem uma clínica de fisioterapia separada chamada **Fisio**.

---

## 2. O Que Foi Feito Nesta Sessão (ordem cronológica)

### 2.1. Publicação no GitHub
- Projeto não era um repositório git. Inicializado, `.gitignore` criado.
- **Incidente de segurança:** um arquivo `02.md` continha uma API key real do Google (Stitch MCP) em texto puro. O GitHub Push Protection bloqueou o push corretamente. O arquivo foi removido do commit e do disco; recomendado ao usuário revogar a chave.
- Push bem-sucedido após a correção.

### 2.2. Briefings trilíngues para a Carola (PT/IT/EN)
Pedido do usuário (por áudio no Telegram): a Carola tem 2 negócios (Kalea Pilates quase pronto, Fisio separada) e quer 3 frentes de trabalho:
1. Finalização do site da Kalea Pilates (hospedagem, acesso, painel de controle, últimas camadas técnicas).
2. Diagnóstico/redesign do site da Fisio.
3. Automação de redes sociais + agente de IA.

Tudo precisa ser respondido em **italiano, português (BR) ou inglês**, à escolha de quem responde.

**Implementado:**
- Motor de i18n em `form-engine.js`: função `t(valor, locale)` resolve string pura (compat. com templates antigos) ou objeto `{pt, it, en}`. Seletor de idioma persistente (`localStorage` + `?lang=` na URL).
- 3 templates trilíngues em `store.js`: `tpl-pilates-finalizacao-v1`, `tpl-fisio-redesign-v1`, `tpl-automacao-ia-v1`.
- Dashboard (`dashboard.js`) ganhou seletor de template ao disparar novo briefing (antes era fixo por vertical).

### 2.3. Backend real (Postgres/Neon) — antes só havia localStorage
**Por quê:** o app era 100% client-side. Um link gerado no navegador do Hicaro não funcionava no navegador/celular da Carola, porque cada navegador tem seu próprio `localStorage` isolado. Identificado e comunicado ao usuário antes de prosseguir.

**Implementado:**
- `api/_db.js`, `api/migrate.js`, `api/clients.js`, `api/instances.js` — funções serverless da Vercel usando `@neondatabase/serverless`.
- `store.js` ganhou camada híbrida: `syncClientRemote`, `syncInstanceRemote`, `patchInstanceRemote`, `fetchClientByCodeRemote`, `fetchInstanceByIdRemote`, `syncAllFromRemote`.
- `form-engine.js`: portal busca no banco remoto quando não encontra localmente (caso do cliente abrindo em outro dispositivo). Autosave sincroniza com o banco a cada alteração.
- `dashboard.js`: ao criar cliente/briefing, sincroniza com o banco; sincroniza periodicamente (a cada 10s) para refletir respostas de outros dispositivos.
- Removidos os clientes/instâncias/digests de demonstração (`SEED_CLIENTES`, `SEED_INSTANCES`, `SEED_DIGESTS` agora vazios) — produção limpa.

**Bugs encontrados e corrigidos durante a configuração do banco:**
1. `DATABASE_URL` não estava configurada no projeto Vercel (usuário achava que já tinha conectado). Resolvido via `vercel env add` (Vercel CLI já estava autenticada na máquina).
2. A connection string, ao ser passada via pipe do PowerShell, ganhava um caractere BOM (`\uFEFF`) invisível no início, invalidando a URL para o driver `neon()`. Corrigido com fix defensivo em `api/_db.js` (sanitização via regex) — resiliente independente de como o caractere entrar.
3. **Cache de template "fantasma":** `getTemplates()` só faz seed do `localStorage` quando a chave não existe. Navegadores que já tinham visitado o site antes (inclusive os de teste) ficavam presos para sempre nos templates antigos, mesmo com o código atualizado. Corrigido renomeando todas as `STORAGE_KEYS` de `_v2` para `_v3`, forçando reseed geral.

### 2.4. Skills de QA locais + documentação (pedido do usuário em `03.md`)
Criados em `.agents/skills/`: `vercel-structure-auditor`, `mockup-fidelity-auditor`, `link-health-checker`, `code-integrity-guardian`, `post-cleanup-reviewer`, `improvement-documenter` — ver [`INDEX.md`](.agents/skills/INDEX.md) para o catálogo completo e quando usar cada um.

---

## 3. Estado Atual (no momento deste log)

✅ **Funcionando e testado em produção:**
- Dashboard (`index.html`) carrega limpo, sem dados de demonstração.
- Banco Postgres real conectado (`/api/migrate` retorna `200 {"ok":true}`).
- Cliente real cadastrada: Carola Vitali / Kalea Pilates, código `CLI-9790`.
- 3 briefings separados criados e testados ao vivo (cada um com link próprio, seletor PT/IT/EN funcionando):
  - `BRF-2026-201` → Finalização do Site Pilates
  - `BRF-2026-202` → Diagnóstico Site Fisio
  - `BRF-2026-203` → Automação & IA

⚠️ **Pendente / em andamento no momento deste log:**
- **Usuário pediu para unificar os 3 briefings em UM ÚNICO link com 3 partes internas**, em vez de 3 links separados. Ainda não implementado — próximo passo natural ao retomar.
- **Usuário quer ver a tela de admin (Dashboard/CRM)** para entender onde copiar o link a ser enviado à cliente — ainda não demonstrado via screenshot/explicação guiada.
- **Reestruturação do menu lateral do Dashboard** pedida pelo usuário: manter "Control Panel" e "Carteira de Clientes (CRM)", adicionar item "Formulários" com submenu Aberto / Em Processo / Respondidos / Arquivados, com cadastro de cliente vinculado aos formulários dele. Não implementado ainda.
- **Login real** do Dashboard da agência: hoje `login.html` é só uma tela estática sem autenticação de verdade — qualquer um com o link acessa o Dashboard direto. Usuário decidiu adiar ("depois, não é urgente agora") quando perguntado.
- Pequena inconsistência cosmética: `etapa_nome` de alguns briefings tem acentuação corrompida no banco (problema de encoding ao inserir via terminal Windows/curl) — não afeta o que a cliente vê, só a visão interna da agência.

---

## 4. Decisões de Arquitetura Importantes (para não repetir erros)

- **Sempre usar `127.0.0.1:3000` em vez de `localhost:3000`** ao testar localmente nesta máquina — havia outro projeto (YomaTime) escutando `localhost` via IPv6 na mesma porta.
- **Vite dev (`npm run dev`) não executa as rotas `/api`** — essas só rodam de verdade na Vercel (serverless functions). Para testar o backend, é preciso testar contra a URL de produção ou usar `vercel dev`.
- **Toda mudança em `SEED_TEMPLATES`/estrutura de dados que afete o cache local deve vir acompanhada de um bump de versão em `STORAGE_KEYS`** (atualmente `_v3`), ou usuários com cache antigo ficam presos em versões desatualizadas para sempre.
- **Caracteres acentuados em payloads JSON via `curl`/PowerShell no Windows são propensos a corromper** — preferir escrever o JSON em um arquivo UTF-8 (via ferramenta `Write`) e usar `--data-binary @arquivo` em vez de `-d "string inline"`.
- Node/npm não estão no `PATH` desta sessão sandboxed — usar caminho completo `C:\Program Files\nodejs\`.

---

## 5. Como Retomar

1. Ler este arquivo e [`.agents/skills/INDEX.md`](.agents/skills/INDEX.md).
2. Rodar `vercel-structure-auditor` para confirmar que produção continua saudável (pode ter havido mudanças externas).
3. Continuar pela lista de pendências da seção 3, na ordem em que o usuário as pediu.
