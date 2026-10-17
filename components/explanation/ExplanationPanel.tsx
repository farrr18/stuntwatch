"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useExplanation } from "@/lib/hooks/useStuntingData";
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
  const { data, isLoading } = useExplanation(kabKotaId);

  if (isLoading || !data) {
    return (
      <section
        aria-busy="true"
        className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-rose-600" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading 7-Block District Explanation Panel...
          </p>
        </div>
      </section>
    );
  }

  const band = getRiskBandConfig(data.riskLevel);
  const riskLabel = getRiskLabel(data.riskLevel, locale);

  return (
    <motion.section
      key={data.kabKotaId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-label={`Explanation panel for ${data.name}`}
      className="mt-6 space-y-6 rounded-2xl border border-border bg-card/60 p-4 sm:p-6 shadow-sm"
    >
      {/* BLOCK 1: Header (12 Cols) */}
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            {t("sectionBadge")}
          </span>
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

        {/* Right Metrics: Score + Risk Badge + Prov Rank + Nat Rank */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 ${band.badgeClass}`}
          >
            <span className="font-mono text-2xl font-extrabold">
              {data.riskIndex}
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] font-semibold uppercase opacity-80">
                Index / 100
              </span>
              <span className="text-xs font-bold">{riskLabel}</span>
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

      {/* BLOCK 2: SummaryCard (12 Cols) */}
      <SummaryCard summary={data.summary} riskLevel={data.riskLevel} />

      {/* BLOCK 3 & BLOCK 4: Analytical Split Row (12 Cols split 6 / 6 on lg) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <FactorContributionChart factors={data.factors} />
        </div>
        <div className="lg:col-span-6">
          <ComparisonTable factors={data.factors} />
        </div>
      </div>

      {/* BLOCK 5: FactorCard Grid (3-Col Responsive Expandable Cards) */}
      <div className="space-y-3 pt-1">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {t("factorGridTitle")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t("factorGridSubtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {data.factors.map((factor, idx) => (
            <FactorCard
              key={factor.id}
              factor={factor}
              defaultExpanded={idx < 3}
            />
          ))}
        </div>
      </div>

      {/* BLOCK 6 & BLOCK 7: Action & Governance Row (12 Cols split 8 / 4 on lg) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RecommendationList recommendations={data.recommendations} />
        </div>
        <div className="lg:col-span-4">
          <MethodologyNote methodology={data.methodology} />
        </div>
      </div>
    </motion.section>
  );
}
