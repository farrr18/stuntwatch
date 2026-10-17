"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import type { KabKota, RiskLevel } from "@/lib/types";
import { useAppLocale } from "@/lib/i18n";
import { RankFilters, type ProvinceSortKey } from "./RankFilters";
import { KabKotaRankRow } from "./KabKotaRankRow";

interface KabKotaRankListProps {
  items: KabKota[];
  selectedKabKotaId: string;
  hoveredKabKotaId: string | null;
  onSelectKabKota: (kabKotaId: string) => void;
  onHoverKabKota: (kabKotaId: string | null) => void;
}

export function KabKotaRankList({
  items,
  selectedKabKotaId,
  hoveredKabKotaId,
  onSelectKabKota,
  onHoverKabKota,
}: KabKotaRankListProps) {
  const t = useTranslations("province");
  const { locale } = useAppLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBand, setSelectedBand] = useState<RiskLevel | "all">("all");
  // STRICT UI RULE: Sort by `actual` (SSGI actual stunting rate) descending by default. Never by `predicted`.
  const [sortBy, setSortBy] = useState<ProvinceSortKey>("actual");

  const proxyCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.data_confidence === "proxy" ||
          item.top_feature?.endsWith("_prov_pct")
      ).length,
    [items]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesName =
        !q ||
        item.name.toLowerCase().includes(q) ||
        String(item.domain_id).includes(q);
      const matchesBand =
        selectedBand === "all" || item.riskLevel === selectedBand;
      return matchesName && matchesBand;
    });

    list.sort((a, b) => {
      if (sortBy === "top_feature_shap") {
        return b.top_feature_shap - a.top_feature_shap || b.actual - a.actual;
      }
      return b.actual - a.actual || b.top_feature_shap - a.top_feature_shap;
    });
    return list;
  }, [items, searchQuery, selectedBand, sortBy]);

  return (
    <div className="flex h-full max-h-[640px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header + Data Equity & Proxy Transparency Framing */}
      <div className="mb-2.5 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-foreground sm:text-base">
              {locale === "id"
                ? "Peringkat Aktual SSGI & Prediksi Risiko (Provinsi Proxy)"
                : "SSGI Actual Ranking & Predicted Risk (Province Proxy)"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {t("rankListTitle")}
            </p>
          </div>
          <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
            {t("showingCount", {
              shown: filteredItems.length,
              total: items.length,
            })}
          </span>
        </div>

        {/* Data Equity Sub-Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-950 dark:text-amber-200">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {locale === "id"
                ? "Diurutkan berdasarkan Aktual SSGI (%) tertinggi. Wilayah dengan ⚠️ Proxy Provinsi menggunakan rata-rata indikator provinsi."
                : "Sorted by highest SSGI Actual (%). Districts marked ⚠️ Province Proxy rely on provincial indicator averages."}
            </span>
          </span>
          {proxyCount > 0 && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              {proxyCount}/{items.length} Proxy
            </span>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <RankFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBand={selectedBand}
        onBandChange={setSelectedBand}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* Scrollable List */}
      <div
        role="region"
        aria-label={t("rankListTitle")}
        className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1"
      >
        {filteredItems.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            {t("noResults")}
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <KabKotaRankRow
              key={item.id}
              item={item}
              rankIndex={idx + 1}
              isSelected={selectedKabKotaId === item.id}
              isHovered={hoveredKabKotaId === item.id}
              onSelect={onSelectKabKota}
              onHover={onHoverKabKota}
            />
          ))
        )}
      </div>
    </div>
  );
}
