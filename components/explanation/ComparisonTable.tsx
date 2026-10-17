"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import type { RiskFactor } from "@/lib/types";
import { getComparisonStatusStyle } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface ComparisonTableProps {
  factors: RiskFactor[];
}

export function ComparisonTable({ factors }: ComparisonTableProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();
  const [showAll, setShowAll] = useState(true);

  const visibleFactors = showAll ? factors : factors.slice(0, 6);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-[#232b3e]">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="border-b border-slate-200 dark:border-[#232b3e] bg-slate-100/90 dark:bg-[#182030] text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-3.5 py-2.5 font-semibold">{t("colIndicator")}</th>
              <th className="px-3 py-2.5 text-right font-semibold">
                {t("colRegion")}
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">
                SHAP Impact
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">
                {t("colNatAvg")}
              </th>
              <th className="px-3.5 py-2.5 text-right font-semibold">
                {t("colStatus")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-[#232b3e] bg-white dark:bg-[#0d121d]">
            {visibleFactors.map((f) => {
              const statusStyle = getComparisonStatusStyle(f.status);
              const sign = f.contribution > 0 ? "+" : "";
              return (
                <tr
                  key={f.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-[#182030]/60"
                >
                  <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-white">
                    <div>{f.label[locale]}</div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {f.rawName ?? f.id}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {f.value !== null && f.value !== undefined
                      ? `${f.value}${f.unit}`
                      : "Proxy / N/A"}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono font-bold ${
                      f.contribution > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {sign}
                    {f.contribution.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-500 dark:text-slate-400">
                    {f.nationalAvg}
                    {f.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-right">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle.badgeClass}`}
                    >
                      {f.status === "worse" ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : f.status === "better" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      <span>{statusStyle.label[locale]}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {factors.length > 6 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#232b3e] bg-slate-50 dark:bg-[#182030] px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>
              {showAll
                ? locale === "id"
                  ? "Ringkas Tabel Indikator"
                  : "Show Fewer Indicators"
                : locale === "id"
                ? "Tampilkan Semua Indikator Lengkap"
                : "Show All Complete Indicators"}
            </span>
            {showAll ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
