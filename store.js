/**
 * StudioIntake — Data Store & Persistence Layer (Offline LocalStorage + Neon Postgres Adapter)
 * 
 * Conforme especificado em SEED.md:
 * - Entidades: Cliente, BriefingTemplate, BriefingInstance, RespostaDigest
 * - Relacionamento 1:N entre Cliente e BriefingInstances
 * - Código Único: CLI-XXXX
 * - Máquina de Estados: rascunho -> enviado -> em_preenchimento -> submetido -> em_revisao -> ajustes_solicitados -> aprovado_kickoff
 */

// v3: bump sempre que SEED_TEMPLATES mudar estruturalmente — força o
// navegador a descartar o cache antigo de templates em vez de ficar
// preso para sempre na primeira versão que ele já viu.
const STORAGE_KEYS = {
  CLIENTS: 'studiointake_clientes_v3',
  TEMPLATES: 'studiointake_templates_v3',
  INSTANCES: 'studiointake_instancias_v3',
  DIGESTS: 'studiointake_digests_v3',
  CONFIG: 'studiointake_config_v3'
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
    id: 'tpl-fisio-pilates-v1',
    titulo: 'Briefing de Captação — Clínica de Fisioterapia & Studio de Pilates',
    vertical: 'fisio_pilates',
    etapa: 'captacao_lead',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: '01. Identificação da Proprietária',
        descricao: 'Dados do responsável pela decisão na clínica/estúdio.',
        campos: [
          { id: 'resp_nome', tipo: 'text', label: 'Nome da Proprietária / Responsável', obrigatorio: true, placeholder: 'Ex: Fernanda Castro' },
          { id: 'resp_cargo', tipo: 'text', label: 'Cargo / Função', obrigatorio: true, placeholder: 'Ex: Fisioterapeuta & Fundadora' }
        ]
      },
      {
        id: 'sec_02',
        titulo: '02. Negócio & Especialidades',
        descricao: 'Serviços oferecidos e operação atual da clínica.',
        campos: [
          { id: 'especialidades_chips', tipo: 'chips_multiselect', label: 'Especialidades Oferecidas', opcoes: ['Pilates Solo', 'Pilates Reformer / Aparelhos', 'Fisioterapia Ortopédica', 'Fisioterapia Esportiva', 'RPG / Postural', 'Pilates Clínico'] },
          { id: 'gestao_software', tipo: 'select', label: 'Sistema de Agendamento / Gestão Atual', opcoes: ['Mariana Tek', 'Cliniko', 'Planilha / Caderno Manual', 'Nenhum'] }
        ]
      },
      {
        id: 'sec_03',
        titulo: '03. Desafio & Escopo do Projeto',
        descricao: 'Dor central do negócio e entregáveis desejados.',
        campos: [
          { id: 'desafio_central', tipo: 'textarea', label: 'Qual o maior desafio do negócio hoje?', obrigatorio: true, placeholder: 'Ex: captação de alunos/pacientes, retenção, organização da agenda, presença digital...' },
          { id: 'escopo_chips', tipo: 'chips_multiselect', label: 'O que você precisa para resolver isso?', opcoes: ['Identidade Visual', 'Site / Landing Page', 'Agendamento Online', 'Redes Sociais', 'App de Treinos / Exercícios'] }
        ]
      },
      {
        id: 'sec_04',
        titulo: '04. Atmosfera & Tom de Marca',
        descricao: 'Calibração estética para guiar a direção de arte.',
        campos: [
          {
            id: 'seletor_tom',
            tipo: 'cards_single_select',
            label: 'Energia Predominante da Clínica',
            opcoes: [
              { valor: 'Acolhedor & Terapêutico', rotulo: 'Acolhedor & Terapêutico', subtitulo: 'Tons suaves, acolhimento humanizado, foco em bem-estar e reabilitação.' },
              { valor: 'Técnico & Performance', rotulo: 'Técnico & Performance', subtitulo: 'Visual clínico, preciso, voltado a resultado e alta performance.' },
              { valor: 'Boutique & Sofisticado', rotulo: 'Boutique & Sofisticado', subtitulo: 'Estética premium, minimalista, experiência exclusiva.' }
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
        id: 'sec_05',
        titulo: '05. Orçamento & Anexos',
        descricao: 'Faixa de investimento e materiais de referência.',
        campos: [
          { id: 'budget_estimado', tipo: 'select', label: 'Faixa de Investimento Estimada', opcoes: ['Até R$ 5.000', 'R$ 5.000 - R$ 15.000', 'R$ 15.000 - R$ 30.000', 'Acima de R$ 30.000'] },
          { id: 'anexos_marca', tipo: 'file_upload', label: 'Upload de Logo Atual, Fotos do Espaço ou Referências', formatos: ['pdf', 'png', 'jpg', 'zip'], limiteMB: 30 }
        ]
      }
    ]
  },
  {
    id: 'tpl-pilates-finalizacao-v1',
    titulo: { pt: 'Finalização do Site — Studio Kalea Pilates', it: 'Finalizzazione del Sito — Studio Kalea Pilates', en: 'Website Finalization — Kalea Pilates Studio' },
    vertical: 'fisio_pilates',
    etapa: 'finalizacao_pilates',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: { pt: '01. Hospedagem & Acesso Atual', it: '01. Hosting & Accesso Attuale', en: '01. Current Hosting & Access' },
        descricao: { pt: 'Onde o site está hospedado hoje e condições de transferência de acesso.', it: "Dove è ospitato oggi il sito e condizioni per il trasferimento dell'accesso.", en: 'Where the site is currently hosted and conditions for access handover.' },
        campos: [
          {
            id: 'hosting_atual', tipo: 'select',
            label: { pt: 'Onde o site está hospedado hoje?', it: 'Dove è ospitato oggi il sito?', en: 'Where is the website currently hosted?' },
            opcoes: [
              { valor: 'vercel', label: { pt: 'Vercel', it: 'Vercel', en: 'Vercel' } },
              { valor: 'hostinger', label: { pt: 'Hostinger', it: 'Hostinger', en: 'Hostinger' } },
              { valor: 'godaddy', label: { pt: 'GoDaddy', it: 'GoDaddy', en: 'GoDaddy' } },
              { valor: 'wordpress', label: { pt: 'WordPress.com', it: 'WordPress.com', en: 'WordPress.com' } },
              { valor: 'outro', label: { pt: 'Outro / Não sei', it: 'Altro / Non lo so', en: 'Other / Not sure' } }
            ]
          },
          {
            id: 'hosting_status', tipo: 'cards_single_select',
            label: { pt: 'A hospedagem atual está funcionando bem?', it: "L'hosting attuale funziona bene?", en: 'Is the current hosting working well?' },
            opcoes: [
              { valor: 'ok', rotulo: { pt: 'Sim, sem problemas', it: 'Sì, senza problemi', en: 'Yes, no issues' }, subtitulo: { pt: 'Tudo estável, sem reclamações.', it: 'Tutto stabile, nessun reclamo.', en: 'Everything stable, no complaints.' } },
              { valor: 'problemas', rotulo: { pt: 'Tem alguns problemas', it: 'Ci sono alcuni problemi', en: 'There are some issues' }, subtitulo: { pt: 'Lentidão, instabilidade ou erros ocasionais.', it: 'Lentezza, instabilità o errori occasionali.', en: 'Slowness, instability or occasional errors.' } },
              { valor: 'trocar', rotulo: { pt: 'Quero trocar', it: 'Voglio cambiare', en: 'I want to switch' }, subtitulo: { pt: 'Prefiro migrar para outra hospedagem.', it: "Preferisco migrare verso un altro hosting.", en: 'I prefer to migrate to another host.' } }
            ]
          },
          {
            id: 'libera_acesso', tipo: 'select',
            label: { pt: 'Após fechar o contrato, você pode nos passar acesso total (domínio + hospedagem)?', it: "Dopo la firma del contratto, puoi darci accesso completo (dominio + hosting)?", en: 'After signing the contract, can you give us full access (domain + hosting)?' },
            opcoes: [
              { valor: 'sim', label: { pt: 'Sim, sem problemas', it: 'Sì, senza problemi', en: 'Yes, no problem' } },
              { valor: 'verificar', label: { pt: 'Preciso verificar', it: 'Devo verificare', en: 'I need to check' } },
              { valor: 'nao', label: { pt: 'Prefiro não repassar', it: 'Preferisco non trasferirlo', en: "I'd rather not transfer it" } }
            ]
          }
        ]
      },
      {
        id: 'sec_02',
        titulo: { pt: '02. Painel de Controle & Autonomia', it: '02. Pannello di Controllo & Autonomia', en: '02. Control Panel & Autonomy' },
        descricao: { pt: 'Como você prefere editar o site no dia a dia.', it: 'Come preferisci modificare il sito quotidianamente.', en: 'How you prefer to edit the site day-to-day.' },
        campos: [
          {
            id: 'quer_painel', tipo: 'cards_single_select',
            label: { pt: 'Como você quer editar o site no dia a dia?', it: 'Come vuoi modificare il sito quotidianamente?', en: 'How do you want to edit the site day-to-day?' },
            opcoes: [
              { valor: 'painel_visual', rotulo: { pt: 'Painel Visual Simples (sem código)', it: 'Pannello Visuale Semplice (senza codice)', en: 'Simple Visual Panel (no code)' }, subtitulo: { pt: 'Você edita textos e fotos sozinha, sem mexer em código.', it: 'Modifichi testi e foto da sola, senza toccare il codice.', en: 'You edit text and photos yourself, no coding needed.' } },
              { valor: 'pedir_sempre', rotulo: { pt: 'Prefiro pedir pra vocês sempre', it: 'Preferisco chiedere sempre a voi', en: "I'd rather always ask you" }, subtitulo: { pt: 'Qualquer alteração passa pela nossa equipe.', it: 'Ogni modifica passa dal nostro team.', en: 'Any change goes through our team.' } },
              { valor: 'nao_precisa', rotulo: { pt: 'Não preciso editar sozinha', it: 'Non ho bisogno di modificare da sola', en: "I don't need to edit it myself" }, subtitulo: { pt: 'O site fica praticamente estático.', it: 'Il sito resta praticamente statico.', en: 'The site stays mostly static.' } }
            ]
          }
        ]
      },
      {
        id: 'sec_03',
        titulo: { pt: '03. Finalização Técnica', it: '03. Finalizzazione Tecnica', en: '03. Technical Finalization' },
        descricao: { pt: 'O que falta para o site funcionar 100%.', it: 'Cosa manca perché il sito funzioni al 100%.', en: "What's left for the site to be 100% functional." },
        campos: [
          {
            id: 'desafio_tecnico', tipo: 'textarea', obrigatorio: true,
            label: { pt: 'O que falta para o site funcionar 100%? (formulários, agenda, pagamento etc.)', it: 'Cosa manca perché il sito funzioni al 100%? (moduli, calendario, pagamenti ecc.)', en: "What's missing for the site to work 100%? (forms, scheduling, payments, etc.)" },
            placeholder: { pt: 'Descreva em detalhes o que ainda precisa ser resolvido...', it: 'Descrivi in dettaglio cosa deve ancora essere risolto...', en: 'Describe in detail what still needs to be resolved...' }
          },
          {
            id: 'prioridade_chips', tipo: 'chips_multiselect',
            label: { pt: 'O que é mais urgente finalizar?', it: 'Cosa è più urgente finalizzare?', en: "What's most urgent to finish?" },
            opcoes: [
              { valor: 'backend', label: { pt: 'Back-end & Integrações', it: 'Back-end & Integrazioni', en: 'Backend & Integrations' } },
              { valor: 'visual', label: { pt: 'Refino do HTML/Visual', it: 'Rifinitura HTML/Visuale', en: 'HTML/Visual Refinement' } },
              { valor: 'banco_dados', label: { pt: 'Banco de Dados', it: 'Database', en: 'Database' } },
              { valor: 'contato', label: { pt: 'Formulário de Contato', it: 'Modulo di Contatto', en: 'Contact Form' } },
              { valor: 'agendamento', label: { pt: 'Agendamento Online', it: 'Prenotazione Online', en: 'Online Booking' } }
            ]
          }
        ]
      },
      {
        id: 'sec_04',
        titulo: { pt: '04. Referências & Anexos', it: '04. Riferimenti & Allegati', en: '04. References & Attachments' },
        descricao: { pt: 'Prints da hospedagem atual e inspirações visuais.', it: "Screenshot dell'hosting attuale e ispirazioni visive.", en: 'Screenshots of current hosting and visual inspiration.' },
        campos: [
          { id: 'anexo_hospedagem', tipo: 'file_upload', label: { pt: 'Print da hospedagem/domínio atual', it: "Screenshot dell'hosting/dominio attuale", en: 'Screenshot of current hosting/domain' }, formatos: ['pdf', 'png', 'jpg'], limiteMB: 20 },
          { id: 'anexo_inspiracao', tipo: 'file_upload', label: { pt: 'Prints de inspiração (sites que você gosta)', it: 'Screenshot di ispirazione (siti che ti piacciono)', en: 'Inspiration screenshots (sites you like)' }, formatos: ['pdf', 'png', 'jpg', 'zip'], limiteMB: 30 }
        ]
      }
    ]
  },
  {
    id: 'tpl-fisio-redesign-v1',
    titulo: { pt: 'Diagnóstico — Site da Clínica Fisio', it: 'Diagnosi — Sito della Clinica Fisio', en: 'Diagnosis — Fisio Clinic Website' },
    vertical: 'fisio_pilates',
    etapa: 'redesign_fisio',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: { pt: '01. Situação Atual', it: '01. Situazione Attuale', en: '01. Current Situation' },
        campos: [
          {
            id: 'site_atual', tipo: 'select',
            label: { pt: 'A Fisio já tem site hoje?', it: 'La Fisio ha già un sito oggi?', en: 'Does Fisio already have a website today?' },
            opcoes: [
              { valor: 'sim_ok', label: { pt: 'Sim, funcionando bem', it: 'Sì, funziona bene', en: 'Yes, working well' } },
              { valor: 'sim_desatualizado', label: { pt: 'Sim, mas desatualizado', it: 'Sì, ma obsoleto', en: 'Yes, but outdated' } },
              { valor: 'nao_tem', label: { pt: 'Não tem site', it: 'Non ha un sito', en: 'No website' } }
            ]
          },
          {
            id: 'quer_refazer', tipo: 'cards_single_select',
            label: { pt: 'O que você imagina para o novo site?', it: 'Cosa immagini per il nuovo sito?', en: 'What do you envision for the new site?' },
            opcoes: [
              { valor: 'refazer_zero', rotulo: { pt: 'Refazer do zero', it: 'Rifare da zero', en: 'Rebuild from scratch' }, subtitulo: { pt: 'Novo site, nova estrutura e novo visual.', it: 'Nuovo sito, nuova struttura e nuovo look.', en: 'New site, new structure and new look.' } },
              { valor: 'modernizar', rotulo: { pt: 'Só modernizar o visual', it: 'Solo modernizzare il visual', en: 'Just modernize the look' }, subtitulo: { pt: 'Manter estrutura, atualizar design.', it: 'Mantenere la struttura, aggiornare il design.', en: 'Keep the structure, update the design.' } },
              { valor: 'manter', rotulo: { pt: 'Manter como está, só ajustar conteúdo', it: "Mantenere così com'è, solo aggiustare i contenuti", en: 'Keep as is, just adjust content' }, subtitulo: { pt: 'Pequenos ajustes pontuais.', it: 'Piccole modifiche puntuali.', en: 'Small targeted tweaks.' } }
            ]
          }
        ]
      },
      {
        id: 'sec_02',
        titulo: { pt: '02. Objetivo & Conteúdo', it: '02. Obiettivo & Contenuti', en: '02. Goal & Content' },
        campos: [
          {
            id: 'objetivo_central', tipo: 'textarea', obrigatorio: true,
            label: { pt: 'Qual o principal objetivo do site da Fisio?', it: 'Qual è l\'obiettivo principale del sito della Fisio?', en: 'What is the main goal of the Fisio website?' },
            placeholder: { pt: 'Ex: atrair pacientes, mostrar especialidades, agendamento online...', it: 'Es: attirare pazienti, mostrare le specialità, prenotazione online...', en: 'E.g.: attract patients, showcase specialties, online booking...' }
          },
          {
            id: 'paginas_chips', tipo: 'chips_multiselect',
            label: { pt: 'Quais páginas/seções são essenciais?', it: 'Quali pagine/sezioni sono essenziali?', en: 'Which pages/sections are essential?' },
            opcoes: [
              { valor: 'sobre', label: { pt: 'Sobre a Clínica', it: 'Chi Siamo', en: 'About the Clinic' } },
              { valor: 'especialidades', label: { pt: 'Especialidades/Tratamentos', it: 'Specialità/Trattamenti', en: 'Specialties/Treatments' } },
              { valor: 'equipe', label: { pt: 'Equipe', it: 'Il Nostro Team', en: 'Team' } },
              { valor: 'agendamento', label: { pt: 'Agendamento Online', it: 'Prenotazione Online', en: 'Online Booking' } },
              { valor: 'blog', label: { pt: 'Blog/Conteúdo', it: 'Blog/Contenuti', en: 'Blog/Content' } },
              { valor: 'depoimentos', label: { pt: 'Depoimentos', it: 'Testimonianze', en: 'Testimonials' } }
            ]
          }
        ]
      },
      {
        id: 'sec_03',
        titulo: { pt: '03. Anexos', it: '03. Allegati', en: '03. Attachments' },
        campos: [
          { id: 'anexo_fisio', tipo: 'file_upload', label: { pt: 'Print do site atual da Fisio (se tiver) ou referências', it: "Screenshot del sito attuale della Fisio (se esiste) o riferimenti", en: "Screenshot of Fisio's current site (if any) or references" }, formatos: ['pdf', 'png', 'jpg', 'zip'], limiteMB: 30 }
        ]
      }
    ]
  },
  {
    id: 'tpl-automacao-ia-v1',
    titulo: { pt: 'Automação, Redes Sociais & Inteligência Artificial', it: 'Automazione, Social Media & Intelligenza Artificiale', en: 'Automation, Social Media & Artificial Intelligence' },
    vertical: 'fisio_pilates',
    etapa: 'automacao_ia',
    versao: 1,
    secoes: [
      {
        id: 'sec_01',
        titulo: { pt: '01. Redes Sociais', it: '01. Social Media', en: '01. Social Media' },
        campos: [
          {
            id: 'redes_atuais', tipo: 'chips_multiselect',
            label: { pt: 'Quais redes sociais vocês usam hoje?', it: 'Quali social media usate oggi?', en: 'Which social media do you use today?' },
            opcoes: [
              { valor: 'instagram', label: { pt: 'Instagram', it: 'Instagram', en: 'Instagram' } },
              { valor: 'facebook', label: { pt: 'Facebook', it: 'Facebook', en: 'Facebook' } },
              { valor: 'tiktok', label: { pt: 'TikTok', it: 'TikTok', en: 'TikTok' } },
              { valor: 'whatsapp', label: { pt: 'WhatsApp Business', it: 'WhatsApp Business', en: 'WhatsApp Business' } },
              { valor: 'nenhuma', label: { pt: 'Nenhuma ainda', it: 'Nessuno ancora', en: 'None yet' } }
            ]
          },
          {
            id: 'quer_automacao_posts', tipo: 'cards_single_select',
            label: { pt: 'Quer que a gente automatize as postagens?', it: 'Vuoi che automatizziamo i post?', en: 'Do you want us to automate posts?' },
            opcoes: [
              { valor: 'sim_auto', rotulo: { pt: 'Sim, postagens automáticas', it: 'Sì, post automatici', en: 'Yes, automatic posts' }, subtitulo: { pt: 'A IA cria e publica por você.', it: "L'IA crea e pubblica per te.", en: 'AI creates and publishes for you.' } },
              { valor: 'sugestoes', rotulo: { pt: 'Só quero sugestões, eu posto', it: 'Voglio solo suggerimenti, pubblico io', en: "Just suggestions, I'll post" }, subtitulo: { pt: 'Você recebe ideias prontas.', it: 'Ricevi idee già pronte.', en: 'You get ready-made ideas.' } },
              { valor: 'nao_ainda', rotulo: { pt: 'Não, por enquanto não', it: 'No, per ora no', en: 'No, not for now' } }
            ]
          }
        ]
      },
      {
        id: 'sec_02',
        titulo: { pt: '02. Atendimento com IA', it: '02. Assistenza con IA', en: '02. AI-Powered Support' },
        campos: [
          {
            id: 'quer_agente_ia', tipo: 'cards_single_select',
            label: { pt: 'Quer um agente de IA conversando com clientes?', it: 'Vuoi un agente IA che parli con i clienti?', en: 'Do you want an AI agent talking to clients?' },
            opcoes: [
              { valor: 'site_instagram', rotulo: { pt: 'Sim, no site e no Instagram', it: 'Sì, sul sito e su Instagram', en: 'Yes, on the site and Instagram' } },
              { valor: 'so_site', rotulo: { pt: 'Só no site', it: 'Solo sul sito', en: 'Only on the site' } },
              { valor: 'so_whatsapp', rotulo: { pt: 'Só no WhatsApp', it: 'Solo su WhatsApp', en: 'Only on WhatsApp' } }
            ]
          },
          {
            id: 'objetivo_ia', tipo: 'textarea',
            label: { pt: 'O que você gostaria que esse agente de IA fizesse?', it: 'Cosa vorresti che questo agente IA facesse?', en: 'What would you like this AI agent to do?' },
            placeholder: { pt: 'Ex: responder dúvidas, agendar aulas/consultas, qualificar leads...', it: 'Es: rispondere a domande, prenotare lezioni/visite, qualificare i contatti...', en: 'E.g.: answer questions, book classes/appointments, qualify leads...' }
          }
        ]
      },
      {
        id: 'sec_03',
        titulo: { pt: '03. Performance & Marketing', it: '03. Performance & Marketing', en: '03. Performance & Marketing' },
        campos: [
          {
            id: 'prioridade_marketing', tipo: 'chips_multiselect',
            label: { pt: 'Qual sua maior prioridade de marketing hoje?', it: 'Qual è la tua priorità di marketing principale oggi?', en: "What's your top marketing priority today?" },
            opcoes: [
              { valor: 'seguidores', label: { pt: 'Mais seguidores', it: 'Più follower', en: 'More followers' } },
              { valor: 'agendamentos', label: { pt: 'Mais agendamentos', it: 'Più prenotazioni', en: 'More bookings' } },
              { valor: 'engajamento', label: { pt: 'Mais engajamento', it: 'Più engagement', en: 'More engagement' } },
              { valor: 'autoridade', label: { pt: 'Construir autoridade/marca', it: 'Costruire autorità/brand', en: 'Build authority/brand' } }
            ]
          }
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

// Produção: sem clientes/instâncias/digests de demonstração.
// A agência cadastra seus próprios clientes reais pelo Dashboard.
export const SEED_CLIENTES = [];
export const SEED_INSTANCES = [];
export const SEED_DIGESTS = [];

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

// ============================================================================
// SINCRONIZAÇÃO REMOTA (Postgres via /api) — Camada Híbrida
// ============================================================================
// O app funciona 100% offline via localStorage (cache rápido por navegador).
// Estas funções sincronizam com o banco real para que um cliente abrindo o
// link em outro dispositivo veja seus próprios dados. Falhas de rede nunca
// quebram o app — são "fire and forget" ou com fallback silencioso.

async function apiCall(path, options) {
  try {
    const res = await fetch(path, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn(`[sync] Falha ao chamar ${path}:`, e.message);
    return null;
  }
}

/** Envia (cria/atualiza) um cliente no banco remoto. Não bloqueia a UI. */
export function syncClientRemote(client) {
  apiCall('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client)
  });
}

/** Envia (cria/atualiza) uma instância de briefing no banco remoto. */
export function syncInstanceRemote(instance) {
  apiCall('/api/instances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(instance)
  });
}

/** Atualiza parcialmente uma instância no banco remoto (usado no autosave). */
export function patchInstanceRemote(partial) {
  apiCall('/api/instances', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial)
  });
}

/** Busca um cliente pelo código diretamente no banco remoto. */
export async function fetchClientByCodeRemote(code) {
  const data = await apiCall(`/api/clients?code=${encodeURIComponent(code)}`);
  return data ? data.client : null;
}

/** Busca uma instância de briefing pelo id diretamente no banco remoto. */
export async function fetchInstanceByIdRemote(id) {
  const data = await apiCall(`/api/instances?id=${encodeURIComponent(id)}`);
  return data ? data.instance : null;
}

/** Busca todas as instâncias de um cliente diretamente no banco remoto. */
export async function fetchInstancesByClientRemote(clienteId) {
  const data = await apiCall(`/api/instances?cliente_id=${encodeURIComponent(clienteId)}`);
  return data && Array.isArray(data.instances) ? data.instances : [];
}

/** Puxa todos os clientes e instâncias do banco remoto e funde no cache local. */
export async function syncAllFromRemote() {
  const [clientsData, instancesData] = await Promise.all([
    apiCall('/api/clients'),
    apiCall('/api/instances')
  ]);

  if (clientsData && Array.isArray(clientsData.clients) && clientsData.clients.length > 0) {
    const local = getClients();
    const byId = new Map(local.map(c => [c.id, c]));
    clientsData.clients.forEach(c => byId.set(c.id, c));
    saveClients(Array.from(byId.values()));
  }

  if (instancesData && Array.isArray(instancesData.instances) && instancesData.instances.length > 0) {
    const local = getBriefingInstances();
    const byId = new Map(local.map(i => [i.id, i]));
    instancesData.instances.forEach(i => byId.set(i.id, i));
    saveBriefingInstances(Array.from(byId.values()));
  }
}
