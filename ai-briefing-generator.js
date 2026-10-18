/**
 * StudioIntake — Módulo de IA para Geração Parametrizada de Novos Briefings
 * 
 * Conforme especificado no SEED.md e TODO.md (Fase 6):
 * - 6.1: Especificação de Prompt rigoroso & motor de geração de templates parametrizados
 * - 6.2: Gerador de Resumo Executivo e Checklist de Produção via síntese inteligente
 */

import { addTemplate, getTemplates, saveDigest, getDigestByBriefingId } from './store.js';

// ============================================================================
// 1. ESPECIFICAÇÃO DE PROMPT PARA MODELOS LLM (GEMINI / CLAUDE / GPT-4)
// ============================================================================

export const AI_BRIEFING_SYSTEM_PROMPT = `
Você é o Senior Design & Operations Architect do StudioIntake, uma plataforma de briefings de alto padrão para estúdios criativos e agências boutique.
Sua missão é gerar um Template de Briefing Parametrizado rigorosamente estruturado em JSON para um novo cliente ou vertical de mercado.

FORMATO OBRIGATÓRIO DE SAÍDA (JSON Puro, sem markdown em volta):
{
  "id": "tpl-{slug}-v1",
  "titulo": "Briefing de {Nome da Vertical}",
  "vertical": "{slug}",
  "etapa": "descoberta_inicial",
  "versao": 1,
  "secoes": [
    {
      "id": "sec_01",
      "titulo": "01. Identificação & Tomada de Decisão",
      "descricao": "Informações estratégicas e janelas de contato com decisores.",
      "campos": [
        { "id": "resp_nome", "tipo": "text", "label": "Nome do Decisor Principal", "obrigatorio": true, "placeholder": "Nome completo" },
        { "id": "resp_cargo", "tipo": "text", "label": "Cargo / Função", "obrigatorio": true, "placeholder": "Cargo executivo" },
        { "id": "janela_alinhamento", "tipo": "select", "label": "Janela Preferencial para Alinhamentos", "opcoes": ["Manhã (09h - 12h)", "Tarde (14h - 18h)", "Assíncrono via Loom/Slack"] }
      ]
    },
    {
      "id": "sec_02",
      "titulo": "02. Desafio Estratégico & Escopo Contratado",
      "descricao": "Definição do escopo prático e diferencial de mercado.",
      "campos": [
        { "id": "escopo_chips", "tipo": "chips_multiselect", "label": "Entregáveis Contratados", "opcoes": ["..."] },
        { "id": "desafio_central", "tipo": "textarea", "label": "Qual é a dor central ou oportunidade deste projeto?", "obrigatorio": true, "placeholder": "Descreva em detalhes..." }
      ]
    },
    {
      "id": "sec_03",
      "titulo": "03. Atmosfera, Identidade & Direção Estética",
      "descricao": "Calibração visual e sensorial da marca.",
      "campos": [
        {
          "id": "seletor_tom",
          "tipo": "cards_single_select",
          "label": "Atmosfera Predominante da Marca",
          "opcoes": [
            { "valor": "Opção A", "rotulo": "Opção A", "subtitulo": "Descrição sensorial detalhada" },
            { "valor": "Opção B", "rotulo": "Opção B", "subtitulo": "Descrição sensorial detalhada" },
            { "valor": "Opção C", "rotulo": "Opção C", "subtitulo": "Descrição sensorial detalhada" }
          ]
        },
        {
          "id": "slider_estilo",
          "tipo": "slider_range",
          "label": "Postura Visual (Minimalista vs. Expressivo)",
          "min": 0,
          "max": 100,
          "passo": 5,
          "legendaMin": "0% Minimalista / Contido",
          "legendaMax": "100% Expressivo / Vibrante"
        }
      ]
    },
    {
      "id": "sec_04",
      "titulo": "04. Arquivos Técnicos & Referências Visuais",
      "descricao": "Upload de documentos, manuais de marca anteriores e referências de mercado.",
      "campos": [
        { "id": "anexos_marca", "tipo": "file_upload", "label": "Upload de Arquivos & Assets", "formatos": ["pdf", "png", "jpg", "zip"], "limiteMB": 50 }
      ]
    }
  ]
}
`.trim();

