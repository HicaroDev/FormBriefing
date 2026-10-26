# Studio Suite 2.1 · Prompts para o Stitch

Cole o Bloco base primeiro, depois o prompt de cada tela.

## Mapa de telas

| # | Tela | Área | Status | Prioridade |
|---|---|---|---|---|
| 01 | Login do estúdio | Estúdio | Falta | MVP |
| 02 | Dashboard executivo | Estúdio | Existe | Ajuste |
| 03 | CRM · Funil de vendas | Estúdio | Parcial | MVP |
| 04 | CRM · Ficha do cliente | Estúdio | Falta | Depois |
| 05 | Modal · Enviar briefing com PIN | Estúdio | Falta | MVP |
| 06 | Forms Hub · Biblioteca de modelos | Estúdio | Parcial | MVP |
| 07 | Forms Hub · Editor de modelo | Estúdio | Falta | MVP |
| 08 | Respostas do briefing | Estúdio | Falta | MVP |
| 09 | Projetos · Quadro | Estúdio | Existe | Ajuste |
| 10 | Projeto · Evolução | Estúdio | Parcial | MVP |
| 11 | Agenda | Estúdio | Falta | Depois |
| 12 | Configurações | Estúdio | Falta | Depois |
| 13 | Cliente · Acesso por PIN | Cliente | Existe | Ajuste |
| 14 | Cliente · Preenchimento do briefing | Cliente | Existe | Ajuste |
| 15 | Cliente · Briefing enviado | Cliente | Falta | MVP |
| 16 | Cliente · Acompanhar projeto | Cliente | Falta | Depois |

## 00 · Bloco base

```text
BLOCO BASE — STUDIO SUITE 2.1 (cole antes de qualquer tela)

Sistema: Studio Suite, o sistema interno do estúdio Hícaro Duarte (design e branding para estúdios de pilates, fisioterapia, bem-estar e eventos). Idioma da interface: português do Brasil. Desktop 1440px, com versão mobile 390px quando eu pedir.

Visual: glassmorphism claro e quente.
- Fundo da página: linear-gradient(135deg, #FBF8F3 0%, #F5EFEB 50%, #ECE4DB 100%).
- Cards de vidro: rgba(255,255,255,0.70), backdrop-blur 20px, borda 1px rgba(255,255,255,0.80), sombra 0 20px 40px -15px rgba(230,81,0,0.07), 0 10px 25px -5px rgba(0,0,0,0.04).
- Cor de marca: laranja #F97316 (hover #EA580C, texto sobre claro #C2410C). Botão principal: gradiente 135deg #F97316 → #E65100, texto branco, raio 12px, altura 44px.
- Card de destaque (só 1 por tela): gradiente #F97316 → #FBBF24 com texto branco.
- Card escuro de perfil: #1E293B.
- Textos: títulos #0F172A, corpo #475569, apoio #64748B, placeholder #94A3B8, divisórias #E2E8F0.
- Status: sucesso #10B981, atenção #F59E0B, urgente #EF4444, segurança/PIN #0D9488, informação #0284C7. Badges com fundo 10% da cor e texto na cor escurecida.
- Índigo #4F46E5 só no anel de foco dos campos. Não usar índigo em botões.

Tipografia: só Plus Jakarta Sans (400, 500, 600, 700, 800). JetBrains Mono apenas para PIN, códigos (#PLT-2026-08) e links curtos. Escala: KPI 36px/700; título da tela 28px/700; título de card 18px/600; rótulo 14px/600; corpo 14px/400; legenda e badge 12px/600. Nunca usar texto menor que 11px.

Raios: dock lateral 24px; cards 20px; campos e botões 12px; badges e pílulas 9999px. Espaçamento em múltiplos de 4px; padding de card 24px; gap entre cards 20px.

Ícones: Material Symbols Outlined, traço fino, 20px.

Navegação do estúdio: dock lateral flutuante à esquerda (72px de largura, vidro, raio 24px) com logo HD no topo e, nesta ordem: Início, CRM, Forms Hub, Projetos, Agenda, Clientes, Configurações; no rodapé do dock, alternância de tema claro/escuro e avatar. Item ativo: quadrado laranja com ícone branco. Topo de cada tela: título + subtítulo à esquerda; busca global, sino de notificações e avatar à direita.

Não desenhar barra de navegador falsa no topo nem rodapé técnico (latência, versão). Usar sempre os mesmos dados de exemplo: cliente principal "Lumina Movement" (pilates reformer, responsável Helena Vasconcellos), outros clientes "Physio Care Apex", "Aura Wellness Hub", "Gala Summit 2026". Datas em 2026, valores em R$.
```

## 01 · Login do estúdio

