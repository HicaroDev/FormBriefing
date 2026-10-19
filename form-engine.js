/**
 * StudioIntake — Dynamic Form Engine & Client Portal Controller
 * 
 * Cumpre os requisitos de SEED.md e TODO.md (Fases 3 e 4):
 * - Renderizador paramétrico de blocos de perguntas dinâmicas (texto, cards visuais, chips, slider, upload)
 * - Isolamento Zero-Knowledge: remove menus corporativos da agência
 * - Leitura automática de ?code=CLI-XXXX&brief=BRF-YYYY
 * - Autosave em tempo real no store.js com feedback visual
 * - Submissão oficial com bloqueio de edição e emissão de protocolo
 */

import {
  getClients,
  getClientByCode,
  getClientById,
  getTemplates,
  getTemplateById,
  getTemplateByVertical,
  getBriefingInstances,
  getBriefingInstanceById,
  updateBriefingInstance,
  updateBriefingStatus,
  getDigestByBriefingId,
  saveDigest,
  saveClients,
  saveBriefingInstances,
  fetchClientByCodeRemote,
  fetchInstanceByIdRemote,
  patchInstanceRemote
} from './store.js';

let activeClient = null;
let activeInstance = null;
let activeTemplate = null;
let formAnswers = {};
let uploadedFiles = [];
let autosaveTimer = null;

// ============================================================================
// INTERNACIONALIZAÇÃO (PT / IT / EN) — Briefings Multilíngues
// ============================================================================

const SUPPORTED_LOCALES = ['pt', 'it', 'en'];
const LOCALE_LABELS = { pt: 'PT', it: 'IT', en: 'EN' };
let activeLocale = 'pt';

const UI_STRINGS = {
  selecioneOpcao: { pt: 'Selecione uma opção...', it: 'Seleziona un\'opzione...', en: 'Select an option...' },
  selecioneTodos: { pt: '(Selecione todos que se aplicam)', it: '(Seleziona tutte le opzioni pertinenti)', en: '(Select all that apply)' },
  arrasteArquivos: { pt: 'Arraste seus arquivos aqui ou clique para selecionar', it: 'Trascina i file qui o clicca per selezionare', en: 'Drag your files here or click to select' },
  formatosAceitos: { pt: 'Formatos aceitos', it: 'Formati accettati', en: 'Accepted formats' },
  ateMB: { pt: 'Até {n}MB por arquivo', it: 'Fino a {n}MB per file', en: 'Up to {n}MB per file' },
  anexado: { pt: '✓ Anexado', it: '✓ Allegato', en: '✓ Attached' },
  ola: { pt: 'Olá, {nome}!', it: 'Ciao, {nome}!', en: 'Hi, {nome}!' },
  introBriefing: {
    pt: 'Este briefing foi estruturado sob medida para o projeto da <strong>{empresa}</strong>. Suas respostas definem diretamente a direção de arte e a arquitetura técnica antes do kickoff oficial de produção.',
    it: 'Questo briefing è stato strutturato su misura per il progetto di <strong>{empresa}</strong>. Le tue risposte definiscono direttamente la direzione artistica e l\'architettura tecnica prima del kickoff ufficiale di produzione.',
    en: 'This briefing was custom-built for the <strong>{empresa}</strong> project. Your answers directly shape the art direction and technical architecture ahead of the official production kickoff.'
  },
  salvandoAlteracoes: { pt: 'Salvando alterações...', it: 'Salvataggio in corso...', en: 'Saving changes...' },
  salvoAgora: { pt: 'Salvo automaticamente agora mesmo', it: 'Salvato automaticamente ora', en: 'Auto-saved just now' },
  respostasSalvas: { pt: 'Suas respostas são salvas automaticamente em tempo real.', it: 'Le tue risposte vengono salvate automaticamente in tempo reale.', en: 'Your answers are saved automatically in real time.' },
  briefingSubmetidoTravado: { pt: 'Briefing submetido e travado para produção.', it: 'Briefing inviato e bloccato per la produzione.', en: 'Briefing submitted and locked for production.' },
  submeterBriefing: { pt: 'Submeter Briefing Oficial', it: 'Invia Briefing Ufficiale', en: 'Submit Official Briefing' },
  protocoloEnviado: { pt: 'Protocolo Enviado: #{id}', it: 'Protocollo Inviato: #{id}', en: 'Protocol Sent: #{id}' },
  quizerEditar: { pt: 'Quer editar sua resposta?', it: 'Vuoi modificare la tua risposta?', en: 'Want to edit your answer?' }
};

function getLocale() {
  return activeLocale;
}

function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  activeLocale = locale;
  try { localStorage.setItem('studiointake_locale', locale); } catch (e) {}
  renderClientHeader();
  renderDynamicFormSections();
  renderLanguageSwitcher();
  renderActionDock();
}

/**
 * Resolve um valor textual para o idioma ativo.
 * Aceita string pura (compatibilidade com templates antigos) ou objeto {pt, it, en}.
 */
function t(val, vars) {
  let resolved = '';
  if (val == null) {
    resolved = '';
  } else if (typeof val === 'string') {
    resolved = val;
  } else if (typeof val === 'object') {
    resolved = val[activeLocale] || val.pt || val.it || val.en || Object.values(val)[0] || '';
  } else {
    resolved = String(val);
  }
  if (vars) {
    Object.keys(vars).forEach(k => {
      resolved = resolved.replaceAll(`{${k}}`, vars[k]);
    });
  }
  return resolved;
}

