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
  saveDigest
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
  }
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

export function initClientPortal() {
  const params = new URLSearchParams(window.location.search);
  const codeParam = params.get('code') || params.get('pin');
  const briefParam = params.get('brief') || params.get('id');

  // 1. Resolve o cliente e a instância
  const instances = getBriefingInstances();
  const clients = getClients();

  if (briefParam) {
    activeInstance = getBriefingInstanceById(briefParam);
  }

  if (codeParam) {
    activeClient = getClientByCode(codeParam);
  }

  // Fallbacks inteligentes se não informou parâmetros
  if (!activeInstance && activeClient) {
    const clientBriefs = instances.filter(i => i.cliente_id === activeClient.id);
    activeInstance = clientBriefs[0] || null;
  } else if (activeInstance && !activeClient) {
    activeClient = getClientById(activeInstance.cliente_id);
  }

  // Se ainda assim não encontrou, usa o primeiro cliente como demonstração
  if (!activeClient) {
    activeClient = clients[0];
  }
  if (!activeInstance) {
    activeInstance = instances.find(i => i.cliente_id === activeClient.id) || instances[0];
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

  // 2. Aplica isolamento de papéis (Gate 4)
  enforceRoleIsolation();
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

  // Atualiza PIN/Código no cabeçalho
  const pinBadge = document.querySelector('header .bg-surface-container span:last-child');
  if (pinBadge && activeClient) {
    pinBadge.textContent = `Código: ${activeClient.codigo_unico}`;
  }

  // Avatar do cliente
  const avatarEl = document.querySelector('header .rounded-full.bg-surface-container-high');
  if (avatarEl && activeClient) {
    avatarEl.textContent = activeClient.empresa.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
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

  formContainer.innerHTML = activeTemplate.secoes.map((secao, sIdx) => {
    return `
      <section class="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 sm:p-8 shadow-xs form-section-block">
        <div class="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/60">
          <div class="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center font-bold text-sm">
            0${sIdx + 1}
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

    case 'select':
      return `
        <div>
          <label class="font-label-md text-label-md text-on-surface font-semibold block mb-1.5" for="${campo.id}">
            ${t(campo.label)} ${campo.obrigatorio ? '<span class="text-rose-600">*</span>' : ''}
          </label>
          <select ${disabledAttr} id="${campo.id}" name="${campo.id}" class="form-input w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-body-md font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}">
            <option value="">${t(UI_STRINGS.selecioneOpcao)}</option>
            ${(campo.opcoes || []).map(opt => {
              const optVal = typeof opt === 'string' ? opt : opt.valor;
              const optLabel = typeof opt === 'string' ? opt : t(opt.label);
              return `<option value="${escapeHtml(optVal)}" ${value === optVal ? 'selected' : ''}>${escapeHtml(optLabel)}</option>`;
            }).join('')}
          </select>
        </div>
      `;

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
    autosaveSignal.textContent = 'Salvando alterações...';
  }

  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (activeInstance) {
      // Calcula progresso
      const totalFields = activeTemplate ? activeTemplate.secoes.reduce((acc, s) => acc + s.campos.length, 0) : 1;
      const filledCount = Object.keys(formAnswers).filter(k => formAnswers[k] && formAnswers[k].length > 0).length;
      const progressPercent = Math.min(100, Math.round((filledCount / totalFields) * 100));

      updateBriefingInstance(activeInstance.id, {
        respostas_brutas: formAnswers,
        anexos: uploadedFiles,
        progresso_percentual: progressPercent,
        status: activeInstance.status === 'rascunho' ? 'em_preenchimento' : activeInstance.status
      });

      // Atualiza visual do indicador
      if (autosaveSignal) {
        autosaveSignal.textContent = 'Salvo automaticamente agora mesmo';
      }

      // Atualiza barra de progresso no topo
      updateTopProgressBar(progressPercent);
    }
  }, 600);
}

function updateTopProgressBar(percent) {
  const bar = document.querySelector('section.bg-surface-container-lowest .bg-primary.h-2');
  if (bar) bar.style.width = `${percent}%`;

  const percentLabel = document.querySelector('section.bg-surface-container-lowest .text-primary.font-semibold');
  if (percentLabel) {
    percentLabel.textContent = `Progresso do Briefing • ${percent}% Concluído`;
  }
}

function setupAutosaveAndDock() {
  // Ajusta o botão principal de envio no rodapé fixo
  const submitBtn = document.querySelector('footer button.bg-primary') || document.querySelector('button#submit-briefing-btn');
  
  // Se não encontrar o dock flutuante no DOM existente, injeta dock premium
  let dock = document.getElementById('client-action-dock');
  if (!dock) {
    dock = document.createElement('div');
    dock.id = 'client-action-dock';
    dock.className = 'fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant py-3.5 px-6 shadow-xl';
    
    const isSubmitted = activeInstance?.status === 'submetido' || activeInstance?.status === 'aprovado_kickoff';

    dock.innerHTML = `
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span id="dock-status-text">${isSubmitted ? 'Briefing submetido e travado para produção.' : 'Suas respostas são salvas automaticamente em tempo real.'}</span>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          ${!isSubmitted ? `
            <button id="btn-submit-final-briefing" type="button" class="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95">
              <span class="material-symbols-outlined text-base">send</span>
              Submeter Briefing Oficial
            </button>
          ` : `
            <div class="px-5 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base">verified</span>
              Protocolo Enviado: #${activeInstance.id}
            </div>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(dock);

    const btnSubmit = document.getElementById('btn-submit-final-briefing');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', handleFinalSubmission);
    }
  }
}

// ============================================================================
// FLUXO DE SUBMISSÃO FINAL
// ============================================================================

function handleFinalSubmission() {
  if (!activeInstance || !activeClient) return;

  const confirmed = confirm('Deseja submeter este briefing oficialmente para a equipe do StudioIntake?\n\nApós o envio, as respostas serão congeladas para início imediato do sprint criativo.');
  if (!confirmed) return;

  // Atualiza instância
  updateBriefingStatus(activeInstance.id, 'submetido');
  updateBriefingInstance(activeInstance.id, {
    respostas_brutas: formAnswers,
    anexos: uploadedFiles,
    progresso_percentual: 100
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
