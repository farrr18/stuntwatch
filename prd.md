# Product Requirements Document (PRD): StuntWatch
**Sub-title:** Peta Risiko Stunting Indonesia (Indonesia Stunting Risk Map)  
**Architecture:** Front-End-Only Web Application (Next.js App Router, Mock Adapter Pattern)

---

## 1. Executive Summary & Vision
**StuntWatch** is an interactive, front-end-only geospatial decision-support web application that visualizes the likelihood of childhood stunting across all 38 provinces and ~514 kabupaten/kota (regencies/cities) in Indonesia. 

Designed with a strict decoupled data layer, all UI components consume typed React Query hooks backed by local mock JSON and TopoJSON files. This allows engineering teams to drop in live production APIs and updated official boundary files later by modifying only a single adapter directory (`lib/api/`).

---

## 2. Updated Product Flow & Routing Architecture
To accommodate the new introductory Landing Page and global navigation ribbon, the URL state machine is structured as follows (the URL remains the single source of truth for all view and selection states):

1. **Landing Page (`/`)**: 
   - Displays the global navigation ribbon at the top.
   - Centered hero section featuring the **StuntWatch** title, a concise mission & platform explanation paragraph, and a primary CTA button (`Maps` / `Lihat Peta`) that routes to `/maps`.
2. **National Heatmap View (`/maps` — linked as "Home" in the Ribbon)**:
   - Renders the interactive 38-province Indonesia choropleth map, legend, and optional top/bottom 5 summary side panel.
   - Clicking any province triggers an animated zoom and navigates to `/provinsi/[provinceId]`.
3. **Province View (`/provinsi/[provinceId]`)**:
   - Displays the zoomed-in Kabupaten/Kota map alongside a filterable, sortable ranked list.
   - Automatically selects the highest-risk Kabupaten/Kota (`rank === 1`) by default or routes directly to `/provinsi/[provinceId]/[kabKotaId]`.
4. **Kabupaten/Kota Explanation Deep-Link (`/provinsi/[provinceId]/[kabKotaId]`)**:
   - Synchronizes the map highlight, active ranked list row, and the 7-block `ExplanationPanel` directly below the list.
5. **Static Support Routes (`/faq` and `/contact`)**:
   - Accessible from the top ribbon to answer methodology questions and provide institutional contact details.

---

## 3. Core Functional Requirements

### 3.1 Global Navigation Ribbon (`Header.tsx`)
- Present across all pages (`/` through `/provinsi/...`).
- **Left Slot**: Brand logo/wordmark (`stuntwatch`), clickable to return to the Landing Page (`/`).
- **Right Slot**: Navigation links (`Home` -> `/maps`, `FAQ` -> `/faq`, `Contact` -> `/contact`), Language Toggle (`ID` / `EN`), and Theme Togglepill (`Light` / `Dark` mode switch).

### 3.2 Landing Page (`/`)
- Matches the reference wireframe: clean, distraction-free vertical stack centered in the viewport.
- Contains the `StuntWatch` display heading, a 3–4 line plain-language overview of how regional stunting risk is modeled, and a prominent pill/rounded-rectangle `Maps` button directing users to `/maps`.

### 3.3 National Heatmap (`/maps`)
- Lazy-loads `public/geo/provinces.topojson` (all 38 provinces).
- Fills polygons using the unified continuous scale (`0–100`) from `lib/colorScale.ts`.
- **Hover**: Displays `MapTooltip` (Province Name, Risk Index, Risk Level badge, National Rank) and applies a high-contrast stroke outline.
- **Accessibility**: Includes a screen-reader and keyboard-focusable list of all 38 provinces with explicit `aria-label` attributes (e.g., *"Aceh, risk index 62, high risk"*).

