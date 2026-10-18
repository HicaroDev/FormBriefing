/**
 * StudioIntake — Data Store & Persistence Layer (Offline LocalStorage + Neon Postgres Adapter)
 * 
 * Conforme especificado em SEED.md:
 * - Entidades: Cliente, BriefingTemplate, BriefingInstance, RespostaDigest
 * - Relacionamento 1:N entre Cliente e BriefingInstances
 * - Código Único: CLI-XXXX
 * - Máquina de Estados: rascunho -> enviado -> em_preenchimento -> submetido -> em_revisao -> ajustes_solicitados -> aprovado_kickoff
 */

const STORAGE_KEYS = {
  CLIENTS: 'studiointake_clientes_v2',
  TEMPLATES: 'studiointake_templates_v2',
  INSTANCES: 'studiointake_instancias_v2',
  DIGESTS: 'studiointake_digests_v2',
  CONFIG: 'studiointake_config_v2'
};

// ============================================================================
// 1. DADOS DE DEMONSTRAÇÃO (SEED DATA)
// ============================================================================

export const SEED_TEMPLATES = [
  {
    id: 'tpl-pilates-v1',
    titulo: 'Briefing de Lançamento & Identidade de Studio Pilates Reformer',
    vertical: 'pilates',
    etapa: 'descoberta_inicial',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: '01. Identificação & Contato Direto',
        descricao: 'Informações do responsável pela tomada de decisão e janelas de alinhamento.',
        campos: [
          { id: 'resp_nome', tipo: 'text', label: 'Nome do Decisor Principal', obrigatorio: true, placeholder: 'Ex: Mariana Silveira' },
          { id: 'resp_cargo', tipo: 'text', label: 'Cargo / Função', obrigatorio: true, placeholder: 'Ex: Sócia-Fundadora & CBO' },
          { id: 'contato_horario', tipo: 'select', label: 'Janela Preferencial para Alinhamentos', opcoes: ['Manhã (09h - 12h)', 'Tarde (14h - 18h)', 'Assíncrono via WhatsApp/Loom'] }
        ]
      },
      {
        id: 'sec_02',
        titulo: '02. Objetivos Estratégicos & Escopo',
        descricao: 'Definição precisa dos entregáveis contratados e principal desafio do estúdio.',
        campos: [
          { 
            id: 'escopo_chips', 
            tipo: 'chips_multiselect', 
            label: 'Entregáveis Contratados', 
            opcoes: ['Identidade Visual Completa', 'Design de App Mobile (iOS/Android)', 'Web Portal & Agendamentos', 'Sinalização Tátil 3D', 'Brandbook de Espaço Físico'] 
          },
          { 
            id: 'desafio_central', 
            tipo: 'textarea', 
            label: 'Qual é o maior desafio do negócio que este projeto deve solucionar?', 
            obrigatorio: true,
            placeholder: 'Descreva a dor central, diferenciais frente a concorrentes de pilates e posicionamento desejado.'
          }
        ]
      },
      {
        id: 'sec_03',
        titulo: '03. Atmosfera, Arquitetura e Tom de Marca',
        descricao: 'Calibração estética sensorial para guiar a direção de arte.',
        campos: [
          {
            id: 'seletor_tom',
            tipo: 'cards_single_select',
            label: 'Energia Predominante do Espaço',
            opcoes: [
              { valor: 'Serene & Arquitetônico', rotulo: 'Serene & Arquitetônico', subtitulo: 'Minimalismo escandinavo, pedra travertino, iluminação difusa e calma sensorial.' },
              { valor: 'Earthy & Orgânico', rotulo: 'Earthy & Orgânico', subtitulo: 'Madeira clara, plantas tropicais, argila e texturas de linho cru.' },
              { valor: 'High-Energy Athletic', rotulo: 'High-Energy Athletic', subtitulo: 'Contraste gráfico arrojado, iluminação dinâmica, ritmo e alta performance.' }
            ]
          },
          {
            id: 'slider_estilo',
            tipo: 'slider_range',
            label: 'Postura Visual da Marca (Minimalista vs. Expressivo)',
            min: 0,
            max: 100,
            passo: 5,
            legendaMin: '0% Minimalista / Contido',
            legendaMax: '100% Expressivo / Vibrante'
          }
        ]
      },
      {
        id: 'sec_04',
        titulo: '04. Arquivos, Plantas Baixas e Referências',
        descricao: 'Envio de plantas DWG, imagens do local, moodboards ou marcas anteriores.',
        campos: [
          {
            id: 'anexos_marca',
            tipo: 'file_upload',
            label: 'Upload de Arquivos & Referências Visuais',
            formatos: ['pdf', 'dwg', 'png', 'jpg', 'zip'],
            limiteMB: 50
          }
        ]
      }
    ]
  },
  {
    id: 'tpl-physio-v1',
    titulo: 'Briefing Clínico & Ecossistema de Saúde (Fisioterapia & Reabilitação)',
    vertical: 'physio',
    etapa: 'descoberta_clinica',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: '01. Responsabilidade Técnica & Credenciamento',
        descricao: 'Dados cadastrais do diretor clínico e conformidade com conselhos de saúde.',
        campos: [
          { id: 'resp_nome', tipo: 'text', label: 'Nome do Responsável Técnico (CREFITO)', obrigatorio: true },
          { id: 'registro_profissional', tipo: 'text', label: 'Número de Registro Profissional', obrigatorio: true },
          { id: 'ehr_software', tipo: 'select', label: 'Software de Gestão Clínica / EHR Atual', opcoes: ['Cliniko', 'Prontmed', 'Simples Dental / Saúde', 'Desenvolvimento Próprio', 'Nenhum'] }
        ]
      },
      {
        id: 'sec_02',
        titulo: '02. Jornada do Paciente & Especialidades',
        descricao: 'Fluxo de atendimento, desde a triagem de lesão até o programa de alta.',
        campos: [
          { id: 'especialidades_chips', tipo: 'chips_multiselect', label: 'Especialidades Centrais', opcoes: ['Reabilitação Ortopédica', 'Fisioterapia Esportiva de Alto Rendimento', 'Fisioterapia Pélvica', 'Osteopatia', 'Baropodometria'] },
          { id: 'jornada_paciente', tipo: 'textarea', label: 'Como funciona a triagem inicial do paciente?', obrigatorio: true }
        ]
      },
      {
        id: 'sec_03',
        titulo: '03. Tom de Voz & Conformidade LGPD Saúde',
        descricao: 'Equilíbrio entre acolhimento humanizado e autoridade científica.',
        campos: [
          {
            id: 'seletor_tom',
            tipo: 'cards_single_select',
            label: 'Postura Institucional',
            opcoes: [
              { valor: 'Autoridade Médica Rigorosa', rotulo: 'Autoridade Médica Rigorosa', subtitulo: 'Linguagem baseada em evidências científicas, métricas e precisão diagnóstica.' },
              { valor: 'Acolhimento Humanizado & Conforto', rotulo: 'Acolhimento Humanizado & Conforto', subtitulo: 'Foco na empatia, escuta ativa e redução da ansiedade do paciente.' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'tpl-events-v1',
    titulo: 'Briefing de Grande Porte: Summit, Palco & Credenciamento',
    vertical: 'events',
    etapa: 'producao_cenografia',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: '01. Métricas de Escopo do Evento',
        descricao: 'Público previsto, dias de imersão e estrutura de transmissão.',
        campos: [
          { id: 'publico_total', tipo: 'text', label: 'Público Presencial Previsto', obrigatorio: true, placeholder: 'Ex: 3.500 delegados' },
          { id: 'dias_evento', tipo: 'text', label: 'Data & Duração do Evento', obrigatorio: true, placeholder: 'Ex: 14 a 16 de Novembro de 2026' },
          { id: 'formato_transmissao', tipo: 'select', label: 'Formato de Transmissão', opcoes: ['Presencial Exclusivo', 'Híbrido com Streaming 4K', 'Metaverso / VR'] }
        ]
      },
      {
        id: 'sec_02',
        titulo: '02. Cenografia, Telas de LED & Credenciamento',
        descricao: 'Requisitos de palco principal, interatividade e tecnologia.',
        campos: [
          { id: 'itens_cenografia', tipo: 'chips_multiselect', label: 'Elementos Cenográficos Requeridos', opcoes: ['Painel LED Curvo 360°', 'Credenciamento NFC Madeira', 'App Oficial do Participante', 'Palco Secundário Rodízio', 'Espaço VIP Lounge'] },
          { id: 'diretrizes_cenografia', tipo: 'textarea', label: 'Diretrizes Técnicas de Palco e Iluminação', obrigatorio: true }
        ]
      }
    ]
  },
  {
    id: 'tpl-universal-v1',
    titulo: 'BriefOS — Diagnóstico Estratégico Universal de Negócios',
    vertical: 'universal',
    etapa: 'descoberta_inicial',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: '01. Empresa & Visão de Futuro',
        descricao: 'Posicionamento atual e horizonte de 3 anos.',
        campos: [
          { id: 'visao_empresa', tipo: 'textarea', label: 'Onde a marca pretende estar posicionada nos próximos 3 anos?', obrigatorio: true },
          { id: 'mercados_alvo', tipo: 'chips_multiselect', label: 'Mercados de Atuação', opcoes: ['B2B Enterprise', 'B2C Premium', 'D2C E-commerce', 'Franquias Globais'] }
        ]
      }
    ]
  }
];

