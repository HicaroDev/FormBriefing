---
name: Studio Intake System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#464555'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#555f70'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f4'
  on-secondary-container: '#596374'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d9e3f7'
  secondary-fixed-dim: '#bdc7db'
  on-secondary-fixed: '#121c2a'
  on-secondary-fixed-variant: '#3d4757'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered for high-stakes creative and executive briefing intake. It strikes a balance between editorial restraint and modern utilitarian efficiency. Built for creative agency directors, brand strategists, and enterprise clients, the aesthetic projects authority, focus, and poise.

The design movement combines **Minimalism** with subtle **Tactile Precision**:
- **Clarity over decorative clutter:** Generous negative space, disciplined hierarchy, and intentional structural lines prioritize content comprehension without visual distraction.
- **Warm Editorial Touch:** Avoiding stark clinical monochrome, the palette incorporates warm slates, cream-tinted canvas backdrops, and ink-inspired dark charcoals.
- **Calm, deliberate interaction:** Interactive cues are refined and understated, utilizing soft micro-transitions, crisp focus rings, and muted indigo indicators to confirm state changes without loud visual interruptions.

## Colors

The color palette centers on functional hierarchy, legibility, and architectural precision:

- **Primary (`#4F46E5`):** Reserved strictly for high-leverage interactive touchpoints: active focus rings, primary submission triggers, active selection chips, and validated states.
- **Secondary (`#374151`):** Applied to structural controls, secondary interactive triggers, active tab indicators, and contextual guidance icons.
- **Neutral Core:**
  - Ink Charcoal (`#111827`): Display titles, section headers, input values, and key metrics.
  - Slate Medium (`#4B5563`): Descriptive copy, field requirements, and form tooltips.
  - Muted Charcoal (`#6B7280`): Placeholders, helper annotations, and inactive controls.
- **Surfaces & Borders:**
  - Base Canvas: Soft off-white / light slate tinted neutral (`#F9FAFB`).
  - Section Canvas / Recessed areas: Cream-slate tint (`#F3F4F6`).
  - Card & Container Surfaces: Pure crisp white (`#FFFFFF`).
  - Dividers & Outlines: Crisp subtle border slate (`#E5E7EB`), transitioning to `#D1D5DB` on interactive hover.

## Typography

The typographic strategy pairs **Plus Jakarta Sans** for headlines and structural sections with **Inter** for form inputs, data entry, long-form guidance notes, and labels.

- **Headlines:** Use Plus Jakarta Sans to deliver an approachable yet refined corporate signature. Maintain snug letter tracking (`-0.02em` on `headline-xl` and `headline-lg`) to preserve optical cohesion across broad viewports.
- **Body & Forms:** Inter provides neutral clarity. Tabular and form data display without optical fatigue, even across multi-tier briefs.
- **Labels & Microcopy:** Labels leverage medium weights (`500`) to contrast against `#111827` active inputs and `#6B7280` placeholders. Microcopy in guidance drawers stays strictly legible at `13px` with generous `18px` leading.

## Layout & Spacing

The layout employs a centered fixed-width grid architecture suited for structured brief authoring and intake evaluation:

- **Desktop (>= 1024px):** A constrained central shell (`max-w-5xl` or 960px–1120px) utilizing an 8-column layout. Forms and contextual sidebars divide at 5:3 or maintain a focused single-column flow with `margin` of `3rem` and `gutter` of `1.5rem`.
- **Tablet (768px – 1023px):** Fluid single-column with `margin` of `2rem` and card padding at `space-lg`.
- **Mobile (< 768px):** Linear stacked layout with `margin-mobile` of `1.25rem` and `gutter-mobile` of `1rem`. Multi-field rows (e.g., Timeline Start/End, Budget Ranges) collapse automatically into vertical form clusters.
- **Vertical Rhythm:** Sections are separated by `space-xl` (`2.5rem`), while input labels, helper text, and interactive targets follow strict internal multiples of `space-xs` and `space-sm`.

## Elevation & Depth

Visual hierarchy relies on structural planes and subtle, high-diffusion shadows rather than exaggerated layering:

