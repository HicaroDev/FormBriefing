import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarEstagio, montarClienteApartirDeLead, ESTAGIOS_PADRAO } from './_leads-rules.js';

test('validarEstagio aceita um estágio da lista configurada', () => {
  assert.equal(validarEstagio('proposta_enviada', ESTAGIOS_PADRAO), true);
});

test('validarEstagio rejeita estágio fora da lista configurada', () => {
  assert.equal(validarEstagio('estagio_inexistente', ESTAGIOS_PADRAO), false);
});

test('validarEstagio rejeita valores vazios/inválidos', () => {
  assert.equal(validarEstagio('', ESTAGIOS_PADRAO), false);
  assert.equal(validarEstagio(null, ESTAGIOS_PADRAO), false);
  assert.equal(validarEstagio(undefined, ESTAGIOS_PADRAO), false);
});

test('validarEstagio usa a lista configurável passada, não só o fallback', () => {
  const listaCustomizada = ['novo_estagio_criado_pelo_admin'];
  assert.equal(validarEstagio('novo_estagio_criado_pelo_admin', listaCustomizada), true);
  assert.equal(validarEstagio('novo_lead', listaCustomizada), false);
});

test('montarClienteApartirDeLead mapeia nome_contato para nome_responsavel', () => {
  const lead = { nome_contato: 'Ana Souza', empresa: 'Ana Studio', email: 'ana@exemplo.com', whatsapp: '11999999999' };
  const cliente = montarClienteApartirDeLead(lead);
  assert.equal(cliente.nome_responsavel, 'Ana Souza');
  assert.equal(cliente.empresa, 'Ana Studio');
  assert.equal(cliente.email, 'ana@exemplo.com');
  assert.equal(cliente.whatsapp, '11999999999');
});

test('montarClienteApartirDeLead nunca inclui score de IA ou campo decorativo', () => {
  const lead = { nome_contato: 'Bruno', empresa: 'Bruno LTDA', score_ia: 98, insight_ia: 'texto gerado' };
  const cliente = montarClienteApartirDeLead(lead);
  assert.equal('score_ia' in cliente, false);
  assert.equal('insight_ia' in cliente, false);
});

test('montarClienteApartirDeLead tolera campos opcionais ausentes', () => {
  const lead = { nome_contato: 'Carla', empresa: 'Carla ME' };
  const cliente = montarClienteApartirDeLead(lead);
  assert.equal(cliente.email, '');
  assert.equal(cliente.whatsapp, '');
  assert.equal(cliente.status_cliente, 'ativo');
});
