/**
 * StudioIntake — Agency Dashboard Controller
 * 
 * Conecta o dashboard às entidades e métodos do store.js:
 * - Renderiza tabela dinâmica de briefings e métricas operacionais
 * - Inspetor lateral com dados reais do briefing selecionado
 * - Modal de Cadastro de Cliente com geração automática de CLI-XXXX
 * - Disparo de novo briefing com link seguro e mensagem formatada para WhatsApp
 * - Exportação de Resumo Executivo em Markdown
 */

import {
  getClients,
  getClientById,
  getClientByCode,
  createClient,
  getTemplates,
  getTemplateById,
  getBriefingInstances,
  getBriefingInstanceById,
  createBriefingInstance,
  updateBriefingStatus,
  getDigests,
  getDigestByBriefingId,
  saveDigest,
  generateProductionDigest,
  getMetrics,
  generateClientCode,
  generateWhatsAppMessage,
  exportDigestToMarkdown,
  resetStorageToSeed,
  syncClientRemote,
  syncInstanceRemote,
  syncAllFromRemote,
  patchInstanceRemote
} from './store.js';

import {
  generateTemplateFromPrompt,
  AI_PRESETS,
  generateAISynthesis
} from './ai-briefing-generator.js';

let currentFilter = 'all';
let currentView = 'briefs'; // 'briefs' ou 'clients'
let selectedBriefId = null;
let searchQuery = '';
let currentInspectorTab = 'digest'; // 'digest' ou 'raw'
let lastInstancesHash = '';

// ============================================================================
// INICIALIZAÇÃO DO DASHBOARD
// ============================================================================

// ============================================================================
// AUTENTICAÇÃO DO DASHBOARD
// ============================================================================

async function requireAuth() {
  const token = localStorage.getItem('studiointake_admin_token');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token })
    });
    const data = await res.json();
    if (!data.valid) {
      localStorage.removeItem('studiointake_admin_token');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  } catch (e) {
    // Falha de rede: não derruba a sessão, apenas segue (evita travar o
    // dashboard offline por causa de uma checagem de auth que falhou).
    return true;
  }
}

function setupLogout() {
  const btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', () => {
      localStorage.removeItem('studiointake_admin_token');
      window.location.href = 'login.html';
    });
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const authorized = await requireAuth();
    if (!authorized) return;
    setupLogout();

    renderMetrics();
    renderDistribution();
    renderRecentActivity();
    setupEventListeners();
    setupModal();
    setupAdjustmentsModal();
    setupAIGeneratorModal();
    checkHashRoute();

    // Seleciona o primeiro briefing por padrão se houver
    const instances = getBriefingInstances();
    if (instances.length > 0) {
      selectBrief(instances[0].id);
    } else {
      renderEmptyInspectorState();
    }

    window.addEventListener('hashchange', checkHashRoute);

    // Sincronização em tempo real (Fase 5.1)
    window.addEventListener('storage', (e) => {
      refreshDashboardData();
    });
    window.addEventListener('studiointake:update', () => {
      refreshDashboardData();
    });
    setInterval(() => {
      const latest = getBriefingInstances();
      const hash = JSON.stringify(latest.map(i => ({ id: i.id, status: i.status, resp: Object.keys(i.respostas_brutas || {}).length })));
      if (hash !== lastInstancesHash) {
        lastInstancesHash = hash;
        refreshDashboardData();
      }
    }, 3500);

    // Sincroniza com o banco remoto (pega respostas de clientes em outros dispositivos)
    syncAllFromRemote().then(refreshDashboardData);
    setInterval(() => {
      syncAllFromRemote().then(refreshDashboardData);
    }, 10000);
  });
}

export function refreshDashboardData() {
  renderMetrics();
  renderDistribution();
  renderRecentActivity();
  renderTable();
  if (selectedBriefId) {
    selectBrief(selectedBriefId, false);
  } else if (getBriefingInstances().length === 0) {
    renderEmptyInspectorState();
  }
}

function checkHashRoute() {
  if (window.location.hash === '#clients' || window.location.hash === '#crm') {
    currentView = 'clients';
    resetPillStyles();
    const btnCrm = document.getElementById('tab-clients-crm');
    if (btnCrm) {
      btnCrm.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-on-primary transition-colors whitespace-nowrap flex items-center gap-1 shadow-xs';
    }
  } else {
    currentView = 'briefs';
  }
  renderTable();
}

// ============================================================================
// MÉTRICAS & DISTRIBUIÇÃO
// ============================================================================

function renderMetrics() {
  const metrics = getMetrics();
  
  // Atualiza contadores no DOM se existirem
  const metricTotal = document.getElementById('metric-total');
  const metricReview = document.getElementById('metric-review');
  const metricReady = document.getElementById('metric-ready');
  const metricDrafts = document.getElementById('metric-drafts');

  if (metricTotal) metricTotal.textContent = metrics.total;
  if (metricReview) metricReview.textContent = metrics.review;
  if (metricReady) metricReady.textContent = metrics.ready;
  if (metricDrafts) metricDrafts.textContent = metrics.drafts;

  renderCalculatedMetrics();
  updateFormsMenuCounts();
}

/** Calcula SLA médio, tempo de descoberta e clientes ativos a partir de dados reais. */
function renderCalculatedMetrics() {
  const instances = getBriefingInstances();
  const clients = getClients();

  // SLA médio: horas entre envio e resposta, para instâncias já respondidas
  const respondidas = instances.filter(i => i.data_envio && i.data_resposta);
  const slaEl = document.getElementById('metric-sla');
  if (slaEl) {
    if (respondidas.length > 0) {
      const mediaHoras = respondidas.reduce((acc, i) => {
        return acc + (new Date(i.data_resposta) - new Date(i.data_envio)) / 3600000;
      }, 0) / respondidas.length;
      slaEl.textContent = `SLA médio: ${mediaHoras.toFixed(1)} horas`;
    } else {
      slaEl.textContent = 'SLA médio: sem dados ainda';
    }
  }

  // Tempo de descoberta: dias entre envio e aprovação de kickoff
  const aprovados = instances.filter(i => i.status === 'aprovado_kickoff' && i.data_envio && i.data_resposta);
  const discoveryEl = document.getElementById('metric-discovery-time');
  if (discoveryEl) {
    if (aprovados.length > 0) {
      const mediaDias = aprovados.reduce((acc, i) => {
        return acc + (new Date(i.data_resposta) - new Date(i.data_envio)) / 86400000;
      }, 0) / aprovados.length;
      discoveryEl.innerHTML = `${mediaDias.toFixed(1)} <span class="text-xs font-normal text-outline">dias</span>`;
    } else {
      discoveryEl.innerHTML = `— <span class="text-xs font-normal text-outline">dias</span>`;
    }
  }

  const clientsActiveEl = document.getElementById('metric-clients-active');
  if (clientsActiveEl) {
    const ativos = clients.filter(c => c.status_cliente === 'ativo').length;
    clientsActiveEl.innerHTML = `Clientes ativos: <strong>${ativos}</strong>`;
  }
}

/** Atualiza os contadores do submenu lateral "Formulários". */
function updateFormsMenuCounts() {
  const instances = getBriefingInstances();
  const counts = {
    open: instances.filter(i => i.status === 'enviado' || i.status === 'rascunho').length,
    processing: instances.filter(i => i.status === 'em_preenchimento' || i.status === 'ajustes_solicitados').length,
    submitted: instances.filter(i => i.status === 'submetido' || i.status === 'em_revisao').length,
    ready: instances.filter(i => i.status === 'aprovado_kickoff').length
  };

  Object.entries(counts).forEach(([key, value]) => {
    const el = document.getElementById(`count-form-${key}`);
    if (el) el.textContent = value > 0 ? value : '';
  });
}

const VERTICAL_LABELS = {
  pilates: { nome: 'Pilates & Bem-Estar', cor: 'bg-primary' },
  physio: { nome: 'Fisioterapia & Reabilitação', cor: 'bg-primary-container' },
  fisio_pilates: { nome: 'Fisio & Pilates', cor: 'bg-primary-container' },
  events: { nome: 'Eventos', cor: 'bg-tertiary-container' },
  universal: { nome: 'Universal / Corporativo', cor: 'bg-secondary' }
};

