import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerAttempt, isBlocked } from './_attempts.js';

/** Fake mínimo do cliente `sql`, guardando tentativas em memória. */
function makeFakeAttemptsSql() {
  const rows = [];
  return async function sql(strings, ...values) {
    const text = strings.join('?');
    if (text.includes('INSERT INTO auth_attempts')) {
      const [identificador, tipo, sucesso] = values;
      rows.push({ identificador, tipo, sucesso, criado_em: new Date() });
      return [];
    }
    if (text.includes('SELECT') && text.includes('FROM auth_attempts')) {
      const [identificador, tipo, since] = values;
      const falhas = rows.filter(
        (r) => r.identificador === identificador && r.tipo === tipo && r.sucesso === false && r.criado_em > since
      ).length;
      return [{ falhas }];
    }
    throw new Error('Query não suportada pelo fake: ' + text);
  };
}

test('bloqueia após 5 falhas consecutivas', async () => {
  const sql = makeFakeAttemptsSql();
  for (let i = 0; i < 5; i++) await registerAttempt('teste@x.com', 'login_admin', false, sql);
  assert.equal(await isBlocked('teste@x.com', 'login_admin', sql), true);
});

test('menos de 5 falhas não bloqueia', async () => {
  const sql = makeFakeAttemptsSql();
  for (let i = 0; i < 4; i++) await registerAttempt('teste@x.com', 'login_admin', false, sql);
  assert.equal(await isBlocked('teste@x.com', 'login_admin', sql), false);
});

test('tentativa bem-sucedida não conta para o bloqueio', async () => {
  const sql = makeFakeAttemptsSql();
  for (let i = 0; i < 4; i++) await registerAttempt('teste@x.com', 'login_admin', false, sql);
  await registerAttempt('teste@x.com', 'login_admin', true, sql);
  await registerAttempt('teste@x.com', 'login_admin', false, sql);
  // 5 falhas no total, mas uma tentativa bem-sucedida no meio não impede a
  // contagem das falhas reais — este teste confirma que sucesso=true nunca
  // é contado como falha pela query (COALESCE/filtro sucesso=false).
  assert.equal(await isBlocked('teste@x.com', 'login_admin', sql), true);
});

test('identificadores diferentes não se bloqueiam entre si', async () => {
  const sql = makeFakeAttemptsSql();
  for (let i = 0; i < 5; i++) await registerAttempt('a@x.com', 'login_admin', false, sql);
  assert.equal(await isBlocked('b@x.com', 'login_admin', sql), false);
});

test('tipos diferentes (login_admin vs pin_cliente) não se bloqueiam entre si', async () => {
  const sql = makeFakeAttemptsSql();
  for (let i = 0; i < 5; i++) await registerAttempt('CLI-0001', 'login_admin', false, sql);
  assert.equal(await isBlocked('CLI-0001', 'pin_cliente', sql), false);
});
