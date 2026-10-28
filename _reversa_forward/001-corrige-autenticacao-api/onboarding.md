# Onboarding — Testando a correção de autenticação pela primeira vez

> Gerado pelo `/reversa-plan`. Passo a passo para um humano validar a feature depois que o `/reversa-coding` implementar. Não é um guia de uso do produto — é um roteiro de teste manual.

## Pré-requisitos

1. Variável de ambiente `ADMIN_TOTP_SECRET` ainda **não** configurada (teste do fluxo de primeira configuração) — ou já configurada (teste do fluxo normal).
2. Acesso a um app TOTP (Google Authenticator ou Microsoft Authenticator) no celular.
3. Pelo menos um cliente real ou de teste com `codigo_unico` válido, para testar o fluxo de PIN sem afetar `Kalea`/`Carola` em produção.

## Passo a passo — primeira configuração do MFA (admin)

1. Acesse `login.html` sem `ADMIN_TOTP_SECRET` configurado → deve logar normalmente com e-mail/senha e mostrar aviso para configurar o MFA.
2. Gerar o segredo TOTP (fluxo exato definido no `/reversa-to-do`) → copiar a chave Base32 exibida.
3. Abrir o app autenticador → adicionar conta manualmente → colar a chave.
4. Confirmar que o código de 6 dígitos gerado pelo app é aceito pelo sistema ao configurar.
5. Guardar o código de recuperação exibido nesse momento (ver `roadmap.md#Riscos`) em local seguro, fora do sistema.
6. Deslogar e logar de novo → agora deve pedir e-mail/senha **e** o código do app.

## Passo a passo — acesso administrativo bloqueado sem sessão

1. Sem fazer login, rodar `curl https://<deploy>/api/clients` diretamente (sem cookie).
2. Esperado: `401`, corpo sem dados de cliente nenhum.
3. Repetir para `/api/instances`.
4. Logar normalmente, copiar o cookie de sessão emitido, repetir o `curl` com o cookie → esperado: `200` com os dados.
5. Fazer logout → repetir o `curl` com o MESMO cookie antigo → esperado: `401` (prova que a revogação é real, não só client-side).

## Passo a passo — acesso do cliente por PIN

1. Usar um código de cliente de teste (não `Kalea`/`Carola` em produção) em `portal.html` / `api/client-access.js`.
2. Informar o PIN correto → acesso liberado, sessão restrita àquele `cliente_id`/`instancia_id`.
3. Tentar, com essa sessão, acessar via API o registro de outro cliente → esperado: `403`.
4. Informar PIN errado repetidamente (acima do limite definido no `/reversa-to-do`) → esperado: bloqueio temporário, mesmo informando o PIN correto depois do limite.

## Passo a passo — regressão com clientes reais

1. Validar, com os códigos reais de `Kalea Pilates e Fisio` e `Carola` (nomes confirmados em `_reversa_sdd/domain.md#3. Arqueologia Git`), que o acesso ao briefing continua funcionando após a migração — preferencialmente em ambiente de preview da Vercel antes de ir para produção.
2. Confirmar que nenhuma das duas perde acesso durante a janela de migração descrita em `roadmap.md#Plano de Migração`.
