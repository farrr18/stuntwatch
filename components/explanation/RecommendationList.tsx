"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Building2, Loader2 } from "lucide-react";
import type { RecommendationItem } from "@/lib/types";
import { useAppLocale } from "@/lib/i18n";

interface RecommendationListProps {
  recommendations: RecommendationItem[];
  isLoadingNarrative?: boolean;
}

export function RecommendationList({
  recommendations,
  isLoadingNarrative = false,
}: RecommendationListProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  if (isLoadingNarrative) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-[#232b3e] bg-slate-50/50 dark:bg-[#0d121d] p-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400"
      >
        <Loader2 className="h-6 w-6 animate-spin text-[#D9463E]" />
        <span>
          Menyusun analisis &amp; rekomendasi kebijakan AI (2–4 detik)...
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="flex h-full flex-col gap-2.5 rounded-xl border border-slate-200 dark:border-[#232b3e] bg-slate-50/60 dark:bg-[#0d121d] p-4 transition-colors hover:border-teal-500/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="inline-flex items-center rounded-md bg-[#D9463E] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {t("priorityBadge", { priority: rec.priority })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-[#232b3e] bg-white dark:bg-[#182030] px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              <Building2 className="h-3 w-3 shrink-0 text-teal-600 dark:text-teal-400" />
              <span className="line-clamp-1">{rec.sector[locale]}</span>
            </span>
          </div>

          <h4 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
            {rec.title[locale]}
          </h4>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {rec.action[locale]}
          </p>
        </div>
      ))}
    </div>
  );
}
