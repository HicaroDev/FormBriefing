/**
 * StudioIntake — Autenticação do Dashboard da Agência
 *
 * POST { action: 'login', email, password } -> { token } | { error }
 * POST { action: 'verify', token } -> { valid: boolean }
 *
 * Sessão: token = "<expiry_ms>.<hmac_hex>", assinado com SESSION_SECRET.
 * Sem banco de usuários — hoje existe um único admin (variáveis de ambiente).
 */
import { scryptSync, timingSafeEqual, createHmac } from 'crypto';
import { jsonResponse } from './_db.js';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/[﻿​]/g, '').trim();
}

function signToken(expiry) {
  const secret = sanitize(process.env.SESSION_SECRET);
  const hmac = createHmac('sha256', secret).update(String(expiry)).digest('hex');
  return `${expiry}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [expiryStr, sig] = token.split('.');
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;

  const expected = signToken(expiry).split('.')[1];
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function verifyPassword(password) {
  const salt = sanitize(process.env.ADMIN_PASSWORD_SALT);
  const expectedHash = sanitize(process.env.ADMIN_PASSWORD_HASH);
  if (!salt || !expectedHash) return false;

  const hash = scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const { action, email, password, token } = req.body || {};

  if (action === 'verify') {
    return jsonResponse(res, 200, { valid: verifyToken(token) });
  }

  if (action === 'login') {
    const adminEmail = sanitize(process.env.ADMIN_EMAIL);
    if (!email || !password || !adminEmail) {
      return jsonResponse(res, 400, { error: 'E-mail e senha são obrigatórios.' });
    }

    const emailOk = String(email).trim().toLowerCase() === adminEmail.toLowerCase();
    const passwordOk = verifyPassword(password);

    if (!emailOk || !passwordOk) {
      return jsonResponse(res, 401, { error: 'E-mail ou senha incorretos.' });
    }

    const expiry = Date.now() + SESSION_DURATION_MS;
    return jsonResponse(res, 200, { token: signToken(expiry), expiry });
  }

  return jsonResponse(res, 400, { error: 'Ação inválida.' });
}
