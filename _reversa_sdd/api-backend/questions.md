# api-backend, Perguntas para o usuário

1. Para a correção de RN-API-01: você prefere reusar o mesmo token HMAC do admin (simples, mas não distingue "admin" de "cliente"), ou vale a pena introduzir um esquema de token com claims (ex: JWT) para diferenciar os dois papéis na própria API?
2. O cliente final também chama `/api/clients`/`/api/instances` diretamente (hoje sem token nenhum) — a correção de autenticação precisa continuar permitindo o acesso do cliente por código único, só bloqueando listagem completa e escrita fora do próprio registro. Confirma esse recorte?
3. Prioridade: corrigir a autenticação (T-01) antes ou depois de decidir sobre `Lead`/`Projeto`? Recomendação do Architect: antes, para não repetir a mesma falha em rotas novas.
