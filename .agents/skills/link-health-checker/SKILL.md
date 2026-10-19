---
name: link-health-checker
description: "Varre todos os links gerados pelo StudioIntake (portal do cliente, WhatsApp, dashboard) e confirma que cada um abre a tela certa, sem 404, sem template errado e sem cache desatualizado."
category: quality-assurance
risk: safe
source: local-workspace
date_added: "2026-10-19"
---

# Link Health Checker — Verificador de Links Vivos

Confirma que todo link que sai do sistema para um cliente real (ou é usado internamente) realmente abre a tela correta — não um 404, não o template errado, não uma tela em branco por cache desatualizado.

---

## 🎯 O Que Este Skill Verifica

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   GATE 1     │    GATE 2    │    GATE 3    │    GATE 4    │
│  Link Existe │  Template    │  Dados do    │  Sem Cache   │
│  (sem 404)   │  Correto     │  Cliente OK  │  Fantasma    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Gate 1: O Link Abre (sem 404/500)
- [ ] `curl -s -o /dev/null -w "%{http_code}"` no link retorna `200`.
- [ ] Testar com `code` e `brief` corretos, e também um teste negativo (código inválido) para confirmar que cai no estado de "link inválido" (não quebra a página).

### Gate 2: Template Correto é Renderizado
- [ ] Abrir o link em navegador real (Chrome automation) e tirar screenshot.
- [ ] O título exibido bate com `template.titulo` esperado para aquele `template_id` salvo no banco (`GET /api/instances?id=...`).
- [ ] A primeira seção exibida bate com a primeira `secao.titulo` do template esperado — não um template antigo "fantasma" de cache.

### Gate 3: Dados do Cliente Corretos
- [ ] Nome e empresa exibidos na saudação (`Olá, {nome}!`) batem com o cadastro real (`GET /api/clients?code=...`).
- [ ] Nenhum dado de outro cliente (ex: cliente demo antigo) vaza na tela.

### Gate 4: Sem Cache Fantasma
- [ ] Testar o link em uma aba/perfil que **nunca visitou o domínio antes** (simula o dispositivo real do cliente) — não reaproveitar uma aba já usada em testes anteriores.
- [ ] Se o site mudou de `STORAGE_KEYS` (versão do cache local), confirmar que o bundle JS mais recente foi carregado (`curl` no HTML e conferir o hash do `store-*.js` referenciado).

---

## 📋 Protocolo de Execução
Sempre que um novo link for gerado para um cliente real (ou após qualquer deploy que toque em templates/store.js), rodar os 4 gates **antes** de o link ser enviado.

```markdown
### 🔗 Relatório — Link Health Checker

**Link Testado:** [URL completa]
**Template Esperado:** [template_id]

| Gate | Situação | Observações |
| :--- | :---: | :--- |
| Gate 1 — Abre sem erro | ✅/❌ | |
| Gate 2 — Template Correto | ✅/❌ | |
| Gate 3 — Dados do Cliente | ✅/❌ | |
| Gate 4 — Sem Cache Fantasma | ✅/❌ | |

**Parecer:** [Liberado para envio ao cliente / Bloqueado — motivo]
```

## 🚫 Regras Anti-Racionalização
1. "O código parece certo, não preciso abrir o link de verdade" — REPROVADO. Only um teste visual real em navegador conta.
2. "Testei numa aba que já tinha usado antes, deve valer" — REPROVADO. Cache local mascara bugs reais; sempre simular dispositivo novo.
3. "Já mandei pro cliente, só confiro depois" — REPROVADO. O teste é sempre **antes** do envio, nunca depois.
