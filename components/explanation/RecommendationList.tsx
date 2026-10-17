"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Building2 } from "lucide-react";
import type { RecommendationItem } from "@/lib/types";
import { useAppLocale } from "@/lib/i18n";

interface RecommendationListProps {
  recommendations: RecommendationItem[];
}

export function RecommendationList({
  recommendations,
}: RecommendationListProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="mb-3.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            {t("recommendationTitle")}
          </h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("recommendationSubtitle")}
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col gap-1.5 rounded-xl border border-border/80 bg-muted/30 p-3.5 transition-colors hover:bg-muted/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white dark:bg-rose-500">
                {t("priorityBadge", { priority: rec.priority })}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {rec.sector[locale]}
              </span>
            </div>

            <h4 className="mt-1 text-sm font-bold text-foreground">
              {rec.title[locale]}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {rec.action[locale]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
