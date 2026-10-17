"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { RiskFactor } from "@/lib/types";
import { getComparisonStatusStyle } from "@/lib/colorScale";
import { useAppLocale } from "@/lib/i18n";

interface ComparisonTableProps {
  factors: RiskFactor[];
}

export function ComparisonTable({ factors }: ComparisonTableProps) {
  const t = useTranslations("explanation");
  const { locale } = useAppLocale();

  return (
    <div className="relative flex h-auto w-full flex-col gap-4 overflow-x-auto rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-foreground sm:text-base">
          {t("comparisonTitle")}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("comparisonSubtitle")}
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead className="border-b border-border bg-muted/95 text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-semibold">{t("colIndicator")}</th>
              <th className="px-2.5 py-2.5 text-right font-semibold">
                {t("colRegion")}
              </th>
              <th className="px-2.5 py-2.5 text-right font-semibold">
                SHAP Impact
              </th>
              <th className="px-2.5 py-2.5 text-right font-semibold">
                {t("colNatAvg")}
              </th>
              <th className="px-3 py-2.5 text-right font-semibold">
                {t("colStatus")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {factors.map((f) => {
              const statusStyle = getComparisonStatusStyle(f.status);
              const sign = f.contribution > 0 ? "+" : "";
              return (
                <tr key={f.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-3 py-2.5 font-medium text-foreground">
                    <div>{f.label[locale]}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {f.rawName ?? f.id}
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono font-bold text-foreground">
                    {f.value !== null && f.value !== undefined
                      ? `${f.value}${f.unit}`
                      : "Proxy / N/A"}
                  </td>
                  <td
                    className={`px-2.5 py-2.5 text-right font-mono font-bold ${
                      f.contribution > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {sign}
                    {f.contribution.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-muted-foreground">
                    {f.nationalAvg}
                    {f.unit}
                  </td>
                  <td className="px-3 py-2.5 text-right">
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
    </div>
  );
}
