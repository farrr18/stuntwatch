"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  getLegendGradientCSS,
  RISK_BANDS,
  RISK_LEVEL_ORDER,
} from "@/lib/colorScale";

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
  const gradient = getLegendGradientCSS();
  const orderedLowToHigh = [...RISK_LEVEL_ORDER].reverse();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      aria-label={t("title")}
      className={`flex flex-col rounded-xl border border-border/70 bg-background/85 p-3 shadow-lg backdrop-blur-md transition-all duration-200 dark:bg-slate-900/85 ${
        isCollapsed ? "w-auto max-w-[260px]" : "w-[290px] sm:w-[340px]"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{t("title")}</span>
          {isCollapsed && (
            <span
              className="h-2.5 w-14 shrink-0 rounded-full border border-black/10 dark:border-white/15"
              style={{ background: gradient }}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isCollapsed && (
            <span className="font-mono text-[11px] text-muted-foreground">
              0 — 100
            </span>
          )}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand map legend" : "Collapse map legend"}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isCollapsed ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-2.5 flex flex-col gap-2">
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
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {orderedLowToHigh.map((lvl) => {
              const band = RISK_BANDS[lvl];
              return (
                <div
                  key={lvl}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px]"
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
      )}
    </div>
  );
}