- **Surface Levels:**
  - *Base Layer (`#F9FAFB`):* Document root and page framing.
  - *Container Layer (`#FFFFFF`):* Crisp white briefing cards, accordions, and modular intake containers, outlined by a 1px solid `#E5E7EB` border.
  - *Elevated Floats (`#FFFFFF`):* Dropdowns, autocomplete suggestions, date pickers, and tooltips.
- **Shadow Profile:**
  - *Resting Card:* Flat border `#E5E7EB` accompanied by an ultra-subtle ambient shadow: `0 1px 3px 0 rgba(17, 24, 39, 0.04), 0 1px 2px -1px rgba(17, 24, 39, 0.03)`.
  - *Interactive / Floating Surface:* `0 10px 15px -3px rgba(17, 24, 39, 0.06), 0 4px 6px -4px rgba(17, 24, 39, 0.04)`.
- **Focus Elevation:** Inputs never cast heavy shadows; instead, they employ a subtle dual-ring: an inner solid white ring (`2px`) with an outer `#4F46E5` accent line (`2px`).

## Shapes

The design system adopts a balanced **Rounded** profile (`roundedness: 2`, base radius of `0.5rem` / `8px`):

- **Inputs, Buttons & Controls:** Form controls, action buttons, text areas, and standard select boxes use standard `0.5rem` (8px) corners to preserve a crisp, architectural form factor.
- **Containers & Cards:** Outer intake section cards and brief containers use `rounded-lg` (`1rem` / `16px`) to soften the overall viewport footprint.
- **Tags, Chips & Indicators:** Filter tags and guidance pill toggles adopt `rounded-full` for rapid scannability and tactile affordance.

## Components

### Input Fields & Text Areas
- **Resting:** `#FFFFFF` background, 1px solid border `#E5E7EB`, text `#111827`, placeholder `#9CA3AF`. Padding: `0.625rem 0.875rem`.
- **Hover:** Border transitions smoothly to `#D1D5DB`.
- **Focus:** Border shifts to `#4F46E5` with an external glow ring `box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12)`.
- **Filled / Disabled:** Disabled surfaces shift to `#F3F4F6` with border `#E5E7EB` and text `#9CA3AF`.

### Action Buttons
- **Primary:** Background `#111827` (charcoal ink) with `#FFFFFF` text. On hover, background deepens to `#1F2937`. For critical submit actions, `#4F46E5` is available with an active state of `#4338CA`.
- **Secondary / Ghost:** Transparent background with 1px border `#E5E7EB`, text `#374151`. Hover produces `#F9FAFB` surface fill with `#111827` text.
- **Height & Spacing:** Primary actions sit at 40px height on desktop with horizontal padding of `1.25rem`.

### Collapsible Guidance Chips & Tags
- **Selection Chips (Multi-select options):** Default state `#FFFFFF` with border `#E5E7EB` and text `#4B5563`. Selected state features `#EEF2FF` fill, `#4F46E5` border, and `#4F46E5` text with a check icon.
- **Guidance Drawer / Helper Chip:** Small collapsible trigger containing lightbulb/info iconography in `#6B7280`. Expands an accordion drawer with background `#F9FAFB` and subtle border `#E5E7EB` offering brief prompt examples.

### Checkboxes & Radio Controls
- **Geometry:** Checkboxes use `4px` rounded corners; radio controls are circular.
- **Unchecked:** 1px border `#D1D5DB` against `#FFFFFF`.
- **Checked:** Background `#4F46E5` with an inset white checkmark or center pip. Focus states project a soft `2px` ring in `#EEF2FF`.

### Cards & Section Containers
- **Brief Intake Cards:** Encased in pure white `#FFFFFF` with border `#E5E7EB` and `16px` border-radius. Internal padding follows `1.5rem` (mobile) to `2.5rem` (desktop).
- **Section Headers:** Nested directly inside cards, accompanied by an optional numeric or category badge (e.g., `01. Objectives`) styled in `label-sm` with background `#F3F4F6` and text `#4B5563`.

### File Upload & Asset Drops
- **Dropzone Container:** Bordered by a 1.5px dashed `#D1D5DB` outline over a `#F9FAFB` background. Drag-active state activates `#EEF2FF` fill with `#4F46E5` dashed outline.