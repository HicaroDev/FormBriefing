# design-reference-stitch

> Gerado pelo Writer. Esta unit não tem comportamento executável — documenta requisitos de **preservação** de material de referência.

## Visão Geral
Todo o conteúdo de `modelo_site/` (HTMLs do Stitch + documentos de produto escritos pelo usuário) deve ser preservado intacto como fonte de verdade visual e de intenção de produto.

## Responsabilidades
- Nenhuma em runtime — é material de referência, não código de produção.

## Regras de Negócio
- O Reversa nunca modifica, move ou apaga nada em `modelo_site/` (regra absoluta do framework). 🟢
- `prompts_stitch_studio_suite_2.1.md` é a fonte primária de priorização (MVP/Depois) para qualquer decisão de roadmap. 🟢

## Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | `modelo_site/` permanece intacto, sem edição | Must | Nenhum diff em `modelo_site/` em nenhum commit futuro relacionado a specs |
| RF-02 | Toda nova spec de UI consulta o prompt original do usuário antes de assumir um elemento do mockup como requisito | Should | Specs de `crm-funil`/`forms-hub`/`telas-preview-v2` já citam o prompt original |

## Rastreabilidade de Código

| Arquivo | Cobertura |
|---------|-----------|
| `modelo_site/**` | 🟢 (preservado, não é código de produção) |
