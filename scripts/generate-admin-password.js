#!/usr/bin/env node
/**
 * Gera um par salt/hash novo para resetar a senha do admin (scrypt).
 *
 * Uso: node scripts/generate-admin-password.js "SuaNovaSenhaAqui"
 *
 * Cole os dois valores gerados nas variáveis de ambiente da Vercel
 * (Settings > Environment Variables): ADMIN_PASSWORD_SALT e
 * ADMIN_PASSWORD_HASH. Depois faça um redeploy (ou aguarde o próximo
 * deploy) para a Vercel carregar os novos valores. A senha em si nunca
 * é salva em nenhum lugar — só o hash.
 */
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('\nUso: node scripts/generate-admin-password.js "SuaNovaSenhaAqui"\n');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');

console.log('\nNovo par gerado para a senha informada:\n');
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\n1. Configure os dois valores acima na Vercel (Settings > Environment Variables).');
console.log('2. Confirme também o valor de ADMIN_EMAIL lá, se também não lembrar qual é.');
console.log('3. Redeploy o projeto para os novos valores entrarem em vigor.');
console.log('4. Guarde a senha nova num lugar seguro — este script não a salva em nenhum lugar.\n');
