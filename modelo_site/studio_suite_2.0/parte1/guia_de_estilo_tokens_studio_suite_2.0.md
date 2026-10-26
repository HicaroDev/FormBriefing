# Guia de Estilo & Tokens Visuais (Design System) — Studio Suite 2.0 (Curadoria Hicaro Duarte)

---

## 1. Paleta de Cores (Color Tokens)

### Tons Principais & Marca (Signature Glow)
- **Primary / Brand Accent:** `#E65100` / `#F97316` (Laranja Atelier Quente / Terracota Vibrante — Identidade Hicaro Duarte).
- **Secondary / Action Accent:** `#4F46E5` (Índigo Profundo — botões de fluxo analítico e status verificados).
- **Glass Surface Base:** `rgba(255, 255, 255, 0.65)` a `rgba(255, 255, 255, 0.85)` com `backdrop-blur(20px)`.
- **Canvas / Background Geral:** Gradiente sutil e aconchegante em luz difusa: `linear-gradient(135deg, #FBF8F3 0%, #F5EFEB 50%, #ECE4DB 100%)`.
- **Bordas & Reflexos Glassmorphic:** `rgba(255, 255, 255, 0.70)` (borda de luz superior) e `rgba(211, 218, 239, 0.35)` (delineamento sutil).
- **Sombras Espaciais:** `0 20px 40px -15px rgba(230, 81, 0, 0.07), 0 10px 25px -5px rgba(0, 0, 0, 0.04)`.

### Superfícies de Apoio & Containers
- **Surface Canvas:** `#F9F9FF` / `#FAF7F2` (Luz natural).
- **Container Lowest (Branco Puro Card):** `#FFFFFF`.
- **Container Low (Muted Fill para Inputs):** `#F1F3FF` / `#F7F5F0`.
- **Container High (Seleções ativas):** `#FFF7ED` (com borda alaranjada).

### Semântica & Status
- **Sucesso / Verificado:** `#10B981` (Verde Esmeralda).
- **Em Andamento / Atenção:** `#F59E0B` (Âmbar Ouro).
- **Urgente / Alerta:** `#EF4444` (Coral Intenso).
- **Criptografia & Segurança:** `#0D9488` (Ciano / Teal Suave).

---

## 2. Tipografia (Typography & Scale)

- **Família Tipográfica:** `Plus Jakarta Sans`, sans-serif (Google Fonts). Suporte secundário: `Inter` / `system-ui`.
- **Pesos Utilizados:** 
  - Regular (`400`) para textos descritivos e parágrafos.
  - Medium (`500`) para placeholders, metadados e tags.
  - Semi-Bold (`600`) para rótulos de campos, botões de ação e tabelas.
  - Bold (`700`) para títulos de seções, números KPI e headers principais.

### Escala de Tamanhos & Entrelinha
- **Display / Hero KPI:** `32px` a `40px` (Line-height: `1.15`, Tracking: `-0.02em`).
- **Headline (H1 / Título da Tela):** `24px` a `28px` (Line-height: `1.25`, Tracking: `-0.015em`).
- **Section Title (H2 / Cards de Bloco):** `18px` a `20px` (Line-height: `1.3`, Peso: `600`).
- **Sub-header / Rótulo de Destaque:** `14px` a `15px` (Line-height: `1.4`, Peso: `600`).
- **Body Text (Texto Padrão):** `13px` a `14px` (Line-height: `1.5`, Cor: `#475569` Slate 600).
- **Micro-copy & Badges:** `11px` a `12px` (Line-height: `1.4`, Peso: `500`, Tracking: `+0.02em`).

---

## 3. Elementos de Interface & Raios de Borda (Corner Radius)

- **Dock Flutuante Lateral:** `rounded-3xl` (`24px`).
- **Cards Principais & Módulos Glass:** `rounded-2xl` (`16px` a `20px`).
- **Campos de Entrada (Input / Select):** `rounded-xl` (`10px` a `12px`).
- **Botões de Ação Principal:** `rounded-xl` (`10px` a `12px`), com transição tátil `active:scale-[0.98]`.
- **Tags, Badges e Pílulas de Status:** `rounded-full` (`9999px`).
