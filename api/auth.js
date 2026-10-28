/**
 * StudioIntake — Autenticação do Dashboard da Agência
 *
 * POST { action: 'login', email, password }
 *   -> sem ADMIN_TOTP_SECRET configurado: { ok, expiry, mfaSetupRequired: true } + cookie de sessão
 *   -> com ADMIN_TOTP_SECRET configurado: { requiresTotp: true, loginTicket } | { error }
 * POST { action: 'verify-totp', loginTicket, code } -> { ok, expiry } + cookie de sessão | { error }
 * POST { action: 'logout' } -> { ok: true }, revoga a sessão e limpa o cookie
 * POST { action: 'verify' } -> { valid: boolean }, baseado na sessão (cookie), não mais num token autocontido
 *
 * Correção de RN-API-01/MFA: evolução do esquema anterior (token HMAC sem
 * estado) para sessão revogável em `sessions` + segundo fator (TOTP). Sem
 * banco de usuários — continua existindo um único admin (variáveis de
 * ambiente). Ver _reversa_forward/001-corrige-autenticacao-api/roadmap.md.
 */
import { scryptSync, timingSafeEqual, createHmac } from 'crypto';
import { jsonResponse } from './_db.js';
import { verifyTotp } from './_totp.js';
import { registerAttempt, isBlocked } from './_attempts.js';
import {
  createSession,
  revokeSession,
  resolveSessionFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
} from './_sessions.js';
import { logAction } from './_audit.js';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias, igual à duração anterior
const LOGIN_TICKET_DURATION_MS = 1000 * 60 * 5; // 5 minutos para completar o TOTP
const ADMIN_SUBJECT_ID = 'admin';

function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/[﻿​]/g, '').trim();
}

function signLoginTicket(expiry) {
  const secret = sanitize(process.env.SESSION_SECRET);
  const hmac = createHmac('sha256', secret).update(`ticket:${expiry}`).digest('hex');
  return `${expiry}.${hmac}`;
}

function verifyLoginTicket(ticket) {
  if (!ticket || typeof ticket !== 'string' || !ticket.includes('.')) return false;
  const [expiryStr, sig] = ticket.split('.');
  const expiry = Number(expiryStr);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;

  const expected = signLoginTicket(expiry).split('.')[1];
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

async function issueAdminSession(res) {
  const { expiraEm, id } = await createSession('admin', ADMIN_SUBJECT_ID, SESSION_DURATION_MS);
  res.setHeader('Set-Cookie', buildSessionCookie(id, SESSION_DURATION_MS));
  await logAction('admin', 'login');
  return expiraEm;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Método não permitido' });
  }

  const { action, email, password, code, loginTicket } = req.body || {};

  if (action === 'verify') {
    const session = await resolveSessionFromRequest(req);
    return jsonResponse(res, 200, { valid: !!session && session.tipo === 'admin' });
  }

  if (action === 'logout') {
    const session = await resolveSessionFromRequest(req);
    if (session) {
      await revokeSession(session.id);
      await logAction('admin', 'logout');
    }
    res.setHeader('Set-Cookie', buildClearSessionCookie());
    return jsonResponse(res, 200, { ok: true });
  }

  if (action === 'login') {
    const adminEmail = sanitize(process.env.ADMIN_EMAIL);
    if (!email || !password || !adminEmail) {
      return jsonResponse(res, 400, { error: 'E-mail e senha são obrigatórios.' });
    }

    const identificador = adminEmail.toLowerCase();
    if (await isBlocked(identificador, 'login_admin')) {
      return jsonResponse(res, 429, { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
    }

    const emailOk = String(email).trim().toLowerCase() === identificador;
    const passwordOk = verifyPassword(password);
    const credentialsOk = emailOk && passwordOk;

    await registerAttempt(identificador, 'login_admin', credentialsOk);

    if (!credentialsOk) {
      return jsonResponse(res, 401, { error: 'E-mail ou senha incorretos.' });
    }

    const totpSecret = sanitize(process.env.ADMIN_TOTP_SECRET);

    if (!totpSecret) {
      // Migração: MFA ainda não configurado neste ambiente — mantém acesso
      // direto, mas avisa o front-end para orientar a configuração.
      const expiraEm = await issueAdminSession(res);
      return jsonResponse(res, 200, { ok: true, expiry: expiraEm, mfaSetupRequired: true });
    }

    const expiry = Date.now() + LOGIN_TICKET_DURATION_MS;
    return jsonResponse(res, 200, { requiresTotp: true, loginTicket: signLoginTicket(expiry) });
  }

  if (action === 'verify-totp') {
    const totpSecret = sanitize(process.env.ADMIN_TOTP_SECRET);
    if (!totpSecret || !verifyLoginTicket(loginTicket)) {
      return jsonResponse(res, 401, { error: 'Sessão de login inválida ou expirada, comece de novo.' });
    }

    if (await isBlocked(ADMIN_SUBJECT_ID, 'login_admin_totp')) {
      return jsonResponse(res, 429, { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
    }

    const valid = verifyTotp(totpSecret, code);
    await registerAttempt(ADMIN_SUBJECT_ID, 'login_admin_totp', valid);

    if (!valid) {
      return jsonResponse(res, 401, { error: 'Código inválido.' });
    }

    const expiraEm = await issueAdminSession(res);
    return jsonResponse(res, 200, { ok: true, expiry: expiraEm });
  }

  return jsonResponse(res, 400, { error: 'Ação inválida.' });
}
