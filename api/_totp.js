/**
 * StudioIntake — TOTP (RFC 6238) implementado com `crypto` nativo do Node.
 *
 * Sem dependência externa (otplib/speakeasy): HMAC-SHA1 sobre um contador de
 * tempo (passo de 30s), truncamento dinâmico (RFC 4226), código de 6 dígitos.
 * Compatível com Google Authenticator e Microsoft Authenticator (ambos
 * seguem a mesma RFC). Segredo em Base32, como os apps esperam.
 *
 * Decisão registrada em
 * _reversa_forward/001-corrige-autenticacao-api/requirements.md (Esclarecimentos).
 */
import { createHmac, randomBytes } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder > 0) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(base32) {
  const clean = String(base32).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of clean) {
    const value = BASE32_ALPHABET.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** RFC 4226 HOTP. Exportado (além de uso interno) para permitir testar
 * contra os vetores de teste oficiais da RFC sem precisar de Base32. */
export function hotp(secretBuffer, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const truncated =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(truncated % 10 ** DIGITS).padStart(DIGITS, '0');
}

export function generateSecret() {
  return base32Encode(randomBytes(20)); // 160 bits, recomendado pela RFC
}

export function totpAt(secret, unixSeconds) {
  const counter = Math.floor(unixSeconds / STEP_SECONDS);
  return hotp(base32Decode(secret), counter);
}

/** window=1 aceita o código do passo atual e de ±1 passo (±30s) de
 * tolerância a relógio dessincronizado. */
export function verifyTotp(secret, code, { window = 1 } = {}) {
  if (!secret || !code || typeof code !== 'string') return false;
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode)) return false;

  const now = Math.floor(Date.now() / 1000);
  for (let offset = -window; offset <= window; offset++) {
    const candidate = totpAt(secret, now + offset * STEP_SECONDS);
    if (candidate === normalizedCode) return true;
  }
  return false;
}
