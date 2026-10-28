# Investigation — Corrigir autenticação e autorização das rotas de API

> Gerado pelo `/reversa-plan`. Pesquisa de fundo e alternativas avaliadas para as decisões técnicas do `roadmap.md`.

## TOTP (RFC 6238) sem dependência nova

TOTP é HOTP (HMAC-based One-Time Password, RFC 4226) aplicado sobre um contador derivado do tempo: `contador = floor(unix_time / 30s)`. O código de 6 dígitos é `HMAC-SHA1(segredo, contador) → truncamento dinâmico → mod 10^6`. Toda a conta cabe em algumas linhas usando `crypto.createHmac('sha1', secret)` do Node — não precisa de `otpauth`/`speakeasy`/`otplib`. Google Authenticator e Microsoft Authenticator seguem exatamente essa RFC, então qualquer implementação correta é compatível com ambos (confirma a resposta da sessão de esclarecimentos: escolha livre, qualquer biblioteca/implementação correta atende).

- **Segredo:** string aleatória codificada em Base32 (padrão para TOTP — os apps esperam Base32, não hex/base64).
- **Setup manual (sem QR):** o app aceita digitar a chave manualmente em Base32 — evita precisar de uma biblioteca de geração de QR code (que seria dependência nova). Suficiente para um único admin configurando uma vez. Gerar QR fica como melhoria futura, não bloqueia esta feature.
- **Janela de tolerância:** implementações usuais aceitam o código do intervalo atual e do anterior/seguinte (±30s) para tolerar relógio levemente dessincronizado — vale replicar.

## Cookies de sessão seguros

`HttpOnly` impede leitura via `document.cookie` (mitiga XSS). `Secure` exige HTTPS (Vercel já serve tudo em HTTPS). `SameSite=Strict` ou `Lax` mitiga CSRF básico; como o admin só acessa o próprio domínio e não há necessidade de cookie cross-site, `Strict` é a opção mais segura e não quebra nenhum fluxo observado no legado (não há iframe nem redirect cross-domain documentado em `_reversa_sdd/`).

## Revogação de sessão sem framework

O esquema atual (`signToken`/`verifyToken` em `api/auth.js`) é intencionalmente stateless (HMAC sobre o timestamp de expiração, `_reversa_sdd/code-analysis.md#Módulo: auth`). Stateless não suporta revogação antes do prazo por definição — a única forma de ter logout real é introduzir estado no servidor. A tabela `sessions` nova é o jeito mínimo de fazer isso sem trocar toda a abordagem (continua HMAC-assinado, só que agora cada sessão tem uma linha que pode ser marcada como revogada).

## Rate limiting sem serviço externo

Como o Postgres (Neon) já está disponível e é a única peça de infraestrutura além da Vercel (`_reversa_sdd/dependencies.md`), contar tentativas numa tabela (`auth_attempts`) com uma query `COUNT(*) WHERE identifier = ? AND created_at > now() - intervalo` resolve o rate limiting sem introduzir Redis/Upstash/KV. Mais lento que um rate limiter em memória, mas correto entre invocações serverless frias — e essa é exatamente a limitação que descartou a opção (a) no `roadmap.md`.

## Padrão do próprio projeto (consistência)

Todas as decisões acima seguem o padrão já estabelecido pelo código legado (`_reversa_sdd/code-analysis.md#Módulo: auth`, `#Módulo: api-backend`): criptografia nativa do Node sem biblioteca de terceiros (scrypt, HMAC-SHA256 já usados), queries SQL diretas via template tagged `sql\`...\`` (proteção automática contra injeção, RN-API-05), e nenhuma dependência de frontend. Esta feature não introduz nenhum padrão novo ao projeto — só estende o que já existe para cobrir o servidor.
