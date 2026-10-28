# Onboarding — Cadastro de Projeto (MVP) com vínculo a Cliente

> Roteiro manual para validar esta feature contra o ambiente real (Vercel + Neon), mesmos moldes das features 001/002. Pré-requisito: `api/migrate.js` já rodado no ambiente de destino.

## 1. Fases existem e estão na ordem certa

```bash
curl -s "https://<seu-deploy>.vercel.app/api/projetos?meta=fases" -H "Cookie: si_session=<cookie do seu login>"
```

Confirme as 6 fases (`briefing_aprovado` → `entregue`) na ordem 1-6.

## 2. Criar um Projeto a partir de um Cliente real

1. Abra `projects.html` logado como admin.
2. Crie um Projeto de teste escolhendo um dos clientes reais (ex.: Kalea ou Carola) no seletor.
3. Confirme que o Projeto aparece na coluna "Briefing aprovado".

## 3. Mudar de fase

1. Mova o Projeto de teste para "Criação".
2. Recarregue — confirme que persistiu.

## 4. Apontar horas

1. Em `project-detail.html` do Projeto de teste, aponte 5 horas consumidas duas vezes.
2. Confirme que `consumed_hours` chegou a 10 (não 5 — cada apontamento soma).

## 5. Bloqueio sem sessão

```bash
curl -s -X GET "https://<seu-deploy>.vercel.app/api/projetos"
```

Sem cookie, deve retornar `401`.

## 6. Auditoria

Consulte `audit_log` e confirme entradas para `projeto_criado`, `projeto_fase_alterada`, `horas_apontadas`.

## 7. Limpeza

Apague o Projeto de teste (`DELETE /api/projetos?id=`) antes de considerar a validação concluída.

## Observação sobre o visual

`projects.html`/`project-detail.html` **não** têm mais squads, SLA médio, Gantt ou matriz de capacidade — isso era decorativo no mockup original, sem nenhuma entidade real por trás, e foi removido de propósito (mesma lógica do score de IA do Lead). Se isso for uma surpresa, veja `_reversa_forward/003-projeto-cadastro-mvp/investigation.md` para a justificativa completa.
