# Como liberar o `/reversa-coding` desta feature

> Isso só precisa ser feito uma vez por projeto (não por feature). Pode ser feito quando você quiser — não trava nada enquanto não for feito, eu só não avanço pro código real até você confirmar.

## O que fazer

1. Criar o arquivo `.reversa/reversa-config.json` na raiz do projeto (`C:\DEV\FormBriefing\.reversa\reversa-config.json`).
2. Colar exatamente este conteúdo:

```json
{
  "version": 1,
  "allowLegacyEdits": true,
  "allowedPaths": [
    "api/**",
    "scripts/**",
    "package.json",
    "dashboard.js",
    "portal-auth.js",
    "login.html",
    "README.md"
  ]
}
```

3. Salvar.
4. Me avisar (aqui no Telegram mesmo: "pode seguir" ou "feito") que eu continuo com `/reversa-coding`.

## Por que isso existe

É uma trava de segurança do próprio framework Reversa (regra do `C:\DEV\CLAUDE.md` deste projeto): por padrão, nenhum arquivo do seu código real pode ser criado/editado/apagado pelo Reversa sem essa liberação explícita sua. Eu não posso criar nem editar esse arquivo por conta própria — é proposital, pra garantir que você sempre aprova antes de qualquer mudança em código de produção.

## Não precisa ser agora

Pode ser feito quando você estiver no computador, sem pressa. Enquanto isso não existir, eu só trabalho dentro de `.reversa/`, `_reversa_sdd/` e `_reversa_forward/` (documentação e planejamento) — nada no seu app real é tocado.
