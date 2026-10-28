# Decisões de Arquitetura de Segurança — FormBriefing / Studio Suite 2.0

> Registrado em 2026-10-27, a partir das respostas do usuário (Hícaro) às 14 perguntas de `questions.md` + diretrizes técnicas detalhadas enviadas em seguida, via Telegram. Este documento consolida tudo que orienta a execução do `/reversa-forward`, especialmente a etapa de correção de RN-API-01 (ausência de autenticação no servidor). Nenhum código foi alterado ao gerar este arquivo — é só especificação.

## Diretriz geral do projeto

Desenvolver uma plataforma integrada, com arquitetura segura, modular e preparada para expansão, preservando as funcionalidades existentes e priorizando um MVP realmente operacional. Fluxo-alvo de longo prazo (não precisa estar completo neste MVP):

```
Lead → Cliente → Briefing → Proposta → Projeto → Entregáveis → Aprovação
```

## Autenticação e autorização (prioridade máxima — resolve RN-API-01)

1. Corrigir imediatamente a autenticação e autorização das rotas `/api/clients`, `/api/instances` e demais endpoints administrativos.
2. **Reaproveitar o mecanismo de autenticação existente** (hoje em `api/auth.js`/`portal-auth.js`) se ele atender aos requisitos de segurança — não criar um sistema de login paralelo.
3. Implementar **MFA administrativo obrigatório**, via TOTP, compatível com Google Authenticator e Microsoft Authenticator. Passkeys como evolução futura recomendada (não obrigatório no MVP).
4. Sessões seguras: cookies `HttpOnly`, `Secure`, `SameSite`, com expiração, revogação, proteção CSRF quando aplicável, e reautenticação exigida para operações críticas.
5. Separação clara de permissões entre administrador e cliente — toda autorização ocorre no **servidor**, incluindo verificação de propriedade de cada registro (um cliente nunca acessa dado de outro cliente, mesmo que forje o ID).
6. Acesso do cliente final continua via **código/PIN**: geração criptograficamente segura, armazenamento protegido (hash, não texto puro), limite de tentativas (anti brute-force), e sessão temporária restrita ao briefing/formulário autorizado. PIN nunca concede acesso administrativo nem a dados de outros clientes.
7. Rate limiting, validação de entradas, proteção contra injeção, tratamento seguro de erros, e gerenciamento de segredos em ambiente protegido (variáveis de ambiente do Vercel, nunca hardcoded).
8. Banco de dados (Neon Postgres) com privilégios mínimos, backups testados, criptografia adequada.
9. Logs de auditoria para login, alterações relevantes, aprovações e ações administrativas — **nunca registrar senhas, PINs ou tokens em log**.
10. Testes automatizados cobrindo autenticação, autorização, acesso indevido entre clientes, e proteção das rotas.

### Exigência explícita: auditoria antes de implementar

Antes de qualquer código de correção, o usuário pede que o `/reversa-forward` apresente:
- Stack tecnológica e biblioteca de autenticação existente.
- Mapa de rotas públicas vs. privadas.
- Vulnerabilidades identificadas, com severidade.
- Plano de correção por prioridade.
- Dependências e alterações necessárias.
- Testes que comprovem a segurança implementada.

**Restrição explícita:** não substituir a autenticação existente nem alterar o schema do banco sem justificar tecnicamente antes. A implementação do CRM/Lead/Projeto só começa depois da correção e validação dos problemas críticos de segurança (consistente com a Pergunta 3 de `questions.md`).

## Diretrizes gerais de implementação (válidas para todo o `/reversa-forward`, não só segurança)

1. Corrigir segurança e autenticação antes das demais funcionalidades.
2. Preservar dados, interfaces e funcionalidades já aprovadas.
3. Não implementar recursos fictícios ou exclusivamente decorativos (reforça a decisão da Pergunta 5 sobre o score de IA).
4. Evitar duplicação de código, tabelas e endpoints.
5. Usar migrações controladas para qualquer mudança no banco (nunca `DROP`/alteração destrutiva direta).
6. Aplicar autorização e validação sempre no backend, nunca confiar em checagem client-side.
7. Implementar testes funcionais e de segurança para cada entrega.
8. Organizar entregas por etapas, respeitando dependências (segurança → CRM/Lead → Projeto/Entregáveis).
9. Não implementar integrações externas pagas sem autorização explícita do usuário.
10. Antes de executar qualquer etapa, apresentar o plano técnico, identificar riscos e explicar impactos sobre o sistema existente — e esperar aprovação.

## Referência cruzada

Este documento detalha e fundamenta as Respostas 1, 2, 3, 12 e 13 em `questions.md`. Ver também `crm-funil/decisions.md` (Decisão 1 resolvida) e `gaps.md` (itens movidos para "Resolvido").
