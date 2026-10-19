/**
 * StudioIntake — Conexão Serverless com o Postgres (Neon / Vercel Postgres)
 *
 * Resolve a connection string a partir das variáveis de ambiente que a
 * integração de banco da Vercel injeta automaticamente no projeto.
 * Tenta os nomes mais comuns, nessa ordem, para funcionar tanto com a
 * integração nativa Neon quanto com o antigo Vercel Postgres.
 */
import { neon } from '@neondatabase/serverless';

function sanitize(str) {
  if (!str) return str;
  // Remove BOM e espaços/quebras de linha que podem ter entrado ao colar a
  // connection string em um terminal Windows (PowerShell injeta ﻿).
  return str.replace(/[﻿​]/g, '').trim();
}

function resolveConnectionString() {
  return sanitize(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

let sqlClient = null;

export function getSql() {
  if (sqlClient) return sqlClient;
  const connStr = resolveConnectionString();
  if (!connStr) {
    throw new Error(
      'Nenhuma connection string de banco encontrada nas variáveis de ambiente (DATABASE_URL / POSTGRES_URL). Verifique se o banco está conectado ao projeto na Vercel.'
    );
  }
  sqlClient = neon(connStr);
  return sqlClient;
}

export function jsonResponse(res, status, body) {
  res.status(status).json(body);
}