```text
Tela: Login do Studio Suite (acesso do estúdio Hícaro Duarte).

Layout em duas colunas sobre o fundo gradiente. Esquerda (55%): painel de marca com o monograma HD grande, frase "Curadoria Hícaro Duarte" e três micro-métricas em vidro ("12 projetos ativos", "94% de briefings respondidos", "Lumina Movement entregue em 21 dias"). Direita (45%): card de vidro centralizado, 420px, com título "Entrar no Studio Suite", campos E-mail e Senha (com mostrar/ocultar), link "Esqueci minha senha", checkbox "Manter conectado neste dispositivo", botão principal "Entrar" e um divisor "ou" com botão secundário "Entrar com Google". Rodapé do card: selo teal "Conexão criptografada".

Estados para mostrar ao lado: erro de senha (borda #EF4444 e mensagem "E-mail ou senha incorretos. Tente de novo ou redefina a senha.") e carregando no botão. Versão mobile: só o card, com o monograma acima.
```

## 02 · Dashboard executivo

```text
Tela: Início (Dashboard executivo). Refazer a tela existente mantendo a estrutura, com estes ajustes:

1. Título "Bom dia, Hícaro" e subtítulo "Resumo do estúdio hoje, 22 out 2026".
2. Quatro KPIs no topo, todos com o mesmo formato (rótulo 12px em caixa alta, número 36px, variação em badge): "Pipeline em aberto R$ 284.000", "Briefings aguardando resposta 6", "Projetos em produção 9", "Entregas no prazo 96%".
3. Gráfico principal: "Receita fechada por mês" (área laranja, jan–out 2026), com alternância Mensal/Trimestral.
4. Coluna direita: card escuro de perfil, mini calendário de outubro 2026 com marcações de entregas, e lista "Próximos compromissos".
5. Faixa inferior "Precisa da sua atenção": cards curtos com badge de status (briefing parado há 3 dias, proposta sem resposta, aprovação pendente de cliente), cada um com um botão de ação.
6. Remover a barra de navegador falsa e o rodapé técnico. Texto mínimo 11px.
```

## 03 · CRM · Funil de vendas

```text
Tela: CRM, funil de vendas (tela só de CRM, sem a biblioteca de formulários).

Topo: título "CRM", subtítulo "Leads e propostas em andamento", botão principal "+ Novo lead". Linha de 4 KPIs: "Pipeline total R$ 284.000", "Taxa de conversão 32%", "Tempo médio até fechar 18 dias", "Briefings pendentes 6".

Barra de filtros: busca, origem (Instagram, Indicação, Google, WhatsApp), segmento (Pilates, Fisioterapia, Bem-estar, Eventos), alternância Kanban/Lista.

Kanban com 6 colunas, cada uma com contador e soma em R$: Novo lead → Briefing enviado → Briefing recebido → Proposta enviada → Fechado (verde) → Perdido (cinza, recolhida). Cards de lead: nome do estúdio, responsável, segmento em badge, valor estimado, origem, tempo na etapa ("há 2 dias", vermelho se mais de 5 dias). Card em "Novo lead" tem botão "Enviar briefing". Card em "Briefing enviado" mostra PIN em mono (842-910), barra de progresso do preenchimento e botões WhatsApp / E-mail para reenviar. Card em "Briefing recebido" tem botões "Ver respostas" e "Criar proposta". Card em "Fechado" tem botão "Transformar em projeto".

Mostrar um card sendo arrastado entre colunas (sombra maior, leve rotação).
```

## 04 · CRM · Ficha do cliente

```text
Tela: Ficha do cliente "Lumina Movement" no CRM.

Cabeçalho: logo/iniciais, nome, segmento (Pilates reformer), cidade, etapa atual em badge ("Proposta enviada"), valor R$ 75.000 e ações "Enviar mensagem", "Mover etapa", menu ⋯.

Coluna esquerda (2/3) com abas: Linha do tempo (eventos: lead criado, briefing enviado com PIN, briefing respondido 100%, proposta enviada, comentários internos), Briefing (resumo das respostas com link "Abrir completo"), Propostas (lista com versão, valor, status), Arquivos (grade de anexos do cliente), Projetos (cards dos projetos ligados).

Coluna direita (1/3): card de contatos (Helena Vasconcellos, Diretora criativa, WhatsApp, e-mail), card "Próxima ação" com data e responsável, card de notas internas com campo para escrever, e tags editáveis.
```

## 05 · Modal · Enviar briefing com PIN

