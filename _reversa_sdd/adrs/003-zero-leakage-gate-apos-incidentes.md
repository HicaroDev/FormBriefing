# ADR-003 — Gate de zero-leakage no portal do cliente

**Status:** Aceito (implementado) · **Data:** entre `9c0bf2a` e `f8cb3aa` (início do projeto) · **Confiança:** 🟢 CONFIRMADO (3 commits de correção em sequência)

## Contexto
O portal do cliente (`form-engine.js` → `initClientPortal()`) resolve o cliente/instância a partir de parâmetros de URL (`code`/`brief`). Pelo menos 3 commits em sequência corrigem vazamento de isolamento entre clientes: `7d9d2e0` ("código inválido cai no cliente errado"), `575e27d` ("vazamento residual na tela de link inválido") e `f8cb3aa` ("botão de envio do briefing era falso").

## Decisão
Se um `code`/`brief` explícito na URL não resolver (local ou remotamente), o sistema **nunca** deve cair no "primeiro cliente disponível" como comportamento de fallback — deve mostrar explicitamente um estado de link inválido.

## Consequências observadas
- Hoje esta é a regra de segurança mais rigidamente aplicada e documentada do sistema (RN-INTAKE-01), tratada como crítica em toda a análise.
- O fato de ter nascido de **incidentes reais** (não de uma revisão de design preventiva) reforça que qualquer refatoração futura do `form-engine.js` ou do roteamento de acesso do cliente precisa tratar este gate como não-negociável e testá-lo explicitamente — não é uma regra teórica, já vazou dados reais pelo menos uma vez antes de ser corrigida.
