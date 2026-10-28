# ai-briefing-generator, Design Técnico

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `generateTemplateFromPrompt(userPrompt, category)` | `(string, string?)` | `BriefingTemplate` | Matching de preset ou síntese textual fixa |
| `generateAISynthesis(briefingInstance, client)` | `(BriefingInstance, Cliente)` | `RespostaDigest` | **Código morto** — não chamado em nenhum lugar |

## Fluxo Principal
1. Normaliza prompt para minúsculas.
2. Procura substring bidirecional contra `AI_PRESETS` (key/vertical/name).
3. Match → clona preset, troca id.
4. Sem match → monta template genérico (4 seções fixas, texto interpolado).
5. `addTemplate()` persiste; retorna o template.

## Fluxos Alternativos
- Nenhum tratamento de erro visível além do try/catch no chamador (`dashboard.js`).

## Dependências
- `store.js` — `addTemplate`, `getTemplates`, `saveDigest`, `getDigestByBriefingId`.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Nenhuma chamada de rede a LLM real, apesar do `AI_BRIEFING_SYSTEM_PROMPT` documentar um prompt "para Gemini/Claude/GPT-4" | `ai-briefing-generator.js` (ausência de `fetch`/SDK) | 🟢 |
| `generateAISynthesis` coexiste com `generateProductionDigest` (store.js), mas nunca é chamada | `dashboard.js:38-42` (import sem uso) | 🟢 |

## Estado Interno
Nenhum — opera sobre o estado de `store.js`.

## Observabilidade
Nenhuma. 🔴

## Riscos e Lacunas
- 🟡 Slug do fallback não translitera acentos — pode gerar slugs feios para prompts com caracteres especiais.
- 🟢 Decisão de produto pendente: remover `generateAISynthesis` ou conectá-la de fato (ver `questions.md`).
