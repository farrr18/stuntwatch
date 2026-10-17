"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  useExplanation,
  useDistrictNarrative,
} from "@/lib/hooks/useStuntingData";
import { getRiskBandConfig, getRiskLabel } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";
import { SummaryCard } from "./SummaryCard";
import { FactorContributionChart } from "./FactorContributionChart";
import { ComparisonTable } from "./ComparisonTable";
import { FactorCard } from "./FactorCard";
import { RecommendationList } from "./RecommendationList";
import { MethodologyNote } from "./MethodologyNote";

interface ExplanationPanelProps {
  kabKotaId: string;
}

export function ExplanationPanel({ kabKotaId }: ExplanationPanelProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  // Live Endpoint 5: GET /api/kabupaten/{kabKotaId} (Immediate SHAP & District Features)
  const { data, isLoading } = useExplanation(kabKotaId);

  // Live Endpoint 6: GET /api/kabupaten/{kabKotaId}/narrative (Non-blocking Together AI Policy Brief)
  const { data: narrativeData, isLoading: isLoadingNarrative } =
    useDistrictNarrative(kabKotaId);

  if (isLoading || !data) {
    return (
      <section
        aria-busy="true"
        className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-[#D9463E]" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading District SHAP Features (`/api/kabupaten/{kabKotaId}`)...
          </p>
        </div>
      </section>
    );
  }

  const band = getRiskBandConfig(data.riskLevel);
  const riskLabel = getRiskLabel(data.riskLevel, locale);

  const activeSummary = narrativeData?.summary ?? data.summary;
  const activeRecommendations =
    narrativeData?.recommendations ?? data.recommendations;

  return (
    <motion.section
      key={data.kabKotaId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-label={`Explanation panel for ${data.name}`}
      className="mt-8 flex w-full flex-col gap-8 rounded-2xl border border-border bg-card/60 p-4 sm:p-6 shadow-sm"
    >
      {/* ROW 1: District Header Card (w-full) */}
      <div className="flex w-full flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[#D9463E]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D9463E]">
              {t("sectionBadge")}
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
              domain_id: {data.domain_id} · confidence: {data.data_confidence}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {data.name}
            </h2>
            <span className="inline-flex items-center rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
              {data.type}
            </span>
            <span className="text-sm text-muted-foreground">
              · {data.provinceName}
            </span>
          </div>
        </div>

        {/* Right Metrics: Actual % + Predicted % + Risk Tier + Ranks */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ${band.badgeClass}`}
          >
            <span className="font-mono text-2xl font-extrabold">
              {data.actual}%
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] font-semibold uppercase opacity-80">
                Actual ({data.actual_tier})
              </span>
              <span className="text-xs font-bold">
                Pred: {data.prediction}% ({data.risk_tier || riskLabel})
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background px-3.5 py-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              {t("provRankLabel")}
            </p>
            <p className="font-mono text-sm font-bold text-foreground">
              #{data.provinceRank}{" "}
              <span className="font-normal text-muted-foreground">
                {t("of")} {data.totalInProvince}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background px-3.5 py-2">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground">
              {t("natRankLabel")}
            </p>
            <p className="font-mono text-sm font-bold text-foreground">
              #{data.nationalRank}{" "}
              <span className="font-normal text-muted-foreground">
                {t("of")} {data.totalNational}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ROW 2: 2-Column Split (items-stretch) — Left: SHAP Chart, Right: SummaryCard matched height */}
      <div className="grid w-full grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Left Column (lg:col-span-6) — FactorContributionChart */}
        <div className="flex w-full lg:col-span-6">
          <FactorContributionChart factors={data.factors} />
        </div>

        {/* Right Column (lg:col-span-6) — SummaryCard stretched to match height */}
        <div className="flex w-full lg:col-span-6">
          <SummaryCard
            summary={activeSummary}
            riskLevel={data.riskLevel}
            isLoadingNarrative={isLoadingNarrative}
            factors={data.factors}
            actual={data.actual}
            prediction={data.prediction}
            dataConfidence={data.data_confidence}
          />
        </div>
      </div>

      {/* ROW 3: Full-Width Horizontal Recommendations Grid (4 columns side-by-side) */}
      <div className="w-full">
        <RecommendationList
          recommendations={activeRecommendations}
          isLoadingNarrative={isLoadingNarrative}
        />
      </div>

      {/* ROW 4: Full-Width Comparison Table (w-full) */}
      <div className="relative h-auto w-full">
        <ComparisonTable factors={data.factors} />
      </div>

      {/* ROW 5: Full-Width Factor Dictionary Grid (w-full) */}
      <div className="flex w-full flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {t("factorGridTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("factorGridSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.factors.map((factor, idx) => (
            <FactorCard
              key={factor.id}
              factor={factor}
              defaultExpanded={idx < 3}
            />
          ))}
        </div>
      </div>

      {/* ROW 6: Full-Width Methodology Note (w-full) */}
      <div className="w-full">
        <MethodologyNote methodology={data.methodology} />
      </div>
    </motion.section>
  );
}
