# api-backend

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Funções serverless Vercel expondo CRUD sobre `clientes` e `instancias_briefing` via `@neondatabase/serverless`.

## Responsabilidades
- Resolver conexão com o Postgres (Neon) de forma resiliente a variações de nome de env var e BOM.
- CRUD de `Cliente` e `BriefingInstance` com queries parametrizadas.

## Regras de Negócio
- RN-API-01 (SEVERIDADE ALTA): nenhum handler verifica autenticação no servidor. 🟢
- RN-API-02: `POST` com `id` existente faz upsert silencioso. 🟢
- RN-API-03: `ON CONFLICT DO UPDATE` de `POST /api/instances` só atualiza 3 colunas, ignorando outras enviadas. 🔴
- RN-API-04: `DELETE` de instância não limpa `clientes.briefings_ids` correspondente. 🔴
- RN-API-05: todas as queries usam SQL parametrizado (tagged template), sem risco de injection. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Resolver connection string entre múltiplos nomes de env var possíveis | Must | `getSql()` tenta as 5 variações documentadas, lança erro claro se nenhuma |
| RF-02 | CRUD completo de `Cliente` (GET por código/id/todos, POST, PATCH) | Must | `clients.js` cobre os 3 verbos |
| RF-03 | CRUD completo de `BriefingInstance` (GET por id/cliente/todos, POST, PATCH, DELETE) | Must | `instances.js` cobre os 4 verbos |
| RF-04 | **Exigir autenticação de admin em toda escrita e leitura de listagem completa** | Must (NOVO — não implementado hoje) | Requisição sem sessão válida retorna 401 |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Ausência de autenticação no servidor (gap, não requisito desejado) | `api/clients.js`, `api/instances.js` | 🟢 |
| Segurança | SQL parametrizado em 100% das queries | `api/clients.js`, `api/instances.js` | 🟢 |
| Disponibilidade | Erro de conexão lança mensagem explícita, não falha silenciosa | `api/_db.js` (`getSql`) | 🟢 |

## Critérios de Aceitação

```gherkin
Dado uma requisição GET /api/clients sem nenhum token de sessão
Quando o endpoint é chamado hoje
Então retorna a lista completa de clientes (comportamento atual — FALHA DE SEGURANÇA, ver RN-API-01)

Dado a correção de RF-04 implementada
Quando a mesma requisição é feita sem sessão válida
Então retorna 401 sem expor nenhum dado

Dado um POST /api/instances para um id já existente
Quando a requisição é enviada
Então apenas etapa_nome/status/atualizado_em são atualizados (comportamento atual, RN-API-03) — usar PATCH para atualização completa
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Autenticação no servidor (RF-04) | **Must** | Maior dívida de segurança identificada em toda a análise |
| CRUD básico (RF-02/RF-03) | Must | Já funcional, só precisa de reimplementação fiel |
| Corrigir upsert parcial de `POST /api/instances` (RN-API-03) | Should | Risco latente, sem caller conhecido hoje |
| Limpar `briefings_ids` órfão no DELETE (RN-API-04) | Could | Inconsistência de dado secundário, não bloqueia operação |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `api/_db.js` | `getSql`, `resolveConnectionString`, `sanitize` | 🟢 |
| `api/clients.js` | `handler`, `rowToClient` | 🟢 |
| `api/instances.js` | `handler`, `rowToInstance` | 🟢 |
