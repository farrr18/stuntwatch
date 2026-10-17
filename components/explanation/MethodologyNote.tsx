"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Database, Calendar, Cpu, ArrowUp } from "lucide-react";
import type { ExplanationData } from "@/lib/types";
import { useAppLocale } from "@/lib/i18n";

interface MethodologyNoteProps {
  methodology: ExplanationData["methodology"];
}

export function MethodologyNote({ methodology }: MethodologyNoteProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0d121d] p-3.5">
          <dt className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t("dataYearLabel")}</span>
          </dt>
          <dd className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
            {methodology.dataYear}
          </dd>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0d121d] p-3.5">
          <dt className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <Database className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t("sourceLabel")}</span>
          </dt>
          <dd className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {methodology.source}
          </dd>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-[#232b3e] bg-slate-50/70 dark:bg-[#0d121d] p-3.5">
          <dt className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>{t("modelLabel")}</span>
          </dt>
          <dd className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
            {methodology.modelVersion}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
        <span>{methodology.disclaimer[locale]}</span>
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#182030] px-3 py-1.5 font-mono text-[11px] font-bold text-teal-700 dark:text-teal-400 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <span>{locale === "id" ? "Kembali ke Atas" : "Back to Top"}</span>
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
