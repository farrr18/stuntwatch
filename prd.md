# Product Requirements Document (PRD): StuntWatch
**Sub-title:** Peta Risiko Stunting Indonesia (Indonesia Stunting Risk Map)  
**Architecture:** Next.js App Router + Leaflet Choropleth Heatmap (`/api/map-data`) + Live FastAPI/Together AI Backend (`https://based-concluded-sitemap-separately.trycloudflare.com`)

---

## 1. Executive Summary & Vision
**StuntWatch** is an interactive geospatial decision-support web application that visualizes childhood stunting prevalence, ML-predicted stunting risk, and TreeSHAP factor attributions across all 38 provinces and 514 kabupaten/kota (regencies/cities) in Indonesia.

---

## 2. Screen Architecture & Product Flow

1. **Global Top Ribbon (`components/layout/Header.tsx`)**:
   - Sticky top navigation bar (`h-16 border-b backdrop-blur-md`).
   - **Left Slot**: Custom medical wordmark `<BrandLogo variant="ribbon" />` linking to `/`.
   - **Right Slot**: Navigation links (`Home` -> `/maps`, `FAQ` -> `/faq`, `Contact` -> `/contact`), Language Toggle (`ID`/`EN`), and Light/Dark Mode toggle (`next-themes`).
2. **Screen 0 — Landing Page (`app/page.tsx`, `/`)**:
   - Centered hero stack featuring `<BrandLogo variant="full" />` (custom inline SVG medical wordmark with subtitle *"Peta Risiko Stunting Indonesia"*), a concise platform explanation paragraph, and a rounded `"Maps"` CTA button linking to `/maps`.
3. **Screen 1 — National Dashboard (`app/maps/page.tsx`, `/maps`)**:
   - 3-column desktop grid (`grid-cols-1 lg:grid-cols-12 gap-6`):
     - **Left (`lg:col-span-3`)**: 38 Provinces table powered by `GET /api/provinces`.
     - **Center (`lg:col-span-6`)**: Interactive **Leaflet Choropleth Heatmap** (`IndonesiaMap.tsx`) powered by `GET /api/map-data` (and `GET /api/provinces`), coloring regions by their `/api/map-data` risk tier & color (`#22c55e` Rendah, `#eab308` Sedang, `#f97316` Tinggi, `#ef4444` Sangat Tinggi) with interactive popups/tooltips and click-to-zoom navigation.
     - **Right (`lg:col-span-3`)**: Top 15 **National Watchlist** powered by `GET /api/top-risky?n=15` (with live fallback to `/api/map-data` / `/api/kabupaten` top 15).
4. **Screen 2 — Province Detail (`app/provinsi/[provinceId]/page.tsx`, `/provinsi/[provinceSlug]`)**:
   - **Top Row**: Provincial KPI summary cards powered by `GET /api/provinsi/{slug}/summary` (`avg_predicted`, `avg_actual`, `tier_counts`, `highest_risk`, `lowest_risk`).
   - **Split Workspace**: Zoomed **Leaflet Province Map** (`ProvinceMap.tsx` wired to `/api/map-data` and provincial GeoJSON/TopoJSON boundaries) alongside the filterable **District Table** (`KabKotaRankList.tsx` wired to `GET /api/provinsi/{slug}`).
   - **Strict Sorting Rule**: District table sorts strictly by `actual` descending or `top_feature_shap` descending by default (**never** by `predicted`).
5. **Screen 3 — District Detail & AI Policy Brief (`/provinsi/[provinceSlug]/[kabKotaId]` & `ExplanationPanel.tsx`)**:
   - Positioned directly below the district map and table.
   - **Left Analytical Column**: Instant SHAP horizontal bar chart (`FactorContributionChart.tsx`) powered by `GET /api/kabupaten/{id}` (`top_features`: `name`, `value`, `shap`).
   - **Right Policy Brief Column**: Together AI Indonesian Policy Brief & Prevention Recommendations (`SummaryCard.tsx` + `RecommendationList.tsx`) powered by `GET /api/kabupaten/{id}/narrative` via non-blocking `useDistrictNarrative(kabKotaId)` with a dedicated 2–4 second loading spinner (*"Menyusun analisis & rekomendasi kebijakan AI (2–4 detik)..."*).
