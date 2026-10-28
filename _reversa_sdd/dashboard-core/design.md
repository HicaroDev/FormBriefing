# dashboard-core, Design Técnico

## Interface

| Símbolo | Assinatura | Retorno | Observação |
|---------|-----------|---------|------------|
| `generateProductionDigest(instance, client)` | `(BriefingInstance, Cliente)` | `RespostaDigest` | Resolve campos dinamicamente a partir do template real, nunca nomes fixos |
| `selectBrief(briefId, reRenderTable)` | `(string, boolean)` | `void` | Popula o inspetor via `querySelector` em cadeias de classe CSS específicas |
| `generateClientCode()` | `()` | `string` | `CLI-` + 4 dígitos, até 100 tentativas de evitar colisão |
| `generateBriefingId()` | `()` | `string` | `BRF-<ano>-<seq>`, `seq = instances.length + 90` |
| `getTemplates()` | `()` | `BriefingTemplate[]` | SEED_TEMPLATES sempre sobrescreve cache por `id` |
| `renderTable()` | `()` | `void` | Roteia para `renderClientsTable` ou tabela de briefings conforme `currentView` |

## Fluxo Principal
1. `DOMContentLoaded` → `requireAuth()` → `renderMetrics`/`renderDistribution`/`renderRecentActivity` → `setupEventListeners` + modais → `checkHashRoute` → `selectBrief` do primeiro item ou estado vazio.
2. Registra 2 pollings: 3.5s (hash de estado local) e 10s (`syncAllFromRemote`) — estratégia de sincronização "quase em tempo real" sem websocket/SSE.
3. Seleção de briefing sempre resintetiza o digest (`generateProductionDigest`), nunca lê um valor congelado.
4. Ações do diretor (`approveBriefing`, `openAdjustmentsModal`, `shareWhatsApp`) alteram `BriefingInstance.status` e disparam side-effects (digest, mensagem de WhatsApp pronta).

## Fluxos Alternativos
- **Falha de rede em qualquer sync remoto:** captura exceção, retorna `null`, UI segue com dado local (`apiCall`).
- **Template só existe no cache (gerado por IA):** preservado por `getTemplates()`, não sobrescrito (só os IDs do SEED_TEMPLATES do código são forçados).
- **Checklist com item marcado manualmente:** casamento por **texto** do item (não por índice) preserva o status `concluido` entre sínteses, exceto os 3 primeiros itens (sempre recalculados).

## Dependências
- `ai-briefing-generator.js` — usado pelo modal de geração de template via IA simulada.
- `api/clients.js`, `api/instances.js` — alvo das chamadas de sincronização remota.

## Decisões de Design Identificadas

| Decisão | Evidência no código | Confiança |
|---------|---------------------|-----------|
| Digest nunca é "congelado" — sempre resintetizado ao abrir o briefing | `dashboard.js` (`selectBrief`) | 🟢 |
| Chaves de `localStorage` versionadas com sufixo `_v3`, bump manual no código | `store.js` (`STORAGE_KEYS`) | 🟢 |
| Inspetor lateral acoplado a seletores CSS específicos do HTML (frágil a mudanças de classe) | `dashboard.js` (`selectBrief`) | 🟡 |

## Estado Interno
- `localStorage`: `studiointake_clientes_v3`, `studiointake_templates_v3`, `studiointake_instancias_v3`, `studiointake_digests_v3`, `studiointake_config_v3`.
- Estado em memória: `currentFilter`, `currentView`, `searchQuery`, `selectedBriefId`.

## Observabilidade
Nenhum log estruturado/métrica emitida. 🔴

## Riscos e Lacunas
- 🔴 RN-CORE-04: sem validação formal de transição de status — qualquer `updateBriefingStatus(id, novoStatus)` é aceito.
- 🟡 RN-CORE-05: `generateBriefingId` pode colidir se uma instância for removida e outra criada na mesma janela de contagem.
- 🟡 Acoplamento do inspetor a seletores CSS específicos — já causou pelo menos um bug de seletor ambíguo sobrescrevendo badge errado (ver `git log`, commit `c1f1a5f`).
