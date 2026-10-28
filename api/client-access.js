/**
 * StudioIntake — Acesso do cliente final (PIN ou deep link) à própria sessão
 *
 * POST { pin } -> { ok, clienteId, instanciaId } + cookie de sessão | { error }
 * POST { codigo, brief } -> idem, para o fluxo de link direto (WhatsApp)
 *
 * No sistema real (diferente do mockup), não existe um "PIN" separado do
 * código do cliente: o usuário digita os dígitos, e o sistema monta
 * `CLI-<dígitos>` e resolve o cliente por esse código — ver
 * _reversa_sdd/domain.md#1. Glossário e
 * _reversa_sdd/code-analysis.md#Módulo: auth (fluxo `portal-auth.js`).
 *
 * Antes desta feature, essa resolução acontecia no CLIENTE chamando
 * `GET /api/clients?code=` direto, sem rate limit, e com um fallback de
 * busca por `includes()` nos dois sentidos que podia casar PIN parcial com
 * o código de outro cliente (RN-AUTH-04). Este endpoint move a resolução
 * para o servidor, com correspondência sempre EXATA (RF-07) e rate limiting
 * (RF-06). Nunca revela se o problema foi o código não existir, o PIN estar
 * errado, ou o briefing não pertencer ao código (mantém o espírito de
 * RN-INTAKE-01, zero-leakage).
 *
 * O fluxo de deep link (`?code=...&brief=...` na URL, usado em links
 * compartilhados por WhatsApp) também precisa estabelecer sessão aqui antes
 * de abrir `client-form.html` — senão as chamadas de `api/instances`/
 * `api/clients` feitas por `form-engine.js` seriam bloqueadas pelo guard
 * novo (RN-API-01). Ver `portal-auth.js`.
 *
 * Ver _reversa_forward/001-corrige-autenticacao-api/interfaces/client-access.md.
 */
import { getSql, jsonResponse } from './_db.js';
import { registerAttempt, isBlocked } from './_attempts.js';
import { createSession, buildSessionCookie } from './_sessions.js';
import { logAction } from './_audit.js';

const CLIENT_SESSION_DURATION_MS = 1000 * 60 * 60 * 6; // 6 horas — sessão de preenchimento de briefing

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Método não permitido' });
  }

  try {
    const { pin, codigo, brief } = req.body || {};

    let codigoFormatado;
    if (pin) {
      const digitos = String(pin).replace(/\D/g, '');
      if (digitos.length < 4) {
        return jsonResponse(res, 400, { error: 'Informe o PIN completo.' });
      }
      codigoFormatado = `CLI-${digitos}`;
    } else if (codigo) {
      codigoFormatado = String(codigo).trim().toUpperCase();
    } else {
      return jsonResponse(res, 400, { error: 'Informe o PIN ou o código de acesso.' });
    }

    if (await isBlocked(codigoFormatado, 'pin_cliente')) {
      return jsonResponse(res, 429, { error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
    }

    const sql = getSql();

    // Correspondência EXATA (RF-07) — sem o fallback por includes() nos dois
    // sentidos que o fluxo antigo tinha (RN-AUTH-04).
    const clienteRows = await sql`
      SELECT * FROM clientes WHERE UPPER(codigo_unico) = UPPER(${codigoFormatado}) LIMIT 1
    `;
    const cliente = clienteRows[0];
    const credencialOk = !!cliente;

    await registerAttempt(codigoFormatado, 'pin_cliente', credencialOk);

    if (!credencialOk) {
      // Mensagem genérica — nunca revela se o código existe ou não.
      return jsonResponse(res, 401, { error: 'Código ou PIN inválido.' });
    }

    let instancia;
    if (brief) {
      // Deep link: o briefing já vem especificado — confirma que pertence
      // mesmo a este cliente (nunca confia só no par de IDs da URL).
      const instanciaRows = await sql`
        SELECT * FROM instancias_briefing WHERE id = ${brief} AND cliente_id = ${cliente.id} LIMIT 1
      `;
      instancia = instanciaRows[0];
      if (!instancia) {
        return jsonResponse(res, 401, { error: 'Código ou link inválido.' });
      }
    } else {
      // PIN sem brief: mesma regra de hoje (RN-AUTH-03, fora do escopo desta
      // feature) — usa o primeiro briefing encontrado para o cliente.
      const instanciaRows = await sql`
        SELECT * FROM instancias_briefing WHERE cliente_id = ${cliente.id} ORDER BY criado_em DESC LIMIT 1
      `;
      instancia = instanciaRows[0];
      if (!instancia) {
        return jsonResponse(res, 404, { error: 'Nenhum briefing pendente para este código.' });
      }
    }

    const sujeitoId = `${cliente.id}:${instancia.id}`;
    const { id: sessionId } = await createSession('cliente', sujeitoId, CLIENT_SESSION_DURATION_MS);
    res.setHeader('Set-Cookie', buildSessionCookie(sessionId, CLIENT_SESSION_DURATION_MS));
    await logAction(cliente.id, 'cliente.acesso', 'instancia', instancia.id);

    return jsonResponse(res, 200, { ok: true, clienteId: cliente.id, instanciaId: instancia.id });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}
