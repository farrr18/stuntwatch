"use client";

import React from "react";
import type { KabKota } from "@/lib/types";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface KabKotaRankRowProps {
  item: KabKota;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function KabKotaRankRow({
  item,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}: KabKotaRankRowProps) {
  const { locale } = useAppLocale();
  const band = getRiskBandConfig(item.riskLevel);
  const levelLabel = getRiskLabel(item.riskLevel, locale);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(item.id)}
      onBlur={() => onHover(null)}
      aria-pressed={isSelected}
      aria-label={`Rank ${item.provinceRank}, ${item.name}, risk index ${item.riskIndex}, ${levelLabel}`}
      className={`group flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isSelected
          ? `${band.borderClass} bg-accent/70 shadow-sm ring-1 ring-current/20`
          : isHovered
          ? "border-foreground/40 bg-muted/70"
          : "border-border/80 bg-background hover:bg-muted/40"
      }`}
    >
      {/* Top Row: Rank + Name + Type Badge + Score Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`inline-flex h-6 min-w-[28px] shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
              isSelected
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            #{item.provinceRank}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-bold text-foreground">
                {item.name}
              </span>
              <span className="inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                {item.type}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {item.topDriverLabel[locale]}
            </p>
          </div>
        </div>

        {/* Score + Risk Level Badge */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-bold ${band.badgeClass}`}
          >
            <span className="font-mono">{item.riskIndex}</span>
            <span className="text-[10px] font-semibold opacity-90">
              · {levelLabel}
            </span>
          </span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${band.barClass}`}
            style={{ width: `${item.riskIndex}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          Nat #{item.nationalRank}
        </span>
      </div>
    </button>
  );
}
