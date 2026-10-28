/**
 * StudioIntake — Regras puras do cadastro de Projeto (MVP)
 *
 * Extraídas de `api/projetos.js` para serem testáveis sem fakes de SQL —
 * mesmo padrão de `api/_leads-rules.js` (feature 002). Ver _projeto-rules.test.js.
 */

export const FASES_PADRAO = [
  'briefing_aprovado',
  'imersao_conceito',
  'criacao',
  'revisao_cliente',
  'ajustes_finais',
  'entregue'
];

export function validarFase(fase, fasesValidas = FASES_PADRAO) {
  if (typeof fase !== 'string' || !fase) return false;
  return fasesValidas.includes(fase);
}

/** Horas apontadas precisam ser um número finito e estritamente positivo —
 * nunca aceitar zero/negativo/NaN, que corromperia consumed_hours. */
export function validarHoras(horas) {
  const n = Number(horas);
  return Number.isFinite(n) && n > 0;
}