export const SEED_CLIENTES = [
  {
    id: 'cli_lumina_01',
    codigo_unico: 'CLI-8429',
    nome_responsavel: 'Helena Vasconcellos',
    cargo: 'Diretora Criativa & Co-Fundadora',
    empresa: 'Lumina Movement Reformer Studio',
    email: 'helena@luminamovement.com',
    whatsapp: '+55 (11) 98452-9011',
    vertical: 'pilates',
    status_cliente: 'ativo',
    data_cadastro: '2026-10-15T09:30:00Z',
    briefings_ids: ['BRF-2025-089']
  },
  {
    id: 'cli_ortho_02',
    codigo_unico: 'CLI-5193',
    nome_responsavel: 'Dr. Rodrigo Mendes',
    cargo: 'Diretor Clínico & Sócio-Fundador',
    empresa: 'OrthoMovement Reab Center',
    email: 'rodrigo@orthomovement.com.br',
    whatsapp: '+55 (41) 99120-4401',
    vertical: 'physio',
    status_cliente: 'ativo',
    data_cadastro: '2026-10-14T14:15:00Z',
    briefings_ids: ['BRF-2025-088']
  },
  {
    id: 'cli_apex_03',
    codigo_unico: 'CLI-7361',
    nome_responsavel: 'Camila Drummond',
    cargo: 'Head de Produção Executiva',
    empresa: 'Apex BioTech Summit 2026',
    email: 'camila@apexbiotech.org',
    whatsapp: '+55 (21) 98701-3320',
    vertical: 'events',
    status_cliente: 'ativo',
    data_cadastro: '2026-10-13T11:00:00Z',
    briefings_ids: ['BRF-2025-085']
  }
];

