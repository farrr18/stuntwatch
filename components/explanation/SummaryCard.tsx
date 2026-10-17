"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import type { LocalizedText, RiskLevel } from "@/lib/types";
import { getRiskBandConfig } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface SummaryCardProps {
  summary: LocalizedText;
  riskLevel: RiskLevel;
}

export function SummaryCard({ summary, riskLevel }: SummaryCardProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();
  const band = getRiskBandConfig(riskLevel);

  return (
    <div
      className={`rounded-xl border border-border bg-muted/50 p-4 sm:p-5 border-l-4 ${band.borderClass}`}
    >
      <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>{t("summaryTitle")}</span>
      </div>
      <p className="text-sm sm:text-base leading-relaxed text-foreground">
        {summary[locale]}
      </p>
    </div>
  );
}
