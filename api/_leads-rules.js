/**
 * StudioIntake — Regras puras do funil de Lead/Deal
 *
 * Funções sem acesso a banco, extraídas de `api/leads.js` para serem
 * testáveis sem fakes de SQL — ver _leads-rules.test.js. `api/leads.js`
 * continua sem teste unitário dedicado, igual `clients.js`/`instances.js`
 * (validado manualmente via onboarding.md), consistente com o padrão já
 * adotado na feature 001 (_reversa_forward/001-corrige-autenticacao-api).
 */

/** Fallback só usado se `lead_estagios` ainda não tiver sido lida do banco
 * (ex.: validação antes da primeira consulta); a tabela é a fonte de verdade. */
export const ESTAGIOS_PADRAO = [
  'novo_lead',
  'briefing_enviado',
  'briefing_recebido',
  'proposta_enviada',
  'fechado',
  'perdido'
];

export function validarEstagio(estagio, estagiosValidos = ESTAGIOS_PADRAO) {
  if (typeof estagio !== 'string' || !estagio) return false;
  return estagiosValidos.includes(estagio);
}

/** Monta o payload de criação de `Cliente` a partir de um `Lead`, para a
 * ação de conversão (RF-04). Nunca inclui score de IA ou qualquer campo
 * decorativo (RF-06) — só os campos que `clientes` de fato possui. */
export function montarClienteApartirDeLead(lead) {
  return {
    nome_responsavel: lead.nome_contato || '',
    empresa: lead.empresa || '',
    email: lead.email || '',
    whatsapp: lead.whatsapp || '',
    vertical: 'universal',
    status_cliente: 'ativo'
  };
}
