"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Keyboard,
  ArrowUpRight,
} from "lucide-react";
import { useProvinces } from "@/lib/hooks/useStuntingData";
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
  const { data: provinces, isLoading } = useProvinces();

  const [hoveredProvinceId, setHoveredProvinceId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIslandGroup, setSelectedIslandGroup] = useState<string>("ALL");

  const sortedByRiskDesc = useMemo(() => {
    if (!provinces) return [];
    return [...provinces].sort((a, b) => a.nationalRank - b.nationalRank);
  }, [provinces]);

  const top5Highest = useMemo(
    () => sortedByRiskDesc.slice(0, 5),
    [sortedByRiskDesc]
  );

  const bottom5Lowest = useMemo(
    () => [...sortedByRiskDesc].reverse().slice(0, 5),
    [sortedByRiskDesc]
  );

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sortedByRiskDesc.filter((p) => {
      const matchesIsland =
        selectedIslandGroup === "ALL" || p.islandGroup === selectedIslandGroup;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.islandGroup.toLowerCase().includes(q);
      return matchesIsland && matchesQuery;
    });
  }, [sortedByRiskDesc, searchQuery, selectedIslandGroup]);

  if (isLoading || !provinces) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-border bg-card">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-rose-600" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Loading 38-Province National Heatmap...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ROW 1: Context Header, Subtitle & Quick Filter / Search Bar (12 Cols) */}
        <section className="lg:col-span-12 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                  {t("title")}
                </h1>
                <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {t("dataYear")}
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
                  if (e.key === "Enter" && filteredDirectory.length > 0) {
                    router.push(`/provinsi/${filteredDirectory[0].id}`);
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

        {/* ROW 2, COL 1-9: Interactive IndonesiaMap (9 Cols on Desktop / Full Mobile) */}
        <section className="lg:col-span-9">
          <IndonesiaMap
            provinces={provinces}
            hoveredProvinceId={hoveredProvinceId}
            onHoverProvince={setHoveredProvinceId}
            selectedIslandGroup={selectedIslandGroup}
          />
        </section>

        {/* ROW 2, COL 10-12: Top 5 Highest & Bottom 5 Lowest Summary Side Panel (3 Cols Desktop) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {/* Top 5 Highest Risk */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("top5Title")}
              </h2>
            </div>
            <div className="space-y-2">
              {top5Highest.map((p) => {
                const band = getRiskBandConfig(p.riskLevel);
                const isHovered = hoveredProvinceId === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/provinsi/${p.id}`}
                    onMouseEnter={() => setHoveredProvinceId(p.id)}
                    onMouseLeave={() => setHoveredProvinceId(null)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isHovered
                        ? "border-foreground bg-accent"
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
                      <span className="text-[10px] text-muted-foreground">
                        {getRiskLabel(p.riskLevel, locale)} ·{" "}
                        {p.highRiskKabKotaCount}/{p.totalKabKota} Kab/Kota
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                    >
                      {p.riskIndex}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Bottom 5 Lowest Risk */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("bottom5Title")}
              </h2>
            </div>
            <div className="space-y-2">
              {bottom5Lowest.map((p) => {
                const band = getRiskBandConfig(p.riskLevel);
                const isHovered = hoveredProvinceId === p.id;
                return (
                  <Link
                    key={p.id}
                    href={`/provinsi/${p.id}`}
                    onMouseEnter={() => setHoveredProvinceId(p.id)}
                    onMouseLeave={() => setHoveredProvinceId(null)}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isHovered
                        ? "border-foreground bg-accent"
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
                      <span className="text-[10px] text-muted-foreground">
                        {getRiskLabel(p.riskLevel, locale)} · {p.totalKabKota}{" "}
                        Kab/Kota
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
                    >
                      {p.riskIndex}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ROW 3: Accessible Keyboard Province Directory Table/Grid (12 Cols) */}
        <section
          aria-label={t("directoryTitle")}
          className="lg:col-span-12 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm"
        >
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <h2 className="text-sm font-bold text-foreground sm:text-base">
                  {t("directoryTitle")}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("directorySubtitle")}
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {filteredDirectory.length} / 38
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredDirectory.map((prov) => {
              const band = getRiskBandConfig(prov.riskLevel);
              const levelLabel = getRiskLabel(prov.riskLevel, locale);
              const isHovered = hoveredProvinceId === prov.id;

              return (
                <Link
                  key={prov.id}
                  href={`/provinsi/${prov.id}`}
                  aria-label={`${prov.name}, risk index ${prov.riskIndex}, ${levelLabel} risk, national rank ${prov.nationalRank} of 38`}
                  onMouseEnter={() => setHoveredProvinceId(prov.id)}
                  onMouseLeave={() => setHoveredProvinceId(null)}
                  onFocus={() => setHoveredProvinceId(prov.id)}
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
                        <span className="truncate text-sm font-bold text-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          {prov.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {prov.islandGroup} · {prov.totalKabKota} Kab/Kota
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${band.badgeClass}`}
                    >
                      <span className="font-mono">{prov.riskIndex}</span>
                      <span className="text-[10px]">· {levelLabel}</span>
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      SSGI ~{prov.stuntingPrevalenceEst}%
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
