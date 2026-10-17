"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert, Database, Calendar, Cpu } from "lucide-react";
import type { ExplanationData } from "@/lib/types";
import { useAppLocale } from "@/lib/i18n";

interface MethodologyNoteProps {
  methodology: ExplanationData["methodology"];
}

export function MethodologyNote({ methodology }: MethodologyNoteProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  return (
    <div className="relative flex h-auto w-full flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:p-6 shadow-sm">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            {t("methodologyTitle")}
          </h3>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-background/80 p-2.5">
            <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t("dataYearLabel")}</span>
            </dt>
            <dd className="mt-0.5 font-mono font-bold text-foreground">
              {methodology.dataYear}
            </dd>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 p-2.5">
            <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              <span>{t("sourceLabel")}</span>
            </dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {methodology.source}
            </dd>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 p-2.5">
            <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Cpu className="h-3.5 w-3.5" />
              <span>{t("modelLabel")}</span>
            </dt>
            <dd className="mt-0.5 font-mono text-foreground">
              {methodology.modelVersion}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-foreground">
        {methodology.disclaimer[locale]}
      </div>
    </div>
  );
}