// ============================================================================
// 2. BIBLIOTECA DE PRESETS INTELIGENTES GERADOS POR IA
// ============================================================================

export const AI_PRESETS = [
  {
    key: 'tattoo',
    name: 'Studio de Tatuagem Fine-Line & Body Art',
    vertical: 'tattoo',
    description: 'Estúdio boutique com foco em traços finos botânicos, agendamento por drops e curadoria artística.',
    template: {
      id: 'tpl-tattoo-v1',
      titulo: 'Briefing de Identidade & Experiência para Studio de Tatuagem Fine-Line',
      vertical: 'tattoo',
      etapa: 'descoberta_inicial',
      versao: 1,
      secoes: [
        {
          id: 'sec_01',
          titulo: '01. Identificação & Posicionamento Artístico',
          descricao: 'Informações do tatuador fundador e proposta estética do estúdio.',
          campos: [
            { id: 'artista_fundador', tipo: 'text', label: 'Nome do Artista / Fundador', obrigatorio: true, placeholder: 'Ex: Lucas Prado' },
            { id: 'estilo_predominante', tipo: 'select', label: 'Estilo Artístico Principal', opcoes: ['Fine-Line Botânico & Micro-Realismo', 'Blackwork Geométrico', 'Lettering Caligráfico Fino', 'Aquarela & Ilustrativo'] },
            { id: 'modelo_atendimento', tipo: 'select', label: 'Dinâmica de Agendamento', opcoes: ['Agenda Aberta Contínua', 'Drops Mensais / Flashes Sazonais', 'Somente sob Encomenda Exclusiva'] }
          ]
        },
        {
          id: 'sec_02',
          titulo: '02. Escopo do Projeto & Experiência do Cliente',
          descricao: 'Entregáveis digitais e presença física do espaço.',
          campos: [
            { id: 'escopo_chips', tipo: 'chips_multiselect', label: 'Entregáveis Desejados', opcoes: ['Identidade Visual & Monograma', 'Web Portal de Flash & Agendamentos', 'Design de Certificado de Autenticidade', 'Sinalização do Estúdio Físico', 'Embalagens de Pós-Cuidados (Aftercare)'] },
            { id: 'desafio_central', tipo: 'textarea', label: 'Qual a principal percepção que a marca deve transmitir aos clientes?', obrigatorio: true, placeholder: 'Ex: Queremos nos afastar da estética pesada tradicional e transmitir sofisticação, higiene cirúrgica e arte de galeria.' }
          ]
        },
        {
          id: 'sec_03',
          titulo: '03. Vibe, Tom e Atmosfera da Marca',
          descricao: 'Diretrizes sensoriais para a equipe de arte da agência.',
          campos: [
            {
              id: 'seletor_tom',
              tipo: 'cards_single_select',
              label: 'Energia do Estúdio',
              opcoes: [
                { valor: 'Galeria Minimalista', rotulo: 'Galeria Minimalista', subtitulo: 'Branco puro, concreto aparente, móveis de design e luz natural abundante.' },
                { valor: 'Atelier Botânico & Acolhedor', rotulo: 'Atelier Botânico & Acolhedor', subtitulo: 'Madeira escura, plantas raras, aromas de âmbar e chá artesanal.' },
                { valor: 'Dark Neo-Brutalist', rotulo: 'Dark Neo-Brutalist', subtitulo: 'Aço escovado, contrastes extremos em preto fosco e tipografia vanguardista.' }
              ]
            },
            {
              id: 'slider_estilo',
              tipo: 'slider_range',
              label: 'Contraste Gráfico da Marca',
              min: 0,
              max: 100,
              passo: 5,
              legendaMin: '0% Delicado / Fino',
              legendaMax: '100% Marcante / Ousado'
            }
          ]
        },
        {
          id: 'sec_04',
          titulo: '04. Portfólio, Fotos do Espaço & Referências',
          descricao: 'Envio de fotos dos trabalhos anteriores e referências de design.',
          campos: [
            { id: 'anexos_marca', tipo: 'file_upload', label: 'Upload de Fotos e Referências', formatos: ['jpg', 'png', 'pdf', 'zip'], limiteMB: 50 }
          ]
        }
      ]
    }
  },
  {
    key: 'derma',
    name: 'Clínica Dermatológica & Procedimentos Estéticos',
    vertical: 'derma',
    description: 'Clínica médica de estética facial, laser e longevidade com padrões estritos de elegância e conformidade.',
    template: {
      id: 'tpl-derma-v1',
      titulo: 'Briefing de Posicionamento & Branding para Clínica Dermatológica',
      vertical: 'derma',
      etapa: 'descoberta_inicial',
      versao: 1,
      secoes: [
        {
          id: 'sec_01',
          titulo: '01. Corpo Clínico & Decisores',
          descricao: 'Registro do Responsável Técnico e registro no CRM.',
          campos: [
            { id: 'medico_responsavel', tipo: 'text', label: 'Médico(a) Responsável Técnico (CRM / RQE)', obrigatorio: true, placeholder: 'Ex: Dra. Beatriz Coutinho • CRM 142.890' },
            { id: 'perfil_procedimentos', tipo: 'select', label: 'Foco de Procedimentos', opcoes: ['Dermatologia Clínica & Tricologia', 'Laser de Alta Potência & Tecnologias', 'Harmonização & Rejuvenescimento Não-Invasivo', 'Longevidade & Medicina Integrativa'] }
          ]
        },
        {
          id: 'sec_02',
          titulo: '02. Objetivos & Entregáveis Contratados',
          descricao: 'Metas de captação de pacientes de ticket elevado.',
          campos: [
            { id: 'escopo_chips', tipo: 'chips_multiselect', label: 'Entregáveis Estratégicos', opcoes: ['Naming & Identidade Visual', 'Website Responsivo com Agendamento Integrado', 'Kit de Papelaria Médica & Prescrições Premium', 'Sinalização de Fachada e Consultórios', 'Diretrizes de Conteúdo Ético para Instagram'] },
            { id: 'desafio_central', tipo: 'textarea', label: 'Principal desafio mercadológico da clínica:', obrigatorio: true, placeholder: 'Ex: Consolidar autoridade médica sem parecer excessivamente comercial, atraindo público A/A+ para tratamentos de ponta.' }
          ]
        },
        {
          id: 'sec_03',
          titulo: '03. Atmosfera Sensorial do Consultório',
          descricao: 'Equilíbrio entre calor humano e alta tecnologia.',
          campos: [
            {
              id: 'seletor_tom',
              tipo: 'cards_single_select',
              label: 'Atmosfera Sensorial',
              opcoes: [
                { valor: 'Clean Medical Luxury', rotulo: 'Clean Medical Luxury', subtitulo: 'Tons de off-white, detalhes metálicos em champanhe e iluminação de spa.' },
                { valor: 'Biológico & Natural', rotulo: 'Biológico & Natural', subtitulo: 'Tons minerais, cerâmica terracota suave e elementos botânicos medicinais.' },
                { valor: 'High-Tech Futurista', rotulo: 'High-Tech Futurista', subtitulo: 'Linhas puras, telas de alta definição e iluminação azulada translúcida.' }
              ]
            },
            {
              id: 'slider_estilo',
              tipo: 'slider_range',
              label: 'Equilíbrio: Científico vs. Sensorial',
              min: 0,
              max: 100,
              passo: 5,
              legendaMin: '0% Rigor Médico Estrito',
              legendaMax: '100% Spa & Hotelaria 5 Estrelas'
            }
          ]
        },
        {
          id: 'sec_04',
          titulo: '04. Arquivos & Diretrizes Técnicas',
          descricao: 'Plantas baixas das salas de procedimento e guidelines de compliance.',
          campos: [
            { id: 'anexos_marca', tipo: 'file_upload', label: 'Upload de Arquivos da Clínica', formatos: ['pdf', 'png', 'jpg', 'zip'], limiteMB: 50 }
          ]
        }
      ]
    }
  },
  {
    key: 'gastronomy',
    name: 'Restaurante Gastronômico & Coquetelaria Autoral',
    vertical: 'gastronomy',
    description: 'Espaço gastronômico com menu degustação, carta de vinhos curada e atmosfera intimista.',
    template: {
      id: 'tpl-gastronomy-v1',
      titulo: 'Briefing de Identidade, Cardápios & Atmosfera para Restaurante Autoral',
      vertical: 'gastronomy',
      etapa: 'descoberta_inicial',
      versao: 1,
      secoes: [
        {
          id: 'sec_01',
          titulo: '01. Conceito Culinário & Chef',
          descricao: 'A essência da cozinha e dos proprietários.',
          campos: [
            { id: 'chef_responsavel', tipo: 'text', label: 'Chef Executivo / Restaurateur', obrigatorio: true, placeholder: 'Ex: Chef Thiago Valadares' },
            { id: 'tipo_cozinha', tipo: 'select', label: 'Conceito da Cozinha', opcoes: ['Autoral Brasileira Contemporânea', 'Omakase / Cozinha Nikkei', 'Fogo & Brasa de Ingredientes Locais', 'Bistronomia com Ingredientes Sazonais'] }
          ]
        },
        {
          id: 'sec_02',
          titulo: '02. Escopo & Experiência à Mesa',
          descricao: 'Ativos físicos e digitais para a jornada do comensal.',
          campos: [
            { id: 'escopo_chips', tipo: 'chips_multiselect', label: 'Entregáveis Solicitados', opcoes: ['Identidade Visual & Logomarca', 'Design Editorial de Cardápio e Carta de Vinhos', 'Web Portal de Reservas Integrado', 'Embalagens Especiais de Pães/Vinhos', 'Sinalização Interna & Fardamentos'] },
            { id: 'desafio_central', tipo: 'textarea', label: 'Qual a experiência emocional que o cliente deve ter da porta à mesa?', obrigatorio: true, placeholder: 'Descreva os aromas, luzes e o sentimento de acolhimento esperado.' }
          ]
        },
        {
          id: 'sec_03',
          titulo: '03. Atmosfera & Mood do Salão',
          descricao: 'Parâmetros para orientar fotografia e design gráfico.',
          campos: [
            {
              id: 'seletor_tom',
              tipo: 'cards_single_select',
              label: 'Atmosfera do Salão',
              opcoes: [
                { valor: 'Penumbra Íntima & Velas', rotulo: 'Penumbra Íntima & Velas', subtitulo: 'Tijolo escuro, veludo carmim, iluminação âmbar pontual e jazz suave.' },
                { valor: 'Luminoso & Terraço Mediterrâneo', rotulo: 'Luminoso & Terraço Mediterrâneo', subtitulo: 'Luz natural, cal branca, linho e cerâmicas artesanais vidradas.' },
                { valor: 'Cozinha Aberta & Dinâmica', rotulo: 'Cozinha Aberta & Dinâmica', subtitulo: 'Bancadas de inox, chamas à vista e energia pulsante de brigada.' }
              ]
            },
            {
              id: 'slider_estilo',
              tipo: 'slider_range',
              label: 'Tom de Voz do Restaurante',
              min: 0,
              max: 100,
              passo: 5,
              legendaMin: '0% Solene & Clássico',
              legendaMax: '100% Descontraído & Vibrante'
            }
          ]
        },
        {
          id: 'sec_04',
          titulo: '04. Fotos dos Pratos & Referências Arquitetônicas',
          descricao: 'Upload de fotos de testes de menu e moodboards.',
          campos: [
            { id: 'anexos_marca', tipo: 'file_upload', label: 'Upload de Moodboards & Pratos', formatos: ['jpg', 'png', 'pdf', 'zip'], limiteMB: 50 }
          ]
        }
      ]
    }
  }
];