export const SEED_INSTANCES = [
  {
    id: 'BRF-2025-089',
    cliente_id: 'cli_lumina_01',
    template_id: 'tpl-pilates-v1',
    etapa_nome: 'Fase 1: Diagnóstico de Marca & Espaço',
    status: 'em_revisao',
    link_token: 'tok_lumina_8429',
    link_seguro: 'portal.html?code=CLI-8429&brief=BRF-2025-089',
    progresso_percentual: 100,
    data_envio: '2026-10-16T10:14:00Z',
    data_resposta: '2026-10-16T14:30:00Z',
    urgencia: 'high',
    budget: 'R$ 180.000,00',
    respostas_brutas: {
      resp_nome: 'Mariana Silveira',
      resp_cargo: 'Chief Brand Officer',
      contato_horario: 'Manhã (09h - 12h)',
      escopo_chips: ['Identidade Visual Completa', 'Design de App Mobile (iOS/Android)', 'Sinalização Tátil 3D'],
      desafio_central: 'Repensar toda a jornada física e digital de onboarding de membros para abertura da flagship nos Jardins, integrando app proprietário e sinalização tátil sofisticada em latão e madeira.',
      seletor_tom: 'Serene & Arquitetônico',
      slider_estilo: 70
    },
    anexos: [
      { nome: 'Planta_Baixa_Lumina_Jardins.dwg.pdf', tamanho: '4.2 MB', tipo: 'pdf' },
      { nome: 'Moodboard_Conceito_Travertino.png', tamanho: '8.1 MB', tipo: 'image' }
    ]
  },
  {
    id: 'BRF-2025-088',
    cliente_id: 'cli_ortho_02',
    template_id: 'tpl-physio-v1',
    etapa_nome: 'Fase 1: Diagnóstico Clínico & EHR',
    status: 'aprovado_kickoff',
    link_token: 'tok_ortho_5193',
    link_seguro: 'portal.html?code=CLI-5193&brief=BRF-2025-088',
    progresso_percentual: 100,
    data_envio: '2026-10-15T16:40:00Z',
    data_resposta: '2026-10-16T09:15:00Z',
    urgencia: 'normal',
    budget: 'R$ 120.000,00',
    respostas_brutas: {
      resp_nome: 'Dr. Rodrigo Mendes',
      registro_profissional: 'CREFITO-8 49120-F',
      ehr_software: 'Cliniko',
      especialidades_chips: ['Reabilitação Ortopédica', 'Fisioterapia Esportiva de Alto Rendimento'],
      jornada_paciente: 'Estruturação de portal de triagem de lesões com agendamento direto pelo Cliniko e portal de exercícios prescritos em vídeo 4K.',
      seletor_tom: 'Autoridade Médica Rigorosa'
    },
    anexos: [
      { nome: 'Manual_Cliniko_API_Webhook.pdf', tamanho: '1.4 MB', tipo: 'pdf' }
    ]
  },
  {
    id: 'BRF-2025-085',
    cliente_id: 'cli_apex_03',
    template_id: 'tpl-events-v1',
    etapa_nome: 'Fase 1: Cenografia & Telas LED',
    status: 'submetido',
    link_token: 'tok_apex_7361',
    link_seguro: 'portal.html?code=CLI-7361&brief=BRF-2025-085',
    progresso_percentual: 100,
    data_envio: '2026-10-14T09:20:00Z',
    data_resposta: '2026-10-15T18:00:00Z',
    urgencia: 'high',
    budget: 'R$ 340.000,00',
    respostas_brutas: {
      publico_total: '3.500 delegados presenciais + 10.000 online',
      dias_evento: '14 a 16 de Novembro de 2026',
      formato_transmissao: 'Híbrido com Streaming 4K',
      itens_cenografia: ['Painel LED Curvo 360°', 'Credenciamento NFC Madeira', 'Espaço VIP Lounge'],
      diretrizes_cenografia: 'Palco principal de 24 metros lineares com resolução 8K e sincronização de luz com discursos em tempo real.'
    },
    anexos: [
      { nome: 'Rider_Tecnico_Palco_Principal.pdf', tamanho: '12.8 MB', tipo: 'pdf' }
    ]
  }
];

