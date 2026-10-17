# System & UI Design Document: StuntWatch (`design.md`)

## 1. Layout Grid, Row & Column Placement Specification
Since data will be populated via mock generators and later swapped for production APIs, the visual hierarchy relies on strict row/column structural containers. All views share a `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` outer container.

---

### 1.1 Global Top Navigation Ribbon (`components/layout/Header.tsx`)
Sticky top bar (`h-16`, `border-b`, `backdrop-blur-md`) divided into a single horizontal flex row (`flex items-center justify-between`):

| Column / Slot | Alignment | Placement & Elements | Behavior |
| :--- | :--- | :--- | :--- |
| **Col 1: Brand** | Left (`justify-start`) | `stuntwatch` typographic logo (`font-bold text-xl tracking-tight`) | Links to `/` (Landing Page) |
| **Col 2: Navigation & Controls** | Right (`justify-end`, `gap-6`) | 1. `Home` link<br>2. `FAQ` link<br>3. `Contact` link<br>4. `LanguageToggle` (`ID \| EN`)<br>5. `ThemeToggle` (Pill switch with Sun/Moon icon) | `Home` routes to `/maps`. Active route displays an underline indicator. Theme toggle switches `light`/`dark` class on `<html>`. |

---

### 1.2 View 1: Landing Page (`app/page.tsx`) — *Based on Wireframe Sketch*
Designed as a centered, single-column vertical flow occupying the remaining viewport height (`min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center`).

```
+-----------------------------------------------------------------------+
| [stuntwatch]                          [Home]  [FAQ]  [Contact]  (O|*) | <-- Row 1: Global Ribbon
+-----------------------------------------------------------------------+
|                                                                       |
|                              StuntWatch                               | <-- Row 2: Hero Title (Col-span-12)
|                                                                       |
|       "StuntWatch adalah platform pemantauan dan pemetaan risiko      | <-- Row 3: Explanation Block
|        stunting di seluruh 38 provinsi dan 514 kabupaten/kota..."     |     (max-w-2xl, centered prose)
|                                                                       |
|                            +--------------+                           |
|                            |     Maps     |                           | <-- Row 4: Primary CTA Button
|                            +--------------+                           |     (Routes to /maps)
|                                                                       |
+-----------------------------------------------------------------------+
```

- **Row 1 (Header)**: Global Ribbon.
- **Row 2 (Hero Title)**: `h1` (`text-4xl sm:text-6xl font-extrabold tracking-tight mb-6`).
- **Row 3 (Explanation Paragraph)**: Centered single column (`max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-8`). Explains what StuntWatch is, how the 0–100 risk index works, and how policymakers can drill down from national to district level.
- **Row 4 (CTA Action)**: Rounded pill button (`px-10 py-6 text-lg font-semibold rounded-full shadow-md`) labeled **"Maps"** (EN) / **"Buka Peta"** (ID) linking to `/maps`.

---

### 1.3 View 2: National Heatmap (`app/maps/page.tsx`)
Arranged in a **3-Row, 12-Column CSS Grid** (`grid-cols-1 lg:grid-cols-12 gap-6 py-6`):

```
+-----------------------------------------------------------------------+
| Row 1: Page Title, Subtitle & Quick Filter / Search Bar (12 Cols)     |
+--------------------------------------------------+--------------------+
| Row 2, Col 1-9 (9 Cols on Desktop / Full Mobile) | Row 2, Col 10-12   |
|                                                  | (3 Cols Desktop)   |
|           [ Interactive IndonesiaMap ]           | [ Top 5 Highest ]  |
|             (38 Provinces SVG Canvas)            | [ Bottom 5 Low  ]  |
|                                                  |                    |
|  [ MapLegend: 0 (Low) ============== 100 (High)] |                    |
+--------------------------------------------------+--------------------+
| Row 3: Accessible Keyboard Province Directory Table/Grid (12 Cols)    |
+-----------------------------------------------------------------------+
```

- **Row 1 (Context Header — 12 Cols)**: Page title (*"Peta Risiko Stunting Nasional"*), data year badge, and quick province jump combobox.
- **Row 2 (Primary Workspace — 12 Cols split 9 / 3)**:
  - **Left Column (`lg:col-span-9`)**: `IndonesiaMap` card container (`aspect-[16/9]` responsive SVG) with floating `MapTooltip` and bottom-docked `MapLegend`.
  - **Right Column (`lg:col-span-3`)**: Quick-scan summary card listing the **Top 5 Highest Risk** and **Bottom 5 Lowest Risk** provinces (`Rank`, `Province Name`, `Risk Badge`).
- **Row 3 (Accessibility & Directory — 12 Cols)**: Collapsible/focusable grid of all 38 provinces so keyboard-only and screen-reader users can navigate without a mouse.

---

### 1.4 View 3: Province & Explanation View (`app/provinsi/[provinceId]/[[...kabKotaId]]/page.tsx`)
Structured into **3 Major Vertical Sections** (Breadcrumb Row -> Split Map/Ranking Row -> Full-Width Explanation Panel Section):

