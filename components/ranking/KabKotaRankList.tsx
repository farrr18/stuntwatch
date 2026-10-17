"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { KabKota, RiskLevel } from "@/lib/types";
import { RankFilters } from "./RankFilters";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBand, setSelectedBand] = useState<RiskLevel | "all">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      const matchesName = !q || item.name.toLowerCase().includes(q);
      const matchesBand =
        selectedBand === "all" || item.riskLevel === selectedBand;
      return matchesName && matchesBand;
    });

    list.sort((a, b) =>
      sortOrder === "desc"
        ? b.riskIndex - a.riskIndex || a.provinceRank - b.provinceRank
        : a.riskIndex - b.riskIndex || b.provinceRank - a.provinceRank
    );
    return list;
  }, [items, searchQuery, selectedBand, sortOrder]);

  return (
    <div className="flex h-full max-h-[590px] flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          {t("rankListTitle")}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {t("showingCount", {
            shown: filteredItems.length,
            total: items.length,
          })}
        </span>
      </div>

      {/* Filter Controls */}
      <RankFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBand={selectedBand}
        onBandChange={setSelectedBand}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
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
          filteredItems.map((item) => (
            <KabKotaRankRow
              key={item.id}
              item={item}
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