function renderLanguageSwitcher() {
  const header = document.querySelector('header');
  if (!header) return;
  let bar = document.getElementById('locale-switcher');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'locale-switcher';
    bar.className = 'flex items-center gap-1 px-1 py-1 rounded-full bg-surface-container border border-outline-variant';
    const pinBadge = header.querySelector('.bg-surface-container.rounded-full, header .flex.items-center.gap-3');
    header.appendChild(bar);
  }
  bar.innerHTML = SUPPORTED_LOCALES.map(loc => `
    <button type="button" data-locale-btn="${loc}" class="px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${loc === activeLocale ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}">
      ${LOCALE_LABELS[loc]}
    </button>
  `).join('');
  bar.querySelectorAll('[data-locale-btn]').forEach(btn => {
    btn.addEventListener('click', () => setLocale(btn.getAttribute('data-locale-btn')));
  });
}

// ============================================================================
// INICIALIZAÇÃO DO PORTAL DO CLIENTE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initClientPortal();
});

export async function initClientPortal() {
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get('code') || params.get('pin');
  const briefParam = params.get('brief') || params.get('id');

  // Isolamento de papéis (Gate 4) sempre primeiro — mesmo a tela de "link
  // inválido" nunca pode expor menus/links internos da agência.
  enforceRoleIsolation();

  // 1. Resolve o cliente e a instância (cache local primeiro)
  let instances = getBriefingInstances();
  let clients = getClients();

  if (briefParam) {
    activeInstance = getBriefingInstanceById(briefParam);
  }

  if (codeParam) {
    activeClient = getClientByCode(codeParam);
  }

  // Sempre revalida contra o banco remoto quando há parâmetros explícitos
  // na URL — nunca confia cegamente no cache local. Isso evita que o
  // cliente veja um estado desatualizado (ex: status "submetido" antigo
  // quando a agência já aprovou/pediu ajustes em outro dispositivo).
  if (codeParam || briefParam) {
    const [remoteClient, remoteInstance] = await Promise.all([
      codeParam ? fetchClientByCodeRemote(codeParam) : Promise.resolve(null),
      briefParam ? fetchInstanceByIdRemote(briefParam) : Promise.resolve(null)
    ]);

    if (remoteClient) {
      clients = [remoteClient, ...clients.filter(c => c.id !== remoteClient.id)];
      saveClients(clients);
      activeClient = remoteClient;
    }
    if (remoteInstance) {
      instances = [remoteInstance, ...instances.filter(i => i.id !== remoteInstance.id)];
      saveBriefingInstances(instances);
      activeInstance = remoteInstance;
    }
  }

  // Isolamento Zero-Leakage: se um código ou brief FOI informado na URL mas
  // não resolveu (nem local, nem remoto), é um link inválido — nunca cair
  // no fallback de "primeiro cliente disponível", ou vazaríamos os dados de
  // outro cliente real que por acaso esteja em cache neste navegador.
  if ((codeParam && !activeClient) || (briefParam && !activeInstance)) {
    renderNoBriefingState();
    return;
  }

  // Fallbacks inteligentes apenas quando NENHUM parâmetro foi informado
  if (!activeInstance && activeClient) {
    const clientBriefs = instances.filter(i => i.cliente_id === activeClient.id);
    activeInstance = clientBriefs[0] || null;
  } else if (activeInstance && !activeClient) {
    activeClient = getClientById(activeInstance.cliente_id);
  }

  if (!codeParam && !briefParam) {
    if (!activeClient) activeClient = clients[0] || null;
    if (!activeInstance && activeClient) {
      activeInstance = instances.find(i => i.cliente_id === activeClient.id) || instances[0] || null;
    }
  }

  if (!activeClient || !activeInstance) {
    renderNoBriefingState();
    return;
  }

  // Resolve o template de perguntas
  if (activeInstance && activeInstance.template_id) {
    activeTemplate = getTemplateById(activeInstance.template_id);
  }
  if (!activeTemplate && activeClient) {
    activeTemplate = getTemplateByVertical(activeClient.vertical);
  }

  // Carrega respostas salvas previamente
  formAnswers = (activeInstance && activeInstance.respostas_brutas) ? { ...activeInstance.respostas_brutas } : {};
  uploadedFiles = (activeInstance && activeInstance.anexos) ? [ ...activeInstance.anexos ] : [];

  // Resolve idioma ativo: ?lang= na URL > preferência salva > português
  const langParam = params.get('lang');
  let savedLocale = null;
  try { savedLocale = localStorage.getItem('studiointake_locale'); } catch (e) {}
  activeLocale = SUPPORTED_LOCALES.includes(langParam) ? langParam : (SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : 'pt');

  renderLanguageSwitcher();

  // 3. Renderiza cabeçalho de contexto do cliente
  renderClientHeader();

  // 4. Renderiza perguntas dinâmicas através do Motor Paramétrico
  renderDynamicFormSections();

  // 5. Configura barra de progresso, autosave e dock de envio
  setupAutosaveAndDock();
}

// ============================================================================
// GATE 4: ISOLAMENTO RIGIDO DE PAPÉIS (ZERO-LEAKAGE)
// ============================================================================

function renderNoBriefingState() {
  // Limpa qualquer texto/dado de demonstração remanescente no cabeçalho
  // estático (nome de empresa, título do briefing, stepper fake).
  const brandSubtext = document.querySelector('header .text-on-surface-variant.flex.items-center');
  if (brandSubtext) brandSubtext.innerHTML = '';

  const titleH1 = document.querySelector('h1.font-headline-lg');
  if (titleH1) titleH1.textContent = '';

  const stepperBox = document.querySelector('section.bg-surface-container-lowest .bg-surface-container-low.border');
  if (stepperBox) stepperBox.remove();

  const main = document.querySelector('main');
  if (!main) return;
  main.innerHTML = `
    <div class="max-w-lg mx-auto mt-20 text-center p-8 rounded-2xl border border-outline-variant bg-surface-container-lowest">
      <span class="material-symbols-outlined text-4xl text-primary mb-3 block">link_off</span>
      <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Link inválido ou expirado</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant">Não encontramos um briefing para este código. Confira o link recebido ou entre em contato com a agência.</p>
    </div>
  `;
}

