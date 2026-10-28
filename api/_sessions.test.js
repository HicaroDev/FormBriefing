import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, getSession, revokeSession } from './_sessions.js';

/** Fake mínimo do cliente `sql` (tagged template) do @neondatabase/serverless,
 * guardando as linhas de `sessions` em memória — evita precisar de banco
 * real para testar a lógica de revogação/expiração. */
function makeFakeSessionsSql() {
  const rows = [];
  return async function sql(strings, ...values) {
    const text = strings.join('?');
    if (text.includes('INSERT INTO sessions')) {
      const [id, tipo, sujeitoId, expiraEm] = values;
      rows.push({ id, tipo, sujeito_id: sujeitoId, expira_em: expiraEm, revogado_em: null });
      return [];
    }
    if (text.includes('SELECT') && text.includes('FROM sessions')) {
      const [id] = values;
      return rows.filter((r) => r.id === id);
    }
    if (text.includes('UPDATE sessions')) {
      const [id] = values;
      const row = rows.find((r) => r.id === id && !r.revogado_em);
      if (row) row.revogado_em = new Date();
      return [];
    }
    throw new Error('Query não suportada pelo fake: ' + text);
  };
}

test('sessão criada é válida imediatamente', async () => {
  const sql = makeFakeSessionsSql();
  const { id } = await createSession('admin', 'admin', 1000 * 60, sql);
  const session = await getSession(id, sql);
  assert.deepEqual(session, { id, tipo: 'admin', sujeitoId: 'admin' });
});

test('sessão revogada nunca é válida', async () => {
  const sql = makeFakeSessionsSql();
  const { id } = await createSession('admin', 'admin', 1000 * 60, sql);
  await revokeSession(id, sql);
  assert.equal(await getSession(id, sql), null);
});

test('sessão expirada nunca é válida', async () => {
  const sql = makeFakeSessionsSql();
  const { id } = await createSession('admin', 'admin', -1000, sql); // já no passado
  assert.equal(await getSession(id, sql), null);
});

test('sessão de cliente carrega o sujeitoId correto e nunca se confunde com outra', async () => {
  const sql = makeFakeSessionsSql();
  const a = await createSession('cliente', 'CLI-0001:INST-1', 1000 * 60, sql);
  const b = await createSession('cliente', 'CLI-0002:INST-2', 1000 * 60, sql);
  const sessionA = await getSession(a.id, sql);
  const sessionB = await getSession(b.id, sql);
  assert.equal(sessionA.sujeitoId, 'CLI-0001:INST-1');
  assert.equal(sessionB.sujeitoId, 'CLI-0002:INST-2');
  assert.notEqual(sessionA.sujeitoId, sessionB.sujeitoId);
});

test('sessão inexistente retorna null, não lança erro', async () => {
  const sql = makeFakeSessionsSql();
  assert.equal(await getSession('id-que-nao-existe', sql), null);
});
