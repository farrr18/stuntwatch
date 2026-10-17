"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Search, ArrowDownWideNarrow, ArrowUpNarrowWide, X } from "lucide-react";
import type { RiskLevel } from "@/lib/types";
import {
  RISK_LEVEL_ORDER,
  getRiskBandConfig,
  getRiskLabel,
} from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface RankFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedBand: RiskLevel | "all";
  onBandChange: (band: RiskLevel | "all") => void;
  sortOrder: "desc" | "asc";
  onSortOrderChange: (order: "desc" | "asc") => void;
}

export function RankFilters({
  searchQuery,
  onSearchChange,
  selectedBand,
  onBandChange,
  sortOrder,
  onSortOrderChange,
}: RankFiltersProps) {
  const t = useTranslations("province");
  const { locale } = useAppLocale();

  return (
    <div className="flex flex-col gap-2.5 border-b border-border pb-3">
      {/* Row 1: Search Input + Sort Toggle */}
      <div className="flex items-center gap-2">
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

        <button
          type="button"
          onClick={() =>
            onSortOrderChange(sortOrder === "desc" ? "asc" : "desc")
          }
          aria-label="Toggle sort order"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sortOrder === "desc" ? (
            <>
              <ArrowDownWideNarrow className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">{t("sortHighToLow")}</span>
            </>
          ) : (
            <>
              <ArrowUpNarrowWide className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">{t("sortLowToHigh")}</span>
            </>
          )}
        </button>
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