export const SEED_DIGESTS = [
  {
    id: 'dig_lumina_01',
    briefing_id: 'BRF-2025-089',
    cliente_nome: 'Lumina Movement Reformer Studio',
    objetivo_sintetizado: 'Lançamento de flagship premium com experiência digital sem fricção nos Jardins.',
    pilares_design: [
      'Estética Serene & Arquitetônica (Travertino + Latão)',
      'Tipografia editorial suave e de alta legibilidade',
      'Tom de voz reservado, focado em bem-estar somático e alta precisão'
    ],
    entregaveis_confirmados: ['Identidade Visual', 'Design App Mobile', 'Sinalização 3D Espaço Físico'],
    integracoes_tecnicas: ['Mariana Tek API Webhooks', 'Spotify Playlist Sync'],
    checklist_kickoff: [
      { item: 'Validar planta baixa DWG com equipe de arquitetura civil', status: 'concluido' },
      { item: 'Receber credenciais sandbox da Mariana Tek para agendamentos', status: 'concluido' },
      { item: 'Agendar sessão de kickoff de direção de arte e moodboard tátil', status: 'pendente' },
      { item: 'Definir paleta de acabamentos em latão com fornecedor de serralheria', status: 'pendente' }
    ],
    aprovado_por: 'Gabriel Siqueira (Diretor de Criação)',
    data_aprovacao: '2026-10-16T15:00:00Z'
  },
  {
    id: 'dig_ortho_02',
    briefing_id: 'BRF-2025-088',
    cliente_nome: 'OrthoMovement Reab Center',
    objetivo_sintetizado: 'Portal de triagem de lesões esportivas com integração direta Cliniko EHR.',
    pilares_design: [
      'Autoridade Médica e Clareza Diagnóstica',
      'Layout limpo focado em acessibilidade para pacientes lesionados',
      'Paleta cromática neutra fria com acentos em ciano técnico'
    ],
    entregaveis_confirmados: ['Portal do Paciente Web', 'Integração Webhook Cliniko EHR', 'Player de Vídeos de Reab 4K'],
    integracoes_tecnicas: ['Cliniko API REST v2', 'Mux Video Streaming'],
    checklist_kickoff: [
      { item: 'Configuração de chaves de API Cliniko em ambiente de homologação', status: 'concluido' },
      { item: 'Revisão de termos de consentimento LGPD para dados sensíveis de saúde', status: 'concluido' },
      { item: 'Início do sprint de desenvolvimento do fluxo de auto-agendamento', status: 'concluido' }
    ],
    aprovado_por: 'Dr. Rodrigo Mendes / Gabriel Siqueira',
    data_aprovacao: '2026-10-16T11:30:00Z'
  }
];

// ============================================================================
// 2. FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Gera um Código Único de Cliente no formato CLI-XXXX garantindo unicidade.
 */
export function generateClientCode() {
  const clients = getClients();
  const existingCodes = new Set(clients.map(c => c.codigo_unico));
  
  let newCode = '';
  let attempts = 0;
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    newCode = `CLI-${randomNum}`;
    attempts++;
  } while (existingCodes.has(newCode) && attempts < 100);

  return newCode;
}

/**
 * Gera um identificador único de briefing (ex: BRF-2026-091)
 */
export function generateBriefingId() {
  const instances = getBriefingInstances();
  const year = new Date().getFullYear();
  const seq = instances.length + 90;
  return `BRF-${year}-${String(seq).padStart(3, '0')}`;
}

// ============================================================================
// 3. PERSISTÊNCIA: CLIENTES (CRM)
// ============================================================================

export function getClients() {
  try {
    if (typeof localStorage === 'undefined') return SEED_CLIENTES;
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_CLIENTES));
      return SEED_CLIENTES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler clientes do localStorage:', e);
    return SEED_CLIENTES;
  }
}

export function saveClients(clients) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (e) {
    console.error('Erro ao salvar clientes:', e);
  }
}

export function getClientById(id) {
  const clients = getClients();
  return clients.find(c => c.id === id) || null;
}

export function getClientByCode(code) {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const clients = getClients();
  return clients.find(c => c.codigo_unico.toUpperCase() === clean) || null;
}