function enforceRoleIsolation() {
  // Remove links internos da agência (Dashboard, outros briefs de terceiros)
  const navElement = document.querySelector('header nav');
  if (navElement) {
    navElement.innerHTML = `
      <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold border border-outline-variant/60">
        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">shield</span>
        <span>Sessão Exclusiva do Cliente • Link Seguro Verificado</span>
      </div>
    `;
  }
}

// ============================================================================
// CABEÇALHO DO CLIENTE & CONTEXTO
// ============================================================================

function renderClientHeader() {
  if (!activeClient || !activeInstance) return;

  // Nome da empresa no topo
  const brandSubtext = document.querySelector('header .text-on-surface-variant.flex.items-center');
  if (brandSubtext) {
    brandSubtext.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${activeClient.empresa}`;
  }

  // Nome da empresa na nota legal do rodapé (nunca deixar nome de outro cliente vazar)
  const legalFootnote = document.getElementById('legal-footnote-empresa');
  if (legalFootnote) {
    legalFootnote.textContent = `Conexão criptografada TLS 1.3 • Seus dados estratégicos são de propriedade exclusiva do(a) ${activeClient.empresa}.`;
  }

  // PIN/Código no badge do cabeçalho (nunca deixar o PIN fake do mockup vazar)
  const pinBadge = document.getElementById('header-pin-badge');
  if (pinBadge) {
    pinBadge.textContent = `Código: ${activeClient.codigo_unico}`;
  }

  // Avatar do cliente (iniciais da empresa, nunca as iniciais fake do mockup)
  const avatarEl = document.querySelector('header .rounded-full.bg-surface-container-high');
  if (avatarEl) {
    avatarEl.textContent = activeClient.empresa.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  // Título da etapa do briefing
  const titleH1 = document.querySelector('h1.font-headline-lg');
  if (titleH1) {
    titleH1.textContent = t(activeTemplate?.titulo) || activeInstance.etapa_nome;
  }

  // Card Introdutório
  const introCard = document.querySelector('main .bg-surface-container-lowest.border');
  if (introCard) {
    const h2 = introCard.querySelector('h2');
    if (h2) h2.textContent = t(UI_STRINGS.ola, { nome: activeClient.nome_responsavel });

    const p = introCard.querySelector('p');
    if (p) {
      p.innerHTML = t(UI_STRINGS.introBriefing, { empresa: activeClient.empresa });
    }

    // Se a agência solicitou ajustes
    const existingAlert = document.getElementById('alert-ajustes-solicitados');
    if (existingAlert) existingAlert.remove();

    if (activeInstance.status === 'ajustes_solicitados') {
      const alertHtml = `
        <div id="alert-ajustes-solicitados" class="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 animate-in fade-in">
          <span class="material-symbols-outlined text-amber-700 text-2xl shrink-0">edit_note</span>
          <div class="flex-1">
            <h4 class="font-bold text-sm text-amber-900 flex items-center gap-1.5">
              <span>Nota da Direção de Criação: Ajustes Necessários</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-900 uppercase font-semibold">Ação Solicitada</span>
            </h4>
            <p class="text-xs text-amber-800 mt-1 leading-relaxed">${activeInstance.feedback_ajustes || 'Por favor, revise as respostas assinaladas e anexe os arquivos pendentes para prosseguirmos com o kickoff.'}</p>
          </div>
        </div>
      `;
      introCard.insertAdjacentHTML('beforeend', alertHtml);
    }
  }

  renderProgressStepper();
}

/**
 * Calcula e renderiza a barra/estepper de progresso com dados reais do
 * template ativo — nunca o texto fixo "Etapa 1 de 4 • 25%" herdado do
 * mockup estático.
 */
function renderProgressStepper() {
  if (!activeTemplate) return;

  const totalFields = activeTemplate.secoes.reduce((acc, s) => acc + s.campos.length, 0);
  const filledCount = Object.keys(formAnswers).filter(k => {
    const v = formAnswers[k];
    return Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v).length > 0);
  }).length;
  const percent = totalFields > 0 ? Math.min(100, Math.round((filledCount / totalFields) * 100)) : 0;

  const stepLabels = Array.isArray(activeTemplate.partes) && activeTemplate.partes.length > 0
    ? activeTemplate.partes.map(p => t(p))
    : activeTemplate.secoes.map(s => t(s.titulo));
  const totalSteps = stepLabels.length;

  const bar = document.querySelector('section.bg-surface-container-lowest .bg-primary.h-2');
  if (bar) bar.style.width = `${percent}%`;

  const percentLabel = document.querySelector('section.bg-surface-container-lowest .text-primary.font-semibold');
  if (percentLabel) {
    percentLabel.textContent = `${percent}% ${t({ pt: 'Concluído', it: 'Completato', en: 'Completed' })}`;
  }

  const stepsRow = percentLabel?.closest('.bg-surface-container-low')?.querySelector('.mt-2.flex.justify-between');
  if (stepsRow) {
    stepsRow.innerHTML = stepLabels.map((label, i) => `<span>${i + 1}. ${label}</span>`).join('');
  }

  const etaLabel = document.querySelector('section.bg-surface-container-lowest .text-on-surface-variant');
  if (etaLabel && etaLabel.textContent.includes('restantes')) {
    etaLabel.textContent = `${totalSteps} ${t({ pt: totalSteps === 1 ? 'parte' : 'partes', it: 'parti', en: 'parts' })}`;
  }
}

// ============================================================================
// MOTOR PARAMÉTRICO: RENDERER DINÂMICO DE BLOCOS DE PERGUNTAS
// ============================================================================

function renderDynamicFormSections() {
  const main = document.querySelector('main');
  if (!main || !activeTemplate) return;

  // Remove seções estáticas mockadas do template base (mantém apenas o card de boas-vindas)
  const allCards = Array.from(main.querySelectorAll(':scope > div.bg-surface-container-lowest'));
  allCards.slice(1).forEach(el => el.remove());
  const existingDynamic = main.querySelectorAll('.form-section-block');
  existingDynamic.forEach(s => s.remove());

  // Cria container dinâmico de formulário
  let formContainer = document.getElementById('dynamic-form-container');
  if (!formContainer) {
    formContainer = document.createElement('div');
    formContainer.id = 'dynamic-form-container';
    formContainer.className = 'space-y-8';
    main.appendChild(formContainer);
  }

  const isSubmitted = activeInstance?.status === 'submetido' || activeInstance?.status === 'aprovado_kickoff';

  const partes = activeTemplate.partes;
  let lastParte = null;

  formContainer.innerHTML = activeTemplate.secoes.map((secao, sIdx) => {
    let dividerHtml = '';
    if (partes && secao.parte && secao.parte !== lastParte) {
      lastParte = secao.parte;
      dividerHtml = `
        <div class="flex items-center gap-3 pt-2 ${sIdx > 0 ? 'mt-2' : ''}">
          <span class="px-3 py-1 rounded-full bg-primary text-on-primary text-xs font-bold tracking-wide uppercase">
            ${t({ pt: 'Parte', it: 'Parte', en: 'Part' })} ${secao.parte} ${t({ pt: 'de', it: 'di', en: 'of' })} ${partes.length}
          </span>
          <span class="font-headline-sm text-headline-sm font-bold text-on-surface">${t(partes[secao.parte - 1])}</span>
          <div class="flex-1 h-px bg-outline-variant"></div>
        </div>
      `;
    }

    return `
      ${dividerHtml}
      <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-xs form-section-block">
        <div class="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/60">
          <div class="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold text-sm">
            ${String(sIdx + 1).padStart(2, '0')}
          </div>
          <div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold">${t(secao.titulo)}</h2>
            ${secao.descricao ? `<p class="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">${t(secao.descricao)}</p>` : ''}
          </div>
        </div>

        <div class="space-y-6">
          ${secao.campos.map(campo => renderField(campo, isSubmitted)).join('')}
        </div>
      </section>
    `;
  }).join('');

  // Anexa interatividade aos campos
  attachFieldEventListeners(formContainer, isSubmitted);
}

/**
 * Renderiza um campo específico conforme seu tipo schema
 */
function renderField(campo, isReadOnly) {
  const value = formAnswers[campo.id] || '';
  const disabledAttr = isReadOnly ? 'disabled' : '';

  switch (campo.tipo) {
    case 'text':
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1.5" for="${campo.id}">
            ${t(campo.label)} ${campo.obrigatorio ? '<span class="text-rose-600">*</span>' : ''}
          </label>
          <input ${disabledAttr} type="text" id="${campo.id}" name="${campo.id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(t(campo.placeholder))}" class="form-input w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isReadOnly ? 'opacity-70 cursor-not-allowed bg-surface-container' : ''}">
        </div>
      `;

    case 'textarea':
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1.5" for="${campo.id}">
            ${t(campo.label)} ${campo.obrigatorio ? '<span class="text-rose-600">*</span>' : ''}
          </label>
          <textarea ${disabledAttr} id="${campo.id}" name="${campo.id}" rows="4" placeholder="${escapeHtml(t(campo.placeholder))}" class="form-input w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y ${isReadOnly ? 'opacity-70 cursor-not-allowed bg-surface-container' : ''}">${escapeHtml(value)}</textarea>
        </div>
      `;

    case 'select': {
      const outroFieldId = campo.outraOpcaoValor ? `${campo.id}__outro` : null;
      const outroValue = outroFieldId ? (formAnswers[outroFieldId] || '') : '';
      const showOutro = campo.outraOpcaoValor && value === campo.outraOpcaoValor;
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1.5" for="${campo.id}">
            ${t(campo.label)} ${campo.obrigatorio ? '<span class="text-rose-600">*</span>' : ''}
          </label>
          <select ${disabledAttr} id="${campo.id}" name="${campo.id}" ${outroFieldId ? `data-outro-for="${outroFieldId}" data-outro-trigger="${escapeHtml(campo.outraOpcaoValor)}"` : ''} class="form-input w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}">
            <option value="">${t(UI_STRINGS.selecioneOpcao)}</option>
            ${(campo.opcoes || []).map(opt => {
              const optVal = typeof opt === 'string' ? opt : opt.valor;
              const optLabel = typeof opt === 'string' ? opt : t(opt.label);
              return `<option value="${escapeHtml(optVal)}" ${value === optVal ? 'selected' : ''}>${escapeHtml(optLabel)}</option>`;
            }).join('')}
          </select>
          ${outroFieldId ? `
            <input ${disabledAttr} type="text" id="${outroFieldId}" name="${outroFieldId}" value="${escapeHtml(outroValue)}" placeholder="${escapeHtml(t(campo.outraOpcaoLabel))}" class="form-input w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-md font-body-md placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mt-2 ${showOutro ? '' : 'hidden'} ${isReadOnly ? 'opacity-70 cursor-not-allowed bg-surface-container' : ''}">
          ` : ''}
        </div>
      `;
    }

    case 'cards_single_select':
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-2">
            ${t(campo.label)} ${campo.obrigatorio ? '<span class="text-rose-600">*</span>' : ''}
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5" data-field-id="${campo.id}">
            ${(campo.opcoes || []).map(opt => {
              const optVal = typeof opt === 'string' ? opt : opt.valor;
              const optLabel = typeof opt === 'string' ? opt : t(opt.rotulo);
              const optSub = typeof opt === 'object' ? t(opt.subtitulo) : '';
              const isSelected = value === optVal;

              return `
                <div class="card-tone-option p-4 rounded-xl border ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-outline-variant bg-surface-container-lowest hover:border-primary/50'} ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'} transition-all relative" data-value="${escapeHtml(optVal)}">
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="font-label-md text-label-md font-bold text-on-surface">${optLabel}</span>
                    <span class="check-icon w-5 h-5 rounded-full ${isSelected ? 'bg-primary text-on-primary' : 'border border-outline-variant bg-surface-container-low text-transparent'} flex items-center justify-center text-xs">
                      ✓
                    </span>
                  </div>
                  ${optSub ? `<p class="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">${optSub}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <input type="hidden" id="${campo.id}" name="${campo.id}" value="${escapeHtml(value)}">
        </div>
      `;

    case 'chips_multiselect':
      const selectedChips = Array.isArray(value) ? value : (value ? [value] : []);
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-2">
            ${t(campo.label)} <span class="text-xs text-on-surface-variant font-normal">${t(UI_STRINGS.selecioneTodos)}</span>
          </label>
          <div class="flex flex-wrap gap-2" data-chips-id="${campo.id}">
            ${(campo.opcoes || []).map(chip => {
              const chipVal = typeof chip === 'string' ? chip : chip.valor;
              const chipLabel = typeof chip === 'string' ? chip : t(chip.label);
              const isSelected = selectedChips.includes(chipVal);
              return `
                <button type="button" ${disabledAttr} class="chip-option px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${isSelected ? 'bg-primary text-on-primary border-primary shadow-xs' : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/50'} ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}" data-chip="${escapeHtml(chipVal)}">
                  ${escapeHtml(chipLabel)}
                </button>
              `;
            }).join('')}
          </div>
          <input type="hidden" id="${campo.id}" name="${campo.id}" value="${escapeHtml(JSON.stringify(selectedChips))}">
        </div>
      `;

    case 'slider_range':
      const sliderVal = typeof value === 'number' ? value : (value ? Number(value) : 50);
      return `
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-label-md text-label-md text-on-surface font-semibold" for="${campo.id}">
              ${t(campo.label)}
            </label>
            <span id="slider-val-${campo.id}" class="px-2 py-0.5 rounded bg-surface-container text-primary font-bold text-xs font-mono">
              ${sliderVal}%
            </span>
          </div>
          <input ${disabledAttr} type="range" id="${campo.id}" name="${campo.id}" min="${campo.min || 0}" max="${campo.max || 100}" step="${campo.passo || 5}" value="${sliderVal}" class="slider-input w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary">
          <div class="flex justify-between items-center text-[11px] text-on-surface-variant font-label-sm mt-1.5">
            <span>${t(campo.legendaMin) || '0% Minimalista'}</span>
            <span>${t(campo.legendaMax) || '100% Expressivo'}</span>
          </div>
        </div>
      `;

    case 'file_upload':
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-2">
            ${t(campo.label)}
          </label>
          ${!isReadOnly ? `
            <div id="dropzone-${campo.id}" class="border-2 border-dashed border-outline-variant hover:border-primary bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl p-6 text-center transition-all cursor-pointer">
              <span class="material-symbols-outlined text-4xl text-primary mb-2 block">cloud_upload</span>
              <p class="font-label-md text-label-md text-on-surface font-bold">${t(UI_STRINGS.arrasteArquivos)}</p>
              <p class="font-body-sm text-body-sm text-on-surface-variant text-xs mt-1">
                ${t(UI_STRINGS.formatosAceitos)}: ${(campo.formatos || ['PDF', 'PNG', 'JPG', 'DWG', 'ZIP']).join(', ').toUpperCase()} • ${t(UI_STRINGS.ateMB, { n: campo.limiteMB || 50 })}
              </p>
              <input type="file" id="file-input-${campo.id}" multiple class="hidden">
            </div>
          ` : ''}

          <!-- Lista de Arquivos Anexados -->
          <div id="file-list-${campo.id}" class="space-y-2 mt-3">
            ${uploadedFiles.map((file, fIdx) => `
              <div class="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="material-symbols-outlined text-primary text-xl">description</span>
                  <div class="truncate">
                    <p class="font-label-md text-label-md text-on-surface font-semibold truncate">${file.nome}</p>
                    <span class="text-[11px] text-outline">${file.tamanho || 'Arquivo'}</span>
                  </div>
                </div>
                ${!isReadOnly ? `
                  <button type="button" class="btn-remove-file p-1 text-on-surface-variant hover:text-rose-600 rounded" data-index="${fIdx}">
                    <span class="material-symbols-outlined text-base">close</span>
                  </button>
                ` : `<span class="text-xs font-semibold text-emerald-600">${t(UI_STRINGS.anexado)}</span>`}
              </div>
            `).join('')}
          </div>
        </div>
      `;

    default:
      return '';
  }
}

// ============================================================================
// EVENTOS DOS CAMPOS & AUTOSAVE
// ============================================================================

function attachFieldEventListeners(container, isReadOnly) {
  if (isReadOnly) return;

  // 1. Text Inputs e Textareas
  container.querySelectorAll('input.form-input, textarea.form-input, select.form-input').forEach(el => {
    el.addEventListener('input', () => {
      formAnswers[el.name] = el.value;
      triggerAutosave();
    });
  });

  // 1b. Selects com campo "Outro" (mostra/esconde o campo de texto livre)
  container.querySelectorAll('select[data-outro-for]').forEach(select => {
    select.addEventListener('change', () => {
      const outroInput = document.getElementById(select.getAttribute('data-outro-for'));
      if (!outroInput) return;
      const shouldShow = select.value === select.getAttribute('data-outro-trigger');
      outroInput.classList.toggle('hidden', !shouldShow);
      if (shouldShow) {
        outroInput.focus();
      } else {
        outroInput.value = '';
        formAnswers[outroInput.name] = '';
        triggerAutosave();
      }
    });
  });

  // 2. Cards de Seleção Única (Tone Pickers)
  container.querySelectorAll('.card-tone-option').forEach(card => {
    card.addEventListener('click', () => {
      const parent = card.closest('[data-field-id]');
      const fieldId = parent.getAttribute('data-field-id');
      const val = card.getAttribute('data-value');

      parent.querySelectorAll('.card-tone-option').forEach(c => {
        c.className = 'card-tone-option p-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:border-primary/50 cursor-pointer transition-all relative';
        const chk = c.querySelector('.check-icon');
        if (chk) {
          chk.className = 'check-icon w-5 h-5 rounded-full border border-outline-variant bg-surface-container-low text-transparent flex items-center justify-center text-xs';
        }
      });

      card.className = 'card-tone-option p-4 rounded-xl border border-primary bg-primary/5 ring-2 ring-primary/20 cursor-pointer transition-all relative';
      const activeChk = card.querySelector('.check-icon');
      if (activeChk) {
        activeChk.className = 'check-icon w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs';
      }

      formAnswers[fieldId] = val;
      const hiddenInput = document.getElementById(fieldId);
      if (hiddenInput) hiddenInput.value = val;

      triggerAutosave();
    });
  });

  // 3. Chips de Múltipla Escolha
  container.querySelectorAll('[data-chips-id]').forEach(chipsContainer => {
    const fieldId = chipsContainer.getAttribute('data-chips-id');
    let currentSelection = Array.isArray(formAnswers[fieldId]) ? [...formAnswers[fieldId]] : [];

    chipsContainer.querySelectorAll('.chip-option').forEach(chipBtn => {
      chipBtn.addEventListener('click', () => {
        const chipVal = chipBtn.getAttribute('data-chip');
        if (currentSelection.includes(chipVal)) {
          currentSelection = currentSelection.filter(c => c !== chipVal);
          chipBtn.className = 'chip-option px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-primary/50 cursor-pointer';
        } else {
          currentSelection.push(chipVal);
          chipBtn.className = 'chip-option px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all bg-primary text-on-primary border-primary shadow-xs cursor-pointer';
        }

        formAnswers[fieldId] = currentSelection;
        const hiddenInput = document.getElementById(fieldId);
        if (hiddenInput) hiddenInput.value = JSON.stringify(currentSelection);

        triggerAutosave();
      });
    });
  });

  // 4. Sliders
  container.querySelectorAll('.slider-input').forEach(slider => {
    slider.addEventListener('input', () => {
      const badge = document.getElementById(`slider-val-${slider.id}`);
      if (badge) badge.textContent = `${slider.value}%`;
      formAnswers[slider.id] = Number(slider.value);
      triggerAutosave();
    });
  });

  // 5. File Upload Dropzone
  const dropzone = container.querySelector('[id^="dropzone-"]');
  if (dropzone) {
    const fieldId = dropzone.id.replace('dropzone-', '');
    const fileInput = document.getElementById(`file-input-${fieldId}`);

    dropzone.addEventListener('click', () => fileInput && fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('border-primary', 'bg-primary/5');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('border-primary', 'bg-primary/5');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-primary', 'bg-primary/5');
      if (e.dataTransfer.files) {
        handleFileAddition(e.dataTransfer.files, fieldId);
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files) {
          handleFileAddition(fileInput.files, fieldId);
        }
      });
    }
  }

  // Remoção de arquivos
  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.btn-remove-file');
    if (removeBtn) {
      const idx = Number(removeBtn.getAttribute('data-index'));
      uploadedFiles.splice(idx, 1);
      renderDynamicFormSections();
      triggerAutosave();
    }
  });
}

function handleFileAddition(filesList, fieldId) {
  for (let i = 0; i < filesList.length; i++) {
    const f = filesList[i];
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    uploadedFiles.push({
      nome: f.name,
      tamanho: `${sizeMB} MB`,
      tipo: f.name.split('.').pop().toLowerCase()
    });
  }

  renderDynamicFormSections();
  triggerAutosave();
}

// ============================================================================
// AUTOSAVE & BARRA DE SUBMISSÃO (ACTION DOCK)
// ============================================================================

function triggerAutosave() {
  const autosaveSignal = document.querySelector('section.bg-surface-container-lowest .text-on-surface-variant span:last-child');
  if (autosaveSignal) {
    autosaveSignal.textContent = t(UI_STRINGS.salvandoAlteracoes);
  }

  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (activeInstance) {
      // Calcula progresso
      const totalFields = activeTemplate ? activeTemplate.secoes.reduce((acc, s) => acc + s.campos.length, 0) : 1;
      const filledCount = Object.keys(formAnswers).filter(k => formAnswers[k] && formAnswers[k].length > 0).length;
      const progressPercent = Math.min(100, Math.round((filledCount / totalFields) * 100));

      const novoStatus = activeInstance.status === 'rascunho' ? 'em_preenchimento' : activeInstance.status;
      updateBriefingInstance(activeInstance.id, {
        respostas_brutas: formAnswers,
        anexos: uploadedFiles,
        progresso_percentual: progressPercent,
        status: novoStatus
      });

      // Sincroniza com o banco remoto (não bloqueia a UI)
      patchInstanceRemote({
        id: activeInstance.id,
        respostas_brutas: formAnswers,
        anexos: uploadedFiles,
        progresso_percentual: progressPercent,
        status: novoStatus
      });

      // Atualiza visual do indicador
      if (autosaveSignal) {
        autosaveSignal.textContent = t(UI_STRINGS.salvoAgora);
      }

      // Atualiza barra de progresso no topo (dados reais, não decorativos)
      renderProgressStepper();
    }
  }, 600);
}

function renderActionDock() {
  let dock = document.getElementById('client-action-dock');
  if (!dock) {
    dock = document.createElement('div');
    dock.id = 'client-action-dock';
    dock.className = 'fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant py-3.5 px-6 shadow-xl';
    document.body.appendChild(dock);
  }

  const isSubmitted = activeInstance?.status === 'submetido' || activeInstance?.status === 'aprovado_kickoff';
  // Edição só pode ser solicitada enquanto está "submetido" aguardando revisão.
  // Depois que a agência aprova (aprovado_kickoff), fica travado para sempre.
  const podeSolicitarEdicao = activeInstance?.status === 'submetido';

  dock.innerHTML = `
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span id="dock-status-text">${isSubmitted ? t(UI_STRINGS.briefingSubmetidoTravado) : t(UI_STRINGS.respostasSalvas)}</span>
      </div>
      <div class="flex items-center gap-3 w-full sm:w-auto">
        ${!isSubmitted ? `
          <button id="btn-submit-final-briefing" type="button" class="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95">
            <span class="material-symbols-outlined text-base">send</span>
            ${t(UI_STRINGS.submeterBriefing)}
          </button>
        ` : `
          <div class="px-5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-base">verified</span>
            ${t(UI_STRINGS.protocoloEnviado, { id: activeInstance.id })}
          </div>
          ${podeSolicitarEdicao ? `
            <button id="btn-request-edit" type="button" class="text-xs font-semibold text-primary hover:underline">
              ${t(UI_STRINGS.quizerEditar)}
            </button>
          ` : ''}
        `}
      </div>
    </div>
  `;

  const btnSubmit = document.getElementById('btn-submit-final-briefing');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', handleFinalSubmission);
  }

  const btnRequestEdit = document.getElementById('btn-request-edit');
  if (btnRequestEdit) {
    btnRequestEdit.addEventListener('click', openEditUnlockModal);
  }
}

const EDIT_UNLOCK_STRINGS = {
  titulo: { pt: 'Confirmar identidade para editar', it: 'Conferma identità per modificare', en: 'Confirm identity to edit' },
  descricao: {
    pt: 'Para sua segurança, confirme o e-mail usado no envio original para liberar a edição.',
    it: 'Per la tua sicurezza, conferma l\'email usata nell\'invio originale per sbloccare la modifica.',
    en: 'For your security, confirm the email used in the original submission to unlock editing.'
  },
  emailLabel: { pt: 'E-mail', it: 'Email', en: 'Email' },
  cancelar: { pt: 'Cancelar', it: 'Annulla', en: 'Cancel' },
  liberar: { pt: 'Liberar Edição', it: 'Sblocca Modifica', en: 'Unlock Editing' },
  erroNaoBate: { pt: 'E-mail não confere com o do envio original.', it: 'L\'email non corrisponde a quella dell\'invio originale.', en: 'Email does not match the original submission.' }
};

function openEditUnlockModal() {
  const existing = document.getElementById('edit-unlock-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-unlock-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4';
  modal.innerHTML = `
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-6 max-w-sm w-full">
      <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface mb-1.5">${t(EDIT_UNLOCK_STRINGS.titulo)}</h3>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">${t(EDIT_UNLOCK_STRINGS.descricao)}</p>
      <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1" for="edit-unlock-email">${t(EDIT_UNLOCK_STRINGS.emailLabel)}</label>
      <input type="email" id="edit-unlock-email" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md">
      <p id="edit-unlock-error" class="text-rose-600 text-xs mt-1.5 hidden">${t(EDIT_UNLOCK_STRINGS.erroNaoBate)}</p>
      <div class="flex items-center justify-end gap-2 mt-4">
        <button type="button" id="edit-unlock-cancel" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-label-md font-semibold">${t(EDIT_UNLOCK_STRINGS.cancelar)}</button>
        <button type="button" id="edit-unlock-ok" class="px-5 py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold">${t(EDIT_UNLOCK_STRINGS.liberar)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('edit-unlock-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('edit-unlock-ok').addEventListener('click', () => {
    const emailDigitado = document.getElementById('edit-unlock-email').value.trim().toLowerCase();
    const emailOriginal = (formAnswers.__confirmado_email || '').trim().toLowerCase();
    const errorEl = document.getElementById('edit-unlock-error');

    if (!emailDigitado || !emailOriginal || emailDigitado !== emailOriginal) {
      errorEl.classList.remove('hidden');
      return;
    }

    modal.remove();
    unlockForEditing();
  });
}

function unlockForEditing() {
  const novoStatus = 'em_preenchimento';
  updateBriefingInstance(activeInstance.id, { status: novoStatus });
  patchInstanceRemote({ id: activeInstance.id, status: novoStatus });
  activeInstance.status = novoStatus;
  renderDynamicFormSections();
  renderActionDock();
}

function setupAutosaveAndDock() {
  renderActionDock();
}

// ============================================================================
// FLUXO DE SUBMISSÃO FINAL
// ============================================================================

const SUBMIT_CONFIRM_STRINGS = {
  titulo: { pt: 'Confirmar envio do briefing', it: 'Conferma invio del briefing', en: 'Confirm briefing submission' },
  descricao: {
    pt: 'Para sua segurança, confirme seu nome e e-mail antes do envio final. Após o envio, as respostas serão congeladas.',
    it: 'Per la tua sicurezza, conferma il tuo nome e la tua email prima dell\'invio finale. Dopo l\'invio, le risposte saranno bloccate.',
    en: 'For your security, confirm your name and email before final submission. After submitting, your answers will be locked.'
  },
  nomeLabel: { pt: 'Nome completo', it: 'Nome completo', en: 'Full name' },
  emailLabel: { pt: 'E-mail', it: 'Email', en: 'Email' },
  cancelar: { pt: 'Cancelar', it: 'Annulla', en: 'Cancel' },
  confirmarEnvio: { pt: 'Confirmar e Enviar', it: 'Conferma e Invia', en: 'Confirm and Submit' },
  erroObrigatorio: { pt: 'Preencha nome e e-mail para confirmar o envio.', it: 'Compila nome ed email per confermare l\'invio.', en: 'Fill in name and email to confirm submission.' },
  erroEmailInvalido: { pt: 'Informe um e-mail válido.', it: 'Inserisci un\'email valida.', en: 'Enter a valid email.' }
};

function handleFinalSubmission() {
  if (!activeInstance || !activeClient) return;

  const existingModal = document.getElementById('submit-confirm-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'submit-confirm-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4';
  modal.innerHTML = `
    <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-6 max-w-sm w-full">
      <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface mb-1.5">${t(SUBMIT_CONFIRM_STRINGS.titulo)}</h3>
      <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">${t(SUBMIT_CONFIRM_STRINGS.descricao)}</p>
      <div class="space-y-3 mb-2">
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1" for="submit-confirm-nome">${t(SUBMIT_CONFIRM_STRINGS.nomeLabel)}</label>
          <input type="text" id="submit-confirm-nome" value="${escapeHtml(activeClient.nome_responsavel || '')}" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md">
        </div>
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1" for="submit-confirm-email">${t(SUBMIT_CONFIRM_STRINGS.emailLabel)}</label>
          <input type="email" id="submit-confirm-email" value="${escapeHtml(activeClient.email || '')}" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md">
        </div>
        <p id="submit-confirm-error" class="text-rose-600 text-xs hidden"></p>
      </div>
      <div class="flex items-center justify-end gap-2 mt-4">
        <button type="button" id="submit-confirm-cancel" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface text-label-md font-semibold">${t(SUBMIT_CONFIRM_STRINGS.cancelar)}</button>
        <button type="button" id="submit-confirm-ok" class="px-5 py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold">${t(SUBMIT_CONFIRM_STRINGS.confirmarEnvio)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('submit-confirm-cancel').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  document.getElementById('submit-confirm-ok').addEventListener('click', () => {
    const nome = document.getElementById('submit-confirm-nome').value.trim();
    const email = document.getElementById('submit-confirm-email').value.trim();
    const errorEl = document.getElementById('submit-confirm-error');
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nome || !email) {
      errorEl.textContent = t(SUBMIT_CONFIRM_STRINGS.erroObrigatorio);
      errorEl.classList.remove('hidden');
      return;
    }
    if (!emailValido) {
      errorEl.textContent = t(SUBMIT_CONFIRM_STRINGS.erroEmailInvalido);
      errorEl.classList.remove('hidden');
      return;
    }

    modal.remove();
    executeFinalSubmission(nome, email);
  });
}

function executeFinalSubmission(confirmadoNome, confirmadoEmail) {
  formAnswers.__confirmado_nome = confirmadoNome;
  formAnswers.__confirmado_email = confirmadoEmail;

  // Atualiza instância
  updateBriefingStatus(activeInstance.id, 'submetido');
  updateBriefingInstance(activeInstance.id, {
    respostas_brutas: formAnswers,
    anexos: uploadedFiles,
    progresso_percentual: 100
  });

  // Sincroniza submissão final com o banco remoto
  patchInstanceRemote({
    id: activeInstance.id,
    status: 'submetido',
    respostas_brutas: formAnswers,
    anexos: uploadedFiles,
    progresso_percentual: 100,
    data_resposta: new Date().toISOString()
  });

  // Gera o Digest preliminar para a agência
  const digest = {
    briefing_id: activeInstance.id,
    cliente_nome: activeClient.empresa,
    objetivo_sintetizado: formAnswers.desafio_central || formAnswers.visao_empresa || 'Briefing preenchido com sucesso pelo cliente.',
    pilares_design: [
      formAnswers.seletor_tom || 'Estética Alinhada com a Marca',
      `Intensidade Visual: ${formAnswers.slider_estilo || 70}%`
    ],
    entregaveis_confirmados: formAnswers.escopo_chips || ['Identidade Visual', 'Portal Web'],
    integracoes_tecnicas: ['Revisão técnica em andamento'],
    checklist_kickoff: [
      { item: 'Submissão formal concluída pelo decisor', status: 'concluido' },
      { item: 'Triação preliminar de anexos e referências', status: 'concluido' },
      { item: 'Aprovação final do diretor de criação', status: 'pendente' }
    ]
  };
  saveDigest(digest);

  // Exibe tela comemorativa / modal de protocolo
  showSubmissionSuccessModal();
}

function showSubmissionSuccessModal() {
  const modalHtml = `
    <div id="modal-success-submission" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-200">
        <div class="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-3xl">task_alt</span>
        </div>
        <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">Briefing Submetido com Sucesso!</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant text-sm leading-relaxed mb-6">
          Obrigado, <strong>${activeClient.nome_responsavel}</strong>! As diretrizes da <strong>${activeClient.empresa}</strong> já estão na mesa dos nossos diretores criativos.
        </p>

        <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant mb-6 text-left space-y-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-on-surface-variant">Código do Cliente:</span>
            <span class="font-bold text-on-surface font-mono">${activeClient.codigo_unico}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">Protocolo do Briefing:</span>
            <span class="font-bold text-primary font-mono">${activeInstance.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">Status:</span>
            <span class="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Em Triagem Técnica</span>
          </div>
        </div>

        <button onclick="window.location.reload()" class="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-md text-label-md font-semibold transition-all shadow-sm">
          Visualizar Resumo das Minhas Respostas
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ============================================================================
// HELPER UTILS
// ============================================================================

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
