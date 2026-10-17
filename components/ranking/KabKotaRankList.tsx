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
    <div className="flex w-full flex-col gap-4">
      {/* Amber Data Equity & Proxy Cautionary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-950 dark:text-amber-200">
        <span className="inline-flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {locale === "id"
              ? "⚠️ Diurutkan berdasarkan Aktual SSGI (%) tertinggi. Nilai prediksi dengan tanda ⚠️ menggunakan rata-rata Proxy Provinsi."
              : "⚠️ Sorted by highest SSGI Actual (%). Predictions marked ⚠️ rely on Province Proxy averages."}
          </span>
        </span>
        {proxyCount > 0 && (
          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-bold">
            {proxyCount}/{items.length} Proxy
          </span>
        )}
      </div>

      {/* Search Input, Sort Toggle (Aktual % vs Top SHAP), and Tier Filter Pills */}
      <RankFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBand={selectedBand}
        onBandChange={setSelectedBand}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      {/* 4-Column Responsive Grid of District Cards */}
      <div
        role="region"
        aria-label={t("rankListTitle")}
        className="w-full"
      >
        {filteredItems.length === 0 ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-[#232b3e] p-4 text-center text-xs text-slate-500 dark:text-slate-400">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item, idx) => (
              <KabKotaRankRow
                key={item.id}
                item={item}
                rankIndex={idx + 1}
                isSelected={selectedKabKotaId === item.id}
                isHovered={hoveredKabKotaId === item.id}
                onSelect={onSelectKabKota}
                onHover={onHoverKabKota}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
