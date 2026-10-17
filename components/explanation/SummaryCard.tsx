"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import type { LocalizedText, RiskLevel, RiskFactor } from "@/lib/types";
import { getRiskBandConfig } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface SummaryCardProps {
  summary: LocalizedText;
  riskLevel: RiskLevel;
  isLoadingNarrative?: boolean;
  factors?: RiskFactor[];
  actual?: number;
  prediction?: number;
  dataConfidence?: string;
}

export function SummaryCard({
  summary,
  riskLevel,
  isLoadingNarrative = false,
  factors = [],
  actual,
  prediction,
  dataConfidence,
}: SummaryCardProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();
  const band = getRiskBandConfig(riskLevel);

  const topRiskDrivers = [...factors]
    .filter((f) => f.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 2);

  const topBuffer = [...factors]
    .filter((f) => f.contribution < 0)
    .sort((a, b) => a.contribution - b.contribution)[0];

  return (
    <div
      className={`relative flex h-full w-full flex-col justify-between gap-5 rounded-xl border border-border bg-card p-4 sm:p-6 border-l-4 ${band.borderClass} shadow-sm`}
    >
      {/* Top Section: Header + AI Narrative Paragraph */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-4 w-4 text-[#D9463E]" />
            <span>{t("summaryTitle")} (Together AI Policy Brief)</span>
          </div>
          {!isLoadingNarrative && (
            <span className="rounded-full bg-[#159A7C]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#159A7C] dark:text-[#2DD4BF]">
              AI Brief Ready
            </span>
          )}
        </div>

        {isLoadingNarrative ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm font-medium text-muted-foreground"
          >
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-[#D9463E]" />
            <span>
              Menyusun analisis &amp; rekomendasi kebijakan AI (2–4 detik)...
            </span>
          </div>
        ) : (
          <div className="rounded-xl bg-muted/40 p-4 border border-border/60">
            <p className="text-sm sm:text-[15px] leading-relaxed text-foreground">
              {summary[locale]}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Section: Executive Key Drivers & Model Diagnostic Strip (fills height cleanly) */}
      {factors.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border/80 pt-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-[#159A7C]" />
              {locale === "id"
                ? "Intisari Diagnostik Faktor Utama"
                : "Key Factor Diagnostic Snapshot"}
            </span>
            {dataConfidence && (
              <span className="font-mono text-[10px] lowercase text-muted-foreground">
                tier: {dataConfidence}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {topRiskDrivers.map((driver, idx) => (
              <div
                key={driver.id}
                className="flex flex-col justify-between rounded-lg border border-rose-500/25 bg-rose-500/5 p-3"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                    <ArrowUpRight className="h-3 w-3" />
                    {locale === "id"
                      ? `Pendorong Risiko #${idx + 1}`
                      : `Risk Driver #${idx + 1}`}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    +{driver.contribution.toFixed(2)} pts
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-foreground">
                  {driver.label[locale]}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {locale === "id" ? "Nilai Daerah:" : "District Value:"}{" "}
                  <strong className="text-foreground">
                    {driver.value !== null && driver.value !== undefined
                      ? `${driver.value}${driver.unit}`
                      : "Proxy"}
                  </strong>{" "}
                  (Nas: {driver.nationalAvg}
                  {driver.unit})
                </p>
              </div>
            ))}

            {topBuffer && (
              <div className="flex flex-col justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 sm:col-span-2">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {locale === "id"
                      ? "Faktor Penahan Risiko (Protektif) Utama"
                      : "Primary Protective Buffer"}
                  </span>
                  <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    {topBuffer.contribution.toFixed(2)} pts
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-bold text-foreground">
                    {topBuffer.label[locale]}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {topBuffer.value !== null && topBuffer.value !== undefined
                      ? `${topBuffer.value}${topBuffer.unit}`
                      : "Proxy"}{" "}
                    vs Nas {topBuffer.nationalAvg}
                    {topBuffer.unit}
                  </p>
                </div>
              </div>
            )}
          </div>

          {actual !== undefined && prediction !== undefined && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {locale === "id"
                  ? "Selisih Prediksi Model vs Aktual SSGI:"
                  : "Model Prediction vs SSGI Actual Gap:"}
              </span>
              <span className="font-mono font-bold text-foreground">
                {prediction.toFixed(1)}% Pred vs {actual.toFixed(1)}% Aktual (
                {prediction - actual >= 0 ? "+" : ""}
                {(prediction - actual).toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