function renderDistribution() {
  const list = document.getElementById('vertical-distribution-list');
  if (!list) return;

  const instances = getBriefingInstances();
  const clients = getClients();
  const clientsMap = new Map(clients.map(c => [c.id, c]));

  const counts = {};
  instances.forEach(inst => {
    const client = clientsMap.get(inst.cliente_id);
    const vert = client ? client.vertical : 'universal';
    counts[vert] = (counts[vert] || 0) + 1;
  });

  const total = instances.length;

  if (total === 0) {
    list.innerHTML = `<p class="text-xs text-on-surface-variant">Nenhum briefing cadastrado ainda.</p>`;
    return;
  }

  list.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([vert, count]) => {
      const info = VERTICAL_LABELS[vert] || { nome: vert, cor: 'bg-outline' };
      const pct = Math.round((count / total) * 100);
      return `
        <div>
          <div class="flex justify-between items-center text-xs mb-1">
            <span class="font-medium text-on-surface flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm ${info.cor}"></span>
              ${info.nome}
            </span>
            <span class="font-semibold text-on-surface">${count} brief${count === 1 ? '' : 's'} <span class="text-outline font-normal">(${pct}%)</span></span>
          </div>
          <div class="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
            <div class="h-full ${info.cor} rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
}

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

const STATUS_ACTIVITY_META = {
  enviado: { label: 'Aguardando Resposta', classe: 'bg-surface-container text-on-surface-variant' },
  em_preenchimento: { label: 'Em Preenchimento', classe: 'bg-blue-50 text-primary' },
  submetido: { label: 'Revisão de Escopo', classe: 'bg-amber-50 text-amber-700' },
  em_revisao: { label: 'Em Revisão', classe: 'bg-amber-50 text-amber-700' },
  ajustes_solicitados: { label: 'Ajustes Solicitados', classe: 'bg-rose-50 text-rose-700' },
  aprovado_kickoff: { label: 'Kickoff Aprovado', classe: 'bg-emerald-50 text-emerald-700' }
};

function renderRecentActivity() {
  const list = document.getElementById('recent-activity-list');
  if (!list) return;

  const instances = getBriefingInstances();
  const clients = getClients();
  const clientsMap = new Map(clients.map(c => [c.id, c]));

  const recent = [...instances]
    .sort((a, b) => new Date(b.data_resposta || b.data_envio || 0) - new Date(a.data_resposta || a.data_envio || 0))
    .slice(0, 3);

  if (recent.length === 0) {
    list.innerHTML = `<p class="text-xs text-on-surface-variant col-span-3">Nenhuma atividade ainda.</p>`;
    return;
  }

  list.innerHTML = recent.map(inst => {
    const client = clientsMap.get(inst.cliente_id) || { empresa: 'Cliente' };
    const meta = STATUS_ACTIVITY_META[inst.status] || { label: inst.status, classe: 'bg-surface-container text-on-surface-variant' };
    const quando = timeAgo(inst.data_resposta || inst.data_envio);
    const respostasCount = Object.keys(inst.respostas_brutas || {}).length;

    return `
      <div class="p-3.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest hover:shadow-xs transition-shadow cursor-pointer" data-activity-brief="${inst.id}">
        <div class="flex items-center justify-between text-xs mb-2">
          <span class="px-2 py-0.5 ${meta.classe} font-semibold rounded text-[10px]">${meta.label}</span>
          <span class="text-outline text-[11px]">${quando}</span>
        </div>
        <p class="font-label-md text-label-md text-on-surface font-semibold truncate">${client.empresa}</p>
        <p class="font-body-sm text-body-sm text-on-surface-variant text-[12px] line-clamp-2 mt-1">${inst.etapa_nome || 'Briefing'} • ${respostasCount} campo(s) respondido(s).</p>
        <div class="mt-3 pt-2.5 border-t border-outline-variant/50 flex items-center justify-between">
          <span class="text-[11px] font-medium text-primary">#${inst.id}</span>
          <button type="button" class="btn-open-activity-brief text-xs text-on-surface hover:text-primary font-semibold" data-activity-brief-open="${inst.id}">Abrir →</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-activity-brief]').forEach(card => {
    card.addEventListener('click', () => {
      currentView = 'briefs';
      selectBrief(card.getAttribute('data-activity-brief'));
      document.getElementById('roster-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  list.querySelectorAll('.btn-open-activity-brief').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const briefId = btn.getAttribute('data-activity-brief-open');
      currentView = 'briefs';
      selectBrief(briefId);
      openExpandedRawModal(briefId);
    });
  });
}

// ============================================================================
// TABELA PRINCIPAL & FILTROS
// ============================================================================

