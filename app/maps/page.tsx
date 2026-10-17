"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  AlertTriangle,
  Table2,
  Keyboard,
  ArrowUpRight,
  Radio,
} from "lucide-react";
import {
  useProvinces,
  useTopRiskyDistricts,
} from "@/lib/hooks/useStuntingData";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { IndonesiaMap } from "@/components/map/IndonesiaMap";

const ISLAND_GROUPS = [
  "ALL",
  "Sumatera",
  "Jawa",
  "Bali & Nusa Tenggara",
  "Kalimantan",
  "Sulawesi",
  "Maluku & Papua",
];

export default function NationalMapsPage() {
  const router = useRouter();
  const t = useTranslations("national");
  const { locale } = useAppLocale();

  // Live Endpoint 1: GET /api/provinces
  const { data: provinces, isLoading: isLoadingProvinces } = useProvinces();
  // Live Endpoint 2: GET /api/top-risky?n=15
  const { data: topRiskyDistricts, isLoading: isLoadingWatchlist } =
    useTopRiskyDistricts(15);

  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIslandGroup, setSelectedIslandGroup] = useState<string>("ALL");

  const filteredProvinces = useMemo(() => {
    if (!provinces) return [];
    const q = searchQuery.trim().toLowerCase();
    return provinces.filter((p) => {
      const matchesIsland =
        selectedIslandGroup === "ALL" || p.islandGroup === selectedIslandGroup;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.highest_risk_kabupaten.toLowerCase().includes(q) ||
        p.islandGroup.toLowerCase().includes(q);
      return matchesIsland && matchesQuery;
    });
  }, [provinces, searchQuery, selectedIslandGroup]);

  if (isLoadingProvinces || !provinces) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-border bg-card">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-[#D9463E]" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading 38-Province Live StuntWatch Dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ROW 1: Context Header, Live Status Badge & Quick Filter / Search Bar (12 Cols) */}
        <section className="lg:col-span-12 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  {t("title")}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#159A7C]/40 bg-[#159A7C]/10 px-2.5 py-0.5 text-xs font-semibold text-[#159A7C] dark:text-[#2DD4BF]">
                  <Radio className="h-3 w-3 animate-pulse" />
                  <span>Live API · 38 Provinsi & 514 Kab/Kota</span>
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Quick Province Search + Island Group Filter Pills */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-border pt-3.5">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredProvinces.length > 0) {
                    router.push(`/provinsi/${filteredProvinces[0].slug}`);
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div
              role="group"
              aria-label="Filter by island group"
              className="flex flex-wrap items-center gap-1.5"
            >
              {ISLAND_GROUPS.map((group) => {
                const isActive = selectedIslandGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedIslandGroup(group)}
                    aria-pressed={isActive}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {group === "ALL" ? t("islandFilterAll") : group}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ROW 2, LEFT SIDEBAR (Col 1-3): 38-Province Table (`GET /api/provinces`) */}
        <aside className="lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm max-h-[600px]">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-[#159A7C] dark:text-[#2DD4BF]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {locale === "id"
                  ? "Tabel 38 Provinsi (Risiko Tertinggi)"
                  : "38 Provinces (Sorted by Risk)"}
              </h2>
            </div>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">
              {filteredProvinces.length}/38
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredProvinces.map((p) => {
              const band = getRiskBandConfig(p.riskLevel);
              const isHovered =
                hoveredProvinceId === p.slug || hoveredProvinceId === p.id;
              return (
                <Link
                  key={p.slug}
                  href={`/provinsi/${p.slug}`}
                  onMouseEnter={() => setHoveredProvinceId(p.slug)}
                  onMouseLeave={() => setHoveredProvinceId(null)}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isHovered
                      ? "border-foreground bg-accent shadow-sm"
                      : "border-border/70 bg-background hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-muted-foreground">
                        #{p.nationalRank}
                      </span>
                      <span className="truncate font-bold text-foreground">
                        {p.name}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      Act: {p.avg_actual}% · Max: {p.highest_risk_kabupaten}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                    >
                      {p.avg_predicted.toFixed(1)}%
                    </span>
                    <span className="mt-0.5 text-[9px] text-muted-foreground">
                      {p.n_kabupaten} Kab/Kota
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* ROW 2, CENTER (Col 4-9): Interactive IndonesiaMap colored by `avg_predicted` */}
        <section className="lg:col-span-6">
          <IndonesiaMap
            provinces={provinces}
            hoveredProvinceId={hoveredProvinceId}
            onHoverProvince={setHoveredProvinceId}
            selectedIslandGroup={selectedIslandGroup}
          />
        </section>

        {/* ROW 2, RIGHT SIDEBAR (Col 10-12): "National Watchlist" (`GET /api/top-risky?n=15`) */}
        <aside className="lg:col-span-3 flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm max-h-[600px]">
          <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#D9463E]" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  National Watchlist
                </h2>
                <p className="text-[10px] text-muted-foreground">
                  {locale === "id"
                    ? "Top 15 Kabupaten/Kota Risiko Tertinggi"
                    : "Top 15 Highest-Risk Districts Nationally"}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#D9463E]">
              n=15
            </span>
          </div>

          {isLoadingWatchlist || !topRiskyDistricts ? (
            <div className="flex flex-1 items-center justify-center p-6 text-xs text-muted-foreground">
              Loading National Watchlist...
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {topRiskyDistricts.map((item) => {
                const band = getRiskBandConfig(item.riskLevel);
                return (
                  <Link
                    key={item.domain_id}
                    href={`/provinsi/${item.provinceSlug}/${item.domain_id}`}
                    className="group flex items-center justify-between gap-2 rounded-xl border border-border/75 bg-background p-2.5 text-xs transition-all hover:border-[#D9463E] hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex h-5 min-w-[22px] items-center justify-center rounded bg-rose-500/15 font-mono text-[10px] font-bold text-[#D9463E]">
                          #{item.rank}
                        </span>
                        <span className="truncate font-bold text-foreground group-hover:text-[#D9463E]">
                          {item.kabupaten_kota}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {item.provinsi} · Act: {item.actual}%
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                      >
                        {item.prediction.toFixed(1)}%
                      </span>
                      <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">
                        {item.risk_tier}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>

        {/* ROW 3: Accessible Keyboard Province Directory Table/Grid (12 Cols) */}
        <section
          aria-label={t("directoryTitle")}
          className="lg:col-span-12 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-[#D9463E]" />
                <h2 className="text-sm font-bold text-foreground sm:text-base">
                  {t("directoryTitle")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("directorySubtitle")}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {filteredProvinces.length} / 38
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProvinces.map((prov) => {
              const band = getRiskBandConfig(prov.riskLevel);
              const levelLabel = getRiskLabel(prov.riskLevel, locale);
              const isHovered =
                hoveredProvinceId === prov.slug || hoveredProvinceId === prov.id;

              return (
                <Link
                  key={prov.slug}
                  href={`/provinsi/${prov.slug}`}
                  aria-label={`${prov.name}, predicted risk ${prov.avg_predicted}%, actual ${prov.avg_actual}%, ${levelLabel}, national rank ${prov.nationalRank} of 38`}
                  onMouseEnter={() => setHoveredProvinceId(prov.slug)}
                  onMouseLeave={() => setHoveredProvinceId(null)}
                  onFocus={() => setHoveredProvinceId(prov.slug)}
                  onBlur={() => setHoveredProvinceId(null)}
                  className={`group flex flex-col justify-between gap-2 rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isHovered
                      ? "border-foreground bg-accent shadow-sm"
                      : "border-border/80 bg-background hover:border-foreground/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          #{prov.nationalRank}
                        </span>
                        <span className="truncate text-sm font-bold text-foreground group-hover:text-[#D9463E]">
                          {prov.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {prov.islandGroup} · {prov.n_kabupaten} Kab/Kota
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${band.badgeClass}`}
                    >
                      <span className="font-mono">
                        Pred {prov.avg_predicted}%
                      </span>
                      <span className="text-[10px]">· {levelLabel}</span>
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      Act {prov.avg_actual}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
