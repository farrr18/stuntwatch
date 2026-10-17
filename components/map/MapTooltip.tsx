"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { RiskLevel } from "@/lib/types";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

export interface TooltipInfo {
  x: number;
  y: number;
  name: string;
  subtitle?: string;
  riskIndex: number;
  riskLevel: RiskLevel;
  rankText: string;
  extraLabel?: string;
  extraValue?: string;
}

export function MapTooltip({ info }: { info: TooltipInfo | null }) {
  const { locale } = useAppLocale();
  if (!info) return null;

  const band = getRiskBandConfig(info.riskLevel);
  const levelLabel = getRiskLabel(info.riskLevel, locale);

  return (
    <div
      role="tooltip"
      style={{
        left: Math.min(info.x + 14, 540),
        top: Math.max(info.y - 12, 12),
      }}
      className="pointer-events-none absolute z-30 min-w-[215px] max-w-[270px] -translate-y-full rounded-xl border border-border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md transition-opacity duration-100"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold leading-tight text-foreground">
            {info.name}
          </p>
          {info.subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {info.subtitle}
            </p>
          )}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${band.badgeClass}`}
        >
          {info.riskIndex}%
        </span>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${band.textClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${band.dotClass}`} />
          {levelLabel}
        </span>
        <span className="font-mono text-[11px] font-medium text-muted-foreground">
          {info.rankText}
        </span>
      </div>

      {info.extraLabel && info.extraValue && (
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="shrink-0">{info.extraLabel}:</span>
          <span className="truncate font-medium text-foreground">
            {info.extraValue}
          </span>
        </div>
      )}
    </div>
  );
}