### 3.4 Province Drill-Down & Ranked List (`/provinsi/[provinceId]`)
- **Breadcrumb Bar**: `Indonesia > [Province Name]` + "Back to National Map" button.
- **Map & List Split**: Side-by-side on desktop, stacked on mobile (`375px`).
- **Bi-directional Highlighting**: Hovering or focusing a row in `KabKotaRankList` highlights the polygon in `ProvinceMap`, and vice versa.
- **Controls (`RankFilters`)**: Instant client-side search by name, filter by discrete `RiskLevel` (`low`, `moderate`, `high`, `very_high`), and sort order toggle (default: highest risk to lowest).

### 3.5 Explanation Panel (`ExplanationPanel.tsx`)
Positioned immediately below the Province Map & Ranked List container. Driven dynamically by the selected `kabKotaId` and composed of 7 sequential blocks:
1. **Header**: Region name, type badge (`Kabupaten` / `Kota`), numeric index score, risk level badge, provincial rank, and national rank.
2. **SummaryCard**: 2–3 sentence plain-language narrative dynamically tied to the region's top contributing factors.
3. **FactorContributionChart**: SHAP-style horizontal bar chart (Recharts) sorted by absolute contribution (`-1` to `+1`), colored red for risk-increasing factors and green for protective factors, paired with an accessible text table alternative.
4. **ComparisonTable**: Structured row/column matrix comparing Regional Value vs. Province Average vs. National Average across all 8–12 indicators, with visual status pills (*Better* / *Worse than avg*).
5. **FactorCard Grid**: Expandable accordion cards explaining what each indicator measures and how it biologically/socially impacts stunting.
6. **RecommendationList**: 3–5 prioritized, actionable policy/health interventions.
7. **MethodologyNote**: Planning-support disclaimer, data year, and source attribution.

---

## 4. Technical Stack & Constraints (Fixed)
- **Framework**: Next.js App Router + TypeScript (`strict: true`, zero `any`).
- **Styling & Theme**: Tailwind CSS + `shadcn/ui` + `next-themes` (for seamless Light/Dark mode).
- **Geospatial & Color**: `d3-geo` (SVG rendering, no tile servers), `topojson-client`, `d3-scale`, `d3-scale-chromatic`.
- **Data Layer**: TanStack Query (`@tanstack/react-query`) wrapping mock adapters in `lib/api/`.
- **Charts & Motion**: `recharts` + `framer-motion` (province zoom & layout transitions).
- **Internationalization**: `next-intl` supporting Bahasa Indonesia (`id`, default) and English (`en`), persisted across navigation.

---

## 5. Data Contract (`lib/types.ts`)
- Hooks are the **only** permitted way UI components access data:
  - `useProvinces()`
  - `useKabKota(provinceId: string)`
  - `useExplanation(kabKotaId: string)`
- **12 Standard Indicators**: Poverty rate, access to improved sanitation, access to clean drinking water, exclusive breastfeeding, maternal anemia, antenatal care coverage, basic child immunization, low birth weight, child dietary diversity, mother's education, early marriage, food insecurity.

---

## 6. Phased Delivery & Browser Acceptance Gates
- **Phase 0 (Foundation)**: Project scaffold, `lib/types.ts`, `lib/colorScale.ts`, seeded mock generator (`38` provinces, `~514` kab/kota), hooks, `next-intl`, and `next-themes` Light/Dark setup.
- **Phase 1 (Ribbon, Landing Page & National Map)**: Top ribbon (`StuntWatch`, `Home`, `FAQ`, `Contact`, Theme/Lang toggles), Landing Page (`/`) with `Maps` CTA, and `/maps` national choropleth with keyboard list.
- **Phase 2 (Province View)**: `/provinsi/[provinceId]` map + ranked list, bi-directional hover/selection, search/filter/sort controls, and breadcrumb.
- **Phase 3 (Explanation Panel)**: All 7 analytical blocks rendered below the ranked list and synced with `/provinsi/[provinceId]/[kabKotaId]`.
- **Phase 4 (Polish & Accessibility)**: `375px` mobile responsiveness check, full keyboard-only traversal, WCAG AA contrast verification in both Light and Dark modes, and Framer Motion transitions.
