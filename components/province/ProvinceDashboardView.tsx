"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import {
  useProvinces,
  useProvinceSummary,
  useKabKota,
} from "@/lib/hooks/useStuntingData";
import { resolveProvinceSlug } from "@/lib/api/mockAdapter";
import { useAppLocale } from "@/lib/i18n";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { ProvinceMap } from "@/components/map/ProvinceMap";
import { KabKotaRankList } from "@/components/ranking/KabKotaRankList";
import {
  ExplanationPanel,
  type ProvinceAccordionKey,
} from "@/components/explanation/ExplanationPanel";

interface ProvinceDashboardViewProps {
  provinceId: string;
  initialKabKotaId?: string;
}

export function ProvinceDashboardView({
  provinceId,
  initialKabKotaId,
}: ProvinceDashboardViewProps) {
  const router = useRouter();
  const { locale } = useAppLocale();
  const slug = resolveProvinceSlug(provinceId);

  const { data: provinces } = useProvinces();
  // Live Endpoint 3: GET /api/provinsi/{provinceSlug}/summary
  const { data: summary } = useProvinceSummary(slug);
  // Live Endpoint 4: GET /api/provinsi/{provinceSlug}
  const { data: kabKotaList, isLoading } = useKabKota(slug);

  const [hoveredKabKotaId, setHoveredKabKotaId] = useState<string | null>(null);

  // All 6 analytical accordion sections below the full-width map are COLLAPSED by default on initial load
  const [openSections, setOpenSections] = useState<
    Record<ProvinceAccordionKey, boolean>
  >({
    peringkat: false,
    shap_ai: false,
    rekomendasi: false,
    matriks: false,
    kamus: false,
    metodologi: false,
  });

  const handleToggleSection = (key: ProvinceAccordionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleJumpToSection = (
    key: ProvinceAccordionKey,
    anchorId: string
  ) => {
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      const el = document.getElementById(anchorId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const province = useMemo(
    () => provinces?.find((p) => p.slug === slug || p.id === provinceId),
    [provinces, slug, provinceId]
  );

  // Determine active KabKota (either deep-linked or highest actual risk rank #1 by default)
  const activeKabKota = useMemo(() => {
    if (!kabKotaList || kabKotaList.length === 0) return null;
    if (initialKabKotaId) {
      const found = kabKotaList.find(
        (k) =>
          k.id === String(initialKabKotaId) ||
          String(k.domain_id) === String(initialKabKotaId)
      );
      if (found) return found;
    }
    return kabKotaList[0];
  }, [kabKotaList, initialKabKotaId]);

  const handleSelectKabKota = (nextKabKotaId: string) => {
    // Automatically open Section 2 (SHAP & AI Brief) when clicking a district on the map or inside Section 1
    setOpenSections((prev) => ({ ...prev, shap_ai: true }));
    router.push(`/provinsi/${slug}/${nextKabKotaId}`, { scroll: false });
  };

  if (isLoading || !kabKotaList || !activeKabKota) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-[#f1f5f9]">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-6">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-teal-400" />
            <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading Province Live Summary & Districts...
            </p>
          </div>
        </main>
      </div>
    );
  }

  const provinceName =
    summary?.province ?? province?.name ?? activeKabKota.provinceName;

  const dominantTier =
    summary && (summary.tier_counts["Sangat Tinggi"] ?? 0) > 0
      ? "Sangat Tinggi"
      : summary && (summary.tier_counts.Tinggi ?? 0) > 0
      ? "Tinggi"
      : "Sedang";

  const proxyCount = kabKotaList.filter(
    (item) =>
      item.data_confidence === "proxy" ||
      item.top_feature?.endsWith("_prov_pct")
  ).length;

  const totalCount = kabKotaList.length;
  const top3NamesWithActualPct = kabKotaList
    .slice(0, 3)
    .map((k) => `${k.name} (${k.actual}%)`)
    .join(", ");

  const criticalCount = summary
    ? (summary.tier_counts["Sangat Tinggi"] ?? 0) +
      (summary.tier_counts.Tinggi ?? 0)
    : 0;
  const criticalPct =
    summary && summary.n_kabupaten > 0
      ? Math.round((criticalCount / summary.n_kabupaten) * 100)
      : 0;

  const NAV_PILLS: Array<{
    label: string;
    key: ProvinceAccordionKey;
    anchorId: string;
  }> = [
    {
      label: locale === "id" ? "Peta & Peringkat" : "Map & Rankings",
      key: "peringkat",
      anchorId: "peta-peringkat",
    },
    {
      label: locale === "id" ? "Faktor SHAP" : "SHAP Factors",
      key: "shap_ai",
      anchorId: "faktor-shap",
    },
    {
      label: locale === "id" ? "Ringkasan AI" : "AI Summary",
      key: "shap_ai",
      anchorId: "ringkasan-ai",
    },
    {
      label: locale === "id" ? "Rekomendasi" : "Recommendations",
      key: "rekomendasi",
      anchorId: "rekomendasi",
    },
    {
      label: locale === "id" ? "Matriks" : "Matrix",
      key: "matriks",
      anchorId: "matriks",
    },
    {
      label: locale === "id" ? "Kamus Indikator" : "Indicator Glossary",
      key: "kamus",
      anchorId: "kamus-indikator",
    },
    {
      label: locale === "id" ? "Metodologi" : "Methodology",
      key: "metodologi",
      anchorId: "metodologi",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-[#f1f5f9]">
      <main className="mx-auto max-w-7xl px-6 py-6 w-full space-y-5 flex-1">
        {/* 1. Breadcrumb Bar (← Kembali ke Peta Nasional) */}
        <Breadcrumb
          provinceId={slug}
          provinceName={provinceName}
          kabKotaName={activeKabKota.name}
        />

        {/* 2. Province Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {locale === "id"
                ? `Provinsi ${provinceName}`
                : `${provinceName} Province`}
            </h1>
            {summary && (
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20">
                {dominantTier} ({summary.avg_predicted}% Proxy /{" "}
                {summary.avg_actual}% SSGI)
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] px-3 py-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {locale === "id"
                ? "Diperbarui: Februari 2025 (Susenas 2024/2025)"
                : "Updated: February 2025 (Susenas 2024/2025)"}
            </span>
          </span>
        </div>

        {/* 3. Always-Visible 4 Provincial KPI Cards (`GET /api/provinsi/{provinceSlug}/summary`) */}
        {summary && (
          <section
            aria-label="Provincial KPI Summary"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {/* KPI 1: Prediksi Risiko (Proxy) vs Aktual */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  {locale === "id"
                    ? "Prediksi Risiko (Proxy) vs Aktual"
                    : "Predicted Risk (Proxy) vs Actual"}
                </span>
                <Activity className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
                  {summary.avg_predicted}%
                </span>
                <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  (Aktual SSGI: {summary.avg_actual}%)
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Range: {summary.min_predicted}% – {summary.max_predicted}% · MAE{" "}
                {summary.mae_in_province}
              </p>
            </div>

            {/* KPI 2: Distribusi Tier (X Kab/Kota) */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  {locale === "id"
                    ? `Distribusi Tier (${summary.n_kabupaten} Kab/Kota)`
                    : `Tier Distribution (${summary.n_kabupaten} Districts)`}
                </span>
                <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {criticalPct}% Kritis
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5 text-center font-mono text-xs">
                <div className="rounded-lg bg-rose-500/15 px-1.5 py-1 text-rose-700 dark:text-rose-300">
                  <div className="text-sm font-extrabold">
                    {summary.tier_counts["Sangat Tinggi"] ?? 0}
                  </div>
                  <div className="text-[9px] font-sans">S.Tinggi</div>
                </div>
                <div className="rounded-lg bg-orange-500/15 px-1.5 py-1 text-orange-700 dark:text-orange-300">
                  <div className="text-sm font-extrabold">
                    {summary.tier_counts.Tinggi ?? 0}
                  </div>
                  <div className="text-[9px] font-sans">Tinggi</div>
                </div>
                <div className="rounded-lg bg-amber-500/15 px-1.5 py-1 text-amber-700 dark:text-amber-300">
                  <div className="text-sm font-extrabold">
                    {summary.tier_counts.Sedang ?? 0}
                  </div>
                  <div className="text-[9px] font-sans">Sedang</div>
                </div>
                <div className="rounded-lg bg-emerald-500/15 px-1.5 py-1 text-emerald-700 dark:text-emerald-300">
                  <div className="text-sm font-extrabold">
                    {summary.tier_counts.Rendah ?? 0}
                  </div>
                  <div className="text-[9px] font-sans">Rendah</div>
                </div>
              </div>
            </div>

            {/* KPI 3: Kab/Kota Risiko Tertinggi */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  {locale === "id"
                    ? "Kab/Kota Risiko Tertinggi"
                    : "Highest Risk District"}
                </span>
                <AlertOctagon className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              </div>
              <p className="mt-2 truncate text-lg font-extrabold text-slate-900 dark:text-white">
                {summary.highest_risk}
              </p>
              <p className="mt-1 font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">
                Max Predicted: {summary.max_predicted}% · Aktual SSGI:{" "}
                {kabKotaList[0]?.actual ?? summary.avg_actual}%
              </p>
            </div>

            {/* KPI 4: Kab/Kota Risiko Terendah */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>
                  {locale === "id"
                    ? "Kab/Kota Risiko Terendah"
                    : "Lowest Risk District"}
                </span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 truncate text-lg font-extrabold text-slate-900 dark:text-white">
                {summary.lowest_risk}
              </p>
              <p className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Min Predicted: {summary.min_predicted}% · Kategori:{" "}
                {kabKotaList[kabKotaList.length - 1]?.risk_tier ?? "Sedang"}
              </p>
            </div>
          </section>
        )}

        {/* 4. Sticky In-Page Section Navigation Bar */}
        <nav
          aria-label={
            locale === "id" ? "Navigasi bagian halaman provinsi" : "Province page section navigation"
          }
          className="sticky top-16 z-30 flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white/95 dark:bg-[#111622]/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md"
        >
          <BarChart3 className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
          {NAV_PILLS.map((pill) => {
            const isOpen = openSections[pill.key];
            return (
              <button
                key={pill.anchorId}
                type="button"
                onClick={() => handleJumpToSection(pill.key, pill.anchorId)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                  isOpen
                    ? "border-teal-500/50 bg-teal-500/15 text-teal-800 dark:text-teal-300"
                    : "border-transparent bg-slate-100/80 dark:bg-[#182030] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </nav>

        {/* 5. Always-Visible Full-Width Province Leaflet Map Card (`w-full`) */}
        <ProvinceMap
          provinceId={slug}
          provinceName={provinceName}
          kabKotaList={kabKotaList}
          selectedKabKotaId={activeKabKota.id}
          hoveredKabKotaId={hoveredKabKotaId}
          onSelectKabKota={handleSelectKabKota}
          onHoverKabKota={setHoveredKabKotaId}
        />

        {/* ===================================================================== */}
        {/* 6. COLLAPSIBLE ACCORDION SECTIONS (COLLAPSED BY DEFAULT ON LOAD)       */}
        {/* ===================================================================== */}

        {/* SECTION 1: Peringkat Aktual SSGI & Prediksi Risiko */}
        <section
          id="peta-peringkat"
          className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#111622] p-5 text-slate-800 dark:text-slate-100 shadow-sm"
        >
          {/* Permanent Summary Header Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                  {locale === "id"
                    ? "Peringkat Aktual SSGI & Prediksi Risiko"
                    : "SSGI Actual Ranking & Predicted Risk"}
                </h2>
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {proxyCount}/{totalCount} Proxy
                </span>
                <span className="inline-flex items-center rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  {totalCount}{" "}
                  {locale === "id" ? "Kab/Kota Terpetakan" : "Mapped Districts"}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {locale === "id"
                  ? `Menampilkan ${totalCount} dari ${totalCount} wilayah kabupaten/kota di Provinsi ${provinceName}. Top prioritas: ${top3NamesWithActualPct}.`
                  : `Showing ${totalCount} of ${totalCount} districts in ${provinceName} Province. Top priority: ${top3NamesWithActualPct}.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleSection("peringkat")}
              aria-expanded={openSections.peringkat}
              aria-label={`${
                openSections.peringkat ? "Sembunyikan" : "Lihat Detail"
              } Peringkat Aktual SSGI & Prediksi Risiko`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                openSections.peringkat
                  ? "border-teal-500/50 bg-teal-500/15 text-teal-800 dark:text-teal-300"
                  : "border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182030] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>
                {openSections.peringkat
                  ? locale === "id"
                    ? "Sembunyikan"
                    : "Hide Detail"
                  : locale === "id"
                  ? "Lihat Detail"
                  : "More Information"}
              </span>
              {openSections.peringkat ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Expanded Content: 4-Column District Ranking Grid */}
          {openSections.peringkat && (
            <div className="mt-5 border-t border-slate-200 dark:border-[#232b3e] pt-5">
              <KabKotaRankList
                items={kabKotaList}
                selectedKabKotaId={activeKabKota.id}
                hoveredKabKotaId={hoveredKabKotaId}
                onSelectKabKota={handleSelectKabKota}
                onHoverKabKota={setHoveredKabKotaId}
              />
            </div>
          )}
        </section>

        {/* SECTIONS 2–6: SHAP & AI Brief, Rekomendasi, Matriks, Kamus Indikator, Metodologi */}
        <ExplanationPanel
          kabKotaId={activeKabKota.id}
          maeInProvince={summary?.mae_in_province ?? 6.33}
          openSections={openSections}
          onToggleSection={handleToggleSection}
        />
      </main>
    </div>
  );
}
