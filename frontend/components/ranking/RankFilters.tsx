"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Search, ArrowDownWideNarrow, X } from "lucide-react";
import type { RiskLevel } from "@/lib/types";
import {
  RISK_LEVEL_ORDER,
  getRiskBandConfig,
  getRiskLabel,
} from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

export type ProvinceSortKey = "actual" | "top_feature_shap";

interface RankFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedBand: RiskLevel | "all";
  onBandChange: (band: RiskLevel | "all") => void;
  sortBy: ProvinceSortKey;
  onSortByChange: (key: ProvinceSortKey) => void;
}

export function RankFilters({
  searchQuery,
  onSearchChange,
  selectedBand,
  onBandChange,
  sortBy,
  onSortByChange,
}: RankFiltersProps) {
  const t = useTranslations("province");
  const { locale } = useAppLocale();

  return (
    <div className="flex flex-col gap-2.5 border-b border-border pb-3">
      {/* Row 1: Search Input + Sort By (Actual vs Top Feature SHAP — NEVER by predicted) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort selector: Actual (Desc) or Top Feature SHAP (Desc) */}
        <div
          role="group"
          aria-label="Sort districts by Actual or Top Feature SHAP"
          className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border bg-muted/60 p-0.5 text-[11px] font-semibold"
        >
          <span className="px-2 text-muted-foreground inline-flex items-center gap-1">
            <ArrowDownWideNarrow className="h-3.5 w-3.5 text-[#D9463E]" />
            <span className="hidden xl:inline">Sort:</span>
          </span>
          <button
            type="button"
            onClick={() => onSortByChange("actual")}
            aria-pressed={sortBy === "actual"}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              sortBy === "actual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {locale === "id" ? "Aktual (%)" : "Actual (%)"}
          </button>
          <button
            type="button"
            onClick={() => onSortByChange("top_feature_shap")}
            aria-pressed={sortBy === "top_feature_shap"}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              sortBy === "top_feature_shap"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Top SHAP
          </button>
        </div>
      </div>

      {/* Row 2: Discrete RiskLevel Filter Pills */}
      <div
        role="group"
        aria-label="Filter by risk level"
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          onClick={() => onBandChange("all")}
          aria-pressed={selectedBand === "all"}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedBand === "all"
              ? "border-foreground bg-foreground text-background shadow-sm"
              : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("filterAll")}
        </button>

        {RISK_LEVEL_ORDER.map((lvl) => {
          const band = getRiskBandConfig(lvl);
          const isActive = selectedBand === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onBandChange(isActive ? "all" : lvl)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isActive
                  ? `${band.badgeClass} ring-1 ring-current`
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${band.dotClass}`} />
              <span>{getRiskLabel(lvl, locale)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
