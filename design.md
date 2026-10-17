# System & UI Design Document: StuntWatch (`design.md`)

## 1. Custom Medical Brand Wordmark (`components/layout/BrandLogo.tsx`)
- **Inline SVG + Tailwind Minimalist Medical Wordmark**:
  - `"Stun"` + base/stem of `"t"` in Medical Navy (`#132A4A` in Light Mode / `#F8FAFC` in Dark Mode).
  - Crossbar of `"t"` replaced by a **Red Medical Cross (`#D9463E` / `dark:fill-red-400`)** with a white ECG heartbeat wave running across it.
  - `"Watch"` in Health Teal (`#159A7C` in Light Mode / `#2DD4BF` in Dark Mode), with a small red ECG heartbeat pulse wave at the top-right of `"h"`.
  - Supports `variant="full"` (includes subtitle *"Peta Risiko Stunting Indonesia"* below the wordmark) and `variant="ribbon"` (compact for `Header.tsx`).

---

## 2. Screen Layouts & Live Endpoint Wiring

### 2.1 Global Top Ribbon (`components/layout/Header.tsx`)
- Sticky top bar (`h-16 border-b backdrop-blur-md`):
  - **Left**: `<BrandLogo variant="ribbon" />` (links to `/`).
  - **Right**: `Home` (`/maps`), `FAQ` (`/faq`), `Contact` (`/contact`), `LanguageToggle` (`ID`/`EN`), and `ThemeToggle` (`next-themes` Light/Dark pill switch).

### 2.2 Screen 0 — Landing Page (`app/page.tsx`)
- Centered vertical hero stack (`min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center`):
  - `<BrandLogo variant="full" />`
  - Plain-language overview paragraph explaining StuntWatch's spatial ML & SHAP modeling across 38 provinces and 514 kabupaten/kota.
  - Rounded pill `"Maps"` CTA button linking to `/maps`.

### 2.3 Screen 1 — National Dashboard (`app/maps/page.tsx`)
- **3-Column Desktop Grid (`grid-cols-1 lg:grid-cols-12 gap-6`)**:
  - **Left (`lg:col-span-3`)**: 38 Provinces table from `GET /api/provinces` sorted by highest predicted risk.
  - **Center (`lg:col-span-6`)**: Interactive **Leaflet Choropleth Heatmap** (`IndonesiaMap.tsx`) consuming `GET /api/map-data` (`{ [domain_id]: { kabupaten, provinsi, pred, actual, tier, color } }`) + `public/geo/provinces.topojson` & district markers/polygons. Renders CARTO Light/Dark basemap tiles + interactive GeoJSON/CircleMarker layers colored by `/api/map-data` (`#22c55e`, `#eab308`, `#f97316`, `#ef4444`).
  - **Right (`lg:col-span-3`)**: Top 15 **National Watchlist** from `GET /api/top-risky?n=15` (with fallback to `/api/map-data` / `/api/kabupaten` top 15).

### 2.4 Screen 2 — Province Detail (`app/provinsi/[provinceId]/page.tsx`)
- **Row 1**: Breadcrumb (`Indonesia / [Province Name]`) + Back to National Map button.
- **Row 2**: 4 KPI Summary Cards from `GET /api/provinsi/{slug}/summary` (`avg_predicted` vs `avg_actual`, `tier_counts`, `highest_risk`, `lowest_risk`).
- **Row 3**: Split **Zoomed Leaflet Map** (`lg:col-span-7`, `ProvinceMap.tsx` wired to `/api/map-data` and province TopoJSON) + **District Table** (`lg:col-span-5`, `KabKotaRankList.tsx` wired to `GET /api/provinsi/{slug}`, strictly sorted by `actual` or `top_feature_shap` descending).

### 2.5 Screen 3 — District Detail & AI Policy Brief (`ExplanationPanel.tsx`)
- Placed directly below the district table & map on `/provinsi/[provinceSlug]/[kabKotaId]`:
  - **Left Column (`lg:col-span-6`)**: Instant SHAP horizontal bar chart (`FactorContributionChart.tsx`) from `GET /api/kabupaten/{id}` (`top_features`), plus expandable `ComparisonTable` & `FactorCard` dictionary below.
  - **Right Column (`lg:col-span-6`)**: Together AI Indonesian Policy Brief (`SummaryCard.tsx`) & Prevention Recommendations (`RecommendationList.tsx`) fetched asynchronously from `GET /api/kabupaten/{id}/narrative` with a dedicated 2–4 second loading spinner (*"Menyusun analisis & rekomendasi kebijakan AI (2–4 detik)..."*) so it never blocks the SHAP chart.
