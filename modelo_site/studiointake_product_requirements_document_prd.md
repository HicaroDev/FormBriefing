# Product Requirements Document (PRD) & Specification
## StudioIntake: Enterprise Client Discovery & Intake Ecosystem

---

### 1. Executive Summary & Product Vision
**StudioIntake** is an AI-assisted, modular client onboarding and briefing ecosystem engineered for creative agencies, design studios, and specialized production teams. The platform bridges the communication gap between high-level client expectations and execution-ready production specs. By replacing fragmented Google Docs, static PDFs, and disjointed emails with tailored, domain-specific intake modules and a centralized operational command center, StudioIntake accelerates discovery turnaround times from weeks to days while standardizing scope definitions and compliance metrics.

---

### 2. Core Personas & User Journeys

#### A. Studio Director / Operations Lead (Agency Internal)
- **Role**: Oversees project viability, capacity planning, and proposal generation.
- **Key Pain Point**: Sifting through incomplete client emails, chasing down missing technical credentials, and manually translating questionnaires into scope estimates.
- **Primary Surface**: **Control Panel (Dashboard)** — Monitors priority intake rosters, triage velocity, budget ranges, and client draft statuses.

#### B. Client Stakeholder (Pilates / Boutique Wellness Founder)
- **Role**: Studio owner launching a new location or digital booking experience.
- **Key Pain Point**: Lacks technical vocabulary around API integrations (e.g., Mariana Tek, Mindbody) but has precise aesthetic and brand tone standards.
- **Primary Surface**: **Pilates Discovery Brief** — Visual tone selection (Serene, Earthy, Pulse), demographic selectors, and studio-specific operational checklists.

#### C. Clinical Director (Physiotherapy & Allied Health)
- **Role**: Healthcare practice owner needing rigorous EHR and patient compliance setups.
- **Key Pain Point**: Strict regulatory requirements (HIPAA, HICAPS, Medicare, GP referral pipelines) that standard agency forms overlook.
- **Primary Surface**: **Physiotherapy & Sports Rehab Brief** — Clinical credential pickers, EHR gateway mappings (Cliniko, Jane App), and outcome measurement protocols.

#### D. Executive Event Producer (Enterprise Tech Summit / Galas)
- **Role**: Lead producer organizing multi-day hybrid summits.
- **Key Pain Point**: Complex multi-track agendas, sponsor deliverables, AV/LED wall specs, and tiered credential access that require granular validation.
- **Primary Surface**: **Event Production Brief** — Capacity forecasting, access tier matrices (NFC badges/lanyards), ticketing gateway webhooks, and stage specs.

---

### 3. System Architecture & Information Model

#### Data Entities & Schema
1. **Intake Document (`BriefInstance`)**:
   - `id`: Unique identifier (e.g., `PLT-2024-08`, `PHY-8802`, `EVT-9421`)
   - `vertical`: `Wellness / Pilates` | `Allied Health / Physio` | `Events & Production` | `Enterprise Brand`
   - `status`: `Draft` | `In Review` | `Approved` | `Ready for Kickoff`
   - `client_metadata`: Client name, primary contact, priority level (`Standard`, `High`, `Urgent`), target delivery date.
   - `commercial_data`: Estimated budget range, billing terms, signed NDA flag.
   - `sections`: Structured array of modular question blocks and response nodes.
   - `audit_trail`: Auto-saved timestamp, version snapshot, last editing collaborator.

2. **Section Archetypes**:
   - `Meta & Header`: Document status, completion percentage gauge, stakeholder tags.
   - `Strategic Scope & Goals`: Multi-select objectives, primary success KPIs, deliverable checklists.
   - `Audience & Personas`: Segmentation cards, pain-point tags, client demographic metrics.
   - `Technical & Operational Specs`: Third-party software integrations, data compliance checkboxes.
   - `Visual & Aesthetic Tone`: Interactive tone selectors, colorway references, asset dropzones.
   - `Sign-off & Action Dock`: Progress indicators, PDF/CSV export, submission locks.

---

### 4. Detailed Feature Specifications & Screen Breakdown

#### Screen 1: Central Control Panel (`Control Panel`)
- **Key Performance Indicators (KPI Bar)**:
  - Total Received Briefs (with month-over-month growth delta)
  - Pending Review Queue (action items needing partner sign-off)
  - In Production (active design & dev sprint stages)
  - Client Drafts (unsubmitted or in-progress client sessions)
  - Average Discovery Turnaround Time (e.g., 3.2 days target)