// ============================================================================
// 3. MOTOR GERADOR DE TEMPLATES POR IA
// ============================================================================

/**
 * Cria e persiste um novo template parametrizado a partir de um prompt do usuário ou preset selecionado.
 */
export function generateTemplateFromPrompt(userPrompt, category = 'universal') {
  const cleanPrompt = (userPrompt || '').toLowerCase();
  
  // Verifica se o prompt corresponde a um dos nossos presets inteligentes
  const matchedPreset = AI_PRESETS.find(p => 
    cleanPrompt.includes(p.key) || 
    cleanPrompt.includes(p.vertical) ||
    p.name.toLowerCase().includes(cleanPrompt)
  );

  let newTemplate = null;

  if (matchedPreset) {
    newTemplate = JSON.parse(JSON.stringify(matchedPreset.template));
    newTemplate.id = `tpl-${matchedPreset.vertical}-${Date.now().toString(36)}`;
  } else {
    // Síntese dinâmica baseada no prompt livre do usuário
    const slug = (userPrompt || 'custom').trim().toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15) || 'custom';
    const timestamp = Date.now().toString(36);
    
    newTemplate = {
      id: `tpl-${slug}-${timestamp}`,
      titulo: `Briefing de Lançamento & Estratégia: ${userPrompt.trim()}`,
      vertical: slug,
      etapa: 'descoberta_inicial',
      versao: 1,
      secoes: [
        {
          id: 'sec_01',
          titulo: '01. Identificação do Negócio & Decisores',
          descricao: `Alinhamento dos responsáveis executivos pelo projeto de ${userPrompt}.`,
          campos: [
            { id: 'resp_nome', tipo: 'text', label: 'Nome do Decisor Principal', obrigatorio: true, placeholder: 'Nome e sobrenome' },
            { id: 'resp_cargo', tipo: 'text', label: 'Cargo / Papel Estratégico', obrigatorio: true, placeholder: 'Ex: Fundador, Diretor de Marketing' },
            { id: 'alinhamento_janela', tipo: 'select', label: 'Disponibilidade para Checkpoints Semanais', opcoes: ['Manhã (09h - 11h)', 'Tarde (14h - 17h)', 'Comunicação Assíncrona via Slack/Email'] }
          ]
        },
        {
          id: 'sec_02',
          titulo: '02. Desafio Central & Entregáveis Contratados',
          descricao: 'Mapeamento preciso das entregas prioritárias da agência.',
          campos: [
            { 
              id: 'escopo_chips', 
              tipo: 'chips_multiselect', 
              label: 'Entregáveis Prioritários', 
              opcoes: ['Identidade Visual & Posicionamento', 'Portal Web Institucional de Alta Performance', 'Design de Embalagens / Sinalização Física', 'Manual de Diretrizes de Marca (Brandbook)', 'Campanha de Lançamento Digital'] 
            },
            { 
              id: 'desafio_central', 
              tipo: 'textarea', 
              label: `Qual é a principal transformação que o projeto de ${userPrompt} deve alcançar?`, 
              obrigatorio: true,
              placeholder: 'Descreva as dores atuais, o público-alvo desejado e a vantagem competitiva frente aos concorrentes.'
            }
          ]
        },
        {
          id: 'sec_03',
          titulo: '03. Atmosfera Sensorial & Linguagem Visual',
          descricao: 'Definição das diretrizes de arte e energia da marca.',
          campos: [
            {
              id: 'seletor_tom',
              tipo: 'cards_single_select',
              label: 'Tom Emocional Predominante',
              opcoes: [
                { valor: 'Minimalista & Editorial', rotulo: 'Minimalista & Editorial', subtitulo: 'Sofisticação serena, espaços generosos em branco e tipografia refinada.' },
                { valor: 'Vibrante & Dinâmico', rotulo: 'Vibrante & Dinâmico', subtitulo: 'Cores estimulantes, ritmo visual moderno e alto apelo de conversão.' },
                { valor: 'Orgânico & Artesanal', rotulo: 'Orgânico & Artesanal', subtitulo: 'Texturas naturais, paleta de tons terrosos e calor humano autêntico.' }
              ]
            },
            {
              id: 'slider_estilo',
              tipo: 'slider_range',
              label: 'Polaridade Visual (Tradicional vs. Arrojado)',
              min: 0,
              max: 100,
              passo: 5,
              legendaMin: '0% Clássico / Conservador',
              legendaMax: '100% Vanguardista / Arrojado'
            }
          ]
        },
        {
          id: 'sec_04',
          titulo: '04. Repositório de Ativos & Referências Visuais',
          descricao: 'Arquivos essenciais, materiais históricos e referências estéticas.',
          campos: [
            { id: 'anexos_marca', tipo: 'file_upload', label: 'Upload de Arquivos & Assets', formatos: ['pdf', 'png', 'jpg', 'zip'], limiteMB: 50 }
          ]
        }
      ]
    };
  }

  // Persiste no store do StudioIntake
  addTemplate(newTemplate);
  return newTemplate;
}