```
+-----------------------------------------------------------------------+
| Row 1: [<- Back to National]   Indonesia  /  Aceh          (12 Cols)  |
+-----------------------------------+-----------------------------------+
| Row 2, Col 1-7 (7 Cols Desktop)   | Row 2, Col 8-12 (5 Cols Desktop)  |
|                                   | +-------------------------------+ |
|         [ ProvinceMap ]           | | RankFilters (Search/Band/Sort)| |
|   (Zoomed Kab/Kota SVG Canvas)    | +-------------------------------+ |
|                                   | | KabKotaRankList (Scrollable)  | |
|   [ MapLegend ]                   | | #1 Kab. Aceh Utara [78] [===] | |
|                                   | | #2 Kab. Pidie      [74] [== ] | |
|                                   | | #3 Kota Banda Aceh [31] [=  ] | |
|                                   | +-------------------------------+ |
+-----------------------------------+-----------------------------------+
| Row 3: EXPLANATION PANEL (Full 12-Col Container Below Ranked List)    |
| +-------------------------------------------------------------------+ |
| | Block 1: Header (Name, Kab/Kota Badge, Score, Prov & Nat Rank)    | |
| +-------------------------------------------------------------------+ |
| | Block 2: SummaryCard (2-3 sentence plain-language narrative)      | |
| +---------------------------------+---------------------------------+ |
| | Block 3 (Col 1-6):              | Block 4 (Col 7-12):             | |
| | FactorContributionChart         | ComparisonTable                 | |
| | (SHAP horizontal + / - bars)    | (Region vs Prov Avg vs Nat Avg) | |
| +---------------------------------+---------------------------------+ |
| | Block 5: FactorCard Grid (3-Col Responsive Expandable Cards)      | |
| +---------------------------------+---------------------------------+ |
| | Block 6 (Col 1-8):              | Block 7 (Col 9-12):             | |
| | RecommendationList              | MethodologyNote & Source Card   | |
| +---------------------------------+---------------------------------+ |
+-----------------------------------------------------------------------+
```

#### Detailed Column & Row Specifications for the Explanation Panel:
1. **Block 1 (Panel Header Row — 12 Cols)**: Flex row (`justify-between`) displaying `[Kab/Kota Name]`, `[Kabupaten | Kota Badge]`, and on the right: large numeric `riskIndex`, colored `RiskLevel` badge, `Province Rank #X of Y`, and `National Rank #X of 514`.
2. **Block 2 (`SummaryCard` — 12 Cols)**: Highlighted callout box (`bg-muted/50 border-l-4`) containing the localized 2–3 sentence narrative.
3. **Block 3 & Block 4 (Analytical Split Row — 12 Cols split 6 / 6 on `lg`)**:
   - **Left (`lg:col-span-6`) — `FactorContributionChart`**: Horizontal bar chart with central zero axis. Bars extending right (`+contribution`, red) show risk drivers; bars extending left (`-contribution`, green) show protective factors. Includes a toggleable `"View as Text Table"` tab for accessibility.
   - **Right (`lg:col-span-6`) — `ComparisonTable`**: 5-column data table:
     - `Col 1`: Indicator Name (`label`)
     - `Col 2`: Region Value (`value` + `unit`)
     - `Col 3`: Province Avg (`provinceAvg`)
     - `Col 4`: National Avg (`nationalAvg`)
     - `Col 5`: Status Badge (`Better` / `Worse` semantic pill with directional arrow icon)
4. **Block 5 (`FactorCard` Grid — 12 Cols)**: Responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`) of expandable cards. Each card header shows the indicator label, regional value, and contribution badge; expanding reveals the plain-language `description`.
5. **Block 6 & Block 7 (Action & Governance Row — 12 Cols split 8 / 4 on `lg`)**:
   - **Left (`lg:col-span-8`) — `RecommendationList`**: Numbered cards with concrete interventions tailored to the region's worst-performing factors.
   - **Right (`lg:col-span-4`) — `MethodologyNote`**: Muted card detailing `dataYear`, `source`, and the non-diagnostic planning disclaimer.

---

## 2. Single Source of Truth Color System (`lib/colorScale.ts`)
No component may hardcode hex or Tailwind risk colors. All visual elements import helpers from `lib/colorScale.ts`, which adapts to Light and Dark modes:

| Risk Level (`RiskLevel`) | Index Band | Map Continuous Interpolator | Badge / Bar Semantic Tokens (Light & Dark Safe) |
| :--- | :--- | :--- | :--- |
| `low` | `0 – 24` | `d3.interpolateRdYlGn(1 - t)` (Green range) | Emerald (`#10b981` / dark-safe surface + high-contrast text) |
| `moderate` | `25 – 49` | Yellow-Green to Amber range | Amber (`#f59e0b` / dark-safe surface + high-contrast text) |
| `high` | `50 – 74` | Orange to Coral Red range | Orange-Red (`#f97316` / dark-safe surface + high-contrast text) |
| `very_high` | `75 – 100` | Deep Crimson range | Rose/Crimson (`#e11d48` / dark-safe surface + high-contrast text) |

*Rule*: Every color badge, bar, or polygon must always be accompanied by its numeric score (`0–100`) or translated text label (`Rendah`, `Sedang`, `Tinggi`, `Sangat Tinggi`).
