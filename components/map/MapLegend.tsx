"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
  getLegendGradientCSS,
  RISK_BANDS,
  RISK_LEVEL_ORDER,
} from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface MapLegendProps {
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function MapLegend({
  collapsible = false,
  defaultCollapsed = false,
  className = "",
}: MapLegendProps) {
  const t = useTranslations("legend");
  const { locale } = useAppLocale();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const gradient = getLegendGradientCSS();
  const orderedLowToHigh = [...RISK_LEVEL_ORDER].reverse();

  if (collapsible && isCollapsed) {
    return (
      <div
        aria-label={t("title")}
        className={`inline-flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/90 dark:bg-slate-900/90 px-3 py-2 shadow-lg backdrop-blur-md ${className}`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-[#159A7C] dark:text-[#2DD4BF]" />
        <span className="text-xs font-bold text-foreground">{t("title")}</span>
        <div
          className="h-2.5 w-20 rounded-full border border-black/10 dark:border-white/15"
          style={{ background: gradient }}
        />
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-expanded={false}
          aria-label={locale === "id" ? "Buka legenda peta" : "Expand map legend"}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      aria-label={t("title")}
      className={`flex flex-col gap-2 rounded-xl border border-border/70 bg-background/90 dark:bg-slate-900/90 p-3 shadow-lg backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-foreground">
        <span className="truncate font-bold">{t("title")}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            0 — 100
          </span>
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-expanded={true}
              aria-label={
                locale === "id" ? "Sembunyikan legenda peta" : "Collapse map legend"
              }
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-muted/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Continuous Gradient Bar */}
      <div className="relative">
        <div
          className="h-2.5 w-full rounded-full border border-black/10 dark:border-white/15"
          style={{ background: gradient }}
        />
        {/* Tick labels 0, 25, 50, 75, 100 */}
        <div className="mt-1 flex justify-between font-mono text-[10px] font-medium text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Discrete Risk Bands with Text Labels (WCAG non-color-only compliance) */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 pt-0.5">
        {orderedLowToHigh.map((lvl) => {
          const band = RISK_BANDS[lvl];
          return (
            <div
              key={lvl}
              className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px] sm:text-[11px]"
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${band.dotClass}`}
              />
              <span className="truncate font-medium text-foreground">
                {t(lvl)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
