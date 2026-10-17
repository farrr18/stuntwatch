"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  getLegendGradientCSS,
  RISK_BANDS,
  RISK_LEVEL_ORDER,
} from "@/lib/colorScale";

export function MapLegend() {
  const t = useTranslations("legend");
  const gradient = getLegendGradientCSS();
  const orderedLowToHigh = [...RISK_LEVEL_ORDER].reverse();

  return (
    <div
      aria-label={t("title")}
      className="flex flex-col gap-2.5 rounded-xl border border-border bg-background/95 p-3.5 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
        <span>{t("title")}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          0 — 100
        </span>
      </div>

      {/* Continuous Gradient Bar */}
      <div className="relative">
        <div
          className="h-3 w-full rounded-full border border-black/10 dark:border-white/15"
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
              className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px]"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${band.dotClass}`}
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
