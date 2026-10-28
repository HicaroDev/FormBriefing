# client-intake, Design Técnico

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `initClientPortal()` | `()` | `void` | Bootstrap; roda `enforceRoleIsolation()` antes de qualquer resolução de dados |
| `renderField(campo, isReadOnly)` | `(Campo, boolean)` | `HTMLElement` | Motor paramétrico por tipo: text/textarea/select/chips_multiselect/cards_single_select/slider/upload |
| `triggerAutosave()` | `()` | `void` | Debounce 600ms; recalcula progresso, promove status, salva local+remoto |
| `handleFinalSubmission()` → `executeFinalSubmission(nome, email)` | `(string, string)` | `void` | Confirma identidade, grava `__confirmado_nome`/`__confirmado_email`, muda status, gera digest preliminar |
| `t(val, vars)` | `(string\|object, object?)` | `string` | i18n com fallback em cascata `activeLocale → pt → it → en → primeiro disponível` |

## Fluxo Principal
1. `enforceRoleIsolation()` — remove links internos da agência incondicionalmente, antes de tudo.
2. Resolve `code`/`pin` e `brief`/`id` da URL; busca local primeiro.
3. Se algum parâmetro foi passado, revalida em paralelo contra o remoto (nunca confia só no cache).
4. **Gate de zero-leakage:** parâmetro presente mas não resolvido (nem local, nem remoto) → mostra link inválido e para.
5. Fallback de "primeiro disponível" só roda se **nenhum** parâmetro foi passado.
6. Resolve template (por `template_id`, fallback por vertical do cliente).
7. Carrega `respostas_brutas`/`anexos` para o estado em memória.
8. Resolve idioma (`?lang=` > `localStorage` > `'pt'`).
9. Renderiza e configura autosave + dock de ações.

## Fluxos Alternativos
- **Reabertura em `submetido`:** oferecida na UI; exige e-mail igual ao de `__confirmado_email` (case-insensitive).
- **`aprovado_kickoff`:** terminal — sem opção de reabertura na UI do cliente.
- **Submissão final:** gera digest preliminar simplificado via `saveDigest`, que é sobrescrito na próxima abertura do briefing pela agência (`selectBrief` sempre resintetiza com `generateProductionDigest`).

## Dependências
- `store.js` — `getClientByCode`, `getBriefingInstanceById`, `updateBriefingInstance`, `updateBriefingStatus`, `saveDigest`.
- `api/clients.js`/`api/instances.js` — revalidação remota e `patchInstanceRemote`.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Zero-leakage gate nunca cai em fallback quando parâmetro explícito não resolve | `form-engine.js:182-185` | 🟢 |
| Chaves de confirmação (`__confirmado_nome`/`__confirmado_email`) prefixadas para não colidir com IDs de campo do template | `form-engine.js` (`executeFinalSubmission`) | 🟢 |
| Idioma por sessão/navegador, não por entidade persistida | `form-engine.js` | 🟢 |

## Estado Interno
- `formAnswers`, `uploadedFiles` (memória, hidratados de `respostas_brutas`/`anexos`).
- `localStorage.studiointake_locale` — preferência de idioma por navegador.

## Observabilidade
Nenhum log estruturado/métrica emitida. 🔴

## Riscos e Lacunas
- 🟡 RN-INTAKE-05: digest preliminar duplica lógica de `generateProductionDigest` com resultado mais simples — considerar unificar em uma função compartilhada.
- 🔴 Não observado nenhum caminho de reabertura pós-`aprovado_kickoff` pela agência (dashboard) — se existir, está fora do escopo lido deste módulo; validar com o usuário.
- 🟡 Validação de e-mail é regex simples, não RFC 5322 completo — aceitável para o caso de uso, mas vale documentar como limitação conhecida.