export function createClient(data) {
  const clients = getClients();
  const codigo_unico = data.codigo_unico || generateClientCode();
  
  const newClient = {
    id: 'cli_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    codigo_unico: codigo_unico,
    nome_responsavel: data.nome_responsavel || 'Contato Principal',
    cargo: data.cargo || 'Gestor Responsável',
    empresa: data.empresa || 'Nova Empresa',
    email: data.email || 'contato@cliente.com',
    whatsapp: data.whatsapp || '',
    vertical: data.vertical || 'universal',
    status_cliente: 'ativo',
    data_cadastro: new Date().toISOString(),
    briefings_ids: []
  };

  clients.unshift(newClient);
  saveClients(clients);
  return newClient;
}

export function updateClient(id, partial) {
  const clients = getClients();
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) {
    clients[idx] = { ...clients[idx], ...partial };
    saveClients(clients);
    return clients[idx];
  }
  return null;
}

// ============================================================================
// 4. PERSISTÊNCIA: TEMPLATES DE BRIEFING
// ============================================================================

export function getTemplates() {
  try {
    if (typeof localStorage === 'undefined') return SEED_TEMPLATES;
    const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
      return SEED_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler templates:', e);
    return SEED_TEMPLATES;
  }
}

export function getTemplateById(id) {
  const templates = getTemplates();
  return templates.find(t => t.id === id) || null;
}

export function getTemplateByVertical(vertical) {
  const templates = getTemplates();
  return templates.find(t => t.vertical === vertical) || templates[0];
}

export function saveTemplate(template) {
  if (typeof localStorage === 'undefined') return template;
  const templates = getTemplates();
  const idx = templates.findIndex(t => t.id === template.id);
  if (idx !== -1) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  return template;
}

export const addTemplate = saveTemplate;

// ============================================================================
// 5. PERSISTÊNCIA: INSTÂNCIAS DE BRIEFING
// ============================================================================

export function getBriefingInstances() {
  try {
    if (typeof localStorage === 'undefined') return SEED_INSTANCES;
    const raw = localStorage.getItem(STORAGE_KEYS.INSTANCES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INSTANCES, JSON.stringify(SEED_INSTANCES));
      return SEED_INSTANCES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler instâncias de briefing:', e);
    return SEED_INSTANCES;
  }
}

export function saveBriefingInstances(instances) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.INSTANCES, JSON.stringify(instances));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('studiointake:update', { detail: { timestamp: Date.now() } }));
    }
  } catch (e) {
    console.error('Erro ao salvar instâncias de briefing:', e);
  }
}