export function renderTable() {
  const tbody = document.querySelector('table tbody');
  const thead = document.querySelector('table thead');
  const titleEl = document.getElementById('table-title');
  const subtitleEl = document.getElementById('table-subtitle');
  const activeCountEl = document.querySelector('#table-active-count');
  if (!tbody) return;

  if (currentView === 'clients') {
    renderClientsTable(tbody, thead, titleEl, subtitleEl, activeCountEl);
    return;
  }

  if (titleEl) titleEl.textContent = 'Roster de Briefings Prioritários';
  if (subtitleEl) subtitleEl.textContent = 'Gerencie os fluxos recebidos e despache aprovações de briefing.';
  if (thead) {
    thead.innerHTML = `
      <tr>
        <th class="py-3 px-4">Cliente &amp; Projeto</th>
        <th class="py-3 px-3">Vertical</th>
        <th class="py-3 px-3">Data Envio</th>
        <th class="py-3 px-3">Urgência</th>
        <th class="py-3 px-3">Status</th>
        <th class="py-3 px-4 text-right">Ações Rápidas</th>
      </tr>
    `;
  }

  const instances = getBriefingInstances();
  const clients = getClients();
  const clientsMap = new Map(clients.map(c => [c.id, c]));

  let filtered = instances;
  if (currentFilter === 'submitted') {
    filtered = instances.filter(i => i.status === 'submetido');
  } else if (currentFilter === 'review') {
    filtered = instances.filter(i => i.status === 'em_revisao');
  } else if (currentFilter === 'ready') {
    filtered = instances.filter(i => i.status === 'aprovado_kickoff');
  } else if (currentFilter === 'open') {
    filtered = instances.filter(i => i.status === 'enviado' || i.status === 'rascunho');
  } else if (currentFilter === 'processing') {
    filtered = instances.filter(i => i.status === 'em_preenchimento' || i.status === 'ajustes_solicitados');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(i => {
      const client = clientsMap.get(i.cliente_id);
      const haystack = [
        client?.empresa, client?.codigo_unico, client?.vertical, client?.nome_responsavel,
        i.id, i.etapa_nome
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  // Atualiza contador de ativos no topo da tabela
  if (activeCountEl) {
    activeCountEl.textContent = `${filtered.length} briefs`;
  }

  const paginationLabel = document.getElementById('table-pagination-label');
  if (paginationLabel) {
    paginationLabel.innerHTML = filtered.length > 0
      ? `Mostrando <strong>1-${filtered.length}</strong> de <strong>${filtered.length}</strong> briefings`
      : `Mostrando <strong>0</strong> de <strong>0</strong> briefings`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-on-surface-variant font-body-sm">
          <span class="material-symbols-outlined text-3xl text-outline mb-1 block">inbox</span>
          Nenhum briefing encontrado para o filtro selecionado.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(inst => {
    const client = clientsMap.get(inst.cliente_id) || {
      empresa: 'Cliente Desconhecido',
      codigo_unico: 'CLI-0000',
      nome_responsavel: 'Contato',
      vertical: 'universal',
      email: ''
    };

    const isSelected = inst.id === selectedBriefId;
    const rowBg = isSelected ? 'bg-surface-container/60' : 'hover:bg-surface-container-low';

    let icon = 'folder_open';
    let verticalName = 'Geral';
    if (client.vertical === 'pilates') { icon = 'spa'; verticalName = 'Pilates'; }
    else if (client.vertical === 'physio') { icon = 'medical_services'; verticalName = 'Fisioterapia'; }
    else if (client.vertical === 'fisio_pilates') { icon = 'medical_services'; verticalName = 'Fisio & Pilates'; }
    else if (client.vertical === 'events') { icon = 'celebration'; verticalName = 'Eventos'; }

    let statusBadge = '';
    if (inst.status === 'em_revisao') {
      statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Em Revisão</span>';
    } else if (inst.status === 'aprovado_kickoff') {
      statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Kickoff Pronto</span>';
    } else if (inst.status === 'submetido') {
      statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-primary">Submetido</span>';
    } else if (inst.status === 'ajustes_solicitados') {
      statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Ajustes Pedidos</span>';
    } else {
      statusBadge = '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">Enviado</span>';
    }

    const urgencyBadge = inst.urgencia === 'high' 
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span> Alta</span>'
      : '<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container text-on-surface-variant">Normal</span>';

    const dateFormatted = inst.data_resposta 
      ? new Date(inst.data_resposta).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : (inst.data_envio ? 'Env: ' + new Date(inst.data_envio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Pendente');

    const initials = client.empresa.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CI';

    return `
      <tr class="${rowBg} transition-colors cursor-pointer group" data-brief-id="${inst.id}">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              ${initials}
            </div>
            <div class="min-w-0">
              <div class="font-label-md text-label-md font-semibold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                ${client.empresa}
                ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>' : ''}
              </div>
              <span class="text-[11px] text-outline truncate block">Cod: <strong>${client.codigo_unico}</strong> • ${inst.id}</span>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-3">
          <span class="inline-flex items-center gap-1 text-xs text-on-surface">
            <span class="material-symbols-outlined text-sm text-primary">${icon}</span>
            ${verticalName}
          </span>
        </td>
        <td class="py-3.5 px-3 text-xs text-on-surface-variant whitespace-nowrap">${dateFormatted}</td>
        <td class="py-3.5 px-3">${urgencyBadge}</td>
        <td class="py-3.5 px-3">${statusBadge}</td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-view-brief p-1.5 rounded text-primary hover:bg-surface-container-high transition-colors" data-brief-id="${inst.id}" title="Ver Briefing Completo" type="button">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <a href="${inst.link_seguro}" target="_blank" class="p-1.5 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors" title="Abrir Portal do Cliente (link que o cliente vê)">
              <span class="material-symbols-outlined text-base">open_in_new</span>
            </a>
            <button class="btn-whatsapp-share p-1.5 rounded text-on-surface-variant hover:text-emerald-600 hover:bg-surface-container-high transition-colors" data-client-id="${client.id}" data-brief-id="${inst.id}" title="Copiar Mensagem WhatsApp" type="button">
              <span class="material-symbols-outlined text-base">share</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Reanexa eventos de clique nas linhas
  tbody.querySelectorAll('tr[data-brief-id]').forEach(row => {
    row.addEventListener('click', (e) => {
      // Se clicou em botão ou link de ação, não troca a seleção
      if (e.target.closest('button') || e.target.closest('a')) return;
      const id = row.getAttribute('data-brief-id');
      selectBrief(id);
    });
  });

  // Ícone de olho: abre direto a tela cheia com o briefing completo
  tbody.querySelectorAll('.btn-view-brief').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const briefId = btn.getAttribute('data-brief-id');
      selectBrief(briefId);
      openExpandedRawModal(briefId);
    });
  });

  // Reanexa eventos do botão de WhatsApp
  tbody.querySelectorAll('.btn-whatsapp-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const clientId = btn.getAttribute('data-client-id');
      const briefId = btn.getAttribute('data-brief-id');
      shareWhatsApp(clientId, briefId);
    });
  });
}

function renderClientsTable(tbody, thead, titleEl, subtitleEl, activeCountEl) {
  const clients = getClients();
  const instances = getBriefingInstances();

  if (titleEl) titleEl.textContent = 'Carteira de Clientes (CRM)';
  if (subtitleEl) subtitleEl.textContent = 'Gestão centralizada de clientes, identificação única e histórico de briefings.';
  if (activeCountEl) activeCountEl.textContent = `${clients.length} clientes`;

  if (thead) {
    thead.innerHTML = `
      <tr>
        <th class="py-3 px-4">Cliente &amp; Empresa</th>
        <th class="py-3 px-3">Código Único</th>
        <th class="py-3 px-3">E-mail Profissional</th>
        <th class="py-3 px-3">Vertical</th>
        <th class="py-3 px-3">Briefings</th>
        <th class="py-3 px-4 text-right">Disparo</th>
      </tr>
    `;
  }

  tbody.innerHTML = clients.map(client => {
    const clientBriefs = instances.filter(i => i.cliente_id === client.id);
    const initials = client.empresa.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CI';

    return `
      <tr class="hover:bg-surface-container-low transition-colors group">
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center font-bold text-xs shrink-0">
              ${initials}
            </div>
            <div>
              <div class="font-label-md text-label-md font-semibold text-on-surface">
                ${client.empresa}
              </div>
              <span class="text-[11px] text-outline">${client.nome_responsavel} • ${client.cargo || 'Gestor'}</span>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-3">
          <span class="px-2 py-0.5 rounded text-xs font-semibold bg-surface-container text-primary font-mono">
            ${client.codigo_unico}
          </span>
        </td>
        <td class="py-3.5 px-3 text-xs text-on-surface-variant">${client.email}</td>
        <td class="py-3.5 px-3">
          <span class="inline-flex items-center gap-1 text-xs text-on-surface capitalize">
            ${client.vertical}
          </span>
        </td>
        <td class="py-3.5 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            ${clientBriefs.length} briefing(s)
          </span>
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-new-brief-for-client px-2.5 py-1 bg-surface-container hover:bg-primary hover:text-on-primary rounded text-xs font-semibold transition-colors flex items-center gap-1" data-client-id="${client.id}" type="button">
              <span class="material-symbols-outlined text-xs">add</span> Disparar Briefing
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Botões de disparar briefing para cliente existente
  tbody.querySelectorAll('.btn-new-brief-for-client').forEach(btn => {
    btn.addEventListener('click', () => {
      const clientId = btn.getAttribute('data-client-id');
      openNewBriefModalForClient(clientId);
    });
  });
}

// ============================================================================
// INSPETOR LATERAL (SNAPSHOT DETAIL)
// ============================================================================

function renderEmptyInspectorState() {
  const aside = document.querySelector('aside.xl\\:col-span-4');
  if (!aside) return;
  const clientTitle = aside.querySelector('h3.font-headline-sm');
  if (clientTitle) clientTitle.textContent = 'Nenhum briefing cadastrado';

  const refBadge = aside.querySelector('.text-xs.font-semibold.px-2.py-0\\.5');
  if (refBadge) refBadge.textContent = '—';

  const clientConcept = aside.querySelector('h3.font-headline-sm + p');
  if (clientConcept) clientConcept.textContent = 'Crie um briefing para ver o resumo aqui.';

  const urgencySpan = aside.querySelector('span.border-rose-200');
  if (urgencySpan) urgencySpan.textContent = '';

  const tagsContainer = aside.querySelector('.flex.flex-wrap.gap-1\\.5');
  if (tagsContainer) tagsContainer.textContent = '';

  const contentArea = aside.querySelector('.space-y-3\\.5');
  if (contentArea) contentArea.textContent = '';

  const initialsContact = aside.querySelector('.w-9.h-9.rounded-full');
  if (initialsContact) initialsContact.textContent = '—';

  const contactName = aside.querySelector('p.font-label-md.text-label-md.font-semibold.truncate');
  if (contactName) contactName.textContent = '—';

  const contactRole = aside.querySelector('p.text-\\[11px\\].text-outline.truncate');
  if (contactRole) contactRole.textContent = '';
}

export function selectBrief(briefId, reRenderTable = true) {
  selectedBriefId = briefId;
  const instance = getBriefingInstanceById(briefId);
  if (!instance) return;

  const client = getClientById(instance.cliente_id) || {
    empresa: 'Cliente',
    codigo_unico: 'CLI-0000',
    nome_responsavel: 'Responsável',
    cargo: 'Diretor',
    email: 'contato@cliente.com',
    vertical: 'universal'
  };

  // Sempre resintetiza o digest a partir das respostas atuais (preserva
  // aprovado_por/data_aprovacao de um digest anterior, se houver) — nunca
  // fica preso a um resumo desatualizado quando o cliente responde mais
  // tarde ou quando a instância é reiniciada.
  let digest = generateProductionDigest(briefId);

  // Re-renderiza a tabela para atualizar a linha selecionada
  if (reRenderTable && currentView === 'briefs') {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
      tbody.querySelectorAll('tr[data-brief-id]').forEach(row => {
        const id = row.getAttribute('data-brief-id');
        if (id === briefId) {
          row.classList.add('bg-surface-container/60');
          row.classList.remove('hover:bg-surface-container-low');
        } else {
          row.classList.remove('bg-surface-container/60');
          row.classList.add('hover:bg-surface-container-low');
        }
      });
    }
  }

  // Atualiza os elementos do Painel Direito
  const aside = document.querySelector('aside.xl\\:col-span-4');
  if (!aside) return;

  // Header do Aside
  const refBadge = aside.querySelector('.text-xs.font-semibold.px-2.py-0\\.5');
  if (refBadge) refBadge.textContent = `${client.codigo_unico} • ${instance.id}`;

  const clientTitle = aside.querySelector('h3.font-headline-sm');
  if (clientTitle) clientTitle.textContent = client.empresa;

  const clientConcept = aside.querySelector('h3.font-headline-sm + p');
  if (clientConcept) clientConcept.textContent = instance.etapa_nome;

  // Urgência
  const urgencySpan = aside.querySelector('span.border-rose-200');
  if (urgencySpan) {
    if (instance.urgencia === 'high') {
      urgencySpan.className = 'px-2 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200';
      urgencySpan.textContent = 'Alta Urgência';
    } else {
      urgencySpan.className = 'px-2 py-1 text-xs font-semibold rounded bg-surface-container text-on-surface-variant border border-outline-variant';
      urgencySpan.textContent = 'Normal';
    }
  }

  // Tags
  const tagsContainer = aside.querySelector('.flex.flex-wrap.gap-1\\.5');
  if (tagsContainer) {
    tagsContainer.innerHTML = `
      <span class="px-2 py-0.5 text-[11px] rounded bg-surface-container text-primary font-medium">#${client.codigo_unico}</span>
      <span class="px-2 py-0.5 text-[11px] rounded bg-surface-container text-primary font-medium">#${client.vertical.toUpperCase()}</span>
      <span class="px-2 py-0.5 text-[11px] rounded bg-surface-container text-primary font-medium">#${instance.status.replace('_', ' ').toUpperCase()}</span>
    `;
  }

  // Injeta ou atualiza o Seletor de Abas do Inspetor (Digest vs Raio-X)
  let tabsWrapper = document.getElementById('inspector-tab-controls');
  if (!tabsWrapper) {
    tabsWrapper = document.createElement('div');
    tabsWrapper.id = 'inspector-tab-controls';
    tabsWrapper.className = 'flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs font-semibold border border-outline-variant/60 my-1';
    
    const paramsContainer = aside.querySelector('.space-y-3\\.5');
    if (paramsContainer) {
      paramsContainer.parentNode.insertBefore(tabsWrapper, paramsContainer);
    }
  }

  tabsWrapper.innerHTML = `
    <button id="btn-inspector-tab-digest" type="button" class="flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${currentInspectorTab === 'digest' ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'}">
      <span class="material-symbols-outlined text-sm">bolt</span> Resumo Executivo
    </button>
    <button id="btn-inspector-tab-raw" type="button" class="flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${currentInspectorTab === 'raw' ? 'bg-surface-container-lowest text-primary shadow-xs font-bold' : 'text-on-surface-variant hover:text-on-surface'}">
      <span class="material-symbols-outlined text-sm">fact_check</span> Raio-X Respostas
    </button>
  `;

  document.getElementById('btn-inspector-tab-digest').onclick = () => {
    currentInspectorTab = 'digest';
    selectBrief(briefId, false);
  };
  document.getElementById('btn-inspector-tab-raw').onclick = () => {
    currentInspectorTab = 'raw';
    selectBrief(briefId, false);
  };

  // Renderiza conteúdo baseado na aba ativa
  const contentArea = aside.querySelector('.space-y-3\\.5');
  if (contentArea) {
    if (currentInspectorTab === 'digest') {
      renderInspectorDigest(contentArea, instance, client, digest);
    } else {
      renderInspectorRaw(contentArea, instance, client);
    }
  }

  // Contato Responsável
  const initialsContact = aside.querySelector('.w-9.h-9.rounded-full');
  if (initialsContact) {
    initialsContact.textContent = client.nome_responsavel.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  const contactName = aside.querySelector('p.font-label-md.text-label-md.font-semibold.truncate');
  if (contactName) contactName.textContent = client.nome_responsavel;

  const contactRole = aside.querySelector('p.text-\\[11px\\].text-outline.truncate');
  if (contactRole) contactRole.textContent = `${client.cargo || 'Gestor'} • ${client.email}`;

  // Botões de Ação do Diretor
  const btnApprove = aside.querySelector('button.w-full.bg-primary') || aside.querySelector('button.w-full.bg-emerald-600');
  if (btnApprove) {
    btnApprove.onclick = () => approveBriefing(briefId);
    if (instance.status === 'aprovado_kickoff') {
      btnApprove.innerHTML = '<span class="material-symbols-outlined text-base">verified</span> Briefing Aprovado (Kickoff Ativo)';
      btnApprove.className = 'w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-on-primary rounded-lg font-label-md text-label-md font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95';
    } else {
      btnApprove.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span> Aprovar Briefing &amp; Gerar Kickoff';
      btnApprove.className = 'w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-md text-label-md font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-95';
    }
  }

  // Botão Exportar Markdown
  const btnExport = aside.querySelectorAll('.grid.grid-cols-2 button')[1];
  if (btnExport) {
    btnExport.onclick = () => exportBriefingMarkdown(briefId);
    btnExport.title = 'Copiar Resumo Executivo em Markdown para Notion/Linear';
    btnExport.innerHTML = '<span class="material-symbols-outlined text-sm align-middle">file_download</span> Exportar MD';
  }

  // Botão Solicitar Ajustes
  const btnAdjust = aside.querySelectorAll('.grid.grid-cols-2 button')[0];
  if (btnAdjust) {
    btnAdjust.onclick = () => openAdjustmentsModal(briefId);
    btnAdjust.innerHTML = '<span class="material-symbols-outlined text-sm align-middle">edit_note</span> Pedir Ajustes';
  }
}

function renderInspectorDigest(container, instance, client, digest) {
  const isApproved = instance.status === 'aprovado_kickoff';

  container.innerHTML = `
    <div>
      <span class="font-label-sm text-label-sm text-outline block mb-0.5 uppercase">01. Objetivo Central Sintetizado</span>
      <p class="font-body-sm text-body-sm text-on-surface font-medium leading-relaxed bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/60">
        ${digest?.objetivo_sintetizado || instance.respostas_brutas?.desafio_central || 'Preenchimento aguardado pelo cliente.'}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-3 pt-2 border-t border-outline-variant/50">
      <div>
        <span class="font-label-sm text-label-sm text-outline block mb-0.5 uppercase">Orçamento Declarado</span>
        <span class="font-headline-sm text-headline-sm text-on-surface font-bold text-sm">${instance.budget || 'R$ 150.000,00'}</span>
      </div>
      <div>
        <span class="font-label-sm text-label-sm text-outline block mb-0.5 uppercase">Status Operacional</span>
        <span class="font-headline-sm text-headline-sm ${isApproved ? 'text-emerald-700' : 'text-primary'} font-bold text-sm">
          ${isApproved ? 'Kickoff Liberado' : 'Revisão Técnica'}
        </span>
      </div>
    </div>

    ${digest?.pilares_design && digest.pilares_design.length > 0 ? `
      <div class="pt-2 border-t border-outline-variant/50">
        <span class="font-label-sm text-label-sm text-outline block mb-1 uppercase">02. Pilares Estéticos &amp; Vibe</span>
        <div class="space-y-1">
          ${digest.pilares_design.map(p => `
            <div class="flex items-start gap-1.5 text-on-surface-variant text-[11.5px]">
              <span class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
              <span>${p}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${digest?.entregaveis_confirmados && digest.entregaveis_confirmados.length > 0 ? `
      <div class="pt-2 border-t border-outline-variant/50">
        <span class="font-label-sm text-label-sm text-outline block mb-1 uppercase">03. Entregáveis de Produção</span>
        <div class="flex flex-wrap gap-1">
          ${digest.entregaveis_confirmados.map(e => `
            <span class="px-2 py-0.5 bg-primary/10 text-primary text-[11px] rounded-md font-semibold">${e}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${digest?.checklist_kickoff && digest.checklist_kickoff.length > 0 ? `
      <div class="pt-2 border-t border-outline-variant/50">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-label-sm text-label-sm text-outline uppercase">04. Checklist de Kickoff</span>
          <span class="text-[10px] text-outline">${digest.checklist_kickoff.filter(c => c.status === 'concluido').length}/${digest.checklist_kickoff.length} concluídos</span>
        </div>
        <div class="space-y-1.5 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/60">
          ${digest.checklist_kickoff.map((c, idx) => `
            <label class="flex items-start gap-2 text-on-surface cursor-pointer text-[11.5px] hover:text-primary transition-colors">
              <input type="checkbox" data-brief-id="${instance.id}" data-check-idx="${idx}" class="digest-checklist-checkbox rounded border-outline-variant text-primary focus:ring-primary/20 mt-0.5" ${c.status === 'concluido' ? 'checked' : ''}>
              <span class="${c.status === 'concluido' ? 'line-through text-outline' : 'font-medium'}">${c.item}</span>
            </label>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="pt-2 border-t border-outline-variant/50 flex items-center justify-between text-on-surface-variant">
      <span>Arquivos &amp; Brandbook:</span>
      <span class="font-semibold text-on-surface flex items-center gap-1">
        <span class="material-symbols-outlined text-sm text-primary">attach_file</span> ${(instance.anexos || []).length} assets (${instance.anexos ? instance.anexos.map(a => a.nome).join(', ') : 'Nenhum'})
      </span>
    </div>
  `;

  // Anexa ouvintes aos checkboxes interativos do digest
  container.querySelectorAll('.digest-checklist-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-check-idx'), 10);
      const briefId = e.target.getAttribute('data-brief-id');
      const d = getDigestByBriefingId(briefId);
      if (d && d.checklist_kickoff && d.checklist_kickoff[idx]) {
        d.checklist_kickoff[idx].status = e.target.checked ? 'concluido' : 'pendente';
        saveDigest(d);
        selectBrief(briefId, false);
      }
    });
  });
}

function renderInspectorRaw(container, instance, client) {
  const raw = instance.respostas_brutas || {};
  const entries = Object.entries(raw);

  container.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-outline-variant/60">
      <div>
        <span class="font-bold text-on-surface text-xs uppercase tracking-wide block">Raio-X de Respostas</span>
        <span class="text-[10px] text-outline">${entries.length} campos respondidos • Protocolo #${instance.id}</span>
      </div>
      <button id="btn-open-expanded-modal" type="button" class="px-2 py-1 bg-surface-container hover:bg-primary hover:text-on-primary rounded text-[11px] font-semibold transition-colors flex items-center gap-1">
        <span class="material-symbols-outlined text-xs">open_in_full</span> Expandir
      </button>
    </div>

    ${instance.feedback_ajustes ? `
      <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11.5px]">
        <strong>Último feedback enviado:</strong> "${instance.feedback_ajustes}"
      </div>
    ` : ''}

    <div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
      ${entries.length === 0 ? `
        <div class="py-6 text-center text-outline text-xs">
          <span class="material-symbols-outlined text-2xl mb-1 block">hourglass_empty</span>
          Nenhuma resposta enviada pelo cliente ainda.<br>
          <a href="${instance.link_seguro}" target="_blank" class="text-primary font-semibold hover:underline mt-1 inline-block">Abrir portal do cliente →</a>
        </div>
      ` : entries.map(([key, value]) => {
        const labelFormatted = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        let displayValue = '';
        if (Array.isArray(value)) {
          displayValue = `<div class="flex flex-wrap gap-1 mt-1">${value.map(v => `<span class="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-medium">${v}</span>`).join('')}</div>`;
        } else if (typeof value === 'object' && value !== null) {
          displayValue = `<pre class="text-[10px] font-mono bg-surface-container p-2 rounded">${JSON.stringify(value, null, 2)}</pre>`;
        } else if (key.includes('slider') || key.includes('estilo')) {
          displayValue = `
            <div class="mt-1">
              <div class="flex justify-between text-[10px] text-outline mb-0.5"><span>Minimalista</span><span>${value}%</span><span>Expressivo</span></div>
              <div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div class="bg-primary h-full rounded-full" style="width: ${value}%"></div>
              </div>
            </div>
          `;
        } else {
          displayValue = `<p class="font-body-sm text-on-surface text-[12px] bg-surface-container-lowest p-2 rounded border border-outline-variant/40 mt-1">${value}</p>`;
        }

        return `
          <div class="p-2 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/50">
            <span class="text-[10px] font-bold text-outline uppercase tracking-wider block">${labelFormatted}</span>
            ${displayValue}
          </div>
        `;
      }).join('')}

      ${(instance.anexos || []).length > 0 ? `
        <div class="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60">
          <span class="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">Arquivos Anexados</span>
          <div class="space-y-1">
            ${instance.anexos.map(a => `
              <div class="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface-container-low">
                <span class="truncate flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-primary">description</span>
                  ${a.nome}
                </span>
                <span class="text-[10px] text-outline font-mono">${a.tamanho || 'Anexo'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  const btnOpenModal = container.querySelector('#btn-open-expanded-modal');
  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => openExpandedRawModal(instance.id));
  }
}

// ============================================================================
// AÇÕES DO DIRETOR (APROVAÇÃO, AJUSTES, EXPORTAÇÃO)
// ============================================================================

function approveBriefing(briefId) {
  updateBriefingStatus(briefId, 'aprovado_kickoff');
  patchInstanceRemote({ id: briefId, status: 'aprovado_kickoff' });

  // Atualiza ou cria o Digest se não existir
  let digest = getDigestByBriefingId(briefId);
  if (!digest) {
    digest = generateProductionDigest(briefId);
  } else {
    digest.data_aprovacao = new Date().toISOString();
    saveDigest(digest);
  }

  renderMetrics();
  renderTable();
  selectBrief(briefId);
  showToast('✅ Briefing Aprovado! Kickoff de produção liberado com sucesso.');
}

function exportBriefingMarkdown(briefId) {
  const md = exportDigestToMarkdown(briefId);
  navigator.clipboard.writeText(md).then(() => {
    showToast('📋 Resumo Executivo copiado em Markdown para a área de transferência! (Pronto para Notion/Trello/Linear)');
  }).catch(() => {
    showToast('📋 Erro ao copiar. Abra o console para visualizar.');
    console.log(md);
  });
}

/** Exporta todos os briefings atuais (filtrados ou não) como CSV real. */
function exportAllBriefingsCSV() {
  const instances = getBriefingInstances();
  const clients = getClients();
  const clientsMap = new Map(clients.map(c => [c.id, c]));

  if (instances.length === 0) {
    showToast('📄 Nenhum briefing para exportar ainda.');
    return;
  }

  const header = ['ID', 'Cliente', 'Código', 'Vertical', 'Etapa', 'Status', 'Progresso (%)', 'Data de Envio', 'Data de Resposta'];
  const rows = instances.map(inst => {
    const client = clientsMap.get(inst.cliente_id) || {};
    return [
      inst.id,
      client.empresa || '',
      client.codigo_unico || '',
      client.vertical || '',
      inst.etapa_nome || '',
      inst.status || '',
      inst.progresso_percentual ?? 0,
      inst.data_envio || '',
      inst.data_resposta || ''
    ];
  });

  const csvEscape = (val) => `"${String(val).replace(/"/g, '""')}"`;
  const csvContent = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studiointake_briefings_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(`📄 Relatório exportado: ${instances.length} briefing(s) em CSV.`);
}

function shareWhatsApp(clientId, briefId) {
  const msg = generateWhatsAppMessage(clientId, briefId);
  navigator.clipboard.writeText(msg).then(() => {
    showToast('💬 Mensagem de WhatsApp com link e código copiada com sucesso!');
  }).catch(() => {
    alert(msg);
  });
}

// ============================================================================
// CONFIGURAÇÃO DE EVENTOS & ABAS
// ============================================================================

function setupEventListeners() {
  // Busca global (filtra o roster por empresa, código, vertical ou responsável)
  const searchInput = document.getElementById('global-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderTable();
    });
  }

  // Filtros de pílula
  const btnAll = document.getElementById('filter-all');
  const btnSubmitted = document.getElementById('filter-submitted');
  const btnReview = document.getElementById('filter-review');
  const btnReady = document.getElementById('filter-ready');
  const btnCrm = document.getElementById('tab-clients-crm');

  if (btnAll) btnAll.addEventListener('click', () => setFilter('all', btnAll));
  if (btnSubmitted) btnSubmitted.addEventListener('click', () => setFilter('submitted', btnSubmitted));
  if (btnReview) btnReview.addEventListener('click', () => setFilter('review', btnReview));
  if (btnReady) btnReady.addEventListener('click', () => setFilter('ready', btnReady));

  // Aba Carteira de Clientes (CRM)
  if (btnCrm) {
    btnCrm.addEventListener('click', () => {
      currentView = 'clients';
      resetPillStyles();
      btnCrm.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-on-primary transition-colors whitespace-nowrap flex items-center gap-1 shadow-xs';
      renderTable();
    });
  }

  // Navegação lateral
  const navLinks = document.querySelectorAll('aside nav a');
  if (navLinks.length > 0) {
    navLinks[0].addEventListener('click', (e) => {
      e.preventDefault();
      currentView = 'briefs';
      if (btnAll) setFilter('all', btnAll);
    });
  }

  const navCrm = document.getElementById('nav-clients-crm');
  if (navCrm) {
    navCrm.addEventListener('click', (e) => {
      e.preventDefault();
      currentView = 'clients';
      resetPillStyles();
      if (btnCrm) {
        btnCrm.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-on-primary transition-colors whitespace-nowrap flex items-center gap-1 shadow-xs';
      }
      renderTable();
    });
  }

  // Menu lateral "Formulários" (Aberto / Em Processo / Respondidos / Arquivados)
  const navFormsToggle = document.getElementById('nav-forms-toggle');
  const navFormsSubmenu = document.getElementById('nav-forms-submenu');
  const navFormsChevron = document.getElementById('nav-forms-chevron');
  if (navFormsToggle && navFormsSubmenu) {
    navFormsToggle.addEventListener('click', () => {
      const willOpen = navFormsSubmenu.classList.contains('hidden');
      navFormsSubmenu.classList.toggle('hidden', !willOpen);
      if (navFormsChevron) navFormsChevron.style.transform = willOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  }

  document.querySelectorAll('.nav-forms-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = item.getAttribute('data-form-filter');
      setFilter(filter, null);
      document.querySelectorAll('.nav-forms-item').forEach(i => {
        i.classList.remove('text-primary', 'bg-surface-container-low', 'font-semibold');
      });
      item.classList.add('text-primary', 'bg-surface-container-low', 'font-semibold');
    });
  });

  // Botões "New Brief" (no topo e no sub-header)
  const newBriefBtn = document.querySelector('header button.bg-on-surface');
  if (newBriefBtn) {
    newBriefBtn.addEventListener('click', () => openNewClientModal());
  }

  const btnTopNew = document.getElementById('btn-top-new-brief');
  if (btnTopNew) {
    btnTopNew.addEventListener('click', () => openNewClientModal());
  }

  const newBriefSubBtn = document.getElementById('btn-open-new-brief');
  if (newBriefSubBtn) {
    newBriefSubBtn.addEventListener('click', () => openNewClientModal());
  }

  const btnAi = document.getElementById('btn-open-ai-generator');
  if (btnAi) {
    btnAi.addEventListener('click', () => showToast('✨ Gerador de templates com IA ainda não implementado — em breve.'));
  }

  const btnStakeholderChat = document.getElementById('btn-stakeholder-chat');
  if (btnStakeholderChat) {
    btnStakeholderChat.addEventListener('click', () => showToast('💬 Integração com Slack ainda não implementada.'));
  }

  const btnNotifications = document.getElementById('btn-notifications');
  if (btnNotifications) {
    btnNotifications.addEventListener('click', () => showToast('🔔 Central de notificações ainda não implementada.'));
  }

  const btnHeaderHelp = document.getElementById('btn-header-help');
  if (btnHeaderHelp) {
    btnHeaderHelp.addEventListener('click', () => showToast('❓ Central de suporte ainda não implementada. Fale com a agência diretamente.'));
  }

  const btnMarkRead = document.getElementById('btn-mark-activity-read');
  if (btnMarkRead) {
    btnMarkRead.addEventListener('click', () => {
      const list = document.getElementById('recent-activity-list');
      if (list) list.innerHTML = `<p class="text-xs text-on-surface-variant col-span-3">Tudo em dia — nenhuma atividade pendente de leitura.</p>`;
    });
  }

  const btnSettings = document.getElementById('nav-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => showToast('⚙️ Tela de Configurações ainda não implementada.'));
  }

  const btnSupport = document.getElementById('nav-support');
  if (btnSupport) {
    btnSupport.addEventListener('click', () => showToast('💬 Central de Suporte ainda não implementada.'));
  }

  const btnGlobalFilters = document.getElementById('btn-global-filters');
  if (btnGlobalFilters) {
    btnGlobalFilters.addEventListener('click', () => showToast('🔍 Use os filtros Aberto/Em Processo/Respondidos/Arquivados no menu "Formulários" ou as abas da tabela abaixo.'));
  }

  const btnExportReport = document.getElementById('btn-export-report');
  if (btnExportReport) {
    btnExportReport.addEventListener('click', () => exportAllBriefingsCSV());
  }
}

function resetPillStyles() {
  const pillButtons = [
    document.getElementById('filter-all'),
    document.getElementById('filter-submitted'),
    document.getElementById('filter-review'),
    document.getElementById('filter-ready')
  ].filter(Boolean);

  pillButtons.forEach(btn => {
    btn.className = 'px-3 py-1 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors whitespace-nowrap';
  });

  const btnCrm = document.getElementById('tab-clients-crm');
  if (btnCrm) {
    btnCrm.className = 'px-3 py-1 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap flex items-center gap-1';
  }
}

function setFilter(filter, activeBtn) {
  currentFilter = filter;
  currentView = 'briefs';
  resetPillStyles();
  if (activeBtn) {
    activeBtn.className = 'px-3 py-1 rounded-lg text-xs font-semibold bg-on-surface text-surface-container-lowest transition-colors whitespace-nowrap';
  }
  renderTable();
}

// ============================================================================
// MODAL DE CADASTRO DE CLIENTE & DISPARO DE BRIEFING
// ============================================================================

function setupModal() {
  // Cria o modal no DOM se não existir
  if (document.getElementById('modal-client-intake')) return;

  const modalHtml = `
    <div id="modal-client-intake" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs hidden">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">person_add</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Cadastrar Novo Cliente</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant text-xs">Gera código único e link seguro para disparo imediato.</p>
            </div>
          </div>
          <button id="btn-close-modal" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <!-- Form Body -->
        <form id="form-client-intake" class="space-y-4 pt-4">
          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex items-center justify-between">
            <div>
              <span class="font-label-sm text-label-sm text-outline uppercase block">Código Único Gerado</span>
              <span id="modal-client-code" class="font-headline-sm text-headline-sm text-primary font-bold font-mono">CLI-....</span>
            </div>
            <button id="btn-refresh-code" type="button" class="px-2.5 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold text-primary hover:bg-surface-container transition-colors flex items-center gap-1" title="Gerar outro código">
              <span class="material-symbols-outlined text-xs">autorenew</span> Novo Código
            </button>
          </div>

          <div>
            <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Nome da Empresa / Marca *</label>
            <input required id="client-company" type="text" placeholder="Ex: Studio Aura Pilates" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Nome do Responsável *</label>
              <input required id="client-name" type="text" placeholder="Ex: Mariana Silveira" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Cargo / Função</label>
              <input id="client-role" type="text" placeholder="Ex: Sócia-Diretora" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">E-mail Profissional *</label>
              <input required id="client-email" type="email" placeholder="contato@empresa.com" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">WhatsApp para Disparo *</label>
              <input required id="client-whatsapp" type="tel" placeholder="+55 (11) 9...." class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Vertical de Atuação *</label>
              <select id="client-vertical" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="pilates">Pilates Reformer & Wellness</option>
                <option value="physio">Fisioterapia & Saúde Clínica</option>
                <option value="fisio_pilates">Fisioterapia & Pilates (Híbrido)</option>
                <option value="events">Eventos & Grande Porte</option>
                <option value="universal">Universal / Corporativo (BriefOS)</option>
              </select>
            </div>
            <div>
              <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Etapa Inicial do Briefing</label>
              <select id="client-stage" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="Fase 1: Diagnóstico de Marca & Espaço">Fase 1: Diagnóstico Inicial</option>
                <option value="Fase 2: Identidade & Estética">Fase 2: Identidade Visual</option>
                <option value="Fase 3: Validação de Conteúdo">Fase 3: Conteúdo & Mídias</option>
                <option value="Fase 4: Checklist de Lançamento">Fase 4: Checklist Kickoff</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
            <button id="btn-cancel-modal" type="button" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
              <span class="material-symbols-outlined text-sm">send</span> Salvar &amp; Disparar Briefing
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Bind close buttons
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

  // Refresh code button
  document.getElementById('btn-refresh-code').addEventListener('click', () => {
    document.getElementById('modal-client-code').textContent = generateClientCode();
  });

  // Form submission
  document.getElementById('form-client-intake').addEventListener('submit', (e) => {
    e.preventDefault();
    handleCreateClientSubmit();
  });
}

function openNewClientModal() {
  setupModal();
  const modal = document.getElementById('modal-client-intake');
  const codeEl = document.getElementById('modal-client-code');
  if (codeEl) codeEl.textContent = generateClientCode();
  if (modal) modal.classList.remove('hidden');
}

function templateLabel(tpl) {
  const titulo = tpl.titulo;
  if (typeof titulo === 'string') return titulo;
  if (titulo && typeof titulo === 'object') return titulo.pt || titulo.it || titulo.en || tpl.id;
  return tpl.id;
}

function openNewBriefModalForClient(clientId) {
  openSendBriefingModal(clientId);
}

// ============================================================================
// MODAL: ENVIAR BRIEFING COM CÓDIGO DE ACESSO (Studio Suite 2.0)
// ============================================================================
let activeSendModalClientId = null;

function defaultTemplateIdForVertical(vertical) {
  if (vertical === 'pilates') return 'tpl-pilates-v1';
  if (vertical === 'physio') return 'tpl-physio-v1';
  if (vertical === 'fisio_pilates') return 'tpl-fisio-pilates-v1';
  if (vertical === 'events') return 'tpl-events-v1';
  return 'tpl-universal-v1';
}

export function setupSendBriefingModal() {
  if (document.getElementById('modal-send-briefing')) return;

  const modalHtml = `
    <div id="modal-send-briefing" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md hidden">
      <div class="relative w-full max-w-[560px] rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <header class="px-7 pt-7 pb-4 flex items-start justify-between border-b border-outline-variant/60">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span class="text-[11px] font-bold uppercase tracking-wider text-primary">Disparo de Onboarding</span>
            </div>
            <h2 class="text-xl font-headline-sm text-on-surface font-bold tracking-tight">Enviar Briefing de Descoberta</h2>
            <p class="text-sm text-on-surface-variant" id="send-modal-client-line">Lead: —</p>
          </div>
          <button id="btn-close-send-modal" class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div class="px-7 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <section>
            <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1">Modelo do Briefing</label>
            <select id="send-modal-template" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"></select>
          </section>

          <section class="bg-surface-container-low/70 rounded-2xl p-4 border border-outline-variant/60 space-y-3">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-sm font-semibold text-on-surface"><span class="material-symbols-outlined text-lg text-tertiary">lock</span> Acesso Seguro do Cliente</span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">verified_user</span> Código Único</span>
            </div>
            <div class="flex items-center justify-between bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/60">
              <div>
                <span class="text-[10px] uppercase text-on-surface-variant tracking-wider block">Código de Identificação</span>
                <div class="font-mono text-2xl text-on-surface tracking-widest font-semibold" id="send-modal-code">CLI-0000</div>
              </div>
            </div>
          </section>

          <section class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-label-md text-label-md text-on-surface font-semibold">Mensagem para WhatsApp</span>
              <span class="text-xs text-on-surface-variant">Prévia</span>
            </div>
            <pre id="send-modal-preview" class="text-xs whitespace-pre-wrap leading-relaxed bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-3 font-sans text-on-surface"></pre>
          </section>
        </div>

        <footer class="px-7 py-4 bg-surface-container-low/50 border-t border-outline-variant/60 flex items-center justify-between gap-3">
          <button id="btn-send-modal-copy" class="h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface text-sm font-semibold flex items-center gap-2 transition-colors active:scale-[0.98]" type="button">
            <span class="material-symbols-outlined text-lg">content_copy</span> Copiar Link &amp; Código
          </button>
          <button id="btn-send-modal-whatsapp" class="flex-1 h-11 px-6 rounded-xl bg-gradient-to-r from-primary-container to-primary text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]" type="button">
            <span class="material-symbols-outlined text-lg">chat</span> Enviar pelo WhatsApp
          </button>
        </footer>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('btn-close-send-modal').addEventListener('click', closeSendBriefingModal);
  document.getElementById('send-modal-template').addEventListener('change', renderSendModalPreview);
  document.getElementById('btn-send-modal-copy').addEventListener('click', () => confirmSendBriefing('copy'));
  document.getElementById('btn-send-modal-whatsapp').addEventListener('click', () => confirmSendBriefing('whatsapp'));
}

export function openSendBriefingModal(clientId) {
  setupSendBriefingModal();
  const client = getClientById(clientId);
  if (!client) return;
  activeSendModalClientId = clientId;

  document.getElementById('send-modal-client-line').textContent = `Lead: ${client.empresa} · ${client.nome_responsavel}`;
  document.getElementById('send-modal-code').textContent = client.codigo_unico;

  const templates = getTemplates();
  const defaultId = defaultTemplateIdForVertical(client.vertical);
  const select = document.getElementById('send-modal-template');
  select.innerHTML = templates.map(tpl =>
    `<option value="${tpl.id}" ${tpl.id === defaultId ? 'selected' : ''}>${templateLabel(tpl)}${tpl.id === defaultId ? ' (sugerido)' : ''}</option>`
  ).join('');

  renderSendModalPreview();
  document.getElementById('modal-send-briefing').classList.remove('hidden');
}

function renderSendModalPreview() {
  const client = getClientById(activeSendModalClientId);
  if (!client) return;
  const preview = document.getElementById('send-modal-preview');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  preview.textContent = `Olá, ${client.nome_responsavel}! Tudo bem? 👋\n\nAqui é da equipe de criação do Studio Suite. Para darmos o próximo passo com excelência no projeto da *${client.empresa}*, preparamos o seu briefing exclusivo:\n\n🔗 Acesse pelo link direto:\n${origin}/portal.html?code=${client.codigo_unico} (gerado ao confirmar o envio)\n\n🔑 Seu Código de Identificação: ${client.codigo_unico}\n\nO preenchimento leva cerca de 7 minutos e salva suas respostas automaticamente a cada passo. Qualquer dúvida, estamos à disposição!`;
}

function confirmSendBriefing(action) {
  const client = getClientById(activeSendModalClientId);
  if (!client) return;
  const select = document.getElementById('send-modal-template');
  const templateId = select.value;
  const templates = getTemplates();
  const chosenTemplate = templates.find(tpl => tpl.id === templateId);

  const newInstance = createBriefingInstance({
    cliente_id: client.id,
    template_id: templateId,
    etapa_nome: chosenTemplate ? templateLabel(chosenTemplate) : 'Fase 2: Identidade & Direção de Arte',
    urgencia: 'normal',
    budget: 'A definir'
  });

  syncClientRemote(client);
  syncInstanceRemote(newInstance);

  renderMetrics();
  renderTable();
  selectBrief(newInstance.id);
  closeSendBriefingModal();

  const msg = generateWhatsAppMessage(client.id, newInstance.id);
  if (action === 'whatsapp') {
    const phoneDigits = (client.whatsapp || '').replace(/\D/g, '');
    if (phoneDigits) {
      window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      navigator.clipboard.writeText(msg).catch(() => {});
      showToast('📋 WhatsApp do cliente não informado — mensagem copiada para você colar manualmente.');
      return;
    }
  } else {
    navigator.clipboard.writeText(msg).catch(() => {});
  }
  showToast(`🚀 Briefing enviado! Link do portal e código ${client.codigo_unico} prontos.`);
}

function closeSendBriefingModal() {
  const modal = document.getElementById('modal-send-briefing');
  if (modal) modal.classList.add('hidden');
}

function closeModal() {
  const modal = document.getElementById('modal-client-intake');
  if (modal) modal.classList.add('hidden');
}

function handleCreateClientSubmit() {
  const code = document.getElementById('modal-client-code').textContent;
  const company = document.getElementById('client-company').value.trim();
  const name = document.getElementById('client-name').value.trim();
  const role = document.getElementById('client-role').value.trim();
  const email = document.getElementById('client-email').value.trim();
  const whatsapp = document.getElementById('client-whatsapp').value.trim();
  const vertical = document.getElementById('client-vertical').value;
  const stage = document.getElementById('client-stage').value;

  // 1. Cadastra o cliente
  const newClient = createClient({
    codigo_unico: code,
    empresa: company,
    nome_responsavel: name,
    cargo: role,
    email: email,
    whatsapp: whatsapp,
    vertical: vertical
  });

  // 2. Cria a primeira instância de briefing vinculada
  let templateId = 'tpl-universal-v1';
  if (vertical === 'pilates') templateId = 'tpl-pilates-v1';
  else if (vertical === 'physio') templateId = 'tpl-physio-v1';
  else if (vertical === 'fisio_pilates') templateId = 'tpl-fisio-pilates-v1';
  else if (vertical === 'events') templateId = 'tpl-events-v1';

  const newInstance = createBriefingInstance({
    cliente_id: newClient.id,
    template_id: templateId,
    etapa_nome: stage,
    urgencia: 'high',
    budget: 'R$ 150.000,00'
  });

  syncClientRemote(newClient);
  syncInstanceRemote(newInstance);

  closeModal();
  document.getElementById('form-client-intake').reset();

  renderMetrics();
  renderDistribution();
  renderRecentActivity();
  renderTable();
  selectBrief(newInstance.id);

  // Copia mensagem do WhatsApp automaticamente
  shareWhatsApp(newClient.id, newInstance.id);
  showToast(`🎉 Cliente ${newClient.empresa} (${code}) cadastrado com sucesso! Mensagem para WhatsApp copiada.`);
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

export function showToast(message) {
  let toast = document.getElementById('studiointake-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'studiointake-toast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-3 bg-on-surface text-surface-container-lowest font-body-sm text-body-sm rounded-xl shadow-lg flex items-center gap-2 transition-all duration-200 transform translate-y-10 opacity-0';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="material-symbols-outlined text-emerald-400 text-lg">check_circle</span> <span>${message}</span>`;
  toast.classList.remove('translate-y-10', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-10', 'opacity-0');
  }, 4000);
}

// ============================================================================
// MODAL: SOLICITAR AJUSTES AO CLIENTE (FASE 5.4)
// ============================================================================
let activeAdjustmentBriefId = null;

export function setupAdjustmentsModal() {
  if (document.getElementById('modal-adjustments-request')) return;

  const modalHtml = `
    <div id="modal-adjustments-request" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs hidden">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">edit_note</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Solicitar Ajustes no Briefing</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant text-xs">O formulário será destravado no portal do cliente com sua nota de feedback.</p>
            </div>
          </div>
          <button id="btn-close-adjustments-modal" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="py-4 space-y-3.5">
          <div>
            <span class="font-label-sm text-label-sm text-outline block mb-1.5 uppercase font-semibold">Motivos Frequentes (Clique para incluir):</span>
            <div class="flex flex-wrap gap-1.5" id="adjustment-reason-chips">
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-amber-100 hover:text-amber-900 transition-colors border border-outline-variant/60">
                📐 Enviar planta baixa DWG / Alta Resolução
              </button>
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-amber-100 hover:text-amber-900 transition-colors border border-outline-variant/60">
                🎯 Detalhar melhor o desafio central
              </button>
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-amber-100 hover:text-amber-900 transition-colors border border-outline-variant/60">
                💰 Revisar escopo vs orçamento declarado
              </button>
              <button type="button" class="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-container hover:bg-amber-100 hover:text-amber-900 transition-colors border border-outline-variant/60">
                ⚖️ Documentação de compliance / termos
              </button>
            </div>
          </div>

          <div>
            <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Instruções da Direção de Criação para o Cliente *</label>
            <textarea id="adjustment-notes-input" rows="4" placeholder="Ex: Olá Mariana! Analisamos suas respostas e solicitamos por gentileza o reenvio da planta baixa em DWG ou PDF vetorial para validarmos a sinalização física." class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all"></textarea>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
          <button id="btn-cancel-adjustments-modal" type="button" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors">
            Cancelar
          </button>
          <button id="btn-confirm-adjustments" type="button" class="px-5 py-2 rounded-lg bg-amber-600 text-white font-label-md text-label-md font-semibold hover:bg-amber-700 transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
            <span class="material-symbols-outlined text-sm">send</span> Destravar &amp; Notificar Cliente
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('btn-close-adjustments-modal').onclick = closeAdjustmentsModal;
  document.getElementById('btn-cancel-adjustments-modal').onclick = closeAdjustmentsModal;

  // Reason chips click
  document.querySelectorAll('#adjustment-reason-chips button').forEach(btn => {
    btn.onclick = () => {
      const textarea = document.getElementById('adjustment-notes-input');
      const text = btn.textContent.trim().replace(/^[^\w\s]+/, '').trim();
      if (!textarea.value.includes(text)) {
        textarea.value = textarea.value ? `${textarea.value}\n- ${text}` : `- ${text}`;
      }
    };
  });

  document.getElementById('btn-confirm-adjustments').onclick = handleConfirmAdjustments;
}

export function openAdjustmentsModal(briefId) {
  setupAdjustmentsModal();
  activeAdjustmentBriefId = briefId;
  const instance = getBriefingInstanceById(briefId);
  const textarea = document.getElementById('adjustment-notes-input');
  if (textarea) {
    textarea.value = instance?.feedback_ajustes || '';
  }
  const modal = document.getElementById('modal-adjustments-request');
  if (modal) modal.classList.remove('hidden');
}

function closeAdjustmentsModal() {
  const modal = document.getElementById('modal-adjustments-request');
  if (modal) modal.classList.add('hidden');
}

function handleConfirmAdjustments() {
  if (!activeAdjustmentBriefId) return;
  const textarea = document.getElementById('adjustment-notes-input');
  const note = textarea ? textarea.value.trim() : '';

  updateBriefingStatus(activeAdjustmentBriefId, 'ajustes_solicitados', {
    feedback_ajustes: note || 'Ajustes solicitados pela equipe criativa.'
  });
  patchInstanceRemote({
    id: activeAdjustmentBriefId,
    status: 'ajustes_solicitados',
    feedback_ajustes: note || 'Ajustes solicitados pela equipe criativa.'
  });

  const instance = getBriefingInstanceById(activeAdjustmentBriefId);
  const client = instance ? getClientById(instance.cliente_id) : null;

  closeAdjustmentsModal();
  refreshDashboardData();

  if (client) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const link = `${origin}/${instance.link_seguro}`;
    const followUpMsg = `Olá, ${client.nome_responsavel}! Aqui é da equipe criativa do StudioIntake. Revisamos seu briefing oficial e gostaríamos de solicitar um pequeno ajuste para acelerar sua produção:\n\n📌 *Nota da Direção:* ${note}\n\n🔗 *Acesse para atualizar e reenviar:* ${link}`;
    navigator.clipboard.writeText(followUpMsg).catch(() => {});
  }

  showToast('⚠️ Status atualizado para "Ajustes Pedidos"! Formulário destravado e mensagem copiada para envio ao WhatsApp.');
}

// ============================================================================
// MODAL: RAIO-X EXPANDIDO (VISUALIZAÇÃO COMPLETA DAS RESPOSTAS)
// ============================================================================

export function setupExpandedRawModal() {
  if (document.getElementById('modal-expanded-raw')) return;

  const modalHtml = `
    <div id="modal-expanded-raw" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm hidden">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-outline-variant shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-lg">fact_check</span>
            </div>
            <div>
              <h3 id="expanded-raw-title" class="font-headline-sm text-headline-sm text-on-surface font-bold">Raio-X de Respostas do Briefing</h3>
              <p id="expanded-raw-subtitle" class="font-body-sm text-body-sm text-on-surface-variant text-xs">Visão detalhada campo a campo das respostas oficiais do cliente.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-print-raw" type="button" class="px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">print</span> Imprimir
            </button>
            <button id="btn-close-expanded-modal" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" type="button">
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        <!-- Body Scrollable -->
        <div id="expanded-raw-body" class="flex-1 overflow-y-auto py-4 space-y-4 custom-scroll">
          <!-- Conteúdo gerado dinamicamente -->
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span id="expanded-raw-footer-info" class="text-xs text-outline font-mono">Protocolo: #BRF-...</span>
          <div id="expanded-raw-actions" class="flex items-center gap-2 flex-wrap justify-end">
            <!-- Botões de decisão (Aprovar/Ajustes/Exportar), gerados dinamicamente -->
          </div>
          <button id="btn-close-expanded-footer" type="button" class="px-4 py-2 rounded-lg bg-surface-container font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors">
            Fechar
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('btn-close-expanded-modal').onclick = () => document.getElementById('modal-expanded-raw').classList.add('hidden');
  document.getElementById('btn-close-expanded-footer').onclick = () => document.getElementById('modal-expanded-raw').classList.add('hidden');
  document.getElementById('btn-print-raw').onclick = () => window.print();
}

export function openExpandedRawModal(briefId) {
  setupExpandedRawModal();
  const instance = getBriefingInstanceById(briefId);
  if (!instance) return;

  const client = getClientById(instance.cliente_id) || { empresa: 'Cliente', codigo_unico: 'CLI-0000' };
  const raw = instance.respostas_brutas || {};
  const entries = Object.entries(raw);
  const aindaNaoRespondeu = instance.status === 'enviado' || instance.status === 'rascunho' || instance.status === 'em_preenchimento';

  const titleEl = document.getElementById('expanded-raw-title');
  const subtitleEl = document.getElementById('expanded-raw-subtitle');
  const footerEl = document.getElementById('expanded-raw-footer-info');
  const bodyEl = document.getElementById('expanded-raw-body');
  const actionsEl = document.getElementById('expanded-raw-actions');

  if (titleEl) titleEl.textContent = `${client.empresa} (${client.codigo_unico})`;
  if (subtitleEl) subtitleEl.textContent = `${instance.etapa_nome} • ${instance.data_resposta ? 'Respondido em ' + new Date(instance.data_resposta).toLocaleString('pt-BR') : 'Ainda não respondido'}`;
  if (footerEl) footerEl.textContent = `Identificador do Briefing: ${instance.id} • ${entries.length} campos respondidos`;

  if (actionsEl) {
    const isApproved = instance.status === 'aprovado_kickoff';
    actionsEl.innerHTML = aindaNaoRespondeu ? '' : `
      <button id="btn-expanded-export" type="button" class="px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5">
        <span class="material-symbols-outlined text-sm">file_download</span> Exportar MD
      </button>
      <button id="btn-expanded-adjust" type="button" class="px-3 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1.5">
        <span class="material-symbols-outlined text-sm">edit_note</span> Pedir Ajustes
      </button>
      <button id="btn-expanded-approve" type="button" class="px-3 py-2 rounded-lg ${isApproved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary-container'} text-on-primary font-label-md text-label-md text-xs font-semibold transition-colors flex items-center gap-1.5">
        <span class="material-symbols-outlined text-sm">${isApproved ? 'verified' : 'check_circle'}</span> ${isApproved ? 'Aprovado (Kickoff Ativo)' : 'Aprovar & Gerar Kickoff'}
      </button>
    `;
    const btnExport = document.getElementById('btn-expanded-export');
    if (btnExport) btnExport.onclick = () => exportBriefingMarkdown(briefId);
    const btnAdjust = document.getElementById('btn-expanded-adjust');
    if (btnAdjust) btnAdjust.onclick = () => openAdjustmentsModal(briefId);
    const btnApprove = document.getElementById('btn-expanded-approve');
    if (btnApprove) btnApprove.onclick = () => { approveBriefing(briefId); openExpandedRawModal(briefId); };
  }

  const btnWhatsapp = document.getElementById('btn-expanded-whatsapp');
  if (btnWhatsapp) btnWhatsapp.onclick = () => shareWhatsApp(instance.cliente_id, briefId);

  if (bodyEl) {
    bodyEl.innerHTML = aindaNaoRespondeu ? `
      <div class="flex flex-col items-center justify-center text-center py-16 gap-3">
        <span class="material-symbols-outlined text-4xl text-outline">hourglass_empty</span>
        <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">Aguardando resposta do cliente</h4>
        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-sm">${client.nome_responsavel} (${client.email}) ainda não preencheu este briefing. Assim que responder, as respostas completas aparecem aqui.</p>
        <button id="btn-expanded-whatsapp" type="button" class="mt-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm">share</span> Copiar Mensagem de Cobrança (WhatsApp)
        </button>
      </div>
    ` : `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60 text-xs">
        <div><strong>Empresa:</strong> ${client.empresa}</div>
        <div><strong>Responsável:</strong> ${client.nome_responsavel} (${client.cargo || 'Gestor'})</div>
        <div><strong>E-mail:</strong> ${client.email}</div>
        <div><strong>WhatsApp:</strong> ${client.whatsapp || 'Não informado'}</div>
        <div><strong>Vertical:</strong> ${client.vertical.toUpperCase()}</div>
        <div><strong>Status Atual:</strong> ${instance.status.toUpperCase()}</div>
      </div>

      <div class="space-y-3">
        ${entries.length === 0 ? `
          <div class="p-8 text-center text-outline">Nenhum campo respondido ainda.</div>
        ` : entries.map(([key, value], idx) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          let valDisplay = '';
          if (Array.isArray(value)) {
            valDisplay = `<div class="flex flex-wrap gap-1.5 mt-1">${value.map(v => `<span class="px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded-lg text-xs">${v}</span>`).join('')}</div>`;
          } else if (typeof value === 'object' && value !== null) {
            valDisplay = `<pre class="bg-surface-container p-3 rounded-lg text-xs font-mono">${JSON.stringify(value, null, 2)}</pre>`;
          } else {
            valDisplay = `<div class="text-sm text-on-surface bg-surface-container-low/70 p-3 rounded-lg border border-outline-variant/40 mt-1 leading-relaxed">${value}</div>`;
          }
          return `
            <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/70 shadow-xs">
              <span class="text-xs font-bold text-outline uppercase tracking-wider block">Campo ${idx + 1}: ${label}</span>
              ${valDisplay}
            </div>
          `;
        }).join('')}

        ${(instance.anexos || []).length > 0 ? `
          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/70 shadow-xs">
            <span class="text-xs font-bold text-outline uppercase tracking-wider block mb-2">Arquivos Anexados (${instance.anexos.length})</span>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${instance.anexos.map(a => `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/50 text-xs">
                  <span class="font-medium truncate flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm text-primary">attach_file</span>
                    ${a.nome}
                  </span>
                  <span class="text-[11px] text-outline font-mono">${a.tamanho || 'Anexo'}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  const modal = document.getElementById('modal-expanded-raw');
  if (modal) modal.classList.remove('hidden');
}

// ============================================================================
// MODAL: GERADOR DE TEMPLATES COM IA (FASE 6.1 & 6.2)
// ============================================================================

export function setupAIGeneratorModal() {
  if (document.getElementById('modal-ai-generator')) return;

  const modalHtml = `
    <div id="modal-ai-generator" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs hidden">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-outline-variant">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-lg">auto_awesome</span>
            </div>
            <div>
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">Gerador de Templates com IA</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant text-xs">Cria instantaneamente questionários parametrizados para novas verticais.</p>
            </div>
          </div>
          <button id="btn-close-ai-modal" class="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors" type="button">
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="py-4 space-y-4">
          <!-- Presets Rápidos -->
          <div>
            <span class="font-label-sm text-label-sm text-outline uppercase block mb-2 font-semibold">Templates Pré-Calibrados por IA:</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" id="ai-preset-cards">
              ${AI_PRESETS.map(p => `
                <button type="button" data-preset-key="${p.key}" class="btn-select-preset p-3 text-left rounded-xl border border-outline-variant/70 bg-surface-container-low hover:border-primary hover:bg-primary/5 transition-all group">
                  <span class="font-bold text-xs text-on-surface group-hover:text-primary block truncate">${p.name}</span>
                  <span class="text-[11px] text-outline line-clamp-2 mt-0.5">${p.description}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div class="flex items-center gap-2 text-outline text-xs">
            <div class="h-px bg-outline-variant/60 flex-1"></div>
            <span>OU DIGITE UM PROMPT LIVRE</span>
            <div class="h-px bg-outline-variant/60 flex-1"></div>
          </div>

          <!-- Prompt Customizado -->
          <div>
            <label class="font-label-md text-label-md text-on-surface block mb-1 font-semibold">Descreva a Nova Vertical ou Negócio *</label>
            <input id="ai-custom-prompt-input" type="text" placeholder="Ex: Studio de Yoga Aéreo, Bar de Coquetelaria Speakeasy..." class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
            <span class="text-[11px] text-outline mt-1 block">A IA estrutura 4 seções com identificação de decisores, chips de escopo, seleção visual de tom e upload.</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-4 border-t border-outline-variant flex items-center justify-end gap-2">
          <button id="btn-cancel-ai-modal" type="button" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors">
            Cancelar
          </button>
          <button id="btn-generate-ai-template" type="button" class="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5 active:scale-95">
            <span class="material-symbols-outlined text-sm">auto_awesome</span> Gerar Template Oficial
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('btn-close-ai-modal').onclick = closeAIGeneratorModal;
  document.getElementById('btn-cancel-ai-modal').onclick = closeAIGeneratorModal;

  // Preset buttons
  document.querySelectorAll('#ai-preset-cards .btn-select-preset').forEach(btn => {
    btn.onclick = () => {
      const key = btn.getAttribute('data-preset-key');
      const preset = AI_PRESETS.find(p => p.key === key);
      if (preset) {
        document.getElementById('ai-custom-prompt-input').value = preset.name;
        handleGenerateAITemplate(preset.name, preset.vertical);
      }
    };
  });

  document.getElementById('btn-generate-ai-template').onclick = () => {
    const input = document.getElementById('ai-custom-prompt-input');
    const prompt = input ? input.value.trim() : '';
    if (!prompt) {
      alert('Por favor, informe a vertical ou selecione um dos presets acima.');
      return;
    }
    handleGenerateAITemplate(prompt);
  };
}

export function openAIGeneratorModal() {
  setupAIGeneratorModal();
  const modal = document.getElementById('modal-ai-generator');
  if (modal) modal.classList.remove('hidden');
}

function closeAIGeneratorModal() {
  const modal = document.getElementById('modal-ai-generator');
  if (modal) modal.classList.add('hidden');
}

function handleGenerateAITemplate(promptText, presetVertical) {
  try {
    const newTemplate = generateTemplateFromPrompt(promptText, presetVertical);
    closeAIGeneratorModal();
    
    // Atualiza o select de verticais no modal de cadastro de clientes
    const verticalSelect = document.getElementById('client-vertical');
    if (verticalSelect && newTemplate) {
      const opt = document.createElement('option');
      opt.value = newTemplate.vertical;
      opt.textContent = `${newTemplate.titulo.replace('Briefing de ', '').slice(0, 35)} (IA)`;
      opt.selected = true;
      verticalSelect.appendChild(opt);
    }

    showToast(`✨ Template "${newTemplate.titulo}" gerado e adicionado à biblioteca StudioIntake com sucesso!`);
  } catch (err) {
    console.error('Erro ao gerar template com IA:', err);
    showToast('❌ Erro ao sintetizar template de briefing.');
  }
}

