import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecret, totpAt, verifyTotp, hotp } from './_totp.js';

test('HOTP corresponde aos vetores de teste oficiais da RFC 4226 (apêndice D)', () => {
  const secret = Buffer.from('12345678901234567890', 'ascii');
  const esperado = [
    '755224', '287082', '359152', '969429', '338314',
    '254676', '287922', '162583', '399871', '520489',
  ];
  esperado.forEach((codigo, contador) => {
    assert.equal(hotp(secret, contador), codigo);
  });
});

test('mesmo segredo e mesmo instante geram sempre o mesmo código', () => {
  const secret = generateSecret();
  const agora = Math.floor(Date.now() / 1000);
  assert.equal(totpAt(secret, agora), totpAt(secret, agora));
});

test('código correto do instante atual é aceito', () => {
  const secret = generateSecret();
  const agora = Math.floor(Date.now() / 1000);
  const codigo = totpAt(secret, agora);
  assert.equal(verifyTotp(secret, codigo), true);
});

test('código de 1 hora no futuro é rejeitado (fora da janela de tolerância)', () => {
  const secret = generateSecret();
  const agora = Math.floor(Date.now() / 1000);
  const codigoDistante = totpAt(secret, agora + 3600);
  assert.equal(verifyTotp(secret, codigoDistante, { window: 1 }), false);
});

test('código com formato inválido é sempre rejeitado', () => {
  const secret = generateSecret();
  assert.equal(verifyTotp(secret, 'abcdef'), false);
  assert.equal(verifyTotp(secret, '123'), false);
  assert.equal(verifyTotp(secret, ''), false);
  assert.equal(verifyTotp(secret, null), false);
});

test('generateSecret produz Base32 válido e de tamanho estável', () => {
  const secret = generateSecret();
  assert.match(secret, /^[A-Z2-7]+$/);
  assert.equal(secret.length, 32); // 160 bits / 5 bits por caractere Base32
});
