# client-intake

> Gerado pelo Writer. Escala de confiança: 🟢 CONFIRMADO | 🟡 INFERIDO | 🔴 LACUNA

## Visão Geral
Portal onde o cliente final preenche o briefing: renderização paramétrica por tipo de campo, autosave, 3 idiomas (PT/IT/EN), isolamento de dados entre clientes (zero-leakage) e submissão com confirmação de identidade.

## Responsabilidades
- Resolver com segurança qual cliente/instância corresponde à URL acessada.
- Renderizar dinamicamente as seções/campos do `BriefingTemplate`.
- Salvar progresso automaticamente (autosave) local e remotamente.
- Confirmar identidade (nome+e-mail) antes da submissão final.
- Permitir reabertura controlada para edição, antes do kickoff.

## Regras de Negócio
- RN-INTAKE-01 (CRÍTICA): nunca cair em fallback de "primeiro cliente disponível" quando um código/brief foi explicitamente passado na URL mas não resolveu. 🟢
- RN-INTAKE-02: `enforceRoleIsolation()` roda antes de qualquer resolução de dados, mesmo em tela de erro. 🟢
- RN-INTAKE-03: autosave promove `rascunho → em_preenchimento` automaticamente na primeira edição. 🟢
- RN-INTAKE-04: edição pós-submissão só oferecida em `submetido`; `aprovado_kickoff` é terminal pela UI do cliente. 🟢
- RN-INTAKE-05: digest gerado na submissão é mais simples e fica obsoleto quando a agência abre o briefing (lógica duplicada entre `form-engine.js` e `store.js`). 🟡
- RN-INTAKE-06: idioma é por sessão/navegador, não persistido por cliente/instância no banco. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | Código/brief inválido na URL nunca expõe dados de outro cliente | Must | `initClientPortal` mostra "link inválido" e para, sem fallback |
| RF-02 | Progresso é salvo automaticamente sem ação explícita do cliente | Must | Debounce 600ms após mudança de campo salva local+remoto |
| RF-03 | Submissão exige confirmação de nome+e-mail válidos | Must | Regex de e-mail valida antes de `updateBriefingStatus('submetido')` |
| RF-04 | Formulário renderiza corretamente nos 3 idiomas suportados | Should | `t()` resolve PT/IT/EN com fallback em cascata |
| RF-05 | Reabertura pós-submissão exige confirmação do e-mail original | Should | `unlockForEditing` compara e-mail case-insensitive |

## Requisitos Não Funcionais

| Tipo | Requisito inferido | Evidência no código | Confiança |
|------|--------------------|---------------------|-----------|
| Segurança | Isolamento absoluto de dados entre clientes (zero-leakage) | `form-engine.js` (`initClientPortal`, passo 4) | 🟢 |
| Performance | Debounce de 600ms no autosave para evitar excesso de chamadas | `form-engine.js` (`triggerAutosave`) | 🟢 |
| Disponibilidade | Sincronização remota fire-and-forget, nunca bloqueia o preenchimento | `form-engine.js` (`patchInstanceRemote`) | 🟢 |

## Critérios de Aceitação

```gherkin
Dado um link com code e brief válidos
Quando o cliente acessa a URL
Então vê somente os próprios dados, nunca de outro cliente

Dado um link com code ou brief que não resolve nem local nem remoto
Quando o cliente acessa a URL
Então vê "link inválido" e a tela para, sem mostrar nenhum outro cliente

Dado um briefing em status submetido
Quando o cliente solicita reabertura com o e-mail correto da submissão
Então o formulário é desbloqueado para edição

Dado um briefing em status aprovado_kickoff
Quando o cliente tenta reabrir pela UI
Então não há opção de reabertura (terminal)
```

## Prioridade (MoSCoW)

| Requisito | MoSCoW | Justificativa |
|-----------|--------|---------------|
| Zero-leakage gate (RF-01) | Must | Regra de segurança mais crítica do sistema, nascida de incidentes reais (ADR-003) |
| Autosave (RF-02) | Must | Sem ele, perda de progresso é inaceitável para o cliente final |
| Confirmação de identidade (RF-03) | Must | Protege contra erro humano de submissão em nome errado |
| Unificação do digest preliminar com `generateProductionDigest` (RN-INTAKE-05) | Should | Reduz lógica duplicada, risco baixo hoje (janela pequena) |

## Rastreabilidade de Código

| Arquivo | Função / Classe | Cobertura |
|---------|-----------------|-----------|
| `form-engine.js` | `initClientPortal`, `renderDynamicFormSections`, `triggerAutosave`, `handleFinalSubmission`, `executeFinalSubmission`, `unlockForEditing` | 🟢 |
| `client-form.html` | markup + stepper | 🟢 |
