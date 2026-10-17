"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Building2, Loader2 } from "lucide-react";
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

  return (
    <div className="relative flex h-auto w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#D9463E]" />
            <h3 className="text-sm font-bold text-foreground sm:text-base">
              {t("recommendationTitle")}
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("recommendationSubtitle")}
          </p>
        </div>
      </div>

      {isLoadingNarrative ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm font-medium text-muted-foreground"
        >
          <Loader2 className="h-6 w-6 animate-spin text-[#D9463E]" />
          <span>
            Menyusun analisis &amp; rekomendasi kebijakan AI (2–4 detik)...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex h-full flex-col justify-between gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 transition-colors hover:border-foreground/25 hover:bg-muted/50"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center rounded-md bg-[#D9463E] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    {t("priorityBadge", { priority: rec.priority })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0 text-[#159A7C]" />
                    <span className="line-clamp-1">{rec.sector[locale]}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold leading-snug text-foreground">
                  {rec.title[locale]}
                </h4>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {rec.action[locale]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