- **Filtering & Search Bar**:
  - Filter by Industry Vertical: All, Pilates/Wellness, Physiotherapy/Health, Events/Production.
  - Filter by Triage Status: All, Submitted, In Review, Ready for Kickoff.
  - Global fuzzy search across client names, brief concepts, and reference IDs.
- **Priority Intake Roster**:
  - Tabular view listing Client & Vertical, Brief Concept overview, Submission Age & Urgency Tag, Status Badge, and contextual Action buttons ("Open Brief", "Ping Client").
- **Live Brief Snapshot Drawer**:
  - Contextual inspector panel updating upon row selection, displaying:
    - Primary objectives summary
    - Approved budget range bracket
    - Target demographic breakdown
    - Next critical milestone and sign-off deadline.

#### Screen 2: Universal Briefing Form Template (`Universal Template`)
- **Sticky Section Anchor Navigation**: Real-time progress tracker (`3 of 5 Sections completed`), jump-links to individual chapters.
- **Initiative Subject Header**: Editable title, client organization, target launch date picker, priority tag.
- **Strategic Objectives & Deliverables Matrix**: Interactive selection of scope boundaries (Brand Identity, Web Experience, Mobile App) and custom deliverable tags.
- **Quantitative KPI Forecast**: Baseline vs. target milestone metrics (e.g. Inbound Conversion %, Design Velocity).
- **Interactive Persona Cards**: Primary and secondary persona archetypes with explicit motivations and critical pain points.
- **Brand Posture Sliders**: Visual tone spectrum bars (Balanced Editorial vs. Witty, Focused Precision vs. Expressive, Progressive Vanguard vs. Institutional).
- **Aesthetic Benchmarks & Moodboard Uplink**: Visual reference cards and multi-format drag-and-drop upload zone.

#### Screen 3: Vertical-Specific Briefing Modules
- **Pilates & Movement (`Briefing - Pilates`)**:
  - Core objectives: Class booking velocity, high-tier membership retention, teacher training LMS.
  - Atmosphere selector: Serene & Architectural vs. Warm Earthy Minimalist vs. High-Energy Athletic.
  - Studio ops integration: Mindbody/Mariana Tek webhook options, interactive floorplan spot-picker toggle, Spotify playlist sync.
- **Physiotherapy & Sports Rehab (`Briefing - Physiotherapy`)**:
  - Referral ingestion: GP/Doctor direct pipelines, workers' compensation & third-party claim workflows.
  - Clinical focus areas: MSK, post-op orthopedics, vestibular rehabilitation.
  - Compliance check: HIPAA & GDPR encrypted patient consent, health fund rebate gap calculators, Cliniko/Jane App calendar sync.
- **Event Production & Summits (`Briefing - Events`)**:
  - Capacity & ticketing: In-person delegates vs. digital stream projections, Tito/Stripe/Eventbrite integration.
  - Delegate tiers & credentialing: C-Suite VIP, developers, enterprise sponsors, and press access zoning with NFC wood badge specifications.
  - Stage & AV infrastructure: Curved seamless LED walls, broadcast audio specs, sponsor package tiers (Headline, Platinum, Gold).

---

### 5. Technical Requirements & Design System Tokens

- **Design System Alignment**: Built on `Studio Intake System` (`{{DATA:DESIGN_SYSTEM:DESIGN_SYSTEM_1}}`).
  - **Color Tokens**:
    - Primary Accent: `#4f46e5` (Deep Indigo / Action Blue)
    - Surface Canvas: `#f9f9ff`
    - Container Surfaces: `#ffffff` (Cards), `#f1f3ff` (Muted input fills)
    - Borders & Outlines: Subtle `#d3daef` / `#e2e8f0` 1px clean delineation.
  - **Typography**: Plus Jakarta Sans, strict typographic hierarchy across headline-sm, label-md, and body-md tokens.
  - **Interactivity**: Auto-saving feedback loop ("Auto-saved 2m ago"), real-time completion gauge, floating action bar dock.

---

### 6. Success Metrics & Roadmap
1. **Time-to-Proposal (TTP)**: Reduction of client discovery cycle time from 10 days to under 48 hours.
2. **Form Completion Rate**: Target >88% unassisted completion on specialized industry brief templates.
3. **Scope Drift Reduction**: 40% reduction in unbilled scope change orders via locked deliverable matrices and sign-off docks.
4. **Phase 2 Expansion**: Client portal link sharing with magic link authentication, automated Loom video walk-through embedding, and direct Figma/Jira project scaffolding integration.
