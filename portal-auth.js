/**
 * StudioIntake — Portal Authentication & Direct Link Resolver
 * 
 * Valida o código único do cliente (CLI-XXXX) ou PIN e redireciona para o formulário correto.
 */

import {
  getClients,
  getClientByCode,
  saveClients,
  fetchClientByCodeRemote
} from './store.js';

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get('code') || params.get('pin');
  const briefParam = params.get('brief') || params.get('id');

  // Se já veio com código e briefing na URL (link direto, ex: WhatsApp),
  // precisa estabelecer sessão no servidor ANTES de redirecionar — sem
  // isso, `form-engine.js` seria bloqueado pelo guard de autenticação
  // novo (RN-API-01) ao chamar api/clients e api/instances.
  if (codeParam && briefParam) {
    const langParam = params.get('lang');
    const langSuffix = langParam ? `&lang=${langParam}` : '';
    try {
      const res = await fetch('/api/client-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ codigo: codeParam, brief: briefParam })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.location.href = `client-form.html?code=${codeParam}&brief=${briefParam}${langSuffix}`;
        return;
      }
      // Link inválido/expirado — cai no fluxo normal de digitar o PIN em
      // vez de travar a página numa tela sem explicação.
    } catch (e) {
      // Erro de rede — mesma lógica: cai no fluxo normal de PIN.
    }
  }

  // Se veio apenas com código (sem brief), tenta personalizar o card de
  // boas-vindas. Sem sessão ainda, a busca remota (fetchClientByCodeRemote)
  // agora pode voltar vazia por falta de autenticação (RN-API-01) — nesse
  // caso só não personaliza o banner; o formulário de PIN continua funcional.
  if (codeParam) {
    const client = await resolveClientByCode(codeParam);
    if (client) {
      updateWelcomeBanner(client);
      prefillPinDigits(client.codigo_unico.replace('CLI-', ''));
    }
  }

  // Prepara inputs de PIN
  setupPinInputs();
});

/**
 * Busca o cliente localmente; se não encontrar (ex: dispositivo novo do
 * cliente, sem cache local), busca no banco remoto e guarda em cache.
 */
async function resolveClientByCode(code) {
  let client = getClientByCode(code);
  if (client) return client;

  client = await fetchClientByCodeRemote(code);
  if (client) {
    const clients = getClients();
    saveClients([client, ...clients.filter(c => c.id !== client.id)]);
  }
  return client;
}

function updateWelcomeBanner(client) {
  const banner = document.querySelector('span.font-label-md');
  if (banner) {
    banner.innerHTML = `Convite exclusivo: <strong class="font-semibold text-primary">StudioIntake</strong> para <strong class="font-semibold text-on-surface">${client.empresa}</strong>`;
  }

  const clientChip = document.querySelector('.bg-surface-container-low p.truncate');
  if (clientChip) {
    clientChip.innerHTML = `${client.empresa} <span class="text-secondary font-normal">• Cod: #${client.codigo_unico}</span>`;
  }
}

function prefillPinDigits(cleanCode) {
  const inputs = Array.from(document.querySelectorAll('.pin-input'));
  cleanCode.split('').forEach((digit, idx) => {
    if (inputs[idx]) inputs[idx].value = digit;
  });
}

function setupPinInputs() {
  const inputs = Array.from(document.querySelectorAll('.pin-input'));
  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = '';
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = pasted.replace(/[^0-9]/g, '').slice(0, inputs.length);
      digits.split('').forEach((d, i) => {
        if (inputs[i]) inputs[i].value = d;
      });
      const nextIdx = Math.min(digits.length, inputs.length - 1);
      inputs[nextIdx].focus();
    });
  });

  const form = document.getElementById('authForm');
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      handlePortalAccess();
    };
  }
}

async function handlePortalAccess() {
  const inputs = Array.from(document.querySelectorAll('.pin-input'));
  const digits = inputs.map(i => i.value).join('');
  const btn = document.getElementById('submitBtn');

  if (digits.length < 4) {
    alert('Por favor, informe ao menos os 4 dígitos do seu código de identificação.');
    return;
  }

  btn.innerHTML = `
    <span class="inline-block animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
    <span>Validando chave segura...</span>
  `;
  btn.disabled = true;

  // Validação agora acontece no servidor (RN-API-01 / RF-05, RF-06, RF-07):
  // correspondência exata, rate limiting, e emissão da sessão (cookie) que
  // as próximas chamadas de form-engine.js vão precisar.
  let data;
  try {
    const res = await fetch('/api/client-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ pin: digits })
    });
    data = await res.json();

    if (!res.ok || !data.ok) {
      btn.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">error</span>
        <span>Código não encontrado</span>
      `;
      btn.disabled = false;
      alert(data.error || 'Não encontramos um cadastro com esse código. Confira o código recebido ou entre em contato com a agência.');
      return;
    }
  } catch (err) {
    btn.innerHTML = `
      <span class="material-symbols-outlined text-[20px]">error</span>
      <span>Erro de conexão</span>
    `;
    btn.disabled = false;
    alert('Não foi possível validar o código agora. Tente novamente.');
    return;
  }

  btn.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">check_circle</span>
    <span>Acesso Autorizado! Redirecionando...</span>
  `;
  btn.classList.remove('bg-on-surface');
  btn.classList.add('bg-primary-container', 'text-white');

  setTimeout(() => {
    const langParam = new URLSearchParams(window.location.search).get('lang');
    const langSuffix = langParam ? `&lang=${langParam}` : '';
    window.location.href = `client-form.html?code=CLI-${digits.slice(0, 4)}&brief=${data.instanciaId}${langSuffix}`;
  }, 500);
}
