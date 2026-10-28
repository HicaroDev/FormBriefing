# api-backend, Tarefas de Implementação

## Pré-requisitos
- [ ] `auth` disponível (`verifyToken`) para a tarefa T-01
- [ ] Variáveis de ambiente do Neon configuradas e sanitizadas

## Tarefas

- [ ] T-01, **Adicionar verificação de sessão em `clients.js` e `instances.js`** (resolve RN-API-01)
  - Origem no legado: ausência confirmada em `api/clients.js`, `api/instances.js`
  - Critério de pronto: requisição sem header de auth válido retorna 401 antes de tocar o banco
  - Confiança: 🔴 (lacuna de segurança, prioridade máxima)

- [ ] T-02, Reimplementar `getSql()` com resolução de múltiplas env vars + sanitização de BOM
  - Origem no legado: `api/_db.js:11-41`
  - Critério de pronto: funciona com qualquer uma das 5 variações de nome de env var
  - Confiança: 🟢

- [ ] T-03, Reimplementar CRUD de `Cliente` (GET/POST/PATCH)
  - Origem no legado: `api/clients.js`
  - Critério de pronto: paridade de comportamento, incluindo upsert em POST
  - Confiança: 🟢

- [ ] T-04, Reimplementar CRUD de `BriefingInstance` (GET/POST/PATCH/DELETE)
  - Origem no legado: `api/instances.js`
  - Critério de pronto: paridade de comportamento
  - Confiança: 🟢

- [ ] T-05, Corrigir `ON CONFLICT DO UPDATE` de `POST /api/instances` para cobrir todos os campos (RN-API-03)
  - Origem no legado: `api/instances.js:58-61`
  - Critério de pronto: POST em id existente atualiza todos os campos enviados, não só 3
  - Confiança: 🔴

- [ ] T-06, Limpar `clientes.briefings_ids` ao deletar uma instância (RN-API-04)
  - Origem no legado: `api/instances.js:83-88`
  - Critério de pronto: DELETE de instância remove o id correspondente do array no cliente
  - Confiança: 🔴

## Tarefas de Teste

- [ ] TT-01, Requisição sem sessão válida retorna 401 em todos os verbos de escrita e na listagem completa (após T-01)
- [ ] TT-02, SQL injection tentada em qualquer campo de entrada não afeta a query (regressão de RN-API-05)
- [ ] TT-03, POST em id existente não perde dados de campos não cobertos pelo ON CONFLICT (após T-05)

## Ordem Sugerida
1. **T-01 primeiro, antes de qualquer outra feature de API nova** (inclusive antes de qualquer rota de `Lead`/`Projeto`).
2. T-02 é pré-requisito técnico de T-03/T-04.
3. T-05/T-06 são independentes, podem ser feitas em paralelo após T-03/T-04.

## Lacunas Pendentes (🔴)
- Rate limiting — não existe hoje em nenhuma rota.
- Ver `questions.md` desta unit para a estratégia de autenticação a adotar.
