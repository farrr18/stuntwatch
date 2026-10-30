"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Info } from "lucide-react";
import type { RiskFactor } from "@/lib/types";
import {
  getComparisonStatusStyle,
  formatIndicatorValue,
} from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface FactorCardProps {
  factor: RiskFactor;
  defaultExpanded?: boolean;
}

export function FactorCard({
  factor,
  defaultExpanded = false,
}: FactorCardProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const statusStyle = getComparisonStatusStyle(factor.status);
  const sign = factor.contribution > 0 ? "+" : "";

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card transition-all hover:border-foreground/30 shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-start justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold ${statusStyle.badgeClass}`}
            >
              SHAP {sign}
              {factor.contribution.toFixed(2)}
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {formatIndicatorValue(
                factor.value,
                factor.unit,
                "Proxy",
                factor.rawName ?? factor.id
              )}
            </span>
          </div>
          <h4 className="mt-1.5 text-sm font-bold leading-snug text-foreground">
            {factor.label[locale]}
          </h4>
        </div>

        <span
          className={`mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/70 px-4 pb-4 pt-3 text-xs space-y-2.5">
          <p className="leading-relaxed text-muted-foreground">
            {factor.description[locale]}
          </p>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <p className="flex items-center gap-1 font-semibold text-foreground">
              <Info className="h-3.5 w-3.5 text-[#D9463E]" />
              <span>{t("mechanismLabel")}</span>
            </p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              {factor.impactMechanism[locale]}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
