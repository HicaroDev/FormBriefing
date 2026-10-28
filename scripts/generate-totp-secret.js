#!/usr/bin/env node
/**
 * Gera um segredo TOTP novo (Base32) para configurar o MFA do admin.
 *
 * Uso: node scripts/generate-totp-secret.js
 *
 * Cole a saída na variável de ambiente ADMIN_TOTP_SECRET na Vercel
 * (Settings > Environment Variables), depois adicione a chave manualmente
 * no Google Authenticator / Microsoft Authenticator ("inserir chave de
 * configuração" / "digitar código manualmente").
 */
import { generateSecret } from '../api/_totp.js';

const secret = generateSecret();

console.log('\nADMIN_TOTP_SECRET gerado:\n');
console.log(secret);
console.log('\n1. Configure esse valor na Vercel como ADMIN_TOTP_SECRET.');
console.log('2. No app autenticador, adicione uma conta nova e insira essa chave manualmente.');
console.log('3. Guarde esse valor num lugar seguro fora do sistema — não há como recuperá-lo depois.\n');