// ============================================================================
// 4. SÍNTESE DE RESUMO EXECUTIVO PÓS-PREENCHIMENTO POR IA (6.2)
// ============================================================================

/**
 * Lê as respostas fornecidas pelo cliente e gera uma síntese executiva
 * de alto padrão para a direção de arte e squads de desenvolvimento.
 */
export function generateAISynthesis(briefingInstance, client) {
  const raw = briefingInstance.respostas_brutas || {};
  const tone = raw.seletor_tom || 'Elegância Contemporânea';
  const sliderVal = Number(raw.slider_estilo ?? 50);
  const chips = Array.isArray(raw.escopo_chips) ? raw.escopo_chips : [];
  
  // Objetivo Sintetizado com linguagem executiva de agência
  let objetivo = raw.desafio_central || '';
  if (!objetivo) {
    objetivo = `Estruturação do posicionamento da marca ${client.empresa}, criando uma presença refinada e orientada à conversão no mercado de ${client.vertical}.`;
  }

  const pilares = [
    `Atmosfera Central: ${tone}`,
    `Balanço Estético: ${sliderVal}% ${sliderVal > 50 ? 'Expressivo e Arrojado' : 'Minimalista e Contido'}`,
    `Hierarquia: Foco em clareza informativa sem atrito e tipografia de alto impacto`
  ];

  const entregaveis = chips.length > 0 ? chips : ['Identidade Visual', 'Website de Alta Conversão', 'Brand Guidelines'];

  const checklist = [
    { item: `Homologação das respostas do decisor ${client.nome_responsavel}`, status: 'concluido' },
    { item: `Auditoria de ${(briefingInstance.anexos || []).length} arquivo(s) enviados pelo cliente`, status: (briefingInstance.anexos || []).length > 0 ? 'concluido' : 'pendente' },
    { item: 'Montagem do moodboard sensorial no Figma com diretrizes validadas', status: 'pendente' },
    { item: 'Definição da arquitetura de informação e wireframes de baixa fidelidade', status: 'pendente' },
    { item: 'Kickoff operacional com o squad de design e frontend', status: briefingInstance.status === 'aprovado_kickoff' ? 'concluido' : 'pendente' }
  ];

  const digest = {
    briefing_id: briefingInstance.id,
    cliente_nome: client.empresa,
    objetivo_sintetizado: objetivo,
    pilares_design: pilares,
    entregaveis_confirmados: entregaveis,
    integracoes_tecnicas: ['StudioIntake Engine', 'Design Tokens Sync'],
    checklist_kickoff: checklist,
    aprovado_por: 'StudioIntake AI Synthesizer / Gabriel Siqueira',
    data_aprovacao: briefingInstance.status === 'aprovado_kickoff' ? new Date().toISOString() : null
  };

  saveDigest(digest);
  return digest;
}
