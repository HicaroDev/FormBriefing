# Onboarding — Funil de Lead/Deal (CRM) com conversão para Cliente

> Roteiro manual para validar esta feature contra o ambiente real (Vercel + Neon), nos mesmos moldes do `onboarding.md` da feature 001. Pré-requisito: a migração (`api/migrate.js`) já foi rodada no ambiente de destino.

## 0. Pré-requisito: Kanban de briefing não pode ter desaparecido

Antes de testar qualquer coisa de Lead, confirme que a função antiga não foi perdida na migração de página:

1. Acesse o dashboard (`index.html`) logado como admin.
2. Acesse a nova view do Kanban de briefing (`#kanban`, nome final conforme implementado no `/reversa-to-do`).
3. Confirme que os briefings aparecem agrupados pelas mesmas 4 colunas de antes, e que arrastar um card entre colunas ainda muda o status real (mesmo teste que já existia informalmente antes desta feature).

Se isso falhar, **pare aqui** — é uma regressão, não um bug da feature nova.

## 1. Estágios do funil existem e estão na ordem certa

```bash
curl -s "https://<seu-deploy>.vercel.app/api/leads?meta=estagios" -H "Cookie: si_session=<cookie do seu login>"
```

Confirme que retorna os 6 estágios (`novo_lead`, `briefing_enviado`, `briefing_recebido`, `proposta_enviada`, `fechado`, `perdido`) na ordem 1-6.

## 2. Criar um Lead pela UI

1. Abra `crm.html` (agora o funil de Lead) logado como admin.
2. Crie um Lead de teste (ex.: "Lead Teste Onboarding", empresa "Teste LTDA").
3. Confirme que ele aparece na coluna "Novo lead".

## 3. Mover entre estágios (drag-and-drop)

1. Arraste o card do Lead de teste até "Proposta enviada".
2. Recarregue a página — confirme que ele continua em "Proposta enviada" (persistiu no banco, não só em memória).

## 4. Bloqueio sem sessão (RF-05)

```bash
curl -s -X GET "https://<seu-deploy>.vercel.app/api/leads"
```

Sem o cookie de sessão, a resposta deve ser `401`, sem nenhum dado de Lead no corpo.

## 5. Converter em Cliente (RF-04)

1. Mova o Lead de teste para "Fechado".
2. Clique em "Converter em Cliente".
3. Confirme que: (a) um `Cliente` novo aparece na carteira de clientes, com os mesmos dados de contato; (b) o Lead de teste **continua existindo** (não foi apagado) e agora mostra o vínculo com o Cliente novo.
4. Tente converter o mesmo Lead de novo — confirme que dá erro (`409`), não duplica o Cliente.

## 6. Nenhum score de IA visível (RF-06)

Confira visualmente o card do Lead — não deve haver nenhum número de "score", percentual de IA, ou texto de "insight" gerado automaticamente.

## 7. Auditoria (RF-08)

Depois dos passos 2-5, consulte a tabela `audit_log` (via painel do Neon ou `psql`) e confirme que existem entradas para `lead_criado`, `lead_estagio_alterado`, `lead_convertido` — nenhuma delas com dado sensível no campo registrado.

## 8. Limpeza

Apague o Lead de teste e o Cliente gerado pela conversão (via `DELETE /api/leads?id=` e a tela de clientes), para não deixar dados de teste misturados com clientes reais (Kalea, Carola, etc.).

## Observação sobre a ausência de "Transformar em Projeto"

O mockup de referência tem um botão "Transformar em Projeto" no card de Lead fechado. Ele **não existe** nesta entrega, de propósito — `Projeto` é a próxima feature do roadmap, ainda não implementada. Isso não é um bug.