export function getBriefingInstanceById(id) {
  const instances = getBriefingInstances();
  return instances.find(b => b.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getBriefingsByClientId(clientId) {
  const instances = getBriefingInstances();
  return instances.filter(b => b.cliente_id === clientId);
}

export function createBriefingInstance(data) {
  const instances = getBriefingInstances();
  const client = getClientById(data.cliente_id);
  if (!client) throw new Error('Cliente não encontrado.');

  const id = generateBriefingId();
  const token = 'tok_' + Math.random().toString(36).substring(2, 12);
  const link_seguro = `portal.html?code=${client.codigo_unico}&brief=${id}`;

  const newInstance = {
    id: id,
    cliente_id: client.id,
    template_id: data.template_id || 'tpl-universal-v1',
    etapa_nome: data.etapa_nome || 'Fase 1: Diagnóstico Inicial',
    status: 'enviado',
    link_token: token,
    link_seguro: link_seguro,
    progresso_percentual: 0,
    data_envio: new Date().toISOString(),
    data_resposta: null,
    urgencia: data.urgencia || 'normal',
    budget: data.budget || 'A definir',
    respostas_brutas: {},
    anexos: []
  };

  instances.unshift(newInstance);
  saveBriefingInstances(instances);

  // Vincula o briefing ao cliente
  if (!client.briefings_ids) client.briefings_ids = [];
  client.briefings_ids.push(id);
  updateClient(client.id, { briefings_ids: client.briefings_ids });

  return newInstance;
}

export function updateBriefingInstance(id, partial) {
  const instances = getBriefingInstances();
  const idx = instances.findIndex(b => b.id.toLowerCase() === id.toLowerCase());
  if (idx !== -1) {
    instances[idx] = { ...instances[idx], ...partial };
    saveBriefingInstances(instances);
    return instances[idx];
  }
  return null;
}

export function updateBriefingStatus(id, newStatus, extraData = {}) {
  const updated = updateBriefingInstance(id, { 
    status: newStatus,
    data_resposta: newStatus === 'submetido' ? new Date().toISOString() : undefined,
    ...extraData
  });

  // Se o briefing foi submetido ou aprovado, auto-gera o Digest de Produção caso não exista
  if (newStatus === 'submetido' || newStatus === 'aprovado_kickoff') {
    generateProductionDigest(id);
  }

  return updated;
}

/**
 * Gera ou sintetiza de forma inteligente o Resumo Executivo (Digest)
 * a partir das respostas brutas do cliente e do template aplicado.
 */
export function generateProductionDigest(briefingId) {
  const instance = getBriefingInstanceById(briefingId);
  if (!instance) return null;

  const client = getClientById(instance.cliente_id) || {
    empresa: 'Cliente Corporativo',
    vertical: 'universal',
    codigo_unico: 'CLI-0000'
  };

  const raw = instance.respostas_brutas || {};
  let existingDigest = getDigestByBriefingId(briefingId);

  // 1. Objetivo central sintetizado
  let objetivo = raw.desafio_central || raw.primaryGoal || raw.objetivo_evento || raw.objetivo_clinica || '';
  if (!objetivo) {
    objetivo = `Estruturação estratégica e implementação de alto impacto para a marca ${client.empresa} na vertical ${client.vertical}.`;
  }

  // 2. Pilares de design extraídos
  const pilares = [];
  if (raw.seletor_tom) {
    pilares.push(`Atmosfera: ${raw.seletor_tom}`);
  }
  if (raw.slider_estilo !== undefined) {
    const val = Number(raw.slider_estilo);
    pilares.push(`Direção de Estilo: ${val}% ${val > 50 ? 'Expressivo & Vibrante' : 'Minimalista & Contido'}`);
  }
  if (raw.estilo_visual) {
    pilares.push(`Linguagem Visual: ${raw.estilo_visual}`);
  }
  if (pilares.length === 0) {
    if (client.vertical === 'pilates') {
      pilares.push('Estética Serene & Arquitetônica (Madeira nobre e iluminação difusa)', 'Tipografia editorial sofisticada', 'Equilíbrio sensorial e precisão motora');
    } else if (client.vertical === 'physio') {
      pilares.push('Autoridade Médica e Clareza Diagnóstica', 'Acessibilidade universal para pacientes lesionados', 'Precisão técnica e confiança clínica');
    } else if (client.vertical === 'events') {
      pilares.push('Imersão Visual de Grande Escala', 'Cenografia com alta fidelidade de iluminação e LED', 'Fluxo dinâmico de credenciamento sem atrito');
    } else {
      pilares.push('Design Moderno e Funcional', 'Hierarquia de informação clara', 'Consistência de marca corporativa');
    }
  }

  // 3. Entregáveis confirmados
  let entregaveis = [];
  if (Array.isArray(raw.escopo_chips) && raw.escopo_chips.length > 0) {
    entregaveis = [...raw.escopo_chips];
  } else if (Array.isArray(raw.itens_cenografia) && raw.itens_cenografia.length > 0) {
    entregaveis = [...raw.itens_cenografia];
  } else if (Array.isArray(raw.modulos_sistema) && raw.modulos_sistema.length > 0) {
    entregaveis = [...raw.modulos_sistema];
  } else {
    entregaveis = ['Brandbook Completo', 'Design System Digital', 'Ativos de Produção & Guidelines'];
  }

  // 4. Integrações técnicas
  const integracoes = [];
  if (raw.integracoes) integracoes.push(raw.integracoes);
  if (client.vertical === 'physio') integracoes.push('Cliniko EHR / Prontuário Eletrônico');
  if (client.vertical === 'pilates') integracoes.push('Mariana Tek / Mindbody API');
  if (client.vertical === 'events') integracoes.push('Sistema de Credenciamento NFC & Ingressos');
  if (integracoes.length === 0) integracoes.push('StudioIntake Webhooks & API REST');

  // 5. Checklist de Kickoff inteligente
  const checklist = [
    { item: `Validação das respostas oficiais de ${client.empresa} (${client.codigo_unico})`, status: 'concluido' },
    { item: `Análise técnica de ${(instance.anexos || []).length} anexo(s) submetido(s)`, status: (instance.anexos || []).length > 0 ? 'concluido' : 'pendente' },
    { item: 'Alocação de squad criativo e design lead', status: instance.status === 'aprovado_kickoff' ? 'concluido' : 'pendente' }
  ];

  if (client.vertical === 'pilates') {
    checklist.push({ item: 'Alinhamento com arquitetos civis para aplicação da sinalização física', status: 'pendente' });
    checklist.push({ item: 'Início do sprint de identidade visual e prototipagem do app', status: 'pendente' });
  } else if (client.vertical === 'physio') {
    checklist.push({ item: 'Revisão de compliance LGPD para dados sensíveis de anamnese', status: 'pendente' });
    checklist.push({ item: 'Estruturação do fluxo de auto-agendamento e triagem de pacientes', status: 'pendente' });
  } else if (client.vertical === 'events') {
    checklist.push({ item: 'Aprovação do rider técnico de LED e sinal de transmissão 4K', status: 'pendente' });
    checklist.push({ item: 'Fechamento de fornecedores de credenciais e catracas NFC', status: 'pendente' });
  } else {
    checklist.push({ item: 'Kickoff formal de abertura do sprint de produção', status: 'pendente' });
  }

  const digestData = {
    briefing_id: briefingId,
    cliente_nome: client.empresa,
    objetivo_sintetizado: objetivo,
    pilares_design: pilares,
    entregaveis_confirmados: entregaveis,
    integracoes_tecnicas: integracoes,
    checklist_kickoff: checklist,
    aprovado_por: existingDigest?.aprovado_por || 'Diretoria de Criação',
    data_aprovacao: existingDigest?.data_aprovacao || (instance.status === 'aprovado_kickoff' ? new Date().toISOString() : null)
  };

  return saveDigest(digestData);
}

// ============================================================================
// 6. PERSISTÊNCIA: RESUMOS EXECUTIVOS (DIGEST PARA PRODUÇÃO)
// ============================================================================

export function getDigests() {
  try {
    if (typeof localStorage === 'undefined') return SEED_DIGESTS;
    const raw = localStorage.getItem(STORAGE_KEYS.DIGESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DIGESTS, JSON.stringify(SEED_DIGESTS));
      return SEED_DIGESTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler digests:', e);
    return SEED_DIGESTS;
  }
}

export function getDigestByBriefingId(briefingId) {
  const digests = getDigests();
  return digests.find(d => d.briefing_id.toLowerCase() === briefingId.toLowerCase()) || null;
}

export function saveDigest(digest) {
  if (typeof localStorage === 'undefined') return digest;
  const digests = getDigests();
  const idx = digests.findIndex(d => d.briefing_id === digest.briefing_id);
  if (idx !== -1) {
    digests[idx] = { ...digests[idx], ...digest };
  } else {
    digests.push({
      id: 'dig_' + Date.now().toString(36),
      ...digest
    });
  }
  localStorage.setItem(STORAGE_KEYS.DIGESTS, JSON.stringify(digests));
  return digest;
}

// ============================================================================
// 7. COMPATIBILIDADE DE RETROALIMENTAÇÃO COM DASHBOARD STITCH
// ============================================================================

/**
 * Retorna lista unificada de briefings adaptada para o formato visual de cards e tabelas
 * que o Dashboard do Stitch já renderiza.
 */
export function getUnifiedDashboardBriefs() {
  const instances = getBriefingInstances();
  const clients = getClients();
  const clientsMap = new Map(clients.map(c => [c.id, c]));

  return instances.map(inst => {
    const client = clientsMap.get(inst.cliente_id) || {
      nome_responsavel: 'Desconhecido',
      empresa: 'Cliente',
      codigo_unico: 'CLI-0000',
      email: '',
      vertical: 'universal'
    };

    let verticalLabel = 'Geral';
    let icon = 'folder_open';
    let formUrl = `universal.html?code=${client.codigo_unico}&brief=${inst.id}`;

    if (client.vertical === 'pilates') {
      verticalLabel = 'Pilates';
      icon = 'spa';
      formUrl = `pilates.html?code=${client.codigo_unico}&brief=${inst.id}`;
    } else if (client.vertical === 'physio') {
      verticalLabel = 'Fisioterapia';
      icon = 'medical_services';
      formUrl = `physio.html?code=${client.codigo_unico}&brief=${inst.id}`;
    } else if (client.vertical === 'events') {
      verticalLabel = 'Eventos';
      icon = 'celebration';
      formUrl = `events.html?code=${client.codigo_unico}&brief=${inst.id}`;
    }

    const statusLabels = {
      rascunho: 'Rascunho',
      enviado: 'Enviado',
      em_preenchimento: 'Em Andamento',
      submetido: 'Submetido',
      em_revisao: 'Em Revisão',
      ajustes_solicitados: 'Ajustes Pedidos',
      aprovado_kickoff: 'Kickoff Pronto'
    };

    const initials = client.empresa
      .split(' ')
      .filter(w => w.length > 2)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || 'CI';

    return {
      id: inst.id,
      pin: client.codigo_unico.replace('CLI-', ''),
      codigo_unico: client.codigo_unico,
      clientName: client.empresa,
      concept: inst.etapa_nome,
      vertical: client.vertical,
      verticalLabel: verticalLabel,
      icon: icon,
      location: 'Brasil',
      submissionDate: inst.data_resposta ? new Date(inst.data_resposta).toLocaleDateString('pt-BR') : 'Aguardando',
      urgency: inst.urgencia || 'normal',
      urgencyLabel: inst.urgencia === 'high' ? 'Alta' : 'Normal',
      status: inst.status,
      statusLabel: statusLabels[inst.status] || inst.status,
      budget: inst.budget || 'R$ 150.000,00',
      nextMilestone: inst.status === 'aprovado_kickoff' ? 'Sprint de Produção' : 'Revisão Técnica',
      contactName: client.nome_responsavel,
      contactRole: client.cargo || 'Responsável',
      contactEmail: client.email,
      initials: initials,
      tags: [`#${client.codigo_unico}`, `#${verticalLabel}`],
      primaryGoal: inst.respostas_brutas?.desafio_central || inst.respostas_brutas?.primaryGoal || 'Definição de escopo e estratégia.',
      targetAudience: 'Público corporativo e membros do serviço.',
      assetsCount: `${(inst.anexos || []).length} anexos`,
      formUrl: inst.link_seguro || formUrl
    };
  });
}

/**
 * Alias de compatibilidade com código existente
 */
export function getBriefs() {
  return getUnifiedDashboardBriefs();
}

export function getBriefById(id) {
  const list = getUnifiedDashboardBriefs();
  return list.find(b => b.id.toLowerCase() === id.toLowerCase()) || null;
}

export function getBriefByPin(pin) {
  const clean = pin.replace(/\D/g, '');
  const list = getUnifiedDashboardBriefs();
  return list.find(b => b.pin === clean || b.codigo_unico.includes(clean)) || null;
}

export function getMetrics() {
  const instances = getBriefingInstances();
  const clients = getClients();

  const total = instances.length;
  const review = instances.filter(b => b.status === 'em_revisao' || b.status === 'submetido').length;
  const ready = instances.filter(b => b.status === 'aprovado_kickoff').length;
  const drafts = instances.filter(b => b.status === 'rascunho').length;
  const sent = instances.filter(b => b.status === 'enviado' || b.status === 'em_preenchimento').length;

  return {
    total,
    review,
    ready,
    drafts,
    sent,
    clientsCount: clients.length,
    avgDays: '1.8'
  };
}

// ============================================================================
// 8. TEMPLATES DE DISPARO RÁPIDO & EXPORTAÇÃO
// ============================================================================

/**
 * Gera mensagem formatada pronta para envio ao WhatsApp do cliente
 */
export function generateWhatsAppMessage(clientId, briefingId) {
  const client = getClientById(clientId);
  const instance = getBriefingInstanceById(briefingId);
  if (!client || !instance) return '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullLink = `${origin}/${instance.link_seguro}`;

  return `Olá, ${client.nome_responsavel}! Tudo bem? 👋

Aqui é da equipe de criação do StudioIntake. Para darmos o próximo passo com excelência no projeto da *${client.empresa}*, preparamos o seu briefing exclusivo:

🔗 *Acesse pelo link direto:*
${fullLink}

🔑 *Seu Código de Identificação:* ${client.codigo_unico}

O preenchimento leva cerca de 7 minutos e salva suas respostas automaticamente a cada passo. Qualquer dúvida, estamos à disposição!`;
}

/**
 * Exporta o Resumo Executivo em Markdown pronto para Notion, Linear, Trello ou Jira
 */
export function exportDigestToMarkdown(briefingId) {
  const digest = getDigestByBriefingId(briefingId);
  const instance = getBriefingInstanceById(briefingId);
  const client = instance ? getClientById(instance.cliente_id) : null;

  if (!digest) return '# Resumo não encontrado';

  const checklistText = (digest.checklist_kickoff || [])
    .map(c => `- [${c.status === 'concluido' ? 'x' : ' '}] ${c.item}`)
    .join('\n');

  const pilaresText = (digest.pilares_design || [])
    .map(p => `- ${p}`)
    .join('\n');

  const entregaveisText = (digest.entregaveis_confirmados || [])
    .map(e => `- ${e}`)
    .join('\n');

  return `# Resumo Executivo de Produção — StudioIntake
**Cliente:** ${client ? client.empresa : digest.cliente_nome}  
**Código do Cliente:** ${client ? client.codigo_unico : 'N/A'}  
**Briefing ID:** ${digest.briefing_id}  
**Aprovado por:** ${digest.aprovado_por || 'Diretoria de Criação'}  
**Data:** ${new Date(digest.data_aprovacao || Date.now()).toLocaleDateString('pt-BR')}  

---

## 🎯 Objetivo Sintetizado
> ${digest.objetivo_sintetizado}

## 🎨 Pilares Estéticos & Direção de Arte
${pilaresText}

## 📦 Entregáveis Confirmados
${entregaveisText}

## ✅ Checklist de Kickoff de Produção
${checklistText}
`;
}

/**
 * Reseta o store para a carga inicial de demonstração
 */
export function resetStorageToSeed() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(SEED_CLIENTES));
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(SEED_TEMPLATES));
  localStorage.setItem(STORAGE_KEYS.INSTANCES, JSON.stringify(SEED_INSTANCES));
  localStorage.setItem(STORAGE_KEYS.DIGESTS, JSON.stringify(SEED_DIGESTS));
  console.log('✅ Storage StudioIntake resetado para SEED oficial com sucesso.');
}

// Inicializa dados padrão na primeira execução
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    resetStorageToSeed();
  }
}
