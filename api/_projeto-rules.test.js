import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarFase, validarHoras, FASES_PADRAO } from './_projeto-rules.js';

test('validarFase aceita uma fase da lista configurada', () => {
  assert.equal(validarFase('criacao', FASES_PADRAO), true);
});

test('validarFase rejeita fase fora da lista configurada', () => {
  assert.equal(validarFase('fase_inexistente', FASES_PADRAO), false);
});

test('validarFase rejeita valores vazios/inválidos', () => {
  assert.equal(validarFase('', FASES_PADRAO), false);
  assert.equal(validarFase(null, FASES_PADRAO), false);
  assert.equal(validarFase(undefined, FASES_PADRAO), false);
});

test('validarHoras aceita números positivos', () => {
  assert.equal(validarHoras(5), true);
  assert.equal(validarHoras('2.5'), true);
});

test('validarHoras rejeita zero, negativos e não-numéricos', () => {
  assert.equal(validarHoras(0), false);
  assert.equal(validarHoras(-3), false);
  assert.equal(validarHoras('abc'), false);
  assert.equal(validarHoras(null), false);
  assert.equal(validarHoras(undefined), false);
  assert.equal(validarHoras(NaN), false);
});