```text
Componente: modal "Enviar briefing" aberto sobre o CRM (fundo desfocado).

Card de vidro 560px, em 3 passos com indicador no topo:
1. Escolher modelo: lista de modelos do Forms Hub em cards selecionáveis (Briefing Pilates, Fisioterapia & Recovery, Eventos corporativos, Onboarding rápido), com tempo estimado e número de perguntas.
2. Configurar acesso: PIN de 6 dígitos gerado automaticamente em mono grande (842 910) com botão "Gerar outro", validade (7 dias, 15 dias, 30 dias), opção "Permitir salvar e continuar depois".
3. Enviar: abas WhatsApp / E-mail / Copiar link. Prévia da mensagem editável ("Oi Helena! Aqui está o briefing da Lumina Movement. Link: studiosuite.app/b/lumina · PIN: 842 910"), botão principal "Enviar pelo WhatsApp".

Estado final: confirmação com check verde "Briefing enviado. O lead foi movido para Briefing enviado."
```

## 06 · Forms Hub · Biblioteca de modelos

```text
Tela: Forms Hub, biblioteca de modelos de briefing.

Topo: título "Forms Hub", subtítulo "Modelos de briefing e respostas recebidas", botões "Gerar PIN avulso" (secundário) e "+ Novo modelo" (principal). Abas: Modelos | Respostas recebidas | Arquivados.

KPIs: "Modelos ativos 8", "Respostas no mês 23", "Taxa de conclusão 91%", "Tempo médio de preenchimento 14 min".

Grade de cards de modelo (3 colunas): nome, segmento em badge, versão (v2.4), número de perguntas e seções, taxa de conclusão, último uso, link curto em mono e ações "Editar", "Duplicar", "Copiar link", menu ⋯. Um card "Criar a partir de modelo em branco" com borda tracejada.

Na aba Respostas recebidas (mostrar como segunda variação): tabela com cliente, modelo, progresso, status (Em preenchimento, Concluído, Expirado), data e ação "Ver respostas".
```

## 07 · Forms Hub · Editor de modelo

```text
Tela: Editor de modelo de briefing (form builder), modelo "Briefing Pilates v2.4".

Três colunas:
- Esquerda (260px): estrutura do formulário, com seções arrastáveis (1. Responsáveis, 2. Objetivos e escopo, 3. Público e estética, 4. Prazos e materiais) e perguntas dentro de cada uma.
- Centro: canvas com a seção selecionada, mostrando as perguntas como cards editáveis (título, ajuda, obrigatório). Pergunta selecionada com borda laranja.
- Direita (300px): painel de propriedades da pergunta: tipo (texto curto, texto longo, múltipla escolha, cards com imagem, escala, data, faixa de valor, upload de arquivos), opções, obrigatório, lógica condicional ("Mostrar se Escopo inclui Web Design").

Barra superior: nome do modelo editável, status "Rascunho salvo", botões "Pré-visualizar como cliente", "Publicar versão". Paleta de tipos de pergunta acessível por um botão "+ Adicionar pergunta".
```

## 08 · Respostas do briefing

```text
Tela: Respostas do briefing da Lumina Movement (visão do estúdio).

Cabeçalho: cliente, modelo usado, recebido em 18 out 2026, badge "100% respondido", botões "Exportar PDF", "Criar proposta" e principal "Transformar em projeto".

Coluna principal: respostas organizadas pelas 4 seções do formulário, em modo leitura, com perguntas em 12px/600 caixa alta e respostas em 15px. A escolha de estética mostra o card visual escolhido (Sereno & Arquitetônico, com paleta). Arquivos enviados em grade com miniaturas e tamanho.

Coluna lateral: "Resumo do estúdio" com campos para o Hícaro anotar (pontos principais, riscos, escopo sugerido), checklist de escopo (Identidade visual, Web design, Conteúdo, Ambientação) e card "Orçamento informado: R$ 50.000 a R$ 85.000".
```

## 09 · Projetos · Quadro

```text
Tela: Projetos, quadro Kanban. Refazer a tela existente com estes ajustes:

1. Corrigir o título: "Projetos" em uma linha, subtítulo abaixo sem sobreposição. Nenhum texto cortado nos KPIs ("3,4 dias" inteiro).
2. Colunas = fases do projeto: Briefing aprovado → Imersão & conceito → Criação → Revisão do cliente → Ajustes finais → Entregue.
3. Cards: código em mono (#PLT-2026-08), cliente, nome do projeto, barra de progresso de entregáveis (8/12), prazo com cor (verde ok, âmbar perto, vermelho atrasado), avatares do responsável.
4. Alternância no topo: Quadro | Linha do tempo. Filtros: cliente, responsável, prazo.
5. Ao clicar no card abre o painel lateral de detalhe (ver tela Projeto · Evolução), aqui só fechado.
6. Trocar "Squads" por "Responsáveis" e simplificar o vocabulário para um estúdio de design.
```

## 10 · Projeto · Evolução

