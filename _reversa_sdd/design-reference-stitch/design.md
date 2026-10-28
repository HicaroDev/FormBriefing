# design-reference-stitch, Design Técnico

## Interface
N/A — não é código executável.

## Estrutura preservada
- Era "StudioIntake" (anterior, inglês): 9 pastas de mockup + PRD.
- Era "Studio Suite 2.0" `parte1` (16 telas MVP) e `parte2` (5 telas glassmorphic).
- `prompts_stitch_studio_suite_2.1.md` — roadmap priorizado do usuário.
- `manual_de_implementa_o_studio_suite_2.1_para_claude_code.md` — schema de referência (stack hipotética, não vinculante).

## Decisões de Design Identificadas

| Decisão | Evidência | Confiança |
|---------|-----------|-----------|
| `modelo_site/` é read-only para qualquer agente do Reversa | CLAUDE.md do projeto, regra absoluta | 🟢 |
| Roadmap do usuário é a fonte primária de priorização, superior a qualquer inferência visual do mockup | `prompts_stitch_studio_suite_2.1.md` | 🟢 |

## Riscos e Lacunas
- 🟡 3 cópias idênticas de `studio_intake_system/DESIGN.md` — candidato a limpeza manual pelo usuário (fora do escopo do Reversa, que não apaga nada por conta própria).