```text
Tela: Detalhe do projeto "Lumina Movement · Identidade + Plataforma" (#PLT-2026-08), página inteira.

Cabeçalho: cliente, nome, fase atual em badge, progresso geral 45% em anel, prazo final 15 dez 2026, botões "Compartilhar com cliente" e principal "Avançar fase".

Faixa de evolução: linha horizontal com as 6 fases (Briefing aprovado, Imersão & conceito, Criação, Revisão do cliente, Ajustes finais, Entregue), fases concluídas em verde com data, fase atual em laranja pulsante, futuras em cinza.

Coluna principal com abas: Marcos (checklist por fase com responsável e data), Entregáveis (cards com miniatura, versão v1/v2, status Aguardando aprovação / Aprovado / Ajustar), Arquivos, Histórico.

Coluna lateral: card teal "Escopo travado" com os 4 pilares contratados e botão "Solicitar aditivo"; card "Briefing de origem" com citação curta e link; card de horas (planejado 120h, usado 54h); próximos prazos.
```

## 11 · Agenda

```text
Tela: Agenda do estúdio, outubro 2026.

Visão semanal (padrão) com alternância Mês/Semana/Dia. Eventos coloridos por tipo: reunião com cliente (laranja), entrega de projeto (verde), prazo de briefing (teal), interno (cinza). Painel lateral com mini calendário, filtros por tipo e lista "Hoje". Evento selecionado abre um popover com cliente, projeto ligado, link de chamada e botão "Abrir projeto".
```

## 12 · Configurações

```text
Tela: Configurações do Studio Suite.

Menu interno à esquerda: Perfil, Marca do estúdio, Equipe, Mensagens e integrações, Segurança do PIN, Plano.

Mostrar aberta a seção "Mensagens e integrações": cards de WhatsApp (conectado, número), E-mail (domínio verificado), Google Agenda (conectar); modelos de mensagem editáveis para "Envio de briefing", "Lembrete de briefing parado" e "Briefing recebido", com variáveis em chips ({nome}, {link}, {pin}).

Variação 2: seção "Segurança do PIN": validade padrão, tentativas antes de bloquear, exigir PIN em cada acesso, registro de acessos em tabela.
```

## 13 · Cliente · Acesso por PIN

```text
Tela: Acesso ao briefing por PIN (lado do cliente). Manter a tela existente, com estes ajustes:

1. Remover o dock lateral (o cliente não navega pelo sistema). Topo só com o selo "Hícaro Duarte · Studio Suite".
2. Texto: "Digite o código de 6 dígitos que o Hícaro enviou por WhatsApp ou e-mail".
3. Gerar também os estados: PIN incorreto (campos tremem, borda vermelha, "Código incorreto. Você tem mais 2 tentativas."), PIN expirado ("Este código expirou. Peça um novo ao estúdio." com botão "Pedir novo código pelo WhatsApp") e bloqueado após 3 tentativas.
4. Versão mobile 390px com teclado numérico.
```

## 14 · Cliente · Preenchimento do briefing

```text
Tela: Portal do cliente, preenchimento do briefing. Manter a tela existente, com estes ajustes:

1. Remover o dock lateral; usar só um cabeçalho com logo do estúdio, nome do cliente e indicador "Salvo automaticamente há 1 min".
2. Mostrar uma etapa por vez (Etapa 2 de 4 · Objetivos e escopo) com barra de progresso fixa no topo e navegação "Voltar" / "Continuar" fixa no rodapé.
3. Gerar também as etapas 3 (Público e estética, com cards visuais de atmosfera e paleta) e 4 (Prazos, orçamento e upload de arquivos).
4. Versão mobile 390px da etapa 2.
5. Texto mínimo 12px no formulário; campos com 48px de altura.
```

## 15 · Cliente · Briefing enviado

```text
Tela: Confirmação de briefing enviado (lado do cliente).

Card de vidro central com ícone de check verde grande, título "Briefing enviado!", texto "Obrigado, Helena. O Hícaro vai analisar suas respostas e retorna em até 2 dias úteis." Abaixo, linha do tempo curta "O que acontece agora": 1. Análise do briefing, 2. Reunião de alinhamento, 3. Proposta. Botões "Baixar cópia das respostas (PDF)" e "Falar com o Hícaro no WhatsApp". Versão mobile.
```

## 16 · Cliente · Acompanhar projeto

```text
Tela: Portal do cliente, acompanhamento do projeto (Lumina Movement), acessada pelo mesmo PIN.

Cabeçalho com o projeto, fase atual e progresso 45%. Faixa com as 6 fases (concluídas, atual, próximas). Seção "Aguardando sua aprovação": cards de entregáveis com miniatura grande, botões "Aprovar" e "Pedir ajuste" (abre campo de comentário). Seção "Entregas anteriores" com histórico de versões. Seção "Arquivos" para download. Card lateral com próximos prazos e contato do estúdio. Visual mais simples que o painel do estúdio, sem KPIs. Versão mobile.
```
